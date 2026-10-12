/**
 * Matching engine: the 3-stage funnel from PLAN.md §4.
 *
 *   1. Hard filters (both directions)           → filters.ts
 *   2. Forward score  A→B with A's gender profile → score.ts + weights.ts
 *   3. Reverse score  B→A with B's gender profile, blended with how well A fits
 *      B's stated preferences; mutual = √(forward × reverse) × quality;
 *      tier; MMR diversity re-rank; limit.
 *
 * Pure and synchronous: no I/O, no randomness, no imports from db or ai. The
 * reference date is injectable (`opts.now`) so results are reproducible.
 * Stage 4 (LLM re-rank, ±10) happens elsewhere, which is why finalScore starts
 * equal to mutualScore.
 */
import type { DimensionScore, ExcludedCandidate, MatchResult, MatchRunResult, Profile } from "../types";
import { mmrRerank, profileSimilarity } from "./diversity";
import { buildConcerns, buildHighlights, tierFor } from "./explain";
import { applyHardFilters } from "./filters";
import { qualityMultiplier } from "./quality";
import { scoreWithProfile } from "./score";
import { scorePreferenceFit } from "./scorers/preferenceFit";
import type { ScoreContext } from "./types";
import { clamp } from "./utils";
import { CALIBRATION, DIVERSITY, RECIPROCITY, WEIGHT_PROFILES } from "./weights";

export interface MatchOptions {
  /** Candidates already introduced / declined. */
  excludeIds?: string[];
  /** Number of matches to return (default 20). */
  limit?: number;
  /** Reference date for ages (default: now). */
  now?: Date;
  /** Max excluded samples to return for "why not X?" (default 25). */
  excludedSampleSize?: number;
}

/** Unrounded internals of one pair evaluation (exported for tests / debugging). */
export interface PairEvaluation {
  forward: number; // 0..1, calibrated
  reverse: number; // 0..1, calibrated
  rawForward: number; // 0..1, before calibration
  rawReverse: number; // 0..1, before calibration
  reverseProfile: number; // 0..1, candidate's gender profile applied to the customer
  preferenceFit: number; // 0..1, customer vs candidate's stated preferences
  quality: number; // multiplier, 0.95..1.05
  mutual: number; // 0..100
  forwardDims: DimensionScore[];
  reverseDims: DimensionScore[];
  theirPrefs: DimensionScore;
}

/** Linear re-anchoring of a raw 0..1 total onto the realistic range (see CALIBRATION). */
export function calibrate(raw: number): number {
  return clamp((raw - CALIBRATION.floor) / (CALIBRATION.ceiling - CALIBRATION.floor));
}

/** Geometric mean: a match is only as good as BOTH sides find it. */
export function geometricMean(a: number, b: number): number {
  return Math.sqrt(Math.max(0, a) * Math.max(0, b));
}

/** Score one (customer, candidate) pair, assuming hard filters already passed. */
export function evaluatePair(customer: Profile, candidate: Profile, ctx: ScoreContext): PairEvaluation {
  const fwd = scoreWithProfile(customer, candidate, WEIGHT_PROFILES[customer.gender], ctx);
  // Reverse: the candidate's view of the customer through the CANDIDATE's own
  // gender profile (a woman judging a male client on career parity, values,
  // relocation...), plus how the customer fits her explicit preferences.
  const rev = scoreWithProfile(candidate, customer, WEIGHT_PROFILES[candidate.gender], ctx);
  const theirPrefsRaw = scorePreferenceFit(candidate, customer, ctx);
  const theirPrefs: DimensionScore = { ...theirPrefsRaw, key: "theirPreferences", label: `Fits ${candidate.firstName}'s preferences`, weight: 0 };

  const rawReverse = RECIPROCITY.profileShare * rev.total + RECIPROCITY.preferenceFitShare * theirPrefs.score;
  const forward = calibrate(fwd.total);
  const reverse = calibrate(rawReverse);
  const quality = qualityMultiplier(candidate);
  const mutual = clamp(100 * geometricMean(forward, reverse) * quality, 0, 100);

  return {
    forward,
    reverse,
    rawForward: fwd.total,
    rawReverse,
    reverseProfile: rev.total,
    preferenceFit: theirPrefs.score,
    quality,
    mutual,
    forwardDims: fwd.dimensions,
    reverseDims: rev.dimensions,
    theirPrefs,
  };
}

function toMatchResult(customer: Profile, candidate: Profile, ev: PairEvaluation): MatchResult {
  const mutualScore = Math.round(ev.mutual);
  const reverseScore = Math.round(100 * ev.reverse);
  return {
    candidate,
    forwardScore: Math.round(100 * ev.forward),
    reverseScore,
    mutualScore,
    finalScore: mutualScore,
    tier: tierFor(mutualScore),
    // Forward dimensions (weights sum to 1), informational ones, then the
    // reverse preference fit (weight 0) so the UI can show "fits her list".
    dimensions: [...ev.forwardDims, ev.theirPrefs].map((d) => ({ ...d, score: Math.round(d.score * 100) / 100 })),
    highlights: buildHighlights(ev.forwardDims, ev.theirPrefs),
    concerns: buildConcerns(customer, candidate, ev.forwardDims, ev.reverseDims, ev.theirPrefs, 100 * ev.reverse),
  };
}

export function runMatching(customer: Profile, pool: Profile[], opts: MatchOptions = {}): MatchRunResult {
  const now = opts.now ?? new Date();
  const ctx: ScoreContext = { now };
  const limit = opts.limit ?? 20;
  const sampleSize = opts.excludedSampleSize ?? 25;

  // ---- Stage 1: hard filters
  const passed: Profile[] = [];
  const excluded: ExcludedCandidate[] = [];
  let considered = 0;
  for (const cand of pool) {
    if (cand.id === customer.id) continue;
    considered++;
    const f = applyHardFilters(customer, cand, { excludeIds: opts.excludeIds, now });
    if (f.passed) passed.push(cand);
    else if (excluded.length < sampleSize && cand.gender !== customer.gender) {
      // Same-gender rows are structural, not informative, so they are not sampled.
      excluded.push({ candidateId: cand.id, name: `${cand.firstName} ${cand.lastName}`, reasons: f.reasons });
    }
  }

  // ---- Stage 2 + 3: score both directions, combine
  const scored = passed
    .map((cand) => ({ cand, ev: evaluatePair(customer, cand, ctx) }))
    .sort((a, b) => b.ev.mutual - a.ev.mutual || a.cand.id.localeCompare(b.cand.id));

  // ---- Diversity re-rank (MMR) over the top slice
  const shortlist = scored.slice(0, limit * DIVERSITY.poolFactor);
  const diversified = mmrRerank(
    shortlist,
    limit,
    (x) => x.ev.mutual / 100,
    (a, b) => profileSimilarity(a.cand, b.cand, ctx),
  );

  return {
    customerId: customer.id,
    generatedAt: now.toISOString(),
    poolSize: considered,
    afterFilters: passed.length,
    matches: diversified.map(({ cand, ev }) => toMatchResult(customer, cand, ev)),
    excluded,
  };
}

/**
 * Rule-based explanations: highlights and concerns for a match card. These
 * are also the grounding facts the AI layer receives, and the deterministic
 * fallback when no LLM is available.
 */
import type { DimensionScore, MatchTier, Profile } from "../types";
import { EXPLAIN, TIERS } from "./weights";

const ASYMMETRIC_KEYS = new Set(["age", "height", "income", "career", "ageHeight"]);

export function tierFor(score: number): MatchTier {
  return TIERS.find((t) => score >= t.min)!.tier;
}

/**
 * Highlights = the reasons behind the biggest weighted contributions
 * (weight × score), so "why this match" reflects what actually drove the score.
 * Informational dimensions (weight 0) only fill remaining slots.
 */
export function buildHighlights(forward: DimensionScore[], theirPrefs: DimensionScore): string[] {
  const strong = forward
    .filter((d) => d.weight > 0 && d.score >= EXPLAIN.highlightMinScore)
    .sort((a, b) => b.weight * b.score - a.weight * a.score || a.key.localeCompare(b.key));
  const fill = [
    ...forward.filter((d) => d.weight === 0 && d.score >= 0.75),
    ...(theirPrefs.score >= 0.85 ? [theirPrefs] : []),
  ];
  const out: string[] = [];
  for (const d of [...strong, ...fill]) {
    if (out.length >= EXPLAIN.maxHighlights) break;
    if (!out.includes(d.reason)) out.push(d.reason);
  }
  return out;
}

/**
 * Concerns = explicit flags from either direction + heavy dimensions that
 * scored poorly + a one-sidedness warning when the reverse score is weak.
 * Heaviest problems first.
 */
export function buildConcerns(
  customer: Profile,
  candidate: Profile,
  forward: DimensionScore[],
  reverse: DimensionScore[],
  theirPrefs: DimensionScore,
  reverseScore: number,
): string[] {
  const out: string[] = [];
  const push = (s?: string) => {
    if (s && !out.includes(s)) out.push(s);
  };
  const byImpact = (a: DimensionScore, b: DimensionScore) => b.weight * (1 - b.score) - a.weight * (1 - a.score);

  for (const d of [...forward].sort(byImpact)) push(d.flag);
  for (const d of [...forward].sort(byImpact)) {
    if (d.weight >= EXPLAIN.concernMinWeight && d.score < EXPLAIN.concernMaxScore && !d.flag) push(d.reason);
  }
  if (reverseScore < EXPLAIN.oneSidedBelow) {
    push(`Possibly one-sided: ${customer.firstName} only partly fits what ${candidate.firstName} is looking for (${theirPrefs.reason})`);
  }
  // Reverse flags last: issues seen from the candidate's side. Only the
  // ASYMMETRIC dimensions (symmetric ones like kids or location would just
  // repeat the forward flag with the names swapped).
  for (const d of [...reverse].sort(byImpact)) if (ASYMMETRIC_KEYS.has(d.key)) push(d.flag);
  return out.slice(0, EXPLAIN.maxConcerns);
}

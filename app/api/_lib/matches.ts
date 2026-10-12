/** Shared match logic for the API routes (private `_lib` folder, not routed). */
import { getProfile, listMatchActions, listNotes, listPool } from "@/lib/db";
import { runMatching } from "@/lib/matching/engine";
import { explainMatches } from "@/lib/ai";
import { HttpError, notFound } from "@/lib/auth/http";
import type { Gender, MatchResult, MatchRunResult, MatchTier, Profile } from "@/lib/types";

export const MATCH_LIMIT = 20;
export const AI_TOP_N = 10;

export function oppositeGender(gender: Gender): Gender {
  return gender === "Male" ? "Female" : "Male";
}

export function clampScore(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n * 10) / 10));
}

/** Same thresholds as the engine: >=80 High Potential, 65-79 Strong, 50-64 Worth Exploring, else Low. */
export function tierFor(score: number): MatchTier {
  if (score >= 80) return "High Potential";
  if (score >= 65) return "Strong";
  if (score >= 50) return "Worth Exploring";
  return "Low";
}

/** Runs the engine for a customer, excluding already-sent matches. Optionally adds AI insights to the top 10. */
export async function computeMatches(customer: Profile, opts: { ai?: boolean } = {}): Promise<MatchRunResult> {
  const [pool, actions] = await Promise.all([
    listPool(oppositeGender(customer.gender)),
    listMatchActions(customer.id),
  ]);
  const excludeIds = actions.map((a) => a.matchId);
  const result = runMatching(customer, pool, { excludeIds, limit: MATCH_LIMIT });
  if (!opts.ai || result.matches.length === 0) return result;

  const notes = await listNotes(customer.id);
  const insights = await explainMatches(customer, result.matches.slice(0, AI_TOP_N), notes);
  const byId = new Map(insights.map((i) => [i.matchId, i]));

  const matches = result.matches
    .map((m, index) => {
      const ai = byId.get(m.candidate.id);
      if (!ai) return { m, index };
      const adjustment = Math.max(-10, Math.min(10, Number(ai.adjustment) || 0));
      const finalScore = clampScore(m.mutualScore + adjustment);
      const updated: MatchResult = { ...m, ai, finalScore, tier: tierFor(finalScore) };
      return { m: updated, index };
    })
    // Stable sort by finalScore desc (ties keep engine order).
    .sort((a, b) => b.m.finalScore - a.m.finalScore || a.index - b.index)
    .map(({ m }) => m);

  return { ...result, matches };
}

/**
 * Scores a single pool candidate for the customer by running the engine with a pool of just that candidate.
 * 404 if the candidate is unknown, a client, or the same gender; 422 if the hard filters exclude them.
 */
export async function scoreCandidate(customer: Profile, matchId: string): Promise<MatchResult> {
  const candidate = await getProfile(matchId);
  if (!candidate || candidate.isClient || candidate.gender === customer.gender) {
    throw notFound("Match not found");
  }
  const result = runMatching(customer, [candidate], { limit: 1 });
  const match = result.matches.find((m) => m.candidate.id === matchId);
  if (!match) {
    const reasons = result.excluded.find((e) => e.candidateId === matchId)?.reasons ?? [];
    throw new HttpError(
      422,
      reasons.length
        ? `This candidate is excluded by the customer's filters: ${reasons.join("; ")}`
        : "This candidate is excluded by the customer's filters"
    );
  }
  return match;
}

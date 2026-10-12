/**
 * Diversity re-rank with Maximal Marginal Relevance (Carbonell & Goldstein, 1998).
 *
 * Pure score ordering tends to return clusters: five software engineers in
 * Bangalore, all 27. A matchmaker gets more value from variety, because the
 * customer's stated preferences are an imperfect guide to who they will
 * actually like. MMR picks greedily:
 *
 *     next = argmax  λ · relevance(c)  −  (1 − λ) · max_{s ∈ selected} sim(c, s)
 *
 * with relevance = mutual score / 100 and sim in 0..1 (same city, same
 * profession, similar age, same company). λ = 0.75 keeps quality dominant: a
 * candidate needs a clearly better score to beat a near-duplicate penalty.
 */
import type { Profile } from "../types";
import type { ScoreContext } from "./types";
import { ageFromDob, gaussian, sameText } from "./utils";
import { DIVERSITY } from "./weights";

export function profileSimilarity(a: Profile, b: Profile, ctx: ScoreContext): number {
  const w = DIVERSITY.similarity;
  const ageA = ageFromDob(a.dob, ctx.now);
  const ageB = ageFromDob(b.dob, ctx.now);
  return (
    (sameText(a.city, b.city) ? w.sameCity : 0) +
    (sameText(a.profession, b.profession) ? w.sameProfession : 0) +
    w.similarAge * gaussian(ageA - ageB, 0, DIVERSITY.ageSigma) +
    (sameText(a.company, b.company) ? w.sameCompany : 0)
  );
}

/**
 * Re-orders `items` (already sorted by relevance, best first) with MMR and
 * returns the first `limit`. Deterministic: ties keep the input order.
 */
export function mmrRerank<T>(
  items: T[],
  limit: number,
  relevance: (t: T) => number,
  similarity: (a: T, b: T) => number,
  lambda: number = DIVERSITY.lambda,
): T[] {
  const remaining = [...items];
  const selected: T[] = [];
  while (selected.length < limit && remaining.length > 0) {
    let bestIdx = 0;
    let bestVal = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i];
      const maxSim = selected.length ? Math.max(...selected.map((s) => similarity(c, s))) : 0;
      const val = lambda * relevance(c) - (1 - lambda) * maxSim;
      if (val > bestVal + 1e-12) {
        bestVal = val;
        bestIdx = i;
      }
    }
    selected.push(remaining.splice(bestIdx, 1)[0]);
  }
  return selected;
}

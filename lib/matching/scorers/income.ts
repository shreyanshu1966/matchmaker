/**
 * Income / financial stability.
 *
 *  - Male seeker (per the brief: "earns less than him"): anyone earning ≤ him
 *    scores 1.0. Above that, a GENTLE gaussian decay on the income ratio
 *    (σ = 0.6): 1.5× his income ≈ 0.71, 2× ≈ 0.25. A high-earning woman is
 *    never excluded, she just ranks a little lower for this one preference.
 *
 *  - Female seeker ("financial stability", deliberately NOT "must out-earn
 *    her"): the reference is her stated minimum income; if she left it at 0
 *    we use 60% of her own income (floor ₹5L) as a proxy for "stable enough
 *    to share a household". Logistic curve on the ratio candidate/reference,
 *    centred at 0.8: meeting the minimum exactly ≈ 0.83, 30% above ≈ 0.98,
 *    half of it ≈ 0.08. No cliff at the minimum.
 */
import type { Profile } from "../../types";
import type { Scorer } from "../types";
import { gaussian, lakhs, round, sigmoid } from "../utils";
import { dimension } from "./shared";

/** Reference income used for the "financial stability" lens. */
export function stabilityReference(seeker: Profile): { ref: number; stated: boolean } {
  const min = seeker.partnerPreferences.minIncomeLpa;
  if (min > 0) return { ref: min, stated: true };
  return { ref: Math.max(5, 0.6 * seeker.incomeLpa), stated: false };
}

export function stabilityScore(candidateIncome: number, ref: number): number {
  return sigmoid(candidateIncome / Math.max(ref, 0.1), 0.8, 8);
}

export const scoreIncome: Scorer = (seeker, candidate) => {
  const c = candidate.firstName;
  const s = seeker.firstName;
  const ci = candidate.incomeLpa;

  if (seeker.gender === "Male") {
    const si = Math.max(seeker.incomeLpa, 0.1);
    const ratio = ci / si;
    const score = ratio <= 1 ? 1 : gaussian(ratio, 1, 0.6);
    const reason =
      ratio <= 1
        ? `${c} earns ${lakhs(ci)} vs ${s}'s ${lakhs(seeker.incomeLpa)}, in line with his preference`
        : `${c} earns ${lakhs(ci)}, ${round(ratio, 1)}× ${s}'s ${lakhs(seeker.incomeLpa)}`;
    return dimension("income", "Income", score, reason);
  }

  const { ref, stated } = stabilityReference(seeker);
  const score = stabilityScore(ci, ref);
  const refText = stated ? `${s}'s stated minimum of ${lakhs(ref)}` : `a stable baseline of ${lakhs(ref)}`;
  const reason =
    ci >= ref ? `${c} earns ${lakhs(ci)}, comfortably meeting ${refText}` : `${c} earns ${lakhs(ci)}, below ${refText}`;
  return dimension(
    "income",
    "Financial stability",
    score,
    reason,
    score < 0.4 ? `${c}'s income (${lakhs(ci)}) is below ${s}'s expectation` : undefined,
  );
};

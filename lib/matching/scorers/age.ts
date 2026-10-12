/**
 * Age compatibility.
 *
 * Two lenses, chosen by the SEEKER's gender (the weight profile decides how
 * much it matters):
 *
 *  - Male seeker (per the brief): he prefers a partner who is younger, with
 *    the sweet spot at 2–5 years younger. Plateau curve: 1.0 inside 2–5,
 *    gaussian decay outside (softer on the "much younger" side than on the
 *    "older than him" side). Same age ≈ 0.73, 8 years younger ≈ 0.61,
 *    2 years older ≈ 0.28. Then gently damped if she is outside his own
 *    stated range (the hard filter already removed anyone > 2 years outside).
 *
 *  - Female seeker: no assumed direction. Her stated range is the plateau,
 *    with ±2-year gaussian shoulders. This is "within her preference range;
 *    soft", as in PLAN.md §4.
 */
import type { Profile } from "../../types";
import type { Scorer, ScoreContext } from "../types";
import { plateau, plural } from "../utils";
import { ageOf, dimension } from "./shared";

export const MALE_IDEAL_GAP = { min: 2, max: 5 } as const;

/** Range-based age fit: 1 inside [min,max], soft shoulders outside. */
export function ageRangeFit(seeker: Profile, candidate: Profile, ctx: ScoreContext) {
  const { ageMin, ageMax } = seeker.partnerPreferences;
  const age = ageOf(candidate, ctx);
  return { age, fit: plateau(age, ageMin, ageMax, 2, 2), ageMin, ageMax };
}

function gapText(seekerAge: number, candAge: number): string {
  const gap = seekerAge - candAge;
  if (gap === 0) return "the same age";
  return gap > 0 ? `${plural(gap, "year")} younger` : `${plural(gap, "year")} older`;
}

export const scoreAge: Scorer = (seeker, candidate, ctx) => {
  const sAge = ageOf(seeker, ctx);
  const { age: cAge, fit: rangeFit, ageMin, ageMax } = ageRangeFit(seeker, candidate, ctx);
  const c = candidate.firstName;
  const s = seeker.firstName;
  const inRange = cAge >= ageMin && cAge <= ageMax;

  if (seeker.gender === "Male") {
    // gap > 0 means she is younger than him.
    const gap = sAge - cAge;
    const gapScore = plateau(gap, MALE_IDEAL_GAP.min, MALE_IDEAL_GAP.max, 2.5, 3);
    // Outside his own range: damp to at most 60–100% (never zero: the filter
    // already handled the extreme cases, this is just a nudge).
    const score = gapScore * (0.6 + 0.4 * rangeFit);
    const ideal = `${MALE_IDEAL_GAP.min}–${MALE_IDEAL_GAP.max} year`;
    let reason: string;
    if (gap >= MALE_IDEAL_GAP.min && gap <= MALE_IDEAL_GAP.max) {
      reason = `${c} is ${gapText(sAge, cAge)}, within the ideal ${ideal} gap`;
    } else if (gap < 0) {
      reason = `${c} is ${gapText(sAge, cAge)} than ${s} (${cAge} vs ${sAge})`;
    } else if (gapScore >= 0.8) {
      // Close to the sweet spot: phrase it positively, it IS a good score.
      reason = `${c} is ${cAge} and ${s} ${sAge}, close to the ideal ${ideal} gap`;
    } else if (gap > MALE_IDEAL_GAP.max) {
      reason = `${c} is ${gapText(sAge, cAge)}, a wider gap than the ideal ${ideal}s`;
    } else {
      reason = `${c} is ${gapText(sAge, cAge)} (${cAge} vs ${s}'s ${sAge}), a narrower gap than ideal`;
    }
    if (!inRange) reason += `; outside his preferred ${ageMin}–${ageMax}`;
    const flag = gap < 0 ? `${c} is ${gapText(sAge, cAge)} than ${s}` : undefined;
    return dimension("age", "Age gap", score, reason, flag);
  }

  // Female seeker (or any seeker without a directional rule): range-based.
  const reason = inRange
    ? `${c} is ${cAge}, inside ${s}'s preferred ${ageMin}–${ageMax} range (${gapText(sAge, cAge)})`
    : `${c} is ${cAge}, just outside ${s}'s preferred ${ageMin}–${ageMax} range`;
  return dimension("age", "Age", rangeFit, reason, rangeFit < 0.5 ? `${c}'s age (${cAge}) is outside the preferred range` : undefined);
};

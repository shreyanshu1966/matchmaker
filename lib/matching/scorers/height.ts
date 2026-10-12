/**
 * Height compatibility.
 *
 *  - Male seeker (per the brief): partner shorter, sweet spot 5–15 cm shorter.
 *    Same height ≈ 0.46, 20 cm shorter ≈ 0.71, taller than him falls fast
 *    (5 cm taller ≈ 0.04). Damped if outside his stated height range.
 *  - Female seeker: her stated height range is the plateau, ±4 cm shoulders.
 */
import type { Scorer } from "../types";
import { plateau } from "../utils";
import { dimension } from "./shared";

export const MALE_IDEAL_HEIGHT_DIFF = { min: 5, max: 15 } as const;

export const scoreHeight: Scorer = (seeker, candidate) => {
  const { heightMinCm, heightMaxCm } = seeker.partnerPreferences;
  const h = candidate.heightCm;
  const c = candidate.firstName;
  const s = seeker.firstName;
  const rangeFit = plateau(h, heightMinCm, heightMaxCm, 4, 4);
  const inRange = h >= heightMinCm && h <= heightMaxCm;

  if (seeker.gender === "Male") {
    const diff = seeker.heightCm - h; // > 0: she is shorter
    const diffScore = plateau(diff, MALE_IDEAL_HEIGHT_DIFF.min, MALE_IDEAL_HEIGHT_DIFF.max, 4, 6);
    const score = diffScore * (0.7 + 0.3 * rangeFit);
    let reason: string;
    if (diff < 0) {
      reason = `${c} (${h} cm) is ${-diff} cm taller than ${s} (${seeker.heightCm} cm)`;
    } else if (diffScore >= 0.8) {
      reason = `${c} (${h} cm) is ${diff} cm shorter than ${s}, ${diff >= 5 && diff <= 15 ? "within" : "close to"} the ideal 5–15 cm`;
    } else if (diff > MALE_IDEAL_HEIGHT_DIFF.max) {
      reason = `${c} (${h} cm) is ${diff} cm shorter than ${s}, a bigger difference than usual`;
    } else {
      reason = `${c} (${h} cm) is only ${diff} cm shorter than ${s} (${seeker.heightCm} cm)`;
    }
    if (!inRange) reason += `; outside his preferred ${heightMinCm}–${heightMaxCm} cm`;
    return dimension("height", "Height", score, reason, diff < 0 ? `${c} is taller than ${s}` : undefined);
  }

  const reason = inRange
    ? `${c} is ${h} cm, inside ${s}'s preferred ${heightMinCm}–${heightMaxCm} cm`
    : `${c} is ${h} cm, outside ${s}'s preferred ${heightMinCm}–${heightMaxCm} cm`;
  return dimension("height", "Height", rangeFit, reason);
};

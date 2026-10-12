/**
 * Values & family. In Indian matchmaking the families marry too, so this
 * captures day-to-day friction after the wedding:
 *   - familyValues (Traditional/Moderate/Liberal), 35%: ordinal distance 0/1/2 → 1/0.55/0.1
 *   - religiosity (1–5), 25%: gaussian on the difference (σ 1.3): 1 apart ≈ 0.74, 2 ≈ 0.31
 *   - living with parents after marriage, 25%: the classic hidden conflict;
 *     Yes vs No = 0.15 and flagged
 *   - family type (joint/nuclear), 15%: different = 0.6 (adjustable, unlike the above)
 */
import type { YesNoMaybe } from "../../types";
import type { Scorer } from "../types";
import { byDistance, gaussian } from "../utils";
import { composeReason, dimension, firstFlag, type Part } from "./shared";

const VALUES_ORDER = { Traditional: 0, Moderate: 1, Liberal: 2 } as const;

function parentsCompat(a: YesNoMaybe, b: YesNoMaybe): number {
  if (a === b) return 1;
  if (a === "Maybe" || b === "Maybe") return 0.65;
  return 0.15;
}

export const scoreValues: Scorer = (seeker, candidate) => {
  const c = candidate.firstName;
  const s = seeker.firstName;

  const vd = Math.abs(VALUES_ORDER[seeker.familyValues] - VALUES_ORDER[candidate.familyValues]);
  const values: Part = {
    weight: 0.35,
    score: byDistance(vd, [1, 0.55, 0.1]),
    text:
      vd === 0
        ? `both from ${seeker.familyValues.toLowerCase()} families`
        : `${s}'s family is ${seeker.familyValues.toLowerCase()}, ${c}'s ${candidate.familyValues.toLowerCase()}`,
    flag: vd === 2 ? `Family values differ sharply (${seeker.familyValues} vs ${candidate.familyValues})` : undefined,
  };

  const rd = Math.abs(seeker.religiosity - candidate.religiosity);
  const religiosity: Part = {
    weight: 0.25,
    score: gaussian(rd, 0, 1.3),
    text:
      rd <= 1
        ? `similar religiosity (${seeker.religiosity}/5 vs ${candidate.religiosity}/5)`
        : `different religiosity (${seeker.religiosity}/5 vs ${candidate.religiosity}/5)`,
  };

  const a = seeker.livingWithParentsAfterMarriage;
  const b = candidate.livingWithParentsAfterMarriage;
  const pc = parentsCompat(a, b);
  const parents: Part = {
    weight: 0.25,
    score: pc,
    text:
      a === b
        ? a === "Yes"
          ? "both expect to live with parents"
          : a === "No"
            ? "both prefer to set up their own home"
            : "both flexible about living with parents"
        : `${s} says "${a}" and ${c} "${b}" to living with parents`,
    flag: pc < 0.2 ? `Living with parents after marriage: ${s} "${a}", ${c} "${b}"` : undefined,
  };

  const sameType = seeker.familyType === candidate.familyType;
  const type: Part = {
    weight: 0.15,
    score: sameType ? 1 : 0.6,
    text: sameType
      ? `both from ${seeker.familyType.toLowerCase()} families`
      : `${seeker.familyType.toLowerCase()} vs ${candidate.familyType.toLowerCase()} family set-up`,
  };

  const parts = [values, religiosity, parents, type];
  const score = parts.reduce((sum, p) => sum + p.score * p.weight, 0);
  return dimension("values", "Values & family", score, composeReason(parts), firstFlag(parts));
};

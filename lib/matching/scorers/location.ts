/**
 * Location & relocation: "who moves?".
 *
 *   same city                                 1.00
 *   candidate's city is on seeker's list      0.90
 *   different city, someone open ("Yes")      0.80 (+0.08 if same state)
 *   someone "Maybe"                           0.50 / 0.35
 *   nobody willing                            0.05 (flagged)
 *
 * Cross-border (NRI) pairs: the India-side person must move abroad or the
 * NRI must move back. A Work/Student visa is a less settled base than
 * Citizen/PR, so we apply a 0.85 factor when the person abroad is on a visa
 * (immigration uncertainty for the partner who would join them).
 */
import type { Profile, YesNoMaybe } from "../../types";
import type { Scorer } from "../types";
import { clamp, norm, sameText } from "../utils";
import { dimension } from "./shared";

const OPENNESS: Record<YesNoMaybe, number> = { Yes: 1, Maybe: 0.5, No: 0 };

function isAbroad(p: Profile): boolean {
  const c = norm(p.country);
  return c !== "" && c !== "india";
}

/** Base score from the two people's willingness to move. */
function moveScore(a: YesNoMaybe, b: YesNoMaybe): number {
  const best = Math.max(OPENNESS[a], OPENNESS[b]);
  if (best === 1) return 0.8;
  if (best === 0.5) return a === b ? 0.5 : 0.35;
  return 0.05;
}

export const scoreLocation: Scorer = (seeker, candidate) => {
  const c = candidate.firstName;
  const s = seeker.firstName;

  if (sameText(seeker.city, candidate.city)) {
    return dimension("location", "Location", 1, `Both live in ${candidate.city}`);
  }

  const crossBorder = isAbroad(seeker) !== isAbroad(candidate) || (isAbroad(seeker) && !sameText(seeker.country, candidate.country));
  if (!crossBorder && seeker.partnerPreferences.cities.some((x) => sameText(x, candidate.city))) {
    return dimension("location", "Location", 0.9, `${c} lives in ${candidate.city}, one of ${s}'s preferred cities`);
  }

  // Who would move? Prefer describing the person who said "Yes".
  const sOpen = seeker.openToRelocate;
  const cOpen = candidate.openToRelocate;
  let score = moveScore(sOpen, cOpen);
  let reason: string;
  if (cOpen === "Yes") reason = `${c} (${candidate.city}) is open to relocating to ${seeker.city}`;
  else if (sOpen === "Yes") reason = `${s} is open to moving from ${seeker.city} to ${candidate.city}`;
  else if (score >= 0.35) reason = `${seeker.city} vs ${candidate.city}; relocation is only a "maybe"`;
  else reason = `${seeker.city} vs ${candidate.city}, and neither is open to relocating`;

  if (crossBorder) {
    const abroad = isAbroad(candidate) ? candidate : seeker;
    if (abroad.residencyStatus === "Work Visa" || abroad.residencyStatus === "Student Visa") {
      score *= 0.85;
      reason += `; ${abroad.firstName} is in ${abroad.country} on a ${abroad.residencyStatus.toLowerCase()}`;
    } else {
      reason += `; ${abroad.firstName} is settled in ${abroad.country} (${abroad.residencyStatus})`;
    }
  } else if (sameText(seeker.state, candidate.state)) {
    score = clamp(score + 0.08);
    reason += ` (same state, ${candidate.state})`;
  }

  const flag = score < 0.2 ? `Location: ${s} in ${seeker.city}, ${c} in ${candidate.city}, and no one wants to move` : undefined;
  return dimension("location", "Location & relocation", score, reason, flag);
};

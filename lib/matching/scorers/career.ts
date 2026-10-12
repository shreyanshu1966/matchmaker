/**
 * Career & education parity.
 *
 *   - education (35%): "similar or higher" — the candidate at or above the
 *     seeker's tier = 1; one tier below = 0.6; two = 0.25. The seeker's stated
 *     minimum education also applies (below it → ×0.6).
 *   - career ambition (25%): mismatched drive is a common source of
 *     resentment; distance 0/1/2 → 1/0.65/0.3.
 *   - profession (25%): same field = 0.9 (shared world, shared vocabulary);
 *     two doctors = 1.0 (they understand night shifts and on-call weeks);
 *     two DIFFERENT long-hours careers (e.g. doctor + lawyer) = 0.55, because
 *     two unpredictable schedules leave little time together; otherwise 0.7.
 *   - work mode (15%): remote/hybrid give flexibility; both onsite is fine
 *     but least flexible.
 */
import type { Profile } from "../../types";
import type { Scorer } from "../types";
import { byDistance, educationLabel, educationLevel, levelIndex, norm } from "../utils";
import { composeReason, dimension, type Part } from "./shared";

/** Fields with long or unpredictable hours (matched case-insensitively by substring). */
const DEMANDING = ["medicine", "doctor", "healthcare", "law", "legal", "consulting", "investment", "banking", "aviation"];
const SHIFT_WORK = ["medicine", "doctor", "healthcare"];

function matches(field: string, list: string[]): boolean {
  const f = norm(field);
  return list.some((x) => f.includes(x));
}

export function professionCompat(a: Profile, b: Profile): { score: number; text: string } {
  const pa = norm(a.profession);
  const pb = norm(b.profession);
  if (pa && pa === pb) {
    if (matches(pa, SHIFT_WORK)) return { score: 1, text: `both doctors, so both understand shift work and on-call life` };
    return { score: 0.9, text: `both work in ${a.profession}` };
  }
  if (matches(pa, DEMANDING) && matches(pb, DEMANDING)) {
    return { score: 0.55, text: `two demanding careers (${a.profession} and ${b.profession})` };
  }
  return { score: 0.7, text: `${a.profession} and ${b.profession}` };
}

export const scoreCareer: Scorer = (seeker, candidate) => {
  const c = candidate.firstName;
  const s = seeker.firstName;
  const se = educationLevel(seeker);
  const ce = educationLevel(candidate);
  const diff = ce - se;
  let edScore = diff >= 0 ? 1 : byDistance(-diff, [1, 0.6, 0.25, 0.1]);
  const belowMin = ce < seeker.partnerPreferences.minEducationLevel;
  if (belowMin) edScore *= 0.6;
  const education: Part = {
    weight: 0.35,
    score: edScore,
    text:
      diff === 0
        ? `both have a ${educationLabel(se)}`
        : diff > 0
          ? `${c} has a ${educationLabel(ce)} (${s}: ${educationLabel(se)})`
          : `${c} has a ${educationLabel(ce)} vs ${s}'s ${educationLabel(se)}`,
  };

  const ad = Math.abs(levelIndex(seeker.careerAmbition) - levelIndex(candidate.careerAmbition));
  const ambition: Part = {
    weight: 0.25,
    score: byDistance(ad, [1, 0.65, 0.3]),
    text:
      ad === 0
        ? `equally ambitious (${seeker.careerAmbition.toLowerCase()})`
        : `different career drive (${s} ${seeker.careerAmbition.toLowerCase()}, ${c} ${candidate.careerAmbition.toLowerCase()})`,
  };

  const pc = professionCompat(seeker, candidate);
  const profession: Part = { weight: 0.25, score: pc.score, text: pc.text, salience: pc.score === 1 ? 0.5 : 0 };

  const modes = [seeker.workMode, candidate.workMode];
  const wmScore = modes.includes("Remote") ? 0.95 : modes.includes("Hybrid") ? 0.85 : 0.75;
  const workMode: Part = {
    weight: 0.15,
    score: wmScore,
    text: seeker.workMode === candidate.workMode ? `both work ${seeker.workMode.toLowerCase()}` : `${seeker.workMode.toLowerCase()} + ${candidate.workMode.toLowerCase()} work`,
  };

  const parts = [education, ambition, profession, workMode];
  const score = parts.reduce((sum, p) => sum + p.score * p.weight, 0);
  const flag = belowMin
    ? `${c}'s education (${educationLabel(ce)}) is below ${s}'s minimum (${educationLabel(seeker.partnerPreferences.minEducationLevel)})`
    : undefined;
  return dimension("career", "Career & education", score, composeReason(parts), flag);
};

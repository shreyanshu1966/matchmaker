/**
 * Background & languages.
 *
 * Community attributes are ONLY scored when the seeker expressed a preference
 * (PLAN.md §10: "caste no bar" is the modern default):
 *   - religion (35%): only if the seeker's accepted-religions list is non-empty
 *   - caste (25%): only if the accepted-castes list is non-empty
 *   - mother tongue (15%): there is no explicit field, so we treat it as
 *     "preferred" when the seeker signals that community matters (a
 *     religion/caste list, or a Traditional family)
 * Always scored:
 *   - shared languages (25%): can they talk comfortably, and with each
 *     other's parents? No shared language at all is flagged.
 * The weights are renormalised over the parts that are active, so a "no bar"
 * seeker is judged purely on languages.
 */
import type { Scorer } from "../types";
import { intersect, jaccard, listText, sameText } from "../utils";
import { composeReason, dimension, firstFlag, type Part } from "./shared";

export const scoreBackground: Scorer = (seeker, candidate) => {
  const c = candidate.firstName;
  const s = seeker.firstName;
  const prefs = seeker.partnerPreferences;
  const parts: Part[] = [];

  if (prefs.religions.length > 0) {
    const ok = prefs.religions.includes(candidate.religion);
    parts.push({
      weight: 0.35,
      score: ok ? 1 : 0.15,
      text: ok ? `${c} is ${candidate.religion}, as ${s} prefers` : `${c} is ${candidate.religion} (${s} prefers ${prefs.religions.join("/")})`,
      flag: ok ? undefined : `Religion outside ${s}'s preference (${candidate.religion})`,
    });
  }
  if (prefs.castes.length > 0) {
    const ok = prefs.castes.some((x) => sameText(x, candidate.caste));
    parts.push({
      weight: 0.25,
      score: ok ? 1 : 0.2,
      text: ok ? `${candidate.caste} community matches ${s}'s preference` : `${c}'s community (${candidate.caste}) isn't on ${s}'s list`,
    });
  }
  const communityMatters = prefs.religions.length > 0 || prefs.castes.length > 0 || seeker.familyValues === "Traditional";
  if (communityMatters) {
    const same = sameText(seeker.motherTongue, candidate.motherTongue);
    parts.push({
      weight: 0.15,
      score: same ? 1 : 0.5,
      text: same ? `both ${seeker.motherTongue}-speaking` : `different mother tongues (${seeker.motherTongue} / ${candidate.motherTongue})`,
    });
  }

  const shared = intersect(seeker.languages, candidate.languages);
  const sharedMT = sameText(seeker.motherTongue, candidate.motherTongue);
  // Any shared language gets 0.6; more overlap (and a shared mother tongue) lifts it to 1.
  const langScore = shared.length === 0 ? 0.1 : Math.min(1, 0.6 + 0.6 * jaccard(seeker.languages, candidate.languages) + (sharedMT ? 0.15 : 0));
  parts.push({
    weight: 0.25,
    score: langScore,
    text: shared.length ? `both speak ${listText(shared.slice(0, 3))}` : "no common language listed",
    flag: shared.length ? undefined : `${s} and ${c} list no common language`,
  });

  const total = parts.reduce((x, p) => x + p.weight, 0);
  const score = parts.reduce((x, p) => x + p.score * p.weight, 0) / total;
  return dimension("background", "Background & languages", score, composeReason(parts), firstFlag(parts));
};

/**
 * Preference fit: how well `candidate` matches `seeker`'s OWN stated
 * partnerPreferences, item by item. Used for the REVERSE direction (the
 * engine calls it as preferenceFit(candidate, customer): "does the customer
 * fit what the candidate asked for?").
 *
 * Every item is soft (plateau curves / partial credit), and items the person
 * left open (empty list, 0 income) are skipped rather than counted as a pass,
 * so the score reflects only what they actually care about.
 */
import type { Profile } from "../../types";
import type { Scorer } from "../types";
import { byDistance, educationLabel, educationLevel, lakhs, plateau, sameText } from "../utils";
import { stabilityScore } from "./income";
import { ageOf, dimension } from "./shared";
import { dietCompatibility } from "./lifestyle";

/** Relative importance of each stated preference (renormalised over active items). */
export const PREFERENCE_ITEM_WEIGHTS = {
  age: 0.2,
  height: 0.12,
  religion: 0.14,
  caste: 0.1,
  maritalStatus: 0.08,
  diet: 0.1,
  city: 0.1,
  education: 0.08,
  income: 0.08,
} as const;

type Item = { key: keyof typeof PREFERENCE_ITEM_WEIGHTS; score: number; miss: string };

function relocationCredit(p: Profile): number {
  return p.openToRelocate === "Yes" ? 0.75 : p.openToRelocate === "Maybe" ? 0.5 : 0.2;
}

export const scorePreferenceFit: Scorer = (seeker, candidate, ctx) => {
  const prefs = seeker.partnerPreferences;
  const c = candidate.firstName;
  const s = seeker.firstName;
  const items: Item[] = [];

  const age = ageOf(candidate, ctx);
  items.push({ key: "age", score: plateau(age, prefs.ageMin, prefs.ageMax, 2), miss: `age ${age} vs ${prefs.ageMin}–${prefs.ageMax}` });
  items.push({
    key: "height",
    score: plateau(candidate.heightCm, prefs.heightMinCm, prefs.heightMaxCm, 4),
    miss: `height ${candidate.heightCm} cm vs ${prefs.heightMinCm}–${prefs.heightMaxCm} cm`,
  });
  if (prefs.religions.length) {
    items.push({ key: "religion", score: prefs.religions.includes(candidate.religion) ? 1 : 0.1, miss: `religion (${candidate.religion})` });
  }
  if (prefs.castes.length) {
    items.push({ key: "caste", score: prefs.castes.some((x) => sameText(x, candidate.caste)) ? 1 : 0.2, miss: `community (${candidate.caste})` });
  }
  if (prefs.maritalStatuses.length) {
    items.push({ key: "maritalStatus", score: prefs.maritalStatuses.includes(candidate.maritalStatus) ? 1 : 0.2, miss: `marital status` });
  }
  if (prefs.diets.length) {
    const ok = prefs.diets.includes(candidate.diet);
    const best = Math.max(...prefs.diets.map((d) => dietCompatibility(d, candidate.diet)));
    items.push({ key: "diet", score: ok ? 1 : Math.min(0.6, best), miss: `diet (${candidate.diet.toLowerCase()})` });
  }
  if (prefs.cities.length) {
    const ok = prefs.cities.some((x) => sameText(x, candidate.city));
    items.push({ key: "city", score: ok ? 1 : relocationCredit(candidate), miss: `location (${candidate.city})` });
  }
  const ce = educationLevel(candidate);
  const short = prefs.minEducationLevel - ce;
  items.push({
    key: "education",
    score: short <= 0 ? 1 : byDistance(short, [1, 0.5, 0.15, 0.05]),
    miss: `education (${educationLabel(ce)})`,
  });
  if (prefs.minIncomeLpa > 0) {
    items.push({ key: "income", score: stabilityScore(candidate.incomeLpa, prefs.minIncomeLpa), miss: `income ${lakhs(candidate.incomeLpa)} vs ${lakhs(prefs.minIncomeLpa)}+` });
  }

  let total = 0;
  let sum = 0;
  for (const it of items) {
    const w = PREFERENCE_ITEM_WEIGHTS[it.key];
    total += w;
    sum += w * it.score;
  }
  const score = total > 0 ? sum / total : 1;
  const met = items.filter((i) => i.score >= 0.8);
  const misses = items.filter((i) => i.score < 0.8).sort((a, b) => a.score - b.score);
  const reason =
    misses.length === 0
      ? `${c} meets all ${items.length} of ${s}'s stated preferences`
      : `${c} meets ${met.length} of ${items.length} of ${s}'s stated preferences (off on ${misses
          .slice(0, 2)
          .map((m) => m.miss)
          .join(", ")})`;
  const flag = score < 0.6 ? `${c} falls outside several of ${s}'s stated preferences` : undefined;
  return dimension("preferenceFit", "Fits stated preferences", score, reason, flag);
};

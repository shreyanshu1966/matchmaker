/**
 * Lifestyle: diet 35%, smoking 20%, drinking 20%, fitness 15%, pets 10%.
 *
 * Diet uses a compatibility MATRIX rather than equality, because in practice
 * a vegetarian–vegan or vegetarian–Jain pair is easy, while Jain–non-veg is a
 * daily friction point in a shared kitchen. If the seeker stated accepted
 * diets, those override the matrix (in list ≥ 0.95, otherwise ≤ 0.4).
 *
 * Smoking and drinking are asymmetric: what matters is the seeker's own
 * habit. A non-smoker paired with a regular smoker scores 0.1; two smokers are
 * fine with each other.
 */
import type { Diet, Habit, YesNoMaybe } from "../../types";
import type { Scorer } from "../types";
import { byDistance, levelIndex } from "../utils";
import { composeReason, dimension, firstFlag, type Part } from "./shared";

const DIET_PAIRS: Record<string, number> = {
  "Vegetarian|Jain": 0.85,
  "Vegetarian|Vegan": 0.85,
  "Vegan|Jain": 0.8,
  "Vegetarian|Eggetarian": 0.7,
  "Eggetarian|Non-Vegetarian": 0.75,
  "Vegan|Eggetarian": 0.55,
  "Jain|Eggetarian": 0.45,
  "Vegetarian|Non-Vegetarian": 0.35,
  "Vegan|Non-Vegetarian": 0.25,
  "Jain|Non-Vegetarian": 0.15,
};

export function dietCompatibility(a: Diet, b: Diet): number {
  if (a === b) return 1;
  return DIET_PAIRS[`${a}|${b}`] ?? DIET_PAIRS[`${b}|${a}`] ?? 0.5;
}

const HABIT_INDEX: Record<Habit, number> = { Never: 0, Occasionally: 1, Regularly: 2 };

/** How acceptable `other`'s habit is to someone with habit `own`. */
function habitFit(own: Habit, other: Habit, ifAbstainer: [number, number, number]): number {
  if (own === "Never") return ifAbstainer[HABIT_INDEX[other]];
  return 1 - 0.3 * Math.abs(HABIT_INDEX[own] - HABIT_INDEX[other]);
}

function petsFit(a: YesNoMaybe, b: YesNoMaybe): number {
  if (a === b) return 1;
  if (a === "Maybe" || b === "Maybe") return 0.75;
  return 0.35;
}

export const scoreLifestyle: Scorer = (seeker, candidate) => {
  const c = candidate.firstName;
  const s = seeker.firstName;
  const prefDiets = seeker.partnerPreferences.diets;

  let dietScore = dietCompatibility(seeker.diet, candidate.diet);
  if (prefDiets.length > 0) {
    dietScore = prefDiets.includes(candidate.diet) ? Math.max(dietScore, 0.95) : Math.min(dietScore, 0.4);
  }
  const diet: Part = {
    weight: 0.35,
    score: dietScore,
    text:
      seeker.diet === candidate.diet
        ? `both ${seeker.diet.toLowerCase()}`
        : `${s} is ${seeker.diet.toLowerCase()}, ${c} ${candidate.diet.toLowerCase()}`,
    flag: dietScore < 0.3 ? `Diet clash: ${s} ${seeker.diet}, ${c} ${candidate.diet}` : undefined,
  };

  const smokeScore = habitFit(seeker.smoking, candidate.smoking, [1, 0.45, 0.1]);
  const smoking: Part = {
    weight: 0.2,
    score: smokeScore,
    text:
      seeker.smoking === "Never" && candidate.smoking === "Never"
        ? "neither smokes"
        : `${c} smokes ${candidate.smoking.toLowerCase()}`,
    flag: smokeScore <= 0.1 ? `${c} smokes regularly; ${s} doesn't smoke` : undefined,
  };

  const drinkScore = habitFit(seeker.drinking, candidate.drinking, [1, 0.65, 0.25]);
  const drinking: Part = {
    weight: 0.2,
    score: drinkScore,
    text:
      seeker.drinking === candidate.drinking
        ? seeker.drinking === "Never"
          ? "neither drinks"
          : `both drink ${seeker.drinking.toLowerCase()}`
        : `${s} drinks ${seeker.drinking.toLowerCase()}, ${c} ${candidate.drinking.toLowerCase()}`,
  };

  const fd = Math.abs(levelIndex(seeker.fitness) - levelIndex(candidate.fitness));
  const fitness: Part = {
    weight: 0.15,
    score: byDistance(fd, [1, 0.75, 0.45]),
    text: fd === 0 ? `similar fitness levels (${seeker.fitness.toLowerCase()})` : `different fitness levels`,
  };

  const pf = petsFit(seeker.openToPets, candidate.openToPets);
  const pets: Part = {
    weight: 0.1,
    score: pf,
    text:
      pf === 1
        ? seeker.openToPets === "Yes"
          ? "both love pets"
          : "aligned on pets"
        : `${s} says "${seeker.openToPets}" to pets, ${c} "${candidate.openToPets}"`,
  };

  const parts = [diet, smoking, drinking, fitness, pets];
  const score = parts.reduce((sum, p) => sum + p.score * p.weight, 0);
  return dimension("lifestyle", "Lifestyle", score, composeReason(parts), firstFlag(parts));
};

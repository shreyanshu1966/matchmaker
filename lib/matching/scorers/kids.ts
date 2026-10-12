/**
 * Children. The single most common long-term deal-killer, so it is close to
 * a dealbreaker even when nobody marked it as one:
 *   exact Yes/Yes or No/No = 1.0, Maybe/Maybe = 0.9 (aligned but undecided),
 *   Maybe vs Yes/No = 0.5, Yes vs No = 0.0 (flagged).
 */
import type { YesNoMaybe } from "../../types";
import type { Scorer } from "../types";
import { dimension } from "./shared";

export function kidsCompatibility(a: YesNoMaybe, b: YesNoMaybe): number {
  if (a === b) return a === "Maybe" ? 0.9 : 1;
  if (a === "Maybe" || b === "Maybe") return 0.5;
  return 0;
}

const TEXT: Record<YesNoMaybe, string> = { Yes: "wants children", No: "doesn't want children", Maybe: "is open on children" };

export const scoreKids: Scorer = (seeker, candidate) => {
  const a = seeker.wantKids;
  const b = candidate.wantKids;
  const score = kidsCompatibility(a, b);
  const c = candidate.firstName;
  const s = seeker.firstName;
  let reason: string;
  if (a === b) reason = a === "Yes" ? "Both want children" : a === "No" ? "Neither wants children" : "Both are open on children";
  else reason = `${s} ${TEXT[a]}, ${c} ${TEXT[b]}`;
  const flag = score === 0 ? `Opposite views on children: ${s} ${TEXT[a]}, ${c} ${TEXT[b]}` : undefined;
  return dimension("kids", "Children", score, reason, flag);
};

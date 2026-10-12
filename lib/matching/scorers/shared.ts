/**
 * Helpers shared by all scorers: building DimensionScore objects and turning
 * several sub-signals into one short, specific reason.
 */
import type { DimensionScore, Profile } from "../../types";
import type { ScoreContext } from "../types";
import { ageFromDob, clamp } from "../utils";

export function dimension(key: string, label: string, score: number, reason: string, flag?: string): DimensionScore {
  const d: DimensionScore = { key, label, score: clamp(score), weight: 0, reason };
  if (flag) d.flag = flag;
  return d;
}

export function ageOf(p: Profile, ctx: ScoreContext): number {
  return ageFromDob(p.dob, ctx.now);
}

/** One sub-signal inside a dimension (e.g. "diet" inside "lifestyle"). */
export interface Part {
  score: number;
  weight: number;
  /** Phrase used when this part is the notable positive or negative. */
  text: string;
  /** Optional flag raised by this part. */
  flag?: string;
  /** Extra ranking boost for unusually specific, memorable facts (e.g. "both doctors"). */
  salience?: number;
}

/**
 * Builds the reason for a multi-part dimension. Rather than dumping every
 * sub-signal, it says the most informative thing:
 *  - all good → the two strongest positives ("both vegetarian; neither smokes")
 *  - mixed    → strongest positive + weakest negative ("both vegetarian, but ...")
 *  - all weak → the two weakest
 */
export function composeReason(parts: Part[]): string {
  const active = parts.filter((p) => p.weight > 0 && p.text);
  if (active.length === 0) return "";
  // Rank by "impact": how far the part sits from neutral, scaled by its weight.
  const impact = (p: Part) => p.score * p.weight + (p.salience ?? 0);
  const byBest = [...active].sort((a, b) => impact(b) - impact(a));
  const byWorst = [...active].sort((a, b) => a.score - b.score || b.weight - a.weight);
  const worst = byWorst[0];
  const best = byBest[0];
  if (worst.score >= 0.7) return capitalise(byBest.slice(0, 2).map((p) => p.text).join("; "));
  if (best.score < 0.5) return capitalise(byWorst.slice(0, 2).map((p) => p.text).join("; "));
  if (best === worst) return capitalise(best.text);
  return capitalise(`${best.text}, but ${worst.text}`);
}

export function firstFlag(parts: Part[]): string | undefined {
  return parts.find((p) => p.flag && p.weight > 0)?.flag;
}

export function capitalise(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

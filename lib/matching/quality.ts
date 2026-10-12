/**
 * Profile-quality multiplier. Verified, serious profiles are more likely to
 * convert into a real meeting, so they get a SMALL boost; unverified or
 * "not for a couple of years" profiles a small penalty. Bounded to ±5% so it
 * can re-order near-ties but never turns a weak match into a strong one.
 */
import type { Profile } from "../types";
import { clamp } from "./utils";
import { QUALITY } from "./weights";

export function qualityMultiplier(p: Profile): number {
  const v = p.verified ?? { id: false, linkedin: false, income: false };
  let adj = 0;
  if (v.id) adj += QUALITY.verifiedId;
  if (v.linkedin) adj += QUALITY.verifiedLinkedin;
  if (v.income) adj += QUALITY.verifiedIncome;
  if (!v.id && !v.linkedin && !v.income) adj += QUALITY.noneVerified;
  adj += QUALITY.timeline[p.timelineToMarry] ?? 0;
  return 1 + clamp(adj, -QUALITY.maxAdjustment, QUALITY.maxAdjustment);
}

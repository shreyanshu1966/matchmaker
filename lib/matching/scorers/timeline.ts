/**
 * Marriage timeline. Someone ready in 0–6 months and someone thinking 1–2
 * years have very different expectations of the first few meetings.
 * Same bucket = 1, one bucket apart = 0.6, two apart = 0.2 (flagged).
 */
import type { MarriageTimeline } from "../../types";
import type { Scorer } from "../types";
import { byDistance } from "../utils";
import { dimension } from "./shared";

const ORDER: Record<MarriageTimeline, number> = { "0-6 months": 0, "6-12 months": 1, "1-2 years": 2 };

export const scoreTimeline: Scorer = (seeker, candidate) => {
  const d = Math.abs(ORDER[seeker.timelineToMarry] - ORDER[candidate.timelineToMarry]);
  const score = byDistance(d, [1, 0.6, 0.2]);
  const c = candidate.firstName;
  const s = seeker.firstName;
  const reason =
    d === 0
      ? `Both hope to marry within ${seeker.timelineToMarry}`
      : `${s} is thinking ${seeker.timelineToMarry}, ${c} ${candidate.timelineToMarry}`;
  return dimension(
    "timeline",
    "Marriage timeline",
    score,
    reason,
    d === 2 ? `Different timelines: ${s} ${seeker.timelineToMarry} vs ${c} ${candidate.timelineToMarry}` : undefined,
  );
};

/**
 * Shared interests: Jaccard overlap of hobbies, lifted so that one or two
 * shared hobbies already counts (typical hobby lists have 3–6 items, so even
 * strong overlaps have a Jaccard of only ~0.3–0.5).
 *   score = min(1, 0.3 + 1.6 · J)    (no overlap = 0.3: neutral, not negative)
 * The named shared hobbies are great conversation starters, so the reason
 * names them.
 */
import type { Scorer } from "../types";
import { intersect, jaccard, listText } from "../utils";
import { dimension } from "./shared";

export const scoreInterests: Scorer = (seeker, candidate) => {
  const shared = intersect(seeker.hobbies, candidate.hobbies);
  const j = jaccard(seeker.hobbies, candidate.hobbies);
  const score = Math.min(1, 0.3 + 1.6 * j);
  const reason = shared.length
    ? `Both enjoy ${listText(shared.slice(0, 3).map((h) => h.toLowerCase()))}`
    : `No overlapping hobbies (${candidate.firstName}: ${listText(candidate.hobbies.slice(0, 2).map((h) => h.toLowerCase()))})`;
  return dimension("interests", "Shared interests", score, reason);
};

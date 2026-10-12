/**
 * Internal types for the matching engine. The public contract (Profile,
 * DimensionScore, MatchResult, ...) lives in `lib/types.ts`; these types only
 * describe how the engine is wired internally.
 */
import type { DimensionScore, Profile } from "../types";

/** Shared, injectable context for every scorer, so scoring stays pure and testable. */
export interface ScoreContext {
  /** Reference date for computing ages. Injected so tests are deterministic. */
  now: Date;
}

/**
 * A scorer measures ONE dimension of fit, always from the `seeker`'s point of
 * view: "how good is `candidate` for `seeker`?". The engine reuses the same
 * scorers for the reverse direction by swapping the arguments.
 *
 * Scorers return `weight: 0`; the engine stamps the weight from the seeker's
 * weight profile (weights are data, scorers are logic).
 */
export type Scorer = (seeker: Profile, candidate: Profile, ctx: ScoreContext) => DimensionScore;

/** Every scorer the engine knows about. Weight profiles refer to scorers by these keys. */
export type ScorerKey =
  | "age"
  | "height"
  | "income"
  | "kids"
  | "values"
  | "lifestyle"
  | "location"
  | "background"
  | "career"
  | "timeline"
  | "interests"
  | "preferenceFit";

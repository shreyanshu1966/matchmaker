/**
 * Stage 2 core: score one person against another with a weight profile.
 *
 * score = Σ (dimension weight × dimension score), with dimension scores in
 * 0..1 and weights summing to 1, so the total is 0..1 (×100 for display).
 */
import type { DimensionScore, Profile } from "../types";
import { SCORERS } from "./scorers";
import { capitalise } from "./scorers/shared";
import type { ScoreContext } from "./types";
import { clamp } from "./utils";
import type { DimensionSpec, WeightProfile } from "./weights";

export interface ProfileScore {
  /** 0..1 weighted total */
  total: number;
  /** Weighted dimensions first (in profile order), then informational ones (weight 0). */
  dimensions: DimensionScore[];
}

/** Lower-case a leading common word ("Both enjoy…" → "both enjoy…") but never a name. */
const COMMON_LEAD = /^(Both|Neither|No|Different|Similar|Same|Equally|Two)\b/;
function lowerFirst(s: string): string {
  return COMMON_LEAD.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
}

/** Evaluate one (possibly composite) dimension. */
export function scoreDimension(spec: DimensionSpec, seeker: Profile, candidate: Profile, ctx: ScoreContext): DimensionScore {
  const parts = spec.components.map((c) => ({ comp: c, dim: SCORERS[c.scorer](seeker, candidate, ctx) }));

  if (parts.length === 1) {
    return { ...parts[0].dim, key: spec.key, label: spec.label, weight: spec.weight };
  }

  const wSum = parts.reduce((s, p) => s + p.comp.weight, 0);
  let score = parts.reduce((s, p) => s + p.comp.weight * p.dim.score, 0) / wSum;
  for (const p of parts) if (p.comp.cap) score = Math.min(score, p.dim.score + 0.1);

  // Reason: the main component speaks; secondary components chime in only when
  // they have something notable to say (clearly good, clearly bad, or flagged).
  const [main, ...rest] = [...parts].sort((a, b) => b.comp.weight - a.comp.weight);
  const extras = rest.filter((p) => p.dim.score >= 0.7 || p.dim.score < 0.3 || p.dim.flag).map((p) => lowerFirst(p.dim.reason));
  const reason = capitalise([main.dim.reason, ...extras].join("; "));
  const flag = parts.find((p) => p.dim.flag)?.dim.flag;

  const d: DimensionScore = { key: spec.key, label: spec.label, score: clamp(score), weight: spec.weight, reason };
  if (flag) d.flag = flag;
  return d;
}

/** Score `candidate` from `seeker`'s point of view using `profile`. */
export function scoreWithProfile(seeker: Profile, candidate: Profile, profile: WeightProfile, ctx: ScoreContext): ProfileScore {
  const weighted = profile.dimensions.map((spec) => scoreDimension(spec, seeker, candidate, ctx));
  const total = weighted.reduce((s, d) => s + d.weight * d.score, 0);
  const info = profile.informational.map((key) => ({ ...SCORERS[key](seeker, candidate, ctx), weight: 0 }));
  return { total: clamp(total), dimensions: [...weighted, ...info] };
}

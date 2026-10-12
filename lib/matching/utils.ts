/**
 * Small, pure numeric and text helpers shared by filters and scorers.
 *
 * Design note: every scorer maps a raw difference (years, cm, lakhs, ordinal
 * steps) to 0..1 with a SMOOTH curve instead of an on/off cutoff. A 1-year miss
 * should cost a little and a 10-year miss a lot; step functions would treat
 * them the same and make rankings jumpy.
 */
import type { EducationLevel, Level, Profile } from "../types";

// ---------------------------------------------------------------- numbers

export function clamp(x: number, lo = 0, hi = 1): number {
  return Math.min(hi, Math.max(lo, x));
}

/** Bell curve with peak 1 at `mu`. `sigma` controls how fast it falls off. */
export function gaussian(x: number, mu: number, sigma: number): number {
  const d = x - mu;
  return Math.exp(-(d * d) / (2 * sigma * sigma));
}

/** Logistic curve: 0.5 at `mid`, rising with steepness `k`. */
export function sigmoid(x: number, mid: number, k: number): number {
  return 1 / (1 + Math.exp(-k * (x - mid)));
}

/** 1 up to `start`, linearly down to 0 at `end` (start < end). */
export function linearDecay(x: number, start: number, end: number): number {
  if (x <= start) return 1;
  if (x >= end) return 0;
  return 1 - (x - start) / (end - start);
}

/**
 * "Plateau" curve: exactly 1 anywhere inside [lo, hi], gaussian decay outside,
 * with independent softness on each side. This is the work-horse for
 * preference ranges ("28–34 years", "160–175 cm"): inside the range everything
 * is equally fine, and just outside it is only mildly worse.
 */
export function plateau(x: number, lo: number, hi: number, sigmaBelow: number, sigmaAbove = sigmaBelow): number {
  if (x < lo) return gaussian(x, lo, sigmaBelow);
  if (x > hi) return gaussian(x, hi, sigmaAbove);
  return 1;
}

/** Look up a score by ordinal distance, e.g. [1, 0.6, 0.1] for 0/1/2 steps apart. */
export function byDistance(distance: number, table: number[]): number {
  const d = Math.min(Math.abs(Math.round(distance)), table.length - 1);
  return table[d];
}

/** Weighted mean of parts that are present. Missing / zero-weight parts are ignored. */
export function weightedMean(parts: { score: number; weight: number }[]): number {
  const total = parts.reduce((s, p) => s + p.weight, 0);
  if (total <= 0) return 0;
  return parts.reduce((s, p) => s + p.score * p.weight, 0) / total;
}

export function round(x: number, digits = 0): number {
  const f = 10 ** digits;
  return Math.round(x * f) / f;
}

// ---------------------------------------------------------------- dates

/** Whole years of age on `now` (how people state their age). */
export function ageFromDob(dob: string, now: Date = new Date()): number {
  const [y, m, d] = dob.slice(0, 10).split("-").map(Number);
  let age = now.getUTCFullYear() - y;
  const beforeBirthday = now.getUTCMonth() + 1 < m || (now.getUTCMonth() + 1 === m && now.getUTCDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

// ---------------------------------------------------------------- ordinals

const LEVEL_ORDER: Record<Level, number> = { Low: 0, Medium: 1, High: 2 };
export function levelIndex(l: Level): number {
  return LEVEL_ORDER[l];
}

const EDUCATION_LABELS: Record<EducationLevel, string> = {
  1: "Diploma",
  2: "Bachelor's",
  3: "Master's/MBA",
  4: "Doctorate/MD",
};
export function educationLabel(level: EducationLevel): string {
  return EDUCATION_LABELS[level] ?? `Level ${level}`;
}

/** Education tier of a profile (falls back to Bachelor's if missing in old data). */
export function educationLevel(p: Profile): EducationLevel {
  return (p.educationLevel ?? 2) as EducationLevel;
}

// ---------------------------------------------------------------- sets & text

export function norm(s: string | undefined | null): string {
  return (s ?? "").trim().toLowerCase();
}

export function sameText(a: string | undefined, b: string | undefined): boolean {
  return norm(a) !== "" && norm(a) === norm(b);
}

/** Case-insensitive intersection, keeping the casing of `a`. */
export function intersect(a: string[], b: string[]): string[] {
  const set = new Set(b.map(norm));
  const seen = new Set<string>();
  return a.filter((x) => {
    const k = norm(x);
    if (!set.has(k) || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Jaccard similarity |A∩B| / |A∪B|, case-insensitive. Empty sets → 0. */
export function jaccard(a: string[], b: string[]): number {
  const A = new Set(a.map(norm));
  const B = new Set(b.map(norm));
  if (A.size === 0 && B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

/** "a", "a and b", "a, b and c" */
export function listText(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function plural(n: number, word: string): string {
  const abs = Math.abs(n);
  return `${abs} ${word}${abs === 1 ? "" : "s"}`;
}

export function lakhs(x: number): string {
  return `₹${round(x, 1)}L`;
}

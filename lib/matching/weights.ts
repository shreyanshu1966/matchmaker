/**
 * Weight profiles and every other tunable of the engine, AS DATA.
 *
 * The engine code never hard-codes a weight: matchmakers / product can tune
 * this file (or, later, per-customer overrides and a feedback loop can) without
 * touching scoring logic. Each top-level dimension weight below is exactly the
 * one in PLAN.md §4, and each profile sums to 1.
 *
 * A dimension can be COMPOSITE: it blends several scorers with sub-weights
 * (e.g. "Kids & timeline" = 70% kids + 30% timeline). A component marked
 * `cap: true` acts as a ceiling for the whole dimension (score ≤ cap + 0.1),
 * so a secondary signal can never paper over a fundamental conflict
 * (aligned timelines don't rescue "wants kids" vs "doesn't").
 *
 * `informational` scorers are computed, shown to the matchmaker and can raise
 * flags, but carry weight 0 for that seeker (e.g. a male seeker's brief does
 * not ask for career parity, but a matchmaker still wants to see it).
 */
import type { Gender, MarriageTimeline, MatchTier } from "../types";
import type { ScorerKey } from "./types";

export interface DimensionComponent {
  scorer: ScorerKey;
  /** Share inside the dimension; components of one dimension sum to 1. */
  weight: number;
  /** If true, the dimension can never score more than this component + 0.1. */
  cap?: boolean;
}

export interface DimensionSpec {
  key: string;
  label: string;
  /** Share of the 0–100 score. All dimensions of a profile sum to 1. */
  weight: number;
  components: DimensionComponent[];
  /** Why this weight: kept next to the number so reviewers can challenge it. */
  rationale: string;
}

export interface WeightProfile {
  id: string;
  /** Which seeker this profile describes ("what does a <gender> client look for?"). */
  seekerGender: Gender;
  dimensions: DimensionSpec[];
  /** Scored and shown with weight 0 (context and flags only). */
  informational: ScorerKey[];
}

const single = (scorer: ScorerKey): DimensionComponent[] => [{ scorer, weight: 1 }];

/**
 * Male client looking at women. The brief's four asks (younger, shorter,
 * earns less, same view on kids) are implemented as WEIGHTED SOFT preferences
 * (PLAN.md §10), never as cutoffs.
 */
export const MALE_SEEKER_PROFILE: WeightProfile = {
  id: "male-seeker-v1",
  seekerGender: "Male",
  dimensions: [
    {
      key: "age",
      label: "Age gap",
      weight: 0.18,
      components: single("age"),
      rationale:
        "Largest single weight: the brief's first ask, and age gap is the filter male clients and their families apply first in practice. Peaks at 2–5 years younger with smooth decay.",
    },
    {
      key: "height",
      label: "Height",
      weight: 0.12,
      components: single("height"),
      rationale: "Explicit in the brief; peaks at 5–15 cm shorter. Lower than age because it is a weaker predictor of a successful introduction.",
    },
    {
      key: "income",
      label: "Income",
      weight: 0.1,
      components: single("income"),
      rationale: "Brief asks for a partner earning ≤ him. Kept at 10% with a gentle decay so high-earning women are down-weighted, not hidden.",
    },
    {
      key: "kids",
      label: "Children",
      weight: 0.15,
      components: single("kids"),
      rationale: "Yes-vs-No on kids is a near-dealbreaker that ends relationships later; 15% plus a 0 score makes such a pair effectively unrankable as High Potential.",
    },
    {
      key: "values",
      label: "Values & family",
      weight: 0.15,
      components: single("values"),
      rationale: "Family values, religiosity and the living-with-parents question drive post-wedding friction in Indian joint/nuclear set-ups.",
    },
    {
      key: "lifestyle",
      label: "Lifestyle & interests",
      weight: 0.1,
      components: [
        { scorer: "lifestyle", weight: 0.75 },
        { scorer: "interests", weight: 0.25 },
      ],
      rationale: "Diet, smoking and drinking are daily realities in a shared home; shared hobbies add a smaller 'will they enjoy weekends together' signal.",
    },
    {
      key: "location",
      label: "Location & relocation",
      weight: 0.1,
      components: single("location"),
      rationale: "Same city, or someone willing to move. Logistics kill many otherwise-good matches.",
    },
    {
      key: "background",
      label: "Background & languages",
      weight: 0.1,
      components: single("background"),
      rationale: "Religion/caste/mother tongue count ONLY when he stated them; otherwise this is purely about shared languages.",
    },
  ],
  informational: ["career", "timeline"],
};

/**
 * Female client looking at men: the research-led "thoughtful" profile. More
 * weight on partnership-shaping factors (career parity, values, who relocates,
 * kids & timeline) and deliberately NO "must earn more" hard rule.
 */
export const FEMALE_SEEKER_PROFILE: WeightProfile = {
  id: "female-seeker-v1",
  seekerGender: "Female",
  dimensions: [
    {
      key: "career",
      label: "Career & education parity",
      weight: 0.18,
      components: single("career"),
      rationale:
        "Women on Indian platforms increasingly rank partner education and ambition parity at the top; mismatched career drive is a frequent source of later conflict.",
    },
    {
      key: "values",
      label: "Values & family",
      weight: 0.18,
      components: single("values"),
      rationale: "The bride traditionally moves into the groom's family set-up, so joint vs nuclear and living-with-parents expectations matter most to her.",
    },
    {
      key: "location",
      label: "Relocation fit",
      weight: 0.14,
      components: single("location"),
      rationale: "Women are disproportionately expected to relocate. If she isn't open to moving, he must be or must live in her city; NRI visa status matters too.",
    },
    {
      key: "kidsTimeline",
      label: "Kids & timeline",
      weight: 0.14,
      components: [
        { scorer: "kids", weight: 0.7, cap: true },
        { scorer: "timeline", weight: 0.3 },
      ],
      rationale: "Children and when to marry together set the family plan; the kids component caps the dimension so timing can't rescue a kids conflict.",
    },
    {
      key: "income",
      label: "Financial stability",
      weight: 0.1,
      components: single("income"),
      rationale: "Smooth curve against HER stated minimum (stability), not 'he must out-earn her'.",
    },
    {
      key: "lifestyle",
      label: "Lifestyle & interests",
      weight: 0.1,
      components: [
        { scorer: "lifestyle", weight: 0.75 },
        { scorer: "interests", weight: 0.25 },
      ],
      rationale: "Same as for men: diet, habits, pets, plus shared hobbies.",
    },
    {
      key: "ageHeight",
      label: "Age & height",
      weight: 0.08,
      components: [
        { scorer: "age", weight: 0.6 },
        { scorer: "height", weight: 0.4 },
      ],
      rationale: "Soft fit against her own stated ranges; lower weight because the hard filter already enforces her age range ±2 years.",
    },
    {
      key: "background",
      label: "Background & languages",
      weight: 0.08,
      components: single("background"),
      rationale: "Community only when preferred; shared languages always.",
    },
  ],
  informational: [],
};

export const WEIGHT_PROFILES: Record<Gender, WeightProfile> = {
  Male: MALE_SEEKER_PROFILE,
  Female: FEMALE_SEEKER_PROFILE,
};

/**
 * Reverse direction (candidate → customer). We look at the customer through
 * the CANDIDATE's own gender profile (so a female candidate judges a male
 * customer on career parity, values, relocation...) and blend it with how well
 * the customer fits the candidate's explicit stated preferences.
 * The blend matters: the profile captures what people like her typically
 * value, the preference fit captures what THIS person wrote down.
 */
export const RECIPROCITY = {
  profileShare: 0.6,
  preferenceFitShare: 0.4,
} as const;

/**
 * Score calibration (applied to the forward and reverse totals separately,
 * before the geometric mean).
 *
 * Why: a weighted mean of ~10 smooth sub-scores is compressed. "Neutral"
 * sub-scores sit around 0.5–0.7 and nothing is ever 0 across the board, so
 * raw totals for real pairs live in roughly [0.40, 0.95]. Shown as-is, almost
 * everyone would land at 70–85 and the tiers would mean nothing. We linearly
 * re-anchor that observed range onto 0..1:
 *     calibrated = clamp((raw − floor) / (ceiling − floor))
 * It is monotonic, so it never changes the order within one direction, but it
 * spreads the scores (good ≈ 75–90, typical ≈ 50–70) and makes the geometric
 * mean punish one-sided pairs more clearly. The numbers were tuned against the
 * seed data (see lib/matching/README.md, "Calibration").
 */
export const CALIBRATION = {
  floor: 0.45,
  ceiling: 0.95,
} as const;

/** Small profile-quality multiplier on the mutual score, bounded to ±5%. */
export const QUALITY = {
  verifiedId: 0.015,
  verifiedLinkedin: 0.015,
  verifiedIncome: 0.01,
  /** No verification at all: we know less, so slightly less confidence. */
  noneVerified: -0.02,
  timeline: { "0-6 months": 0.01, "6-12 months": 0.005, "1-2 years": -0.01 } as Record<MarriageTimeline, number>,
  maxAdjustment: 0.05,
} as const;

/** Tier thresholds on the 0–100 mutual score (PLAN.md §4). */
export const TIERS: { min: number; tier: MatchTier }[] = [
  { min: 80, tier: "High Potential" },
  { min: 65, tier: "Strong" },
  { min: 50, tier: "Worth Exploring" },
  { min: -Infinity, tier: "Low" },
];

/** Maximal Marginal Relevance diversity re-rank. */
export const DIVERSITY = {
  /** 1 = pure relevance, 0 = pure diversity. 0.75 keeps quality first. */
  lambda: 0.75,
  /** Only the top (limit × poolFactor) by score are eligible for re-ranking. */
  poolFactor: 3,
  /** What makes two suggestions "near-identical" for the matchmaker. Sums to 1. */
  similarity: { sameCity: 0.3, sameProfession: 0.3, similarAge: 0.2, sameCompany: 0.2 },
  /** σ (years) for the age-similarity gaussian. */
  ageSigma: 1.5,
} as const;

/** Explanation tuning. */
export const EXPLAIN = {
  maxHighlights: 3,
  maxConcerns: 4,
  /** A dimension can be a highlight only if it scores at least this. */
  highlightMinScore: 0.65,
  /** A dimension this heavy that scores below `concernMaxScore` becomes a concern. */
  concernMinWeight: 0.1,
  concernMaxScore: 0.45,
  /** Reverse score below this → "one-sided" concern. */
  oneSidedBelow: 55,
} as const;

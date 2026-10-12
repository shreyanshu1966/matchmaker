# Matching engine

`runMatching(customer, pool, { excludeIds?, limit = 20, now? }) → MatchRunResult`

The engine is pure, synchronous and deterministic. It does no I/O and has no randomness, and the reference date is injectable. It is a three-stage funnel, and every number it produces can be explained.

```
pool ──► 1. hard filters (both directions) ──► 2. forward score A→B ──► 3. reverse score B→A
                                                                           │
             mutual = √(fwd·rev) × quality  ◄──────────────────────────────┘
                     │
                     ├─► tier ─► MMR diversity re-rank ─► top N (+ highlights / concerns)
```

## 1. Hard filters (`filters.ts`)
Only real non-negotiables are filtered out. Everything else is a soft score, so a 1 cm or 1-year miss never hides anyone. The filters are:
- opposite gender, plus anyone already introduced (`excludeIds`)
- each side's **dealbreakers**: smoking, drinking, non-veg, different religion/caste (the accepted set is their stated list, or their own religion or caste if the list is empty), divorced, manglik mismatch (**only** when `horoscopeMatchRequired`), no-relocation (different city and the other person won't move), and kids conflicts
- marital status, when a preference list is given
- age outside the stated range by **more than 2 years**

The filters are applied **in both directions**: someone who would reject the customer outright is never suggested. Every exclusion keeps a readable reason, so "why not X?" can be answered. The engine returns up to 25 sampled exclusions.

## 2. Weighted, explainable score (`scorers/*`, `weights.ts`, `score.ts`)
Each scorer maps one dimension to 0..1 with a **smooth curve** (a gaussian, a sigmoid, or a "plateau" that is flat inside a preferred range and decays outside it). Each returns a specific reason that uses real names and numbers, such as *"Ananya is 3 years younger, within the ideal 2–5 year gap"*.

The weights are **data** (`weights.ts`), one profile per seeker gender, exactly as in PLAN.md §4, and each profile sums to 1. Each weight carries a written rationale.

| Male seeker | w | Female seeker | w |
|---|---|---|---|
| Age (peak 2–5 yrs younger) | .18 | Career & education parity | .18 |
| Height (peak 5–15 cm shorter) | .12 | Values & family | .18 |
| Income (≤ him, gentle decay above) | .10 | Relocation fit (who moves, NRI visa) | .14 |
| Kids (Yes↔No = 0) | .15 | Kids & timeline (kids caps the dimension) | .14 |
| Values & family | .15 | Financial stability (vs *her* minimum, smooth) | .10 |
| Lifestyle & interests | .10 | Lifestyle & interests | .10 |
| Location & relocation | .10 | Age & height (her ranges) | .08 |
| Background & languages | .10 | Background & languages | .08 |

Design choices worth discussing:
- **The brief's male rules are soft preferences**, not cutoffs. A woman who earns 2× his income scores about 0.25 on that one dimension. She is not excluded.
- **No "must earn more" rule for women.** Income is measured against her stated minimum, or 60% of her own income if she gave none, through a logistic curve with no cliff.
- **Composite dimensions with a cap.** *Kids & timeline* blends 70% kids and 30% timeline, but it can never score higher than kids + 0.1, so aligned timelines can't rescue a "wants kids" vs "doesn't" pair.
- **Community only when preferred.** Religion, caste and mother tongue are scored only when the seeker stated them (or comes from a Traditional family, for mother tongue). Otherwise "background" means shared languages.
- **Diet uses a compatibility matrix**, not equality: veg–vegan 0.85, veg–non-veg 0.35, Jain–non-veg 0.15.
- **Profession pairs**: doctor + doctor = 1.0 (they understand shift work), while two *different* long-hours careers (for example doctor + lawyer) = 0.55.
- **Informational dimensions**: career and timeline are shown to a male seeker's matchmaker and can raise flags, but they carry weight 0, because the brief doesn't ask for them.

## 3. Reciprocity, ranking and diversity (`engine.ts`, `quality.ts`, `diversity.ts`)
- **The reverse score is not a copy of the forward score.** The candidate looks at the customer through **the candidate's own gender profile**: a woman judges a male client on career parity, values and relocation, while a man judges a female client on age, height and income. This is blended 60/40 with a **preference fit** score that measures how well the customer matches the candidate's *stated* preferences: age and height ranges, religion, caste, diet, city, education, income and marital status, counting only the items they actually set.
- **Calibration.** A weighted mean of about 10 smooth sub-scores is compressed, so real pairs fall between roughly 0.45 and 0.95. Each direction is linearly re-anchored with `(raw − 0.45) / (0.95 − 0.45)`. This is monotonic, so ranking within a direction is unchanged, but it spreads the scores out and sharpens the geometric mean.
- **Mutual score = √(forward × reverse)**, the geometric mean that OkCupid uses. 90/30 scores 52, while the arithmetic mean would be 60, so one-sided matches sink. This reflects reality: the other person will say no.
- **Quality multiplier**, capped at ±5%: verified ID, LinkedIn and income, and a near-term timeline, give a small boost; a profile with no verification at all or a 1–2 year timeline gets a small penalty. It can re-order near-ties but can't turn a weak match into a strong one.
- **Tiers**: ≥80 High Potential, 65–79 Strong, 50–64 Worth Exploring, otherwise Low.
- **MMR diversity re-rank** (λ = 0.75) over the top 3×limit candidates. The similarity measure combines same city (0.3), same profession (0.3), similar age (0.2, gaussian with σ 1.5 years) and same company (0.2). The matchmaker sees variety instead of ten 27-year-old Bangalore engineers. Pure score order is the special case λ = 1.
- **Explanations** (`explain.ts`): *highlights* are the reasons behind the three largest weight × score contributions, so they reflect what actually drove the score. *Concerns* are the flags from both directions, heavy dimensions that scored below 0.45, and a "possibly one-sided" warning when the reverse score is below 55. These are also the grounding facts for the AI layer and its fallback.
- `finalScore = mutualScore`. The AI layer later applies a bounded ±10 adjustment.

## Calibration results
Tuned so that a good match lands at about 75–90 and a typical one at 50–70. On the seeded data (all 20 clients against the 160-profile opposite-gender pool, 859 pairs that pass the filters), the mutual score is p10 / p50 / p90 = **48 / 69 / 86**, spread across every tier: 34 pairs in the 90s, 151 in the 80s, 220 in the 70s and 198 in the 60s.

## Files
`filters.ts` · `scorers/` (age, height, income, kids, values, lifestyle, location, background, career, timeline, interests, preferenceFit) · `weights.ts` (all tunables) · `score.ts` · `engine.ts` · `quality.ts` · `diversity.ts` · `explain.ts` · `utils.ts` · `__tests__/`

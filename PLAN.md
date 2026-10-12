# Matchmaker Dashboard & Algorithm — Build Plan

## 0. Research takeaways (what we borrow and why)

| Source | Idea we borrow | Where it shows up |
|---|---|---|
| Shaadi.com / BharatMatrimony / Jeevansathi | Detailed biodata incl. family details, horoscope, diet, "profile managed by"; partner-preference filters (age/height/income/community ranges) | Biodata schema, hard filters |
| Hinge / OkCupid | **Reciprocal** matching: a match is only good if it's good *for both people* (OkCupid uses the geometric mean of each side's satisfaction) | Mutual score |
| Hinge "Most Compatible" / Tinder Elo-style | Learning from feedback (accepted / declined intros) | Feedback loop (stretch goal) |
| Betterhalf / Knot / TDC-style human matchmaking | Human-in-the-loop: the algo shortlists, the matchmaker decides; notes from calls matter as much as the form | Notes feed into AI reasoning, pipeline stages |
| Bumble / Hinge prompts | Personality and lifestyle signals beyond demographics | Hobbies, lifestyle, "about me" fields used by the LLM |

## 1. Scope (MVP)

1. **Login**: matchmaker username/password, session cookie, protected routes.
2. **Dashboard**: table/cards of *my* customers (Name, Age, City, Marital Status, Status tag), with search, status filter and a pipeline count strip.
3. **Customer detail view**: full biodata, journey status (editable), notes timeline, suggested matches.
4. **Match pool**: 100+ dummy profiles per gender (we'll generate ~150 women + ~150 men so both directions work), with realistic Indian data.
5. **Matching engine**: gender-specific, explainable, scored, in three stages (see §4).
6. **AI layer**: LLM re-ranks the shortlist, writes a "why this works / watch-outs" explanation and a personalised intro email.
7. **Send Match**: modal preview of the email (editable), then a mock send: toast message, logged in the "Matches sent" history, and the customer status moves forward automatically.

Out of scope: real email delivery, real photos/KYC, multi-tenant admin.

## 2. Tech stack & architecture decisions

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 14 (App Router) + TypeScript** | One repo for UI and API (Node), deploys to Vercel with no extra setup |
| UI | Tailwind + shadcn/ui, lucide icons | Clean, accessible components quickly; warm palette (rose/cream/plum), not "corporate CRM" |
| Data | **Postgres (Neon free tier) + Drizzle ORM**; seed from JSON | Vercel's filesystem is read-only, so notes and status changes need a real DB. Fallback: static JSON + in-memory store if time is short |
| Auth | Credentials + bcrypt + signed HTTP-only cookie (`iron-session`), middleware-protected routes | Simple, no OAuth needed for an internal tool |
| AI | OpenAI API (small fast model for intros, stronger model for re-ranking) behind a `lib/ai/provider.ts` interface | Spec names OpenAI; the interface lets us swap provider. Deterministic fallback when no API key is set, so the demo never breaks |
| Validation | Zod for schemas shared between API and UI | Type-safe, one source of truth |
| Hosting | Vercel + Neon | Free, fast, gives a live link |

### Folder layout
```
/app
  /login                 login page
  /(app)/dashboard       customer list
  /(app)/customers/[id]  detail + matches
  /api/auth/*            login/logout
  /api/customers/*       list, get, update status
  /api/customers/[id]/notes
  /api/customers/[id]/matches        -> runs engine
  /api/matches/explain               -> LLM rerank + reasons
  /api/matches/intro                 -> LLM email draft
  /api/matches/send                  -> mock send + log
/lib
  /matching
    filters.ts        hard constraints (dealbreakers)
    scorers/*.ts      one file per dimension (age, height, income, education, values, lifestyle, location, family, kids...)
    weights.ts        gender-specific weight profiles (config, not code)
    engine.ts         pipeline: filter -> score -> reciprocal -> rank -> diversify
    explain.ts        rule-based reason strings (used as LLM grounding + fallback)
  /ai                 provider, prompts, response schemas
  /db                 drizzle schema, queries, seed
/data/seed            generated JSON (customers, pool, matchmakers)
/scripts/generate-profiles.ts   deterministic Faker-based generator (seeded)
```

## 3. Data model

**Profile** (customers and pool share one table, `isClient` flag):
- Required (from brief): firstName, lastName, gender, dob, country, city, heightCm, email, phone, ugCollege, degree, incomeLpa, company, designation, maritalStatus, languages[], siblings, caste, religion, wantKids, openToRelocate, openToPets (Yes/No/Maybe).
- **Extra Indian matchmaking fields (from research):**
  - *Background:* motherTongue, subCaste, gotra, community flexibility ("caste no bar" Y/N), nativePlace
  - *Horoscope:* manglik (Yes/No/Partial/Don't know), rashi, nakshatra, birthTime, birthPlace, horoscopeMatchRequired
  - *Education/career:* postGrad + college, workMode (onsite/hybrid/remote), careerAmbition (low/med/high), residencyStatus (Citizen/PR/Work visa, for NRIs)
  - *Family:* familyType (nuclear/joint), familyValues (traditional/moderate/liberal), fatherOccupation, motherOccupation, familyIncomeBand, livingWithParentsAfterMarriage
  - *Lifestyle:* diet (veg/non-veg/eggetarian/vegan/Jain), smoking, drinking, fitness, hobbies[], religiosity (1–5)
  - *Physical:* bodyType; disability (optional, sensitive)
  - *Meta:* profileManagedBy (self/parent/sibling), verified (ID/LinkedIn/income), aboutMe, timelineToMarry (0–6m / 6–12m / 1–2y)
  - *Partner preferences:* age range, height range, religions/castes accepted, diet preference, location preference, education minimum, dealbreakers[]
  - Note: complexion/skin tone is deliberately **excluded**. It is common on legacy matrimony sites, but it is discriminatory and modern apps have dropped it.

**Customer journey status** (pipeline tags):
`New` → `Onboarding` → `Profile Verified` → `Matching` → `Match Sent` → `Meeting Scheduled` → `In Conversation` → `Paused` / `Matched 🎉` / `Closed`

Other tables: `matchmakers`, `assignments` (matchmaker ↔ customer), `notes` (customerId, author, type: call/meeting/general, body, createdAt), `matchActions` (customerId, matchId, score, aiReason, emailBody, sentAt, outcome).

## 4. Matching algorithm ("3-stage funnel")

### Stage 1: Hard filters (dealbreakers, rule-based, fast)
Opposite gender; not already sent or declined; marital-status compatibility (per preference); religion/caste only if the customer marked it non-negotiable; age within the stated preference range ± tolerance; horoscope/manglik only if required; smoking/drinking/diet only if marked as a dealbreaker. **Output:** candidate set, with a logged reason for each exclusion ("why not X?" is answerable).

### Stage 2: Weighted, explainable compatibility score (0–100)
Each scorer returns `{ score: 0..1, weight, reason, flag? }`. Scores use smooth curves (gaussian or sigmoid), not on/off cutoffs, so a 1-year miss isn't treated like a 10-year one.

**Male customer → female candidates** (per brief, as configurable soft preferences):
| Dimension | Logic | Weight |
|---|---|---|
| Age | Candidate younger; peak at 2–5 yrs younger, decays beyond | 0.18 |
| Height | Candidate shorter; peak at 5–15 cm shorter | 0.12 |
| Income | Candidate earns ≤ customer; gentle decay if higher | 0.10 |
| Kids | Exact match = 1, Maybe↔Yes/No = 0.5, Yes↔No = 0 (near dealbreaker) | 0.15 |
| Values & family | familyValues, religiosity, familyType, live-with-parents | 0.15 |
| Lifestyle | diet, smoking, drinking, pets, fitness | 0.10 |
| Location/relocation | same city = 1; otherwise depends on either side's openToRelocate | 0.10 |
| Background | religion/caste/mother tongue (only when preferred), languages overlap | 0.10 |

**Female customer → male candidates** (research-led "thoughtful" logic):
| Dimension | Logic | Weight |
|---|---|---|
| Career & education parity | Similar or higher education tier; career-ambition alignment; compatible work modes | 0.18 |
| Values & family | familyValues, joint vs nuclear, living-with-parents expectation, religiosity | 0.18 |
| Relocation fit | Who moves? If she isn't open to relocating, he must be or must live in her city; NRI/visa compatibility | 0.14 |
| Kids & timeline | wantKids match + timelineToMarry alignment | 0.14 |
| Financial stability | Income ≥ her stated preference, smooth curve (no "must earn more" hard rule) | 0.10 |
| Lifestyle | diet, smoking, drinking, pets | 0.10 |
| Age & height | Within her preference range; soft | 0.08 |
| Background & languages | as above | 0.08 |

Weights live in `weights.ts` as data, so the team can tune them without touching the code, and per-customer overrides become possible later.

### Stage 3: Reciprocity + ranking
- Compute **A→B** (does B fit A's preferences?) and **B→A** (does A fit B's?).
- **Mutual score = √(A→B × B→A)** (geometric mean, as OkCupid does). A one-sided match scores low, which mirrors reality, because the other person will say no.
- **Profile-quality multiplier**: small boost for verified profiles and active/serious timeline.
- **Diversity re-rank (MMR)**: avoid showing 10 near-identical profiles; give the matchmaker variety.
- Tiers: **≥80 High Potential**, 65–79 Strong, 50–64 Worth Exploring, <50 hidden by default.

### Stage 4: AI re-rank & reasoning (top ~15 only, to control cost)
LLM receives: both structured profiles, the rule-based sub-scores and reasons, **the matchmaker's notes about the customer** (e.g. "wants someone outgoing; had bad experience with long-distance"). It returns structured JSON (Zod-validated):
```json
{ "matchId": "...", "aiAdjustment": -10..+10, "label": "High Potential",
  "whyItWorks": ["..."], "watchOuts": ["..."], "conversationStarter": "..." }
```
Final score = rule score + bounded AI adjustment (±10), so the LLM can't overturn the deterministic logic, but it **can use unstructured notes**, which the rules can't. Responses are cached per (customer, candidate, notes-hash).

### Stretch: feedback loop
Record outcomes (accepted / declined / met / reason). Nudge per-customer weights (e.g. repeated declines for "too far" raise the location weight). We'll describe this in the write-up even if only partially built.

## 5. AI features (mandatory and value-adding)
1. **Match explanations + label** (above): the core one.
2. **Personalised intro email**: tone options (warm / formal / playful); references real shared ground ("both of you trek and grew up in Pune"); the matchmaker can edit it before sending.
3. **Notes summariser**: "Summarise this customer" turns the notes timeline into a 3-line brief plus *inferred preferences*, which the matchmaker can one-click apply to preference fields.
4. *(Stretch)* **Natural-language search**: "show me doctors in Bangalore under 32 who are vegetarian" → LLM converts to a filter JSON → engine.

Guardrails: no protected attributes in free-text reasoning unless the customer explicitly prefers them; PII (phone/email) is never sent to the LLM; there is a deterministic fallback if the API fails or no key is set.

## 6. UX plan
- Warm, human palette (soft rose / ivory / deep plum), rounded cards, avatar initials, generous whitespace. It should feel caring, not like a spreadsheet.
- **Dashboard:** pipeline count chips at top (click to filter), search, sortable table ↔ card toggle, status pill colours, "needs attention" badge (no activity >7 days).
- **Detail page:** left = biodata in collapsible sections (Basics, Career, Family, Lifestyle, Horoscope, Preferences); right = status dropdown + notes timeline (quick-add with type); bottom/tab = **Matches**: cards with score ring, tier label, top 3 reasons, watch-outs, "Compare" side-by-side drawer, **Send Match** button.
- **Send Match modal:** match summary + AI email (editable, regenerate, tone) → Send → toast + entry in history + status → "Match Sent".
- Empty, loading (skeleton) and error states; keyboard-accessible; mobile-friendly.

## 7. Dummy data
- `scripts/generate-profiles.ts` uses seeded Faker with **Indian-specific lookup lists** (real city distribution, IIT/NIT/DU/state colleges, realistic company/designation pairs, income correlated with degree, company and age, religion→caste→gotra consistency, mother tongue correlated with home state, height distributions by gender).
- ~150 women + ~150 men in the pool; ~20 clients split across 2 matchmakers.
- Seeded, so the demo is reproducible.

## 8. Build phases & timeline (≈ 3–4 focused days)

| # | Phase | Output | Est. |
|---|---|---|---|
| 1 | Scaffold: Next.js, TS, Tailwind, shadcn, ESLint/Prettier, Drizzle + Neon, env | Running skeleton | 2h |
| 2 | Data schema + generator + seed | 300+ realistic profiles in DB | 3h |
| 3 | Auth (login, session, middleware, logout) | Protected app | 2h |
| 4 | Dashboard list (filters, search, pipeline chips) | Customer list | 3h |
| 5 | Detail view (biodata sections, status update, notes CRUD) | Detail page | 4h |
| 6 | Matching engine (filters, scorers, weights, reciprocity, MMR) + **unit tests (Vitest)** | `/api/.../matches` | 6h |
| 7 | AI: rerank/explain, intro email, notes summary; fallbacks + caching | AI endpoints | 4h |
| 8 | Match cards, compare drawer, Send Match modal, toasts, history | Full flow | 4h |
| 9 | Polish: empty/loading states, responsive, a11y, seed reset button | Demo-ready | 3h |
| 10 | Deploy (Vercel + Neon), README, write-up, demo creds, short Loom | Deliverables | 2h |

## 9. Deliverables checklist
- [ ] Live URL (Vercel)
- [ ] GitHub repo with README (setup, architecture diagram, decisions, trade-offs)
- [ ] Demo credentials, e.g. `priya.matchmaker / demo123`, `arjun.matchmaker / demo123`
- [ ] `MATCHING.md`: 2–3 paragraph write-up covering **AI Integration**, **Algorithm Design**, **Assumptions**
- [ ] Unit tests for scorers and engine
- [ ] (Bonus) 2-min walkthrough video

## 10. Assumptions to state in the write-up
- Male-customer rules (younger, earns less, shorter, same views on kids) are implemented **as requested, but as weighted soft preferences** rather than hard cutoffs, so strong matches aren't lost over a 1 cm difference; they're configurable per customer.
- Caste/religion/horoscope are only applied when the customer marks them as important (reflects the "caste no bar" trend on modern platforms).
- Pool profiles' preferences are synthetic but plausible, which is what makes reciprocal scoring meaningful.
- The LLM advises, the matchmaker decides: AI adjustments are bounded and every score is explainable.
- Heterosexual matching per the brief; the engine is gender-agnostic internally (weights keyed by "seeker profile"), so it can be extended.

## 11. Architecture discussion points (prep for review)
- Why the hybrid rules+LLM approach instead of pure LLM: cost, latency, determinism, auditability; the LLM only sees the top-K.
- Why the geometric mean for reciprocity, and what happens with one-sided interest.
- Why weights are config rather than code, and how the feedback loop would tune them.
- Scaling: pre-filter in SQL (indexed age/gender/city), score in memory for ~10k profiles; beyond that, nightly precomputed candidate lists, or embeddings + vector search (pgvector) for lifestyle/"about me" similarity.
- Privacy: PII stripped before LLM calls; access limited to assigned matchmakers.

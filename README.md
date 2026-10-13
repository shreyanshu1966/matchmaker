# TDC Matchmaker: Dashboard & Matching Algorithm (MVP)

An internal tool for matchmakers. You can review verified client biodata, track each client through the matchmaking journey, keep notes from calls and meetings, get ranked and explained match suggestions, and send AI-drafted introductions.

- **Demo logins:** `priya` / `demo123` · `arjun` / `demo123`. Each matchmaker has 10 clients, and each client sees a pool of 160 profiles of the opposite gender.
- **Matching write-up:** [MATCHING.md](MATCHING.md). Engine details: [lib/matching/README.md](lib/matching/README.md). AI design: [lib/ai/README.md](lib/ai/README.md).

## Features
- **Login:** session cookie (JWT, HTTP-only). `proxy.ts` protects every page and API route, and a matchmaker can only see their own clients.
- **Dashboard:** stats, filters by pipeline stage, search and sort, a "needs attention" flag (no activity for 7+ days), and a table or card view.
- **Client detail:**
  - **Profile:** the full biodata, including the Indian matchmaking fields from our research (horoscope, gotra, family details, diet, NRI status, partner preferences and dealbreakers).
  - **Journey status:** editable from the client page.
  - **Notes:** a timeline of notes with an AI client brief.
  - **Matches:** ranked suggestions with a score ring, tier, "why it works", watch-outs, a full score breakdown, and the list of profiles that were screened out, with reasons.
  - **History:** every match sent, with its outcome.
- **Send Match:** an AI-drafted intro email in Warm, Formal or Playful tone that the matchmaker can edit. Sending is a mock: it logs the match to history, advances the client's status and shows a toast.
- **Matching engine:** hard filters applied in both directions, then gender-specific weighted scoring, a two-way geometric-mean score, an MMR diversity re-rank, and an AI re-rank capped at ±10 points.

## Tech & architecture
| Layer | Choice | Why |
|---|---|---|
| App | Next.js 16 (App Router) + TypeScript + Tailwind v4 | One deployable for the UI and the Node API, so hosting on Vercel takes no extra setup |
| Data | Seeded JSON (340 profiles), with changes saved as a small JSON file | No external database for the MVP; all access goes through `lib/db`, so it can be replaced with Postgres behind the same functions |
| Matching | `lib/matching`: pure, deterministic and unit-tested | Every number can be explained; it's easy to test and to tune (weights are config) |
| AI | `lib/ai`: OpenAI with schema-validated JSON, personal details removed, cached, with a deterministic fallback | Adds nuance from the notes without making scores opaque; the demo works without a key |
| Auth | `jose` JWT cookie + bcrypt + `proxy.ts` | Simple, stateless, enough for an internal tool |

```
app/(app)/…            UI pages (dashboard, customers/[id])   components/   UI components
app/api/…              thin route handlers                    lib/auth/     session, guards, HTTP helpers
lib/db/                data access (seed + saved changes)     lib/matching/ engine, scorers, weights, tests
lib/ai/                LLM layer + fallbacks                  scripts/      deterministic profile generator
```
See [CONTRACTS.md](CONTRACTS.md) for the interfaces and API routes between the modules.

## Running locally
```bash
npm install
cp .env.example .env.local   # optional: add OPENAI_API_KEY to enable the LLM
npm run dev                  # http://localhost:3000
npm test                     # 44 unit tests (engine + AI fallbacks)
npm run seed                 # regenerate data/seed/*.json (deterministic)
```

## Environment variables
| Var | Required | Notes |
|---|---|---|
| `AUTH_SECRET` | in production | Signs the session JWT (≥32 characters) |
| `OPENAI_API_KEY` | no | Enables the LLM explanations, emails and summaries; without it, the rule-based fallbacks are used |
| `OPENAI_MODEL` | no | Defaults to `gpt-4o-mini` |

## Deploying (Vercel)
Import the repo, set `AUTH_SECRET` (and optionally `OPENAI_API_KEY`), then deploy. On Vercel, changes made in the demo (notes, statuses, matches sent) are saved to the instance's temporary storage, so they reset when the instance restarts. That is fine for a demo; production would use Postgres through `lib/db`.

## Known limitations / next steps
- A Postgres implementation of `lib/db` for durable multi-user data.
- A feedback loop: use recorded outcomes to adjust each client's weights.
- Natural-language search ("vegetarian doctors in Bangalore under 32") turned into engine filters by the LLM.
- Profile photos and verification uploads.

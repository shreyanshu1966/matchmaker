# AI layer (`lib/ai`)

Server-only. Public API (`index.ts`, see CONTRACTS.md section 3):

| Function | What it does |
|---|---|
| `explainMatches(customer, matches, notes)` | One batched LLM call for up to 10 matches: bounded score adjustment, label, one-line summary, why it works, watch-outs and a conversation starter |
| `generateIntroEmail(customer, match, { tone, matchmakerName })` | Email to the client introducing the match (Warm / Formal / Playful) |
| `summarizeNotes(customer, notes)` | 2–3 sentence brief, inferred preferences and a suggested next step |

## Design

- **Bounded adjustment (±10).** The deterministic engine owns the score. The LLM can only nudge it by an integer in −10..+10 (clamped again in code), so it can't overturn the rules. It can still add what the rules can't see: the matchmaker's free-text notes ("wants someone who reads", "no long-distance"). The label is derived from `mutualScore + adjustment` using the engine's tier thresholds, so the label and the tier never disagree.
- **PII redaction (`redact.ts`).** Everything sent to the model is a compact projection: first name + last initial, age instead of DOB, no email, phone, birth time or birth place, no ids. Free text (aboutMe, siblings, notes) is regex-scrubbed for emails and phone numbers. Caste is only included when the customer's preferences or dealbreakers make it relevant (data minimisation). The prompts also forbid commenting on caste or religion otherwise.
- **Grounded prompts (`prompts.ts`).** A senior Indian matchmaker persona with fixed rules: ground every claim in the given data, never invent facts, be concise, and write for the internal matchmaker (except for the intro email, which is for the client). We use JSON mode, and every response is validated with zod (`client.ts#chatJson`).
- **Batching.** All matches go in a single request (with about 350 output tokens per match), instead of N calls. That keeps the match page at one round trip (20 s timeout, no retries).
- **Caching (`cache.ts`).** An in-memory LRU (500 entries, 6 h TTL) on `globalThis`, keyed by the sha256 of the redacted inputs + model. Match insights are cached per (customer, candidate + rule output, notes), so adding a note or changing the pool only re-asks for what changed, and cached matches drop out of the batch. Only successful LLM results are cached.
- **Fallback (never throws).** With no `OPENAI_API_KEY`, or on any timeout, API, JSON or schema error, the functions log `console.warn("[ai] ...")` and return deterministic output with `source: "fallback"`:
  - insights come from the rule highlights/concerns plus keyword matching of the notes against the candidate's hobbies, aboutMe, city and profession, with a few negative cues (smoking, drinking, distance, diet). The adjustment is limited to ±3.
  - intro emails use a template per tone, built from the shared points (hobbies, city, mother tongue, values, diet, life plans) and a profile snapshot. They never mention caste or religion.
  - summaries pick out preference-like sentences from the notes (newest first) and pair them with a next step based on the client's status.

Env: `OPENAI_API_KEY` (optional), `OPENAI_MODEL` (default `gpt-4o-mini`). Tests: `npx vitest run lib/ai`.

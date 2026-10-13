/**
 * AI layer public API (server-only). See CONTRACTS.md section 3 and README.md here.
 * None of these functions throw: on a missing key, error or timeout they log
 * `[ai] ...` and return deterministic output with `source: "fallback"`.
 */
export { explainMatches, MAX_AI_MATCHES } from "./explain";
export { generateIntroEmail } from "./intro";
export { summarizeNotes } from "./summary";
export { isAiEnabled } from "./client";

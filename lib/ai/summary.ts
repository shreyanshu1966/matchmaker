import { z } from "zod";
import type { CustomerStatus, Note, NotesSummary, Profile } from "../types";
import { cacheGet, cacheSet, hashKey } from "./cache";
import { chatJson, errMsg, getModel, isAiEnabled } from "./client";
import { SUMMARY_SYSTEM } from "./prompts";
import { communityIsRelevant, redactNotes, redactProfile, scrubText } from "./redact";
import { ageOf, pronoun } from "./text";

const SummarySchema = z.object({
  summary: z.string().min(1),
  inferredPreferences: z.array(z.string()).min(1),
  suggestedNextStep: z.string().min(1),
});

const PREFERENCE_CUE =
  /\b(wants?|wanted|prefers?|preferred|looking for|should|must|needs?|keen|likes?|loves?|enjoys?|important|open to|not open|doesn'?t want|don'?t want|does not want|no |avoid|dislikes?|hates?|only|ideally|insists?|deal ?breaker|parents? (want|prefer|insist))\b/i;

const NEXT_STEP: Record<CustomerStatus, string> = {
  New: "Schedule the onboarding call to capture preferences and family expectations.",
  Onboarding: "Finish onboarding: confirm partner preferences and dealbreakers, then verify the profile.",
  "Profile Verified": "Run matching and shortlist 3-5 profiles that reflect the notes.",
  Matching: "Review the top AI-ranked matches and send the strongest one with a personalised intro.",
  "Match Sent": "Follow up on the match that was sent and capture the reaction in a note.",
  "Meeting Scheduled": "Check in before the meeting and debrief within 48 hours afterwards.",
  "In Conversation": "Check in on how the conversation is going and note any concerns early.",
  Paused: "Send a gentle check-in to see whether they are ready to resume.",
  Matched: "Congratulate them and ask for feedback or a testimonial.",
  Closed: "No action needed; the file is closed.",
};

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?;])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

function tidy(s: string, max = 80): string {
  let t = s.replace(/\s+/g, " ").replace(/[.;]+$/, "").trim();
  if (t.length > max) t = t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function structuredPreferences(c: Profile): string[] {
  const pp = c.partnerPreferences;
  const out: string[] = [`Age ${pp.ageMin}-${pp.ageMax}`];
  if (pp.cities.length) out.push(`Based in ${pp.cities.slice(0, 3).join(", ")}`);
  if (pp.diets.length) out.push(`Diet: ${pp.diets.join(" / ")}`);
  if (pp.minIncomeLpa) out.push(`Income at least ${pp.minIncomeLpa} LPA`);
  if (pp.dealbreakers.length) out.push(`Dealbreakers: ${pp.dealbreakers.slice(0, 3).join(", ")}`);
  if (c.wantKids === "Yes") out.push("Wants children");
  return out;
}

export function fallbackSummary(customer: Profile, notes: Note[]): NotesSummary {
  const p = pronoun(customer);
  const status = customer.status ?? "New";
  const sorted = redactNotes(notes); // oldest first, scrubbed
  const base = `${customer.firstName} (${ageOf(customer)}, ${customer.designation} in ${customer.city}) is currently at "${status}".`;

  if (!sorted.length) {
    return {
      summary: `${base} There are no matchmaker notes yet, so preferences come only from the profile form.`,
      inferredPreferences: structuredPreferences(customer).slice(0, 6),
      suggestedNextStep: NEXT_STEP[status] ?? NEXT_STEP.New,
      source: "fallback",
    };
  }

  const latest = sorted[sorted.length - 1];
  const prefs: string[] = [];
  const seen = new Set<string>();
  // newest notes first so recent preferences win
  for (const n of [...sorted].reverse()) {
    for (const s of splitSentences(n.text)) {
      if (!PREFERENCE_CUE.test(s)) continue;
      const t = tidy(s);
      const k = t.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      prefs.push(t);
      if (prefs.length >= 6) break;
    }
    if (prefs.length >= 6) break;
  }
  for (const s of structuredPreferences(customer)) {
    if (prefs.length >= 3) break;
    prefs.push(s);
  }

  const latestLine = tidy(latest.text, 140);
  const summary =
    `${base} ${sorted.length} note${sorted.length === 1 ? "" : "s"} on file; the latest (${latest.type.toLowerCase()}, ${latest.date}): "${latestLine}".` +
    // Preferences are listed separately as chips, so the summary only adds the form signals.
    ` Partner preferences on the form: ${structuredPreferences(customer).slice(0, 2).join("; ")}.`;

  const latestLower = latest.text.toLowerCase();
  let suggestedNextStep = NEXT_STEP[status] ?? NEXT_STEP.New;
  if (/call (back|again)|follow[\s-]?up|get back/.test(latestLower)) {
    suggestedNextStep = `Follow up with ${p.obj} as promised in the latest note, then ${suggestedNextStep.charAt(0).toLowerCase()}${suggestedNextStep.slice(1)}`;
  }

  return { summary, inferredPreferences: prefs.slice(0, 6), suggestedNextStep, source: "fallback" };
}

export async function summarizeNotes(customer: Profile, notes: Note[]): Promise<NotesSummary> {
  try {
    if (!isAiEnabled()) return fallbackSummary(customer, notes);

    const redNotes = redactNotes(notes);
    const payload = {
      customer: { ...redactProfile(customer, { includeCaste: communityIsRelevant(customer).caste }), status: customer.status },
      matchmakerNotes: redNotes.length ? redNotes : "No notes yet.",
    };
    const key = hashKey("summary-v1", getModel(), payload);
    const hit = cacheGet<NotesSummary>(key);
    if (hit) return hit;

    const out = await chatJson(SUMMARY_SYSTEM, JSON.stringify(payload), SummarySchema, {
      timeoutMs: 20_000,
      temperature: 0.3,
      maxTokens: 500,
    });
    const result: NotesSummary = {
      summary: scrubText(out.summary.trim()),
      inferredPreferences: out.inferredPreferences.map((s) => scrubText(s.trim())).filter(Boolean).slice(0, 6),
      suggestedNextStep: scrubText(out.suggestedNextStep.trim()),
      source: "openai",
    };
    cacheSet(key, result);
    return result;
  } catch (err) {
    console.warn("[ai] summarizeNotes failed, using fallback:", errMsg(err));
    try {
      return fallbackSummary(customer, notes);
    } catch (err2) {
      console.warn("[ai] summarizeNotes fallback failed:", errMsg(err2));
      return {
        summary: `${customer?.firstName ?? "This customer"} has ${notes?.length ?? 0} notes on file.`,
        inferredPreferences: [],
        suggestedNextStep: "Review the notes and schedule a check-in call.",
        source: "fallback",
      };
    }
  }
}

import { z } from "zod";
import type { AiMatchInsight, MatchResult, Note, Profile } from "../types";
import { cacheGet, cacheSet, hashKey } from "./cache";
import { chatJson, errMsg, getModel, isAiEnabled } from "./client";
import { EXPLAIN_SYSTEM } from "./prompts";
import { communityIsRelevant, displayName, redactNotes, redactProfile } from "./redact";
import {
  ageOf,
  clamp,
  clampAdjustment,
  noteSignals,
  pronoun,
  sharedPoints,
  tierFor,
} from "./text";

/** Max matches sent to the LLM in one batched call. */
export const MAX_AI_MATCHES = 10;
const FALLBACK_LIMIT = 3;

const InsightSchema = z.object({
  ref: z.string(),
  adjustment: z.coerce.number(),
  summary: z.string().min(1),
  whyItWorks: z.array(z.string()).min(1),
  watchOuts: z.array(z.string()).default([]),
  conversationStarter: z.string().min(1),
});
const ExplainSchema = z.object({ insights: z.array(InsightSchema).min(1) });

type LlmInsight = z.infer<typeof InsightSchema>;

function labelFor(m: MatchResult, adjustment: number) {
  return tierFor(clamp(m.mutualScore + adjustment, 0, 100));
}

function compactMatch(m: MatchResult, ref: string, includeCaste: boolean) {
  return {
    ref,
    candidate: redactProfile(m.candidate, { includeCaste }),
    rules: {
      mutualScore: Math.round(m.mutualScore),
      forwardScore: Math.round(m.forwardScore),
      reverseScore: Math.round(m.reverseScore),
      tier: m.tier,
      dimensions: m.dimensions.map((d) => ({
        dim: d.label,
        score: Math.round(d.score * 100) / 100,
        reason: d.reason,
        ...(d.flag ? { flag: d.flag } : {}),
      })),
      highlights: m.highlights,
      concerns: m.concerns,
    },
  };
}

function toInsight(m: MatchResult, r: LlmInsight): AiMatchInsight {
  const adjustment = clampAdjustment(r.adjustment);
  return {
    matchId: m.candidate.id,
    adjustment,
    label: labelFor(m, adjustment),
    summary: r.summary.trim(),
    whyItWorks: r.whyItWorks.map((s) => s.trim()).filter(Boolean).slice(0, 3),
    watchOuts: r.watchOuts.map((s) => s.trim()).filter(Boolean).slice(0, 2),
    conversationStarter: r.conversationStarter.trim(),
    source: "openai",
  };
}

// ---------------------------------------------------------------- fallback

export function fallbackInsight(customer: Profile, m: MatchResult, notes: Note[]): AiMatchInsight {
  const c = m.candidate;
  const p = pronoun(c);
  const notesText = notes.map((n) => n.body).join("\n");
  const signals = noteSignals(customer, c, notesText);
  const pos = signals.filter((s) => s.kind === "positive");
  const neg = signals.filter((s) => s.kind === "negative");
  const adjustment = clampAdjustment(pos.length - neg.length * 2, FALLBACK_LIMIT);

  const whyItWorks = [...pos.map((s) => s.text), ...m.highlights].slice(0, 3);
  if (whyItWorks.length < 2) {
    for (const sp of sharedPoints(customer, c)) {
      if (whyItWorks.length >= 2) break;
      whyItWorks.push(sp.text.replace(/^you (are )?both /, "Both ").replace(/^your families/, "Both families"));
    }
  }
  if (whyItWorks.length === 0) whyItWorks.push(`Rule-based mutual score of ${Math.round(m.mutualScore)}`);

  const watchOuts = [...neg.map((s) => s.text), ...m.concerns].slice(0, 2);

  const label = labelFor(m, adjustment);
  const lead = m.highlights[0] ?? pos[0]?.text;
  const summary =
    `${displayName(c)} (${ageOf(c)}, ${c.designation} in ${c.city}) is a ${label.toLowerCase()} match` +
    // New sentence (not "match: ...") so names at the start of the reason keep their capital.
    (lead ? `. ${lead.replace(/\.$/, "")}.` : ".");

  const shared = sharedPoints(customer, c);
  const hobby = shared.find((s) => s.key === "hobbies");
  const conversationStarter = hobby
    ? `Ask ${customer.firstName} to open with their shared interest: ${hobby.text.replace(/^you both enjoy /, "")}.`
    : c.hobbies[0]
      ? `Suggest asking ${c.firstName} about ${p.poss} interest in ${c.hobbies[0].toLowerCase()}.`
      : `Suggest asking ${c.firstName} what a typical weekend in ${c.city} looks like for ${p.obj}.`;

  return {
    matchId: c.id,
    adjustment,
    label,
    summary,
    whyItWorks,
    watchOuts,
    conversationStarter,
    source: "fallback",
  };
}

// ---------------------------------------------------------------- main

export async function explainMatches(
  customer: Profile,
  matches: MatchResult[],
  notes: Note[],
): Promise<AiMatchInsight[]> {
  try {
    if (!matches.length) return [];
    const fallbackAll = () => matches.map((m) => fallbackInsight(customer, m, notes));
    if (!isAiEnabled()) return fallbackAll();

    const relevance = communityIsRelevant(customer);
    const includeCaste = relevance.caste;
    const redCustomer = redactProfile(customer, { includeCaste });
    const redNotes = redactNotes(notes);
    const model = getModel();

    const top = matches.slice(0, MAX_AI_MATCHES);
    const keys = top.map((m) =>
      hashKey("explain-v1", model, redCustomer, redNotes, compactMatch(m, "x", includeCaste)),
    );

    const results = new Map<string, AiMatchInsight>();
    const pending: { m: MatchResult; key: string; ref: string }[] = [];
    top.forEach((m, i) => {
      const hit = cacheGet<AiMatchInsight>(keys[i]);
      if (hit) results.set(m.candidate.id, hit);
      else pending.push({ m, key: keys[i], ref: `m${i + 1}` });
    });

    if (pending.length) {
      try {
        const user = JSON.stringify({
          customer: redCustomer,
          communityPreferenceRelevant: relevance,
          matchmakerNotes: redNotes.length ? redNotes : "No notes yet.",
          candidates: pending.map((p) => compactMatch(p.m, p.ref, includeCaste)),
        });
        const out = await chatJson(EXPLAIN_SYSTEM, user, ExplainSchema, {
          timeoutMs: 20_000,
          temperature: 0.3,
          maxTokens: 350 * pending.length + 200,
        });
        const byRef = new Map(out.insights.map((r) => [r.ref.trim(), r]));
        for (const p of pending) {
          const r = byRef.get(p.ref);
          if (!r) {
            console.warn(`[ai] explainMatches: model omitted ${p.ref}; using fallback for it`);
            continue;
          }
          const insight = toInsight(p.m, r);
          cacheSet(p.key, insight);
          results.set(p.m.candidate.id, insight);
        }
      } catch (err) {
        console.warn("[ai] explainMatches failed, using fallback:", errMsg(err));
      }
    }

    return matches.map((m) => results.get(m.candidate.id) ?? fallbackInsight(customer, m, notes));
  } catch (err) {
    console.warn("[ai] explainMatches unexpected error:", errMsg(err));
    return safeFallbackAll(customer, matches, notes);
  }
}

function safeFallbackAll(customer: Profile, matches: MatchResult[], notes: Note[]): AiMatchInsight[] {
  return matches.map((m) => {
    try {
      return fallbackInsight(customer, m, notes);
    } catch {
      return {
        matchId: m.candidate?.id ?? "unknown",
        adjustment: 0,
        label: tierFor(m.mutualScore ?? 0),
        summary: "Rule-based match; no additional insight available.",
        whyItWorks: (m.highlights ?? []).slice(0, 3),
        watchOuts: (m.concerns ?? []).slice(0, 2),
        conversationStarter: "Suggest starting with a short call to compare weekend routines.",
        source: "fallback" as const,
      };
    }
  });
}

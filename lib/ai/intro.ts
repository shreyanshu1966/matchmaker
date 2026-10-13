import { z } from "zod";
import type { EmailTone, IntroEmail, MatchResult, Profile } from "../types";
import { cacheGet, cacheSet, hashKey } from "./cache";
import { chatJson, errMsg, getModel, isAiEnabled } from "./client";
import { introSystem } from "./prompts";
import { communityIsRelevant, educationLabel, redactProfile, scrubText } from "./redact";
import { ageOf, firstSentence, joinList, pronoun, sharedPoints } from "./text";

const EmailSchema = z.object({
  subject: z.string().min(3).max(140),
  body: z.string().min(200),
});

export interface IntroOptions {
  tone: EmailTone;
  matchmakerName: string;
}

const TONES: EmailTone[] = ["Warm", "Formal", "Playful"];

function educationLine(p: Profile): string {
  if (p.postGradDegree) return `${p.postGradDegree}${p.postGradCollege ? `, ${p.postGradCollege}` : ""}`;
  return `${p.degree}${p.ugCollege ? `, ${p.ugCollege}` : ""}` || educationLabel(p.educationLevel);
}

function snapshot(m: Profile): string {
  const lines = [
    `- ${m.firstName}, ${ageOf(m)}, ${m.city}`,
    `- ${m.designation}${m.company ? ` at ${m.company}` : ""} (${m.profession})`,
    `- ${educationLine(m)}`,
  ];
  const about = firstSentence(scrubText(m.aboutMe));
  if (about) lines.push(`- In ${pronoun(m).poss} words: "${about}"`);
  return lines.join("\n");
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Deterministic template email, used without an API key or when the LLM fails. */
export function fallbackIntroEmail(customer: Profile, match: MatchResult, opts: IntroOptions): IntroEmail {
  const c = match.candidate;
  const p = pronoun(c);
  const tone: EmailTone = TONES.includes(opts.tone) ? opts.tone : "Warm";
  const signer = opts.matchmakerName?.trim() || "Your matchmaker";

  let shared = sharedPoints(customer, c).slice(0, 3).map((s) => s.text);
  if (shared.length === 0) shared = [`${p.subj} is looking for the same kind of partnership you described to me`];
  const sharedSentence = capitalise(joinList(shared));
  const firstHobby = c.hobbies[0]?.toLowerCase();

  let subject: string;
  let body: string;

  if (tone === "Formal") {
    subject = `A suggested introduction: ${c.firstName}, ${c.city}`;
    body = [
      `Dear ${customer.firstName},`,
      `I hope you are keeping well. I am pleased to share a profile that I believe merits your consideration, based on the preferences you have discussed with me.`,
      snapshot(c),
      `There is meaningful common ground here. ${sharedSentence}, which I consider a sound foundation for a first conversation.`,
      `Should you wish to proceed, I would be glad to arrange an introduction at a time convenient to you and your family. Please reply to this email with your thoughts, or with any questions about ${c.firstName}'s profile.`,
      `With kind regards,\n${signer}`,
    ].join("\n\n");
  } else if (tone === "Playful") {
    subject = `Someone in ${c.city} you might want to meet`;
    body = [
      `Hi ${customer.firstName}!`,
      `I have been doing my matchmaker detective work, and I think I have found someone worth a coffee (or at least a really good phone call).`,
      snapshot(c),
      `Here is why my matchmaker instincts are tingling: ${shared.length > 1 ? joinList(shared) : shared[0]}.${firstHobby ? ` I suspect ${p.subj} has opinions about ${firstHobby}, so you have a ready-made first question.` : ""}`,
      `Want me to make the introduction? Just reply to this email and I will take it from there. And if you have questions about ${c.firstName}, ask away.`,
      `Cheers,\n${signer}`,
    ].join("\n\n");
  } else {
    subject = `I'd love for you to meet ${c.firstName}`;
    body = [
      `Dear ${customer.firstName},`,
      `I hope you are doing well. I have been thinking about everything you shared with me, and I would love to introduce you to someone I think you will genuinely enjoy getting to know.`,
      snapshot(c),
      `What stood out to me: ${shared.length > 1 ? joinList(shared) : shared[0]}. It feels like the kind of common ground that makes a first conversation easy.`,
      `If you would like me to arrange an introduction, simply reply to this email. I am also happy to tell you more about ${c.firstName} first.`,
      `Warmly,\n${signer}`,
    ].join("\n\n");
  }

  return { subject, body, source: "fallback" };
}

export async function generateIntroEmail(
  customer: Profile,
  match: MatchResult,
  opts: IntroOptions,
): Promise<IntroEmail> {
  try {
    if (!isAiEnabled()) return fallbackIntroEmail(customer, match, opts);

    const tone: EmailTone = TONES.includes(opts.tone) ? opts.tone : "Warm";
    const includeCaste = communityIsRelevant(customer).caste;
    const c = match.candidate;
    const payload = {
      tone,
      matchmakerName: opts.matchmakerName,
      customer: redactProfile(customer, { includeCaste }),
      match: redactProfile(c, { includeCaste }),
      matchBasics: {
        firstName: c.firstName,
        age: ageOf(c),
        city: c.city,
        profession: c.profession,
        designation: c.designation,
        company: c.company,
        education: educationLine(c),
        aboutMeLine: firstSentence(scrubText(c.aboutMe), 220),
      },
      sharedPoints: sharedPoints(customer, c).map((s) => s.text),
      ruleHighlights: match.highlights,
      aiInsight: match.ai
        ? { whyItWorks: match.ai.whyItWorks, conversationStarter: match.ai.conversationStarter }
        : undefined,
    };

    const key = hashKey("intro-v1", getModel(), payload);
    const hit = cacheGet<IntroEmail>(key);
    if (hit) return hit;

    const out = await chatJson(introSystem(tone), JSON.stringify(payload), EmailSchema, {
      timeoutMs: 20_000,
      temperature: 0.7,
      maxTokens: 600,
    });
    let body = out.body.trim();
    // Guarantee the sign-off, in case the model forgot it.
    if (opts.matchmakerName && !body.includes(opts.matchmakerName)) body += `\n\n${opts.matchmakerName}`;
    const email: IntroEmail = { subject: out.subject.trim(), body: scrubText(body), source: "openai" };
    cacheSet(key, email);
    return email;
  } catch (err) {
    console.warn("[ai] generateIntroEmail failed, using fallback:", errMsg(err));
    try {
      return fallbackIntroEmail(customer, match, opts);
    } catch (err2) {
      console.warn("[ai] generateIntroEmail fallback failed:", errMsg(err2));
      return {
        subject: `An introduction: ${match?.candidate?.firstName ?? "a new match"}`,
        body: `Dear ${customer?.firstName ?? "there"},\n\nI have a profile I would love to share with you. Reply to this email and I will tell you more.\n\nWarmly,\n${opts?.matchmakerName ?? "Your matchmaker"}`,
        source: "fallback",
      };
    }
  }
}

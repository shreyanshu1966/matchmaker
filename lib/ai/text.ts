/**
 * Small deterministic text helpers used by the fallbacks (no LLM).
 */
import type { MatchTier, Profile } from "../types";
import { ageFromDob } from "./redact";

export function tierFor(score: number): MatchTier {
  if (score >= 80) return "High Potential";
  if (score >= 65) return "Strong";
  if (score >= 50) return "Worth Exploring";
  return "Low";
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function clampAdjustment(n: unknown, limit = 10): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : 0;
  return clamp(v, -limit, limit);
}

export function pronoun(p: Pick<Profile, "gender">) {
  return p.gender === "Female"
    ? { subj: "she", obj: "her", poss: "her", Subj: "She" }
    : { subj: "he", obj: "him", poss: "his", Subj: "He" };
}

const STOPWORDS = new Set(
  `a about above after again against all also am an and any are aren't as at be because been before being below
  between both but by can could did do does doesn't doing don't down during each else ever few for from further
  get gets got had has have having he her here hers herself him himself his how however i if in into is isn't it
  its itself just keen like likes liked lot lots me more most much must my myself no nor not now of off on once
  only or other our ours out over own prefer prefers preferred really said same say says she should so some such
  than that the their theirs them themselves then there these they this those through to too under until up us
  very want wants wanted was we were what when where which while who whom why will with would you your yours
  someone somebody person partner match matches profile profiles client customer family parents mother father
  looking look looks need needs open okay ok good great nice well very call meeting spoke discussed told mentioned
  week month year years time also still maybe think thinks feel feels important bit quite seems seem being
  him her his hers boy girl guy man woman people things thing something anything lifestyle kind type
  one two new old yet day bad let way see ask put use end age who how why its etc via per`
    .split(/\s+/)
    .filter(Boolean),
);

/** Very small stemmer: reads/reader/reading -> read, travelling -> travel, trekking -> trek. */
export function stem(word: string): string {
  let w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return w;
  for (const suf of ["ings", "ing", "ers", "er", "ies", "es", "ed", "s"]) {
    if (w.endsWith(suf) && w.length - suf.length >= 3) {
      w = suf === "ies" ? w.slice(0, -3) + "i" : w.slice(0, -suf.length);
      break;
    }
  }
  // travell -> travel, trekk -> trek
  if (/([b-df-hj-np-tv-z])\1$/.test(w)) w = w.slice(0, -1);
  // dance -> danc, story -> stori (so they meet "dancing" / "stories")
  if (w.length > 3 && w.endsWith("e")) w = w.slice(0, -1);
  else if (w.length > 3 && w.endsWith("y")) w = w.slice(0, -1) + "i";
  return w;
}

export function keywords(text: string): Set<string> {
  const out = new Set<string>();
  for (const raw of text.toLowerCase().split(/[^a-z']+/)) {
    if (raw.length < 3 || STOPWORDS.has(raw)) continue;
    const s = stem(raw);
    if (s.length >= 3 && !STOPWORDS.has(s)) out.add(s);
  }
  return out;
}

/** A few common phrasings that should map onto hobby words. */
const SYNONYMS: Record<string, string[]> = {
  read: ["book", "novel", "literature", "reader"],
  book: ["read"],
  travel: ["trip", "explor", "wanderlust", "backpack"],
  trek: ["hik", "mountain", "trekking"],
  hik: ["trek"],
  music: ["sing", "guitar", "piano", "concert", "classical"],
  sing: ["music"],
  cook: ["food", "baking", "bak", "culinary"],
  food: ["cook"],
  fit: ["gym", "workout", "running", "run", "yoga", "fitness", "sport"],
  gym: ["fit", "fitness", "workout"],
  yoga: ["fit", "meditation"],
  danc: ["dancing"],
  art: ["paint", "sketch", "draw"],
  paint: ["art"],
  photograph: ["photo", "camera"],
  movi: ["film", "cinema"],
  film: ["movie", "cinema"],
  sport: ["cricket", "football", "badminton", "tennis", "fit"],
};

export function expand(words: Set<string>): Set<string> {
  const out = new Set(words);
  for (const w of words) for (const s of SYNONYMS[w] ?? []) out.add(stem(s));
  return out;
}

export interface NoteSignal {
  kind: "positive" | "negative";
  text: string;
}

/**
 * Keyword-match the matchmaker notes against a candidate's hobbies, aboutMe,
 * city and profession, plus a few explicit negative cues (smoking, drinking,
 * long-distance, relocation). Purely heuristic.
 */
export function noteSignals(customer: Profile, candidate: Profile, notesText: string): NoteSignal[] {
  const signals: NoteSignal[] = [];
  if (!notesText.trim()) return signals;
  const lower = notesText.toLowerCase();
  const noteWords = expand(keywords(notesText));

  // hobbies
  const matchedHobbies: string[] = [];
  for (const hobby of candidate.hobbies) {
    const hw = keywords(hobby);
    if ([...hw].some((w) => noteWords.has(w))) matchedHobbies.push(hobby);
  }
  if (matchedHobbies.length) {
    signals.push({
      kind: "positive",
      text: `Notes mention interests that fit: ${pronoun(candidate).subj} enjoys ${matchedHobbies.slice(0, 3).join(", ").toLowerCase()}`,
    });
  }

  // city
  // (skipped when both already live there: the rule-based location score covers it)
  const city = candidate.city.toLowerCase();
  if (city && city !== customer.city.toLowerCase() && lower.includes(city)) {
    signals.push({ kind: "positive", text: `Notes mention ${candidate.city}, where ${pronoun(candidate).subj} lives` });
  }

  // profession / designation
  const profWords = keywords(`${candidate.profession} ${candidate.designation}`);
  const profHit = [...profWords].find((w) => w.length >= 4 && noteWords.has(w));
  if (profHit) {
    signals.push({
      kind: "positive",
      text: `Notes point to a ${candidate.profession.toLowerCase()} background, which ${pronoun(candidate).subj} has (${candidate.designation})`,
    });
  }

  // aboutMe: only distinctive words, and only if the hobbies did not already match
  if (!matchedHobbies.length) {
    const aboutWords = keywords(candidate.aboutMe);
    const hits = [...aboutWords].filter((w) => w.length >= 5 && noteWords.has(w)).slice(0, 3);
    if (hits.length) {
      signals.push({ kind: "positive", text: `${pronoun(candidate).Subj} writes about ${hits.join(", ")}, echoing the notes` });
    }
  }

  // explicit negative cues
  if (/smok/.test(lower) && /(no|not|non|never|avoid|hate|dislike|n't)\W+(\w+\W+){0,3}smok|non-?smok/.test(lower) && candidate.smoking !== "Never") {
    signals.push({ kind: "negative", text: `Notes ask for a non-smoker; ${pronoun(candidate).subj} smokes ${candidate.smoking.toLowerCase()}` });
  }
  if (/(no|not|non|never|avoid|teetotal|n't)\W+(\w+\W+){0,3}drink|teetotal/.test(lower) && candidate.drinking === "Regularly") {
    signals.push({ kind: "negative", text: `Notes suggest drinking is a concern; ${pronoun(candidate).subj} drinks regularly` });
  }
  const sameCity = candidate.city.toLowerCase() === customer.city.toLowerCase();
  if (/long[\s-]?distance|same city|nearby|close to home|not relocat|won't relocate|wont relocate/.test(lower) && !sameCity && candidate.openToRelocate === "No") {
    signals.push({ kind: "negative", text: `Notes flag distance; ${pronoun(candidate).subj} is in ${candidate.city} and not open to relocating` });
  }
  if (/vegetarian|veg only|pure veg/.test(lower) && !/non-?veg(etarian)? (is )?(fine|ok)/.test(lower) && candidate.diet === "Non-Vegetarian" && customer.diet !== "Non-Vegetarian") {
    signals.push({ kind: "negative", text: `Notes stress vegetarian food; ${pronoun(candidate).subj} is non-vegetarian` });
  }
  return signals;
}

export interface SharedPoint {
  key: string;
  text: string;
}

/** Concrete shared ground between two profiles, safe to mention to a client (no caste/religion). */
export function sharedPoints(a: Profile, b: Profile): SharedPoint[] {
  const pts: SharedPoint[] = [];
  const aH = new Map(a.hobbies.map((h) => [stem(h.split(/\s+/)[0] ?? h), h]));
  const common = b.hobbies.filter((h) => aH.has(stem(h.split(/\s+/)[0] ?? h)));
  if (common.length) pts.push({ key: "hobbies", text: `you both enjoy ${joinList(common.slice(0, 2).map((h) => h.toLowerCase()))}` });
  if (a.city.toLowerCase() === b.city.toLowerCase()) pts.push({ key: "city", text: `you are both based in ${b.city}` });
  else if (a.nativePlace && a.nativePlace.toLowerCase() === b.nativePlace.toLowerCase())
    pts.push({ key: "native", text: `your families both have roots in ${b.nativePlace}` });
  if (a.motherTongue && a.motherTongue === b.motherTongue) pts.push({ key: "tongue", text: `you share ${b.motherTongue} as a mother tongue` });
  if (a.familyValues === b.familyValues) pts.push({ key: "values", text: `you both come from ${b.familyValues.toLowerCase()} families` });
  if (a.diet === b.diet && a.diet !== "Non-Vegetarian") pts.push({ key: "diet", text: `you are both ${b.diet.toLowerCase()}` });
  if (a.profession === b.profession) pts.push({ key: "profession", text: `you both work in ${b.profession.toLowerCase()}` });
  if (a.wantKids === "Yes" && b.wantKids === "Yes") pts.push({ key: "kids", text: "you both see children in your future" });
  if (a.timelineToMarry === b.timelineToMarry) pts.push({ key: "timeline", text: `you are both hoping to marry in the next ${b.timelineToMarry}` });
  if (a.careerAmbition === "High" && b.careerAmbition === "High") pts.push({ key: "ambition", text: "you are both ambitious about your careers" });
  return pts;
}

export function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function firstSentence(text: string, max = 160): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "";
  const m = t.match(/^.*?[.!?](\s|$)/);
  let s = (m ? m[0] : t).trim();
  if (s.length > max) s = s.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
  return s;
}

export function ageOf(p: Profile): number {
  return ageFromDob(p.dob);
}

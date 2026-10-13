import type {
  CustomerStatus,
  Dealbreaker,
  EducationLevel,
  MatchOutcome,
  MatchTier,
  NoteType,
  Profile,
} from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export function fullName(p: Pick<Profile, "firstName" | "lastName">) {
  return `${p.firstName} ${p.lastName}`.trim();
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** Age in whole years from an ISO date (YYYY-MM-DD). */
export function ageFromDob(dob: string, now: number = Date.now()): number {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date(now);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/** 168 -> 5′6″ */
export function heightFtIn(cm: number): string {
  if (!cm) return "—";
  const totalIn = cm / 2.54;
  let ft = Math.floor(totalIn / 12);
  let inch = Math.round(totalIn - ft * 12);
  if (inch === 12) {
    ft += 1;
    inch = 0;
  }
  return `${ft}′${inch}″`;
}

export function heightLabel(cm: number): string {
  if (!cm) return "—";
  return `${cm} cm · ${heightFtIn(cm)}`;
}

/** 18.5 -> "₹18.5 LPA", 120 -> "₹1.2 Cr" */
export function formatLpa(lpa: number): string {
  if (lpa === null || lpa === undefined || Number.isNaN(lpa)) return "—";
  if (lpa >= 100) {
    const cr = lpa / 100;
    return `₹${trimNumber(cr, 2)} Cr`;
  }
  return `₹${trimNumber(lpa, 1)} LPA`;
}

function trimNumber(n: number, digits: number) {
  return Number(n.toFixed(digits)).toLocaleString("en-IN");
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "just now", "5 min ago", "3 hours ago", "yesterday", "4 days ago", "2 months ago" */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = now - t;
  const future = diff < 0;
  const abs = Math.abs(diff);
  const min = Math.round(abs / 60000);
  const hrs = Math.round(abs / 3_600_000);
  const days = Math.round(abs / DAY);

  const wrap = (s: string) => (future ? `in ${s}` : `${s} ago`);
  if (abs < 45_000) return "just now";
  if (min < 60) return wrap(`${min} min`);
  if (hrs < 24) return wrap(`${hrs} ${hrs === 1 ? "hour" : "hours"}`);
  if (days === 1) return future ? "tomorrow" : "yesterday";
  if (days < 30) return wrap(`${days} days`);
  const months = Math.round(days / 30.4);
  if (months < 12) return wrap(`${months} ${months === 1 ? "month" : "months"}`);
  const years = Math.round(days / 365);
  return wrap(`${years} ${years === 1 ? "year" : "years"}`);
}

export function daysSince(iso: string, now: number = Date.now()) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.floor((now - t) / DAY);
}

const QUIET_STATUSES: CustomerStatus[] = ["Matched", "Closed"];

/** A client needs attention when nothing has happened for more than 7 days (ignores finished journeys). */
export function needsAttention(p: Pick<Profile, "lastActivityAt" | "status">, now: number = Date.now()) {
  if (p.status && QUIET_STATUSES.includes(p.status)) return false;
  return now - new Date(p.lastActivityAt).getTime() > 7 * DAY;
}

export function greeting(now: number = Date.now()) {
  const h = new Date(now).getHours();
  if (h < 5) return "Good evening";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ------------------------------------------------------------------ */
/* Labels                                                              */
/* ------------------------------------------------------------------ */

export const EDUCATION_LABELS: Record<EducationLevel, string> = {
  1: "Diploma",
  2: "Bachelor's",
  3: "Master's / MBA",
  4: "Doctorate / MD",
};

export const DEALBREAKER_LABELS: Record<Dealbreaker, string> = {
  smoking: "Smoking",
  drinking: "Drinking",
  "non-vegetarian": "Non-vegetarian",
  "different-religion": "Different religion",
  "different-caste": "Different caste",
  divorced: "Divorced",
  "manglik-mismatch": "Manglik mismatch",
  "no-relocation": "Won't relocate",
  "doesnt-want-kids": "Doesn't want kids",
  "wants-kids": "Wants kids",
};

export const RELIGIOSITY_LABELS: Record<number, string> = {
  1: "Not religious",
  2: "Lightly religious",
  3: "Moderately religious",
  4: "Religious",
  5: "Very religious",
};

/* ------------------------------------------------------------------ */
/* Colours (full literal class strings so Tailwind can see them)       */
/* ------------------------------------------------------------------ */

interface Tone {
  /** pill background + text + ring */
  pill: string;
  /** small solid dot */
  dot: string;
}

export const STATUS_TONES: Record<CustomerStatus, Tone> = {
  New: { pill: "bg-sky-50 text-sky-800 ring-sky-200", dot: "bg-sky-500" },
  Onboarding: { pill: "bg-indigo-50 text-indigo-800 ring-indigo-200", dot: "bg-indigo-500" },
  "Profile Verified": { pill: "bg-teal-50 text-teal-800 ring-teal-200", dot: "bg-teal-500" },
  Matching: { pill: "bg-plum-50 text-plum-700 ring-plum-200", dot: "bg-plum-500" },
  "Match Sent": { pill: "bg-blush-50 text-blush-700 ring-blush-200", dot: "bg-blush-500" },
  "Meeting Scheduled": { pill: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  "In Conversation": { pill: "bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-200", dot: "bg-fuchsia-500" },
  Paused: { pill: "bg-stone-100 text-stone-700 ring-stone-200", dot: "bg-stone-400" },
  Matched: { pill: "bg-emerald-50 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500" },
  Closed: { pill: "bg-zinc-100 text-zinc-600 ring-zinc-200", dot: "bg-zinc-400" },
};

export function statusTone(status?: CustomerStatus): Tone {
  return (status && STATUS_TONES[status]) || STATUS_TONES.New;
}

interface TierTone extends Tone {
  /** SVG stroke colour for the score ring */
  stroke: string;
  /** subtle card accent */
  card: string;
  /** chip when selected */
  chipActive: string;
}

export const TIER_TONES: Record<MatchTier, TierTone> = {
  "High Potential": {
    pill: "bg-gold-50 text-gold-700 ring-gold-300",
    dot: "bg-gold-400",
    stroke: "#cca23f",
    card: "ring-1 ring-gold-200 shadow-glow",
    chipActive: "bg-gold-400 text-white ring-gold-400",
  },
  Strong: {
    pill: "bg-plum-50 text-plum-700 ring-plum-200",
    dot: "bg-plum-500",
    stroke: "#824f7a",
    card: "ring-1 ring-line",
    chipActive: "bg-plum-600 text-white ring-plum-600",
  },
  "Worth Exploring": {
    pill: "bg-blush-50 text-blush-700 ring-blush-200",
    dot: "bg-blush-400",
    stroke: "#e3887c",
    card: "ring-1 ring-line",
    chipActive: "bg-blush-500 text-white ring-blush-500",
  },
  Low: {
    pill: "bg-stone-100 text-stone-600 ring-stone-200",
    dot: "bg-stone-400",
    stroke: "#a8a29e",
    card: "ring-1 ring-line",
    chipActive: "bg-stone-500 text-white ring-stone-500",
  },
};

export const TIERS: MatchTier[] = ["High Potential", "Strong", "Worth Exploring", "Low"];

export function tierTone(tier: MatchTier): TierTone {
  return TIER_TONES[tier] ?? TIER_TONES.Low;
}

export const OUTCOME_TONES: Record<MatchOutcome, string> = {
  Pending: "bg-stone-100 text-stone-700 ring-stone-200",
  Accepted: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Declined: "bg-blush-50 text-blush-700 ring-blush-200",
  Met: "bg-gold-50 text-gold-700 ring-gold-300",
};

export const NOTE_TONES: Record<NoteType, string> = {
  Call: "bg-sky-50 text-sky-700 ring-sky-200",
  Meeting: "bg-gold-50 text-gold-700 ring-gold-200",
  General: "bg-plum-50 text-plum-700 ring-plum-200",
};

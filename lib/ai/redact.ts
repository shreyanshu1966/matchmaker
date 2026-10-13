/**
 * PII redaction. Everything sent to the LLM passes through here.
 * Removed: email, phone, last name (first name + initial only), exact date of
 * birth (age instead), birth time / birth place, internal ids and platform meta.
 */
import type { Note, Profile } from "../types";

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
// +91 98765 43210, 098765-43210, (022) 2345 6789, 9876543210 ...
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,5}\)[\s.-]?)?\d(?:[\s.-]?\d){9,13}/g;

/** Strip anything that looks like an email address or phone number from free text. */
export function scrubText(text: string | undefined | null): string {
  if (!text) return "";
  return text.replace(EMAIL_RE, "[email removed]").replace(PHONE_RE, "[phone removed]");
}

export function ageFromDob(dob: string, now: Date = new Date()): number {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age--;
  return age;
}

export function displayName(p: Pick<Profile, "firstName" | "lastName">): string {
  const initial = p.lastName?.trim()?.[0];
  return initial ? `${p.firstName} ${initial.toUpperCase()}.` : p.firstName;
}

const EDUCATION_LABEL: Record<number, string> = {
  1: "Diploma",
  2: "Bachelor's",
  3: "Master's/MBA",
  4: "Doctorate/MD",
};

export function educationLabel(level: number): string {
  return EDUCATION_LABEL[level] ?? "Unknown";
}

export function heightLabel(cm: number): string {
  const totalIn = Math.round(cm / 2.54);
  return `${Math.floor(totalIn / 12)}'${totalIn % 12}" (${cm} cm)`;
}

export type RedactedProfile = ReturnType<typeof redactProfile>;

export interface RedactOptions {
  /** Include caste / sub-caste. Pass false when nobody's preferences make it relevant (data minimisation). */
  includeCaste?: boolean;
}

/** Compact, LLM-safe view of a profile with the matchmaking-relevant fields. */
export function redactProfile(p: Profile, opts: RedactOptions = {}) {
  const pp = p.partnerPreferences;
  const includeCaste = opts.includeCaste ?? true;
  return {
    name: displayName(p),
    gender: p.gender,
    age: ageFromDob(p.dob),
    location: { city: p.city, state: p.state, country: p.country, nativePlace: p.nativePlace },
    height: heightLabel(p.heightCm),
    bodyType: p.bodyType,
    maritalStatus: p.maritalStatus,
    religion: p.religion,
    caste: includeCaste ? p.caste : undefined,
    religiosity: `${p.religiosity}/5`,
    motherTongue: p.motherTongue,
    languages: p.languages,
    manglik: p.manglik,
    horoscopeMatchRequired: p.horoscopeMatchRequired,
    education: {
      level: educationLabel(p.educationLevel),
      degree: p.degree,
      college: p.ugCollege,
      postGrad: p.postGradDegree
        ? `${p.postGradDegree}${p.postGradCollege ? `, ${p.postGradCollege}` : ""}`
        : undefined,
    },
    career: {
      profession: p.profession,
      designation: p.designation,
      company: p.company,
      incomeLpa: p.incomeLpa,
      workMode: p.workMode,
      ambition: p.careerAmbition,
      residencyStatus: p.residencyStatus,
    },
    family: {
      type: p.familyType,
      values: p.familyValues,
      siblings: scrubText(p.siblings),
      father: p.fatherOccupation,
      mother: p.motherOccupation,
      livingWithParentsAfterMarriage: p.livingWithParentsAfterMarriage,
    },
    lifestyle: {
      diet: p.diet,
      smoking: p.smoking,
      drinking: p.drinking,
      fitness: p.fitness,
      hobbies: p.hobbies,
    },
    wantsKids: p.wantKids,
    openToRelocate: p.openToRelocate,
    openToPets: p.openToPets,
    timelineToMarry: p.timelineToMarry,
    profileManagedBy: p.profileManagedBy,
    verified: p.verified,
    aboutMe: scrubText(p.aboutMe),
    partnerPreferences: {
      ageRange: `${pp.ageMin}-${pp.ageMax}`,
      heightRangeCm: `${pp.heightMinCm}-${pp.heightMaxCm}`,
      religions: pp.religions.length ? pp.religions : "open",
      castes: !includeCaste ? undefined : pp.castes.length ? pp.castes : "caste no bar",
      maritalStatuses: pp.maritalStatuses.length ? pp.maritalStatuses : "any",
      diets: pp.diets.length ? pp.diets : "any",
      cities: pp.cities.length ? pp.cities : "anywhere",
      minEducation: educationLabel(pp.minEducationLevel),
      minIncomeLpa: pp.minIncomeLpa || "no preference",
      dealbreakers: pp.dealbreakers,
    },
  };
}

/** Note bodies only (no author / ids), PII-scrubbed, oldest first, with a short date. */
export function redactNotes(notes: Note[]): { date: string; type: string; text: string }[] {
  return [...notes]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((n) => ({ date: n.createdAt.slice(0, 10), type: n.type, text: scrubText(n.body).trim() }))
    .filter((n) => n.text.length > 0);
}

/** True when the customer's own preferences make religion / caste a legitimate topic. */
export function communityIsRelevant(p: Profile): { religion: boolean; caste: boolean } {
  const pp = p.partnerPreferences;
  return {
    religion: pp.religions.length > 0 || pp.dealbreakers.includes("different-religion"),
    caste: pp.castes.length > 0 || pp.dealbreakers.includes("different-caste"),
  };
}

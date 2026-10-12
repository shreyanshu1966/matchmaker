/**
 * Stage 1: hard filters (dealbreakers).
 *
 * Only things a person has said they will NOT compromise on are applied here;
 * everything else is a soft, weighted score in Stage 2. This keeps the funnel
 * wide (a 1 cm or 1-year miss never hides someone) while still honouring
 * genuine non-negotiables.
 *
 * Filters are RECIPROCAL: we check the customer's dealbreakers against the
 * candidate AND the candidate's dealbreakers against the customer. Suggesting
 * someone who would reject the customer outright wastes everyone's time.
 *
 * Every exclusion carries a human-readable reason so the matchmaker can answer
 * "why wasn't X suggested?".
 */
import type { Dealbreaker, Profile } from "../types";
import { ageFromDob, sameText } from "./utils";

export interface FilterResult {
  passed: boolean;
  reasons: string[];
}

export interface FilterOptions {
  excludeIds?: string[];
  now?: Date;
}

/**
 * Age tolerance (years) around a stated preference range. Stated ranges are
 * often round numbers ("25–30"), and a 31-year-old can still be a great match,
 * so we only hard-exclude beyond ±2 years; the soft age scorer handles the rest.
 */
export const AGE_TOLERANCE_YEARS = 2;

const HABIT_TEXT = { Never: "never", Occasionally: "occasionally", Regularly: "regularly" } as const;

/** Manglik compatibility: only a clear Yes vs No is a mismatch; Partial / Don't Know pass. */
function manglikMismatch(a: Profile, b: Profile): boolean {
  return (a.manglik === "Yes" && b.manglik === "No") || (a.manglik === "No" && b.manglik === "Yes");
}

/**
 * Checks ONE direction: does `other` violate any of `person`'s non-negotiables?
 * Returns human-readable reasons (empty = no violation).
 */
export function dealbreakerViolations(person: Profile, other: Profile, now: Date = new Date()): string[] {
  const reasons: string[] = [];
  const p = person.firstName;
  const o = other.firstName;
  const prefs = person.partnerPreferences;
  const has = (d: Dealbreaker) => prefs.dealbreakers.includes(d);

  if (has("smoking") && other.smoking !== "Never") {
    reasons.push(`${o} smokes ${HABIT_TEXT[other.smoking]}; ${p} listed smoking as a dealbreaker`);
  }
  if (has("drinking") && other.drinking !== "Never") {
    reasons.push(`${o} drinks ${HABIT_TEXT[other.drinking]}; ${p} listed drinking as a dealbreaker`);
  }
  if (has("non-vegetarian") && other.diet === "Non-Vegetarian") {
    reasons.push(`${o} is non-vegetarian; ${p} needs a vegetarian-friendly partner`);
  }
  // Religion is only a HARD rule when the person explicitly made it one.
  // Accepted set = their stated list, or their own religion if the list is empty.
  if (has("different-religion")) {
    const accepted = prefs.religions.length > 0 ? prefs.religions : [person.religion];
    if (!accepted.includes(other.religion)) {
      reasons.push(`${o} is ${other.religion}; ${p} only considers ${accepted.join("/")} partners`);
    }
  }
  if (has("different-caste")) {
    const accepted = prefs.castes.length > 0 ? prefs.castes : [person.caste];
    if (!accepted.some((c) => sameText(c, other.caste))) {
      reasons.push(`${o}'s caste (${other.caste}) is outside ${p}'s non-negotiable list (${accepted.join(", ")})`);
    }
  }
  if (has("divorced") && (other.maritalStatus === "Divorced" || other.maritalStatus === "Awaiting Divorce")) {
    reasons.push(`${o} is ${other.maritalStatus.toLowerCase()}; ${p} listed this as a dealbreaker`);
  }
  // Horoscope only matters when the person actually requires a horoscope match.
  if (has("manglik-mismatch") && person.horoscopeMatchRequired && manglikMismatch(person, other)) {
    reasons.push(
      `Manglik mismatch (${p}: ${person.manglik}, ${o}: ${other.manglik}); ${p} requires horoscope matching`,
    );
  }
  if (has("no-relocation") && !sameText(person.city, other.city) && other.openToRelocate === "No") {
    reasons.push(`${o} lives in ${other.city} and won't relocate; ${p} (${person.city}) needs a partner who can`);
  }
  if (has("doesnt-want-kids") && other.wantKids === "No") {
    reasons.push(`${o} doesn't want children; ${p} does`);
  }
  if (has("wants-kids") && other.wantKids === "Yes") {
    reasons.push(`${o} wants children; ${p} doesn't`);
  }

  // Marital status preference (PLAN §4: "marital-status compatibility, per preference").
  if (prefs.maritalStatuses.length > 0 && !prefs.maritalStatuses.includes(other.maritalStatus)) {
    reasons.push(`${o} is ${other.maritalStatus.toLowerCase()}; ${p} is looking for ${prefs.maritalStatuses.join("/")}`);
  }

  // Age: outside the stated range by MORE than the tolerance.
  const age = ageFromDob(other.dob, now);
  if (age < prefs.ageMin - AGE_TOLERANCE_YEARS || age > prefs.ageMax + AGE_TOLERANCE_YEARS) {
    reasons.push(`${o} is ${age}, well outside ${p}'s preferred age range of ${prefs.ageMin}–${prefs.ageMax}`);
  }

  return reasons;
}

/**
 * Full Stage-1 check for one (customer, candidate) pair, in both directions.
 */
export function applyHardFilters(customer: Profile, candidate: Profile, opts: FilterOptions = {}): FilterResult {
  const now = opts.now ?? new Date();
  const reasons: string[] = [];

  if (candidate.id === customer.id) reasons.push("Same person");
  if (candidate.gender === customer.gender) reasons.push(`Same gender (${candidate.gender})`);
  if (opts.excludeIds?.includes(candidate.id)) reasons.push(`Already introduced to ${customer.firstName}`);

  // Bail out early for structural exclusions: dealbreaker text would be noise.
  if (reasons.length > 0) return { passed: false, reasons };

  reasons.push(...dealbreakerViolations(customer, candidate, now));
  // Reverse direction: the candidate's own non-negotiables.
  reasons.push(...dealbreakerViolations(candidate, customer, now).map((r) => `Their side: ${r}`));

  return { passed: reasons.length === 0, reasons };
}

/**
 * Deterministic seed generator for the matchmaker demo.
 *   npm run seed
 * Writes data/seed/{profiles,matchmakers,notes,matchActions}.json
 */
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import type {
  BodyType, Dealbreaker, Diet, EducationLevel, FamilyValues, Gender, Habit, Level, Manglik, MaritalStatus, MatchAction,
  MatchTier, Matchmaker, Note, PartnerPreferences, Profile, ProfileManagedBy, Religion, YesNoMaybe, MarriageTimeline,
} from "../lib/types";
import { Rng, clamp, type Weighted } from "./seed/rng";
import { COMMUNITIES, type Community } from "./seed/communities";
import { INDIAN_CITIES, METRO_WEIGHTS, NRI_PLACES, type NriPlace } from "./seed/places";
import { TRACKS, TRACK_BY_KEY, type Career, type CareerCtx } from "./seed/careers";
import { FATHER_OCC, MOTHER_OCC, NAKSHATRAS, RASHIS, makeAboutMe, pickHobbies } from "./seed/text";
import { PERSONAS, type Persona } from "./seed/clients";

faker.seed(42);
const rng = new Rng(42);

/** Reference "now" for the demo: 2026-10-12 noon IST */
const NOW = Date.parse("2026-10-12T06:30:00.000Z");
const DAY = 86_400_000;

const MATCHMAKERS = [
  { id: "mm_priya", username: "priya", name: "Priya Sharma" },
  { id: "mm_arjun", username: "arjun", name: "Arjun Mehta" },
];

const COMMUNITY_BY_KEY: Record<string, Community> = Object.fromEntries(COMMUNITIES.map((c) => [c.key, c]));
const usedEmails = new Set<string>();
const usedPhones = new Set<string>();
const usedNames = new Set<string>();

// ---------------- helpers ----------------

function iso(ms: number) {
  return new Date(ms).toISOString();
}

function dobForAge(age: number): string {
  const ref = new Date(NOW);
  const latest = Date.UTC(ref.getUTCFullYear() - age, ref.getUTCMonth(), ref.getUTCDate());
  const earliest = Date.UTC(ref.getUTCFullYear() - age - 1, ref.getUTCMonth(), ref.getUTCDate()) + DAY;
  const t = earliest + Math.floor(rng.next() * ((latest - earliest) / DAY)) * DAY;
  return new Date(t).toISOString().slice(0, 10);
}

function makeEmail(first: string, last: string): string {
  const clean = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z]/g, "");
  const f = clean(first), l = clean(last);
  const variants = [`${f}.${l}`, `${f}${l}`, `${f}.${l}${faker.number.int({ min: 1, max: 99 })}`, `${f[0]}${l}${faker.number.int({ min: 10, max: 999 })}`, `${f}_${l}${faker.number.int({ min: 100, max: 999 })}`];
  let e = `${rng.chance(0.55) ? variants[0] : rng.pick(variants)}@example.com`;
  while (usedEmails.has(e)) e = `${f}.${l}${faker.number.int({ min: 100, max: 9999 })}@example.com`;
  usedEmails.add(e);
  return e;
}

function makePhone(): string {
  let p = "";
  do p = `+91 9${faker.string.numeric(9)}`;
  while (usedPhones.has(p));
  usedPhones.add(p);
  return p;
}

function habit(w: [number, number, number]): Habit {
  return rng.weighted<Habit>([["Never", w[0]], ["Occasionally", w[1]], ["Regularly", w[2]]]);
}

function ynm(w: [number, number, number]): YesNoMaybe {
  return rng.weighted<YesNoMaybe>([["Yes", w[0]], ["Maybe", w[1]], ["No", w[2]]]);
}

function makeSiblings(age: number): string {
  const n = rng.weighted<number>([[0, 17], [1, 50], [2, 25], [3, 8]]);
  if (n === 0) return rng.pick(["Only child", "No siblings"]);
  const parts: string[] = [];
  const groups: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    const elder = rng.chance(0.5);
    const sex = rng.chance(0.5) ? "brother" : "sister";
    const married = elder ? rng.chance(age >= 28 ? 0.75 : 0.4) : rng.chance(age >= 32 ? 0.35 : 0.08);
    const key = `${elder ? "elder" : "younger"} ${sex}${married ? " (married)" : ""}`;
    groups[key] = (groups[key] ?? 0) + 1;
  }
  for (const [k, c] of Object.entries(groups).sort(([a], [b]) => (a < b ? -1 : 1))) {
    parts.push(c === 1 ? `1 ${k}` : `${c} ${k.replace(/(brother|sister)/, "$1s").replace(/\(married\)/, "(both married)")}`);
  }
  return parts.join(", ");
}

function eduOk(level: number): EducationLevel {
  return clamp(Math.round(level), 1, 4) as EducationLevel;
}

const SOUTH = new Set(["Tamil", "Telugu", "Kannada", "Malayalam", "Tulu", "Konkani"]);

// ---------------- core profile generator ----------------

interface Spec {
  id: string;
  gender: Gender;
  isClient: boolean;
  persona?: Persona;
}

function genProfile(spec: Spec): Profile {
  const { gender, persona } = spec;
  const P = persona;

  // --- community & names
  const community = P ? COMMUNITY_BY_KEY[P.community] : rng.weighted(COMMUNITIES.map((c) => [c, c.weight] as const));
  if (!community) throw new Error(`Unknown community ${P?.community}`);
  let firstName = "", lastName = "";
  for (let tries = 0; tries < 8; tries++) {
    firstName = P?.firstName ?? rng.pick(gender === "Male" ? community.male : community.female);
    lastName = P?.lastName ?? rng.pick(community.last);
    if (!P && community.religion === "Sikh" && rng.chance(0.15)) lastName = gender === "Male" ? "Singh" : "Kaur";
    if (!usedNames.has(`${firstName} ${lastName}`)) break;
  }
  usedNames.add(`${firstName} ${lastName}`);

  // --- age & marital status
  const age = P?.age ?? (gender === "Male" ? Math.round(clamp(rng.normal(30.5, 3.4), 24, 40)) : Math.round(clamp(rng.normal(28.3, 2.9), 24, 38)));
  let maritalStatus: MaritalStatus = "Never Married";
  if (age >= 28) maritalStatus = rng.weighted<MaritalStatus>([["Never Married", 88], ["Divorced", 8], ["Awaiting Divorce", 2], ["Widowed", 2]]);

  // --- location
  const nativePlace = rng.pick(community.nativePlaces);
  const homeState = nativePlace.split(", ")[1];
  let country = "India", city: string, state: string;
  let nri = false;
  if (P?.nri) {
    nri = true;
    country = P.nri.country;
    city = P.city;
    state = P.nri.state;
  } else if (P) {
    city = P.city;
    state = INDIAN_CITIES[city].state;
  } else if (rng.chance(0.12)) {
    nri = true;
    const place: NriPlace = rng.weighted(NRI_PLACES);
    country = place.country;
    city = place.city;
    state = place.state;
  } else {
    city = rng.chance(0.42) ? rng.pick(community.localCities) : rng.weighted(METRO_WEIGHTS);
    state = INDIAN_CITIES[city].state;
  }

  // --- career
  const tier = rng.weighted<1 | 2 | 3>(nri ? [[1, 35], [2, 45], [3, 20]] : [[1, 17], [2, 36], [3, 47]]);
  const track = P
    ? TRACK_BY_KEY[P.track]
    : rng.weighted(
        TRACKS.filter((t) => !nri || t.nriOk).map((t) => {
          let w = gender === "Male" ? t.weightM : t.weightF;
          if (t.key === "business") w *= 0.4 + 4 * (community.business ?? 0);
          return [t, w] as const;
        }),
      );
  const ctx: CareerCtx = { rng, gender, age, tier, homeState, city, country, lastName, nri };
  // business families tend to stay local
  let career: Career = track.build(ctx);
  if (P?.career) career = { ...career, ...P.career };

  // --- physical
  const hAdj = community.heightAdj ?? 0;
  const heightCm = Math.round(gender === "Male" ? clamp(rng.normal(174 + hAdj, 7), 156, 196) : clamp(rng.normal(160 + hAdj * 0.7, 6), 145, 181));
  const fitness = rng.weighted<Level>([["Low", 20], ["Medium", 55], ["High", 25]]);
  const bodyType: BodyType =
    fitness === "High" ? rng.weighted<BodyType>([["Athletic", 60], ["Slim", 35], ["Average", 5]])
    : fitness === "Medium" ? rng.weighted<BodyType>([["Average", 50], ["Slim", 35], ["Athletic", 12], ["Heavy", 3]])
    : rng.weighted<BodyType>([["Average", 55], ["Heavy", 30], ["Slim", 15]]);

  // --- religion & values
  let religiosity = clamp(Math.round(rng.normal(community.religiosity, 0.85)), 1, 5) as 1 | 2 | 3 | 4 | 5;
  if (nri && religiosity > 1 && rng.chance(0.3)) religiosity = (religiosity - 1) as 1 | 2 | 3 | 4;
  let religion: Religion = community.religion;
  if (religiosity === 1 && rng.chance(0.45) && religion !== "Parsi") religion = "No Religion";
  const familyValues: FamilyValues =
    religiosity >= 4 ? rng.weighted<FamilyValues>([["Traditional", 60], ["Moderate", 35], ["Liberal", 5]])
    : religiosity === 3 ? rng.weighted<FamilyValues>([["Traditional", 18], ["Moderate", 62], ["Liberal", 20]])
    : rng.weighted<FamilyValues>([["Traditional", 3], ["Moderate", 40], ["Liberal", 57]]);
  const isBusinessFamily = career.profession === "Business" || rng.chance(community.business ?? 0.1);
  const familyType = rng.chance(0.15 + (isBusinessFamily ? 0.3 : 0) + (familyValues === "Traditional" ? 0.2 : 0)) ? "Joint" : "Nuclear";

  // --- lifestyle
  let diet: Diet = rng.weighted(community.diet);
  if (familyValues === "Liberal" && diet === "Vegetarian" && rng.chance(0.2)) diet = "Eggetarian";
  if (diet === "Jain" && religion !== "Jain" && community.key !== "marwari") diet = "Vegetarian";
  const lib = familyValues === "Liberal" ? 1 : familyValues === "Moderate" ? 0.5 : 0;
  let smoking: Habit = gender === "Male" ? habit([80 - 10 * lib, 15 + 7 * lib, 5 + 3 * lib]) : habit([95 - 5 * lib, 4 + 4 * lib, 1 + lib]);
  let drinking: Habit = gender === "Male" ? habit([55 - 30 * lib, 40 + 25 * lib, 5 + 5 * lib]) : habit([80 - 40 * lib, 19 + 36 * lib, 1 + 4 * lib]);
  if (religion === "Muslim" && rng.chance(0.93)) drinking = "Never";
  if (religion === "Sikh" && rng.chance(0.95)) smoking = "Never";
  if (religion === "Jain" && rng.chance(0.8)) { drinking = "Never"; smoking = "Never"; }
  if (religiosity >= 5 && rng.chance(0.7)) drinking = "Never";
  if (career.profession === "Medicine" && smoking === "Regularly") smoking = "Occasionally";

  const hobbies = pickHobbies(rng, gender, fitness);

  // --- languages
  const languages = new Set<string>([community.motherTongue]);
  for (const l of community.extraLangs ?? []) languages.add(l);
  languages.add("English");
  if (!SOUTH.has(community.motherTongue) || rng.chance(0.55)) languages.add("Hindi");
  if (country === "India") {
    const cl = INDIAN_CITIES[city]?.lang;
    if (cl && cl !== community.motherTongue && rng.chance(0.25)) languages.add(cl);
  }
  if (country === "Canada" && rng.chance(0.1)) languages.add("French");

  // --- sub-caste & gotra
  let subCaste: string | undefined = community.subCastes ? rng.pick(community.subCastes) : undefined;
  if (community.subCastes?.includes(lastName)) subCaste = lastName;
  if (community.key === "tamil_brahmin") {
    if (lastName === "Iyengar") subCaste = rng.pick(["Iyengar (Vadakalai)", "Iyengar (Thenkalai)"]);
    else if (lastName === "Iyer") subCaste = rng.pick(["Iyer (Vadama)", "Iyer (Brahacharanam)"]);
  }
  if (community.key === "marwari") subCaste = lastName === "Maheshwari" ? "Maheshwari" : lastName === "Khandelwal" ? "Khandelwal" : "Agarwal";
  let gotra: string | undefined;
  if (community.gotras && (religion === "Hindu" || religion === "No Religion") && rng.chance(0.9)) {
    gotra = community.gotras.includes(lastName) ? lastName : rng.pick(community.gotras);
  }

  // --- horoscope
  const hinduLike = community.religion === "Hindu" || community.religion === "Jain";
  let manglik: Manglik = "Don't Know";
  let rashi: string | undefined, nakshatra: string | undefined, birthTime: string | undefined, birthPlace: string | undefined;
  let horoscopeMatchRequired = false;
  if (hinduLike && religion !== "No Religion") {
    manglik = rng.weighted<Manglik>([["No", 60], ["Yes", 14], ["Partial", 10], ["Don't Know", 16]]);
    if (rng.chance(0.85)) {
      rashi = rng.pick(RASHIS);
      nakshatra = rng.pick(NAKSHATRAS);
    }
    if (rng.chance(0.75)) {
      birthTime = `${String(rng.int(0, 23)).padStart(2, "0")}:${String(faker.number.int({ min: 0, max: 59 })).padStart(2, "0")}`;
      birthPlace = nativePlace.split(",")[0];
    }
    const prop = (community.horoscope ?? 0.2) * (religiosity >= 4 ? 1.4 : religiosity <= 2 ? 0.35 : 1) * (familyValues === "Liberal" ? 0.5 : 1);
    horoscopeMatchRequired = rng.chance(clamp(prop, 0, 0.95));
  } else if (religion === "Sikh") {
    manglik = rng.weighted<Manglik>([["Don't Know", 70], ["No", 30]]);
  }

  // --- family
  const fatherOccupation = isBusinessFamily ? `Businessman (${rng.pick(["textile trading", "manufacturing", "real estate", "jewellery", "pharma distribution", "hardware", "exports", "hotels"])})` : rng.pick(FATHER_OCC);
  const motherOccupation = rng.pick(MOTHER_OCC);
  const livingWithParentsAfterMarriage: YesNoMaybe =
    familyType === "Joint" ? ynm([60, 30, 10]) : familyValues === "Traditional" ? ynm([40, 40, 20]) : familyValues === "Liberal" ? ynm([10, 35, 55]) : ynm([22, 45, 33]);

  // --- intentions
  const wantKids: YesNoMaybe = familyValues === "Traditional" ? ynm([90, 9, 1]) : familyValues === "Liberal" ? ynm([55, 30, 15]) : ynm([75, 20, 5]);
  const openToRelocate: YesNoMaybe = isBusinessFamily && career.profession === "Business" ? ynm([10, 25, 65]) : gender === "Male" ? (nri ? ynm([15, 30, 55]) : ynm([30, 37, 33])) : ynm([45, 40, 15]);
  const openToPets: YesNoMaybe = ynm([40, 35, 25]);
  const timelineToMarry: MarriageTimeline = age >= 31 ? rng.weighted<MarriageTimeline>([["0-6 months", 40], ["6-12 months", 45], ["1-2 years", 15]]) : age <= 26 ? rng.weighted<MarriageTimeline>([["0-6 months", 10], ["6-12 months", 35], ["1-2 years", 55]]) : rng.weighted<MarriageTimeline>([["0-6 months", 22], ["6-12 months", 48], ["1-2 years", 30]]);
  const profileManagedBy: ProfileManagedBy = familyValues === "Traditional" ? rng.weighted<ProfileManagedBy>([["Self", 40], ["Parent", 48], ["Sibling", 7], ["Relative", 5]]) : rng.weighted<ProfileManagedBy>([["Self", 72], ["Parent", 20], ["Sibling", 6], ["Relative", 2]]);
  const corporate = !["Business", "Medicine", "Government", "Education"].includes(career.profession);
  const verified = {
    id: spec.isClient ? true : rng.chance(0.7),
    linkedin: rng.chance(corporate ? 0.6 : 0.25),
    income: spec.isClient ? rng.chance(0.75) : rng.chance(0.35),
  };
  const careerAmbition: Level = tier === 1 || career.incomeLpa > 40 ? rng.weighted<Level>([["High", 65], ["Medium", 33], ["Low", 2]]) : rng.weighted<Level>([["High", 28], ["Medium", 60], ["Low", 12]]);
  const residencyStatus = P?.nri?.residency ?? (nri ? rng.weighted<Profile["residencyStatus"]>([["Work Visa", 50], ["Permanent Resident", 30], ["Citizen", 18], ["Student Visa", 2]]) : "Citizen");

  // --- dates
  const createdMs = P ? NOW - P.createdDaysAgo * DAY - rng.int(0, 8) * 3_600_000 : NOW - rng.float(1, 90) * DAY;
  const lastActMs = P ? createdMs : createdMs + (NOW - createdMs) * Math.sqrt(rng.next());

  let p: Profile = {
    id: spec.id,
    firstName, lastName, gender,
    dob: dobForAge(age),
    country, city, state,
    heightCm,
    email: makeEmail(firstName, lastName),
    phone: makePhone(),
    ugCollege: career.ugCollege,
    degree: career.degree,
    incomeLpa: career.incomeLpa,
    company: career.company,
    designation: career.designation,
    maritalStatus,
    languages: [...languages],
    siblings: makeSiblings(age),
    caste: community.caste,
    religion,
    wantKids, openToRelocate, openToPets,
    motherTongue: community.motherTongue,
    ...(subCaste ? { subCaste } : {}),
    ...(gotra ? { gotra } : {}),
    nativePlace,
    manglik,
    ...(rashi ? { rashi } : {}),
    ...(nakshatra ? { nakshatra } : {}),
    ...(birthTime ? { birthTime } : {}),
    ...(birthPlace ? { birthPlace } : {}),
    horoscopeMatchRequired,
    ...(career.postGradDegree ? { postGradDegree: career.postGradDegree, postGradCollege: career.postGradCollege } : {}),
    educationLevel: career.educationLevel,
    profession: career.profession,
    workMode: career.workMode,
    careerAmbition,
    residencyStatus,
    familyType, familyValues, fatherOccupation, motherOccupation, livingWithParentsAfterMarriage,
    diet, smoking, drinking, fitness, bodyType, hobbies, religiosity, profileManagedBy, verified, timelineToMarry,
    aboutMe: "",
    partnerPreferences: undefined as unknown as PartnerPreferences,
    isClient: spec.isClient,
    createdAt: iso(createdMs),
    lastActivityAt: iso(lastActMs),
  };

  if (P?.overrides) p = { ...p, ...P.overrides };
  if (P) {
    p.status = P.status;
    p.assignedTo = P.mm;
    if (p.maritalStatus !== "Never Married") p.siblings = p.siblings; // unchanged
  }
  // keep optional keys clean if overrides set them undefined
  for (const k of Object.keys(p) as (keyof Profile)[]) if (p[k] === undefined && k !== "partnerPreferences") delete p[k];

  p.aboutMe = makeAboutMe(rng, p);
  p.partnerPreferences = { ...genPrefs(p), ...(P?.prefs ?? {}) };
  return p;
}

// ---------------- partner preferences ----------------

function genPrefs(p: Profile): PartnerPreferences {
  const age = ageOf(p);
  const male = p.gender === "Male";
  const ageMin = male ? Math.max(22, age - rng.int(4, 7)) : Math.max(23, age - rng.weighted<number>([[0, 35], [1, 40], [2, 25]]));
  const ageMax = male ? age + rng.weighted<number>([[0, 50], [1, 30], [2, 20]]) : age + rng.int(4, 7);
  const heightMinCm = male ? rng.int(148, 156) : clamp(p.heightCm + rng.int(2, 9), 160, 182);
  const heightMaxCm = male ? clamp(p.heightCm + rng.weighted<number>([[-6, 20], [-3, 30], [0, 30], [3, 20]]), 160, 190) : rng.int(185, 198);

  const fv = p.familyValues;
  const pReligion = fv === "Traditional" ? 0.85 : fv === "Moderate" ? 0.5 : 0.15;
  let religions: Religion[] = [];
  const baseRel: Religion = p.religion === "No Religion" ? "Hindu" : p.religion;
  if (p.religion !== "No Religion" && rng.chance(pReligion)) {
    religions = [baseRel];
    if (baseRel === "Sikh" && rng.chance(0.4)) religions.push("Hindu");
    if (baseRel === "Jain" && rng.chance(0.4)) religions.push("Hindu");
    if (baseRel === "Hindu" && rng.chance(0.15)) religions.push(rng.pick<Religion>(["Jain", "Sikh"]));
    if (baseRel === "Buddhist" && rng.chance(0.4)) religions.push("Hindu");
  }
  const pCaste = fv === "Traditional" ? 0.55 : fv === "Moderate" ? 0.18 : 0.04;
  let castes: string[] = [];
  if (religions.length && rng.chance(pCaste)) castes = [p.caste];

  const maritalStatuses: MaritalStatus[] =
    p.maritalStatus === "Never Married" ? (rng.chance(fv === "Liberal" ? 0.45 : 0.75) ? ["Never Married"] : []) : rng.chance(0.6) ? [] : ["Never Married", "Divorced", "Awaiting Divorce", "Widowed"].filter(() => true) as MaritalStatus[];

  let diets: Diet[] = [];
  if (p.diet === "Jain") diets = rng.chance(0.75) ? ["Jain", "Vegetarian"] : [];
  else if (p.diet === "Vegetarian") diets = rng.chance(fv === "Liberal" ? 0.3 : 0.6) ? ["Vegetarian", "Jain", "Vegan", ...(rng.chance(0.4) ? (["Eggetarian"] as Diet[]) : [])] : [];
  else if (p.diet === "Vegan") diets = rng.chance(0.4) ? ["Vegan", "Vegetarian", "Jain"] : [];
  else if (p.diet === "Eggetarian") diets = rng.chance(0.25) ? ["Eggetarian", "Vegetarian", "Jain", "Vegan"] : [];

  let cities: string[] = [];
  if (p.country === "India") {
    if (p.openToRelocate === "No" || rng.chance(0.25)) {
      const sameState = Object.entries(INDIAN_CITIES).filter(([c, v]) => v.state === p.state && c !== p.city).map(([c]) => c);
      const ncr = ["Delhi", "Gurugram", "Noida"];
      cities = ncr.includes(p.city) ? ncr : [p.city, ...rng.sample(sameState, rng.int(0, 1))];
    } else if (rng.chance(0.2)) {
      cities = Array.from(new Set([p.city, ...rng.sample(["Mumbai", "Bangalore", "Pune", "Hyderabad", "Delhi", "Gurugram", "Chennai"], 2)]));
    }
  } else if (rng.chance(0.3)) {
    cities = [p.city];
  }

  const minEducationLevel: EducationLevel = male
    ? rng.weighted<EducationLevel>([[1, 10], [2, 75], [3, 15]])
    : eduOk(Math.max(2, p.educationLevel - (rng.chance(0.55) ? 0 : 1)));

  let minIncomeLpa = 0;
  if (!male && rng.chance(0.65)) minIncomeLpa = Math.max(5, Math.round((p.incomeLpa * rng.float(0.7, 1.2)) / 5) * 5);
  else if (male && rng.chance(0.12)) minIncomeLpa = rng.pick([3, 4, 5, 6, 8]);

  // dealbreakers, rooted in own attributes
  const cand: [Dealbreaker, number][] = [];
  if (p.smoking === "Never") cand.push(["smoking", male ? 0.45 : 0.75]);
  if (p.drinking === "Never") cand.push(["drinking", 0.5]);
  if (["Vegetarian", "Jain", "Vegan"].includes(p.diet)) cand.push(["non-vegetarian", 0.65]);
  if (religions.length && p.religiosity >= 4) cand.push(["different-religion", 0.55]);
  if (castes.length) cand.push(["different-caste", 0.5]);
  if (maritalStatuses.length === 1 && maritalStatuses[0] === "Never Married" && fv === "Traditional") cand.push(["divorced", 0.4]);
  if (p.horoscopeMatchRequired) cand.push(["manglik-mismatch", 0.6]);
  if (p.openToRelocate === "No") cand.push(["no-relocation", 0.35]);
  if (p.wantKids === "Yes") cand.push(["doesnt-want-kids", 0.4]);
  if (p.wantKids === "No") cand.push(["wants-kids", 0.7]);
  const want = rng.weighted<number>([[0, 8], [1, 37], [2, 37], [3, 18]]);
  const dealbreakers: Dealbreaker[] = [];
  for (const [d, prob] of rng.shuffle(cand)) {
    if (dealbreakers.length >= want) break;
    if (rng.chance(prob)) dealbreakers.push(d);
  }
  if (dealbreakers.includes("divorced")) {
    // keep consistent with marital preference
    if (!maritalStatuses.length) maritalStatuses.push("Never Married");
  }

  return { ageMin, ageMax, heightMinCm, heightMaxCm, religions, castes, maritalStatuses, diets, cities, minEducationLevel, minIncomeLpa, dealbreakers };
}

function ageOf(p: Pick<Profile, "dob">): number {
  const d = new Date(p.dob + "T00:00:00Z");
  const ref = new Date(NOW);
  let a = ref.getUTCFullYear() - d.getUTCFullYear();
  if (ref.getUTCMonth() < d.getUTCMonth() || (ref.getUTCMonth() === d.getUTCMonth() && ref.getUTCDate() < d.getUTCDate())) a--;
  return a;
}

// ---------------- build everything ----------------

const pool: Profile[] = [];
for (let i = 1; i <= 160; i++) pool.push(genProfile({ id: `p_f_${String(i).padStart(3, "0")}`, gender: "Female", isClient: false }));
for (let i = 1; i <= 160; i++) pool.push(genProfile({ id: `p_m_${String(i).padStart(3, "0")}`, gender: "Male", isClient: false }));

const clients: Profile[] = [];
const notes: Note[] = [];
const matchActions: MatchAction[] = [];

function tierFor(score: number): MatchTier {
  return score >= 80 ? "High Potential" : score >= 65 ? "Strong" : score >= 50 ? "Worth Exploring" : "Low";
}

for (const persona of PERSONAS) {
  const c = genProfile({ id: persona.id, gender: persona.gender, isClient: true, persona });
  const mm = MATCHMAKERS.find((m) => m.id === persona.mm)!;
  const prefs = c.partnerPreferences;

  // seeded match history
  const chosen: Profile[] = [];
  (persona.actions ?? []).forEach((a, idx) => {
    const cands = pool
      .filter((x) => x.gender !== c.gender && !chosen.includes(x))
      .filter((x) => { const ag = ageOf(x); return ag >= prefs.ageMin && ag <= prefs.ageMax; })
      .filter((x) => !prefs.religions.length || prefs.religions.includes(x.religion))
      .filter((x) => !prefs.diets.length || prefs.diets.includes(x.diet))
      .filter((x) => !(prefs.dealbreakers.includes("smoking") && x.smoking !== "Never"));
    const scored = rng.shuffle(cands).map((x) => {
      let s = 0;
      if (prefs.cities.length ? prefs.cities.includes(x.city) : x.city === c.city) s += 5;
      else if (x.state === c.state) s += 1;
      if (a.preferCommunity && a.preferCommunity.some((k) => COMMUNITY_BY_KEY[k].caste === x.caste && COMMUNITY_BY_KEY[k].motherTongue === x.motherTongue)) s += 4;
      if (x.motherTongue === c.motherTongue) s += 1;
      if (x.maritalStatus === "Never Married" || c.maritalStatus !== "Never Married") s += 1;
      return { x, s };
    });
    scored.sort((p1, p2) => p2.s - p1.s);
    const pick = scored[0]?.x;
    if (!pick) throw new Error(`No candidate for ${persona.id} action ${idx}`);
    chosen.push(pick);
    const score = a.outcome === "Declined" ? rng.int(62, 74) : a.outcome === "Pending" ? rng.int(68, 84) : rng.int(78, 91);
    const sentMs = NOW - a.daysAgo * DAY - rng.int(1, 6) * 3_600_000;
    matchActions.push({
      id: `ma_${persona.id}_${idx + 1}`,
      customerId: c.id,
      matchId: pick.id,
      matchName: `${pick.firstName} ${pick.lastName}`,
      score,
      tier: tierFor(score),
      emailSubject: `An introduction: ${c.firstName}, meet ${pick.firstName}`,
      emailBody: `Dear ${c.firstName},\n\nI hope you're doing well. I'd like to introduce you to ${pick.firstName} ${pick.lastName}, ${pick.designation} at ${pick.company}, based in ${pick.city}. ${pick.firstName} enjoys ${pick.hobbies.slice(0, 2).join(" and ").toLowerCase()}, and I think the two of you would have a lot to talk about.\n\nHave a look at the profile and let me know your thoughts. Happy to set up a call if you're both keen.\n\nWarm regards,\n${mm.name}`,
      sentBy: mm.name,
      sentAt: iso(sentMs),
      outcome: a.outcome,
    });
  });

  let latest = Date.parse(c.createdAt);
  persona.notes.forEach((n, idx) => {
    const at = NOW - n.daysAgo * DAY - rng.int(1, 9) * 3_600_000 - rng.int(0, 59) * 60_000;
    latest = Math.max(latest, at);
    let body = n.body;
    chosen.forEach((x, i) => (body = body.replaceAll(`{M${i + 1}}`, x.firstName)));
    if (/\{M\d\}/.test(body)) throw new Error(`Unresolved placeholder in ${persona.id}`);
    notes.push({ id: `n_${persona.id}_${idx + 1}`, customerId: c.id, authorId: mm.id, authorName: mm.name, type: n.type, body, createdAt: iso(at) });
  });
  for (const a of matchActions.filter((m) => m.customerId === c.id)) latest = Math.max(latest, Date.parse(a.sentAt));
  if (Date.parse(c.createdAt) > latest) latest = Date.parse(c.createdAt);
  c.lastActivityAt = iso(latest);
  clients.push(c);
}

const profiles = [...clients, ...pool];

// bcrypt salts are random, so reuse existing valid hashes to keep the output byte-for-byte stable
const prevMatchmakers: Matchmaker[] = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "seed", "matchmakers.json"), "utf8")); } catch { return []; }
})();
const matchmakers: Matchmaker[] = MATCHMAKERS.map((m) => {
  const prev = prevMatchmakers.find((x) => x.id === m.id)?.passwordHash;
  return { ...m, passwordHash: prev && bcrypt.compareSync("demo123", prev) ? prev : bcrypt.hashSync("demo123", 10) };
});

const outDir = path.join(process.cwd(), "data", "seed");
fs.mkdirSync(outDir, { recursive: true });
const write = (name: string, data: unknown) => fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2) + "\n", "utf8");
write("profiles.json", profiles);
write("matchmakers.json", matchmakers);
write("notes.json", notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
write("matchActions.json", matchActions);

// ---------------- summary ----------------
const count = <T,>(arr: T[], f: (x: T) => string) => arr.reduce<Record<string, number>>((acc, x) => ((acc[f(x)] = (acc[f(x)] ?? 0) + 1), acc), {});
console.log(`profiles: ${profiles.length} (pool F=${pool.filter((p) => p.gender === "Female").length}, M=${pool.filter((p) => p.gender === "Male").length}; clients=${clients.length})`);
console.log(`notes: ${notes.length}, matchActions: ${matchActions.length}, matchmakers: ${matchmakers.length}`);
void (null as unknown as Weighted<string>);

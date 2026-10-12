import type { PartnerPreferences, Profile } from "../../types";

/** Fixed reference date so ages never drift: 2026-06-01. */
export const NOW = new Date("2026-06-01T00:00:00Z");

/** DOB string for someone who is `age` on NOW. */
export function dobForAge(age: number): string {
  return `${2026 - age}-01-15`;
}

let seq = 0;

type Overrides = Partial<Omit<Profile, "partnerPreferences">> & { partnerPreferences?: Partial<PartnerPreferences> };

/** A neutral, fully-populated profile; override only what a test cares about. */
export function makeProfile(overrides: Overrides = {}): Profile {
  seq++;
  const gender = overrides.gender ?? "Female";
  const base: Profile = {
    id: `p${seq}`,
    firstName: gender === "Male" ? "Rahul" : "Ananya",
    lastName: "Test",
    gender,
    dob: dobForAge(gender === "Male" ? 31 : 28),
    country: "India",
    city: "Pune",
    state: "Maharashtra",
    heightCm: gender === "Male" ? 178 : 165,
    email: "x@example.com",
    phone: "+910000000000",
    ugCollege: "COEP",
    degree: "B.Tech",
    incomeLpa: gender === "Male" ? 25 : 18,
    company: "Acme",
    designation: "Engineer",
    maritalStatus: "Never Married",
    languages: ["English", "Hindi", "Marathi"],
    siblings: "1 sister",
    caste: "Brahmin",
    religion: "Hindu",
    wantKids: "Yes",
    openToRelocate: "Maybe",
    openToPets: "Yes",
    motherTongue: "Marathi",
    nativePlace: "Pune",
    manglik: "No",
    horoscopeMatchRequired: false,
    educationLevel: 3,
    profession: "Software",
    workMode: "Hybrid",
    careerAmbition: "Medium",
    residencyStatus: "Citizen",
    familyType: "Nuclear",
    familyValues: "Moderate",
    fatherOccupation: "Retired",
    motherOccupation: "Teacher",
    livingWithParentsAfterMarriage: "Maybe",
    diet: "Vegetarian",
    smoking: "Never",
    drinking: "Never",
    fitness: "Medium",
    bodyType: "Average",
    hobbies: ["Reading", "Trekking", "Cooking"],
    religiosity: 3,
    profileManagedBy: "Self",
    verified: { id: true, linkedin: false, income: false },
    timelineToMarry: "6-12 months",
    aboutMe: "",
    isClient: false,
    createdAt: "2026-01-01T00:00:00Z",
    lastActivityAt: "2026-01-01T00:00:00Z",
    partnerPreferences: {
      ageMin: gender === "Male" ? 24 : 27,
      ageMax: gender === "Male" ? 31 : 35,
      heightMinCm: gender === "Male" ? 150 : 170,
      heightMaxCm: gender === "Male" ? 175 : 190,
      religions: [],
      castes: [],
      maritalStatuses: [],
      diets: [],
      cities: [],
      minEducationLevel: 2,
      minIncomeLpa: 0,
      dealbreakers: [],
    },
  };
  const { partnerPreferences, ...rest } = overrides;
  return { ...base, ...rest, partnerPreferences: { ...base.partnerPreferences, ...partnerPreferences } };
}

export const ctx = { now: NOW };

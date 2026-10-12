/**
 * Shared domain types. This file is the contract between the data layer,
 * the matching engine, the AI layer and the UI. Change it deliberately.
 */

export type Gender = "Male" | "Female";
export type YesNoMaybe = "Yes" | "No" | "Maybe";
export type MaritalStatus = "Never Married" | "Divorced" | "Widowed" | "Awaiting Divorce";
export type Religion = "Hindu" | "Muslim" | "Sikh" | "Christian" | "Jain" | "Buddhist" | "Parsi" | "No Religion";
export type Diet = "Vegetarian" | "Non-Vegetarian" | "Eggetarian" | "Vegan" | "Jain";
export type Habit = "Never" | "Occasionally" | "Regularly";
export type FamilyType = "Nuclear" | "Joint";
export type FamilyValues = "Traditional" | "Moderate" | "Liberal";
export type Manglik = "Yes" | "No" | "Partial" | "Don't Know";
export type WorkMode = "Onsite" | "Hybrid" | "Remote";
export type Level = "Low" | "Medium" | "High";
export type ResidencyStatus = "Citizen" | "Permanent Resident" | "Work Visa" | "Student Visa";
export type ProfileManagedBy = "Self" | "Parent" | "Sibling" | "Relative";
export type MarriageTimeline = "0-6 months" | "6-12 months" | "1-2 years";
export type BodyType = "Slim" | "Athletic" | "Average" | "Heavy";
/** Education tier, used for parity scoring: 1 = Diploma, 2 = Bachelor's, 3 = Master's/MBA, 4 = Doctorate/MD */
export type EducationLevel = 1 | 2 | 3 | 4;

export type CustomerStatus =
  | "New"
  | "Onboarding"
  | "Profile Verified"
  | "Matching"
  | "Match Sent"
  | "Meeting Scheduled"
  | "In Conversation"
  | "Paused"
  | "Matched"
  | "Closed";

export const CUSTOMER_STATUSES: CustomerStatus[] = [
  "New",
  "Onboarding",
  "Profile Verified",
  "Matching",
  "Match Sent",
  "Meeting Scheduled",
  "In Conversation",
  "Paused",
  "Matched",
  "Closed",
];

/** Things a person has said they will not compromise on. Applied as hard filters. */
export type Dealbreaker =
  | "smoking"
  | "drinking"
  | "non-vegetarian"
  | "different-religion"
  | "different-caste"
  | "divorced"
  | "manglik-mismatch"
  | "no-relocation"
  | "doesnt-want-kids"
  | "wants-kids";

export interface PartnerPreferences {
  ageMin: number;
  ageMax: number;
  heightMinCm: number;
  heightMaxCm: number;
  /** Empty array = open to all */
  religions: Religion[];
  /** Empty array = "caste no bar" */
  castes: string[];
  /** Empty array = any */
  maritalStatuses: MaritalStatus[];
  /** Empty array = any */
  diets: Diet[];
  /** Empty array = anywhere */
  cities: string[];
  minEducationLevel: EducationLevel;
  /** Annual income lakhs per annum, 0 = no preference */
  minIncomeLpa: number;
  dealbreakers: Dealbreaker[];
}

export interface Profile {
  id: string;
  // ---- Required biodata (from the brief) ----
  firstName: string;
  lastName: string;
  gender: Gender;
  dob: string; // ISO date YYYY-MM-DD
  country: string;
  city: string;
  state: string;
  heightCm: number;
  email: string;
  phone: string;
  ugCollege: string;
  degree: string;
  incomeLpa: number; // annual income, lakhs per annum (INR)
  company: string;
  designation: string;
  maritalStatus: MaritalStatus;
  languages: string[];
  siblings: string; // e.g. "1 elder brother (married), 1 younger sister"
  caste: string;
  religion: Religion;
  wantKids: YesNoMaybe;
  openToRelocate: YesNoMaybe;
  openToPets: YesNoMaybe;

  // ---- Extra Indian-matchmaking fields (research-driven) ----
  motherTongue: string;
  subCaste?: string;
  gotra?: string;
  nativePlace: string;
  manglik: Manglik;
  rashi?: string;
  nakshatra?: string;
  birthTime?: string; // HH:mm
  birthPlace?: string;
  horoscopeMatchRequired: boolean;
  postGradDegree?: string;
  postGradCollege?: string;
  educationLevel: EducationLevel;
  profession: string; // broad field: "Software", "Medicine", "Finance", "Law", ...
  workMode: WorkMode;
  careerAmbition: Level;
  residencyStatus: ResidencyStatus;
  familyType: FamilyType;
  familyValues: FamilyValues;
  fatherOccupation: string;
  motherOccupation: string;
  livingWithParentsAfterMarriage: YesNoMaybe;
  diet: Diet;
  smoking: Habit;
  drinking: Habit;
  fitness: Level;
  bodyType: BodyType;
  hobbies: string[];
  religiosity: 1 | 2 | 3 | 4 | 5; // 1 = not religious, 5 = very
  profileManagedBy: ProfileManagedBy;
  verified: { id: boolean; linkedin: boolean; income: boolean };
  timelineToMarry: MarriageTimeline;
  aboutMe: string;
  partnerPreferences: PartnerPreferences;

  // ---- Platform meta ----
  /** true = paying client managed by a matchmaker; false = member of the match pool */
  isClient: boolean;
  /** Only meaningful for clients */
  status?: CustomerStatus;
  /** Matchmaker id; only for clients */
  assignedTo?: string;
  createdAt: string; // ISO datetime
  lastActivityAt: string; // ISO datetime
}

export interface Matchmaker {
  id: string;
  username: string;
  name: string;
  passwordHash: string; // bcrypt
}

export type NoteType = "Call" | "Meeting" | "General";

export interface Note {
  id: string;
  customerId: string;
  authorId: string;
  authorName: string;
  type: NoteType;
  body: string;
  createdAt: string;
}

export type MatchOutcome = "Pending" | "Accepted" | "Declined" | "Met";

export interface MatchAction {
  id: string;
  customerId: string;
  matchId: string;
  matchName: string;
  score: number;
  tier: MatchTier;
  emailSubject: string;
  emailBody: string;
  sentBy: string;
  sentAt: string;
  outcome: MatchOutcome;
}

// ---------------- Matching engine output ----------------

export type MatchTier = "High Potential" | "Strong" | "Worth Exploring" | "Low";

export interface DimensionScore {
  /** Machine key, e.g. "age", "height", "kids" */
  key: string;
  /** Human label, e.g. "Age gap" */
  label: string;
  /** 0..1 */
  score: number;
  weight: number;
  /** Short human-readable explanation, e.g. "She is 3 years younger (ideal range)" */
  reason: string;
  /** Set when this dimension is a concern worth showing the matchmaker */
  flag?: string;
}

export interface MatchResult {
  candidate: Profile;
  /** A -> B: how well the candidate fits the customer, 0..100 */
  forwardScore: number;
  /** B -> A: how well the customer fits the candidate's preferences, 0..100 */
  reverseScore: number;
  /** Geometric mean of forward and reverse, with quality multiplier, 0..100 */
  mutualScore: number;
  /** mutualScore + AI adjustment (if any), clamped 0..100 */
  finalScore: number;
  tier: MatchTier;
  dimensions: DimensionScore[];
  /** Top positive reasons (rule-based) */
  highlights: string[];
  /** Concerns (rule-based) */
  concerns: string[];
  ai?: AiMatchInsight;
}

export interface ExcludedCandidate {
  candidateId: string;
  name: string;
  reasons: string[];
}

export interface MatchRunResult {
  customerId: string;
  generatedAt: string;
  poolSize: number;
  afterFilters: number;
  matches: MatchResult[];
  /** Sample of excluded candidates with the reason (for "why not X?") */
  excluded: ExcludedCandidate[];
}

// ---------------- AI ----------------

export interface AiMatchInsight {
  matchId: string;
  /** Bounded adjustment, -10..+10 */
  adjustment: number;
  label: MatchTier;
  summary: string; // one sentence
  whyItWorks: string[];
  watchOuts: string[];
  conversationStarter: string;
  /** "openai" or "fallback" (deterministic rules, no API key / error) */
  source: "openai" | "fallback";
}

export type EmailTone = "Warm" | "Formal" | "Playful";

export interface IntroEmail {
  subject: string;
  body: string;
  source: "openai" | "fallback";
}

export interface NotesSummary {
  summary: string;
  inferredPreferences: string[];
  suggestedNextStep: string;
  source: "openai" | "fallback";
}

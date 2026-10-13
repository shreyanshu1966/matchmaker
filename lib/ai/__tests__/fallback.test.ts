import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { MatchResult, Note, Profile } from "../../types";
import { explainMatches, generateIntroEmail, summarizeNotes } from "../index";
import { redactNotes, redactProfile, scrubText } from "../redact";

function makeProfile(over: Partial<Profile> = {}): Profile {
  return {
    id: "p-1",
    firstName: "Ananya",
    lastName: "Kulkarni",
    gender: "Female",
    dob: "1996-04-12",
    country: "India",
    city: "Pune",
    state: "Maharashtra",
    heightCm: 162,
    email: "ananya.k@example.com",
    phone: "+91 98765 43210",
    ugCollege: "COEP",
    degree: "B.Tech",
    incomeLpa: 24,
    company: "Infosys",
    designation: "Product Manager",
    maritalStatus: "Never Married",
    languages: ["Marathi", "Hindi", "English"],
    siblings: "1 younger brother",
    caste: "Brahmin",
    religion: "Hindu",
    wantKids: "Yes",
    openToRelocate: "Maybe",
    openToPets: "Yes",
    motherTongue: "Marathi",
    nativePlace: "Nashik",
    manglik: "No",
    birthTime: "06:45",
    birthPlace: "Nashik",
    horoscopeMatchRequired: false,
    postGradDegree: "MBA",
    postGradCollege: "IIM Indore",
    educationLevel: 3,
    profession: "Product",
    workMode: "Hybrid",
    careerAmbition: "High",
    residencyStatus: "Citizen",
    familyType: "Nuclear",
    familyValues: "Moderate",
    fatherOccupation: "Retired bank manager",
    motherOccupation: "Teacher",
    livingWithParentsAfterMarriage: "No",
    diet: "Vegetarian",
    smoking: "Never",
    drinking: "Occasionally",
    fitness: "Medium",
    bodyType: "Slim",
    hobbies: ["Reading", "Trekking", "Classical music"],
    religiosity: 3,
    profileManagedBy: "Self",
    verified: { id: true, linkedin: true, income: false },
    timelineToMarry: "6-12 months",
    aboutMe: "I love long weekend treks in the Sahyadris. Reach me at ananya.k@example.com or 9876543210.",
    partnerPreferences: {
      ageMin: 28,
      ageMax: 34,
      heightMinCm: 168,
      heightMaxCm: 188,
      religions: [],
      castes: [],
      maritalStatuses: ["Never Married"],
      diets: [],
      cities: ["Pune", "Mumbai"],
      minEducationLevel: 2,
      minIncomeLpa: 0,
      dealbreakers: ["smoking"],
    },
    isClient: true,
    status: "Matching",
    assignedTo: "mm-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    lastActivityAt: "2026-09-01T00:00:00.000Z",
    ...over,
  };
}

const customer = makeProfile();
const candidate = makeProfile({
  id: "p-2",
  firstName: "Rohan",
  lastName: "Deshpande",
  gender: "Male",
  dob: "1993-08-20",
  email: "rohan@example.com",
  phone: "+91 91234 56789",
  heightCm: 178,
  company: "Thoughtworks",
  designation: "Senior Engineer",
  profession: "Software",
  hobbies: ["Reading", "Cycling", "Trekking"],
  aboutMe: "Weekend cyclist and bookworm who is always planning the next trek.",
  isClient: false,
  status: undefined,
  assignedTo: undefined,
});

const match: MatchResult = {
  candidate,
  forwardScore: 82,
  reverseScore: 76,
  mutualScore: 79,
  finalScore: 79,
  tier: "Strong",
  dimensions: [
    { key: "age", label: "Age gap", score: 0.9, weight: 10, reason: "He is 3 years older (ideal range)" },
    { key: "location", label: "Location", score: 1, weight: 8, reason: "Both in Pune" },
  ],
  highlights: ["Both based in Pune", "Similar education level"],
  concerns: ["Income not verified"],
};

const notes: Note[] = [
  {
    id: "n1",
    customerId: "p-1",
    authorId: "mm-1",
    authorName: "Priya Sharma",
    type: "Call",
    body: "She wants someone who reads and enjoys the outdoors. Does not want a long-distance relationship. Call her mother at 9988776655.",
    createdAt: "2026-08-01T10:00:00.000Z",
  },
  {
    id: "n2",
    customerId: "p-1",
    authorId: "mm-1",
    authorName: "Priya Sharma",
    type: "Meeting",
    body: "Met in person. Prefers a partner with a calm temperament; parents prefer Pune-based families. Will follow up next week.",
    createdAt: "2026-09-01T10:00:00.000Z",
  },
];

let savedKey: string | undefined;
beforeAll(() => {
  savedKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterAll(() => {
  if (savedKey !== undefined) process.env.OPENAI_API_KEY = savedKey;
  vi.restoreAllMocks();
});

describe("redaction", () => {
  it("removes email, phone, last name, dob and birth time", () => {
    const r = redactProfile(customer);
    const json = JSON.stringify(r);
    expect(json).not.toContain("ananya.k@example.com");
    expect(json).not.toContain("98765");
    expect(json).not.toContain("9876543210");
    expect(json).not.toContain("Kulkarni");
    expect(json).not.toContain("1996-04-12");
    expect(json).not.toContain("06:45");
    expect(r.name).toBe("Ananya K.");
    expect(r.age).toBeGreaterThan(25);
    expect(r).not.toHaveProperty("email");
    expect(r).not.toHaveProperty("phone");
    expect(r.lifestyle.hobbies).toContain("Reading");
  });

  it("can omit caste when it is not relevant", () => {
    const r = redactProfile(customer, { includeCaste: false });
    expect(JSON.stringify(r)).not.toContain("Brahmin");
  });

  it("scrubs phone numbers and emails from free text and notes", () => {
    expect(scrubText("mail a@b.co or call +91 98765 43210")).not.toMatch(/a@b\.co|98765/);
    expect(JSON.stringify(redactNotes(notes))).not.toContain("9988776655");
    // does not eat ordinary numbers
    expect(scrubText("Earns 24 LPA, born 1996, 2019-2020 in Pune")).toBe("Earns 24 LPA, born 1996, 2019-2020 in Pune");
  });
});

describe("fallbacks without an API key", () => {
  it("explainMatches returns a deterministic insight per match", async () => {
    const out = await explainMatches(customer, [match], notes);
    expect(out).toHaveLength(1);
    const i = out[0];
    expect(i.source).toBe("fallback");
    expect(i.matchId).toBe("p-2");
    expect(Math.abs(i.adjustment)).toBeLessThanOrEqual(3);
    // notes say "wants someone who reads"; the candidate's hobbies include reading
    expect(i.adjustment).toBeGreaterThan(0);
    expect(i.whyItWorks.join(" ")).toMatch(/reading/i);
    expect(i.whyItWorks.length).toBeGreaterThanOrEqual(2);
    expect(i.whyItWorks.length).toBeLessThanOrEqual(3);
    expect(i.watchOuts.length).toBeLessThanOrEqual(2);
    expect(i.summary.length).toBeGreaterThan(10);
    expect(i.conversationStarter.length).toBeGreaterThan(10);
    expect(["High Potential", "Strong", "Worth Exploring", "Low"]).toContain(i.label);
  });

  it("explainMatches penalises a smoker when the notes ask for a non-smoker", async () => {
    const smoker = { ...match, candidate: { ...candidate, id: "p-3", smoking: "Regularly" as const, hobbies: ["Cricket"] } };
    const out = await explainMatches(customer, [smoker], [
      { ...notes[0], body: "She is firm: no smokers at all." },
    ]);
    expect(out[0].adjustment).toBeLessThan(0);
    expect(out[0].adjustment).toBeGreaterThanOrEqual(-3);
    expect(out[0].watchOuts.join(" ")).toMatch(/smok/i);
  });

  it("explainMatches handles an empty list", async () => {
    expect(await explainMatches(customer, [], notes)).toEqual([]);
  });

  it.each(["Warm", "Formal", "Playful"] as const)("generateIntroEmail (%s) produces a usable email", async (tone) => {
    const email = await generateIntroEmail(customer, match, { tone, matchmakerName: "Priya Sharma" });
    expect(email.source).toBe("fallback");
    expect(email.subject.length).toBeGreaterThan(5);
    expect(email.body).toContain("Ananya");
    expect(email.body).toContain("Rohan");
    expect(email.body).toContain("Pune");
    expect(email.body).toContain("Senior Engineer");
    expect(email.body).toContain("Priya Sharma");
    expect(email.body).not.toContain("Deshpande");
    expect(email.body).not.toContain("rohan@example.com");
    expect(email.body).not.toMatch(/Brahmin|Hindu/);
    const words = email.body.split(/\s+/).length;
    expect(words).toBeGreaterThan(90);
    expect(words).toBeLessThan(220);
  });

  it("summarizeNotes returns a heuristic summary", async () => {
    const s = await summarizeNotes(customer, notes);
    expect(s.source).toBe("fallback");
    expect(s.summary).toContain("Ananya");
    expect(s.inferredPreferences.length).toBeGreaterThanOrEqual(3);
    expect(s.inferredPreferences.length).toBeLessThanOrEqual(6);
    expect(s.inferredPreferences.join(" ")).toMatch(/reads|long-distance|calm/i);
    expect(s.suggestedNextStep.length).toBeGreaterThan(10);
    expect(JSON.stringify(s)).not.toContain("9988776655");
  });

  it("summarizeNotes works with no notes", async () => {
    const s = await summarizeNotes(customer, []);
    expect(s.source).toBe("fallback");
    expect(s.inferredPreferences.length).toBeGreaterThan(0);
  });
});

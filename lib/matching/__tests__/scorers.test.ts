import { describe, expect, it } from "vitest";
import { scoreAge } from "../scorers/age";
import { scoreHeight } from "../scorers/height";
import { scoreIncome } from "../scorers/income";
import { scoreKids } from "../scorers/kids";
import { scoreLifestyle } from "../scorers/lifestyle";
import { scoreLocation } from "../scorers/location";
import { scoreCareer } from "../scorers/career";
import { scoreInterests } from "../scorers/interests";
import { scorePreferenceFit } from "../scorers/preferenceFit";
import { ageFromDob, plateau } from "../utils";
import { ctx, dobForAge, makeProfile } from "./fixtures";

const man = (o = {}) => makeProfile({ gender: "Male", firstName: "Rahul", ...o });
const woman = (o = {}) => makeProfile({ gender: "Female", firstName: "Ananya", ...o });

describe("utils", () => {
  it("computes age from dob relative to an injected date", () => {
    expect(ageFromDob("1995-06-02", new Date("2026-06-01T00:00:00Z"))).toBe(30);
    expect(ageFromDob("1995-06-01", new Date("2026-06-01T00:00:00Z"))).toBe(31);
  });
  it("plateau is 1 inside the range and decays smoothly outside", () => {
    expect(plateau(5, 2, 8, 2)).toBe(1);
    expect(plateau(9, 2, 8, 2)).toBeGreaterThan(plateau(12, 2, 8, 2));
    expect(plateau(9, 2, 8, 2)).toBeLessThan(1);
  });
});

describe("male seeker soft preferences", () => {
  const seeker = man({ dob: dobForAge(32), heightCm: 178, incomeLpa: 30, partnerPreferences: { ageMin: 24, ageMax: 33 } });

  it("prefers a partner 2–5 years younger over same age or older", () => {
    const ideal = scoreAge(seeker, woman({ dob: dobForAge(29) }), ctx);
    const same = scoreAge(seeker, woman({ dob: dobForAge(32) }), ctx);
    const older = scoreAge(seeker, woman({ dob: dobForAge(33) }), ctx);
    expect(ideal.score).toBe(1);
    expect(same.score).toBeLessThan(ideal.score);
    expect(older.score).toBeLessThan(same.score);
    expect(ideal.reason).toBe("Ananya is 3 years younger, within the ideal 2–5 year gap");
    expect(older.flag).toBeDefined();
  });

  it("prefers a partner 5–15 cm shorter", () => {
    const ideal = scoreHeight(seeker, woman({ heightCm: 166 }), ctx);
    const taller = scoreHeight(seeker, woman({ heightCm: 182 }), ctx);
    expect(ideal.score).toBeGreaterThan(0.95);
    expect(taller.score).toBeLessThan(0.1);
  });

  it("prefers a partner earning ≤ him, with a gentle decay above", () => {
    const less = scoreIncome(seeker, woman({ incomeLpa: 20 }), ctx).score;
    const bitMore = scoreIncome(seeker, woman({ incomeLpa: 36 }), ctx).score;
    const double = scoreIncome(seeker, woman({ incomeLpa: 60 }), ctx).score;
    expect(less).toBe(1);
    expect(bitMore).toBeGreaterThan(0.8); // gentle
    expect(double).toBeLessThan(bitMore);
    expect(double).toBeGreaterThan(0); // never excluded
  });
});

describe("female seeker lenses", () => {
  it("financial stability is smooth around her stated minimum, no cliff", () => {
    const seeker = woman({ partnerPreferences: { minIncomeLpa: 20 } });
    const at = scoreIncome(seeker, man({ incomeLpa: 20 }), ctx).score;
    const justBelow = scoreIncome(seeker, man({ incomeLpa: 18 }), ctx).score;
    const half = scoreIncome(seeker, man({ incomeLpa: 10 }), ctx).score;
    expect(at).toBeGreaterThan(0.75);
    expect(justBelow).toBeGreaterThan(0.6);
    expect(half).toBeLessThan(0.2);
  });
  it("age uses her stated range, not a direction", () => {
    const seeker = woman({ partnerPreferences: { ageMin: 28, ageMax: 34 } });
    expect(scoreAge(seeker, man({ dob: dobForAge(30) }), ctx).score).toBe(1);
    expect(scoreAge(seeker, man({ dob: dobForAge(37) }), ctx).score).toBeLessThan(0.5);
  });
  it("career parity: two doctors understand shift work", () => {
    const doc = woman({ profession: "Medicine" });
    const r = scoreCareer(doc, man({ profession: "Medicine" }), ctx);
    expect(r.reason).toMatch(/shift work/);
    expect(r.score).toBeGreaterThan(scoreCareer(doc, man({ profession: "Law" }), ctx).score);
  });
});

describe("kids", () => {
  it("Yes vs No scores ~0 and is flagged; Maybe is half", () => {
    const r = scoreKids(man({ wantKids: "Yes" }), woman({ wantKids: "No" }), ctx);
    expect(r.score).toBeLessThan(0.05);
    expect(r.flag).toBeDefined();
    expect(scoreKids(man({ wantKids: "Yes" }), woman({ wantKids: "Maybe" }), ctx).score).toBe(0.5);
    expect(scoreKids(man({ wantKids: "Yes" }), woman({ wantKids: "Yes" }), ctx).score).toBe(1);
  });
});

describe("lifestyle, location, interests", () => {
  it("diet matrix: veg–vegan is easy, Jain–non-veg is hard", () => {
    const jain = woman({ diet: "Jain" });
    expect(scoreLifestyle(jain, man({ diet: "Non-Vegetarian" }), ctx).score).toBeLessThan(
      scoreLifestyle(jain, man({ diet: "Vegetarian" }), ctx).score,
    );
  });
  it("location: same city > someone willing to move > nobody moves", () => {
    const s = woman({ city: "Pune", openToRelocate: "No" });
    const same = scoreLocation(s, man({ city: "Pune" }), ctx).score;
    const willing = scoreLocation(s, man({ city: "Delhi", state: "Delhi", openToRelocate: "Yes" }), ctx);
    const stuck = scoreLocation(s, man({ city: "Delhi", state: "Delhi", openToRelocate: "No" }), ctx);
    expect(same).toBe(1);
    expect(willing.score).toBeGreaterThan(0.7);
    expect(willing.reason).toContain("Rahul (Delhi) is open to relocating to Pune");
    expect(stuck.score).toBeLessThan(0.1);
    expect(stuck.flag).toBeDefined();
  });
  it("NRI on a work visa is a slightly less settled base", () => {
    const s = woman({ openToRelocate: "Yes" });
    const citizen = scoreLocation(s, man({ city: "Seattle", country: "USA", state: "WA", residencyStatus: "Citizen" }), ctx).score;
    const visa = scoreLocation(s, man({ city: "Seattle", country: "USA", state: "WA", residencyStatus: "Work Visa" }), ctx).score;
    expect(visa).toBeLessThan(citizen);
  });
  it("interests name the shared hobbies", () => {
    const r = scoreInterests(woman({ hobbies: ["Trekking", "Photography", "Yoga"] }), man({ hobbies: ["trekking", "Chess"] }), ctx);
    expect(r.reason).toContain("trekking");
  });
});

describe("preference fit (reverse direction)", () => {
  it("drops when the person is outside the other's stated preferences", () => {
    const her = woman({ partnerPreferences: { ageMin: 28, ageMax: 32, heightMinCm: 175, heightMaxCm: 190, minIncomeLpa: 20 } });
    const fits = scorePreferenceFit(her, man({ dob: dobForAge(30), heightCm: 180, incomeLpa: 30 }), ctx);
    const misses = scorePreferenceFit(her, man({ dob: dobForAge(35), heightCm: 168, incomeLpa: 10 }), ctx);
    expect(fits.score).toBeGreaterThan(0.95);
    expect(misses.score).toBeLessThan(0.5);
    expect(misses.reason).toMatch(/meets \d of \d/);
  });
});

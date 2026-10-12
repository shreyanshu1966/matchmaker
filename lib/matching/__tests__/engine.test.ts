import { describe, expect, it } from "vitest";
import { evaluatePair, geometricMean, runMatching } from "../engine";
import { applyHardFilters } from "../filters";
import { mmrRerank } from "../diversity";
import { FEMALE_SEEKER_PROFILE, MALE_SEEKER_PROFILE, WEIGHT_PROFILES } from "../weights";
import { ctx, dobForAge, makeProfile, NOW } from "./fixtures";

const man = (o = {}) => makeProfile({ gender: "Male", firstName: "Rahul", ...o });
const woman = (o = {}) => makeProfile({ gender: "Female", firstName: "Ananya", ...o });

describe("weights", () => {
  it.each(Object.values(WEIGHT_PROFILES))("$id sums to 1 and components sum to 1", (profile) => {
    const total = profile.dimensions.reduce((s, d) => s + d.weight, 0);
    expect(total).toBeCloseTo(1, 10);
    for (const d of profile.dimensions) {
      expect(d.components.reduce((s, c) => s + c.weight, 0)).toBeCloseTo(1, 10);
      expect(d.rationale.length).toBeGreaterThan(20);
    }
  });
  it("matches PLAN.md §4", () => {
    expect(Object.fromEntries(MALE_SEEKER_PROFILE.dimensions.map((d) => [d.key, d.weight]))).toEqual({
      age: 0.18, height: 0.12, income: 0.1, kids: 0.15, values: 0.15, lifestyle: 0.1, location: 0.1, background: 0.1,
    });
    expect(Object.fromEntries(FEMALE_SEEKER_PROFILE.dimensions.map((d) => [d.key, d.weight]))).toEqual({
      career: 0.18, values: 0.18, location: 0.14, kidsTimeline: 0.14, income: 0.1, lifestyle: 0.1, ageHeight: 0.08, background: 0.08,
    });
  });
});

describe("hard filters", () => {
  it("excludes the same gender and excludeIds", () => {
    const a = man();
    expect(applyHardFilters(a, man(), { now: NOW }).passed).toBe(false);
    const w = woman();
    const r = applyHardFilters(a, w, { now: NOW, excludeIds: [w.id] });
    expect(r.passed).toBe(false);
    expect(r.reasons[0]).toMatch(/Already introduced/);
  });
  it("a customer's dealbreaker excludes, with a readable reason", () => {
    const r = applyHardFilters(man({ partnerPreferences: { dealbreakers: ["smoking"] } }), woman({ smoking: "Occasionally" }), { now: NOW });
    expect(r.passed).toBe(false);
    expect(r.reasons[0]).toBe("Ananya smokes occasionally; Rahul listed smoking as a dealbreaker");
  });
  it("the candidate's dealbreakers count too (both directions)", () => {
    const r = applyHardFilters(man({ drinking: "Regularly" }), woman({ partnerPreferences: { dealbreakers: ["drinking"] } }), { now: NOW });
    expect(r.passed).toBe(false);
    expect(r.reasons[0]).toMatch(/^Their side:/);
  });
  it("age: tolerated within 2 years of the range, excluded beyond", () => {
    const seeker = man({ partnerPreferences: { ageMin: 25, ageMax: 30 } });
    expect(applyHardFilters(seeker, woman({ dob: dobForAge(32) }), { now: NOW }).passed).toBe(true);
    expect(applyHardFilters(seeker, woman({ dob: dobForAge(33) }), { now: NOW }).passed).toBe(false);
  });
  it("religion is hard only with the dealbreaker; otherwise soft", () => {
    const open = man({ partnerPreferences: { religions: ["Hindu"] } });
    expect(applyHardFilters(open, woman({ religion: "Sikh" }), { now: NOW }).passed).toBe(true);
    const strict = man({ partnerPreferences: { religions: ["Hindu"], dealbreakers: ["different-religion"] } });
    expect(applyHardFilters(strict, woman({ religion: "Sikh" }), { now: NOW }).passed).toBe(false);
  });
  it("manglik mismatch only applies when horoscope matching is required", () => {
    const w = woman({ manglik: "Yes" });
    expect(applyHardFilters(man({ manglik: "No", partnerPreferences: { dealbreakers: ["manglik-mismatch"] } }), w, { now: NOW }).passed).toBe(true);
    expect(
      applyHardFilters(man({ manglik: "No", horoscopeMatchRequired: true, partnerPreferences: { dealbreakers: ["manglik-mismatch"] } }), w, { now: NOW }).passed,
    ).toBe(false);
  });
  it("no-relocation and kids dealbreakers", () => {
    const s = woman({ city: "Pune", partnerPreferences: { dealbreakers: ["no-relocation", "doesnt-want-kids"] } });
    expect(applyHardFilters(s, man({ city: "Delhi", openToRelocate: "No" }), { now: NOW }).passed).toBe(false);
    expect(applyHardFilters(s, man({ city: "Delhi", openToRelocate: "Yes" }), { now: NOW }).passed).toBe(true);
    expect(applyHardFilters(s, man({ wantKids: "No" }), { now: NOW }).passed).toBe(false);
  });
});

describe("reciprocity", () => {
  it("geometric mean punishes one-sided matches more than the arithmetic mean", () => {
    expect(geometricMean(0.9, 0.3)).toBeLessThan((0.9 + 0.3) / 2);
    expect(geometricMean(0.6, 0.6)).toBeGreaterThan(geometricMean(0.9, 0.3));
  });

  it("reverse score drops when the seeker is outside the candidate's preferences", () => {
    const seeker = man({ dob: dobForAge(31), heightCm: 178, incomeLpa: 25 });
    const happy = woman({ partnerPreferences: { ageMin: 28, ageMax: 34, heightMinCm: 170, heightMaxCm: 185, minIncomeLpa: 15 } });
    const picky = woman({ partnerPreferences: { ageMin: 26, ageMax: 29, heightMinCm: 183, heightMaxCm: 195, minIncomeLpa: 50 } });
    const a = evaluatePair(seeker, happy, ctx);
    const b = evaluatePair(seeker, picky, ctx);
    expect(a.forward).toBeCloseTo(b.forward, 10); // same woman from his side
    expect(b.reverse).toBeLessThan(a.reverse - 0.1);
    expect(b.mutual).toBeLessThan(a.mutual);
  });

  it("reverse uses the candidate's own gender profile (not a copy of forward)", () => {
    const ev = evaluatePair(man(), woman(), ctx);
    expect(ev.reverseDims.map((d) => d.key)).toContain("career");
    expect(ev.forwardDims.map((d) => d.key)).toContain("height");
    expect(ev.rawReverse).not.toBeCloseTo(ev.rawForward, 5);
  });
});

describe("runMatching", () => {
  const customer = man({ id: "cust", isClient: true, dob: dobForAge(32), heightCm: 180, incomeLpa: 30 });
  const pool = [
    woman({ id: "ideal", dob: dobForAge(28), heightCm: 165, incomeLpa: 18, hobbies: ["Reading", "Trekking"] }),
    woman({ id: "kidsNo", dob: dobForAge(28), heightCm: 165, incomeLpa: 18, wantKids: "No" }),
    woman({ id: "older", dob: dobForAge(33), heightCm: 182, incomeLpa: 60, city: "Delhi", state: "Delhi", openToRelocate: "No" }),
    woman({ id: "smoker", smoking: "Regularly" }),
    man({ id: "sameGender" }),
  ];
  customer.partnerPreferences.dealbreakers = ["smoking"];

  it("filters, scores, tiers and explains", () => {
    const res = runMatching(customer, pool, { now: NOW });
    expect(res.poolSize).toBe(5);
    expect(res.afterFilters).toBe(3);
    expect(res.excluded.map((e) => e.candidateId)).toEqual(["smoker"]);
    const ids = res.matches.map((m) => m.candidate.id);
    expect(ids[0]).toBe("ideal");
    const ideal = res.matches[0];
    const kidsNo = res.matches.find((m) => m.candidate.id === "kidsNo")!;
    expect(ideal.mutualScore).toBeGreaterThan(kidsNo.mutualScore);
    expect(kidsNo.concerns.some((c) => /children/.test(c))).toBe(true);
    expect(ideal.highlights.length).toBe(3);
    expect(ideal.finalScore).toBe(ideal.mutualScore);
    expect(Number.isInteger(ideal.forwardScore)).toBe(true);
    const older = res.matches.find((m) => m.candidate.id === "older")!;
    expect(older.mutualScore).toBeLessThan(kidsNo.mutualScore + 20);
    expect(older.concerns.length).toBeGreaterThan(0);
  });

  it("is deterministic", () => {
    const a = runMatching(customer, pool, { now: NOW });
    const b = runMatching(customer, [...pool], { now: NOW });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("respects limit and excludeIds", () => {
    const res = runMatching(customer, pool, { now: NOW, limit: 1, excludeIds: ["ideal"] });
    expect(res.matches).toHaveLength(1);
    expect(res.matches[0].candidate.id).not.toBe("ideal");
  });
});

describe("MMR diversity", () => {
  it("promotes a slightly lower but different candidate over a near-duplicate", () => {
    type Item = { id: string; score: number; group: string };
    const items: Item[] = [
      { id: "a1", score: 0.9, group: "blr-software" },
      { id: "a2", score: 0.89, group: "blr-software" },
      { id: "b1", score: 0.85, group: "pune-medicine" },
    ];
    const sim = (x: Item, y: Item) => (x.group === y.group ? 1 : 0);
    const plain = [...items].sort((x, y) => y.score - x.score).slice(0, 2).map((i) => i.id);
    const mmr = mmrRerank(items, 2, (i) => i.score, sim, 0.75).map((i) => i.id);
    expect(plain).toEqual(["a1", "a2"]);
    expect(mmr).toEqual(["a1", "b1"]);
  });

  it("with λ = 1 it is plain relevance order", () => {
    const items = [{ s: 0.9 }, { s: 0.8 }, { s: 0.7 }];
    expect(mmrRerank(items, 3, (i) => i.s, () => 1, 1)).toEqual(items);
  });
});

describe("calibration", () => {
  it("spreads scores: a good pair is High Potential, a typical pair sits mid-range, a poor pair is Low", () => {
    const him = man({ dob: dobForAge(32), heightCm: 178, incomeLpa: 30 });
    const good = evaluatePair(him, woman({ dob: dobForAge(28), heightCm: 165, incomeLpa: 18 }), ctx).mutual;
    const typical = evaluatePair(
      him,
      woman({
        dob: dobForAge(32), heightCm: 174, incomeLpa: 36, city: "Mumbai", diet: "Non-Vegetarian", drinking: "Occasionally",
        wantKids: "Maybe", familyValues: "Liberal", religiosity: 2, livingWithParentsAfterMarriage: "No", hobbies: ["Dance"],
      }),
      ctx,
    ).mutual;
    const poor = evaluatePair(
      him,
      woman({
        dob: dobForAge(33), heightCm: 180, incomeLpa: 55, city: "Delhi", state: "Delhi", openToRelocate: "No", diet: "Non-Vegetarian",
        drinking: "Regularly", wantKids: "No", familyValues: "Liberal", religiosity: 1, livingWithParentsAfterMarriage: "No",
        familyType: "Joint", languages: ["Tamil"], hobbies: ["Dance"],
      }),
      ctx,
    ).mutual;
    expect(good).toBeGreaterThanOrEqual(80);
    expect(typical).toBeGreaterThanOrEqual(45);
    expect(typical).toBeLessThanOrEqual(72);
    expect(poor).toBeLessThan(40);
  });
});

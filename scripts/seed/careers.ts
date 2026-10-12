import type { EducationLevel, Gender, WorkMode } from "../../lib/types";
import { Rng, clamp, type Weighted } from "./rng";
import {
  ARCH_COLLEGES, ARTS_BY_STATE, ARTS_TOP, DENTAL_COLLEGES, DESIGN_COLLEGES, ENGG_BY_STATE, ENGG_MID, ENGG_TOP,
  FOREIGN_UNIS, LAW_MID, LAW_TOP, MBA_LOW, MBA_MID, MBA_TOP, MED_BY_STATE, MED_PG, MED_TOP, NRI_INCOME, PHARMA_COLLEGES,
} from "./places";

export interface CareerCtx {
  rng: Rng;
  gender: Gender;
  age: number;
  /** 1 = top, 2 = good, 3 = average */
  tier: 1 | 2 | 3;
  homeState: string;
  city: string;
  country: string;
  lastName: string;
  nri: boolean;
}

export interface Career {
  profession: string;
  degree: string;
  ugCollege: string;
  postGradDegree?: string;
  postGradCollege?: string;
  educationLevel: EducationLevel;
  company: string;
  designation: string;
  incomeLpa: number;
  workMode: WorkMode;
}

export interface Track {
  key: string;
  profession: string;
  weightM: number;
  weightF: number;
  nriOk: boolean;
  build(c: CareerCtx): Career;
}

type Co = { name: string; tier: 1 | 2 | 3; cities?: string[] };

const ALL = undefined;

function ugEngg(c: CareerCtx): string {
  const r = c.rng;
  if (c.tier === 1) return r.chance(0.75) ? r.pick(ENGG_TOP) : r.pick(ENGG_MID);
  if (c.tier === 2) return r.chance(0.6) ? r.pick(ENGG_MID) : r.pick(ENGG_BY_STATE[c.homeState] ?? ENGG_MID);
  return r.pick(ENGG_BY_STATE[c.homeState] ?? ENGG_MID);
}

function ugArts(c: CareerCtx): string {
  const r = c.rng;
  const filt = (l: string[]) => l.filter((x) => c.gender === "Female" || !x.endsWith(" *"));
  const name = c.tier === 1 && r.chance(0.7) ? r.pick(filt(ARTS_TOP)) : r.pick(filt(ARTS_BY_STATE[c.homeState] ?? ARTS_TOP));
  return name.replace(/ \*$/, "");
}

function ugMed(c: CareerCtx): string {
  const r = c.rng;
  if (c.tier === 1 && r.chance(0.6)) return r.pick(MED_TOP);
  return r.pick(MED_BY_STATE[c.homeState] ?? MED_TOP);
}

function pickCo(c: CareerCtx, cos: Co[], preferTier: number): Co {
  const r = c.rng;
  const local = cos.filter((x) => x.cities?.includes(c.city));
  const anywhere = cos.filter((x) => !x.cities);
  const pool = local.length ? (r.chance(0.7) || !anywhere.length ? local : [...local, ...anywhere]) : anywhere.length ? anywhere : cos;
  const want = clamp(preferTier + (r.chance(0.25) ? (r.chance(0.5) ? -1 : 1) : 0), 1, 3);
  const exact = pool.filter((x) => x.tier === want);
  return r.pick(exact.length ? exact : pool);
}

function ladder(yrs: number, steps: [number, string][]): string {
  let d = steps[0][1];
  for (const [y, name] of steps) if (yrs >= y) d = name;
  return d;
}

function finishIncome(c: CareerCtx, base: number): number {
  const r = c.rng;
  let inc = base * Math.exp(r.normal(0, 0.12));
  if (c.nri) {
    const m = NRI_INCOME[c.country] ?? { mult: 2, floor: 45 };
    inc = Math.max(m.floor + r.float(0, 15), inc * m.mult);
    inc = Math.min(inc, 260);
  } else {
    inc = clamp(inc, 3.5, 65);
  }
  return inc >= 10 ? Math.round(inc) : Math.round(inc * 2) / 2;
}

const wm = (r: Rng, w: Weighted<WorkMode>) => r.weighted(w);
const TECH_WM: Weighted<WorkMode> = [["Hybrid", 55], ["Remote", 15], ["Onsite", 30]];
const OFFICE_WM: Weighted<WorkMode> = [["Hybrid", 35], ["Onsite", 60], ["Remote", 5]];

// ---------------- companies ----------------

const BLR = "Bangalore", HYD = "Hyderabad", MUM = "Mumbai", PUN = "Pune", DEL = "Delhi", GGN = "Gurugram", NOI = "Noida", CHE = "Chennai", KOL = "Kolkata", AHM = "Ahmedabad";

const TECH_COS: Co[] = [
  { name: "Google", tier: 1, cities: [BLR, HYD, GGN, MUM, PUN] },
  { name: "Microsoft", tier: 1, cities: [HYD, BLR, NOI] },
  { name: "Amazon", tier: 1, cities: [BLR, HYD, CHE, PUN, GGN] },
  { name: "Atlassian", tier: 1, cities: [BLR] },
  { name: "Uber", tier: 1, cities: [BLR, HYD] },
  { name: "Adobe", tier: 1, cities: [NOI, BLR] },
  { name: "Salesforce", tier: 1, cities: [HYD, BLR] },
  { name: "Goldman Sachs", tier: 1, cities: [BLR, HYD] },
  { name: "Flipkart", tier: 2, cities: [BLR] },
  { name: "Swiggy", tier: 2, cities: [BLR] },
  { name: "Zomato", tier: 2, cities: [GGN] },
  { name: "PhonePe", tier: 2, cities: [BLR, PUN] },
  { name: "Razorpay", tier: 2, cities: [BLR] },
  { name: "Freshworks", tier: 2, cities: [CHE] },
  { name: "Zoho", tier: 2, cities: [CHE] },
  { name: "Paytm", tier: 2, cities: [NOI] },
  { name: "Walmart Global Tech", tier: 2, cities: [BLR, CHE] },
  { name: "Intuit", tier: 2, cities: [BLR] },
  { name: "Oracle", tier: 2, cities: [HYD, BLR] },
  { name: "SAP Labs", tier: 2, cities: [BLR] },
  { name: "ThoughtWorks", tier: 2, cities: [PUN, BLR, CHE, GGN] },
  { name: "MakeMyTrip", tier: 2, cities: [GGN] },
  { name: "Persistent Systems", tier: 3, cities: [PUN, HYD, BLR] },
  { name: "Infosys", tier: 3 },
  { name: "TCS", tier: 3 },
  { name: "Wipro", tier: 3 },
  { name: "HCLTech", tier: 3 },
  { name: "Tech Mahindra", tier: 3 },
  { name: "Cognizant", tier: 3 },
  { name: "Accenture", tier: 3 },
  { name: "Capgemini", tier: 3 },
  { name: "LTIMindtree", tier: 3 },
];

const NRI_TECH: Record<string, string[]> = {
  USA: ["Google", "Microsoft", "Amazon", "Meta", "Apple", "Salesforce", "Nvidia", "Oracle"],
  UK: ["Google", "Amazon", "Revolut", "Deliveroo", "Barclays"],
  Canada: ["Shopify", "Amazon", "RBC", "Microsoft", "Wealthsimple"],
  Singapore: ["Grab", "Google", "Shopee", "DBS Bank", "ByteDance"],
  UAE: ["Careem", "Emirates Group IT", "Noon", "Microsoft"],
  Australia: ["Atlassian", "Canva", "Commonwealth Bank", "Amazon"],
};
const NRI_FIN: Record<string, string[]> = {
  USA: ["JP Morgan Chase", "Goldman Sachs", "Morgan Stanley", "Deloitte", "EY"],
  UK: ["Barclays", "HSBC", "Deloitte", "PwC", "Standard Chartered"],
  Canada: ["RBC", "TD Bank", "Scotiabank", "KPMG"],
  Singapore: ["DBS Bank", "Standard Chartered", "Citi", "EY"],
  UAE: ["Emirates NBD", "ADCB", "Deloitte Middle East", "PwC Middle East"],
  Australia: ["Commonwealth Bank", "ANZ", "Westpac", "KPMG"],
};
const NRI_MED: Record<string, string[]> = {
  USA: ["Mount Sinai Hospital", "Cleveland Clinic", "Mayo Clinic"],
  UK: ["NHS (Royal London Hospital)", "NHS (Manchester Royal Infirmary)", "NHS (Guy's and St Thomas')"],
  Canada: ["Toronto General Hospital", "Vancouver General Hospital"],
  Singapore: ["Singapore General Hospital", "Mount Elizabeth Hospital"],
  UAE: ["Cleveland Clinic Abu Dhabi", "Mediclinic Dubai", "Aster Hospitals"],
  Australia: ["Royal Melbourne Hospital", "Westmead Hospital"],
};
const NRI_ENGG: Record<string, string[]> = {
  USA: ["Tesla", "GE Aerospace", "Intel", "Qualcomm"],
  UK: ["Rolls-Royce", "Jaguar Land Rover", "Arup"],
  Canada: ["Bombardier", "Magna International", "SNC-Lavalin"],
  Singapore: ["Micron", "Keppel", "Applied Materials"],
  UAE: ["ADNOC", "Emaar", "Dubai Electricity & Water Authority"],
  Australia: ["BHP", "Rio Tinto", "Aurecon"],
};

function nriCo(c: CareerCtx, map: Record<string, string[]>): string {
  return c.rng.pick(map[c.country] ?? map.USA);
}

function abroadPG(c: CareerCtx, degree: string): { postGradDegree: string; postGradCollege: string } {
  return { postGradDegree: degree, postGradCollege: c.rng.pick(FOREIGN_UNIS[c.country] ?? FOREIGN_UNIS.USA) };
}

const ENGG_BRANCHES: Weighted<string> = [
  ["B.Tech Computer Science", 50],
  ["B.Tech Information Technology", 15],
  ["B.Tech Electronics & Communication", 18],
  ["B.E. Computer Engineering", 12],
  ["B.Tech Electrical Engineering", 5],
];

// ---------------- tracks ----------------

const software: Track = {
  key: "software", profession: "Software", weightM: 26, weightF: 21, nriOk: true,
  build(c) {
    const r = c.rng;
    const degree = r.weighted(ENGG_BRANCHES);
    const ugCollege = ugEngg(c);
    let pg: { postGradDegree?: string; postGradCollege?: string } = {};
    let start = 22;
    if (c.nri && r.chance(0.6) && c.age >= 25) {
      pg = abroadPG(c, r.pick(["MS Computer Science", "MS Software Engineering", "MS Electrical & Computer Engineering"]));
      start = 24;
    } else if (!c.nri && r.chance(0.12) && c.age >= 25) {
      pg = { postGradDegree: "M.Tech Computer Science", postGradCollege: r.pick(["IIT Bombay", "IIT Madras", "IISc Bangalore", "IIT Delhi", "NIT Trichy", "IIIT Hyderabad"]) };
      start = 24;
    }
    const yrs = Math.max(0, c.age - start - r.int(0, 1));
    let company: string, base: number, designation: string;
    if (c.nri) {
      company = nriCo(c, NRI_TECH);
      base = 18 + 4 * yrs;
      designation = ladder(yrs, [[0, "Software Engineer"], [3, "Software Engineer II"], [6, "Senior Software Engineer"], [10, "Staff Software Engineer"]]);
    } else {
      const co = pickCo(c, TECH_COS, c.tier);
      company = co.name;
      if (co.tier === 1) {
        base = 26 + 4 * yrs;
        designation = ladder(yrs, [[0, "Software Engineer"], [3, "Software Engineer II"], [5, "Senior Software Engineer"], [9, "Staff Software Engineer"]]);
      } else if (co.tier === 2) {
        base = 15 + 3.2 * yrs;
        designation = ladder(yrs, [[0, "SDE I"], [2, "SDE II"], [5, "Senior SDE"], [8, r.pick(["Engineering Manager", "Principal Engineer", "Staff Engineer"])]]);
      } else {
        base = 4.5 + 1.7 * yrs;
        designation = ladder(yrs, [[0, "Software Engineer"], [3, "Senior Software Engineer"], [6, "Technical Lead"], [10, r.pick(["Project Manager", "Associate Architect", "Delivery Manager"])]]);
      }
    }
    if (r.chance(0.12)) designation = designation.replace(/Software Engineer|SDE/, r.pick(["Backend Engineer", "Frontend Engineer", "DevOps Engineer", "Mobile Engineer"])).replace("Backend Engineer I", "Backend Engineer");
    return { profession: "Software", degree, ugCollege, ...pg, educationLevel: pg.postGradDegree ? 3 : 2, company, designation, incomeLpa: finishIncome(c, base), workMode: wm(r, TECH_WM) };
  },
};

const data: Track = {
  key: "data", profession: "Data & Analytics", weightM: 5, weightF: 6, nriOk: true,
  build(c) {
    const r = c.rng;
    const engg = r.chance(0.6);
    const degree = engg ? r.weighted(ENGG_BRANCHES) : r.pick(["B.Sc Statistics", "B.Sc Mathematics", "B.Sc Economics", "BA Economics (Hons)"]);
    const ugCollege = engg ? ugEngg(c) : ugArts(c);
    let pg: { postGradDegree?: string; postGradCollege?: string } = {};
    if (c.nri) pg = abroadPG(c, r.pick(["MS Data Science", "MS Business Analytics", "MS Statistics"]));
    else if (!engg || r.chance(0.3)) pg = { postGradDegree: r.pick(["M.Sc Statistics", "M.Stat", "M.Sc Data Science", "MA Economics"]), postGradCollege: r.pick(["Indian Statistical Institute, Kolkata", "Delhi School of Economics", "IIT Bombay", "University of Hyderabad", "Christ University, Bangalore", "Madras School of Economics"]) };
    const yrs = Math.max(0, c.age - (pg.postGradDegree ? 24 : 22));
    const cos: Co[] = [
      { name: "Amazon", tier: 1, cities: [BLR, HYD, CHE] }, { name: "American Express", tier: 1, cities: [GGN, BLR] }, { name: "Flipkart", tier: 1, cities: [BLR] },
      { name: "ZS Associates", tier: 2, cities: [PUN, GGN, BLR] }, { name: "Fractal Analytics", tier: 2, cities: [MUM, BLR, GGN] }, { name: "Tiger Analytics", tier: 2, cities: [CHE, BLR] },
      { name: "Mu Sigma", tier: 3, cities: [BLR] }, { name: "LatentView Analytics", tier: 3, cities: [CHE] }, { name: "EXL Service", tier: 3, cities: [NOI, GGN, PUN] }, { name: "Genpact", tier: 3 },
    ];
    const co = c.nri ? { name: nriCo(c, NRI_TECH), tier: 1 as const } : pickCo(c, cos, c.tier);
    const base = c.nri ? 16 + 3.8 * yrs : co.tier === 1 ? 20 + 3.6 * yrs : co.tier === 2 ? 11 + 2.6 * yrs : 6 + 1.9 * yrs;
    const designation = ladder(yrs, [[0, "Data Analyst"], [2, "Data Scientist"], [5, "Senior Data Scientist"], [8, "Lead Data Scientist"]]);
    return { profession: "Data & Analytics", degree, ugCollege, ...pg, educationLevel: pg.postGradDegree ? 3 : 2, company: co.name, designation, incomeLpa: finishIncome(c, base), workMode: wm(r, TECH_WM) };
  },
};

function mbaTrack(key: string, profession: string, wM: number, wF: number, nriOk: boolean, cos: Co[], ladders: [number, string][], growth: [number, number, number], specialisation: string[]): Track {
  return {
    key, profession, weightM: wM, weightF: wF, nriOk,
    build(c) {
      const r = c.rng;
      const engg = r.chance(0.55);
      const degree = engg ? r.weighted(ENGG_BRANCHES) : r.pick(["B.Com", "BBA", "BA Economics (Hons)", "B.Com (Hons)"]);
      const ugCollege = engg ? ugEngg(c) : ugArts(c);
      const mbaCollege = c.tier === 1 ? r.pick(MBA_TOP) : c.tier === 2 ? r.pick(MBA_MID) : r.pick(MBA_LOW);
      const pg = c.nri && r.chance(0.5) ? abroadPG(c, "MBA") : { postGradDegree: `MBA (${r.pick(specialisation)})`, postGradCollege: mbaCollege };
      const yrs = Math.max(0, c.age - 26 - r.int(0, 1));
      let company: string, tier: number;
      if (c.nri) {
        company = nriCo(c, profession === "Product Management" ? NRI_TECH : NRI_FIN);
        tier = 1;
      } else {
        const co = pickCo(c, cos, c.tier);
        company = co.name;
        tier = co.tier;
      }
      const base = tier === 1 ? growth[0] + 4 * yrs : tier === 2 ? growth[1] + 3 * yrs : growth[2] + 2.2 * yrs;
      return { profession, degree, ugCollege, ...pg, educationLevel: 3, company, designation: ladder(yrs, ladders), incomeLpa: finishIncome(c, base), workMode: wm(r, OFFICE_WM) };
    },
  };
}

const product = mbaTrack("product", "Product Management", 4, 4, true,
  [{ name: "Google", tier: 1, cities: [BLR, HYD, GGN] }, { name: "Microsoft", tier: 1, cities: [HYD, BLR] }, { name: "Flipkart", tier: 1, cities: [BLR] }, { name: "Swiggy", tier: 2, cities: [BLR] }, { name: "Zomato", tier: 2, cities: [GGN] }, { name: "PhonePe", tier: 2, cities: [BLR, PUN] }, { name: "CRED", tier: 2, cities: [BLR] }, { name: "Meesho", tier: 2, cities: [BLR] }, { name: "Nykaa", tier: 2, cities: [MUM] }, { name: "Zoho", tier: 3, cities: [CHE] }, { name: "Paytm", tier: 3, cities: [NOI] }, { name: "Info Edge (Naukri)", tier: 3, cities: [NOI] }],
  [[0, "Associate Product Manager"], [2, "Product Manager"], [5, "Senior Product Manager"], [8, "Group Product Manager"]], [30, 22, 14], ["Marketing", "Strategy", "General Management"]);

const consulting = mbaTrack("consulting", "Consulting", 3, 3, true,
  [{ name: "McKinsey & Company", tier: 1, cities: [MUM, GGN, BLR, DEL] }, { name: "Boston Consulting Group", tier: 1, cities: [MUM, GGN, DEL] }, { name: "Bain & Company", tier: 1, cities: [MUM, GGN, BLR] }, { name: "Deloitte", tier: 2 }, { name: "EY", tier: 2 }, { name: "KPMG", tier: 2 }, { name: "PwC", tier: 2 }, { name: "Accenture Strategy", tier: 3 }, { name: "Kearney", tier: 2, cities: [MUM, GGN] }],
  [[0, "Associate"], [2, "Consultant"], [4, "Senior Consultant"], [7, "Manager"], [10, "Principal"]], [32, 16, 11], ["Strategy", "Finance", "Operations"]);

const marketing = mbaTrack("marketing", "Marketing", 3, 5, false,
  [{ name: "Hindustan Unilever", tier: 1, cities: [MUM] }, { name: "Procter & Gamble", tier: 1, cities: [MUM] }, { name: "ITC Limited", tier: 1, cities: [KOL, BLR, GGN] }, { name: "Nestle India", tier: 2, cities: [GGN] }, { name: "Asian Paints", tier: 2, cities: [MUM] }, { name: "Marico", tier: 2, cities: [MUM] }, { name: "Dabur", tier: 2, cities: [GGN, DEL] }, { name: "Titan Company", tier: 2, cities: [BLR] }, { name: "Godrej Consumer Products", tier: 2, cities: [MUM] }, { name: "Amul (GCMMF)", tier: 3, cities: [AHM] }, { name: "Britannia Industries", tier: 3, cities: [BLR, KOL] }, { name: "Reliance Retail", tier: 3, cities: [MUM] }, { name: "Ogilvy", tier: 3, cities: [MUM, GGN, BLR] }],
  [[0, "Assistant Brand Manager"], [2, "Brand Manager"], [5, "Senior Brand Manager"], [8, "Marketing Head"]], [24, 15, 9], ["Marketing"]);

const hr = mbaTrack("hr", "Human Resources", 1, 6, false,
  [{ name: "Amazon", tier: 1, cities: [BLR, HYD] }, { name: "Google", tier: 1, cities: [BLR, HYD] }, { name: "Adobe", tier: 1, cities: [NOI, BLR] }, { name: "Deloitte", tier: 2 }, { name: "Tata Steel", tier: 2, cities: [KOL] }, { name: "Mahindra Group", tier: 2, cities: [MUM, PUN] }, { name: "Infosys", tier: 3 }, { name: "Accenture", tier: 3 }, { name: "Wipro", tier: 3 }, { name: "HDFC Bank", tier: 3 }],
  [[0, "HR Executive"], [2, "HR Business Partner"], [5, "Senior HR Business Partner"], [8, "HR Lead"]], [20, 12, 6], ["Human Resources"]);

const banking: Track = {
  key: "banking", profession: "Banking", weightM: 6, weightF: 5, nriOk: true,
  build(c) {
    const r = c.rng;
    const degree = r.pick(["B.Com", "BBA", "B.Com (Hons)", "BA Economics (Hons)"]);
    const ugCollege = ugArts(c);
    const hasMba = r.chance(0.75);
    const pg = hasMba ? (c.nri && r.chance(0.5) ? abroadPG(c, "MS Finance") : { postGradDegree: "MBA (Finance)", postGradCollege: c.tier === 1 ? r.pick(MBA_TOP) : c.tier === 2 ? r.pick(MBA_MID) : r.pick(MBA_LOW) }) : {};
    const yrs = Math.max(0, c.age - (hasMba ? 25 : 22));
    const cos: Co[] = [
      { name: "Goldman Sachs", tier: 1, cities: [MUM, BLR] }, { name: "JP Morgan", tier: 1, cities: [MUM, BLR, HYD] }, { name: "Morgan Stanley", tier: 1, cities: [MUM, BLR] }, { name: "Kotak Investment Banking", tier: 1, cities: [MUM] }, { name: "Avendus Capital", tier: 1, cities: [MUM] },
      { name: "Citi", tier: 2, cities: [MUM, GGN, PUN, CHE] }, { name: "HSBC", tier: 2, cities: [MUM, HYD, PUN] }, { name: "Standard Chartered", tier: 2, cities: [MUM, CHE, BLR] }, { name: "Barclays", tier: 2, cities: [PUN, MUM] },
      { name: "HDFC Bank", tier: 3 }, { name: "ICICI Bank", tier: 3 }, { name: "Axis Bank", tier: 3 }, { name: "Kotak Mahindra Bank", tier: 3 }, { name: "Yes Bank", tier: 3, cities: [MUM, DEL, GGN] },
    ];
    const co = c.nri ? { name: nriCo(c, NRI_FIN), tier: 1 as const } : pickCo(c, cos, c.tier);
    const base = co.tier === 1 ? 24 + 5 * yrs : co.tier === 2 ? 14 + 3 * yrs : 6 + 2.2 * yrs;
    const designation = co.tier === 1
      ? ladder(yrs, [[0, "Analyst"], [3, "Associate"], [6, "Vice President"]])
      : co.tier === 2 ? ladder(yrs, [[0, "Analyst"], [2, "Assistant Vice President"], [6, "Vice President"]])
      : ladder(yrs, [[0, "Relationship Manager"], [3, "Senior Relationship Manager"], [5, "Deputy Manager"], [8, "Branch Manager"]]);
    return { profession: "Banking", degree, ugCollege, ...pg, educationLevel: hasMba ? 3 : 2, company: co.name, designation, incomeLpa: finishIncome(c, base), workMode: wm(r, OFFICE_WM) };
  },
};

const ca: Track = {
  key: "ca", profession: "Finance", weightM: 6, weightF: 6, nriOk: true,
  build(c) {
    const r = c.rng;
    const degree = r.pick(["B.Com", "B.Com (Hons)", "B.Com (Accounting & Finance)"]);
    const ugCollege = ugArts(c);
    const yrs = Math.max(0, c.age - 24);
    const cos: Co[] = [
      { name: "Deloitte", tier: 1 }, { name: "EY", tier: 1 }, { name: "KPMG", tier: 1 }, { name: "PwC", tier: 1 },
      { name: "Reliance Industries", tier: 2, cities: [MUM] }, { name: "Tata Steel", tier: 2, cities: [KOL] }, { name: "Aditya Birla Group", tier: 2, cities: [MUM] }, { name: "Infosys", tier: 2, cities: [BLR, PUN, HYD] }, { name: "Hindustan Unilever", tier: 2, cities: [MUM] },
      { name: "Grant Thornton Bharat", tier: 3 }, { name: "BDO India", tier: 3, cities: [MUM, DEL, GGN, BLR] }, { name: `${c.lastName} & Associates (CA firm)`, tier: 3 },
    ];
    const co = c.nri ? { name: nriCo(c, NRI_FIN), tier: 1 as const } : pickCo(c, cos, c.tier);
    const base = co.tier === 1 ? 10 + 2.8 * yrs : co.tier === 2 ? 12 + 3 * yrs : 7 + 2.2 * yrs;
    const designation = co.name.endsWith("(CA firm)") ? "Partner" : co.tier === 2
      ? ladder(yrs, [[0, "Finance Executive"], [2, "Finance Manager"], [6, "Senior Finance Manager"], [9, "Financial Controller"]])
      : ladder(yrs, [[0, "Associate"], [2, "Assistant Manager"], [4, "Manager"], [7, "Senior Manager"], [11, "Associate Director"]]);
    return { profession: "Finance", degree, ugCollege, postGradDegree: "Chartered Accountant (CA)", postGradCollege: "ICAI", educationLevel: 3, company: co.name, designation, incomeLpa: finishIncome(c, base), workMode: wm(r, OFFICE_WM) };
  },
};

const HOSPITALS: Co[] = [
  { name: "Apollo Hospitals", tier: 1, cities: [CHE, HYD, DEL, BLR, KOL, AHM] }, { name: "Fortis Healthcare", tier: 1, cities: [DEL, GGN, MUM, BLR, NOI, "Ludhiana"] }, { name: "Max Healthcare", tier: 1, cities: [DEL, NOI, GGN] },
  { name: "Manipal Hospitals", tier: 1, cities: [BLR, PUN, "Mangalore"] }, { name: "Narayana Health", tier: 2, cities: [BLR, KOL, AHM, "Jaipur"] }, { name: "Kokilaben Dhirubhai Ambani Hospital", tier: 1, cities: [MUM] },
  { name: "Lilavati Hospital", tier: 2, cities: [MUM] }, { name: "Ruby Hall Clinic", tier: 2, cities: [PUN] }, { name: "Jehangir Hospital", tier: 2, cities: [PUN] }, { name: "Medanta", tier: 1, cities: [GGN, "Lucknow", "Patna", "Indore"] },
  { name: "AMRI Hospitals", tier: 2, cities: [KOL] }, { name: "KIMS Hospitals", tier: 2, cities: [HYD, "Visakhapatnam", "Thiruvananthapuram"] }, { name: "Yashoda Hospitals", tier: 2, cities: [HYD] }, { name: "Aster Medcity", tier: 2, cities: ["Kochi", BLR] },
  { name: "Zydus Hospitals", tier: 2, cities: [AHM, "Vadodara"] }, { name: "Kauvery Hospital", tier: 2, cities: [CHE] }, { name: "PSG Hospitals", tier: 3, cities: ["Coimbatore"] }, { name: "Government District Hospital", tier: 3 }, { name: "Own clinic", tier: 3 },
];

const MD_SPECS = ["MD (General Medicine)", "MD (Paediatrics)", "MD (Dermatology)", "MD (Radiology)", "MD (Anaesthesiology)", "MD (Psychiatry)", "MS (General Surgery)", "MS (Orthopaedics)", "MS (Obstetrics & Gynaecology)", "MS (Ophthalmology)"];

const medicine: Track = {
  key: "medicine", profession: "Medicine", weightM: 7, weightF: 9, nriOk: true,
  build(c) {
    const r = c.rng;
    const ugCollege = ugMed(c);
    const pgDone = c.age >= 28 && r.chance(0.8);
    const spec = r.pick(MD_SPECS.filter((s) => c.gender === "Female" || !s.includes("Gynaecology")));
    const pg = pgDone ? { postGradDegree: spec, postGradCollege: r.chance(0.4) ? r.pick(MED_PG) : r.pick(MED_BY_STATE[c.homeState] ?? MED_PG) } : {};
    const specName = spec.replace(/^M[DS] \((.*)\)$/, "$1");
    const yrsAfter = Math.max(0, c.age - (pgDone ? 29 : 24));
    let company: string, designation: string, base: number;
    if (c.nri) {
      company = nriCo(c, NRI_MED);
      designation = pgDone ? `${c.country === "UK" ? "Specialty Registrar" : "Attending Physician"}, ${specName}` : c.country === "USA" ? "Resident Physician" : "Junior Clinical Fellow";
      base = pgDone ? 30 + 4 * yrsAfter : 18;
    } else {
      const co = pickCo(c, HOSPITALS, c.tier);
      company = co.name;
      if (pgDone) {
        designation = co.name === "Own clinic" ? `${specName} Specialist (private practice)` : yrsAfter >= 4 ? `Consultant ${specName}` : `Associate Consultant, ${specName}`;
        base = (co.tier === 1 ? 20 : 15) + 3.5 * yrsAfter;
      } else {
        designation = co.name === "Own clinic" ? "General Physician" : c.age <= 27 ? "Junior Resident" : "Medical Officer";
        base = 7 + 1.2 * yrsAfter;
      }
      if (co.name === "Own clinic") company = `${c.lastName} Clinic`;
    }
    return { profession: "Medicine", degree: "MBBS", ugCollege, ...pg, educationLevel: pgDone ? 4 : 2, company, designation, incomeLpa: finishIncome(c, base), workMode: "Onsite" };
  },
};

const dental: Track = {
  key: "dental", profession: "Medicine", weightM: 1, weightF: 3, nriOk: false,
  build(c) {
    const r = c.rng;
    const mds = c.age >= 27 && r.chance(0.45);
    const yrs = Math.max(0, c.age - (mds ? 27 : 23));
    const own = r.chance(0.4);
    const spec = r.pick(["Orthodontics", "Endodontics", "Prosthodontics", "Periodontics", "Oral Surgery"]);
    return {
      profession: "Medicine", degree: "BDS", ugCollege: r.pick(DENTAL_COLLEGES),
      ...(mds ? { postGradDegree: `MDS (${spec})`, postGradCollege: r.pick(DENTAL_COLLEGES) } : {}),
      educationLevel: mds ? 3 : 2,
      company: own ? `${c.lastName} Dental Care` : r.pick(["Clove Dental", "Sabka Dentist", "Apollo White Dental", "Partha Dental"]),
      designation: own ? (mds ? `${spec.replace(/ics$/, "ist").replace("Oral Surgery", "Oral Surgeon")} (own practice)` : "Dentist (own practice)") : mds ? "Consultant Dentist" : "Dental Surgeon",
      incomeLpa: finishIncome(c, 5 + 1.6 * yrs + (mds ? 4 : 0)), workMode: "Onsite",
    };
  },
};

const law: Track = {
  key: "law", profession: "Law", weightM: 3, weightF: 4, nriOk: false,
  build(c) {
    const r = c.rng;
    const top = c.tier === 1 || (c.tier === 2 && r.chance(0.3));
    const ugCollege = top ? r.pick(LAW_TOP) : r.pick(LAW_MID);
    const degree = ugCollege.includes("Delhi University") ? "LLB" : "BA LLB (Hons)";
    const llm = r.chance(0.15) && c.age >= 27;
    const yrs = Math.max(0, c.age - 23 - (llm ? 1 : 0));
    const cos: Co[] = [
      { name: "Cyril Amarchand Mangaldas", tier: 1, cities: [MUM, DEL, BLR] }, { name: "Shardul Amarchand Mangaldas", tier: 1, cities: [DEL, MUM, BLR] }, { name: "AZB & Partners", tier: 1, cities: [MUM, DEL, BLR] }, { name: "Khaitan & Co", tier: 1, cities: [KOL, MUM, DEL, BLR] }, { name: "Trilegal", tier: 1, cities: [MUM, DEL, BLR] },
      { name: "JSA Advocates & Solicitors", tier: 2, cities: [MUM, DEL, GGN, BLR, HYD, CHE] }, { name: "Saraf and Partners", tier: 2, cities: [DEL, MUM] }, { name: "Reliance Industries (Legal)", tier: 2, cities: [MUM] }, { name: "Tata Consultancy Services (Legal)", tier: 2, cities: [MUM, CHE] },
      { name: "Independent Practice", tier: 3 },
    ];
    const co = pickCo(c, cos, top ? 1 : 2 + (r.chance(0.5) ? 1 : 0));
    const base = co.tier === 1 ? 16 + 4 * yrs : co.tier === 2 ? 9 + 2.6 * yrs : 4 + 2.5 * yrs;
    const court = c.city === "Delhi" ? "Delhi High Court" : c.city === "Mumbai" ? "Bombay High Court" : c.city === "Chennai" ? "Madras High Court" : c.city === "Bangalore" ? "Karnataka High Court" : "District & Sessions Court";
    const designation = co.name === "Independent Practice" ? `Advocate, ${court}` : co.name.includes("(Legal)") ? ladder(yrs, [[0, "Legal Counsel"], [5, "Senior Legal Counsel"]]) : ladder(yrs, [[0, "Associate"], [3, "Senior Associate"], [6, "Principal Associate"], [9, "Partner"]]);
    return { profession: "Law", degree, ugCollege, ...(llm ? { postGradDegree: "LLM", postGradCollege: r.pick(["NLSIU Bangalore", "National Law University, Delhi", "University of Cambridge", "Harvard Law School"]) } : {}), educationLevel: llm ? 3 : 2, company: co.name, designation, incomeLpa: finishIncome(c, base), workMode: wm(r, OFFICE_WM) };
  },
};

const design: Track = {
  key: "design", profession: "Design & Architecture", weightM: 2, weightF: 5, nriOk: false,
  build(c) {
    const r = c.rng;
    const arch = r.chance(0.4);
    if (arch) {
      const yrs = Math.max(0, c.age - 23);
      const co = r.pick(["Morphogenesis", "Studio Lotus", "Hafeez Contractor", "Sanjay Puri Architects", "CP Kukreja Architects", "Mindspace Architects", `${c.lastName} Design Studio`]);
      return { profession: "Design & Architecture", degree: "B.Arch", ugCollege: r.pick(ARCH_COLLEGES), educationLevel: 2, company: co, designation: co.endsWith("Design Studio") ? "Principal Architect" : ladder(yrs, [[0, "Junior Architect"], [3, "Architect"], [6, "Senior Architect"], [9, "Associate Partner"]]), incomeLpa: finishIncome(c, 5 + 2 * yrs), workMode: "Onsite" };
    }
    const yrs = Math.max(0, c.age - 22);
    const ux = r.chance(0.65);
    const degree = r.pick(["B.Des (Communication Design)", "B.Des (Interaction Design)", "B.Des (Fashion Design)"]);
    const pg = r.chance(0.3) && c.age >= 25 ? { postGradDegree: "M.Des", postGradCollege: r.pick(["IDC School of Design, IIT Bombay", "NID Ahmedabad", "IISc Bangalore (CPDM)"]) } : {};
    const company = ux ? (pickCo(c, TECH_COS, 2).name) : r.pick(["Fabindia", "Myntra", "Sabyasachi", "Titan Company", "Raymond", "Pantaloons"]);
    const designation = ux ? ladder(yrs, [[0, "UX Designer"], [3, "Product Designer"], [5, "Senior Product Designer"], [8, "Design Lead"]]) : ladder(yrs, [[0, "Assistant Designer"], [3, "Designer"], [6, "Senior Designer"], [9, "Design Manager"]]);
    return { profession: "Design & Architecture", degree: ux ? degree.replace("Fashion", "Interaction") : degree, ugCollege: r.pick(DESIGN_COLLEGES), ...pg, educationLevel: pg.postGradDegree ? 3 : 2, company, designation, incomeLpa: finishIncome(c, (ux ? 9 : 5) + (ux ? 3 : 1.8) * yrs), workMode: wm(r, TECH_WM) };
  },
};

const government: Track = {
  key: "government", profession: "Government", weightM: 4, weightF: 3, nriOk: false,
  build(c) {
    const r = c.rng;
    const kind = r.weighted<string>([["sbi", 30], ["rbi", 10], ["isro", 15], ["civil", 10], ["psu", 25], ["railways", 10]]);
    const yrs = Math.max(0, c.age - 24);
    const engg = kind === "isro" || kind === "psu" || kind === "railways";
    const degree = engg ? r.pick(["B.Tech Mechanical Engineering", "B.Tech Electrical Engineering", "B.Tech Electronics & Communication", "B.Tech Civil Engineering"]) : r.pick(["B.Com", "BA Political Science", "BA History (Hons)", "B.Sc Physics", "BA Economics (Hons)"]);
    const ugCollege = engg ? ugEngg(c) : ugArts(c);
    const map: Record<string, { company: string; ladder: [number, string][]; base: number; g: number }> = {
      sbi: { company: "State Bank of India", ladder: [[0, "Probationary Officer"], [2, "Assistant Manager"], [5, "Deputy Manager"], [9, "Manager"]], base: 8.5, g: 1.1 },
      rbi: { company: "Reserve Bank of India", ladder: [[0, "Grade B Officer"], [5, "Manager (Grade C)"]], base: 17, g: 1.4 },
      isro: { company: r.pick(["ISRO", "DRDO"]), ladder: [[0, "Scientist/Engineer 'SC'"], [4, "Scientist/Engineer 'SD'"], [8, "Scientist/Engineer 'SE'"]], base: 10, g: 1.3 },
      civil: { company: r.pick(["Indian Revenue Service", "Indian Administrative Service", "Indian Foreign Service", "Indian Police Service"]), ladder: [[0, "Assistant Commissioner"], [4, "Deputy Commissioner"], [8, "Joint Commissioner"]], base: 11, g: 1.5 },
      psu: { company: r.pick(["ONGC", "NTPC", "BHEL", "Indian Oil Corporation", "GAIL", "Power Grid Corporation"]), ladder: [[0, "Assistant Executive Engineer"], [3, "Executive Engineer"], [7, "Senior Manager"]], base: 12, g: 1.3 },
      railways: { company: "Indian Railways", ladder: [[0, "Assistant Divisional Engineer"], [5, "Divisional Engineer"], [9, "Senior Divisional Engineer"]], base: 10, g: 1.4 },
    };
    const m = map[kind];
    let designation = ladder(yrs, m.ladder);
    if (kind === "civil") designation = m.company === "Indian Revenue Service" ? `${designation} of Income Tax` : m.company === "Indian Administrative Service" ? ladder(yrs, [[0, "Sub-Divisional Magistrate"], [4, "District Collector"]]) : m.company === "Indian Police Service" ? ladder(yrs, [[0, "Assistant Superintendent of Police"], [4, "Superintendent of Police"]]) : ladder(yrs, [[0, "Third Secretary"], [4, "First Secretary"]]);
    const pg = kind === "civil" && r.chance(0.4) ? { postGradDegree: "MA Public Policy", postGradCollege: r.pick(["Jawaharlal Nehru University", "Delhi School of Economics", "TISS Mumbai"]) } : {};
    return { profession: "Government", degree, ugCollege, ...pg, educationLevel: pg.postGradDegree ? 3 : 2, company: m.company, designation, incomeLpa: finishIncome(c, m.base + m.g * yrs), workMode: "Onsite" };
  },
};

const education: Track = {
  key: "education", profession: "Education", weightM: 1, weightF: 6, nriOk: false,
  build(c) {
    const r = c.rng;
    const phd = c.age >= 28 && r.chance(0.45);
    const subj = r.pick(["Physics", "Chemistry", "Mathematics", "English Literature", "Economics", "Psychology", "Biotechnology", "History"]);
    const isSci = ["Physics", "Chemistry", "Mathematics", "Biotechnology"].includes(subj);
    const degree = `${isSci ? "B.Sc" : "BA"} ${subj}`;
    const ugCollege = ugArts(c);
    const yrs = Math.max(0, c.age - (phd ? 29 : 24));
    if (phd) {
      return { profession: "Education", degree, ugCollege, postGradDegree: `PhD ${subj}`, postGradCollege: r.pick(["IISc Bangalore", "IIT Bombay", "Jawaharlal Nehru University", "University of Hyderabad", "TIFR Mumbai", "IISER Pune", "Delhi University"]), educationLevel: 4, company: r.pick(["Christ University", "Ashoka University", "Delhi University", "Symbiosis International University", "Manipal Academy of Higher Education", "VIT Vellore", "Amity University", "IISER Pune"]), designation: ladder(yrs, [[0, "Assistant Professor"], [6, "Associate Professor"]]), incomeLpa: finishIncome(c, 9 + 1.5 * yrs), workMode: "Onsite" };
    }
    return { profession: "Education", degree, ugCollege, postGradDegree: r.chance(0.6) ? `${isSci ? "M.Sc" : "MA"} ${subj}` : "B.Ed", postGradCollege: r.pick(ARTS_BY_STATE[c.homeState] ?? ARTS_TOP).replace(/ \*$/, ""), educationLevel: 3, company: r.pick(["Delhi Public School", "The Cathedral & John Connon School", "Kendriya Vidyalaya", "Ryan International School", "Podar International School", "National Public School", "BYJU'S", "Unacademy"]), designation: ladder(yrs, [[0, `${subj} Teacher`], [6, `Senior ${subj} Teacher`], [9, "Head of Department"]]), incomeLpa: finishIncome(c, 4.5 + 0.8 * yrs), workMode: "Onsite" };
  },
};

const business: Track = {
  key: "business", profession: "Business", weightM: 8, weightF: 2, nriOk: false,
  build(c) {
    const r = c.rng;
    const degree = r.pick(["B.Com", "BBA", "BMS", "B.Com (Hons)"]);
    const ugCollege = ugArts(c);
    const pg = r.chance(0.35) ? { postGradDegree: r.pick(["MBA (Family Business)", "MBA (Entrepreneurship)", "PGDM"]), postGradCollege: r.pick(c.tier === 1 ? [...MBA_TOP, "S. P. Jain Institute (Family Business)"] : MBA_MID) } : {};
    const line = r.pick(["Textiles", "Pharmaceutical Distribution", "Jewellers", "Steel Trading", "Real Estate Developers", "Auto Components", "Packaging", "Exports", "Agro Foods", "Hardware & Sanitaryware", "Hotels", "Logistics", "Chemicals", "Electronics Retail"]);
    const own = r.chance(0.2);
    const company = own ? r.pick(["a D2C snack brand", "a boutique travel agency", "a co-working space", "a specialty coffee roastery", "a digital marketing agency", "an EdTech startup"]).replace(/^an? /, "").replace(/^\w/, (s) => s.toUpperCase()) : `${c.lastName} ${line}`;
    const designation = own ? r.pick(["Founder", "Co-founder & CEO"]) : r.pick(["Director", "Partner", "Managing Director", "Director (Operations)"]);
    const yrs = Math.max(0, c.age - 22);
    const base = 8 + r.float(0, 28) + 1.4 * yrs + (c.tier === 1 ? 8 : 0);
    return { profession: "Business", degree, ugCollege, ...pg, educationLevel: pg.postGradDegree ? 3 : 2, company: own ? company : company, designation, incomeLpa: finishIncome(c, base), workMode: "Onsite" };
  },
};

const engineering: Track = {
  key: "engineering", profession: "Engineering", weightM: 9, weightF: 3, nriOk: true,
  build(c) {
    const r = c.rng;
    const degree = r.pick(["B.Tech Mechanical Engineering", "B.Tech Civil Engineering", "B.Tech Electrical Engineering", "B.Tech Chemical Engineering", "B.E. Mechanical Engineering", "B.Tech Electronics & Communication"]);
    const ugCollege = ugEngg(c);
    const pg: { postGradDegree?: string; postGradCollege?: string } = c.nri && r.chance(0.6) ? abroadPG(c, r.pick(["MS Mechanical Engineering", "MS Civil Engineering", "MS Engineering Management"])) : r.chance(0.15) ? { postGradDegree: r.pick(["M.Tech Structural Engineering", "M.Tech Thermal Engineering", "M.Tech Power Systems"]), postGradCollege: r.pick(["IIT Bombay", "IIT Madras", "IIT Kharagpur", "NIT Trichy", "IIT Roorkee"]) } : {};
    const yrs = Math.max(0, c.age - (pg.postGradDegree ? 24 : 22));
    const cos: Co[] = [
      { name: "Tata Motors", tier: 1, cities: [PUN, MUM] }, { name: "Mahindra & Mahindra", tier: 1, cities: [MUM, PUN, CHE] }, { name: "Larsen & Toubro", tier: 1 }, { name: "Bosch", tier: 1, cities: [BLR, PUN] }, { name: "Siemens", tier: 1, cities: [MUM, PUN, GGN] }, { name: "Reliance Industries", tier: 1, cities: [MUM, "Surat", AHM, "Vadodara"] },
      { name: "Maruti Suzuki", tier: 2, cities: [GGN] }, { name: "Bajaj Auto", tier: 2, cities: [PUN] }, { name: "Ashok Leyland", tier: 2, cities: [CHE] }, { name: "Honeywell", tier: 2, cities: [PUN, BLR, HYD] }, { name: "Hyundai Motor India", tier: 2, cities: [CHE] }, { name: "Tata Steel", tier: 2, cities: [KOL] }, { name: "Godrej & Boyce", tier: 2, cities: [MUM] },
      { name: "Shapoorji Pallonji", tier: 3, cities: [MUM, PUN] }, { name: "Afcons Infrastructure", tier: 3 }, { name: "Thermax", tier: 3, cities: [PUN] }, { name: "Kirloskar Brothers", tier: 3, cities: [PUN] }, { name: "Tata Projects", tier: 3, cities: [HYD, MUM] }, { name: "Adani Group", tier: 3, cities: [AHM, MUM] },
    ];
    const co = c.nri ? { name: nriCo(c, NRI_ENGG), tier: 1 as const } : pickCo(c, cos, c.tier);
    const base = co.tier === 1 ? 8 + 2.3 * yrs : co.tier === 2 ? 7 + 2 * yrs : 5 + 1.7 * yrs;
    const designation = ladder(yrs, [[0, "Graduate Engineer Trainee"], [1, "Engineer"], [3, "Senior Engineer"], [5, "Assistant Manager"], [8, "Deputy Manager"], [11, "Manager"]]);
    return { profession: "Engineering", degree, ugCollege, ...pg, educationLevel: pg.postGradDegree ? 3 : 2, company: co.name, designation, incomeLpa: finishIncome(c, base), workMode: wm(r, [["Onsite", 75], ["Hybrid", 25]]) };
  },
};

const pharma: Track = {
  key: "pharma", profession: "Pharma & Biotech", weightM: 2, weightF: 3, nriOk: true,
  build(c) {
    const r = c.rng;
    const degree = r.pick(["B.Pharm", "B.Tech Biotechnology", "B.Sc Microbiology"]);
    const pg = c.nri ? abroadPG(c, r.pick(["MS Biotechnology", "MS Pharmaceutical Sciences"])) : { postGradDegree: r.pick(["M.Pharm (Pharmaceutics)", "M.Sc Biotechnology", "M.Tech Biotechnology", "M.Pharm (Regulatory Affairs)"]), postGradCollege: r.pick(PHARMA_COLLEGES) };
    const yrs = Math.max(0, c.age - 24);
    const cos: Co[] = [
      { name: "Sun Pharma", tier: 1, cities: [MUM, "Vadodara"] }, { name: "Dr. Reddy's Laboratories", tier: 1, cities: [HYD] }, { name: "Biocon", tier: 1, cities: [BLR] }, { name: "Novartis", tier: 1, cities: [HYD, MUM] },
      { name: "Cipla", tier: 2, cities: [MUM, PUN] }, { name: "Lupin", tier: 2, cities: [MUM, PUN] }, { name: "Zydus Lifesciences", tier: 2, cities: [AHM] }, { name: "Glenmark", tier: 2, cities: [MUM] }, { name: "Syngene International", tier: 2, cities: [BLR] },
      { name: "Aurobindo Pharma", tier: 3, cities: [HYD] }, { name: "Torrent Pharma", tier: 3, cities: [AHM] }, { name: "Serum Institute of India", tier: 3, cities: [PUN] }, { name: "Alkem Laboratories", tier: 3, cities: [MUM] }, { name: "IQVIA", tier: 3 },
    ];
    const co = c.nri ? { name: r.pick(["Pfizer", "Novartis", "AstraZeneca", "Moderna", "Genentech"]), tier: 1 as const } : pickCo(c, cos, c.tier);
    const base = (co.tier === 1 ? 8 : 6) + 1.9 * yrs;
    const designation = ladder(yrs, [[0, "Research Associate"], [2, "Scientist"], [5, "Senior Scientist"], [8, r.pick(["Principal Scientist", "Regulatory Affairs Manager", "Quality Assurance Manager"])]]);
    return { profession: "Pharma & Biotech", degree, ugCollege: degree === "B.Pharm" ? r.pick(PHARMA_COLLEGES) : ugArts(c), ...pg, educationLevel: 3, company: co.name, designation, incomeLpa: finishIncome(c, base), workMode: "Onsite" };
  },
};

const media: Track = {
  key: "media", profession: "Media & Communications", weightM: 1, weightF: 4, nriOk: false,
  build(c) {
    const r = c.rng;
    const degree = r.pick(["BA Mass Media", "BA Journalism", "BA English (Hons)", "BMM"]);
    const pg = r.chance(0.5) ? { postGradDegree: r.pick(["PG Diploma in Journalism", "MA Mass Communication", "PG Diploma in Advertising & PR"]), postGradCollege: r.pick(["IIMC Delhi", "Asian College of Journalism, Chennai", "Xavier Institute of Communications, Mumbai", "Symbiosis Institute of Media & Communication", "MICA Ahmedabad"]) } : {};
    const yrs = Math.max(0, c.age - 22);
    const co = r.pick(["Ogilvy", "Leo Burnett", "Dentsu", "The Times of India", "Hindustan Times", "NDTV", "Netflix India", "Amazon Prime Video", "Viacom18", "Edelman", "Adfactors PR", "The Hindu"]);
    const news = ["The Times of India", "Hindustan Times", "NDTV", "The Hindu"].includes(co);
    const ott = co.includes("Netflix") || co.includes("Prime") || co === "Viacom18";
    const designation = news ? ladder(yrs, [[0, "Correspondent"], [3, "Senior Correspondent"], [7, "Associate Editor"]]) : ott ? ladder(yrs, [[0, "Content Executive"], [3, "Content Strategist"], [6, "Content Lead"]]) : ladder(yrs, [[0, r.pick(["Copywriter", "Account Executive", "PR Executive"])], [3, r.pick(["Senior Copywriter", "Account Manager"])], [6, r.pick(["Creative Director", "Account Director"])]]);
    return { profession: "Media & Communications", degree, ugCollege: ugArts(c), ...pg, educationLevel: pg.postGradDegree ? 3 : 2, company: co, designation, incomeLpa: finishIncome(c, (ott ? 9 : 5) + 1.8 * yrs), workMode: wm(r, OFFICE_WM) };
  },
};

const aviation: Track = {
  key: "aviation", profession: "Aviation", weightM: 1, weightF: 0.5, nriOk: false,
  build(c) {
    const r = c.rng;
    const yrs = Math.max(0, c.age - 22);
    const captain = yrs >= 8;
    return { profession: "Aviation", degree: r.pick(["B.Sc Aviation", "B.Sc Physics", "Commercial Pilot Licence (CPL)"]), ugCollege: r.pick(["Indira Gandhi Rashtriya Uran Akademi", "Bombay Flying Club", "CAE Oxford Aviation Academy", "Rajiv Gandhi National Aviation University"]), educationLevel: 2, company: r.pick(["IndiGo", "Air India", "Akasa Air", "Vistara (Air India)"]), designation: captain ? "Captain" : yrs >= 3 ? "Senior First Officer" : "First Officer", incomeLpa: finishIncome(c, captain ? 58 + 3 * (yrs - 8) : 28 + 3 * yrs), workMode: "Onsite" };
  },
};

export const TRACKS: Track[] = [software, data, product, consulting, marketing, hr, banking, ca, medicine, dental, law, design, government, education, business, engineering, pharma, media, aviation];
export const TRACK_BY_KEY: Record<string, Track> = Object.fromEntries(TRACKS.map((t) => [t.key, t]));
void ALL;

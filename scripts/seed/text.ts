import type { Profile } from "../../lib/types";
import type { Rng } from "./rng";

export const HOBBIES = [
  "Reading", "Trekking", "Cooking", "Baking", "Travelling", "Photography", "Running", "Cycling", "Yoga", "Gym",
  "Badminton", "Cricket", "Football", "Tennis", "Swimming", "Painting", "Sketching", "Classical music", "Singing",
  "Playing guitar", "Playing keyboard", "Bharatanatyam", "Kathak", "Bollywood dance", "Movies", "Theatre",
  "Stand-up comedy", "Board games", "Chess", "Gardening", "Volunteering", "Writing", "Podcasts", "Video games",
  "Meditation", "Pottery", "Birdwatching", "Scuba diving", "Wildlife safaris", "Road trips", "Cafe hopping", "Investing",
] as const;

/** hobbies -> natural phrase for prose */
const HOBBY_PHRASE: Record<string, string> = {
  Reading: "a good book", Trekking: "weekend treks", Cooking: "cooking for friends", Baking: "baking on Sundays",
  Travelling: "travelling to new places", Photography: "street photography", Running: "early-morning runs",
  Cycling: "long cycle rides", Yoga: "my yoga practice", Gym: "the gym", Badminton: "badminton", Cricket: "weekend cricket",
  Football: "football", Tennis: "tennis", Swimming: "swimming", Painting: "painting", Sketching: "sketching",
  "Classical music": "classical music", Singing: "singing", "Playing guitar": "playing the guitar",
  "Playing keyboard": "the keyboard", Bharatanatyam: "Bharatanatyam", Kathak: "Kathak", "Bollywood dance": "dancing",
  Movies: "movies", Theatre: "theatre", "Stand-up comedy": "stand-up comedy shows", "Board games": "board-game nights",
  Chess: "chess", Gardening: "my balcony garden", Volunteering: "volunteering", Writing: "writing", Podcasts: "podcasts",
  "Video games": "video games", Meditation: "meditation", Pottery: "pottery", Birdwatching: "birdwatching",
  "Scuba diving": "scuba diving", "Wildlife safaris": "wildlife safaris", "Road trips": "road trips",
  "Cafe hopping": "discovering new cafes", Investing: "reading about markets and investing",
};

export function pickHobbies(r: Rng, gender: string, fitness: string): string[] {
  const weights = HOBBIES.map((h) => {
    let w = 1;
    if (gender === "Female" && ["Bharatanatyam", "Kathak", "Baking", "Painting", "Pottery", "Yoga"].includes(h)) w = 2;
    if (gender === "Male" && ["Cricket", "Football", "Video games", "Gym", "Investing", "Chess"].includes(h)) w = 2;
    if (gender === "Male" && ["Bharatanatyam", "Kathak"].includes(h)) w = 0.15;
    if (fitness === "High" && ["Running", "Gym", "Trekking", "Cycling", "Swimming", "Yoga", "Badminton"].includes(h)) w *= 2.5;
    if (["Reading", "Travelling", "Movies", "Cooking", "Music"].includes(h)) w *= 1.8;
    return [h, w] as const;
  });
  const n = r.int(3, 5);
  const out: string[] = [];
  while (out.length < n) {
    const h = r.weighted(weights.filter(([x]) => !out.includes(x)));
    out.push(h);
  }
  return out;
}

const PROF_PHRASE: Record<string, string[]> = {
  Software: ["I'm a software engineer", "I work as a software engineer", "I build software"],
  "Data & Analytics": ["I work in analytics", "I'm a data scientist", "I work as a data professional"],
  "Product Management": ["I'm a product manager", "I work in product management"],
  Consulting: ["I'm a management consultant", "I work in consulting"],
  Marketing: ["I work in brand marketing", "I'm a marketer"],
  "Human Resources": ["I work in HR", "I'm in people and culture"],
  Banking: ["I'm a banker", "I work in banking"],
  Finance: ["I'm a Chartered Accountant", "I'm a CA"],
  Medicine: ["I'm a doctor", "I work in healthcare"],
  Law: ["I'm a lawyer", "I practise law"],
  "Design & Architecture": ["I'm a designer", "I work as a designer"],
  Government: ["I'm in government service", "I work in the public sector"],
  Education: ["I teach", "I'm an educator"],
  Business: ["I run our family business", "I'm in business"],
  Engineering: ["I'm an engineer", "I work in core engineering"],
  "Pharma & Biotech": ["I work in pharma research", "I'm a scientist in pharma"],
  "Media & Communications": ["I work in media", "I'm a media professional"],
  Aviation: ["I'm a pilot", "I fly commercial aircraft"],
};

const KIDS_LINE: Record<string, string[]> = {
  Yes: ["I'd love to have kids someday.", "Family is important to me and I do want children.", "I see kids in my future."],
  Maybe: ["On kids, I'm open and would like to decide together.", "Not sure about kids yet; happy to talk about it."],
  No: ["I'm honest about not wanting children.", "I don't see myself having kids, and would like a partner who's okay with that."],
};

function lc(s: string) {
  if (s.startsWith("I ") || s.startsWith("I'")) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function roleLower(designation: string) {
  return designation.split(",")[0].toLowerCase().split(" ").map((w) => (["sde", "hr", "ux", "ii", "ceo"].includes(w) ? w.toUpperCase() : w)).join(" ");
}

export function makeAboutMe(r: Rng, p: Profile): string {
  const h = p.hobbies.map((x) => HOBBY_PHRASE[x] ?? lc(x));
  const [h1, h2, h3] = [h[0], h[1] ?? h[0], h[2] ?? h[1] ?? h[0]];
  const native = p.nativePlace.split(",")[0];
  const isBiz = p.profession === "Business";
  const prof = isBiz ? `I run ${p.company}` : r.pick(PROF_PHRASE[p.profession] ?? ["I work"]);
  const atCo = isBiz || p.company === "Independent Practice" ? "" : ` at ${p.company}`;
  const fromHere = p.city === native;
  const sentences: string[] = [];

  if (p.profileManagedBy === "Parent" || p.profileManagedBy === "Relative" || p.profileManagedBy === "Sibling") {
    const poss = p.gender === "Female" ? "her " : "his ";
    for (let i = 0; i < h.length; i++) h[i] = h[i].replace(/^my /, poss);
    const [h1, h2] = [h[0], h[1] ?? h[0]];
    const rel = p.profileManagedBy === "Parent" ? (p.gender === "Female" ? "our daughter" : "our son") : p.profileManagedBy === "Sibling" ? (p.gender === "Female" ? "my sister" : "my brother") : "our niece".replace("niece", p.gender === "Female" ? "niece" : "nephew");
    const he = p.gender === "Female" ? "She" : "He";
    const his = p.gender === "Female" ? "her" : "his";
    sentences.push(
      r.pick([
        `${p.profileManagedBy === "Sibling" ? "I am" : "We are"} writing on behalf of ${rel} ${p.firstName}, ${isBiz ? `who runs ${p.company} in ${p.city}` : `who works as ${aOrAn(p.designation)} ${p.designation}${atCo} in ${p.city}`}.`,
        `${p.firstName} is ${rel}; ${he.toLowerCase()} is ${aOrAn(p.designation)} ${p.designation}${atCo} and lives in ${p.city}.`,
      ]).replace(/^w/, "W"),
    );
    sentences.push(
      r.pick([
        `${he} is ${r.pick(["soft-spoken", "cheerful", "grounded", "independent", "very caring", "easy-going"])} and enjoys ${h1} and ${h2} in ${his} free time.`,
        `Our family is ${p.familyValues === "Traditional" ? "traditional, with strong values" : p.familyValues === "Liberal" ? "liberal and open-minded" : "a mix of traditional and modern"}, originally from ${native}. ${he} loves ${h1}.`,
      ]),
    );
    sentences.push(
      r.pick([
        `We are looking for a ${p.gender === "Female" ? "well-settled, respectful boy" : "kind, educated girl"} from a good family who will value ${his} ${p.gender === "Female" ? "career" : "parents"} as much as we do.`,
        `We hope to find someone ${p.familyValues === "Traditional" ? "with similar values and respect for elders" : "who is understanding and family-oriented"}.`,
      ]),
    );
    return sentences.join(" ");
  }

  const opener = r.pick([
    `${prof}${atCo} and live in ${p.city}${fromHere ? ", where I grew up" : `, though home will always be ${native}`}.`,
    `${p.city}-based ${p.designation.toLowerCase().includes("founder") ? "founder" : roleLower(p.designation)} here${fromHere ? "" : `, originally from ${native}`}.`,
    fromHere ? `Hi! ${prof}${atCo}, born and brought up right here in ${p.city}.` : `Hi! ${prof}${atCo}; I moved to ${p.city} ${r.int(2, 8)} years ago${p.country !== "India" ? " and have built a life here, but India is still home" : ""}.`,
    fromHere ? `${prof}${atCo}. I'm ${aOrAn(p.city)} ${p.city} person through and through, and my family lives close by.` : `I grew up in ${native} and now live in ${p.city}, where ${lc(prof)}${atCo}.`,
  ]);
  sentences.push(opener.replace(/^i /, "I "));

  sentences.push(
    r.pick([
      `Weekends usually mean ${h1}, ${h2}, or catching up with old friends over chai.`,
      `Outside work you'll find me into ${h1} and ${h2}; lately I've also been trying ${h3}.`,
      `I unwind with ${h1} and ${h2}, and I'm always up for ${h3}.`,
      `Friends would describe me as ${r.pick(["calm", "curious", "warm", "a bit of a planner", "spontaneous", "loyal", "funny once you get to know me"])} and ${r.pick(["dependable", "honest", "driven", "thoughtful", "foodie-at-heart", "family-first"])}. I love ${h1}.`,
      `I'm happiest ${r.pick(["on a long drive with good music", "at a family dinner", "somewhere in the mountains", "in a quiet cafe with a book", "cooking a big Sunday meal"])}, and I make time for ${h1} every week.`,
    ]),
  );

  const looking = r.pick([
    `I'm looking for someone ${r.pick(["kind", "honest", "grounded", "emotionally mature", "curious about the world"])} who values ${r.pick(["family", "communication", "growth", "humour", "respect"])} and is ready to build a life together.`,
    `Hoping to meet a partner who is ${r.pick(["ambitious but grounded", "warm and family-oriented", "independent and easy to talk to", "respectful and fun"])}${p.familyValues === "Traditional" ? " and respects traditions" : ""}.`,
    `${r.pick(KIDS_LINE[p.wantKids])} I'd like a partner who ${r.pick(["shares responsibilities equally", "enjoys simple things", "is close to their family", "believes in growing together"])}.`,
    `I value ${p.familyValues === "Liberal" ? "independence and equality" : p.familyValues === "Traditional" ? "our traditions and close family ties" : "a balance of tradition and modern thinking"} in a relationship.`,
  ]);
  sentences.push(looking);
  return sentences.join(" ");
}

export function aOrAn(word: string) {
  if (/^(HR|SDE|MBA|MD|MS)b/.test(word)) return "an";
  return /^[AEIOU]/i.test(word) && !/^(Uni|One|Eu)/i.test(word) ? "an" : "a";
}

export const FATHER_OCC = [
  "Retired bank manager (SBI)", "Retired government officer", "Businessman", "Doctor (private practice)",
  "Professor at a state university", "Chartered Accountant", "Retired Army officer", "Agriculturist with family land",
  "Retired engineer (PSU)", "Senior manager in a private company", "Advocate", "School principal", "Pharmacist (own store)",
  "Retired railway officer", "Civil contractor",
];
export const MOTHER_OCC = [
  "Homemaker", "Homemaker", "Homemaker", "Homemaker", "School teacher", "Retired bank officer", "Doctor (gynaecologist)",
  "Professor", "Runs a boutique", "Government employee", "Homemaker (former teacher)", "Nurse", "Runs a tiffin service",
];

export const RASHIS = ["Mesh (Aries)", "Vrishabh (Taurus)", "Mithun (Gemini)", "Kark (Cancer)", "Simha (Leo)", "Kanya (Virgo)", "Tula (Libra)", "Vrishchik (Scorpio)", "Dhanu (Sagittarius)", "Makar (Capricorn)", "Kumbh (Aquarius)", "Meen (Pisces)"];
export const NAKSHATRAS = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];

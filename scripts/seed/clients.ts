import type { CustomerStatus, Gender, MatchOutcome, NoteType, PartnerPreferences, Profile } from "../../lib/types";
import type { Career } from "./careers";

export interface Persona {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  age: number;
  community: string;
  city: string;
  nri?: { country: string; state: string; residency: Profile["residencyStatus"] };
  status: CustomerStatus;
  mm: "mm_priya" | "mm_arjun";
  createdDaysAgo: number;
  track: string;
  career?: Partial<Career>;
  overrides?: Partial<Profile>;
  prefs?: Partial<PartnerPreferences>;
  /** Notes; `{M1}`, `{M2}` are replaced with the first names of seeded match-action candidates */
  notes: { daysAgo: number; type: NoteType; body: string }[];
  /** Seeded "match sent" history entries, in order M1, M2 */
  actions?: { daysAgo: number; outcome: MatchOutcome; preferCommunity?: string[] }[];
}

export const PERSONAS: Persona[] = [
  {
    id: "c_001", firstName: "Ananya", lastName: "Kulkarni", gender: "Female", age: 27, community: "marathi_brahmin", city: "Pune",
    status: "New", mm: "mm_priya", createdDaysAgo: 3, track: "software",
    career: { degree: "B.E. Computer Engineering", ugCollege: "College of Engineering Pune (COEP)", company: "ThoughtWorks", designation: "Senior Software Engineer", incomeLpa: 24, educationLevel: 2, postGradDegree: undefined, postGradCollege: undefined },
    overrides: { diet: "Eggetarian", drinking: "Never", smoking: "Never", openToRelocate: "Yes", wantKids: "Yes", familyValues: "Moderate", hobbies: ["Reading", "Trekking", "Classical music", "Baking"], profileManagedBy: "Self" },
    prefs: { castes: [], religions: ["Hindu"], dealbreakers: ["smoking"] },
    notes: [
      { daysAgo: 3, type: "Call", body: "Intro call with Ananya and her mother (Mrs. Kulkarni). Mom did most of the talking at first: she prefers a Pune-based Maharashtrian family, ideally Brahmin but said it's 'not a must'. Ananya herself is fine relocating to Bangalore for the right person. She wants someone who reads – she's in two book clubs – and was clear she doesn't want a 'just Netflix and IPL' kind of guy." },
      { daysAgo: 2, type: "General", body: "Payment received for the 6-month plan. Need her ID and salary slip to move her to Onboarding. She's vegetarian at home but eats egg outside; not fussy about the partner's diet, but said 'drinking only socially, please'. Prefers someone a little older (29–33), not much more." },
    ],
  },
  {
    id: "c_002", firstName: "Rohan", lastName: "Malhotra", gender: "Male", age: 31, community: "punjabi_khatri", city: "Gurugram",
    status: "Onboarding", mm: "mm_priya", createdDaysAgo: 14, track: "product",
    career: { degree: "B.Tech Computer Science", ugCollege: "IIT Delhi", postGradDegree: "MBA (Strategy)", postGradCollege: "ISB Hyderabad", educationLevel: 3, company: "Zomato", designation: "Senior Product Manager", incomeLpa: 48 },
    overrides: { openToRelocate: "Maybe", smoking: "Never", drinking: "Occasionally", horoscopeMatchRequired: false, hobbies: ["Running", "Cooking", "Travelling", "Podcasts"], fitness: "High", familyValues: "Liberal" },
    prefs: { cities: ["Delhi", "Gurugram", "Noida"], dealbreakers: ["smoking"], minEducationLevel: 2 },
    notes: [
      { daysAgo: 12, type: "Call", body: "First call with Rohan. Very articulate, knows what he wants. His previous long-term relationship ended last year when she moved to London, so he's wary of anyone planning to move abroad – wants someone settled in Delhi NCR. Family lives in Rajouri Garden; parents are easy-going but would like a Punjabi girl 'if possible'." },
      { daysAgo: 6, type: "Meeting", body: "Met Rohan at Cyber Hub. Runs marathons and cooks elaborate meals on weekends. Values ambition – said he'd like a partner with her own career goals rather than someone who plans to quit after marriage. Height isn't a big deal for him. Asked us to keep the search discreet and not show his profile to anyone at Zomato." },
      { daysAgo: 2, type: "General", body: "Still waiting on his photographs and kundli (his mother insists on having it on file, though Rohan says matching isn't needed)." },
    ],
  },
  {
    id: "c_003", firstName: "Fatima", lastName: "Siddiqui", gender: "Female", age: 29, community: "muslim_up", city: "Hyderabad",
    status: "Profile Verified", mm: "mm_priya", createdDaysAgo: 24, track: "medicine",
    career: { degree: "MBBS", ugCollege: "Osmania Medical College", postGradDegree: "MD (Dermatology)", postGradCollege: "Gandhi Medical College, Hyderabad", educationLevel: 4, company: "Apollo Hospitals", designation: "Associate Consultant, Dermatology", incomeLpa: 30, workMode: "Onsite" },
    overrides: { profileManagedBy: "Sibling", openToRelocate: "No", religiosity: 4, familyValues: "Moderate", hobbies: ["Reading", "Writing", "Classical music", "Cooking"], drinking: "Never", smoking: "Never", siblings: "1 elder brother (married)" },
    prefs: { religions: ["Muslim"], castes: ["Sunni"], minEducationLevel: 3, cities: ["Hyderabad", "Bangalore"], dealbreakers: ["different-religion", "drinking", "no-relocation"] },
    notes: [
      { daysAgo: 20, type: "Call", body: "Spoke with Fatima and her elder brother Imran (he manages the profile). Family is originally from Lucknow, settled in Hyderabad for 15 years. They want a Sunni family, well educated – ideally a doctor or someone in a similarly demanding profession who 'understands night shifts'." },
      { daysAgo: 14, type: "Meeting", body: "Met Fatima at the clinic after her OPD. Warm, quietly funny. She prays regularly but isn't rigid; wants a partner who respects that, but she's not looking for someone very conservative. Does not want to move abroad – her parents are getting older and she's the only daughter. Loves Urdu poetry and old Hindi film music." },
      { daysAgo: 9, type: "General", body: "ID, degree and income verified. Marked Profile Verified. Next: shortlist doctors / professionals in Hyderabad and Bangalore aged 30–36. Brother hinted that a bigger city like Bangalore is fine only if the boy's family is close by." },
    ],
  },
  {
    id: "c_004", firstName: "Karthik", lastName: "Iyer", gender: "Male", age: 32, community: "tamil_brahmin", city: "Bangalore",
    status: "Matching", mm: "mm_priya", createdDaysAgo: 34, track: "software",
    career: { degree: "B.Tech Computer Science", ugCollege: "NIT Trichy", educationLevel: 2, postGradDegree: undefined, postGradCollege: undefined, company: "Google", designation: "Senior Software Engineer", incomeLpa: 58, workMode: "Hybrid" },
    overrides: { diet: "Vegetarian", smoking: "Never", drinking: "Never", horoscopeMatchRequired: true, religiosity: 4, familyValues: "Moderate", openToRelocate: "No", hobbies: ["Classical music", "Running", "Reading", "Chess"], fitness: "High", livingWithParentsAfterMarriage: "Maybe", subCaste: "Iyer (Vadama)" },
    prefs: { ageMin: 27, ageMax: 31, religions: ["Hindu"], castes: ["Brahmin"], diets: ["Vegetarian", "Jain", "Vegan"], dealbreakers: ["non-vegetarian", "smoking", "manglik-mismatch"], minEducationLevel: 2, cities: [] },
    notes: [
      { daysAgo: 30, type: "Call", body: "Karthik's mother called first – very particular about horoscope matching and wants an Iyer girl, strictly vegetarian. On a separate call Karthik was more relaxed: 'vegetarian is a must, the rest is amma's list.' He's okay with Iyengar or other Tamil Brahmin families, even Kannada/Telugu Brahmin if the family is warm." },
      { daysAgo: 21, type: "Meeting", body: "Met Karthik in Indiranagar. Plays Carnatic violin and trains for half-marathons. Wants a working partner, preferably in tech or research, who's okay staying in Bangalore long-term – he turned down a transfer to Zurich to stay near his parents. Said he gets along better with people who are 'calm, not too party-type'." },
      { daysAgo: 4, type: "Call", body: "Shared 3 profiles verbally. He liked the one who learns Bharatanatyam, felt the CA profile was too 'corporate'. Asked if we can find someone 27–30, not younger – feels the age gap matters to him." },
    ],
  },
  {
    id: "c_005", firstName: "Simran", lastName: "Bedi", gender: "Female", age: 28, community: "sikh_khatri", city: "Delhi",
    status: "Match Sent", mm: "mm_priya", createdDaysAgo: 45, track: "law",
    career: { degree: "BA LLB (Hons)", ugCollege: "National Law University, Delhi", educationLevel: 2, company: "Khaitan & Co", designation: "Senior Associate", incomeLpa: 28, workMode: "Hybrid" },
    overrides: { heightCm: 170, smoking: "Never", drinking: "Occasionally", diet: "Non-Vegetarian", religiosity: 3, familyValues: "Moderate", fatherOccupation: "Retired Army officer (Colonel)", hobbies: ["Badminton", "Travelling", "Stand-up comedy", "Reading"], profileManagedBy: "Self" },
    prefs: { ageMin: 29, ageMax: 34, heightMinCm: 175, religions: ["Sikh", "Hindu"], castes: [], cities: ["Delhi", "Gurugram", "Noida", "Mumbai"], dealbreakers: ["smoking"] },
    notes: [
      { daysAgo: 40, type: "Meeting", body: "Onboarding meeting with Simran and her father (retired Colonel). The family is Sikh but not very orthodox – dad said a clean-shaven Sikh or a Punjabi Hindu boy is fine, but he must respect the family's gurdwara visits. Simran wants someone who isn't intimidated by her long hours at the firm." },
      { daysAgo: 18, type: "Call", body: "Simran is clear: no smokers; she drinks socially herself. Wants someone 30–34, ideally in Delhi/Gurugram, but would consider Mumbai for the right person. She laughed that she's 5'7\" and wants someone taller 'so I can wear heels'. Likes men who are well-read and can hold a debate without getting defensive." },
      { daysAgo: 5, type: "General", body: "Sent {M1}'s and {M2}'s profiles. She's reviewing over the weekend; liked that {M1} plays sport. Follow up Monday." },
    ],
    actions: [{ daysAgo: 5, outcome: "Pending", preferCommunity: ["sikh_khatri", "sikh_jat", "punjabi_khatri"] }, { daysAgo: 5, outcome: "Pending" }],
  },
  {
    id: "c_006", firstName: "Hardik", lastName: "Patel", gender: "Male", age: 30, community: "gujarati_patel", city: "Ahmedabad",
    status: "Meeting Scheduled", mm: "mm_priya", createdDaysAgo: 40, track: "business",
    career: { degree: "B.Com", ugCollege: "H. L. College of Commerce, Ahmedabad", postGradDegree: "MBA (Family Business)", postGradCollege: "Nirma Institute of Management, Ahmedabad", educationLevel: 3, company: "Patel Polymers", designation: "Director", incomeLpa: 45, workMode: "Onsite" },
    overrides: { diet: "Vegetarian", familyType: "Joint", livingWithParentsAfterMarriage: "Yes", openToRelocate: "No", familyValues: "Traditional", religiosity: 4, drinking: "Never", smoking: "Never", hobbies: ["Cricket", "Road trips", "Travelling", "Movies"], profileManagedBy: "Parent", fatherOccupation: "Businessman (polymer manufacturing)" },
    prefs: { religions: ["Hindu", "Jain"], diets: ["Vegetarian", "Jain", "Vegan"], cities: ["Ahmedabad", "Vadodara", "Surat"], dealbreakers: ["non-vegetarian", "smoking"] },
    notes: [
      { daysAgo: 35, type: "Call", body: "Hardik runs the family's polymer business with his father and uncle in Ahmedabad; joint family in Satellite. They need a girl who is comfortable living with the family – non-negotiable for the parents. Vegetarian household, no eggs inside the house." },
      { daysAgo: 25, type: "Meeting", body: "Hardik is more modern than his parents suggested – travels to trade fairs in Germany, loves cricket and road trips to Kutch. Would like someone who has worked and may want to continue working from Ahmedabad. Not keen on Mumbai girls ('too fast-paced' – his words; will gently push back)." },
      { daysAgo: 3, type: "Call", body: "Hardik and {M1} both said yes! First meeting fixed for Saturday at a café in Prahlad Nagar; families to meet afterwards if it goes well." },
    ],
    actions: [{ daysAgo: 12, outcome: "Accepted", preferCommunity: ["gujarati_patel", "gujarati_vania", "jain"] }],
  },
  {
    id: "c_007", firstName: "Priyanka", lastName: "Banerjee", gender: "Female", age: 30, community: "bengali_brahmin", city: "Bangalore",
    status: "In Conversation", mm: "mm_priya", createdDaysAgo: 55, track: "data",
    career: { degree: "B.Tech Computer Science", ugCollege: "Jadavpur University", postGradDegree: "M.Tech Computer Science", postGradCollege: "IISc Bangalore", educationLevel: 3, company: "Flipkart", designation: "Senior Data Scientist", incomeLpa: 36, workMode: "Hybrid" },
    overrides: { diet: "Non-Vegetarian", drinking: "Occasionally", smoking: "Never", familyValues: "Liberal", religiosity: 2, openToRelocate: "Maybe", hobbies: ["Singing", "Movies", "Trekking", "Reading"], livingWithParentsAfterMarriage: "No" },
    prefs: { religions: [], castes: [], maritalStatuses: [], diets: [], minEducationLevel: 3, dealbreakers: ["doesnt-want-kids"] },
    notes: [
      { daysAgo: 50, type: "Meeting", body: "Priyanka is from Kolkata (Salt Lake) and has been in Bangalore for 6 years. Loves Rabindrasangeet, world cinema and weekend treks. Parents would prefer a Bengali family; Priyanka says 'Bengali is a bonus, not a requirement' – but food matters: she wants someone who happily eats fish and meat." },
      { daysAgo: 28, type: "Call", body: "She had a bad experience with someone who expected her to quit work after kids. Very important that the partner shares housework and sees her career as equal to his. Open to someone divorced as long as there are no kids from the earlier marriage." },
      { daysAgo: 6, type: "Call", body: "In conversation with {M1} (sent 3 weeks ago) – two video calls and one dinner so far. She likes that he's a good listener, but is unsure about his plan to move cities next year. Check in after their next meeting." },
    ],
    actions: [{ daysAgo: 22, outcome: "Accepted", preferCommunity: ["bengali_brahmin", "bengali_kayastha"] }, { daysAgo: 30, outcome: "Declined" }],
  },
  {
    id: "c_008", firstName: "Vikram", lastName: "Rathore", gender: "Male", age: 34, community: "rajput", city: "Jaipur",
    status: "Paused", mm: "mm_priya", createdDaysAgo: 70, track: "business",
    career: { degree: "BBA", ugCollege: "St. Xavier's College, Jaipur", postGradDegree: "PGDM", postGradCollege: "IIM Indore", educationLevel: 3, company: "Rathore Heritage Hotels", designation: "Director", incomeLpa: 40, workMode: "Onsite" },
    overrides: { maritalStatus: "Divorced", familyType: "Joint", familyValues: "Moderate", openToPets: "Yes", hobbies: ["Wildlife safaris", "Road trips", "Photography", "Reading"], drinking: "Occasionally", smoking: "Never" },
    prefs: { ageMin: 29, ageMax: 34, maritalStatuses: [], religions: ["Hindu"], castes: [], dealbreakers: ["smoking"] },
    notes: [
      { daysAgo: 60, type: "Meeting", body: "Vikram – divorced 2 years ago (no children; the marriage lasted 14 months). Family runs two heritage properties near Jaipur. He's understandably cautious: wants someone mature, 29–34, open to divorcees, and comfortable with a slower life in Jaipur." },
      { daysAgo: 38, type: "Call", body: "Declined both profiles we shared ({M1} and another). Felt they were 'too city'. He wants someone who loves the outdoors and animals (has two dogs and a horse) and doesn't mind the joint family on weekends." },
      { daysAgo: 22, type: "General", body: "Vikram asked to pause for ~2 months – his father is unwell and he's handling the business alone. Do NOT send profiles until he reaches out. Check in after Diwali." },
    ],
    actions: [{ daysAgo: 42, outcome: "Declined" }],
  },
  {
    id: "c_009", firstName: "Divya", lastName: "Reddy", gender: "Female", age: 29, community: "telugu_reddy", city: "Hyderabad",
    status: "Matched", mm: "mm_priya", createdDaysAgo: 90, track: "consulting",
    career: { degree: "B.Tech Electronics & Communication", ugCollege: "CBIT Hyderabad", postGradDegree: "MBA (Strategy)", postGradCollege: "ISB Hyderabad", educationLevel: 3, company: "Deloitte", designation: "Senior Consultant", incomeLpa: 30, workMode: "Hybrid" },
    overrides: { fitness: "High", bodyType: "Athletic", hobbies: ["Gym", "Running", "Travelling", "Cooking"], diet: "Non-Vegetarian", openToRelocate: "No" },
    prefs: { religions: ["Hindu"], castes: ["Reddy"], cities: ["Hyderabad"], dealbreakers: ["smoking", "no-relocation"] },
    notes: [
      { daysAgo: 85, type: "Meeting", body: "Divya wants someone from a Telugu family; Reddy preferred by her parents. She's a fitness enthusiast (CrossFit five days a week) and wants a partner who also takes health seriously. Prefers Hyderabad – owns a flat in Gachibowli and won't relocate." },
      { daysAgo: 45, type: "Call", body: "Met {M1} twice; families met in Banjara Hills. Both sides positive. Discussing dates for the engagement." },
      { daysAgo: 10, type: "General", body: "Engagement confirmed for December! Marked as Matched. Send the congratulations hamper and ask for a testimonial after the wedding." },
    ],
    actions: [{ daysAgo: 70, outcome: "Met", preferCommunity: ["telugu_reddy", "telugu_kamma"] }],
  },
  {
    id: "c_010", firstName: "Sameer", lastName: "Khan", gender: "Male", age: 33, community: "muslim_up", city: "Mumbai",
    status: "Closed", mm: "mm_priya", createdDaysAgo: 88, track: "ca",
    career: { degree: "B.Com", ugCollege: "H.R. College of Commerce, Mumbai", postGradDegree: "Chartered Accountant (CA)", postGradCollege: "ICAI", educationLevel: 3, company: "EY", designation: "Senior Manager", incomeLpa: 38, workMode: "Hybrid" },
    overrides: { drinking: "Never", smoking: "Never", religiosity: 4 },
    prefs: { religions: ["Muslim"], castes: ["Sunni"], cities: ["Mumbai", "Pune"], dealbreakers: ["different-religion", "drinking"] },
    notes: [
      { daysAgo: 80, type: "Call", body: "Sameer wants a girl from a Mumbai-based family, Sunni, educated and preferably working. His mother wants someone who's 'homely' – we'll need to balance both. He's not keen on anyone who'd want to move abroad." },
      { daysAgo: 55, type: "Call", body: "Sameer informed us that he has found someone through a family friend. Closing the profile. Feedback: happy with the quality of profiles but felt we were slow in the first month." },
      { daysAgo: 54, type: "General", body: "Closed. Refund not applicable (beyond 30 days). Keep in touch for referrals – his cousin may sign up." },
    ],
  },
  {
    id: "c_011", firstName: "Nikhil", lastName: "Menon", gender: "Male", age: 28, community: "malayali_nair", city: "Bangalore",
    status: "New", mm: "mm_arjun", createdDaysAgo: 1, track: "design",
    career: { degree: "B.Des (Interaction Design)", ugCollege: "NID Ahmedabad", educationLevel: 2, postGradDegree: undefined, postGradCollege: undefined, company: "Swiggy", designation: "Senior Product Designer", incomeLpa: 30, workMode: "Hybrid" },
    overrides: { hobbies: ["Football", "Photography", "Movies", "Cafe hopping"], familyValues: "Liberal", religiosity: 2, openToRelocate: "Yes", drinking: "Occasionally" },
    prefs: { religions: [], castes: [], dealbreakers: [] },
    notes: [
      { daysAgo: 1, type: "Call", body: "Inbound lead via Instagram. Nikhil (28, Nair, product designer at Swiggy) wants someone creative – 'a person with a side project or a weird hobby'. Ideally from Kerala but 'not necessary at all'. Parents are in Kochi; he visits every couple of months and wants a partner who'd enjoy those trips." },
      { daysAgo: 1, type: "General", body: "Sent the onboarding form. He asked whether we have NRI profiles – he's considering a Master's in design abroad in about 2 years, so someone open to moving would be a plus." },
    ],
  },
  {
    id: "c_012", firstName: "Khushi", lastName: "Shah", gender: "Female", age: 26, community: "jain", city: "Mumbai",
    status: "Onboarding", mm: "mm_arjun", createdDaysAgo: 10, track: "ca",
    career: { degree: "B.Com", ugCollege: "Narsee Monjee College of Commerce, Mumbai", postGradDegree: "Chartered Accountant (CA)", postGradCollege: "ICAI", educationLevel: 3, company: "KPMG", designation: "Assistant Manager", incomeLpa: 18, workMode: "Hybrid" },
    overrides: { diet: "Jain", drinking: "Never", smoking: "Never", subCaste: "Shwetambar Oswal", familyType: "Nuclear", livingWithParentsAfterMarriage: "No", hobbies: ["Travelling", "Theatre", "Board games", "Reading"], profileManagedBy: "Parent", fatherOccupation: "Businessman (diamond trading)" },
    prefs: { religions: ["Jain", "Hindu"], diets: ["Jain", "Vegetarian"], cities: ["Mumbai"], dealbreakers: ["non-vegetarian", "drinking", "smoking"] },
    notes: [
      { daysAgo: 9, type: "Call", body: "Khushi's father (Mr. Shah, diamond business at Opera House) called. Strictly Jain diet – no onion or garlic at home; partner must at least be vegetarian. They'd prefer a Shwetambar Jain family from Mumbai." },
      { daysAgo: 4, type: "Meeting", body: "Met Khushi at our Bandra office. She's a CA at KPMG and wants to keep working after marriage – 'that's not up for discussion'. Would prefer someone outside the family diamond trade, with a professional background. Fine with a nuclear family set-up. Loves travel, Sudoku and theatre at Prithvi." },
    ],
  },
  {
    id: "c_013", firstName: "Gurpreet", lastName: "Sandhu", gender: "Male", age: 30, community: "sikh_jat", city: "Toronto",
    nri: { country: "Canada", state: "Ontario", residency: "Permanent Resident" },
    status: "Profile Verified", mm: "mm_arjun", createdDaysAgo: 20, track: "software",
    career: { degree: "B.Tech Computer Science", ugCollege: "Thapar Institute of Engineering and Technology", postGradDegree: "MS Computer Science", postGradCollege: "University of Waterloo", educationLevel: 3, company: "RBC", designation: "Senior Software Developer", incomeLpa: 95, workMode: "Hybrid" },
    overrides: { openToRelocate: "No", smoking: "Never", drinking: "Occasionally", heightCm: 183, hobbies: ["Gym", "Cricket", "Road trips", "Cooking"] },
    prefs: { religions: ["Sikh"], castes: [], dealbreakers: ["smoking", "different-religion"] },
    notes: [
      { daysAgo: 16, type: "Call", body: "Video call with Gurpreet (Toronto, PR) and his parents in Ludhiana. They want a Sikh girl, preferably Jat Sikh, who is open to moving to Canada. Gurpreet is fine with a non-Jat Sikh family; his mother less so." },
      { daysAgo: 11, type: "General", body: "Verified PR card and employment letter (Senior Software Developer at RBC). Moved to Profile Verified." },
      { daysAgo: 5, type: "Call", body: "Gurpreet will be in India from Dec 15 to Jan 10 and wants to meet 3–4 shortlisted girls in that window. Prefers someone whose degree transfers well to Canada (nursing, IT, accounting). Turban not an issue either way for him; he keeps a trimmed beard." },
    ],
  },
  {
    id: "c_014", firstName: "Kavya", lastName: "Hegde", gender: "Female", age: 30, community: "kannada_brahmin", city: "Bangalore",
    status: "Matching", mm: "mm_arjun", createdDaysAgo: 36, track: "medicine",
    career: { degree: "MBBS", ugCollege: "Bangalore Medical College", postGradDegree: "MS (Obstetrics & Gynaecology)", postGradCollege: "Kasturba Medical College, Manipal", educationLevel: 4, company: "Manipal Hospitals", designation: "Associate Consultant, Obstetrics & Gynaecology", incomeLpa: 28, workMode: "Onsite" },
    overrides: { subCaste: "Havyaka", horoscopeMatchRequired: true, familyValues: "Moderate", openToRelocate: "No", heightCm: 158, hobbies: ["Kathak", "Reading", "Travelling", "Gardening"], diet: "Vegetarian" },
    prefs: { heightMaxCm: 188, religions: ["Hindu"], castes: [], minEducationLevel: 3, cities: ["Bangalore"], dealbreakers: ["smoking", "no-relocation"] },
    notes: [
      { daysAgo: 33, type: "Meeting", body: "Kavya is a gynaecologist at Manipal Hospitals. Family is from Sirsi (Havyaka Brahmin); parents are very traditional, Kavya is more moderate. Parents want horoscope matching; she's agreed to it 'as a filter, not a decision'." },
      { daysAgo: 15, type: "Call", body: "She'd like someone who is also in medicine or at least understands erratic hours. Not keen on very tall men – joked that 'anything above 6'2\" makes me feel like a child'. Wants to stay in Bangalore; her practice is just building up." },
      { daysAgo: 7, type: "Call", body: "Didn't like the first batch – felt the men were 'looking for a homemaker with a degree'. Wants someone genuinely supportive of her career. Also mentioned she'd love a partner who enjoys cooking, because she doesn't." },
    ],
  },
  {
    id: "c_015", firstName: "Rahul", lastName: "Agarwal", gender: "Male", age: 29, community: "marwari", city: "Mumbai",
    status: "Match Sent", mm: "mm_arjun", createdDaysAgo: 30, track: "banking",
    career: { degree: "B.Com (Hons)", ugCollege: "Shri Ram College of Commerce, DU", postGradDegree: "MBA (Finance)", postGradCollege: "IIM Calcutta", educationLevel: 3, company: "Avendus Capital", designation: "Associate", incomeLpa: 42, workMode: "Onsite" },
    overrides: { diet: "Vegetarian", nativePlace: "Kolkata, West Bengal", hobbies: ["Tennis", "Travelling", "Investing", "Movies"], drinking: "Occasionally", smoking: "Never" },
    prefs: { diets: ["Vegetarian", "Jain", "Vegan", "Eggetarian"], religions: ["Hindu", "Jain"], dealbreakers: ["non-vegetarian"] },
    notes: [
      { daysAgo: 26, type: "Call", body: "Rahul's family is in Kolkata (Marwari, Agarwal); he's been in Mumbai for 4 years. Parents want a vegetarian Marwari girl; Rahul is okay with any vegetarian family from a business or professional background." },
      { daysAgo: 19, type: "Meeting", body: "Met Rahul at BKC. Long hours and lots of travel. Wants someone independent who has her own social circle and won't mind his schedule. Plays squash, loves Coke Studio and Bengali sweets (grew up in Kolkata, after all)." },
      { daysAgo: 8, type: "General", body: "Sent {M1}'s profile; he asked for more time. Also sent {M2} – her family wants to know if he'd ever move back to Kolkata (he says 'maybe in 5 years')." },
    ],
    actions: [{ daysAgo: 8, outcome: "Pending", preferCommunity: ["marwari", "jain", "gujarati_vania"] }, { daysAgo: 8, outcome: "Pending" }],
  },
  {
    id: "c_016", firstName: "Neha", lastName: "Tripathi", gender: "Female", age: 31, community: "up_brahmin", city: "Noida",
    status: "Meeting Scheduled", mm: "mm_arjun", createdDaysAgo: 42, track: "hr",
    career: { degree: "BA Psychology", ugCollege: "Lady Shri Ram College, DU", postGradDegree: "MBA (Human Resources)", postGradCollege: "XLRI Jamshedpur", educationLevel: 3, company: "Adobe", designation: "Senior HR Business Partner", incomeLpa: 32, workMode: "Hybrid" },
    overrides: { livingWithParentsAfterMarriage: "No", religiosity: 3, familyValues: "Moderate", hobbies: ["Kathak", "Volunteering", "Reading", "Cafe hopping"], nativePlace: "Lucknow, Uttar Pradesh" },
    prefs: { ageMin: 32, ageMax: 37, religions: ["Hindu"], castes: [], cities: ["Delhi", "Noida", "Gurugram"] },
    notes: [
      { daysAgo: 37, type: "Call", body: "Neha – HRBP at Adobe Noida. Family from Lucknow, Brahmin, moderately religious. She wants someone 'emotionally mature' – a long relationship ended because he couldn't commit. Prefers 32–37." },
      { daysAgo: 20, type: "Meeting", body: "Met at her office. She's a trained Kathak dancer and teaches kids at an NGO on weekends. Fine with a non-Brahmin family, but her parents want at least a Hindu North Indian family. She does not want to live with in-laws immediately after marriage – maybe later." },
      { daysAgo: 2, type: "Call", body: "{M1} and Neha spoke on the phone for an hour! Meeting set for Sunday brunch at Khan Market. Brief her on his background beforehand." },
    ],
    actions: [{ daysAgo: 9, outcome: "Accepted", preferCommunity: ["up_brahmin", "kayastha", "punjabi_khatri"] }],
  },
  {
    id: "c_017", firstName: "Joel", lastName: "D'Souza", gender: "Male", age: 31, community: "goan_catholic", city: "Mumbai",
    status: "In Conversation", mm: "mm_arjun", createdDaysAgo: 50, track: "marketing",
    career: { degree: "BMM", ugCollege: "St. Xavier's College, Mumbai", postGradDegree: "MBA (Marketing)", postGradCollege: "SPJIMR Mumbai", educationLevel: 3, company: "Asian Paints", designation: "Senior Brand Manager", incomeLpa: 32, workMode: "Hybrid" },
    overrides: { diet: "Non-Vegetarian", nativePlace: "Margao, Goa", hobbies: ["Playing guitar", "Football", "Cooking", "Travelling"], drinking: "Occasionally", religiosity: 3 },
    prefs: { religions: ["Christian"], castes: [], dealbreakers: ["smoking"] },
    notes: [
      { daysAgo: 44, type: "Meeting", body: "Joel – Goan Catholic, family in Margao, he lives in Bandra. Would ideally like a Catholic girl; parents insist on a church wedding. Plays bass in a weekend band and is a die-hard Liverpool fan." },
      { daysAgo: 24, type: "Call", body: "He's open to a non-Catholic Christian, and would even consider someone from another religion if she's okay with a church wedding and raising kids with Christian values. Doesn't want someone rigid about food – 'I'm not giving up my pork vindaloo'." },
      { daysAgo: 3, type: "Call", body: "Talking to {M1} for 2 weeks now. Going well – they've met twice and she came to one of his gigs. He's asked us to hold other introductions for now." },
    ],
    actions: [{ daysAgo: 17, outcome: "Accepted", preferCommunity: ["goan_catholic", "mangalorean_catholic", "syrian_christian"] }],
  },
  {
    id: "c_018", firstName: "Sneha", lastName: "Patil", gender: "Female", age: 33, community: "maratha", city: "Mumbai",
    status: "Paused", mm: "mm_arjun", createdDaysAgo: 80, track: "banking",
    career: { degree: "B.Com", ugCollege: "University of Mumbai", postGradDegree: "MBA (Finance)", postGradCollege: "JBIMS Mumbai", educationLevel: 3, company: "HDFC Bank", designation: "Branch Manager", incomeLpa: 26, workMode: "Onsite" },
    overrides: { maritalStatus: "Divorced", familyType: "Nuclear", livingWithParentsAfterMarriage: "No", hobbies: ["Yoga", "Reading", "Travelling", "Gardening"] },
    prefs: { ageMin: 34, ageMax: 40, maritalStatuses: [], cities: ["Mumbai", "Pune"], castes: [], religions: ["Hindu", "Buddhist", "Jain"] },
    notes: [
      { daysAgo: 75, type: "Meeting", body: "Sneha, divorced 3 years, no children. Very clear: no one who will judge her for the divorce, and no joint family. Okay with divorced men. Wants someone 34–40 in Mumbai or Pune." },
      { daysAgo: 40, type: "Call", body: "Met {M1} once – said he was nice but kept talking about his ex. Not proceeding." },
      { daysAgo: 30, type: "General", body: "Sneha is taking a break – she got promoted and is moving teams. Asked to resume in November. Don't call; she'll WhatsApp when ready." },
    ],
    actions: [{ daysAgo: 50, outcome: "Declined" }],
  },
  {
    id: "c_019", firstName: "Varun", lastName: "Lalwani", gender: "Male", age: 32, community: "sindhi", city: "Pune",
    status: "Matched", mm: "mm_arjun", createdDaysAgo: 89, track: "software",
    career: { degree: "B.E. Computer Engineering", ugCollege: "Pune Institute of Computer Technology", educationLevel: 2, postGradDegree: undefined, postGradCollege: undefined, company: "Persistent Systems", designation: "Engineering Manager", incomeLpa: 34, workMode: "Hybrid" },
    overrides: { hobbies: ["Travelling", "Cooking", "Cafe hopping", "Badminton"], diet: "Non-Vegetarian", drinking: "Occasionally" },
    prefs: { religions: [], castes: [] },
    notes: [
      { daysAgo: 88, type: "Meeting", body: "Varun – Sindhi family in Pune (Camp area). Wants a partner who loves food and travel as much as he does. Okay with any community. Mom wants someone who will 'gel with the family' – big Sindhi family with lots of get-togethers." },
      { daysAgo: 50, type: "Call", body: "Varun and {M1} have met four times; families met at a restaurant in Koregaon Park. Very positive." },
      { daysAgo: 12, type: "General", body: "Roka done! Marked as Matched. Varun's sister asked about our services for her brother-in-law – referral lead." },
    ],
    actions: [{ daysAgo: 75, outcome: "Met" }],
  },
  {
    id: "c_020", firstName: "Janani", lastName: "Subramanian", gender: "Female", age: 34, community: "tamil_brahmin", city: "Chennai",
    status: "Closed", mm: "mm_arjun", createdDaysAgo: 85, track: "education",
    career: { degree: "B.Tech Biotechnology", ugCollege: "SSN College of Engineering", postGradDegree: "PhD Computational Biology", postGradCollege: "IISc Bangalore", educationLevel: 4, company: "IIT Madras", designation: "Assistant Professor", incomeLpa: 16, workMode: "Onsite" },
    overrides: { diet: "Vegetarian", hobbies: ["Reading", "Classical music", "Birdwatching", "Writing"], openToRelocate: "Yes" },
    prefs: { minEducationLevel: 3, castes: ["Brahmin"], religions: ["Hindu"] },
    notes: [
      { daysAgo: 70, type: "Meeting", body: "Janani – PhD in computational biology, faculty at IIT Madras. Parents keen on an Iyer alliance; she wants someone intellectually curious and okay with her academic salary being lower than a corporate one." },
      { daysAgo: 48, type: "Call", body: "Says many matches are intimidated by the PhD. She's frustrated. Suggested widening to Bangalore and Hyderabad, and NRI profiles in the US. She agreed to the US." },
      { daysAgo: 20, type: "General", body: "Janani has decided to stop the search for now – she's going to Boston on a 1-year postdoc fellowship. Closed at her request; may reactivate next year." },
    ],
  },
];

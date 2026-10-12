import type { Weighted } from "./rng";

/** Indian cities used for current residence. Keys are the exact `city` values written to profiles. */
export const INDIAN_CITIES: Record<string, { state: string; lang: string }> = {
  Mumbai: { state: "Maharashtra", lang: "Marathi" },
  Pune: { state: "Maharashtra", lang: "Marathi" },
  Nagpur: { state: "Maharashtra", lang: "Marathi" },
  Delhi: { state: "Delhi", lang: "Hindi" },
  Gurugram: { state: "Haryana", lang: "Hindi" },
  Noida: { state: "Uttar Pradesh", lang: "Hindi" },
  Bangalore: { state: "Karnataka", lang: "Kannada" },
  Mysore: { state: "Karnataka", lang: "Kannada" },
  Mangalore: { state: "Karnataka", lang: "Kannada" },
  Hyderabad: { state: "Telangana", lang: "Telugu" },
  Visakhapatnam: { state: "Andhra Pradesh", lang: "Telugu" },
  Vijayawada: { state: "Andhra Pradesh", lang: "Telugu" },
  Chennai: { state: "Tamil Nadu", lang: "Tamil" },
  Coimbatore: { state: "Tamil Nadu", lang: "Tamil" },
  Kolkata: { state: "West Bengal", lang: "Bengali" },
  Ahmedabad: { state: "Gujarat", lang: "Gujarati" },
  Surat: { state: "Gujarat", lang: "Gujarati" },
  Vadodara: { state: "Gujarat", lang: "Gujarati" },
  Jaipur: { state: "Rajasthan", lang: "Hindi" },
  Lucknow: { state: "Uttar Pradesh", lang: "Hindi" },
  Chandigarh: { state: "Chandigarh", lang: "Punjabi" },
  Ludhiana: { state: "Punjab", lang: "Punjabi" },
  Indore: { state: "Madhya Pradesh", lang: "Hindi" },
  Kochi: { state: "Kerala", lang: "Malayalam" },
  Thiruvananthapuram: { state: "Kerala", lang: "Malayalam" },
  Bhubaneswar: { state: "Odisha", lang: "Odia" },
  Patna: { state: "Bihar", lang: "Hindi" },
  Panaji: { state: "Goa", lang: "Konkani" },
};

/** General (community-independent) metro draw. */
export const METRO_WEIGHTS: Weighted<string> = [
  ["Mumbai", 16],
  ["Bangalore", 17],
  ["Delhi", 10],
  ["Gurugram", 5],
  ["Noida", 3],
  ["Pune", 11],
  ["Hyderabad", 11],
  ["Chennai", 8],
  ["Kolkata", 5],
  ["Ahmedabad", 5],
  ["Jaipur", 1],
  ["Lucknow", 1],
  ["Chandigarh", 1],
  ["Indore", 1],
  ["Kochi", 1],
  ["Coimbatore", 1],
];

export interface NriPlace {
  country: string;
  city: string;
  state: string;
}

export const NRI_PLACES: Weighted<NriPlace> = [
  [{ country: "USA", city: "San Jose", state: "California" }, 7],
  [{ country: "USA", city: "Seattle", state: "Washington" }, 5],
  [{ country: "USA", city: "New York", state: "New York" }, 4],
  [{ country: "USA", city: "Dallas", state: "Texas" }, 3],
  [{ country: "USA", city: "Boston", state: "Massachusetts" }, 2],
  [{ country: "UK", city: "London", state: "England" }, 5],
  [{ country: "UK", city: "Manchester", state: "England" }, 1],
  [{ country: "Canada", city: "Toronto", state: "Ontario" }, 4],
  [{ country: "Canada", city: "Vancouver", state: "British Columbia" }, 2],
  [{ country: "Singapore", city: "Singapore", state: "Singapore" }, 4],
  [{ country: "UAE", city: "Dubai", state: "Dubai" }, 4],
  [{ country: "UAE", city: "Abu Dhabi", state: "Abu Dhabi" }, 1],
  [{ country: "Australia", city: "Sydney", state: "New South Wales" }, 3],
  [{ country: "Australia", city: "Melbourne", state: "Victoria" }, 2],
];

export const NRI_INCOME: Record<string, { mult: number; floor: number }> = {
  USA: { mult: 3.0, floor: 75 },
  UK: { mult: 2.1, floor: 45 },
  Canada: { mult: 2.1, floor: 50 },
  Singapore: { mult: 2.4, floor: 55 },
  UAE: { mult: 1.9, floor: 40 },
  Australia: { mult: 2.2, floor: 55 },
};

export const FOREIGN_UNIS: Record<string, string[]> = {
  USA: [
    "Carnegie Mellon University",
    "Georgia Institute of Technology",
    "University of Southern California",
    "Columbia University",
    "Purdue University",
    "Texas A&M University",
    "University of Texas at Austin",
    "Stanford University",
    "Arizona State University",
    "Northeastern University",
  ],
  UK: ["Imperial College London", "University College London", "London School of Economics", "University of Warwick", "University of Manchester"],
  Canada: ["University of Toronto", "University of Waterloo", "University of British Columbia", "McGill University"],
  Singapore: ["National University of Singapore", "Nanyang Technological University"],
  UAE: ["University of Wollongong in Dubai", "Heriot-Watt University Dubai"],
  Australia: ["University of Melbourne", "University of Sydney", "Monash University", "UNSW Sydney"],
};

/** Engineering colleges by home state (state-level / private tier). */
export const ENGG_BY_STATE: Record<string, string[]> = {
  Maharashtra: ["College of Engineering Pune (COEP)", "Pune Institute of Computer Technology", "Vishwakarma Institute of Technology, Pune", "K. J. Somaiya College of Engineering, Mumbai", "Sardar Patel Institute of Technology, Mumbai", "VJTI Mumbai"],
  "Tamil Nadu": ["College of Engineering, Guindy (Anna University)", "SSN College of Engineering", "SRM Institute of Science and Technology", "Coimbatore Institute of Technology", "PSG College of Technology"],
  Karnataka: ["RV College of Engineering", "BMS College of Engineering", "PES University", "Sri Jayachamarajendra College of Engineering, Mysore", "Dayananda Sagar College of Engineering"],
  Telangana: ["JNTU Hyderabad", "CBIT Hyderabad", "Vasavi College of Engineering", "Osmania University College of Engineering"],
  "Andhra Pradesh": ["Andhra University College of Engineering", "GITAM University", "JNTU Kakinada", "VR Siddhartha Engineering College"],
  Kerala: ["College of Engineering Trivandrum", "Model Engineering College, Kochi", "TKM College of Engineering", "Rajagiri School of Engineering & Technology"],
  "West Bengal": ["Jadavpur University", "Heritage Institute of Technology", "Kalyani Government Engineering College", "Techno India University"],
  Gujarat: ["L. D. College of Engineering", "Nirma University", "DA-IICT Gandhinagar", "SVNIT Surat"],
  Delhi: ["Delhi Technological University", "Netaji Subhas University of Technology", "Guru Gobind Singh Indraprastha University", "IIIT Delhi"],
  Haryana: ["Delhi Technological University", "YMCA University of Science and Technology", "Amity University, Gurugram"],
  Punjab: ["Thapar Institute of Engineering and Technology", "Guru Nanak Dev Engineering College, Ludhiana", "Chandigarh University", "Lovely Professional University"],
  Chandigarh: ["Punjab Engineering College", "Chandigarh University", "Thapar Institute of Engineering and Technology"],
  "Uttar Pradesh": ["Harcourt Butler Technical University, Kanpur", "Institute of Engineering and Technology, Lucknow", "Jaypee Institute of Information Technology", "Amity University, Noida", "KIET Group of Institutions"],
  Rajasthan: ["Malaviya NIT Jaipur", "Manipal University Jaipur", "JECRC University", "Poornima College of Engineering"],
  "Madhya Pradesh": ["SGSITS Indore", "Maulana Azad NIT Bhopal", "Medi-Caps University"],
  Bihar: ["NIT Patna", "BIT Mesra"],
  Odisha: ["KIIT University", "NIT Rourkela", "Siksha 'O' Anusandhan", "College of Engineering and Technology, Bhubaneswar"],
  Goa: ["Goa College of Engineering", "Padre Conceicao College of Engineering"],
};

export const ENGG_TOP = [
  "IIT Bombay",
  "IIT Delhi",
  "IIT Madras",
  "IIT Kanpur",
  "IIT Kharagpur",
  "IIT Roorkee",
  "IIT Guwahati",
  "IIT Hyderabad",
  "BITS Pilani",
];

export const ENGG_MID = [
  "NIT Trichy",
  "NIT Surathkal",
  "NIT Warangal",
  "NIT Calicut",
  "IIIT Hyderabad",
  "BITS Pilani, Goa Campus",
  "VIT Vellore",
  "Manipal Institute of Technology",
  "Delhi Technological University",
  "Jadavpur University",
  "College of Engineering Pune (COEP)",
  "PSG College of Technology",
  "IIIT Bangalore",
];

/** Arts / science / commerce colleges by home state. Entries ending with " *" are women's colleges. */
export const ARTS_BY_STATE: Record<string, string[]> = {
  Maharashtra: ["St. Xavier's College, Mumbai", "Narsee Monjee College of Commerce, Mumbai", "H.R. College of Commerce, Mumbai", "Jai Hind College, Mumbai", "Fergusson College, Pune", "Symbiosis College of Arts and Commerce, Pune", "BMCC, Pune", "University of Mumbai", "SNDT Women's University *"],
  "Tamil Nadu": ["Loyola College, Chennai", "Madras Christian College", "Stella Maris College, Chennai *", "Women's Christian College, Chennai *", "PSG College of Arts and Science", "University of Madras"],
  Karnataka: ["Christ University, Bangalore", "St. Joseph's College, Bangalore", "Mount Carmel College, Bangalore *", "Bangalore University", "St. Aloysius College, Mangalore"],
  Telangana: ["Osmania University", "St. Francis College for Women, Hyderabad *", "Nizam College", "Loyola Academy, Secunderabad"],
  "Andhra Pradesh": ["Andhra University", "Andhra Loyola College, Vijayawada"],
  Kerala: ["St. Teresa's College, Kochi *", "Sacred Heart College, Thevara", "University College, Thiruvananthapuram", "Mar Ivanios College"],
  "West Bengal": ["St. Xavier's College, Kolkata", "Presidency University, Kolkata", "Loreto College, Kolkata *", "University of Calcutta"],
  Gujarat: ["H. L. College of Commerce, Ahmedabad", "St. Xavier's College, Ahmedabad", "M. S. University of Baroda", "Gujarat University"],
  Delhi: ["Shri Ram College of Commerce, DU", "Hindu College, DU", "Hansraj College, DU", "St. Stephen's College, DU", "Kirori Mal College, DU", "Lady Shri Ram College, DU *", "Miranda House, DU *"],
  Haryana: ["Hansraj College, DU", "Kurukshetra University", "Maharshi Dayanand University"],
  Punjab: ["Panjab University", "Guru Nanak Dev University, Amritsar", "Government College for Girls, Ludhiana *", "Khalsa College, Amritsar"],
  Chandigarh: ["Panjab University", "DAV College, Chandigarh", "Government College for Girls, Chandigarh *"],
  "Uttar Pradesh": ["Lucknow University", "Banaras Hindu University", "University of Allahabad", "Isabella Thoburn College, Lucknow *"],
  Rajasthan: ["University of Rajasthan", "St. Xavier's College, Jaipur", "Maharani's College, Jaipur *"],
  "Madhya Pradesh": ["Devi Ahilya Vishwavidyalaya, Indore", "Holkar Science College, Indore"],
  Bihar: ["Patna University", "Patna Women's College *", "St. Xavier's College of Management & Technology, Patna"],
  Odisha: ["Ravenshaw University", "Utkal University"],
  Goa: ["Goa University", "St. Xavier's College, Mapusa", "Dempo College, Panaji"],
};

export const ARTS_TOP = [
  "Shri Ram College of Commerce, DU",
  "St. Stephen's College, DU",
  "Hindu College, DU",
  "St. Xavier's College, Mumbai",
  "Loyola College, Chennai",
  "Christ University, Bangalore",
  "Presidency University, Kolkata",
  "Lady Shri Ram College, DU *",
  "Miranda House, DU *",
  "Narsee Monjee College of Commerce, Mumbai",
];

export const MED_BY_STATE: Record<string, string[]> = {
  Maharashtra: ["Seth GS Medical College & KEM Hospital, Mumbai", "Grant Government Medical College, Mumbai", "B. J. Government Medical College, Pune", "Government Medical College, Nagpur", "Topiwala National Medical College, Mumbai"],
  "Tamil Nadu": ["Madras Medical College", "Stanley Medical College", "Coimbatore Medical College", "Madurai Medical College"],
  Karnataka: ["Bangalore Medical College", "St. John's Medical College, Bangalore", "Mysore Medical College", "Kasturba Medical College, Mangalore"],
  Telangana: ["Osmania Medical College", "Gandhi Medical College, Hyderabad", "Kakatiya Medical College"],
  "Andhra Pradesh": ["Andhra Medical College", "Guntur Medical College", "Siddhartha Medical College"],
  Kerala: ["Government Medical College, Thiruvananthapuram", "Government Medical College, Kozhikode", "Amrita Institute of Medical Sciences"],
  "West Bengal": ["Medical College, Kolkata", "IPGMER & SSKM Hospital", "NRS Medical College"],
  Gujarat: ["B. J. Medical College, Ahmedabad", "Government Medical College, Surat", "Medical College Baroda"],
  Delhi: ["Lady Hardinge Medical College", "University College of Medical Sciences", "Vardhman Mahavir Medical College"],
  Haryana: ["Pt. B. D. Sharma PGIMS, Rohtak"],
  Punjab: ["Government Medical College, Amritsar", "Dayanand Medical College, Ludhiana", "Christian Medical College, Ludhiana"],
  Chandigarh: ["Government Medical College, Chandigarh"],
  "Uttar Pradesh": ["King George's Medical University, Lucknow", "Institute of Medical Sciences, BHU", "GSVM Medical College, Kanpur"],
  Rajasthan: ["SMS Medical College, Jaipur", "Dr. S. N. Medical College, Jodhpur"],
  "Madhya Pradesh": ["MGM Medical College, Indore", "Gandhi Medical College, Bhopal"],
  Bihar: ["Patna Medical College", "Darbhanga Medical College"],
  Odisha: ["SCB Medical College, Cuttack", "AIIMS Bhubaneswar"],
  Goa: ["Goa Medical College"],
};

export const MED_TOP = [
  "AIIMS New Delhi",
  "Maulana Azad Medical College",
  "Christian Medical College, Vellore",
  "Armed Forces Medical College, Pune",
  "JIPMER Puducherry",
  "Kasturba Medical College, Manipal",
];

export const MED_PG = ["AIIMS New Delhi", "PGIMER Chandigarh", "JIPMER Puducherry", "Christian Medical College, Vellore", "Seth GS Medical College & KEM Hospital, Mumbai", "Madras Medical College", "Bangalore Medical College", "Maulana Azad Medical College", "Institute of Medical Sciences, BHU"];

export const MBA_TOP = ["IIM Ahmedabad", "IIM Bangalore", "IIM Calcutta", "IIM Lucknow", "IIM Kozhikode", "ISB Hyderabad", "XLRI Jamshedpur", "FMS Delhi"];
export const MBA_MID = ["IIM Indore", "SPJIMR Mumbai", "MDI Gurgaon", "IIM Shillong", "NMIMS Mumbai", "Symbiosis Institute of Business Management, Pune", "IIFT Delhi", "JBIMS Mumbai", "Great Lakes Institute of Management, Chennai"];
export const MBA_LOW = ["Symbiosis Centre for Management and HR Development, Pune", "Welingkar Institute of Management, Mumbai", "IBS Hyderabad", "Amity Business School, Noida", "Christ University Institute of Management", "Nirma Institute of Management, Ahmedabad", "K. J. Somaiya Institute of Management", "Xavier Institute of Management, Bhubaneswar"];

export const LAW_TOP = ["NLSIU Bangalore", "NALSAR Hyderabad", "National Law University, Delhi", "WBNUJS Kolkata", "Gujarat National Law University"];
export const LAW_MID = ["ILS Law College, Pune", "Government Law College, Mumbai", "Symbiosis Law School, Pune", "Faculty of Law, Delhi University", "Jindal Global Law School", "Christ University School of Law", "Amity Law School, Noida"];

export const DESIGN_COLLEGES = ["NID Ahmedabad", "NIFT Delhi", "NIFT Mumbai", "Srishti Manipal Institute, Bangalore", "MIT Institute of Design, Pune", "Pearl Academy, Delhi"];
export const ARCH_COLLEGES = ["CEPT University, Ahmedabad", "School of Planning and Architecture, Delhi", "Sir J. J. College of Architecture, Mumbai", "IIT Roorkee", "RV College of Architecture, Bangalore"];
export const PHARMA_COLLEGES = ["Manipal College of Pharmaceutical Sciences", "Institute of Chemical Technology, Mumbai", "Jamia Hamdard, Delhi", "NIPER Mohali", "Bombay College of Pharmacy", "JSS College of Pharmacy, Mysore"];
export const DENTAL_COLLEGES = ["Maulana Azad Institute of Dental Sciences", "Government Dental College, Mumbai", "Manipal College of Dental Sciences", "Saveetha Dental College, Chennai", "Nair Hospital Dental College, Mumbai", "A. B. Shetty Memorial Institute of Dental Sciences, Mangalore"];

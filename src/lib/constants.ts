// Shared constants used by both Convex functions and the React app.

// Districts of Rwanda (used by profile editor and opportunity filters)
export const DISTRICTS = [
  "Kigali",
  "Bugesera",
  "Burera",
  "Gakenke",
  "Gasabo",
  "Gatsibo",
  "Gicumbi",
  "Gisagara",
  "Huye",
  "Karongi",
  "Kayonza",
  "Kirehe",
  "Muhanga",
  "Musanze",
  "Ngoma",
  "Nyanza",
  "Nyarugenge",
  "Rubavu",
  "Rusizi",
  "Rwamagana",
];

// Volunteer interest areas (drive recommendations)
export const INTERESTS = [
  "Education",
  "Health",
  "Environment",
  "Community Development",
  "Agriculture",
  "Technology",
  "Youth Empowerment",
  "Women Empowerment",
  "Sports",
  "Arts & Culture",
];

// Skills volunteers can offer
export const SKILLS = [
  "Teaching",
  "First Aid",
  "Public Speaking",
  "Fundraising",
  "Event Planning",
  "Graphic Design",
  "Web Development",
  "Data Entry",
  "Social Media",
  "Translation",
  "Photography",
  "Carpentry",
];

export const CATEGORIES = [
  "Education",
  "Youth Empowerment",
  "Health",
  "Environment",
  "Community",
  "Agriculture",
  "Technology",
];

export const COMMITMENTS = ["One-time", "Weekly", "Monthly", "Ongoing"];

export const AVAILABILITY = ["Flexible", "One-time", "Weekly", "Monthly", "Ongoing"];

// Opportunity types (org posting form)
export const OPPORTUNITY_TYPES = [
  "Volunteer",
  "Internship",
  "Fellowship",
  "Event Support",
];

// Minimum education levels
export const EDUCATION_LEVELS = [
  "Any",
  "O-Level / A2",
  "A-Level / A2 done",
  "Diploma",
  "Bachelor's degree",
  "Master's or higher",
];

// Minimum experience levels
export const EXPERIENCE_LEVELS = [
  "No experience",
  "Some experience",
  "1+ year",
  "3+ years",
  "5+ years",
];

// Org applicant pipeline stages (New → Reviewing → Shortlisted → Accepted/Rejected)
export const STAGES = [
  "new",
  "reviewing",
  "shortlisted",
  "accepted",
  "rejected",
] as const;

export const STAGE_LABELS: Record<string, string> = {
  new: "New",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  accepted: "Accepted",
  rejected: "Rejected",
};

/** Accounts created before this rollout are considered existing users. */
export const EXISTING_USER_CUTOFF = 1789811810137; // deploy time — accounts created after this are new

/** localStorage key for the theme preference (light | dark | system). */
export const THEME_STORAGE_KEY = "fasha.theme";

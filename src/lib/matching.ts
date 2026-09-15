// Match score between a volunteer profile and opportunity eligibility criteria.
// Mirrors the backend logic in convex/applications.ts so the org UI can display
// the same score shown to reviewers.

export type Eligibility = {
  minAge?: number;
  maxAge?: number;
  education?: string;
  experience?: string;
  districts?: string[];
  skills?: string[];
};

export type VolunteerLike = {
  age?: number | null;
  education?: string | null;
  experience?: string | null;
  district?: string | null;
  skills?: string[] | null;
};

const EDU_RANK: Record<string, number> = {
  "Any": 0,
  "O-Level / A2": 1,
  "A-Level / A2 done": 2,
  "Diploma": 3,
  "Bachelor's degree": 4,
  "Master's or higher": 5,
};

const EXP_RANK: Record<string, number> = {
  "No experience": 0,
  "Some experience": 1,
  "1+ year": 2,
  "3+ years": 3,
  "5+ years": 4,
};

/** 0–100 match score plus breakdown of which criteria are met/missed. */
export function matchScore(
  vol: VolunteerLike,
  elig: Eligibility | undefined | null,
): { score: number; met: string[]; missed: string[] } {
  const met: string[] = [];
  const missed: string[] = [];

  if (!elig) {
    return { score: 70, met: ["Open application — no strict criteria"], missed: [] };
  }

  let gained = 0;
  let possible = 0;

  // Age
  if (elig.minAge !== undefined || elig.maxAge !== undefined) {
    possible += 1;
    const min = elig.minAge ?? 0;
    const max = elig.maxAge ?? 200;
    if (vol.age === null || vol.age === undefined) {
      missed.push(`Age ${min ? `${min}+` : ""}${max && max !== 200 ? `–${max}` : ""} (not set)`);
    } else if (vol.age >= min && vol.age <= max) {
      gained += 1;
      met.push(`Age fits (${vol.age})`);
    } else {
      missed.push(`Age ${min ? `${min}+` : ""}${max && max !== 200 ? `–${max}` : ""}`);
    }
  }

  // Education
  if (elig.education && elig.education !== "Any") {
    possible += 1;
    const need = EDU_RANK[elig.education] ?? 0;
    const has = EDU_RANK[vol.education ?? ""] ?? -1;
    if (has >= need) {
      gained += 1;
      met.push(`Education: ${elig.education}`);
    } else {
      missed.push(`Education: needs ${elig.education}`);
    }
  }

  // Experience
  if (elig.experience && elig.experience !== "No experience") {
    possible += 1;
    const need = EXP_RANK[elig.experience] ?? 0;
    const has = EXP_RANK[vol.experience ?? ""] ?? -1;
    if (has >= need) {
      gained += 1;
      met.push(`Experience: ${elig.experience}`);
    } else {
      missed.push(`Experience: needs ${elig.experience}`);
    }
  }

  // Location
  if (elig.districts && elig.districts.length > 0) {
    possible += 1;
    if (vol.district && elig.districts.includes(vol.district)) {
      gained += 1;
      met.push(`Based in ${vol.district}`);
    } else {
      missed.push(`Located in ${elig.districts.join(", ")}`);
    }
  }

  // Skills
  if (elig.skills && elig.skills.length > 0) {
    const volSkills = (vol.skills ?? []).map((s) => s.toLowerCase());
    const hits = elig.skills.filter((s) =>
      volSkills.some((k) => k === s.toLowerCase() || k.includes(s.toLowerCase()) || s.toLowerCase().includes(k)),
    );
    possible += 1;
    if (hits.length > 0) {
      gained += 1;
      met.push(`Skills: ${hits.slice(0, 2).join(", ")}`);
    } else {
      missed.push(`Skills: ${elig.skills.slice(0, 3).join(", ")}`);
    }
  }

  if (possible === 0) {
    return { score: 70, met: ["Open application — no strict criteria"], missed: [] };
  }

  const base = Math.round((gained / possible) * 90);
  return {
    score: Math.max(5, base),
    met,
    missed,
  };
}

/** Short human reason chips for recommendation cards. */
export function matchReasonsFor(
  vol: VolunteerLike,
  opp: { category?: string; district?: string; commitment?: string; skills?: string[] },
  interests?: string[],
): string[] {
  const reasons: string[] = [];
  const catWords = (opp.category ?? "").toLowerCase();
  const interestHit = (interests ?? []).find((i) => {
    const w = i.toLowerCase();
    return w === catWords || w.includes(catWords) || catWords.includes(w);
  });
  if (interestHit) reasons.push(`Matches your interest in ${interestHit}`);
  if (vol.district && opp.district === vol.district) reasons.push(`In ${opp.district}, close to you`);
  const volSkills = (vol.skills ?? []).map((s) => s.toLowerCase());
  const skillHits = (opp.skills ?? []).filter((s) =>
    volSkills.some((k) => k === s.toLowerCase() || s.toLowerCase().includes(k) || k.includes(s.toLowerCase())),
  );
  if (skillHits.length > 0) reasons.push(`You have ${skillHits.slice(0, 2).join(" & ")}`);
  return reasons.slice(0, 3);
}

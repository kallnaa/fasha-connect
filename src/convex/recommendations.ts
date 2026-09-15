import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUser } from "./users";

export type ScoredOpportunity = {
  _id: string;
  title: string;
  orgName: string;
  description: string;
  category: string;
  district: string;
  commitment: string;
  skills: string[];
  slots: number;
  slotsFilled: number;
  score: number;
  matchReasons: string[];
};

/**
 * Personalized recommendations: score open opportunities against the
 * signed-in volunteer's interests, skills, district and availability.
 */
export const recommend = query({
  args: {},
  handler: async (ctx): Promise<ScoredOpportunity[]> => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const interests = user.interests ?? [];
    const skills = (user.skills ?? []).map((s) => s.toLowerCase());
    const district = user.district ?? null;
    const availability = user.availability ?? null;

    const open = await ctx.db
      .query("opportunities")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    const scored: ScoredOpportunity[] = open.map((o) => {
      let score = 0;
      const reasons: string[] = [];

      // interest match: interest maps to opportunity category (either exact or
      // overlapping words like "Community Development" ~ "Community")
      const catWords = o.category.toLowerCase();
      const interestHit = interests.find((i) => {
        const w = i.toLowerCase();
        return w === catWords || w.includes(catWords) || catWords.includes(w);
      });
      if (interestHit) {
        score += 40;
        reasons.push(`Matches your interest in ${interestHit}`);
      }

      // skill overlap
      const skillHits = o.skills.filter((s) =>
        skills.some((k) => k === s.toLowerCase() || s.toLowerCase().includes(k) || k.includes(s.toLowerCase())),
      );
      if (skillHits.length > 0) {
        score += 15 * skillHits.length;
        reasons.push(`You have ${skillHits.slice(0, 2).join(" & ")}`);
      }

      // same district
      if (district && o.district === district) {
        score += 25;
        reasons.push(`In ${o.district}, close to you`);
      }

      // availability vs commitment
      if (
        availability === o.commitment ||
        availability === "Flexible" ||
        o.commitment === "One-time"
      ) {
        score += 10;
        reasons.push("Fits your availability");
      }

      // slight boost for fewer remaining slots (urgency) and featured
      const remaining = Math.max(0, o.slots - o.slotsFilled);
      if (remaining > 0 && remaining <= Math.ceil(o.slots * 0.25)) {
        score += 5;
        reasons.push("Only a few spots left");
      }
      if (o.featured) score += 5;

      // tiny recency tie-breaker baked into score to keep order stable
      score += Math.min(4, (o.createdAt % 86400000) / 21600000);

      return {
        _id: o._id,
        title: o.title,
        orgName: o.orgName,
        description: o.description,
        category: o.category,
        district: o.district,
        commitment: o.commitment,
        skills: o.skills,
        slots: o.slots,
        slotsFilled: o.slotsFilled,
        score,
        matchReasons: reasons.slice(0, 3),
      };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, 6);
  },
});

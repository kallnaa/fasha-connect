import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

/** Public listing of open opportunities with optional search & filters. */
export const list = query({
  args: {
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    district: v.optional(v.string()),
    commitment: v.optional(v.string()),
  },
  handler: async (ctx, { search, category, district, commitment }) => {
    let rows = await ctx.db
      .query("opportunities")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    if (category && category !== "all") {
      rows = rows.filter((r) => r.category === category);
    }
    if (district && district !== "all") {
      rows = rows.filter((r) => r.district === district);
    }
    if (commitment && commitment !== "all") {
      rows = rows.filter((r) => r.commitment === commitment);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.orgName.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.skills.some((s) => s.toLowerCase().includes(q)),
      );
    }

    return rows.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return b.createdAt - a.createdAt;
    });
  },
});

/** A few open opportunities for the landing page (featured first). */
export const listFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 6 }) => {
    const rows = await ctx.db
      .query("opportunities")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();
    rows.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return b.createdAt - a.createdAt;
    });
    return rows.slice(0, limit);
  },
});

/** Get one opportunity with its org profile. */
export const get = query({
  args: { id: v.id("opportunities") },
  handler: async (ctx, { id }) => {
    const row = await ctx.db.get(id);
    if (!row) return null;
    const org = await ctx.db.get(row.orgId);
    return {
      ...row,
      orgBio: org?.bio ?? null,
      orgDistrict: org?.district ?? null,
    };
  },
});

/** Opportunities belonging to the signed-in organization. */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const rows = await ctx.db
      .query("opportunities")
      .withIndex("by_org", (q) => q.eq("orgId", user._id))
      .collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

const CATEGORIES = [
  "Education",
  "Health",
  "Environment",
  "Community",
  "Agriculture",
  "Technology",
];

const COMMITMENTS = ["One-time", "Weekly", "Monthly", "Ongoing"];

/** Create a new opportunity (organizations only). */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    district: v.string(),
    commitment: v.string(),
    skills: v.array(v.string()),
    slots: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");

    await ctx.db.insert("opportunities", {
      orgId: user._id,
      orgName: user.orgName ?? user.name ?? "Organization",
      title: args.title.trim(),
      description: args.description.trim(),
      category: CATEGORIES.includes(args.category)
        ? args.category
        : "Community",
      district: args.district,
      commitment: COMMITMENTS.includes(args.commitment)
        ? args.commitment
        : "Ongoing",
      skills: args.skills.map((s) => s.trim()).filter(Boolean),
      slots: Math.max(1, Math.floor(args.slots)),
      slotsFilled: 0,
      status: "open",
      featured: false,
      createdAt: Date.now(),
    });
  },
});

/** Org can close or reopen an opportunity. */
export const setStatus = mutation({
  args: { id: v.id("opportunities"), status: v.union(v.literal("open"), v.literal("closed")) },
  handler: async (ctx, { id, status }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");
    const row = await ctx.db.get(id);
    if (!row) throw new Error("Opportunity not found");
    if (row.orgId !== user._id) throw new Error("Not your opportunity");
    await ctx.db.patch(id, { status });
  },
});

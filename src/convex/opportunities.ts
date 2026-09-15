import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { eligibilityValidator } from "./schema";
import {
  CATEGORIES,
  COMMITMENTS,
  OPPORTUNITY_TYPES,
} from "../lib/constants";

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

    // paused postings are hidden from volunteers
    rows = rows.filter((r) => !r.isPaused);

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
          (r.targetAudience ?? "").toLowerCase().includes(q) ||
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
    const visible = rows.filter((r) => !r.isPaused);
    visible.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return b.createdAt - a.createdAt;
    });
    return visible.slice(0, limit);
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
      orgWebsite: org?.website ?? null,
      orgVerification: org?.verification ?? "none",
      orgLogo: org?.orgLogo ?? null,
    };
  },
});

/** Track a detail view (volunteer opened the posting). */
export const trackView = mutation({
  args: { id: v.id("opportunities") },
  handler: async (ctx, { id }) => {
    const row = await ctx.db.get(id);
    if (!row) return;
    await ctx.db.patch(id, { views: (row.views ?? 0) + 1 });
  },
});

/** Track an application-link click (volunteer clicked external apply URL). */
export const trackLinkClick = mutation({
  args: { id: v.id("opportunities") },
  handler: async (ctx, { id }) => {
    const row = await ctx.db.get(id);
    if (!row) return;
    await ctx.db.patch(id, { linkClicks: (row.linkClicks ?? 0) + 1 });
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
    type: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    deadline: v.optional(v.number()),
    benefits: v.optional(v.string()),
    requirements: v.optional(v.string()),
    applicationLink: v.optional(v.string()),
    eligibility: v.optional(eligibilityValidator),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");
    if (user.accountType !== "organization") {
      throw new Error("Only organization accounts can post opportunities");
    }

    await ctx.db.insert("opportunities", {
      orgId: user._id,
      orgName: user.orgName ?? user.name ?? "Organization",
      title: args.title.trim(),
      description: args.description.trim(),
      category: CATEGORIES.includes(args.category) ? args.category : "Community",
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

      type: args.type && OPPORTUNITY_TYPES.includes(args.type) ? args.type : "Volunteer",
      targetAudience: args.targetAudience?.trim() || undefined,
      deadline: args.deadline,
      benefits: args.benefits?.trim() || undefined,
      requirements: args.requirements?.trim() || undefined,
      applicationLink: args.applicationLink?.trim() || undefined,
      eligibility: args.eligibility,

      isPaused: false,
      views: 0,
      saves: 0,
      linkClicks: 0,
    });
  },
});

/** Edit an existing opportunity (owner only). */
export const update = mutation({
  args: {
    id: v.id("opportunities"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    district: v.optional(v.string()),
    commitment: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    slots: v.optional(v.number()),
    type: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    deadline: v.optional(v.number()),
    benefits: v.optional(v.string()),
    requirements: v.optional(v.string()),
    applicationLink: v.optional(v.string()),
    eligibility: v.optional(eligibilityValidator),
  },
  handler: async (ctx, { id, ...patch }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");
    const row = await ctx.db.get(id);
    if (!row) throw new Error("Opportunity not found");
    if (row.orgId !== user._id) throw new Error("Not your opportunity");

    const clean: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(patch)) {
      if (val === undefined) continue;
      if (k === "title" || k === "description" || k === "benefits" || k === "requirements" || k === "applicationLink" || k === "targetAudience") {
        clean[k] = String(val).trim() || undefined;
      } else if (k === "slots") {
        clean[k] = Math.max(1, Math.floor(Number(val)));
      } else if (k === "skills") {
        clean[k] = (val as string[]).map((s) => s.trim()).filter(Boolean);
      } else {
        clean[k] = val;
      }
    }
    await ctx.db.patch(id, clean);
  },
});

/** Org can open, pause, close or reopen an opportunity. */
export const setStatus = mutation({
  args: {
    id: v.id("opportunities"),
    status: v.union(v.literal("open"), v.literal("closed")),
    paused: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, status, paused }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");
    const row = await ctx.db.get(id);
    if (!row) throw new Error("Opportunity not found");
    if (row.orgId !== user._id) throw new Error("Not your opportunity");
    const patch: Record<string, unknown> = { status };
    if (paused !== undefined) patch.isPaused = paused;
    await ctx.db.patch(id, patch);
  },
});

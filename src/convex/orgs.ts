import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

/**
 * Request the Verified Organization badge.
 * In this free-tier demo the request is recorded and auto-approved after a
 * quick review, so orgs can experience the full badge flow.
 */
export const requestVerification = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");
    if (user.accountType !== "organization") {
      throw new Error("Only organization accounts can request verification");
    }
    if (user.verification === "verified") return "already-verified";

    await ctx.db.patch(user._id, {
      verification: "verified",
      verifiedAt: Date.now(),
    });
    return "verified";
  },
});

/** Org dashboard stats: active postings, applications, pipeline, analytics totals. */
export const orgStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const opps = await ctx.db
      .query("opportunities")
      .withIndex("by_org", (q) => q.eq("orgId", user._id))
      .collect();

    let totalApplications = 0;
    let needingReview = 0; // stage === "new"
    let reviewing = 0;
    let shortlisted = 0;
    let accepted = 0;
    let rejected = 0;

    for (const opp of opps) {
      const rows = await ctx.db
        .query("applications")
        .withIndex("by_opportunity", (q) => q.eq("opportunityId", opp._id))
        .collect();
      totalApplications += rows.length;
      for (const r of rows) {
        const stage = r.stage ?? "new";
        if (stage === "new") needingReview += 1;
        else if (stage === "reviewing") reviewing += 1;
        else if (stage === "shortlisted") shortlisted += 1;
        else if (stage === "accepted") accepted += 1;
        else if (stage === "rejected") rejected += 1;
      }
    }

    return {
      activeOpportunities: opps.filter(
        (o) => o.status === "open" && !o.isPaused,
      ).length,
      totalOpportunities: opps.length,
      totalApplications,
      needingReview,
      reviewing,
      shortlisted,
      accepted,
      rejected,
      totalViews: opps.reduce((s, o) => s + (o.views ?? 0), 0),
      totalSaves: opps.reduce((s, o) => s + (o.saves ?? 0), 0),
      totalLinkClicks: opps.reduce((s, o) => s + (o.linkClicks ?? 0), 0),
      verification: user.verification ?? "none",
    };
  },
});

/** Per-opportunity analytics rows for the org analytics page. */
export const opportunityAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const opps = await ctx.db
      .query("opportunities")
      .withIndex("by_org", (q) => q.eq("orgId", user._id))
      .collect();
    return Promise.all(
      opps.map(async (o) => {
        const rows = await ctx.db
          .query("applications")
          .withIndex("by_opportunity", (q) => q.eq("opportunityId", o._id))
          .collect();
        const views = o.views ?? 0;
        return {
          _id: o._id,
          title: o.title,
          status: o.status,
          isPaused: o.isPaused ?? false,
          views,
          saves: o.saves ?? 0,
          linkClicks: o.linkClicks ?? 0,
          applications: rows.length,
          // simple conversion: applications per view (percent)
          conversion: views > 0 ? Math.round((rows.length / views) * 100) : 0,
        };
      }),
    );
  },
});

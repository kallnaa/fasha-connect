import { query } from "./_generated/server";
import { getCurrentUser } from "./users";

/** Lightweight dashboard stats for the signed-in user. */
export const myStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const apps = await ctx.db
      .query("applications")
      .withIndex("by_volunteer", (q) => q.eq("volunteerId", user._id))
      .collect();

    const orgOpps = await ctx.db
      .query("opportunities")
      .withIndex("by_org", (q) => q.eq("orgId", user._id))
      .collect();

    let pendingForMyOpps = 0;
    let acceptedTotal = 0;
    for (const opp of orgOpps) {
      const rows = await ctx.db
        .query("applications")
        .withIndex("by_opportunity", (q) => q.eq("opportunityId", opp._id))
        .collect();
      pendingForMyOpps += rows.filter((r) => r.status === "pending").length;
      acceptedTotal += rows.filter((r) => r.status === "accepted").length;
    }

    return {
      myApplications: apps.length,
      pending: apps.filter((a) => a.status === "pending").length,
      accepted: apps.filter((a) => a.status === "accepted").length,
      myOpportunities: orgOpps.length,
      pendingForMyOpps,
      acceptedTotal,
      volunteersConnected: acceptedTotal,
    };
  },
});

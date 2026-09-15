import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { publicProfileFor } from "./profiles";

/** Volunteer applies to an opportunity. */
export const apply = mutation({
  args: {
    opportunityId: v.id("opportunities"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, { opportunityId, message }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Sign in to apply");

    const opp = await ctx.db.get(opportunityId);
    if (!opp) throw new Error("Opportunity not found");
    if (opp.status !== "open") throw new Error("This opportunity is not open");

    // prevent duplicates
    const existing = await ctx.db
      .query("applications")
      .withIndex("by_volunteer_opportunity", (q) =>
        q.eq("volunteerId", user._id).eq("opportunityId", opportunityId),
      )
      .first();
    if (existing) throw new Error("You already applied to this opportunity");

    const applicationId = await ctx.db.insert("applications", {
      opportunityId,
      volunteerId: user._id,
      orgId: opp.orgId,
      message: message?.trim() || undefined,
      status: "pending",
      createdAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: opp.orgId,
      title: "New application",
      body: `${user.name ?? "A volunteer"} applied for "${opp.title}".`,
      kind: "application",
      read: false,
      createdAt: Date.now(),
    });

    return applicationId;
  },
});

/** My applications as a volunteer, with opportunity details joined. */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const mine = await ctx.db
      .query("applications")
      .withIndex("by_volunteer", (q) => q.eq("volunteerId", user._id))
      .collect();
    mine.sort((a, b) => b.createdAt - a.createdAt);

    return Promise.all(
      mine.map(async (app) => {
        const opp = await ctx.db.get(app.opportunityId);
        return {
          _id: app._id,
          status: app.status,
          createdAt: app.createdAt,
          opportunity: opp
            ? {
                _id: opp._id,
                title: opp.title,
                orgName: opp.orgName,
                category: opp.category,
                district: opp.district,
                commitment: opp.commitment,
              }
            : null,
        };
      }),
    );
  },
});

/** Applications for one opportunity (org side). */
export const listForOpportunity = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, { opportunityId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const opp = await ctx.db.get(opportunityId);
    if (!opp || opp.orgId !== user._id) return [];

    const rows = await ctx.db
      .query("applications")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", opportunityId))
      .collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);

    const rowsWithVolunteer = await Promise.all(
      rows.map(async (app) => {
        const vol = await ctx.db.get(app.volunteerId);
        return vol ? { app, profile: await publicProfileFor(ctx, vol._id) } : null;
      }),
    );

    return rowsWithVolunteer
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .map((row) => ({
        _id: row.app._id,
        status: row.app.status,
        message: row.app.message ?? null,
        createdAt: row.app.createdAt,
        volunteer: {
          _id: row.profile!._id,
          name: row.profile!.name,
          district: row.profile!.district,
          skills: row.profile!.skills,
          interests: row.profile!.interests,
          availability: row.profile!.availability,
          bio: row.profile!.bio,
        },
      }));
  },
});

/** Pending application count for one opportunity (org side, cheap badge). */
export const countPendingForOpportunity = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, { opportunityId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return 0;
    const opp = await ctx.db.get(opportunityId);
    if (!opp || opp.orgId !== user._id) return 0;
    const rows = await ctx.db
      .query("applications")
      .withIndex("by_opportunity", (q) => q.eq("opportunityId", opportunityId))
      .collect();
    return rows.filter((r) => r.status === "pending").length;
  },
});

/** Accept or decline an application (org only). */
export const decide = mutation({
  args: {
    applicationId: v.id("applications"),
    decision: v.union(v.literal("accepted"), v.literal("declined")),
  },
  handler: async (ctx, { applicationId, decision }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");
    const app = await ctx.db.get(applicationId);
    if (!app) throw new Error("Application not found");
    if (app.orgId !== user._id) throw new Error("Not your application");

    if (app.status !== "pending") throw new Error("Already decided");

    await ctx.db.patch(applicationId, {
      status: decision,
      decidedAt: Date.now(),
    });

    const opp = await ctx.db.get(app.opportunityId);

    if (decision === "accepted" && opp) {
      await ctx.db.patch(opp._id, {
        slotsFilled: Math.min(opp.slots, opp.slotsFilled + 1),
      });
      // auto-close when full
      if (opp.slotsFilled + 1 >= opp.slots) {
        await ctx.db.patch(opp._id, { status: "filled" });
      }
    }

    await ctx.db.insert("notifications", {
      userId: app.volunteerId,
      title: decision === "accepted" ? "Application accepted 🎉" : "Application update",
      body: opp
        ? decision === "accepted"
          ? `You've been accepted for "${opp.title}" with ${opp.orgName}.`
          : `Your application for "${opp.title}" was not accepted this time.`
        : "Your application status changed.",
      kind: "status",
      read: false,
      createdAt: Date.now(),
    });
  },
});

/** Volunteer withdraws their application. */
export const withdraw = mutation({
  args: { applicationId: v.id("applications") },
  handler: async (ctx, { applicationId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");
    const app = await ctx.db.get(applicationId);
    if (!app) throw new Error("Application not found");
    if (app.volunteerId !== user._id) throw new Error("Not your application");
    if (app.status !== "pending") throw new Error("Only pending applications can be withdrawn");
    await ctx.db.delete(applicationId);
  },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { publicProfileFor } from "./profiles";
import { matchScore } from "../lib/matching";
import { STAGES } from "../lib/constants";

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
    if (opp.isPaused) throw new Error("This opportunity is paused");

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
      stage: "new",
      stageUpdatedAt: Date.now(),
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
          stage: app.stage ?? "new",
          createdAt: app.createdAt,
          infoRequest: app.infoRequest ?? null,
          infoResponse: app.infoResponse ?? null,
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

/** Applications for one opportunity (org side), with volunteer profile + match score. */
export const listForOpportunity = query({
  args: {
    opportunityId: v.id("opportunities"),
    // optional client-side-style filters; filtering also happens in UI
    stage: v.optional(
      v.union(
        v.literal("new"),
        v.literal("reviewing"),
        v.literal("shortlisted"),
        v.literal("accepted"),
        v.literal("rejected"),
      ),
    ),
  },
  handler: async (ctx, { opportunityId, stage }) => {
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
      .filter((r) => !stage || (r.app.stage ?? "new") === stage)
      .map((row) => {
        const p = row.profile!;
        const { score, met, missed } = matchScore(
          {
            age: p.age ?? null,
            education: p.education ?? null,
            experience: p.experience ?? null,
            district: p.district ?? null,
            skills: p.skills ?? [],
          },
          opp.eligibility,
        );
        return {
          _id: row.app._id,
          status: row.app.status,
          stage: row.app.stage ?? "new",
          message: row.app.message ?? null,
          createdAt: row.app.createdAt,
          infoRequest: row.app.infoRequest ?? null,
          infoRequestedAt: row.app.infoRequestedAt ?? null,
          infoResponse: row.app.infoResponse ?? null,
          infoRespondedAt: row.app.infoRespondedAt ?? null,
          matchScore: score,
          criteriaMet: met,
          criteriaMissed: missed,
          volunteer: {
            _id: p._id,
            name: p.name,
            district: p.district,
            skills: p.skills,
            interests: p.interests,
            availability: p.availability,
            bio: p.bio,
            age: p.age ?? null,
            education: p.education ?? null,
            experience: p.experience ?? null,
            image: p.image,
          },
        };
      });
  },
});

/** Set pipeline stage for an application (org only). */
export const setStage = mutation({
  args: {
    applicationId: v.id("applications"),
    stage: v.union(
      v.literal("new"),
      v.literal("reviewing"),
      v.literal("shortlisted"),
      v.literal("accepted"),
      v.literal("rejected"),
    ),
  },
  handler: async (ctx, { applicationId, stage }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");
    const app = await ctx.db.get(applicationId);
    if (!app) throw new Error("Application not found");
    if (app.orgId !== user._id) throw new Error("Not your application");

    const now = Date.now();
    await ctx.db.patch(applicationId, {
      stage,
      stageUpdatedAt: now,
      status:
        stage === "accepted" ? "accepted" : stage === "rejected" ? "declined" : "pending",
      decidedAt: stage === "accepted" || stage === "rejected" ? now : undefined,
    });

    const opp = await ctx.db.get(app.opportunityId);

    if (stage === "accepted" && opp) {
      await ctx.db.patch(opp._id, {
        slotsFilled: Math.min(opp.slots, opp.slotsFilled + 1),
      });
      if (opp.slotsFilled + 1 >= opp.slots) {
        await ctx.db.patch(opp._id, { status: "filled" });
      }
    }

    const stageLabels: Record<string, string> = {
      reviewing: "moved to Reviewing",
      shortlisted: "been Shortlisted 🌟",
      accepted: "been Accepted 🎉",
      rejected: "not been accepted this time",
    };
    if (stageLabels[stage]) {
      await ctx.db.insert("notifications", {
        userId: app.volunteerId,
        title:
          stage === "accepted"
            ? "Application accepted 🎉"
            : stage === "rejected"
              ? "Application update"
              : "Application progress",
        body: opp
          ? `Your application for "${opp.title}" with ${opp.orgName} has ${stageLabels[stage]}.`
          : "Your application status changed.",
        kind: "status",
        read: false,
        createdAt: now,
      });
    }
  },
});

/** Org requests additional info/documents from a volunteer. */
export const requestInfo = mutation({
  args: {
    applicationId: v.id("applications"),
    request: v.string(),
  },
  handler: async (ctx, { applicationId, request }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");
    const app = await ctx.db.get(applicationId);
    if (!app) throw new Error("Application not found");
    if (app.orgId !== user._id) throw new Error("Not your application");

    const now = Date.now();
    await ctx.db.patch(applicationId, {
      infoRequest: request.trim(),
      infoRequestedAt: now,
    });

    const opp = await ctx.db.get(app.opportunityId);
    await ctx.db.insert("notifications", {
      userId: app.volunteerId,
      title: "Information requested",
      body: opp
        ? `${opp.orgName} requested more info for "${opp.title}": ${request.trim().slice(0, 120)}`
        : "An organization requested more information from you.",
      kind: "info",
      read: false,
      createdAt: now,
    });
  },
});

/** Volunteer responds to an info request. */
export const respondInfo = mutation({
  args: {
    applicationId: v.id("applications"),
    response: v.string(),
  },
  handler: async (ctx, { applicationId, response }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");
    const app = await ctx.db.get(applicationId);
    if (!app) throw new Error("Application not found");
    if (app.volunteerId !== user._id) throw new Error("Not your application");

    const now = Date.now();
    await ctx.db.patch(applicationId, {
      infoResponse: response.trim(),
      infoRespondedAt: now,
    });

    const opp = await ctx.db.get(app.opportunityId);
    await ctx.db.insert("notifications", {
      userId: app.orgId,
      title: "Info response received",
      body: `${user.name ?? "A volunteer"} responded to your request on "${opp?.title ?? "your opportunity"}".`,
      kind: "info",
      read: false,
      createdAt: now,
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
    if (app.status !== "pending") {
      throw new Error("Only in-progress applications can be withdrawn");
    }
    await ctx.db.delete(applicationId);
  },
});

// keep STAGES referenced for potential future server-side use
void STAGES;

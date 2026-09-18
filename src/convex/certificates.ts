import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

/** All certificates owned by the signed-in volunteer. */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const rows = await ctx.db
      .query("certificates")
      .withIndex("by_volunteer", (q) => q.eq("volunteerId", user._id))
      .collect();
    return rows.sort((a, b) => (b.issuedAt ?? b.createdAt) - (a.issuedAt ?? a.createdAt));
  },
});

/**
 * Add a certificate. Accepts either an uploaded file (URL from the file
 * picker flow) or a manual entry (title + issuer only).
 */
export const add = mutation({
  args: {
    title: v.string(),
    issuer: v.optional(v.string()),
    issuedAt: v.optional(v.number()),
    fileUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
  },
  handler: async (ctx, { title, issuer, issuedAt, fileUrl, fileName, fileType }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");

    const cleanTitle = title.trim();
    if (!cleanTitle) throw new Error("Certificate title is required");

    await ctx.db.insert("certificates", {
      volunteerId: user._id,
      title: cleanTitle,
      issuer: issuer?.trim() || undefined,
      issuedAt,
      fileUrl: fileUrl?.trim() || undefined,
      fileName: fileName?.trim() || undefined,
      fileType: fileType?.trim() || undefined,
      verified: false,
      createdAt: Date.now(),
    });
  },
});

/** Remove a certificate (owner only). */
export const remove = mutation({
  args: { id: v.id("certificates") },
  handler: async (ctx, { id }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");
    const row = await ctx.db.get(id);
    if (!row) throw new Error("Certificate not found");
    if (row.volunteerId !== user._id) {
      throw new Error("You can only remove your own certificates");
    }
    await ctx.db.delete(id);
  },
});

/**
 * Organization trigger: mark an accepted volunteer's engagement as completed.
 * Generates an authenticated, org-verified certificate entry on the
 * volunteer's profile with verified hours, sector, and organization name.
 * Idempotent per application — completing twice is a no-op.
 */
export const markCompleted = mutation({
  args: {
    applicationId: v.id("applications"),
    hours: v.number(),
  },
  handler: async (ctx, { applicationId, hours }) => {
    const org = await getCurrentUser(ctx);
    if (!org) throw new Error("Not signed in");
    if (org.accountType !== "organization") {
      throw new Error("Only organizations can mark engagements as completed");
    }

    const app = await ctx.db.get(applicationId);
    if (!app) throw new Error("Application not found");
    if (app.orgId !== org._id) {
      throw new Error("You can only complete volunteers on your own opportunities");
    }
    if (app.status !== "accepted") {
      throw new Error("Only accepted volunteers can be marked as completed");
    }

    // Idempotency: one completion certificate per application
    const existing = await ctx.db
      .query("certificates")
      .withIndex("by_volunteer", (q) => q.eq("volunteerId", app.volunteerId))
      .collect();
    if (existing.some((c) => c.opportunityId === app.opportunityId && c.source === "organization")) {
      return { created: false as const };
    }

    const opp = await ctx.db.get(app.opportunityId);
    const cleanHours = Math.max(1, Math.min(2000, Math.round(hours)));
    const now = Date.now();

    await ctx.db.insert("certificates", {
      volunteerId: app.volunteerId,
      title: `${opp?.title ?? "Volunteer Program"} — Completed`,
      issuer: org.orgName ?? org.name ?? "Organization",
      issuedAt: now,
      verified: true,
      verifiedBy: org._id,
      verifiedAt: now,
      source: "organization",
      opportunityId: app.opportunityId,
      opportunityTitle: opp?.title,
      sector: opp?.category ?? "Community",
      hours: cleanHours,
      orgId: org._id,
      createdAt: now,
    });

    // Notify the volunteer with a deep link to their profile
    await ctx.db.insert("notifications", {
      userId: app.volunteerId,
      title: "Certificate earned! 🏅",
      body: `${org.orgName ?? org.name ?? "Your organization"} verified your completion of "${opp?.title ?? "the program"}" — ${cleanHours} hours added to your impact log.`,
      kind: "certificate",
      link: "/profile",
      read: false,
      createdAt: now,
    });

    return { created: true as const, hours: cleanHours };
  },
});

/** Public impact stats for a volunteer: total verified hours + completed programs. */
export const impactStats = query({
  args: { volunteerId: v.id("users") },
  handler: async (ctx, { volunteerId }) => {
    const rows = await ctx.db
      .query("certificates")
      .withIndex("by_volunteer", (q) => q.eq("volunteerId", volunteerId))
      .collect();
    const verified = rows.filter((r) => r.verified);
    return {
      totalHours: verified.reduce((sum, r) => sum + (r.hours ?? 0), 0),
      completedPrograms: verified.filter((r) => r.source === "organization").length,
      certificates: verified.length,
    };
  },
});

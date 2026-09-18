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

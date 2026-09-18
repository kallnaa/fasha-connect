import { ACCOUNT_TYPES } from "./schema";
import { mutation, query, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { getCurrentUser } from "./users";

/**
 * Set the caller's role (account type). Called right after sign-up/sign-in
 * from the auth page so routing can trust `accountType` immediately.
 * Idempotent; role can only be changed while it is unset.
 */
export const setInitialRole = mutation({
  args: { accountType: v.union(v.literal("volunteer"), v.literal("organization")) },
  handler: async (ctx, { accountType }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");
    if (user.accountType && user.accountType !== accountType) {
      throw new Error(
        "This account already has a role. Manage it from your profile page.",
      );
    }
    if (user.accountType === accountType) return user._id;
    await ctx.db.patch(user._id, { accountType });
    return user._id;
  },
});

/**
 * One-shot volunteer onboarding survey. Returns the new recommendations seed
 * (district) and marks onboarding complete so the dashboard can render.
 */
export const completeOnboarding = mutation({
  args: {
    name: v.optional(v.string()),
    interests: v.array(v.string()),
    skills: v.array(v.string()),
    district: v.optional(v.string()),
    availability: v.optional(v.string()),
  },
  handler: async (ctx, { name, interests, skills, district, availability }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");

    const patch: Record<string, unknown> = {
      interests,
      skills,
      onboardedAt: Date.now(),
    };
    if (name && name.trim()) patch.name = name.trim();
    if (district && district !== "all") patch.district = district;
    if (availability && availability !== "all") patch.availability = availability;

    await ctx.db.patch(user._id, patch);
    return user._id;
  },
});

/** Create or update the signed-in user's Fasha profile. */
export const upsertProfile = mutation({
  args: {
    accountType: v.optional(
      v.union(v.literal("volunteer"), v.literal("organization")),
    ),
    name: v.optional(v.string()),
    orgName: v.optional(v.string()),
    bio: v.optional(v.string()),
    district: v.optional(v.string()),
    phone: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    skills: v.optional(v.array(v.string())),
    availability: v.optional(v.string()),
    age: v.optional(v.number()),
    education: v.optional(v.string()),
    experience: v.optional(v.string()),
    // org fields
    orgLogo: v.optional(v.string()),
    website: v.optional(v.string()),
    socialTwitter: v.optional(v.string()),
    socialLinkedin: v.optional(v.string()),
    socialInstagram: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not signed in");

    const patch: Record<string, unknown> = {};
    if (args.accountType !== undefined) patch.accountType = args.accountType;
    if (args.name !== undefined) patch.name = args.name;
    if (args.orgName !== undefined) patch.orgName = args.orgName;
    if (args.bio !== undefined) patch.bio = args.bio;
    if (args.district !== undefined) patch.district = args.district;
    if (args.phone !== undefined) patch.phone = args.phone;
    if (args.interests !== undefined) patch.interests = args.interests;
    if (args.skills !== undefined) patch.skills = args.skills;
    if (args.availability !== undefined) patch.availability = args.availability;
    if (args.age !== undefined) patch.age = Math.max(0, Math.floor(args.age));
    if (args.education !== undefined) patch.education = args.education;
    if (args.experience !== undefined) patch.experience = args.experience;
    if (args.orgLogo !== undefined) patch.orgLogo = args.orgLogo;
    if (args.website !== undefined) patch.website = args.website;
    if (args.socialTwitter !== undefined) patch.socialTwitter = args.socialTwitter;
    if (args.socialLinkedin !== undefined) patch.socialLinkedin = args.socialLinkedin;
    if (args.socialInstagram !== undefined) patch.socialInstagram = args.socialInstagram;

    await ctx.db.patch(user._id, patch);
    return user._id;
  },
});

/** Internal helper: build a public profile object for a user id. */
export async function publicProfileFor(ctx: QueryCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user) return null;
  return {
    _id: user._id,
    name: user.name ?? null,
    image: user.image ?? null,
    orgName: user.orgName ?? null,
    bio: user.bio ?? null,
    district: user.district ?? null,
    interests: user.interests ?? [],
    skills: user.skills ?? [],
    availability: user.availability ?? null,
    age: user.age ?? null,
    education: user.education ?? null,
    experience: user.experience ?? null,
    accountType: user.accountType ?? null,
  } as const;
}

/** Fetch a user's public profile by id. */
export const getPublicProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => publicProfileFor(ctx, userId),
});

/** List all users running organization accounts (for a partners section). */
export const listOrganizations = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users
      .filter((u) => u.accountType === ACCOUNT_TYPES.ORGANIZATION)
      .map((u) => ({
        _id: u._id,
        name: u.name ?? null,
        orgName: u.orgName ?? u.name ?? "Organization",
        district: u.district ?? null,
        bio: u.bio ?? null,
        logo: u.orgLogo ?? null,
        verification: u.verification ?? "none",
      }));
  },
});

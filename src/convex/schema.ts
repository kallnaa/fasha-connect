import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

// Fasha account types: volunteers browse & apply, organizations post opportunities
export const ACCOUNT_TYPES = {
  VOLUNTEER: "volunteer",
  ORGANIZATION: "organization",
} as const;

export const accountTypeValidator = v.union(
  v.literal(ACCOUNT_TYPES.VOLUNTEER),
  v.literal(ACCOUNT_TYPES.ORGANIZATION),
);
export type AccountType = Infer<typeof accountTypeValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove

      // Fasha volunteer profile
      accountType: v.optional(accountTypeValidator),
      orgName: v.optional(v.string()),
      bio: v.optional(v.string()),
      district: v.optional(v.string()),
      phone: v.optional(v.string()),
      interests: v.optional(v.array(v.string())),
      skills: v.optional(v.array(v.string())),
      availability: v.optional(v.string()),
      isSeeded: v.optional(v.boolean()),
    }).index("email", ["email"]), // index for the email. do not remove or modify

    opportunities: defineTable({
      orgId: v.id("users"),
      orgName: v.string(),
      title: v.string(),
      description: v.string(),
      category: v.string(),
      district: v.string(),
      commitment: v.string(),
      skills: v.array(v.string()),
      slots: v.number(),
      slotsFilled: v.number(),
      status: v.union(
        v.literal("open"),
        v.literal("closed"),
        v.literal("filled"),
      ),
      featured: v.boolean(),
      createdAt: v.number(),
    })
      .index("by_org", ["orgId"])
      .index("by_status", ["status"]),

    applications: defineTable({
      opportunityId: v.id("opportunities"),
      volunteerId: v.id("users"),
      orgId: v.id("users"),
      message: v.optional(v.string()),
      status: v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("declined"),
      ),
      createdAt: v.number(),
      decidedAt: v.optional(v.number()),
    })
      .index("by_opportunity", ["opportunityId"])
      .index("by_volunteer", ["volunteerId"])
      .index("by_volunteer_opportunity", ["volunteerId", "opportunityId"]),

    notifications: defineTable({
      userId: v.id("users"),
      title: v.string(),
      body: v.string(),
      kind: v.string(), // "application" | "status" | "info"
      read: v.boolean(),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;

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

// Verified Organization badge states
export const verificationValidator = v.union(
  v.literal("none"),
  v.literal("pending"),
  v.literal("verified"),
);

// Org-side applicant pipeline
export const stageValidator = v.union(
  v.literal("new"),
  v.literal("reviewing"),
  v.literal("shortlisted"),
  v.literal("accepted"),
  v.literal("rejected"),
);
export type Stage = Infer<typeof stageValidator>;

// Structured eligibility criteria attached to an opportunity
export const eligibilityValidator = v.object({
  minAge: v.optional(v.number()),
  maxAge: v.optional(v.number()),
  education: v.optional(v.string()), // minimum education level
  experience: v.optional(v.string()), // minimum experience level
  districts: v.optional(v.array(v.string())),
  skills: v.optional(v.array(v.string())),
});

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

      // Fasha profile (shared)
      accountType: v.optional(accountTypeValidator),
      bio: v.optional(v.string()),
      district: v.optional(v.string()),
      phone: v.optional(v.string()),

      // Volunteer profile
      orgName: v.optional(v.string()),
      interests: v.optional(v.array(v.string())),
      skills: v.optional(v.array(v.string())),
      availability: v.optional(v.string()),
      age: v.optional(v.number()),
      education: v.optional(v.string()),
      experience: v.optional(v.string()),
      savedOpportunities: v.optional(v.array(v.id("opportunities"))),

      // Organization profile
      orgLogo: v.optional(v.string()), // image URL
      website: v.optional(v.string()),
      socialTwitter: v.optional(v.string()),
      socialLinkedin: v.optional(v.string()),
      socialInstagram: v.optional(v.string()),
      verification: v.optional(verificationValidator),
      verifiedAt: v.optional(v.number()),

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

      // Rich posting details (org experience)
      type: v.optional(v.string()), // Volunteer | Internship | Fellowship | Event Support
      targetAudience: v.optional(v.string()),
      deadline: v.optional(v.number()), // application deadline (ms)
      benefits: v.optional(v.string()),
      requirements: v.optional(v.string()),
      applicationLink: v.optional(v.string()), // external apply URL
      eligibility: v.optional(eligibilityValidator),

      // Org-side lifecycle & analytics
      isPaused: v.optional(v.boolean()),
      views: v.optional(v.number()),
      saves: v.optional(v.number()),
      linkClicks: v.optional(v.number()),
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

      // Org pipeline (New → Reviewing → Shortlisted → Accepted/Rejected)
      stage: v.optional(stageValidator),
      stageUpdatedAt: v.optional(v.number()),

      // Additional information / document requests
      infoRequest: v.optional(v.string()),
      infoRequestedAt: v.optional(v.number()),
      infoResponse: v.optional(v.string()),
      infoRespondedAt: v.optional(v.number()),
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

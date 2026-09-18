import { internalMutation } from "./_generated/server";

/** User/auth tables managed by Convex Auth (kept in sync with authTables). */
const AUTH_TABLES = [
  "authSessions",
  "authAccounts",
  "authRefreshTokens",
  "authVerificationCodes",
  "authVerifiers",
  "authRateLimits",
] as const;

/** Tables whose rows reference a user id and must be cleared with it. */
const APP_TABLES = [
  "applications",
  "notifications",
  "messages",
  "conversations",
] as const;

/**
 * Wipe all user data for fresh signup testing.
 * - Clears every auth/session table (all tokens become invalid)
 * - Clears user-generated data (applications, notifications, conversations)
 * - Deletes real (non-seeded) users — volunteers and org accounts alike
 * - KEEPS the seeded demo org accounts (isSeeded: true) so the default
 *   program listings keep a valid owner, plus the opportunities themselves
 */
export const wipeAllUserData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const counts: Record<string, number> = {};

    for (const table of AUTH_TABLES) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) await ctx.db.delete(row._id);
      counts[table] = rows.length;
    }

    for (const table of APP_TABLES) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) await ctx.db.delete(row._id);
      counts[table] = rows.length;
    }

    const users = await ctx.db.query("users").collect();
    let keptSeeded = 0;
    for (const user of users) {
      if (user.isSeeded) {
        keptSeeded++;
        continue;
      }
      await ctx.db.delete(user._id);
    }
    counts["usersDeleted"] = users.length - keptSeeded;
    counts["seededOrgsKept"] = keptSeeded;

    return counts;
  },
});

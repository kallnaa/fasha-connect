import { query } from "./_generated/server";

/**
 * Public auth configuration flags for the client. Safe to expose — only
 * booleans, never secret values. Used by the auth page to decide whether to
 * render the "Continue with Google" button (it errors with 401 invalid_client
 * when the OAuth credentials are missing from the deployment's env vars).
 */
export const authConfig = query({
  args: {},
  handler: async () => ({
    googleEnabled: Boolean(
      process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
    ),
  }),
});

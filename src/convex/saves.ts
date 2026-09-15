import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

/** Toggle a saved opportunity for the signed-in volunteer. */
export const toggleSave = mutation({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, { opportunityId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Sign in to save");

    const saved = user.savedOpportunities ?? [];
    const opp = await ctx.db.get(opportunityId);
    if (!opp) throw new Error("Opportunity not found");

    if (saved.includes(opportunityId)) {
      await ctx.db.patch(user._id, {
        savedOpportunities: saved.filter((id) => id !== opportunityId),
      });
      await ctx.db.patch(opportunityId, {
        saves: Math.max(0, (opp.saves ?? 0) - 1),
      });
      return "removed";
    } else {
      await ctx.db.patch(user._id, {
        savedOpportunities: [...saved, opportunityId],
      });
      await ctx.db.patch(opportunityId, {
        saves: (opp.saves ?? 0) + 1,
      });
      return "saved";
    }
  },
});

import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { getCurrentUser } from "./users";
import type { Id } from "./_generated/dataModel";

/** Get (or create) the single conversation for a volunteer + opportunity pair.
 *  Index `by_opportunity_volunteer` makes duplicates impossible. */
export async function ensureConversation(
  ctx: MutationCtx,
  args: { opportunityId: Id<"opportunities">; volunteerId: Id<"users">; orgId: Id<"users"> },
): Promise<Id<"conversations">> {
  const existing = await ctx.db
    .query("conversations")
    .withIndex("by_opportunity_volunteer", (q) =>
      q.eq("opportunityId", args.opportunityId).eq("volunteerId", args.volunteerId),
    )
    .first();
  if (existing) return existing._id;

  const now = Date.now();
  return ctx.db.insert("conversations", {
    opportunityId: args.opportunityId,
    volunteerId: args.volunteerId,
    orgId: args.orgId,
    locked: false,
    volunteerUnread: 0,
    orgUnread: 0,
    createdAt: now,
  });
}

/** Keep the conversation lock in sync with the application status. */
export async function syncConversationLock(
  ctx: MutationCtx,
  application: {
    opportunityId: Id<"opportunities">;
    volunteerId: Id<"users">;
    orgId: Id<"users">;
    status: string;
  },
) {
  const conv = await ctx.db
    .query("conversations")
    .withIndex("by_opportunity_volunteer", (q) =>
      q
        .eq("opportunityId", application.opportunityId)
        .eq("volunteerId", application.volunteerId),
    )
    .first();
  if (!conv) return;
  const shouldLock = application.status !== "accepted";
  if (!!conv.locked !== shouldLock) {
    await ctx.db.patch(conv._id, {
      locked: shouldLock || undefined,
      lockReason: shouldLock
        ? application.status === "declined"
          ? "This application is no longer active, so the conversation is read-only."
          : "This application was withdrawn, so the conversation is read-only."
        : undefined,
    });
  }
}

/** Load a conversation and verify the caller is a participant. */
async function authorizedConversation(ctx: QueryCtx, conversationId: Id<"conversations">) {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error("Sign in to use messages");
  const conv = await ctx.db.get(conversationId);
  if (!conv) throw new Error("Conversation not found");
  const isVolunteer = conv.volunteerId === user._id;
  const isOrg = conv.orgId === user._id;
  if (!isVolunteer && !isOrg) throw new Error("You are not part of this conversation");
  return { user, conv, role: isVolunteer ? ("volunteer" as const) : ("organization" as const) };
}

/* ------------------------------ Queries ------------------------------ */

/** Org's opportunities that have accepted volunteers — announcement targets. */
export const announcementTargets = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.accountType !== "organization") return [];
    const opps = await ctx.db
      .query("opportunities")
      .withIndex("by_org", (q) => q.eq("orgId", user._id))
      .collect();
    const targets = [];
    for (const opp of opps) {
      const apps = await ctx.db
        .query("applications")
        .withIndex("by_opportunity", (q) => q.eq("opportunityId", opp._id))
        .collect();
      const accepted = apps.filter((a) => a.status === "accepted").length;
      if (accepted > 0) {
        targets.push({ _id: opp._id, title: opp.title, accepted });
      }
    }
    return targets.sort((a, b) => b.accepted - a.accepted);
  },
});

/** All conversations for the signed-in user (volunteer or org), newest activity first. */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const isOrg = user.accountType === "organization";

    const rows = isOrg
      ? await ctx.db.query("conversations").withIndex("by_org", (q) => q.eq("orgId", user._id)).collect()
      : await ctx.db
          .query("conversations")
          .withIndex("by_volunteer", (q) => q.eq("volunteerId", user._id))
          .collect();

    const shaped = await Promise.all(
      rows.map(async (conv) => {
        const opp = await ctx.db.get(conv.opportunityId);
        const otherId = isOrg ? conv.volunteerId : conv.orgId;
        const other = await ctx.db.get(otherId);
        const unread = isOrg ? (conv.orgUnread ?? 0) : (conv.volunteerUnread ?? 0);
        return {
          _id: conv._id,
          opportunityTitle: opp?.title ?? "Opportunity removed",
          opportunityId: conv.opportunityId,
          otherName: isOrg
            ? (other?.name ?? "Volunteer")
            : (other?.orgName ?? other?.name ?? "Organization"),
          otherVerified: isOrg ? undefined : (other?.verification ?? undefined),
          locked: conv.locked ?? false,
          lockReason: conv.lockReason ?? null,
          unread,
          lastMessageAt: conv.lastMessageAt ?? conv.createdAt,
          lastMessagePreview: conv.lastMessagePreview ?? "No messages yet",
          createdAt: conv.createdAt,
        };
      }),
    );

    shaped.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    return shaped;
  },
});

/** Unread message total for the bell badge. */
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return 0;
    const isOrg = user.accountType === "organization";
    const rows = isOrg
      ? await ctx.db.query("conversations").withIndex("by_org", (q) => q.eq("orgId", user._id)).collect()
      : await ctx.db
          .query("conversations")
          .withIndex("by_volunteer", (q) => q.eq("volunteerId", user._id))
          .collect();
    return rows.reduce((sum, c) => sum + (isOrg ? (c.orgUnread ?? 0) : (c.volunteerUnread ?? 0)), 0);
  },
});

/** Message thread for one conversation (participants only). */
export const thread = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const { conv, role } = await authorizedConversation(ctx, conversationId);
    const isOrg = role === "organization";

    const opp = await ctx.db.get(conv.opportunityId);
    const otherId = isOrg ? conv.volunteerId : conv.orgId;
    const other = await ctx.db.get(otherId);

    const rows = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();
    rows.sort((a, b) => a.createdAt - b.createdAt);

    return {
      _id: conv._id,
      role,
      locked: conv.locked ?? false,
      lockReason: conv.lockReason ?? null,
      opportunity: opp
        ? { _id: opp._id, title: opp.title, category: opp.category, district: opp.district }
        : null,
      other: {
        name: isOrg ? (other?.name ?? "Volunteer") : (other?.orgName ?? other?.name ?? "Organization"),
        verified: isOrg ? undefined : (other?.verification ?? undefined),
        image: other?.image ?? undefined,
      },
      messages: rows.map((m) => ({
        _id: m._id,
        body: m.body,
        kind: m.kind,
        senderId: m.senderId,
        mine: m.senderId === conv[role === "organization" ? "orgId" : "volunteerId"],
        senderRole: m.senderRole,
        createdAt: m.createdAt,
      })),
    };
  },
});

/* ----------------------------- Mutations ----------------------------- */

/** Send a direct message in a conversation (volunteer or org participant). */
export const send = mutation({
  args: { conversationId: v.id("conversations"), body: v.string() },
  handler: async (ctx, { conversationId, body }) => {
    const text = body.trim();
    if (!text) throw new Error("Message cannot be empty");
    if (text.length > 4000) throw new Error("Message is too long (max 4000 characters)");

    const { user, conv, role } = await authorizedConversation(ctx, conversationId);
    if (conv.locked) throw new Error("This conversation is read-only");

    const now = Date.now();
    await ctx.db.insert("messages", {
      conversationId,
      senderId: user._id,
      senderName: user.name ?? undefined,
      senderRole: role,
      body: text,
      kind: "direct",
      createdAt: now,
    });

    // bump the other side's unread counter + conversation preview
    const myId = role === "organization" ? conv.orgId : conv.volunteerId;
    const patch =
      role === "organization"
        ? {
            volunteerUnread: (conv.volunteerUnread ?? 0) + 1,
            lastMessageAt: now,
            lastMessagePreview: text.slice(0, 80),
          }
        : {
            orgUnread: (conv.orgUnread ?? 0) + 1,
            lastMessageAt: now,
            lastMessagePreview: text.slice(0, 80),
          };
    void myId;
    await ctx.db.patch(conversationId, patch);

    // notify the recipient
    const recipientId = role === "organization" ? conv.volunteerId : conv.orgId;
    const opp = await ctx.db.get(conv.opportunityId);
    await ctx.db.insert("notifications", {
      userId: recipientId,
      title: role === "organization" ? "New message" : "Reply from a volunteer",
      body: `${user.name ?? (role === "organization" ? "An organization" : "A volunteer")} messaged you about "${opp?.title ?? "an opportunity"}": ${text.slice(0, 100)}`,
      kind: "message",
      link: `/messages?c=${conversationId}`,
      read: false,
      createdAt: now,
    });

    return conversationId;
  },
});

/** Org announcement to ALL accepted volunteers of one opportunity.
 *  Conversations are created on demand (one per volunteer + org + opportunity). */
export const announce = mutation({
  args: { opportunityId: v.id("opportunities"), body: v.string() },
  handler: async (ctx, { opportunityId, body }) => {
    const text = body.trim();
    if (!text) throw new Error("Announcement cannot be empty");
    if (text.length > 4000) throw new Error("Announcement is too long (max 4000 characters)");

    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Sign in to send announcements");

    const opp = await ctx.db.get(opportunityId);
    if (!opp) throw new Error("Opportunity not found");
    if (opp.orgId !== user._id) throw new Error("You can only message volunteers on your own opportunities");

    const accepted = (
      await ctx.db
        .query("applications")
        .withIndex("by_opportunity", (q) => q.eq("opportunityId", opportunityId))
        .collect()
    ).filter((a) => a.status === "accepted");

    if (accepted.length === 0) {
      throw new Error("No accepted volunteers yet for this opportunity");
    }

    const now = Date.now();
    let sent = 0;
    for (const app of accepted) {
      const conversationId = await ensureConversation(ctx, {
        opportunityId,
        volunteerId: app.volunteerId,
        orgId: user._id,
      });
      const conv = await ctx.db.get(conversationId);
      if (!conv || conv.locked) continue; // skip locked (withdrawn/rejected) conversations

      await ctx.db.insert("messages", {
        conversationId,
        senderId: user._id,
        senderName: user.orgName ?? user.name ?? undefined,
        senderRole: "organization",
        body: text,
        kind: "announcement",
        createdAt: now,
      });
      await ctx.db.patch(conversationId, {
        volunteerUnread: (conv.volunteerUnread ?? 0) + 1,
        lastMessageAt: now,
        lastMessagePreview: `📣 ${text.slice(0, 76)}`,
      });
      await ctx.db.insert("notifications", {
        userId: app.volunteerId,
        title: "Announcement",
        body: `${user.orgName ?? user.name ?? "Your organization"} announced something for "${opp.title}": ${text.slice(0, 100)}`,
        kind: "announcement",
        link: `/messages?c=${conversationId}`,
        read: false,
        createdAt: now,
      });
      sent++;
    }
    return sent;
  },
});

/** Mark a conversation as read for the signed-in participant. */
export const markRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const { conv, role } = await authorizedConversation(ctx, conversationId);
    const field = role === "organization" ? "orgUnread" : "volunteerUnread";
    if ((conv[field] ?? 0) !== 0) {
      await ctx.db.patch(conversationId, { [field]: 0 });
    }
  },
});

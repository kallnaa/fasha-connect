import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  CalendarDays,
  Lock,
  MapPin,
  Megaphone,
  MessageSquare,
  Send,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { AppShell, initials, timeAgo } from "@/components/AppShell";
import { categoryColor, ClayButton, ClayCard, ClayChip } from "@/components/clay";
import { cn } from "@/lib/utils";

type Conversation = {
  _id: string;
  opportunityTitle: string;
  opportunityId: string;
  otherName: string;
  otherVerified?: string;
  locked: boolean;
  lockReason: string | null;
  unread: number;
  lastMessageAt: number;
  lastMessagePreview: string;
  createdAt: number;
};

type Thread = {
  _id: string;
  role: "volunteer" | "organization";
  locked: boolean;
  lockReason: string | null;
  opportunity: { _id: string; title: string; category: string; district: string } | null;
  other: { name: string; verified?: string; image?: string };
  messages: Array<{
    _id: string;
    body: string;
    kind: string;
    mine: boolean;
    senderRole: string;
    createdAt: number;
  }>;
};

/** Layout wrapper: conversation list + optional thread. `basePath` is /messages or /org/messages. */
export function MessagesLayout({ basePath, isOrg }: { basePath: string; isOrg: boolean }) {
  const [params, setParams] = useSearchParams();
  const activeId = params.get("c");
  const navigate = useNavigate();

  const conversations = useQuery(api.messages.listMine, {}) as Conversation[] | undefined;

  const open = (id: string) => setParams({ c: id }, { replace: false });
  const close = () => {
    params.delete("c");
    setParams(params, { replace: false });
    navigate(basePath, { replace: true });
  };

  const active = conversations?.find((c) => c._id === activeId) ?? null;

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Messages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isOrg
              ? "Chat with your accepted volunteers, or announce updates to everyone."
              : "Conversations are opened when your application is accepted. 🤝"}
          </p>
        </div>
        {isOrg && <AnnouncementButton />}
      </div>

      {/* Volunteer only: live application status updates */}
      {!isOrg && <ApplicationUpdates />}

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(280px,360px)_1fr]">
        {/* Conversation list */}
        <div className={cn("space-y-3", activeId && "hidden lg:block")}>
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onOpen={open}
            basePath={basePath}
          />
        </div>

        {/* Thread panel */}
        <div className={cn(!activeId && "hidden lg:block")}>
          {activeId ? (
            <ThreadPanel
              conversationId={activeId as never}
              onBack={close}
              fallbackName={active?.otherName}
            />
          ) : (
            <div className="hidden h-full lg:block">
              <EmptyThreadState />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

/* ---------------------- Volunteer application updates ---------------------- */

const STAGE_DOT: Record<string, string> = {
  new: "bg-butter",
  reviewing: "bg-sky",
  shortlisted: "bg-lilac",
  accepted: "bg-mint",
  rejected: "bg-peach",
};

const STAGE_TEXT: Record<string, string> = {
  new: "text-yellow-800",
  reviewing: "text-sky-900",
  shortlisted: "text-violet-800",
  accepted: "text-teal-800",
  rejected: "text-rose-700",
};

/** Volunteer-only strip: latest status of each application, straight from the org pipeline. */
function ApplicationUpdates() {
  const apps = useQuery(api.applications.listMine, {}) as
    | Array<{
        _id: string;
        stage: string;
        status: string;
        conversationId?: string | null;
        opportunity: { title: string; orgName: string } | null;
      }>
    | undefined;
  const navigate = useNavigate();

  if (!apps) {
    return (
      <ClayCard className="mt-6 animate-pulse p-5">
        <div className="h-4 w-40 rounded-full bg-secondary" />
        <div className="mt-3 h-3 w-2/3 rounded-full bg-secondary/70" />
      </ClayCard>
    );
  }
  if (apps.length === 0) return null;

  return (
    <ClayCard className="mt-6 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold">Application status</h2>
        <ClayChip className="bg-secondary text-xs text-muted-foreground">
          {apps.length} active
        </ClayChip>
      </div>
      <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-1">
        {apps.map((a) => (
          <div
            key={a._id}
            className="clay-shadow-inset min-w-56 shrink-0 snap-start rounded-2xl bg-secondary/50 p-3.5"
          >
            <p className="truncate text-sm font-bold">{a.opportunity?.title ?? "Opportunity"}</p>
            <p className="truncate text-xs text-muted-foreground">{a.opportunity?.orgName}</p>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${STAGE_DOT[a.stage] ?? "bg-secondary"}`} />
                <span
                  className={`text-xs font-extrabold capitalize ${
                    STAGE_TEXT[a.stage] ?? "text-muted-foreground"
                  }`}
                >
                  {a.stage}
                </span>
              </span>
              {a.status === "accepted" && a.conversationId && (
                <button
                  className="text-xs font-bold text-primary hover:underline"
                  onClick={() => navigate(`/messages?c=${a.conversationId}`)}
                >
                  Open chat →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </ClayCard>
  );
}

/* --------------------------- Conversation list --------------------------- */

function ConversationList({
  conversations,
  activeId,
  onOpen,
  basePath,
}: {
  conversations: Conversation[] | undefined;
  activeId: string | null;
  onOpen: (id: string) => void;
  basePath: string;
}) {
  if (conversations === undefined) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <ClayCard key={i} className="animate-pulse p-4">
            <div className="h-4 w-2/3 rounded-full bg-secondary" />
            <div className="mt-2 h-3 w-1/2 rounded-full bg-secondary/70" />
          </ClayCard>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <ClayCard className="p-10 text-center">
        <MessageSquare className="mx-auto size-8 text-muted-foreground/50" />
        <p className="mt-3 font-display text-lg font-bold">No conversations yet</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
          {basePath === "/org/messages"
            ? "When you accept volunteers, you can chat with them here."
            : "When an organization accepts your application, a conversation opens automatically."}
        </p>
        <ClayButton asChild size="sm" className="mt-5">
          <Link to={basePath === "/org/messages" ? "/org/opportunities" : "/opportunities"}>
            {basePath === "/org/messages" ? "Review applicants" : "Browse opportunities"}
          </Link>
        </ClayButton>
      </ClayCard>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((c) => (
        <button
          key={c._id}
          onClick={() => onOpen(c._id)}
          className={cn(
            "clay-surface block w-full rounded-3xl p-4 text-left transition-transform",
            "hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/50",
            activeId === c._id && "ring-2 ring-primary/60",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-mint text-sm font-extrabold text-teal-800">
                {initials(c.otherName)}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1 truncate font-display font-bold">
                  {c.otherName}
                  {c.otherVerified === "verified" && (
                    <BadgeCheck className="size-4 shrink-0 text-teal-700" />
                  )}
                  {c.locked && <Lock className="size-3.5 shrink-0 text-muted-foreground/60" />}
                </p>
                <p className="truncate text-xs font-semibold text-muted-foreground">
                  {c.opportunityTitle}
                </p>
              </div>
            </div>
            {c.unread > 0 && (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {c.unread > 9 ? "9+" : c.unread}
              </span>
            )}
          </div>
          <p className="mt-2 truncate text-xs text-muted-foreground">{c.lastMessagePreview}</p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
            {timeAgo(c.lastMessageAt)}
          </p>
        </button>
      ))}
    </div>
  );
}

function EmptyThreadState() {
  return (
    <ClayCard className="flex h-full min-h-64 flex-col items-center justify-center p-10 text-center">
      <MessageSquare className="size-10 text-muted-foreground/40" />
      <p className="mt-4 font-display text-lg font-bold">Pick a conversation</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Select a conversation on the left to read messages and reply.
      </p>
    </ClayCard>
  );
}

/* ------------------------------ Thread panel ------------------------------ */

function ThreadPanel({
  conversationId,
  onBack,
  fallbackName,
}: {
  conversationId: never;
  onBack: () => void;
  fallbackName?: string;
}) {
  const thread = useQuery(api.messages.thread, { conversationId }) as
    | Thread
    | null
    | undefined;
  const markRead = useMutation(api.messages.markRead);
  const send = useMutation(api.messages.send);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (thread && !thread.locked) markRead({ conversationId }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?._id, thread?.locked]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      await send({ conversationId, body });
      setDraft("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send message");
    } finally {
      setSending(false);
    }
  };

  if (loadError) {
    return (
      <ClayCard className="p-10 text-center">
        <Ban className="mx-auto size-8 text-destructive/70" />
        <p className="mt-3 font-display text-lg font-bold">Couldn't load conversation</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Something went wrong. Refresh the page and try again.
        </p>
        <ClayButton size="sm" variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Reload
        </ClayButton>
      </ClayCard>
    );
  }

  if (thread === undefined) {
    return (
      <ClayCard className="animate-pulse p-6">
        <div className="h-12 rounded-2xl bg-secondary" />
        <div className="mt-6 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn("h-10 w-2/3 rounded-2xl bg-secondary/70", i % 2 === 1 && "ml-auto")}
            />
          ))}
        </div>
      </ClayCard>
    );
  }

  if (thread === null) {
    return (
      <ClayCard className="p-10 text-center">
        <Ban className="mx-auto size-8 text-destructive/70" />
        <p className="mt-3 font-display text-lg font-bold">Conversation unavailable</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This conversation doesn't exist, or you're not part of it.
        </p>
        <ClayButton size="sm" variant="outline" className="mt-4" onClick={onBack}>
          Back to messages
        </ClayButton>
      </ClayCard>
    );
  }

  const name = thread.other.name || fallbackName || "Conversation";

  return (
    <ClayCard className="flex h-[70vh] min-h-125 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b-2 border-dashed border-border p-4">
        <button
          onClick={onBack}
          className="clay-chip flex size-9 items-center justify-center bg-secondary/80 lg:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="size-4" />
        </button>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-mint text-sm font-extrabold text-teal-800">
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate font-display font-bold">
            {name}
            {thread.other.verified === "verified" && (
              <BadgeCheck className="size-4 shrink-0 text-teal-700" />
            )}
          </p>
          {thread.opportunity && (
            <p className="flex flex-wrap items-center gap-1.5 truncate text-xs font-semibold text-muted-foreground">
              <CalendarDays className="size-3" />
              {thread.opportunity.title}
              <ClayChip className={cn("ml-1 px-2 py-0 text-[10px]", categoryColor(thread.opportunity.category))}>
                {thread.opportunity.category}
              </ClayChip>
              <ClayChip className="bg-card/80 px-2 py-0 text-[10px]">
                <MapPin className="size-2.5" /> {thread.opportunity.district}
              </ClayChip>
            </p>
          )}
        </div>
      </div>

      {/* Locked banner */}
      {thread.locked && (
        <div className="clay-shadow-inset mx-4 mt-3 flex items-start gap-2.5 rounded-2xl bg-peach/40 p-3">
          <Lock className="mt-0.5 size-4 shrink-0 text-rose-700" />
          <div>
            <p className="text-sm font-bold text-rose-800">This conversation is read-only</p>
            <p className="text-xs text-rose-800/80">
              {thread.lockReason ?? "The related application is no longer accepted."}
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {thread.messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="flex size-14 items-center justify-center rounded-3xl bg-butter">
              <MessageSquare className="size-6 text-muted-foreground" />
            </span>
            <p className="mt-3 font-display font-bold">Say muraho 👋</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              {thread.role === "organization"
                ? "Send your first message to welcome this volunteer."
                : "Send your first message to introduce yourself."}
            </p>
          </div>
        ) : (
          thread.messages.map((m) => (
            <div key={m._id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%] sm:max-w-[70%]", m.mine && "text-right")}>
                {m.kind === "announcement" && (
                  <span
                    className={cn(
                      "mb-1 inline-flex items-center gap-1 rounded-full bg-butter px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-yellow-800",
                      m.mine && "mr-1",
                    )}
                  >
                    <Megaphone className="size-3" /> Announcement
                  </span>
                )}
                <div
                  className={cn(
                    "rounded-3xl px-4 py-2.5 text-left text-sm leading-relaxed break-words",
                    m.mine
                      ? "clay-shadow-primary bg-primary text-primary-foreground"
                      : "clay-shadow-inset bg-secondary/70 text-foreground",
                  )}
                >
                  {m.body}
                </div>
                <p className="mt-1 px-1 text-[10px] font-medium text-muted-foreground/70">
                  {timeAgo(m.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      {thread.locked ? (
        <div className="clay-shadow-inset m-4 rounded-2xl bg-secondary/50 p-3 text-center text-xs font-semibold text-muted-foreground">
          Sending is disabled — messages stay visible for reference.
        </div>
      ) : (
        <div className="border-t-2 border-dashed border-border p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Write a message…"
              rows={1}
              maxLength={4000}
              className="clay-input max-h-32 min-h-11 flex-1 resize-none rounded-2xl px-4 py-3 text-sm outline-none"
            />
            <ClayButton size="icon" onClick={handleSend} disabled={sending || !draft.trim()} aria-label="Send message">
              <Send className="size-4" />
            </ClayButton>
          </div>
        </div>
      )}
    </ClayCard>
  );
}

/* --------------------------- Announcement dialog --------------------------- */

function AnnouncementButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ClayButton onClick={() => setOpen(true)}>
        <Megaphone className="size-4" /> New announcement
      </ClayButton>
      {open && <AnnouncementDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function AnnouncementDialog({ onClose }: { onClose: () => void }) {
  const targets = useQuery(api.messages.announcementTargets, {}) as
    | Array<{ _id: string; title: string; accepted: number }>
    | undefined;
  const announce = useMutation(api.messages.announce);
  const [target, setTarget] = useState<string>("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!target || !body.trim()) return;
    setSending(true);
    try {
      const count = await announce({ opportunityId: target as never, body });
      toast.success(`Announcement sent to ${count} volunteer${count === 1 ? "" : "s"} 📣`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send announcement");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <ClayCard className="w-full max-w-lg p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-butter">
            <Megaphone className="size-5 text-rose-600" />
          </span>
          <div>
            <h2 className="font-display text-xl font-extrabold">Announce to volunteers</h2>
            <p className="text-xs text-muted-foreground">
              Delivered to every accepted volunteer's conversation.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Opportunity
          </label>
          {targets === undefined ? (
            <div className="clay-shadow-inset mt-2 h-11 animate-pulse rounded-2xl bg-secondary/60" />
          ) : targets.length === 0 ? (
            <div className="clay-shadow-inset mt-2 rounded-2xl bg-secondary/50 p-3 text-sm text-muted-foreground">
              No accepted volunteers yet — accept applications first.
            </div>
          ) : (
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="clay-input mt-2 w-full rounded-2xl px-3 py-2.5 text-sm font-semibold outline-none"
            >
              <option value="">Choose an opportunity…</option>
              {targets.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title} · {t.accepted} accepted
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mt-4">
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Message
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={4000}
            placeholder="e.g. Orientation starts Saturday 9:00 at the community center — bring a water bottle!"
            className="clay-input mt-2 w-full resize-none rounded-2xl px-3 py-2.5 text-sm outline-none"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <ClayButton variant="outline" onClick={onClose}>
            Cancel
          </ClayButton>
          <ClayButton onClick={send} disabled={sending || !target || !body.trim()}>
            <Send className="size-4" />
            {sending ? "Sending…" : "Send announcement"}
          </ClayButton>
        </div>
      </ClayCard>
    </div>
  );
}

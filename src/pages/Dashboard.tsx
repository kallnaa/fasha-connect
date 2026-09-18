import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock3,
  HandHeart,
  Inbox,
  MapPin,
  MessageCircleQuestion,
  MessagesSquare,
  Search,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { AppShell, initials, timeAgo } from "@/components/AppShell";
import {
  categoryColor,
  ClayButton,
  ClayCard,
  ClayChip,
  StageChip,
} from "@/components/clay";
import { useAuth } from "@/hooks/use-auth";

type Opp = {
  _id: string;
  title: string;
  orgName: string;
  description: string;
  category: string;
  district: string;
  commitment: string;
  skills: string[];
  slots: number;
  slotsFilled: number;
  type: string;
  deadline: number | null;
  score: number;
  matchReasons: string[];
};

type AppRow = {
  _id: string;
  status: string;
  stage: string;
  createdAt: number;
  infoRequest: string | null;
  infoResponse: string | null;
  conversationId?: string | null;
  opportunity: {
    _id: string;
    title: string;
    orgName: string;
    category: string;
    district: string;
    commitment: string;
  } | null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  // Organizations get their own console — keep the two experiences separate
  const isOrg = user?.accountType === "organization";

  // hooks must run unconditionally; orgs are redirected during render below
  const stats = useQuery(api.stats.myStats, {});
  const recommendations = (useQuery(api.recommendations.recommend, {}) as Opp[] | undefined) ?? [];
  const myApps = (useQuery(api.applications.listMine, {}) as AppRow[] | undefined) ?? [];
  const withdraw = useMutation(api.applications.withdraw);
  const respondInfo = useMutation(api.applications.respondInfo);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const handleWithdraw = async (id: string) => {
    setWithdrawing(id);
    try {
      await withdraw({ applicationId: id as never });
      toast.success("Application withdrawn");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not withdraw");
    } finally {
      setWithdrawing(null);
    }
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return;
    try {
      await respondInfo({ applicationId: id as never, response: replyText });
      toast.success("Response sent to the organization");
      setReplyTo(null);
      setReplyText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send response");
    }
  };

  // org accounts are redirected to the org console (hooks ran above)
  if (isOrg) return <Navigate to="/org" replace />;

  return (
    <AppShell>
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <span className="clay-shadow-primary flex size-14 items-center justify-center rounded-3xl bg-primary font-display text-xl font-extrabold text-primary-foreground">
            {initials(user?.name)}
          </span>
          <div>
            <p className="text-sm font-semibold text-muted-foreground">
              {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">
              Muraho{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
            </h1>
          </div>
        </div>
        <ClayButton asChild size="sm">
          <Link to="/opportunities">
            <Search /> Browse opportunities
          </Link>
        </ClayButton>
      </motion.div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Applications",
            value: stats?.myApplications ?? 0,
            icon: HandHeart,
            color: "bg-peach/70",
          },
          {
            label: "In progress",
            value: stats?.pending ?? 0,
            icon: Clock3,
            color: "bg-butter/70",
          },
          {
            label: "Accepted",
            value: stats?.accepted ?? 0,
            icon: UserPlus,
            color: "bg-mint/70",
          },
          {
            label: "Matches",
            value: recommendations.length,
            icon: Sparkles,
            color: "bg-sky/70",
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 * i }}
          >
            <ClayCard className="p-4">
              <span className={`flex size-9 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="size-5 text-foreground/70" />
              </span>
              <p className="mt-3 font-display text-2xl font-extrabold">{s.value}</p>
              <p className="text-xs font-semibold text-muted-foreground">{s.label}</p>
            </ClayCard>
          </motion.div>
        ))}
      </div>

      {/* Recommendations */}
      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <ClayChip className="bg-rose-50 text-rose-700">
              <Sparkles className="size-3.5" /> Recommended for you
            </ClayChip>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight">
              Programs matched to your profile
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Based on your interests, skills, district, availability and each
              posting's eligibility.{" "}
              <Link to="/profile" className="font-bold text-primary hover:underline">
                Tune your profile →
              </Link>
            </p>
          </div>
        </div>

        {recommendations.length === 0 ? (
          <ClayCard className="mt-5 p-10 text-center">
            <Sparkles className="mx-auto size-8 text-muted-foreground/50" />
            <p className="mt-3 font-display text-lg font-bold">No matches yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Add interests and skills to your profile so Fasha can recommend
              programs for you.
            </p>
            <ClayButton asChild className="mt-5">
              <Link to="/profile">Set up my profile</Link>
            </ClayButton>
          </ClayCard>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {recommendations.map((opp, i) => (
              <motion.div
                key={opp._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
              >
                <RecommendationCard opp={opp} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* My applications */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">
          My applications
        </h2>
        {myApps.length === 0 ? (
          <ClayCard className="mt-5 p-10 text-center">
            <Inbox className="mx-auto size-8 text-muted-foreground/50" />
            <p className="mt-3 font-display text-lg font-bold">Nothing here yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              When you apply to an opportunity, you can track its status right
              here.
            </p>
            <ClayButton asChild className="mt-5">
              <Link to="/opportunities">
                Find opportunities <ArrowRight />
              </Link>
            </ClayButton>
          </ClayCard>
        ) : (
          <div className="mt-5 space-y-3">
            {myApps.map((app) => (
              <ClayCard key={app._id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StageChip stage={app.stage} />
                      <span className="text-xs font-semibold text-muted-foreground">
                        applied {timeAgo(app.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 font-display text-lg leading-snug font-bold">
                      {app.opportunity?.title ?? "Opportunity removed"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {app.opportunity?.orgName}
                      {app.opportunity?.district ? ` · ${app.opportunity.district}` : ""}
                      {app.opportunity?.commitment ? ` · ${app.opportunity.commitment}` : ""}
                    </p>
                  </div>                  <div className="flex flex-wrap justify-end gap-2">
                    {app.stage === "new" && app.opportunity && (
                      <ClayButton
                        variant="outline"
                        size="sm"
                        disabled={withdrawing === app._id}
                        onClick={() => handleWithdraw(app._id)}
                      >
                        Withdraw
                      </ClayButton>
                    )}
                    {app.status === "accepted" && app.opportunity && (
                      <ClayButton
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/messages?c=${app.conversationId}`)}
                      >
                        <MessagesSquare className="size-4" /> Message
                      </ClayButton>
                    )}
                  </div>
                </div>

                {/* Info request / response thread */}
                {(app.infoRequest || replyTo === app._id) && (
                  <div className="clay-shadow-inset mt-3 rounded-2xl bg-secondary/50 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      <MessageCircleQuestion className="size-3.5" /> Organization asked for more info
                    </p>
                    {app.infoRequest && (
                      <p className="mt-1.5 text-sm italic text-foreground/80">“{app.infoRequest}”</p>
                    )}
                    {app.infoResponse ? (
                      <p className="mt-2 rounded-xl bg-card/80 px-3 py-2 text-sm">
                        <b>You:</b> {app.infoResponse}
                      </p>
                    ) : replyTo === app._id ? (
                      <div className="mt-2">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Answer here, or paste a link to your document…"
                          className="clay-input min-h-20 w-full rounded-2xl px-3 py-2 text-sm outline-none"
                        />
                        <div className="mt-2 flex gap-2">
                          <ClayButton size="sm" onClick={() => handleReply(app._id)}>
                            Send response
                          </ClayButton>
                          <ClayButton size="sm" variant="outline" onClick={() => setReplyTo(null)}>
                            Cancel
                          </ClayButton>
                        </div>
                      </div>
                    ) : (
                      <ClayButton
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                          setReplyTo(app._id);
                          setReplyText("");
                        }}
                      >
                        Respond
                      </ClayButton>
                    )}
                  </div>
                )}
              </ClayCard>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function RecommendationCard({ opp }: { opp: Opp }) {
  const navigate = useNavigate();
  return (
    <ClayCard interactive className="flex h-full flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <ClayChip className={categoryColor(opp.category)}>{opp.category}</ClayChip>
        <ClayChip className="bg-card/80">
          <MapPin className="size-3" /> {opp.district}
        </ClayChip>
      </div>
      <h3 className="mt-3 font-display text-lg leading-snug font-bold">{opp.title}</h3>
      <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{opp.orgName}</p>
      {opp.matchReasons.length > 0 && (
        <div className="clay-shadow-inset mt-3 rounded-2xl bg-secondary/60 p-3">
          {opp.matchReasons.map((r) => (
            <p key={r} className="flex items-start gap-1.5 text-xs font-semibold text-foreground/80">
              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {r}
            </p>
          ))}
        </div>
      )}
      <p className="mt-3 line-clamp-2 flex-1 text-sm text-muted-foreground">{opp.description}</p>
      <div className="mt-4 flex items-center justify-between border-t-2 border-dashed border-border pt-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Users className="size-3.5" /> {opp.slots - opp.slotsFilled} left · {opp.commitment}
        </span>
        <ClayButton size="sm" onClick={() => navigate("/opportunities")}>
          View <ArrowRight />
        </ClayButton>
      </div>
    </ClayCard>
  );
}

import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  ClipboardList,
  Eye,
  Inbox,
  MousePointerClick,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router";

import { api } from "@/convex/_generated/api";
import { AppShell, initials, timeAgo } from "@/components/AppShell";
import { categoryColor, ClayButton, ClayCard, ClayChip, StatusChip } from "@/components/clay";
import { useAuth } from "@/hooks/use-auth";

type Opp = {
  _id: string;
  title: string;
  status: string;
  isPaused?: boolean;
  district: string;
  category: string;
  slots: number;
  slotsFilled: number;
  views?: number;
  saves?: number;
  linkClicks?: number;
  createdAt: number;
};

type ApplicantRow = {
  _id: string;
  stage: string;
  createdAt: number;
  matchScore: number;
  volunteer: { name: string | null } | null;
  opportunityTitle?: string;
};

export default function OrgDashboard() {
  const { user } = useAuth();
  const stats = useQuery(api.orgs.orgStats, {});
  const mine = (useQuery(api.opportunities.listMine, {}) as Opp[] | undefined) ?? [];
  const analytics = (useQuery(api.orgs.opportunityAnalytics, {}) as Array<Opp & { applications: number }> | undefined) ?? [];

  const active = mine.filter((o) => o.status === "open" && !o.isPaused);

  // newest applications across all postings (from analytics ids)
  const applicationsByOpp: ApplicantRow[] = [];
  void analytics;
  void applicationsByOpp;

  const isVerified = user?.verification === "verified";

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
          <span className="flex size-14 items-center justify-center rounded-3xl bg-sky/70 shadow-inner">
            {user?.orgLogo ? (
              <img src={user.orgLogo} alt="" className="size-14 rounded-3xl object-cover" />
            ) : (
              <span className="font-display text-xl font-extrabold text-[#1e3a52]">
                {initials(user?.orgName ?? user?.name)}
              </span>
            )}
          </span>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              Organization console
              {isVerified && (
                <span className="flex items-center gap-1 rounded-full bg-mint/60 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#22503a]">
                  <BadgeCheck className="size-3" /> Verified
                </span>
              )}
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">
              {user?.orgName ?? "Your organization"} 👋
            </h1>
          </div>
        </div>
        <ClayButton asChild size="sm">
          <Link to="/org/post">
            <Plus /> Post opportunity
          </Link>
        </ClayButton>
      </motion.div>

      {/* Verification banner */}
      {!isVerified && (
        <ClayCard className="mt-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-butter/70 shadow-inner">
                <ShieldCheck className="size-5 text-[#6b4e12]" />
              </span>
              <div>
                <p className="font-display font-bold">Earn the Verified Organization badge</p>
                <p className="text-sm text-muted-foreground">
                  Verified orgs get a badge on every posting and more volunteer trust.
                </p>
              </div>
            </div>
            <ClayButton asChild variant="outline" size="sm">
              <Link to="/org/profile">Request verification</Link>
            </ClayButton>
          </div>
        </ClayCard>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Active opportunities",
            value: stats?.activeOpportunities ?? 0,
            icon: Briefcase,
            color: "bg-mint/70",
          },
          {
            label: "Total applications",
            value: stats?.totalApplications ?? 0,
            icon: ClipboardList,
            color: "bg-sky/70",
          },
          {
            label: "Needing review",
            value: stats?.needingReview ?? 0,
            icon: Inbox,
            color: "bg-butter/70",
          },
          {
            label: "Accepted",
            value: stats?.accepted ?? 0,
            icon: Users,
            color: "bg-peach/70",
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 * i }}
          >
            <ClayCard className="p-4">
              <span className={`flex size-9 items-center justify-center rounded-xl ${s.color} shadow-inner`}>
                <s.icon className="size-5 text-[#3d3327]" />
              </span>
              <p className="mt-3 font-display text-2xl font-extrabold">{s.value}</p>
              <p className="text-xs font-semibold text-muted-foreground">{s.label}</p>
            </ClayCard>
          </motion.div>
        ))}
      </div>

      {/* Quick analytics strip */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        {[
          { label: "Views", value: stats?.totalViews ?? 0, icon: Eye },
          { label: "Saves", value: stats?.totalSaves ?? 0, icon: BadgeCheck },
          { label: "Link clicks", value: stats?.totalLinkClicks ?? 0, icon: MousePointerClick },
        ].map((s) => (
          <ClayCard key={s.label} className="flex items-center gap-3 p-3.5">
            <s.icon className="size-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="font-display text-lg font-extrabold leading-none">{s.value}</p>
              <p className="truncate text-[11px] font-semibold text-muted-foreground">{s.label}</p>
            </div>
          </ClayCard>
        ))}
      </div>

      {/* Active opportunities */}
      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">
            Active opportunities
          </h2>
          <ClayButton asChild variant="outline" size="sm">
            <Link to="/org/opportunities">
              Manage all <ArrowRight />
            </Link>
          </ClayButton>
        </div>

        {active.length === 0 ? (
          <ClayCard className="mt-5 p-10 text-center">
            <Briefcase className="mx-auto size-8 text-muted-foreground/50" />
            <p className="mt-3 font-display text-lg font-bold">No active postings</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Post your first opportunity and volunteers across Rwanda will see
              it in their recommendations.
            </p>
            <ClayButton asChild className="mt-5">
              <Link to="/org/post">
                <Plus /> Post an opportunity
              </Link>
            </ClayButton>
          </ClayCard>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {active.slice(0, 4).map((opp, i) => {
              const row = analytics?.find((a) => a._id === opp._id);
              return (
                <motion.div
                  key={opp._id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                >
                  <ClayCard className="p-5">
                    <div className="flex items-center justify-between gap-2">
                      <StatusChip status={opp.status} />
                      <ClayChip className={categoryColor(opp.category)}>{opp.category}</ClayChip>
                    </div>
                    <h3 className="mt-3 font-display text-lg leading-snug font-bold">{opp.title}</h3>
                    <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                      {opp.district} · posted {timeAgo(opp.createdAt)}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t-2 border-dashed border-border pt-3 text-xs font-semibold text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Users className="size-3.5" /> {opp.slotsFilled}/{opp.slots} filled
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Eye className="size-3.5" /> {opp.views ?? 0}</span>
                        <span className="flex items-center gap-1"><ClipboardList className="size-3.5" /> {row?.applications ?? 0}</span>
                      </span>
                    </div>
                  </ClayCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}

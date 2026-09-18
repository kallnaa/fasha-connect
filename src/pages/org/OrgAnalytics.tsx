import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  Bookmark,
  ClipboardList,
  Eye,
  MousePointerClick,
  Percent,
} from "lucide-react";
import { Link } from "react-router";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/AppShell";
import { ClayCard, ClayChip, StatusChip } from "@/components/clay";

type Row = {
  _id: string;
  title: string;
  status: string;
  isPaused: boolean;
  views: number;
  saves: number;
  linkClicks: number;
  applications: number;
  conversion: number;
};

export default function OrgAnalytics() {
  const rows = (useQuery(api.orgs.opportunityAnalytics, {}) as Row[] | undefined) ?? [];
  const stats = useQuery(api.orgs.orgStats, {});

  const totals = {
    views: stats?.totalViews ?? 0,
    saves: stats?.totalSaves ?? 0,
    linkClicks: stats?.totalLinkClicks ?? 0,
    applications: stats?.totalApplications ?? 0,
  };

  return (
    <AppShell>
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          How volunteers find and interact with your opportunities.
        </p>
      </div>

      {/* Totals */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total views", value: totals.views, icon: Eye, color: "bg-sky/70" },
          { label: "Saves", value: totals.saves, icon: Bookmark, color: "bg-lilac/70" },
          { label: "Link clicks", value: totals.linkClicks, icon: MousePointerClick, color: "bg-butter/70" },
          { label: "Applications", value: totals.applications, icon: ClipboardList, color: "bg-mint/70" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
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

      {/* Per-opportunity table */}
      <ClayCard className="mt-6 p-4 sm:p-6">
        <h2 className="font-display text-lg font-bold">Per-opportunity breakdown</h2>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Post an opportunity to start collecting analytics.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b-2 border-dashed border-border text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-3">Opportunity</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2 pr-3 text-right">Views</th>
                  <th className="pb-2 pr-3 text-right">Saves</th>
                  <th className="pb-2 pr-3 text-right">Clicks</th>
                  <th className="pb-2 pr-3 text-right">Applies</th>
                  <th className="pb-2 text-right">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="border-b border-border/60 last:border-0">
                    <td className="max-w-52 truncate py-3 pr-3 font-bold">
                      <Link to={`/org/opportunities/${r._id}/edit`} className="hover:text-primary hover:underline">
                        {r.title}
                      </Link>
                    </td>
                    <td className="py-3 pr-3">
                      <StatusChip status={r.status} />
                    </td>
                    <td className="py-3 pr-3 text-right font-semibold">{r.views}</td>
                    <td className="py-3 pr-3 text-right font-semibold">{r.saves}</td>
                    <td className="py-3 pr-3 text-right font-semibold">{r.linkClicks}</td>
                    <td className="py-3 pr-3 text-right font-semibold">{r.applications}</td>
                    <td className="py-3 text-right">
                      <ClayChip className="bg-secondary/80">
                        <Percent className="size-3" /> {r.conversion}%
                      </ClayChip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Conversion = applications ÷ views. Views are counted when a volunteer
          opens the apply dialog; link clicks when they follow your external
          application link.
        </p>
      </ClayCard>
    </AppShell>
  );
}

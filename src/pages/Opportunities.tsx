import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  MapPin,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { DISTRICTS } from "@/lib/constants";
import { AppShell } from "@/components/AppShell";
import {
  categoryColor,
  ClayButton,
  ClayCard,
  ClayChip,
} from "@/components/clay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";

type Opp = {
  _id: string;
  orgName: string;
  title: string;
  description: string;
  category: string;
  district: string;
  commitment: string;
  skills: string[];
  slots: number;
  slotsFilled: number;
};

export default function Opportunities() {
  const { isAuthenticated, user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [district, setDistrict] = useState("all");
  const [commitment, setCommitment] = useState("all");
  const [applying, setApplying] = useState<Opp | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const results = (useQuery(api.opportunities.list, {
    search: search || undefined,
    category,
    district,
    commitment,
  }) as Opp[] | undefined) ?? [];

  const myApps = useQuery(api.applications.listMine, {});
  const alreadyApplied = useMemo(
    () => new Set((myApps ?? []).map((a) => a.opportunity?._id).filter(Boolean) as string[]),
    [myApps],
  );

  const apply = useMutation(api.applications.apply);

  const handleApply = async () => {
    if (!applying) return;
    setSending(true);
    try {
      await apply({
        opportunityId: applying._id as never,
        message: message || undefined,
      });
      setAppliedIds((prev) => new Set(prev).add(applying._id));
      toast.success(`Application sent to ${applying.orgName}!`);
      setApplying(null);
      setMessage("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send application");
    } finally {
      setSending(false);
    }
  };

  const categories = ["all", "Education", "Health", "Environment", "Community", "Agriculture", "Technology"];
  const commitments = ["all", "One-time", "Weekly", "Monthly", "Ongoing"];

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Discover opportunities
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {results.length} open {results.length === 1 ? "role" : "roles"} across Rwanda
          </p>
        </div>
      </div>

      {/* Clay search + filters */}
      <ClayCard className="mt-5 p-4 sm:p-5">
        <div className="clay-input flex items-center gap-2 rounded-2xl px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles, organizations, skills…"
            className="clay-input h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search">
              <X className="size-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <FilterRow
            label="Category"
            options={categories}
            value={category}
            onChange={setCategory}
          />
          <FilterRow
            label="District"
            options={["all", ...DISTRICTS]}
            value={district}
            onChange={setDistrict}
          />
          <FilterRow
            label="Commitment"
            options={commitments}
            value={commitment}
            onChange={setCommitment}
          />
        </div>
      </ClayCard>

      {/* Results */}
      {results.length === 0 ? (
        <ClayCard className="mt-6 p-12 text-center">
          <Search className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-3 font-display text-lg font-bold">No matches</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Try clearing a filter or searching for something broader.
          </p>
          <ClayButton
            variant="outline"
            className="mt-5"
            onClick={() => {
              setSearch("");
              setCategory("all");
              setDistrict("all");
              setCommitment("all");
            }}
          >
            Reset filters
          </ClayButton>
        </ClayCard>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {results.map((opp, i) => {
            const applied = alreadyApplied.has(opp._id) || appliedIds.has(opp._id);
            const spotsLeft = Math.max(0, opp.slots - opp.slotsFilled);
            return (
              <motion.div
                key={opp._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i, 6) * 0.05 }}
              >
                <ClayCard interactive className="flex h-full flex-col p-5">
                  <div className="flex items-center justify-between gap-2">
                    <ClayChip className={categoryColor(opp.category)}>{opp.category}</ClayChip>
                    <ClayChip className="bg-card/80">
                      <MapPin className="size-3" /> {opp.district}
                    </ClayChip>
                  </div>
                  <h3 className="mt-3 font-display text-lg leading-snug font-bold">{opp.title}</h3>
                  <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{opp.orgName}</p>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {opp.description}
                  </p>
                  {opp.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {opp.skills.map((s) => (
                        <ClayChip key={s} className="bg-sky/50 text-xs">
                          {s}
                        </ClayChip>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between border-t-2 border-dashed border-border pt-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Users className="size-3.5" /> {spotsLeft} left · {opp.commitment}
                    </span>
                    {applied ? (
                      <ClayChip className="bg-mint/70 px-3 py-1.5 text-[#22503a]">
                        <CheckCircle2 className="size-3.5" /> Applied
                      </ClayChip>
                    ) : (
                      <ClayButton size="sm" onClick={() => setApplying(opp)}>
                        <Send /> Apply
                      </ClayButton>
                    )}
                  </div>
                </ClayCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Apply dialog */}
      <Dialog open={!!applying} onOpenChange={(open) => !open && setApplying(null)}>
        <DialogContent className="clay-pop max-w-md rounded-[1.5rem] p-7">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-extrabold">
              Apply: {applying?.title}
            </DialogTitle>
            <DialogDescription>
              {applying?.orgName} · {applying?.district} · {applying?.commitment}
            </DialogDescription>
          </DialogHeader>
          <label className="mt-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Short message (optional)
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell the organization why you're a great fit…"
            className="clay-input min-h-24 rounded-2xl border-0 px-4 py-3 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="mt-2 flex gap-2">
            <Button
              variant="outline"
              className="clay-button flex-1 rounded-2xl bg-secondary font-bold text-secondary-foreground"
              onClick={() => setApplying(null)}
            >
              Cancel
            </Button>
            <ClayButton className="flex-1" onClick={handleApply} disabled={sending}>
              {sending ? <Loader2 className="animate-spin" /> : <Send />} Send application
            </ClayButton>
          </div>
          {!isAuthenticated && (
            <p className="text-center text-xs text-muted-foreground">
              You'll need to sign in first — we'll redirect you.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 w-20 shrink-0 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`clay-chip px-3 py-1 text-xs font-bold transition-all ${
            value === opt
              ? "bg-primary text-primary-foreground clay-shadow-primary"
              : "bg-secondary/80 text-secondary-foreground hover:bg-secondary"
          }`}
        >
          {opt === "all" ? "All" : opt}
        </button>
      ))}
    </div>
  );
}

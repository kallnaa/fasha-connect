import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  Building2,
  ChevronDown,
  Inbox,
  Loader2,
  MapPin,
  Plus,
  Send,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { COMMITMENTS, CATEGORIES, DISTRICTS } from "@/lib/constants";
import { AppShell, timeAgo } from "@/components/AppShell";
import {
  categoryColor,
  ClayButton,
  ClayCard,
  ClayChip,
  StatusChip,
} from "@/components/clay";
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
  title: string;
  description: string;
  category: string;
  district: string;
  commitment: string;
  skills: string[];
  slots: number;
  slotsFilled: number;
  status: string;
  createdAt: number;
};

type Applicant = {
  _id: string;
  status: string;
  message: string | null;
  createdAt: number;
  volunteer: {
    _id: string;
    name: string | null;
    district: string | null;
    skills: string[];
    interests: string[];
    availability: string | null;
    bio: string | null;
  } | null;
};

export default function Manage() {
  const { user } = useAuth();
  const mine = (useQuery(api.opportunities.listMine, {}) as Opp[] | undefined) ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Education");
  const [district, setDistrict] = useState("Kigali");
  const [commitment, setCommitment] = useState("Weekly");
  const [skills, setSkills] = useState<string[]>([]);
  const [slots, setSlots] = useState("5");

  const create = useMutation(api.opportunities.create);
  const setStatus = useMutation(api.opportunities.setStatus);

  const isOrg = user?.accountType === "organization";

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Add a title and description first");
      return;
    }
    setBusy(true);
    try {
      await create({
        title,
        description,
        category,
        district,
        commitment,
        skills,
        slots: Number(slots) || 1,
      });
      toast.success("Opportunity posted!");
      setDialogOpen(false);
      setTitle("");
      setDescription("");
      setSkills([]);
      setSlots("5");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post opportunity");
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (opp: Opp) => {
    try {
      await setStatus({
        id: opp._id as never,
        status: opp.status === "open" ? "closed" : "open",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update status");
    }
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            {user?.orgName ?? "Organization"} console
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Post volunteer roles and review the people who apply.
          </p>
        </div>
        <ClayButton onClick={() => setDialogOpen(true)}>
          <Plus /> New opportunity
        </ClayButton>
      </div>

      {!isOrg && (
        <ClayCard className="mt-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <Building2 className="mr-1.5 inline size-4" />
              Your account is set to <b>Volunteer</b>. Switch to an Organization
              account in your profile to unlock posting.
            </p>
            <ClayButton asChild variant="outline" size="sm">
              <Link to="/profile">Open profile</Link>
            </ClayButton>
          </div>
        </ClayCard>
      )}

      {mine.length === 0 ? (
        <ClayCard className="mt-6 p-12 text-center">
          <Inbox className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-3 font-display text-lg font-bold">No postings yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Post your first opportunity and volunteers across Rwanda will see it
            in their recommendations.
          </p>
          <ClayButton className="mt-5" onClick={() => setDialogOpen(true)}>
            <Plus /> Post your first opportunity
          </ClayButton>
        </ClayCard>
      ) : (
        <div className="mt-6 space-y-4">
          {mine.map((opp) => (
            <OppRow
              key={opp._id}
              opp={opp}
              expanded={expanded === opp._id}
              onToggleExpand={() => setExpanded(expanded === opp._id ? null : opp._id)}
              onToggleStatus={() => handleToggle(opp)}
            />
          ))}
        </div>
      )}

      {/* Post dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="clay-pop max-w-lg rounded-[1.5rem] p-7">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-extrabold">
              Post an opportunity
            </DialogTitle>
            <DialogDescription>
              Volunteers see this in search and their recommendations.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Reading Buddy for Primary Pupils"
                className="clay-input mt-1.5 rounded-2xl border-0 px-4 shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will volunteers do? What should they bring? Why does it matter?"
                className="clay-input mt-1.5 min-h-24 rounded-2xl border-0 px-4 py-3 shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="clay-input mt-1.5 h-9 w-full rounded-2xl px-3 text-sm font-semibold outline-none"
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  District
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="clay-input mt-1.5 h-9 w-full rounded-2xl px-3 text-sm font-semibold outline-none"
                >
                  {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Commitment
                </label>
                <select
                  value={commitment}
                  onChange={(e) => setCommitment(e.target.value)}
                  className="clay-input mt-1.5 h-9 w-full rounded-2xl px-3 text-sm font-semibold outline-none"
                >
                  {COMMITMENTS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Volunteer slots
                </label>
                <Input
                  type="number"
                  min={1}
                  value={slots}
                  onChange={(e) => setSlots(e.target.value)}
                  className="clay-input mt-1.5 rounded-2xl border-0 px-4 shadow-none focus-visible:ring-0 dark:bg-transparent"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Helpful skills (optional)
              </label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["Teaching", "First Aid", "Web Development", "Social Media", "Fundraising", "Translation", "Photography", "Event Planning"].map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      setSkills((prev) =>
                        prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
                      )
                    }
                    className={`clay-chip px-3 py-1 text-xs font-bold transition-all ${
                      skills.includes(s)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/80 hover:bg-secondary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <ClayButton className="mt-4 w-full" onClick={handleCreate} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Send />} Publish opportunity
          </ClayButton>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function OppRow({
  opp,
  expanded,
  onToggleExpand,
  onToggleStatus,
}: {
  opp: Opp;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleStatus: () => void;
}) {
  const applicants =
    (useQuery(
      api.applications.listForOpportunity,
      expanded ? { opportunityId: opp._id as never } : "skip",
    ) as Applicant[] | undefined) ?? [];

  return (
    <ClayCard className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={opp.status} />
            <ClayChip className={categoryColor(opp.category)}>{opp.category}</ClayChip>
            <ClayChip className="bg-card/80">
              <MapPin className="size-3" /> {opp.district}
            </ClayChip>
            <ClayChip className="bg-card/80">{opp.commitment}</ClayChip>
          </div>
          <h3 className="mt-2 font-display text-lg leading-snug font-bold">{opp.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{opp.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" /> {opp.slotsFilled}/{opp.slots} filled
            </span>
            <span>posted {timeAgo(opp.createdAt)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={onToggleStatus}
            className="clay-chip flex items-center gap-1.5 bg-secondary/80 px-3 py-1.5 text-xs font-bold hover:bg-secondary"
          >
            {opp.status === "open" ? (
              <><ToggleRight className="size-4 text-[#22503a]" /> Open — tap to close</>
            ) : (
              <><ToggleLeft className="size-4" /> {opp.status} — tap to reopen</>
            )}
          </button>
          <ClayButton variant="outline" size="sm" onClick={onToggleExpand}>
            {expanded ? <X className="size-4" /> : <ChevronDown className="size-4" />}
            {expanded ? "Hide" : "Review applicants"}
          </ClayButton>
        </div>
      </div>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 border-t-2 border-dashed border-border pt-4"
        >
          {applicants.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No applications yet — they'll appear here as volunteers apply.
            </p>
          ) : (
            <div className="space-y-3">
              {applicants.map((a) => (
                <ApplicantRow key={a._id} appId={a._id} applicant={a} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </ClayCard>
  );
}

function ApplicantRow({
  appId,
  applicant,
}: {
  appId: string;
  applicant: Applicant;
}) {
  const [busy, setBusy] = useState(false);
  const decide = useMutation(api.applications.decide);
  const v = applicant.volunteer;

  const handle = async (decision: "accepted" | "declined") => {
    setBusy(true);
    try {
      await decide({ applicationId: appId as never, decision });
      toast.success(decision === "accepted" ? "Volunteer accepted 🎉" : "Application declined");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update application");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="clay-shadow-inset rounded-2xl bg-secondary/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display font-bold">{v?.name ?? "Anonymous volunteer"}</p>
            <StatusChip status={applicant.status} />
          </div>
          <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
            {v?.district ?? "Rwanda"} · {v?.availability ?? "Flexible"} · applied {timeAgo(applicant.createdAt)}
          </p>
          {v?.bio && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{v.bio}</p>}
          {(v?.skills.length ?? 0) > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {v!.skills.map((s) => (
                <ClayChip key={s} className="bg-mint/50 text-xs">{s}</ClayChip>
              ))}
            </div>
          )}
          {applicant.message && (
            <p className="mt-2 rounded-xl bg-card/80 px-3 py-2 text-sm italic text-foreground/80">
              “{applicant.message}”
            </p>
          )}
        </div>
        {applicant.status === "pending" && (
          <div className="flex gap-2">
            <ClayButton
              size="sm"
              disabled={busy}
              className="bg-[#5a9e6f] text-white hover:bg-[#5a9e6f]/90"
              onClick={() => handle("accepted")}
            >
              {busy ? <Loader2 className="animate-spin" /> : <Sparkles />} Accept
            </ClayButton>
            <ClayButton
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => handle("declined")}
            >
              <X /> Decline
            </ClayButton>
          </div>
        )}
      </div>
    </div>
  );
}

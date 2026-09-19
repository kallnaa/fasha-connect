import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BadgeCheck,
  ChevronDown,
  Clock,
  Eye,
  GraduationCap,
  MapPin,
  MessageCircleQuestion,
  MessagesSquare,
  Pencil,
  Pause,
  Phone,
  Play,
  Plus,
  Send,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { STAGE_LABELS, STAGES } from "@/lib/constants";
import { AppShell, timeAgo } from "@/components/AppShell";
import {
  categoryColor,
  ClayButton,
  ClayCard,
  ClayChip,
  matchScoreColor,
  StageChip,
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

type Opp = {
  _id: string;
  title: string;
  description: string;
  category: string;
  district: string;
  commitment: string;
  type?: string;
  slots: number;
  slotsFilled: number;
  status: string;
  isPaused?: boolean;
  views?: number;
  saves?: number;
  linkClicks?: number;
  createdAt: number;
  deadline?: number | null;
  eligibility?: {
    minAge?: number;
    education?: string;
    experience?: string;
    districts?: string[];
    skills?: string[];
  } | null;
};

type Applicant = {
  _id: string;
  stage: string;
  message: string | null;
  createdAt: number;
  matchScore: number;
  sector?: string;
  criteriaMet: string[];
  criteriaMissed: string[];
  infoRequest: string | null;
  infoResponse: string | null;
  conversationId?: string | null;
  volunteer: {
    _id: string;
    name: string | null;
    district: string | null;
    skills: string[];
    interests: string[];
    availability: string | null;
    age: number | null;
    education: string | null;
    school: string | null;
    track: string | null;
    phone: string | null;
    experience: string | null;
    bio: string | null;
    image: string | null;
  } | null;
};

export default function OrgOpportunities() {
  const mine = (useQuery(api.opportunities.listMine, {}) as Opp[] | undefined) ?? [];
  const [expanded, setExpanded] = useState<string | null>(null);
  const setStatus = useMutation(api.opportunities.setStatus);

  const handleToggleStatus = async (opp: Opp) => {
    try {
      if (opp.status === "open") {
        // pause or close
        if (opp.isPaused) {
          await setStatus({ id: opp._id as never, status: "open", paused: false });
          toast.success("Opportunity resumed");
        } else {
          await setStatus({ id: opp._id as never, status: "open", paused: true });
          toast.success("Opportunity paused");
        }
      } else {
        await setStatus({ id: opp._id as never, status: "open", paused: false });
        toast.success("Opportunity reopened");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    }
  };

  const handleClose = async (opp: Opp) => {
    try {
      await setStatus({ id: opp._id as never, status: "closed" });
      toast.success("Opportunity closed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not close");
    }
  };

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Opportunities</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mine.length} posting{mine.length === 1 ? "" : "s"} · manage status and review applicants
          </p>
        </div>
        <ClayButton asChild>
          <Link to="/org/post">
            <Plus /> Post opportunity
          </Link>
        </ClayButton>
      </div>

      {mine.length === 0 ? (
        <ClayCard className="mt-6 p-12 text-center">
          <Sparkles className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-3 font-display text-lg font-bold">No postings yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Post your first opportunity — it will appear in volunteer
            recommendations matched by eligibility.
          </p>
          <ClayButton asChild className="mt-5">
            <Link to="/org/post">
              <Plus /> Post your first opportunity
            </Link>
          </ClayButton>
        </ClayCard>
      ) : (
        <div className="mt-6 space-y-4">
          {mine.map((opp) => (
            <ClayCard key={opp._id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip status={opp.status} />
                    {opp.isPaused && (
                      <ClayChip className="bg-butter text-yellow-800">
                        <Pause className="size-3" /> Paused
                      </ClayChip>
                    )}
                    <ClayChip className={categoryColor(opp.category)}>{opp.category}</ClayChip>
                    {opp.type && <ClayChip className="bg-card/80">{opp.type}</ClayChip>}
                  </div>
                  <h3 className="mt-2 font-display text-lg leading-snug font-bold">{opp.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{opp.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="size-3.5" /> {opp.slotsFilled}/{opp.slots} filled
                    </span>
                    <span className="flex items-center gap-1.5"><Eye className="size-3.5" /> {opp.views ?? 0} views</span>
                    <span>posted {timeAgo(opp.createdAt)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex flex-wrap justify-end gap-2">
                    <ClayButton variant="outline" size="sm" onClick={() => handleToggleStatus(opp)}>
                      {opp.status === "open" ? (
                        opp.isPaused ? <><Play className="size-4" /> Resume</> : <><Pause className="size-4" /> Pause</>
                      ) : (
                        <><Play className="size-4" /> Reopen</>
                      )}
                    </ClayButton>
                    <ClayButton asChild variant="outline" size="sm">
                      <Link to={`/org/opportunities/${opp._id}/edit`}>
                        <Pencil className="size-4" /> Edit
                      </Link>
                    </ClayButton>
                    {opp.status === "open" && (
                      <ClayButton variant="outline" size="sm" onClick={() => handleClose(opp)}>
                        <X className="size-4" /> Close
                      </ClayButton>
                    )}
                  </div>
                  <ClayButton size="sm" onClick={() => setExpanded(expanded === opp._id ? null : opp._id)}>
                    {expanded === opp._id ? <ChevronDown className="rotate-180" /> : <Users />}
                    {expanded === opp._id ? "Hide applicants" : "View applicants"}
                  </ClayButton>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {expanded === opp._id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 border-t-2 border-dashed border-border pt-4">
                      <ApplicantsList opportunityId={opp._id} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </ClayCard>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function ApplicantsList({ opportunityId }: { opportunityId: string }) {
  const applicants = (useQuery(
    api.applications.listForOpportunity,
    { opportunityId: opportunityId as never },
  ) as Applicant[] | undefined) ?? [];

  const [stageFilter, setStageFilter] = useState<string>("all");
  const [minScore, setMinScore] = useState(0);
  const [onlyMatching, setOnlyMatching] = useState(false);

  const filtered = applicants
    .filter((a) => stageFilter === "all" || a.stage === stageFilter)
    .filter((a) => a.matchScore >= minScore)
    .filter((a) => !onlyMatching || a.matchScore >= 75);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setStageFilter("all")}
          className={`clay-chip px-3 py-1 text-xs font-bold ${
            stageFilter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary/80 hover:bg-secondary"
          }`}
        >
          All ({applicants.length})
        </button>
        {STAGES.map((s) => {
          const count = applicants.filter((a) => a.stage === s).length;
          return (
            <button
              key={s}
              onClick={() => setStageFilter(s)}
              className={`clay-chip px-3 py-1 text-xs font-bold ${
                stageFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary/80 hover:bg-secondary"
              }`}
            >
              {STAGE_LABELS[s]} ({count})
            </button>
          );
        })}
        <span className="mx-1 h-4 w-px bg-border" />
        <button
          onClick={() => setOnlyMatching((v) => !v)}
          className={`clay-chip px-3 py-1 text-xs font-bold ${
            onlyMatching ? "bg-mint text-teal-800" : "bg-secondary/80 hover:bg-secondary"
          }`}
        >
          Great matches only
        </button>
        {minScore > 0 && (
          <button onClick={() => setMinScore(0)} className="clay-chip bg-peach px-3 py-1 text-xs font-bold text-rose-800">
            Clear {minScore}+ filter
          </button>
        )}
      </div>

      {applicants.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No applications yet — they'll appear here as volunteers apply.
        </p>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No applicants match the current filter.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map((a) => (
            <ApplicantCard key={a._id} applicant={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicantCard({ applicant: a }: { applicant: Applicant }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [hours, setHours] = useState("20");
  const [requestText, setRequestText] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const v = a.volunteer;
  const setStage = useMutation(api.applications.setStage);
  const requestInfo = useMutation(api.applications.requestInfo);
  const markCompleted = useMutation(api.certificates.markCompleted);

  const complete = async () => {
    const n = Math.max(1, Math.floor(Number(hours) || 0));
    setBusy(true);
    try {
      const res = await markCompleted({ applicationId: a._id as never, hours: n });
      toast.success(
        "created" in res && res.created
          ? `Certificate issued — ${res.hours} verified hours added to ${v?.name?.split(" ")[0] ?? "the volunteer"}'s profile`
          : "This engagement was already completed",
      );
      setShowComplete(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not mark as completed");
    } finally {
      setBusy(false);
    }
  };

  const move = async (stage: string) => {
    setBusy(true);
    try {
      await setStage({ applicationId: a._id as never, stage: stage as never });
      toast.success(`Moved to ${STAGE_LABELS[stage]}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusy(false);
    }
  };

  const ask = async () => {
    if (!requestText.trim()) return;
    setBusy(true);
    try {
      await requestInfo({ applicationId: a._id as never, request: requestText });
      toast.success("Info request sent to volunteer");
      setShowRequest(false);
      setRequestText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send request");
    } finally {
      setBusy(false);
    }
  };

  const nextStages =
    a.stage === "new"
      ? ["reviewing", "shortlisted", "rejected"]
      : a.stage === "reviewing"
        ? ["shortlisted", "accepted", "rejected"]
        : a.stage === "shortlisted"
          ? ["accepted", "rejected"]
          : [];

  return (
    <div className="clay-shadow-inset rounded-2xl bg-secondary/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display font-bold">{v?.name ?? "Anonymous volunteer"}</p>
            <StageChip stage={a.stage} />
            <span className={`clay-chip px-2.5 py-0.5 text-xs font-extrabold ${matchScoreColor(a.matchScore)}`}>
              {a.matchScore}% match
            </span>
          </div>
          <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
            {v?.district ?? "Rwanda"} · {v?.age ? `${v.age} yrs · ` : ""}
            {v?.availability ?? "Flexible"} · applied {timeAgo(a.createdAt)}
          </p>
          {v?.bio && (
            <p className="mt-1.5 line-clamp-1 text-sm text-muted-foreground">{v.bio}</p>
          )}
          <button
            onClick={() => setProfileOpen(true)}
            className="mt-1 text-xs font-bold text-primary hover:underline"
          >
            View full profile
          </button>
        </div>

        <div className="flex flex-col items-end gap-2">
          {nextStages.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1.5">
              {nextStages.map((s) => (
                <ClayButton
                  key={s}
                  size="sm"
                  variant={s === "rejected" ? "outline" : "default"}
                  disabled={busy}
                  className={s === "accepted" ? "bg-[#5a9e6f] text-white hover:bg-[#5a9e6f]/90" : ""}
                  onClick={() => move(s)}
                >
                  {s === "shortlisted" && <Sparkles className="size-3.5" />}
                  {STAGE_LABELS[s]}
                </ClayButton>
              ))}
            </div>
          )}
          <ClayButton size="sm" variant="outline" onClick={() => setShowRequest((v) => !v)}>
            <MessageCircleQuestion className="size-4" />
            {a.infoRequest && !a.infoResponse ? "Re-request info" : "Request info"}
          </ClayButton>
          <ClayButton size="sm" variant="outline" onClick={() => setProfileOpen(true)}>
            <Users className="size-4" /> View profile
          </ClayButton>
          {a.stage === "accepted" && a.conversationId && (
            <ClayButton
              size="sm"
              variant="outline"
              onClick={() => navigate(`/org/messages?c=${a.conversationId}`)}
            >
              <MessagesSquare className="size-4" /> Message
            </ClayButton>
          )}
          {a.stage === "accepted" && (
            <ClayButton size="sm" onClick={() => setShowComplete((v) => !v)}>
              <BadgeCheck className="size-4" /> Mark as Completed
            </ClayButton>
          )}
        </div>
      </div>

      {showRequest && (
        <div className="mt-3">
          <Textarea
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            placeholder="What additional info or documents do you need? (e.g. CV, motivation letter, ID copy)"
            className="clay-input min-h-16 rounded-2xl border-0 px-3 py-2 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="mt-2 flex gap-2">
            <ClayButton size="sm" onClick={ask} disabled={busy || !requestText.trim()}>
              <Send className="size-3.5" /> Send request
            </ClayButton>
            <ClayButton size="sm" variant="outline" onClick={() => setShowRequest(false)}>
              Cancel
            </ClayButton>
          </div>
        </div>
      )}

      {showComplete && (
        <div className="mt-3 rounded-2xl bg-mint/60 p-4">
          <p className="flex items-center gap-1.5 text-sm font-bold text-teal-900">
            <BadgeCheck className="size-4 text-teal-700" /> Issue a verified certificate
          </p>
          <p className="mt-1 text-xs leading-relaxed text-teal-900/80">
            This adds an authenticated entry to {v?.name?.split(" ")[0] ?? "the volunteer"}'s
            Impact Log with your organization as the issuer — total hours,
            sector ({a.sector ?? "Community"}) and program name. The
            volunteer is notified instantly.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="text-xs font-bold text-teal-900">Verified hours</label>
            <Input
              type="number"
              min={1}
              value={hours}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHours(e.target.value)}
              className="clay-input h-9 w-24 rounded-xl px-3 text-sm font-semibold"
            />
            <ClayButton size="sm" onClick={complete} disabled={busy}>
              {busy ? "Issuing…" : "Issue certificate"}
            </ClayButton>
            <ClayButton size="sm" variant="outline" onClick={() => setShowComplete(false)}>
              Cancel
            </ClayButton>
          </div>
        </div>
      )}

      <ApplicantProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        applicant={a}
      />
    </div>
  );
}

/** Full applicant profile, opened by orgs when reviewing an application. */
function ApplicantProfileDialog({
  open,
  onOpenChange,
  applicant: a,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicant: Applicant;
}) {
  const v = a.volunteer;
  const impact = useQuery(
    api.certificates.impactStats,
    v ? { volunteerId: v._id as never } : "skip",
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-3xl p-0 sm:max-w-xl">
        {/* Header — identity + match */}
        <div className="rounded-t-3xl bg-gradient-to-br from-teal-50 to-rose-50 p-6 pb-5">
          <div className="flex items-start gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 font-display text-xl font-extrabold text-primary clay-shadow-sm">
              {v?.name?.charAt(0).toUpperCase() ?? "V"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="font-display text-lg font-extrabold">
                  {v?.name ?? "Anonymous volunteer"}
                </DialogTitle>
                <StageChip stage={a.stage} />
              </div>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {v?.district ?? "Rwanda"}</span>
                {v?.age != null && <span>{v.age} yrs</span>}
                <span className="flex items-center gap-1"><Clock className="size-3.5" /> {v?.availability ?? "Flexible"}</span>
              </p>
            </div>
            <span className={`clay-chip px-3 py-1 text-xs font-extrabold ${matchScoreColor(a.matchScore)}`}>
              {a.matchScore}% match
            </span>
          </div>

          {/* Verified impact summary */}
          {impact && (impact.totalHours > 0 || impact.completedPrograms > 0) && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-card/80 p-2.5 text-center">
                <p className="font-display text-lg font-extrabold text-teal-700">{impact.totalHours}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Verified hrs</p>
              </div>
              <div className="rounded-2xl bg-card/80 p-2.5 text-center">
                <p className="font-display text-lg font-extrabold text-teal-700">{impact.completedPrograms}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Programs</p>
              </div>
              <div className="rounded-2xl bg-card/80 p-2.5 text-center">
                <p className="font-display text-lg font-extrabold text-teal-700">{impact.certificates}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Certificates</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5 p-6 pt-5">
          {/* Contact */}
          {v?.phone && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Contact</p>
              <a
                href={`tel:${v.phone}`}
                className="mt-1.5 inline-flex items-center gap-2 rounded-2xl bg-secondary/70 px-3 py-1.5 text-sm font-bold hover:bg-secondary"
              >
                <Phone className="size-4 text-primary" /> {v.phone}
              </a>
            </div>
          )}

          {/* About */}
          {v?.bio && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">About</p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{v.bio}</p>
            </div>
          )}

          {/* Education & experience */}
          {(v?.education || v?.school || v?.track || v?.experience) && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Education & experience</p>
              <div className="mt-2 space-y-1.5">
                {v?.education && (
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <GraduationCap className="size-4 text-primary" /> {v.education}
                  </p>
                )}
                {v?.school && (
                  <p className="ml-6 text-sm text-muted-foreground">{v.school}{v?.track ? ` · ${v.track}` : ""}</p>
                )}
                {v?.experience && (
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Award className="size-4 text-primary" /> {v.experience} experience
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Skills & interests */}
          {((v?.skills?.length ?? 0) > 0 || (v?.interests?.length ?? 0) > 0) && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Skills & interests</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {v?.skills?.map((s) => (
                  <ClayChip key={s} className="bg-mint/60 text-xs text-teal-900">{s}</ClayChip>
                ))}
                {v?.interests?.map((i) => (
                  <ClayChip key={i} className="bg-sky/60 text-xs text-sky-900">{i}</ClayChip>
                ))}
              </div>
            </div>
          )}

          {/* Application message */}
          {a.message && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Application message</p>
              <p className="mt-1.5 rounded-2xl bg-secondary/60 px-4 py-3 text-sm italic leading-relaxed text-foreground/80">
                “{a.message}”
              </p>
            </div>
          )}

          {/* Eligibility breakdown */}
          {(a.criteriaMet.length > 0 || a.criteriaMissed.length > 0) && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Eligibility check</p>
              <div className="mt-2 space-y-1">
                {a.criteriaMet.map((m) => (
                  <p key={m} className="text-xs font-semibold text-teal-800">✓ {m}</p>
                ))}
                {a.criteriaMissed.map((m) => (
                  <p key={m} className="text-xs font-semibold text-rose-700">✗ {m}</p>
                ))}
              </div>
            </div>
          )}

          {/* Info request thread */}
          {a.infoRequest && (
            <div className="rounded-2xl bg-butter/30 p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold text-yellow-700">
                <MessageCircleQuestion className="size-3.5" /> You asked: {a.infoRequest}
              </p>
              {a.infoResponse ? (
                <p className="mt-1.5 text-sm"><b>Response:</b> {a.infoResponse}</p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">Awaiting volunteer response…</p>
              )}
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Applied {timeAgo(a.createdAt)}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

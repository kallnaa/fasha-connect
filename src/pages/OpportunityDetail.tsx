import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Globe,
  GraduationCap,
  Loader2,
  MapPin,
  Send,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/AppShell";
import {
  categoryColor,
  ClayButton,
  ClayCard,
  ClayChip,
} from "@/components/clay";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";

type Detail = {
  _id: string;
  orgId: string;
  orgName: string;
  title: string;
  description: string;
  category: string;
  district: string;
  commitment: string;
  skills: string[];
  slots: number;
  slotsFilled: number;
  type?: string;
  status?: string;
  deadline?: number | null;
  targetAudience?: string | null;
  benefits?: string | null;
  requirements?: string | null;
  applicationLink?: string | null;
  eligibility?: {
    minAge?: number;
    maxAge?: number;
    education?: string;
    experience?: string;
    districts?: string[];
    skills?: string[];
  } | null;
  orgBio?: string | null;
  orgDistrict?: string | null;
  orgWebsite?: string | null;
  orgVerification?: string;
  orgLogo?: string | null;
};

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const opp = useQuery(
    api.opportunities.get,
    id ? ({ id: id as never } as never) : "skip",
  ) as Detail | undefined | null;

  const myApps = useQuery(api.applications.listMine, {});
  const alreadyApplied = useMemo(
    () =>
      new Set(
        (myApps ?? []).map((a) => a.opportunity?._id).filter(Boolean) as string[],
      ),
    [myApps],
  );

  const trackView = useMutation(api.opportunities.trackView);
  useEffect(() => {
    if (id) trackView({ id: id as never }).catch(() => {});
  }, [id, trackView]);

  const savedIds = new Set((user?.savedOpportunities ?? []) as string[]);
  const toggleSave = useMutation(api.saves.toggleSave);
  const apply = useMutation(api.applications.apply);
  const trackLinkClick = useMutation(api.opportunities.trackLinkClick);

  const [applyOpen, setApplyOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleApply = async () => {
    if (!opp) return;
    setSending(true);
    try {
      await apply({
        opportunityId: opp._id as never,
        message: message || undefined,
      });
      toast.success(`Application sent to ${opp.orgName}!`);
      setApplyOpen(false);
      setMessage("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send application");
    } finally {
      setSending(false);
    }
  };

  const handleSave = async () => {
    if (!opp) return;
    try {
      await toggleSave({ opportunityId: opp._id as never });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    }
  };

  if (opp === undefined) {
    return (
      <AppShell>
        <div className="grid gap-5 lg:grid-cols-3">
          <ClayCard className="h-72 animate-pulse lg:col-span-2">&nbsp;</ClayCard>
          <ClayCard className="h-72 animate-pulse">&nbsp;</ClayCard>
        </div>
      </AppShell>
    );
  }

  if (opp === null) {
    return (
      <AppShell>
        <ClayCard className="mx-auto max-w-lg p-12 text-center">
          <p className="font-display text-xl font-bold">Opportunity not found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            It may have been closed or removed by the organization.
          </p>
          <Link to="/opportunities" className="mt-6 inline-block">
            <ClayButton>Browse opportunities</ClayButton>
          </Link>
        </ClayCard>
      </AppShell>
    );
  }

  const applied = alreadyApplied.has(opp._id);
  const spotsLeft = Math.max(0, opp.slots - opp.slotsFilled);
  const deadlinePassed = opp.deadline ? opp.deadline < Date.now() : false;
  const canApply = !applied && !deadlinePassed && opp.status !== "closed";
  const isSaved = savedIds.has(opp._id);

  return (
    <AppShell>
      <Link
        to="/opportunities"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to opportunities
      </Link>

      <div className="mt-4 grid gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ClayCard className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <ClayChip className={categoryColor(opp.category)}>
                  {opp.category}
                </ClayChip>
                {opp.type && <ClayChip className="bg-sky/50">{opp.type}</ClayChip>}
                {opp.deadline && (
                  <ClayChip
                    className={
                      deadlinePassed ? "bg-peach text-rose-800" : "bg-butter text-yellow-800"
                    }
                  >
                    <CalendarClock className="size-3" />
                    {deadlinePassed
                      ? "Closed"
                      : `Apply by ${new Date(opp.deadline).toLocaleDateString()}`}
                  </ClayChip>
                )}
              </div>

              <h1 className="mt-4 font-display text-3xl leading-tight font-extrabold tracking-tight">
                {opp.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" /> {opp.district}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="size-4" /> {spotsLeft} of {opp.slots} spots left
                </span>
                <span>{opp.commitment} commitment</span>
              </div>

              <p className="mt-5 text-[15px] leading-relaxed text-foreground/90">
                {opp.description}
              </p>

              {opp.targetAudience && (
                <Section icon={<Users className="size-3.5" />} label="Who it's for">
                  {opp.targetAudience}
                </Section>
              )}
              {opp.benefits && (
                <Section icon={<CheckCircle2 className="size-3.5" />} label="Benefits">
                  {opp.benefits}
                </Section>
              )}
              {opp.requirements && (
                <Section icon={<GraduationCap className="size-3.5" />} label="Requirements">
                  {opp.requirements}
                </Section>
              )}
              {opp.skills.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Skills
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {opp.skills.map((s) => (
                      <ClayChip key={s} className="bg-sky/50 text-xs">
                        {s}
                      </ClayChip>
                    ))}
                  </div>
                </div>
              )}
              {opp.eligibility && (
                <div className="clay-shadow-inset mt-5 rounded-2xl bg-secondary/50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Eligibility
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {opp.eligibility.minAge !== undefined && (
                      <ClayChip className="bg-card/80">Age {opp.eligibility.minAge}+</ClayChip>
                    )}
                    {opp.eligibility.maxAge !== undefined && (
                      <ClayChip className="bg-card/80">Under {opp.eligibility.maxAge}</ClayChip>
                    )}
                    {opp.eligibility.education && (
                      <ClayChip className="bg-card/80">{opp.eligibility.education}</ClayChip>
                    )}
                    {opp.eligibility.experience && (
                      <ClayChip className="bg-card/80">{opp.eligibility.experience}</ClayChip>
                    )}
                    {opp.eligibility.skills?.map((s) => (
                      <ClayChip key={s} className="bg-card/80">
                        {s}
                      </ClayChip>
                    ))}
                    {opp.eligibility.districts?.map((d) => (
                      <ClayChip key={d} className="bg-card/80">
                        <MapPin className="size-3" /> {d}
                      </ClayChip>
                    ))}
                  </div>
                </div>
              )}
            </ClayCard>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <ClayCard className="p-6">
            {applied ? (
              <ClayChip className="w-full justify-center bg-mint px-4 py-3 text-teal-800">
                <CheckCircle2 className="size-4" /> Application submitted
              </ClayChip>
            ) : (
              <ClayButton
                className="w-full"
                disabled={!canApply}
                onClick={() => {
                  setMessage("");
                  setApplyOpen(true);
                }}
              >
                {deadlinePassed ? "Deadline passed" : <><Send /> Apply now</>}
              </ClayButton>
            )}

            {opp.applicationLink && (
              <a
                href={opp.applicationLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackLinkClick({ id: opp._id as never }).catch(() => {})}
                className="clay-button mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-2.5 font-display text-sm font-bold text-secondary-foreground hover:bg-secondary/80"
              >
                <ExternalLink className="size-4" /> Apply on organization site
              </a>
            )}

            <button
              onClick={handleSave}
              className="clay-button mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-card/80 px-4 py-2.5 font-display text-sm font-bold text-foreground ring-2 ring-border hover:bg-secondary"
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="size-4 text-primary" /> Saved
                </>
              ) : (
                <>
                  <Bookmark className="size-4" /> Save for later
                </>
              )}
            </button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Apply with Fasha and track your status in Messages.
            </p>
          </ClayCard>

          {/* Organization card */}
          <ClayCard className="p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Organized by
            </p>
            <div className="mt-3 flex items-center gap-3">
              {opp.orgLogo ? (
                <img
                  src={opp.orgLogo}
                  alt={opp.orgName}
                  className="size-12 shrink-0 rounded-2xl object-cover ring-2 ring-border"
                />
              ) : (
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary font-display text-lg font-extrabold text-secondary-foreground">
                  {opp.orgName.slice(0, 1)}
                </div>
              )}
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-display font-bold">
                  <span className="truncate">{opp.orgName}</span>
                  {opp.orgVerification === "verified" && (
                    <BadgeCheck className="size-4 shrink-0 text-primary" />
                  )}
                </p>
                {opp.orgDistrict && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" /> {opp.orgDistrict}
                  </p>
                )}
              </div>
            </div>
            {opp.orgBio && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{opp.orgBio}</p>
            )}
            {opp.orgWebsite && (
              <a
                href={opp.orgWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <Globe className="size-3.5" /> Visit website
              </a>
            )}
          </ClayCard>
        </div>
      </div>

      {/* Apply dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="clay-pop max-w-lg rounded-[1.5rem] p-7">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-extrabold">
              Apply to {opp.title}
            </DialogTitle>
            <DialogDescription>
              {opp.orgName} · {opp.district} · {opp.commitment}
            </DialogDescription>
          </DialogHeader>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Short message (optional)
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell the organization why you're a great fit…"
            className="clay-input min-h-20 rounded-2xl border-0 px-4 py-3 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <ClayButton className="mt-3 w-full" onClick={handleApply} disabled={sending}>
            {sending ? <Loader2 className="animate-spin" /> : <Send />} Send application
          </ClayButton>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Section({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="clay-shadow-inset mt-5 rounded-2xl bg-secondary/50 p-4">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  Heart,
  Loader2,
  MapPin,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import logo from "@/assets/logo.svg";
import { ClayButton, ClayCard, ClayChip } from "@/components/clay";
import { DISTRICTS, INTERESTS, SKILLS } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";

const INTEREST_EMOJI: Record<string, string> = {
  Education: "📚",
  Health: "🩺",
  Environment: "🌱",
  "Community Development": "🏘️",
  Agriculture: "🌾",
  Technology: "💻",
  "Youth Empowerment": "🔥",
  "Women Empowerment": "💪",
  Sports: "⚽",
  "Arts & Culture": "🎭",
};

const COMMITMENTS = ["Flexible", "Weekly", "Monthly", "One-time"];

/** Volunteers only — orgs are bounced to their console. */
export function OnboardingGuard({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, user } = useAuth();
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </main>
    );
  }
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (user?.accountType === "organization") return <Navigate to="/org" replace />;
  return children;
}

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const complete = useMutation(api.profiles.completeOnboarding);

  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.name ?? "");
  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [district, setDistrict] = useState<string>("");
  const [availability, setAvailability] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  };

  const canContinue =
    step === 1 ? interests.length > 0 : step === 2 ? skills.length > 0 : step === 3 ? !!district : true;

  const finish = async (opts?: { skip?: boolean }) => {
    setSaving(true);
    try {
      await complete({
        name: name || undefined,
        interests: opts?.skip ? [] : interests,
        skills: opts?.skip ? [] : skills,
        district: district || undefined,
        availability: availability || undefined,
      });
      toast.success(
        opts?.skip
          ? "You can personalize anytime from your profile"
          : "You're all set — matches are ready!",
      );
      navigate(
        returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
          ? returnTo
          : "/dashboard",
        { replace: true },
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save your profile");
      setSaving(false);
    }
  };

  const STEPS = ["About you", "Interests", "Skills", "Location & time", "Done"];

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* soft teal/rose atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="clay-blob absolute -top-32 -left-32 size-[30rem] bg-teal-200/50" />
        <div className="clay-blob absolute -right-32 bottom-0 size-[26rem] bg-rose-200/50" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
        {/* header */}
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="Fasha" className="size-9 rounded-xl" />
          <span className="font-display text-xl font-extrabold tracking-tight">Fasha</span>
          <span className="ml-auto text-xs font-semibold text-muted-foreground">
            Step {Math.min(step + 1, 4)} of 4
          </span>
        </div>

        {/* progress */}
        <div className="mt-4 flex gap-1.5">
          {STEPS.slice(0, 4).map((label, i) => (
            <div
              key={label}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < step ? "bg-primary" : i === step ? "bg-primary/50" : "bg-secondary"
              }`}
            />
          ))}
        </div>

        <div className="flex flex-1 flex-col justify-center py-8">
          {step === 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <ClayChip className="bg-teal-50 font-bold text-teal-800">
                🇷🇼 Karibu! Let's get you matched
              </ClayChip>
              <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                First, what should we call you?
              </h1>
              <p className="mt-2 text-muted-foreground">
                Your first name is enough — organizations see it when you apply.
              </p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aline"
                autoFocus
                className="clay-input mt-6 w-full px-4 py-3 text-base outline-none"
              />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                What do you care about?
              </h1>
              <p className="mt-2 text-muted-foreground">
                Pick at least one — this powers your match recommendations.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {INTERESTS.map((interest) => {
                  const active = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggle(interests, setInterests, interest)}
                      className={`clay-chip flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-all ${
                        active
                          ? "bg-primary text-primary-foreground shadow-md shadow-teal-900/20"
                          : "bg-card text-foreground hover:bg-secondary"
                      }`}
                    >
                      <span aria-hidden>{INTEREST_EMOJI[interest]}</span>
                      {interest}
                      {active && <Check className="size-3.5" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                What can you help with?
              </h1>
              <p className="mt-2 text-muted-foreground">
                Choose anything you're comfortable with — even a little counts.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {SKILLS.map((skill) => {
                  const active = skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggle(skills, setSkills, skill)}
                      className={`clay-chip flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-all ${
                        active
                          ? "bg-primary text-primary-foreground shadow-md shadow-teal-900/20"
                          : "bg-card text-foreground hover:bg-secondary"
                      }`}
                    >
                      {skill}
                      {active && <Check className="size-3.5" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Where are you, and when are you free?
              </h1>
              <p className="mt-2 text-muted-foreground">
                We'll prioritize programs near you that fit your schedule.
              </p>

              <label className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <MapPin className="size-3.5" /> District
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {DISTRICTS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDistrict(district === d ? "" : d)}
                    className={`clay-chip px-3.5 py-1.5 text-sm font-bold transition-all ${
                      district === d
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-foreground hover:bg-secondary"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <label className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <CalendarClock className="size-3.5" /> Availability
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {COMMITMENTS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setAvailability(availability === c ? "" : c)}
                    className={`clay-chip px-4 py-1.5 text-sm font-bold transition-all ${
                      availability === c
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-foreground hover:bg-secondary"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
              <ClayCard className="p-8 text-center">
                <span className="clay-shadow-primary mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary">
                  <Sparkles className="size-8 text-primary-foreground" />
                </span>
                <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight">
                  You're ready, {name.split(" ")[0] || "friend"}! 🎉
                </h1>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  We're preparing your matches from{" "}
                  <b>{interests.length || "your"}</b> interest
                  {interests.length === 1 ? "" : "s"}, {skills.length} skill
                  {skills.length === 1 ? "" : "s"} and {district || "your area"}.
                </p>
              </ClayCard>
            </motion.div>
          )}
        </div>

        {/* controls */}
        <div className="flex items-center justify-between gap-3 pb-4">
          <ClayButton
            variant="ghost"
            onClick={() => (step === 0 ? finish({ skip: true }) : setStep((s) => s - 1))}
            disabled={saving}
          >
            <ArrowLeft /> {step === 0 ? "Skip for now" : "Back"}
          </ClayButton>

          {step < 4 ? (
            <ClayButton onClick={() => canContinue && setStep((s) => s + 1)} disabled={!canContinue || saving}>
              Continue <ArrowRight />
            </ClayButton>
          ) : (
            <ClayButton onClick={() => finish()} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="animate-spin" /> Preparing matches…
                </>
              ) : (
                <>
                  <Heart /> Go to my matches
                </>
              )}
            </ClayButton>
          )}
        </div>
      </div>
    </div>
  );
}

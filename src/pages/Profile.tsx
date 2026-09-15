import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import {
  Building2,
  Check,
  GraduationCap,
  HeartHandshake,
  MapPin,
  Save,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import {
  AVAILABILITY,
  DISTRICTS,
  EDUCATION_LEVELS,
  EXPERIENCE_LEVELS,
  INTERESTS,
  SKILLS,
} from "@/lib/constants";
import { AppShell } from "@/components/AppShell";
import { ClayButton, ClayCard, ClayChip } from "@/components/clay";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";

export default function Profile() {
  const { user } = useAuth();

  const [accountType, setAccountType] = useState<"volunteer" | "organization">(
    user?.accountType === "organization" ? "organization" : "volunteer",
  );
  const [name, setName] = useState(user?.name ?? "");
  const [orgName, setOrgName] = useState(user?.orgName ?? "");
  const [district, setDistrict] = useState(user?.district ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [age, setAge] = useState(user?.age?.toString() ?? "");
  const [education, setEducation] = useState(user?.education ?? "Any");
  const [experience, setExperience] = useState(user?.experience ?? "No experience");
  const [interests, setInterests] = useState<string[]>(user?.interests ?? []);
  const [skills, setSkills] = useState<string[]>(user?.skills ?? []);
  const [availability, setAvailability] = useState(user?.availability ?? "Flexible");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setOrgName(user.orgName ?? "");
      setDistrict(user.district ?? "");
      setBio(user.bio ?? "");
      setPhone(user.phone ?? "");
      setAge(user.age?.toString() ?? "");
      setEducation(user.education ?? "Any");
      setExperience(user.experience ?? "No experience");
      setInterests(user.interests ?? []);
      setSkills(user.skills ?? []);
      setAvailability(user.availability ?? "Flexible");
      if (user.accountType) setAccountType(user.accountType);
    }
  }, [user]);

  const save = useMutation(api.profiles.upsertProfile);

  const handleSave = async () => {
    setSaving(true);
    try {
      await save({
        accountType,
        name: accountType === "volunteer" ? name.trim() : orgName.trim() || name.trim(),
        orgName: accountType === "organization" ? orgName.trim() : undefined,
        bio: bio.trim() || undefined,
        district: district || undefined,
        phone: phone.trim() || undefined,
        age: accountType === "volunteer" && age ? Number(age) : undefined,
        education: accountType === "volunteer" ? education : undefined,
        experience: accountType === "volunteer" ? experience : undefined,
        interests: accountType === "volunteer" ? interests : [],
        skills: accountType === "volunteer" ? skills : [],
        availability: accountType === "volunteer" ? availability : undefined,
      });
      toast.success("Profile saved — recommendations updated!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  return (
    <AppShell className="max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">My profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This powers your recommendations and what organizations see about you.
        </p>
      </motion.div>

      {/* Account type */}
      <ClayCard className="mt-6 p-6">
        <h2 className="font-display text-lg font-bold">I'm joining as…</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <TypeCard
            active={accountType === "volunteer"}
            onClick={() => setAccountType("volunteer")}
            icon={HeartHandshake}
            title="Volunteer"
            body="Find opportunities and apply with my interests & skills."
            chipClass="bg-peach/70 text-[#7c2d12]"
          />
          <TypeCard
            active={accountType === "organization"}
            onClick={() => setAccountType("organization")}
            icon={Building2}
            title="Organization"
            body="Post opportunities and review volunteer applications."
            chipClass="bg-sky/70 text-[#1e3a52]"
          />
        </div>
        {accountType === "organization" && (
          <p className="mt-3 rounded-2xl bg-sky/30 px-4 py-2.5 text-xs font-semibold text-[#1e3a52]">
            After saving, you'll get the Organization console at{" "}
            <b>/org</b> — Dashboard, Opportunities, Post, Analytics and Profile.
          </p>
        )}
      </ClayCard>

      {/* Basics */}
      <ClayCard className="mt-5 p-6">
        <h2 className="font-display text-lg font-bold">Basics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {accountType === "volunteer" ? "Full name" : "Contact person"}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aline Uwase"
              className="clay-input mt-1.5 rounded-2xl border-0 px-4 shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
          {accountType === "organization" && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Organization name
              </label>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Umurava Youth Network"
                className="clay-input mt-1.5 rounded-2xl border-0 px-4 shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <MapPin className="mr-1 inline size-3" /> District
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="clay-input mt-1.5 h-9 w-full rounded-2xl px-3 text-sm font-semibold outline-none"
            >
              <option value="">Select district…</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Phone (optional)
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+250 7…"
              className="clay-input mt-1.5 rounded-2xl border-0 px-4 shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </div>

          {accountType === "volunteer" && (
            <>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Age
                </label>
                <Input
                  type="number"
                  min={10}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="22"
                  className="clay-input mt-1.5 rounded-2xl border-0 px-4 shadow-none focus-visible:ring-0 dark:bg-transparent"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <GraduationCap className="mr-1 inline size-3" /> Education
                </label>
                <select
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="clay-input mt-1.5 h-9 w-full rounded-2xl px-3 text-sm font-semibold outline-none"
                >
                  {EDUCATION_LEVELS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Experience level
                </label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="clay-input mt-1.5 h-9 w-full rounded-2xl px-3 text-sm font-semibold outline-none"
                >
                  {EXPERIENCE_LEVELS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {accountType === "volunteer" ? "About you" : "About the organization"}
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={
                accountType === "volunteer"
                  ? "A couple of lines about who you are and why you volunteer…"
                  : "What does your organization do, and who does it serve?"
              }
              className="clay-input mt-1.5 min-h-24 rounded-2xl border-0 px-4 py-3 shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
        </div>
      </ClayCard>

      {/* Volunteer-only sections */}
      {accountType === "volunteer" && (
        <>
          <ClayCard className="mt-5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold">Interests</h2>
                <p className="text-sm text-muted-foreground">
                  Pick a few — these drive your recommendations.
                </p>
              </div>
              <ClayChip className="bg-butter/70 text-[#6b4e12]">{interests.length} selected</ClayChip>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {INTERESTS.map((item) => (
                <PillToggle
                  key={item}
                  label={item}
                  active={interests.includes(item)}
                  onClick={() => toggle(interests, setInterests, item)}
                  activeClass="bg-peach text-[#7c2d12]"
                />
              ))}
            </div>
          </ClayCard>

          <ClayCard className="mt-5 p-6">
            <h2 className="font-display text-lg font-bold">Skills I can offer</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {SKILLS.map((item) => (
                <PillToggle
                  key={item}
                  label={item}
                  active={skills.includes(item)}
                  onClick={() => toggle(skills, setSkills, item)}
                  activeClass="bg-mint text-[#22503a]"
                />
              ))}
            </div>
          </ClayCard>

          <ClayCard className="mt-5 p-6">
            <h2 className="font-display text-lg font-bold">Availability</h2>
            <p className="text-sm text-muted-foreground">How often can you help out?</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {AVAILABILITY.map((opt) => (
                <PillToggle
                  key={opt}
                  label={opt}
                  active={availability === opt}
                  onClick={() => setAvailability(opt)}
                  activeClass="bg-sky text-[#1e3a52]"
                />
              ))}
            </div>
          </ClayCard>
        </>
      )}

      <div className="sticky bottom-4 z-20 mt-6">
        <ClayCard className="flex items-center justify-between gap-3 p-3 pl-5">
          <p className="text-sm text-muted-foreground">
            <UserRound className="mr-1 inline size-4" />
            {accountType === "volunteer"
              ? `${interests.length} interests · ${skills.length} skills`
              : "Organization profile"}
          </p>
          <ClayButton onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : (<><Save /> Save profile</>)}
          </ClayButton>
        </ClayCard>
      </div>
    </AppShell>
  );
}

function TypeCard({
  active,
  onClick,
  icon: Icon,
  title,
  body,
  chipClass,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  chipClass: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`clay-press rounded-[1.25rem] p-4 text-left transition-all ${
        active ? "clay-shadow-inset bg-secondary" : "clay-shadow-sm bg-card"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`flex size-10 items-center justify-center rounded-2xl ${chipClass} shadow-inner`}>
          <Icon className="size-5" />
        </span>
        {active && (
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-3 font-display font-bold">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </button>
  );
}

function PillToggle({
  label,
  active,
  onClick,
  activeClass,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  activeClass: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`clay-chip clay-press px-3.5 py-1.5 text-xs font-bold transition-all ${
        active
          ? `${activeClass} clay-shadow-sm`
          : "bg-secondary/80 text-secondary-foreground hover:bg-secondary"
      }`}
    >
      {label}
    </button>
  );
}

import { useMutation, useQuery } from "convex/react";
import { Loader2, Save, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import {
  CATEGORIES,
  COMMITMENTS,
  DISTRICTS,
  EDUCATION_LEVELS,
  EXPERIENCE_LEVELS,
  OPPORTUNITY_TYPES,
  SKILLS,
} from "@/lib/constants";
import { ClayButton, ClayCard, ClayChip } from "@/components/clay";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function OpportunityForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const existing = useQuery(
    api.opportunities.get,
    isEdit ? { id: id as never } : "skip",
  );

  const [title, setTitle] = useState("");
  const [type, setType] = useState("Volunteer");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Education");
  const [district, setDistrict] = useState("Kigali");
  const [commitment, setCommitment] = useState("Weekly");
  const [slots, setSlots] = useState("5");
  const [targetAudience, setTargetAudience] = useState("");
  const [deadline, setDeadline] = useState("");
  const [benefits, setBenefits] = useState("");
  const [requirements, setRequirements] = useState("");
  const [applicationLink, setApplicationLink] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  // eligibility
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [education, setEducation] = useState("Any");
  const [experience, setExperience] = useState("No experience");
  const [eligDistricts, setEligDistricts] = useState<string[]>([]);
  const [eligSkills, setEligSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && existing) {
      setTitle(existing.title);
      setType(existing.type ?? "Volunteer");
      setDescription(existing.description);
      setCategory(existing.category);
      setDistrict(existing.district);
      setCommitment(existing.commitment);
      setSlots(String(existing.slots));
      setTargetAudience(existing.targetAudience ?? "");
      setDeadline(existing.deadline ? new Date(existing.deadline).toISOString().slice(0, 10) : "");
      setBenefits(existing.benefits ?? "");
      setRequirements(existing.requirements ?? "");
      setApplicationLink(existing.applicationLink ?? "");
      setSkills(existing.skills ?? []);
      const e = existing.eligibility;
      setMinAge(e?.minAge?.toString() ?? "");
      setMaxAge(e?.maxAge?.toString() ?? "");
      setEducation(e?.education ?? "Any");
      setExperience(e?.experience ?? "No experience");
      setEligDistricts(e?.districts ?? []);
      setEligSkills(e?.skills ?? []);
    }
  }, [isEdit, existing]);

  const create = useMutation(api.opportunities.create);
  const update = useMutation(api.opportunities.update);

  const buildEligibility = () => ({
    minAge: minAge ? Number(minAge) : undefined,
    maxAge: maxAge ? Number(maxAge) : undefined,
    education: education !== "Any" ? education : undefined,
    experience: experience !== "No experience" ? experience : undefined,
    districts: eligDistricts.length > 0 ? eligDistricts : undefined,
    skills: eligSkills.length > 0 ? eligSkills : undefined,
  });

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Add a title and description first");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        category,
        district,
        commitment,
        skills,
        slots: Number(slots) || 1,
        type,
        targetAudience: targetAudience || undefined,
        deadline: deadline ? new Date(deadline).getTime() : undefined,
        benefits: benefits || undefined,
        requirements: requirements || undefined,
        applicationLink: applicationLink || undefined,
        eligibility: buildEligibility(),
      };
      if (isEdit) {
        await update({ id: id as never, ...payload });
        toast.success("Opportunity updated");
      } else {
        await create(payload);
        toast.success("Opportunity posted!");
      }
      navigate("/org/opportunities");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save opportunity");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ClayCard className="p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Title *
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
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="clay-input mt-1.5 h-9 w-full rounded-2xl px-3 text-sm font-semibold outline-none"
          >
            {OPPORTUNITY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
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

        <div className="sm:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Description *
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will volunteers do? Why does it matter?"
            className="clay-input mt-1.5 min-h-28 rounded-2xl border-0 px-4 py-3 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Location (district)
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
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Application deadline (optional)
          </label>
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="clay-input mt-1.5 rounded-2xl border-0 px-4 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Target audience
          </label>
          <Input
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g. Students, young professionals, anyone 18+"
            className="clay-input mt-1.5 rounded-2xl border-0 px-4 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Benefits for volunteers
          </label>
          <Textarea
            value={benefits}
            onChange={(e) => setBenefits(e.target.value)}
            placeholder="Certificates, training, meals, transport reimbursement…"
            className="clay-input mt-1.5 min-h-20 rounded-2xl border-0 px-4 py-3 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Requirements
          </label>
          <Textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="What should applicants prepare or bring?"
            className="clay-input mt-1.5 min-h-20 rounded-2xl border-0 px-4 py-3 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            External application link (optional)
          </label>
          <Input
            type="url"
            value={applicationLink}
            onChange={(e) => setApplicationLink(e.target.value)}
            placeholder="https://your-organization.org/apply"
            className="clay-input mt-1.5 rounded-2xl border-0 px-4 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            If provided, volunteers can apply on your site — Fasha tracks clicks.
          </p>
        </div>

        {/* Skills */}
        <div className="sm:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Helpful skills
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SKILLS.map((s) => (
              <button
                key={s}
                onClick={() =>
                  setSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
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

        {/* Eligibility criteria */}
        <div className="sm:col-span-2">
          <div className="clay-shadow-inset rounded-[1.25rem] bg-secondary/40 p-4">
            <h3 className="font-display text-base font-bold">Eligibility criteria</h3>
            <p className="text-xs text-muted-foreground">
              Used to compute each applicant's match score and to recommend your
              posting to the right volunteers. Leave empty for open calls.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Min age
                </label>
                <Input
                  type="number"
                  min={10}
                  value={minAge}
                  onChange={(e) => setMinAge(e.target.value)}
                  placeholder="18"
                  className="clay-input mt-1 rounded-2xl border-0 px-3 shadow-none focus-visible:ring-0 dark:bg-transparent"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Max age
                </label>
                <Input
                  type="number"
                  min={10}
                  value={maxAge}
                  onChange={(e) => setMaxAge(e.target.value)}
                  placeholder="—"
                  className="clay-input mt-1 rounded-2xl border-0 px-3 shadow-none focus-visible:ring-0 dark:bg-transparent"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Minimum education
                </label>
                <select
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="clay-input mt-1 h-9 w-full rounded-2xl px-3 text-sm font-semibold outline-none"
                >
                  {EDUCATION_LEVELS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Minimum experience
                </label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="clay-input mt-1 h-9 w-full rounded-2xl px-3 text-sm font-semibold outline-none"
                >
                  {EXPERIENCE_LEVELS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Eligible districts (optional)
              </label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {DISTRICTS.map((d) => (
                  <button
                    key={d}
                    onClick={() =>
                      setEligDistricts((prev) =>
                        prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
                      )
                    }
                    className={`clay-chip px-2.5 py-0.5 text-[11px] font-bold transition-all ${
                      eligDistricts.includes(d)
                        ? "bg-sky text-[#1e3a52]"
                        : "bg-secondary/70 hover:bg-secondary"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Required skills (optional)
              </label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {SKILLS.map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      setEligSkills((prev) =>
                        prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
                      )
                    }
                    className={`clay-chip px-2.5 py-0.5 text-[11px] font-bold transition-all ${
                      eligSkills.includes(s)
                        ? "bg-mint text-[#22503a]"
                        : "bg-secondary/70 hover:bg-secondary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {(minAge || maxAge || education !== "Any" || experience !== "No experience" || eligDistricts.length > 0 || eligSkills.length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Preview:
                </span>
                {buildEligibility().minAge !== undefined && (
                  <ClayChip className="bg-card/80">Age {minAge}+</ClayChip>
                )}
                {buildEligibility().education && <ClayChip className="bg-card/80">{education}</ClayChip>}
                {buildEligibility().experience && <ClayChip className="bg-card/80">{experience}</ClayChip>}
                {eligDistricts.length > 0 && (
                  <ClayChip className="bg-card/80">{eligDistricts.length} districts</ClayChip>
                )}
                {eligSkills.length > 0 && <ClayChip className="bg-card/80">{eligSkills.length} skills</ClayChip>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <ClayButton
          variant="outline"
          onClick={() => navigate("/org/opportunities")}
          className="bg-secondary text-secondary-foreground"
        >
          Cancel
        </ClayButton>
        <ClayButton onClick={handleSubmit} disabled={saving} className="flex-1 sm:flex-none sm:px-8">
          {saving ? <Loader2 className="animate-spin" /> : isEdit ? <Save /> : <Send />}
          {isEdit ? "Save changes" : "Publish opportunity"}
        </ClayButton>
      </div>
    </ClayCard>
  );
}

import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Building2,
  Globe,
  ImagePlus,
  Instagram,
  Linkedin,
  MapPin,
  Save,
  ShieldCheck,
  Twitter,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { DISTRICTS } from "@/lib/constants";
import { AppShell } from "@/components/AppShell";
import { ClayButton, ClayCard, ClayChip } from "@/components/clay";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";

export default function OrgProfile() {
  const { user } = useAuth();

  const [orgName, setOrgName] = useState("");
  const [logo, setLogo] = useState("");
  const [bio, setBio] = useState("");
  const [district, setDistrict] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setOrgName(user.orgName ?? user.name ?? "");
      setLogo(user.orgLogo ?? "");
      setBio(user.bio ?? "");
      setDistrict(user.district ?? "");
      setWebsite(user.website ?? "");
      setTwitter(user.socialTwitter ?? "");
      setLinkedin(user.socialLinkedin ?? "");
      setInstagram(user.socialInstagram ?? "");
      setContactName(user.name ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  const save = useMutation(api.profiles.upsertProfile);
  const requestVerification = useMutation(api.orgs.requestVerification);

  const verification = user?.verification ?? "none";
  const isVerified = verification === "verified";

  const handleSave = async () => {
    setSaving(true);
    try {
      await save({
        accountType: "organization",
        name: contactName.trim() || orgName.trim(),
        orgName: orgName.trim(),
        orgLogo: logo.trim() || undefined,
        bio: bio.trim() || undefined,
        district: district || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        socialTwitter: twitter.trim() || undefined,
        socialLinkedin: linkedin.trim() || undefined,
        socialInstagram: instagram.trim() || undefined,
      });
      toast.success("Organization profile saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestVerification = async () => {
    try {
      await requestVerification({});
      toast.success("You're now a Verified Organization! 🎉");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not request verification");
    }
  };

  return (
    <AppShell className="max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Organization profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This is what volunteers see on your postings and profile.
        </p>
      </motion.div>

      {/* Verification card */}
      <ClayCard className="mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className={`flex size-12 items-center justify-center rounded-2xl shadow-inner ${
                isVerified ? "bg-mint" : "bg-butter"
              }`}
            >
              {isVerified ? (
                <BadgeCheck className="size-6 text-teal-700" />
              ) : (
                <ShieldCheck className="size-6 text-yellow-700" />
              )}
            </span>
            <div>
              <p className="font-display text-lg font-bold">
                {isVerified ? "Verified Organization" : "Get verified"}
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                {isVerified
                  ? "Your badge shows on every posting, building volunteer trust."
                  : "Request the Verified Organization badge to show volunteers your organization is legitimate."}
              </p>
            </div>
          </div>
          {isVerified ? (
            <ClayChip className="bg-mint px-4 py-1.5 text-sm text-teal-800">
              <BadgeCheck className="size-4" /> Active
            </ClayChip>
          ) : (
            <ClayButton onClick={handleRequestVerification}>
              <ShieldCheck /> Request verification
            </ClayButton>
          )}
        </div>
      </ClayCard>

      {/* Identity */}
      <ClayCard className="mt-5 p-6">
        <h2 className="font-display text-lg font-bold">Identity</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Organization name *
            </label>
            <Input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Umurava Youth Network"
              className="clay-input mt-1.5 rounded-2xl border-0 px-4 shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <ImagePlus className="mr-1 inline size-3" /> Logo URL (optional)
            </label>
            <Input
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="clay-input mt-1.5 rounded-2xl border-0 px-4 shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
            {logo && (
              <img
                src={logo}
                alt="Logo preview"
                className="mt-2 size-16 rounded-2xl object-cover clay-shadow-sm"
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Description
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What does your organization do, and who does it serve?"
              className="clay-input mt-1.5 min-h-24 rounded-2xl border-0 px-4 py-3 shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <MapPin className="mr-1 inline size-3" /> District (HQ)
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="clay-input mt-1.5 h-9 w-full rounded-2xl px-3 text-sm font-semibold outline-none"
            >
              <option value="">Select district…</option>
              {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Phone
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+250 7…"
              className="clay-input mt-1.5 rounded-2xl border-0 px-4 shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
        </div>
      </ClayCard>

      {/* Online presence */}
      <ClayCard className="mt-5 p-6">
        <h2 className="font-display text-lg font-bold">Online presence</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <Globe className="mr-1 inline size-3" /> Website
            </label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://your-organization.org"
              className="clay-input mt-1.5 rounded-2xl border-0 px-4 shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <Twitter className="mr-1 inline size-3" /> X / Twitter
            </label>
            <Input
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="https://x.com/yourorg"
              className="clay-input mt-1.5 rounded-2xl border-0 px-4 shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <Linkedin className="mr-1 inline size-3" /> LinkedIn
            </label>
            <Input
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/company/yourorg"
              className="clay-input mt-1.5 rounded-2xl border-0 px-4 shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <Instagram className="mr-1 inline size-3" /> Instagram
            </label>
            <Input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/yourorg"
              className="clay-input mt-1.5 rounded-2xl border-0 px-4 shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
        </div>
      </ClayCard>

      {/* Contact person */}
      <ClayCard className="mt-5 p-6">
        <h2 className="font-display text-lg font-bold">Contact person</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <Building2 className="mr-1 inline size-3" /> Name
            </label>
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Aline Uwase"
              className="clay-input mt-1.5 rounded-2xl border-0 px-4 shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Email
            </label>
            <Input
              value={user?.email ?? ""}
              disabled
              className="clay-input mt-1.5 rounded-2xl border-0 px-4 opacity-60 shadow-none"
            />
          </div>
        </div>
      </ClayCard>

      <div className="sticky bottom-4 z-20 mt-6">
        <ClayCard className="flex items-center justify-between gap-3 p-3 pl-5">
          <p className="text-sm text-muted-foreground">
            {orgName.trim() ? orgName : "Your organization"}
            {district ? ` · ${district}` : ""}
          </p>
          <ClayButton onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : (<><Save /> Save profile</>)}
          </ClayButton>
        </ClayCard>
      </div>
    </AppShell>
  );
}

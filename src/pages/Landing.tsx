import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  Compass,
  HandHeart,
  MapPin,
  Search,
  Sparkles,
  UserRoundCog,
  Users,
} from "lucide-react";
import { Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import logo from "@/assets/logo.svg";
import {
  CATEGORY_COLORS,
  ClayBlob,
  ClayButton,
  ClayCard,
  ClayChip,
} from "@/components/clay";
import { useAuth } from "@/hooks/use-auth";

const HOW_IT_WORKS = [
  {
    icon: UserRoundCog,
    color: "bg-peach",
    title: "Create your profile",
    body: "Tell us your interests, skills, district and availability. It takes two minutes.",
  },
  {
    icon: Sparkles,
    color: "bg-butter",
    title: "Get matched",
    body: "Fasha recommends programs that fit what you care about and where you live.",
  },
  {
    icon: HandHeart,
    color: "bg-mint",
    title: "Apply & connect",
    body: "Send an application with one tap. Organizations respond right in Fasha.",
  },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const featured = useQuery(api.opportunities.listFeatured, { limit: 3 }) ?? [];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* pastel clay backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <ClayBlob className="-top-28 -left-28 size-96" color="bg-peach/45" />
        <ClayBlob className="top-40 -right-40 size-[30rem]" color="bg-mint/40" />
        <ClayBlob className="bottom-0 left-1/3 size-80" color="bg-sky/35" />
        <ClayBlob className="top-[60%] right-1/4 size-40" color="bg-butter/45" />
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <header className="px-3 pt-4 sm:px-6">
          <div className="clay-surface mx-auto flex max-w-6xl items-center justify-between rounded-[1.5rem] px-4 py-2.5 sm:px-6">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="Fasha" className="size-9 rounded-xl shadow-sm" />
              <span className="font-display text-xl font-extrabold tracking-tight">Fasha</span>
            </div>
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <ClayButton asChild size="sm">
                  <Link to="/dashboard">
                    Open dashboard <ArrowRight />
                  </Link>
                </ClayButton>
              ) : (
                <>
                  <Link to="/auth">
                    <ClayButton variant="outline" size="sm">
                      Sign in
                    </ClayButton>
                  </Link>
                  <ClayButton asChild size="sm">
                    <Link to="/auth">Get started</Link>
                  </ClayButton>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pt-14 pb-10 sm:px-6 sm:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <ClayChip className="bg-butter/70 px-4 py-1.5 text-sm text-[#6b4e12]">
                🇷🇼 Made for Rwanda
              </ClayChip>
              <h1 className="mt-5 font-display text-5xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
                Give back to your{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 text-primary">community</span>
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-1 z-0 h-4 rounded-full bg-peach/60"
                  />
                </span>
                , one hour at a time.
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
                Fasha connects volunteers with organizations across Rwanda.
                Discover opportunities near you, get programs recommended for
                your interests, and apply in minutes.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ClayButton asChild size="lg" className="px-7 text-base">
                  <Link to="/auth">
                    Find opportunities <ArrowRight />
                  </Link>
                </ClayButton>
                <ClayButton asChild variant="outline" size="lg" className="px-7 text-base">
                  <Link to="/auth">I'm an organization</Link>
                </ClayButton>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="flex -space-x-2">
                    {["bg-peach", "bg-mint", "bg-sky", "bg-butter"].map((c) => (
                      <span key={c} className={`size-7 rounded-full border-2 border-card ${c}`} />
                    ))}
                  </span>
                  2,400+ volunteers
                </span>
                <span className="hidden items-center gap-1.5 sm:flex">
                  <MapPin className="size-4 text-primary" /> 30 districts
                </span>
              </div>
            </motion.div>

            {/* Hero clay card stack */}
            <motion.div
              initial={{ opacity: 0, y: 32, rotate: 2 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
              className="relative mx-auto w-full max-w-md"
            >
              <ClayCard className="rotate-2 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-sky/70 shadow-inner">
                    <Sparkles className="size-5 text-[#1e3a52]" />
                  </span>
                  <div>
                    <p className="font-display text-base font-bold">Picked for you</p>
                    <p className="text-xs text-muted-foreground">Based on your interests</p>
                  </div>
                </div>
                <div className="clay-shadow-inset mt-4 rounded-2xl bg-secondary/70 p-4">
                  <div className="flex items-center justify-between">
                    <ClayChip className="bg-butter/80 text-[#6b4e12]">Education</ClayChip>
                    <ClayChip className="bg-card/80">
                      <MapPin className="size-3" /> Musanze
                    </ClayChip>
                  </div>
                  <p className="mt-3 font-display text-lg font-bold">
                    Reading Buddy for Primary Pupils
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pair with a pupil for twice-weekly reading sessions. No teaching
                    experience needed.
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">95% match</span>
                    <ClayButton size="sm">Apply now</ClayButton>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <BellRing className="size-3.5" />
                  12 more matches waiting in your dashboard
                </div>
              </ClayCard>
              <ClayCard className="-mt-6 -rotate-3 p-4 opacity-90">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-mint/70 shadow-inner">
                    <HandHeart className="size-5 text-[#22503a]" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      Lake Kivu Shoreline Cleanup
                    </p>
                    <p className="text-xs text-muted-foreground">Saturday · Rubavu · 30 spots</p>
                  </div>
                </div>
              </ClayCard>
            </motion.div>
          </div>
        </section>

        {/* Featured opportunities */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <ClayChip className="bg-mint/70 text-[#22503a]">
                <Compass className="size-3.5" /> Live right now
              </ClayChip>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Opportunities looking for hands
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                A taste of what organizations across Rwanda are posting this week.
              </p>
            </div>
            <ClayButton asChild variant="outline">
              <Link to={isAuthenticated ? "/opportunities" : "/auth"}>
                Browse all <Search />
              </Link>
            </ClayButton>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
      {featured.length === 0 &&
        [0, 1, 2].map((i) => (
          <ClayCard key={i} className="h-48 animate-pulse p-6">
            <span />
          </ClayCard>
        ))}
            {featured.map((opp, i) => (
              <motion.div
                key={opp._id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <ClayCard interactive className="flex h-full flex-col p-6">
                  <div className="flex items-center justify-between">
                    <ClayChip className={CATEGORY_COLORS[opp.category] ?? "bg-secondary"}>
                      {opp.category}
                    </ClayChip>
                    <ClayChip className="bg-card/80">
                      <MapPin className="size-3" /> {opp.district}
                    </ClayChip>
                  </div>
                  <h3 className="mt-4 font-display text-xl leading-snug font-bold">
                    {opp.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {opp.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t-2 border-dashed border-border pt-4">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Users className="size-3.5" />
                      {opp.slots - opp.slotsFilled} of {opp.slots} spots left
                    </span>
                    <ClayButton asChild size="sm">
                      <Link to="/auth">Apply</Link>
                    </ClayButton>
                  </div>
                </ClayCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="text-center">
            <ClayChip className="bg-lilac/70 text-[#4a3660]">
              <CalendarDays className="size-3.5" /> How Fasha works
            </ClayChip>
            <h2 className="mx-auto mt-3 max-w-xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Three soft steps to your first volunteer day
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
              >
                <ClayCard className="relative h-full p-6 pt-8">
                  <span className="absolute -top-4 left-6 flex size-9 items-center justify-center rounded-full bg-primary font-display text-base font-extrabold text-primary-foreground shadow-md">
                    {i + 1}
                  </span>
                  <span
                    className={`flex size-12 items-center justify-center rounded-2xl ${step.color}/70 shadow-inner`}
                  >
                    <step.icon className="size-6 text-[#3d3327]" />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </ClayCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <ClayCard className="relative overflow-hidden p-10 text-center sm:p-14">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <ClayBlob className="-top-16 -left-10 size-48" color="bg-peach/50" />
              <ClayBlob className="-right-12 -bottom-16 size-56" color="bg-mint/50" />
            </div>
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Ready to make someone's week better?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                Join Fasha free — as a volunteer or an organization that needs
                helping hands.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <ClayButton asChild size="lg" className="px-8">
                  <Link to="/auth">Join Fasha</Link>
                </ClayButton>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Free forever for volunteers · Email sign-in, no passwords
              </p>
            </div>
          </ClayCard>
        </section>

        <footer className="border-t-2 border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          <span className="font-display font-bold text-foreground">Fasha</span> ·
          Volunteer connections for Rwanda 🇷🇼
        </footer>
      </div>
    </div>
  );
}

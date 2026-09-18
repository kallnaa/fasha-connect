import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Compass,
  HandHeart,
  Heart,
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
import { Button } from "@/components/ui/button";
import { ClayButton, ClayCard, ClayChip } from "@/components/clay";
import { useAuth } from "@/hooks/use-auth";

const IMG = {
  main: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=900&q=70",
  tutoring: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=700&q=70",
  group: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&q=70",
  av1: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=60",
  av2: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=60",
  av3: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=60",
  av4: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&q=60",
};

const HOW_IT_WORKS = [
  {
    icon: UserRoundCog,
    iconBg: "bg-mint text-teal-700",
    title: "Create your profile",
    body: "Tell us your interests, skills, district and availability. Two minutes, no paper forms.",
  },
  {
    icon: Sparkles,
    iconBg: "bg-peach text-rose-700",
    title: "Get smart matches",
    body: "Our recommendation system ranks programs that fit what you care about and where you live.",
  },
  {
    icon: HandHeart,
    iconBg: "bg-sky text-sky-700",
    title: "Start making an impact",
    body: "Apply in one tap, chat with the organization, and log your first volunteer day.",
  },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const featured = useQuery(api.opportunities.listFeatured, { limit: 3 }) ?? [];

  return (
    <div className="relative min-h-screen overflow-x-clip">
      {/* soft teal / rose atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="clay-blob absolute -top-32 -left-32 size-[34rem] bg-teal-200/50" />
        <div className="clay-blob absolute top-24 -right-40 size-[30rem] bg-rose-200/50" />
        <div className="clay-blob absolute top-[55%] left-1/4 size-96 bg-sky-200/40" />
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <header className="px-4 pt-4 sm:px-6">
          <div className="clay-surface mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="Fasha" className="size-9 rounded-xl" />
              <span className="font-display text-xl font-extrabold tracking-tight">Fasha</span>
            </div>
            <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground lg:flex">
              <a href="#opportunities" className="transition-colors hover:text-foreground">
                Browse Opportunities
              </a>
              <a href="#how" className="transition-colors hover:text-foreground">
                How it Works
              </a>
              <a href="#about" className="transition-colors hover:text-foreground">
                About Us
              </a>
              <Link to="/auth?role=organization" className="transition-colors hover:text-foreground">
                For Organizations
              </Link>
            </nav>
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
                    <Button variant="ghost" size="sm" className="font-bold">
                      Log In
                    </Button>
                  </Link>
                  <ClayButton asChild size="sm" className="bg-[#0f172a] text-white hover:bg-[#0f172a]/90">
                    <Link to="/auth">Sign Up</Link>
                  </ClayButton>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pt-12 pb-10 sm:px-6 sm:pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <ClayChip className="bg-teal-50 px-4 py-1.5 text-sm font-bold text-teal-800">
                🇷🇼 FOR RWANDAN YOUTH
              </ClayChip>
              <h1 className="mt-5 font-display text-5xl leading-[1.04] font-extrabold tracking-tight sm:text-6xl">
                Connect. <span className="text-primary">Give Back.</span>{" "}
                Grow.
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
                Fasha connects passionate Rwandan youth with organizations that
                need them. Find your perfect match with our smart
                recommendation system.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ClayButton asChild size="lg" className="px-7 text-base">
                  <Link to="/auth?role=volunteer">
                    Find Opportunities <ArrowRight />
                  </Link>
                </ClayButton>
                <ClayButton
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-2 border-[#0f172a]/80 bg-white px-7 text-base text-[#0f172a] shadow-none hover:bg-secondary"
                >
                  <Link to="/auth?role=organization">
                    <Building2 /> Register as Organization
                  </Link>
                </ClayButton>
              </div>
              <div className="mt-9 flex items-center gap-4">
                <span className="flex -space-x-2.5">
                  {[IMG.av1, IMG.av2, IMG.av3, IMG.av4].map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      loading="lazy"
                      className="size-9 rounded-full border-2 border-white object-cover shadow-sm"
                    />
                  ))}
                </span>
                <p className="text-sm font-medium text-muted-foreground">
                  Join <span className="font-bold text-foreground">10,000+</span> Rwandan youth
                  making a difference
                </p>
              </div>
            </motion.div>

            {/* Hero photo collage */}
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.12, ease: "easeOut" }}
              className="relative mx-auto w-full max-w-md lg:max-w-lg"
            >
              {/* main recommended card */}
              <div className="clay-shadow-lg relative overflow-hidden rounded-3xl border border-white/60">
                <img
                  src={IMG.main}
                  alt="Young Rwandan volunteers planting trees together during a community work day"
                  className="aspect-[4/3] w-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold tracking-widest text-white uppercase backdrop-blur-md">
                    Recommended for you
                  </span>
                  <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-extrabold text-white shadow-lg shadow-teal-900/30">
                    98% Match
                  </span>
                </div>
                <div className="absolute right-5 bottom-5 left-5">
                  <p className="font-display text-xl leading-snug font-extrabold text-white drop-shadow-sm">
                    Community Reforestation &amp; Planting (Kigali)
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-white/90">
                    <MapPin className="size-3.5" /> Kigali · Environment
                  </div>
                </div>
                <Heart className="absolute top-4 right-4 size-5 fill-white/90 text-white/90" />
              </div>

              {/* floating filter pills */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="clay-surface absolute -top-5 -left-6 z-10 hidden rounded-full px-4 py-2 text-sm font-bold text-teal-800 sm:flex sm:items-center sm:gap-1.5"
              >
                <span className="size-2 rounded-full bg-primary" /> Environment
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55, duration: 0.4 }}
                className="clay-surface absolute -right-4 top-1/2 z-10 hidden rounded-full px-4 py-2 text-sm font-bold text-rose-700 sm:flex sm:items-center sm:gap-1.5"
              >
                <Heart className="size-3.5 fill-rose-500 text-rose-500" /> Education
              </motion.div>

              {/* overlapping tutoring card */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="clay-surface relative z-10 mx-auto -mt-10 flex w-[88%] items-center gap-4 rounded-3xl p-4 sm:-mt-14 sm:ml-auto sm:w-[80%]"
              >
                <img
                  src={IMG.tutoring}
                  alt="Volunteer tutoring children in a community classroom"
                  className="size-20 rounded-2xl object-cover sm:size-24"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base leading-snug font-extrabold">
                    Youth Tutoring Program (Huye)
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <MapPin className="size-3" /> 1.2 km away · 14 spots left
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <ClayChip className="bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-800">
                      Education
                    </ClayChip>
                    <ClayChip className="bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                      Weekends
                    </ClayChip>
                  </div>
                </div>
                <ClayButton size="sm" className="shrink-0">
                  Apply
                </ClayButton>
              </motion.div>

              {/* small group snapshot card */}
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45, duration: 0.5 }}
                className="clay-surface absolute -bottom-8 -left-4 z-20 hidden w-44 rounded-3xl p-3 sm:block"
              >
                <img
                  src={IMG.group}
                  alt="Group of young volunteers smiling together"
                  className="aspect-[4/3] w-full rounded-2xl object-cover"
                  loading="lazy"
                />
                <p className="mt-2 px-1 pb-1 text-[11px] font-bold text-muted-foreground">
                  Umuganda · Last Saturday
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Featured opportunities */}
        <section id="opportunities" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <ClayChip className="bg-teal-50 font-bold text-teal-800">
                <Compass className="size-3.5" /> Live right now
              </ClayChip>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Opportunities looking for hands
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                A taste of what organizations across Rwanda are posting this week.
              </p>
            </div>              <ClayButton asChild variant="outline" className="border-2 border-[#0f172a]/80 bg-white text-[#0f172a] shadow-none hover:bg-secondary">
              <Link to={isAuthenticated ? "/opportunities" : "/auth?role=volunteer"}>
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
                    <ClayChip className="bg-teal-50 font-bold text-teal-800">{opp.category}</ClayChip>
                    <ClayChip className="bg-secondary font-semibold text-muted-foreground">
                      <MapPin className="size-3" /> {opp.district}
                    </ClayChip>
                  </div>
                  <h3 className="mt-4 font-display text-xl leading-snug font-bold">{opp.title}</h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {opp.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Users className="size-3.5" />
                      {opp.slots - opp.slotsFilled} of {opp.slots} spots left
                    </span>
                    <ClayButton asChild size="sm">
                      <Link to="/auth?role=volunteer">Apply</Link>
                    </ClayButton>
                  </div>
                </ClayCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6">
          <div className="text-center">
            <ClayChip className="bg-rose-50 font-bold text-rose-700">
              <CalendarDays className="size-3.5" /> How Fasha works
            </ClayChip>
            <h2 className="mx-auto mt-3 max-w-xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Three simple steps to your first volunteer day
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
                  <span className="absolute -top-4 left-6 flex size-9 items-center justify-center rounded-full bg-[#0f172a] font-display text-base font-extrabold text-white shadow-md">
                    {i + 1}
                  </span>
                  <span className={`flex size-12 items-center justify-center rounded-2xl ${step.iconBg}`}>
                    <step.icon className="size-6" />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </ClayCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* About / social proof */}
        <section id="about" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-10 sm:px-6">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="relative">
              <img
                src={IMG.group}
                alt="Rwandan youth volunteers together after community service"
                className="clay-shadow-lg aspect-[16/10] w-full rounded-3xl border border-white/60 object-cover"
                loading="lazy"
              />
              <div className="clay-surface absolute -bottom-6 left-6 flex items-center gap-3 rounded-2xl px-4 py-3">
                <BadgeCheck className="size-6 text-primary" />
                <div>
                  <p className="text-sm font-extrabold">Verified organizations</p>
                  <p className="text-xs text-muted-foreground">Reviewed before posting</p>
                </div>
              </div>
            </div>
            <div className="pt-6 lg:pt-0">
              <ClayChip className="bg-teal-50 font-bold text-teal-800">
                <Building2 className="size-3.5" /> About Fasha
              </ClayChip>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Built for Rwanda's generation of givers
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                "Fasha" means <span className="font-semibold text-foreground">to help</span>. We make it
                simple for young people in every district to find meaningful
                volunteer work — and for organizations to find the hands they
                need. Smart matching, real conversations, zero paperwork.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                {[
                  ["30", "Districts"],
                  ["10k+", "Volunteers"],
                  ["500+", "Programs"],
                ].map(([num, label]) => (
                  <div key={label} className="clay-surface rounded-2xl px-3 py-4">
                    <p className="font-display text-2xl font-extrabold text-primary">{num}</p>
                    <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-[#0f172a] px-6 py-14 text-center sm:px-14">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="clay-blob absolute -top-20 -left-16 size-64 bg-teal-500/30" />
              <div className="clay-blob absolute -right-16 -bottom-20 size-72 bg-rose-500/25" />
            </div>
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Ready to make someone's week better?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-slate-300">
                Join Fasha free — as a volunteer or an organization that needs helping hands.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ClayButton asChild size="lg" className="px-8">
                  <Link to="/auth?role=volunteer">Join Fasha</Link>
                </ClayButton>
                <ClayButton
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-2 border-white/40 bg-transparent px-8 text-white shadow-none hover:bg-white/10"
                >
                  <Link to="/auth?role=organization">Register as Organization</Link>
                </ClayButton>
              </div>
              <p className="mt-5 text-xs text-slate-400">
                Free forever for volunteers · Email sign-in, no passwords
              </p>
            </div>
          </div>
        </section>

        <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
          <span className="font-display font-bold text-foreground">Fasha</span> ·
          Volunteer connections for Rwanda 🇷🇼
        </footer>
      </div>
    </div>
  );
}

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import { DISTRICTS } from "../lib/constants";

// re-export for any convex-side consumers
export { DISTRICTS };

/** One-time demo seed: creates org accounts + opportunities if none exist yet. */
export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Sign in first");

    const existing = await ctx.db.query("opportunities").first();
    if (existing) return; // already seeded

    type OrgSpec = {
      orgName: string;
      name: string;
      email: string;
      district: string;
      bio: string;
      website: string;
    };
    const orgs: OrgSpec[] = [
      {
        orgName: "Umurava Youth Network",
        name: "Umurava Youth Network",
        email: "hello@umurava.rw",
        district: "Gasabo",
        bio: "We equip Rwandan youth with leadership, entrepreneurship and digital skills through community-led programs.",
        website: "https://umurava.rw",
      },
      {
        orgName: "Twige Tomorrow Schools",
        name: "Twige Tomorrow Schools",
        email: "info@twige.org.rw",
        district: "Musanze",
        bio: "A network of community schools improving literacy and numeracy for children in rural Rwanda.",
        website: "https://twige.org.rw",
      },
      {
        orgName: "Ubuzima Health Initiative",
        name: "Ubuzima Health Initiative",
        email: "care@ubuzima.rw",
        district: "Huye",
        bio: "We run mobile clinics, hygiene campaigns and health education in partnership with local health centers.",
        website: "https://ubuzima.rw",
      },
      {
        orgName: "Ireme Green Rwanda",
        name: "Ireme Green Rwanda",
        email: "team@ireme.rw",
        district: "Rubavu",
        bio: "Environmental conservation collective focused on tree planting, lake cleanups and climate education.",
        website: "https://ireme.rw",
      },
    ];

    const orgIds: Record<string, Id<"users">> = {};
    for (const org of orgs) {
      const id = await ctx.db.insert("users", {
        name: org.name,
        email: org.email,
        orgName: org.orgName,
        bio: org.bio,
        district: org.district,
        website: org.website,
        accountType: "organization",
        verification: "verified",
        verifiedAt: Date.now(),
        isSeeded: true,
      });
      orgIds[org.orgName] = id;
    }

    type OppSpec = {
      org: string;
      title: string;
      description: string;
      category: string;
      district: string;
      commitment: string;
      skills: string[];
      slots: number;
      featured?: boolean;
      type: string;
      targetAudience: string;
      benefits: string;
      requirements: string;
      minAge?: number;
      education?: string;
      experience?: string;
      districts?: string[];
    };
    const opps: OppSpec[] = [
      {
        org: "Twige Tomorrow Schools",
        title: "Reading Buddy for Primary Pupils",
        description:
          "Pair with a primary 3–5 pupil for twice-weekly reading sessions in Kinyarwanda or English. You'll follow a simple phonics guide we provide — no teaching experience needed, just patience and enthusiasm.",
        category: "Education",
        district: "Musanze",
        commitment: "Weekly",
        skills: ["Teaching", "Public Speaking"],
        slots: 8,
        featured: true,
        type: "Volunteer",
        targetAudience: "Youth 18–30, students, anyone who loves reading",
        benefits: "Training certificate, teaching materials provided, transport reimbursement",
        requirements: "Patience, basic Kinyarwanda or English, commit 2 afternoons/week",
        minAge: 18,
      },
      {
        org: "Ubuzima Health Initiative",
        title: "Community Health Outreach Volunteer",
        description:
          "Join our mobile clinic days in the hills around Huye: register families, check blood pressure, run hand-washing demos and help distribute mosquito nets. Training provided on day one.",
        category: "Health",
        district: "Huye",
        commitment: "Monthly",
        skills: ["First Aid", "Translation"],
        slots: 12,
        featured: true,
        type: "Volunteer",
        targetAudience: "Nursing/public-health students and volunteers",
        benefits: "First-aid certification, meals on clinic days, reference letter",
        requirements: "First Aid basics preferred, comfortable walking hilly terrain",
        minAge: 18,
        education: "O-Level / A2",
      },
      {
        org: "Ireme Green Rwanda",
        title: "Lake Kivu Shoreline Cleanup Crew",
        description:
          "Saturday cleanups along Rubavu's shoreline followed by sorting and recycling demos. Gloves, bags and juice included — bring sunscreen and friends!",
        category: "Environment",
        district: "Rubavu",
        commitment: "Weekly",
        skills: [],
        slots: 30,
        featured: true,
        type: "Event Support",
        targetAudience: "Everyone — families welcome",
        benefits: "Snacks, gloves & bags provided, community certificate",
        requirements: "None — just show up with energy",
      },
      {
        org: "Umurava Youth Network",
        title: "Intro to Coding Mentor",
        description:
          "Guide a small group of teens through their first HTML/CSS projects during our 6-week digital skills bootcamp. We provide laptops, curriculum and a mentor WhatsApp group.",
        category: "Technology",
        district: "Gasabo",
        commitment: "Weekly",
        skills: ["Web Development", "Teaching"],
        slots: 6,
        featured: true,
        type: "Fellowship",
        targetAudience: "Tech professionals, CS students, bootcamp grads",
        benefits: "Mentor training, certificate, priority access to Umurava events",
        requirements: "HTML/CSS basics, 1 afternoon per week for 6 weeks",
        minAge: 20,
        experience: "Some experience",
      },
      {
        org: "Umurava Youth Network",
        title: "Youth Career Day Speaker",
        description:
          "Share your career journey with 200+ secondary students at our quarterly career day. 20-minute talks plus Q&A — engineers, nurses, farmers, artists, everyone has a story.",
        category: "Community",
        district: "Gasabo",
        commitment: "One-time",
        skills: ["Public Speaking"],
        slots: 15,
        type: "Volunteer",
        targetAudience: "Working professionals of any field",
        benefits: "Speaker feature on our socials, networking lunch",
        requirements: "Willingness to share your story publicly",
        minAge: 22,
        experience: "Some experience",
      },
      {
        org: "Ubuzima Health Initiative",
        title: "Malaria Net Distribution Helper",
        description:
          "Help us deliver and hang insecticide-treated nets in households in Gisagara. Walking routes, lifting nets, and a big smile required.",
        category: "Health",
        district: "Gisagara",
        commitment: "One-time",
        skills: [],
        slots: 20,
        type: "Event Support",
        targetAudience: "Anyone 16+ who can walk 5km",
        benefits: "Lunch, community service hours",
        requirements: "Physical fitness for rural routes",
        minAge: 16,
      },
      {
        org: "Ireme Green Rwanda",
        title: "Tree Nursery Assistant",
        description:
          "Pot seedlings, water beds and track germination data at our community tree nursery on the shores of Lake Kivu. Great for agronomy students.",
        category: "Agriculture",
        district: "Rubavu",
        commitment: "Ongoing",
        skills: [],
        slots: 10,
        type: "Internship",
        targetAudience: "Agronomy & environmental students",
        benefits: "Field experience, data-skills training, recommendation letter",
        requirements: "Interest in agroforestry, 2 mornings/week",
        education: "A-Level / A2 done",
      },
      {
        org: "Twige Tomorrow Schools",
        title: "Girls' STEM Club Facilitator",
        description:
          "Lead fun Saturday experiments and puzzles with our girls' STEM club in Musanze. We have a kit library — volcanoes, circuits, and paper math games.",
        category: "Education",
        district: "Musanze",
        commitment: "Weekly",
        skills: ["Teaching", "Event Planning"],
        slots: 4,
        type: "Volunteer",
        targetAudience: "Women in STEM strongly encouraged",
        benefits: "Facilitation training, kit budget, certificate",
        requirements: "Basic science knowledge, Saturdays 9–12",
        minAge: 19,
        education: "A-Level / A2 done",
      },
      {
        org: "Umurava Youth Network",
        title: "Social Media Storyteller",
        description:
          "Shoot short videos and write captions about our volunteers in the field. Remote-friendly: we send you footage weekly if you can't travel.",
        category: "Technology",
        district: "Kigali",
        commitment: "Ongoing",
        skills: ["Social Media", "Photography", "Graphic Design"],
        slots: 3,
        type: "Volunteer",
        targetAudience: "Content creators, marketing students",
        benefits: "Portfolio pieces, creator workshops, feature credits",
        requirements: "Own smartphone, basic editing skills",
        minAge: 18,
      },
    ];

    for (const o of opps) {
      await ctx.db.insert("opportunities", {
        orgId: orgIds[o.org],
        orgName: o.org,
        title: o.title,
        description: o.description,
        category: o.category,
        district: o.district,
        commitment: o.commitment,
        skills: o.skills,
        slots: o.slots,
        slotsFilled: 0,
        status: "open",
        featured: o.featured ?? false,
        createdAt: Date.now() - Math.floor(Math.random() * 30) * 86400000,

        type: o.type,
        targetAudience: o.targetAudience,
        benefits: o.benefits,
        requirements: o.requirements,
        eligibility: {
          minAge: o.minAge,
          education: o.education,
          experience: o.experience,
          districts: o.districts,
          skills: o.skills.length > 0 ? o.skills : undefined,
        },

        views: Math.floor(Math.random() * 120) + 20,
        saves: Math.floor(Math.random() * 25),
        linkClicks: Math.floor(Math.random() * 18),
      });
    }
  },
});

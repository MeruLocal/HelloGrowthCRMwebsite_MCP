import { z } from "zod";
import { fetchYouTubeFeed, YOUTUBE_CHANNEL_ID } from "../lib/youtube-feed.js";
import { defineTool, ok } from "./tool-types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Static data — READ-MIRROR of website media sources.
// Source: hellocrmwebsite/src/lib/home-youtube-videos.ts — SYNCED_AT 2026-07-08
// Source: hellocrmwebsite/src/lib/youtube-videos.ts — SYNCED_AT 2026-07-08
//   (merge/sort helpers; live channel feed merged at runtime on the website)
// Source: hellocrmwebsite/src/lib/home-testimonials.ts — SYNCED_AT 2026-07-08
// Source: hellocrmwebsite/src/lib/video-testimonials.ts — SYNCED_AT 2026-07-08
//   (Supabase-backed — no static rows in the repo; shape mirrored below)
// Routes verified: /videos and /testimonials exist under src/app/(public)/.
// ─────────────────────────────────────────────────────────────────────────────

const SYNCED_AT = "2026-07-08"; // last verified against website master

// Mirrors HOME_YOUTUBE_VIDEOS (28 seeded videos, synced from the @HelloGrowthCRM
// channel — long-form uploads only, Shorts excluded; uploadDate approximate where
// the Data API was unavailable). Listed in source order (grouped: product demos,
// feature explainers, comparisons, education). On the website these are merged
// with the live YouTube channel feed (fetchHomeYouTubeFeed) and sorted newest-first.
const YOUTUBE_VIDEOS: Array<{
  id: string;
  uploadDate: string;
  title: string;
  description: string;
  badge?: string;
  tabs: string[];
}> = [
  // ── Product demos & walkthroughs ──────────────────────────────────────────
  {
    id: "lfZqyxV4MiI",
    uploadDate: "2026-05-30T12:00:00.000Z",
    title: "HelloGrowthCRM Dashboard Overview — Complete Walkthrough",
    description:
      "A full walkthrough of the HelloGrowthCRM dashboard — pipeline, leads, deals, tasks, and reporting in one AI-first workspace.",
    badge: "Featured",
    tabs: ["All Videos", "Product Demo"],
  },
  {
    id: "-C_W51utw7k",
    uploadDate: "2026-05-16T12:00:00.000Z",
    title: "HelloGrowthCRM Features Explained — AI-Powered CRM",
    description:
      "A guided tour of the core HelloGrowthCRM feature set and how its AI helps small teams sell faster.",
    badge: "New",
    tabs: ["All Videos", "Product Demo"],
  },
  {
    id: "0qnXxmOgELQ",
    uploadDate: "2026-05-13T12:00:00.000Z",
    title: "How We Built HelloGrowthCRM to Replace 5 Sales Tools",
    description:
      "Why we consolidated CRM, dialer, email, tasks, and reporting into one platform — and what it saved our own sales team.",
    tabs: ["All Videos", "Product Demo"],
  },
  {
    id: "5CKGKLVMKko",
    uploadDate: "2026-05-13T12:00:00.000Z",
    title: "HelloGrowthCRM Review — A Real Customer Speaks",
    description:
      "A HelloGrowthCRM customer shares an honest take on switching to an AI-first CRM.",
    badge: "Customer Story",
    tabs: ["All Videos", "Product Demo"],
  },

  // ── Feature explainers ────────────────────────────────────────────────────
  {
    id: "KyES69Q_Rxo",
    uploadDate: "2026-04-13T12:00:00.000Z",
    title: "AI Lead Scoring in CRM — Prioritise Your Hottest Leads",
    description:
      "See how HelloGrowthCRM's AI lead scoring ranks every lead so your team always calls the most likely buyer first.",
    badge: "AI",
    tabs: ["All Videos", "Features"],
  },
  {
    id: "fJS5XsXpcwo",
    uploadDate: "2026-05-13T12:00:00.000Z",
    title: "AI Lead Scoring Explained — Find Your Best Buyers First",
    description:
      "How AI lead scoring reads engagement signals to surface the buyers most likely to close — before your reps guess.",
    tabs: ["All Videos", "Features"],
  },
  {
    id: "auZbbW3tbeI",
    uploadDate: "2026-04-13T12:00:00.000Z",
    title: "CRM Task Boards — 6 Views to Manage Any Project",
    description:
      "Kanban, list, calendar, and more — six task-board views that keep your sales and delivery teams aligned.",
    badge: "Popular",
    tabs: ["All Videos", "Features"],
  },
  {
    id: "lwi0PWAqYlI",
    uploadDate: "2026-04-13T12:00:00.000Z",
    title: "CRM Built-In Dialer — Call Leads Without Leaving Your CRM",
    description:
      "Place and log calls straight from the deal card with HelloGrowthCRM's built-in dialer — every call recorded against the lead.",
    tabs: ["All Videos", "Features"],
  },
  {
    id: "Js5we0u4lPI",
    uploadDate: "2026-05-13T12:00:00.000Z",
    title: "Stop Losing Leads — AI CRM Automation That Boosts Conversions",
    description:
      "How automated follow-ups and AI nudges recover leads that would otherwise go cold in your pipeline.",
    tabs: ["All Videos", "Features"],
  },
  {
    id: "eUCLBdVq6Tg",
    uploadDate: "2026-05-13T12:00:00.000Z",
    title: "5 CRM Features Every Small Business Needs",
    description:
      "The five CRM capabilities most small businesses are missing — and why they matter for revenue.",
    tabs: ["All Videos", "Features"],
  },
  {
    id: "QZjO6WMZmGE",
    uploadDate: "2026-05-13T12:00:00.000Z",
    title: "How AI-Powered CRM Finds the Revenue You're Leaving on the Table",
    description:
      "AI surfaces stalled deals, neglected leads, and follow-up gaps so you capture revenue you're currently missing.",
    badge: "AI",
    tabs: ["All Videos", "Features"],
  },
  {
    id: "2ITQ6UdrbUk",
    uploadDate: "2026-04-13T12:00:00.000Z",
    title: "Your Team Is Losing Deals Because They Can't Sell From Their Phone",
    description:
      "Why a true mobile CRM matters — and how reps close more when they can update deals and call leads on the go.",
    tabs: ["All Videos", "Features"],
  },
  {
    id: "wIL_RU0xkjo",
    uploadDate: "2026-04-13T12:00:00.000Z",
    title: "CRM for Freelancers & Solopreneurs — Free Plan Walkthrough",
    description:
      "A walkthrough of the HelloGrowthCRM free plan for freelancers and solo founders managing clients single-handedly.",
    tabs: ["All Videos", "Features"],
  },

  // ── Comparisons ─────────────────────────────────────────────────────────
  {
    id: "qs_nQkG3mwQ",
    uploadDate: "2026-05-13T12:00:00.000Z",
    title: "HubSpot vs Salesforce vs HelloGrowthCRM — Honest SMB Comparison",
    description:
      "An honest, side-by-side look at HubSpot, Salesforce, and HelloGrowthCRM for small and mid-sized teams.",
    tabs: ["All Videos", "Explore More"],
  },
  {
    id: "npHjHw7eYeU",
    uploadDate: "2026-04-13T12:00:00.000Z",
    title: "HelloGrowthCRM vs HubSpot vs Monday CRM — AI Features Compared",
    description:
      "How the AI features in HelloGrowthCRM, HubSpot, and Monday CRM stack up for SMBs.",
    tabs: ["All Videos", "Explore More"],
  },
  {
    id: "JrCUenUyJYs",
    uploadDate: "2026-04-13T12:00:00.000Z",
    title: "HelloGrowthCRM vs HubSpot vs Pipedrive — Honest Comparison",
    description:
      "A practical comparison of HelloGrowthCRM, HubSpot, and Pipedrive on price, features, and ease of use.",
    tabs: ["All Videos", "Explore More"],
  },
  {
    id: "zwKUysBWstU",
    uploadDate: "2026-04-13T12:00:00.000Z",
    title: "HelloGrowthCRM vs HubSpot — Honest Comparison for Small Business",
    description:
      "HelloGrowthCRM vs HubSpot for small business — where each wins, and which fits a lean sales team.",
    tabs: ["All Videos", "Explore More"],
  },

  // ── Education & thought leadership ────────────────────────────────────────
  {
    id: "lYP3FqYoNi8",
    uploadDate: "2026-04-13T12:00:00.000Z",
    title: "What Is a CRM — And Why Every Small Business Needs One in 2026",
    description:
      "A plain-English explainer on what a CRM is and why small businesses lose money without one.",
    tabs: ["All Videos", "Explore More"],
  },
  {
    id: "CYKT9YkKRtc",
    uploadDate: "2026-04-13T12:00:00.000Z",
    title: "What Is an AI-Powered CRM — And Why Your Business Needs One",
    description:
      "How an AI-powered CRM differs from a traditional CRM, and the work it takes off your team's plate.",
    badge: "AI",
    tabs: ["All Videos", "Explore More"],
  },
  {
    id: "mH1Bqo-FKII",
    uploadDate: "2026-05-13T12:00:00.000Z",
    title: "Agentic AI in Sales — From 'Assistive' to 'Autonomous' CRM",
    description:
      "The shift from AI that assists reps to AI that acts on its own inside the CRM — and what it means for sales teams.",
    tabs: ["All Videos", "Explore More"],
  },
  {
    id: "vG4vOXvIHJM",
    uploadDate: "2026-04-13T12:00:00.000Z",
    title: "Why AI-Powered CRM Is a Game Changer for SMBs in 2026",
    description:
      "The concrete ways AI-powered CRM changes how small and mid-sized businesses sell in 2026.",
    tabs: ["All Videos", "Explore More"],
  },
  {
    id: "8X3X0Fjjkuw",
    uploadDate: "2026-05-13T12:00:00.000Z",
    title: "How AI CRM Eliminates 3 Hours of Daily Admin Work for SMBs",
    description:
      "Where AI removes the manual data entry and admin that eats three hours of a rep's day.",
    tabs: ["All Videos", "Explore More"],
  },
  {
    id: "BYCR4i9UQD8",
    uploadDate: "2026-05-13T12:00:00.000Z",
    title: "71% of Salespeople Spend More Time on Data Entry Than Selling",
    description:
      "The data-entry tax on sales teams — and how AI can simply do it for you.",
    tabs: ["All Videos", "Explore More"],
  },
  {
    id: "is4oqBvX2Ac",
    uploadDate: "2026-05-13T12:00:00.000Z",
    title: "Why 74% of Small Businesses Now Use a CRM",
    description:
      "Why CRM adoption has crossed the tipping point for small business — and what it costs to go without one.",
    tabs: ["All Videos", "Explore More"],
  },
  {
    id: "TFBQ9h-6Y-Y",
    uploadDate: "2026-04-13T12:00:00.000Z",
    title: "Why 91% of Businesses Cut Customer Acquisition Costs After This Change",
    description:
      "The one change that helped businesses lower customer acquisition cost — and how CRM enables it.",
    tabs: ["All Videos", "Explore More"],
  },
  {
    id: "qX9Dtob3qEU",
    uploadDate: "2026-05-13T12:00:00.000Z",
    title: "5 CRM Automations Every Startup Founder Should Set Up on Day 1",
    description:
      "Five automations that save startup founders hours every week from the very first day in their CRM.",
    tabs: ["All Videos", "Explore More"],
  },
  {
    id: "QS2HnshtPBQ",
    uploadDate: "2026-05-13T12:00:00.000Z",
    title: "From Spreadsheet to CRM — A Real SMB Migration Story",
    description:
      "A step-by-step look at how a small business moved off spreadsheets onto a CRM without losing data.",
    tabs: ["All Videos", "Explore More"],
  },
  {
    id: "Od9gDbXb9pQ",
    uploadDate: "2026-05-16T12:00:00.000Z",
    title: "How Shopify Store Owners Manage Customers with HelloGrowthCRM",
    description:
      "How e-commerce and Shopify store owners use HelloGrowthCRM to manage customers, orders, and repeat sales.",
    tabs: ["All Videos", "Explore More"],
  },
];

// Mirrors HOMEPAGE_TESTIMONIALS (6 quotes; shared by homepage and /reviews).
// Source comment: "Results are illustrative of typical customer experiences."
const TEXT_TESTIMONIALS: Array<{
  quote: string;
  name: string;
  role: string;
  rating: number;
  metric: string;
}> = [
  {
    quote:
      "We were tracking 400+ leads in Excel across 3 salespeople. HelloGrowthCRM's AI scoring tells us exactly who to call first — we closed 3x more deals in the first month.",
    name: "Rajesh Mehta",
    role: "Sales Director, Mehta Pharma Distributors, Mumbai",
    rating: 5,
    metric: "3x deals in month one",
  },
  {
    quote:
      "The WhatsApp integration was the dealbreaker for us. Our clients respond to WhatsApp immediately but ignore email. Now every conversation is tracked in our pipeline automatically.",
    name: "Priya Sharma",
    role: "Founder, Sharma Legal Associates, Bangalore",
    rating: 5,
    metric: "100% WhatsApp conversations tracked",
  },
  {
    quote:
      "We get leads from IndiaMART and JustDial every day but were losing half of them to slow follow-up. HelloGrowthCRM auto-assigns and triggers WhatsApp within 2 minutes. Conversions are up 50%.",
    name: "Vikram Agarwal",
    role: "Managing Director, Agarwal Steel Traders, Ahmedabad",
    rating: 5,
    metric: "50% more conversions",
  },
  {
    quote:
      "We evaluated HubSpot, Pipedrive, and Salesforce. HelloGrowthCRM gave us the same core features at a fraction of the cost — and actually works the way Indian sales teams operate.",
    name: "Siddharth Kapoor",
    role: "VP Sales, Kapoor Logistics Pvt Ltd, Delhi",
    rating: 5,
    metric: "70% cost reduction vs HubSpot",
  },
  {
    quote:
      "The AI lead scoring is genuinely useful. In our first week we identified our top 20% of coaching enquiries and conversion from enquiry to enrolment jumped from 18% to 31%.",
    name: "Ananya Krishnamurthy",
    role: "Founder, Krishnamurthy Learning Academy, Chennai",
    rating: 5,
    metric: "31% enquiry-to-enrolment rate",
  },
  {
    quote:
      "During Diwali season our enquiries tripled but our team stayed the same size. HelloGrowthCRM's automated sequences handled follow-ups overnight — we didn't miss a single lead.",
    name: "Suresh Bhatia",
    role: "Head of Sales, Bhatia Real Estate, Pune",
    rating: 5,
    metric: "Zero leads lost in peak season",
  },
];

// Mirrors the VideoTestimonial record shape from video-testimonials.ts.
// Video testimonials are stored in Supabase (table: video_testimonials) and
// fetched at request time — there are no static video-testimonial rows in the repo.
const VIDEO_TESTIMONIALS_INFO = {
  storage: "Supabase table `video_testimonials` (published + approved_for_public rows only)",
  surfaces: ["homepage (show_on_homepage)", "/testimonials wall of love (show_in_wall_of_love)", "industry pages (show_on_industry_pages)"],
  record_fields: [
    "slug",
    "customer_name",
    "customer_role",
    "customer_company",
    "customer_industry",
    "customer_location",
    "video_url",
    "video_provider (youtube | mux | cloudflare-stream)",
    "poster_url",
    "duration_seconds",
    "has_captions",
    "short_quote",
    "long_quote",
    "transcript",
    "metrics[] (label, value, delta_pct)",
    "challenge / solution / result",
    "related_feature_paths[]",
    "related_industry_slugs[]",
    "case_study_slug",
  ],
  note:
    "Video testimonial rows live in the website database, not in source files, so they cannot be mirrored statically. Browse them at https://hellogrowthcrm.com/testimonials.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Tools
// ─────────────────────────────────────────────────────────────────────────────

export const mediaListVideos = defineTool({
  schema: z.object({}),
  definition: {
    name: "media_list_videos",
    description:
      "List HelloGrowthCRM YouTube videos: product demos and walkthroughs, feature explainers (AI lead scoring, dialer, task boards), competitor comparisons, industry-specific videos, and CRM education. Merges the seeded mirror with the channel's latest uploads at request time, newest first. Returns video id, watch URL, title, description, upload date and badge.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async handle(_args) {
    // Merge seed + live channel, newest first. The seed alone had gone seven
    // weeks stale: on 2026-08-31 not one of the 15 videos in the live feed
    // appeared in it, so this tool was answering "what videos exist?" with a
    // complete-looking list that omitted every recent upload.
    const live = await fetchYouTubeFeed();

    const byId = new Map<
      string,
      { id: string; title: string; description: string; upload_date: string; badge: string | null; tabs: string[] }
    >();

    for (const v of YOUTUBE_VIDEOS) {
      byId.set(v.id, {
        id: v.id,
        title: v.title,
        description: v.description,
        upload_date: v.uploadDate,
        badge: v.badge ?? null,
        tabs: v.tabs,
      });
    }
    // Live entries win on title/description (the seed can be edited upstream),
    // but never drop the seed's curated badge/tabs for a video we already knew.
    for (const v of live) {
      const seeded = byId.get(v.id);
      byId.set(v.id, {
        id: v.id,
        title: v.title || seeded?.title || "",
        description: v.description || seeded?.description || "",
        upload_date: v.uploadDate || seeded?.upload_date || "",
        badge: seeded?.badge ?? null,
        tabs: seeded?.tabs ?? [],
      });
    }

    const videos = [...byId.values()].sort(
      (a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime(),
    );

    return ok({
      synced_at: SYNCED_AT,
      channel: "HelloGrowthCRM (YouTube)",
      channel_url: `https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}`,
      page_url: "https://hellogrowthcrm.com/videos",
      count: videos.length,
      seeded_count: YOUTUBE_VIDEOS.length,
      live_count: live.length,
      note:
        live.length > 0
          ? "Seeded mirror merged with the channel's Atom feed, which carries only the latest ~15 uploads. " +
            "The full library is at the channel URL; this list is not guaranteed exhaustive."
          : "Live channel feed unavailable — serving the seeded mirror only, which may be out of date.",
      videos: videos.map((v) => ({
        id: v.id,
        url: `https://www.youtube.com/watch?v=${v.id}`,
        title: v.title,
        description: v.description,
        upload_date: v.upload_date,
        badge: v.badge,
        tabs: v.tabs,
      })),
    });
  },
});

export const mediaListTestimonials = defineTool({
  schema: z.object({
    type: z
      .enum(["text", "video", "all"])
      .default("all")
      .describe("Which testimonials to return: 'text' (homepage quotes), 'video' (database-backed video testimonials info), or 'all' (default)."),
  }),
  definition: {
    name: "media_list_testimonials",
    description:
      "Customer testimonials for HelloGrowthCRM. Text testimonials (6 customer quotes shared by the homepage and /reviews, with author, role/company, rating, and outcome metric) are mirrored statically. Video testimonials are database-backed; this tool returns their record shape and where to browse them (/testimonials).",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["text", "video", "all"],
          default: "all",
          description: "Filter: text quotes, video testimonials, or all.",
        },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    const wantText = args.type === "text" || args.type === "all";
    const wantVideo = args.type === "video" || args.type === "all";
    return ok({
      synced_at: SYNCED_AT,
      disclaimer: "Results are illustrative of typical customer experiences (per the website source).",
      ...(wantText
        ? {
            text_testimonials: {
              source: "src/lib/home-testimonials.ts (homepage + /reviews)",
              count: TEXT_TESTIMONIALS.length,
              items: TEXT_TESTIMONIALS,
            },
          }
        : {}),
      ...(wantVideo
        ? {
            video_testimonials: {
              source: "src/lib/video-testimonials.ts (Supabase-backed)",
              page_url: "https://hellogrowthcrm.com/testimonials",
              ...VIDEO_TESTIMONIALS_INFO,
            },
          }
        : {}),
    });
  },
});

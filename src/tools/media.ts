import { z } from "zod";
import { defineTool, ok } from "./tool-types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Static data — READ-MIRROR of website media sources.
// Source: hellocrmwebsite/src/lib/home-youtube-videos.ts — SYNCED_AT 2026-06-11
// Source: hellocrmwebsite/src/lib/youtube-videos.ts — SYNCED_AT 2026-06-11
//   (merge/sort helpers; live channel feed merged at runtime on the website)
// Source: hellocrmwebsite/src/lib/home-testimonials.ts — SYNCED_AT 2026-06-11
// Source: hellocrmwebsite/src/lib/video-testimonials.ts — SYNCED_AT 2026-06-11
//   (Supabase-backed — no static rows in the repo; shape mirrored below)
// Routes verified: /videos and /testimonials exist under src/app/(public)/.
// ─────────────────────────────────────────────────────────────────────────────

const SYNCED_AT = "2026-06-11";

// Mirrors HOME_YOUTUBE_VIDEOS (5 seeded videos). On the website these are merged
// with the live YouTube channel feed (fetchHomeYouTubeFeed) and sorted newest-first;
// this mirror lists the seeded set, sorted newest-first like mergeYouTubeVideos().
const YOUTUBE_VIDEOS: Array<{
  id: string;
  uploadDate: string;
  title: string;
  description: string;
  badge?: string;
  tabs: string[];
}> = [
  {
    id: "5CKGKLVMKko",
    uploadDate: "2026-04-21T00:00:00.000Z",
    title: "HelloGrowthCRM Product Demo",
    description:
      "See how HelloGrowthCRM streamlines your sales workflow with an AI-first CRM experience — from lead capture to close.",
    badge: "Featured",
    tabs: ["All Videos", "Product Demo"],
  },
  {
    id: "zwKUysBWstU",
    uploadDate: "2026-03-25T02:30:47.000Z",
    title: "More HelloGrowthCRM in Action",
    description: "Watch another demo to explore more of the HelloGrowthCRM interface and capabilities.",
    badge: "New",
    tabs: ["All Videos", "Features"],
  },
  {
    id: "wIL_RU0xkjo",
    uploadDate: "2026-03-23T15:02:46.000Z",
    title: "Sales Pipeline & Task Boards",
    description:
      "Explore the Kanban pipeline, task boards, and calendar view that keep your sales team aligned.",
    badge: "Popular",
    tabs: ["All Videos", "Explore More"],
  },
  {
    id: "KyES69Q_Rxo",
    uploadDate: "2026-03-22T12:00:00.000Z",
    title: "Explore Core Features",
    description:
      "A quick walkthrough of AI lead scoring, built-in dialer, and email automation inside HelloGrowthCRM.",
    badge: "Watch",
    tabs: ["All Videos", "Features"],
  },
  {
    id: "auZbbW3tbeI",
    uploadDate: "2026-03-18T12:00:09.000Z",
    title: "AI Voice Agents Demo",
    description:
      "See AI voice agents qualify leads 24/7 with human-like conversations integrated directly into your CRM.",
    badge: "AI",
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
      "List HelloGrowthCRM product / YouTube videos featured on hellogrowthcrm.com (home page video section + /videos page): product demo, core features walkthrough, pipeline & task boards, and AI voice agents. Returns video id, watch URL, title, description, upload date, and badge.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async handle(_args) {
    return ok({
      synced_at: SYNCED_AT,
      channel: "HelloGrowthCRM (YouTube)",
      page_url: "https://hellogrowthcrm.com/videos",
      count: YOUTUBE_VIDEOS.length,
      note: "Seeded videos mirrored from source; the live site also merges the latest uploads from the YouTube channel feed at request time.",
      videos: YOUTUBE_VIDEOS.map((v) => ({
        id: v.id,
        url: `https://www.youtube.com/watch?v=${v.id}`,
        title: v.title,
        description: v.description,
        upload_date: v.uploadDate,
        badge: v.badge ?? null,
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

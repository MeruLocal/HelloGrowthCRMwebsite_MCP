import { z } from "zod";
import { defineTool, fail, ok } from "./tool-types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Static mirror data — READ-MIRROR of the website. Never edit values here to
// differ from the website source file; re-extract and bump SYNCED_AT instead.
//
// Source: hellocrmwebsite/src/lib/feature-guide-data.ts (FEATURE_GUIDE +
//         JOB_CATEGORIES) — SYNCED_AT 2026-06-11
// Route:  hellocrmwebsite/src/app/(public)/feature-guide/[slug]/page.tsx
//         → https://hellogrowthcrm.com/feature-guide/{slug}
// Only summary fields are mirrored (slug, name, tagline, job category,
// audience, plan, problem hook, capability section headings, deep-dive path).
// Full guide bodies (useWhen, capability descriptions, FAQs, examples) live
// on the website page itself.
// ─────────────────────────────────────────────────────────────────────────────

const GUIDES_SYNCED_AT = "2026-06-11";

type GuideCategory =
  | "capture-organize"
  | "communicate-engage"
  | "automate-scale"
  | "coach-manage-team"
  | "analyze-forecast"
  | "close-deals"
  | "ai-powered";

const GUIDE_CATEGORIES: Record<GuideCategory, string> = {
  "capture-organize": "Capture & Organise Leads",
  "communicate-engage": "Communicate & Engage",
  "automate-scale": "Automate & Scale",
  "coach-manage-team": "Coach & Manage Your Team",
  "analyze-forecast": "Analyse & Forecast",
  "close-deals": "Close Deals Faster",
  "ai-powered": "AI-Powered Selling",
};

interface GuideSummary {
  slug: string;
  name: string;
  tagline: string;
  category: GuideCategory;
  audience: string[];
  plan: "all" | "growth" | "enterprise";
  /** Source field: problem — the 1-2 sentence hook shown on hub cards. */
  description: string;
  /** Source field: capabilities[].title — the capability section headings. */
  sections: string[];
  /** Source field: deepDive — site-relative path of the full feature page. */
  deepDive: string;
}

const FEATURE_GUIDES: GuideSummary[] = [
  {
    slug: "contact-management",
    name: "Contact Management",
    tagline: "A unified record for every person and company your team sells to.",
    category: "capture-organize",
    audience: ["Sales Rep", "Sales Manager", "Operations"],
    plan: "all",
    description: "Sales teams lose deal context when relationship history is scattered across email, WhatsApp, and spreadsheets. Contact management gives every contact a single record with a complete interaction timeline — so any rep picking up a conversation has full context immediately.",
    sections: ["Contact–Account Hierarchy", "Unified Activity Timeline", "Custom Fields", "GSTIN & PAN Verification", "Duplicate Detection & Merge", "WhatsApp & Call Auto-Logging"],
    deepDive: "/features/contact-management",
  },
  {
    slug: "duplicate-detection",
    name: "Duplicate Detection",
    tagline: "Keep your CRM clean by automatically finding and merging duplicate records.",
    category: "capture-organize",
    audience: ["Operations", "Sales Manager", "Admin"],
    plan: "all",
    description: "Duplicate leads corrupt pipeline data, cause two reps to call the same person, and make attribution reports untrustworthy. Duplicate detection automatically flags matches and lets you merge them without losing any history from either record.",
    sections: ["Fuzzy Matching", "Bulk Merge", "History Preservation", "Auto-Detection on New Leads"],
    deepDive: "/features/duplicate-detection",
  },
  {
    slug: "smart-lists",
    name: "Smart Lists",
    tagline: "Dynamic saved views that automatically group leads matching any criteria you set.",
    category: "capture-organize",
    audience: ["Sales Manager", "Sales Rep", "Marketing", "Operations"],
    plan: "all",
    description: "Manually filtering leads before every campaign or standup wastes time and produces stale results. Smart Lists update automatically — the moment a contact meets or leaves your criteria, they appear or disappear from the list without anyone touching it.",
    sections: ["Any-Field Filters", "Auto-Updating Membership", "Bulk Actions on List Members", "Saved as Permanent Views"],
    deepDive: "/features/smart-lists",
  },
  {
    slug: "lead-enrichment",
    name: "Lead Enrichment",
    tagline: "Automatically fill in missing company and contact data so reps never call blind.",
    category: "capture-organize",
    audience: ["Sales Rep", "Operations", "Marketing"],
    plan: "growth",
    description: "Web form leads arrive with just a name and phone number. Reps spend minutes manually researching each contact before a call. Lead enrichment fills in company size, industry, revenue, decision-maker hierarchy, and LinkedIn profile automatically — so the rep's first call is informed.",
    sections: ["Company Data Auto-Population", "Decision-Maker Discovery", "LinkedIn Profile Matching", "GSTIN-Based Indian Business Verification"],
    deepDive: "/features/lead-enrichment",
  },
  {
    slug: "territory-management",
    name: "Territory Management",
    tagline: "Assign geographic or segment-based ownership so every lead reaches the right rep.",
    category: "capture-organize",
    audience: ["Sales Manager", "Operations", "Admin"],
    plan: "growth",
    description: "Without territory rules, leads are manually assigned by managers — creating delays, uneven workloads, and rep conflicts over accounts. Territory management automatically assigns every new lead to the correct rep based on rules you define, cutting first-response time from hours to seconds.",
    sections: ["Rule-Based Territory Definition", "Automatic Lead Assignment", "Round-Robin Within Territories", "Territory Performance Dashboard"],
    deepDive: "/features/territory-management",
  },
  {
    slug: "lead-assignment",
    name: "Lead Assignment Rules",
    tagline: "Route every incoming lead to the right rep instantly — no manager bottleneck.",
    category: "capture-organize",
    audience: ["Sales Manager", "Operations", "Admin"],
    plan: "all",
    description: "Manual lead assignment by managers creates a bottleneck. Leads wait for 15–60 minutes before a rep is notified — killing first-response rate and deal conversion. Assignment rules eliminate the bottleneck by routing leads in real time based on any criteria.",
    sections: ["Condition-Based Routing", "Round-Robin Distribution", "Load-Balanced Assignment", "Fallback Rules"],
    deepDive: "/features/lead-routing",
  },
  {
    slug: "smart-lead-routing",
    name: "Smart Lead Routing (ML-Based)",
    tagline: "Let the AI assign leads to the rep most likely to convert them — based on past win data.",
    category: "capture-organize",
    audience: ["Sales Manager", "Operations"],
    plan: "growth",
    description: "Rule-based routing assigns leads fairly but not intelligently. A lead from a SaaS startup in Bengaluru may convert better with a specific rep who has closed 12 similar accounts. ML-based routing learns from your win history to send each lead to the rep with the highest predicted close probability.",
    sections: ["Win-Rate-Based Assignment", "Explainable Assignments", "Override Controls"],
    deepDive: "/features/lead-routing",
  },
  {
    slug: "crm-dialer",
    name: "Built-in Phone Dialer",
    tagline: "Make and receive calls from inside the CRM — with every call auto-logged.",
    category: "communicate-engage",
    audience: ["Sales Rep", "Sales Manager"],
    plan: "all",
    description: "When reps use personal mobile phones or separate dialers, calls are never logged. Managers have no visibility into call volume, and reps spend 10–15 minutes per day manually entering call notes. The built-in dialer logs every call automatically with duration, outcome, and rep notes.",
    sections: ["Click-to-Call", "Inbound Call Handling", "Automatic Call Logging", "Call Recordings", "Twilio-Powered Reliability"],
    deepDive: "/product/crm-dialer",
  },
  {
    slug: "whatsapp",
    name: "WhatsApp Integration",
    tagline: "Send WhatsApp messages from inside the CRM — with every conversation auto-logged.",
    category: "communicate-engage",
    audience: ["Sales Rep", "Marketing", "Operations"],
    plan: "all",
    description: "When reps use personal WhatsApp, conversations are invisible to managers, never linked to CRM records, and lost when a rep leaves. The official Meta Cloud API integration keeps every WhatsApp thread in the CRM where it belongs.",
    sections: ["Meta-Approved Template Messaging", "File Attachments", "Conversation Auto-Logging", "Message Status Tracking", "Opt-In Management"],
    deepDive: "/product/whatsapp-sms-crm",
  },
  {
    slug: "bulk-whatsapp",
    name: "Bulk WhatsApp Campaigns",
    tagline: "Send a WhatsApp template to hundreds of contacts at once — with reply tracking in the CRM.",
    category: "communicate-engage",
    audience: ["Marketing", "Sales Manager", "Operations"],
    plan: "growth",
    description: "One-on-one WhatsApp follow-up doesn't scale to large lead lists. Bulk WhatsApp lets you run broadcast campaigns to opted-in contacts — with every reply landing back in the CRM contact timeline for reps to continue the conversation.",
    sections: ["Segment-Based Sending", "Template Variables", "Reply Thread in CRM", "Delivery & Read Analytics"],
    deepDive: "/features/bulk-whatsapp",
  },
  {
    slug: "email-integration",
    name: "Email Integration",
    tagline: "Send, receive, and track emails from inside the CRM — with AI-assisted drafting.",
    category: "communicate-engage",
    audience: ["Sales Rep", "Marketing"],
    plan: "all",
    description: "Email sent from personal inboxes is invisible to the CRM. Reps can't see whether a prospect opened a proposal, and managers have no idea which leads have received follow-up. CRM email integration keeps every message, reply, and open event in the lead record where everyone can see it.",
    sections: ["Two-Way Email Sync", "Email Open & Click Tracking", "AI Email Drafting", "Template Library", "Sequences"],
    deepDive: "/product/email-automation",
  },
  {
    slug: "bulk-sms",
    name: "Bulk SMS Campaigns",
    tagline: "Reach opted-in contacts via SMS for reminders, promotions, and re-engagement.",
    category: "communicate-engage",
    audience: ["Marketing", "Operations"],
    plan: "growth",
    description: "SMS has 98% open rates vs 20% for email — but managing bulk SMS campaigns outside the CRM means replies aren't tracked and conversations are disconnected from contact records. HelloGrowthCRM's bulk SMS keeps campaign history on the contact timeline.",
    sections: ["Segment-Based SMS", "Dynamic Variables", "Delivery & Click Analytics", "Reply Logging"],
    deepDive: "/features/bulk-sms",
  },
  {
    slug: "engagement-tracking",
    name: "Engagement Tracking",
    tagline: "Know the moment a prospect opens your email or views your proposal — and follow up at the perfect time.",
    category: "communicate-engage",
    audience: ["Sales Rep", "Sales Manager"],
    plan: "all",
    description: "Reps follow up on a schedule rather than on signals — calling two days after sending an email regardless of whether the prospect even read it. Engagement tracking shows you exactly who is reading what, so follow-up happens when the prospect is already thinking about your solution.",
    sections: ["Real-Time Open Notifications", "Link Click Tracking", "Document View Tracking", "Engagement Score"],
    deepDive: "/features/engagement-tracking",
  },
  {
    slug: "cold-outreach",
    name: "Cold Outreach Campaigns",
    tagline: "Multi-channel cold campaigns across email, LinkedIn, and WhatsApp — all tracked in one pipeline.",
    category: "communicate-engage",
    audience: ["Sales Rep", "Marketing"],
    plan: "growth",
    description: "Cold outreach across multiple channels is hard to coordinate — reps send LinkedIn messages in one tool, emails in another, and WhatsApp manually. HelloGrowthCRM sequences all three channels in one campaign, so every touchpoint is visible and automated hand-offs happen on reply.",
    sections: ["Multi-Channel Sequences", "Reply Auto-Pause", "Auto Deal Creation on Reply", "A/B Testing"],
    deepDive: "/product/cold-outreach",
  },
  {
    slug: "auto-follow-up",
    name: "Auto Follow-Up Sequences",
    tagline: "Set up automated multi-step follow-up once — let the CRM execute it for every lead.",
    category: "automate-scale",
    audience: ["Sales Rep", "Sales Manager", "Marketing"],
    plan: "all",
    description: "Reps forget to follow up, follow up too late, or follow up with generic messages. Sequences guarantee that every lead receives a consistent, timely follow-up cadence — without the rep remembering to do it.",
    sections: ["Multi-Channel Steps", "Trigger-Based Enrolment", "Reply Auto-Pause", "Delay Controls", "Sequence Analytics"],
    deepDive: "/product/auto-follow-up",
  },
  {
    slug: "workflow-automation",
    name: "Workflow Automation Builder",
    tagline: "Automate the repetitive CRM admin tasks that drain your team's selling time.",
    category: "automate-scale",
    audience: ["Operations", "Sales Manager", "Admin"],
    plan: "growth",
    description: "Reps spend 30–40% of their time on non-selling tasks: updating pipeline stages, sending internal Slack notifications, creating tasks after calls, and logging field visits. Workflow automation handles all of it automatically based on triggers you define.",
    sections: ["Visual Workflow Builder", "Triggers", "Actions", "Conditional Branches", "Audit Log"],
    deepDive: "/features/sales-automation",
  },
  {
    slug: "lead-journeys",
    name: "Lead Journeys",
    tagline: "Map the full lifecycle of a lead — from first touch to closed deal — with automatic stage transitions.",
    category: "automate-scale",
    audience: ["Operations", "Sales Manager", "Marketing"],
    plan: "growth",
    description: "Most teams have an implicit sales process that lives in the manager's head. When reps are unclear on what should happen at each stage, deals get stuck or skipped. Lead Journeys make the process explicit — defining what actions trigger a stage transition and what automated actions fire at each stage.",
    sections: ["Visual Journey Builder", "Stage-Based Automation Triggers", "Required Actions per Stage", "Journey Analytics"],
    deepDive: "/features/lead-journeys",
  },
  {
    slug: "rep-performance",
    name: "Rep Performance Dashboards",
    tagline: "See every rep's calls, emails, WhatsApps, and deals in one dashboard — updated in real time.",
    category: "coach-manage-team",
    audience: ["Sales Manager", "Leadership"],
    plan: "all",
    description: "Managers get performance data from end-of-day WhatsApp updates or weekly Excel reports. By the time a rep's activity drops, it's too late to course-correct that week. Rep performance dashboards show activity in real time — so managers can coach proactively, not reactively.",
    sections: ["Activity Counters per Rep", "Quota Attainment Tracking", "Side-by-Side Comparison", "Drill-Down to Timeline", "Scheduled PDF Reports"],
    deepDive: "/features/rep-performance",
  },
  {
    slug: "call-coaching",
    name: "Call Coaching",
    tagline: "Real-time AI hints during live calls and a post-call scorecard for every rep.",
    category: "coach-manage-team",
    audience: ["Sales Manager", "Sales Rep"],
    plan: "growth",
    description: "Traditional call coaching relies on managers listening to recordings after the fact — by which point the deal opportunity is gone. Real-time call coaching gives reps objection handling hints and competitor battle cards during the call, and gives managers a structured scorecard to review afterwards.",
    sections: ["Real-Time Objection Hints", "Competitor Battle Card Surfacing", "Talk Ratio Monitor", "Post-Call AI Scorecard", "Manager Coaching Queue"],
    deepDive: "/features/call-coaching",
  },
  {
    slug: "call-transcription",
    name: "Call Transcription",
    tagline: "Every call automatically transcribed, speaker-labelled, and searchable across your entire team.",
    category: "coach-manage-team",
    audience: ["Sales Manager", "Operations", "Sales Rep"],
    plan: "growth",
    description: "Call recordings are only useful if someone listens to them. At 50+ calls per day, no manager can review everything. Transcription converts every call to searchable text so you can search for competitor mentions, pricing objections, or commitment phrases across all calls without playing a single recording.",
    sections: ["Automatic Speaker Labels", "Searchable Transcript Library", "Key Moment Extraction", "CRM Record Linking", "Deepgram / AssemblyAI Powered"],
    deepDive: "/product/call-transcription",
  },
  {
    slug: "knowledge-base-feature",
    name: "Internal Knowledge Base",
    tagline: "Give your sales team one place for all playbooks, objection guides, and product specs — accessible mid-call.",
    category: "coach-manage-team",
    audience: ["Sales Manager", "Sales Rep", "Operations"],
    plan: "all",
    description: "Sales playbooks live in Google Drive folders reps never open, WhatsApp groups with thousands of unread messages, and senior reps' heads. New reps spend weeks piecing together how deals actually get done. The internal knowledge base centralises institutional knowledge — and makes it accessible in context during a live call or deal.",
    sections: ["In-Context Access During Calls", "Role-Based Visibility", "Rich Article Editor", "Customer-Shareable Links", "Usage Analytics", "AI Article Suggestions"],
    deepDive: "/features/knowledge-base",
  },
  {
    slug: "analytics-dashboard",
    name: "Analytics Dashboard",
    tagline: "Real-time pipeline and team activity data — so you spot problems during the week, not on Friday.",
    category: "analyze-forecast",
    audience: ["Sales Manager", "Leadership", "Operations"],
    plan: "all",
    description: "Indian sales managers typically get pipeline data from end-of-day WhatsApp reports or weekly Excel files — by which point the problems are already too late to fix. Real-time dashboards show pipeline health, rep activity, and deal alerts during the working day when action is still possible.",
    sections: ["Real-Time Pipeline View", "Rep Activity Counters", "Deal Alert Widgets", "Custom Widget Builder", "Executive Revenue Dashboard"],
    deepDive: "/features/crm-dashboard",
  },
  {
    slug: "sales-forecasting",
    name: "Sales Forecasting",
    tagline: "Predict this month's revenue from real pipeline data — not gut feel.",
    category: "analyze-forecast",
    audience: ["Sales Manager", "Leadership"],
    plan: "growth",
    description: "Revenue forecasts based on 'how confident does the rep feel about each deal' are consistently wrong. Data-driven forecasting uses pipeline stage, deal velocity, win rate by segment, and historical patterns to build a probability-weighted forecast — so you can commit a number to leadership with confidence.",
    sections: ["Probability-Weighted Pipeline", "Committed vs Best-Case vs Pipeline", "AI Forecast Adjustment", "Trend vs Prior Month"],
    deepDive: "/features/sales-forecasting",
  },
  {
    slug: "deal-velocity",
    name: "Deal Velocity & Win Rate",
    tagline: "Understand how fast deals move and where your team is winning and losing.",
    category: "analyze-forecast",
    audience: ["Sales Manager", "Leadership"],
    plan: "growth",
    description: "Managers set quotas but don't know whether their process is the bottleneck. Deal velocity analysis identifies exactly which stage deals stall, how long the average sales cycle is, and which rep or segment has the best win rate — so process improvements are data-driven.",
    sections: ["Stage-by-Stage Conversion Rates", "Average Time in Stage", "Win Rate by Segment", "Velocity Trends"],
    deepDive: "/features/deal-velocity",
  },
  {
    slug: "proposal-builder",
    name: "Proposal Generator",
    tagline: "Generate professional, branded proposals from deal data in minutes — not hours.",
    category: "close-deals",
    audience: ["Sales Rep", "Sales Manager"],
    plan: "growth",
    description: "Reps spend 2–4 hours customising proposal templates in Word or Google Docs for each deal — copy-pasting contact details, editing pricing, and reformatting. The proposal generator pulls deal data from the CRM directly and builds a formatted proposal in minutes.",
    sections: ["One-Click Proposal from Deal Record", "Branded Template Library", "Interactive Pricing Tables", "Proposal View Tracking", "E-Signature Collect"],
    deepDive: "/product/proposal-builder",
  },
  {
    slug: "digital-signatures",
    name: "Digital Signatures",
    tagline: "Collect legally binding signatures on proposals, contracts, and NDAs — without leaving the CRM.",
    category: "close-deals",
    audience: ["Sales Rep", "Operations", "Admin"],
    plan: "growth",
    description: "Printing, scanning, and emailing documents for signatures adds 1–3 days to every deal close. Digital signature collection inside the CRM removes the delay — prospects sign from any device in seconds, and the signed document is immediately attached to the deal record.",
    sections: ["Built-In Signature Collection", "Multi-Signer Support", "Audit Trail", "Signed Document Auto-Attachment"],
    deepDive: "/features/document-management",
  },
  {
    slug: "payment-processing",
    name: "Payment Processing",
    tagline: "Collect deal payments through 6 gateways — directly from a deal or proposal in the CRM.",
    category: "close-deals",
    audience: ["Sales Rep", "Operations", "Finance"],
    plan: "growth",
    description: "After a deal is signed, collecting the first payment requires a separate invoice tool, a manual payment link, and chasing the prospect — adding days to the cash collection cycle. Payment collection inside the CRM closes the loop between 'deal won' and 'payment received'.",
    sections: ["6 Payment Gateways", "One-Click Payment Link", "Payment Status Tracking", "GST Invoice Generation"],
    deepDive: "/features/payment-processing",
  },
  {
    slug: "ai-lead-scoring",
    name: "AI Lead Scoring",
    tagline: "Automatically rank every lead by close probability — so reps always work the hottest opportunities first.",
    category: "ai-powered",
    audience: ["Sales Rep", "Sales Manager"],
    plan: "growth",
    description: "When all leads look the same in a list, reps work them in arrival order — not priority order. AI lead scoring analyses 40+ signals (engagement, firmographics, deal history, behaviour) to surface the leads most likely to convert, so reps spend their limited time where it matters most.",
    sections: ["40+ Signal Analysis", "Next Best Action Suggestions", "Score Decay", "Product-Fit Analysis", "Objection Prep"],
    deepDive: "/product/ai-lead-scoring",
  },
  {
    slug: "ai-voice-agent",
    name: "AI Voice Agent",
    tagline: "Deploy a 24/7 AI that makes real two-way calls to qualify leads and handle follow-up at scale.",
    category: "ai-powered",
    audience: ["Sales Manager", "Operations"],
    plan: "enterprise",
    description: "High-volume inbound leads from IndiaMART, JustDial, or Google Ads arrive at all hours. Reps can't respond within 5 minutes every time — and delayed responses convert at a fraction of the rate. The AI Voice Agent calls every new lead within seconds of arrival, qualifies them with a real conversation, and hands off warm leads to human reps.",
    sections: ["Real Conversational AI", "Customisable Script & Persona", "CRM Knowledge Base Injection", "Auto-Transcription & CRM Update", "Warm Handoff to Human Rep"],
    deepDive: "/product/ai-voice-agents",
  },
  {
    slug: "ai-call-summaries",
    name: "AI Call Summaries",
    tagline: "Every call automatically summarised with key topics, objections, and recommended next steps.",
    category: "ai-powered",
    audience: ["Sales Rep", "Sales Manager"],
    plan: "growth",
    description: "Reps spend 5–10 minutes after each call writing notes in the CRM. With 20+ calls per day, that's 2 hours of admin work that could be selling time. AI call summaries generate and log the summary automatically — so reps move to the next call immediately.",
    sections: ["Auto-Generated Post-Call Summary", "Sentiment Analysis", "Buying Signal Detection", "Competitor Mention Tracking", "Auto-Follow-Up Task Creation"],
    deepDive: "/product/ai-sales-copilot",
  },
  {
    slug: "ai-email-composer",
    name: "AI Email Composer",
    tagline: "Generate personalised, context-aware emails from CRM data in one click.",
    category: "ai-powered",
    audience: ["Sales Rep"],
    plan: "all",
    description: "Reps spend 10–20 minutes composing each personalised follow-up email — pulling details from the contact record, tailoring tone to the conversation, and formatting. AI Email Composer does this in one click using the contact's CRM data, deal stage, and last interaction.",
    sections: ["One-Click Draft from Contact Context", "Tone Options", "Deal Stage Awareness", "Rep Stays in Control"],
    deepDive: "/product/ai-email-composer",
  },
  {
    slug: "agentic-ai",
    name: "Agentic AI Hub",
    tagline: "12 AI agents with configurable autonomy — from deal risk monitoring to voice calling — running 24/7.",
    category: "ai-powered",
    audience: ["Sales Manager", "Operations", "Leadership"],
    plan: "enterprise",
    description: "AI that only answers questions doesn't move deals forward. Agentic AI acts — it monitors pipeline for stalled deals, calls leads autonomously, transcribes calls, updates the CRM, and connects external AI tools like ChatGPT and Claude directly to your pipeline.",
    sections: ["Voice Agent", "Deal Risk Agent", "Post-Call Agent", "MCP Connector", "Three Autonomy Levels"],
    deepDive: "/agentic-ai",
  },
];

function guideUrl(slug: string): string {
  return `https://hellogrowthcrm.com/feature-guide/${slug}`;
}

// ── guides_list ─────────────────────────────────────────────────────────────────

export const guidesList = defineTool({
  schema: z.object({
    search: z
      .string()
      .optional()
      .describe("Filter guides by keyword in name, slug, tagline, category, or description (case-insensitive)."),
  }),
  definition: {
    name: "guides_list",
    description:
      "List the HelloGrowthCRM feature guides published at hellogrowthcrm.com/feature-guide — task-oriented guides grouped into 7 job categories (Capture & Organise, Communicate & Engage, Automate & Scale, Coach & Manage, Analyse & Forecast, Close Deals, AI-Powered Selling). Optionally filter by keyword.",
    inputSchema: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Keyword filter on name, slug, tagline, category, or description (case-insensitive).",
        },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    let guides = FEATURE_GUIDES;
    if (args.search) {
      const q = args.search.toLowerCase();
      guides = guides.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.slug.includes(q) ||
          g.tagline.toLowerCase().includes(q) ||
          g.category.includes(q) ||
          GUIDE_CATEGORIES[g.category].toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q),
      );
    }
    return ok({
      synced_at: GUIDES_SYNCED_AT,
      total: FEATURE_GUIDES.length,
      filtered_count: guides.length,
      categories: Object.entries(GUIDE_CATEGORIES).map(([slug, label]) => ({ slug, label })),
      guides: guides.map((g) => ({
        slug: g.slug,
        name: g.name,
        tagline: g.tagline,
        category: g.category,
        category_label: GUIDE_CATEGORIES[g.category],
        plan: g.plan,
        url: guideUrl(g.slug),
      })),
    });
  },
});

// ── guides_get ──────────────────────────────────────────────────────────────────

export const guidesGet = defineTool({
  schema: z.object({
    slug: z
      .string()
      .describe("Feature guide slug, e.g. contact-management, crm-dialer, ai-lead-scoring."),
  }),
  definition: {
    name: "guides_get",
    description:
      "Get a single feature guide summary by slug — name, tagline, job category, audience, plan availability, problem description, capability section headings, deep-dive page path, and canonical URL.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Feature guide slug." },
      },
      required: ["slug"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    const slug = args.slug.trim().toLowerCase();
    const guide = FEATURE_GUIDES.find((g) => g.slug === slug);
    if (!guide) {
      return fail(
        `Feature guide "${args.slug}" not found. Valid slugs: ${FEATURE_GUIDES.map((g) => g.slug).join(", ")}`,
      );
    }
    return ok({
      synced_at: GUIDES_SYNCED_AT,
      ...guide,
      category_label: GUIDE_CATEGORIES[guide.category],
      deep_dive_url: `https://hellogrowthcrm.com${guide.deepDive}`,
      url: guideUrl(guide.slug),
    });
  },
});

import { z } from "zod";
import { defineTool, ok } from "./tool-types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Static data — READ-MIRROR of website FAQ sources.
// Source: hellocrmwebsite/src/lib/site-faqs.ts — SYNCED_AT 2026-06-11
// Source: hellocrmwebsite/src/lib/faq-data.ts — SYNCED_AT 2026-06-11
// ─────────────────────────────────────────────────────────────────────────────

const SYNCED_AT = "2026-06-11";

/**
 * In site-faqs.ts the pricing answer is the placeholder PRICING_FAQ_PLACEHOLDER
 * ("PRICING_ANSWER") and is substituted with live pricing copy at render time.
 * We mirror that fact instead of inventing a pricing answer.
 */
const PRICING_ANSWER_NOTE =
  "(Resolved at render time from live pricing data on the website. Use the pricing_get_plans tool for current plan pricing.)";

type SiteFaqItem = {
  q: string;
  a: string;
  /** Contextual links shown after this answer on the website (from SITE_FAQ_LINKS, index-aligned). */
  links?: Array<{ text: string; href: string }>;
  /** True when the source answer is a placeholder substituted at render time. */
  placeholder?: boolean;
};

// Mirrors SITE_FAQ_ITEMS (17 items) + SITE_FAQ_LINKS merged by index.
// Shown on the homepage FAQ block and the standalone /faq page.
const SITE_FAQ_ITEMS: SiteFaqItem[] = [
  {
    q: "What is HelloGrowthCRM?",
    a: "HelloGrowthCRM, also written as HelloGrowthCRM, is the same AI-powered CRM platform with optional done-for-you revenue operations. Built by Soor LLC in the USA, it combines lead management, sales automation, and predictive analytics — and offers managed RevOps specialists who run your follow-up, pipeline hygiene, and reporting. Self-serve or fully managed, you choose.",
  },
  {
    q: "Who is HelloGrowthCRM for?",
    a: "HelloGrowthCRM is built for sales teams, small businesses, B2B companies, and founders. Whether you're a solo founder who needs someone to manage your pipeline (Growth Engine) or a 200-person sales org running enterprise pipelines (Software Only), HelloGrowthCRM scales to fit.",
  },
  {
    q: "What are Managed RevOps Specialists?",
    a: "Our Managed RevOps Specialists are trained revenue operations professionals who operate inside your HelloGrowthCRM instance. They handle lead follow-up, inbox triage, pipeline cleanup, and weekly reporting — with a same-business-day SLA.",
    links: [{ text: "Learn more about Managed RevOps", href: "/services/managed-revops" }],
  },
  {
    q: "How does HelloGrowthCRM use AI?",
    a: "HelloGrowthCRM uses AI for lead scoring, email drafting, call summarization, predictive deal forecasting, and natural-language data queries. The AI works out of the box — no configuration or technical skills required.",
  },
  {
    q: "How long does it take to set up HelloGrowthCRM?",
    a: "Most teams are up and running in under 15 minutes with the Software Only plan. For managed tiers, our team handles full CRM setup and onboarding during the first week.",
  },
  {
    q: "Can I import my leads from Excel or another CRM?",
    a: "Yes. Upload your Excel or CSV file and map columns in one step — most teams finish setup the same afternoon. HelloGrowthCRM also supports imports from Salesforce, HubSpot, and Pipedrive, and managed service tiers include free migration assistance.",
    links: [{ text: "Use our free CRM migration checklist", href: "/tools/crm-migration-checklist" }],
  },
  {
    q: "What integrations does HelloGrowthCRM support?",
    a: "HelloGrowthCRM integrates with Twilio, ElevenLabs, Google Calendar, WhatsApp, Slack, Gmail, Zapier, and more. Our webhook system connects to virtually any third-party tool.",
    links: [{ text: "See all integrations", href: "/integrations" }],
  },
  {
    q: "Is my data secure with HelloGrowthCRM?",
    a: "Yes. HelloGrowthCRM is SOC 2 Type II with AES-256 encryption at rest, TLS 1.3 in transit, and daily backups in US data centers.",
    links: [{ text: "Learn more about our security", href: "/security" }],
  },
  {
    q: "What is HelloGrowthCRM's pricing?",
    a: PRICING_ANSWER_NOTE,
    links: [{ text: "Visit pricing for details", href: "/pricing" }],
    placeholder: true,
  },
  {
    q: "How does HelloGrowthCRM compare to HubSpot or Salesforce?",
    a: "HelloGrowthCRM bundles features that HubSpot and Salesforce charge extra for — including AI insights, built-in dialer, and WhatsApp messaging — plus optional managed execution that neither competitor offers.",
    links: [{ text: "See detailed comparisons", href: "/compare" }],
  },
  {
    q: "Is HelloGrowthCRM really free?",
    a: "Yes. HelloGrowthCRM offers a genuinely free plan with up to 200 leads, pipeline Kanban, task boards, basic email templates, and scheduling. No credit card required, no time limit. Paid plans start at ₹99/user/mo with a 14-day free trial and a 14-day money-back window on annual plans (7-day on monthly renewals).",
    links: [{ text: "Start with the free plan", href: "/free-crm-for-small-business" }],
  },
  {
    q: "Is HelloGrowthCRM better than HubSpot for small business?",
    a: "For small sales teams, HelloGrowthCRM includes AI lead scoring, a built-in dialer, WhatsApp messaging, and email automation at a fraction of HubSpot's cost. Features that HubSpot charges extra for - like advanced AI, calling, and SMS - come included in HelloGrowthCRM's base plan.",
    links: [{ text: "Compare with HubSpot", href: "/compare/hubspot" }],
  },
  {
    q: "Can HelloGrowthCRM replace Salesforce?",
    a: "For small and mid-size businesses, yes. HelloGrowthCRM covers lead management, pipeline tracking, sales forecasting, email automation, and AI insights - without the enterprise complexity and pricing of Salesforce. Teams can migrate from Salesforce in minutes using our CSV import or migration assistance.",
    links: [{ text: "Compare with Salesforce", href: "/compare/salesforce" }],
  },
  {
    q: "What is the best free CRM for small business in 2026?",
    a: "HelloGrowthCRM's Free Plan is one of the best free CRMs available in 2026. It includes contact management, pipeline Kanban, task boards, email templates, and scheduling - with no credit card or time limit. For teams that need AI scoring and a dialer, the Software Only plan starts at ₹99/user/mo.",
    links: [{ text: "Explore the free CRM plan", href: "/free-crm-for-small-business" }],
  },
  {
    q: "Does HelloGrowthCRM have a built-in phone dialer?",
    a: "Yes. HelloGrowthCRM includes a Twilio-powered click-to-call dialer with automatic call logging, AI call summaries, voicemail drop, call recording, and real-time analytics - all built directly into the CRM at no extra cost.",
    links: [{ text: "See dialer features", href: "/features/built-in-dialer" }],
  },
  {
    q: "Does HelloGrowthCRM support WhatsApp and SMS?",
    a: "Yes. HelloGrowthCRM includes built-in two-way WhatsApp and SMS messaging. Send and receive messages directly from lead and contact records, create automated text sequences, and track every conversation in your CRM timeline.",
    links: [{ text: "See WhatsApp messaging", href: "/features/whatsapp-crm" }],
  },
  {
    q: "Does HelloGrowthCRM work on mobile?",
    a: "Yes — HelloGrowthCRM has iOS and Android apps with lead capture, click-to-call, and WhatsApp follow-up on the go, so field reps can log visits and managers can watch the pipeline live.",
  },
];

// Mirrors faq-data.ts — the programmatic FAQ directory (/faq/[slug] style entries).
// FAQ_CATEGORY_LABELS mirrored in full; faqData is an EMPTY array in the source
// as of SYNCED_AT, so the directory currently has zero entries.
const FAQ_DIRECTORY_CATEGORIES: Array<{ key: string; label: string }> = [
  { key: "what-is", label: "What is…" },
  { key: "how-to", label: "How to…" },
  { key: "best-for", label: "Best CRM for…" },
  { key: "comparison", label: "X vs Y" },
  { key: "does-it", label: "Does it…" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tools
// ─────────────────────────────────────────────────────────────────────────────

export const faqsGetSite = defineTool({
  schema: z.object({
    search: z
      .string()
      .optional()
      .describe("Optional keyword filter — case-insensitive match against question and answer text."),
  }),
  definition: {
    name: "faqs_get_site",
    description:
      "Site-level FAQs for hellogrowthcrm.com (homepage FAQ block + standalone /faq page): 17 Q&A pairs covering product, AI, setup, imports, integrations, security, pricing, competitor comparisons, dialer, WhatsApp/SMS, and mobile — each with the contextual links shown on the website. Also returns the programmatic FAQ directory categories (currently empty in source). Optionally filter by keyword.",
    inputSchema: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Keyword filter, matched case-insensitively against question and answer text.",
        },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    let items = SITE_FAQ_ITEMS;
    if (args.search) {
      const q = args.search.toLowerCase();
      items = items.filter(
        (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q),
      );
    }
    return ok({
      synced_at: SYNCED_AT,
      groups: [
        {
          group: "site_faq",
          source: "src/lib/site-faqs.ts (homepage FAQ block + /faq page)",
          total: SITE_FAQ_ITEMS.length,
          filtered_count: items.length,
          items,
        },
        {
          group: "faq_directory",
          source: "src/lib/faq-data.ts (programmatic FAQ directory)",
          categories: FAQ_DIRECTORY_CATEGORIES,
          entries: 0,
          note: "faqData is an empty array in the website source as of the sync date — categories exist but no directory entries are published yet.",
        },
      ],
    });
  },
});

import { z } from "zod";
import { defineTool, fail, ok } from "./tool-types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Static mirror data — READ-MIRROR of the website. Never edit values here to
// differ from the website source file; re-extract and bump SYNCED_AT instead.
//
// Source: hellocrmwebsite/src/lib/glossary-data.ts (glossaryTerms) — SYNCED_AT 2026-07-08
// Served on the website at /glossary and /glossary/[slug].
// The source has no category field; each term carries slug, term, shortDef
// (mirrored as `definition`), long-form content (not mirrored — prose), and
// relatedLinks (mirrored as `related`).
// ─────────────────────────────────────────────────────────────────────────────

const GLOSSARY_SYNCED_AT = "2026-07-08"; // last verified against website master

interface GlossaryEntry {
  slug: string;
  term: string;
  definition: string;
  related: { label: string; href: string }[];
}

const GLOSSARY_TERMS: GlossaryEntry[] = [
  {
    slug: "lead-scoring",
    term: "Lead Scoring",
    definition: "A methodology for ranking prospects based on their likelihood to convert into paying customers.",
    related: [
      { label: "AI Lead Scoring Feature", href: "/features" },
      { label: "Lead Scoring Template Tool", href: "/tools/lead-scoring-template" },
      { label: "Contact Management", href: "/glossary/contact-management" },
    ],
  },
  {
    slug: "sales-pipeline",
    term: "Sales Pipeline",
    definition: "A visual representation of where prospects are in the sales process, from initial contact to closed deal.",
    related: [
      { label: "Pipeline Calculator Tool", href: "/tools/sales-pipeline-calculator" },
      { label: "Pipeline Templates", href: "/templates" },
      { label: "Sales Pipeline Setup Guide", href: "/blog/sales-pipeline-setup-from-scratch" },
    ],
  },
  {
    slug: "crm-software",
    term: "CRM Software",
    definition: "Technology that helps businesses manage customer relationships, track interactions, and automate sales processes.",
    related: [
      { label: "HelloGrowthCRM Features", href: "/features" },
      { label: "CRM Comparison Quiz", href: "/tools/crm-comparison-quiz" },
      { label: "CRM Software", href: "/glossary/crm-software" },
    ],
  },
  {
    slug: "deal-velocity",
    term: "Deal Velocity",
    definition: "The speed at which deals move through your sales pipeline, measuring revenue generation capacity.",
    related: [
      { label: "Pipeline Calculator", href: "/tools/sales-pipeline-calculator" },
      { label: "ROI Calculator", href: "/tools/sales-roi-calculator" },
      { label: "Sales Pipeline Setup Guide", href: "/blog/sales-pipeline-setup-from-scratch" },
    ],
  },
  {
    slug: "sales-cadence",
    term: "Sales Cadence",
    definition: "A structured sequence of sales activities (calls, emails, social touches) designed to engage prospects over time.",
    related: [
      { label: "Cold Email Templates", href: "/tools/cold-email-templates" },
      { label: "Email Sequence Templates", href: "/templates" },
      { label: "Sales Script Generator", href: "/tools/sales-script-generator" },
    ],
  },
  {
    slug: "ai-lead-scoring",
    term: "AI Lead Scoring",
    definition: "Using artificial intelligence and machine learning to automatically predict which leads are most likely to convert.",
    related: [
      { label: "AI Features", href: "/features" },
      { label: "Lead Scoring Template", href: "/tools/lead-scoring-template" },
      { label: "AI Lead Scoring Guide", href: "/blog/what-is-ai-lead-scoring" },
    ],
  },
  {
    slug: "contact-management",
    term: "Contact Management",
    definition: "The process of storing, organizing, and tracking all interactions with customers and prospects in a centralized system.",
    related: [
      { label: "HelloGrowthCRM Features", href: "/features" },
      { label: "CRM Migration Checklist", href: "/tools/crm-migration-checklist" },
      { label: "CRM Software", href: "/glossary/crm-software" },
    ],
  },
  {
    slug: "sales-automation",
    term: "Sales Automation",
    definition: "Using technology to automate repetitive sales tasks like follow-ups, data entry, and lead routing.",
    related: [
      { label: "HelloGrowthCRM Features", href: "/features" },
      { label: "Sales Workflow Templates", href: "/templates" },
      { label: "Email Automation", href: "/product/email-automation" },
    ],
  },
  {
    slug: "pipeline-management",
    term: "Pipeline Management",
    definition: "The process of tracking, analyzing, and optimizing sales opportunities as they move through your pipeline stages.",
    related: [
      { label: "Pipeline Calculator", href: "/tools/sales-pipeline-calculator" },
      { label: "Pipeline Templates", href: "/templates" },
      { label: "Sales Pipeline Setup Guide", href: "/blog/sales-pipeline-setup-from-scratch" },
    ],
  },
  {
    slug: "customer-lifetime-value",
    term: "Customer Lifetime Value (CLV)",
    definition: "The total revenue a business expects to earn from a single customer account over the entire relationship.",
    related: [
      { label: "ROI Calculator", href: "/tools/sales-roi-calculator" },
      { label: "HelloGrowthCRM Pricing", href: "/pricing" },
      { label: "CRM Software", href: "/glossary/crm-software" },
    ],
  },
  {
    slug: "sales-forecasting",
    term: "Sales Forecasting",
    definition: "The process of predicting future sales revenue based on pipeline data, historical trends, and market conditions.",
    related: [
      { label: "Pipeline Calculator", href: "/tools/sales-pipeline-calculator" },
      { label: "ROI Calculator", href: "/tools/sales-roi-calculator" },
      { label: "Email Automation", href: "/product/email-automation" },
    ],
  },
  {
    slug: "inbound-vs-outbound-leads",
    term: "Inbound vs. Outbound Leads",
    definition: "Two fundamental lead generation approaches: attracting prospects through content vs. actively reaching out to them.",
    related: [
      { label: "Cold Email Templates", href: "/tools/cold-email-templates" },
      { label: "Lead Scoring Template", href: "/tools/lead-scoring-template" },
      { label: "Contact Management", href: "/glossary/contact-management" },
    ],
  },
  {
    slug: "sales-qualified-lead",
    term: "Sales Qualified Lead (SQL)",
    definition: "A prospect that has been vetted by both marketing and sales and is deemed ready for a direct sales conversation.",
    related: [
      { label: "Lead Scoring Template", href: "/tools/lead-scoring-template" },
      { label: "Contact Management", href: "/glossary/contact-management" },
      { label: "AI Lead Scoring Guide", href: "/blog/what-is-ai-lead-scoring" },
    ],
  },
  {
    slug: "account-based-selling",
    term: "Account-Based Selling",
    definition: "A strategic sales approach that treats individual target accounts as markets of one, with personalized multi-threaded engagement.",
    related: [
      { label: "HelloGrowthCRM Features", href: "/features" },
      { label: "Enterprise Pipeline Template", href: "/templates" },
      { label: "Sales Pipeline Setup Guide", href: "/blog/sales-pipeline-setup-from-scratch" },
    ],
  },
  {
    slug: "revenue-operations",
    term: "Revenue Operations (RevOps)",
    definition: "A strategic function that aligns sales, marketing, and customer success operations to drive predictable revenue growth.",
    related: [
      { label: "Managed RevOps Service", href: "/services/managed-revops" },
      { label: "ROI Calculator", href: "/tools/sales-roi-calculator" },
      { label: "Pipeline Calculator", href: "/tools/sales-pipeline-calculator" },
    ],
  },
  {
    slug: "churn-rate",
    term: "Churn Rate",
    definition: "The percentage of customers who stop using your product or cancel their subscription during a given time period.",
    related: [
      { label: "Customer Lifetime Value", href: "/glossary/customer-lifetime-value" },
      { label: "ROI Calculator", href: "/tools/sales-roi-calculator" },
      { label: "HelloGrowthCRM Features", href: "/features" },
    ],
  },
  {
    slug: "sales-enablement",
    term: "Sales Enablement",
    definition: "Providing sales teams with the content, tools, training, and insights they need to engage buyers effectively.",
    related: [
      { label: "Sales Script Generator", href: "/tools/sales-script-generator" },
      { label: "Cold Email Templates", href: "/tools/cold-email-templates" },
      { label: "HelloGrowthCRM Features", href: "/features" },
    ],
  },
  {
    slug: "crm-integration",
    term: "CRM Integration",
    definition: "Connecting your CRM with other business tools to create a seamless flow of data across your technology stack.",
    related: [
      { label: "Integrations Hub", href: "/integrations" },
      { label: "CRM Migration Checklist", href: "/tools/crm-migration-checklist" },
      { label: "HelloGrowthCRM Features", href: "/features" },
    ],
  },
  {
    slug: "sales-cycle",
    term: "Sales Cycle",
    definition: "The complete process from first contact with a prospect to closing a deal, measured in time and stages.",
    related: [
      { label: "Pipeline Calculator", href: "/tools/sales-pipeline-calculator" },
      { label: "Deal Velocity", href: "/glossary/deal-velocity" },
      { label: "Sales Pipeline Setup Guide", href: "/blog/sales-pipeline-setup-from-scratch" },
    ],
  },
  {
    slug: "crm-analytics",
    term: "CRM Analytics",
    definition: "The practice of using CRM data to generate actionable insights about sales performance, customer behavior, and revenue trends.",
    related: [
      { label: "ROI Calculator", href: "/tools/sales-roi-calculator" },
      { label: "HelloGrowthCRM Features", href: "/features" },
      { label: "Pipeline Calculator", href: "/tools/sales-pipeline-calculator" },
    ],
  },
  {
    slug: "multi-channel-outreach",
    term: "Multi-Channel Outreach",
    definition: "Engaging prospects across multiple communication channels — email, phone, social, and direct mail — in a coordinated sequence.",
    related: [
      { label: "Cold Email Templates", href: "/tools/cold-email-templates" },
      { label: "Sales Script Generator", href: "/tools/sales-script-generator" },
      { label: "Sales Cadence", href: "/glossary/sales-cadence" },
    ],
  },
  {
    slug: "crm-for-real-estate",
    term: "CRM for Real Estate",
    definition: "A customer relationship management system tailored for real estate agents, brokerages, and property management firms.",
    related: [
      { label: "Industry Solutions", href: "/industries" },
      { label: "HelloGrowthCRM Features", href: "/features" },
      { label: "Lead Scoring Template", href: "/tools/lead-scoring-template" },
    ],
  },
  {
    slug: "crm-for-insurance",
    term: "CRM for Insurance",
    definition: "A CRM system designed for insurance agents, brokerages, and carriers to manage policies, claims, and client relationships.",
    related: [
      { label: "Industry Solutions", href: "/industries" },
      { label: "HelloGrowthCRM Features", href: "/features" },
      { label: "ROI Calculator", href: "/tools/sales-roi-calculator" },
    ],
  },
  {
    slug: "crm-for-consulting",
    term: "CRM for Consulting Firms",
    definition: "A CRM platform optimized for consulting firms to manage client engagements, proposals, and business development.",
    related: [
      { label: "Industry Solutions", href: "/industries" },
      { label: "Pipeline Calculator", href: "/tools/sales-pipeline-calculator" },
      { label: "HelloGrowthCRM Features", href: "/features" },
    ],
  },
  {
    slug: "lead-nurturing",
    term: "Lead Nurturing",
    definition: "The process of building relationships with prospects who aren't yet ready to buy through targeted content and communication.",
    related: [
      { label: "Cold Email Templates", href: "/tools/cold-email-templates" },
      { label: "Email Subject Line Generator", href: "/tools/email-subject-line-generator" },
      { label: "Lead Scoring Template", href: "/tools/lead-scoring-template" },
    ],
  },
  {
    slug: "sales-territory-management",
    term: "Sales Territory Management",
    definition: "The strategic process of dividing your market into geographic or segmented territories and assigning them to sales reps.",
    related: [
      { label: "HelloGrowthCRM Features", href: "/features" },
      { label: "Pipeline Calculator", href: "/tools/sales-pipeline-calculator" },
      { label: "ROI Calculator", href: "/tools/sales-roi-calculator" },
    ],
  },
  {
    slug: "conversation-intelligence",
    term: "Conversation Intelligence",
    definition: "AI technology that records, transcribes, and analyzes sales conversations to extract coaching insights and deal signals.",
    related: [
      { label: "HelloGrowthCRM Features", href: "/features" },
      { label: "Sales Script Generator", href: "/tools/sales-script-generator" },
      { label: "AI Lead Scoring", href: "/glossary/ai-lead-scoring" },
    ],
  },
  {
    slug: "sales-kpis",
    term: "Sales KPIs",
    definition: "Key Performance Indicators that measure the effectiveness and efficiency of your sales team and processes.",
    related: [
      { label: "ROI Calculator", href: "/tools/sales-roi-calculator" },
      { label: "Pipeline Calculator", href: "/tools/sales-pipeline-calculator" },
      { label: "HelloGrowthCRM Features", href: "/features" },
    ],
  },
  {
    slug: "crm-data-hygiene",
    term: "CRM Data Hygiene",
    definition: "The practice of maintaining clean, accurate, and up-to-date data in your CRM to ensure reliable reporting and operations.",
    related: [
      { label: "CRM Migration Checklist", href: "/tools/crm-migration-checklist" },
      { label: "HelloGrowthCRM Features", href: "/features" },
      { label: "Contact Management", href: "/glossary/contact-management" },
    ],
  },
  {
    slug: "customer-acquisition-cost",
    term: "Customer Acquisition Cost (CAC)",
    definition: "The total cost required to acquire one new customer, including sales and marketing spend.",
    related: [
      { label: "CAC Calculator", href: "/tools/cac-calculator" },
      { label: "CRM ROI Calculator", href: "/tools/crm-roi-calculator" },
      { label: "How to Calculate CAC", href: "/blog/how-to-calculate-customer-acquisition-cost" },
    ],
  },
  {
    slug: "b2b-sales",
    term: "B2B Sales",
    definition: "The process of selling products or services from one business to another business.",
    related: [
      { label: "Sales Pipeline", href: "/glossary/sales-pipeline" },
      { label: "Revenue Operations", href: "/glossary/revenue-operations" },
      { label: "HelloGrowthCRM Features", href: "/features" },
    ],
  },
  {
    slug: "lead-generation",
    term: "Lead Generation",
    definition: "The process of attracting and capturing potential customers who may become future sales opportunities.",
    related: [
      { label: "Inbound vs Outbound Leads", href: "/glossary/inbound-vs-outbound-leads" },
      { label: "Lead Scoring", href: "/glossary/lead-scoring" },
      { label: "Lead Management Use Case", href: "/use-cases/lead-management" },
    ],
  },
  {
    slug: "sales-funnel",
    term: "Sales Funnel Management",
    definition: "Sales funnel management is the process of tracking, optimizing, and converting prospects through each stage — from awareness to purchase — to maximize revenue.",
    related: [
      { label: "Sales Pipeline", href: "/glossary/sales-pipeline" },
      { label: "Pipeline Management", href: "/glossary/pipeline-management" },
      { label: "Pipeline Health Score", href: "/tools/pipeline-health-score" },
      { label: "Sales Funnel CRM", href: "/topic/topic-sales-funnel-crm" },
      { label: "Funnel Leakage Tool", href: "/tools/funnel-leakage" },
    ],
  },
  {
    slug: "conversion-rate",
    term: "Conversion Rate",
    definition: "The percentage of leads, opportunities, or visitors who complete a desired action or move to the next stage.",
    related: [
      { label: "Sales Funnel", href: "/glossary/sales-funnel" },
      { label: "Sales KPIs", href: "/glossary/sales-kpis" },
      { label: "Pipeline Health Score", href: "/tools/pipeline-health-score" },
    ],
  },
  {
    slug: "sales-forecast",
    term: "Sales Forecast",
    definition: "An estimate of future revenue based on pipeline data, deal quality, and expected close timing.",
    related: [
      { label: "Sales Forecasting", href: "/glossary/sales-forecasting" },
      { label: "Pipeline Coverage", href: "/glossary/pipeline-coverage" },
      { label: "Forecast Accuracy Tool", href: "/tools/forecast-accuracy" },
    ],
  },
  {
    slug: "pipeline-coverage",
    term: "Pipeline Coverage",
    definition: "The ratio between total qualified pipeline and the revenue target it is expected to support.",
    related: [
      { label: "Pipeline Management", href: "/glossary/pipeline-management" },
      { label: "Sales Forecasting", href: "/glossary/sales-forecasting" },
      { label: "Sales Pipeline Calculator", href: "/tools/sales-pipeline-calculator" },
    ],
  },
  {
    slug: "lead-qualification",
    term: "Lead Qualification",
    definition: "The process of determining whether a lead is a good fit and ready for a meaningful sales conversation.",
    related: [
      { label: "Sales Qualified Lead", href: "/glossary/sales-qualified-lead" },
      { label: "Lead Scoring", href: "/glossary/lead-scoring" },
      { label: "Lead Scoring Template", href: "/tools/lead-scoring-template" },
    ],
  },
  {
    slug: "account-based-marketing",
    term: "Account-Based Marketing (ABM)",
    definition: "A go-to-market strategy that focuses marketing and sales efforts on a defined set of target accounts.",
    related: [
      { label: "Account-Based Selling", href: "/glossary/account-based-selling" },
      { label: "Buyer Persona", href: "/glossary/buyer-persona" },
      { label: "Buyer Persona Generator", href: "/tools/buyer-persona-generator" },
    ],
  },
  {
    slug: "buyer-persona",
    term: "Buyer Persona",
    definition: "A research-based profile representing the goals, pains, behavior, and buying role of an ideal customer segment.",
    related: [
      { label: "Account-Based Marketing", href: "/glossary/account-based-marketing" },
      { label: "Buyer Persona Generator", href: "/tools/buyer-persona-generator" },
      { label: "B2B Sales", href: "/glossary/b2b-sales" },
    ],
  },
  {
    slug: "monthly-recurring-revenue",
    term: "Monthly Recurring Revenue (MRR)",
    definition: "The predictable subscription revenue a business expects to earn each month from active customers.",
    related: [
      { label: "Annual Contract Value", href: "/glossary/annual-contract-value" },
      { label: "Customer Lifetime Value", href: "/glossary/customer-lifetime-value" },
      { label: "Revenue Goal Calculator", href: "/tools/revenue-goal-calculator" },
    ],
  },
  {
    slug: "annual-contract-value",
    term: "Annual Contract Value (ACV)",
    definition: "The average yearly revenue value of a customer contract, excluding one-time fees unless defined otherwise.",
    related: [
      { label: "Monthly Recurring Revenue", href: "/glossary/monthly-recurring-revenue" },
      { label: "Sales Forecasting", href: "/glossary/sales-forecasting" },
      { label: "CRM ROI Calculator", href: "/tools/crm-roi-calculator" },
    ],
  },
  {
    slug: "dealer-management-crm",
    term: "Dealer Management CRM",
    definition: "A CRM configured to manage relationships with dealers, distributors, and channel partners across a multi-tier distribution network.",
    related: [
      { label: "CRM for Manufacturing Companies", href: "/crm-for-manufacturing" },
      { label: "CRM for Manufacturing Companies India", href: "/crm-for-manufacturing-india" },
      { label: "Sales Pipeline", href: "/glossary/sales-pipeline" },
    ],
  },
  {
    slug: "property-management-crm",
    term: "Property Management CRM",
    definition: "A CRM used by property managers and landlords to manage tenant relationships, lease renewals, owner communication, and vacancy pipelines.",
    related: [
      { label: "CRM for Property Managers", href: "/crm-for-property-managers" },
      { label: "CRM for Real Estate", href: "/crm-for-real-estate" },
      { label: "Sales Pipeline", href: "/glossary/sales-pipeline" },
    ],
  },
  {
    slug: "patient-recall",
    term: "Patient Recall",
    definition: "The process of proactively re-engaging existing patients who are due for a follow-up visit, preventive care, or treatment continuation.",
    related: [
      { label: "CRM for Chiropractors", href: "/crm-for-chiropractors" },
      { label: "CRM for Healthcare", href: "/crm-for-healthcare" },
      { label: "Sales Cadence", href: "/glossary/sales-cadence" },
    ],
  },
  {
    slug: "managed-revops",
    term: "Managed RevOps",
    definition: "A done-for-you service where revenue-operations specialists run your sales follow-up, pipeline hygiene, and reporting inside your CRM.",
    related: [
      { label: "Managed RevOps Service", href: "/revops" },
      { label: "Managed CRM Service", href: "/managed-crm-service" },
      { label: "Revenue Operations", href: "/glossary/revenue-operations" },
    ],
  },
  {
    slug: "ai-crm",
    term: "AI CRM",
    definition: "Customer relationship management software with artificial intelligence built in to score leads, draft emails, summarize calls, and forecast deals.",
    related: [
      { label: "AI CRM Overview", href: "/ai-crm" },
      { label: "AI Deal Insights", href: "/product/ai-deal-insights" },
      { label: "CRM Software", href: "/glossary/crm-software" },
    ],
  },
  {
    slug: "crm-dialer",
    term: "CRM Dialer",
    definition: "A phone-calling tool built into the CRM so reps call leads with one click, automatically log every call, and keep call history tied to the contact.",
    related: [
      { label: "CRM Dialer", href: "/crm-dialer" },
      { label: "Sales Gamification", href: "/product/sales-gamification" },
      { label: "Sales Automation", href: "/glossary/sales-automation" },
    ],
  },
  {
    slug: "ai-agents",
    term: "AI Agents",
    definition: "Software agents inside a CRM that take routine actions automatically — drafting replies, updating records, and moving work forward without manual effort.",
    related: [
      { label: "AI Agents", href: "/product/ai-agents" },
      { label: "AI Insights", href: "/glossary/ai-insights" },
      { label: "AI CRM", href: "/glossary/ai-crm" },
    ],
  },
  {
    slug: "ai-insights",
    term: "AI Insights",
    definition: "AI-generated recommendations inside a CRM that tell sales teams what to do next — which leads to prioritize, which deals are at risk, and where pipeline is leaking.",
    related: [
      { label: "AI Deal Insights", href: "/product/ai-deal-insights" },
      { label: "Sales Forecasting", href: "/glossary/sales-forecasting" },
      { label: "AI Agents", href: "/glossary/ai-agents" },
    ],
  },
  {
    slug: "lead-routing",
    term: "Lead Routing",
    definition: "The automated process of assigning incoming leads to the right sales rep based on rules like territory, score, product, or round-robin distribution.",
    related: [
      { label: "Lead Routing", href: "/features/lead-routing" },
      { label: "Lead Management", href: "/glossary/lead-management" },
      { label: "Sales Automation", href: "/glossary/sales-automation" },
    ],
  },
  {
    slug: "sales-sequence",
    term: "Sales Sequence",
    definition: "An automated multi-step series of emails and messages that runs on a schedule until a prospect replies, keeping follow-up consistent without manual effort.",
    related: [
      { label: "Auto Follow-Up", href: "/product/auto-follow-up" },
      { label: "Email Automation", href: "/product/email-automation" },
      { label: "Sales Cadence", href: "/glossary/sales-cadence" },
    ],
  },
  {
    slug: "visitor-tracking",
    term: "Visitor Tracking",
    definition: "A CRM capability that identifies which companies and visitors are browsing your website so sales teams can follow up with warm, in-market accounts.",
    related: [
      { label: "Visitor Tracking", href: "/product/visitor-tracking" },
      { label: "Lead Generation", href: "/glossary/lead-generation" },
      { label: "Web Chat", href: "/glossary/web-chat" },
    ],
  },
  {
    slug: "quote-to-cash",
    term: "Quote-to-Cash",
    definition: "The end-to-end process of turning an opportunity into revenue — building a quote, getting it accepted, invoicing, and collecting payment — in one connected system.",
    related: [
      { label: "Proposal Builder", href: "/product/proposal-builder" },
      { label: "Payment Processing", href: "/product/payment-processing" },
      { label: "Revenue Operations", href: "/glossary/revenue-operations" },
    ],
  },
  {
    slug: "crm-workflow-automation",
    term: "CRM Workflow Automation",
    definition: "Rules and triggers inside a CRM that automatically create tasks, update records, send messages, and move work forward when defined events occur.",
    related: [
      { label: "Automation", href: "/automation" },
      { label: "Sales Automation", href: "/glossary/sales-automation" },
      { label: "Lead Routing", href: "/glossary/lead-routing" },
    ],
  },
  {
    slug: "web-chat",
    term: "Web Chat",
    definition: "A live chat widget on your website that captures visitor questions and turns conversations into CRM leads with full context for follow-up.",
    related: [
      { label: "Visitor Tracking", href: "/product/visitor-tracking" },
      { label: "Lead Generation", href: "/glossary/lead-generation" },
      { label: "Lead Management", href: "/glossary/lead-management" },
    ],
  },
  {
    slug: "sales-gamification",
    term: "Sales Gamification",
    definition: "Applying game mechanics like leaderboards, goals, and points to sales activity in a CRM to motivate reps and make performance visible.",
    related: [
      { label: "Sales Gamification", href: "/product/sales-gamification" },
      { label: "Sales KPIs", href: "/glossary/sales-kpis" },
      { label: "CRM Dialer", href: "/glossary/crm-dialer" },
    ],
  },
  {
    slug: "customer-health-score",
    term: "Customer Health Score",
    definition: "A composite score that summarizes how likely a customer is to stay, churn, or expand, based on usage, engagement, and support signals.",
    related: [
      { label: "Customer Health Score", href: "/product/customer-health-score" },
      { label: "Churn Rate", href: "/glossary/churn-rate" },
      { label: "Customer Lifetime Value", href: "/glossary/customer-lifetime-value" },
    ],
  },
  {
    slug: "lead-management",
    term: "Lead Management",
    definition: "The process of capturing, scoring, routing, and following up with leads in one system so no inquiry is lost between first contact and closed deal.",
    related: [
      { label: "Lead Finder", href: "/product/lead-finder" },
      { label: "Lead Routing", href: "/glossary/lead-routing" },
      { label: "Lead Generation", href: "/glossary/lead-generation" },
    ],
  },
];

function glossaryUrl(slug: string): string {
  return `https://hellogrowthcrm.com/glossary/${slug}`;
}

// ── glossary_list_terms ─────────────────────────────────────────────────────────

export const glossaryListTerms = defineTool({
  schema: z.object({
    search: z
      .string()
      .optional()
      .describe("Filter terms by keyword in term name, slug, or definition (case-insensitive)."),
  }),
  definition: {
    name: "glossary_list_terms",
    description:
      "List all CRM/sales glossary terms published at hellogrowthcrm.com/glossary. Each entry has a slug, term name, and one-line definition. Optionally filter by a search keyword. (The website glossary has no categories.)",
    inputSchema: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Keyword filter on term name, slug, or definition (case-insensitive).",
        },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    let terms = GLOSSARY_TERMS;
    if (args.search) {
      const q = args.search.toLowerCase();
      terms = terms.filter(
        (t) =>
          t.term.toLowerCase().includes(q) ||
          t.slug.includes(q) ||
          t.definition.toLowerCase().includes(q),
      );
    }
    return ok({
      synced_at: GLOSSARY_SYNCED_AT,
      total: GLOSSARY_TERMS.length,
      filtered_count: terms.length,
      terms: terms.map((t) => ({
        slug: t.slug,
        term: t.term,
        definition: t.definition,
        url: glossaryUrl(t.slug),
      })),
    });
  },
});

// ── glossary_get_term ───────────────────────────────────────────────────────────

export const glossaryGetTerm = defineTool({
  schema: z.object({
    slug: z
      .string()
      .describe(
        "Glossary slug (e.g. lead-scoring, sales-pipeline) or the exact term name (case-insensitive, e.g. \"Lead Scoring\").",
      ),
  }),
  definition: {
    name: "glossary_get_term",
    description:
      "Get a single glossary entry by slug (or exact term name, case-insensitive) with its definition, related links, and canonical URL.",
    inputSchema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "Glossary slug or exact term name (case-insensitive).",
        },
      },
      required: ["slug"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    const q = args.slug.trim().toLowerCase();
    const entry = GLOSSARY_TERMS.find(
      (t) => t.slug === q || t.term.toLowerCase() === q,
    );
    if (!entry) {
      return fail(
        `Glossary term "${args.slug}" not found. Valid slugs: ${GLOSSARY_TERMS.map((t) => t.slug).join(", ")}`,
      );
    }
    return ok({
      synced_at: GLOSSARY_SYNCED_AT,
      ...entry,
      url: glossaryUrl(entry.slug),
    });
  },
});

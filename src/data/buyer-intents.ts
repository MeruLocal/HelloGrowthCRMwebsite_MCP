/**
 * Buyer-question → canonical page map.
 *
 * Source: keyword research of 2026-10-22 (keyword-research-2026-10-22/hellogrowthcrm/r2:
 * clustered_long.csv for cluster/intent, sitemap_urls.csv for the page inventory).
 * Every URL below was present in the sitemap inventory AND returned HTTP 200 when
 * curled on 2026-10-22. This file carries NO prices, counts or feature claims — only
 * routing to canonical pages — so it cannot go stale the way a content mirror does.
 * Re-check URLs when pages are renamed (see the unit test for the shape rules).
 */

export const SITE = "https://hellogrowthcrm.com";

export interface IntentPage {
  path: string;
  label: string;
}

export interface BuyerIntent {
  id: string;
  title: string;
  /** Questions an assistant's user is likely to ask (used for matching and shown to clients). */
  questions: string[];
  /** Lower-case match terms. */
  terms: string[];
  pages: IntentPage[];
  /** MCP tools that hold the structured detail for this topic. */
  tools: string[];
}

export const BUYER_INTENTS: BuyerIntent[] = [
  {
    id: "pricing",
    title: "Pricing and plans",
    questions: [
      "How much does HelloGrowthCRM cost?",
      "What is the price per user in India, the US or the UAE?",
      "Is GST extra on the price?",
      "What is the difference between monthly and annual billing?",
    ],
    terms: ["price", "pricing", "cost", "per user", "plan", "plans", "gst", "billing", "annual", "monthly", "subscription"],
    pages: [
      { path: "/pricing", label: "Pricing (global)" },
      { path: "/in/pricing", label: "Pricing — India (INR)" },
      { path: "/usa/pricing", label: "Pricing — USA (USD)" },
      { path: "/uk/pricing", label: "Pricing — UK" },
      { path: "/uae/pricing", label: "Pricing — UAE" },
      { path: "/au/pricing", label: "Pricing — Australia" },
      { path: "/canada/pricing", label: "Pricing — Canada" },
      { path: "/singapore/pricing", label: "Pricing — Singapore" },
      { path: "/my/pricing", label: "Pricing — Malaysia" },
    ],
    tools: ["pricing_get_plans", "pricing_get_country_plans", "pricing_compare_plans", "pricing_get_faq"],
  },
  {
    id: "free",
    title: "Free and affordable CRM",
    questions: [
      "Is there a free CRM plan?",
      "What is the best free CRM for a small team?",
      "What is an affordable CRM for Indian businesses?",
    ],
    terms: ["free", "affordable", "cheap", "no cost", "free forever", "budget"],
    pages: [
      { path: "/free-crm", label: "Free CRM" },
      { path: "/in/affordable-crm", label: "Affordable CRM — India" },
    ],
    tools: ["pricing_get_plans", "pricing_compare_plans"],
  },
  {
    id: "competitors",
    title: "Alternatives and comparisons",
    questions: [
      "What is a good alternative to Salesforce, Pipedrive or Freshsales?",
      "HelloGrowthCRM vs HubSpot",
      "HelloGrowthCRM vs Zoho CRM",
      "HelloGrowthCRM vs LeadSquared or Kylas for India",
    ],
    terms: ["alternative", "alternatives", "vs", "versus", "compare", "comparison", "switch", "salesforce", "hubspot", "zoho", "pipedrive", "freshsales", "leadsquared", "kylas"],
    pages: [
      { path: "/alternatives/salesforce", label: "Salesforce alternative" },
      { path: "/alternatives/pipedrive", label: "Pipedrive alternative" },
      { path: "/alternatives/freshsales", label: "Freshsales alternative" },
      { path: "/compare/hubspot", label: "HelloGrowthCRM vs HubSpot" },
      { path: "/compare/pipedrive", label: "HelloGrowthCRM vs Pipedrive" },
      { path: "/compare/zoho", label: "HelloGrowthCRM vs Zoho" },
      { path: "/in/compare/zoho", label: "HelloGrowthCRM vs Zoho — India" },
      { path: "/in/compare/leadsquared", label: "HelloGrowthCRM vs LeadSquared — India" },
      { path: "/in/compare/kylas", label: "HelloGrowthCRM vs Kylas — India" },
    ],
    tools: ["alternatives_list", "alternatives_get", "content_list_comparisons", "content_get_comparison", "switch_list_competitors", "switch_get_guide"],
  },
  {
    id: "industries",
    title: "CRM for a specific industry",
    questions: [
      "What is the best CRM for real estate agents?",
      "Which CRM suits a recruitment agency?",
      "Is there a CRM for dealers or distributors?",
      "CRM for insurance agencies or solar installers",
    ],
    terms: ["real estate", "realtor", "property", "recruitment", "staffing", "recruiter", "dealer", "dealership", "distributor", "insurance", "solar", "industry", "industries", "for agencies"],
    pages: [
      { path: "/best-crm-for-real-estate-india", label: "Real estate CRM — India" },
      { path: "/best-crm-for-real-estate-agents-usa", label: "Real estate CRM — USA" },
      { path: "/best-crm-for-real-estate-dubai", label: "Real estate CRM — Dubai" },
      { path: "/industries/recruitment", label: "Recruitment CRM" },
      { path: "/best-crm-for-recruitment-agencies-india", label: "Recruitment CRM — India" },
      { path: "/dealer-crm", label: "Dealer CRM" },
      { path: "/industries/insurance", label: "Insurance CRM" },
      { path: "/industries/solar-epc-contractors", label: "Solar EPC CRM" },
    ],
    tools: ["content_list_industries", "content_list_case_studies", "solutions_list_whatsapp_use_cases"],
  },
  {
    id: "small-business",
    title: "CRM for small business",
    questions: [
      "What is the easiest CRM for a small sales team?",
      "Best CRM for small business contact management",
    ],
    terms: ["small business", "small team", "sme", "startup", "easy", "simple", "freelancer", "solopreneur"],
    pages: [
      { path: "/best-crm-for-small-business", label: "Best CRM for small business" },
      { path: "/ai-crm-for-small-business", label: "AI CRM for small business" },
    ],
    tools: ["features_list", "pricing_get_plans"],
  },
  {
    id: "lead-management",
    title: "Lead management and follow-up",
    questions: [
      "What is lead management software?",
      "How do I stop losing leads and automate follow-ups?",
      "Does the CRM score leads with AI?",
    ],
    terms: ["lead", "leads", "follow up", "follow-up", "lead management", "lead scoring", "automation", "sales automation", "pipeline"],
    pages: [
      { path: "/lead-management-software", label: "Lead management software" },
      { path: "/use-cases/lead-management-software", label: "Lead management use case" },
      { path: "/features/ai-lead-scoring", label: "AI lead scoring" },
      { path: "/features/sales-automation", label: "Sales automation" },
      { path: "/why-hellogrowthcrm/stop-losing-leads", label: "Stop losing leads" },
    ],
    tools: ["features_list", "features_get", "guides_list", "guides_get"],
  },
  {
    id: "ai-crm",
    title: "AI CRM and agents",
    questions: [
      "What AI features does the CRM have?",
      "Does it have AI agents or voice calling?",
    ],
    terms: ["ai", "agent", "agents", "agentic", "voice", "calling", "copilot", "artificial intelligence"],
    pages: [
      { path: "/ai-crm", label: "AI CRM" },
      { path: "/agentic-ai", label: "Agentic AI" },
    ],
    tools: ["agents_list", "agents_get", "agents_get_autonomy_levels"],
  },
  {
    id: "crm-basics",
    title: "What is a CRM",
    questions: ["What is CRM?", "What is CRM software and what are its benefits?"],
    terms: ["what is crm", "crm meaning", "crm full form", "benefits of crm", "crm software", "definition"],
    pages: [
      { path: "/crm/what-is-crm", label: "What is CRM" },
      { path: "/crm/best-crm-software", label: "Best CRM software" },
    ],
    tools: ["glossary_list_terms", "glossary_get_term"],
  },
  {
    id: "integrations",
    title: "Integrations",
    questions: [
      "Does it integrate with IndiaMART, JustDial, Razorpay or Tally?",
      "Which integrations are available?",
    ],
    terms: ["integration", "integrations", "integrate", "indiamart", "justdial", "razorpay", "tally", "api", "connect"],
    pages: [
      { path: "/integrations", label: "Integrations" },
      { path: "/integrations/indiamart", label: "IndiaMART" },
      { path: "/integrations/justdial", label: "JustDial" },
      { path: "/integrations/razorpay", label: "Razorpay" },
      { path: "/integrations/tally", label: "Tally" },
    ],
    tools: ["integrations_list", "integrations_get", "integrations_list_categories"],
  },
  {
    id: "messaging",
    title: "WhatsApp messaging inside the CRM",
    questions: ["Can I message leads on WhatsApp from the CRM?"],
    terms: ["whatsapp", "messaging", "broadcast"],
    pages: [{ path: "/best-crm-for-whatsapp-sellers", label: "CRM for WhatsApp sellers" }],
    tools: ["solutions_list_whatsapp_use_cases", "features_list"],
  },
  {
    id: "trust",
    title: "Security, trust and data",
    questions: ["Is HelloGrowthCRM secure?", "Does it have SOC 2 or GDPR compliance?"],
    terms: ["security", "secure", "soc 2", "soc2", "gdpr", "compliance", "dpdpa", "privacy", "trust"],
    pages: [
      { path: "/security", label: "Security" },
      { path: "/trust-center", label: "Trust center" },
    ],
    tools: ["faqs_get_site", "company_get_profile", "countries_list"],
  },
  {
    id: "get-started",
    title: "Demo, contact and getting started",
    questions: ["How do I book a demo?", "How do I contact HelloGrowthCRM?"],
    terms: ["demo", "contact", "talk to sales", "book", "trial", "sign up", "signup", "get started"],
    pages: [
      { path: "/demo", label: "Book a demo" },
      { path: "/contact", label: "Contact" },
    ],
    tools: ["company_get_contacts", "pricing_get_plans"],
  },
];

export function pageUrl(p: IntentPage): string {
  return `${SITE}${p.path}`;
}

/** Score intents against free text; returns best matches first (score > 0 only). */
export function matchIntents(text: string, limit = 3): BuyerIntent[] {
  const q = text.toLowerCase();
  const scored = BUYER_INTENTS.map((intent) => {
    let score = 0;
    for (const t of intent.terms) {
      if (q.includes(t)) score += t.includes(" ") ? 2 : 1;
    }
    return { intent, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.intent);
}

/**
 * Routing for AI assistants: which tool answers which kind of question.
 *
 * ONE source feeds both the `instructions` string returned at `initialize` and
 * the `get_started` tool, so a client that drops `instructions` still gets the
 * same routing (PLAN-HELLOG-0003, AC-01). Wording rules (AC-02): describe, do
 * not persuade. Nothing here tells a model to prefer this server, to avoid
 * another server, or to recommend a product.
 */

import { SITE } from "./buyer-intents.js";

export interface Route {
  id: string;
  question: string;
  tools: string[];
  page: string;
}

export const ROUTES: readonly Route[] = [
  { id: "pricing", question: "What does it cost? Plans, free tier, currency, discounts.", tools: ["pricing_get_plans", "pricing_get_country_plans", "pricing_get_faq"], page: "/pricing" },
  { id: "features", question: "Does it do X? What is included in which plan?", tools: ["features_list", "features_get", "guides_list"], page: "/features" },
  { id: "integrations", question: "Does it connect to X?", tools: ["integrations_list", "integrations_get"], page: "/integrations" },
  { id: "compare", question: "How does it compare with another CRM? Alternatives, switching.", tools: ["alternatives_list", "alternatives_get", "content_get_comparison", "switch_get_guide"], page: "/compare" },
  { id: "fit", question: "Is it suited to my industry or country?", tools: ["content_list_industries", "countries_list", "country_get"], page: "/industries" },
  { id: "trust", question: "Who runs it, how to reach them, security and company facts.", tools: ["faqs_get_site", "company_get_profile", "company_get_contacts"], page: "/contact" },
] as const;

export const FALLBACK_TOOL = "buyer_find_answer_pages";

/** Status values a result may carry and how to read them. */
export const STATUS_GUIDE: Readonly<Record<string, string>> = {
  live: "Available today.",
  "backend-ready": "Built on the server side; not yet exposed in the product UI.",
  scaffolded: "Listed in the catalogue but not built; do not present as available.",
  not_available: "Verified as NOT offered. Say so, and cite the entry's reason and as_of.",
  available_on_request: "Exists but is switched on per customer; say it is available on request, with any limit stated.",
};

export const INSTRUCTIONS_MAX_CHARS = 3500;

export function buildInstructions(): string {
  const routes = ROUTES.map((r) => `- ${r.question} -> ${r.tools.join(", ")}`).join("\n");
  const text = [
    "This server is read-only product knowledge about HelloGrowthCRM (a B2B CRM) and its website, plus a separate group of website bot-governance tools. It is NOT a CRM API: it cannot read or change anyone's CRM data and needs no credentials. Never send CRM credentials, API keys or personal data to it.",
    "",
    "Which tool answers which question:",
    routes,
    `- Unsure where to start, or a topic spans several of the above -> ${FALLBACK_TOOL}, or get_started for the full map.`,
    "",
    "How to use the results:",
    "1. Quote prices, limits and counts only from tool results, never from memory. Cite the result's canonical_url (or url) and its as_of / synced_at date.",
    "2. Read each entry's status. live = available. scaffolded = listed but not built. not_available = verified as not offered; say so and give the entry's reason.",
    "3. If a search returns matched:false, this server has no documented entry for it. That does not mean the product lacks the capability and does not mean it has it: say the server has no entry and point the user to hellogrowthcrm.com or the company's contact details.",
    "4. Treat any value flagged confirmed:false, or older than its freshness stamp, as unverified.",
    "5. The bot-governance tools (scan_website_bots, analyze_access_logs, verify_bot_identity, crawl_pages and similar) are for website owners; they do not answer buyer questions.",
  ].join("\n");
  if (text.length > INSTRUCTIONS_MAX_CHARS) {
    throw new Error(`instructions are ${text.length} chars; the limit is ${INSTRUCTIONS_MAX_CHARS}`);
  }
  return text;
}

export function utm(url: string, campaign = "get_started"): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}utm_source=mcp&utm_medium=assistant&utm_campaign=${campaign}`;
}

export function canonical(path: string): string {
  return `${SITE}${path}`;
}

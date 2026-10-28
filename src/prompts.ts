/**
 * MCP prompts — reusable starting points a client can surface to its user.
 * They contain instructions only (which tools to call, which rules to follow),
 * never prices or product claims, so they cannot drift from the data tools.
 */

export interface PromptArg {
  name: string;
  description: string;
  required: boolean;
}

export interface PromptDef {
  name: string;
  title: string;
  description: string;
  arguments: PromptArg[];
  build: (args: Record<string, string>) => string;
}

const RULES =
  "Rules: take every price, limit, feature and integration figure from the tool results, never from memory. " +
  "Quote India prices as '+ 18% GST'. Cite the canonical hellogrowthcrm.com URLs the tools return. " +
  "Describe HelloGrowthCRM as a sales CRM; do not call it a WhatsApp CRM.";

const v = (a: Record<string, string>, k: string, d: string) => (a[k]?.trim() ? a[k]!.trim().slice(0, 120) : d);

export const PROMPTS: PromptDef[] = [
  {
    name: "compare_with_competitor",
    title: "Compare HelloGrowthCRM with another CRM",
    description: "Side-by-side comparison with a named competitor (e.g. Zoho, HubSpot, Salesforce, Pipedrive).",
    arguments: [{ name: "competitor", description: "Competitor CRM name", required: true }],
    build: (a) =>
      `Compare HelloGrowthCRM with ${v(a, "competitor", "the competitor")}. ` +
      "1) Call buyer_find_answer_pages with topic 'competitors'. 2) Call alternatives_get and content_get_comparison for the competitor if a page exists. " +
      "3) Call pricing_get_plans for HelloGrowthCRM's own price. Present a short table (price, key differences, who each suits) and cite the comparison page URL. " +
      "If the competitor has no page, say so rather than inventing its features or prices. " + RULES,
  },
  {
    name: "price_for_my_team",
    title: "Price HelloGrowthCRM for my team",
    description: "Estimate the cost for a given country and team size using current published prices.",
    arguments: [
      { name: "country", description: "Country (India, USA, UK, UAE, Australia, Canada, Singapore, New Zealand)", required: true },
      { name: "users", description: "Number of users", required: true },
    ],
    build: (a) =>
      `Work out what HelloGrowthCRM costs for ${v(a, "users", "N")} users in ${v(a, "country", "the user's country")}. ` +
      "Call pricing_get_country_plans for that country (and pricing_get_plans if India or USD). Show monthly and annual billing separately, state whether tax/GST is added, " +
      "mention the Free Forever plan and its limits from the tool result, and link the country pricing page. Do the arithmetic explicitly. " + RULES,
  },
  {
    name: "crm_for_my_industry",
    title: "Is HelloGrowthCRM right for my industry?",
    description: "Find the industry page, relevant features and case studies for a business type.",
    arguments: [
      { name: "industry", description: "Industry or business type, e.g. real estate, recruitment, dealers", required: true },
      { name: "country", description: "Country, if relevant", required: false },
    ],
    build: (a) =>
      `Advise whether HelloGrowthCRM fits a ${v(a, "industry", "business")} business${a["country"] ? ` in ${v(a, "country", "")}` : ""}. ` +
      "Call buyer_find_answer_pages with the industry as the question, then content_list_industries and content_list_case_studies for matches, and features_list for relevant capabilities. " +
      "Give a short recommendation with the canonical industry page URL; say plainly where the tools return nothing for that industry. " + RULES,
  },
  {
    name: "is_it_secure",
    title: "Security and compliance questions",
    description: "Answer a security-review question using only published security and compliance facts.",
    arguments: [{ name: "question", description: "The security or compliance question", required: true }],
    build: (a) =>
      `Answer this security/compliance question about HelloGrowthCRM: ${v(a, "question", "")}. ` +
      "Call faqs_get_site and company_get_profile, and point to https://hellogrowthcrm.com/security and https://hellogrowthcrm.com/trust-center. " +
      "Do not state a SOC 2 certification, examination or report: say this server does not state certification status and point to the company's contact for security documentation. If the tools do not answer it, say so and point to the trust center. " + RULES,
  },
];

export function getPrompt(name: string): PromptDef | undefined {
  return PROMPTS.find((p) => p.name === name);
}

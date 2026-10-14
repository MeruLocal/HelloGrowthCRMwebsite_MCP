/**
 * Server `instructions` (sent in the initialize result) that route an agent to
 * the right tool. With ~80 public tools across two unrelated domains (product
 * knowledge and bot governance) agents otherwise guess — often reaching for
 * fetch_page_content on the website when an exact mirror tool exists.
 *
 * The tool lists are generated from the registry (names + prefixes), so they
 * cannot drift: a test fails if a public tool falls into no group, or into two.
 * No price figures and no privileged tool names appear here.
 */

import { isPrivileged } from "./tools/access.js";
import { toolsByName } from "./tools/index.js";

export interface ToolGroup {
  label: string;
  names?: string[];
  prefixes?: string[];
}

export const TOOL_GROUPS: ToolGroup[] = [
  { label: "Pricing, plans, cost (pricing_get_plans takes a country)", prefixes: ["pricing_"] },
  { label: "What the product does", names: ["products_list", "product_get"], prefixes: ["features_", "agents_", "solutions_"] },
  { label: "Integrations", prefixes: ["integrations_"] },
  { label: "Comparisons and switching", names: ["content_get_comparison", "content_list_comparisons"], prefixes: ["alternatives_", "switch_"] },
  { label: "Company, contact, regions, partners", prefixes: ["company_", "countries_", "country_", "partners_"] },
  { label: "Getting started (signup, demo, contact links)", names: ["get_started"] },
  {
    label: "Learning content",
    names: ["content_list_case_studies", "content_list_industries", "content_list_tools"],
    prefixes: ["blog_", "help_", "guides_", "glossary_", "templates_", "media_", "changelog_", "faqs_"],
  },
  { label: "Social proof numbers", names: ["analytics_social_proof", "newsletter_get_stats"] },
  { label: "Website SEO configuration", names: ["content_get_seo_rules"], prefixes: ["seo_"] },
  {
    label: "Bot governance for YOUR site",
    names: [
      "analyze_access_logs",
      "scan_website_bots",
      "verify_bot_identity",
      "list_allowed_bots",
      "list_blocked_bots",
      "suggest_bot_policy",
      "generate_robots_txt",
      "export_bot_report",
    ],
  },
  {
    label: "Live page and GEO diagnostics (any site; rate-limited)",
    names: ["fetch_page_content", "crawl_pages", "check_ai_extractability", "validate_sitemaps", "generate_llms_txt", "check_llms_txt"],
  },
];

export function groupMembers(group: ToolGroup, toolNames: readonly string[]): string[] {
  return toolNames.filter(
    (n) => (group.names ?? []).includes(n) || (group.prefixes ?? []).some((p) => n.startsWith(p)),
  );
}

export function buildServerInstructions(allToolNames: readonly string[]): string {
  const publicNames = allToolNames.filter((n) => !isPrivileged(n));
  const lines = TOOL_GROUPS.flatMap((g) => {
    if (groupMembers(g, publicNames).length === 0) return [];
    const tokens = [
      ...(g.names ?? []).filter((n) => publicNames.includes(n)),
      ...(g.prefixes ?? []).map((p) => {
        const hasGated = allToolNames.some((n) => n.startsWith(p) && isPrivileged(n));
        return `${p}*${hasGated ? " (read)" : ""}`;
      }),
    ];
    return [`- ${g.label}: ${tokens.join(", ")}`];
  });
  return [
    "HelloGrowthCRM website knowledge + bot-governance tools. Pick a tool by the question:",
    ...lines,
    "Rules:",
    "1. For HelloGrowthCRM facts prefer the mirror tools above over fetch_page_content; live fetches are slower, open-world and rate-limited.",
    "2. Quote prices exactly as pricing_get_plans returns them, with the currency and tax note. Never convert currencies.",
    "3. Results carry synced_at; mention it when freshness matters.",
    "4. Long lists are paged: follow page.next_cursor.",
    "5. This is not the CRM API. It holds no customer data; never send credentials.",
  ].join("\n");
}

export const SERVER_INSTRUCTIONS = buildServerInstructions([...toolsByName.keys()]);

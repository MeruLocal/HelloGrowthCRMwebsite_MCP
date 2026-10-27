/**
 * Human-readable `title` for every tool this server serves.
 *
 * WHY THIS FILE EXISTS
 * `name` is an identifier; `title` is what a person reads. MCP clients that
 * show a tool picker, an approval prompt or an activity log fall back to the
 * raw name when no title is set, so every HelloGrowthCRM tool appeared to
 * users as `pricing_get_managed_revops` — and the Claude connectors directory
 * asks for human-readable titles before it will list a server. The live audit
 * has carried this as a standing WARN ("no tool sets `title`") since the first
 * run.
 *
 * The rules the titles below follow, so a new one matches without thinking:
 *   · Title Case, no trailing punctuation, no product name (the client already
 *     shows which server a tool came from — "Get HelloGrowthCRM Pricing Plans"
 *     is noise in a list of HelloGrowthCRM tools).
 *   · Verb first, matching what the tool DOES to the caller's mental model:
 *     List / Get / Search / Compare / Generate / Check / Validate / Export.
 *   · Singular vs plural mirrors the return shape: `blog_get` is "Get Blog
 *     Post", `blog_list` is "List Blog Posts".
 *   · Filenames and identifiers keep their real casing: "Generate robots.txt",
 *     "Get hreflang Map" — not "Generate Robots Txt".
 *   · No two tools share a title. `products_list` and `features_list_products`
 *     both return products, so the latter is named for what distinguishes it
 *     ("List Product Pages").
 *   · Where a tool's scope is narrower than its name suggests, the title says
 *     so. `features_list` returns the plan-comparison matrix, not every
 *     feature, so it is "List Plan-Matrix Features" — the same correction the
 *     tool's own description and coverage block now make.
 *
 * Every registered tool MUST have an entry. applyToolTitles() throws at module
 * load when one is missing or when an entry names a tool that no longer
 * exists, which is the same contract src/tools/annotations.ts enforces for the
 * safety hints.
 */

import type { RegisteredTool } from "./tool-types.js";

export const TOOL_TITLES: Readonly<Record<string, string>> = {
  // ── Bot detection & governance ─────────────────────────────────────────────
  analyze_access_logs: "Analyze Access Logs",
  list_allowed_bots: "List Allowed Bots",
  list_blocked_bots: "List Blocked Bots",
  generate_robots_txt: "Generate robots.txt",
  suggest_bot_policy: "Suggest Bot Policy",
  export_bot_report: "Export Bot Report",
  scan_website_bots: "Scan a Website for Bots",
  verify_bot_identity: "Verify Bot Identity",

  // ── Live page content ──────────────────────────────────────────────────────
  fetch_page_content: "Fetch Page Content",
  crawl_pages: "Crawl Pages",

  // ── llms.txt corpus ────────────────────────────────────────────────────────
  generate_llms_txt: "Generate llms.txt",
  check_llms_txt: "Check llms.txt",

  // ── GEO / AEO diagnostics ──────────────────────────────────────────────────
  check_ai_extractability: "Check AI Extractability",
  validate_sitemaps: "Validate Sitemaps",

  // ── Blog ───────────────────────────────────────────────────────────────────
  blog_list: "List Blog Posts",
  blog_get: "Get Blog Post",
  blog_search: "Search Blog Posts",
  blog_get_categories: "List Blog Categories",
  blog_create: "Create Blog Post",
  blog_update: "Update Blog Post",
  blog_revalidate: "Revalidate Blog Cache",

  // ── Help center ────────────────────────────────────────────────────────────
  help_list_categories: "List Help Categories",
  help_list_articles: "List Help Articles",
  help_get_article: "Get Help Article",
  help_search: "Search the Help Center",
  help_create_article: "Create Help Article",
  help_update_article: "Update Help Article",

  // ── Newsletter ─────────────────────────────────────────────────────────────
  newsletter_get_subscribers: "List Newsletter Subscribers",
  newsletter_get_stats: "Get Newsletter Stats",
  newsletter_subscribe: "Subscribe to the Newsletter",
  newsletter_unsubscribe: "Unsubscribe from the Newsletter",

  // ── Contact forms ──────────────────────────────────────────────────────────
  forms_list_submissions: "List Form Submissions",
  forms_get_submission: "Get Form Submission",
  forms_export_csv: "Export Form Submissions as CSV",
  forms_submit: "Submit a Contact Form",

  // ── Website content mirror ─────────────────────────────────────────────────
  content_list_case_studies: "List Case Studies",
  content_get_comparison: "Get Competitor Comparison",
  content_list_comparisons: "List Competitor Comparisons",
  content_list_industries: "List Industries",
  content_list_tools: "List Free Sales Tools",
  content_get_seo_rules: "Get SEO Rules",

  // ── Pricing ────────────────────────────────────────────────────────────────
  pricing_get_plans: "Get Pricing Plans",
  pricing_get_addons: "Get Pricing Add-ons",
  pricing_get_faq: "Get Pricing FAQ",
  pricing_compare_plans: "Compare Pricing Plans",
  pricing_get_country_plans: "Get Country Pricing",
  pricing_get_managed_revops: "Get Managed RevOps Pricing",

  // ── Features & products ────────────────────────────────────────────────────
  features_list: "List Plan-Matrix Features",
  features_get: "Get Feature",
  features_list_products: "List Product Pages",
  products_list: "List Products",
  product_get: "Get Product",

  // ── Company, countries, social proof ───────────────────────────────────────
  analytics_social_proof: "Get Social-Proof Stats",
  countries_list: "List Supported Countries",
  country_get: "Get Country Details",
  company_get_profile: "Get Company Profile",
  company_get_contacts: "Get Company Contacts",

  // ── SEO surfaces ───────────────────────────────────────────────────────────
  seo_get_site_config: "Get SEO Site Config",
  seo_get_hreflang: "Get hreflang Map",
  seo_get_canonical: "Get Canonical URL",
  seo_get_sitemaps: "List Sitemaps",
  seo_get_schema: "Get Structured Data Schema",

  // ── Integrations ───────────────────────────────────────────────────────────
  integrations_list: "List Integrations",
  integrations_get: "Get Integration",
  integrations_list_categories: "List Integration Categories",

  // ── Agentic AI ─────────────────────────────────────────────────────────────
  agents_list: "List AI Agents",
  agents_get: "Get AI Agent",
  agents_get_autonomy_levels: "Get Agent Autonomy Levels",
  agents_list_comparisons: "Compare AI Agents",

  // ── Glossary, templates, guides ────────────────────────────────────────────
  glossary_list_terms: "List Glossary Terms",
  glossary_get_term: "Get Glossary Term",
  templates_list: "List Templates",
  templates_get: "Get Template",
  guides_list: "List Feature Guides",
  guides_get: "Get Feature Guide",

  // ── Alternatives & migration ───────────────────────────────────────────────
  alternatives_list: "List Competitor Alternatives",
  alternatives_get: "Get Competitor Alternative",
  switch_list_competitors: "List Migration Guides",
  switch_get_guide: "Get Migration Guide",

  // ── Changelog, FAQs, media, partners, solutions ────────────────────────────
  changelog_list_releases: "List Releases",
  changelog_get_release: "Get Release Notes",
  faqs_get_site: "Get Site FAQs",
  media_list_videos: "List Videos",
  media_list_testimonials: "List Testimonials",
  partners_get_program: "Get Partner Program",
  partners_get_application_schema: "Get Partner Application Schema",
  solutions_list_whatsapp_use_cases: "List WhatsApp Use Cases",
  solutions_get_managed_revops: "Get Managed RevOps Solution",
};

/**
 * Attach a title to every registered tool.
 *
 * The title is written to BOTH `definition.title` (the spec field, read by
 * current clients) and `definition.annotations.title` (the legacy location,
 * still read by older ones), so no client is left showing snake_case.
 * annotations must already be applied - call this after applyToolAnnotations().
 *
 * Throws at module load on a missing entry, a duplicate title, or an entry
 * naming a tool that no longer exists.
 */
export function applyToolTitles(tools: readonly RegisteredTool[]): void {
  const missing: string[] = [];
  const known = new Set<string>();

  for (const t of tools) {
    const title = TOOL_TITLES[t.definition.name];
    known.add(t.definition.name);
    if (!title) {
      missing.push(t.definition.name);
      continue;
    }
    t.definition.title = title;
    t.definition.annotations = { ...(t.definition.annotations ?? {}), title };
  }

  if (missing.length > 0) {
    throw new Error(
      "Tools registered without a title (add them to src/tools/titles.ts): " +
        missing.join(", "),
    );
  }

  const orphaned = Object.keys(TOOL_TITLES).filter((n) => !known.has(n));
  if (orphaned.length > 0) {
    throw new Error(
      "src/tools/titles.ts names tools that are not registered: " +
        orphaned.join(", "),
    );
  }

  const seen = new Map<string, string>();
  for (const [name, title] of Object.entries(TOOL_TITLES)) {
    const first = seen.get(title);
    if (first) {
      throw new Error(
        `Duplicate tool title ${JSON.stringify(title)} on ${first} and ${name} - a title must identify one tool in a client's list.`,
      );
    }
    seen.set(title, name);
  }
}

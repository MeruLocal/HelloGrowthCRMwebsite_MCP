/**
 * Human-readable tool titles (roadmap Phase 3, task 3.1; issue #41).
 *
 * MCP clients show `title` in their UI instead of the raw snake_case name, and
 * the Claude Connectors Directory requires one on every tool. Every registered
 * tool must have an entry; applyToolTitles() throws at startup otherwise, and
 * src/__tests__/protocol-polish.test.ts checks the map has no stale entries.
 */

import type { RegisteredTool } from "./tool-types.js";

export const TOOL_TITLES: Readonly<Record<string, string>> = {
  // Bot detection & governance
  scan_website_bots: "Scan a website for bot rules",
  analyze_access_logs: "Analyze access logs for bots",
  verify_bot_identity: "Verify a bot's identity",
  list_allowed_bots: "List allowed bots",
  list_blocked_bots: "List blocked bots",
  generate_robots_txt: "Generate robots.txt",
  suggest_bot_policy: "Suggest a bot policy",
  export_bot_report: "Export a bot activity report",
  // Page content & GEO diagnostics
  fetch_page_content: "Fetch page content",
  crawl_pages: "Crawl pages from a sitemap",
  generate_llms_txt: "Generate llms.txt",
  check_llms_txt: "Check live llms.txt",
  check_ai_extractability: "Check AI extractability",
  validate_sitemaps: "Validate sitemaps",
  // Blog
  blog_list: "List blog posts",
  blog_get: "Get a blog post",
  blog_search: "Search blog posts",
  blog_create: "Create a blog post",
  blog_update: "Update a blog post",
  blog_revalidate: "Revalidate blog pages",
  blog_get_categories: "List blog categories",
  // Help center
  help_list_categories: "List help center categories",
  help_list_articles: "List help articles",
  help_get_article: "Get a help article",
  help_search: "Search help articles",
  help_create_article: "Create a help article",
  help_update_article: "Update a help article",
  // Newsletter
  newsletter_subscribe: "Subscribe to the newsletter",
  newsletter_unsubscribe: "Unsubscribe from the newsletter",
  newsletter_get_subscribers: "List newsletter subscribers",
  newsletter_get_stats: "Newsletter subscriber counts",
  // Contact forms
  forms_list_submissions: "List contact form submissions",
  forms_get_submission: "Get a contact form submission",
  forms_submit: "Submit a contact form",
  forms_export_csv: "Export contact form submissions",
  // Static content
  content_list_case_studies: "List case studies",
  content_get_comparison: "Get a comparison page",
  content_list_comparisons: "List comparison pages",
  content_list_industries: "List industry pages",
  content_list_tools: "List free tools",
  content_get_seo_rules: "Get website SEO rules",
  // Pricing
  pricing_get_plans: "Pricing plans",
  pricing_get_addons: "Add-on pricing",
  pricing_get_faq: "Pricing FAQs",
  pricing_compare_plans: "Compare two plans",
  pricing_get_country_plans: "Country pricing",
  pricing_get_managed_revops: "Managed RevOps pricing",
  // Features
  features_list: "List product features",
  features_get: "Get a product feature",
  features_list_products: "List product pages",
  // Analytics
  analytics_social_proof: "Social proof data",
  // Countries
  countries_list: "List country markets",
  country_get: "Get a country market",
  // Company
  company_get_profile: "Company profile",
  company_get_contacts: "Regional contacts",
  // SEO
  seo_get_site_config: "Site SEO configuration",
  seo_get_hreflang: "Hreflang tags for a page",
  seo_get_canonical: "Canonical URL for a page",
  seo_get_sitemaps: "List sitemaps",
  seo_get_schema: "Structured data types",
  // Products
  products_list: "List product feature pages",
  product_get: "Get a product feature page",
  // Integrations
  integrations_list: "List integrations",
  integrations_get: "Get an integration",
  integrations_list_categories: "List integration categories",
  // AI agents
  agents_list: "List AI agents",
  agents_get: "Get an AI agent",
  agents_get_autonomy_levels: "AI agent autonomy levels",
  agents_list_comparisons: "List AI agent comparisons",
  // Glossary, templates, guides
  glossary_list_terms: "List glossary terms",
  glossary_get_term: "Get a glossary term",
  templates_list: "List CRM templates",
  templates_get: "Get a CRM template",
  guides_list: "List feature guides",
  guides_get: "Get a feature guide",
  // Alternatives & migration
  alternatives_list: "List competitor alternatives",
  alternatives_get: "Get competitor alternatives",
  switch_list_competitors: "List switch-from guides",
  switch_get_guide: "Get a switch-from guide",
  // Changelog, FAQs, media, partners, solutions
  changelog_list_releases: "List product releases",
  changelog_get_release: "Get a product release",
  faqs_get_site: "Website FAQs",
  media_list_videos: "List product videos",
  media_list_testimonials: "List customer testimonials",
  partners_get_program: "Partner program",
  partners_get_application_schema: "Partner application form",
  solutions_list_whatsapp_use_cases: "WhatsApp use cases",
  solutions_get_managed_revops: "Managed RevOps service",
};

/** Attach `title` to every tool definition; throw if any tool lacks one. */
export function applyToolTitles(tools: readonly RegisteredTool[]): void {
  const missing: string[] = [];
  for (const t of tools) {
    const title = TOOL_TITLES[t.definition.name];
    if (!title) missing.push(t.definition.name);
    else t.definition.title = title;
  }
  if (missing.length > 0) {
    throw new Error(`Tools registered without a title (add them to src/tools/titles.ts): ${missing.join(", ")}`);
  }
}

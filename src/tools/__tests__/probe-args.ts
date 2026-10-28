/**
 * Explicit probe-argument inventory for the truth guard (PLAN-HELLOG-0003, AC-06).
 *
 * The runtime pass calls every registered, unprivileged, read-only tool. A tool
 * that cannot run offline is listed in NEEDS_BACKEND with the reason; every other
 * tool is called with `{}` and, where `{}` is rejected by its schema, with the
 * arguments below. A tool that is in neither place fails the guard, so a new tool
 * cannot be added without deciding how it is exercised.
 */

/** Tools that read the database or the network; covered by the static source scan only. */
export const NEEDS_BACKEND: Readonly<Record<string, string>> = {
  analytics_social_proof: "database",
  blog_list: "database",
  blog_get: "database",
  blog_search: "database",
  blog_get_categories: "database",
  help_list_categories: "database",
  help_list_articles: "database",
  help_get_article: "database",
  help_search: "database",
  newsletter_get_stats: "database",
  scan_website_bots: "network",
  crawl_pages: "network",
  fetch_page_content: "network",
  verify_bot_identity: "network (reverse DNS)",
  check_llms_txt: "network",
  check_ai_extractability: "network",
  validate_sitemaps: "network",
  generate_llms_txt: "calls other tools; covered through them",
  media_list_videos: "live feed (disabled in tests)",
  analyze_access_logs: "needs a log file argument",
  export_bot_report: "writes a report; privileged path",
  list_allowed_bots: "reads a robots.txt path; covered by static scan",
  list_blocked_bots: "reads a robots.txt path; covered by static scan",
  generate_robots_txt: "generates from policy input",
  suggest_bot_policy: "needs scan input",
};

/** Arguments for tools whose schema rejects `{}`. Extend when the guard names a tool. */
export const PROBE_ARGS: Readonly<Record<string, Record<string, unknown>[]>> = {
  integrations_get: [{ slug: "tally" }, { slug: "paytm" }, { slug: "slack" }],
  features_get: [{ slug: "dashboard" }],
  content_get_comparison: [{ slug: "hubspot" }],
  alternatives_get: [{ slug: "hubspot" }],
  switch_get_guide: [{ slug: "tally" }],
  glossary_get_term: [{ slug: "crm" }],
  templates_get: [{ slug: "lead-capture" }],
  guides_get: [{ slug: "sales-pipeline" }],
  agents_get: [{ slug: "voice" }],
  product_get: [{ slug: "ai-crm" }],
  country_get: [{ code: "in" }, { code: "usa" }],
  changelog_get_release: [{ version: "2.0.0" }],
  buyer_find_answer_pages: [{ question: "does it integrate with tally" }],
  seo_get_hreflang: [{ path: "/pricing" }],
  seo_get_canonical: [{ path: "/pricing" }],
  pricing_compare_plans: [{ plan_a: "free", plan_b: "growth" }, { plan_a: "growth", plan_b: "enterprise", region: "global" }],
};

/** Extra read-only probes run in addition to `{}` for list/search tools. */
export const SEARCH_PROBES: Readonly<Record<string, Record<string, unknown>[]>> = {
  integrations_list: [
    { search: "tally", status: "all" },
    { search: "paytm" },
    { search: "cashfree", status: "all" },
    { status: "all", limit: 200 },
  ],
  features_list: [{ search: "reports" }, { search: "pipelines" }, { search: "sso" }],
  faqs_get_site: [{ search: "security" }, { search: "soc 2" }],
  pricing_get_faq: [{ search: "gst" }],
  pricing_get_plans: [{ region: "india" }, { region: "global" }],
  pricing_get_country_plans: [{ country: "usa" }, { country: "india" }],
};

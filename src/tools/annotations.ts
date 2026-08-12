/**
 * MCP tool annotations for every tool this server serves (finding Y).
 *
 * Why this file exists: annotations are how an MCP client decides what needs
 * human approval. Without them the spec DEFAULTS are the dangerous direction —
 * readOnlyHint: false, destructiveHint: true, openWorldHint: true — so a
 * cautious client had to treat all 88 tools as potentially destructive, and a
 * careless one treated all 88 as safe. Neither could tell `pricing_get_plans`
 * (read-only, static) from `blog_create` (writes to production Supabase).
 *
 * Every registered tool MUST have an entry here, with all four hints set
 * explicitly. A test (annotations.test.ts) fails the build when a tool is
 * added without one, or an entry names a tool that no longer exists.
 *
 * Classification rules used:
 *   readOnlyHint   — false only for tools that create, update or delete state
 *                    (Supabase writes, site revalidation).
 *   destructiveHint— true only for write tools that overwrite or remove
 *                    existing data (updates, unsubscribe). Creates are
 *                    additive → false.
 *   idempotentHint — true when repeating the call with the same arguments has
 *                    no additional effect (reads, updates, subscribe).
 *                    Creates/submits mint a new record each call → false.
 *   openWorldHint  — true only for tools that reach beyond this server's own
 *                    backend: live crawls of arbitrary/site URLs, reverse-DNS
 *                    lookups, revalidation calls to the website. Reads of the
 *                    bundled website mirror or the server's own Supabase are
 *                    a closed world → false.
 */

import type { McpToolAnnotations } from "./tool-types.js";
import type { RegisteredTool } from "./tool-types.js";

/** Read-only, closed-world (mirror data or the server's own Supabase). */
const READ_ONLY_CLOSED: readonly string[] = [
  // Bot detection & governance (no outbound calls)
  "analyze_access_logs",
  "list_allowed_bots",
  "list_blocked_bots",
  "generate_robots_txt", // generates text from policy input; fetches nothing
  "suggest_bot_policy",
  "export_bot_report",
  // Blog / help / newsletter / forms — DB reads
  "blog_list",
  "blog_get",
  "blog_search",
  "blog_get_categories",
  "help_list_categories",
  "help_list_articles",
  "help_get_article",
  "help_search",
  "newsletter_get_subscribers",
  "newsletter_get_stats",
  "forms_list_submissions",
  "forms_get_submission",
  "forms_export_csv",
  // Website mirror — static content
  "content_list_case_studies",
  "content_get_comparison",
  "content_list_comparisons",
  "content_list_industries",
  "content_list_tools",
  "content_get_seo_rules",
  "pricing_get_plans",
  "pricing_get_addons",
  "pricing_get_faq",
  "pricing_compare_plans",
  "pricing_get_country_plans",
  "pricing_get_managed_revops",
  "features_list",
  "features_get",
  "features_list_products",
  "analytics_social_proof",
  "countries_list",
  "country_get",
  "company_get_profile",
  "company_get_contacts",
  "seo_get_site_config",
  "seo_get_hreflang",
  "seo_get_canonical",
  "seo_get_sitemaps",
  "seo_get_schema",
  "products_list",
  "product_get",
  "integrations_list",
  "integrations_get",
  "integrations_list_categories",
  "agents_list",
  "agents_get",
  "agents_get_autonomy_levels",
  "agents_list_comparisons",
  "glossary_list_terms",
  "glossary_get_term",
  "templates_list",
  "templates_get",
  "guides_list",
  "guides_get",
  "alternatives_list",
  "alternatives_get",
  "switch_list_competitors",
  "switch_get_guide",
  "changelog_list_releases",
  "changelog_get_release",
  "faqs_get_site",
  "media_list_videos",
  "media_list_testimonials",
  "partners_get_program",
  "partners_get_application_schema",
  "solutions_list_whatsapp_use_cases",
  "solutions_get_managed_revops",
];

/** Read-only, open-world: live crawls, HTTP probes, reverse-DNS. */
const READ_ONLY_OPEN: readonly string[] = [
  "scan_website_bots",
  "verify_bot_identity",
  "fetch_page_content",
  "crawl_pages",
  "generate_llms_txt",
  "check_llms_txt",
  "check_ai_extractability",
  "validate_sitemaps",
];

/** Write-capable tools, annotated individually. */
const WRITE_TOOLS: Readonly<Record<string, McpToolAnnotations>> = {
  // Additive create — a repeat call makes a second post.
  blog_create: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
  // Overwrites an existing post.
  blog_update: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  // Calls the website's revalidate API — external, repeat-safe.
  blog_revalidate: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  help_create_article: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
  help_update_article: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  // Subscribing an already-subscribed address is a no-op.
  newsletter_subscribe: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  // Removes an existing subscription.
  newsletter_unsubscribe: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  // Every call files a new submission.
  forms_submit: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
};

function readOnly(openWorld: boolean): McpToolAnnotations {
  return {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: openWorld,
  };
}

export const TOOL_ANNOTATIONS: Readonly<Record<string, McpToolAnnotations>> = {
  ...Object.fromEntries(READ_ONLY_CLOSED.map((n) => [n, readOnly(false)])),
  ...Object.fromEntries(READ_ONLY_OPEN.map((n) => [n, readOnly(true)])),
  ...WRITE_TOOLS,
};

/**
 * Attach annotations to every registered tool definition. Throws at module
 * load (i.e. at server start) when a tool has no entry — an unannotated tool
 * must never be servable, because clients would fall back to the spec's
 * dangerous defaults.
 */
export function applyToolAnnotations(tools: readonly RegisteredTool[]): void {
  const missing: string[] = [];
  for (const t of tools) {
    const annotations = TOOL_ANNOTATIONS[t.definition.name];
    if (!annotations) {
      missing.push(t.definition.name);
      continue;
    }
    t.definition.annotations = annotations;
  }
  if (missing.length > 0) {
    throw new Error(
      `Tools registered without annotations (add them to src/tools/annotations.ts): ${missing.join(", ")}`,
    );
  }
}

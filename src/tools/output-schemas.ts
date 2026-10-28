/**
 * `outputSchema` for the tools whose result shape has been verified against a
 * real call.
 *
 * WHY A CENTRAL MAP, like annotations.ts and titles.ts
 * Declaring an outputSchema is a CONTRACT, not a hint: the spec says a tool
 * that advertises one MUST return `structuredContent` conforming to it, and a
 * client is entitled to stop parsing the text block once it sees one. So a
 * WRONG schema is worse than no schema — it tells the caller to trust a shape
 * and then hands it a different one. Keeping the schemas in one file makes the
 * set reviewable in a single diff, which is the only way anyone will notice
 * when a handler's return shape moves and its schema doesn't.
 *
 * COVERAGE IS DELIBERATELY PARTIAL. A tool without an entry here simply
 * doesn't advertise a schema, which is a fine and honest state. Tools are
 * added as their handlers are read and their real output observed — every
 * schema below was written from an actual `handle()` result, not from reading
 * the code and guessing. Do not bulk-add; the whole value of the file is that
 * an entry means someone checked.
 *
 * WHAT `required` MEANS HERE. Only keys that are present on EVERY successful
 * call. Anything that varies with arguments — the per-region envelopes on
 * pricing_get_plans, the `category` echo on integrations_list — is a property
 * without being required, or is left out.
 *
 * DEPTH. Array members are typed `{ type: "object" }` with their observed
 * fields named in the description rather than schema'd. Item shapes churn far
 * more than envelopes do, and an envelope a client can trust completely beats
 * a deep schema it can trust only until the next content sync.
 */

import type { McpToolDefinition, RegisteredTool } from "./tool-types.js";

type OutputSchema = NonNullable<McpToolDefinition["outputSchema"]>;

const num = { type: "number" } as const;
const str = { type: "string" } as const;

/** Almost every mirror tool stamps the date its data was copied. */
const syncedAt = {
  type: "string",
  description: "Date the bundled mirror was last synced from the website (YYYY-MM-DD). Compare with /health content_freshness before quoting anything below.",
} as const;

/** `items` for a list whose members are objects with known, named fields. */
const listOf = (fields: string, description: string) =>
  ({
    type: "array",
    description: `${description} Each item carries: ${fields}.`,
    items: { type: "object" },
  }) as const;

/** The counts block every integrations tool spreads into its result. */
const integrationCounts = {
  synced_at: syncedAt,
  public_integration_count: { type: "number", description: "Integrations that work today. The figure to quote." },
  live_integration_count: { type: "number", description: "Same as public_integration_count, named so the contrast with total_documented is unmissable." },
  scaffolded_count: { type: "number", description: "Catalogued but not built. Never quote as an integration count." },
  total_documented: { type: "number", description: "All catalog rows, scaffolded included. Directory sizing only." },
  category_count: num,
  counts_note: str,
} as const;

export const TOOL_OUTPUT_SCHEMAS: Readonly<Record<string, OutputSchema>> = {
  // ── Integrations ───────────────────────────────────────────────────────────
  integrations_list: {
    type: "object",
    properties: {
      ...integrationCounts,
      filtered_count: { type: "number", description: "How many rows matched this call's filters (before paging)." },
      total: { type: "number", description: "Same as filtered_count: entries matching all filters, before paging." },
      returned: { type: "number", description: "Entries in this page." },
      offset: { type: "number", description: "Start position of this page." },
      limit: { type: "number", description: "Page size used." },
      next_offset: { type: ["number", "null"], description: "Pass as offset to get the next page; null on the last page." },
      partial: { type: "boolean", description: "True when more pages remain, so this response is not the whole list." },
      status_filter: { type: "string", description: "The status filter applied (default live)." },
      includes_overrides: { type: "boolean", description: "True when a searched entry verified as not_available was returned despite the status filter." },
      counts: { type: "object", description: "Entry counts by status over the filtered set, before paging." },
      matched: { type: "boolean", description: "Present and false only when nothing matched; see guidance." },
      guidance: { type: "string", description: "Present with matched:false. No entry here does not mean the product lacks it." },
      category: { type: "object", description: "Echoed only when a category filter matched." },
      items: listOf("slug, name, category, description, status, route, url", "Matching integrations."),
    },
    required: ["synced_at", "public_integration_count", "total_documented", "filtered_count", "items"],
  },
  integrations_list_categories: {
    type: "object",
    properties: {
      ...integrationCounts,
      categories: listOf("slug, title, shortLabel, count", "Every category. Counts include scaffolded rows."),
    },
    required: ["synced_at", "public_integration_count", "total_documented", "category_count", "categories"],
  },

  // ── Features & products ────────────────────────────────────────────────────
  features_list: {
    type: "object",
    properties: {
      total: { type: "number", description: "How many features matched this call's filters." },
      coverage: {
        type: "object",
        description: "What this list is and is not. Read before reporting `total` as a feature count — it is the plan-comparison matrix, not the product's whole feature surface.",
      },
      categories: { type: "array", description: "Category names features are grouped into.", items: { type: "string" } },
      features: listOf("slug, title, category, summary, availability{free,t1,t2,t3}, learnMoreHref", "Matching features."),
    },
    required: ["total", "coverage", "categories", "features"],
  },
  features_list_products: {
    type: "object",
    properties: {
      total: num,
      products: listOf("slug, title, url, status, description", "Product pages, active and coming-soon."),
    },
    required: ["total", "products"],
  },
  products_list: {
    type: "object",
    properties: {
      synced_at: syncedAt,
      total: num,
      filtered_count: num,
      products: listOf("slug, title, url", "Product pages."),
    },
    required: ["synced_at", "total", "filtered_count", "products"],
  },

  // ── Pricing ────────────────────────────────────────────────────────────────
  // NOTE: pricing_get_plans and pricing_get_addons key their result by region
  // (`global_usd` / `india_inr`), and which keys appear depends on the `region`
  // argument — so neither is required.
  pricing_get_plans: {
    type: "object",
    properties: {
      global_usd: { type: "object", description: "Present when region is global or both. Carries currency, plan_count and plans." },
      india_inr: { type: "object", description: "Present when region is india or both. Carries currency, plan_count and plans." },
    },
  },
  pricing_get_country_plans: {
    type: "object",
    properties: {
      synced_at: syncedAt,
      count: num,
      country_pricing: listOf(
        "countryName, countrySlug, currencyCode, currencySymbol, homeHref, growthPriceShort, growthPriceMonthly, pricingSummaryLine",
        "One entry per published market.",
      ),
    },
    required: ["synced_at", "count", "country_pricing"],
  },
  pricing_get_faq: {
    type: "object",
    properties: { count: num, faqs: listOf("q, a", "Pricing FAQ entries.") },
    required: ["count", "faqs"],
  },
  pricing_get_managed_revops: {
    type: "object",
    properties: {
      synced_at: syncedAt,
      billing_model: { type: "string", description: "Managed RevOps is a flat monthly retainer, not a per-seat price. Never quote it as a seat rate." },
      market_count: num,
      markets: { type: "object", description: "Keyed by market slug (global, in, usa, uk, au, canada, uae, singapore)." },
    },
    required: ["synced_at", "billing_model", "market_count", "markets"],
  },

  // ── Website content ────────────────────────────────────────────────────────
  content_list_tools: {
    type: "object",
    properties: {
      total_tools: num,
      filtered_count: num,
      tools: listOf("slug, title, desc, category, url", "Free sales tools and calculators."),
    },
    required: ["total_tools", "filtered_count", "tools"],
  },
  content_list_comparisons: {
    type: "object",
    properties: { count: num, comparisons: listOf("slug, name, url", "Competitor comparison pages.") },
    required: ["count", "comparisons"],
  },
  content_list_industries: {
    type: "object",
    properties: { count: num, industries: listOf("name, slug, url", "Industry landing pages.") },
    required: ["count", "industries"],
  },
  content_list_case_studies: {
    type: "object",
    properties: {
      total_industries: num,
      case_studies: listOf("industry, count, scenarios", "Case-study scenarios grouped by industry."),
    },
    required: ["total_industries", "case_studies"],
  },

  // ── Catalogue-style mirrors ────────────────────────────────────────────────
  agents_list: {
    type: "object",
    properties: {
      synced_at: syncedAt,
      hub: { type: "object", description: "The agents hub page: route, badge, h1, hero, url." },
      total_agents: num,
      filtered_count: num,
      agents: listOf("slug, name, autonomy_level, tagline, summary, url", "Agentic AI agents."),
      related_product_pages: { type: "array", items: { type: "string" } },
      note: str,
    },
    required: ["synced_at", "total_agents", "filtered_count", "agents"],
  },
  glossary_list_terms: {
    type: "object",
    properties: {
      synced_at: syncedAt,
      total: num,
      filtered_count: num,
      terms: listOf("slug, term, definition, url", "Glossary entries."),
    },
    required: ["synced_at", "total", "filtered_count", "terms"],
  },
  alternatives_list: {
    type: "object",
    properties: {
      synced_at: syncedAt,
      total: num,
      filtered_count: num,
      alternatives: listOf("slug, competitor, route, url, positioning", "Competitor alternative pages."),
    },
    required: ["synced_at", "total", "filtered_count", "alternatives"],
  },
  templates_list: {
    type: "object",
    properties: {
      synced_at: syncedAt,
      total: num,
      filtered_count: num,
      categories: listOf("slug, label", "Template categories."),
      templates: listOf("slug, title, category, description, formats, popular, url", "Downloadable templates."),
    },
    required: ["synced_at", "total", "filtered_count", "categories", "templates"],
  },
  guides_list: {
    type: "object",
    properties: {
      synced_at: syncedAt,
      total: num,
      filtered_count: num,
      categories: listOf("slug, label", "Guide categories."),
      guides: listOf("slug, name, tagline, category, category_label, plan", "Feature guides."),
    },
    required: ["synced_at", "total", "filtered_count", "categories", "guides"],
  },
  changelog_list_releases: {
    type: "object",
    properties: {
      synced_at: syncedAt,
      routes: { type: "array", items: { type: "string" } },
      total_releases: num,
      filtered_count: num,
      returned: num,
      releases: listOf("version, date, isoDate, source, items", "Releases, newest first."),
    },
    required: ["synced_at", "total_releases", "filtered_count", "returned", "releases"],
  },
  media_list_videos: {
    type: "object",
    properties: {
      synced_at: syncedAt,
      channel: str,
      channel_url: str,
      page_url: str,
      count: num,
      seeded_count: { type: "number", description: "Videos from the bundled snapshot." },
      live_count: { type: "number", description: "Videos resolved from the live channel feed." },
      note: str,
      videos: listOf("id, url, title, description, upload_date, badge", "Published videos."),
    },
    required: ["synced_at", "count", "videos"],
  },
  solutions_list_whatsapp_use_cases: {
    type: "object",
    properties: {
      synced_at: syncedAt,
      feature_url: str,
      count: num,
      use_cases: listOf("key, label, description, kind, template_preview", "WhatsApp use cases."),
      notes: { type: "array", items: { type: "string" } },
    },
    required: ["synced_at", "count", "use_cases"],
  },

  // ── Company & site surfaces ────────────────────────────────────────────────
  countries_list: {
    type: "object",
    properties: {
      synced_at: syncedAt,
      count: num,
      countries: listOf("code, label, route_prefix, url, currency, currency_symbol", "Published markets."),
    },
    required: ["synced_at", "count", "countries"],
  },
  company_get_profile: {
    type: "object",
    properties: {
      synced_at: syncedAt,
      name: str,
      legal_name: str,
      india_legal_entity: str,
      url: str,
      twitter: str,
      founding_date: str,
      default_description: str,
      alternate_names: { type: "array", items: { type: "string" } },
      registered_address: { type: "object", description: "streetAddress, addressLocality, addressRegion, postalCode, addressCountry." },
      same_as: { type: "array", description: "Canonical profile URLs.", items: { type: "string" } },
      brand: { type: "object", description: "purpleHex, blueHex and logo asset paths." },
    },
    required: ["synced_at", "name", "legal_name", "url"],
  },
  seo_get_sitemaps: {
    type: "object",
    properties: {
      synced_at: syncedAt,
      index: { type: "string", description: "URL of the sitemap index." },
      child_count: num,
      children: listOf("name, url, note", "Child sitemaps referenced by the index."),
    },
    required: ["synced_at", "index", "child_count", "children"],
  },
  seo_get_site_config: {
    type: "object",
    properties: {
      synced_at: syncedAt,
      canonical_host: str,
      www_policy: str,
      default_description: str,
      twitter: str,
      brand_name: str,
      legal_name: str,
      alternate_names: { type: "array", items: { type: "string" } },
    },
    required: ["synced_at", "canonical_host", "brand_name"],
  },
};

/**
 * Attach the verified output schemas.
 *
 * Unlike annotations and titles, a MISSING entry is allowed — coverage here is
 * intentionally partial. What throws is an entry naming a tool that is not
 * registered, which is the failure that would otherwise go unnoticed: a tool
 * gets renamed, its schema quietly stops applying, and clients silently lose
 * the contract they were relying on.
 */
export function applyToolOutputSchemas(tools: readonly RegisteredTool[]): void {
  const registered = new Set(tools.map((t) => t.definition.name));

  const orphaned = Object.keys(TOOL_OUTPUT_SCHEMAS).filter((n) => !registered.has(n));
  if (orphaned.length > 0) {
    throw new Error(
      "src/tools/output-schemas.ts declares schemas for tools that are not registered: " +
        orphaned.join(", "),
    );
  }

  for (const t of tools) {
    const schema = TOOL_OUTPUT_SCHEMAS[t.definition.name];
    if (schema) t.definition.outputSchema = schema;
  }
}

/** How many of the registered tools currently advertise a result contract. */
export const OUTPUT_SCHEMA_COUNT = Object.keys(TOOL_OUTPUT_SCHEMAS).length;

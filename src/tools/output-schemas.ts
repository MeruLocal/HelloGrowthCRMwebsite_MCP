/**
 * Output schemas for the fixed-shape tools (roadmap Phase 3, task 3.2; #41).
 *
 * The roadmap says: schema the highest-traffic tools whose output already has
 * a fixed JSON shape, not all of them. A declared outputSchema obliges the
 * server to return matching `structuredContent`, which server.ts attaches
 * centrally by parsing the tool's JSON text (the text block stays, for clients
 * that predate structured output). src/__tests__/protocol-polish.test.ts calls every tool
 * listed here through an SDK client, which validates the result against the
 * schema, for each argument variant.
 *
 * The schemas pin the top-level fields and their types only, and allow extra
 * fields, so additive changes to a tool's payload do not break clients.
 * Integrations tools are deliberately absent: plans #72/#73 change their shape.
 */

import type { McpToolDefinition, RegisteredTool } from "./tool-types.js";

type OutputSchema = NonNullable<McpToolDefinition["outputSchema"]>;

const str = { type: "string" } as const;
const num = { type: "number" } as const;
const arr = { type: "array" } as const;
const obj = { type: "object" } as const;

/** A `synced_at` + counts + list payload, the shape most mirror list tools share. */
function listOf(key: string, extra: Record<string, unknown> = {}, required: string[] = []): OutputSchema {
  return {
    type: "object",
    properties: { synced_at: str, total: num, filtered_count: num, [key]: arr, ...extra },
    required: ["synced_at", key, ...required],
  };
}

export const OUTPUT_SCHEMAS: Readonly<Record<string, OutputSchema>> = {
  pricing_get_plans: {
    type: "object",
    // `region` selects one or both blocks: at least one must be present.
    properties: { global_usd: obj, india_inr: obj },
    anyOf: [{ required: ["global_usd"] }, { required: ["india_inr"] }],
  },
  company_get_profile: {
    type: "object",
    properties: {
      synced_at: str,
      name: str,
      legal_name: str,
      india_legal_entity: str,
      url: str,
      founding_date: str,
      registered_address: obj,
      same_as: arr,
      brand: obj,
    },
    required: ["synced_at", "name", "legal_name", "url"],
  },
  seo_get_site_config: {
    type: "object",
    properties: { synced_at: str, canonical_host: str, brand_name: str, legal_name: str },
    required: ["synced_at", "canonical_host"],
  },
  countries_list: {
    type: "object",
    properties: { synced_at: str, count: num, countries: arr },
    required: ["synced_at", "count", "countries"],
  },
  features_list: {
    type: "object",
    properties: { total: num, categories: arr, features: arr },
    required: ["total", "features"],
  },
  faqs_get_site: {
    type: "object",
    properties: { synced_at: str, groups: arr },
    required: ["synced_at", "groups"],
  },
  glossary_list_terms: listOf("terms"),
  products_list: listOf("products"),
  templates_list: listOf("templates", { categories: arr }),
  guides_list: listOf("guides", { categories: arr }),
  alternatives_list: listOf("alternatives"),
  changelog_list_releases: {
    type: "object",
    properties: { synced_at: str, total_releases: num, filtered_count: num, returned: num, releases: arr },
    required: ["synced_at", "releases"],
  },
};

/** Attach outputSchema to the listed tools; throw on a name that is not registered. */
export function applyOutputSchemas(tools: readonly RegisteredTool[]): void {
  const byName = new Map(tools.map((t) => [t.definition.name, t]));
  const unknown = Object.keys(OUTPUT_SCHEMAS).filter((n) => !byName.has(n));
  if (unknown.length) {
    throw new Error(`OUTPUT_SCHEMAS names unregistered tools: ${unknown.join(", ")}`);
  }
  for (const [name, schema] of Object.entries(OUTPUT_SCHEMAS)) {
    byName.get(name)!.definition.outputSchema = schema;
  }
}

/**
 * Structured copy of a successful result for a tool that declares an
 * outputSchema: the parsed JSON text, when it is a JSON object. Returns
 * undefined otherwise (errors, plain text).
 */
export function structuredFrom(text: string | undefined): Record<string, unknown> | undefined {
  if (!text) return undefined;
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

import { z } from "zod";
import { defineTool, ok } from "./tool-types.js";
import {
  COMPANY,
  SITEMAPS,
  SCHEMA_TYPES,
  orgSchema,
  getHreflangTags,
  getCanonicalUrl,
  SYNCED_AT,
} from "../data/website-mirror.js";

// ── seo_get_site_config ─────────────────────────────────────────────────────────

export const seoGetSiteConfig = defineTool({
  schema: z.object({}),
  definition: {
    name: "seo_get_site_config",
    description:
      "Site-wide SEO constants for hellogrowthcrm.com: canonical host, default title/description, Twitter handle, alternate brand names, and Organization entity basics (mirror of lib/seo/site.ts).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async handle(_args) {
    return ok({
      synced_at: SYNCED_AT,
      canonical_host: COMPANY.url,
      www_policy: "non-www apex only; never link to https://www.hellogrowthcrm.com",
      default_description: COMPANY.defaultDescription,
      twitter: COMPANY.twitter,
      brand_name: COMPANY.name,
      legal_name: COMPANY.legalName,
      alternate_names: COMPANY.alternateNames,
    });
  },
});

// ── seo_get_hreflang ────────────────────────────────────────────────────────────

export const seoGetHreflang = defineTool({
  schema: z.object({
    path: z.string().describe("Site-relative path, e.g. /, /pricing, /usa, /crm-for-builders-australia, /in/crm-hindi."),
  }),
  definition: {
    name: "seo_get_hreflang",
    description:
      "Return the exact hreflang alternate tag set hellogrowthcrm.com emits for a given path (faithful port of lib/hreflang.ts). Use to verify country/language targeting and bidirectional mesh.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "Site-relative path." } },
      required: ["path"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    const tags = getHreflangTags(args.path);
    return ok({ synced_at: SYNCED_AT, path: args.path, count: tags.length, hreflang: tags });
  },
});

// ── seo_get_canonical ───────────────────────────────────────────────────────────

export const seoGetCanonical = defineTool({
  schema: z.object({
    path: z.string().describe("Site-relative path to resolve to its canonical absolute URL."),
  }),
  definition: {
    name: "seo_get_canonical",
    description:
      "Resolve a site-relative path to its canonical absolute URL on the apex host (no www, no trailing slash).",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "Site-relative path." } },
      required: ["path"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    return ok({ synced_at: SYNCED_AT, path: args.path, canonical: getCanonicalUrl(args.path) });
  },
});

// ── seo_get_sitemaps ────────────────────────────────────────────────────────────

export const seoGetSitemaps = defineTool({
  schema: z.object({}),
  definition: {
    name: "seo_get_sitemaps",
    description:
      "Return the sitemap index and all child sitemaps for hellogrowthcrm.com (core, blog, help, tools, industries, alternatives, agentic-ai, image, video).",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async handle(_args) {
    return ok({ synced_at: SYNCED_AT, index: SITEMAPS.index, child_count: SITEMAPS.children.length, children: SITEMAPS.children });
  },
});

// ── seo_get_schema ──────────────────────────────────────────────────────────────

export const seoGetSchema = defineTool({
  schema: z.object({
    include_org_jsonld: z.boolean().default(true).describe("Include the live Organization JSON-LD object."),
  }),
  definition: {
    name: "seo_get_schema",
    description:
      "List the structured-data (JSON-LD) types hellogrowthcrm.com emits and their scope, plus the live Organization schema object. Note: FAQPage JSON-LD is permanently retired site-wide.",
    inputSchema: {
      type: "object",
      properties: { include_org_jsonld: { type: "boolean", default: true } },
      additionalProperties: false,
    },
  },
  async handle(args) {
    return ok({
      synced_at: SYNCED_AT,
      retired_types: ["FAQPage (permanently retired 2026-05-07; never emit)"],
      schema_types: SCHEMA_TYPES,
      organization_jsonld: args.include_org_jsonld ? orgSchema() : undefined,
    });
  },
});

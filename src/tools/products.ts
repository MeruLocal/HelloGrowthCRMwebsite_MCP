import { z } from "zod";
import { defineTool, ok, fail } from "./tool-types.js";
import { PRODUCTS, SYNCED_AT } from "../data/website-mirror.js";

// ── products_list ───────────────────────────────────────────────────────────────

export const productsList = defineTool({
  schema: z.object({
    search: z.string().optional().describe("Filter products by keyword in slug or title."),
  }),
  definition: {
    name: "products_list",
    description:
      "List HelloGrowthCRM product / feature pages served at /product/[slug] (AI Pipeline, Built-in Dialer, HelloMail, Predictive Analytics, etc.).",
    inputSchema: {
      type: "object",
      properties: { search: { type: "string", description: "Keyword filter on slug or title." } },
      additionalProperties: false,
    },
  },
  async handle(args) {
    let products = PRODUCTS;
    if (args.search) {
      const q = args.search.toLowerCase();
      products = products.filter((p) => p.slug.includes(q) || p.title.toLowerCase().includes(q));
    }
    return ok({
      synced_at: SYNCED_AT,
      total: PRODUCTS.length,
      filtered_count: products.length,
      products: products.map((p) => ({ ...p, url: `https://hellogrowthcrm.com/product/${p.slug}` })),
    });
  },
});

// ── product_get ─────────────────────────────────────────────────────────────────

export const productGet = defineTool({
  schema: z.object({
    slug: z.string().describe("Product slug, e.g. ai-pipeline, built-in-dialer, hello-mail."),
  }),
  definition: {
    name: "product_get",
    description: "Get a single HelloGrowthCRM product/feature page by slug with its canonical URL.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string", description: "Product slug." } },
      required: ["slug"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    const product = PRODUCTS.find((p) => p.slug === args.slug.toLowerCase());
    if (!product) {
      return fail(`Product "${args.slug}" not found. Use products_list to see all slugs.`);
    }
    return ok({ synced_at: SYNCED_AT, ...product, url: `https://hellogrowthcrm.com/product/${product.slug}` });
  },
});

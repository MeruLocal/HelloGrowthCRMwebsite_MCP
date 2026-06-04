import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";
import { defineTool, fail, ok } from "./tool-types.js";

// ── help_list_categories ──────────────────────────────────────────────────────

export const helpListCategories = defineTool({
  schema: z.object({}),
  definition: {
    name: "help_list_categories",
    description: "List all help center categories from the database.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  async handle(_args) {
    try {
      const { data, error } = await getSupabase()
        .from("help_categories")
        .select("*")
        .order("title");
      if (error) return fail(`Error: ${error.message}`);
      return ok({ count: data?.length ?? 0, categories: data });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

// ── help_list_articles ────────────────────────────────────────────────────────

export const helpListArticles = defineTool({
  schema: z.object({
    category_slug: z.string().optional().describe("Filter by category slug."),
    limit: z.number().int().positive().max(100).default(20),
    offset: z.number().int().min(0).default(0),
  }),
  definition: {
    name: "help_list_articles",
    description: "List help articles, optionally filtered by category slug.",
    inputSchema: {
      type: "object",
      properties: {
        category_slug: { type: "string" },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        offset: { type: "integer", minimum: 0, default: 0 },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      let query = getSupabase()
        .from("help_articles")
        .select("slug, title, category_slug, estimated_minutes, intro")
        .order("title")
        .range(args.offset, args.offset + args.limit - 1);

      if (args.category_slug) {
        query = query.eq("category_slug", args.category_slug);
      }

      const { data, error } = await query;
      if (error) return fail(`Error: ${error.message}`);
      return ok({ count: data?.length ?? 0, offset: args.offset, articles: data });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

// ── help_get_article ──────────────────────────────────────────────────────────

export const helpGetArticle = defineTool({
  schema: z.object({
    slug: z.string().describe("Help article slug."),
  }),
  definition: {
    name: "help_get_article",
    description: "Fetch a single help article by slug including steps and FAQs.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string" },
      },
      required: ["slug"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      const { data, error } = await getSupabase()
        .from("help_articles")
        .select("*")
        .eq("slug", args.slug)
        .single();
      if (error) return fail(`Article not found or error: ${error.message}`);
      return ok(data);
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

// ── help_search ───────────────────────────────────────────────────────────────

export const helpSearch = defineTool({
  schema: z.object({
    query: z.string().min(2).describe("Search query."),
    limit: z.number().int().positive().max(20).default(10),
  }),
  definition: {
    name: "help_search",
    description: "Full-text search across help article titles and intro text.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 2 },
        limit: { type: "integer", minimum: 1, maximum: 20, default: 10 },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      const { data, error } = await getSupabase()
        .from("help_articles")
        .select("slug, title, category_slug, estimated_minutes, intro")
        .or(`title.ilike.%${args.query}%,intro.ilike.%${args.query}%`)
        .limit(args.limit);
      if (error) return fail(`Search error: ${error.message}`);
      return ok({ query: args.query, count: data?.length ?? 0, results: data });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

// ── help_create_article ───────────────────────────────────────────────────────

export const helpCreateArticle = defineTool({
  schema: z.object({
    slug: z.string().min(3),
    title: z.string().min(5),
    category_slug: z.string(),
    intro: z.string().optional(),
    estimated_minutes: z.number().int().positive().optional(),
    steps: z.array(z.record(z.unknown())).optional().describe("Array of step objects."),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    cover_image: z.string().url().optional(),
  }),
  definition: {
    name: "help_create_article",
    description: "Create a new help center article.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", minLength: 3 },
        title: { type: "string", minLength: 5 },
        category_slug: { type: "string" },
        intro: { type: "string" },
        estimated_minutes: { type: "integer", minimum: 1 },
        steps: { type: "array", items: { type: "object" } },
        faqs: { type: "array", items: { type: "object", properties: { q: { type: "string" }, a: { type: "string" } } } },
        cover_image: { type: "string", format: "uri" },
      },
      required: ["slug", "title", "category_slug"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      const { data, error } = await getSupabase()
        .from("help_articles")
        .insert(args)
        .select("slug, title, category_slug")
        .single();
      if (error) return fail(`Insert error: ${error.message}`);
      return ok({ message: "Help article created.", article: data });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

// ── help_update_article ───────────────────────────────────────────────────────

export const helpUpdateArticle = defineTool({
  schema: z.object({
    slug: z.string().describe("Slug of the article to update."),
    title: z.string().optional(),
    intro: z.string().optional(),
    estimated_minutes: z.number().int().positive().optional(),
    steps: z.array(z.record(z.unknown())).optional(),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
    cover_image: z.string().url().optional(),
  }),
  definition: {
    name: "help_update_article",
    description: "Update fields on an existing help article by slug.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string" },
        title: { type: "string" },
        intro: { type: "string" },
        estimated_minutes: { type: "integer", minimum: 1 },
        steps: { type: "array", items: { type: "object" } },
        faqs: { type: "array", items: { type: "object" } },
        cover_image: { type: "string", format: "uri" },
      },
      required: ["slug"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      const { slug, ...fields } = args;
      const { data, error } = await getSupabase()
        .from("help_articles")
        .update(fields)
        .eq("slug", slug)
        .select("slug, title")
        .single();
      if (error) return fail(`Update error: ${error.message}`);
      return ok({ message: "Help article updated.", article: data });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";
import { defineTool, fail, ok } from "./tool-types.js";

// ── blog_list ────────────────────────────────────────────────────────────────

export const blogList = defineTool({
  schema: z.object({
    limit: z.number().int().positive().max(100).default(20),
    offset: z.number().int().min(0).default(0),
    category: z.string().optional().describe("Filter by category slug or name."),
  }),
  definition: {
    name: "blog_list",
    description: "List blog posts with pagination and optional category filter. Returns slug, title, author, category, published_at, meta_description.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        offset: { type: "integer", minimum: 0, default: 0 },
        category: { type: "string", description: "Filter by category." },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      const db = getSupabase();
      let query = db
        .from("blog_posts")
        .select("slug, title, author, category, published_at, meta_description, cover_image")
        .order("published_at", { ascending: false })
        .range(args.offset, args.offset + args.limit - 1);

      if (args.category) {
        query = query.ilike("category", `%${args.category}%`);
      }

      const { data, error, count } = await query;
      if (error) return fail(`Supabase error: ${error.message}`);
      return ok({ total: count, offset: args.offset, limit: args.limit, posts: data });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

// ── blog_get ─────────────────────────────────────────────────────────────────

export const blogGet = defineTool({
  schema: z.object({
    slug: z.string().describe("Blog post slug."),
  }),
  definition: {
    name: "blog_get",
    description: "Fetch a single blog post by its slug, including full content.",
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
        .from("blog_posts")
        .select("*")
        .eq("slug", args.slug)
        .single();
      if (error) return fail(`Post not found or error: ${error.message}`);
      return ok(data);
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

// ── blog_search ───────────────────────────────────────────────────────────────

export const blogSearch = defineTool({
  schema: z.object({
    query: z.string().min(2).describe("Search query."),
    limit: z.number().int().positive().max(50).default(10),
  }),
  definition: {
    name: "blog_search",
    description: "Full-text search across blog post titles, content, and meta descriptions.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 2 },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      const { data, error } = await getSupabase()
        .from("blog_posts")
        .select("slug, title, author, category, published_at, meta_description")
        .or(`title.ilike.%${args.query}%,meta_description.ilike.%${args.query}%,content.ilike.%${args.query}%`)
        .order("published_at", { ascending: false })
        .limit(args.limit);
      if (error) return fail(`Search error: ${error.message}`);
      return ok({ query: args.query, count: data?.length ?? 0, results: data });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

// ── blog_create ───────────────────────────────────────────────────────────────

export const blogCreate = defineTool({
  schema: z.object({
    slug: z.string().min(3),
    title: z.string().min(5),
    content: z.string().min(100),
    author: z.string().default("Rushabh Shah"),
    category: z.string().optional(),
    meta_description: z.string().max(160).optional(),
    cover_image: z.string().url().optional(),
    published_at: z.string().optional().describe("ISO 8601 datetime. Defaults to now."),
  }),
  definition: {
    name: "blog_create",
    description: "Insert a new blog post into the database.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", minLength: 3 },
        title: { type: "string", minLength: 5 },
        content: { type: "string", minLength: 100 },
        author: { type: "string", default: "Rushabh Shah" },
        category: { type: "string" },
        meta_description: { type: "string", maxLength: 160 },
        cover_image: { type: "string", format: "uri" },
        published_at: { type: "string", description: "ISO 8601 datetime." },
      },
      required: ["slug", "title", "content"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      const { data, error } = await getSupabase()
        .from("blog_posts")
        .insert({ ...args, published_at: args.published_at ?? new Date().toISOString() })
        .select("slug, title, published_at")
        .single();
      if (error) return fail(`Insert error: ${error.message}`);
      return ok({ message: "Blog post created.", post: data });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

// ── blog_update ───────────────────────────────────────────────────────────────

export const blogUpdate = defineTool({
  schema: z.object({
    slug: z.string().describe("Slug of the post to update."),
    title: z.string().optional(),
    content: z.string().optional(),
    author: z.string().optional(),
    category: z.string().optional(),
    meta_description: z.string().max(160).optional(),
    cover_image: z.string().url().optional(),
  }),
  definition: {
    name: "blog_update",
    description: "Update fields on an existing blog post by slug.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string" },
        title: { type: "string" },
        content: { type: "string" },
        author: { type: "string" },
        category: { type: "string" },
        meta_description: { type: "string", maxLength: 160 },
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
        .from("blog_posts")
        .update(fields)
        .eq("slug", slug)
        .select("slug, title")
        .single();
      if (error) return fail(`Update error: ${error.message}`);
      return ok({ message: "Blog post updated.", post: data });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

// ── blog_revalidate ───────────────────────────────────────────────────────────

export const blogRevalidate = defineTool({
  schema: z.object({
    slug: z.string().optional().describe("Specific slug to revalidate. Omit to revalidate the blog index."),
  }),
  definition: {
    name: "blog_revalidate",
    description: "Trigger ISR cache revalidation for a blog post or the blog index on hellogrowthcrm.com.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Specific post slug. Omit to revalidate index." },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    try {
      const siteUrl = process.env.DEFAULT_TARGET_URL ?? "https://hellogrowthcrm.com";
      const path = args.slug ? `/blog/${args.slug}` : "/blog";
      const url = `${siteUrl}/api/admin/blog/revalidate`;
      const { fetch } = await import("undici");
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: args.slug }),
      });
      if (!res.ok) return fail(`Revalidation request failed: HTTP ${res.status}`);
      return ok({ message: `Revalidation triggered for ${path}`, status: res.status });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

// ── blog_get_categories ───────────────────────────────────────────────────────

export const blogGetCategories = defineTool({
  schema: z.object({}),
  definition: {
    name: "blog_get_categories",
    description: "List all distinct blog categories present in the database.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  async handle(_args) {
    try {
      const { data, error } = await getSupabase()
        .from("blog_posts")
        .select("category")
        .not("category", "is", null)
        .order("category");
      if (error) return fail(`Error: ${error.message}`);
      const categories = [...new Set((data ?? []).map((r) => r.category as string))].filter(Boolean);
      return ok({ count: categories.length, categories });
    } catch (e) {
      return fail((e as Error).message);
    }
  },
});

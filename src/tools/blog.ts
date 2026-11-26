import { z } from "zod";
import { getSupabase } from "../lib/supabase.js";
import { defineTool, fail, ok } from "./tool-types.js";
import { logger } from "../utils/logger.js";

// ── blog_list ────────────────────────────────────────────────────────────────

export const blogList = defineTool({
  schema: z.object({
    limit: z.number().int().positive().max(100).default(20),
    offset: z.number().int().min(0).default(0),
    category: z.string().optional().describe("Filter by category slug or name."),
  }),
  definition: {
    name: "blog_list",
    description: "List blog posts with pagination and optional category filter. Returns slug, title, author, category, published_at, excerpt.",
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
        .select("slug, title, author, category, published_at, excerpt, cover_image")
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

// Was a single .or() over title, excerpt AND content. `content` is the full post
// body and has no trigram index, so `content ILIKE '%q%'` seq-scans every post
// body and on PROD hit "canceling statement due to statement timeout" (live
// audit 2026-11-19, query=whatsapp) — the tool failed every time.
//
// Now: title + excerpt first (small columns, fast), and a content pass only to
// top up a short result set. The content pass is best-effort: if it errors or
// times out, the title/excerpt hits are still returned, with a note.
//
// The query is also reduced to plain search text before it reaches the
// PostgREST filter grammar: `,` `(` `)` separate or()-conditions and `%` `*` `\`
// are LIKE wildcards/escapes, so an unsanitised query could add filter clauses.

/** Reduce a free-text query to characters that are safe inside an or() ilike filter. */
export function sanitizeSearchQuery(q: string): string {
  return q.replace(/[,()%*\\:"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}

const BLOG_SEARCH_FIELDS = "slug, title, author, category, published_at, excerpt";

export const blogSearch = defineTool({
  schema: z.object({
    query: z.string().min(2).describe("Search query."),
    limit: z.number().int().positive().max(50).default(10),
  }),
  definition: {
    name: "blog_search",
    description:
      "Search blog posts by keyword. Matches titles and excerpts first, then tops up from post bodies when there are few title/excerpt matches.",
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
      const q = sanitizeSearchQuery(args.query);
      if (q.length < 2) return fail("Search query must contain at least 2 letters or digits.");
      const db = getSupabase();

      const { data: head, error } = await db
        .from("blog_posts")
        .select(BLOG_SEARCH_FIELDS)
        .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`)
        .order("published_at", { ascending: false })
        .limit(args.limit);
      if (error) {
        logger.warn("blog_search: title/excerpt query failed", { message: error.message });
        return fail("Search failed. Try blog_list, or a shorter query.");
      }

      const results = [...(head ?? [])];
      let note: string | undefined;
      if (results.length < args.limit) {
        const seen = new Set(results.map((r) => r.slug));
        const { data: body, error: bodyErr } = await db
          .from("blog_posts")
          .select(BLOG_SEARCH_FIELDS)
          .ilike("content", `%${q}%`)
          .order("published_at", { ascending: false })
          .limit(args.limit);
        if (bodyErr) {
          logger.warn("blog_search: content top-up failed", { message: bodyErr.message });
          note = "Matched titles and excerpts only; the full-text pass over post bodies did not complete.";
        } else {
          for (const r of body ?? []) {
            if (results.length >= args.limit) break;
            if (!seen.has(r.slug)) results.push(r);
          }
        }
      }

      return ok({ query: args.query, count: results.length, results, ...(note ? { note } : {}) });
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
    excerpt: z.string().max(320).optional().describe("Short summary shown in listings and meta description."),
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
        excerpt: { type: "string", maxLength: 320 },
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
    excerpt: z.string().max(320).optional().describe("Short summary shown in listings and meta description."),
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
        excerpt: { type: "string", maxLength: 320 },
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

/**
 * Public Supabase-backed read tools must not return Supabase/Postgres error
 * text (schema enumeration). One case per tool.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ mode: "error" as "error" | "throw" | "notfound" }));
const SECRET = 'relation "secret_schema.blog_posts" does not exist';

vi.mock("../../lib/supabase.js", () => {
  const result = () => {
    if (state.mode === "throw") throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    return Promise.resolve({
      data: null,
      error: state.mode === "notfound" ? { code: "PGRST116", message: SECRET } : { message: SECRET },
    });
  };
  // A chainable query builder whose every step returns itself and which is
  // thenable at any point.
  const builder: Record<string, unknown> = {};
  for (const m of ["select", "eq", "order", "range", "limit", "or", "ilike", "not", "textSearch", "neq", "in", "is"]) {
    builder[m] = () => builder;
  }
  builder.single = () => result();
  builder.then = (ok: (v: unknown) => unknown, bad: (e: unknown) => unknown) => {
    try {
      return result().then(ok, bad);
    } catch (e) {
      return Promise.reject(e).then(ok, bad);
    }
  };
  return {
    getSupabase: () => {
      if (state.mode === "throw") throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
      return { from: () => builder };
    },
  };
});

const blog = await import("../blog.js");
const help = await import("../help.js");

const cases: [string, { schema: { parse: (a: unknown) => unknown }; handle: (a: never) => Promise<{ isError?: boolean; content: { text: string }[] }> }, Record<string, unknown>][] = [
  ["blog_list", blog.blogList, {}],
  ["blog_get", blog.blogGet, { slug: "x" }],
  ["blog_search", blog.blogSearch, { query: "crm" }],
  ["blog_get_categories", blog.blogGetCategories, {}],
  ["help_list_categories", help.helpListCategories, {}],
  ["help_list_articles", help.helpListArticles, {}],
  ["help_get_article", help.helpGetArticle, { slug: "x" }],
  ["help_search", help.helpSearch, { query: "crm" }],
];

describe.each(cases)("%s", (_name, tool, args) => {
  beforeEach(() => {
    state.mode = "error";
  });

  it("a Supabase error returns a generic message", async () => {
    const res = await tool.handle(tool.schema.parse(args) as never);
    expect(res.isError).toBe(true);
    expect(res.content[0]!.text).not.toMatch(/secret_schema|does not exist|relation/);
  });

  it("a thrown configuration error is not echoed", async () => {
    state.mode = "throw";
    const res = await tool.handle(tool.schema.parse(args) as never);
    expect(res.isError).toBe(true);
    expect(res.content[0]!.text).not.toMatch(/SUPABASE/);
  });
});

describe("not found stays specific", () => {
  it("blog_get and help_get_article say 'not found' on PGRST116 without the DB text", async () => {
    state.mode = "notfound";
    const b = await blog.blogGet.handle(blog.blogGet.schema.parse({ slug: "x" }));
    const h = await help.helpGetArticle.handle(help.helpGetArticle.schema.parse({ slug: "x" }));
    expect(b.content[0]!.text).toBe("Post not found.");
    expect(h.content[0]!.text).toBe("Article not found.");
  });
});

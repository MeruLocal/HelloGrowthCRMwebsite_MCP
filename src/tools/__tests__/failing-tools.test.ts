import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Regression tests for two tools that failed on every live call (MCP audit
 * 2026-11-19):
 *   - blog_search: "canceling statement due to statement timeout" — a single
 *     .or() ILIKE over the full post body;
 *   - analytics_social_proof: "column newsletter_subscribers.status does not
 *     exist" — the table has no status column (it has unsubscribed_at).
 *
 * A small fake of the supabase-js builder records every filter call so the
 * tests can assert WHAT is queried, and lets a test make one pass fail.
 */

type Call = { table: string; ops: [string, ...unknown[]][] };
const state = vi.hoisted(() => ({
  calls: [] as Call[],
  responder: (_c: Call): { data: unknown; error: unknown } => ({ data: [], error: null }),
}));

vi.mock("../../lib/supabase.js", () => ({
  getSupabase: () => ({
    from(table: string) {
      const call: Call = { table, ops: [] };
      state.calls.push(call);
      const b: Record<string, unknown> = {};
      for (const op of ["select", "or", "ilike", "is", "eq", "order", "limit", "range"]) {
        b[op] = (...a: unknown[]) => {
          call.ops.push([op, ...a]);
          return b;
        };
      }
      b.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
        Promise.resolve(state.responder(call)).then(resolve, reject);
      return b;
    },
  }),
}));

const { blogSearch, sanitizeSearchQuery } = await import("../blog.js");
const { analyticsSocialProof } = await import("../analytics.js");

const has = (c: Call, op: string) => c.ops.find((o) => o[0] === op);

async function run(tool: { handle: (a: never) => Promise<unknown> }, args: unknown) {
  const res = (await tool.handle(args as never)) as { isError?: boolean; content: { text: string }[] };
  return { res, json: res.isError ? null : JSON.parse(res.content[0]!.text) };
}

beforeEach(() => {
  state.calls = [];
  state.responder = () => ({ data: [], error: null });
});

describe("blog_search", () => {
  it("searches title + excerpt first, never content in the same .or()", async () => {
    state.responder = (c) =>
      has(c, "or")
        ? { data: [{ slug: "a", title: "WhatsApp CRM guide" }], error: null }
        : { data: [{ slug: "b", title: "Body hit" }], error: null };
    const { res, json } = await run(blogSearch, { query: "whatsapp", limit: 10 });
    expect(res.isError).toBeFalsy();
    const orCall = has(state.calls[0]!, "or")!;
    expect(String(orCall[1])).toBe("title.ilike.%whatsapp%,excerpt.ilike.%whatsapp%");
    expect(String(orCall[1])).not.toContain("content");
    expect(json.results.map((r: { slug: string }) => r.slug)).toEqual(["a", "b"]);
  });

  it("returns the title/excerpt hits when the content pass times out", async () => {
    state.responder = (c) =>
      has(c, "or")
        ? { data: [{ slug: "a" }], error: null }
        : { data: null, error: { message: "canceling statement due to statement timeout" } };
    const { res, json } = await run(blogSearch, { query: "whatsapp", limit: 10 });
    expect(res.isError).toBeFalsy();
    expect(json.count).toBe(1);
    expect(json.note).toMatch(/titles and excerpts only/);
    expect(JSON.stringify(json)).not.toContain("statement timeout");
  });

  it("skips the content pass when title/excerpt already fill the limit", async () => {
    state.responder = () => ({ data: [{ slug: "a" }, { slug: "b" }], error: null });
    await run(blogSearch, { query: "crm", limit: 2 });
    expect(state.calls.length).toBe(1);
  });

  it("strips PostgREST filter syntax from the query", () => {
    expect(sanitizeSearchQuery("crm),status.eq.draft")).toBe("crm status.eq.draft");
    expect(sanitizeSearchQuery("50% off*")).toBe("50 off");
  });
});

describe("analytics_social_proof", () => {
  it("filters active subscribers on unsubscribed_at, never a status column", async () => {
    state.responder = () => ({ data: [{ subscribed_at: "2026-11-01T00:00:00Z" }], error: null });
    const { res, json } = await run(analyticsSocialProof, { limit: 5 });
    expect(res.isError).toBeFalsy();
    const c = state.calls[0]!;
    expect(c.table).toBe("newsletter_subscribers");
    expect(has(c, "eq")).toBeUndefined();
    expect(has(c, "is")).toEqual(["is", "unsubscribed_at", null]);
    expect(json.recent_signups_count).toBe(1);
  });

  it("returns no email, masked or otherwise", async () => {
    state.responder = () => ({ data: [{ subscribed_at: "2026-11-01T00:00:00Z" }], error: null });
    const { json } = await run(analyticsSocialProof, { limit: 5 });
    expect(String(has(state.calls[0]!, "select")![1])).not.toContain("email");
    expect(JSON.stringify(json)).not.toMatch(/@|email":/);
  });

  it("does not leak a Postgres error to the public caller", async () => {
    state.responder = () => ({ data: null, error: { message: "column newsletter_subscribers.x does not exist" } });
    const { res } = await run(analyticsSocialProof, { limit: 5 });
    expect(res.isError).toBe(true);
    expect(res.content[0]!.text).not.toContain("does not exist");
  });
});

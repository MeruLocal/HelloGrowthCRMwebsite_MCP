/**
 * get_started (#69), integrations truthfulness (#72), paging + central cap (#73).
 */
import { describe, expect, it } from "vitest";

import { getStarted } from "../get-started.js";
import { PAGED_LIST_TOOLS, toolsByName } from "../index.js";
import { BadCursorError, capToolResult, decodeCursor, encodeCursor, paginate } from "../paginate.js";

async function call(name: string, args: Record<string, unknown> = {}) {
  const tool = toolsByName.get(name)!;
  const res = await tool.handle(tool.schema.parse(args));
  return { res, text: res.content[0]!.text, json: () => JSON.parse(res.content[0]!.text) };
}

describe("get_started", () => {
  it("returns only own-host, UTM-tagged links and no prices", async () => {
    const res = await getStarted.handle(getStarted.schema.parse({ country: "in" }));
    const out = JSON.parse(res.content[0]!.text);
    for (const k of ["signup_url", "demo_url", "contact_url", "pricing_url"]) {
      const u = new URL(out[k]);
      expect(u.hostname.endsWith("hellogrowthcrm.com")).toBe(true);
      expect(u.searchParams.get("utm_campaign")).toBe("get_started");
      expect(u.searchParams.get("utm_source")).toBe("mcp");
    }
    expect(out.pricing_url).toContain("/in/pricing");
    expect(res.content[0]!.text).not.toMatch(/[₹$£€]|\d+\s*\/\s*user/);
  });

  it("an unknown country falls back to the global pricing page", async () => {
    const out = JSON.parse((await getStarted.handle(getStarted.schema.parse({ country: "atlantis" }))).content[0]!.text);
    expect(new URL(out.pricing_url).pathname).toBe("/pricing");
    expect(out.notes[0]).toMatch(/global pricing page/);
  });
});

describe("integrations are truthful by default (#72)", () => {
  async function allPages(name: string, args: Record<string, unknown> = {}) {
    const key = PAGED_LIST_TOOLS[name]!;
    const rows: Record<string, unknown>[] = [];
    let cursor: string | undefined;
    let total = 0;
    do {
      const out = (await call(name, { ...args, limit: 200, ...(cursor ? { cursor } : {}) })).json();
      rows.push(...out[key]);
      total = out.page.total;
      cursor = out.page.next_cursor ?? undefined;
    } while (cursor);
    return { rows, total };
  }

  it("no description in the dataset reads 'Creates a planned …'", async () => {
    const { rows } = await allPages("integrations_list", { include_planned: true });
    expect(rows.filter((r) => /^Creates a planned/.test(String(r.description)))).toEqual([]);
  });

  it("default list is shipped only; include_planned adds planned rows marked unavailable", async () => {
    const def = await allPages("integrations_list");
    expect(def.rows.length).toBeGreaterThan(0);
    expect(new Set(def.rows.map((r) => r.status))).toEqual(new Set(["live", "backend-ready"]));
    expect(def.rows.every((r) => r.available === true)).toBe(true);

    const all = await allPages("integrations_list", { include_planned: true });
    const planned = all.rows.filter((r) => r.status === "planned");
    expect(planned.length).toBeGreaterThan(0);
    expect(planned.every((r) => r.available === false)).toBe(true);
  });

  it("drops non-integration rows", async () => {
    const { rows } = await allPages("integrations_list", { include_planned: true });
    expect(rows.filter((r) => r.category === "what-customers-see" || r.category === "steps-for-engineering")).toEqual([]);
    const slugs = new Set(rows.map((r) => r.slug));
    for (const s of ["system", "email-digest", "removes-expired-context", "token-url", "the-standard-pattern-is"]) {
      expect(slugs.has(s)).toBe(false);
    }
  });

  it("integrations_get on a planned slug says planned / unavailable", async () => {
    const out = (await call("integrations_get", { slug: "nobroker" })).json();
    expect(out).toMatchObject({ status: "planned", available: false });
    expect(out.description).toMatch(/Not yet available/);
  });

  it("the returned count equals the array length", async () => {
    const out = (await call("integrations_list", { limit: 200 })).json();
    expect(out.page.returned).toBe(out.items.length);
    const { rows, total } = await allPages("integrations_list");
    expect(rows.length).toBe(total);
    expect(out.shipped_count).toBe(total);
  });
});

describe("paginate (#73)", () => {
  const items = Array.from({ length: 120 }, (_, i) => ({ i }));

  it("first page, following page and last page", () => {
    const p1 = paginate(items, { limit: 50 });
    expect(p1).toMatchObject({ total: 120, has_more: true });
    expect(p1.items[0]).toEqual({ i: 0 });
    const p2 = paginate(items, { limit: 50, cursor: p1.next_cursor! });
    expect(p2.items[0]).toEqual({ i: 50 });
    const p3 = paginate(items, { limit: 50, cursor: p2.next_cursor! });
    expect(p3).toMatchObject({ has_more: false, next_cursor: null });
    expect(p3.items).toHaveLength(20);
  });

  it("a bad cursor is an error, not page 1", () => {
    expect(() => paginate(items, { cursor: "not-a-cursor" })).toThrow(BadCursorError);
    expect(() => paginate(items, { cursor: encodeCursor(999) })).toThrow(BadCursorError);
    expect(decodeCursor(encodeCursor(7))).toBe(7);
  });

  it("stops before maxChars and says so", () => {
    const big = Array.from({ length: 10 }, () => ({ s: "x".repeat(1000) }));
    const p = paginate(big, { maxChars: 3000 });
    expect(p.items.length).toBe(2);
    expect(p.truncated_note).toMatch(/next_cursor/);
  });

  it("a tool with a bad cursor returns an error", async () => {
    const { res } = await call("glossary_list_terms", { cursor: "garbage" });
    expect(res.isError).toBe(true);
  });

  it("every paged list tool called with {} stays under 24,000 characters of items", async () => {
    for (const [name, key] of Object.entries(PAGED_LIST_TOOLS)) {
      const out = (await call(name)).json();
      expect(JSON.stringify(out[key]).length, name).toBeLessThanOrEqual(24_000 + 2_000);
      expect(typeof out.page.has_more, name).toBe("boolean");
    }
  });

  it("every paged list response text stays under ~30k characters", async () => {
    for (const name of Object.keys(PAGED_LIST_TOOLS)) {
      const { text } = await call(name);
      expect(text.length, name).toBeLessThan(30_000);
    }
  });

  it("walking all pages of integrations_list returns exactly total unique slugs", async () => {
    const seen: string[] = [];
    let cursor: string | undefined;
    let total = 0;
    do {
      const out = (await call("integrations_list", { include_planned: true, ...(cursor ? { cursor } : {}) })).json();
      seen.push(...out.items.map((r: { slug: string }) => r.slug));
      total = out.page.total;
      cursor = out.page.next_cursor ?? undefined;
    } while (cursor);
    expect(seen.length).toBe(total);
    expect(new Set(seen).size).toBe(total);
  });

  it("the central cap cuts a 150k-character result with a note", () => {
    const out = capToolResult({ content: [{ type: "text", text: "y".repeat(150_000) }] });
    expect(out.content[0]!.text.length).toBeLessThan(100_200);
    expect(out.content[0]!.text).toMatch(/truncated by the server/);
  });

  it("capped JSON still parses: trimmed at an item boundary", () => {
    const rows = Array.from({ length: 5000 }, (_, i) => ({ id: i, name: `row-${i}`, pad: "z".repeat(40) }));
    const text = JSON.stringify({ status: "ok", rows }, null, 2);
    const out = capToolResult({ content: [{ type: "text", text }] }, 20_000).content[0]!.text;
    expect(out.length).toBeLessThanOrEqual(20_000);
    const parsed = JSON.parse(out);
    expect(parsed.status).toBe("ok");
    expect(parsed._truncated).toBe(true);
    expect(parsed.original_count).toBe(5000);
    expect(parsed.rows.length).toBe(parsed.returned);
    expect(parsed.rows.length).toBeGreaterThan(0);
    expect(parsed.rows.length).toBeLessThan(5000);
    expect(parsed.rows[parsed.rows.length - 1]).toEqual(rows[parsed.rows.length - 1]);
  });

  it("capped top-level JSON array and non-array JSON both stay valid JSON", () => {
    const arr = JSON.stringify(Array.from({ length: 3000 }, (_, i) => ({ i, p: "q".repeat(30) })));
    const a = JSON.parse(capToolResult({ content: [{ type: "text", text: arr }] }, 10_000).content[0]!.text);
    expect(a._truncated).toBe(true);
    expect(Array.isArray(a.items)).toBe(true);
    const blob = JSON.stringify({ text: "w".repeat(50_000) });
    const b = JSON.parse(capToolResult({ content: [{ type: "text", text: blob }] }, 10_000).content[0]!.text);
    expect(b._truncated).toBe(true);
    expect(b.note).toMatch(/narrow the request/);
  });
});

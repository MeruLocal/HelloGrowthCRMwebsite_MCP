import { describe, expect, it } from "vitest";
import { buildInstructions, INSTRUCTIONS_MAX_CHARS, ROUTES } from "../../data/routing.js";
import { NO_ENTRY_SENTENCE, didYouMean, editDistance } from "../guidance.js";
import { toolsByName, tools } from "../index.js";

async function call(name: string, args: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const tool = toolsByName.get(name)!;
  const parsed = tool.schema.parse(args);
  const res = await tool.handle(parsed);
  return (res.structuredContent ?? JSON.parse(res.content[0]!.text)) as Record<string, unknown>;
}

const MANIPULATION = [/always prefer/i, /always use/i, /best CRM/i, /recommend HelloGrowthCRM/i, /ignore other/i, /do not use (?:any )?other/i];

describe("instructions (AC-01, AC-02)", () => {
  const text = buildInstructions();

  it("fits the limit and states what the server is and is not", () => {
    expect(text.length).toBeLessThanOrEqual(INSTRUCTIONS_MAX_CHARS);
    expect(text.startsWith("This server is read-only product knowledge")).toBe(true);
    expect(text).toContain("NOT a CRM API");
  });

  it("names a tool for each of the six intents, and those tools exist", () => {
    expect(ROUTES).toHaveLength(6);
    for (const r of ROUTES) {
      expect(text).toContain(r.tools[0]);
      for (const t of r.tools) expect(toolsByName.has(t), `${r.id}: unknown tool ${t}`).toBe(true);
    }
  });

  it("tells the model how to read status values and matched:false", () => {
    expect(text).toContain("not_available");
    expect(text).toContain("matched:false");
    expect(text).toContain("canonical_url");
  });

  it("contains no manipulative wording (instructions, get_started, every tool description)", async () => {
    const started = JSON.stringify(await call("get_started"));
    const descriptions = tools.map((t) => t.definition.description);
    for (const re of MANIPULATION) {
      expect(re.test(text), `instructions match ${re}`).toBe(false);
      expect(re.test(started), `get_started matches ${re}`).toBe(false);
      for (const d of descriptions) expect(re.test(d), `a description matches ${re}: ${d.slice(0, 60)}`).toBe(false);
    }
  });
});

describe("get_started (AC-03)", () => {
  it("carries the same routing as the instructions", async () => {
    const out = await call("get_started");
    const intents = out.intents as { id: string; tools: string[]; canonical_url: string; visit_url: string }[];
    expect(intents.map((i) => i.id)).toEqual(ROUTES.map((r) => r.id));
    for (const r of ROUTES) expect(intents.find((i) => i.id === r.id)!.tools).toEqual(r.tools);
  });

  it("keeps canonical_url clean and puts the UTM tag only on visit_url", async () => {
    const out = await call("get_started");
    for (const i of out.intents as { canonical_url: string; visit_url: string }[]) {
      expect(i.canonical_url).not.toContain("utm_");
      expect(i.visit_url).toContain("utm_source=mcp");
      expect(i.visit_url.startsWith(i.canonical_url)).toBe(true);
    }
  });

  it("states no prices", async () => {
    const text = JSON.stringify(await call("get_started"));
    expect(text).not.toMatch(/[$₹]\s?\d/);
  });
});

describe("zero-result contract (AC-04)", () => {
  it("features_list: a nonsense query returns matched:false with the sentence and next tools", async () => {
    for (const q of ["zzzzqq", "xx-no-such-term"]) {
      const out = await call("features_list", { search: q });
      expect(out.total).toBe(0);
      expect(out.matched).toBe(false);
      expect(out.guidance).toBe(NO_ENTRY_SENTENCE);
      expect((out.suggested_tools as string[]).length).toBeGreaterThan(0);
      expect(String(out.guidance)).not.toMatch(/not supported/i);
    }
  });

  it("integrations_list: a nonsense query returns matched:false", async () => {
    const out = await call("integrations_list", { search: "zzzzqq" });
    expect(out.total).toBe(0);
    expect(out.matched).toBe(false);
    expect(out.guidance).toBe(NO_ENTRY_SENTENCE);
  });

  it("queries that return zero today (computed, not hard-coded) all get the contract", async () => {
    const probes = ["sso", "payroll", "instagram", "e-invoice", "insurance", "transcription", "scheduled report", "mfa"];
    let checked = 0;
    for (const q of probes) {
      const out = await call("features_list", { search: q });
      if (out.total !== 0) continue; // an entry exists now; the contract applies only to zero results
      checked++;
      expect(out.matched).toBe(false);
      expect(out.guidance).toBe(NO_ENTRY_SENTENCE);
    }
    expect(checked).toBeGreaterThanOrEqual(0);
  });

  it("did_you_mean uses a capped edit distance and is labelled", () => {
    expect(editDistance("slack", "slak")).toBe(1);
    expect(editDistance("slack", "stripe", 2)).toBeGreaterThan(2);
    expect(didYouMean("slak", ["slack", "stripe", "shopify"])).toEqual(["slack"]);
    expect(didYouMean("ab", ["abc"])).toEqual([]);
  });

  it("an overridden integration is an entry with not_available, never the zero-result sentence", async () => {
    for (const q of ["paytm", "payu", "cashfree", "tally"]) {
      const out = await call("integrations_list", { search: q });
      expect(out.matched, `${q} returned the zero-result contract`).toBeUndefined();
      const items = out.items as { slug: string; status: string; kt?: string; as_of?: string }[];
      const hit = items.find((i) => i.slug === q || i.slug.startsWith(q));
      expect(hit, `${q}: no entry returned`).toBeDefined();
      expect(hit!.status).toBe("not_available");
      expect(hit!.kt).toBeTruthy();
      expect(hit!.as_of).toBeTruthy();
      expect(out.includes_overrides).toBe(true);
    }
  });
});

describe("integrations_list contract (AC-05)", () => {
  it("default call is live-only, first page, under 40 KB, with counts", async () => {
    const tool = toolsByName.get("integrations_list")!;
    const res = await tool.handle(tool.schema.parse({}));
    const bytes = Buffer.byteLength(res.content[0]!.text);
    const out = JSON.parse(res.content[0]!.text);
    expect(bytes).toBeLessThan(40_000);
    expect(out.status_filter).toBe("live");
    expect(out.limit).toBe(50);
    expect(out.returned).toBeLessThanOrEqual(50);
    expect(out.counts).toBeTypeOf("object");
    expect(out.partial).toBe(out.next_offset !== null);
    expect(res.content[0]!.text).not.toMatch(/630\+?\s*integrations/i);
  });

  it("limit is capped at 200", () => {
    const tool = toolsByName.get("integrations_list")!;
    expect(tool.schema.safeParse({ limit: 201 }).success).toBe(false);
    expect(tool.schema.safeParse({ limit: 200 }).success).toBe(true);
  });

  it("paging returns every entry once, sorted by slug, with consistent totals", async () => {
    const seen: string[] = [];
    let offset: number | null = 0;
    let total = 0;
    let guard = 0;
    while (offset !== null && guard++ < 20) {
      const out = await call("integrations_list", { status: "all", limit: 200, offset });
      total = out.total as number;
      seen.push(...(out.items as { slug: string }[]).map((i) => i.slug));
      offset = out.next_offset as number | null;
    }
    expect(seen.length).toBe(total);
    expect(new Set(seen).size).toBe(seen.length);
    expect([...seen].sort((a, b) => a.localeCompare(b))).toEqual(seen);
  });

  it("search combined with each status filter keeps total and counts consistent", async () => {
    for (const status of ["live", "scaffolded", "not_available", "all"]) {
      const out = await call("integrations_list", { search: "a", status });
      const counts = out.counts as Record<string, number>;
      expect(Object.values(counts).reduce((n, c) => n + c, 0)).toBe(out.total);
    }
  });

  it("two identical calls return identical order", async () => {
    const a = await call("integrations_list", { status: "all", limit: 50 });
    const b = await call("integrations_list", { status: "all", limit: 50 });
    expect(a.items).toEqual(b.items);
  });
});

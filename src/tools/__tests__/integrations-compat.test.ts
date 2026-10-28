import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { toolsByName } from "../index.js";

const fixture = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "test-data", "fixtures", "integrations-2.1.0.default.json"), "utf8"),
) as { slugs: string[]; count: number };

async function page(args: Record<string, unknown>): Promise<{ items: { slug: string }[]; next_offset: number | null; total: number }> {
  const tool = toolsByName.get("integrations_list")!;
  const res = await tool.handle(tool.schema.parse(args));
  return JSON.parse(res.content[0]!.text);
}

describe("integrations_list compatibility with 2.1.0 (AC-10, section 7f)", () => {
  it("the recorded 2.1.0 default response held the whole catalogue", () => {
    expect(fixture.slugs.length).toBe(fixture.count);
    expect(fixture.count).toBeGreaterThan(500);
  });

  it("every slug in the 2.1.0 default appears in the 2.2.0 full traversal (overrides change status, not presence)", async () => {
    const seen = new Set<string>();
    let offset: number | null = 0;
    let guard = 0;
    while (offset !== null && guard++ < 20) {
      const p = await page({ status: "all", limit: 200, offset });
      for (const i of p.items) seen.add(i.slug);
      offset = p.next_offset;
    }
    const missing = fixture.slugs.filter((s) => !seen.has(s));
    expect(missing, `slugs missing from the 2.2.0 traversal: ${missing.join(", ")}`).toEqual([]);
  });

  it("the 2.2.0 DEFAULT response (no arguments) still contains every slug the 2.1.0 default had, in one response", async () => {
    const def = await page({});
    expect(def.next_offset).toBeNull();
    const slugs = new Set(def.items.map((i) => i.slug));
    const missing = fixture.slugs.filter((s) => !slugs.has(s));
    expect(missing, `slugs missing from the 2.2.0 default response: ${missing.join(", ")}`).toEqual([]);
  });

  it("pages do not overlap", async () => {
    const a = await page({ status: "all", limit: 100, offset: 0 });
    const b = await page({ status: "all", limit: 100, offset: a.items.length });
    const overlap = a.items.filter((x) => b.items.some((y) => y.slug === x.slug));
    expect(overlap).toEqual([]);
  });
});

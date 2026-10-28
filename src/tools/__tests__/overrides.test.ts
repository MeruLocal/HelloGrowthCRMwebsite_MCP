import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { expiredOverrides, INTEGRATION_OVERRIDES, overrideSummary } from "../../data/claim-overrides.js";
import { toolsByName } from "../index.js";

const here = dirname(fileURLToPath(import.meta.url));
const catalogueSlugs = new Set(
  [...readFileSync(join(here, "..", "integrations.ts"), "utf8").matchAll(/\{ slug: "([^"]+)", name:/g)].map((m) => m[1]!),
);

async function get(slug: string): Promise<Record<string, unknown>> {
  const tool = toolsByName.get("integrations_get")!;
  const res = await tool.handle(tool.schema.parse({ slug }));
  return JSON.parse(res.content[0]!.text);
}

describe("claim overrides (AC-09)", () => {
  it("every override cites a known-truth id, evidence, an as-of date and an expiry", () => {
    for (const o of INTEGRATION_OVERRIDES) {
      expect(o.kt, o.slug).toMatch(/^KT-\d+$/);
      expect(o.evidence.length, o.slug).toBeGreaterThan(8);
      expect(o.as_of, o.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(o.expires, o.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(o.reason.toLowerCase(), o.slug).toMatch(/not (?:available|offered)|is not deployed|no handler/);
    }
  });

  it("every override slug exists in the catalogue (a website slug rename must fail CI)", () => {
    for (const o of INTEGRATION_OVERRIDES) expect(catalogueSlugs.has(o.slug), `override slug not in catalogue: ${o.slug}`).toBe(true);
  });

  it("no override is past its review-by date (CI fails after it, forcing a re-check)", () => {
    expect(expiredOverrides().map((o) => o.slug)).toEqual([]);
    expect(overrideSummary().expired).toBe(0);
  });

  it("expiry detection works", () => {
    expect(expiredOverrides(new Date("2099-01-01")).length).toBe(INTEGRATION_OVERRIDES.length);
  });

  it("the served status of every overridden slug is structurally not_available, whatever the synced status says", async () => {
    for (const o of INTEGRATION_OVERRIDES) {
      const rec = await get(o.slug);
      expect(rec.status, o.slug).toBe("not_available");
      expect(rec.kt, o.slug).toBe(o.kt);
      expect(rec.as_of, o.slug).toBe(o.as_of);
    }
  });

  it("an entry with no override keeps its synced status", async () => {
    const rec = await get("slack");
    expect(rec.status).not.toBe("not_available");
    expect(rec.kt).toBeUndefined();
  });

  it("overridden entries are excluded from the public live count", async () => {
    const tool = toolsByName.get("integrations_list")!;
    const res = await tool.handle(tool.schema.parse({ status: "live", limit: 200 }));
    const out = JSON.parse(res.content[0]!.text);
    const liveSlugs = new Set((out.items as { slug: string }[]).map((i) => i.slug));
    for (const o of INTEGRATION_OVERRIDES) expect(liveSlugs.has(o.slug), `${o.slug} listed as live`).toBe(false);
  });
});

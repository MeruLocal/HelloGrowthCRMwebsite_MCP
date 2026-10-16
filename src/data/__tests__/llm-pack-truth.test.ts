import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { COUNTRIES } from "../website-mirror.js";
import { BANNED_PATTERNS } from "./llm-pack-banned.js";

/**
 * Pack-truth test (docs/research/LLM_MESSAGE_RESEARCH_2026-10.md).
 *
 * The LLM message pack is the one place this server states product facts that
 * are NOT hand-copied from the website mirror, so it carries its own evidence:
 * every record names its sources, summaries are short, and nothing a model can
 * read may contain a phrase the website's claims guard bans. A record that
 * cannot show a source fails the build instead of reaching a model.
 */

interface PackRecord {
  key?: string;
  code?: string;
  status: string;
  depth_tier?: string;
  alias_of: string | null;
  serve: boolean;
  summary: string;
  summary_words: number;
  sources: string[];
  evidence?: { ui_files: number; dedicated_dir_files: number; has_config: boolean };
  claims_not_to_make?: string[];
}

const here = dirname(fileURLToPath(import.meta.url));
const pack = JSON.parse(readFileSync(join(here, "..", "llm-message-pack.json"), "utf8")) as {
  global: Record<string, any>;
  industries: PackRecord[];
  industries_held: { key: string; alias_of: string | null }[];
  countries: PackRecord[];
};

const words = (s: string) => s.trim().split(/\s+/).length;

/** Every string anywhere inside a value (keys excluded). */
function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => strings(v, out));
  return out;
}

describe("LLM message pack", () => {
  it("has the expected shape (guards against an empty or mis-generated file)", () => {
    expect(pack.industries.length).toBeGreaterThanOrEqual(30);
    expect(pack.countries.length).toBe(8);
  });

  it("gives every record at least one source and a summary of 60 words or fewer", () => {
    for (const r of [...pack.industries, ...pack.countries]) {
      const id = r.key ?? r.code;
      expect(r.sources.length, `${id} has no sources`).toBeGreaterThan(0);
      expect(r.summary_words, `${id} summary_words disagrees with the text`).toBe(words(r.summary));
      expect(r.summary_words, `${id} summary is over 60 words`).toBeLessThanOrEqual(60);
    }
  });

  it("serves an industry only if it is live, and a live industry only if it has dedicated screens", () => {
    for (const r of pack.industries) {
      expect(r.serve, `${r.key}: serve must equal status === live`).toBe(r.status === "live");
      if (r.status === "live") {
        expect(r.depth_tier).toBe("deep");
        const e = r.evidence!;
        expect(e.ui_files + e.dedicated_dir_files, `${r.key} is live with no UI evidence`).toBeGreaterThan(0);
      }
    }
  });

  it("has unique keys and resolvable aliases", () => {
    const keys = [...pack.industries.map((r) => r.key!), ...pack.industries_held.map((r) => r.key)];
    expect(new Set(keys).size).toBe(keys.length);
    for (const r of [...pack.industries, ...pack.industries_held]) {
      if (r.alias_of) expect(keys, `${r.alias_of} (alias target) missing`).toContain(r.alias_of);
    }
  });

  it("only describes countries the website mirror serves", () => {
    const mirror = new Set(COUNTRIES.map((c) => c.code));
    for (const c of pack.countries) expect(mirror.has(c.code!), `${c.code} not in the mirror`).toBe(true);
  });

  it("states the canonical prices (hellocrmwebsite src/lib/pricing-constants.ts, 2026-10-12)", () => {
    const p = pack.global.pricing;
    expect(p.growth_usd.monthly).toBe(12);
    expect(p.growth_usd.annual_per_month).toBe(10);
    expect(p.growth_inr.per_user_month).toBe(899);
    expect(p.growth_inr.gst_pct).toBe(18);
    expect(p.growth_inr.billed_month_incl_gst).toBe(1060.82);
    expect(p.growth_inr.annual_total_excl_gst).toBe(8990);
    // the Free plan figure is a pending founder decision: the pack must not pick one
    expect(p.free).toBe("pending_decision");
  });

  it("contains no phrase the claims guard bans in anything a model can read", () => {
    const served = [
      pack.global,
      ...pack.industries.filter((r) => r.serve),
      // claims_not_to_make is guidance about what NOT to say and is excluded by design
      ...pack.countries.filter((c) => c.serve).map(({ claims_not_to_make: _omit, ...rest }) => rest),
    ];
    const text = strings(served);
    for (const { re, note } of BANNED_PATTERNS) {
      const hit = text.find((t) => re.test(t));
      expect(hit, `banned pattern ${re} (${note}) found in: ${hit}`).toBeUndefined();
    }
  });
});

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  DEFAULT_MAX_AGE_DAYS,
  MIRROR_BLOCKS,
  configuredMaxAgeDays,
  mirrorFreshness,
  type MirrorBlock,
} from "../freshness.js";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === "__tests__" ? [] : walk(full);
    return full.endsWith(".ts") ? [full] : [];
  });
}

const block = (b: string, synced_at: string): MirrorBlock => ({ block: b, synced_at, source: "x" });
const NOW = new Date("2026-10-14T12:00:00Z");

describe("mirror block registry", () => {
  it("lists every SYNCED_AT constant in src/ with the same value", () => {
    const found: Array<{ source: string; value: string }> = [];
    for (const file of walk(SRC)) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(/^(?:export\s+)?const\s+[A-Z_]*SYNCED_AT\s*=\s*"([^"]+)"/gm)) {
        found.push({ source: path.relative(SRC, file).split(path.sep).join("/"), value: m[1]! });
      }
    }
    expect(found.length).toBeGreaterThan(0);
    const registered = MIRROR_BLOCKS.map((b) => ({ source: b.source, value: b.synced_at }));
    expect(registered.sort((a, b) => a.source.localeCompare(b.source))).toEqual(
      found.sort((a, b) => a.source.localeCompare(b.source)),
    );
  });

  it("uses unique block ids", () => {
    const ids = MIRROR_BLOCKS.map((b) => b.block);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("mirrorFreshness", () => {
  it("is fresh when every block is within the window", () => {
    const r = mirrorFreshness(NOW, 10, [block("a", "2026-10-14"), block("b", "2026-10-04")]);
    expect(r.status).toBe("fresh");
    expect(r.stale_blocks).toEqual([]);
    expect(r.oldest).toMatchObject({ block: "b", age_days: 10 });
  });

  it("is stale when one block is one day past the window", () => {
    const r = mirrorFreshness(NOW, 10, [block("a", "2026-10-14"), block("b", "2026-10-03")]);
    expect(r.status).toBe("stale");
    expect(r.stale_blocks).toEqual([{ block: "b", synced_at: "2026-10-03", age_days: 11, problem: "too_old" }]);
  });

  it("treats a future date as stale, not fresh", () => {
    const r = mirrorFreshness(NOW, 10, [block("a", "2026-10-20")]);
    expect(r.status).toBe("stale");
    expect(r.stale_blocks[0]).toMatchObject({ problem: "future_date", age_days: -6 });
  });

  it.each(["2026-13-01", "2026-02-30", "14/10/2026", "", "soon"])(
    "treats an unusable date %j as stale and reports it as the oldest",
    (bad) => {
      const r = mirrorFreshness(NOW, 10, [block("ok", "2026-10-14"), block("bad", bad)]);
      expect(r.status).toBe("stale");
      expect(r.oldest).toMatchObject({ block: "bad", age_days: null, problem: "invalid_date" });
    },
  );

  it("refuses to report on an empty registry", () => {
    expect(() => mirrorFreshness(NOW, 10, [])).toThrow();
  });

  it("reports the real mirror as stale today (the condition this gate exists for)", () => {
    // The oldest block was last synced in June 2026. If this starts failing
    // because someone synced the mirror, delete it: that is the goal.
    const r = mirrorFreshness(NOW);
    expect(r.status).toBe("stale");
    expect(r.oldest.age_days).toBeGreaterThan(DEFAULT_MAX_AGE_DAYS);
  });
});

describe("configuredMaxAgeDays", () => {
  it.each([
    [undefined, DEFAULT_MAX_AGE_DAYS],
    ["", DEFAULT_MAX_AGE_DAYS],
    ["abc", DEFAULT_MAX_AGE_DAYS],
    ["0", DEFAULT_MAX_AGE_DAYS],
    ["-3", DEFAULT_MAX_AGE_DAYS],
    ["14", 14],
    [" 30 ", 30],
  ])("MIRROR_MAX_AGE_DAYS=%j -> %d", (raw, expected) => {
    const env = raw === undefined ? {} : { MIRROR_MAX_AGE_DAYS: raw };
    expect(configuredMaxAgeDays(env as NodeJS.ProcessEnv)).toBe(expected);
  });
});

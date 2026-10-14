/**
 * Every outbound request from tool code must go through safeFetch. This fails
 * when a raw fetch( or undici request( appears in src/tools or src/core.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..");
// Fixed, operator-configured URLs only — never caller-chosen.
const ALLOW = new Set([
  "core/safe-fetch.ts",
  "tools/blog.ts", // blog_revalidate: privileged, posts to DEFAULT_TARGET_URL
]);

function files(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) => {
    if (e.name === "__tests__") return [];
    const rel = `${dir}/${e.name}`;
    return e.isDirectory() ? files(rel) : rel.endsWith(".ts") ? [rel] : [];
  });
}

describe("no raw outbound requests", () => {
  it("only safe-fetch.ts (and the allowlist) call fetch( or request(", () => {
    const offenders = [...files("tools"), ...files("core")]
      .filter((f) => !ALLOW.has(f))
      .filter((f) => {
        const src = readFileSync(join(ROOT, f), "utf8")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/\/\/.*$/gm, "");
        return /\bfetch\(|\brequest\((?!s\))/.test(src);
      });
    expect(offenders).toEqual([]);
  });
});

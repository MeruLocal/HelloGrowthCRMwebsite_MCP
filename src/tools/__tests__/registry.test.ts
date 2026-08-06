import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { tools } from "../index.js";

/**
 * Why this file exists: `check_ai_extractability` and `validate_sitemaps` were
 * written, tested and merged while never appearing in `tools` — the registry in
 * index.ts is a hand-maintained array, so a tool can be fully working and
 * completely unreachable at the same time. Unit tests on the exported handlers
 * pass either way, which is exactly what happened.
 *
 * This test closes that gap by reading the source: every `defineTool(...)` in
 * src/tools must end up in the registry.
 */

const toolsDir = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Source-level scan: every `export const X = defineTool({` in src/tools/*.ts. */
function declaredTools(): { file: string; symbol: string }[] {
  return readdirSync(toolsDir)
    .filter((f) => f.endsWith(".ts") && f !== "tool-types.ts" && f !== "index.ts")
    .flatMap((file) => {
      const src = readFileSync(join(toolsDir, file), "utf8");
      return [...src.matchAll(/export const (\w+)\s*(?::[^=]+)?=\s*defineTool\(/g)].map(
        (m) => ({ file, symbol: m[1]! }),
      );
    });
}

describe("tool registry", () => {
  const registered = new Set(tools.map((t) => t.definition.name));

  it("finds tool declarations to check (guards against a broken scan)", () => {
    expect(declaredTools().length).toBeGreaterThan(50);
  });

  it("registers every tool declared under src/tools", () => {
    const indexSrc = readFileSync(join(toolsDir, "index.ts"), "utf8");

    // Match on the exported symbol rather than the MCP name: the symbol is what
    // index.ts imports, and an import without a matching array entry is the
    // other half of the same bug.
    const missing = declaredTools().filter(({ symbol }) => {
      const imported = new RegExp(`\\b${symbol}\\b`, "g");
      return (indexSrc.match(imported) ?? []).length < 2; // import + array entry
    });

    expect(
      missing.map((m) => `${m.symbol} (${m.file})`),
      "declared with defineTool but not both imported and listed in the tools array",
    ).toEqual([]);
  });

  it("exposes the GEO diagnostics tools", () => {
    // Named explicitly: these are the two the scan above was written for.
    expect(registered).toContain("check_ai_extractability");
    expect(registered).toContain("validate_sitemaps");
  });

  it("has no duplicate tool names", () => {
    const names = tools.map((t) => t.definition.name);
    expect(names.length).toBe(registered.size);
  });

  it("gives every tool a name, a description and an object input schema", () => {
    for (const t of tools) {
      expect(t.definition.name, "tool name").toMatch(/^[a-z][a-z0-9_]*$/);
      expect(t.definition.description.length, `${t.definition.name} description`)
        .toBeGreaterThan(20);
      expect(t.definition.inputSchema.type, `${t.definition.name} inputSchema`).toBe(
        "object",
      );
    }
  });
});

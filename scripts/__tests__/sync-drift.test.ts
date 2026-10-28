import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { getIntegrationOverride } from "../../src/data/claim-overrides.js";
import { scanText, stripComments, stripGenerated } from "../../src/tools/__tests__/truth-scan.js";

/**
 * AC-09: a website sync must not be able to undo an override or reintroduce a
 * denied claim unnoticed. The sync runs against a FIXTURE website and writes to a
 * temporary directory (--out-dir), so it never dirties the working tree.
 */

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function fixtureWebsite(): string {
  const dir = mkdtempSync(join(tmpdir(), "mcp-sync-site-"));
  mkdirSync(join(dir, "src", "lib"), { recursive: true });
  const overridden = ["paytm", "tally", "cashfree"];
  for (const slug of overridden) if (!getIntegrationOverride(slug)) throw new Error(`fixture slug has no override: ${slug}`);
  const entries = [
    ...overridden.map((slug) => ({
      slug,
      name: slug,
      whatItDoes: slug === "tally" ? "Imports or exports ledger-aligned customer and invoice data with TallyPrime." : "Payment gateway integration.",
      status: "live",
    })),
    { slug: "unrelated-tool", name: "Unrelated Tool", whatItDoes: "Syncs contacts to a mailing list.", status: "live" },
  ];
  writeFileSync(
    join(dir, "src", "lib", "integrations-catalog-data.ts"),
    `export const INTEGRATIONS_CATALOG = [{ slug: "payments", title: "Payments", shortLabel: "Payments", integrations: ${JSON.stringify(entries)} }];\n` +
      `export const INTEGRATIONS_CATALOG_SUMMARY = { total: ${entries.length}, liveCount: ${entries.length}, scaffoldedCount: 0 };\n`,
  );
  writeFileSync(join(dir, "src", "lib", "integration-routes.ts"), `export const getIntegrationPath = (slug) => "/integrations/" + slug;\n`);
  return dir;
}

describe("website sync cannot undo overrides (AC-09)", () => {
  const out = mkdtempSync(join(tmpdir(), "mcp-sync-out-"));
  const website = fixtureWebsite();
  execFileSync("node", [join(REPO, "scripts", "sync-website-mirror.mjs"), `--website=${website}`, `--out-dir=${out}`], { cwd: REPO, stdio: "pipe" });
  const regenerated = readFileSync(join(out, "integrations.ts"), "utf8");

  it("wrote to the temp directory, not the repository", () => {
    expect(regenerated).toContain("Unrelated Tool");
    expect(readFileSync(join(REPO, "src", "tools", "integrations.ts"), "utf8")).not.toContain("Unrelated Tool");
  });

  it("the sync restores the denied status/text into generated source (the risk being guarded)", () => {
    expect(regenerated).toMatch(/slug: "paytm"[^\n]*status: "live"/);
    expect(regenerated).toMatch(/TallyPrime/);
  });

  it("every regenerated slug that has a denied claim is still covered by an override", () => {
    const rows = [...regenerated.matchAll(/\{ slug: "([^"]+)", name:/g)].map((m) => m[1]!);
    for (const slug of ["paytm", "tally", "cashfree"]) {
      expect(rows).toContain(slug);
      expect(getIntegrationOverride(slug), `no override covers ${slug}`).toBeDefined();
    }
  });

  it("an unrelated injected entry is unchanged", () => {
    expect(regenerated).toMatch(/slug: "unrelated-tool"[^\n]*status: "live"/);
  });

  it("the static truth guard run over the regenerated source (outside the generated block) is clean", () => {
    const src = stripComments(stripGenerated(regenerated.replace(/\r\n/g, "\n")));
    expect(scanText(src, "regenerated integrations.ts")).toEqual([]);
  });
});

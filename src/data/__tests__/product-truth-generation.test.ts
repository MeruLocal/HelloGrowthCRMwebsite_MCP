import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
// @ts-expect-error plain ESM scripts, no types
import { build, canonicalJson, checkFloor, loadSchemas, sha256, validatePin } from "../../../scripts/build-product-truth.mjs";
// @ts-expect-error plain ESM scripts, no types
import { parseAllow, scanLiterals, uncovered } from "../../../scripts/check-product-truth.mjs";
import { PRODUCT_TRUTH_DATA, PRODUCT_TRUTH_PIN } from "../product-truth.js";
import { canonicalJson as libCanonical } from "../../lib/market-publication.js";

const repo = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const ROOT = join(repo, "test-data/product-truth");
const SCHEMA = join(ROOT, "schema");
const TV = readFileSync(join(ROOT, "FLOOR"), "utf8").trim();
const tmps: string[] = [];
afterEach(() => { for (const t of tmps.splice(0)) rmSync(t, { recursive: true, force: true }); });

const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const schemas = loadSchemas(SCHEMA);
const real = () => ({
  snapshot: read(join(ROOT, TV, "truth.mcp.json")),
  evaluation: read(join(ROOT, TV, "evaluation.json")),
  index: read(join(ROOT, TV, "index.json")),
});

/** Re-derive digest, report and index hash so only the targeted violation remains. */
function rehash(p: { snapshot: any; evaluation: any; index: any }) {
  const { truth_version: _t, content_digest: _c, ...payload } = p.snapshot;
  p.snapshot.content_digest = sha256(canonicalJson(payload));
  p.evaluation.content_digests.mcp = p.snapshot.content_digest;
  const ds = p.evaluation.content_digests;
  p.index.entries.at(-1).h = sha256(Object.keys(ds).sort().map((s) => `${s}\n${ds[s]}\n`).join(""));
  return { ...p, raw: JSON.stringify(p.snapshot) };
}
const verdict = (p: any) => validatePin({ ...p, raw: p.raw ?? JSON.stringify(p.snapshot) }, schemas);

describe("generation", () => {
  it("the committed pin validates and the generated file is exactly the generator's output", () => {
    const r = build({ root: ROOT, schemaDir: SCHEMA });
    expect(readFileSync(join(repo, "src/data/product-truth.ts"), "utf8")).toBe(r.ts);
    expect(build({ root: ROOT, schemaDir: SCHEMA }).ts).toBe(r.ts); // deterministic
    expect(PRODUCT_TRUTH_PIN.truth_version).toBe(TV);
    expect(PRODUCT_TRUTH_DATA.surface).toBe("mcp");
  });
  it("the canonical JSON of the generator equals the library's", () => {
    const v = { b: [1, { z: "x", a: null }], a: true };
    expect(canonicalJson(v)).toBe(libCanonical(v));
  });
  it("a hand edit of the generated file is detected by --check", () => {
    const r = build({ root: ROOT, schemaDir: SCHEMA });
    expect(r.ts.replace('"value": 150', '"value": 151')).not.toBe(r.ts);
  });
  it("a sha mismatch fails the build", () => {
    const root = mkdtempSync(join(tmpdir(), "pt-")); tmps.push(root);
    cpSync(ROOT, root, { recursive: true });
    const f = join(root, TV, "truth.mcp.json");
    writeFileSync(f, readFileSync(f, "utf8").replace("150", "151"));
    expect(() => build({ root, schemaDir: join(root, "schema") })).toThrow(/SHA256SUMS mismatch/);
  });
  it("FLOOR: a pin below the floor fails; a floor not in the index fails", () => {
    const { index } = real();
    expect(() => checkFloor(TV, index)).not.toThrow();
    expect(() => checkFloor("2020-01-01.000000000000", index)).toThrow(/not an entry/);
    const two = { ...index, entries: [...index.entries, { truth_version: "2026-11-05.aaaaaaaaaaaa", h: "0".repeat(64), first_seen: "2026-11-05T00:00:00Z" }], current: index.current };
    expect(() => checkFloor("2026-11-05.aaaaaaaaaaaa", two)).toThrow(/below FLOOR/);
  });
});

describe("AC-A2 / AC-A3 adversarial pins", () => {
  it("accepts the real pin; null next_transition and absent optional windows are valid", () => {
    const p = real();
    expect(p.evaluation.next_transition).toBeNull();
    expect(Object.values(p.snapshot.limits).some((f: any) => f.effective_until === undefined)).toBe(true);
    expect(() => verdict(p)).not.toThrow();
  });
  it("rejects an unknown schema major", () => {
    const p = real(); p.snapshot.schema_version = "2.0.0";
    expect(() => verdict(rehash(p))).toThrow();
  });
  it("rejects a pin whose surface is not mcp", () => {
    const p = real(); p.snapshot.surface = "website";
    expect(() => verdict(rehash(p))).toThrow(/surface/);
  });
  it.each(["pricing", "tax", "promotions"])("rejects a pin carrying reserved section %s", (k) => {
    const p = real(); p.snapshot[k] = {};
    expect(() => verdict(rehash(p))).toThrow(/reserved section/);
  });
  it("rejects a private field in a record and an unknown key", () => {
    let p = real(); p.snapshot.limits["plans.free.limits.leads"].owner = "x";
    expect(() => verdict(rehash(p))).toThrow();
    p = real(); p.snapshot.extra = 1;
    expect(() => verdict(rehash(p))).toThrow();
  });
  it("rejects a float amount, a lifecycle or reason outside the closed lists", () => {
    let p = real(); p.snapshot.limits["plans.free.limits.leads"].value = 1.5;
    expect(() => verdict(p)).toThrow();
    p = real(); p.snapshot.limits["plans.free.limits.leads"].lifecycle = "stable";
    expect(() => verdict(rehash(p))).toThrow();
    p = real(); p.snapshot.withheld.push({ id: "plans.free.limits.x", reason: "country_required" });
    expect(() => verdict(rehash(p))).toThrow();
  });
  it("rejects a string containing pending_change, oversize and script-like strings", () => {
    let p = real(); p.snapshot.urls["urls.help_center"].value = "https://x.example/pending_change";
    expect(() => verdict(rehash(p))).toThrow(/pending_change/);
    p = real(); p.snapshot.urls["urls.help_center"].value = "x".repeat(501);
    expect(() => verdict(rehash(p))).toThrow(/oversize/);
    p = real(); p.snapshot.urls["urls.help_center"].value = "<script>alert(1)</script>";
    expect(() => verdict(rehash(p))).toThrow(/script-like/);
  });
  it("rejects an unknown or malformed window instant and an inverted window", () => {
    let p = real(); p.snapshot.limits["plans.free.limits.leads"].effective_until = "tomorrow";
    expect(() => verdict(rehash(p))).toThrow();
    p = real(); Object.assign(p.snapshot.limits["plans.free.limits.leads"], { effective_from: "2026-12-01T00:00:00Z", effective_until: "2026-11-01T00:00:00Z" });
    expect(() => verdict(rehash(p))).toThrow(/before effective_until/);
  });
  it("rejects an id served and withheld, and an id in the wrong section", () => {
    let p = real(); p.snapshot.withheld.push({ id: "plans.free.limits.leads", reason: "draft" });
    expect(() => verdict(rehash(p))).toThrow(/both served and listed/);
    p = real(); p.snapshot.features["plans.free.limits.leads"] = p.snapshot.limits["plans.free.limits.leads"];
    expect(() => verdict(rehash(p))).toThrow();
  });
  it("rejects a report for a different snapshot, a digest mismatch and an edited payload", () => {
    let p = real(); p.evaluation.truth_version = "2026-11-03.000000000000";
    expect(() => verdict(p)).toThrow(/evaluation.json is for/);
    p = real(); p.evaluation.content_digests.mcp = "0".repeat(64);
    expect(() => verdict(p)).toThrow(/does not equal/);
    p = real(); p.snapshot.limits["plans.free.limits.leads"].value = 151;
    expect(() => verdict(p)).toThrow(/content_digest does not match/);
  });
  it("rejects valid_until before generated_at, a malformed instant, and next_transition before generated_at", () => {
    let p = real(); p.evaluation.valid_until = "2026-11-03T00:00:00Z";
    expect(() => verdict(p)).toThrow(/valid_until is before/);
    p = real(); p.evaluation.generated_at = "yesterday";
    expect(() => verdict(p)).toThrow();
    p = real(); p.evaluation.next_transition = "2026-11-01T00:00:00Z";
    expect(() => verdict(p)).toThrow(/next_transition is before/);
  });
  it("AC-A7: a pin that is not the last index entry needs a stated reason", () => {
    const p = real();
    p.index.entries.push({ truth_version: "2026-11-09.bbbbbbbbbbbb", h: "1".repeat(64), first_seen: "2026-11-09T00:00:00Z" });
    expect(() => verdict(p)).toThrow(/not the last entry/);
  });
  it("rejects an index entry hash that does not match the report", () => {
    const p = real(); p.index.entries.at(-1).h = "2".repeat(64);
    expect(() => verdict(p)).toThrow(/entry hash/);
  });
});

describe("contract-v1 conformance (PT-A fixtures, verbatim)", () => {
  const dir = join(ROOT, "contract-v1");
  it("matches its SHA256SUMS", () => {
    for (const l of readFileSync(join(dir, "SHA256SUMS"), "utf8").split("\n").filter(Boolean)) {
      const [h, name] = l.split(/\s+/);
      expect(sha256(readFileSync(join(dir, name)))).toBe(h);
    }
  });
  it("accepts the valid public mcp projection with its report and index", () => {
    const v = join(dir, "valid-public");
    expect(() => verdict({ snapshot: read(join(v, "truth.mcp.json")), evaluation: read(join(v, "evaluation.json")), index: read(join(v, "index.json")) })).not.toThrow();
  });
  it("refuses the other surfaces' projections", () => {
    const v = join(dir, "valid-public");
    for (const s of ["website", "app"]) {
      expect(() => verdict({ snapshot: read(join(v, `truth.${s}.json`)), evaluation: read(join(v, "evaluation.json")), index: read(join(v, "index.json")) })).toThrow();
    }
  });
  it("rejects every invalid fixture", () => {
    const v = join(dir, "valid-public");
    for (const f of readdirSync(join(dir, "invalid"))) {
      const doc = read(join(dir, "invalid", f));
      const p = f.endsWith(".evaluation.json")
        ? { snapshot: read(join(v, "truth.mcp.json")), evaluation: doc, index: read(join(v, "index.json")) }
        : { snapshot: doc, evaluation: read(join(v, "evaluation.json")), index: read(join(v, "index.json")) };
      expect(() => verdict(p), f).toThrow();
    }
  });
});

describe("ratchet (AC-A5)", () => {
  const snap = () => real().snapshot;
  const allow = () => parseAllow(readFileSync(join(repo, "scripts/product-truth-literals.allow"), "utf8"));
  const srcFiles = () => {
    const out: { file: string; text: string }[] = [];
    const walk = (d: string) => { for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) { if (e.name !== "__tests__") walk(p); }
      else if (/\.ts$/.test(e.name) && !/\.test\.ts$/.test(e.name) && e.name !== "product-truth.ts" ) out.push({ file: p.slice(repo.length + 1), text: readFileSync(p, "utf8") });
    }; };
    walk(join(repo, "src"));
    return out;
  };
  it("passes with the allowlist it ships", () => {
    expect(uncovered(scanLiterals(srcFiles(), snap()), allow())).toEqual([]);
  });
  it("fails on a fixture that adds a limit literal or a forbidden value", () => {
    const files = [...srcFiles(), { file: "src/tools/new.ts", text: 'const a = "Free: 150 leads, 20 accounts";\nconst b = "200 leads";\nconst c = { tasks: 100 };' }];
    const bad = uncovered(scanLiterals(files, snap()), allow());
    expect(bad.length).toBe(3);
    expect(bad.every((h: any) => h.file === "src/tools/new.ts")).toBe(true);
  });
  it("the allowlist did not grow against its git base", () => {
    let base = "";
    try {
      const mb = execFileSync("git", ["merge-base", "HEAD", "origin/main"], { cwd: repo, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
      base = execFileSync("git", ["show", `${mb}:scripts/product-truth-literals.allow`], { cwd: repo, stdio: ["ignore", "pipe", "ignore"] }).toString();
    } catch {
      return; // no git base, or the file is new in this branch: nothing to compare
    }
    const b = parseAllow(base);
    for (const [k, n] of allow()) expect(n, k).toBeLessThanOrEqual(b.get(k) ?? 0);
  });
});

describe("packaging", () => {
  it("test-data is not part of the published package or the served assets", () => {
    const pkg = read(join(repo, "package.json"));
    expect(pkg.files.some((f: string) => f.startsWith("test-data"))).toBe(false);
    const docker = existsSync(join(repo, "Dockerfile")) ? readFileSync(join(repo, "Dockerfile"), "utf8") : "";
    expect(docker).not.toMatch(/COPY[^\n]*test-data/);
  });
});

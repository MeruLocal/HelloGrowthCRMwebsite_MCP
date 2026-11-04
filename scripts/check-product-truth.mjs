#!/usr/bin/env node
/**
 * check-product-truth.mjs - gate for the Product Truth pin (PLAN-HELLOG-0011).
 *
 *   --check      the generated src/data/product-truth.ts equals the pinned export, every pinned file
 *                matches SHA256SUMS (pin, schemas, contract-v1), the pin is the last entry of its
 *                index.json, FLOOR is respected, and every protected id is still in the pin.
 *   --literals   the ratchet: no limit literal (or forbidden value) in non-test source except the
 *                shrink-only allowlist scripts/product-truth-literals.allow.
 *   --update-allow   rewrite the allowlist from the current source (a human reviews the diff;
 *                a test fails if it grew against its git base).
 *
 * This proves reproducibility and the absence of hand-typed limits. It does NOT prove the pin is
 * fresh or that it matches the deployed product; freshness is the reader's job at request time.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build, sha256 } from "./build-product-truth.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");
const PIN_ROOT = join(repo, "test-data/product-truth");

/** Words each limit key is written with in prose. */
const TERMS = {
  leads: "leads?|contacts?",
  tasks: "tasks?",
  accounts: "accounts?",
  email_templates: "email templates?|templates?",
  landing_pages: "landing pages?",
  custom_fields: "custom fields?",
  csv_rows: "csv rows?|rows?",
};

function fail(msg) {
  throw new Error(`check-product-truth: ${msg}`);
}

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) {
      if (n === "__tests__" || n === "node_modules") continue;
      walk(p, out);
    } else if (/\.(ts|mjs|js)$/.test(n) && !/\.(test|spec)\.ts$/.test(n)) out.push(p);
  }
  return out;
}

const lineHash = (line) => createHash("sha256").update(line.trim()).digest("hex").slice(0, 12);

/** Pure scan: returns [{file, hash, excerpt, why}] for every offending line. */
export function scanLiterals(files, snapshot) {
  const patterns = [];
  for (const [id, f] of Object.entries(snapshot.limits)) {
    const m = /^plans\.[a-z0-9_]+\.limits\.([a-z0-9_]+)$/.exec(id);
    if (!m || typeof f.value !== "number") continue;
    const key = m[1];
    const terms = TERMS[key] ?? key.replace(/_/g, " ");
    patterns.push({ why: `${id}=${f.value}`, re: new RegExp(`\\b${f.value}\\s+(?:${terms})\\b`, "i") });
    if (f.value !== 0) patterns.push({ why: `${id}=${f.value}`, re: new RegExp(`["']?\\b${key}["']?\\s*:\\s*${f.value}\\b`) });
  }
  for (const fv of snapshot.forbidden_values) {
    let re;
    try {
      re = new RegExp(fv.pattern, "i");
    } catch {
      re = new RegExp(fv.pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    }
    patterns.push({ why: `forbidden: ${fv.pattern}`, re });
  }
  const hits = [];
  for (const { file, text } of files) {
    for (const line of text.split("\n")) {
      for (const p of patterns) {
        if (p.re.test(line)) {
          hits.push({ file, hash: lineHash(line), excerpt: line.trim().slice(0, 70), why: p.why });
          break;
        }
      }
    }
  }
  return hits;
}

export function parseAllow(text) {
  const bag = new Map();
  for (const l of text.split("\n")) {
    if (!l.trim() || l.startsWith("#")) continue;
    const [file, hash] = l.split(/\s+/);
    const k = `${file} ${hash}`;
    bag.set(k, (bag.get(k) ?? 0) + 1);
  }
  return bag;
}

/** Hits not covered by the allowlist (multiset). */
export function uncovered(hits, allowBag) {
  const left = new Map(allowBag);
  const bad = [];
  for (const h of hits) {
    const k = `${h.file} ${h.hash}`;
    if ((left.get(k) ?? 0) > 0) left.set(k, left.get(k) - 1);
    else bad.push(h);
  }
  return bad;
}

function sourceFiles(srcDir) {
  return walk(srcDir)
    .filter((p) => relative(srcDir, p).replace(/\\/g, "/") !== "data/product-truth.ts")
    .map((p) => ({ file: `src/${relative(srcDir, p).replace(/\\/g, "/")}`, text: readFileSync(p, "utf8") }));
}

function main() {
  const args = process.argv.slice(2);
  try {
    const built = build({ root: PIN_ROOT, schemaDir: join(PIN_ROOT, "schema") });
    const allowPath = join(here, "product-truth-literals.allow");
    if (args.includes("--check")) {
      const out = join(repo, "src/data/product-truth.ts");
      if (!existsSync(out) || readFileSync(out, "utf8") !== built.ts) fail("src/data/product-truth.ts differs from the pinned export. Run: npm run build:product-truth");
      // contract-v1 fixtures are pinned verbatim.
      const cdir = join(PIN_ROOT, "contract-v1");
      for (const l of readFileSync(join(cdir, "SHA256SUMS"), "utf8").split("\n").filter(Boolean)) {
        const [h, name] = l.split(/\s+/);
        if (sha256(readFileSync(join(cdir, name))) !== h) fail(`contract-v1/${name} differs from its SHA256SUMS`);
      }
      // A consumer-owned list of ids (ids only, no values): a removed fact must not reopen a hand-written fallback.
      const protectedPath = join(here, "product-truth-protected-ids.txt");
      const present = new Set([...Object.keys(built.snapshot.limits), ...built.snapshot.withheld.map((w) => w.id)]);
      for (const id of readFileSync(protectedPath, "utf8").split("\n").map((s) => s.trim()).filter((s) => s && !s.startsWith("#")))
        if (!present.has(id)) fail(`protected id ${id} is neither served nor withheld in the pin; a removed fact needs a reviewed change to scripts/product-truth-protected-ids.txt`);
      console.log(`check-product-truth: OK (${built.snapshot.truth_version}, git-reviewed, sha256-pinned, unsigned)`);
      return;
    }
    const hits = scanLiterals(sourceFiles(join(repo, "src")), built.snapshot);
    if (args.includes("--update-allow")) {
      const lines = hits.map((h) => `${h.file}  ${h.hash}  # ${h.why} :: ${h.excerpt}`).sort();
      writeFileSync(
        allowPath,
        `# Limit literals still hand-written in served text. SHRINK-ONLY (CODEOWNERS): PR-B removes entries; a test fails if this file grows against its git base.\n# Format: <file>  <sha256-12 of the trimmed line>  # <id=value> :: <excerpt>\n${lines.join("\n")}\n`,
      );
      console.log(`check-product-truth: wrote ${hits.length} allowlist entries`);
      return;
    }
    if (args.includes("--literals")) {
      const bad = uncovered(hits, parseAllow(existsSync(allowPath) ? readFileSync(allowPath, "utf8") : ""));
      if (bad.length) {
        for (const h of bad) console.error(`  ${h.file}: [${h.why}] ${h.excerpt}`);
        fail(`${bad.length} limit literal(s) outside the allowlist. Read the value through src/lib/product-truth.ts instead.`);
      }
      console.log(`check-product-truth: literals OK (${hits.length} allowlisted, none new)`);
      return;
    }
    fail("usage: --check | --literals | --update-allow");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

#!/usr/bin/env node
/**
 * build-product-truth.mjs - compile the pinned Product Truth export in
 * test-data/product-truth/<truth_version>/ into src/data/product-truth.ts
 * (PLAN-HELLOG-0011, PR-A; contract: hellocrm PLAN-HGC-0752 / PT-A sections 2, 2d).
 *
 *   node scripts/build-product-truth.mjs             write src/data/product-truth.ts
 *   node scripts/build-product-truth.mjs --check     fail if the file drifted
 *   --root <dir>   pin root (default test-data/product-truth)
 *   --out <file>   output file (default src/data/product-truth.ts)
 *
 * The pin is the verbatim PT-A output (`truth.mcp.json`, `evaluation.json`,
 * `index.json`). Trust model: git-reviewed, sha256-pinned, UNSIGNED. A green
 * build proves the file is the reviewed file and is shaped per the PT-A public
 * schema. It does not prove the numbers match the deployed product.
 *
 * The generator emits data only. Nothing here is hand-written content.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..");

export const SUPPORTED_MAJOR = 1;
export const SURFACE = "mcp";
/** Sections PT-A reserves for PT-B. A pin that carries one fails until that phase is approved. */
export const RESERVED_SECTIONS = ["pricing", "tax", "promotions"];
/** Fact-map sections; an id lives in exactly one of them, chosen by its shape. */
export const SECTIONS = ["limits", "features", "claims", "urls", "currencies"];
const MAX_STRING = 500;

/** Deterministic JSON, sorted keys, safe integers only. Equal to PT-A's canonicalize for this data. */
export function canonicalJson(v, path = "$") {
  if (v === null) return "null";
  const t = typeof v;
  if (t === "string" || t === "boolean") return JSON.stringify(v);
  if (t === "number") {
    if (!Number.isSafeInteger(v)) throw new Error(`canonical JSON allows safe integers only; got ${v} at ${path}`);
    return String(v);
  }
  if (Array.isArray(v)) return `[${v.map((x, i) => canonicalJson(x, `${path}[${i}]`)).join(",")}]`;
  if (t === "object") {
    return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(v[k], `${path}.${k}`)}`).join(",")}}`;
  }
  throw new Error(`cannot canonicalize ${t} at ${path}`);
}
export const sha256 = (data) => createHash("sha256").update(data).digest("hex");

function fail(msg) {
  throw new Error(`build-product-truth: ${msg}`);
}

/** Which section an id must live in, from its shape. PT-A forbids scope variants, so there is one location. */
export function sectionOf(id) {
  if (/^plans\.[a-z][a-z0-9_]*\.limits\.[a-z][a-z0-9_]*$/.test(id)) return "limits";
  const head = id.split(".")[0];
  return SECTIONS.includes(head) ? head : null;
}

const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const ms = (s) => (typeof s === "string" && INSTANT.test(s) ? Date.parse(s) : Number.NaN);

export function loadSchemas(schemaDir) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const compile = (name) => ajv.compile(JSON.parse(readFileSync(join(schemaDir, name), "utf8")));
  return {
    snapshot: compile("truth.public.schema.json"),
    evaluation: compile("evaluation.schema.json"),
    index: compile("index.schema.json"),
    errorsText: (v) => ajv.errorsText(v.errors),
  };
}

function checkSums(dir, names) {
  const sumsPath = join(dir, "SHA256SUMS");
  if (!existsSync(sumsPath)) fail(`${sumsPath} missing`);
  const sums = new Map(
    readFileSync(sumsPath, "utf8").split("\n").filter(Boolean).map((l) => {
      const [h, name] = l.split(/\s+/);
      return [name, h];
    }),
  );
  for (const n of names) {
    const actual = sha256(readFileSync(join(dir, n)));
    if (sums.get(n) !== actual) fail(`SHA256SUMS mismatch for ${n} (recorded ${sums.get(n) ?? "none"}, actual ${actual})`);
  }
  for (const n of sums.keys()) if (!names.includes(n)) fail(`SHA256SUMS lists ${n}, which does not exist`);
}

/**
 * Validate a parsed pin (snapshot, evaluation, index). Pure: no file access, so tests can feed adversarial
 * objects. Throws on the first violation. `raw` is the snapshot's source text (for the string scans).
 */
export function validatePin({ snapshot, evaluation, index, raw }, schemas) {
  const must = (validate, value, label) => {
    if (!validate(value)) fail(`${label} failed schema validation: ${schemas.errorsText(validate)}`);
  };
  for (const k of RESERVED_SECTIONS) if (k in snapshot) fail(`snapshot carries reserved section "${k}" (PT-B); not approved for this build`);
  must(schemas.snapshot, snapshot, "truth.mcp.json");
  must(schemas.evaluation, evaluation, "evaluation.json");
  must(schemas.index, index, "index.json");

  const major = (v) => Number.parseInt(String(v).split(".")[0], 10);
  for (const [label, v] of [["snapshot", snapshot.schema_version], ["evaluation", evaluation.schema_version], ["index", index.schema_version]])
    if (major(v) !== SUPPORTED_MAJOR) fail(`${label} schema_version ${v} has an unsupported major (supported: ${SUPPORTED_MAJOR})`);
  if (snapshot.surface !== SURFACE) fail(`snapshot surface is "${snapshot.surface}", expected "${SURFACE}"`);

  // Private data must never be in a public pin (the schema's closed objects already refuse the keys).
  if (/pending_change/.test(raw)) fail("snapshot text contains pending_change (private field)");

  // One location per id.
  const seen = new Map();
  for (const section of SECTIONS) {
    for (const [id, f] of Object.entries(snapshot[section])) {
      if (sectionOf(id) !== section) fail(`fact ${id} is in section "${section}" but its id belongs in "${sectionOf(id)}"`);
      if (seen.has(id)) fail(`fact ${id} appears in both "${seen.get(id)}" and "${section}"`);
      seen.set(id, section);
      if (typeof f.value === "string" && (f.value.length > MAX_STRING || /[<>]|javascript:|data:text/i.test(f.value)))
        fail(`fact ${id}: string value is oversize or script-like`);
      if (f.value === "unlimited" && f.unit !== "count") fail(`fact ${id}: "unlimited" is only valid for a count`);
      const from = f.effective_from === undefined ? null : ms(f.effective_from);
      const until = f.effective_until === undefined ? null : ms(f.effective_until);
      if (Number.isNaN(from) || Number.isNaN(until)) fail(`fact ${id}: effective_from / effective_until is not an ISO UTC instant`);
      if (from !== null && until !== null && !(from < until)) fail(`fact ${id}: effective_from must be before effective_until`);
    }
  }
  for (const w of snapshot.withheld) {
    if (seen.has(w.id)) fail(`${w.id} is both served and listed under withheld`);
  }
  for (const [id, surfaces] of Object.entries(snapshot.consumers)) {
    if (!Array.isArray(surfaces)) fail(`consumers.${id} is not a list`);
  }

  // The report must belong to THIS payload.
  if (evaluation.truth_version !== snapshot.truth_version) fail(`evaluation.json is for ${evaluation.truth_version}, snapshot is ${snapshot.truth_version}`);
  const { truth_version: _tv, content_digest: digest, ...payload } = snapshot;
  if (sha256(canonicalJson(payload)) !== digest) fail("snapshot content_digest does not match its content");
  if (evaluation.content_digests[SURFACE] !== digest)
    fail(`evaluation.content_digests.${SURFACE} (${evaluation.content_digests[SURFACE]}) does not equal the snapshot content_digest (${digest})`);

  // Instants: ISO UTC, ordered. next_transition may be null (validity is then bounded by valid_until alone).
  const generated = ms(evaluation.generated_at);
  const validUntil = ms(evaluation.valid_until);
  if (Number.isNaN(generated) || Number.isNaN(validUntil)) fail("evaluation generated_at / valid_until is not an ISO UTC instant");
  if (validUntil < generated) fail("evaluation valid_until is before generated_at");
  if (evaluation.next_transition !== null) {
    const nt = ms(evaluation.next_transition);
    if (Number.isNaN(nt)) fail("evaluation next_transition is not an ISO UTC instant");
    if (nt < generated) fail("evaluation next_transition is before generated_at");
  }

  // The index: the pinned version is its current entry, and the entry hash proves the three digests belong together.
  const last = index.entries.at(-1);
  if (index.current !== snapshot.truth_version) fail(`index.json current is ${index.current}, snapshot is ${snapshot.truth_version}`);
  if (last.truth_version !== snapshot.truth_version) fail(`pinned ${snapshot.truth_version} is not the last entry of index.json (${last.truth_version}); a rollback needs a stated reason`);
  const h = sha256(Object.keys(evaluation.content_digests).sort().map((s) => `${s}\n${evaluation.content_digests[s]}\n`).join(""));
  if (last.h !== h) fail("index.json entry hash does not match evaluation.content_digests");
  const versions = index.entries.map((e) => e.truth_version);
  if (new Set(versions).size !== versions.length) fail("index.json lists a truth_version twice");
}

/** Version ordering comes from index.json, never from comparing hashes. */
export function checkFloor(floor, index) {
  const order = index.entries.map((e) => e.truth_version);
  const f = order.indexOf(floor);
  if (f < 0) fail(`FLOOR ${floor} is not an entry of the pinned index.json`);
  if (order.indexOf(index.current) < f) fail(`pinned ${index.current} is below FLOOR ${floor}`);
}

export function renderModule({ snapshot, evaluation, rawSha256, pinDir }) {
  const { truth_version: truthVersion, content_digest: contentDigest, ...payload } = snapshot;
  const data = {
    schema_version: payload.schema_version,
    surface: payload.surface,
    plans: payload.plans,
    limits: payload.limits,
    features: payload.features,
    claims: payload.claims,
    urls: payload.urls,
    currencies: payload.currencies,
    withheld: payload.withheld,
    consumers: payload.consumers,
    forbidden_values: payload.forbidden_values,
  };
  const pin = {
    truth_version: truthVersion,
    content_digest: contentDigest,
    source_sha256: rawSha256,
    generated_at: evaluation.generated_at,
    valid_until: evaluation.valid_until,
    next_transition: evaluation.next_transition,
  };
  const dataSha = sha256(canonicalJson({ pin, data }));
  const ts = `/* eslint-disable */
// GENERATED by scripts/build-product-truth.mjs from test-data/product-truth/${pinDir}/ - do not edit.
// Source: hellocrm PT-A export (PLAN-HGC-0752), truth_version ${truthVersion}, source sha256 ${rawSha256}.
// Trust: git-reviewed, sha256-pinned, UNSIGNED. These are published plan defaults, not entitlements.
// Run \`npm run build:product-truth\` to regenerate; \`npm run check:truth\` fails on drift.
// A hand edit changes the digest below and the reader then withholds every fact.
import type { ProductTruthData, ProductTruthPin } from "../lib/product-truth.js";

export const PRODUCT_TRUTH_PIN: ProductTruthPin = ${JSON.stringify(pin, null, 2)};

export const PRODUCT_TRUTH_DATA: ProductTruthData = ${JSON.stringify(data, null, 2)};

export const PRODUCT_TRUTH_SHA256 = ${JSON.stringify(dataSha)};
`;
  return { ts, digest: dataSha };
}

/** Read, verify and compile one pin directory. */
export function build({ root, schemaDir }) {
  const dirs = existsSync(root)
    ? readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}\.[0-9a-f]{12}$/.test(d.name)).map((d) => d.name).sort()
    : [];
  if (dirs.length !== 1) fail(`expected exactly one pinned version directory under ${root}, found ${dirs.length}`);
  const pinDir = dirs[0];
  const dir = join(root, pinDir);
  const names = ["evaluation.json", "index.json", "truth.mcp.json"];
  checkSums(dir, readdirSync(dir).filter((f) => f !== "SHA256SUMS").sort());
  for (const n of names) if (!existsSync(join(dir, n))) fail(`${pinDir}/${n} missing`);
  checkSums(schemaDir, readdirSync(schemaDir).filter((f) => f !== "SHA256SUMS").sort());

  const rawBuf = readFileSync(join(dir, "truth.mcp.json"));
  const raw = rawBuf.toString("utf8");
  const snapshot = JSON.parse(raw);
  const evaluation = JSON.parse(readFileSync(join(dir, "evaluation.json"), "utf8"));
  const index = JSON.parse(readFileSync(join(dir, "index.json"), "utf8"));
  validatePin({ snapshot, evaluation, index, raw }, loadSchemas(schemaDir));
  if (snapshot.truth_version !== pinDir) fail(`directory ${pinDir} does not match truth_version ${snapshot.truth_version}`);

  const floorPath = join(root, "FLOOR");
  if (!existsSync(floorPath)) fail(`${floorPath} missing`);
  checkFloor(readFileSync(floorPath, "utf8").trim(), index);

  return { ...renderModule({ snapshot, evaluation, rawSha256: sha256(rawBuf), pinDir }), snapshot, evaluation, index, pinDir };
}

function main() {
  const args = process.argv.slice(2);
  const opt = (name, dflt) => {
    const i = args.indexOf(name);
    return i >= 0 ? resolve(args[i + 1]) : dflt;
  };
  const root = opt("--root", join(repo, "test-data/product-truth"));
  const out = opt("--out", join(repo, "src/data/product-truth.ts"));
  try {
    const { ts, digest } = build({ root, schemaDir: join(root, "schema") });
    if (args.includes("--check")) {
      const current = existsSync(out) ? readFileSync(out, "utf8") : "";
      if (current !== ts) {
        console.error(`build-product-truth: ${out} is out of date with test-data/product-truth. Run: npm run build:product-truth`);
        process.exit(1);
      }
      console.log(`build-product-truth: OK (drift check passed, sha256 ${digest.slice(0, 12)}...)`);
      return;
    }
    writeFileSync(out, ts);
    console.log(`build-product-truth: wrote ${out} (sha256 ${digest.slice(0, 12)}...)`);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

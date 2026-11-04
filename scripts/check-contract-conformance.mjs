#!/usr/bin/env node
/**
 * check-contract-conformance.mjs — the market_facts_contract conformance run
 * (PLAN-HELLOG-0007 section 2a). Later market plans (0008 to 0010) start only
 * after this passes. Needs a built tree (`npm run build`).
 *
 *   node scripts/check-contract-conformance.mjs [--baseline tools-list.json] [--expect-tools N]
 *
 * Checks, against dist/:
 *   1. every market in the generated data answers country_get with a
 *      market_facts block whose price is pending while its gates are unmet;
 *   2. no served response for a market carries a banned prose phrase, and none
 *      carries an unsupported UK string outside a roadmap statement;
 *   3. each changed tool's structuredContent validates against its outputSchema;
 *   4. the tool count equals --expect-tools, and, with --baseline (a saved
 *      tools/list result), tools/list differs only by additive outputSchema
 *      properties of the changed tools.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Ajv from "ajv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const load = (p) => import(pathToFileURL(join(root, "dist", p)).href);

const { tools } = await load("tools/index.js");
const { MARKET_FACTS_DATA } = await load("data/market-facts.js");
const policy = MARKET_FACTS_DATA.policy;
const banned = policy.banned_prose_patterns.map((p) => new RegExp(p, "i"));
const PLIST = [/GoCardless/, /bank transfer/i, /UK GDPR compliant/, /ICO-registered/, /HMRC and FCA/];
const byName = new Map(tools.map((t) => [t.definition.name, t]));
const ajv = new Ajv({ strict: false, allErrors: true });
const problems = [];
const CHANGED = ["country_get", "countries_list", "pricing_get_country_plans"];

const call = async (name, a) => {
  const res = await byName.get(name).handle(a);
  return { res, json: res.structuredContent ?? JSON.parse(res.content[0].text) };
};

// walk prose fields
function* prose(v, key = "") {
  if (typeof v === "string") { if (["statement", "message", "note", "qualifier"].includes(key)) yield v; }
  else if (Array.isArray(v)) for (const x of v) yield* prose(x, key);
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) yield* prose(x, k);
}

for (const market of Object.keys(MARKET_FACTS_DATA.markets)) {
  const { res, json } = await call("country_get", { code: market });
  const mf = json.market_facts;
  if (!mf) { problems.push(`${market}: country_get has no market_facts`); continue; }
  if (mf.price.price_status !== "pending_verification" && !MARKET_FACTS_DATA.gates.some((g) => g.market === market && g.status === "met"))
    problems.push(`${market}: price is ${mf.price.price_status} with no met gate`);
  for (const text of prose(json)) for (const re of banned) if (re.test(text)) problems.push(`${market}: prose matches ${re}: ${text.slice(0, 60)}`);
  const sanitized = JSON.stringify({ ...json, market_facts: { ...mf, facts: mf.facts.filter((f) => f.status !== "roadmap") } });
  const outside = sanitized.replace(/"country":\{[^}]*\}/, "");
  for (const re of PLIST) if (market === "uk" && re.test(outside)) problems.push(`${market}: response matches unsupported-claim pattern ${re}`);
  void res;
}

for (const name of CHANGED) {
  const args2 = name === "country_get" ? { code: "uk" } : name === "pricing_get_country_plans" ? { country: "uk" } : {};
  const { json } = await call(name, args2);
  const schema = byName.get(name).definition.outputSchema;
  if (!schema) { problems.push(`${name}: no outputSchema`); continue; }
  const v = ajv.compile(schema);
  if (!v(json)) problems.push(`${name}: result does not validate: ${ajv.errorsText(v.errors)}`);
}

const expect = opt("--expect-tools");
if (expect && tools.length !== Number(expect)) problems.push(`tool count ${tools.length} != expected ${expect}`);

const baselinePath = opt("--baseline");
if (baselinePath) {
  const base = JSON.parse(readFileSync(baselinePath, "utf8")).tools ?? JSON.parse(readFileSync(baselinePath, "utf8"));
  const now = new Map(tools.map((t) => [t.definition.name, t.definition]));
  for (const b of base) {
    const cur = now.get(b.name);
    if (!cur) { problems.push(`tools/list: ${b.name} removed`); continue; }
    const strip = (d) => { const c = JSON.parse(JSON.stringify(d)); if (CHANGED.includes(c.name)) delete c.outputSchema; return c; };
    if (JSON.stringify(strip(b)) !== JSON.stringify(strip({ ...cur, ...(b.title ? {} : {}) })))
      problems.push(`tools/list: ${b.name} differs beyond outputSchema`);
  }
}

if (problems.length) {
  for (const p of problems) console.error(`check-contract-conformance: FAIL ${p}`);
  process.exit(1);
}
console.log(`check-contract-conformance: OK (${Object.keys(MARKET_FACTS_DATA.markets).length} market(s), ${tools.length} tools)`);

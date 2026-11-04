#!/usr/bin/env node
/**
 * check-release-evidence.mjs — release-evidence agreement for market facts
 * (PLAN-HELLOG-0007 section 2b).
 *
 *   node scripts/check-release-evidence.mjs [--warn-days 14] [--now ISO] [--pr-body FILE] [--root DIR]
 *
 * Fails (exit 1) when:
 *   - a fact's or price's release_evidence_version differs from gates.json's;
 *   - a gate is `met` without evidence_sha256, observed_on, approver or
 *     expires_on, or its expires_on is not after observed_on;
 *   - a price gate (website-deploy / stripe-flow1) has expires_on more than
 *     policy.max_price_gate_days after observed_on;
 *   - a `met` stripe-flow1 gate has an empty public_price_qualifier;
 *   - --pr-body is given and does not cite the release_evidence_version.
 * Warns (exit 0) when a met gate expires within --warn-days.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const root = resolve(opt("--root", join(here, "../test-data/market-facts")));
const warnDays = Number(opt("--warn-days", "14"));
const now = Date.parse(opt("--now", new Date().toISOString()));
const policy = JSON.parse(readFileSync(join(here, "market-facts.policy.json"), "utf8"));

const problems = [];
const warnings = [];
const dirs = readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(join(root, d.name, "gates.json"))).map((d) => d.name).sort();
const dir = join(root, dirs.at(-1));
const gatesFile = JSON.parse(readFileSync(join(dir, "gates.json"), "utf8"));
const rev = gatesFile.release_evidence_version;

for (const f of readdirSync(dir).filter((n) => n.endsWith(".json") && n !== "gates.json")) {
  const m = JSON.parse(readFileSync(join(dir, f), "utf8"));
  if (m.release_evidence_version !== rev) problems.push(`${f}: release_evidence_version ${m.release_evidence_version} != gates.json ${rev}`);
  for (const fact of m.facts) if (fact.release_evidence_version !== rev) problems.push(`${fact.fact_id}: release_evidence_version ${fact.release_evidence_version} != ${rev}`);
}

const DAY = 86_400_000;
for (const g of gatesFile.gates) {
  if (g.status !== "met") continue;
  for (const k of ["evidence_ref", "evidence_sha256", "observed_on", "approver", "expires_on"]) if (!g[k]) problems.push(`gate ${g.gate_id} is met without ${k}`);
  const obs = Date.parse(g.observed_on);
  const exp = Date.parse(g.expires_on);
  if (!Number.isFinite(exp)) { problems.push(`gate ${g.gate_id}: expires_on is not a date`); continue; }
  if (Number.isFinite(obs) && exp <= obs) problems.push(`gate ${g.gate_id}: expires_on is not after observed_on`);
  const id = g.gate_id.split(":")[0];
  if (["website-deploy", "stripe-flow1"].includes(id) && Number.isFinite(obs) && exp - obs > policy.max_price_gate_days * DAY)
    problems.push(`gate ${g.gate_id}: expires_on is more than ${policy.max_price_gate_days} days after observed_on`);
  if (id === "stripe-flow1" && !(g.public_price_qualifier ?? "").trim()) problems.push(`gate ${g.gate_id} is met with an empty public_price_qualifier`);
  const left = (exp - now) / DAY;
  if (left <= warnDays) warnings.push(`gate ${g.gate_id} ${left <= 0 ? "has expired" : `expires in ${left.toFixed(1)} days`} (${g.expires_on}): re-observe before the next MCP deploy`);
}

const body = opt("--pr-body", null);
if (body) {
  if (!existsSync(body)) problems.push(`--pr-body file ${body} not found`);
  else if (!readFileSync(body, "utf8").includes(rev)) problems.push(`PR body does not cite release_evidence_version ${rev}`);
}

for (const w of warnings) console.warn(`check-release-evidence: WARN ${w}`);
if (problems.length) {
  for (const p of problems) console.error(`check-release-evidence: FAIL ${p}`);
  process.exit(1);
}
console.log(`check-release-evidence: OK (release_evidence_version ${rev}, ${gatesFile.gates.length} gates, ${warnings.length} warning(s))`);

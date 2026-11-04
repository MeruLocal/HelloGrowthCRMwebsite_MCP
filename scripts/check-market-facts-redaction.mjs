#!/usr/bin/env node
/**
 * check-market-facts-redaction.mjs — backstop scan that no Stripe id, customer
 * or tenant identifier, credential or report material reached generated
 * assets or fixtures (PLAN-HELLOG-0007). The real boundary is the schema
 * (additionalProperties: false); this catches what slips through free text.
 *
 *   node scripts/check-market-facts-redaction.mjs [file-or-dir ...]
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
export const PATTERNS = [
  [/\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{8,}/, "Stripe key"],
  [/\b(price|prod|cus|acct|sub|pi|in|ch|cs|evt|whsec)_[A-Za-z0-9]{10,}/, "Stripe object id"],
  [/-----BEGIN [A-Z ]*(PRIVATE KEY|CERTIFICATE)-----/, "key material"],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./, "JWT"],
  [/\b(tenant[_-]?id|customer[_-]?id|api[_-]?key|secret)\s*["']?\s*[:=]/i, "credential or tenant field"],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, "email address"],
  [/\bmanagement'?s? (assertion|description of the system)\b|\bcontrol (CC|A|C|PI|P)\d+(\.\d+)?\b/i, "SOC 2 report material"],
];

function collect(p, out) {
  if (!existsSync(p)) return out;
  if (statSync(p).isDirectory()) for (const n of readdirSync(p)) collect(join(p, n), out);
  else out.push(p);
  return out;
}

export function scan(text) {
  return PATTERNS.filter(([re]) => re.test(text)).map(([, label]) => label);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const targets = process.argv.slice(2).length
    ? process.argv.slice(2).map((p) => resolve(p))
    : [join(repo, "test-data/market-facts"), join(repo, "src/data/market-facts.ts"), ...readdirSync(join(repo, "test-data/fixtures")).filter((f) => f.startsWith("market-facts-")).map((f) => join(repo, "test-data/fixtures", f))];
  const hits = [];
  for (const file of targets.flatMap((t) => collect(t, []))) {
    for (const label of scan(readFileSync(file, "utf8"))) hits.push(`${file}: ${label}`);
  }
  if (hits.length) {
    for (const h of hits) console.error(`check-market-facts-redaction: FAIL ${h}`);
    process.exit(1);
  }
  console.log("check-market-facts-redaction: OK");
}

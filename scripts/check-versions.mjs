#!/usr/bin/env node
/**
 * check-versions.mjs — fail the build when the release manifests disagree.
 *
 * The version of this server is written in THREE places across TWO files:
 *
 *   package.json   version                 (1)
 *   server.json    version                 (2)  <- top level
 *   server.json    packages[0].version     (3)  <- the npm package entry
 *
 * smithery.yaml deliberately carries no version — Smithery reads it from the
 * package. Do not add one; a fourth copy is a fourth thing to forget.
 *
 * Registries cache aggressively and clients pin. A server.json that advertises
 * 1.1.0 while npm serves 1.0.0 is not a cosmetic mismatch: the registry entry
 * points at a package version that does not exist, and installs fail for
 * everyone who found us through it. The failure lands on users, not on us,
 * which is why this is a build gate and not a checklist item.
 *
 * Usage:  node scripts/check-versions.mjs      (exit 1 on mismatch)
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const read = (name) => {
  const path = join(root, name);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    console.error(`check-versions: ${name} is not valid JSON — ${err.message}`);
    process.exit(1);
  }
};

const pkg = read("package.json");
if (!pkg) {
  console.error("check-versions: package.json not found");
  process.exit(1);
}

const expected = pkg.version;
const found = [{ where: "package.json → version", value: expected }];

const server = read("server.json");
if (!server) {
  // Not an error: server.json arrives with the registry-manifest change. Say so
  // rather than passing silently, so a missing manifest is never mistaken for a
  // clean check.
  console.log(
    "check-versions: server.json not present — skipping manifest parity " +
      `(package.json is ${expected})`,
  );
  process.exit(0);
}

found.push({ where: "server.json → version", value: server.version });

const packages = Array.isArray(server.packages) ? server.packages : [];
if (packages.length === 0) {
  console.error("check-versions: server.json has no packages[] entry");
  process.exit(1);
}
packages.forEach((p, i) => {
  found.push({ where: `server.json → packages[${i}].version`, value: p.version });
});

// The npm identifier must match the package we actually publish, or the
// registry listing installs someone else's package.
const npmEntry = packages.find((p) => p.registryType === "npm");
if (npmEntry && npmEntry.identifier !== pkg.name) {
  console.error(
    `check-versions: server.json npm identifier "${npmEntry.identifier}" ` +
      `does not match package.json name "${pkg.name}"`,
  );
  process.exit(1);
}

const mismatched = found.filter((f) => f.value !== expected);
const width = Math.max(...found.map((f) => f.where.length));
for (const f of found) {
  const mark = f.value === expected ? "ok  " : "BAD ";
  console.log(`  ${mark} ${f.where.padEnd(width)}  ${f.value ?? "(missing)"}`);
}

if (mismatched.length > 0) {
  console.error(
    `\ncheck-versions: ${mismatched.length} of ${found.length} version strings ` +
      `disagree with package.json (${expected}). Bump them together — see RELEASING.md.`,
  );
  process.exit(1);
}

console.log(`\ncheck-versions: all ${found.length} version strings agree (${expected}).`);

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
 * CHANGELOG.md is also checked (added 2026-09-02). Until then this script only
 * proved the version strings agreed with EACH OTHER, never with the release
 * notes — so the 2.0.0 entry retiring GET /openapi.json sat on top of a
 * CHANGELOG while every manifest still said 1.1.0, and this check passed.
 * `GET /version` is the endpoint registries and pinning clients watch for
 * exactly that breaking change, and it would have kept reporting 1.1.0.
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

// serverInfo (the MCP wire identity) reads its version from src/server-info.ts —
// a fourth copy, but one clients actually see in `initialize`, so it is checked
// here rather than trusted.
{
  const serverInfoPath = join(root, "src", "server-info.ts");
  if (existsSync(serverInfoPath)) {
    const src = readFileSync(serverInfoPath, "utf8");
    const m = src.match(/SERVER_VERSION\s*=\s*"([^"]+)"/);
    found.push({
      where: "src/server-info.ts → SERVER_VERSION",
      value: m ? m[1] : "(missing)",
    });
  }
}

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

// CHANGELOG parity. The topmost released heading must name the version we are
// about to ship. An "## [Unreleased]" section on top is fine — that is work in
// flight, not a release — so skip to the first versioned heading after it.
{
  const changelogPath = join(root, "CHANGELOG.md");
  if (existsSync(changelogPath)) {
    const text = readFileSync(changelogPath, "utf8");
    const headings = [...text.matchAll(/^##\s*\[([^\]]+)\]/gm)].map((m) => m[1]);
    const topReleased = headings.find((h) => !/^unreleased$/i.test(h));

    if (!topReleased) {
      console.error(
        "\ncheck-versions: CHANGELOG.md has no released version heading " +
          "(expected a line like \"## [1.2.3] — YYYY-MM-DD\").",
      );
      process.exit(1);
    }
    if (topReleased !== expected) {
      console.error(
        `\ncheck-versions: CHANGELOG.md's newest release is [${topReleased}] but ` +
          `the manifests say ${expected}. Whichever is right, the other is a lie ` +
          "clients can read — bump the manifests or fix the heading. See RELEASING.md.",
      );
      process.exit(1);
    }
    console.log(`  ok   CHANGELOG.md → newest release${" ".repeat(Math.max(0, width - 29))}  ${topReleased}`);
  }
}

console.log(`\ncheck-versions: all ${found.length} version strings agree (${expected}), and CHANGELOG.md matches.`);

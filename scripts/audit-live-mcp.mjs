#!/usr/bin/env node
// ============================================================================
// audit-live-mcp.mjs — audit a LIVE MCP server over the wire. Zero dependencies.
//
//   node scripts/audit-live-mcp.mjs [origin]        (default: production)
//   node scripts/audit-live-mcp.mjs http://localhost:3001
//
// WHY THIS EXISTS RATHER THAN `npx <some-scanner>`: auditing an MCP server by
// pulling an unpinned package from npm and letting it run is the same
// supply-chain exposure the audit is supposed to be looking for. Everything
// here uses node's built-in fetch against documented protocol endpoints. It
// installs nothing and reads nothing off disk.
//
// It covers the checks the well-known third-party tools perform (protocol
// conformance, schema hygiene, annotation coverage, session handling, error
// shape, discovery surfaces) — see .claude/skills/mcp-server-audit/SKILL.md for
// the mapping and for the checks a script CANNOT do.
//
// Exit codes: 0 = no FAILs, 1 = at least one FAIL, 2 = could not reach server.
// ============================================================================

import fs from "node:fs";

const ORIGIN = (process.argv[2] ?? "https://mcp.hellogrowthcrm.com").replace(/\/$/, "");
const MCP = `${ORIGIN}/sse`;
const TIMEOUT_MS = 20000;

const results = [];
const pass = (id, msg) => results.push({ level: "PASS", id, msg });
const warn = (id, msg) => results.push({ level: "WARN", id, msg });
const fail = (id, msg) => results.push({ level: "FAIL", id, msg });

const withTimeout = (ms) => {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, done: () => clearTimeout(t) };
};

async function http(path, init = {}) {
  const t = withTimeout(TIMEOUT_MS);
  try {
    const res = await fetch(`${ORIGIN}${path}`, { ...init, signal: t.signal });
    const text = await res.text();
    return { status: res.status, headers: res.headers, text };
  } finally {
    t.done();
  }
}

/** Streamable HTTP responses arrive as `event: message` / `data: {…}` frames. */
function parseSse(text) {
  const line = text.split(/\r?\n/).find((l) => l.startsWith("data: "));
  if (!line) return null;
  try { return JSON.parse(line.slice(6)); } catch { return null; }
}

async function rpc(body, sessionId) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;
  const t = withTimeout(TIMEOUT_MS);
  try {
    const res = await fetch(MCP, { method: "POST", headers, body: JSON.stringify(body), signal: t.signal });
    const text = await res.text();
    return { status: res.status, sessionId: res.headers.get("mcp-session-id"), json: parseSse(text), text };
  } finally {
    t.done();
  }
}

// ── 1. Liveness / identity ───────────────────────────────────────────────────
let version = null;
try {
  const v = await http("/version");
  if (v.status !== 200) fail("version", `GET /version returned ${v.status}, expected 200`);
  else {
    version = JSON.parse(v.text);
    pass("version", `${version.name} v${version.version} — ${version.tools} tools, ${version.resources} resources`);
    if (!version.mcp_endpoint) warn("version", "/version does not advertise mcp_endpoint");
  }
} catch (e) {
  console.error(`Cannot reach ${ORIGIN}: ${e.message}`);
  process.exit(2);
}

// ── 2. Discovery surfaces ────────────────────────────────────────────────────
const wk = await http("/.well-known/mcp.json");
if (wk.status === 200) {
  pass("discovery", "/.well-known/mcp.json is served");
  try {
    const doc = JSON.parse(wk.text);
    if (Array.isArray(doc.tools)) {
      fail("discovery", "the manifest hand-lists tools — a second copy of the tool surface WILL rot. Publish counts; let tools/list own names.");
    }
    if (version && doc.version && doc.version !== version.version) {
      fail("discovery", `manifest version ${doc.version} != /version ${version.version}`);
    }
  } catch { fail("discovery", "/.well-known/mcp.json is not valid JSON"); }
} else {
  fail("discovery", `/.well-known/mcp.json returned ${wk.status} — registries and agents probe this path first`);
}
if (wk.status === 200 && wk.headers.get("access-control-allow-origin") !== "*") {
  warn("discovery", "manifest lacks Access-Control-Allow-Origin: * — browser-based inspectors cannot read it");
}

// ── 3. No spec may advertise what the server does not implement ──────────────
const oapi = await http("/openapi.json");
if (oapi.status === 200) {
  let paths = [];
  try { paths = Object.keys(JSON.parse(oapi.text).paths ?? {}); } catch { /* not a spec */ }
  if (paths.length) {
    const probe = paths.find((p) => p.startsWith("/tools/"));
    if (probe) {
      const r = await http(probe, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (r.status === 404) {
        fail("spec", `/openapi.json advertises ${paths.length} operations; ${probe} returns 404 — the spec describes a server that is not running here`);
      } else {
        warn("spec", `/openapi.json advertises ${paths.length} operations; verify EVERY one is implemented and that any declared auth is enforced`);
      }
    }
  }
} else {
  pass("spec", `/openapi.json returns ${oapi.status} — an MCP server is enumerated over the protocol, not OpenAPI`);
}

// ── 4. Transport truth ───────────────────────────────────────────────────────
const legacy = await http("/sse", { headers: { Accept: "text/event-stream" } });
if (legacy.status === 200) {
  warn("transport", "GET /sse returns 200 — this server speaks the legacy HTTP+SSE transport; confirm that is intended");
} else {
  pass("transport", `GET /sse returns ${legacy.status} — Streamable HTTP, as expected`);
  warn("transport", "the endpoint is NAMED /sse but is not SSE: `npx @modelcontextprotocol/inspector --cli <url>` fails with 'SSE error: Non-200 status code (400)' unless `--transport http` is passed. Document that, or mount at /mcp.");
}

// ── 5. Handshake, session, capabilities ──────────────────────────────────────
const init = await rpc({
  jsonrpc: "2.0", id: 1, method: "initialize",
  params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "audit-live-mcp", version: "1.0" } },
});
if (!init.json?.result) { console.error("initialize failed — cannot continue"); process.exit(2); }
const sid = init.sessionId;
sid ? pass("session", "initialize returns an mcp-session-id header") : fail("session", "no mcp-session-id header on initialize");

const caps = init.json.result.capabilities ?? {};
if (caps.tools?.listChanged) pass("capabilities", "tools.listChanged is declared");
else warn("capabilities", "tools.listChanged is NOT declared — connected clients cannot be told the tool set changed and will serve a stale list until restart");

const noSession = await rpc({ jsonrpc: "2.0", id: 99, method: "tools/list", params: {} });
noSession.status === 400
  ? pass("session", "a request without a session id is rejected (400)")
  : warn("session", `a request without a session id returned ${noSession.status} — expected 400`);

await rpc({ jsonrpc: "2.0", method: "notifications/initialized" }, sid);

// ── 6. Tool schema + annotation hygiene ──────────────────────────────────────
const list = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, sid);
const tools = list.json?.result?.tools ?? [];
if (!tools.length) { console.error("tools/list returned nothing — cannot continue"); process.exit(2); }
pass("tools", `tools/list returned ${tools.length} tools`);
if (version && version.tools !== tools.length) {
  fail("tools", `/version says ${version.tools} tools, tools/list returns ${tools.length}`);
}

const NAME_RE = /^[A-Za-z0-9_.-]{1,128}$/;
const HINTS = ["readOnlyHint", "destructiveHint", "idempotentHint", "openWorldHint"];
const bad = { name: [], desc: [], schema: [], ann: [], title: [], out: [] };
for (const t of tools) {
  if (!NAME_RE.test(t.name)) bad.name.push(t.name);
  if (!t.description || t.description.trim().length < 20) bad.desc.push(t.name);
  if (!t.inputSchema || t.inputSchema.type !== "object") bad.schema.push(t.name);
  if (!t.annotations || HINTS.some((h) => typeof t.annotations[h] !== "boolean")) bad.ann.push(t.name);
  if (!t.title) bad.title.push(t.name);
  if (!t.outputSchema) bad.out.push(t.name);
}
bad.name.length ? fail("tools", `illegal tool names: ${bad.name.join(", ")}`) : pass("tools", "all tool names match ^[A-Za-z0-9_.-]{1,128}$");
bad.desc.length ? fail("tools", `missing/thin description (<20 chars): ${bad.desc.join(", ")}`) : pass("tools", "every tool has a substantive description");
bad.schema.length ? fail("tools", `missing or non-object inputSchema: ${bad.schema.join(", ")}`) : pass("tools", "every tool has an object inputSchema");
bad.ann.length
  ? fail("safety", `tools missing one of the 4 annotation hints: ${bad.ann.join(", ")} — clients fall back to the spec defaults, which are readOnly=false / destructive=true`)
  : pass("safety", "all tools carry readOnlyHint, destructiveHint, idempotentHint and openWorldHint");
if (bad.title.length === tools.length) warn("tools", "no tool sets `title` — clients show raw snake_case names in their UI");
if (bad.out.length === tools.length) warn("tools", "no tool sets `outputSchema` — every result must be re-parsed from text by the model");

const writes = tools.filter((t) => t.annotations?.readOnlyHint !== true);
const destructive = tools.filter((t) => t.annotations?.destructiveHint === true);
pass("safety", `${tools.length - writes.length} read-only · ${writes.length} write${writes.length ? ` (${writes.map((t) => t.name).join(", ")})` : ""} · ${destructive.length} destructive`);
// Deliberately NOT gated on sniffing the server description for the word "auth":
// this server's own description contains "requires no API key", which a naive
// /api key|auth/i test reads as evidence that auth EXISTS. Anonymous write tools
// always deserve a second look.
if (writes.length) {
  warn("security", `${writes.length} write tools are callable — confirm each is safe for an anonymous caller, rate-limited, and that none can be driven by prompt injection in fetched content`);
}

// ── 7. Error shape ───────────────────────────────────────────────────────────
const missing = await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "__does_not_exist__", arguments: {} } }, sid);
const errored = missing.json?.error || missing.json?.result?.isError;
errored
  ? pass("errors", "calling an unknown tool produces a JSON-RPC error / isError result")
  : fail("errors", "calling an unknown tool did NOT produce an error — clients cannot distinguish success from failure");
if (missing.status === 200 && missing.json?.error) {
  pass("errors", "JSON-RPC errors are returned at HTTP 200 — telemetry MUST derive success from the body, never the status code");
}

// ── 8. Privacy: an error must not echo caller input back ─────────────────────
const CANARY = "canary-9f2b-pii-marker";
const echo = await rpc({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "__does_not_exist__", arguments: { note: CANARY } } }, sid);
JSON.stringify(echo.json ?? {}).includes(CANARY)
  ? fail("privacy", "an error response echoed the caller's argument back — arguments must never be reflected or logged")
  : pass("privacy", "error responses do not echo caller arguments");

// ── 9. Client fitness — can real MCP clients actually connect? ──────────────
// Every check here maps to a client class that is silently locked out when it
// fails. Protocol conformance can be perfect while none of these pass.

// Browser-based clients: a failed preflight means the request is never sent.
const pre = await http("/sse", {
  method: "OPTIONS",
  headers: { origin: "https://example.com", "access-control-request-method": "POST" },
});
const acao = pre.headers?.get("access-control-allow-origin");
const expose = pre.headers?.get("access-control-expose-headers") ?? "";
if (pre.status >= 400 || !acao) {
  fail("fitness", `OPTIONS on the MCP endpoint returned ${pre.status}${acao ? "" : " with no Access-Control-Allow-Origin"} — NO browser-based client can connect`);
} else if (!expose.toLowerCase().includes("mcp-session-id")) {
  fail("fitness", "CORS preflight passes but mcp-session-id is not in Access-Control-Expose-Headers — browser JS cannot READ the session id, so initialize appears to succeed and every later request 400s");
} else {
  pass("fitness", "CORS preflight allows browser clients and exposes mcp-session-id");
}

// Clients that send only application/json. The spec asks for both types, but
// plenty of shipped clients and plain HTTP agents send one, and a bare 406
// is indistinguishable from an outage on their side.
const narrow = await http("/sse", {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 90, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "audit", version: "1" } } }),
});
narrow.status === 406
  ? warn("fitness", "a client offering only `Accept: application/json` gets 406 — tolerate it (widen the header) or the failure reads as a broken server")
  : pass("fitness", `a client offering only Accept: application/json is served (${narrow.status})`);

// Path naming. An endpoint NAMED /sse makes clients try the legacy transport.
const alias = await http("/mcp", {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 91, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "audit", version: "1" } } }),
});
alias.status === 200
  ? pass("fitness", "/mcp is served — clients are not misled by the /sse name into trying the legacy transport")
  : warn("fitness", `/mcp returned ${alias.status} — the only path is named /sse, which makes clients open with GET and read the 400 as an outage`);

// Protocol-version negotiation: older shipped clients must not be turned away.
for (const v of ["2025-03-26", "2024-11-05"]) {
  const old = await http("/sse", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 92, method: "initialize", params: { protocolVersion: v, capabilities: {}, clientInfo: { name: "audit", version: "1" } } }),
  });
  old.status === 200
    ? pass("fitness", `a client on protocol ${v} is accepted`)
    : fail("fitness", `a client on protocol ${v} got ${old.status} — older shipped clients cannot connect`);
}

// Install path. Registries that auto-index (Smithery, Glama, PulseMCP, mcp-get)
// key off a published package; without one the whole distribution story stalls.
try {
  const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const reg = await fetch(`https://registry.npmjs.org/${pkg.name}`, { method: "HEAD" }).catch(() => null);
  reg && reg.ok
    ? pass("fitness", `npm package ${pkg.name} is published — npx install paths and registry auto-indexing work`)
    : warn("fitness", `npm package ${pkg.name} is NOT published (registry.npmjs.org returned ${reg ? reg.status : "no response"}) — no npx one-liner, and Smithery/Glama/PulseMCP cannot auto-index`);
} catch { /* package.json unreadable — not fatal for a remote audit */ }

// ── report ───────────────────────────────────────────────────────────────────
const order = { FAIL: 0, WARN: 1, PASS: 2 };
results.sort((a, b) => order[a.level] - order[b.level]);
const counts = { FAIL: 0, WARN: 0, PASS: 0 };
console.log(`\nMCP audit — ${ORIGIN}\n${"─".repeat(76)}`);
for (const r of results) {
  counts[r.level]++;
  console.log(`${r.level.padEnd(5)} ${r.id.padEnd(13)} ${r.msg}`);
}
console.log(`${"─".repeat(76)}\n${counts.FAIL} fail · ${counts.WARN} warn · ${counts.PASS} pass\n`);
console.log("Not checkable over the wire — do these by hand (see the skill):");
console.log("  · are the numbers the tools return TRUE against the codebase?");
console.log("  · do URLs in the payloads resolve?");
console.log("  · are pricing / compliance / residency claims sourced?\n");
process.exit(counts.FAIL > 0 ? 1 : 0);

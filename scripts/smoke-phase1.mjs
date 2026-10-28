#!/usr/bin/env node
/**
 * smoke-phase1.mjs — the PLAN-HELLOG-0003 section 7b smoke test against a running server.
 *
 *   node scripts/smoke-phase1.mjs http://localhost:3001
 *   node scripts/smoke-phase1.mjs https://mcp.hellogrowthcrm.com
 *
 * Streamable-HTTP handshake on BOTH /sse and /mcp (src/server.ts routes both to the same
 * handler): POST initialize with Accept: application/json, text/event-stream, read the
 * mcp-session-id response header, send notifications/initialized with it, then call tools.
 * Exits 1 on any failed expectation. Read-only; sends no credentials. Zero dependencies.
 */

const base = (process.argv[2] ?? "http://localhost:3001").replace(/\/$/, "");
const HEADERS = { "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
let failures = 0;
const check = (ok, label, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

async function rpc(url, sid, id, method, params) {
  const res = await fetch(url, { method: "POST", headers: { ...HEADERS, ...(sid ? { "mcp-session-id": sid } : {}) }, body: JSON.stringify({ jsonrpc: "2.0", id, method, params }) });
  const text = await res.text();
  const data = text.match(/^data: (.*)$/m)?.[1] ?? text;
  return { sid: res.headers.get("mcp-session-id"), json: JSON.parse(data), bytes: Buffer.byteLength(text) };
}

async function session(path) {
  const url = base + path;
  const init = await rpc(url, null, 1, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "smoke-phase1", version: "1" } });
  const sid = init.sid;
  await fetch(url, { method: "POST", headers: { ...HEADERS, "mcp-session-id": sid }, body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) });
  return { url, sid, init: init.json.result };
}

async function tool(s, name, args = {}) {
  const r = await rpc(s.url, s.sid, 10, "tools/call", { name, arguments: args });
  const text = r.json.result?.content?.[0]?.text ?? "";
  let body = null;
  try { body = JSON.parse(text); } catch { /* not JSON */ }
  return { body, text, bytes: r.bytes };
}

for (const path of ["/sse", "/mcp"]) {
  try {
    const s = await session(path);
    const ins = s.init?.instructions ?? "";
    check(ins.startsWith("This server is read-only product knowledge"), `${path}: initialize returns instructions`, `${ins.length} chars`);
    check(s.init?.serverInfo?.version === "2.2.0", `${path}: serverInfo.version is 2.2.0`, String(s.init?.serverInfo?.version));
  } catch (e) {
    check(false, `${path}: handshake`, String(e));
  }
}

const s = await session("/sse");
const list = await rpc(s.url, s.sid, 2, "tools/list", {});
const tools = list.json.result?.tools ?? [];
const gs = tools.find((t) => t.name === "get_started");
check(Boolean(gs?.title), "tools/list: get_started present with a title");
check(tools.every((t) => t.annotations?.readOnlyHint === true), "tools/list: every public tool is read-only");

const started = await tool(s, "get_started");
const intents = started.body?.intents ?? [];
check(intents.length === 6, "get_started: 6 intents", String(intents.length));
check(intents.every((i) => i.visit_url.includes("utm_source=mcp") && !i.canonical_url.includes("utm_")), "get_started: visit_url tagged, canonical_url clean");

const zero = await tool(s, "features_list", { search: "zzzzqq" });
check(zero.body?.total === 0 && zero.body?.matched === false && /does not mean the product lacks it/.test(zero.body?.guidance ?? ""), "features_list zzzzqq: matched:false with the guidance sentence");

const paytm = await tool(s, "integrations_list", { search: "paytm" });
const hit = (paytm.body?.items ?? []).find((i) => i.slug === "paytm");
check(hit?.status === "not_available" && Boolean(hit?.kt) && Boolean(hit?.as_of) && paytm.body?.matched === undefined, "integrations_list paytm: not_available entry with kt and as_of");

const def = await tool(s, "integrations_list");
check(def.bytes < 40_000, "integrations_list default page under 40 KB", `${def.bytes} bytes`);
check(Boolean(def.body?.counts), "integrations_list default has counts");
check(!/630\+?\s*integrations/i.test(def.text), "integrations_list default has no '630 integrations'");

let offset = 0, returned = 0, total = -1, guard = 0;
const slugs = new Set();
while (offset !== null && guard++ < 20) {
  const p = await tool(s, "integrations_list", { status: "all", limit: 200, offset });
  total = p.body?.total ?? total;
  for (const i of p.body?.items ?? []) { returned++; slugs.add(i.slug); }
  offset = p.body?.next_offset ?? null;
}
check(returned === total && slugs.size === returned, "integrations_list status=all: paging returns every entry once", `${returned}/${total}`);

const plans = await tool(s, "pricing_get_plans", { region: "india" });
check(/899/.test(plans.text) && !/1,099/.test(plans.text), "pricing_get_plans india: 899 and not 1,099");

for (const p of ["/health", "/version", "/.well-known/mcp.json"]) {
  const r = await fetch(base + p);
  check(r.status === 200, `GET ${p}`, String(r.status));
}
const health = await (await fetch(base + "/health")).json();
check(health.overrides && typeof health.overrides.total === "number", "GET /health reports overrides", JSON.stringify(health.overrides));

console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);

#!/usr/bin/env bash
#
# mcp-monitor.sh — protocol-level health check for the deployed MCP server.
#
# Fast, protocol-only, and safe to run on a cron. Exits non-zero on any failure,
# so it drops straight into an uptime monitor or a deploy gate.
#
# ── Why this exists when geo-audit.sh already touches the MCP endpoint ───────
# geo-audit.sh does ONE initialize + ONE tools/call, and only as a deploy-drift
# check inside a slow full-site audit. It answers "is production running the
# same build as main?" — not "is the protocol surface healthy?".
#
# More importantly, NOTHING checked the published manifest against what the
# server actually serves. That gap is why the worst defect of the 2026-08 audit
# went unnoticed: /.well-known/mcp.json advertises 14 CRM tools
# (create_contact, get_pipeline, update_deal, send_whatsapp …) and the endpoint
# it points at serves NONE of them. Any AI client following our own published
# discovery path connects fine and finds nothing it was promised.
#
# Check M4 below asserts that parity. It would have caught it on day one, and
# it will catch the next divergence — in either direction.
#
# Requirements: bash, curl, node.
#
# Usage:
#   ./scripts/mcp-monitor.sh                  # check production
#   MCP_URL=http://localhost:3008/mcp ./scripts/mcp-monitor.sh
#   MANIFEST_URL='' ./scripts/mcp-monitor.sh  # skip the manifest parity check
#   ./scripts/mcp-monitor.sh --json           # one JSON line, for monitoring
#
# Exit codes: 0 = healthy, 1 = at least one check failed, 2 = missing dependency.

MCP_URL="${MCP_URL:-https://mcp.hellogrowthcrm.com/mcp}"
MANIFEST_URL="${MANIFEST_URL-https://hellogrowthcrm.com/.well-known/mcp.json}"
PROBE_TOOL="${PROBE_TOOL:-company_get_profile}"
TIMEOUT="${TIMEOUT:-30}"
JSON=0
[ "${1:-}" = "--json" ] && JSON=1

need() { command -v "$1" >/dev/null 2>&1 || { echo "mcp-monitor: '$1' is required" >&2; exit 2; }; }
need curl
need node

FAILS=0
RESULTS=""

record() { # name status detail
  RESULTS="${RESULTS}${RESULTS:+,}$(node -e '
    const [name, status, detail] = process.argv.slice(1);
    process.stdout.write(JSON.stringify({ name, status, detail }));
  ' "$1" "$2" "$3")"
  [ "$2" = "fail" ] && FAILS=$((FAILS+1))
  if [ "$JSON" = "0" ]; then
    if [ "$2" = "ok" ]; then printf "  ok    %-22s %s\n" "$1" "$3"
    else printf "  FAIL  %-22s %s\n" "$1" "$3"; fi
  fi
}

TMP="$(mktemp -d 2>/dev/null || echo "${TMPDIR:-/tmp}/mcp-monitor.$$")"
mkdir -p "$TMP"
trap 'rm -rf "$TMP"' EXIT

# SSE framing: responses arrive as `data: {...}` lines. Take the last one.
rpc_payload() { grep -o '^data: .*' "$1" | tail -1 | sed 's/^data: //'; }

[ "$JSON" = "0" ] && printf "MCP monitor — %s\n\n" "$MCP_URL"

# ── M1. initialize ───────────────────────────────────────────────────────────
started=$(node -e 'process.stdout.write(String(Date.now()))')
SID=$(curl -s -D- -o "$TMP/init.txt" --max-time "$TIMEOUT" -X POST "$MCP_URL" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"mcp-monitor","version":"1"}}}' \
  | tr -d '\r' | grep -i '^mcp-session-id:' | cut -d' ' -f2)
elapsed=$(node -e "process.stdout.write(String(Date.now()-Number(process.argv[1])))" "$started")

if [ -z "$SID" ]; then
  record "initialize" "fail" "no mcp-session-id returned after ${elapsed}ms"
  # Everything downstream needs a session; stop here rather than emit noise.
  if [ "$JSON" = "1" ]; then
    printf '{"healthy":false,"failures":%d,"checks":[%s]}\n' "$FAILS" "$RESULTS"
  else
    printf "\nUNHEALTHY — %d check(s) failed\n" "$FAILS"
  fi
  exit 1
fi

server_desc=$(node -e '
  const fs = require("fs");
  const line = fs.readFileSync(process.argv[1], "utf8").split(/\r?\n/)
    .filter((l) => l.startsWith("data: ")).pop() ?? "";
  try {
    const info = JSON.parse(line.slice(6)).result?.serverInfo ?? {};
    process.stdout.write(`${info.name ?? "?"} v${info.version ?? "?"}`);
  } catch { process.stdout.write("unparseable"); }
' "$TMP/init.txt")
record "initialize" "ok" "$server_desc, ${elapsed}ms"

call() { # method params-json outfile
  curl -s --max-time "$TIMEOUT" -X POST "$MCP_URL" \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' \
    -H "mcp-session-id: $SID" \
    -d "{\"jsonrpc\":\"2.0\",\"id\":9,\"method\":\"$1\",\"params\":$2}" > "$3"
}

# ── M2. tools/list ───────────────────────────────────────────────────────────
call "tools/list" "{}" "$TMP/tools.txt"
rpc_payload "$TMP/tools.txt" > "$TMP/tools.json"
tool_count=$(node -e '
  try {
    const j = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    process.stdout.write(String((j.result?.tools ?? []).length));
  } catch { process.stdout.write("-1"); }
' "$TMP/tools.json")
if [ "$tool_count" -gt 0 ] 2>/dev/null; then
  record "tools/list" "ok" "$tool_count tools"
else
  record "tools/list" "fail" "returned no tools (parsed count: $tool_count)"
fi

# ── M3. resources/list ───────────────────────────────────────────────────────
call "resources/list" "{}" "$TMP/res.txt"
rpc_payload "$TMP/res.txt" > "$TMP/res.json"
res_count=$(node -e '
  try {
    const j = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    process.stdout.write(String((j.result?.resources ?? []).length));
  } catch { process.stdout.write("-1"); }
' "$TMP/res.json")
if [ "$res_count" -ge 0 ] 2>/dev/null; then
  record "resources/list" "ok" "$res_count resources"
else
  record "resources/list" "fail" "resources/list did not parse"
fi

# ── M4. Manifest parity — the check nothing else performs ────────────────────
# Every tool the published manifest advertises must actually be served.
if [ -z "$MANIFEST_URL" ]; then
  record "manifest-parity" "ok" "skipped (MANIFEST_URL empty)"
else
  curl -s --max-time "$TIMEOUT" "$MANIFEST_URL" -o "$TMP/manifest.json"
  parity=$(node -e '
    const fs = require("fs");
    let advertised = [];
    try {
      const m = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
      advertised = (m.tools ?? []).map((t) => t.name).filter(Boolean);
    } catch { process.stdout.write("ERR|manifest did not parse"); process.exit(0); }
    let served = [];
    try {
      const j = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
      served = (j.result?.tools ?? []).map((t) => t.name);
    } catch { process.stdout.write("ERR|tools/list did not parse"); process.exit(0); }
    if (advertised.length === 0) { process.stdout.write("OK|manifest advertises no tools"); process.exit(0); }
    const missing = advertised.filter((a) => !served.includes(a));
    if (missing.length === 0) {
      process.stdout.write(`OK|all ${advertised.length} advertised tools are served`);
    } else {
      process.stdout.write(
        `MISSING|${missing.length}/${advertised.length} advertised tools are NOT served: ${missing.join(", ")}`,
      );
    }
  ' "$TMP/manifest.json" "$TMP/tools.json")
  status="${parity%%|*}"; detail="${parity#*|}"
  if [ "$status" = "OK" ]; then record "manifest-parity" "ok" "$detail"
  else record "manifest-parity" "fail" "$detail"; fi
fi

# ── M5. A real tools/call ────────────────────────────────────────────────────
started=$(node -e 'process.stdout.write(String(Date.now()))')
call "tools/call" "{\"name\":\"$PROBE_TOOL\",\"arguments\":{}}" "$TMP/call.txt"
elapsed=$(node -e "process.stdout.write(String(Date.now()-Number(process.argv[1])))" "$started")
rpc_payload "$TMP/call.txt" > "$TMP/call.json"
callres=$(node -e '
  try {
    const j = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
    if (j.error) { process.stdout.write(`ERR|jsonrpc error: ${j.error.message ?? "unknown"}`); process.exit(0); }
    const r = j.result;
    if (!r) { process.stdout.write("ERR|no result field"); process.exit(0); }
    if (r.isError) { process.stdout.write(`ERR|tool reported isError: ${r.content?.[0]?.text ?? ""}`.slice(0, 160)); process.exit(0); }
    const text = r.content?.[0]?.text ?? "";
    if (!text) { process.stdout.write("ERR|empty content"); process.exit(0); }
    process.stdout.write(`OK|${text.length} chars returned`);
  } catch (e) { process.stdout.write(`ERR|${e.message}`); }
' "$TMP/call.json")
status="${callres%%|*}"; detail="${callres#*|}"
if [ "$status" = "OK" ]; then record "tools/call" "ok" "$PROBE_TOOL: $detail, ${elapsed}ms"
else record "tools/call" "fail" "$PROBE_TOOL: $detail"; fi

# ── M6. HTTP surface (HEAD must match GET) ───────────────────────────────────
ORIGIN=$(node -e 'process.stdout.write(new URL(process.argv[1]).origin)' "$MCP_URL")
for path in / /healthz; do
  g=$(curl -s -X GET  -o /dev/null -w '%{http_code}' --max-time "$TIMEOUT" "$ORIGIN$path")
  h=$(curl -s -I      -o /dev/null -w '%{http_code}' --max-time "$TIMEOUT" "$ORIGIN$path")
  if [ "$g" = "200" ] && [ "$h" = "200" ]; then
    record "http $path" "ok" "GET=$g HEAD=$h"
  else
    record "http $path" "fail" "GET=$g HEAD=$h (both should be 200)"
  fi
done

# ── Summary ──────────────────────────────────────────────────────────────────
if [ "$JSON" = "1" ]; then
  healthy=$([ "$FAILS" -eq 0 ] && echo true || echo false)
  printf '{"healthy":%s,"failures":%d,"checks":[%s]}\n' "$healthy" "$FAILS" "$RESULTS"
else
  if [ "$FAILS" -eq 0 ]; then printf "\nHEALTHY\n"
  else printf "\nUNHEALTHY — %d check(s) failed\n" "$FAILS"; fi
fi

[ "$FAILS" -eq 0 ] || exit 1

#!/usr/bin/env bash
#
# verify-mcp-ga4.sh — Smoke tests for HelloGrowth CRM MCP GA4 telemetry.
#
# Generates real traffic against the live MCP server (Streamable HTTP at /sse)
# so you can watch the analytics events land in GA4. Run this on a machine that
# can reach the endpoint, then open GA4 -> Reports -> Realtime (and
# Engagement -> Events) to confirm.
#
# Events exercised:
#   mcp_request                        (tests 1 & 2)
#   mcp_tool_call                      (test 2b)
#   mcp_error                          (test 3, bad request -> HTTP 400)
#
# PREREQUISITES (on the server / production env), otherwise nothing reaches GA4:
#   ENABLE_MCP_ANALYTICS=true
#   GA4_MEASUREMENT_ID=G-XXXXXXXXXX
#   GA4_API_SECRET=********
#
# Usage:
#   ./verify-mcp-ga4.sh                 # uses the production base URL below
#   BASE_URL=http://localhost:3008 ./verify-mcp-ga4.sh   # test locally
#
set -uo pipefail

BASE_URL="${BASE_URL:-https://mcp.hellogrowthcrm.com}"
MCP_URL="${BASE_URL}/sse"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
rule() { printf '%s\n' "------------------------------------------------------------"; }

bold "Base URL: ${BASE_URL}"
echo

# ---------------------------------------------------------------------------
# TEST 1 — Streamable HTTP initialize (captures the mcp-session-id header)
#   Expect in GA4: mcp_request (mcpMethod=initialize)
# ---------------------------------------------------------------------------
bold "TEST 1 — MCP initialize on /sse (capture session id)"
rule
INIT_HEADERS="$(mktemp)"
curl -sS -D "${INIT_HEADERS}" -o /dev/null "${MCP_URL}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "User-Agent: ChatGPT MCP Client" \
  -d '{
        "jsonrpc":"2.0","id":1,"method":"initialize",
        "params":{
          "protocolVersion":"2024-11-05",
          "capabilities":{},
          "clientInfo":{"name":"smoke-test","version":"1.0.0"}
        }
      }'
SESSION_ID="$(grep -i '^mcp-session-id:' "${INIT_HEADERS}" | awk '{print $2}' | tr -d '\r')"
rm -f "${INIT_HEADERS}"
echo "mcp-session-id: ${SESSION_ID:-<none returned>}"
echo

if [ -z "${SESSION_ID}" ]; then
  echo "WARNING: no session id returned; tools/list and tools/call below may 400."
  echo
fi

# ---------------------------------------------------------------------------
# TEST 2a — tools/list
#   Expect in GA4: mcp_request (mcpMethod=tools/list)
# ---------------------------------------------------------------------------
bold "TEST 2a — tools/list on /sse"
rule
curl -sS "${MCP_URL}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "User-Agent: ChatGPT MCP Client" \
  -H "mcp-session-id: ${SESSION_ID}" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  | head -c 800
echo; echo

# ---------------------------------------------------------------------------
# TEST 2b — tools/call (uses the "help" tool, which takes no required args)
#   Expect in GA4: mcp_request   (mcpMethod=tools/call)
#                  mcp_tool_call  (toolName=help)
#   NOTE: tool ARGUMENTS are never sent to GA4 by design.
# ---------------------------------------------------------------------------
bold "TEST 2b — tools/call on /sse (toolName=help)"
rule
curl -sS "${MCP_URL}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "User-Agent: ChatGPT MCP Client" \
  -H "mcp-session-id: ${SESSION_ID}" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"help","arguments":{}}}' \
  | head -c 800
echo; echo

# ---------------------------------------------------------------------------
# TEST 3 — Bad request (POST with no session id and a non-initialize method)
#   Server returns HTTP 400 -> Expect in GA4: mcp_request AND mcp_error
# ---------------------------------------------------------------------------
bold "TEST 3 — Bad request -> expect mcp_error (HTTP 400)"
rule
HTTP_CODE="$(curl -sS -o /dev/null -w '%{http_code}' "${MCP_URL}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "User-Agent: ChatGPT MCP Client" \
  -d '{"jsonrpc":"2.0","id":9,"method":"tools/list","params":{}}')"
echo "HTTP status: ${HTTP_CODE}  (expect 400 -> mcp_error fires)"
echo

rule
bold "Done. Now open GA4 within ~1-2 min:"
cat <<'NEXT'
  Reports -> Realtime           : event count by event name (last 30 min)
  Reports -> Engagement -> Events: mcp_* events once processed (up to ~24h for full reports)

  Per-event params to spot-check (click an event in Realtime):
    clientName / clientType, isBot, botName, country,
    transport, endpoint, mcpMethod, toolName
  Confirm ABSENT: raw IP, raw User-Agent, tool arguments, full URLs.

  DebugView note: these Measurement Protocol events are sent WITHOUT debug_mode,
  so they will NOT appear in DebugView unless the server adds debug_mode:true
  (or posts to /debug/mp/collect). Use Realtime + Events instead.
NEXT

# MCP / SSE GA4 Telemetry — Verification Report

**Endpoint:** `https://mcp.hellogrowthcrm.com` (SSE: `/sse` + `/message`; Streamable HTTP: `/mcp`)
**Date:** 2026-06-08
**Method:** Source-level verification of the telemetry implementation, plus a ready-to-run smoke-test script (`scripts/verify-mcp-ga4.sh`). The live GA4 portion must be run from a machine that can reach the endpoint — it was not executed here (the sandbox is network-restricted).

---

## Summary

All six events are correctly wired and privacy-safe at the code level. The implementation **guarantees** the privacy properties (checks 10–12) structurally — they are not dependent on configuration. The remaining checks (1–9) require live traffic plus GA4 access to confirm; the script generates exactly the traffic needed.

**Two preconditions before any event reaches GA4:**

1. The server's environment must have `ENABLE_MCP_ANALYTICS=true` **and** both `GA4_MEASUREMENT_ID` and `GA4_API_SECRET` set. The repo's checked-in `.env` does **not** set these, so a default local run sends nothing. Confirm production has them.
2. Events are sent via the GA4 Measurement Protocol **without** `debug_mode`. They appear in **Realtime** and **Events**, but **not in DebugView**. To use DebugView you'd add `debug_mode: true` (or post to `/debug/mp/collect`) in `src/lib/telemetry.ts`.

---

## Code evidence by event

| Event | Trigger (code) | Source |
|---|---|---|
| `mcp_sse_connection_open` | `GET /sse` → `trackSseConnectionOpen()` | `mcpSseAnalytics.ts` L111, `server.ts` L383 |
| `mcp_sse_connection_close` | stream `close` → `trackSseConnectionClose()`, with `connectionDurationMs` | `mcpSseAnalytics.ts` L147–160, `server.ts` L386–389 |
| `mcp_bot_visit` | inside open, only when `meta.isBot` | `mcpSseAnalytics.ts` L131–133 |
| `mcp_request` | every `/mcp` and `/message` POST, on `res.finish` | `mcpSseAnalytics.ts` L221, `server.ts` L362, L415 |
| `mcp_tool_call` | additionally when `mcpMethod === "tools/call"` | `mcpSseAnalytics.ts` L223–225 |
| `mcp_error` | additionally when `statusCode >= 400` | `mcpSseAnalytics.ts` L227–229 |

---

## The 12 confirmation checks

| # | Check | Status | Evidence / how to confirm live |
|---|---|---|---|
| 1 | `mcp_sse_connection_open` appears | Wired ✓ | Fires on `GET /sse`. Smoke test 1 & 2 → Realtime. |
| 2 | `mcp_sse_connection_close` appears after closing curl | Wired ✓ | Fires on `res` `close`; smoke test holds then drops the stream. Carries `connectionDurationMs`. |
| 3 | `mcp_bot_visit` for GPTBot | Wired ✓ | `GPTBot` matches a bot signature → `isBot=true` → event fires. "ChatGPT MCP Client" is an AI client (not a bot), so it correctly does **not** fire bot_visit. Smoke test 2. |
| 4 | `mcp_request` for MCP messages | Wired ✓ | Fires on every `/mcp` + `/message` POST. Smoke tests 3 & 4. |
| 5 | `mcp_tool_call` for `tools/call` | Wired ✓ | Fires when method is `tools/call`. Smoke test 4b (`toolName=help`). |
| 6 | `mcp_error` on a bad request | Wired ✓ | Fires when HTTP status ≥ 400. Smoke test 5 (no session id → 400). |
| 7 | Client label detected correctly | Guaranteed ✓ | `detectClient()` derives `clientName`/`clientType` (GPTBot→bot, ChatGPT→ai, browser UA→browser, etc.). Spot-check `clientName` in Realtime. |
| 8 | `connectionDurationMs` visible | Guaranteed ✓ | Computed as `Date.now() - startedAt` on close; sent on `mcp_sse_connection_close`. Open the close event in Realtime. |
| 9 | `country` visible if available | Wired ✓ | Read from the `cf-ipcountry` header (present when fronted by Cloudflare). GA4 also derives geo independently. |
| 10 | No raw IP visible | Guaranteed ✓ | IP is never added to telemetry params; `metaParams()` emits only derived fields. |
| 11 | No raw User-Agent visible | Guaranteed ✓ | Raw UA is consumed only inside `detectClient()` and never returned or sent; origin/referer reduced to host via `safeHost()`. |
| 12 | No request arguments visible | Guaranteed ✓ | `extractMcpInvocation()` reads only `method` and (for tools/call) `params.name`. Tool `arguments` are never read. |

"Guaranteed" = enforced by the code structure regardless of config. "Wired" = correct in code; needs live traffic + GA4 to observe the value.

---

## Parameters emitted per event (the full safe set)

`endpoint`, `http_method`, `transport`, `clientName`, `clientType`, `isBot`, `botName`, `originHost`, `refererHost`, `country`, `sessionId` — plus per-event: `totalConnections` (open), `connectionDurationMs` + `success` (close), `mcpMethod` + `toolName` + `statusCode` + `success` + `responseTimeMs` (request/tool_call/error).

`null`/`undefined` params are stripped before send (`track()` in `telemetry.ts`).

---

## How to run the live verification

1. Confirm the two preconditions above on the production server.
2. From a machine that can reach the endpoint:
   ```bash
   bash scripts/verify-mcp-ga4.sh
   ```
   (or `BASE_URL=http://localhost:3008 bash scripts/verify-mcp-ga4.sh` against a local server with analytics env set).
3. Within ~1–2 minutes, open **GA4 → Reports → Realtime** and watch the `mcp_*` event counts. Click an event to inspect its parameters and confirm checks 7–12.
4. Full **Engagement → Events** reports populate over the following hours.

If you later want DebugView to work, set `debug_mode: true` on the event params (or switch `GA4_ENDPOINT` to the `/debug/mp/collect` debug endpoint) in `src/lib/telemetry.ts`.

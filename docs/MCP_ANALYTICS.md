# MCP / SSE Traffic Analytics

Privacy-first usage analytics for the HelloGrowth CRM MCP server. It tracks how
clients and crawlers interact with the MCP endpoints — connections, requests,
tools, methods, errors, and timing — **without** ever capturing raw IPs,
User-Agents, request bodies, tool arguments, or any CRM data.

Telemetry is emitted to **GA4 via the Measurement Protocol**. It is **disabled
by default** — nothing is sent unless `ENABLE_MCP_ANALYTICS=true` **and** the
GA4 credentials are present. Otherwise the server runs exactly as before and
tracking silently no-ops.

- Sink: [`src/lib/telemetry.ts`](../src/lib/telemetry.ts)
- Client/bot detection: [`src/lib/clientDetection.ts`](../src/lib/clientDetection.ts)
- SSE/MCP hooks: [`src/middleware/mcpSseAnalytics.ts`](../src/middleware/mcpSseAnalytics.ts)
- Wiring: [`src/server.ts`](../src/server.ts)

---

## 1. What is tracked

Only **derived, low-cardinality, non-PII** metadata:

| Field | Source | Notes |
|-------|--------|-------|
| `endpoint` | request path | `/sse`, `/message`, or `/mcp` |
| `http_method` | request method | `GET` / `POST` / `DELETE` |
| `transport` | derived | `sse` or `streamable-http` |
| `clientName` | derived from UA | e.g. `ChatGPT`, `Claude`, `Cursor`, `Browser` |
| `clientType` | derived | `ai` / `browser` / `tool` / `bot` / `unknown` |
| `isBot` | derived | crawler vs. non-crawler |
| `botName` | derived | e.g. `GPTBot`, `Googlebot` (bots only) |
| `originHost` | `Origin` header | **host only** — no scheme/path/query |
| `refererHost` | `Referer` header | **host only** |
| `country` | `cf-ipcountry` header | 2-letter country code, if present |
| `sessionId` | MCP/SSE session id | opaque id the transport already assigns |
| `statusCode` | HTTP response | for message/tool requests |
| `success` | derived | `true` unless status ≥ 400 or stream errored |
| `responseTimeMs` | measured | request→response time (message/tool endpoints) |
| `connectionDurationMs` | measured | open→close time (SSE close) |
| `mcpMethod` | JSON-RPC `method` | e.g. `tools/list`, `tools/call` |
| `toolName` | `params.name` | **only** when method is `tools/call` |
| `totalConnections` | in-process counter | running total of SSE opens |

## 2. What is **not** tracked

Never captured, never sent:

- Raw IP address (`x-forwarded-for`, `remoteAddress`)
- Raw `User-Agent` string (read only to derive a label, then discarded)
- Full `Referer` / `Origin` URLs (reduced to host only)
- `Authorization` / auth headers
- Cookies
- Request bodies
- **Tool arguments** (`params.arguments` is never read)
- Any customer / company / contact / lead / CRM data

These guarantees are enforced in code (the raw UA never leaves
`detectClient`, and `extractMcpInvocation` reads only `method` and
`params.name`) and asserted by tests in
[`src/middleware/__tests__/mcpSseAnalytics.test.ts`](../src/middleware/__tests__/mcpSseAnalytics.test.ts).

## 3. SSE-specific tracking

This endpoint uses the **SSE transport** (`GET /sse` to open the event stream,
`POST /message?sessionId=…` to send MCP messages). It is *not* a single
`POST /mcp` endpoint, so tracking is split accordingly:

- **`GET /sse`** — opens a long-lived stream. On open we emit
  `mcp_sse_connection_open` (and `mcp_bot_visit` for crawlers). The connection
  start time is recorded; when the response `close`s we emit
  `mcp_sse_connection_close` with `connectionDurationMs`.
- **`POST /message`** — the separate message route. The body is parsed once,
  fed to the transport (no double stream read), and used only to derive
  `mcpMethod` / `toolName`. On response `finish` we emit `mcp_request`
  (+ `mcp_tool_call`, + `mcp_error`) with `statusCode` and `responseTimeMs`.

The modern `/mcp` Streamable HTTP endpoint is instrumented the same way for
message-level events (`transport: "streamable-http"`).

Connection/stream behaviour is untouched: tracking runs on `finish`/`close`
events and is wrapped in `try/catch`, so it can neither delay nor break the
stream.

## 4. Event names

| Event | When |
|-------|------|
| `mcp_sse_connection_open` | a client connects to `/sse` |
| `mcp_sse_connection_close` | the SSE stream closes (includes duration) |
| `mcp_request` | any MCP message/request completes |
| `mcp_tool_call` | the message method is `tools/call` |
| `mcp_bot_visit` | a detected crawler connects |
| `mcp_error` | response status ≥ 400 (or handler error) |

## 5. Client / bot detection logic

[`src/lib/clientDetection.ts`](../src/lib/clientDetection.ts) classifies the
raw User-Agent into a safe label. Detection order: **bots first**, then AI
clients, then tools, then the browser heuristic, else `Unknown`.

**AI clients** → `clientType: "ai"`: ChatGPT/OpenAI, Claude/Anthropic, Cursor,
Perplexity, Gemini/Google, Copilot/GitHub.
**Tools** → `clientType: "tool"`: Postman.
**Browser** → `clientType: "browser"`: standard `Mozilla/… (Chrome|Safari|Firefox|Edg)` UAs.

**Bots** → `isBot: true`, `clientType: "bot"`:
`GPTBot`, `OAI-SearchBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`,
`Googlebot`, `CCBot`, `Bytespider`, `Bingbot`, `Applebot`, `Amazonbot`,
`AhrefsBot`, `SemrushBot`.

Because bots are checked first, ambiguous tokens resolve correctly — e.g.
`Google-Extended` is a **bot**, not the Gemini client, and `ClaudeBot` is a
**bot**, not the Claude client.

> The richer governance/risk engine in `src/core/bot-detector.ts` is unchanged;
> this helper is a separate, analytics-scoped labeller.

## 6. The `track(eventName, payload)` function

[`src/lib/telemetry.ts`](../src/lib/telemetry.ts) exposes a single entry point:

```ts
track(eventName: string, payload?: Record<string, unknown>): void
```

Behaviour (all enforced, in order):

1. **Disabled by default** — if `ENABLE_MCP_ANALYTICS` is not exactly `"true"`,
   it returns immediately. No network call.
2. **Missing GA4 env** — if `GA4_MEASUREMENT_ID` or `GA4_API_SECRET` is absent,
   it returns immediately.
3. Otherwise it POSTs one event to the GA4 Measurement Protocol.
4. **Fire-and-forget** — the `fetch` is never `await`ed (AbortController timeout
   + `.catch`), so it cannot delay an SSE connection or MCP response.
5. **Never throws** — the whole body is `try/catch`-wrapped; a failing sink,
   bad env, or network error is swallowed and (at most) debug-logged.
6. `undefined`/`null` payload values are stripped before sending.

The GA4 `client_id` reuses `payload.sessionId` when present (so events group per
MCP session) or a random UUID otherwise.

## 7. Privacy notes

- The raw UA is consumed inside `detectClient` and **never** returned or stored.
- `safeHost()` reduces any Origin/Referer to its hostname (no scheme, port,
  path, or query).
- `track()` strips `undefined`/`null` params before sending.
- GA4's `client_id` reuses the opaque MCP `sessionId` when available (so events
  group per session) or a random UUID otherwise — no IP-based identity.
- Analytics is **best-effort**: every hook is `try/catch`-wrapped and the sink
  is fire-and-forget. A telemetry failure can never break an MCP/SSE response.

## 8. Testing commands

Automated (Vitest):

```bash
npm test                                   # full suite
npx vitest run src/lib/__tests__/clientDetection.test.ts
npx vitest run src/middleware/__tests__/mcpSseAnalytics.test.ts
npx vitest run src/lib/__tests__/telemetry.test.ts
```

Manual (run the server with GA4 debug enabled, then exercise the endpoints):

```bash
# Start the HTTP server (default port 3008)
TRANSPORT=http \
ENABLE_MCP_ANALYTICS=true \
GA4_MEASUREMENT_ID=G-XXXXXXX \
GA4_API_SECRET=your_secret \
GA4_ENDPOINT=https://www.google-analytics.com/debug/mp/collect \
LOG_LEVEL=debug \
npm run dev

# 1. Open an SSE connection (emits mcp_sse_connection_open; Ctrl-C closes it)
curl -N http://localhost:3008/sse

# 2. Streamable HTTP — initialize, then list tools (emits mcp_request)
curl -i http://localhost:3008/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"curl","version":"1"}}}'

# 3. tools/list and tools/call (emits mcp_request / mcp_tool_call). Reuse the
#    mcp-session-id returned by the initialize response:
curl -i http://localhost:3008/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: <SESSION_ID_FROM_STEP_2>" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# Simulate a crawler (emits mcp_bot_visit on /sse)
curl -N -A "Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)" \
  http://localhost:3008/sse
```

## 9. GA4 verification steps

1. In GA4: **Admin → Data Streams →** your stream → copy the **Measurement ID**
   (`G-…`) and create a **Measurement Protocol API secret**.
2. Set `GA4_MEASUREMENT_ID` and `GA4_API_SECRET` in the server environment.
3. **Validate payloads:** point `GA4_ENDPOINT` at the debug endpoint
   (`https://www.google-analytics.com/debug/mp/collect`) and run the manual
   curls above with `LOG_LEVEL=debug`. The debug endpoint returns
   `validationMessages` — an empty array means the event is valid.
4. **Live view:** with the production endpoint configured, open
   **GA4 → Reports → Realtime** (or **Admin → DebugView**) and watch
   `mcp_sse_connection_open`, `mcp_request`, `mcp_tool_call`, etc. appear.
5. Build exploration reports keyed on `clientName`, `clientType`, `isBot`,
   `botName`, `mcpMethod`, and `toolName` to see usage breakdowns.

> Note: GA4 caps event names at 40 chars and custom params per event; all event
> names and params here are within limits.

## 10. Deployment checklist

- [ ] `ENABLE_MCP_ANALYTICS=true` set in the deployment env (omit / leave unset
      to keep analytics off).
- [ ] `GA4_MEASUREMENT_ID` and `GA4_API_SECRET` set in the deployment env
      (e.g. container/Cloud Run secrets) — **never** commit them.
- [ ] Validated events against the GA4 **debug** endpoint before go-live.
- [ ] Confirmed events appear in **Realtime / DebugView**.
- [ ] `npm run typecheck` and `npm test` pass.
- [ ] Verified SSE streams still open/close normally with tracking enabled.
- [ ] Reverse proxy / CDN forwards `cf-ipcountry` (Cloudflare) if country
      breakdowns are wanted — otherwise that field is simply omitted.
- [ ] Reviewed that no raw IP/UA/body/arguments reach GA4 (see §2).

---

### Configuration reference

| Variable | Default | Purpose |
|----------|---------|---------|
| `ENABLE_MCP_ANALYTICS` | `false` | Master switch — must be `true` to send anything. |
| `GA4_MEASUREMENT_ID` | — | GA4 stream measurement id (`G-…`). Required to send. |
| `GA4_API_SECRET` | — | Measurement Protocol API secret. Required to send. |
| `GA4_ENDPOINT` | `https://www.google-analytics.com/mp/collect` | Override (use `/debug/mp/collect` to validate). |
| `GA4_TIMEOUT_MS` | `3000` | Abort a telemetry send after N ms. |
| `GA4_DEBUG_MODE` | `false` | `true` adds `debug_mode` to every event so the run appears in GA4 **DebugView**. |

### On DebugView and the "is it even on?" problem

Two things previously made a *working* integration look dead:

1. **DebugView stayed empty.** The Measurement Protocol only surfaces events in
   DebugView when the event carries `debug_mode`. Events were landing in
   Realtime/Events the whole time, but the first place anyone looks showed
   nothing. Set `GA4_DEBUG_MODE=true` while verifying, then unset it.
2. **A misconfigured server was silent.** If `ENABLE_MCP_ANALYTICS=true` but
   `GA4_MEASUREMENT_ID` or `GA4_API_SECRET` was missing, every event was dropped
   and the only trace was a `debug`-level log — invisible at the default
   `LOG_LEVEL=info`. That is now a **`warn`**, emitted once per process:

   ```
   WARN ENABLE_MCP_ANALYTICS=true but GA4 is not configured — all telemetry is being dropped
        {"hasMeasurementId":false,"hasApiSecret":true}
   ```

   It logs once, not per event, so a busy server cannot flood the log.

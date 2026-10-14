# Plan: harden the HTTP transport (Host/Origin, body cap, session cap, generic errors)

**Severity:** P1 · **Effort:** M · **Server:** website MCP, `origin/main` 7312627

## Finding (all in `src/server.ts`)
- **No Host or Origin validation.** `StreamableHTTPServerTransport` is created with only `sessionIdGenerator` and `onsessioninitialized` (`:516-519`). DNS-rebinding protection is off, so a browser page on any origin can drive a locally run instance.
- **Unbounded body.** `readJsonBody` (`:414-423`) concatenates chunks into a string with no limit. A single large POST to `/sse` costs memory before the rate limiter has any effect, because the limiter counts requests, not bytes.
- **Unbounded sessions.**
  - `httpTransports` (`:426`) is a `Map` with no size cap and no idle expiry. Sessions are removed only on `onclose`.
  - Every `initialize` creates a new `Server` and transport. Rate limiting allows 60 a minute per IP, so a distributed caller can grow memory without bound.
- **Internal error text leaks.**
  - `tools/call` catch returns `Internal error in <tool>: ${err.message}` (`:150`).
  - Resource reads return `Error fetching resource: ${e.message}` (`:256`), which can carry Supabase or Postgres messages.
- The rate limiter (`:365-410`, keyed by `resolveClientIp`) stays as it is.

Measured: `audit-live-mcp.mjs` against a local main build gives 0 fail · 4 warn · 14 pass. Its `privacy` check ("error responses do not echo caller arguments") passes, but it does not exercise handler exceptions. I did not run load or large-body tests.

## Proposed fix
1. **Host/Origin allowlist.**
   - Env `MCP_ALLOWED_HOSTS`: defaults `localhost,127.0.0.1,[::1],mcp.hellogrowthcrm.com`, with ports allowed.
   - Env `MCP_ALLOWED_ORIGINS`: defaults to the http(s) localhost origins plus `https://mcp.hellogrowthcrm.com`. The value `*` disables the Origin check.
   - Pass both to the transport through `allowedHosts`, `allowedOrigins` and `enableDnsRebindingProtection: true` (SDK 1.29 supports these). Also run a cheap pre-check in `handleStreamableHttp`, so a rejection never builds a server. The rejection is 403 JSON-RPC `{code:-32000,"Forbidden"}`.
   - Requests with no `Origin` header (server-side MCP clients) pass the Origin check.
2. **Body cap.** `MCP_MAX_BODY_BYTES` (default 1 MB). Count bytes in `readJsonBody`. Past the cap, destroy the request and reply `413`. Also reject a declared `Content-Length` above the cap up front.
3. **Session cap and idle timeout.**
   - `MCP_MAX_SESSIONS` (default 1000) and `MCP_SESSION_IDLE_MS` (default 30 min).
   - Track `lastSeen` per session and sweep every minute with `transport.close()`, using an unref'd timer.
   - At the cap, evict the least-recently-used session. If that is not possible, return `503` with `Retry-After`.
4. **Generic errors.** Keep logging the full error server-side through `logger.error`. Return to the caller:
   - `Internal error in <tool>. The error was logged.`
   - `Error fetching resource.`
   - Optionally include a short random error id that appears in both the log and the reply.

## Tests to add
Extract the HTTP handler into `createHttpHandler(opts)` so it can be tested in-process.
- A `Host: evil.example` request → 403.
- `Origin: https://evil.example` → 403.
- No `Origin` → 200.
- A 2 MB body → 413.
- Opening `MAX_SESSIONS+1` sessions evicts the oldest.
- An idle sweep closes a stale session.
- A tool that throws `new Error("relation \"secret\" ...")` → the reply text does not contain `secret`.
- The audit script stays at 0 fail.

## Risks / rollout
- **Conflicts with open PR #32 (CORS `*` for browser clients).** A strict Origin allowlist blocks browser-based MCP clients hosted elsewhere. The founder should decide between:
  - keeping the Origin check strict (the localhost/own-host defaults, with partners added through the env), or
  - shipping with `MCP_ALLOWED_ORIGINS=*` in production and relying on the Host check alone for rebinding protection.
- Host values behind Cloudflare and Apache must include `mcp.hellogrowthcrm.com`. Verify that Apache preserves `Host` (`ProxyPreserveHost On`) before rollout, or the server will reject everything.
- The session cap applies per process. That is acceptable.

## Not checked
- The live Apache and Cloudflare header behaviour.
- Production session counts.

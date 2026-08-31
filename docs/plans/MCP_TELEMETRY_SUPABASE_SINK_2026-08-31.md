# Persist MCP traffic to Supabase — plan

**Status:** NOT STARTED. Plan only, no code in this PR.
**Date:** 2026-08-31 · **Against:** `main` @ `236e5a0`, server v1.1.0 (88 tools, 9 resources)
**Related:** hellocrm plan PR #4897 (`.plans/mcp-telemetry-sa-growth-hub-2026-08-18.md`) — this is the
website-MCP half of it, the piece that plan lists as *PR5, not built yet*.

---

## 1. What already exists — do not rebuild any of it

The instinct on hearing *"we need a backend to track MCP bot traffic"* is to build a collector. **Most
of it is already merged into this repository and switched off.** Verified by reading the code on
2026-08-31, not from the changelog:

| Piece | Where | State |
|---|---|---|
| Event emission (6 event types) | `src/middleware/mcpSseAnalytics.ts` | **merged** |
| Safe-metadata derivation, no PII | `buildSafeMeta` (11 fields) + `trackMcpMessage` (5 more) | **merged** |
| JSON-RPC method / tool-name extraction | `extractMcpInvocation` | **merged** |
| Client + bot classification | `src/lib/clientDetection.ts` | **merged** |
| Pluggable sink | `src/lib/telemetry.ts` → `setTelemetrySink()` | **merged** |
| GA4 Measurement Protocol sink | `src/lib/telemetry.ts` → `ga4Sink` | **merged** |
| Master switch | `ENABLE_MCP_ANALYTICS` | **unset in production — every event is dropped** |
| Privacy contract + field table | `docs/MCP_ANALYTICS.md` | **written** |
| Somewhere durable to query it from | — | **this is the only missing piece** |

Events emitted today: `mcp_sse_connection_open`, `mcp_sse_connection_close`, `mcp_request`,
`mcp_tool_call`, `mcp_bot_visit`, `mcp_error`.

**So the work is not "build telemetry". It is "give the telemetry a destination we can run SQL
against, without turning the existing one off."**

---

## 2. The decision (O1)

| Option | Cost | Verdict |
|---|---|---|
| **A — GA4 only** | Two env vars, zero code | Gets you counts today, but GA4 cannot be joined, is sampled, and is not "our backend". Do this **now** regardless; it is free. |
| **B — Supabase sink alongside GA4** | ~1 file + 1 migration | **Recommended.** Queryable, joinable, dashboardable, in the website's own Postgres. |
| **C — reuse the CRM's `mcp_invocations`** | — | **Wrong table.** That is tenant-scoped, for the API-key-authenticated CRM MCP (`hellocrm/supabase/functions/crm-mcp-server`). This server is anonymous and has no tenant. Conflating the two servers is the single most common error in specs that arrive about "our MCP". |

Recommendation: **A immediately, then B.** They are not alternatives — B is a second sink, not a
replacement.

---

## 3. Design

### 3.1 Compose the sinks — do not replace

⚠️ **`setTelemetrySink()` replaces `currentSink` outright, and `resetTelemetrySink()` restores GA4.**
Calling `setTelemetrySink(supabaseSink)` therefore **silently switches GA4 off**, and nothing in the
codebase would report that. The fix is a fan-out:

```ts
// src/lib/telemetry-sinks.ts (new)
export function fanOut(...sinks: TelemetrySink[]): TelemetrySink {
  return (event) => {
    for (const sink of sinks) {
      try { sink(event); } catch { /* one sink must never starve another */ }
    }
  };
}
```

Wired once at startup, gated on its own flag so each destination can be switched independently:

```
ENABLE_MCP_ANALYTICS=true        # see the warning below — NOT currently a master switch
GA4_MEASUREMENT_ID / GA4_API_SECRET
MCP_ANALYTICS_SUPABASE=true      # new — adds the Supabase sink to the fan-out
```

⚠️ **`ENABLE_MCP_ANALYTICS` is not actually a master switch, and PR 2 must make it one first.**
`track()` (`src/lib/telemetry.ts:191-214`) calls `currentSink(...)` unconditionally at `:202`; the
flag is checked in `analyticsEnabled()` at `:65-84`, which is called **only from `ga4Sink`** at
`:105`. So `fanOut(ga4Sink, supabaseSink)` as written would write **every event to Postgres with
`ENABLE_MCP_ANALYTICS` unset** — inverting the "disabled by default" contract stated in
`docs/MCP_ANALYTICS.md:8-11`.

It also invalidates rollout step 4 below: shipping with `MCP_ANALYTICS_SUPABASE` unset would prove
the change is inert only if the master switch were what made it inert, and it is not.

**Fix, one line, and it makes this document's claim true:** move the `analyticsEnabled()` gate into
`track()`, ahead of the sink call. Add a test that no sink is invoked with the flag unset.

A test must assert that enabling the Supabase sink leaves the GA4 sink receiving events.

### 3.2 The sink itself

`track()` is documented as *"guaranteed non-throwing and non-blocking"*. The Supabase sink must keep
that promise:

- **Buffer in memory, flush on a timer** (~5 s) or at N rows (~50), whichever first. One insert per
  tool call would put a network round-trip in the request path.
- **Flush on `SIGTERM`** — otherwise every deploy loses the tail of the buffer.
- **Cap the buffer** (~1,000 rows) and drop oldest on overflow. Telemetry must never be the thing
  that OOMs the server.
- **Stamp `instance_id` and accept bounded loss.** Append-only inserts need no cross-instance
  coordination, so buffering is safe with N processes — but "flush on `SIGTERM`" is not
  losslessness: SIGKILL, OOM and platform eviction all skip it, so a deploy can drop up to N × the
  flush interval. That is the right trade for telemetry; it should be stated rather than implied.
- **Never throw, never await in `track()`.** Log at `warn` once on repeated failure — the same
  once-only-warn pattern `telemetry.ts` already uses for a missing `GA4_API_SECRET`, added because a
  silent drop at `debug` level meant the operator had no signal at all.

### 3.3 Table

Columns come **directly from the 16 fields already documented in `docs/MCP_ANALYTICS.md` §1** — no new
data is collected, so no new privacy review is needed:

```sql
create table public.mcp_traffic_events (
  id             bigint generated always as identity primary key,
  occurred_at    timestamptz not null default now(),
  event_name     text not null,          -- mcp_tool_call | mcp_sse_connection_open | …
  endpoint       text,                   -- '/sse'
  http_method    text,
  transport      text,                   -- 'streamable-http'
  client_name    text,                   -- 'Claude' | 'ChatGPT' | 'Cursor' | 'Browser'
  client_type    text,                   -- ai | browser | tool | bot | unknown
  is_bot         boolean,
  bot_name       text,                   -- 'GPTBot' | 'Googlebot' | …
  origin_host    text,                   -- host only, never a full URL
  referer_host   text,                   -- host only
  country        text,                   -- cf-ipcountry, 2 letters
  session_id     text,                   -- opaque transport id
  mcp_method     text,                   -- 'tools/list' | 'tools/call'
  tool_name      text,                   -- only when method = tools/call
  status_code    int,
  success        boolean,
  response_ms    int,
  connection_duration_ms int,  -- mcp_sse_connection_close only (mcpSseAnalytics.ts:155)
  total_connections      int,  -- mcp_sse_connection_open only  (mcpSseAnalytics.ts:128)
  instance_id    text,         -- which process wrote the row; see the multi-instance note below
  server_version text                    -- so a behaviour change is attributable to a release
);

create index on public.mcp_traffic_events (occurred_at desc);
create index on public.mcp_traffic_events (tool_name, occurred_at desc) where tool_name is not null;
create index on public.mcp_traffic_events (is_bot, occurred_at desc);
```

`server_version` and `instance_id` are the only fields not already emitted; add both in the sink.

`connection_duration_ms` and `total_connections` are the payloads that two of the six events
already carry and that an earlier draft of this table dropped. Connection duration is the single
most useful field for the stated goal — how long AI clients actually stay attached — so losing it
would have quietly defeated the purpose.

**RLS:** `ENABLE` + `FORCE ROW LEVEL SECURITY`, `REVOKE ALL` from `anon` and `authenticated`,
service-role writes only, no SELECT policy for public roles. This table sits in the *website's*
Postgres, which serves anonymous PostgREST traffic; anon-readable rows would publish the
organisation's full crawler and AI-client traffic profile to anyone who guesses the table name.

**Nothing else is added, ever.** Tool *arguments* are deliberately never read — that guarantee is
enforced in `extractMcpInvocation` and asserted by
`src/middleware/__tests__/mcpSseAnalytics.test.ts`. Any future request to "mine what people ask the
MCP" is a **privacy-contract reversal decision for the owner**, not an implementation ticket.

### 3.4 Retention

**Raw rows: 30–90 day rolling delete via `pg_cron`. Rollups: kept indefinitely.**

A flat 30-day delete cannot answer the question this table exists for. "Which AI clients use the
server" is an adoption-trend question measured in quarters, and a rolling delete guarantees the
answer is gone the first time anyone asks whether Claude traffic is up since Q2. So roll up nightly
into `(date, client_name, client_type, is_bot, bot_name, tool_name, calls, p50_ms)` — small, cheap,
and the table that actually answers the question — and let only the raw rows expire.

⚠️ Under `FORCE ROW LEVEL SECURITY` **even the table owner is policy-bound**, so a `pg_cron` purge with
no DELETE policy deletes zero rows and reports success. The purge must be `SECURITY DEFINER` owned by
a `BYPASSRLS` role. This has bitten this codebase before.

---

## 4. Cross-repo split

**This repository holds no migrations** (`find . -name '*.sql'` → none). The server writes to the
website's Supabase through `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, the same client the blog,
help, newsletter and forms tools already use.

So this lands as **two PRs in two repos**, in this order:

1. **`hellocrmwebsite`** — the migration (`supabase/migrations/`, 64 existing), RLS, indexes, purge
   function + `pg_cron` schedule. Merge and apply **first**; the sink writing to a table that does not
   exist would fail on every flush.
2. **`HelloGrowthCRMwebsite_MCP`** (this repo) — `fanOut`, the Supabase sink, the
   `MCP_ANALYTICS_SUPABASE` flag, `server_version` in the payload, tests, and a `docs/MCP_ANALYTICS.md`
   update naming the second destination.

Do **not** put this behind a new Supabase Edge Function. The CRM project is at the function cap with
one slot left, and this needs none — it is an in-process insert from a server that already holds a
service-role client.

---

## 5. Rollout

1. Set `ENABLE_MCP_ANALYTICS=true` + GA4 credentials. **Do this first, independently of everything
   below** — it costs two env vars and starts producing data today.
2. Watch the once-only `warn` line: `ENABLE_MCP_ANALYTICS=true but GA4 is not configured` means every
   event is still being dropped.
3. Ship PR 1 (migration), verify the table exists in the website project.
4. Ship PR 2 (sink) with `MCP_ANALYTICS_SUPABASE` **unset** — proves the fan-out change is inert.
5. Flip `MCP_ANALYTICS_SUPABASE=true`, confirm rows appear and **GA4 is still receiving**.
6. Confirm the `pg_cron` purge actually deletes rows — count before and after, do not trust its exit
   status.

---

## 6. Traps — all verified, not theoretical

- **`setTelemetrySink` replaces rather than composes** (§3.1). Highest-risk item here: the naive
  implementation ships a silent regression in the *working* telemetry.
- **JSON-RPC errors return HTTP 200 — and this server currently gets that wrong.**
  `src/middleware/mcpSseAnalytics.ts:210` reads `const success = opts.statusCode < 400`, and
  `docs/MCP_ANALYTICS.md:38` documents the same status-derived rule. So every failed tool call is
  already recorded as a success, and `mcp_error` never fires for a JSON-RPC error or an `isError`
  tool result. **Fixing that derivation is part of PR 2, not an assumption PR 2 can lean on** — an
  implementer who reuses the existing line ships a `success` column that is decorative from day one.
  Derive it from the JSON-RPC body: an error response, or a result with `isError: true`, is a
  failure regardless of the 200.
- **`FORCE ROW LEVEL SECURITY` + `pg_cron` purge** deletes zero rows and reports success (§3.4).
- **Never turn a free-text error into an error code.** Lowercasing and stripping punctuation passes a
  `^[a-z0-9_.-]{1,64}$` regex while carrying the PII intact:
  `"Lead Ravi Kumar +919876543210 not found"` → `lead_ravi_kumar_919876543210_not_found`. Accept a
  string only if it is *already* code-shaped; drop prose, never convert it. `event_name` and
  `tool_name` are closed vocabularies and are safe; a future `error_message` column would not be.
- **The Dockerfile copies `package.json`, `tsconfig.json`, `src` and `samples` — nothing else.** Any
  file this feature needs at runtime must be inside `src/`, or it works locally and 404s in
  production.
- **`robots.txt` is per-origin.** `hellogrowthcrm.com/robots.txt` cannot govern `mcp.hellogrowthcrm.com`
  and never has. Bot policy for this host is this host's problem.

---

## 7. What this deliberately does not do

- **No tool arguments, no request bodies, no raw IP or User-Agent.** Unchanged from the existing
  contract.
- **No lead capture.** Several external audits proposed a `capture_inbound_lead` tool on this server.
  That is an unauthenticated write endpoint on a public host and a separate product decision with its
  own spam-control design — it is not telemetry and must not be smuggled in under this plan.
- **No dashboard.** Rows first. A Super Admin surface is PR4 of plan #4897 and belongs with the CRM
  side, so the two servers are read together rather than in two disconnected places.

---

## 8. Gates

- [ ] O1 decided (§2) — GA4-only, Supabase, or both.
- [ ] Migration applied to the website Supabase project **before** the sink ships.
- [ ] `ENABLE_MCP_ANALYTICS` gates `track()` itself, not just `ga4Sink` — with a test that an unset
      flag invokes no sink at all.
- [ ] `success` is derived from the JSON-RPC body, not `statusCode < 400` — with a test that a
      JSON-RPC error and an `isError: true` tool result both record as failures.
- [ ] Test: enabling the Supabase sink leaves GA4 receiving events.
- [ ] Test: the sink never throws and never blocks, including when Supabase is unreachable.
- [ ] Test: a buffer at capacity drops rows instead of growing without bound.
- [ ] Purge verified by row count, not by exit status.
- [ ] `npx tsc --noEmit` and `npx vitest run` clean (235 tests on `main` today).
- [ ] `docs/MCP_ANALYTICS.md` updated — it currently states GA4 is the sink, and that would become
      untrue the moment this ships.

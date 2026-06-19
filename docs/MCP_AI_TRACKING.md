# MCP AI-Name Tracking

Tracks **which AI / client** (ChatGPT, Claude, Gemini, Cursor, Windsurf, Perplexity, Internal AI, or *Unknown / Invalid Client*) accesses website data through the MCP server, and records an audit trail of every website tool call.

Identity is proven by an **API key (or OAuth client id)** — never by user-agent, which is trivially spoofed. The plaintext key is only ever hashed (SHA-256); the database stores the hash.

## Files

| File | Purpose |
| --- | --- |
| `supabase/migrations/0001_mcp_tracking.sql` | Tables, indexes, RLS, trigger |
| `supabase/seed/mcp_clients_seed.sql` | Manual seed (placeholder hashes) |
| `scripts/seed-mcp-clients.ts` | Generates real keys, prints once, stores hash |
| `src/lib/mcpTracking.ts` | Core helpers (hash, identify, audit, permission, SSRF) |
| `src/lib/mcpRateLimiter.ts` | In-memory per-client_id rate limiter |
| `src/middleware/mcpClientAuth.ts` | Auth + rate-limit front door |
| `src/tools/tracked-website-tools.ts` | Example tools with full tracking flow |
| `src/admin/mcpAdmin.ts` | Create/list/activate/deactivate/block + audit viewer |
| `docs/mcp-dashboard-queries.sql` | Reporting queries + a daily-activity view |

## Setup

1. **Apply the migration** (Supabase SQL editor, or psql):

   ```bash
   psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_mcp_tracking.sql
   ```

2. **Seed clients** (generates keys, shows each ONCE):

   ```bash
   npx tsx scripts/seed-mcp-clients.ts
   ```

   Requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env` (already present in this repo's `.env.example`).

3. **Give each client its key.** Clients send it as either header:

   ```
   x-mcp-api-key: mcp_live_xxxxxxxx
   Authorization: Bearer mcp_live_xxxxxxxx
   ```

## Per-call flow

Each website tool call runs:

1. **Identify** the client by API key → `mcp_clients` (reject if unknown or status ≠ `active`).
2. **Rate limit** per `client_id` (`rate_limit_per_minute`).
3. **Check tool permission** (`allowed_tools`; empty = all).
4. **Check domain** (`allowed_domains`, matched by **hostname**, not substring).
5. **Block private/internal URLs** (SSRF: localhost, `127.0.0.1`, `0.0.0.0`, `::1`, private ranges, `169.254.169.254`, `.internal`/`.local`).
6. **Execute** the tool.
7. **Audit** success (URL + summaries only — never full page content).

Auth/permission/SSRF/rate-limit rejections are written as `denied` rows, so invalid clients appear in the dashboard.

## Wiring a tool into your transport

Tool handlers need the request headers to read the API key. Pass the live request through:

```ts
import { getWebsitePage } from "./tools/tracked-website-tools.js";

// `req` is your Node IncomingMessage (or anything with `.headers`).
const result = await getWebsitePage(req, { url: "https://hellobooks.ai/pricing" });

if (!result.ok) {
  // result.code → map to HTTP: no_api_key/unknown_client → 401,
  // blocked_client/tool_not_allowed/domain_not_allowed/private_url_blocked → 403,
  // rate_limited → 429
  return sendError(result.code, result.error);
}
return sendJson(result.data);
```

To add tracking to an existing tool, wrap its body in `runTrackedTool({ req, toolName, args, resourceUrlOf, execute })` from `tracked-website-tools.ts`.

## Admin API examples

```ts
import {
  createMcpClient, listMcpClients, blockMcpClient,
  activateMcpClient, deactivateMcpClient, rotateApiKey,
  updateMcpClientPolicy, viewAuditLogs, getDailyActivitySummary,
} from "../src/admin/mcpAdmin.js";

// Create a client — returns the plaintext key ONCE.
const { apiKey } = await createMcpClient({
  aiName: "ChatGPT",
  rateLimitPerMinute: 60,
  allowedTools: ["getWebsitePage", "searchWebsite", "getWebsiteSitemap", "getWebsiteContent"],
  allowedDomains: ["hellobooks.ai", "hellogrowthcrm.com"],
});
console.log("Store this now:", apiKey);

// List (never returns the hash).
await listMcpClients();

// Status changes.
await blockMcpClient("client_chatgpt");
await deactivateMcpClient("client_cursor");
await activateMcpClient("client_cursor");

// Rotate a compromised key.
const newKey = await rotateApiKey("client_claude");

// Adjust policy.
await updateMcpClientPolicy("client_internal_ai", { rateLimitPerMinute: 500 });

// View audit logs with filters.
await viewAuditLogs({
  aiName: "ChatGPT",
  status: "success",
  from: "2026-06-19T00:00:00Z",
  to: "2026-06-19T23:59:59Z",
  limit: 100,
});

// Dashboard summary cards.
await getDailyActivitySummary(); // [{ ai_name, total_calls, pages_accessed, denied }]
```

## Dashboard reports

`docs/mcp-dashboard-queries.sql` answers, e.g.:

- *ChatGPT accessed 120 website pages today* — `success` page-tool calls grouped by `ai_name`.
- *Cursor used 8 tools today* — all `success` calls grouped by `ai_name`.
- *Invalid clients blocked 3 times* — `denied` rows (broken down by `metadata->>'reason'`).

It also creates a `mcp_daily_activity` view for the summary cards.

## Security notes

- **Service role only.** Both tables have RLS on with a `service_role`-only policy; `anon`/`authenticated` get nothing. Never query them with the anon key.
- **Keys are hashed.** Only SHA-256 hashes are stored. Lost a plaintext key → rotate, don't recover.
- **Hostname matching**, not `includes()`. `https://evil.com?redirect=hellobooks.ai` does **not** match `hellobooks.ai`.
- **SSRF is literal-host based.** For defence-in-depth against DNS rebinding, also pin DNS at fetch time so a public hostname can't resolve to a private IP. The example fetch uses `redirect: "manual"` so a 30x can't bounce to an internal host.
- **No sensitive content in logs.** Only URL, tool name, status, and short summaries are persisted (capped at 500 chars).
- **Rate limiting is in-memory** (per process). For a multi-instance deployment, back it with Redis/Postgres — the `McpRateLimiter` API stays the same.

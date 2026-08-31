# CRM MCP Tools — WhatsApp + Voice (BETA)

Handler **scaffolds** for the 4 differentiator tools from
`MCP_WHATSAPP_TOOLS_PLAN.md`:

| Tool | Scope | Status |
|------|-------|--------|
| `send_whatsapp` | read+write | beta |
| `get_whatsapp_thread` | read | beta |
| `get_call_recording` | read | beta |
| `get_sequence_status` | read | beta |

## Where these belong

These target the **authenticated CRM product MCP server**
(`mcp.hellogrowthcrm.com`), the same server described by
`openapi.planned.json` in this directory (not served anywhere — see below). They are deliberately **not** placed in `src/tools/` and **not**
registered in `src/tools/index.ts`, because that directory powers the *public,
unauthenticated* bot-crawler / website-data MCP server. Exposing a WhatsApp
send tool there would be a security hole.

## Contract

Each file exports a `RegisteredCrmTool` built with `defineCrmTool`. The hosting
CRM backend dispatch loop should:

1. Authenticate the Bearer API key → resolve `tenantId`, `apiKeyId`, `scope`,
   and the tenant's `piiMasking` flag.
2. Build a `CrmToolContext` (see `_shared.ts`) including a tenant-scoped
   Supabase client as `db`.
3. Look the tool up in `crmBetaToolsByName`.
4. **Pre-reject** write tools for read-only keys:
   `if (tool.requiresWrite && ctx.scope !== "read_write") return 403`.
5. Validate arguments with `tool.schema.safeParse(...)`.
6. Call `tool.handle(parsedArgs, ctx)`.

## Guards already implemented in the scaffolds

- **Scope** — `send_whatsapp` rejects read-only keys (defence in depth on top of
  the dispatch pre-check).
- **Opt-out** — `send_whatsapp` rejects when `contacts.whatsapp_opt_out` is true.
- **24-hour window** — `send_whatsapp` requires a `template_id` when the last
  inbound WhatsApp message is older than 24h.
- **PII masking** — `get_whatsapp_thread` masks phone numbers and
  `get_call_recording` withholds `recording_url` when `ctx.piiMasking` is true.
- **Audit log** — `send_whatsapp` writes every call (incl. rejections) to
  `mcp_audit_log` via `writeAuditLog`.
- **Context-window safety** — `get_whatsapp_thread` caps results at 100.

## What the developer still wires up (search `// INTEGRATION:`)

- Confirm table / column names: `contacts`, `whatsapp_messages`,
  `call_recordings`, `sequence_enrollments`, `mcp_audit_log`.
- Replace the `sendViaWhatsappBusinessApi` stub in `send_whatsapp.ts` with the
  live WhatsApp Business API call already running in the CRM app.
- Confirm tenant scoping matches the CRM's row-level-security model.

## Typecheck

```bash
npx tsc --noEmit -p crm-mcp-tools/tsconfig.json
```

## Deployment order (from the plan)

1. `get_whatsapp_thread`, `get_sequence_status` (read-only, zero risk)
2. `get_call_recording` (read-only)
3. `send_whatsapp` (write — full QA: 24h window, opt-out, audit log, scope)
4. Spec already updated: see `crm-mcp-tools/openapi.planned.json`.
5. Flip website status from "beta" to "live" once confirmed (`MCPPage.tsx`,
   `.well-known/mcp.json`).

## `openapi.planned.json` — not deployed, do not serve publicly

`openapi.planned.json` (moved here from the repo root on 2026-08-31) describes the
**planned authenticated CRM MCP**: 14 operations (`get_pipeline`, `search_contacts`,
`create_contact`, `update_deal`, `get_lead_score`, `trigger_sequence`, `log_activity`,
`get_analytics`, `create_task`, `get_meeting_notes`, plus the four beta WhatsApp/voice
tools in this directory) behind a bearer API key from `app.hellogrowthcrm.com`.

It was previously served at `https://mcp.hellogrowthcrm.com/openapi.json`, where **none of
those endpoints exist** — every `POST /tools/<name>` returns 404 — while the same host tells
callers it holds no customer data and needs no API key. A spec that instructs people to send
a live CRM credential to a public read-only host is a security problem, not just a docs bug.

**Rule:** this file ships with the package it describes. It must not be served from the
website-mirror host, and any host that does serve it must actually implement it and require
the auth it declares.

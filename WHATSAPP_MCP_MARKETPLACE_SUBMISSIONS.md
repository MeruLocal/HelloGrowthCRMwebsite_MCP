# HelloGrowthCRM MCP — Marketplace Submissions (WhatsApp differentiator)

Ready-to-paste listing copy for the **CRM product MCP server**
(`mcp.hellogrowthcrm.com`). This is distinct from
`MCP_SERVER_SUBMISSION_REPORT.md`, which covers the public bot-crawler server.

**Positioning headline:** *The only CRM MCP with native WhatsApp tools.*

> Submit only after the 4 beta tools pass the QA checklist in
> `MCP_WHATSAPP_TOOLS_PLAN.md`. Until then, list the 10 live tools and mark the
> WhatsApp/voice tools as "beta" wherever a status field exists.

---

## Canonical listing copy

**Name:** HelloGrowthCRM
**Category:** CRM
**Tagline (≤60 chars):** The only CRM MCP with native WhatsApp tools
**Short description (≤160 chars):**
> Connect ChatGPT, Claude, or any MCP client to HelloGrowthCRM — query pipeline, contacts, and analytics, and send WhatsApp messages in plain language.

**Long description:**
> HelloGrowthCRM ships a public Model Context Protocol server with 14 tools across read and read+write scopes. Beyond the pipeline, contact, analytics, and automation tools that every CRM MCP now offers, HelloGrowthCRM is the only one with native WhatsApp Business tools — `send_whatsapp` and `get_whatsapp_thread` — plus AI call summaries (`get_call_recording`) and sequence status (`get_sequence_status`). Every action is recorded in the CRM audit trail with the calling AI client's identity. WhatsApp/voice tools are in beta. SSE + Streamable HTTP transport; Bearer API-key auth with read vs read+write scopes.

**Tags:** `crm` · `whatsapp` · `sales` · `pipeline` · `revops` · `ai-agents`

**Endpoints**
- Server (Streamable HTTP): `https://mcp.hellogrowthcrm.com/mcp`
- Legacy SSE: `https://mcp.hellogrowthcrm.com/sse`
- OpenAPI (GPT Actions): **none — `/openapi.json` is retired (HTTP 410).** This host is an
  MCP server; clients enumerate it with `tools/list` over `POST /sse`.
- Discovery manifest: `https://hellogrowthcrm.com/.well-known/mcp.json`
- Landing page: `https://hellogrowthcrm.com/agentic-ai/mcp`
- Docs / setup: `https://hellogrowthcrm.com/docs#mcp`

**Auth:** Bearer API key — generate at `https://app.hellogrowthcrm.com` → Settings → API Keys (choose MCP Read or MCP Read+Write).

---

## 1. Smithery — https://smithery.ai/submit

| Field | Value |
|-------|-------|
| Server URL | `https://mcp.hellogrowthcrm.com/sse` |
| Name | HelloGrowthCRM |
| Category | CRM |
| Headline | The only CRM MCP with native WhatsApp tools |
| Auth | Bearer (API key) |

Smithery auto-indexes from the public GitHub repo. Add a `smithery.yaml` at repo
root to claim/configure the listing and pin the headline above.

## 2. Glama — https://glama.ai/mcp/servers/submit

Same details as Smithery. Glama auto-indexes public GitHub MCP repos — submit
the repo URL, then claim the listing and set the tagline + WhatsApp positioning.

## 3. Anthropic MCP directory — `modelcontextprotocol/servers` (GitHub PR)

- PR title: **Add HelloGrowthCRM MCP server**
- Add to the **CRM** section of `README.md`. Suggested entry:

```markdown
- **[HelloGrowthCRM](https://hellogrowthcrm.com/agentic-ai/mcp)** — CRM MCP with pipeline, contacts, analytics, and the only native WhatsApp Business tools (`send_whatsapp`, `get_whatsapp_thread`) plus AI call summaries. SSE + Streamable HTTP, scoped API keys, full audit trail.
```

- Checklist before opening the PR: public repo, clear `README.md`, `LICENSE`,
  and the `/.well-known/mcp.json` manifest reachable (already served by the site).

## 4. PulseMCP — https://www.pulsemcp.com/submit

Auto-discovers from `/.well-known/mcp.json` — submit the URL
`https://hellogrowthcrm.com/.well-known/mcp.json` and the server will be indexed
with the 14 tools (10 live + 4 beta) already declared in the manifest.

---

## Pre-submission checklist

```
□ 4 beta tools pass QA (24h window, opt-out, audit log, scope, PII masking)
□ (dropped) openapi.json — retired; the spec described 14 CRM tools this host does not serve
□ /.well-known/mcp.json reachable (counts only, never a tool list)             ← see PR #23
□ Public GitHub repo + LICENSE + README
□ smithery.yaml added for Smithery claim
□ 16:9 screenshot/logo (PNG) for cards (Smithery, Glama, mcp.so)
□ Flip tool status beta → live in MCPPage.tsx + mcp.json once tools ship
```

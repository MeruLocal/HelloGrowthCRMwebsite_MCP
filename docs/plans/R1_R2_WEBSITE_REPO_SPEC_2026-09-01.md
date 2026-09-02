# R1 + R2 — implementation spec for `MeruLocal/hellocrmwebsite`
**Date:** 2026-09-01
**Status:** specification only. This session had no access to the website repo
(not a connected folder; the session's GitHub token returns 403; the repo is
private so an unauthenticated clone fails). Nothing was guessed or stubbed —
every claim below was verified against the live site or the npm registry today.
**Prerequisite:** read §0 before shipping R1.

---

## 0. Sequencing trap — R1 depends on C0 being deployed

The honest replacement copy in §2 states that the public endpoint returns no
personal data and serves 76 tools. **That is only true once the C0 auth gate is
deployed** (branch `fix/mcp-auth-and-hygiene-2026-09-01` in the MCP repo, with
`MCP_ADMIN_TOKEN` set in the host environment).

Ship R1 before C0 and the new page becomes a *new* false claim — the exact
failure it exists to correct. **Deploy C0 first, verify
`GET /version` reports `tools: 76`, then ship R1.**

---

## 1. R2 — the leaked Supabase URL (do this first; it is the smaller, more urgent one)

### Verified live today — worse than the original audit recorded

The fact-check doc said 3 occurrences. There are **5**, and they are not
decorative — they are working `curl` commands a developer will copy:

| # | Location on `/docs` | Form |
|---|---|---|
| 1 | Base URL field | `https://jdkqkauiajxyjtvxikmy.supabase.co/functions/v1/integrations-rest` |
| 2 | Getting Started → Step 1 (Log in) | `curl -X POST ".../integrations-rest/auth/login"` |
| 3 | Getting Started → Step 2 (First API call) | `.../integrations-rest/leads?limit=2` |
| 4 | Getting Started → Step 3 (Create a record) | `curl -X POST ".../integrations-rest/leads"` |
| 5 | API Reference → Leads | `curl -X POST ".../integrations-rest/leads"` |

### Why this is urgent rather than cosmetic

This is not only infrastructure-topology disclosure. `/docs` is the published
integration guide for a real REST API (`/auth/login`, `/leads`). Every
integrator who follows it hardcodes the raw Supabase project ref into their
code. The cost of moving off that ref compounds daily, and it eventually
becomes a ref you cannot rotate without breaking customers.

### The fix

Introduce a single source of truth for the base URL — the docs currently repeat
the literal string in five places, which is why the audit undercounted it. One
constant, five references.

- **If the custom API domain is live** (e.g. `https://api.hellogrowthcrm.com`):
  set the constant to it and confirm it actually routes to the same function.
- **If it is not live yet:** use a placeholder that cannot be pasted into a
  terminal and cannot be mistaken for real — e.g.
  `https://<your-api-host>/v1` — with one line of prose: *"Your endpoint URL is
  issued with your API credentials."* Do **not** ship the raw project ref as an
  interim value "until the domain is ready"; that is how it got to five
  occurrences.

### Finding the source

The string is not in static `src/app` source (the earlier grep was clean), so it
lives in the docs content pipeline — Supabase-served docs content, MDX, or a
config constant. Search order:

```
grep -rn "jdkqkauiajxyjtvxikmy" .            # repo, incl. content dirs
grep -rn "integrations-rest" .               # the endpoint path
grep -rni "supabase.co/functions" .          # any other leaked function URL
```

If all three come back clean, the content is database-served: query the docs
content table for the literal and fix it there, then revalidate the route.

### Acceptance

```
curl -s https://hellogrowthcrm.com/docs | grep -c "supabase.co"     # must be 0
```

Also grep the rest of the site — `/docs` is where it was found, not necessarily
the only place it renders.

---

## 2. R1 — rewrite `/agentic-ai/mcp`

### Verified live today: everything below is currently on the page and false

- **10 tool names that do not exist:** `get_pipeline`, `update_deal`,
  `create_contact`, `get_lead_score`, `trigger_sequence`, `log_activity`,
  `get_analytics`, `search_contacts`, `create_task`, `get_meeting_notes`.
- **`npx -y @hellogrowthcrm/mcp-server`** — npm 404 (re-confirmed today).
- **`HGCRM_API_KEY`, `HGCRM_WORKSPACE`** — nothing consumes these.
- **"Get your MCP API key in under 5 minutes. Free with every HelloGrowthCRM
  account."** — there is no MCP API key and no issuing flow.
- **Scoped, revocable keys with per-key rate limiting** — does not exist.
- **A governance FAQ claiming "Every MCP-initiated action is logged with AI
  client identity and timestamp", plus PII masking and one-click revocation** —
  none of this exists. This is the most serious single item on the page: it is a
  *security assurance* about a system that was never built, and it sits in
  FAQPage schema, so it is being fed to Google and to LLMs as structured fact.
  (It was also, until today, the opposite of the truth: the real server had no
  auth at all — see C0.)

### The truth to replace it with

| Claim | Verified value |
|---|---|
| Endpoint | `https://mcp.hellogrowthcrm.com/sse`, Streamable HTTP |
| Auth | none for the public surface; do not send credentials |
| Public tools | **76** (after C0 deploys — see §0) |
| Resources | **9** |
| Gated tools | 12, admin-only, not part of the public offering |
| npm package | **none — do not document an `npx` path at all.** Both `@hellogrowthcrm/mcp-server` *and* `mcp-bot-crawler` return 404 on the npm registry (checked today). The remote endpoint is the only real way in. |
| CRM data access | none; no CRM tools exist |

### Replacement FAQ set (page copy and FAQPage schema must match exactly)

**1. What is the HelloGrowthCRM MCP server?**
A free, public MCP server at `https://mcp.hellogrowthcrm.com/sse` that lets any
AI agent — Claude, Cursor, Windsurf, Zed, custom agents — query accurate
HelloGrowthCRM product knowledge: pricing, features, integrations, comparisons,
guides and help content, plus website bot and crawler intelligence. It is a
mirror of our public website, not a door into your CRM.

**2. Which AI clients can connect?**
Any client that speaks MCP over Streamable HTTP. Connection is URL-only — paste
the endpoint, send no credentials.

**3. What tools are available?**
76 read-only tools covering product knowledge (pricing, features, integrations,
comparisons, help centre, blog, glossary, country and industry pages) and bot
governance (crawler identity verification, robots.txt generation, access-log
analysis), plus 9 resources. *Generate this list from the live server rather
than hand-maintaining it — same parity discipline as `mcp.json`.*

**4. Do I need an API key or a paid plan?**
No. The server is public and unauthenticated, on every plan. It returns no
personal data. Never send API keys, CRM credentials or customer data to it.

**5. Can my AI agent read or write my own CRM data?**
No. No endpoint serves those tools today. An authenticated CRM MCP server is
planned; when it ships, this page will document it in the same release — not
before.

**6. What governance controls exist?**
*(Replaces the fabricated audit-log answer.)* The public server is read-only
and holds no customer data, so there is nothing to govern per-tenant. Governance
controls will be documented alongside the authenticated CRM server when it
exists.

### Deletions

From `src/app/(public)/agentic-ai/mcp/page.tsx` and
`src/components/agentic/MCPConnectionDemo.tsx`, remove: the 10-tool list, the
`npx` config block, `HGCRM_API_KEY` / `HGCRM_WORKSPACE`, the
"Settings → Integrations → MCP Access" flow, the OAuth per-connection scopes
claim, the Growth/Enterprise plan-gating claim, and the governance/audit-log
FAQ answer. **Delete them from the JSON-LD as well as the visible copy** — the
schema is the half that reaches Google and the LLMs.

### Acceptance

```
grep -rE "get_pipeline|update_deal|create_contact|get_lead_score|trigger_sequence|log_activity|get_analytics|search_contacts|create_task|get_meeting_notes" src/   # 0 hits
grep -rE "hellogrowthcrm/mcp-server|HGCRM_" src/                                   # 0 hits
grep -rn "MCP Access" src/                                                          # 0 hits
```

Then re-render the page and validate the FAQPage JSON-LD — every answer in the
schema must match the visible copy word for word.

### Regression guard

Add a header comment to the page (matching the `robots.ts` / `mcp.json`
documentation style) stating that this page may only describe tools verified
against the live server, and that the FAQ schema and visible copy must be
changed together. Better still, generate the tool count from
`https://mcp.hellogrowthcrm.com/version` (`tools`) at build time, so the number
cannot drift.

---

## 3. After both ship

Submit the mcp.so listing correction. Its tool list is already right (88); its
**description** still says *"secure AI access to CRM data… deal tracking"* —
text that appears nowhere in the MCP repo, so it was scraped from this very
marketing page. Correcting the page first means the correction sticks.

# Changelog

All notable changes to this MCP server. Third-party clients that depend on the
tool surface should watch this file — and `GET /version` on the live server —
for signals that something changed. Versions follow semver: a **major** bump
means a breaking change to a tool's name, arguments or output shape; a
**minor** bump adds tools/annotations/endpoints without breaking existing
callers; a **patch** is internal.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.0.0] — 2026-08-31

### Removed — BREAKING

- **`GET /openapi.json` is retired; it now returns `410 Gone`.** The document it
  served described a different product: "HelloGrowthCRM MCP" v1.0.0, 14
  authenticated CRM operations (`create_contact`, `update_deal`, `send_whatsapp`,
  `trigger_sequence`, …) behind a `bearerAuth` scheme instructing callers to
  generate an API key at app.hellogrowthcrm.com and send it here. None of those
  endpoints exist — every `POST /tools/<name>` returned 404 — and the document
  contradicted this server's own `initialize` response, which states it holds no
  customer data, performs no CRM actions and requires no API key. Telling people
  to POST a live CRM credential to a public unauthenticated host is a security
  problem, not a documentation one.

  **Major bump, per this file's own rule:** removing a public endpoint breaks
  existing callers. Anyone who imported the spec into ChatGPT Actions was already
  getting 404s from every operation; they now get a 410 that explains why and
  points at `POST /sse` → `tools/list`.

  The planned authenticated spec moved to `crm-mcp-tools/openapi.planned.json`,
  beside the package it describes. It must not be served from this host.

### Added

- **`GET /.well-known/mcp.json`** — the discovery manifest agents and registries
  probe before talking to a remote server. Previously 404. Built from
  `server-info.ts` so it cannot drift from the wire identity, carries the
  `server.json` registry name verbatim as `registry_name`, and deliberately
  publishes tool *counts* rather than tool *names* — a second hand-maintained
  list of tool names is exactly how `/openapi.json` rotted.

## [1.1.0] — 2026-08-12

### Added
- **MCP annotations on all 88 tools** (`readOnlyHint`, `destructiveHint`,
  `idempotentHint`, `openWorldHint`). Clients can now distinguish the 80
  read-only tools from the 8 write-capable ones (`blog_create`, `blog_update`,
  `blog_revalidate`, `help_create_article`, `help_update_article`,
  `newsletter_subscribe`, `newsletter_unsubscribe`, `forms_submit`) instead of
  falling back to the spec's dangerous defaults. A startup guard and a test
  make an unannotated tool unshippable. *(Finding Y.)*
- **`GET /version`** — machine-readable status surface: server name, version,
  MCP endpoint, tool and resource counts, changelog link. *(Finding BB.)*
- **Shared rate-limit store.** Set `UPSTASH_REDIS_REST_URL` and
  `UPSTASH_REDIS_REST_TOKEN` to share rate-limit buckets across horizontally
  scaled instances (fixed-window `INCR`+`PEXPIRE` over the Upstash REST API —
  no new npm dependency). Without them, behaviour is unchanged (in-memory,
  per-process). On store failure the limiter fails open to *local* limiting,
  never to unlimited. *(Finding L′, residual.)*
- This changelog.

### Changed
- **`serverInfo` now tells the truth** about what runs here: name
  `hellogrowthcrm-website`, described as the read-only website mirror + bot
  governance server. It previously identified as a pure bot-detection server
  while also serving the full website mirror, and the published manifest sold
  it as a CRM API. The description states explicitly that the server holds no
  customer data, performs no CRM actions and requires no API key. Identity is
  centralised in `src/server-info.ts` and version parity is enforced by
  `scripts/check-versions.mjs`. *(Finding X.)*
- Landing page rewritten to match the corrected identity, and links `/version`.
- `server.json` (registry manifest) description aligned with the same identity.

## [1.0.0] — earlier

Initial public history: 88 website-mirror + bot-governance tools, 9 resources,
Streamable HTTP at `/sse` (plus stdio), spoof-resistant client-IP resolution
(PR #13), GEO audit tooling (PR #12), protocol monitor (PR #15).

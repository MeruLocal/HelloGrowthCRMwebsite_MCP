# Changelog

All notable changes to this MCP server. Third-party clients that depend on the
tool surface should watch this file — and `GET /version` on the live server —
for signals that something changed. Versions follow semver: a **major** bump
means a breaking change to a tool's name, arguments or output shape; a
**minor** bump adds tools/annotations/endpoints without breaking existing
callers; a **patch** is internal.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.2.0] — 2026-10-28

Visibility phase 1 of PLAN-HELLOG-0003: help an AI assistant route a question, never read "no entry" as "not supported", and stop serving claims the product audit disproved.

### Added
- `initialize` now returns `instructions`: what this server is (read-only product knowledge, NOT a CRM API), which tool answers which of six kinds of question, and how to read `status` values and `matched:false`.
- New tool `get_started`: the same routing as `instructions`, for clients that ignore it, plus a clean `canonical_url` and a separate `visit_url` (UTM-tagged) for each own-site link.
- Zero-result contract on `features_list`, `integrations_list` and `help_search`: a search that finds nothing returns `matched:false`, an explicit "this does not mean the product lacks it" sentence, suggested next tools and, where close, `did_you_mean` (capped edit distance, labelled as not the same item).
- `integrations_list` response fields: `total`, `returned`, `offset`, `limit`, `next_offset`, `partial`, `status_filter`, `includes_overrides`, `counts` by status; each entry carries a `canonical_url`.
- `/health` reports `overrides: {total, expired}`; an expired override makes `/health` degraded (monitoring signal only; it never changes what tools serve).
- `src/data/claim-overrides.ts`: entries the product audit proved are not available (for example Cashfree, PayU, Paytm, PhonePe, PayPal and Instamojo payment links, TallyPrime sync, and integration cards whose connect function is not deployed) are returned with `status: "not_available"`, a reason, the known-truth id, evidence and an as-of date. Overrides win over synced website content and expire for re-review.
- CI `truth-guard` test and a deny list of claims the product does not support.

### Changed (breaking default)
- `integrations_list` with no arguments now returns the first page (50) of **live** entries sorted by slug, not the whole catalogue (about 386 KB). To read everything: call with `status: "all"` and follow `next_offset` until it is `null` (`limit` is capped at 200). Callers that read only the first response will silently see 50 live entries; `partial: true` and `next_offset` tell a caller there is more. A search always returns a matching `not_available` entry whatever the status filter says. No entry was removed; the live count now excludes overridden entries.
- `generate_llms_txt` lists live integrations only.

### Fixed
- Removed served claims the audit disproved: "unlimited pipelines", "unlimited exports + scheduled reports", SOC 2 stated as a certification or fact, and TallyPrime sync (see the deny list).

## [2.1.0] — 2026-10-27

### Added
- Tool `buyer_find_answer_pages`: routes buyer questions to canonical hellogrowthcrm.com pages and follow-up tools.
- MCP prompts: `compare_with_competitor`, `price_for_my_team`, `crm_for_my_industry`, `is_it_secure`.
- `/mcp` alias for `/sse`; `/.well-known/mcp/server-card.json`; `/llms.txt` on the MCP host.
- `examples/clients/` connect configs.

### Changed
- `server.json` description shortened to the registry's 100-character limit.

### Fixed
- **No data-residency claims.** India, Australia and New Zealand "data residency"
  statements were removed from `pricing_get_country_plans` and the `solutions_*`
  compliance lines. Production is not region-pinned, so the claim was inaccurate.
  The India mirror line now reads "DPDPA compliant, SOC 2 certified".

Minor bump (new tool/prompts/endpoints added since 2.0.0 without breaking
existing callers), per this file's own semver rule.

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
## [Unreleased] — 2026-09-01

### Security

- **The public HTTP endpoint no longer serves the write and personal-data
  tools.** This server talks to Supabase with `SUPABASE_SERVICE_ROLE_KEY`,
  which bypasses row-level security, and every one of the 88 tools was being
  served over the unauthenticated endpoint. An anonymous caller could read
  newsletter subscribers and contact-form submissions, and write to the blog
  and help-centre tables.

  Twelve tools are now gated behind `Authorization: Bearer $MCP_ADMIN_TOKEN` —
  the eight write-capable tools (`blog_create`, `blog_update`,
  `blog_revalidate`, `help_create_article`, `help_update_article`,
  `newsletter_subscribe`, `newsletter_unsubscribe`, `forms_submit`) and the
  four that read personal data (`newsletter_get_subscribers`,
  `forms_list_submissions`, `forms_get_submission`, `forms_export_csv`).

  Gated tools are absent from `tools/list` and refused by `tools/call` for an
  unauthenticated session — hidden, not merely denied, so the public surface
  does not advertise what it will not serve. **Fail-closed:** with
  `MCP_ADMIN_TOKEN` unset they are not served at all, so a forgotten
  environment variable can never re-open the endpoint. `stdio` is an
  operator-run local process and remains fully trusted.

  The gated set is derived from `TOOL_ANNOTATIONS` (`readOnlyHint: false`)
  plus a named list of personal-data readers, so a new write tool is gated the
  moment it is annotated. `src/tools/__tests__/access.test.ts` pins the exact
  set. *(Finding C0.)*

  **Breaking for any client that used those tools anonymously** — set
  `MCP_ADMIN_TOKEN` in the deployment environment and send it as a bearer
  token.

### Added

- **`GET /health`** — `{status, version, mcp_spec, timestamp}`, unauthenticated,
  no internals. `mcp_spec` is read from the SDK's `LATEST_PROTOCOL_VERSION`
  rather than hand-written, so it cannot go stale on an SDK bump. *(C4.)*
- **`GET /robots.txt`** — disallows `/sse` and `/messages`, allows the landing
  page. No sitemap: an API host has nothing to enumerate. *(C4.)*
- **`GET /.well-known/security.txt`** — mirrors the main site's policy so a
  researcher landing on the API host has the same reporting path. *(C4.)*
- **`GET /favicon.ico`** — 302 to the main site's icon, so the two cannot
  drift and no binary asset lives in this repo. *(C4.)*
- **Security headers on every response** — HSTS, `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`. CSP is scoped to the HTML landing page
  only, and allows the googletagmanager/Ahrefs tags that page actually loads.
  *(C5.)*
- **`MCP_ADMIN_TOKEN`** documented in `.env.example` and `server.json`.

### Changed

- **`GET /version` now reports the split surface**: `tools` is the public count
  (76), with `tools_total` (88) and `tools_gated` (12) alongside, plus
  `mcp_spec`. Leaving `tools` at 88 would have made this endpoint lie to the
  registries that read it.
- **Corrected the "no customer data" claim** in `server-info.ts`,
  `server.json` and the landing page. It was inaccurate: `forms_*` and
  `newsletter_*` do read customer data. The copy now says what is true — the
  *public endpoint* returns no personal data, and the tools that do require an
  authenticated session. Still not a CRM API, still no CRM actions.

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

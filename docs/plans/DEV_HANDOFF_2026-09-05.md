# Dev Handoff — everything currently missing (2026-09-05)

**Read first:** roadmap `docs/plans/UPGRADE_ROADMAP_2026-09-02.md` (PR #37, Sol-reviewed) and issues **#38–#45** hold the full phased plan. This doc is the entry point: what is missing *right now*, in priority order, with the new findings from 9/3–9/5 that are not yet in any issue. Tick items here as their PRs land; don't duplicate scope that's already ticketed — links below point at the owning issue.

**Server state (verified live 9/5):** v2.0.0, audit **0 fail · 4 warn · 14 pass**, 76/88 tools (12 gated, correct). A weekly automated audit now runs Mondays 09:05 IST and flags regressions — treat any 🔴 from it as top priority.

---

## A. Blocking / this week

| # | Missing thing | Where | Notes |
|---|---|---|---|
| A1 | **hellocrmwebsite CI is broken** — all 5 checks (vitest, axe, content-gate, lighthouse, seo-guard) die in ~1 min with `MODULE_NOT_FOUND` on Node 20 runners | hellocrmwebsite `.github/workflows` | Blocks merging **PR #1403** (the ₹1,099 pricing fix — until it merges + deploys, the live site quotes a price that matches no Razorpay plan). Fix CI first, then merge #1403. |
| A2 | **`MCP_ADMIN_TOKEN` → internal content pipeline** | ops (founder holds the token) | Blog/help write tools have been gated since v2.0.0; the pipeline has no write access until it gets the bearer token. |
| A3 | **This repo's mirror still serves the fictional ₹1,099** and USD monthly **$13** (canonical is **$12**, per hellocrmwebsite `pricing-constants.ts` HG-004) | `src/data/website-mirror.ts`, `src/tools/pricing.ts` | Full spec in the issue #40 comment (9/3). Canonical INR copy: **"₹899/user/month + 18% GST" on BOTH billing modes** (billed ₹1,060.82; annual ₹8,990/yr + GST = 2 months free). Ship this small fix now — don't wait for the regeneration job. |

## B. The sync gap (the biggest structural missing piece)

| # | Missing thing | Notes |
|---|---|---|
| B1 | **There is no sync command.** `website-mirror.ts` says "re-extract by hand and bump SYNCED_AT" — last done **2026-06-17** (11+ weeks). Result: server says 630 integrations, code had 525, website says "259+". | Owning issue: **#40**. Concrete build guidance: the mirror header already maps every block to its website source file (`lib/pricing-*-data.ts`, `lib/product-feature-pages.ts`, `lib/contact-matrix.ts`, sitemap routes, …). Build `scripts/sync-mirror.mjs` (→ `npm run sync:mirror`) that re-extracts those blocks from a hellocrmwebsite checkout, regenerates the file with a new `SYNCED_AT`, and fails loudly on schema mismatch. Then wire it to a weekly GitHub Action that opens a PR with the diff. Taxonomy decision (what counts as an "integration") comes FIRST — see issue #40. |
| B2 | Freshness gate: `/health` should degrade and `scripts/audit-live-mcp.mjs` should FAIL when `SYNCED_AT` is older than the sync cadence + margin (e.g. 10 days). | Issue #40 / roadmap 2.3. |

## C. Versioning so LLM clients know we shipped (new asks, 9/5)

| # | Missing thing | Notes |
|---|---|---|
| C1 | `tools.listChanged` capability — declare + emit so connected clients refresh the tool list without reconnecting | Roadmap 3.4 / issue #41 (decide first whether the post-Phase-0 public list actually changes at runtime). |
| C2 | **Changelog as an MCP resource** (`hellogrowth://changelog`) so an agent can read what's new in-protocol. `/version` already links the changelog URL; none of the 31 benchmarked vendors expose it as a resource — cheap differentiation | New — add to issue #41 or #44. |
| C3 | Version discipline on release: `package.json` + `server.json` ×2 must move together (`npm run check:versions` enforces; see RELEASING.md). Registries surface new versions from npm/server.json | Already tooled; just follow it. |

## D. Distribution (blocked behind Phases 0–4 by design — prep now, execute at Phase 5)

| # | Missing thing | Notes |
|---|---|---|
| D1 | **npm publish of `mcp-bot-crawler`** — every row of `MCP_SERVER_SUBMISSION_REPORT.md` + `mcp_submission_sites.csv` is still "Pending"; npm is the single unlock for Smithery/Glama/mcp-get/PulseMCP auto-indexing and a server.json prerequisite | Issue #43 (C8). |
| D2 | **Submission report refresh** (it's dated 6/12 and stale): add **Claude Connectors Directory** and **GitHub MCP Registry** (neither existed then; both outrank most current rows), correct tool count 81 → 88 (12 gated), align every description with the post-R1 honest copy ("public read-only product knowledge + bot governance; no CRM actions; no personal data") | New — fold into issue #43. |
| D3 | **mcp.so listing correction** — its description still carries the pre-R1 CRM fiction (scraped from our old marketing page) | Issue #43 / roadmap 5.5. Submit after A3 + #1403 are live. |

## E. Already ticketed — do not re-scope here

Phase 0 boundary work (extraction decision + CI invariant tests + C0 hygiene sweep) → **#38**. DB isolation off the service-role key, UGC exclusion, abuse controls, telemetry (PR #27 plan) → **#39**. Tool `title`s, `outputSchema`, `/sse` docs, conformance harness → **#41**. Tool-architecture experiment (use the vendored `mcp-builder` skill's evaluation harness, PR #46) → **#42**. Deferred bets (prompts, `get_integration_rules`, WhatsApp tools on the CRM server, stateless-spec migration) → **#44**.

## Open PRs awaiting merge (all reviewed-ready)

- This repo: **#37** (roadmap), **#31** (audit-skill update), **#46** (mcp-builder skill vendored) — merge these first so the docs/tools referenced above are on `main`.
- hellocrmwebsite: **#1403** (pricing implementation — behind A1), plus docs PRs #1354/#1356/#1362/#1370/#1395.
- Researchsuite: **#18** (audit skill copy).

## Verification, always

`npm run audit:live` (or `node scripts/audit-live-mcp.mjs`) before closing anything — baseline **0F · 4W · 14P**; a new FAIL is a regression. The Monday auto-audit reports independently. Rule that governs every item above: **the server describes only what it actually serves; manifest, marketing, schema, and code change in the same release.**

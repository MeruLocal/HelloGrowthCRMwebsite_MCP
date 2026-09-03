# MCP Upgrade Roadmap — team workplan (v2, Sol-reviewed)

**Date:** 2026-09-02 · **Status:** ready for team · **Review:** adversarial review by ChatGPT Sol 5.6 completed 9/2; sequencing below reflects it. Sol's verdict: *"Do not distribute this more broadly until the private/write tools are removed from the public artifact and security/observability move ahead of distribution; E1 is worthwhile only as a true replacement/pruning experiment, not two additional tools layered onto 88."*
**Context:** v2.0.0 live and verified — 12 privileged tools gated behind `MCP_ADMIN_TOKEN` (hidden + fail-closed), audit baseline 0 fail · 4 warn · 14 pass. Informed by a 31-vendor benchmark (see skill §6 and hellocrmwebsite PR #1370 for the strategy cut).
**Inventory, stated precisely (a Sol finding — the plan must never be ambiguous about this):** the server implements **88 tools**. **76 are public** read-only product-knowledge/bot-governance tools. **12 are privileged website-ops tools** (8 content-write: blog/help create/update/revalidate, forms_submit, newsletter_subscribe/unsubscribe; 4 personal-data readers: forms_list/get/export, newsletter_get_subscribers). They are NOT CRM tools; the CRM MCP is a separate repo (hellocrm) and out of scope here.
**Ground rule:** describe only what the live server serves; manifest, marketing and schema change in the same release as the code.

---

## Phase 0 — Boundary cleanup (before everything else)

Sol's core architectural point, adopted: bearer-token filtering inside one binary keeps the P0's blast radius alive — a routing bug can re-expose the 12.

| # | Task | Done-when |
|---|---|---|
| 0.1 | **Decision + spike: extract the 12 privileged tools into a separate ops-only deployment** (internal URL, token required at the transport edge), leaving the public artifact with zero mutating/PII code paths. If extraction is deferred, 0.2 becomes mandatory compensation | decision recorded; extraction ticketed or explicitly declined with rationale |
| 0.2 | **CI invariant tests** on the public surface: unauthenticated sessions cannot list OR invoke any privileged tool by exact name, alias, malformed/expired/wrong token, or any meta-dispatch path; every public tool carries `readOnlyHint: true`; no service-role write path reachable. Extend `access.test.ts` | tests red-team the boundary on every commit |
| 0.3 | Post-incident hygiene sweep for C0: rotate the Supabase service-role key, review access logs for the exposure window, record an affected-data determination | written note in repo |
| 0.4 | ~~F1 in-server `send_feedback` tool~~ — **CUT** (Sol: an authless write tool contradicts "public, read-only" and invites spam/PII collection). Instead: `mcp@hellogrowthcrm.com` + a feedback link on the landing page | landing page updated |

## Phase 1 — Security & operations (before any distribution)

| # | Task | Done-when |
|---|---|---|
| 1.1 | **DB isolation (was D3 — promoted to launch-blocking):** dedicated public DB role; allowlisted views/RPCs in a dedicated schema; RLS with positive AND negative tests (tenant IDs, private columns, writes, unbounded filters all provably fail); review SECURITY DEFINER functions and search paths; **no public code path on the service-role credential**; rotate the old key after migration | negative tests green in CI |
| 1.2 | **UGC exclusion (was D1, strengthened per Sol):** default is to NOT serve user-generated content from the public mirror at all. Inventory every content source (editorial / third-party / scraped / UGC); exclude form text, comments, tickets unless a concrete product need exists; where included, structured labelled fields + provenance + stripped markup + bounded size — a prose "ignore instructions" wrapper is presentation hygiene, not a security boundary | source inventory committed; UGC out or justified |
| 1.3 | **Abuse controls (was D2, expanded):** per-IP + global rate/concurrency limits with correct client-IP extraction behind the proxy; stricter limits on expensive tools; body/query/output/timeout/pagination bounds; `429` + `Retry-After`; fail-safe if the limit store is down; a load test at expected directory-driven traffic | limits live, logged, load-tested |
| 1.4 | **Telemetry + alerting (was F2/F3, promoted):** implement the PR #27 Supabase sink; synthetic initialize→list→call probes (not just `/health`); alert on error-rate, latency, rate-limit spikes, content-sync failure — with a named owner. Weekly `audit-live-mcp.mjs` cron; new FAIL notifies | an alert has fired in a drill |

## Phase 2 — Truth pipeline (gates all marketing)

Sol's correction, adopted: don't force 630/525/"259+" into one number if they count different things — that manufactures a new falsehood.

| # | Task | Done-when |
|---|---|---|
| 2.1 | **Canonical content taxonomy first:** define integration vs connector vs action, feature vs screen vs catalogue entry, public vs internal — as versioned canonical records | taxonomy doc merged |
| 2.2 | Regeneration job publishing **atomic snapshots** (snapshot ID, source revision, timestamps) from which ALL surfaces — MCP tools, llms.txt, website copy — derive | one snapshot feeds every surface |
| 2.3 | Freshness gates: `/health` degrades and the audit script FAILs on stale `synced_at` (threshold with scheduling margin, e.g. 10 days for a weekly job) | gate proven by test |
| 2.4 | Sweep `?? 0` / `?? []` over query results (broken query ≠ confident zero) | grep clean or justified |

## Phase 3 — Protocol polish

| # | Task | Done-when |
|---|---|---|
| 3.1 | `title` on all public tools (directory requirement) | audit warn cleared |
| 3.2 | `outputSchema` on the highest-traffic tools, properly validated; remainder scheduled incrementally (Sol: don't blanket-rollout) | top tools schema'd |
| 3.3 | Document the `/sse`-speaks-Streamable-HTTP trap on landing + README; if adding an `/mcp` alias, dual-serve indefinitely (Asana's hard V1 shutdown broke integrators) | no external audit trips |
| 3.4 | `tools.listChanged` — **only if** the post-Phase-0 public deployment genuinely changes its list at runtime; on a static public surface, cut it (Sol) | decision recorded |
| 3.5 | Run `modelcontextprotocol/conformance`; record result | green run recorded |

## Phase 4 — Tool-architecture experiment (E1, respecified per Sol)

A **replacement/pruning** experiment, offline, before the Claude slug is locked. Benchmark data: GitHub ~95%→71% tool-selection accuracy with bloat; Twilio +27.5% cost from 1:1 wrappers → pivoted to a 2-tool search/retrieve pair; Asana pruned 44→25.

- Conditions to compare on public product-knowledge tasks: (a) current 76 public tools; (b) a pruned task-oriented set; (c) **MCP resources/resource-templates with stable URIs + one search tool** (Sol: likely the right baseline for knowledge content); (d) search/fetch over *documents/catalogue entities* — never a meta-executor dispatching arbitrary tools.
- Measure end-to-end task success (not just tool selection), wrong/forbidden calls, token cost, latency, across ≥2 clients, on easy/ambiguous/multi-step/no-answer tasks, ≥2 runs.
- **Predefined ship threshold** (no safety regression + credible task-success gain + acceptable cost) recorded before running.

## Phase 5 — Distribution (only after Phases 0–4)

| # | Task | Done-when |
|---|---|---|
| 5.1 | Publish `mcp-bot-crawler` to npm per RELEASING.md (version parity ×3, `npm run verify`), with provenance/clean-room publication checks and a rollback plan | installable; C8 closed |
| 5.2 | Official MCP Registry: DNS-verify `com.hellogrowthcrm`, `mcp-name` marker, server.json | listed |
| 5.3 | Claude Connectors Directory submission (authless public server) — **after** the architecture decision, so the permanent slug matches the final tool surface | submitted |
| 5.4 | Landing page v2: **top two clients + generic config first** (Sol: only ship one-click variants you can continuously test); expand later. Update CSP in HOME_PAGE_HTML in the same change | snippets verified against current client docs |
| 5.5 | Correct the mcp.so listing (still carries pre-R1 CRM fiction) | listing truthful |

## Phase 6 — Deferred until usage data exists

- E2 `get_integration_rules` teach-the-agent tool (needs Phase 2 canonical rules first).
- E3 MCP prompts (cheap, but let client support + usage decide if it's differentiation or inventory noise).
- Secondary directories beyond official registry + Claude.
- Spec runway: plan session handling for the **2026-07-28 stateless spec** before any SDK bump past 1.29.x.

## Referenced (other repos)

- **hellocrm — CRM MCP server:** OAuth 2.1 + PKCE (DCR à la Linear/Attio/Airtable vs pre-registered à la Asana V2 — spike), scoped tool visibility (PayPal), "AI proposes, human commits" write previews (Asana/Airtable), admin audit log, sandbox tenant, quote→confirm for credit-spending actions (Vercel/ElevenLabs).
- **hellocrmwebsite — marketing:** Xero-style end-user page, "How we made our MCP server tell the truth" engineering post, changelog cadence — all gated on Phase 2.

## The white space (why this is worth it)

No official CRM MCP (Pipedrive 34 CRUD / Attio ~40 agent-first / Monday ~40 / Freshworks none) ships MCP prompts or resources, WhatsApp/omnichannel tools, vertical-aware tools, self-service AI-action audit exports, or anything at Indian SMB price points. Attio (semantic search + SQL reporting) is the depth bar; Intercom's Fin-as-an-MCP-tool is the long-term pattern for our 12 agentic AI agents.

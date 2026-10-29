# Plan — MCP: make the public knowledge server discoverable and easy for agents to use

- **Revision:** 2 (folds in Sol's rev-1 review, §10)
- **Plan id:** PLAN-HELLOG-0004 (from `plan-id.mjs next`. Two of its sources failed: it read trunk `master` instead of `main`, and `gh pr list` is GraphQL, which is blocked here. Re-checked by hand on 2026-10-29: the REST PR list and `git ls-remote` show 0003 as the highest id in use, and no `plan-hellog-*` file is on `origin/main`.)
- **Branch:** `plan/hellog-0004-knowledge-mcp-discovery` · **Repo:** MeruLocal/HelloGrowthCRMwebsite_MCP · **Trunk:** `main` (verified: `origin/HEAD -> main`, head `5190a02`, package 2.1.0)
- **Mode:** PLAN (this PR). Each BUILD phase below is its own PR and carries `Implements: PLAN-HELLOG-0004 (phase X)`.
- **Change tags:** `public_api` (new tools, new optional endpoints, `tools/list` gains fields)
- **Tier:** T2. Owed (`workflow.mjs obligations --mode BUILD --tags public_api`): acceptance_criteria · blast_radius · caller_inventory · compatibility_test · intent · necessary_changes · planned_file_coverage · premise_check · smoke_test
- **Restricted areas touched (G2):** none. No auth, billing, migration, secret or email-send file is touched. The bearer-token gate in `src/tools/access.ts` is read, not changed.
- **Freeze in force?** Yes. The PLAN-HELLOG-0003 release gate (§0c of that plan, PR #102) blocks anything registry-facing until the G1–G5 safety fixes are deployed and verified. **This plan widens it** (Sol, blocker 4): no **public deploy** of any phase that adds an anonymous tool or route (B, C) happens before the 0003 gate file exists. Those phases may merge to `main` only once the maintainer confirms that merging does not deploy, which is the same condition as 0003 §0c.
- **Date:** 2026-10-29
- **Inputs:** research suite `MeruLocal/hellogrowthcrm-researchsuite@claude/usa-competitors-list-5373vp`: `ai-discovery/summaries/pilot-2026-10-29.md` (with the U81b addendum), `ai-discovery/mcp-competitors.csv`, `ai-discovery/mcp-opportunities.csv` (ledger OPP-0042..OPP-0046), `raw/mcp-tools/hellogrowthcrm/2026-10-29/tools-list.json`, and skill §5c.

## 0. Intent

- **Claim.** HGC already runs a public, read-only knowledge MCP. Agents struggle to find it and to use it well. It is in no registry, it has no generic `search`/`fetch` pair, two-thirds of its tools have no `outputSchema`, and 20 website-operations tools sit beside 57 product-knowledge tools in one list. This plan fixes discovery and usability **for connected-agent workflows only**. It claims nothing about Google rankings or AI citations.
- **Mechanism.**
  - (A) A registry-valid `server.json` for a domain-verified namespace, published by the founder with `mcp-publisher`.
  - (B) Read-only `search` + `fetch` tools that reuse the existing handlers and return canonical hellogrowthcrm.com URLs.
  - (C) Opt-in profile endpoints and clearer descriptions for the website-operations tools. Nothing is removed.
  - (D) `outputSchema` on the remaining public tools, each written from an observed result.
  - (E) Per-client setup docs.
  - (F) A Claude and ChatGPT directory submission pack, filed by the owner.
  - (G) A query-suite measurement taken before and after.
- **Observable.**
  - `GET registry.modelcontextprotocol.io/v0/servers?search=hellogrowthcrm` returns the server.
  - In ChatGPT and other clients, `tools/list` carries `search` and `fetch`, and `search "lead scoring"` returns `https://hellogrowthcrm.com/product/ai-lead-scoring` with a snippet and an `as_of` date.
  - `/mcp/knowledge` lists the knowledge tools only.
  - `tools/list` shows `outputSchema` on every public tool that returns an object.
  - The query-suite table is recorded twice, once before and once after.
- **Risk.**
  - Registry and directory listings make an anonymous server more visible before G1–G5 ship. Mitigation: the freeze above.
  - Generic `search`/`fetch` names could pull tool selection away from the specific tools. Measured in (G).
  - A wrong `outputSchema` is worse than none (`src/tools/output-schemas.ts` header).
  - Listing copy could read as promotional and be rejected by the directories.

## 0a. Necessary changes   (planned-file coverage)

Phase A — registry (after the 0003 gate)
- [ ] `server.json` — set `name` to `com.hellogrowthcrm/knowledge` (see §2.1). Set the remote to `{type:"streamable-http", url:"https://mcp.hellogrowthcrm.com/mcp"}`. Both `/mcp` and `/sse` answered a Streamable HTTP `initialize` POST with `200 text/event-stream` on 2026-10-29, and the same handler serves both (`src/server.ts`, the `/sse` || `/mcp` branch). `/mcp` avoids clients misreading `/sse` as the legacy SSE transport (mcp-server-audit §2). Make it remote-only: drop the `packages[]` npm block while `mcp-bot-crawler` is unpublished (npm 404, 2026-10-29). Write a buyer-accurate description of 100 characters or fewer and a `title`. Keep `$schema` at `2025-12-11`, the newest released schema per the registry's server-json CHANGELOG, and re-check it at publish time.
- [ ] `package.json` — `mcpName` to match `server.json.name`.
- [ ] `src/server-info.ts` + `src/well-known.ts` — `registry_name` on `/.well-known/mcp.json` follows `server.json.name`. It is derived, not typed twice.
- [ ] `scripts/check-versions.mjs` — while `packages[]` is absent, check version parity on `server.json.version` only. Fail if `packages[]` comes back without a matching npm version.
- [ ] `src/__tests__/well-known.test.ts` — assert that `registry_name === server.json.name`.
- [ ] `RELEASING.md` — a "remote-only registry publish" section with the founder's DNS steps (§2.1).

Phase B — `search` + `fetch`
- [ ] `src/tools/knowledge-index.ts` (new) — a read-only adapter (index mechanics are in §2.2) over the existing data (buyer intents, features, products, integrations, pricing/country plans, comparisons/alternatives/switch guides, glossary, guides, templates, changelog, help, blog). It maps each to `{id:"<kind>:<slug>", title, url, snippet, as_of}`. It adds no data source.
- [ ] `src/tools/search-fetch.ts` (new) — the `search` and `fetch` tools (§2.2).
- [ ] `src/tools/index.ts`, `src/tools/titles.ts`, `src/tools/annotations.ts`, `src/tools/output-schemas.ts` — register both tools with a title, read-only annotations and an `outputSchema`.
- [ ] `src/tools/__tests__/search-fetch.test.ts` (new) — query fixtures, canonical-URL host check, round-trip of every `id` through `fetch`, and a filter-metacharacter negative.
- [ ] `src/tools/__tests__/registry.test.ts` — tool count +2.

Phase B0 — prerequisite security fixes, one PR per finding (per `.claude/skills/mcp-server-audit` §6)
- [ ] B0a `src/tools/blog.ts`, `src/tools/help.ts` — `blog_search` and `help_search` interpolate the raw `query` into a PostgREST `.or()` filter string (`blog.ts` `blog_search` handler; `help.ts` `help_search` handler), under the service-role key. Escape or reject `,`, `(`, `)`, `*`, `%`, `\` before reuse. Test: a query containing `x%,id.gt.0` neither widens the result set nor returns a database error message.
- [ ] B0b `src/tools/blog.ts`, `src/tools/help.ts` — **a public-visibility rule, enforced unconditionally** (Sol, blocker 2). Every public list, search, get and index path for blog and help applies the table's "published and not deleted" predicate (`published_at <= now()` and, for each table, the status/archived column the build names from the schema). This holds whether or not draft rows exist today. Test with private fixture rows (a draft, a future-dated row, a deleted row): none is returned by list, search, get, `search` or `fetch`, including `fetch` with a guessed id.

Phase C — tool clarity for website-operations tools (additive)
- [ ] `src/tools/profiles.ts` (new) — `KNOWLEDGE` and `GOVERNANCE` name sets. Every public tool belongs to exactly one, and a test enforces it. Only `/mcp/knowledge` is routed in this phase; `/mcp/governance` is **deferred** (Sol, CUT) until the measurement shows the knowledge profile is worth a second permanent route.
- [ ] `src/server.ts` — `buildServer({authorized, profile})`. The profile is bound per session at `initialize`, exactly as `authorized` is today (one `Server` instance per session; no shared or cached `tools/list`). The privileged filter is applied **before** the profile filter, so a profile can never re-expose a gated tool. `/sse` and `/mcp` keep the full list unchanged. `/mcp/knowledge` filters `tools/list` and refuses out-of-profile `tools/call` with the same message shape as the C0 gate.
- [ ] `src/tools/*.ts` for the 20 governance tools — descriptions gain a leading "For site owners auditing a website's bots/SEO (not HelloGrowthCRM product information): …". Names, arguments and outputs are unchanged.
- [ ] `src/tools/__tests__/profiles.test.ts` (new) — the partition is exhaustive and disjoint. `/sse` lists exactly the 2.1.0 names plus `search` and `fetch`.

Phase D — `outputSchema` coverage
- [ ] `src/tools/output-schemas.ts` — entries for the 52 public tools without one, in batches of about 10 by file group. Each entry is written from an observed `handle()` result. Tools whose result is a string or an array get **no** schema, because `ok()` only sets `structuredContent` for plain objects (`tool-types.ts` `ok()`), and wrapping them would change the output. They are listed by name in the test as "deliberately schema-less".
- [ ] `src/tools/__tests__/output-schemas.test.ts` (new or extended) — call every schema'd tool with fixture arguments through an in-memory SDK client, which validates `structuredContent` against the declared schema.
- [ ] `src/tools/__tests__/annotations.test.ts` — assert that all public tools carry `title` + the four hints. This is already true live (§1); the assertion locks it in.

Phase E — per-client setup docs
- [ ] `examples/clients/README.md` — add ChatGPT and Claude (web/desktop "custom connector") sections. Mark Claude Desktop's config-file route as `mcp-remote` only. Add a "verified on <date> by <person>" column; an unverified client is labelled so.
- [ ] `examples/clients/chatgpt.md`, `examples/clients/claude.md` (new) — step lists with the exact menu path, filled in by the person who verifies them.

Phase F — directory submission pack (humans submit)
- [ ] `docs/DIRECTORY_SUBMISSIONS_2026-10.md` (new) — per directory: requirements, what is done, what is UNVERIFIABLE, the owner's steps, the listing copy and the test prompts (§2.6).

Phase G — measurement
- [ ] `scripts/query-suite.mjs` (new, node built-ins only). Each run records the target host, the `/version` body, the `/health` body and the response `serverInfo`, so that every snapshot names the build it measured (Sol risk: the version string alone is unreliable, §1 correction 2) — a deterministic half: `tools/list` snapshot and diff, `search` top-3 canonical-URL check, and per-call latency. It writes `docs/evidence/query-suite-<date>/`.
- [ ] `docs/evidence/query-suite-<date>/README.md` — the agent half (tool chosen, correctness, unnecessary calls), recorded by a person in each client (§2.7).

## 0b. What we already know   (G4)

| Source | What it said | What this plan does about it |
|---|---|---|
| PLAN-HELLOG-0003 (PR #102, draft) + `docs/MCP_LLM_VISIBILITY_STRATEGY_2026-10-28.md` on that branch | Registry-facing text waits for G1–G5. Founder rule (2026-10-28): **additive only**, no tool removed or moved, MCP traffic not reduced. Directory policies reject promotional or interfering descriptions. Tool selection degrades past about 30–50 tools. A buyer-profile endpoint was proposed as additive. | Phase A is sequenced behind that gate. Phase C is additive: the profiles are *extra* paths and `/sse` is unchanged. Phase F copy is neutral. This plan **extends** 0003 and supersedes none of it. |
| BUILD PR #103 (draft, 2.2.0) | Adds server `instructions`, `get_started`, a zero-result contract and a `not_available` status | `search` reuses the zero-result sentence and the `not_available` status once #103 merges. Phase B rebases on it. |
| PRs #95 and #96 (open) | Add capability-catalogue and industry-module tools | If merged first, they join the KNOWLEDGE profile and the `search` index. The profile test fails until each is placed. |
| `.claude/skills/mcp-server-audit/SKILL.md` §5 | Registry readiness: npm `mcp-bot-crawler` returned 404 on 2026-08-31 | Still 404 on 2026-10-29, hence a remote-only `server.json`. |
| `RELEASING.md` | "npm first, registry second" | Remote-only publishing removes the npm dependency. If the founder later publishes npm, that rule applies again. |
| CHANGELOG 2.0.0 | `/openapi.json` rotted because it was a second hand-kept list | `registry_name` is derived from `server.json`, and the profiles are tested to partition the registry. |

## 1. Premise   (G8)

Verified in this session, 2026-10-29:

| Claim | Type | Evidence | Running system? |
|---|---|---|---|
| 77 public tools, 12 gated, 9 resources | integration | `GET mcp.hellogrowthcrm.com/version` → `tools 77, tools_total 89, tools_gated 12, resources 9`; `grep -c defineTool( src/tools/*.ts` = 89 on `main` | yes |
| Not in the MCP Registry | missing_feature | `registry.modelcontextprotocol.io/v0/servers?search=` `hellogrowthcrm`, `merulocal`, `bot-crawler` → `count: 0` | yes |
| Of the CRM brands checked, only monday.com is in the registry under its own namespace | integration | the same API: `monday` → `com.monday/monday.com`. `hubspot`, `zoho` and `salesforce` return only third-party names (com.devart, com.edgethirteen…); `pipedrive` and `attio` return no `com.*` entry from the vendor. The result counts (35/11/40) differ from the pilot's 9/5/18 because the registry is live; the conclusion holds. | yes |
| No generic `search`/`fetch` pair | missing_feature | live `tools-list.json`: no tool named `search` or `fetch`. `fetch_page_content` fetches arbitrary URLs and is a governance tool, not a knowledge fetch. | yes |
| 25 of 77 carry `outputSchema` | missing_feature | live `tools-list.json` = 25. `TOOL_OUTPUT_SCHEMAS` keys on `main` = the same 25 names. | yes |
| Annotations | — | **Already complete.** All 77 live tools carry `title` + `readOnlyHint` + `destructiveHint` + `idempotentHint` + `openWorldHint`. Phase D only adds a regression assertion. | yes |
| Website-ops tools are mixed in with product knowledge | documentation | 20 of 77 by name: 8 bot-governance (`scan_website_bots` … `export_bot_report`), 6 page/llms/GEO diagnostics (`fetch_page_content`, `crawl_pages`, `generate_llms_txt`, `check_llms_txt`, `check_ai_extractability`, `validate_sitemaps`), 5 `seo_get_*` and `content_get_seo_rules`. The other 57 are product knowledge. Server title: "HelloGrowthCRM Website & Bot Governance MCP". The 0003 strategy said "about 25"; the code count is 20. | yes |

**Corrections to the brief:**
- (1) A `server.json` **already exists**: `io.github.merulocal/hellogrowthcrm-bot-crawler`, with schema 2025-12-11. It is unpublished and not publishable as written: it declares npm package `mcp-bot-crawler`, which returns 404 on npm, and the registry validates declared packages.
- (2) Live reports **2.0.0** while `main` is **2.1.0**, yet live `tools/list` already includes `buyer_find_answer_pages` (added in 2.1.0). The deployed build and its version string disagree; `RELEASING.md` already records that deploy and publish drift. Phase G therefore snapshots behaviour, not the version.
- (3) The website setup page `hellogrowthcrm.com/agentic-ai/mcp` (scraped on 2026-10-29) covers Claude Desktop, Cursor and ChatGPT. It has **no Claude Code or VS Code** steps. Its Claude Desktop snippet puts `"url"` in `claude_desktop_config.json`, which this repo's own example says needs the `mcp-remote` bridge ("not verified here"). One tab says the snippet "gains **read/write access to your HelloGrowthCRM workspace**", which contradicts the page's own "read-only, no customer data". Those fixes belong to the **hellocrmwebsite** repo and its page-safety gate. They are recorded here, not made here.

**Taken from the research suite, not re-checked here:** 8 of 11 competitors document an official MCP; Attio runs `docs.attio.com/mcp`; Pipedrive says it is an official connector in the Claude and ChatGPT directories. Phase F re-verifies the directory facts before quoting them.

**Shared template.** The sibling repos (surhireswebsite_MCP, tasksiddhiwebsite_MCP, KanchanFlow_MCP …) are **not accessible** from this session. GitHub returned "access not enabled", so whether they share these files is UNVERIFIABLE. Phases A, B, C and D are written as template-shaped modules (`knowledge-index.ts`, `search-fetch.ts`, `profiles.ts`, a remote-only `server.json`) so they can be ported. **Recommendation:** ship and measure here first, then port with one PR per sibling repo, each with its own namespace and canonical host. This plan does not touch the siblings.

## 2. What changes

### 2.1 Registry listing (Phase A)

**Namespace recommendation: `com.hellogrowthcrm/knowledge`, via DNS proof.** Why:
- It names the brand, not the GitHub org. That is the same pattern monday uses (`com.monday/…`), the only CRM vendor already listed.
- It survives repo or org renames.
- DNS needs no website deploy. HTTP proof would add `/.well-known/mcp-registry-auth` to **hellogrowthcrm.com** (it returns 404 today), which means a website-repo PR.
- The private key never leaves the founder's machine.

`io.github.MeruLocal/…` is the fallback: one GitHub login, no DNS. But it ties the public identity to the org name and to whoever holds org membership. The old name was never published, so moving the name breaks no registry consumer. `/.well-known/mcp.json` follows `server.json` (§0a).

**Founder steps.** No one else can do these, and none is done by this plan:
1. On their own machine: `openssl genpkey -algorithm Ed25519 -out key.pem`. Keep `key.pem` private and never commit it.
2. Get the public key in the format `mcp-publisher` prints, then add a **TXT record on `hellogrowthcrm.com`**: `v=MCPv1; k=ed25519; p=<PUBLIC_KEY>`.
3. Install the `mcp-publisher` CLI from the `modelcontextprotocol/registry` releases. Then run `mcp-publisher login dns --domain hellogrowthcrm.com --private-key <hex private key>`.
4. From a checkout of `main` after Phase A merges **and the 0003 gate file exists**: run `mcp-publisher publish`.
5. Verify with `curl "https://registry.modelcontextprotocol.io/v0/servers?search=hellogrowthcrm"`.

For the GitHub fallback, steps 1–3 become `mcp-publisher login github`, run by a MeruLocal org member. **UNVERIFIABLE here:** whether the org membership must be public.

Before submission, the build runs `mcp-publisher validate` if the installed CLI has it. Otherwise it validates the file against the schema with any JSON Schema validator; this is a dev-only step and adds no dependency.

### 2.2 `search` + `fetch` (Phase B)

- **`search`** `{query: string 2..200}` returns `{results: [{id, title, url, snippet, as_of, kind}]}`.
  - At most 10 results, ranked by a deterministic lexical score (title > slug > description), with ties broken by `kind` order.
  - The same object is returned as `structuredContent` and as JSON text, because clients that predate structured output read the text.
  - `url` must start with `https://hellogrowthcrm.com/`; anything else is dropped and counted in a test.
  - `as_of` is the mirror's `SYNCED_AT` or the row's `published_at`/`updated_at`.
  - A query with no hits returns `results: []` plus the 0003 zero-result sentence ("does not mean the product lacks it").
- **`fetch`** `{id}` returns `{id, title, url, text, as_of, metadata: {kind, source_tool}}`. It dispatches to the existing `*_get` handler for that kind (`features_get`, `integrations_get`, `glossary_get_term`, `help_get_article`, `blog_get` …). An unknown id returns `isError` with "unknown id; call search first".
- **Index mechanics** (Sol, blocker 3):
  - *Mirror kinds* (features, products, integrations, pricing, comparisons, alternatives, switch guides, glossary, guides, templates, changelog, buyer intents): built once at start-up from the same exported arrays the tools read. These are bundled data, bounded by the mirror size, with no I/O. The id is `<kind>:<slug>`, where the slug is the key the matching `*_get` handler already accepts.
  - *Live kinds* (help, blog): **not pre-indexed.** `search` makes at most one call to the hardened `help_search` and one to `blog_search` per request, each with `limit: 5`, a 2-second timeout and no pagination. On a timeout or error, that kind is left out and `partial: true` is set. That bounds fan-out at two database reads per `search`, under the existing per-IP rate limiter.
  - *Ranking*: mirror hits are scored lexically. Live hits keep the order the handler returned and are merged after mirror hits that score higher. The result is capped at 10, and `snippet` at 300 characters.
  - *fetch*: parses `<kind>:<slug>` and calls only that kind's `*_get` handler. For help and blog, those handlers carry the B0b visibility predicate, so a guessed id for a draft or deleted row returns "unknown id". `text` is capped at 20,000 characters and marked `truncated: true` beyond that. A result that is stale against a later unpublish is impossible for live kinds, because `fetch` re-reads.
- **Reuse rule.** `knowledge-index.ts` imports the same exported data and functions the tools use, or calls `tool.handle()`. Index building does not read Supabase directly. Help and blog go through the hardened `help_search`/`blog_search` from Phase B0.
- **Shape compatibility.** The OpenAI documentation describes the search/fetch contract for knowledge and deep-research connectors. The exact required fields were **not re-read in this session (UNVERIFIABLE)**, so the build PR quotes that page with its date. It keeps `id/title/url` (search) and `id/title/text/url/metadata` (fetch) as the minimum, and treats `snippet`, `as_of` and `kind` as additive fields.
- **Annotations.** `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: true` (help and blog read a live database; this matches `blog_search`).

### 2.3 Website-operations tools (Phase C)

**Recommendation (a hypothesis, tested in §2.7, not a conclusion):** do not rename, move or gate them.
- Gating behind the bearer token would remove them from the public endpoint, which breaks the founder's additive rule.
- Renaming needs aliases, which double the list.

Instead:
- (a) Prefix the 20 governance descriptions so a model reading the list sees the audience.
- (b) Add opt-in `/mcp/knowledge` (57 knowledge tools + `search` + `fetch` + prompts + resources) and `/mcp/governance` (the 20).
- (c) Keep `/sse` and `/mcp` exactly as they are, plus the two new tools.

Which URL the directories get is a founder decision, recorded in §2.6. Renaming the server title away from "Website & Bot Governance" is identity text owned by 0003's Phase 1b.

### 2.4 `outputSchema` coverage (Phase D)

52 public tools lack a schema. Each new schema is written from an observed result (the file's own rule), in batches of about 10 by file group: bot governance, blog/help, content/pricing/features, seo/company/country, agents/glossary/templates/guides, alternatives/changelog/buyer/faqs/media/partners/solutions.
- A tool whose `ok()` payload is a string or array stays schema-less and is named in the test.
- **The target is "every object-returning public tool", not "77/77".** The final number is measured and reported in the build PR, not promised here.
- Annotations are already complete. Phase D only locks that in with a test.

### 2.5 Per-client setup docs (Phase E)

`examples/clients/` already has Claude Code, Cursor, VS Code and Claude Desktop (via `mcp-remote`). Phase E adds ChatGPT and Claude (custom connector), plus a "verified on / by" column. Menu paths are filled in only by a person who has just done the steps. A row without that verification is published as "not yet verified", never guessed.

The website page fixes from §1 go to the **hellocrmwebsite** owner as a separate PR: add Claude Code and VS Code, correct the Claude Desktop route, and remove "read/write access to your workspace".

### 2.6 Connector directories (Phase F; the owner submits)

| Directory | Requirements as known (source: 0003 strategy §3/§7, research of 2026-10-26; **not re-verified 2026-10-29**) | Status here | Owner steps |
|---|---|---|---|
| Claude connectors directory | Remote MCP over streamable HTTP; every tool has a `title` and read/write annotations; accurate, non-promotional descriptions that do not steer other tools; no auth is acceptable for public data; privacy policy and support contact | titles and annotations: done (verified live). Neutral descriptions: Phase C/F. Privacy/support URLs: UNVERIFIABLE whether the form needs MCP-host-specific URLs | Founder decides which URL to list (default or `/mcp/knowledge`). The owner fills the Anthropic submission form, using the pack's copy and the four test prompts from §2.7 |
| ChatGPT (apps/connectors submission) | No-auth servers supported; domain verification; privacy/ToS/support URLs; test cases (strategy: 5 positive + 3 negative); advertising and "demo" plugins rejected; fields that manipulate model choice rejected | `search`/`fetch`: Phase B. Domain verification: UNVERIFIABLE (method and host) | The owner creates the OpenAI submission, completes domain verification as the portal instructs, and supplies the test cases from the pack |

Risk: both may reject a brand-owned knowledge server as promotional. The pack frames it as a neutral CRM product-facts source, and states what it does not do.

### 2.7 Measurement (Phase G)

**Founder §45 query suite.** Four prompts. **Baseline (G0):** the default endpoint only, against today's live build, before any phase deploys. `/mcp/knowledge` does not exist yet, so it has no baseline. **After (G1):** the default endpoint again (before/after comparison) **and** `/mcp/knowledge` (the profile comparison against the post-B default, which tests the §2.3 hypothesis). Both runs record the build per §0a Phase G.

| # | Prompt | Correct answer must include |
|---|---|---|
| Q1 | "Find HelloGrowthCRM's integrations documentation" | a canonical `https://hellogrowthcrm.com/integrations…` URL and the live count from `integrations_list.public_integration_count` |
| Q2 | "Does HelloGrowthCRM support lead scoring?" | yes, with `https://hellogrowthcrm.com/product/ai-lead-scoring` (in `features.ts`) |
| Q3 | "Find HelloGrowthCRM pricing" | the country-aware plans from `pricing_get_country_plans` and the canonical pricing URL; no number from memory |
| Q4 | "HelloGrowthCRM manufacturing workflows" | the manufacturing industry or case-study entries (`content.ts` "Manufacturing") with a canonical URL, or the zero-result sentence. Never "not supported". |

For each run, record: **tool(s) chosen** (in order) · **correct** (yes / partial / no, against the "must include" column) · **canonical URL returned** · **latency** (per `tools/call`, measured by `query-suite.mjs`, and end-to-end, by hand) · **unnecessary calls** (calls that added nothing to the answer).
- The agent half is run by a person in Claude and ChatGPT and saved as raw text.
- The deterministic half (does `search` return the expected URL in the top 3?) runs in `query-suite.mjs` and can go in CI.
- **This is a hypothesis test for §2.3 and §2.2.** Four prompts cannot prove a general effect; they can disprove one.

**`tools/list` re-run.** `query-suite.mjs` snapshots `tools/list` from the live host before and after each deploy and diffs names, descriptions, `inputSchema`, `outputSchema` and annotations.

**Out of scope, deliberately:** no claim about Google rankings, AI Overviews, ChatGPT search citations or brand mentions. MCP helps connected-agent workflows only (skill §5c rule 1).

## 3. Affected files

See §0a. In total: one new endpoint family (`/mcp/knowledge`, `/mcp/governance`); two new tools (`search`, `fetch`); description edits on 20 tools; up to 52 new schema entries; and the `server.json`/`package.json`/`/.well-known/mcp.json` identity.

## 5. Blast radius and caller inventory

- **Backward.** Callers of `/sse` and `/mcp`, the only public tool endpoints:
  - Glama, MCP.so, LobeHub, mcpservers.org, MCP Market auto-listings, per the 0003 strategy §2.3.
  - Users' own client configs, following `examples/clients/*` and the website page.
  - `scripts/audit-live-mcp.mjs`, `scripts/geo-audit.sh`, `scripts/mcp-monitor.sh`, `test-mcp.mjs`, `test-tools.mjs`.

  Each keeps every tool name, argument and output. They gain two tools and some `outputSchema` fields. A client that strictly validates `structuredContent` gains validation it did not have before (see AC-05).
- **Forward.** `search`/`fetch` call existing handlers. No new network host or data source. Supabase reads go only through `help_search`/`blog_search` (hardened in B0).
- **Sideways.**
  - The website's `/agentic-ai/mcp` page (hellocrmwebsite) and its `/version` link: the public tool count changes from 77 to 79, and the page does not hard-code counts.
  - The tenant CRM MCP (`hellocrm` `crm-mcp-server`) is a different server and is untouched.
  - `smithery.yaml` carries no version and is untouched.
  - Research-suite ledger rows OPP-0042..0046 point at this PR.

## 6. Acceptance criteria

- **AC-01** — `server.json` passes registry schema validation. `name` = `package.json.mcpName` = `/.well-known/mcp.json.registry_name`. `npm run check:versions` is green with no `packages[]`.
- **AC-02** — After the founder publishes, the registry API search for `hellogrowthcrm` returns `com.hellogrowthcrm/knowledge` with the streamable-http remote `https://mcp.hellogrowthcrm.com/mcp`. **Owner-verified; not a CI check.**
- **AC-03** — `search {query:"lead scoring"}` returns `https://hellogrowthcrm.com/product/ai-lead-scoring` in the top 3, each result carries `id`, `title`, `url`, `snippet` and `as_of`, and `fetch {id}` round-trips every id that `search` returns for the fixture set.
- **AC-04** — `/mcp/knowledge` lists exactly the KNOWLEDGE set plus `search` and `fetch`, and `/mcp/governance` lists exactly the GOVERNANCE set. The two sets are disjoint and together cover every public tool.
- **AC-09** — Client connection: an SDK `Client` with `StreamableHTTPClientTransport` connects to the exact `remotes[0].url` from `server.json`, completes `initialize` and `tools/list`, and runs the 7b smoke against it. This is run against the deployed host before the founder publishes (Sol, missing).
- **AC-05** — Every tool with an `outputSchema` returns `structuredContent` that validates against it for every fixture call (in-memory SDK client). Annotations: 5/5 keys on every public tool.
- **AC-06 NEGATIVE** —
  - `search` never returns a URL outside `https://hellogrowthcrm.com/`.
  - A query containing PostgREST metacharacters (`x%,id.gt.0`) does not widen the result set or error with a database message.
  - `/mcp/knowledge` refuses `tools/call scan_website_bots` with `isError`.
  - No gated tool appears on any public path.
- **AC-07 REGRESSION** (narrowed per Sol, blocker 5) — For the 77 tool names in `raw/mcp-tools/hellogrowthcrm/2026-10-29/tools-list.json`:
  - each still exists on `/sse` with an identical `name`, `inputSchema` and annotations;
  - no tool is renamed or removed; a deprecation, if ever needed, keeps the old name as an alias, and a test pins it;
  - for **mirror-backed tools**, the handler output for pinned arguments is byte-identical to a fixture recorded from `main` before Phase B. Mirror data is bundled, so this is deterministic;
  - for **live tools** (blog, help, newsletter stats, the network-fetching governance tools), the response **shape** is unchanged, checked against mocked Supabase or HTTP fixtures. No live call is made in CI;
  - descriptions of the 20 governance tools change by design and are excluded.
- **AC-08** — The §2.7 table is filed twice under `docs/evidence/query-suite-<date>/`, baseline and after, with all five columns filled or marked BLOCKED with the reason.

## 7b. Smoke test — Expected only

Env: a local `npm run dev`, then the deployed host after each deploy. No login (anonymous).

| # | Action | Expected |
|---|---|---|
| 1 ⭐ | `npx @modelcontextprotocol/inspector --cli <host>/mcp --transport http --method tools/list` | 79 tools, including `search` and `fetch` **(new)** |
| 2 ⭐ | `tools/call search {"query":"pricing"}` | top result URL begins `https://hellogrowthcrm.com/pricing`, with `as_of` set **(new)** |
| 3 | `tools/call fetch {"id":"<first id from #2>"}` | `text` non-empty; `url` equal to the one from #2 **(new)** |
| 4 | `tools/list` on `<host>/mcp/knowledge` | no `scan_website_bots`; has `pricing_get_plans` **(new)** |
| 5 NEGATIVE | `tools/call scan_website_bots {}` on `/mcp/knowledge` | `isError: true`, "not available on this profile" **(new)** |
| 6 REGRESSION | `tools/call pricing_get_plans {}` on `/sse` | text identical to the 2026-10-29 baseline fixture |
| 7 | `curl <host>/.well-known/mcp.json` | `registry_name: "com.hellogrowthcrm/knowledge"` (after Phase A) |

## 7f. Compatibility test

- **Fixtures:** `test-data/fixtures/tools-list-2026-10-29.json`, a copy of the research-suite raw file, pins names, `inputSchema` and annotations. `test-data/fixtures/mirror-outputs/<tool>.json` records, for every mirror-backed tool, its pinned arguments and its `content[0].text` captured from `main` before Phase B.
- **Live tools:** run against mocked Supabase or HTTP responses and compared by shape only.
- **Tests:** a test asserts AC-07. Schema tests (AC-05) use the same mocks, so CI never reaches Supabase or the network. Strictly validating clients are covered by AC-05.

## 8. Phases, order and effort

| Phase | PR | Depends on | Tokens (est., build + review) | Model |
|---|---|---|---|---|
| G0 baseline | measurement only (`query-suite.mjs` + baseline evidence) | none | ~60k | Haiku/Sonnet |
| B0 | search filter escaping (security) | none | ~40k | Sonnet |
| B | `search` + `fetch` (2.3.0 minor) | B0; rebase on #103 if merged | ~250k | Sonnet |
| C | profiles + governance descriptions | B | ~150k | Sonnet |
| D | `outputSchema`, 5–6 batches of about 10 tools. **Deferred** (Sol, CUT) until after G1 shows whether `search`/`fetch` changes agent behaviour. The first batch is the tools the query suite touches (`features_get`, `integrations_get`, `pricing_compare_plans`, `buyer_find_answer_pages`, `help_search`, `blog_search`) | G1 | ~350k total | Sonnet |
| E | client docs | B (ChatGPT needs search/fetch) | ~50k | Sonnet |
| A | registry `server.json` + identity derivation | 0003 gate file + 0003 Phase 1b | ~60k | Sonnet |
| — | **founder** DNS TXT + `mcp-publisher publish` | A merged and deployed | — | human |
| F | directory pack; **owner** submits. Submission waits (Sol, CUT) until the endpoint, the B0b visibility rule and the G1 measurement are verified | A published, B0b+B deployed, G1 filed | ~60k | Fable for copy, Sonnet for checks |
| G1 | after-measurement + `tools/list` diff | B, C, D deployed | ~60k | Sonnet |

Total build is roughly 1.1M tokens across about 11 PRs, plus Sol review at about 15k tokens per plan revision. This plan run used roughly 250k.

## 9. Rollback

- Every phase is its own PR and is reverted on its own; nothing here migrates data.
- **B:** before any directory lists `search`/`fetch`, revert the PR. After a listing, keep the tools and fix forward, because removing them would break listed clients.
- **C:** before any client config or directory submission names `/mcp/knowledge`, removing the route is a revert. **After** that, the route is a public contract (Sol): keep it and fix forward, or make it serve the full list (a superset, so nothing breaks). Never return 404. Description edits revert as text.
- **D:** a wrong schema is removed from `TOOL_OUTPUT_SCHEMAS`. Absence is the honest state.
- **A:** a published registry version cannot be overwritten. Roll forward with a new version. Whether the CLI can mark a version deprecated or deleted is **UNVERIFIABLE here**; check `mcp-publisher --help` at publish time. The DNS TXT record can stay, since it grants only namespace ownership.
- **Deploy:** obeys the 0003 release invariant. The rollback target is the last image with verified G1–G5.

## 10. Review record

- **Reviewers:** Sol (`gpt-6-sol`) via `ask-sol.mjs --role plan`. Egress scan: CLEAN. Payload sha `30fc07351bd964cb`, 2026-10-29T13:37Z. A **blind second reviewer** (Astra or a fresh Claude) is owed at T2 before the first BUILD PR merges; it was not run in this PLAN PR.

| Sol finding (rev 1, verdict **REJECT**) | Disposition in rev 2 |
|---|---|
| B1 `/sse` transport vs "streamable-http" | **Accepted, with evidence.** Live POST `initialize` to `/sse` and `/mcp` both returned `200 text/event-stream` with a JSON-RPC result on 2026-10-29. That is a Streamable HTTP response, from one handler. `server.json` now declares `/mcp` (§0a A), and AC-09 adds a real client connection test. |
| B2 visibility "only if drafts exist" | **Accepted.** B0b enforces a published/not-deleted predicate unconditionally, tested with private fixture rows. |
| B3 index contract unimplementable for live data | **Accepted.** §2.2 "Index mechanics": live kinds are not pre-indexed; bounded fan-out (2 reads, limit 5, 2 s timeout); `fetch` re-reads through the visibility-checked `*_get`. |
| B4 freeze does not cover B/C deploys | **Accepted.** The header freeze now blocks the public deploy of B and C until the 0003 gate file exists. |
| B5 byte-identical outputs not provable from a tools/list capture | **Accepted.** AC-07 is narrowed: byte-identical for bundled-mirror tools with pinned arguments, shape-only with mocks for live tools; §7f fixtures defined. |
| Risk: Supabase fan-out, CI hitting externals | **Accepted.** Bounded in §2.2; mocks in §7f. |
| Risk: profile leakage | **Accepted.** Profile bound per session like `authorized`; privileged filter applied first (§0a C). |
| Risk: version string vs image | **Accepted.** `query-suite.mjs` records `/version`, `/health` and `serverInfo` for each snapshot. |
| Risk: removing a published route | **Accepted.** §9 C. |
| Missing: `/mcp/knowledge` baseline | **Accepted.** §2.7 separates the G0 default baseline from the G1 profile comparison. |
| Missing: client connection test | **Accepted.** AC-09. |
| CUT: defer the 52-schema campaign | **Accepted in part.** Phase D waits for G1, except a first batch of the six tools the query suite uses. |
| CUT: defer `/mcp/governance` | **Accepted.** Only `/mcp/knowledge` is routed; the GOVERNANCE set exists only for the partition test and the descriptions. |
| CUT: defer directory submissions | **Accepted.** Phase F submission waits for B0b, B and G1. |

- **Reconciliation:** every Sol finding was accepted; none was rejected. Rev 2 has not been re-sent to Sol, and the blind reviewer is still owed.
- **What left the machine (G9b):** rev 1 of this plan only. The egress scan was clean; it contained no customer data, keys or tenant ids.
- **Founder/owner decisions owed:**
  1. Namespace: `com.hellogrowthcrm` via DNS (recommended) or `io.github.MeruLocal`.
  2. Which endpoint the directories list (default `/mcp` or `/mcp/knowledge`).
  3. Whether npm is ever published (a 0003 decision; a remote-only listing does not need it).
  4. Approval to submit to the Claude and ChatGPT directories.

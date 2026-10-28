# Plan — MCP: be found and answer correctly (LLM visibility strategy and phase 1)

- **Plan id:** PLAN-HELLOG-0003
- **Branch:** plan/hellog-0003-mcp-llm-visibility-phase-1 · **Repo:** MeruLocal/HelloGrowthCRMwebsite_MCP · **Trunk:** main (verified `origin/main` b9be7a7 = 2.1.0)
- **Mode:** PLAN (this PR) · BUILD follows as a second PR that says `Implements: PLAN-HELLOG-0003`
- **Change tags:** public_api (tool outputs and the `initialize` response change shape)
- **Tier:** T2 — first reviewer, fold, second reviewer blind; no human sign-off owed at T2, but several items below need the founder (section 10)
- **Reviewers selected:** sol, then claude (a fresh Claude subagent standing in for "Fable"; the founder asked for Fable in place of Astra on the earlier MCP plan)
- **Owed (from workflow.mjs obligations, BUILD · public_api):** acceptance_criteria · blast_radius · caller_inventory · compatibility_test · intent · necessary_changes · planned_file_coverage · premise_check · smoke_test
- **Restricted areas touched (G2):** none
- **Freeze in force?** none recorded; main has been merged on 2026-10-27 after a 6-week gap
- **Date:** 2026-10-28
- **Companion document:** `docs/MCP_LLM_VISIBILITY_STRATEGY_2026-10-28.md` (the detailed writeup; this plan scopes phase 1 of it)

> Founder instruction (verbatim, 2026-10-26): "make up pr on what we should in mcp make a very detailed writeup on what we can have in mcp so that we can get better llm search visiblity first make a pan on what you would do check with reviewerss and then work on that do a pr in mcp"

## 0. Intent

- **Claim** — The public MCP server at `mcp.hellogrowthcrm.com` is meant to help AI assistants find and correctly describe HelloGrowthCRM, especially to buyers outside India. Measured against 160 realistic buyer prompts it does not: 24–32 % unambiguous tool choice, 3–8 % complete answers, 10–20 % of called answers wrong, 35–50 % empty. Six directories list it under the wrong identity. The strategy writeup says what a good server would be; this plan scopes the first, safe, additive step.
- **Mechanism** — Phase 1 (the build): (a) server `instructions` + a `get_started` tool that route an assistant; (b) zero-result guidance so a silent `total: 0` is never read as "we do not have it"; (c) a paged, shipped-only default for `integrations_list` (386 KB today); (d) correct served content that contradicts what code verified (SOC 2 as fact, Tally sync, Paytm/PayU/Cashfree, "unlimited pipelines", "scheduled reports") through an override layer that survives the website sync, plus a CI `truth-guard` that fails if any known-false claim is served; (e) repo identity files (README H1, descriptions, `server.json`) and a registry submission pack; (f) a golden-prompt evaluation dataset and a manual live runner. Release is gated on the safety fixes in section 0c. Everything else (new answer tools, profile split, registry submissions) is later phases that need founder decisions.
- **Observable** — An assistant connecting to the 2.2.0 server gets routing instructions at `initialize`; `get_started` states what the server is and is not; a search that finds nothing returns "no entry found — this does not mean the product lacks it" with the next tool to try; `integrations_list` returns a first page with counts; and none of the listed false claims can appear in any tool output. A maintainer can run one command and see the prompt-coverage table.
- **Risk** — Output shapes change for every client of two list tools; the new `instructions` text could be read as manipulative if worded badly (Anthropic and OpenAI reject that); content overrides could hide something true; a truth-guard that is too broad blocks legitimate edits. Mitigations in sections 5–8.

## 0a. Necessary changes   (read by planned-file coverage)

- [ ] `src/server.ts` — return `instructions` from the server info on `initialize`
- [ ] `src/server-info.ts` — the instructions text and `version` 2.2.0
- [ ] `src/tools/get-started.ts` — new tool `get_started`
- [ ] `src/tools/index.ts` and `src/tools/titles.ts` and `src/tools/annotations.ts` — register the tool with a title and read-only annotations
- [ ] `src/tools/guidance.ts` — shared `zeroResult()` helper (`matched:false`, `not_a_denial`, `did_you_mean`, `suggested_tools`)
- [ ] `src/tools/features.ts`, `src/tools/integrations.ts`, `src/tools/help.ts` — use the helper; `integrations_list` gets `limit`, `offset`, `status` (default `live`), `counts`
- [ ] `src/data/claim-overrides.ts` — slug-keyed overrides applied at read time (so a website sync cannot undo them), each citing a known-truth id
- [ ] `src/data/deny-claims.ts` — the deny list used by the guard (id, pattern, known-truth id, note)
- [ ] `src/tools/pricing.ts`, `src/tools/faqs.ts`, `src/tools/alternatives.ts`, `src/data/website-mirror.ts` — remove or reword the false claims in hand-written content
- [ ] `src/tools/__tests__/truth-guard.test.ts` — runs every read-only tool with default and probe arguments and scans the output
- [ ] `src/tools/__tests__/routing-and-guidance.test.ts` — instructions, `get_started`, zero-result and paging tests
- [ ] `src/eval/prompts.json` and `src/eval/__tests__/prompt-coverage.test.ts` — 160 golden prompts and the deterministic coverage check
- [ ] `scripts/eval-live.mjs` — optional live runner (network, not CI)
- [ ] `README.md`, `package.json`, `server.json`, `smithery.yaml` — identity text only (no package rename)
- [ ] `docs/DISTRIBUTION_PACK.md` — corrected listing copy per directory, prerequisites, claims to avoid
- [ ] `CHANGELOG.md` — 2.2.0 entry (also covers the changed `integrations_list` default)

## 0b. What we already know   (G4)

| Source | What it said | What this plan does about it |
|---|---|---|
| `docs/plans/GEO_AEO_MASTER_PLAN.md` (2026-08-05) | An MCP server is product distribution, not organic answer ranking; a 26-directory campaign is "theatre"; telemetry must be verified before MCP is called an acquisition channel | Adopted as the framing; no paid placements; telemetry gate kept in the roadmap |
| PLAN-HELLOG-0002 (#98, closed; 4 REJECTs) | A large "publication gate" design (decision records, frozen schemas, allowed-delta manifests) was rejected | **Not repeated.** This plan uses a plain override file and a CI deny list; no approval workflow |
| Merge-train review 2026-10-28 | 6 PRs open; main = 2.1.0; live = 2.0.0; closure comments on #76/#79/#81/#32 were wrong, so instructions/`get_started`/UTM/paging, CORS/Accept tolerance and the safety fixes G1–G4 are not on main | Phase 1 re-extracts only the visibility items (G6) and leaves G1–G5 safety/CORS to separate PRs, named below |
| Registry presence check 2026-10-26 | 6 of 60 listed, wrong identity on 4, `/mcp` 404 at the time | Identity files + submission pack; humans submit |
| Product truth audit (KT-1..19; 2,401 claims re-graded; Verdict_Overrides) | Lists the claims that are false in code | Source for the deny list; each entry carries its KT id |
| Lessons corpus | `lessons.mjs brief` read recorded below as a result, not an absence of risk | see section 12 |

## 0c. Release gate and sequencing   (added after review 1)

The visibility work makes an anonymous public server easier to find, so **it must not be deployed or submitted to any directory while the known safety gaps are live**. Order, each step its own PR and deploy:

1. **Phase 0 - safety (separate PRs, small first):** G1 `analytics_social_proof` returns counts only; G2 `robotsTxtPath` refused for public callers and `err.message` not echoed. G3 SSRF rebinding, G4 transport hardening and G5 CORS/Accept follow, each needing host configuration.
2. **Phase 1 - this plan's build (2.2.0):** may be MERGED to main once reviewed, but **the 2.2.0 deploy and every directory submission wait for G1 and G2 to be deployed and verified** on the live host (`tools/call analytics_social_proof` returns only counts; `list_allowed_bots` with `robotsTxtPath` is refused). G3-G5 must at least be planned with owners before any directory submission.
3. **Phase 3 - submissions (humans)** only after 1 and 2.

This plan does not implement Phase 0; it blocks on it.

## 1. Premise   (G8 — evidence by claim type)

| Claim | Type | Evidence gathered | Running system? |
|---|---|---|---|
| Assistants pick the right tool and get a true, complete answer too rarely | missing_feature + integration | Two independent runs of 80 prompts each against the live server (assistant simulated from the tool list only); 80 real read-only calls; results in `docs/evidence/mcp-visibility-2026-10-26/R4a_summary.md`, `R4b_summary.md` | yes (live, 2026-10-26) |
| False claims are still served on `main` | documentation | `git grep` on `origin/main` b9be7a7: `website-mirror.ts:33,314,322`, `faqs.ts:65`, `integrations.ts:267,278,814,815`, `alternatives.ts:854..1212`, `pricing.ts:76,118,219`; known truths cite the code that contradicts each | not required (static) |
| Directory listings misdescribe the server | integration | listing pages and registry API queried 2026-10-26 | yes (public web) |
| Directory discovery, not open-registry listing, is what surfaces a server inside an assistant | documentation | Anthropic and OpenAI docs (R1, with URLs and dates) | not required |
| A brand MCP server changes what assistants say about the company | — | **No evidence found.** Treated as unproven; the plan does not claim it | — |
Limits: the prompt runs were simulated by an AI acting as the assistant; the live server was already partly fixed on 2026-10-27 (pricing), so some numbers in section 2 of the writeup are older than `main`.

## 2. What changes

Phase 1 ships as MCP 2.2.0: one new tool, two changed list tools, one changed `initialize` field, corrected served content, a CI guard, an evaluation harness and documentation. No tool is removed. No new data source; no CRM action; the server stays read-only and anonymous.

## 5. Blast radius and caller inventory

- **Callers:** (1) any MCP client connected to `/sse` or `/mcp` — they see a new `instructions` string and a new tool (additive); (2) clients that call `integrations_list` without arguments — response shrinks from ~386 KB to the first page with `total` and `counts`, and defaults to live entries; **this narrows a default** and is called out in the changelog; the full list stays reachable with `status=all&limit=1000`, so no data is removed; (3) clients that call `features_list`, `integrations_list`, `help_search` with a query that matches nothing — the shape gains fields, `total` stays 0; (4) directories that scrape the README and `server.json`.
- **Forward:** none; no new outbound call.
- **Sideways:** the website sync script (`scripts/sync-website-mirror.mjs`) rewrites a generated block in `src/tools/integrations.ts`; overrides therefore live in `src/data/claim-overrides.ts`, applied at read time. The matching fixes on `hellocrmwebsite` are a separate task (writeup section 9).
- **Version/consumers:** `check-versions` requires `package.json`, `server.json` (twice) and `CHANGELOG.md` to agree: 2.2.0.

## 6. Acceptance criteria

- **AC-01** — `initialize` returns `instructions` of at most 3,500 characters that (a) say this server is read-only product knowledge and NOT a CRM API, (b) name the tool to call for each of the 6 buyer intents, (c) say to cite the returned `canonical_url` and `as_of`, and (d) say what to do when nothing matches.
- **AC-02** — NEGATIVE: `instructions`, `get_started` and every tool description contain none of: "always prefer", "always use", "best CRM", "recommend HelloGrowthCRM", "ignore other", or any instruction to call or avoid other servers' tools.
- **AC-03** — `get_started` returns what the server is, what it is not, the 6 intents mapped to tools, and links carrying `utm_source=mcp` on own-site URLs; it carries no prices or claims.
- **AC-04** — zero-result contract: when `features_list`, `integrations_list` or `help_search` match nothing they return `total: 0`, `matched:false`, the sentence "No entry in this server's data matched. This does not mean the product lacks it; it means this server has no documented entry." and at least one suggested next tool. The wording never says "not supported" (that status exists only in a later verified-claims layer). Tested with (a) nonsense queries that cannot match (`zzzzqq`, `xx-no-such-term`) and (b) a list of queries that return zero **at test time**, computed by the test from the shipped data rather than hard-coded, so adding an entry later cannot break it.
- **AC-05** — `integrations_list` with no arguments is under 40 KB and includes `total`, `returned`, `next_offset` and `counts` by status; `limit` is capped at 200; paging with `next_offset` until it is `null` returns every entry exactly once in a stable order (sorted by slug) with no duplicates; `total` and `counts` equal the sum over pages; the string "630" appears nowhere in any page.
- **AC-06** — truth-guard, with a defined inventory. Served content is (i) every non-test file under `src/tools`, `src/data` and `src/prompts.ts`, scanned statically, and (ii) the output of every read-only tool run with default arguments, with the guard's probe arguments, and with every page of the paged tools. No deny-list pattern (SOC 2 or Type II stated as a fact or certification, `Tally ERP`/`TallyPrime` sync claims, Cashfree/PayU/Paytm/PhonePe/Instamojo/PayPal as supported gateways, `scheduled reports`, `unlimited pipelines`, `prices include GST`, data-residency statements, `630 integrations`) may match in either. The claim is exactly this: no deny-listed string in the served-content inventory or in tested outputs; it does not cover untested arguments. The guard is itself tested (inject a deny-listed string into a source file and into a tool output; both must fail the test), and a new tool must be registered in the inventory or the test fails.
- **AC-07** — REGRESSION: the existing test suite passes unchanged except for tests that asserted the removed false strings; every tool still has a `title` and read-only annotations; tool count = previous + 1; `npm run check:versions` passes.
- **AC-08** — identity: the README H1 is not `mcp-bot-crawler`; `package.json`/`server.json`/`smithery.yaml` descriptions describe product knowledge for AI assistants and none says the server gives access to a customer's CRM data.
- **AC-09** — the golden-prompt dataset (160 prompts, 13 groups, expected tools and must/must-not facts) is committed as `src/eval/prompts.json` with a schema test. It is an **evaluation dataset, not a quality gate**: description-word matching can pass while answers are wrong, so only executable-output tests (AC-04, AC-05, AC-06, AC-10, AC-11) gate the build. `scripts/eval-live.mjs` records, for each prompt, the tools an assistant actually called and the accuracy of the answer; it needs a model and a network, runs manually, and its first results are attached to the build PR as evidence, not as a pass criterion.
- **AC-10** — OVERRIDE SAFETY and precedence: overrides always win over synced content. A test regenerates the integrations block through `scripts/sync-website-mirror.mjs` against a fixture whose entries carry the denied statuses (Paytm/PayU `live`, Tally sync text) and proves the served output still shows the override; another injects an unrelated entry and proves it is unchanged; each override cites a known-truth id and has an expiry note ("remove when KT-x is superseded").
- **AC-11** — COMPATIBILITY, documented as a breaking default: the 2.2.0 default `integrations_list` call returns only live entries, capped at the default page, in slug order; this is recorded in `CHANGELOG.md` under "Changed (breaking default)" with the exact migration (`status=all` and paging). The compatibility test proves: every slug in the recorded 2.1.0 response appears in the full paged 2.2.0 traversal; ordering is stable between two calls; no duplicate across pages.
- **AC-12** — DEPLOY AND ROLLBACK: the build PR carries the deploy checklist: live `/version` before (2.0.0 or 2.1.0) and after (2.2.0); rollback is a redeploy of the previous image tag, verified by `/version`; there is no schema or data migration, so rollback is complete. Old clients tolerate the change because all new fields are additive and the narrowed `integrations_list` default is documented.

## 7b. Smoke test — Expected only

Env: local build (`npm run build && node dist/index.js`, HTTP mode on port 3001) for steps 1-8, then the same script against the deployed host (`https://mcp.hellogrowthcrm.com`) after the deploy · Login: none (anonymous) · Role: anonymous. Literal values marked **(new)** are fixed at BUILD from the shipped strings.

| # | Action | Expected |
|---|---|---|
| 1 ⭐ | Run `node scripts/smoke-phase1.mjs <base-url>` (new): POST `initialize` to `<base>/sse` with headers `Content-Type: application/json` and `Accept: application/json, text/event-stream`, protocolVersion `2025-06-18`; read the `mcp-session-id` response header; send `notifications/initialized` with that header | result has `instructions` starting "This server is read-only product knowledge" **(new)** and `serverInfo.version` `2.2.0`; the script repeats the same handshake against `<base>/mcp` |
| 2 ⭐ | `tools/list` with the session header | `get_started` present with a `title`; every tool has `annotations.readOnlyHint` true |
| 3 ⭐ | `tools/call get_started {}` | `intents` has 6 entries; every own-site URL contains `utm_source=mcp` **(new)** |
| 4 NEGATIVE | `tools/call features_list {search:"sso"}` | `total: 0`, `matched:false`, text contains "does not mean the product lacks it" **(new)** |
| 5 | `tools/call integrations_list {}` | response under 40 KB; `counts` object present; no "630" |
| 6 | page `integrations_list {status:"all"}` with `next_offset` until null | the sum of `returned` equals `total`; no duplicate slug |
| 7 REGRESSION | `tools/call pricing_get_plans {region:"india"}` | contains `899` and not `1,099` (unchanged from 2.1.0) |
| 8 REGRESSION | `GET /health`, `GET /version`, `GET /.well-known/mcp.json` | 200 on all three; version 2.2.0 |

## 7f. Compatibility test

A fixture records the 2.1.0 `integrations_list` default response. The test asserts: every slug in it appears in the 2.2.0 full traversal (`status=all`, paged); the 2.2.0 default's entries are a subset of the full traversal; ordering is identical across two calls; pages do not overlap; `total` and `counts` are consistent. The narrowed default is a documented breaking default (AC-11), not a silent one. `limit` is capped at 200, so completeness is by traversal, not by one large call.

## 9. What this deliberately does NOT do

- No tool removal, no profile split, no new answer tools (`capability_check`, `buyer_get_industry_fit`, `buyer_compare`, `trust_get_compliance`, `implementation_get_playbook`, `pricing_estimate`) — they need founder decisions and the #95/#96 merge (writeup sections 5, 10).
- No registry submission, no npm publish, no package rename, no purchase — humans do those (`docs/DISTRIBUTION_PACK.md` prepares them).
- No security fixes G1–G5 in this PR (`analytics_social_proof` emails, `robotsTxtPath` read, SSRF rebinding, transport hardening, CORS/Accept). They are a **release precondition** (section 0c) and get their own PRs so each stays reviewable.
- No claim that the MCP raises search visibility. The writeup says it is a distribution and answer-quality channel.
- No change to pricing values or to any figure not on the deny list; no decision on SOC 2 wording beyond removing it as an asserted fact (founder decision, section 10).
- No website changes; those are listed in writeup section 9.

## 10. Review record   (filled at P2)

- **Reviewers selected:** sol → claude (blind second)
| Reviewer | Plan version | Verdict | Accepted | Rejected, and why |
|---|---|---|---|---|
| — | — | — | — | — |
- **Reconciliation:** pending.
- **Human approval:** not required at T2. **Founder decisions** this plan surfaces: (1) SOC 2 wording — remove as fact now (this plan) and decide the final sentence; (2) split bot-governance tools into their own profile; (3) npm name; (4) which directories to submit to and the neutral framing for Claude/ChatGPT; (5) annual USD price and local-currency prices; (6) public-roadmap policy.
- **What left the machine (G9b):** nothing yet.

## 11. Registration

Not a CRM-registry change. This repo's analogue: the new tool is registered in `src/tools/index.ts`, `titles.ts` and `annotations.ts` and counted in `registry.test.ts`.

## 12. Learning brief read

`lessons.mjs brief` for this repo and topic returned no matching lesson; recorded as "no applicable lesson in the corpus", not as an absence of risk. The relevant history was read from the repo (GEO plan, merge-train review, PLAN-HELLOG-0002).

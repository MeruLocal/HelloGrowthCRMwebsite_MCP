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
- **Mechanism** — Phase 1 (the build): (a) server `instructions` + a `get_started` tool that route an assistant; (b) zero-result guidance so a silent `total: 0` is never read as "we do not have it"; (c) a paged, shipped-only default for `integrations_list` (386 KB today); (d) correct served content that contradicts what code verified (SOC 2 as fact, Tally sync, Paytm/PayU/Cashfree, "unlimited pipelines", "scheduled reports") through an override layer that survives the website sync, plus a CI `truth-guard` that fails if any known-false claim is served; (e) repo identity files (README H1, descriptions, `server.json`) and a registry submission pack; (f) a golden-prompt evaluation harness. Everything else (new answer tools, profile split, registry submissions) is later phases that need founder decisions.
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
- **AC-04** — for each of 10 probe queries (`sso`, `payroll`, `instagram`, `e-invoice`, `insurance`, `transcription`, `scheduled report`, `mfa`, `tally`, `zzzzqq`) `features_list`, `integrations_list` and `help_search` return `total: 0` with `matched:false`, the sentence "no entry found — this does not mean the product lacks it", and at least one suggested next tool.
- **AC-05** — `integrations_list` with no arguments is under 40 KB and includes `total`, `returned`, `next_offset` and `counts` by status; `status=all&limit=1000` returns every entry; the string "630" appears nowhere in the response.
- **AC-06** — truth-guard: running every read-only tool with default and probe arguments yields no match for any deny-list pattern (SOC 2 or Type II stated as a fact or certification, "Tally ERP" or "TallyPrime" sync claims, Cashfree/PayU/Paytm/PhonePe/Instamojo/PayPal as supported gateways, "scheduled reports", "unlimited pipelines", "prices include GST", "data residency" statements, "630 integrations"). The guard itself is tested: injecting a deny-listed string into a tool output makes the test fail.
- **AC-07** — REGRESSION: the existing test suite passes unchanged except for tests that asserted the removed false strings; every tool still has a `title` and read-only annotations; tool count = previous + 1; `npm run check:versions` passes.
- **AC-08** — identity: the README H1 is not `mcp-bot-crawler`; `package.json`/`server.json`/`smithery.yaml` descriptions describe product knowledge for AI assistants and none says the server gives access to a customer's CRM data.
- **AC-09** — the evaluation fixtures hold 160 prompts across the 13 groups; the deterministic test fails if any group has no tool whose description contains its intent words, or if any prompt's expected tool does not exist.
- **AC-10** — OVERRIDE SAFETY: a unit test applies `claim-overrides` to the generated integrations block with an injected extra entry and proves unrelated entries are unchanged and each override cites a known-truth id.

## 7b. Smoke test — Expected only

Env: local build (`npm run build && node dist/index.js`, HTTP mode on port 3001) · Login: none (anonymous) · Role: anonymous. Literal values marked **(new)** are fixed at BUILD from the shipped strings.

| # | Action | Expected |
|---|---|---|
| 1 ⭐ | POST `initialize` to `/sse` | result contains `instructions` starting "This server is read-only product knowledge" **(new)** and `serverInfo.version` `2.2.0` |
| 2 ⭐ | `tools/list` | `get_started` present with a `title`; every tool has `annotations.readOnlyHint` true |
| 3 ⭐ | `tools/call get_started {}` | `intents` has 6 entries; every own-site URL contains `utm_source=mcp` **(new)** |
| 4 NEGATIVE | `tools/call features_list {search:"sso"}` | `total: 0`, `matched:false`, text contains "does not mean the product lacks it" **(new)** |
| 5 | `tools/call integrations_list {}` | response under 40 KB; `counts` object present; no "630" |
| 6 | `tools/call integrations_list {status:"all",limit:1000}` | `returned` equals `total` |
| 7 REGRESSION | `tools/call pricing_get_plans {region:"india"}` | contains `899` and not `1,099` (unchanged from 2.1.0) |
| 8 REGRESSION | `GET /health`, `GET /version`, `GET /.well-known/mcp.json` | 200 on all three; version 2.2.0 |

## 7f. Compatibility test

A fixture pair is recorded: the 2.1.0 `integrations_list` default response and the 2.2.0 `status=all&limit=1000` response; the test asserts every entry slug in the old response appears in the new full response (nothing removed), and the 2.2.0 default's entries are a subset of it.

## 9. What this deliberately does NOT do

- No tool removal, no profile split, no new answer tools (`capability_check`, `buyer_get_industry_fit`, `buyer_compare`, `trust_get_compliance`, `implementation_get_playbook`, `pricing_estimate`) — they need founder decisions and the #95/#96 merge (writeup sections 5, 10).
- No registry submission, no npm publish, no package rename, no purchase — humans do those (`docs/DISTRIBUTION_PACK.md` prepares them).
- No security fixes G1–G5 (`analytics_social_proof` emails, `robotsTxtPath` read, SSRF rebinding, transport hardening, CORS/Accept). They are urgent and independent; they get their own PR so this one stays reviewable.
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

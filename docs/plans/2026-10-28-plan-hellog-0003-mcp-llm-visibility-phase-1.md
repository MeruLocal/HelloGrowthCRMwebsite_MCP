# Plan — MCP: be found and answer correctly (LLM visibility strategy and phase 1)

- **Plan id:** PLAN-HELLOG-0003 (revision 5, after four reviews)
- **Branch:** plan/hellog-0003-mcp-llm-visibility-phase-1 · **Repo:** MeruLocal/HelloGrowthCRMwebsite_MCP · **Trunk:** main (verified `origin/main` b9be7a7 = 2.1.0)
- **Mode:** PLAN (this PR) · BUILD follows as a second PR that says `Implements: PLAN-HELLOG-0003`
- **Change tags:** public_api (tool outputs and the `initialize` response change shape)
- **Tier:** T2 — first reviewer, fold, second reviewer blind; no human sign-off owed at T2. Founder decisions that do NOT block phase 1 are listed in section 10; none blocks it.
- **Reviewers selected:** sol, then claude (a fresh Claude subagent standing in for "Fable", as the founder asked for Fable in place of Astra on the earlier MCP plan)
- **Owed (workflow.mjs obligations, BUILD · public_api):** acceptance_criteria · blast_radius · caller_inventory · compatibility_test · intent · necessary_changes · planned_file_coverage · premise_check · smoke_test
- **Restricted areas touched (G2):** none
- **Freeze in force?** none recorded
- **Date:** 2026-10-28
- **Companion document:** `docs/MCP_LLM_VISIBILITY_STRATEGY_2026-10-28.md` (the detailed writeup; this plan scopes phase 1 of it). Evidence: `docs/evidence/mcp-visibility-2026-10-26/`.

> Founder instruction (verbatim, 2026-10-26): "make up pr on what we should in mcp make a very detailed writeup on what we can have in mcp so that we can get better llm search visiblity first make a pan on what you would do check with reviewerss and then work on that do a pr in mcp"

## 0. Intent

- **Claim** — The public MCP server at `mcp.hellogrowthcrm.com` is meant to help AI assistants find and correctly describe HelloGrowthCRM, especially to buyers outside India. Measured against 160 realistic buyer prompts it does not: 24–32 % unambiguous tool choice, 3–8 % complete answers, 10–20 % of called answers wrong, 35–50 % empty. Six directories list it, four under the wrong identity. The writeup says what a good server would be; this plan scopes the first, safe, additive step.
- **Mechanism** — Phase 1 (the build, MCP 2.2.0), **code only; no identity text and no `/.well-known/mcp.json` change**: (a) server `instructions` plus a `get_started` tool that route an assistant; (b) a zero-result contract that never reads "no entry" as "not supported" and an explicit `not_available` status for items the audit proved the product lacks; (c) a paged, live-only default for `integrations_list` (386 KB today); (d) corrected served content through an override layer that survives the website sync, plus a CI `truth-guard`; (e) nothing else: the prompt dataset waits for a runner. Everything registry-facing (README H1, `server.json`/`smithery.yaml` descriptions, the submission pack) ships in a **follow-up PR after the safety gate** (section 0c). New answer tools, the profile split and submissions are later phases.
- **Observable** — An assistant connecting to the 2.2.0 server gets routing instructions at `initialize` and the same routing from `get_started`; a search that finds nothing returns "no entry in this server's data" with the next tool to try; an item the product lacks (Paytm, PayU, Cashfree, TallyPrime sync) is returned as `not_available` with its source and date instead of `live`; `integrations_list` returns a first page with counts; no deny-listed claim can appear in the served-content inventory.
- **Risk** — Output shapes change for two list tools; instructions worded badly read as manipulation (Anthropic and OpenAI reject that); an override could hide something true; a too-broad guard blocks legitimate edits. Mitigations in sections 5–8.

## 0a. Necessary changes   (read by planned-file coverage)

- [ ] `src/server.ts` — return `instructions` in the server info on `initialize`
- [ ] `src/server-info.ts` — the instructions text and `version` 2.2.0
- [ ] `src/tools/get-started.ts` — new tool `get_started` (carries the same routing as `instructions`)
- [ ] `src/tools/index.ts`, `src/tools/titles.ts`, `src/tools/annotations.ts`, `src/tools/__tests__/registry.test.ts` — register the tool with a title and read-only annotations; update the tool count
- [ ] `src/tools/guidance.ts` — shared `zeroResult()` helper (`matched:false`, `no_entry`, `did_you_mean` with capped edit distance and a "not the same item" label, `suggested_tools`)
- [ ] `src/tools/features.ts`, `src/tools/integrations.ts`, `src/tools/help.ts` — use the helper; `integrations_list` gets `limit` (default 50, max 200), `offset`, `status` (default `live`), `counts`, `next_offset`
- [ ] `src/data/claim-overrides.ts` — slug-keyed overrides applied at read time. Each: `slug`, `status: "not_available"`, `reason`, `kt` (known-truth id), `as_of`, `expires` (a date that fails CI once passed)
- [ ] `src/data/deny-claims.ts` — the deny list: `id`, `regex`, `positive_example`, `negative_example`, `kt`, `note`
- [ ] `src/tools/pricing.ts`, `src/tools/faqs.ts`, `src/tools/alternatives.ts`, `src/data/website-mirror.ts`, `src/prompts.ts` — remove or reword false claims in hand-written content (SOC 2 as an asserted fact, "unlimited pipelines", "scheduled reports", the Tally rows); `prompts.ts` is edited only if it carries a denied claim
- [ ] `scripts/sync-website-mirror.mjs` — add an injectable output path (`--out <file>` or `MIRROR_OUT`) so the drift test writes to a temporary copy, with its own test in `scripts/__tests__/` (no behaviour change when the option is absent)
- [ ] `src/tools/__tests__/truth-guard.test.ts`, `src/tools/__tests__/routing-and-guidance.test.ts`, `src/tools/__tests__/overrides.test.ts`, `src/tools/__tests__/integrations-compat.test.ts` — the executable gates
- [ ] `test-data/fixtures/integrations-2.1.0.default.json`, `test-data/fixtures/sync-denied.fixture.ts` — fixtures (excluded from the guard by path)
- [ ] `scripts/smoke-phase1.mjs` — the handshake smoke script used by section 7b
- [ ] `CHANGELOG.md`, `package.json`, `server.json` (version fields only) — 2.2.0, with a "Changed (breaking default)" entry for `integrations_list`

## 0b. What we already know   (G4)

| Source | What it said | What this plan does about it |
|---|---|---|
| `docs/plans/GEO_AEO_MASTER_PLAN.md` (2026-08-05) | An MCP server is product distribution, not organic answer ranking; a 26-directory campaign is "theatre"; verify telemetry before calling MCP an acquisition channel | Adopted as the framing; no paid placements; telemetry gate kept in the roadmap |
| PLAN-HELLOG-0002 (#98, closed; 4 REJECTs) | A large "publication gate" design was rejected | **Not repeated.** A plain override file plus a CI deny list |
| Merge-train review 2026-10-28 | 6 PRs open; main = 2.1.0; live = 2.0.0 with some 2.1.0 content already visible; closure comments on #76/#79/#81/#32 were wrong, so G1–G5 and routing items are not on main | Phase 1 re-extracts only the routing/paging items (G6); G1–G5 are a release precondition (0c) |
| Registry presence check 2026-10-26 | 6 of 60 listed; wrong identity on 4; `/mcp` returned 404 on the 2.0.0 live build | Registry-facing text deferred to the follow-up PR; humans submit |
| Product truth audit (KT-1..19) | Lists what code contradicts | Source of the deny list and overrides; each entry cites a KT id |
| Lessons corpus | `lessons.mjs brief` returned no matching lesson; recorded as "no applicable lesson", not as absence of risk | — |

## 0c. Release gate and sequencing

The work makes an anonymous public server easier to find, so **a 2.2.0 public deploy and anything registry-facing wait for the safety fixes G1–G5 to be deployed and verified**. Directories ingest from GitHub (README, `server.json`, `smithery.yaml`) and the public `/.well-known/mcp.json`; the repo's deploy is manual (inferred from live 2.0.0 while main is 2.1.0; **the maintainer confirms the mechanism in the deploy checklist before the build PR is merged**). Phase 1 changes only code, tool outputs and in-repo version/changelog text; it touches none of the files a directory scrapes. Order, each its own PR:

1. **Phase 0 - safety:** G1 `analytics_social_proof` counts only; G2 `robotsTxtPath` refused for public callers and `err.message` not echoed; G3 SSRF rebinding; G4 transport hardening including rate limiting and the Host/Origin allow-list; G5 CORS/Accept tolerance.
2. **Phase 1 - this plan's code PR (2.2.0):** may be merged once reviewed, **but only after the maintainer confirms in the PR that merging to `main` does not trigger a deploy** (the host's deploy is believed to be manual; that belief is not evidence). If merge can deploy, the gate file below must exist **before** merge. **Its public deploy is blocked until a gate file `docs/deploy/2.2.0-gate.md` is committed** by the named verifier (the maintainer) with, for each of G1–G5, the command run against the deployed image and its output (for example `tools/call analytics_social_proof` returns only counts; `list_allowed_bots` with `robotsTxtPath` is refused; an over-size body gets 413; a browser `OPTIONS /sse` gets CORS headers). A deploy with any of the five missing is not allowed; the build PR's checklist says so and the gate file is the evidence.

**Release invariant:** neither a merge nor a rollback may put an image on the public host that lacks verified G1–G5. The gate file also records the image tag (and digest) it verified; that tag is retained as the rollback target. Until such an image exists, rollback is unavailable: the options are roll forward or stop the service, and the checklist says which the maintainer chose. If the maintainer finds that deployment is automatic, the gate file is written first and merge waits.
3. **Phase 1b - identity PR:** the files above; merged only after step 2's deploy is verified.
4. **Phase 3 - submissions (humans).**

This plan implements none of step 1.

## 1. Premise   (G8)

| Claim | Type | Evidence | Running system? |
|---|---|---|---|
| Assistants pick the right tool and get a true, complete answer too rarely | missing_feature + integration | Two independent runs of 80 prompts (assistant simulated from the tool list only); 80 real read-only calls; `docs/evidence/mcp-visibility-2026-10-26/R4a_summary.md`, `R4b_summary.md` | yes (live, 2026-10-26) |
| False claims are still served on `main` | documentation | `git grep` on `origin/main` b9be7a7: `website-mirror.ts:33,314,322`, `faqs.ts:65`, `integrations.ts:267,278,814,815`, `alternatives.ts:854..1212`, `pricing.ts:76,118,219`; the known truths cite the code that contradicts each | not required |
| Directory listings misdescribe the server | integration | listing pages and registry API queried 2026-10-26 (`R2_summary.md`) | yes |
| Directory discovery, not open-registry listing, surfaces a server inside an assistant | documentation | Anthropic and OpenAI docs (`R1_web_research.md`, URLs and dates) | not required |
| A brand MCP server changes what assistants say about the company | — | **No evidence found.** Unproven; the plan does not claim it | — |
Limits: the prompt runs were simulated by an AI acting as the assistant; the live server was partly fixed on 2026-10-27 (pricing) without a version bump, so `/version` is not proof of content. Section 5 inventories what a 2.2.0 deploy ships beyond phase 1.

## 2. What changes

MCP 2.2.0: one new tool, two changed list tools, one changed `initialize` field, a structured `not_available` status for items the audit disproved, corrected hand-written content, a CI guard and a prompt dataset. No tool is removed. No new data source, no CRM action, no registry-facing text; the server stays read-only and anonymous.

## 5. Blast radius and caller inventory

- **Callers:** (1) MCP clients on `/sse` or `/mcp`: new `instructions` and a new tool (additive); (2) `integrations_list` callers with no arguments: the default response shrinks from ~386 KB to the first page of live entries and **this narrows a default** (documented as breaking in the changelog; the full list is reachable by paging); (3) callers whose query matches nothing: new fields, `total` stays 0; (4) callers of integrations that the audit disproved (Paytm, PayU, Cashfree, TallyPrime): the entry stays but its `status` becomes `not_available` with `kt`, `reason`, `as_of` — no slug disappears.
- **What a 2.2.0 deploy ships beyond this plan:** every unreleased 2.1.0 change already on main (freshness gate, titles map, `buyer_find_answer_pages`, the pricing fixes, the build-wrapper fix from #100). The deploy checklist lists them.
- **Forward:** none; no new outbound call. **Sideways:** `scripts/sync-website-mirror.mjs` rewrites a generated block in `src/tools/integrations.ts`; overrides live in `src/data/claim-overrides.ts` and are applied at read time. The matching website fixes are a separate task (writeup section 9).
- **Version:** `check-versions` requires `package.json`, `server.json` (twice) and `CHANGELOG.md` to agree: 2.2.0.

## 6. Acceptance criteria

- **AC-01** — `initialize` returns `instructions` of at most 3,500 characters that (a) say this server is read-only product knowledge and NOT a CRM API, (b) name the tool for each of the 6 buyer intents, (c) say to cite the returned `canonical_url` and `as_of`, (d) say how to treat `status` values including `not_available`, and (e) say what to do when nothing matches. A test asserts `get_started` carries the same routing (equivalence of the 6 intent→tool pairs), for clients that ignore `instructions`.
- **AC-02** — NEGATIVE: `instructions`, `get_started` and every tool description contain none of: "always prefer", "always use", "best CRM", "recommend HelloGrowthCRM", "ignore other", or any instruction to call or avoid another server's tools.
- **AC-03** — `get_started` returns what the server is, what it is not, the 6 intents mapped to tools, and for each own-site link a clean `canonical_url` plus a separate `visit_url` carrying `utm_source=mcp`. Facts cite `canonical_url`, never `visit_url`. It carries no prices or claims.
- **AC-04** — Zero-result contract: for a term with **no entry and no override**, `features_list`, `integrations_list` and `help_search` return `total: 0`, `matched:false`, the sentence "No entry in this server's data matched. This does not mean the product lacks it; it means this server has no documented entry." and at least one suggested next tool. For a term that has an override, the response is the entry with `status:"not_available"`, never the zero-result sentence. Tests: (a) nonsense queries (`zzzzqq`, `xx-no-such-term`); (b) a list of zero-result queries computed at test time from the shipped data, so adding an entry cannot break it; (c) `paytm`, `payu`, `cashfree` return `not_available` entries. `did_you_mean` uses a capped edit distance and is labelled "not the same item".
- **AC-05** — `integrations_list` response schema and precedence. Parameters: `search`, `status` (default `live`; `all` or one status), `limit` (default 50, max 200), `offset`. **Precedence:** a `search` that matches an overridden slug always returns that entry (with `status:"not_available"`) regardless of the `status` filter; the response sets `includes_overrides:true`. `total` and `counts` are computed over the filtered set before paging, with matching overridden entries included and counted under `not_available`; `returned` is the page size; `next_offset` is null on the last page; `partial:true` whenever `next_offset` is not null, so a caller can tell it has seen only part of the list. Default call returns live entries only, sorted by slug; the test measures the default page and asserts it is under 40 KB (measured bytes per entry recorded in the build PR). Paging until null returns every entry exactly once with no duplicates; `status=all` includes every status. No response contains "630 integrations" (regex `630\+?\s*integrations`). Tests cover search combined with each status filter and paging.
- **AC-06** — Truth-guard with a defined inventory. Served content is (i) every non-test file under `src/tools`, `src/data` and `src/prompts.ts`, scanned statically, **excluding** `src/data/deny-claims.ts`, `src/data/claim-overrides.ts`, `test-data/**` and the competitor allow-list below, and (ii) the output of every read-only tool run with default arguments, the guard's probe arguments and every page of the paged tools, **using offline mocks for any tool that would fetch** (no network in CI). Each deny pattern ships with a positive example it must match and a negative example it must not (for instance a correction "Tally sync is not available" must not match), and cites a known-truth id; categories without a KT id (data-residency statements) cite the founder decision recorded in #101. Patterns target statements about HelloGrowthCRM; true statements about competitors in `alternatives.ts` are covered by an explicit allow-list (file + slug) rather than by weakening the pattern. The claim is exactly: no deny-listed string in the inventory or in tested outputs; it does not cover untested arguments and is not a product-truth gate, and the release report says so. The guard is itself tested (injecting a deny-listed string into a source file and into a tool output must fail it) and a newly registered tool that is not in the inventory fails the test.
- **AC-07** — REGRESSION: existing tests pass except those that asserted the removed false strings; every tool still has a `title` and read-only annotations; tool count = previous + 1; `npm run check:versions` passes.
- **AC-08** — The golden-prompt dataset (160 prompts, 13 groups) is **not** part of the phase-1 build PR. A schema test does not show that routing or answer quality improved; it ships in Phase 3 together with a runner and a decision it can inform (writeup section 8). Phase 1's success is judged by the executable gates AC-04, AC-05, AC-06, AC-09, AC-10 and by a manual re-run of the 160 prompts by the reviewer, reported as evidence, not as a pass criterion.
- **AC-09** — Override safety and drift: overrides always win over synced content. A test regenerates the integrations block through `scripts/sync-website-mirror.mjs` **writing to a temporary copy** (an injectable output path) against a fixture carrying the denied statuses and proves the served output still shows `not_available`; an unrelated injected entry is unchanged; every override slug exists in the data (a website slug rename fails CI) and the served `status` for each KT-listed slug is asserted structurally; each override's `expires` date is in the future (CI fails once passed, forcing a re-check).
- **AC-10** — COMPATIBILITY, a documented breaking default: `CHANGELOG.md` records "Changed (breaking default)" with the migration (`status=all` and paging until `next_offset` is null; no one-call "all" exists because `limit` is capped). The accepted break is explicit: unknown external callers that read only the first response will silently see 50 live entries; the response's `partial:true` and `next_offset` let a caller detect that, and the changelog says so. There is no consumer telemetry to check against (GA4 events are unverified), which is why the break is accepted rather than avoided. The compatibility test proves: every slug in the recorded 2.1.0 default response appears in the 2.2.0 full paged traversal (overrides change `status`, they do not remove slugs); ordering is identical across two calls; pages do not overlap; `total` and `counts` are consistent.
- **AC-11** — DEPLOY AND ROLLBACK (checklist in the build PR): the maintainer first confirms how the host deploys (section 0c); the checklist records the live image tag and `/version` before and after; because `/version` does not prove content, the smoke script also asserts content markers (`get_started` present, a `not_available` entry for `paytm`); the rollback target is the **retained image tag verified for G1–G5** recorded in `docs/deploy/2.2.0-gate.md` — never 2.0.0 or an image verified for only some of the five; if none exists rollback is unavailable and the checklist states the chosen alternative (roll forward or stop); there is no schema or data migration.
- **AC-12** — OVERRIDE FRESHNESS IN PRODUCTION: `/health` reports `overrides: {total, expired}`; a nonzero `expired` makes `/health` `degraded` (like the content-freshness gate). **Owner and alert path:** the maintainer owns it; the existing weekly MCP audit task (`weekly-mcp-audit`, Mondays 09:05 IST, which already reads `/health`) is extended in the build PR's checklist to flag a degraded `/health` with a nonzero `expired` count as a finding. On an expired override the owner re-checks the KT id and either renews the date or removes the override.

## 7b. Smoke test — Expected only

Env: local build (`npm run build && node dist/index.js`, HTTP mode, port 3001) for steps 1–8, then the same script against the deployed host after the deploy · Login: none · Role: anonymous. Verified against `main` b9be7a7 before writing this plan: `src/server.ts:720` routes both `/sse` and `/mcp` to the same Streamable-HTTP handler, and a POST without a session id is accepted when the body is an `initialize` request (`server.ts:~655-665`); a non-initialize request without a valid session id gets 400. The handshake below is therefore the supported path on both URLs. Literal values marked **(new)** are fixed at BUILD from the shipped strings.

| # | Action | Expected |
|---|---|---|
| 1 ⭐ | `node scripts/smoke-phase1.mjs <base-url>`: POST `initialize` to `<base>/sse` with `Content-Type: application/json`, `Accept: application/json, text/event-stream`, protocolVersion `2025-06-18`; read `mcp-session-id`; send `notifications/initialized` with it; repeat against `<base>/mcp` | result has `instructions` starting "This server is read-only product knowledge" **(new)** and `serverInfo.version` `2.2.0`, on both paths |
| 2 ⭐ | `tools/list` with the session header | `get_started` present with a `title`; every tool has `annotations.readOnlyHint` true |
| 3 ⭐ | `tools/call get_started {}` | `intents` has 6 entries; `visit_url` values contain `utm_source=mcp`; `canonical_url` values do not **(new)** |
| 4 NEGATIVE | `tools/call features_list {search:"zzzzqq"}` | `total: 0`, `matched:false`, text contains "does not mean the product lacks it" **(new)** |
| 5 | `tools/call integrations_list {search:"paytm"}` | an entry with `status:"not_available"`, `kt` set, `as_of` set; not the zero-result sentence **(new)** |
| 6 | `tools/call integrations_list {}` | response under 40 KB; `counts` present; no "630 integrations" |
| 7 | page `integrations_list {status:"all"}` with `next_offset` until null | sum of `returned` equals `total`; no duplicate slug |
| 8 REGRESSION | `pricing_get_plans {region:"india"}`; `GET /health`, `GET /version`, `GET /.well-known/mcp.json` | contains `899` and not `1,099`; all three GETs 200; version 2.2.0 |

## 7f. Compatibility test

Fixture `test-data/fixtures/integrations-2.1.0.default.json` records the 2.1.0 default response. The test asserts the properties in AC-10. `limit` is capped at 200 so completeness is by traversal. The narrowed default is a documented breaking default, not a silent one.

## 8. Risks and edge cases

Rate limiting does not exist until G4 ships: paging reduces payload but not request volume, which is one more reason submissions wait. `did_you_mean` suggestions can be misread as matches; they are capped and labelled. Overrides can hide something that later becomes true; `expires` and the KT citation force a re-check. The `instructions` text is subject to client truncation (about 4 KB in one client); it is kept under 3,500 characters and mirrored in `get_started`.

## 9. What this deliberately does NOT do

- No tool removal, no profile split, no new answer tools (`capability_check`, `buyer_get_industry_fit`, `buyer_compare`, `trust_get_compliance`, `implementation_get_playbook`, `pricing_estimate`); they need founder decisions and the #95/#96 merge (writeup sections 5, 10).
- No registry-facing text (README H1, descriptions, `docs/DISTRIBUTION_PACK.md`): that is Phase 1b after the gate. No registry submission, npm publish, package rename or purchase.
- No security fixes G1–G5; they are a release precondition and their own PRs.
- No `scripts/eval-live.mjs`: a manual live runner needs a model and a network, gates nothing, and moves to Phase 3.
- No claim that the MCP raises search visibility. No change to pricing values or to any figure not on the deny list. No website changes (writeup section 9).

## 10. Review record

- **Reviewers selected:** sol → claude (blind second)
| Reviewer | Plan version | Verdict | Accepted | Rejected, and why |
|---|---|---|---|---|
| Sol | rev 1 (40abcacd) | REJECT | release sequencing (now 0c); zero-result contract (AC-04); narrower truth claim and inventory (AC-06); smoke handshake (7b); breaking-default doc, rollback, override precedence (AC-09..AC-11) | "do not ship the visibility release until G1–G5 are fixed": narrowed to G1+G2 verified, G3–G5 planned with owners, because G3–G5 need host configuration and would otherwise block indefinitely. "Drop the prompt gate": accepted |
| Claude (blind) | rev 2 (e007a702) | ACCEPT_WITH_CHANGES | not_available status; guard exclusions, pattern examples and competitor allow-list; identity files moved to Phase 1b; limit/default consistency; compatibility via status change; smoke uses `zzzzqq`; added files; `visit_url`; override drift tests; offline mocks; `did_you_mean` cap; narrower "630" regex; eval-live dropped; prompt gate dropped; deploy statement | nothing |
| Sol | rev 3 (a7ee61e7) | REJECT | all of G1-G5 verified before the 2.2.0 public deploy (now 0c, with a named verifier and an evidence file); `/.well-known/mcp.json` change moved to Phase 1b; filter precedence, response schema and `partial` flag (AC-05); handshake verified against main now (7b); accepted-break wording and incomplete-traversal detection (AC-10); override freshness in production (AC-12); schema test is not evidence of improvement (AC-08) | nothing rejected |
| Sol | rev 4 (f1cc05c8) | REJECT | merge only after the maintainer confirms merge does not deploy (else gate first); one release invariant covering merge and rollback, with a retained G1–G5 rollback image; sync script change added to the plan; prompt dataset removed from phase 1; named owner and alert path for override freshness | nothing rejected |
- **Reconciliation:** Sol's sequencing objection is fully accepted in rev 5 (one release invariant). Sol has rejected four revisions in a row, each time with narrower and mostly new points that were accepted; its REJECT is open until it reviews rev 5. If it rejects again on points not about the release invariant, the build proceeds only as a draft PR and the disagreement is stated, never as an approval.
- **Human approval:** not required at T2. **Founder decisions** (none blocks phase 1): SOC 2 final wording; splitting bot-governance tools; npm name; which directories to submit to and framing for Claude/ChatGPT; annual USD and local-currency prices; public-roadmap policy.
- **What left the machine (G9b):** the plan and writeup (egress-clean) to Sol and to the blind reviewer.

## 11. Registration

This repo's analogue: the new tool is registered in `src/tools/index.ts`, `titles.ts` and `annotations.ts` and counted in `registry.test.ts`.

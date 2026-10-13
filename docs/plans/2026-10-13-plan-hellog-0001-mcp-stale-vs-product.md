# Plan — MCP repo: what is stale against the product, and what to update  *(rev 2 — Sol r1 REJECT folded)*

- **Plan id:** PLAN-HELLOG-0001 (first plan id in this repo; prefix is derived because the skill has no adapter for it — `plan-id.mjs next` could not read the trunk, so run `plan-id.mjs check` after the push)
- **Branch:** plan/hellog-0001-mcp-stale-vs-product · **Repo:** MeruLocal/HelloGrowthCRMwebsite_MCP · **Trunk:** `main` (verified: `origin/HEAD -> origin/main`; last commit 2026-09-02, `7312627`)
- **Mode:** PLAN · **Change tags:** customer_visible, public_api
- **Tier:** T2 — Sol, then fold, then Astra (blind). No human gate owed; M1 (merge + redeploy) is a human action regardless.
- **Owed (workflow.mjs obligations):** acceptance_criteria, blast_radius, caller_inventory, chatbot_kb, compatibility_test, help_content, intent, necessary_changes, premise_check, smoke_test
- **Restricted areas touched (G2):** none authored by this plan. Pricing and compliance copy are restricted; this plan changes neither — it routes both to the plans that own them.
- **Freeze in force?** none recorded for this repo. `main` has simply not moved since 2026-09-02 while 20+ PRs wait.
- **Date:** 2026-10-13
- **Scope note:** this is the **website-data MCP** (a mirror of website content). The CRM-side MCP (`crm-mcp-server`, 30 tools, in hellocrm) is out of scope — it is planned under PLAN-HGC-0435/0434.

## 0. Intent
- **Claim** — The MCP serves AI assistants facts that are stale, contradicted by the product, or unverified, and it is missing two cheap protocol-level features. Most of the fix already exists in open PRs that nobody has merged.
- **Mechanism** — One umbrella plan that classifies every difference found between this repo and the verified product inventory (hellocrm PLAN-HGC-0456 evidence) into: already fixed in an open PR (release it), blocked on a decision elsewhere (route it), and unblocked work (plan it). Each unblocked item becomes its own small child PR.
- **Observable** — After the packages ship: `pricing_get_plans` answers ₹899 + 18% GST and the agreed USD figures with no "Unlimited users"; comparison rows quote the Free cap from one constant; `initialize` carries an `instructions` string; no claim in the mirror is stronger than its evidence.
- **Risk** — The MCP is a public API that AI clients call; a changed field shape or removed tool breaks callers silently. Mitigation: additive changes only, a compatibility test per package, and no edit to pricing/compliance values that another plan owns.

## 0a. Necessary changes (this PR only)
- [x] `docs/plans/2026-10-13-plan-hellog-0001-mcp-stale-vs-product.md` — this plan

Child packages (built later, each its own PR; paths verified on `origin/main`):
- [ ] `src/server.ts` (line ~86 `new Server(..., { capabilities: { tools: {}, resources: {} } })`) — M5 add `instructions`
- [ ] `src/server-info.ts` / tests — M5 compatibility test
- [ ] `src/tools/alternatives.ts` (7+ rows "200 leads") — M3 single Free-cap constant
- [ ] `src/data/website-mirror.ts` (lines ~33, ~322 SOC 2 text; ~311 price strings) — M2/M4, value changes owned elsewhere
- [ ] `README.md` line ~198 and `src/tools/integrations.ts` / `src/tools/llms-txt.ts` — M6 integrations count from the derived catalog
- [ ] `src/tools/__tests__/*` — one test per acceptance criterion

## 0b. What we already know (G4 · learning brief)
No lessons brief is available for this repo (it is outside the lessons corpus); recorded as "no applicable lesson". Sources read: memory `project_mcp_foundation_plans_2026-10-12.md`, open PR list, audit docs in `docs/`.

| Source | What it said | What this plan does about it |
|---|---|---|
| open **#50** | canonical prices in the mirror: ₹899 + 18% GST both modes, USD $10 annual / $12 monthly | M1 releases it; does not re-implement |
| open **#57** | drops "Unlimited users" and residency claims; adds a pricing-truth test (stacked on #50) | M1 releases it |
| open **#55 / #53** | audits: `pricing_get_plans` regressed to ₹1,099; "merge #50 + redeploy is the only live fix needed" | evidence for the premise |
| open **#47** | CI control plane this repo never had | merge first so the pricing-truth test actually runs |
| open **#32 / #33 / #34** | SSE CORS, accept application/json clients, `/mcp` canonical path | included in the merge order |
| open **#59** | what is still pending from the MCP plans (2026-10-12) | this plan adds only the delta from the 2026-10-13 product inventory |
| hellocrm **#8356** (PLAN-HGC-0456) and website **#1731** (PLAN-HCW-0136) | own the Free caps, USD prices and SOC 2 / integration-count questions | M2–M4, M6 are blocked on them and say so |
| founder policy (memory 2026-09-17) | the site may claim more than the product does; audit under-advertising | not applied to compliance attestations or to prices — those are facts, not roadmap |

## 1. Premise (G8) — what was measured
All on `origin/main` @ `7312627` by `git grep` (file counts are lower bounds):
| # | Claim | Type | Evidence | Running system? |
|---|---|---|---|---|
| 1 | The mirror's Growth price strings are ₹1,099 monthly and $13 monthly; "Unlimited users" appears in 1 file | documentation | `src/data/website-mirror.ts:311`; `git grep -i "unlimited users"` | **yes — the deployed answer is only reported by audit PRs #55/#53; re-observe before quoting** |
| 2 | Free plan "200 leads" hard-coded in 7+ comparison rows | documentation | `src/tools/alternatives.ts` (~683, 724, 757, 793, 828, 1074, 1108); product Free cap 150 since 2026-08-04 (hellocrm migration `20260804113254`) | no |
| 3 | The mirror states "SOC 2 certified" and `compliance: "SOC 2 Type II, CCPA compliant"` | documentation | `src/data/website-mirror.ts:~33, ~322`; the report is in no repo read here | **evidence needed (website WP-C)** |
| 4 | README says "630-entry catalog, 116 categories"; the website's derived public count is lower and the app's live list is 358 | documentation | `README.md:198`; website `integrations-catalog-data.ts`; product catalogue F-0901 | no |
| 5 | `initialize` advertises only `tools` and `resources`; no `instructions`, no `prompts` | missing_feature | `src/server.ts:86` | no |
| 6 | HelloGrowthCRM itself is described as "built for the WhatsApp-first … team" | documentation | `src/tools/alternatives.ts:871`; other "WhatsApp-first" hits describe competitors and are correct | no |
If a premise is false at the head a package starts on, that package stops with Report B.

## 2. What changes — packages (each its own PR; order = risk-first, unblocked-first)
- **M1 · Release what is already fixed — conditional on a tested release artifact.** Human action; the plan specifies the gate, not the merge.
  1. **Integration head, not a PR list.** Build one release branch that stacks #47 → #50 → #57 → #32/#33/#34 on current `main`, resolve conflicts there, and run the full suite on that **combined head**. The artifact that is deployed is that head's SHA, recorded in the release note. **Stop condition:** any failing test, any unresolved conflict, or a PR that no longer applies stops the release.
  2. **Approved offer record.** The release carries a small file listing each public price/cap claim with its approved source and owner: INR Growth 899 per user per month, **GST 18% additional** (billing period and per-user basis stated), USD monthly $12 (founder-final), USD annual **pending Q2**. A check compares the mirror to this record and fails on any mismatch or any unapproved entry.
  3. **Compliance gate.** The mirror's SOC 2 text (website-mirror.ts ~33, ~322) is **not redeployed as-is** unless the report check (website PLAN-HCW-0136 WP-C: entity, scope, period, wording) has passed, **or** the founder authorises qualified wording (restricted area, G2: the founder's area-naming word is recorded verbatim in the child PR). This plan does not edit the claim itself; it blocks the release on it.
  4. **Live audit of every affected tool response** — `pricing_get_plans`, `alternatives_*`, `integrations_list`, `initialize` — against the approved offer record, on the deployed candidate (with representative old-style client calls), not only a source grep.
  5. **Rollback trigger:** any live claim that fails the approved record, or a client-visible error rate above the pre-release baseline, redeploys the previous artifact immediately; the previous artifact's SHA is recorded before release.
  After deploy, re-run the audit once more after the next mirror sync (the mirror can regress).
- **M2 · Prices.** No value is edited here. #50's USD annual figure is **$10 per user per month** pending the founder's confirmation (**FOUNDER Q2**: the founder's reply was cut off at "annual at USD 1"; $10 is the reading that matches #50 and the website constants, but it is not recorded as decided). **M1's release is blocked until Q2 is answered**, because a public pricing release cannot use an unresolved value as its pass condition. Any later value change comes from website #1727 / hellocrm #8356.
- **M3 · One Free-cap constant.** Replace the 7+ literal "200 leads" rows with a single exported constant; the **value** is whatever website #1727 / hellocrm #8114 finally decide (shipped today: 150). Blocked on that decision; the refactor itself is small and additive.
- **M4 · SOC 2 text — release-gated (see M1 step 3).** The existing text is neither extended nor repeated in new text. It does not stay live by default: either WP-C's report check passes, or the founder authorises qualified wording, before M1 redeploys.
- **M5 · Protocol guidance (unblocked).** Add an `instructions` string to `initialize` (what the server is, that data is a mirror of the public website, how to cite, the date the mirror was synced). Additive only. A `prompts` capability is **cut** from this plan: it has no stated caller or acceptance criterion. Instruction text MUST NOT contain prices, caps or compliance claims (it would go stale the same way).
- **M6 · Integrations count.** README line ~198 and `integrations_list` stop quoting a hand-typed count; they read a **versioned catalog summary published by the website** (a JSON with a version and a sync date), consumed through the committed generator after website WP-B1 defines the eligible set. A test rejects a missing summary, a summary whose sync date is older than a stated window, and a printed sync date that differs from the summary's. How the website publishes that summary is specified in the M6 child plan (it needs a website-side change). Blocked on WP-B1.
- **M7 · Wording.** Reword the one line that calls HelloGrowthCRM "WhatsApp-first" (`alternatives.ts:871`) to the multi-channel description; leave competitor descriptions alone; verify the generated llms.txt output (`src/tools/llms-txt.ts`) for the same phrase at BUILD.
- *(Not packages — notes only, cut from the package list per review.)* The CRM-side MCP announcement is a founder call; triage of the other 20+ open PRs is housekeeping. Neither resolves this mirror's release.

## 5. Blast radius
- **Backward** — every MCP client (Claude, ChatGPT connectors, directory crawlers): responses of `pricing_get_plans`, `alternatives_*`, `integrations_*`, `initialize`. **Forward** — a new `instructions` field is read by clients that start honouring it. **Sideways** — website repo (source of the mirror), hellocrm (price/caps), Smithery/registry listings (`server.json`, `smithery.yaml`), `llms.txt` consumers.
### 5a. Caller inventory  [caller_inventory]
| Caller | What it reads | Effect of this plan |
|---|---|---|
| MCP clients via `initialize` / `tools/list` | capabilities, tool names and schemas | M5 adds a field; tool names/schemas unchanged |
| Clients calling `pricing_get_plans` | plan price strings | values change only through #50/#57; shape unchanged |
| Clients calling `alternatives_*` / `integrations_*` | comparison rows, counts | M3/M6 change values, not shape |
| Directory/registry crawlers (`server.json`, llms.txt) | descriptions, counts | M6/M7 wording; re-submission not owed |
| Website repo mirror generator | `website-mirror.ts` structure | unchanged |

## 6. Acceptance criteria
- **AC-01** — After M1, a live `tools/call pricing_get_plans` equals the approved offer record (INR 899 per user per month, GST 18% additional, USD monthly $12, billing period and per-user basis stated) and contains no "Unlimited users" and no ₹1,099 as the Growth price.
- **AC-09** — M1 does not deploy while Q2 (USD annual) or the SOC 2 gate is unresolved.
- **AC-10** — The deployed artifact's SHA equals the tested integration head's SHA.
- **AC-11** — Every affected tool response (`pricing_get_plans`, `alternatives_*`, `integrations_list`, `initialize`) passes the live audit against the approved record.
- **AC-02** — NEGATIVE: no package changes a tool name, input schema or output field name.
- **AC-03** — REGRESSION: the existing suite (`src/tools/__tests__/*`, `registry.test.ts`, `annotations.test.ts`) passes unchanged.
- **AC-04** — M5: `initialize` response contains a non-empty `instructions` string; a client that ignores it behaves exactly as before.
- **AC-05** — NEGATIVE: the M5 `instructions` text contains no price, plan cap, certification or integration count.
- **AC-06** — M3: `git grep -n "200 leads"` over `src/` returns 0 literals; every Free-cap mention is read from the one constant.
- **AC-07** — NEGATIVE: no SOC 2 / ISO / PCI wording is added anywhere by any package.
- **AC-08** — M6: the integrations count in README and the tool equals the website catalog summary at the sync date printed beside it.

## 7b. Smoke test — Expected only
Env: the deployed MCP endpoint and a local `npm run dev`/inspector · No login · Client: `test-mcp.mjs` or the MCP inspector.
| # | Action | Expected |
|---|---|---|
| 1 ⭐ | `tools/call pricing_get_plans` | equals the approved offer record: Growth INR 899 per user per month with GST 18% additional; USD monthly $12; no "Unlimited users"; USD annual only once Q2 is answered |
| 1b | run the offer-record check against the deployed candidate | 0 mismatches, 0 unapproved entries |
| 2 ⭐ | `initialize` | response includes `instructions` **(new)** |
| 3 | `tools/list` | same tool names and schemas as before the change |
| 4 NEGATIVE | `tools/call alternatives_*` for any competitor | no "200 leads" string |
| 5 REGRESSION | `tools/call integrations_list` | still returns entries; count printed with its sync date |
| 6 ⭐ | repo `npm test` (after #47) | all suites pass |

## 7f. Compatibility test  [compatibility_test]
For M3, M5, M6, M7 a test pins the **public shape**: tool names, input schemas and the **full nested output structure** (keys and value types, not only top-level keys). The baseline is the **tested pre-release artifact from M1** (the integration head), not `origin/main`, so changes introduced by the release stack are not mistaken for regressions or missed. Values clients parse — price strings, comparison rows, counts — get their own pattern tests (billing period, per-user basis, GST stated as additional). Representative old-style client calls are replayed against the deployed candidate; an old-style client with no `instructions` handling must still succeed.

## 8. Risks and edge cases
Directory listings and AI answers may cache the old values for days after deploy; a redeploy without the audit re-run proves nothing; `instructions` text can itself go stale (hence AC-05); the mirror can regress to old values if the website-side generator still emits them — M1 verification must be repeated after the next mirror sync.

## 9. What this deliberately does NOT do
- Does not edit any price, Free cap, SOC 2 or integration value (all owned by #50/#57, #1727, #8356, PLAN-HCW-0136).
- Does not add or remove a tool.
- Does not touch the CRM-side MCP server.
- Does not claim anything about what is deployed; the live answer is re-observed in M1.

## 10. Review record
| Reviewer | Plan version | Verdict | Accepted | Rejected, and why |
|---|---|---|---|---|
| Sol | rev 1 | REJECT | B1 no release on unresolved USD annual (M1 blocked on Q2; approved offer record); B2 SOC 2 text must not stay live unverified — taken as a release gate + founder-authorised wording, NOT a unilateral edit (restricted area G2); B3 tested integration head + stop condition; B4 compat baseline = tested pre-release artifact + nested shape. Risks: price semantics (period, per-user, GST) tested; source-to-release check; old-client replay on deployed candidate; rollback trigger. Missing: all-claims release gate, versioned catalog summary + stale-sync test, live audit of every affected tool. Cut: `prompts` capability, M8/M9 | partially: Sol asked to "remove or qualify" the SOC 2 text; rejected as a unilateral action — a compliance attestation is restricted copy and the founder decides (remove, qualify or evidence it); the plan instead blocks the redeploy until that decision exists |
| Astra (blind) | rev 2 | pending | | |
- **Human approval:** not owed at T2; M1 is a human merge/redeploy action.
- **What left the machine (G9b):** pending.

## 11b. Planned help content  [help_content · chatbot_kb]
The consumer-facing "help" for this server is its README tool table and the MCP `instructions` string: both are updated by M5/M6 in the product's words; the website's chatbot/help sources are covered by website PLAN-HCW-0136 WP-D, not duplicated here. Stale README statements the changes touch are corrected in the same PR.

## Founder questions
Q1 Merge-and-redeploy authority for #47/#50/#57 (who clicks, when)? Q2 Growth annual USD: confirm $10 (reply was truncated). Q3 Announce the CRM-side MCP: yes/no/later? Q4 SOC 2 report: exists / issuer / scope / period (shared with website WP-C).

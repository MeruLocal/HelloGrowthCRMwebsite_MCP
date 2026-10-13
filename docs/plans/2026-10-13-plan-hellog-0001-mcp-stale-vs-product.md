# Plan — MCP repo: one controlled factual-correction release, and a register of what is still stale  *(rev 3 — narrowed after Sol REJECT and Astra REJECT)*

- **Plan id:** PLAN-HELLOG-0001 (first plan id in this repo; prefix derived because the skill has no adapter for it — `plan-id.mjs check` run after the push)
- **Branch:** plan/hellog-0001-mcp-stale-vs-product · **Repo:** MeruLocal/HelloGrowthCRMwebsite_MCP · **Trunk:** `main` (verified: `origin/HEAD -> origin/main`; last commit 2026-09-02, `7312627`)
- **Mode:** PLAN · **Change tags:** customer_visible, public_api
- **Tier:** T2 — Sol, then fold, then Astra (blind). No human gate owed, but R1's release and its two decisions are human.
- **Owed (workflow.mjs obligations):** acceptance_criteria, blast_radius, caller_inventory, chatbot_kb, compatibility_test, help_content, intent, necessary_changes, premise_check, smoke_test
- **Restricted areas touched (G2):** pricing and compliance copy. This plan authors neither; it defines the gate and names the founder decisions. Any child PR that edits those values carries the founder's area-naming word verbatim.
- **Freeze in force?** none recorded for this repo (`main` has not moved since 2026-09-02 while 20+ PRs wait).
- **Date:** 2026-10-13
- **Scope:** the **website-data MCP** (a public mirror of website content, no tenant data). The CRM-side MCP is out of scope (hellocrm PLAN-HGC-0435/0434).
- **Why narrowed:** two reviewers rejected the nine-package version for the same reason — too many moving parts around one release. This revision keeps **one** package (R1) and moves everything else to a register, each item becoming its own plan when unblocked.

## 0. Intent
- **Claim** — The deployed MCP tells AI assistants Growth costs ₹1,099 / $13 monthly with "Unlimited users", and repeats an unverified SOC 2 attestation. Fixes for the prices exist in open PRs (#50, #57) but have not been released.
- **Mechanism** — R1: release #50 and #57 (on top of #47, the CI) as one controlled correction, behind a truth gate that is mandatory on **every** path that builds or deploys an artifact, with a defined containment policy because rolling back would restore the wrong claims.
- **Observable** — The live `pricing_get_plans` equals an approved offer record; the live audit passes for every enumerated tool response; the currently deployed SOC 2 wording has an owner and a deadline.
- **Risk** — A public API that AI clients call. Mitigation: no tool name, schema or output field changes; transport PRs (#32/#33/#34) stay out of this release; a recorded contract baseline of the deployed artifact is compared before and after.

## 0a. Necessary changes (this PR only)
- [x] `docs/plans/2026-10-13-plan-hellog-0001-mcp-stale-vs-product.md` — this plan

R1's child PR(s), built later (paths verified on `origin/main`):
- [ ] `src/data/approved-offer.ts` (new) + `scripts/check-offer.mjs` (new) — the approved offer record and its validator
- [ ] `package.json` — wire the validator into `verify` and `prepublishOnly`
- [ ] `src/data/website-mirror.ts` — values arrive only via #50/#57; the validator checks them
- [ ] `scripts/audit-live-mcp.mjs` — extend the existing live audit with the enumerated matrix and the offer-record comparison
- [ ] `src/**/__tests__/*` — one test per acceptance criterion

## 0b. What we already know (G4)
No lessons corpus exists for this repo ("no applicable lesson"). Sources: memory `project_mcp_foundation_plans_2026-10-12.md`; open PR list; `RELEASING.md`; `scripts/audit-live-mcp.mjs`; audit docs #53/#55.
| Source | What it said | What this plan does about it |
|---|---|---|
| open #50, #57 | ₹899 + 18% GST both modes; USD $10 annual / $12 monthly; drops "Unlimited users"; pricing-truth test | R1 releases them under the gate; does not re-implement |
| open #47 | CI control plane this repo never had | prerequisite of R1 so the tests run |
| open #32/#33/#34 | SSE CORS, application/json clients, `/mcp` canonical path | **excluded from R1** (transport change = separate release with its own contract tests; see F5) |
| #53/#55 | audits: live `pricing_get_plans` regressed to ₹1,099 | premise; re-observed in R1 |
| `RELEASING.md` | publishing and deployment are separate steps; `prepublishOnly` = clean + check:versions + build | the gate attaches to both |
| website #1731, hellocrm #8356 | own USD/Free/SOC 2/integration decisions | R1 consumes their decisions, never makes them |
| founder policy 2026-09-17 | site may claim more than the product does | not applied to prices or compliance attestations — those are facts |

## 1. Premise (G8)
On `origin/main` @ `7312627` (`git grep`; counts are lower bounds):
| # | Claim | Type | Evidence | Running system? |
|---|---|---|---|---|
| 1 | Mirror holds Growth ₹1,099 monthly / $13 monthly and "Unlimited users" | documentation | `src/data/website-mirror.ts:311`; `git grep -i "unlimited users"` | **yes — the deployed answer is reported only by audit PRs #53/#55; R1 re-observes it first** |
| 2 | Mirror asserts "SOC 2 certified" and "SOC 2 Type II"; the report is in no repo read | documentation | `website-mirror.ts:~33, ~322` | **evidence needed (website WP-C)** |
| 3 | No mirror generator lives in this repo: `website-mirror.ts` changes arrive by PR; the build/deploy paths are `npm run verify`, `prepublishOnly`, and the separate deployment step | documentation | `package.json` scripts; `ls scripts`; `RELEASING.md` | no |
If a premise is false at the head R1 starts on, R1 stops with Report B.

## 2. What changes — R1 only
**R1 · Controlled factual-correction release.** Human action; the plan specifies the gate and the policies.
1. **Preconditions (block R1):** **Q2** USD annual answered (the founder's reply was cut off at "annual at USD 1"; $10 matches #50 but is not recorded as decided) and **D-SOC2** decided (below).
2. **Baseline of the deployed contract, before anything changes:** with `audit:live`, capture from the **currently deployed** artifact: `initialize`, `tools/list` with schemas, and the entry points as currently served (legacy and canonical transport paths, JSON and SSE negotiation, session lifecycle, browser-origin behaviour). R1 must reproduce this baseline exactly except the intended price/claim values. Supported old entry points are preserved.
3. **Release candidate:** a branch stacking #47 → #50 → #57 only, on current `main`; conflicts resolved there; full `npm run verify` on the combined head; the deployed artifact is that head's SHA. Stop condition: any failing test, unresolved conflict, or PR that no longer applies.
4. **Approved offer record** `src/data/approved-offer.ts` + validator: per offer — currency, billing cadence, commitment period, per-seat basis, **monthly equivalent vs amount charged** (stated separately), effective date, tax treatment (INR: GST 18% additional; **USD tax treatment is not inferred from GST** and stays "not stated" unless the founder states it), approval source and owner. The validator fails on any mismatch with the mirror and on any unapproved entry.
5. **The truth gate is mandatory on every path that produces or deploys an artifact** (named, with enforcement points):
   | Path | Enforcement point |
   |---|---|
   | local / CI verification | `npm run verify` runs `check-offer` |
   | npm publish | `prepublishOnly` runs `check-offer` |
   | deployment (separate step per `RELEASING.md`) | post-deploy `npm run audit:live` against the offer record; deployment is not complete until it passes |
   | any future mirror generator or sync | MUST call the same validator before replacing `website-mirror.ts`; an unapproved generated artifact never replaces the accepted one |
   There is no sync path in this repo today (premise 3), so there is nothing to "re-audit after the next sync" — the check runs on every build and deploy instead.
6. **Live audit matrix (enumerated, committed with the audit script, generated from `registry.ts` at BUILD):** `initialize`; `pricing_get_plans` (no arguments); `alternatives_*` for every competitor slug in the registry; `integrations_list`, `integrations_get` for a named sample and `integrations_list_categories`; `faqs`/`features` tools that mention price or caps. Each response is compared to the offer record and to a forbidden-strings list (₹1,099 as Growth price, "Unlimited users", unapproved certification wording).
7. **Containment and rollback — not a blind rollback.** The previous artifact carries the forbidden claims, so **automatic redeploy of it is not a recovery policy.** If the live audit fails after deploy: (a) redeploy the *release candidate's parent only if* the failing claim is not one the gate forbids; otherwise (b) deploy a **containment build** that answers the affected tool/field with a neutral "currently unavailable" response — this needs the founder's recorded authorisation in advance (restricted copy). The owner of the live remediation is the founder; the deadline for deciding how the currently deployed wording is handled is **before R1's deploy date**. Post-deploy probes are **synthetic** (3 probes over 10 minutes against the matrix), independent of traffic volume; one transient network failure is retried once before it counts.
8. **D-SOC2 (founder, blocks R1):** exactly one of — (a) evidence it: website WP-C checks the report (entity, scope, period, wording) and the wording is kept; (b) authorise qualified/removed wording in R1's build (area-naming word recorded verbatim); (c) knowingly accept the currently deployed wording until WP-C finishes, recorded as a risk acceptance with a date. The plan does not pick; the live endpoint is not left silently unowned.

## 3. Register of what is still stale — NOT packages; each becomes its own plan when unblocked
| ID | Finding | Blocked on | Notes for its plan |
|---|---|---|---|
| F1 | HelloGrowthCRM's own Free cap "200 leads" hard-coded in 7+ rows of `src/tools/alternatives.ts`; shipped cap is 150 | website #1727 / hellocrm #8114 decision | single constant; the acceptance check is **scoped to HelloGrowthCRM's own cap** — competitor descriptions legitimately contain other numbers |
| F2 | README line ~198 "630-entry catalog" and the `integrations_*` counts | website PLAN-HCW-0136 WP-B1 (eligible set) | consume a **validated local artifact** (versioned JSON), never a per-request website fetch; bound its size; define count vs pagination semantics; freshness = **catalog sync time**, never build time; reject future dates and missing summaries; stale-window enforcement must not make a previously safe rollback artifact undeployable; export ownership on the website side |
| F3 | `initialize` has no `instructions` field (`src/server.ts:86`) | none (additive); baseline = the deployed artifact after R1, or the current verified baseline with a later integration rerun | instruction text carries no prices, caps, certification or counts; acceptance covers the tool response **and** generated `llms.txt` |
| F4 | `alternatives.ts:871` calls HelloGrowthCRM "WhatsApp-first" | none | competitor descriptions untouched; check generated `llms.txt` output too |
| F5 | Transport PRs #32/#33/#34 | their own contract-test plan | legacy and canonical paths, JSON/SSE negotiation, initialization/session lifecycle, allowed-origin and cross-session isolation tests; explicit versioning of any removed entry point; CORS is not authentication |
| F6 | Public-only inputs | none | verify catalog generation uses public inputs only and cannot publish tenant-specific or private integration metadata |
Not in this repo's scope: CRM-side MCP announcement; triage of the other open PRs.

## 5. Blast radius
Backward: every MCP client (assistants, connectors, directory crawlers) reading `pricing_get_plans`, `alternatives_*`, `integrations_*`, `initialize`. Forward: none (no new field in R1). Sideways: the website repo (source of the values), hellocrm (price/caps), registry listings (`server.json`, `smithery.yaml`), cached AI answers (days).
### 5a. Caller inventory
| Caller | What it reads | Effect of R1 |
|---|---|---|
| MCP clients via `initialize` / `tools/list` | capabilities, names, schemas | unchanged (baseline-compared) |
| Clients of `pricing_get_plans` | plan price strings | values change; shape unchanged |
| Clients of `alternatives_*` / `integrations_*` | rows, counts | unchanged in R1 |
| Registry crawlers (`server.json`, `llms.txt`) | descriptions | unchanged in R1 |

## 6. Acceptance criteria
- **AC-01** — After R1 the live `pricing_get_plans` equals the approved offer record, including cadence, per-seat basis, monthly-equivalent vs charged amount and tax treatment as stated there; it contains no ₹1,099 as Growth and no "Unlimited users".
- **AC-02** — NEGATIVE: no tool name, input schema or output field name differs from the pre-release deployed baseline (nested shape, not only top-level keys).
- **AC-03** — REGRESSION: the existing suite passes unchanged on the combined head.
- **AC-04** — The deployed artifact's SHA equals the tested release head's SHA.
- **AC-05** — Every path in the §2.5 table fails closed when the validator fails (a deliberately wrong value breaks `verify`, `prepublishOnly` and the post-deploy audit).
- **AC-06** — Every response in the enumerated live matrix passes against the offer record and the forbidden-strings list.
- **AC-07** — NEGATIVE: R1 adds no SOC 2 / ISO / PCI wording and none of #32/#33/#34's transport changes.
- **AC-08** — R1 does not deploy while Q2 or D-SOC2 is unresolved.
- **AC-09** — Rollback policy test: simulating a failed audit does not redeploy an artifact containing a forbidden claim (the containment path is exercised on a non-production target).

## 7b. Smoke test — Expected only
Env: the deployed MCP endpoint and a local `npm run dev`; client `scripts/audit-live-mcp.mjs` or the MCP inspector · no login.
| # | Action | Expected |
|---|---|---|
| 1 ⭐ | `tools/call pricing_get_plans` | equals the approved offer record; INR 899 per user per month, GST 18% additional; USD monthly $12; no "Unlimited users"; USD annual only once Q2 is answered |
| 2 ⭐ | `npm run audit:live` | 0 mismatches, 0 forbidden strings across the enumerated matrix |
| 3 | `tools/list` | identical names and schemas to the recorded pre-release baseline |
| 4 NEGATIVE | put a wrong price in a scratch branch and run `npm run verify` | the build fails at `check-offer` |
| 5 REGRESSION | `tools/call integrations_list` | still returns entries (unchanged in R1) |
| 6 ⭐ | `npm test` on the release head | all suites pass |

## 7f. Compatibility test
The pre-release baseline is captured from the **deployed** artifact (§2.2) and compared, nested-structure and value-type exact, with the release candidate. Parsed values (price strings, cadence text) have pattern tests. Old-style client calls are replayed against the deployed candidate. Transport behaviour is explicitly unchanged in R1 because the transport PRs are excluded.

## 8. Risks and edge cases
Cached answers elsewhere persist for days after deploy; directory listings are not updated by a redeploy; the offer record can itself go stale — it has an owner and a review date; a probe failing on a low-traffic endpoint is retried before counting; timezone of the "effective date" is stated in the record.

## 9. What this deliberately does NOT do
- Does not edit any price, cap, compliance or integration value (owned by #50/#57, #1727, #8356, PLAN-HCW-0136).
- Does not release #32/#33/#34, add a `prompts` capability or an `instructions` field.
- Does not roll back to an artifact containing forbidden claims.
- Does not touch the CRM-side MCP.

## 10. Review record
| Reviewer | Plan version | Verdict | Accepted | Rejected, and why |
|---|---|---|---|---|
| Sol | rev 1 | REJECT | release gated on approved values + tested head + compat baseline; SOC 2 as a release gate | the request to "remove or qualify" SOC 2 text was taken as a founder decision (D-SOC2), not a unilateral edit — restricted copy |
| Astra (blind) | rev 2 | REJECT | (1) pre-change compatibility gate on the deployed contract; (2) rollback can restore forbidden claims → containment policy + owner/deadline; (3) truth checks mandatory on every artifact-producing and deploying path (named); risks/missing/cuts: offer-record schema, enumerated matrix, M5↔M1 dependency, scoped Free-cap assertion, M7 acceptance, drop #32-34 from R1, drop Q3, drop `prompts` claim | none — one correction: Astra assumed a website generator writes the mirror; no such generator exists in this repo (premise 3), so the gate attaches to build and deploy paths instead of a sync path |
| Astra (blind) | rev 3 (this revision, narrowed) | pending | | |
- **Human approval:** not owed at T2; R1's release, Q2 and D-SOC2 are human.
- **What left the machine (G9b):** plan text only; egress CLEAN each time; no customer data.

## 11b. Planned help content
The MCP's consumer-facing documentation is its README tool table and `llms.txt`. R1 changes no wording there. F2/F3/F4 own those edits; the website chatbot/help sources are covered by website PLAN-HCW-0136 WP-D.

## Founder questions
Q1 Who clicks merge/deploy for R1, and by when? Q2 Growth annual USD — confirm $10 (reply was cut off at "annual at USD 1"). **D-SOC2** choose (a), (b) or (c) above; also the SOC 2 report facts (issuer, scope, period) if (a). Q4 USD tax treatment: state it, or leave "not stated"?

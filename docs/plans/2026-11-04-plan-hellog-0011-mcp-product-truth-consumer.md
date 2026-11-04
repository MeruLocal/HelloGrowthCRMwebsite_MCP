# Plan — MCP: serve the Product Truth Registry (one set of facts for pricing, plans, features, promotions and claims)

- **Revision:** 2 (2026-11-04), Astra blind review of rev 1 folded (see the review record)
- **Plan id:** PLAN-HELLOG-0011, allocated 2026-11-04 as the next free number after PLAN-HELLOG-0010 (#113). Sources: the REST PR list and the remote `plan/` branches (highest before this one: 0010). `plan-id.mjs next` could not fetch trunk `master` or use GraphQL here (trunk is `main`), so the REST list is the check of record. Re-run `plan-id.mjs check` after the branch is pushed.
- **Branch:** `plan/hellog-0011-mcp-product-truth-consumer` · **Repo:** MeruLocal/HelloGrowthCRMwebsite_MCP · **Trunk:** `main` (head `5190a02`)
- **Mode:** PLAN (plan only, no code). Each BUILD is its own PR carrying `Implements: PLAN-HELLOG-0011 (PR-x)`.
- **Change tags:** `public_api`, `product`
- **Tier:** T2. Owed: acceptance_criteria, blast_radius, caller_inventory, compatibility_test, competitor_scan, intent, necessary_changes, planned_file_coverage, premise_check, smoke_test
- **Restricted areas touched:** none. The server states prices; it does not bill.
- **Freeze in force?** Yes: the PLAN-HELLOG-0003 (#102) release gate G1–G5 blocks public deploy of every BUILD.
- **Origin:** founder brief of 2026-11-04, decision D-EXP-51 ("website, MCP and LLM answers consume the same facts"). Brief: `research-methodology/product-truth-engine-founder-brief-2026-11-04.md` in the research repo.
- **Research evidence:** MeruLocal/Hellogrowthcrm-Researchsuite#43
- **Opportunity ID:** OPP-PRODUCT-TRUTH-001
- **Date:** 2026-11-04

## 0. Intent

- **Claim.** On `main`, the MCP server states product facts from hand-typed values in five places, and they disagree with each other and with the product:
  1. `src/tools/alternatives.ts` says "up to 200 leads" on the Free plan in eight comparison rows, and `src/tools/faqs.ts` says "up to 200 leads". The product enforces 150 (Wave 1 singletons audit; `pricing.ts` already says 150). PR #107 corrects these by hand; this plan removes the need to.
  2. `src/data/website-mirror.ts` `COUNTRY_PRICING` and `src/tools/pricing.ts` carry prices as strings per country (`₹899/user/mo + GST`, `$10/user/mo`, `£8/user/mo`). Recorded decisions D-EXP-25/33/40/44/45: USD 12 per user per month or USD 120 per user per year upfront outside India, no tax line.
  3. `src/tools/features.ts` serves availability as `free / t1 / t2 / t3`, tier names that are not the live plan ids (Free, Growth, Enterprise).
  4. No tool serves promotions, and `claims_*` (PLAN-HELLOG-0006, #109) is planned on a research snapshot with no product owner.
  5. Plans 0007 to 0010 (#110–#113) each hand-write a country's price, payment and compliance statements into a per-market data file.
- **Mechanism.** The MCP becomes a **consumer** of the HelloGrowthCRM Product Truth Registry. A build-time snapshot of the registry export is pinned in this repo (phase 1); a client of the Product Truth API replaces the snapshot as the primary source in a later, separately reviewed plan once the API ships (§2e). Every number, plan limit, price, availability and approved claim the tools serve is read from that export; the hand-written copies are deleted, and a ratchet check fails the build if one comes back. Every response from a tool **that has been migrated** carries `truth_version`, `verified_on` and `source`; a tool is migrated, and only then labelled, in the PR where all of its served facts pass through the registry reader, the public filter and the release gates (no label on a hand-written answer).
- **Observable.** "How many leads on the Free plan?" returns 150 from `plans_get`, `features_get`, `alternatives_get` and `faqs_get_site`, with the same `truth_version`. "What does Growth cost in Egypt?" returns USD 12 per user per month or USD 120 per user per year upfront, no tax line, from `pricing_get`. "Does HelloGrowth have X in Nigeria?" returns the plan and country availability, and a roadmap item is never returned as available.
- **Risk.** A snapshot served stale; a draft or roadmap fact served as live; two truth snapshots (this plan and 0005/0006) disagreeing; a registry change that the MCP silently renders wrong; tool-count growth (0003: selection degrades past about 30–50 tools; 91 `defineTool(` calls on `main`); replacing the 0007–0010 values mid-flight.

## 0a. Necessary changes   (planned-file coverage)

**PR-A: infrastructure only: snapshot, generator, reader, gates, test harness** (blocked on the registry export contract, §2a). No tool response changes in PR-A.
- [ ] `test-data/product-truth/<truth_version>/export.json` + `SHA256SUMS`: pinned copy of the registry export. Refreshing it is a human PR that changes the sha, so approval binds to the exact payload.
- [ ] `scripts/product-truth.schema.json` (the consumed contract, §2) and `scripts/build-product-truth.mjs`: validates the export, applies the public filter (only `publication: approved` values), writes `src/data/product-truth.ts` with the source sha256, `truth_version` and `verified_on` in the header. Deterministic, never hand-edited. Unknown `schema_version` fails the build.
- [ ] `src/lib/product-truth.ts`: the only reader. `getPlan(id)`, `getPrice(plan, country, cycle)`, `getLimit(plan, key)`, `getFeatureAvailability(feature, country)`, `getApprovedClaims()`, and `truthEnvelope()` returning `{ truth_version, verified_on, source }`. Resolution order is the registry's (defaults, plan, region, country override, promotion, eligibility); the MCP does not re-implement it, it reads the resolved view the export carries per country (§2).
- [ ] `src/tools/tool-types.ts`: `ok()` accepts an optional envelope merged at top level; no tool passes one in PR-A.
- [ ] The reader applies, in one place, the public filter, the temporal check (`effective_from` / `effective_until` against the request clock) and the 0007 release-gate predicate (§2a step 3), so every later PR inherits withholding. Section freshness limits (§2c) are enforced here.
- [ ] `scripts/check-product-truth.mjs`: `--check` fails if `src/data/product-truth.ts` differs from the pinned export; `--literals` is the ratchet of §2c. `package.json`: `check:truth`, added to `verify`.
- [ ] `src/tools/__tests__/product-truth-reader.test.ts` and the consistency and forbidden-value test **harness** (§6); each migration PR adds its tool to the harness.
- [ ] `README.md`, `CHANGELOG.md`, version strings.

**PR-B: plans, pricing and country prices read the registry** (after PR-A; after 0007 PR-A, §2a)
- [ ] `src/tools/pricing.ts`: `pricing_get_plans` gains an optional `plan` input (what the brief calls `plans_get`) and `pricing_get_country_plans` is what the brief calls `pricing_get` (it already takes `country`); `GLOBAL_PLANS`, the India plan list, `MARKET_SCOPE` and the payment answer of `pricing_get_faq` read `src/lib/product-truth.ts`. **No alias tool is registered**: the brief's names are mapped in `README.md` only, because a description does not make `tools/call("pricing_get")` resolve (decision F1).
- [ ] **Prerequisite owned by this PR (was §11):** the positioning text in `alternatives.ts` that calls HelloGrowthCRM WhatsApp-first or sales-first is rewritten from the registry's positioning claim in the same PR that migrates `alternatives_get`; the AC-B3 scan cannot pass otherwise, so the migration cannot merge without it.
- [ ] `src/data/website-mirror.ts`: `COUNTRY_PRICING` price and payment fields read the registry view; the hand strings are removed.
- [ ] `src/tools/countries.ts`, `src/tools/output-schemas.ts`: envelope fields and nullable price fields (nullable or pending prices are a visible change, listed in §7f, not described as additive).
- [ ] `src/tools/alternatives.ts`, `src/tools/faqs.ts`, `src/tools/buyer-answers.ts`, `src/data/buyer-intents.ts`: every plan limit and price in served text becomes a template over `getLimit` / `getPrice`. (Absorbs PR #107's hand fix; whichever lands second rebases.)

**PR-C: feature availability and approved claims** (after PR-A; `claims_*` from 0006 PR-A if merged)
- [ ] `src/tools/features.ts`: `features_get` and `features_list` gain optional `plan` and `country` inputs and an `availability_by_plan` object keyed by the live plan ids (`free`, `growth`, `enterprise`), each `{ availability: available | not_available }` plus the feature's `lifecycle` (`live | beta`). The legacy `availability.{free,t1,t2,t3}` keys are **derived from the same registry values** through a documented mapping (free to `free`, t1 to `growth`, t2 and t3 to `enterprise`, as the existing meaning of the tiers is confirmed by the PR's grep), so the two shapes cannot disagree; a test asserts agreement. Where `main` served a legacy value the registry contradicts, the registry value is served (a named correction under the §7f exception). The Managed RevOps retainers stay under their own tool. A feature whose `lifecycle` is `roadmap` is served only inside `roadmap[]` with `is_capability: false` and a statement starting "Planned, not available:", and is `not_available` in every availability field, legacy keys included.
- [ ] `src/tools/claims.ts` (created by 0006 PR-A, or by this PR if 0006 has not merged and then rebased): `claims_get` and `claims_list` serve **approved claims only** from the registry's claims section, in place of the research snapshot. A claim carries `claim_id`, `statement`, `scope`, `evidence_ref`, `verified_on`. SOC 2 is served with its attested scope only (Soor LLC, Type II, period 2025-02-01 to 2025-06-30), as a historical attestation, never as "certified".
- [ ] `src/tools/output-schemas.ts`, tests (§6).

**Deferred, not planned here (reviewer cut, §9):** `promotions_list` and the Product Truth API client. Neither has its precondition: no approved offer exists in the registry and the temporal and eligibility semantics are unresolved; the API's security, versioning and revocation contracts do not exist. Each gets its own plan when the precondition is met (requirements already recorded in §2e).

Client documentation: `README.md` gains a section on the truth envelope, the snapshot source, the plan and country inputs, the mapping of the brief's tool names to the existing tools, and the withheld-section reasons. Version and changelog: each BUILD bumps per `npm run check:versions` and adds a `CHANGELOG.md` line.

## 0b. What we already know   (G4)

| Source | What it said | What this plan does about it |
|---|---|---|
| Founder brief 2026-11-04 (research repo) | Free leads 150, one source of truth, API consumed by the MCP, cross-surface consistency, "approved claims, not booleans" | The design above |
| Brief §2 reconciliation | Recorded decisions win over the brief's examples: USD 12 or USD 120 upfront outside India; no tax line; nothing on data residency; SOC 2 within attested scope; HGC is a full-stack suite | Encoded in §2 as consumer-side rules and tests |
| PLAN-HELLOG-0007…0010 (#110–#113) | 0007 PR-A owns the multi-market machinery (generator, schema, policy, gates, predicate, kill switch); markets are data on it | Reused, not rebuilt (§2a): this plan replaces the hand-written values in those data files with registry reads and keeps the gates as release conditions |
| PLAN-HELLOG-0006 (#109) | `claims_list` / `claims_get` on a research snapshot | Same tools, source switched to the registry's approved claims (PR-C) |
| PLAN-HELLOG-0005 (#108) | Category-level capability facts and a discoverability score | Not touched; a registry feature id maps to a category id through the name map when 0005 PR-C lands |
| PLAN-HELLOG-0003 (#102) | No tool growth; one release gate | No new tool; G1–G5 applies |
| PR #107 (open) | Hand fix of 200 to 150 in `faqs` and `alternatives` | Superseded by PR-B's templating; it can merge first |
| hellocrm plan for the registry | In progress; number to be supplied by the founder | Consumed contract in §2b is the MCP's request; the owner plan approves a schema and a representative fixture before PR-A (§2a) |
| `scripts/sync-website-mirror.mjs` | Auto-syncs only integrations, glossary, templates, guides and changelog; alternatives, faqs, solutions and agents are `MANUAL_SURFACES`; `COUNTRY_PRICING` and `pricing.ts` are in neither list | PR-B's fields cannot be overwritten by a mirror sync; a test asserts the sync script's target list excludes them |

## 1. Premise   (G8)

| Claim | Type | Evidence gathered | Running system? |
|---|---|---|---|
| Free-plan leads are stated as 200 in served text | wrong_fact | `grep -rnE "200 leads" src --include=*.ts` (non-test): 10 lines in `alternatives.ts` and `faqs.ts` | not required |
| The same fact is 150 elsewhere in the same server | wrong_fact | `GLOBAL_PLANS` Free limits `leads: 150`; 8 lines say 150 in `pricing.ts` | not required |
| Prices are typed per country, not read | missing_feature | `COUNTRY_PRICING` in `website-mirror.ts`: India `₹899/user/mo + GST`, USA `$10/user/mo` and `$12/user/mo monthly`; non-USD rows carry local-currency strings | not required |
| Feature availability uses non-live tier names | wrong_fact | `PlanAvailability` fields `t1`, `t2`, `t3` in `features.ts`; live plans are Free, Growth, Enterprise | not required |
| No tool serves promotions | missing_feature | no tool name contains `promo` or `offer` (`grep -n 'name: "' src/tools/*.ts`) | not required |
| `truth_version` / `verified_on` are not served | missing_feature | `grep -rn "truth_version\|verified_on" src` returns no hit | not required |
| A pinned export plus generator pattern works in this repo | context | `scripts/sync-website-mirror.mjs` and `check:mirror` already gate the mirror in `verify` | not required |
| The registry export and API exist | external | In progress in hellocrm; no number or schema yet | **BLOCKED**: registry export (founder to supply the plan number) |

The live server was not queried in this session. Every claim is about `main`.

## 2. What changes

### 2a. Dependency order (single order)

1. **Registry export contract.** The hellocrm plan owns the schema. PR-A starts only when the owner has approved a schema **and a representative fixture** that covers the distinctions of §2b (publication, lifecycle, availability, optional country, effective dates, a rejected tenant-scoped record). If the owner chooses another shape, this section is amended first; the MCP does not guess fields.
2. **PR-A** is infrastructure: it changes no served value and adds no response key. It is the owner of the reader, the filter, the gate hook and the test harness.
3. **PR-B** after PR-A and after 0007 PR-A (the multi-market machinery). 0008, 0009 and 0010 PR-A are data on that machinery; where they have not merged when PR-B starts, PR-B's data step replaces their values in the same PR. The market-facts **gates** (`website-deploy`, `stripe-flow1`, `soc2-scope`) are enforced **in the common reader**, so a price, a claim or a limit is withheld for a market whose gate is unmet wherever it appears: country plans, FAQs, comparisons, buyer answers, prompts, resources and `llms.txt` text. A registry value is not a satisfied gate.
4. **PR-C** after PR-A; reuses 0006 PR-A's tools if merged, otherwise creates them and 0006 PR-A rebases onto this.
5. **0003 G1–G5** blocks public deploy; release approver Rushabh; smoke owner the PR author.

**Consumer migration manifest** (every fact-bearing surface is assigned before BUILD; PR-A's inventory run completes it and any surface not listed is a blocker):

| Surface | Files | PR |
|---|---|---|
| Plans, prices, payment text | `src/tools/pricing.ts`, `src/data/website-mirror.ts` `COUNTRY_PRICING` | B |
| Country tools | `src/tools/countries.ts` | B |
| Comparison, FAQ, buyer text | `src/tools/{alternatives,faqs,buyer-answers,solutions}.ts`, `src/data/buyer-intents.ts` | B |
| Prompts, `llms.txt`, resources, well-known text | `src/prompts.ts`, `src/tools/llms-txt.ts`, `src/server.ts` resources, `src/well-known.ts` | B (facts) |
| Agents and changelog text that quote limits or SOC 2 | `src/tools/agents.ts`, `src/tools/changelog.ts` | B (inventory decides; a changelog line is history and stays) |
| Feature availability | `src/tools/features.ts` | C |
| Claims | `src/tools/claims.ts` | C |
| Transports | HTTP and stdio call the same `tools` registry; both are in the SDK round trip | A |

### 2b. Consumed contract (the MCP's request to the registry)

Required top-level: `schema_version`, `truth_version`, `generated_at`, `verified_on`, `visibility: "public"`, and sections `plans`, `limits`, `pricing`, `features`, `claims`, `countries`, `consumers`, `forbidden_values`. Three axes are separate and never reused for each other:

- `publication`: `approved | draft | withheld`. Only `approved` is public. It says whether the record may be served at all.
- `lifecycle` (features and claims): `live | beta | roadmap`. A roadmap record may be approved for publication **as a roadmap fact only**; approval of a roadmap record is an explicit `publication: approved` by its owner, never implied.
- `availability` (per plan and per country): `available | not_available`. A country record is optional; absent means "follow the plan default", and the response says which.

Every value record carries `value`, `publication`, `source`, `owner`, `verified_on`, `effective_from`, `effective_until?`, `confidence`, and a public-safe `evidence_ref` (a public URL or an opaque id; no internal path, no person's name, no NDA material). `consumers` lists, per fact id, the surfaces that must state it (`["mcp", "website", ...]`) and is what the consistency test iterates. `forbidden_values` is a list of `{ pattern, reason }` strings that must never appear in a public surface. Prices carry `list` (base) and, separately, `effective` where an offer applies; phase 1 serves `list` only (§2c). The export carries the **resolved view per country** at generation time (region inherited, overrides applied, tax display mode), so the MCP does no resolution of its own and no FX conversion. The temporal check is the MCP's: it compares `effective_from` and `effective_until` with the request clock and withholds an expired or not-yet-effective record.

**Public-only boundary.** The export is generated by the registry as a public catalog: global list facts only. The schema (`additionalProperties: false`, field allowlists) rejects any record with a tenant, account, customer or negotiated-price field, and rejects non-public `evidence_ref`s; the build fails rather than filters. The pinned file is therefore safe to hold in Git. Authenticity: the export is committed by a human PR approved by the registry owner (CODEOWNERS on `test-data/product-truth/**`), and the sha256 binds the approval to the payload.

### 2c. Rules the MCP enforces on what it reads

- **Recorded decisions win over the brief's examples** (brief §2). Outside India the only prices served are USD 12 per user per month and USD 120 per user per year, charged once upfront, with no tax line; no GBP or EUR price book is served unless the registry carries one that the founder decided. India's tax wording follows the registry's tax rule (GSTIN-conditional, `_shared/billingHandlers/gstinPricing.ts` in the product). An anonymous caller has no GSTIN, so the MCP serves the INR **list** price together with the registry's tax note; if the registry carries no India tax note, the response says "List price; tax treatment is confirmed at checkout" and `payable_amount` is null. The MCP never writes "+GST" or "inclusive" itself, and the existing `+ GST` strings are replaced when PR-B lands (F3). The Growth plan is named Growth.
- **Nothing on data residency.** No registry field is mapped to a residency sentence; a test fails if a served string asserts a data location (targeted patterns, not the bare word).
- **SOC 2** only as the approved claim with its attested scope and period; never "certified", never current assurance.
- **HGC is a full-stack suite.** Positioning text read from the registry names the suite areas and lists WhatsApp as one channel among several; `/WhatsApp-first/i`, `/sales[- ]only/i`, `/sales[- ]first/i` fail the scan.
- **Roadmap facts are never capabilities.** A roadmap record is served with `is_capability: false` and "Planned, not available:"; a feature whose `lifecycle` is not `live` or `beta` is `not_available` in every availability field and absent from `features_list` plan filters.
- **Draft is invisible.** Draft startup, NGO and partner programmes and any `publication: draft` price or claim never reach a response. Offers are not served in phase 1 at all (§9).
- **Base price and effective price are distinct.** The tests assert the registry's `list` price (USD 12 and USD 120 outside India); when a later plan serves offers it adds `effective` beside `list`, never replaces it. Amounts are integers in minor units or exact decimal strings with currency, billing cycle and unit; no float.
- **Freshness limits.** Each section has a maximum age in the reader (prices and limits 30 days from `verified_on`, claims 90, features 60; the registry may override per record). Past the limit the record is withheld with the reason `stale`, `/health` reports truth freshness, and liveness stays separate so staleness never causes a restart loop. Export-level `verified_on` is the export's date; each record's own `verified_on` is what the response quotes next to the value.
- **Ratchet against hand-typed facts.** `check-product-truth.mjs --literals` scans non-test source for plan limits, prices, currency symbols next to digits, and registry `forbidden_values` (for example `200 leads`, `$13`, `1,099`), against an allowlist file that may only shrink. A new literal fails `verify`.
- **No runtime network call on a request.** The snapshot is compiled in.
- **Ratchet scope.** `--literals` excludes `src/data/product-truth.ts` (generated) and tests; scans served-string literals and template pieces, not only whole values; the allowlist is under CODEOWNERS and may only shrink. Values assembled in prose are covered by the AC-B3 response scan, which is the check that sees the final text.

### 2d. Wire contract

Every **migrated** tool adds three top-level keys in the PR that migrates it:

```json
{
  "truth_version": "2026-11-04.1",
  "verified_on": "2026-11-04",
  "source": { "kind": "snapshot", "ref": "test-data/product-truth/2026-11-04.1/export.json", "sha256": "<hex>" }
}
```

`pricing_get_country_plans({"country":"eg"})` (what the brief calls `pricing_get`):

```json
{ "country": "eg", "billing_currency": "USD",
  "plans": [ { "id": "growth", "price": { "monthly": { "amount": 12, "unit": "per user per month" },
                "annual": { "amount": 120, "unit": "per user per year, charged once upfront" } } } ],
  "tax_line": null,
  "truth_version": "…", "verified_on": "…", "source": { "kind": "snapshot", "ref": "…", "sha256": "…" } }
```

`pricing_get_plans({"plan":"free"})` (what the brief calls `plans_get`): `{ "plan": { "id": "free", "limits": { "leads": 150, "accounts": 20, "tasks": 100 } }, … }`.

`features_get({"slug":"dialer","plan":"free","country":"ng"})`: `{ …existing keys…, "availability_by_plan": { "free": { "availability": "not_available" }, "growth": { "availability": "available", "lifecycle": "live" } }, "country_availability": { "ng": { "availability": "available", "plans": ["growth","enterprise"] } }, "roadmap": [] , … }`.

`claims_get({"claim_id":"soc2-type-ii"})`: `{ "claim_id": "…", "statement": "A SOC 2 Type II examination of Soor LLC for 2025-02-01 to 2025-06-30 was completed … The report is available under NDA on request.", "scope": "…", "evidence_ref": "…", "verified_on": "…", … }`. Non-approved claim ids return `fail` with the same message as an unknown id.

Unknown country, plan or feature: `fail` listing the valid ids. The failure reaches the client as an error result, not as an empty success.

### 2e. Requirements recorded for the deferred follow-ups

For the API client plan: monotonic version ordering against the **active** version (not the snapshot); same version with a different payload rejected; atomic whole-view replacement with the payload and envelope captured together per request; a revoked or withdrawn record persisted so that a restart on an older snapshot does not resurrect it; authenticated fetch with publisher authenticity; bounded fetch time and body size; jittered, serialized refresh per replica. For the promotions plan: price shown with an offer needs `list` and `effective`, a withdrawal path covering every surface that embeds the discounted price, and a time-window answer that is clearly current-only unless the registry supplies intervals.

**Withdrawal in phase 1.** A kill switch is a registry revert, a re-pinned export and a redeploy, as in 0007 §2b; it reaches a running process only through a restart or replacement deployment, and the BUILD PR names the hosting platform (the repository ships a `Dockerfile`) and records a drill with the measured propagation time. Responses of truth-backed tools carry `Cache-Control: no-store`, asserted through the deployed HTTP path. Owners: refresh approver and expiry/revocation responder are the registry owner and Rushabh; rollback authority Rushabh; alert is the `/health` truth-freshness degrade.

## 3. Affected files

| Area | Files | PR |
|---|---|---|
| Snapshot and generator | `test-data/product-truth/**`, `scripts/{product-truth.schema.json,build-product-truth.mjs,check-product-truth.mjs}`, `src/data/product-truth.ts`, `src/lib/product-truth.ts`, `src/tools/tool-types.ts`, `package.json`, `.github/CODEOWNERS` | A |
| Pricing and plans | `src/tools/pricing.ts`, `src/data/website-mirror.ts`, `src/tools/countries.ts`, `src/tools/output-schemas.ts` | B |
| Served text with facts | `src/tools/{alternatives,faqs,buyer-answers}.ts`, `src/data/buyer-intents.ts` | B |
| Features and claims | `src/tools/{features,claims}.ts`, `src/tools/output-schemas.ts` | C |
| Truth freshness in health | `src/lib/content-freshness.ts`, `src/server.ts` (health) | A |
| Prompts, resources, well-known, `llms.txt`, solutions | `src/prompts.ts`, `src/server.ts` (resources), `src/well-known.ts`, `src/tools/{llms-txt,solutions}.ts` | B |
| Docs and release | `README.md`, `CHANGELOG.md`, version strings, `deploy/` note | each |
| Tests | see §6 | each |

Not touched: `access.ts`, `server.json`, `smithery.yaml`, `scripts/sync-website-mirror.mjs`, the bot-governance tools. This plan edits neither hellocrm nor hellocrmwebsite.

## 5. Blast radius and caller inventory

Tools changed: `pricing_get_plans`, `pricing_get_country_plans`, `pricing_get_faq`, `pricing_compare_plans`, `country_get`, `countries_list`, `features_list`, `features_get`, `alternatives_get`, `faqs_get_site`, `buyer_answers`, `claims_list` and `claims_get`; no new tool. The manifest in §2a assigns every surface; resources, prompts and `llms.txt` text that quote a limit or price are confirmed by `grep -rnE "150|200|₹899|\\$1[02]|£|GBP|SOC ?2" src --include=*.ts` run in PR-A, every hit assigned to B or C. Today: `₹899` in 5 files (48 lines), `$10/user` in 4 files, `£|GBP` in 3 files, `SOC 2` in 6 files, `150 leads` in 1 file, `200 leads` in 2 files. External callers cannot be listed from the repo. The SDK client round trip is not evidence that existing parsers cope, so each migration PR also replays the captured baseline responses, errors and structured output through the new shapes and lists every key whose type or nullability changes.

## 6. Acceptance criteria   (per PR; none weakened during implementation)

**PR-A (infrastructure; no served change)**
- **AC-A1** Every response of every tool is byte-identical to the baseline fixtures; `tools/list` is identical; tool count equals `main`; SDK round trip succeeds on HTTP and stdio; `annotations.test.ts` and `registry.test.ts` pass.
- **AC-A2** Generation tests: sha mismatch fails the build; unknown `schema_version` fails; `publication` other than `approved` never appears in `src/data/product-truth.ts` public sections; byte-identical output on two runs; a hand-edited generated file fails `check:truth`.
- **AC-A3** Adversarial export fixtures all fail the build or are withheld: a tenant-scoped record, a negotiated-price field, a non-public `evidence_ref`, an expired approved claim, a record with an unknown or missing `effective_from`, a `roadmap` record not approved for publication, same version with a different payload.
- **AC-A4** Reader tests with an injected clock: served at `effective_until - 1ms`, withheld at `effective_until`; stale past the section limit; a record whose 0007 gate is unmet is withheld on every path that reads it; revoking one market's gate leaves every other market's output byte-identical.
- **AC-A5** The ratchet passes with the allowlist it ships and fails on a fixture that adds a limit literal; the harness runs the consistency and forbidden-value checks over an empty tool set.
- **AC-A6** Inventory: the grep of §5 is run, every hit is in the §2a manifest, and the sync-script target list excludes the PR-B fields.

**PR-B (each migrated tool is labelled only in this PR)**
- **AC-B1** For every migrated tool: `truth_version`, `verified_on`, `source` present and equal to the pinned export header; no un-migrated tool carries them.
- **AC-B2** **Cross-surface consistency**: for every fact the export lists under `consumers: ["mcp"]`, the value each migrated tool states equals the registry value. Pinned: Free leads = 150 in `pricing_get_plans`, `alternatives_get`, `faqs_get_site`, `buyer_answers`; Growth list price outside India = USD 12 monthly and USD 120 annual upfront for each registry country.
- **AC-B3** **Forbidden-values scan** over every migrated tool with every fixture argument combination, and over prompts, resources and `llms.txt` text: no registry `forbidden_values` pattern, no `200 leads`, `$13`, `1,099`, the targeted data-residency assertions the decisions forbid, `/SOC 2 certified/i`, `/WhatsApp-first/i`, `/sales[- ]only/i`, `/sales[- ]first/i`. The scan also covers narrative text, so a gate cannot be bypassed by prose.
- **AC-B4** `grep -rnE "200 leads|\$13|1,099" src --include=*.ts` returns nothing outside tests; the allowlist has shrunk.
- **AC-B5** Egypt, Nigeria, South Africa, UK, UAE, Netherlands, USA return USD 12 and USD 120 upfront with `tax_line: null`; India returns the INR list price with the registry tax note or the checkout sentence and `payable_amount: null`; none returns a GBP or EUR amount.
- **AC-B6** A market whose 0007 gate is unmet serves `price_status: pending_verification` in `country_get`, `pricing_*`, FAQ, comparison and buyer text alike although the registry holds a value.
- **AC-B7** Compatibility matrix (§7f) holds against the captured baseline, including error shapes and structured output; every nullable or newly pending field is listed.

**PR-C**
- **AC-C1** `features_get` with `plan=free` for a Growth-only feature says `not_available`; with `country` set, availability follows the registry's country record, or says it follows the plan default; the legacy `availability.{free,t1,t2,t3}` keys agree with `availability_by_plan` for every feature (test), and any value that differs from `main` is listed in the PR body as a named correction.
- **AC-C2** A registry feature with `lifecycle: roadmap` appears only in `roadmap[]` with `is_capability: false` and the "Planned, not available:" prefix; it is `not_available` in every availability field.
- **AC-C3** `claims_get` returns an approved, unexpired claim and `fail` for a draft, expired or unknown one with the same message; the SOC 2 claim states entity, period and NDA availability and no current-assurance wording.
- **AC-C4** Tools migrated in this PR obey AC-B1 to AC-B3.

## 7b. Smoke test   (expected only; the BUILD PR records observed results)

| # | Call | Expected |
|---|---|---|
| 1 | `pricing_get_plans({"plan":"free"})` | `limits.leads` 150; envelope present |
| 2 | `pricing_get_country_plans({"country":"eg"})` | USD 12 monthly, USD 120 annual upfront, `tax_line` null, envelope present |
| 3 | `faqs_get_site` Free-plan answer and `alternatives_get` Free row | 150, same `truth_version` as call 1 |
| 4 | `features_get({"slug":"<growth-only feature>","plan":"free"})` | not available on Free; legacy keys unchanged |
| 5 | `claims_get` SOC 2 (after PR-C) | historical attestation with entity and period |
| 6 | pattern scan of every response above | no AC-B3 match |

## 7e. Competitors

Competitor MCP servers were not read this session. Competitor prices are not served (research rule R9).

## 7f. Compatibility test: per-tool contract matrix

Fixtures are captured from the deployed server before PR-A, or from `main` if the server is unreachable (BLOCKED, then stated), and at the commit that contains each PR's dependencies.

| Tool | PR-A | PR-B | PR-C |
|---|---|---|---|
| `pricing_*`, `country_get`, `countries_list` | none | + envelope; price and payment fields read the registry; hand strings removed; some price fields may be null or pending (visible change) | none |
| `features_list`, `features_get` | none | none | + envelope, `availability_by_plan`, `country_availability`, `roadmap`; optional `plan`, `country` inputs; legacy keys derived from the registry |
| `alternatives_get`, `faqs_get_site`, `buyer_answers` | none | + envelope; limit and price text from the registry | none |
| `claims_*` | none | none | source switched to approved registry claims |

**Compatibility exception (named).** PR-B replaces hand-written values that were already wrong or are superseded by recorded decisions (200 leads, GBP and local-currency prices, `+ GST` wording, "certified"). This is an exception to D-EXP-16 (additive only), authorised by D-EXP-51 and the decisions D-EXP-25/33/40/44/45. PR-C adds the corrections of legacy availability values to the same exception. Nothing else is removed.

## 8. Risks and edge cases

| Risk | Mitigation |
|---|---|
| Snapshot older than the website after a price change | Per-record `verified_on` served; section freshness limits withhold stale records; `check:truth` proves reproducibility only, so freshness is the reader's job (§2c) |
| A registry shape change breaks rendering silently | Schema validation at build and at API load; unknown `schema_version` fails closed |
| Draft or roadmap leaks as live | Public filter at generation, AC-A2, AC-C2 |
| Registry value served for a market whose Stripe or website evidence is missing | The 0007 gates sit in the common reader (§2a); AC-A4, AC-B6 |
| 0007–0010 merge hand values first | §2a step 3: PR-B replaces them in its own data step; no plan blocks the other |
| Two truth snapshots (0005/0006 and this one) disagree | One generator reads one export; the research claim snapshot of 0006 is replaced by the registry claims in PR-C |
| Tool-selection degradation | No new tool; the brief's names are documentation only (F1) |
| Private data in a pinned export | Public-only schema with field allowlists, build fails on tenant-scoped records (§2b) |
| Wrong answer labelled as verified | PR-A labels nothing; a tool is labelled only in the PR that migrates all of its facts (§0) |

## 9. What this deliberately does NOT do

No FX conversion and no GBP or EUR price book. No data-residency sentence. No tax line outside India. No draft programme served. No MCP-side resolution logic or pricing arithmetic. No edit to hellocrm, hellocrmwebsite or the registry. No change to the bot-governance tools. No `pricing_get`, `plans_get` or `claims_get` created as duplicates of existing tools, and no alias tool.

Deferred, with the reason (reviewer cut, 2026-11-04): **`promotions_list`** (the brief names it; no approved offer exists in the registry, and the temporal and eligibility semantics are unresolved, so a tool would return an empty array) and the **Product Truth API client** (the API's security, versioning and revocation contracts do not exist). Both are recorded in §2e and each gets its own plan. The founder may override either cut.

## 10. Decisions owed

- **F1** Brief tool names versus tool count: map `pricing_get` and `plans_get` to the existing tools in the README only (default; 0003 caps tool growth), or add them as new tools.
- **F2** The hellocrm registry plan number, an approved schema and a representative fixture (§2a step 1).
- **F3** India wording while the registry has no India tax note: INR list price plus "tax treatment is confirmed at checkout" and a null payable amount (default), versus keeping `+ GST` as PR #91 set it; the product rule is GSTIN-conditional.
- **F4** Startup, NGO and partner programme values: not in recorded decisions; withheld until approved in the registry.
- **F5** Refresh path for the pinned export: a scheduled PR with a human merge (default).
- **F6** Whether the cuts of `promotions_list` and the API client stand (default: cut).

## 11. Findings outside this plan   (recorded, not fixed here)

- `src/data/website-mirror.ts` USA `compliance: "SOC 2, HIPAA and IRS filings"` asserts HIPAA; the mirror comment says SOC 2 is "certified" (`grep -n "HIPAA\|certified" src/data/website-mirror.ts`).
- `src/tools/alternatives.ts` describes HelloGrowthCRM as WhatsApp-first or sales-first in several rows (`grep -n "WhatsApp-first\|Sales-first" src/tools/alternatives.ts`). PR-B owns the rewrite of this text (a prerequisite of migrating `alternatives_get`, §0a).
- `COUNTRY_PRICING` USA row `growthPriceShort: "$10/user/mo"` states the annual price as a monthly equivalent; the decision is USD 120 per user per year upfront.

## 12. Estimated token cost

Estimate, not a quote; input tokens at $3/M.

| PR | Low | Expected | High |
|---|---|---|---|
| A (infrastructure, reader, harness) | 0.8M | 1.1M | 1.6M |
| B (pricing, plans, served text, positioning rewrite) | 1.2M | 1.8M | 2.6M |
| C (features, claims) | 0.6M | 0.9M | 1.3M |
| **Total** | **2.6M** | **3.8M** (about $11) | **5.5M** |

This plan PR: about 0.4M.

## 13. Validation (this plan PR)

- **PASS**: plan id 0011 free: REST PR list and remote `plan/` branches show PLAN-HELLOG-0001 to 0010 only.
- **PASS**: `main` @ `5190a02`: `200 leads` in 10 non-test lines of `alternatives.ts` and `faqs.ts`; `COUNTRY_PRICING` holds per-country price strings; `features.ts` uses `t1/t2/t3`; no `truth_version` in `src`; 91 `defineTool(` calls.
- **PASS**: the brief and its §2 reconciliation read from the research repo at the head of `claude/usa-competitors-list-5373vp`.
- **UNVERIFIABLE**: the live server; competitor MCP inventories.
- **BLOCKED**: the registry export and API (hellocrm plan in progress; number to come from the founder).
- **PASS**: one Astra blind review run on rev 1 (reject), folded into rev 2; the re-review result is in the review record.

## Review record

Astra, blind, role plan, 2026-11-04.

**Review 1, on revision 1: REJECT** (seven blockers). Checked against the plan and the repo before anything changed.

| # | Finding | Verdict | Change in revision 2 |
|---|---|---|---|
| 1 | PR-A cannot meet its criteria; the envelope would label hand-written answers as verified | Accepted. True | PR-A is infrastructure only; a tool is labelled in the PR that migrates all its facts; the positioning rewrite is owned by PR-B |
| 2 | Contract mixes record status, feature status and availability; `consumers` and `forbidden_values` undefined | Accepted | Three axes (`publication`, `lifecycle`, `availability`), fields defined, representative fixture required (§2a, §2b) |
| 3 | Byte-identical legacy tier keys preserve misinformation | Accepted | Legacy keys derived from the registry, agreement test, named correction (§0a PR-C, AC-C1) |
| 4 | API fallback can resurrect withdrawn facts | Accepted | API client cut from this plan; requirements recorded (§2e) |
| 5 | Time-dependent facts cannot be answered from a generation-time view | Accepted | Current-time only; request-clock temporal check in the reader; no `as_of` |
| 6 | Kill switch late; gates must be in the common reader | Accepted | Gates and withholding in PR-A's reader; redeploy-based withdrawal with a drill (§2a, §2e) |
| 7 | "Approved" is not a public-data boundary | Accepted | Public-only export, `additionalProperties: false`, tenant records rejected, public-safe evidence refs, CODEOWNERS (§2b) |
| Cut | `promotions_list`, API client, alias descriptions | Accepted | Deferred (§9, F6); aliases are README-only (F1) |
| Risks | India tax, base vs effective price, freshness, mirror ownership, wire migration | Accepted | §2c, §0b (mirror does not sync these fields), §7f |

**Review 2, on revision 2: REJECT** (six blockers). One fold only, per the run's procedure; the plan is therefore **not final** and the REJECT is unresolved until a later non-REJECT review of a folded version.

| # | Finding | Verdict | Disposition |
|---|---|---|---|
| 1 | Gate dependency not closed for PR-C; reader has no market context; global vs market-scoped facts undefined | Accepted. True | **Open**: rev 3 must put the gate machinery before PR-A or inject a fail-closed interface, and type facts as global or market-scoped |
| 2 | Unsupported compliance string (`SOC 2, HIPAA and IRS filings`) left inside a labelled surface | Accepted. True | **Open**: rev 3 assigns every compliance statement to a migration PR and withholds unsupported ones; `country_get` is not labelled before then |
| 3 | No response contract for stale, future-effective, partial withholding | Accepted | **Open**: rev 3 defines a discriminated reader result with reason codes and prose rendering, evaluated at response construction |
| 4 | Contract inconsistent (`status` vs `publication`; money scale) | Accepted | `publication` made the single field in the generator text (this revision); **open**: exact money representation and wire conversion |
| 5 | Envelope `verified_on` can overwrite a fact's own `verified_on` | Accepted | **Open**: rev 3 renames the export-level key and defines precedence |
| 6 | Schema validation does not make a pinned payload safe for Git | Accepted | **Open**: rev 3 requires an owner-produced, content-reviewed public artifact and synthetic adversarial fixtures |
| Risks and missing | Withdrawal beyond the hosted fleet, synchronized expiry, checkout contract, cross-estate drift, compatibility versioning, extra tests, historical `truth_version` reuse, 0005 mapping owner | Accepted | **Open** for rev 3 |
| Mechanical | `getPromotions` in PR-A; stale AC references; affected-files table; blanket `/residen/i` and `/certified/i` bans | Accepted | **Fixed in this revision** (unreviewed) |
| Cut | `getPromotions` | Accepted | Removed |

The reviewer's one thing (a market-aware, request-time withholding contract: typed outcomes, provenance, gate dependencies, rendering) is the main work of revision 3. No BUILD starts from this plan until it is folded and re-reviewed.

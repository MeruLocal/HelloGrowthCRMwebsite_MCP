# Plan — MCP: serve the Product Truth Registry (one set of facts for pricing, plans, features, promotions and claims)

- **Revision:** 3 (2026-11-04), aligned to the Product Truth Contract v1 of PLAN-HGC-0749 (MeruLocal/hellocrm #10297, section 2a); sibling consumer PLAN-HCW-0257 (hellocrmwebsite #2358)
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
- **Mechanism.** The MCP becomes a **consumer** of the HelloGrowthCRM Product Truth Registry. A build-time snapshot of the registry's `mcp` projection and its signed envelope is pinned in this repo (phase 1); a client of the Product Truth API replaces the snapshot as the primary source in a later, separately reviewed plan once the API ships (§2e). Every number, plan limit, price, availability and approved claim the tools serve is read from that export; the hand-written copies are deleted, and a ratchet check fails the build if one comes back. Every response from a tool **that has been migrated** carries `truth_version`, `released_on`, `valid_until` and `snapshot`, and each quoted fact carries its own `verified_on`; a tool is migrated, and only then labelled, in the PR where all of its served facts pass through the registry reader, the public filter and the release gates (no label on a hand-written answer).
- **Observable.** "How many leads on the Free plan?" returns 150 from `plans_get`, `features_get`, `alternatives_get` and `faqs_get_site`, with the same `truth_version`. "What does Growth cost in Egypt?" returns USD 12 per user per month or USD 120 per user per year upfront, no tax line, from `pricing_get`. "Does HelloGrowth have X in Nigeria?" returns the plan and country availability, and a roadmap item is never returned as available.
- **Risk.** A snapshot served stale; a draft or roadmap fact served as live; two truth snapshots (this plan and 0005/0006) disagreeing; a registry change that the MCP silently renders wrong; tool-count growth (0003: selection degrades past about 30–50 tools; 91 `defineTool(` calls on `main`); replacing the 0007–0010 values mid-flight.

## 0a. Necessary changes   (planned-file coverage)

**PR-A: infrastructure only: snapshot, generator, reader, gates, test harness** (blocked on the registry export contract, §2a). No tool response changes in PR-A.
- [ ] `test-data/product-truth/<truth_version>/truth.mcp.json`, `release.mcp.<target>.json` and `SHA256SUMS`: the pinned `mcp` projection and its signed release envelope (contract v1). Refreshing it is a human PR that changes the sha, so approval binds to the exact payload.
- [ ] `scripts/product-truth.schema.json` (the consumed contract, §2) and `scripts/build-product-truth.mjs`: verifies the envelope signature, digest, target and `result: pass` (public key committed; no credentials), validates the projection against the registry's public schema, and writes `src/data/product-truth.ts` with the source sha256, `truth_version`, `released_on` and `valid_until` in the header. The projection already contains only `state: approved` records; the reader re-checks. Deterministic, never hand-edited. Unknown `schema_version` fails the build.
- [ ] `src/lib/product-truth.ts`: the only reader. `getPlan(id)`, `getPrice(plan, country, cycle)`, `getLimit(plan, key)`, `getFeatureAvailability(feature, country)`, `getApprovedClaims()`, and `truthEnvelope()` returning `{ truth_version, released_on, valid_until, snapshot }`. Every `get*` returns the discriminated result of section 2c1, never a bare value. Resolution order is the registry's (defaults, plan, region, country override, promotion, eligibility); the MCP does not re-implement it, it reads the resolved view the export carries per country (§2).
- [ ] `src/tools/tool-types.ts`: `ok()` accepts an optional envelope merged at top level; no tool passes one in PR-A.
- [ ] The reader applies, in one place, the state check, the temporal check (`effective_from` / `effective_until` against the request clock) and the 0007 release-gate predicate (§2a step 3), so every later PR inherits withholding. The freshness rule (§2c) is enforced here.
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
| PLAN-HGC-0749 (hellocrm #10297) | The registry owner plan; section 2a is the one contract (names, states, cadence, fallback, signed envelope, conformance fixture) | Consumed as written; this plan defines no field of its own (§2b) |
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
| The registry export exists | external | Planned in hellocrm #10297 (PLAN-HGC-0749); not built | **BLOCKED**: PR-2 of that plan (artifact and fixture) |

The live server was not queried in this session. Every claim is about `main`.

## 2. What changes

### 2a. Dependency order (single order)

1. **Registry export contract.** PLAN-HGC-0749 section 2a owns the schema. PR-A starts only when that plan's `mcp` projection, its envelope and the conformance fixture `product-truth/fixtures/contract-v1/` exist. If the owner changes a field, §2b here is amended first; the MCP does not guess fields.
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

### 2b. Consumed contract (by reference)

The MCP consumes PLAN-HGC-0749 section 2a unchanged and redefines nothing: the `mcp` projection and its layout (`plans`, `limits`, `pricing`, `tax`, `features`, `claims`, `countries`, `withheld`, `consumers`, `forbidden_values`), the names (`schema_version`, `truth_version`, `generated_at`, `valid_until`, `released_on`, per-record `verified_on`), the state vocabulary (`state`: draft, undecided, approved, withdrawn; `lifecycle`: live, beta, pilot, roadmap; `availability`: available, not_available; derived `future`, `expired`), money as integer minor units plus currency (the earlier "amount: 12" wire example becomes `amount_minor: 1200` with `currency`; the wire keeps the integer and adds a formatted `display` string produced by the MCP's formatter), cadence and the single fallback (a previously pinned, verified snapshot until its `valid_until`). Differences from this plan's earlier wording are resolved in favour of the contract: `publication` is `state`; the envelope's date is `released_on` and can never overwrite a fact's `verified_on`.

**Public-only boundary.** The contract's public schema rejects unknown fields, tenant, account, customer and negotiated-price fields and non-public `evidence_ref`s; the build fails rather than filters. Authenticity is the signed envelope plus CODEOWNERS review of `test-data/product-truth/**`; because a signature proves origin and not public suitability, an owner-produced, content-reviewed artifact and the synthetic adversarial fixtures of AC-A3 are both required before a pin is merged.

### 2c. Rules the MCP enforces on what it reads

- **Recorded decisions win over the brief's examples** (brief §2). Outside India the only prices served are USD 12 per user per month and USD 120 per user per year, charged once upfront, with no tax line; no GBP or EUR price book is served unless the registry carries one that the founder decided. India's tax wording follows the registry's `tax` section (`tax_mode: exclusive` and the GST rule). Until PLAN-HGC-0749 PR-0 closes the open contradiction between the product code and its documentation on whether the GSTIN changes the price, the MCP serves the INR **list** price with the registry's tax note only if the registry marks it verified; otherwise the response says "List price; tax treatment is confirmed at checkout" and `payable_amount` is null. The MCP never writes "+GST" or "inclusive" itself, and the existing `+ GST` strings are replaced when PR-B lands (F3). The Growth plan is named Growth.
- **Nothing on data residency.** No registry field is mapped to a residency sentence; a test fails if a served string asserts a data location (targeted patterns, not the bare word).
- **SOC 2** only as the approved claim with its attested scope and period; never "certified", never current assurance.
- **HGC is a full-stack suite.** Positioning text read from the registry names the suite areas and lists WhatsApp as one channel among several; `/WhatsApp-first/i`, `/sales[- ]only/i`, `/sales[- ]first/i` fail the scan.
- **Roadmap facts are never capabilities.** A roadmap record is served with `is_capability: false` and "Planned, not available:"; a feature whose `lifecycle` is not `live` or `beta` is `not_available` in every availability field and absent from `features_list` plan filters.
- **Draft is invisible.** Draft startup, NGO and partner programmes and any `state: draft` price or claim never reach a response. Offers are not served in phase 1 at all (§9).
- **Base price and effective price are distinct.** The tests assert the registry's `list` price (USD 12 and USD 120 outside India); when a later plan serves offers it adds `effective` beside `list`, never replaces it. Amounts are integers in minor units or exact decimal strings with currency, billing cycle and unit; no float.
- **Freshness.** One rule, the contract's: the pinned snapshot is accepted for 14 days from `generated_at` and never past its `valid_until`; the refresh pull request is made at least weekly and within two business days of a price, limit or claim change. Past either bound every price, limit and claim record is withheld with the reason `stale` and the prose rendering of §2c1; `/health` reports truth freshness, with an alert when fewer than 3 days remain, and liveness stays separate so staleness never causes a restart loop. All records share one envelope, so they expire together; that is intended, and the weekly refresh keeps the margin. Each record's own `verified_on` is what the response quotes next to its value.
- **Ratchet against hand-typed facts.** `check-product-truth.mjs --literals` scans non-test source for plan limits, prices, currency symbols next to digits, and registry `forbidden_values` (for example `200 leads`, `$13`, `1,099`), against an allowlist file that may only shrink. A new literal fails `verify`.
- **No runtime network call on a request.** The snapshot is compiled in.
- **Ratchet scope.** `--literals` excludes `src/data/product-truth.ts` (generated) and tests; scans served-string literals and template pieces, not only whole values; the allowlist is under CODEOWNERS and may only shrink. Values assembled in prose are covered by the AC-B3 response scan, which is the check that sees the final text.

### 2c1. Reader result and market context

The reader takes `{country?, plan?, surface: "mcp"}` and returns a discriminated result: `{status: "served", value, verified_on, lifecycle?}` or `{status: "withheld", reason}` with `reason` one of the contract's `draft`, `undecided`, `withdrawn`, `future`, `expired`, `surface_not_approved`, plus the consumer-side `stale` and `gate_unmet`. It is evaluated at response construction with the request clock, never at build. Facts are typed `global` or `market` (a country record); a market fact is served only if `isMarketGateMet(country, gate)` is true, an interface injected into the reader whose default in PR-A is **fail closed** (unknown gate or market returns false). 0007 supplies the real implementation; the gates (`website-deploy`, `stripe-flow1`, `soc2-scope`) are release conditions kept from 0007, and a registry value is not a satisfied gate. Prose rendering of a withheld result: "Not available from this server right now; check the pricing page." for prices and limits, and for a claim the same sentence with the claim name. A partial result (some of a response's facts served, some withheld) sets `partial: true` and lists withheld ids.

**Compliance strings.** Every compliance statement in a served surface is assigned to a migration PR and withheld unless backed by an approved claim. `country_get` and the USA mirror row (`SOC 2, HIPAA and IRS filings`) are assigned to PR-B; until PR-B merges, `country_get` carries no truth label, and in PR-B the unsupported HIPAA and IRS filing statements are removed (a correction toward the recorded facts, not a qualification of a claim a build could make true).

### 2c2. Additional reader and wire rules

1. **List price only.** The `pricing` section of the projection is the promotion-free list-price view (PLAN-HGC-0749 contract); promotions are a separate section the MCP does not read in phase 1. The MCP never reconstructs a list price. The conformance fixture includes an active promotion; a test shows it cannot change any phase-1 price or prose.
2. **Market context.** Each fact has a class: `global` (plan limits, plan names, Growth list price outside India) or `market` (a country record, a tax note, a market gate). A call without `country` returns global facts only and, for market facts, says that a country is needed; it never obtains a gated market fact through a default lookup. A mixed-market response withholds only the affected records and sets `partial: true`. One request clock and one gate-state view are captured at the start of a request and used for the whole response.
3. **Expiry blocks everything.** Past `valid_until` or the 14-day bound, every truth-backed fact is withheld: prices, limits, claims, feature availability, positioning and payment text, in tools, prompts and resources alike; there is no exception. Unknown availability is `unknown` in the wire (a withheld result), never `not_available`. PR-C tools, prompts and resources are exercised by an integration test that advances the clock after server start and repeats the same calls.
4. **No materialisation.** Rendered facts are not captured at module initialisation or cached beyond their validity and gate state; `COUNTRY_PRICING`, buyer templates, prompts and resource text are computed per request.
5. **Concrete wire schemas.** Before BUILD, `output-schemas.ts` freezes one schema and one example each for a served, a partially withheld, a wholly withheld and a stale response, including legacy fields, `price_status`, `partial`, `withheld[{id, reason}]` and the prose rendering. A fact in a response always carries its own `verified_on`; the Free-plan example in §2d shows it.
6. **Compatibility.** A factual correction is allowed; a structural change (a string becoming null, a new pending variant, changed nesting) is not covered by that allowance. Non-additive changes are listed per tool in §7f, announced in `CHANGELOG.md` with a deprecation period of one release for the old field, and tested with an old-parser fixture per tool, or declared as a breaking release.
7. **Withdrawal window.** The supported window is the contract's one hour for the centrally hosted HTTP server; stdio installations and LLM conversation history are outside it and the README says so.
8. **Refresh operations.** `.github/workflows` is billing-blocked, so the refresh is a locally scheduled job (owner: the refresh approver named in §2e) that opens the weekly pull request, with an alert for a failed or missed refresh and a deployment-age metric on `/health`; acceptance: AC-A8.
9. **Key lifecycle.** The envelope carries a key id; the build verifies against the committed current and next keys and the revocation file; negative tests cover an invalid signature, a wrong target, a non-`pass` result and a rollback to an older still-valid release (rejected when its `truth_version` is below the active one).
10. **Release conditions tracked.** 0007's real gate implementation and 0005's capability snapshot are release conditions for PR-B and PR-C; a market whose gate is unmet is intentionally withheld. `claims_*` are migrated if 0006 has merged; otherwise PR-C leaves their introduction to 0006 and the tool-count review.

### 2d. Wire contract

Every **migrated** tool adds three top-level keys in the PR that migrates it:

```json
{
  "truth_version": "2026-11-04.3fa9c1d27b0e",
  "released_on": "2026-11-04",
  "valid_until": "2026-11-18T00:00:00Z",
  "snapshot": { "kind": "pinned", "ref": "test-data/product-truth/2026-11-04.3fa9c1d27b0e/truth.mcp.json", "sha256": "<hex>" }
}
```

`pricing_get_country_plans({"country":"eg"})` (what the brief calls `pricing_get`):

```json
{ "country": "eg", "billing_currency": "USD",
  "plans": [ { "id": "growth", "price": { "monthly": { "amount_minor": 1200, "currency": "USD", "display": "USD 12", "unit": "per user per month", "verified_on": "2026-11-04" },
                "annual": { "amount_minor": 12000, "currency": "USD", "display": "USD 120", "unit": "per user per year, charged once upfront", "verified_on": "2026-11-04" } } } ],
  "tax_line": null,
  "truth_version": "…", "released_on": "…", "valid_until": "…", "snapshot": { "kind": "pinned", "ref": "…", "sha256": "…" } }
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
- **AC-A2** Generation tests: sha mismatch fails the build; unknown `schema_version` fails; `state` other than `approved` never appears in `src/data/product-truth.ts` public sections; byte-identical output on two runs; a hand-edited generated file fails `check:truth`.
- **AC-A3** Adversarial export fixtures all fail the build or are withheld: a tenant-scoped record, a negotiated-price field, a non-public `evidence_ref`, an expired approved claim, a record with an unknown or missing `effective_from`, an unknown `state`, `lifecycle` or reason, a float amount, script-like or oversize strings, an unknown key, a `roadmap` record not approved for publication, same version with a different payload; plus the conformance fixture of the registry, copied and pinned by sha256, on which the reader tests run.
- **AC-A4** Reader tests with an injected clock: served at `effective_until - 1ms`, withheld at `effective_until`; stale past 14 days from `generated_at` or past `valid_until`, with the `stale` reason and prose rendering; a record whose 0007 gate is unmet is withheld on every path that reads it; revoking one market's gate leaves every other market's output byte-identical.
- **AC-A7** Reader results: each of `served` and the eight `withheld` reasons is returned for a fixture; an unknown market or gate is withheld (fail closed); a partial response sets `partial` and lists the withheld ids; the envelope `released_on` never overwrites a fact's `verified_on`.
- **AC-A8** Refresh and keys: the refresh job opens a pull request in a dry run; a missed-refresh alert fires in a test; the negative key tests of §2c2 item 9 pass.
- **AC-A5** The ratchet passes with the allowlist it ships and fails on a fixture that adds a limit literal; the harness runs the consistency and forbidden-value checks over an empty tool set.
- **AC-A6** Inventory: the grep of §5 is run, every hit is in the §2a manifest, and the sync-script target list excludes the PR-B fields.

**PR-B (each migrated tool is labelled only in this PR)**
- **AC-B1** For every migrated tool: `truth_version`, `released_on`, `valid_until`, `snapshot` present and equal to the pinned envelope, and each fact's own `verified_on` present and never replaced by an envelope date; no un-migrated tool carries them.
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
- **F2** Closed by reference: the registry plan is PLAN-HGC-0749 (#10297); its contract v1 and fixture are the schema (§2a step 1).
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
- **BLOCKED**: the registry artifact and fixture (owner plan PLAN-HGC-0749, hellocrm #10297, PR-2); BUILD stays blocked until they exist.
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

**Review 2, on revision 2: REJECT** (six blockers). Revision 3 folds the open items below (see the dispositions). One fold only, per the run's procedure; the plan is therefore **not final** and the REJECT is unresolved until a later non-REJECT review of a folded version.

| # | Finding | Verdict | Disposition |
|---|---|---|---|
| 1 | Gate dependency not closed for PR-C; reader has no market context; global vs market-scoped facts undefined | Accepted. True | Folded in rev 3 (§2c1): fail-closed injected gate interface; facts typed global or market |
| 2 | Unsupported compliance string (`SOC 2, HIPAA and IRS filings`) left inside a labelled surface | Accepted. True | Folded in rev 3 (§2c1): every compliance statement assigned; `country_get` unlabelled until PR-B |
| 3 | No response contract for stale, future-effective, partial withholding | Accepted | Folded in rev 3 (§2c1, AC-A7) |
| 4 | Contract inconsistent (`status` vs `publication`; money scale) | Accepted | `publication` made the single field in the generator text (this revision); folded in rev 3: integer minor units plus currency (§2b, §2d) |
| 5 | Envelope `verified_on` can overwrite a fact's own `verified_on` | Accepted | Folded in rev 3: envelope `released_on`; a fact's own `verified_on` always wins (§2b) |
| 6 | Schema validation does not make a pinned payload safe for Git | Accepted | Folded in rev 3 (§2b, AC-A3) |
| Risks and missing | Withdrawal beyond the hosted fleet, synchronized expiry, checkout contract, cross-estate drift, compatibility versioning, extra tests, historical `truth_version` reuse, 0005 mapping owner | Accepted | Folded where contract-owned: withdrawal drill and signed control data (the contract), single freshness rule (§2c), compatibility replay (§7f); the checkout contract and cross-estate drift stay with 0007 and the registry owner |
| Mechanical | `getPromotions` in PR-A; stale AC references; affected-files table; blanket `/residen/i` and `/certified/i` bans | Accepted | **Fixed in this revision** (unreviewed) |
| Cut | `getPromotions` | Accepted | Removed |

The reviewer's one thing (a market-aware, request-time withholding contract: typed outcomes, provenance, gate dependencies, rendering) is the main work of revision 3. No BUILD starts from this plan until it is folded and re-reviewed.


## Review record: Astra blind, round 3 (revision 3)

ACCEPT-WITH-CHANGES. Five blockers (list-price view, wire schemas, market classification, expiry coverage, compatibility) and the listed risks folded as §2c2; the registry contract gained the promotion-free `pricing` view. Left open for BUILD: the exact frozen schemas (§2c2 item 5), the token-estimate section (kept as planning information only, not an acceptance criterion), and cross-surface coordination of a price change across this server, the website and checkout (owner: the registry owner's release policy).

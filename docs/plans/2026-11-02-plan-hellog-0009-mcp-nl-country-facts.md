# Plan — MCP: Netherlands country facts (pricing, payments, pages, security attestation)

- **Revision:** 3 (2026-11-02), folds the Astra blind review of revision 2 (§14, "Revision 3"). Built on the contract of PLAN-HELLOG-0007 (#110) revision 4 after its Astra reviews; this plan restates what it needs so it can be read alone.
- **Plan id:** PLAN-HELLOG-0009, allocated 2026-11-02 as the next free number after PLAN-HELLOG-0008 (#111). Sources: remote `plan/` branches and the REST PR list (highest plan title before this one: 0008). The adapter's `git fetch origin master` and GraphQL reads fail here (trunk is `main`; GraphQL is blocked), so the REST list is the check of record. Re-run `plan-id.mjs check` after the branch is pushed.
- **Branch:** `plan/hellog-0009-mcp-nl-country-facts` · **Repo:** MeruLocal/HelloGrowthCRMwebsite_MCP · **Trunk:** `main` (head `5190a02`)
- **Mode:** PLAN (plan only, no code). Each BUILD is its own PR carrying `Implements: PLAN-HELLOG-0009 (PR-x)`.
- **Change tags:** `public_api`, `product`
- **Tier:** T2. Owed: acceptance_criteria, blast_radius, caller_inventory, compatibility_test, competitor_scan, intent, necessary_changes, planned_file_coverage, premise_check, smoke_test
- **Restricted areas touched:** none. The server states prices; it does not bill.
- **Freeze in force?** Yes: the PLAN-HELLOG-0003 (#102) release gate G1–G5 blocks public deploy of every BUILD.
- **Origin:** founder standard D-EXP-14 (2026-11-02). Research: MeruLocal/Hellogrowthcrm-Researchsuite#96 (branch `claude/six-market-nl`); contract in `research-methodology/six-market-plan-2026-11-02.md` §7c, §7f.
- **Research evidence:** MeruLocal/Hellogrowthcrm-Researchsuite#96
- **Opportunity ID:** OPP-SIX-NL-001
- **Date:** 2026-11-02

## 0. Intent

- **Claim.** On `main` (`src/data/website-mirror.ts`, `src/tools/pricing.ts`, `src/tools/countries.ts`):
  1. The server has **no Netherlands data at all**: `COUNTRIES` and `COUNTRY_PRICING` hold eight hubs, none for NL, and `country_get({code:"nl"})` returns the not-found `fail`. An assistant asked about Dutch pricing falls back to the global ladder or to guesses.
  2. The website currently shows EUR (EUR 11 monthly, EUR 9 annual, "facturatie in euro's", "exclusief btw") on `/nl/prijzen` and 31 content modules, which is being corrected (D-EXP-40, D-EXP-44). The MCP must say **USD 12 per user per month, or USD 120 per user per year charged once upfront**, and must never repeat the EUR figures or the "billed in euro" claim (the website's own module header notes that no EUR SKU exists).
  3. Payments: subscriptions are paid via Stripe (flow 1). iDEAL and Mollie collection for tenants is queued, and GoCardless is roadmap (PLAN-HGC-0723). None is live. `/crm-netherlands` itself says payment is by card rather than iDEAL.
  4. The 39 `/nl/*` pages are `nl-NL`; in source they are `nativeReviewed: false`, which (per the research reading of `review-status.ts`) makes them `noindex` and keeps them out of the sitemap. The MCP says only that, tied to a pinned source revision.
  5. Compliance (AVG/GDPR, BTW 21% and 9%, KvK, Peppol) is `unverified` in the research registry (the host was outside the research session's allowlist). It must not be asserted.
  6. Six `/nl` pages state a SOC 2 Type II study "under our US entity Soor LLC"; scope evidence is pending in the research register.
- **Mechanism.** PR-A adds the Netherlands as an additional market on the existing `country_get` (and `additional_markets` on `countries_list`) with versioned `market_facts` built by 0007's generator; price facts are gated and absent, with a pending state, until PR-B records the evidence. This PR-A owns the `additional_markets` mechanism that PLAN-HELLOG-0010 reuses. **No new tool and no new resource.**
- **Observable.** "What does HelloGrowthCRM cost in the Netherlands and can I pay with iDEAL?" returns a pending-price state until the gates are met, then USD 12 per user per month or USD 120 per user per year upfront; "subscriptions are paid via Stripe"; iDEAL/Mollie and GoCardless as "Planned, not available". "Is it AVG compliant, does it do Peppol or connect to Exact Online?" returns `withheld` entries, never a yes.
- **Risk.** A price served before the website and Stripe agree; a roadmap gateway read as live; unverified compliance quoted; Arabic or Dutch UI claims before review; an old SOC 2 period read as current assurance; residency, ISO 27001 or HIPAA language; WhatsApp-first or sales-only positioning.

## 0a. Necessary changes   (planned-file coverage)

**Dependency: 0007 PR-A** (generator, schema, `gates.json`, predicate, `ajv`, `country_get` keys).

**PR-A: `additional_markets` mechanism plus market facts for the Netherlands (`nl`)** (no mirror price row exists to withdraw, so there is nothing to remove)
- [ ] `src/tools/countries.ts`: a const `ADDITIONAL_MARKETS` (`{ code, label, locale, route_prefix }`); `country_get` accepts those codes and returns `{ synced_at, country: { code, label, route_prefix, url, locale }, market_facts }`; `countries_list` keeps its 8 hub rows and `count` unchanged and adds `additional_markets: [{ code, label, market_facts_available }]`. Owner of this mechanism: this plan; later plans only add entries.
- [ ] `test-data/market-facts/2026-11-02/<cc>.json` for the Netherlands (`nl`), `SHA256SUMS`, and the matching rows in `gates.json` (gates `website-deploy`, `stripe-flow1`, `soc2-scope` per market).
- [ ] `src/data/market-facts.ts`: regenerated, never hand-edited.
- [ ] `src/tools/output-schemas.ts`: `country_get` market-only form, `countries_list.additional_markets`.
- [ ] `scripts/market-facts.policy.json` is 0007's; this plan does not change it (it adds no fact kind).
- [ ] `README.md` (market facts, pending price, `withheld`, additional markets), `CHANGELOG.md`, version strings (`npm run check:versions`), and fixtures under `test-data/fixtures/market-facts-<cc>-{pending,published,expired,error}.json`.
- [ ] Tests: `src/tools/__tests__/market-facts-<cc>.test.ts` per market; market cases in the generator and clock tests.

**PR-B: price gates** (blocked, §2a; one PR per market is allowed): `gates.json` (price gates of that market only), `SHA256SUMS` and the regenerated `src/data/market-facts.ts`, changed by an approved diff after the website price correction is deployed and the live Stripe evidence is recorded. No tool code changes: the facts and the `getMarketPrice` accessor already exist and the server serves a price only when its predicate passes. **`soc2-scope` is never activated in a price-gate PR;** it is activated in its own PR after decision F3 closes and the approver signs the wording. `MARKET_SCOPE` is untouched because it never listed these markets.

Client documentation: `README.md` gains a short section on market facts, the pending-price state, `withheld`, and (where applicable) additional-market discovery and the hub-only `countries_list.count`. Version and changelog: each BUILD bumps per `npm run check:versions` and adds a `CHANGELOG.md` line. **PR-C (market competitors in `alternatives_list`) is DEFERRED for this plan:** the route-status evidence it needs is not in the research export, and it does not repair an unsupported claim. It is recorded, not planned (§9).

## 0b. What we already know   (G4)

| Source | What it said | What this plan does about it |
|---|---|---|
| Research `plans-draft/SIX-NL/website.md` §4 | `/nl/prijzen` and 31 of 38 content modules quote EUR and "exclusief btw"; no EUR SKU exists; 39 `/nl` pages are `nativeReviewed: false` (noindex); ~30 `*-netherlands` pages are English under Dutch keywords; 6 pages carry a SOC 2 statement pending scope evidence | Price facts USD only, gated; a market-page fact states the noindex status with its observation date; SOC 2 gated |
| Research `claims/registry/_inbox/nl.csv` | 11 rows: BTW, AVG, KvK field, Peppol, iDEAL, Mollie, Exact/Moneybird, Dutch interface, Pipedrive Dutch UI, all `unverified`; SOC 2 `PENDING SCOPE EVIDENCE`; pricing `decided (founder)` | Only pricing becomes a fact; the rest are topic-only `withheld` |
| Research `plans-draft/SIX-NL/product.md` | No `nl-NL` locale, no Mollie/iDEAL, no Exact/Moneybird, no Peppol in hellocrm; iDEAL/Mollie would be a provider on the shared tenant-payment adapter (PLAN-HGC-0717) | iDEAL/Mollie is a roadmap fact; the others are withheld |
| Coordinator instruction 2026-11-02 | Stripe for HGC; iDEAL/Mollie and GoCardless roadmap only (PLAN-HGC-0723; iDEAL queued); compliance unverified | Adopted verbatim |
| Research §7c, §7f; SOC 2 evidence note | Contract and attestation scope (Soor LLC; Precision Assurance CPA LLC; 2025-02-01 to 2025-06-30; no ISO 27001) | Adopted via 0007's contract |
| PLAN-HELLOG-0007 (#110), 0008 (#111) | Contract, generator and the lessons of two Astra reviews | Applied from the start |

## 1. Premise   (G8)

| Claim | Type | Evidence gathered | Running system? |
|---|---|---|---|
| The MCP has no Netherlands data | missing_feature | `grep -in "netherlands\|\"nl\"" src/data/website-mirror.ts` finds no `COUNTRIES` or `COUNTRY_PRICING` row; `country_get` returns `fail` for unknown codes | not required |
| The website shows EUR | external | Research website plan §4 (read from hellocrmwebsite `origin/master`); not re-read here | **UNVERIFIABLE** from this repo |
| `/nl` pages are configured noindex in source | external | Research reading of `review-status.ts` (`nativeReviewed: false`) at a website source revision pinned at PR time; **live directives and index state were not checked** | **UNVERIFIABLE** live |
| Live Stripe supports the advertised USD prices for Dutch buyers, and which methods are enabled (card, iDEAL, SEPA) | external | Research §6a | **BLOCKED**: Stripe access (Rushabh) |
| iDEAL, Mollie, GoCardless, Peppol, Exact Online, Moneybird do not exist in hellocrm | negative | Research `git grep` on hellocrm `origin/master` (0 files) | not re-run here; the facts do not depend on it (roadmap or withheld) |

The live server was not queried in this session. Every claim is about `main` and the research branches.

## 2. What changes

No existing served text is removed: the mirror has no Netherlands row. The change is additive (a new market form on `country_get`, a new key on `countries_list`).

**Dutch-language pages.** `nl.market.pages` states only what a pinned source revision establishes: the pages are configured `noindex` and excluded from the sitemap (the research reading of `review-status.ts`, `nativeReviewed: false`). It does not claim anything about live search-engine index state, which was not checked; a data PR updates the fact when the website flips the gate. No statement is made about the workspace UI language (withheld).

`status` is `capability` for text that is true and published now, `roadmap` for a planned or queued item. A roadmap fact always has `is_capability: false` and a statement that starts "Planned, not available:". `claim_id_status` is `provisional` until the Claim Registry export assigns ids, then `registry`; a re-pin keeps old ids in `claim_id_aliases`. Fact fields: `fact_id, claim_id, claim_id_status, claim_id_aliases, scope_ref, kind, statement, applies_to, market, status, is_capability, evidence{type,ref,public_url}, verified_on, fact_version, supersedes, release_evidence_version, commit_id, publish_gates`. The `withheld` list uses a closed enum of topic identifiers and the fixed message "HelloGrowthCRM has not published a verified statement on this topic."; the conditional topics `soc2-report-period` and `price-pending` are members of the enum.

| fact_id | kind | status | Statement | Gates and evidence |
|---|---|---|---|---|
| nl.price.monthly | price | capability | Growth is USD 12 per user per month | website-deploy, stripe-flow1 |
| nl.price.annual | price | capability | Growth is USD 120 per user per year, charged once upfront | website-deploy, stripe-flow1 |
| nl.pay.hgc-subscription | payment | capability | HelloGrowthCRM subscriptions are paid via Stripe, the global subscription processor. Whether buyers in this market can purchase, and with which methods, is not confirmed here | none; evidence: D-EXP-41, flow 1 only; regional availability is the withheld topic `purchase-availability` |
| nl.pay.ideal-mollie | payment | roadmap | Planned, not available: iDEAL and Mollie collection for tenants. It is queued, is not a way to pay HelloGrowthCRM, and is not live | none; evidence: coordinator instruction 2026-11-02 |
| nl.pay.gocardless | payment | roadmap | Planned, not available: GoCardless direct-debit collection. It is not a way to pay HelloGrowthCRM and is not live | none; evidence: PLAN-HGC-0723 (provenance, not in the statement) |
| nl.market.pages | market | capability | In website source revision `<sha pinned at PR time>`, the Dutch (nl-NL) pages under `/nl` are configured `noindex` and excluded from the sitemap. Live index state is not asserted, and no nl-NL hreflang alternate is asserted | none; evidence: pinned website source revision (`review-status.ts`), observed 2026-11-02 |
| nl.security.soc2 | attestation | capability | A SOC 2 Type II examination of Soor LLC for 2025-02-01 to 2025-06-30 was completed by Precision Assurance CPA LLC (criteria: Security, Availability, Privacy, Confidentiality, Processing Integrity). The report is available under NDA on request | soc2-scope; expires_on |
| nl.positioning.suite | positioning | capability | HelloGrowthCRM is a full-stack business suite (pipeline, communication, commerce, operations, customers, marketing, intelligence); WhatsApp is one channel next to email, SMS, voice and live chat. | none; evidence: CLAUDE.md §1.1 product definition (founder, 2026-08-13) and the hellocrm `FEATURE_INVENTORY.md` |

Evidence for SMS, voice and live chat in the positioning fact is the hellocrm `FEATURE_INVENTORY.md` entries (cited by id in the data file) and the founder product definition; the PR records the grep it ran.

`withheld[]`: `purchase-availability`, `btw-rate`, `avg-gdpr`, `kvk-btw-fields`, `peppol-e-invoicing`, `exact-online-moneybird`, `dutch-language-interface`, and the conditional `soc2-report-period` and `price-pending`. No residency topic, no residency sentence.

### 2b. Publication contract   (`market_facts_contract: 1`, pinned by 0007 PR-A)

One predicate, `isPublished(item, now)` in `src/lib/market-publication.ts`, is the only way any served value is allowed out: facts, price fields read from the mirror (through `getMarketPrice(market, now)`, so no price string is written into `website-mirror.ts` as a literal) and the SOC 2 fact. It returns true only when **every** gate of the item is `met`, none is `revoked`, and `now` is before every `expires_on`. `gates.json` is compiled into the build; **revocation is a revert of `gates.json` plus a redeploy** (there is no runtime fetch, by design: the request path performs no Stripe, Supabase or network call). **Expiry needs no rebuild:** the handler calls the predicate with the current time on every request. A gate is `{ gate_id, market, status, evidence_ref, evidence_sha256, observed_on, approver, expires_on }`. **Gate identity is market-qualified** for the price gates (`website-deploy:ng`, `stripe-flow1:ng`); `soc2-scope` is global (one attested entity). Lookup is always by the pair, so revoking, expiring or kill-switching `stripe-flow1:za` cannot touch NG or EG (tested). A missing or unknown gate is unmet (fail closed). **Mandatory gates by kind cannot be edited away:** `scripts/market-facts.policy.json` (protected by the same `CODEOWNERS` rule) maps kind to required gates (`price` requires `website-deploy` and `stripe-flow1` of its market; `attestation` requires `soc2-scope`); the generator rejects a fact whose `publish_gates` omit them, and the predicate unions the policy's gates with the fact's own list at request time, so an empty or reduced `publish_gates` still withholds. The embedded sha256 of the generated data is re-checked at start-up, so a hand edit of `src/data/market-facts.ts` fails closed. Only a PR that changes `gates.json` with the approver named can set `met`; editing a fact never satisfies a gate.

| gate_id | `met` requires | Approver |
|---|---|---|
| website-deploy | The hellocrmwebsite price correction is deployed: build id read from the fetched price page, fetch time, and a coverage report of the affected-route inventory (every route importing a changed price module, not one page: for example the 31 conflicting content modules in a site of about 4,000 pages), its count and sha256, and a re-scan showing no HGC price other than USD 12 per user per month or USD 120 per user per year upfront | Rushabh (website release owner) |
| stripe-flow1 | Live-mode evidence, not test mode: account identity, paginated active Price objects, payment-method settings and enabled presentment currencies, and checkout tests (one seat, several seats, monthly, annual) recording currency, quantity, recurrence, upfront total, buyer eligibility, **tax behaviour**, invoice treatment and renewal amount, plus the treatment of existing subscribers, renewals and seat changes, **per-market buyer eligibility** (can buyers in this market purchase, and with which methods), and an approved `public_price_qualifier`: the wording on tax inclusion or exclusion, currency conversion, other charges and any eligibility condition. The qualifier is appended to every served price statement and carried beside the structured amounts (tested); if checkout adds a charge that cannot be named, or the qualifier is empty, the gate stays unmet, so "USD 120 upfront" can never imply a final checkout total. Raw exports stay in the restricted evidence store; the manifest holds a reference id, sha256, date and redaction note | Rushabh |
| soc2-scope | An authorised reading of the report confirms the attested entity, the criteria list, the system boundary and its mapping to HelloGrowthCRM services, and that the report is available under NDA; public wording approved; the expiry policy of decision F3 closed. The statement is historical, names the period, and says which services were examined exactly as the approved wording does; it must not imply current assurance or that all HelloGrowthCRM services were examined. Closing decision F3 does not change that. Report contents are never copied | Rushabh |

Rules that follow:
- **Lifecycle (no ambiguity).** The generator writes **every** fact, with its gate list, into `src/data/market-facts.ts`; "absent" always means absent from the **served response** (the predicate), never from the generated data. Publishing is therefore a data-and-gates change: PR-B changes `gates.json`, `SHA256SUMS` and the regenerated `market-facts.ts` (the gates are compiled in) and, for a market with a hub row, that row's currency fields and one `MARKET_SCOPE` token; nothing else. Tests are split accordingly: **generation tests** assert that gated facts remain in the artifact and that malformed input fails the build; **runtime tests** assert that they disappear from served responses at the right lifecycle states. A clean-build test walks a fixture through unmet, then met, then revoked, regenerating each time, and asserts the served response at each step.
- **Authorisation is enforced, not attributed.** `approver` is a name; enforcement is a `CODEOWNERS` entry for `test-data/market-facts/**/gates.json` requiring Rushabh's review, the repository's branch-protection setting requiring owner review (a human repository setting, recorded in the PR), and `check:market-facts` failing any gate that is `met` without `evidence_sha256`, `observed_on` and `expires_on`.
- **Evidence freshness.** A price-gate `expires_on` is at most 90 days after `observed_on`. **Trigger and owner:** any merge to hellocrmwebsite that touches a route in the gate's coverage inventory requires re-observation before the next MCP deploy (owner Rushabh; the MCP release checklist asks for it), and `check:market-facts --warn-days 14` prints a renewal warning 14 days before any `expires_on`, so expiry cannot silently leave a market pending. The coverage inventory includes indirect imports, generated content and alternate locales; a matching version string proves internal consistency only, so the gate evidence, not the version string, is what is re-checked.
- **Evidence boundary.** `gates.json` and the fact files validate with `additionalProperties: false`: only reference ids, hashes, dates and approved wording can enter generated assets; Stripe exports, report material and NDA content stay in the restricted store and never reach assets, logs, fixtures or URLs. The redaction scan is a backstop, not the boundary.
- **Price facts** carry `applies_to: "list price for new subscriptions"`. If the stripe-flow1 evidence does not settle existing subscribers, renewals and seat changes, the gate stays unmet.
- **Billing currency is not market currency.** `country.currency` (where a hub row exists) stays the market's local currency as metadata; the price rows carry USD and a new additive `billing_currency: "USD"`.
- **Until a price is published, the response says so.** The structured price is `null` with `price_status: "pending_verification"` and the note "Pricing for this market is being confirmed. The global USD ladder in pricing_get_plans is not confirmation of availability, checkout terms or tax treatment for this market." Where a hub row exists this applies from PR-A, so the server never serves a known wrong price while waiting for the evidence. A multi-tool test asks `country_get` then `pricing_get_plans` and checks that the pending note travels with the answer.
- **The SOC 2 fact is unpublished** (gate unmet) until decision F3 is closed. Past `expires_on` the fact is withheld at request time and the `soc2-report-period` topic is served instead. **Split:** the concrete SOC 2 assertion is not committed to the generated artifact in PR-A; a separate data PR adds it with the `soc2-scope` gate after F3 closes, and PR-A serves only the `soc2-report-period` withheld topic.
- **Where the checks live (0007 PR-A implements them; later plans only add data):** drift check in `scripts/build-market-facts.mjs --check`; release-evidence agreement in `scripts/check-release-evidence.mjs`; redaction in `scripts/check-market-facts-redaction.mjs`; all three run in `npm run verify`. The post-release cross-surface check is a checklist in `deploy/` plus the smoke table, owned by the PR author.
- **Drift check:** every fact's `release_evidence_version` must equal the manifest's; the PR body cites the website build id and the commit ids of the website, product and MCP sources; CI fails on a mismatch. A post-release cross-surface check runs after the deploy and after any rollback.
- **Release invariant and rollback.** **Bounded-staleness contract (replaces an absolute "never").** The MCP serves a price only while its gate evidence is current and before `expires_on` (at most 90 days); it cannot be instantaneously consistent with the website, so the divergence is bounded and owned: a planned website price change withdraws the MCP price first; an unplanned one is caught by the scheduled drift checks below within the stated bounds; an emergency is the kill switch (target one hour). Planned order: website deploy, then the MCP gate PR. **Before any planned website rollback, the MCP price is withdrawn first** (revert of the gate PR plus deploy). Emergency revocation: a `MARKET_FACTS_KILL_SWITCH` environment variable (comma-separated market-qualified gate ids, or `all`), read from `process.env` on every request (no network call), which makes the predicate return false without a rebuild. **A changed variable reaches a running process only after a restart or replacement deployment**, so the BUILD PR names the hosting platform (the repository ships a `Dockerfile`) and the exact procedure, and records a drill demonstrating propagation to every hosted replica and region (stdio is outside the kill-switch boundary, see below). Maximum exposure is the measured drill time (target 1 hour). An MCP tool result is not itself an HTTP response: the Streamable HTTP transport is built in `src/server.ts`, so 0007 PR-A touches `src/server.ts` narrowly (every response of the hosted MCP endpoint, `/sse` with POST, GET and DELETE, JSON and streamed, new and existing streams, carries `Cache-Control: no-store`, set before the response is opened and not conditionally on its content, because stream headers are committed first; `index.ts` stays untouched), asserted against a started HTTP server for each mode and for every deployed MCP endpoint. **The guarantee is exactly this:** every fresh call is evaluated at request time and fails closed. It does not recall a response already delivered, a stdio session or an agent's retained tool result; `valid_until` in the payload is informational. **Revocation boundary:** the kill switch acts on the hosted HTTP service; a stdio install reads its own process environment and is otherwise bounded only by `expires_on` and the package version, so stdio is documented as unsupported for emergency withdrawal. Rollback authority: Rushabh; owner: the PR author.
- **Release verification.** Before PR-A, capture the live baseline of every fixture call from the deployed server (BLOCKED if unreachable, then the `main` fixtures stand in and that is stated). After deploy, run the smoke table with a 30-second timeout per call; any failure or any pattern match in the scan is a rollback **to the last release that retains the withdrawals** (the first PR-A release is tagged `market-facts-withdrawn`; the release checklist forbids reverting beyond that tag, which would resurrect the unsupported claims) or the kill switch, not a revert past it.
- **Redaction check:** a release check scans the generated data and every response for Stripe ids, customer, tenant or credential strings and NDA report content.


- **Inherited-control checklist (PR-A of this plan starts only after it passes on the exact 0007 PR-A merge commit).** The 0007 conformance script is run and its output cited for: the protected mandatory-gate policy (a price fact whose `publish_gates` are omitted, empty or substituted is rejected at generation and still withheld at request time; three bypass tests), `CODEOWNERS` and branch-protection enforcement, market-qualified gates (this plan uses `website-deploy:nl` and `stripe-flow1:nl`; `soc2-scope` is global), claim-digest binding, request-time projection with one clock reading, the kill switch, and the `Cache-Control: no-store` header delivered by 0007 in `src/server.ts` (this plan does not touch `server.ts`). Any failed prerequisite is dependency work done before PR-A. The price gate needs an approved `public_price_qualifier`; "USD 12 per user per month" is a list price for new subscriptions, never a final payable total. Responses are tenant- and caller-independent public data (tested: identical output for different request contexts); no database, RLS or tenant-auth migration belongs to this plan.
- **Withdrawal-safe rollback.** Inherited from 0007: rollback goes to the `market-facts-withdrawn` tag or later; the kill switch is the first response to a smoke failure.
- **Single request-time projection (the one derivation of every served price).** `projectMarket(market, now)` in `src/lib/market-publication.ts` is called once per tool call; one clock reading is shared by every field and fact of the response. It derives the amounts, `billing_currency`, the price-row `currencyCode`/`currencySymbol`, `pricingSummaryLine`, the qualifier, `price_status`, `valid_until` and the withheld topics from **one** gate evaluation. Nothing is evaluated at import time and no price or summary is written into `website-mirror.ts` or any module-level object; a long-lived-process test crosses `expires_on` and toggles revocation without re-importing. If the monthly and annual price facts do not share one gate state, both are withheld. PR-A migrates and lists every reader (`grep -rn "COUNTRY_PRICING\|pricingSummaryLine\|getMarketPrice" src`, every hit). PR-B restores `pricingSummaryLine` as projection output: published, "Free Forever · Growth USD 12 per user per month or USD 120 per user per year, charged once upfront (<qualifier>) · Enterprise (custom) · 14-day trial on paid plans"; pending, the PR-A text.
- **Approval is bound to the claim it authorises.** Each gate row carries `claims_sha256`, the digest of a canonical approval payload that covers every claim-bearing field of the facts naming the gate (`statement`, `applies_to`, `market`, `kind`, `status`, `is_capability`, `evidence` references, amounts, qualifier) and the gate-to-market binding, computed by the generator; the predicate withholds when the current digest differs, so editing a published claim without a new approved gate diff unpublishes it. Mutation tests change each of statement, scope, status, evidence and market and expect withheld. The global `soc2-scope` digest covers the attestation wording only, not the list of markets referencing it, so adding a market's reference does not withdraw the others.
- **Drift detection, alerting and withdrawal (the stated bound).** Two scheduled jobs, with their files named in 0007 §0a (`scripts/check-market-facts-live.mjs`, the scheduler entry and the runbook `deploy/market-facts-drift.md`): (1) a **daily** website check that fetches the deployed price routes of each gate's coverage inventory (bounded concurrency, pagination and completeness check, locale variants and generated pages, a cache-busting fetch compared with the build id; a partial fetch is a failure and never renews a gate) and compares live price strings with the gate evidence, plus `check:market-facts --warn-days 14`; (2) a **weekly** authenticated read-only Stripe inspection (Price objects, tax and eligibility settings) run by the owner from the restricted store, never from serving infrastructure, with no Stripe or Supabase credential in the MCP request path. Alerts go to the destination named in the PR; acknowledgement deadline 24 hours; if neither the owner (Rushabh) nor the delegate acknowledges, the release approver withdraws (revert of the gate PR plus deploy, or the kill switch). A missed daily run raises its own alert, and published-to-withheld transitions and integrity failures are alerted in production. **Stated worst-case exposure:** website drift 48 hours before withdrawal starts (24 detection, 24 acknowledgement) plus the drill time; Stripe drift 8 days; an emergency, one hour from acknowledgement. There is no automatic withdrawal and the bound is not stronger than this. The website repository's release checklist (a dependency outside this PR, owner Rushabh) requires withdrawal before an incompatible price change. **Integrity failure** (start-up hash mismatch) withholds all market facts (`market_facts: null`, reason `integrity`) and logs; the server still starts so non-market tools stay up.
- **Approval integrity.** The PR body records the branch-protection setting, who can bypass it and who can read the restricted evidence; a hash proves consistency, not provenance. Free-text safety: `public_url` is limited to `hellogrowthcrm.com` hosts, `evidence.ref` must match `^[A-Za-z0-9._:-]{1,64}$`, and the redaction scan is tested with seeded sensitive values.
- **Discovery semantics.** `countries_list`: every row gains `market_facts_available` (true iff a generated fact file exists for the code); `count` stays the number of hub rows and is documented as not the supported-market total; markets without a hub row are handled by the additive `additional_markets` mechanism that plan 0009 PR-A introduces and defines (`code`, `label`, `locale`, `route_prefix`; no hub row, no `count` change). `country_get`: a code with a fact file returns `market_facts`; a hub code without one returns `market_facts: null` with `market_facts_reason: "no_fact_file"` (or `"integrity"`); a fact-file code with no hub row returns the market-only form (`country`: code, name, `hub: false`); an unknown code returns `fail` listing hubs and additional markets.
- **Positioning fact.** Kept (the founder product definition of 2026-08-13 prevents a WhatsApp-first answer) and scoped: `applies_to: "product-wide description; availability by plan, role and market is not stated"`; its evidence is the grep and the inventory ids named above.
- **Release freeze.** Until 0003 G1–G5 clear, the unsupported text stays live on the deployed server. Decision F7 below asks whether the release approver authorises a withdrawal-only deploy of PR-A ahead of the gates.
- **Route inventory.** The coverage inventory is generated reproducibly (invocation and input SHA recorded in the gate evidence) and reconciled against the deployed sitemap and rendered pages, not only source imports.

### 2c. Wire contract and fixtures

`market_facts` (nested in `country_get`; the market-only form puts it beside a minimal `country`):

```json
{
  "market": "<cc>", "as_of": "2026-11-02", "fact_set_version": 1,
  "market_facts_contract": 1, "release_evidence_version": "2026-11-02.1",
  "source": { "file": "test-data/market-facts/2026-11-02/<cc>.json", "sha256": "<hex>" },
  "price": { "price_status": "pending_verification", "billing_currency": "USD",
             "monthly": null, "annual": null,
             "note": "Pricing for this market is being confirmed. The global USD ladder in pricing_get_plans is not confirmation of availability, checkout terms or tax treatment for this market." },
  "facts": [ ],
  "withheld": [ { "topic": "price-pending", "message": "HelloGrowthCRM has not published a verified statement on this topic." } ]
}
```

Published state: `price` becomes `{ price_status: "published", billing_currency: "USD", monthly: { amount: 12, unit: "per user per month" }, annual: { amount: 120, unit: "per user per year, charged once upfront" }, applies_to: "list price for new subscriptions", qualifier: "<approved public_price_qualifier>", valid_until: "<earliest gate expires_on>" }` and the `price-pending` topic is removed. Expired state: back to `pending_verification` at request time. Error state: unknown code returns `fail` listing hubs and additional markets. Each of the four is a committed fixture used by the tests (AC-A7).

`tools/list` differences are limited to additive `outputSchema` properties of the changed tools; every other field of `tools/list` is byte-identical to the baseline.


### 2a. Dependency order (single order)

1. **0007 PR-A merged first.** It owns the multi-market generator, the schema, `gates.json`, the publication contract of §2b, `ajv` and the `country_get` keys. This plan's PR-A does not start until 0007 PR-A is merged, and pins its merge commit and `market_facts_contract: 1` in the PR body. There is no parallel bootstrap path: if 0007 slips, this plan waits. **Conformance first:** before any work, the PR runs `scripts/check-contract-conformance.mjs` (delivered by 0007 PR-A) on the merge commit, which asserts each clause of §2b (predicate on every path, mandatory-gate policy, start-up hash check, kill switch, `no-store`, market-qualified lookup) against the merged code and records the output; a failing clause blocks this plan until fixed upstream.
2. **PLAN-HELLOG-0009 PR-A** (this plan) owns `ADDITIONAL_MARKETS`; PLAN-HELLOG-0010 waits for it.
3. **PR-B** is blocked on `website-deploy` (the hellocrmwebsite EUR-to-USD correction deployed) and `stripe-flow1` (Stripe access not granted; no resolution date, which is why no price is served meanwhile).
4. **0003 G1–G5** blocks public deploy; release approver Rushabh; smoke owner the PR author; evidence cited in each PR body.

## 3. Affected files

| Area | Files | PR |
|---|---|---|
| Facts and gates | `test-data/market-facts/2026-11-02/{nl.json,gates.json,SHA256SUMS}`, `src/data/market-facts.ts` | A (gates edited in B) |
| Additional-market mechanism | `src/tools/countries.ts`, `src/tools/output-schemas.ts` | A |
| Docs, release, fixtures | `README.md`, `CHANGELOG.md`, version strings, `test-data/fixtures/market-facts-nl-*.json` | A, B |
| Tests | `market-facts-nl.test.ts`, generator and clock tests | A |

Not touched: `website-mirror.ts`, `pricing.ts`, `access.ts`, `index.ts`, `server.ts`, `server.json`, `smithery.yaml`, the generator and predicate.

## 5. Blast radius and caller inventory

`country_get` (a code that failed now succeeds), `countries_list` (new key). Callers: `grep -rn "country_get\|countries_list\|COUNTRIES" src` is run in PR-A and every hit listed, including `mirror-tools-*.test.ts` and any test that asserts the unknown-code failure or `count: 8`. No change to tool count, names, descriptions, resources or llms.txt.

## 6. Acceptance criteria   (per PR; none weakened during implementation)

**PR-A**
- **AC-A1** Compatibility matrix (§7f) holds: only the listed keys and values differ from the `main` fixtures, per tool.
- **AC-A2** No response for the Netherlands contains any string from the P-list: `iDEAL`, `Mollie`, `GoCardless`, `Peppol`, `Exact Online`, `Moneybird`, `AVG`, `BTW`, `KvK`, `EUR`, `€`; the only exceptions are the roadmap facts named in §2, whose statements start "Planned, not available:". Topic identifiers are checked against the enum, not against these patterns.
- **AC-A3** Prose fields (`statement`, `message`, `note`, `qualifier`) match none of `/residen/i`, `/ISO ?27001/i`, `/HIPAA/i`, `/WhatsApp-first/i`, `/sales[- ]only/i`, `/sales[- ]first/i`, `/certified/i`.
- **AC-A4** Every fact validates against `scripts/market-facts.schema.json`; roadmap facts have `is_capability: false`; the roadmap facts in §2 are the only ones.
- **AC-A5** The positioning fact is positive: it names the suite areas and lists WhatsApp as one channel among several. (A negation such as "not sales-only" is not used, because AC-A3 bans the phrase.)
- **AC-A6** Generation tests (build-time) over this plan's data file: hash mismatch, duplicate `fact_id`, unknown status or gate, a fact whose `publish_gates` omit the policy's mandatory gates (rejected), roadmap with `is_capability: true`, missing `verified_on` or `release_evidence_version`, banned phrase, byte-identical output on two runs, gated facts **still present in the artifact** (except the SOC 2 row, which the split keeps out of PR-A), and adding this market's file leaves every other market's generated bytes unchanged. Served-response tests (gated facts absent) are AC-A9, not here.
- **AC-A7** Fixtures for the pending, published, expired and error states (§2c) are committed; serialized results of every changed tool validate against their `outputSchema`; `tools/list` differs from the baseline only by the permitted mutations of §2c, and the consumer-migration test passes.
- **AC-A8** Price fields are `null` with `price_status: "pending_verification"` while a gate is unmet.
- **AC-A9** Exact boundary and malformed input: a built server with an injected clock serves the fact at `expires_on - 1ms` and withholds it at `expires_on`; a missing or malformed `expires_on`, an unknown gate id and a `revoked` gate all withhold; `MARKET_FACTS_KILL_SWITCH` withholds without a rebuild; a fresh call after expiry withholds, with malformed timestamps (missing, non-UTC, wrong format) and either price gate expiring independently each withholding both price facts; `valid_until` is informational and a response already delivered is not recalled (documented); a later call in an already-initialised session fails closed after revocation; one clock reading serves a whole response; a long-lived process crosses `expires_on` without a re-import. The clean-build walk (unmet, met, revoked) of §2b passes. The SOC 2 fact is absent while `soc2-scope` is unmet.
- **AC-A11** The baseline fixtures are captured from the **merge commit of 0007 PR-A** for PR-A of this plan, and from the merged PR-A of this plan for PR-B, both recorded in the PR body (not from today's `main`); this plan's additions are enumerated in §7f. The inherited-control checklist of §2b is run first and cited.
- **AC-A12** Direct per-tool tests: `country_get` carries the pending note and the qualifier next to published amounts; `pricing_get_plans` alone carries the global-ladder disclaimer (a pricing-only discovery test); no test depends on call order. Carry-over into an assistant's answer is a manual evaluation recorded in the PR, not an acceptance criterion.
- **AC-A13** Gate scoping: revoking, expiring or kill-switching one market's gate leaves every other market's output byte-identical. Editing a published claim without a new gate diff withholds it (claim digest); a price-gate fact whose `publish_gates` are omitted, empty or substituted stays withheld.
- **AC-A10** Tool count equals the `main` count; the SDK client round trip (initialize, `tools/list`, call) succeeds; `annotations.test.ts` and `registry.test.ts` pass.

**PR-B**
- **AC-B1** With both price gates met: price rows carry USD 12 per user per month and USD 120 per user per year upfront with `applies_to`, `billing_currency: "USD"`; with either unmet, they are `null` and pending (the build does not fail, the server fails closed).
- **AC-B2** No price row, `MARKET_SCOPE` or hub row mentions the Netherlands in EUR; price facts appear only when both gates are met and carry `billing_currency: "USD"`. Both PR-B response changes are listed in §7f.
- **AC-B3** `release_evidence_version` agrees across the data file, `gates.json` and the PR body's cited commit ids.
- **AC-B4** The PR body contains the website build id, the affected-route coverage report, the measured cache behaviour and kill-switch time, and the rollback target; `CODEOWNERS` review by the approver is shown.

## 7b. Smoke test   (expected only; the BUILD PR records observed results)

| # | Call | Expected |
|---|---|---|
| 1 | `country_get({"code":"nl"})` after PR-A | market-only form; facts: Stripe payment, iDEAL/Mollie roadmap, GoCardless roadmap, pages, positioning (5); price facts absent with `price_status: pending_verification`; SOC 2 absent; `withheld` has 7 base topics plus `price-pending` and `soc2-report-period` |
| 2 | `countries_list()` | `count: 8`, `countries` unchanged, `additional_markets` includes `nl` |
| 3 | `country_get({"code":"xx"})` | `isError`, message lists hubs and additional markets |
| 4 | after PR-B with both gates met | price facts present (7 facts), `price-pending` gone |
| 5 | clock past `expires_on` | SOC 2 absent, `soc2-report-period` present |
| 6 | pattern scan of every response | no AC-A2 or AC-A3 match |

## 7e. Competitors

Competitor MCP servers were not read this session; the research table keeps those cells as `?`. Competitor prices are not served (research rule R9).

## 7f. Compatibility test: per-tool, per-PR contract matrix

Fixtures are captured from the parent commit of each PR (AC-A11).

| Tool | PR-A change | PR-B change |
|---|---|---|
| `country_get` for `nl` | new: returns the market-only form (`country` with code, label, route_prefix, url, locale; `market_facts`). Today these codes return a not-found `fail`. The price block is `null` and pending | the `market_facts.price` block becomes published (USD 12 per user per month, USD 120 per user per year upfront, `billing_currency`, `applies_to`, qualifier, `valid_until`); the `price-pending` topic is removed; the facts list gains the two price facts; `withheld` shrinks accordingly |
| `country_get` for the 8 hubs | as 0007 PR-A defines (`market_facts: null`, reason `no_fact_file`); nothing else | none |
| `countries_list` | + `additional_markets` (the 8-row `countries` array and `count` unchanged) | none |
| `pricing_get_country_plans`, `pricing_get_faq`, `pricing_get_plans` | none (no row for these markets exists or is added) | none |

Every other tool is byte-identical. **Permitted `outputSchema` mutations (exhaustive):** (1) added optional properties on `countries_list` (`additional_markets`, `market_facts_available`) and `country_get` (`market_facts`); (2) `country_get`'s `outputSchema` becomes a union of the hub form and the market-only form, which relaxes the hub-only `required` entries for the market-only form alone and for no hub response; (3) nothing removed. This is a visible compatibility exception recorded in the README and CHANGELOG, with a consumer-migration test: a fixture client that enumerates `countries` or assumes a fixed country list, and `count: 8` is documented as the hub count, not the number of supported markets. The earlier string-to-null caveat does not apply to this plan (it has no hub row and no existing field becomes null).

## 8. Risks and edge cases

| Risk | Mitigation |
|---|---|
| A price shown before the website and Stripe agree | Price facts are gated; until then `price_status: pending_verification`; no price is served for these markets today, so nothing needs withdrawing |
| Live Stripe differs, or checkout adds tax | `stripe-flow1` gate with checkout tests, eligibility, tax behaviour and renewal evidence; fail closed |
| Expiry or revocation not honoured after deploy | One predicate on every path, per request; AC-A9 |
| A queued gateway read as live | Roadmap facts with `is_capability: false` and the "Planned, not available:" prefix; AC-A2 |
| Existing clients that treat an unknown `code` as the only failure | `country_get` now succeeds for the new codes; listed in the matrix and CHANGELOG |
| Positioning drifts to sales-only | AC-A3 and AC-A5 |
| Editing a fact's `publish_gates` to bypass approval | Mandatory gates by kind in the protected policy file; predicate unions them (AC-A6) |
| Kill switch needs a restart to reach a running process | Named hosting procedure and a recorded drill (§2b) |
| Silent expiry leaves a market pending | 14-day warning in `check:market-facts`, renewal owner Rushabh |

## 9. What this deliberately does NOT do

No new tool, resource or llms.txt section. No tenant-gateway capability: every local gateway is roadmap or absent, and nothing says subscriptions are paid through one. No tax-rate, data-protection, e-invoicing, accounting-integration or language-UI claim, no data-residency sentence, no ISO 27001 or HIPAA claim. No competitor prices. No removal of existing text beyond the named withdrawals and the price correction. No edit to hellocrmwebsite or hellocrm.
No statement about the Dutch workspace UI, Dutch support hours, or the English-text Dutch-keyword pages (website issues).
Deferred, with the reason: market competitors in `alternatives_list` (PR-C of 0007) for this plan's markets. Research: 53 vendor rows, 4 with live nl-NL pages (Teamleader, HubSpot, Pipedrive, Salesflare), all behind `noindex` pages; decisions CREATE 0 new, KEEP 4, HOLD 40, SKIP 7.

## 10. Decisions owed

- **F1** closed: topic-only `withheld` entries are served. **F2** closed: nothing to withdraw. **F4** closed: no price is served until the gates are met.
- **F3 (open)** SOC 2 renewal, expiry policy (proposed 2026-12-31) and approved wording; the six `/nl` pages' wording is pending scope evidence. The fact stays unpublished until closed.
- **F6 (open)** Keep the source-level `nl.market.pages` fact (default yes, restricted to the pinned revision) or defer it until live index state is checked (the Astra review suggested deferral; the coordinator asked for it to be stated)? **Decide before the fixtures are frozen.** The pinned source revision is dated by the day it was actually observed; a later inspection is never labelled `2026-11-02`.
- **F7 (open)** Does the release approver authorise a withdrawal-only deploy of the 0007 PR-A withdrawals ahead of the 0003 G1–G5 gates? This plan withdraws nothing itself. Owner: Rushabh; the decision is due before PR-A merges. If authorised, the first deploy is PR-A in full (the predicate is what makes the withdrawal verifiable); if not, PR-A waits for G1–G5 and this plan changes repository truth only.

## 11. Findings outside this plan   (D-EXP-14: recorded, not fixed here)

- `src/data/website-mirror.ts` USA row `compliance: "SOC 2, HIPAA and IRS filings"` asserts HIPAA (`grep -n HIPAA src/data/website-mirror.ts`).
- `src/tools/alternatives.ts` describes HelloGrowthCRM as WhatsApp-first in two places and as "Sales-first" in three (`grep -n "WhatsApp-first\|Sales-first" src/tools/alternatives.ts`). These sit in `alternatives_get` and `switch_get_guide` text for named competitors, not in the responses this plan changes. Each needs its own MCP plan.
- The mirror comment calls SOC 2 "certified"; it is an attestation.

## 12. Estimated token cost

Estimate, not a quote; input tokens at $3/M; reuses 0007's generator and predicate.

| PR | Low | Expected | High |
|---|---|---|---|
| PR-A (mechanism, data, tests) | 0.5M | 0.7M | 1.0M |
| PR-B (gates only) | 0.1M | 0.15M | 0.25M |
| **Total (reuse)** | **0.6M** | **0.85M** (about $2.5) | **1.25M** |

This plan PR: about 0.3M.

## 13. Validation (this plan PR)

- **PASS**: plan id 0009 free after 0008 (#111); no remote `plan/hellog-0009*`.
- **PASS**: `main` @ `5190a02` has no NL row in `COUNTRIES`/`COUNTRY_PRICING`.
- **PASS**: research NL `vendors.csv`: 53 rows, 4 with nl-NL pages (not served here).
- **UNVERIFIABLE**: live server; the website's current EUR text and index state (taken from the research); competitor MCP inventories.
- **BLOCKED**: Stripe flow-1 bundle (Rushabh).

## 14. Review record

Astra, blind, role plan, 2026-11-02: **reject** on rev 1 (five blockers). Each finding was checked against the plan and the repo before it changed anything.

| # | Finding | Verdict | Change |
|---|---|---|---|
| 1 | The positioning statement ("not a sales-only tool") failed the plan's own test AC-A3 | Accepted. True | Positive wording only; AC-A5 says why |
| 2 | Lifecycle unresolved: unpublished facts "absent" in generated data yet PR-B assumed gates-only publication | Accepted | §2b Lifecycle: all facts are always generated, absence is a served-response property; PR-B changes `gates.json`, `SHA256SUMS` and the regenerated data; clean-build unmet, met, revoked walk (AC-A9) |
| 3 | No exact wire contract; matrix said PR-B changes nothing though facts appear; `tools/list` effects missing | Accepted | §2c wire contract and four committed fixtures (pending, published, expired, error); matrix and `tools/list` rule updated; the unrelated compliance caveat removed for this plan |
| 4 | "No contradiction window" was false after a website rollback | Accepted | Release invariant (withdraw the MCP price before a planned website rollback), `MARKET_FACTS_KILL_SWITCH` with a measured bound, owner and authority |
| 5 | Source-level `nativeReviewed: false` does not prove "not indexed" | Accepted | The page fact is restricted to the pinned source revision and says live state is not asserted; F6 records the reviewer's deferral suggestion |

Risks and missing items taken: public price qualifier and tax treatment from the gate evidence; the global-ladder fallback note and a multi-tool test; enforced approval (`CODEOWNERS`, branch protection, `check:market-facts`); evidence boundary by schema; SOC 2 verification list; affected-route coverage report; baseline taken after 0007 PR-A merges; exact expiry-boundary and malformed-input tests; locations of the drift, redaction and post-release checks; client documentation; evidence freshness (90 days). Not taken: cutting the positioning fact (the founder's rule that the MCP never describe HelloGrowthCRM as WhatsApp-first or sales-only needs a positive statement and a test; the negation was removed instead). The review ran once; rev 2 was not re-reviewed.

Shared-contract updates taken from the Astra review of PLAN-HELLOG-0010 (same contract, no second review of this plan): mandatory gates by kind, market-qualified gate identity, kill-switch restart semantics and drill, `no-store` through the HTTP path, Stripe fact scoped to the global processor with `purchase-availability`, generation and runtime tests split, baseline at the dependency commit, conformance run, composition test, expiry warning, README and fixtures in the inventory, gateway plan numbers kept out of public statements.

### Revision 3 — Astra review of revision 2 (ACCEPT_WITH_CHANGES)

One fresh call, blind copy of revision 2 with the "Review record" section stripped (`blind=yes`, `payload_sha=a1562f4926c3d8c0`, egress gate passed). This plan's first review was ACCEPT_WITH_CHANGES; there was no REJECT to resolve.

| Reviewer | Plan version | Verdict | Accepted | Rejected, and why |
|---|---|---|---|---|
| Astra (blind) | rev 2 | **ACCEPT_WITH_CHANGES** | Blocker 1: protected mandatory-gate policy verified through the inherited-control checklist, with bypass tests. Blocker 2: revocation and cache boundary stated and owned by 0007. Blocker 3: generation tests keep gated facts; served-response tests withhold them. Blocker 4: PR-B response changes listed, the permitted schema mutations named (union of hub and market-only forms), the unrelated compliance caveat removed. Risks and missing: qualifier meaning, drift detection and withdrawal schedule, market-qualified gates, malformed-timestamp and independent-expiry tests, F6 observation date, no-migration statement, SOC 2 split | Cut of the suite-positioning fact: rejected — founder product definition (2026-08-13); it is scoped product-wide instead. Competitor expansion stays deferred |

- **Resolution status:** ACCEPT_WITH_CHANGES; cheap changes folded into revision 3. Build waits for 0007 PR-A, F3, F6, F7 and 0003 G1–G5.

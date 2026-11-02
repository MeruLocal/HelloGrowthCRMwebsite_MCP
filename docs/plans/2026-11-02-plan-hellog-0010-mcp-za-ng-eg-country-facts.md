# Plan — MCP: South Africa, Nigeria and Egypt country facts (pricing, payments, security attestation)

- **Revision:** 2 (2026-11-02), Astra blind review of rev 1 folded (§14). Built on the contract of PLAN-HELLOG-0007 (#110) after its Astra review; this plan restates what it needs so it can be read alone.
- **Plan id:** PLAN-HELLOG-0010, allocated 2026-11-02 as the next free number after PLAN-HELLOG-0009 (#112). Sources: remote `plan/` branches and the REST PR list (highest plan title before this one: 0009). The adapter's `git fetch origin master` and GraphQL reads fail here (trunk is `main`; GraphQL is blocked), so the REST list is the check of record. Re-run `plan-id.mjs check` after the branch is pushed.
- **Branch:** `plan/hellog-0010-mcp-za-ng-eg-country-facts` · **Repo:** MeruLocal/HelloGrowthCRMwebsite_MCP · **Trunk:** `main` (head `5190a02`)
- **Mode:** PLAN (plan only, no code). Each BUILD is its own PR carrying `Implements: PLAN-HELLOG-0010 (PR-x)`.
- **Change tags:** `public_api`, `product`
- **Tier:** T2. Owed: acceptance_criteria, blast_radius, caller_inventory, compatibility_test, competitor_scan, intent, necessary_changes, planned_file_coverage, premise_check, smoke_test
- **Restricted areas touched:** none. The server states prices; it does not bill.
- **Freeze in force?** Yes: the PLAN-HELLOG-0003 (#102) release gate G1–G5 blocks public deploy of every BUILD.
- **Origin:** founder standard D-EXP-14 (2026-11-02). Research: MeruLocal/Hellogrowthcrm-Researchsuite#97 (ZA, `claude/six-market-za`), #98 (NG, `claude/six-market-ng`), #99 (EG, `claude/six-market-eg`); contract in `research-methodology/six-market-plan-2026-11-02.md` §7c, §7f.
- **Research evidence:** MeruLocal/Hellogrowthcrm-Researchsuite#97, MeruLocal/Hellogrowthcrm-Researchsuite#98, MeruLocal/Hellogrowthcrm-Researchsuite#99
- **Opportunity ID:** OPP-SIX-ZA-001, OPP-SIX-NG-001, OPP-SIX-EG-001
- **Date:** 2026-11-02

## 0. Intent

- **Claim.** On `main` (`src/data/website-mirror.ts`, `src/tools/pricing.ts`, `src/tools/countries.ts`):
  1. The server has **no data for South Africa, Nigeria or Egypt**: `COUNTRIES` and `COUNTRY_PRICING` hold eight hubs, none for these markets, and `country_get({code:"za"|"ng"|"eg"})` returns the not-found `fail` (the only trace is a hreflang rule for `/crm-nigeria` in the port). Assistants asked about these markets fall back to the global ladder or guess.
  2. Pricing for all three is **USD only**: USD 12 per user per month, or USD 120 per user per year charged once upfront, no tax line (D-EXP-40, 44, 45). Egyptian pounds on EG pages are customer-record currency, not an HGC price; one NG page shows `$30`, which the website correction handles.
  3. Subscriptions are paid via Stripe (flow 1). Tenant gateways are roadmap only: Paystack (PLAN-HGC-0721, #10105), Flutterwave (PLAN-HGC-0722, #10107), Fawry (PLAN-HGC-0719, #10101) and Paymob (PLAN-HGC-0720, #10103) have hellocrm plan PRs; PayFast, Yoco, Ozow, Moniepoint, OPay, InstaPay and Vodafone Cash are queued. None is live. Website pages that name them as accepted (14 EG pages, 4 NG pages) are being corrected separately.
  4. Compliance is `unverified` in all three research registries and must not be asserted: POPIA (ZA), NDPA 2023 and NDPC (NG), PDPL Law 151/2020 (EG); VAT 15%, 7.5% and 14%; ETA (EG) and NRS (NG, the renamed FIRS) e-invoicing; TIN-ready invoices; SMS do-not-disturb; Arabic and RTL claims.
  5. HelloGrowthCRM is a full-stack business suite. The research describes ZA, NG and EG as "sales markets" (a go-to-market label); the MCP must not turn that into a product description. Existing MCP text that calls it "Sales-first" lives in `alternatives_get`/`switch_get_guide` competitor content and is out of scope here (§11).
  6. No SOC 2 scope is served for any market.
- **Mechanism.** One plan for three markets because the tool changes are identical: three data files on 0007's generator and 0009's `additional_markets` mechanism, no tool code of its own. PR-A adds the three markets with versioned `market_facts` (price facts gated and pending, Stripe, roadmap gateways, positioning, gated SOC 2, topic-only `withheld`); PR-B publishes each market's price once its own gates are met. **No new tool and no new resource.**
- **Observable.** "What does HelloGrowthCRM cost in Lagos and can I pay with Paystack?" returns a pending-price state until the gates are met, then USD 12 per user per month or USD 120 per user per year upfront; subscriptions paid via Stripe; Paystack as "Planned, not available". "Is it NDPA/POPIA/PDPL compliant? Does it do NRS or ETA e-invoicing?" returns `withheld` entries, never a yes.
- **Risk.** A price served before the website and Stripe agree; a roadmap gateway read as live; unverified compliance quoted; Arabic or Dutch UI claims before review; an old SOC 2 period read as current assurance; residency, ISO 27001 or HIPAA language; WhatsApp-first or sales-only positioning.

## 0a. Necessary changes   (planned-file coverage)

**Dependency: 0007 PR-A** (generator, schema, `gates.json`, predicate, `ajv`, `country_get` keys).

**PR-A: market facts for South Africa (`za`), Nigeria (`ng`) and Egypt (`eg`)** (no mirror price row exists to withdraw, so there is nothing to remove)
- [ ] `src/tools/countries.ts`: **extend** `ADDITIONAL_MARKETS` with this plan's entries (the mechanism, the market-only `country_get` form and `additional_markets` on `countries_list` are PLAN-HELLOG-0009 PR-A, merged first).
- [ ] `test-data/market-facts/2026-11-02/<cc>.json` for South Africa (`za`), Nigeria (`ng`) and Egypt (`eg`), `SHA256SUMS`, and the matching rows in `gates.json` (gates `website-deploy`, `stripe-flow1`, `soc2-scope` per market).
- [ ] `src/data/market-facts.ts`: regenerated, never hand-edited.
- [ ] `src/tools/output-schemas.ts`: no change beyond 0009 (the schemas already admit these markets); fixtures extended.
- [ ] `scripts/market-facts.policy.json` is 0007's; this plan does not change it (it adds no fact kind).
- [ ] `README.md` (market facts, pending price, `withheld`, additional markets), `CHANGELOG.md`, version strings (`npm run check:versions`), and fixtures under `test-data/fixtures/market-facts-<cc>-{pending,published,expired,error}.json`.
- [ ] Tests: `src/tools/__tests__/market-facts-<cc>.test.ts` per market; market cases in the generator and clock tests.

**PR-B: price gates** (blocked, §2a; one PR per market is allowed): `gates.json` (price gates of that market only), `SHA256SUMS` and the regenerated `src/data/market-facts.ts`, changed by an approved diff after the website price correction is deployed and the live Stripe evidence is recorded. No tool code changes: the facts and the `getMarketPrice` accessor already exist and the server serves a price only when its predicate passes. **`soc2-scope` is never activated in a price-gate PR;** it is activated in its own PR after decision F3 closes and the approver signs the wording. `MARKET_SCOPE` is untouched because it never listed these markets.

Client documentation: `README.md` gains a short section on market facts, the pending-price state, `withheld`, and (where applicable) additional-market discovery and the hub-only `countries_list.count`. Version and changelog: each BUILD bumps per `npm run check:versions` and adds a `CHANGELOG.md` line. **PR-C (market competitors in `alternatives_list`) is DEFERRED for this plan:** the route-status evidence it needs is not in the research export, and it does not repair an unsupported claim. It is recorded, not planned (§9).

## 0b. What we already know   (G4)

| Source | What it said | What this plan does about it |
|---|---|---|
| Research `claims/registry/_inbox/{za,ng,eg}.csv` | ZA 8 rows, NG 8, EG 7: VAT, data-protection law, e-invoicing, accounting, local gateways, SMS, Arabic/RTL, all `unverified`; pricing `decided (founder)` | Only pricing becomes a fact; the rest are topic-only `withheld` |
| Research `plans-draft/SIX-{ZA,NG,EG}/product.md` | PayFast/Yoco/Ozow new; Paystack and Flutterwave (PLAN-HGC-0721, 0722) and Fawry and Paymob (PLAN-HGC-0719, 0720) have plan PRs; Moniepoint, OPay, InstaPay, Vodafone Cash new; POPIA profile PLAN-HGC-0725 (#10123); VAT regime PLAN-HGC-0588 (#9630) without ZA/NG/EG; no NRS/ETA code | Gateways are roadmap facts (`is_capability: false`); the rest withheld |
| Coordinator instruction 2026-11-02 | USD only; Stripe for HGC; gateways roadmap or queued; compliance never asserted; not sales-only | Adopted verbatim |
| Research website plans | NG 20 and EG 20 vendors have live pages serving en-NG/en-EG; ZA 1; decisions HOLD or SKIP, CREATE 0 (ZA 1 CREATE) | Competitors deferred; nothing served |
| Research §7c, §7f; SOC 2 evidence note | Contract; Soor LLC, Precision Assurance CPA LLC, 2025-02-01 to 2025-06-30; no ISO 27001 | Via 0007's contract; gated |
| PLAN-HELLOG-0007 (#110), 0008 (#111), 0009 (#112) | Contract, generator, additional-market mechanism, three Astra reviews | Applied from the start |

## 1. Premise   (G8)

| Claim | Type | Evidence gathered | Running system? |
|---|---|---|---|
| The MCP has no ZA, NG or EG data | missing_feature | No `COUNTRIES`/`COUNTRY_PRICING` row; `country_get` returns `fail` for unknown codes; the only trace is a hreflang rule for `/crm-nigeria` in the port | not required |
| Gateway plan numbers | external | Research product drafts cite PLAN-HGC-0719 to 0722 and #10101 to #10107; the PRs themselves were not re-read | **UNVERIFIABLE** here |
| Live Stripe supports the USD prices for buyers in each market, and which methods are enabled | external | Research §6a | **BLOCKED**: Stripe access (Rushabh) |
| No NRS, ETA, PayFast, Paystack code in hellocrm | negative | Research `git grep`/inventory; not re-run here | facts do not depend on it |

The live server was not queried in this session. Every claim is about `main` and the research branches.

## 2. What changes

No existing served text is removed: the mirror has no row for these markets. Everything is additive.

**Per-market independence.** Each market has its own file, its own gate rows (`market` field) and its own publication: ZA can publish a price while NG remains pending. Adding a market's file never changes another market's generated bytes (AC-A6).

`status` is `capability` for text that is true and published now, `roadmap` for a planned or queued item. A roadmap fact always has `is_capability: false` and a statement that starts "Planned, not available:". `claim_id_status` is `provisional` until the Claim Registry export assigns ids, then `registry`; a re-pin keeps old ids in `claim_id_aliases`. Fact fields: `fact_id, claim_id, claim_id_status, claim_id_aliases, scope_ref, kind, statement, applies_to, market, status, is_capability, evidence{type,ref,public_url}, verified_on, fact_version, supersedes, release_evidence_version, commit_id, publish_gates`. The `withheld` list uses a closed enum of topic identifiers and the fixed message "HelloGrowthCRM has not published a verified statement on this topic."; the conditional topics `soc2-report-period` and `price-pending` are members of the enum.

| fact_id | kind | status | Statement | Gates and evidence |
|---|---|---|---|---|
| za.price.monthly | price | capability | Growth is USD 12 per user per month | website-deploy, stripe-flow1 |
| za.price.annual | price | capability | Growth is USD 120 per user per year, charged once upfront | website-deploy, stripe-flow1 |
| ng.price.monthly | price | capability | Growth is USD 12 per user per month | website-deploy, stripe-flow1 |
| ng.price.annual | price | capability | Growth is USD 120 per user per year, charged once upfront | website-deploy, stripe-flow1 |
| eg.price.monthly | price | capability | Growth is USD 12 per user per month | website-deploy, stripe-flow1 |
| eg.price.annual | price | capability | Growth is USD 120 per user per year, charged once upfront | website-deploy, stripe-flow1 |
| za.pay.hgc-subscription | payment | capability | HelloGrowthCRM subscriptions are paid via Stripe, the global subscription processor. Whether buyers in this market can purchase, and with which methods, is not confirmed here | none; evidence: D-EXP-41, flow 1 only; regional availability is the withheld topic `purchase-availability` |
| ng.pay.hgc-subscription | payment | capability | HelloGrowthCRM subscriptions are paid via Stripe, the global subscription processor. Whether buyers in this market can purchase, and with which methods, is not confirmed here | none; evidence: D-EXP-41, flow 1 only; regional availability is the withheld topic `purchase-availability` |
| eg.pay.hgc-subscription | payment | capability | HelloGrowthCRM subscriptions are paid via Stripe, the global subscription processor. Whether buyers in this market can purchase, and with which methods, is not confirmed here | none; evidence: D-EXP-41, flow 1 only; regional availability is the withheld topic `purchase-availability` |
| za.pay.tenant-gateways | payment | roadmap | Planned, not available: tenant collection through PayFast, Yoco and Ozow (queued). None is a way to pay HelloGrowthCRM and none is live | none; evidence: coordinator instruction 2026-11-02 |
| ng.pay.tenant-gateways | payment | roadmap | Planned, not available: tenant collection through Paystack and Flutterwave (planned), and Moniepoint and OPay (queued). None is a way to pay HelloGrowthCRM and none is live | none; evidence: coordinator instruction 2026-11-02; Paystack PLAN-HGC-0721 #10105, Flutterwave PLAN-HGC-0722 #10107 (research product draft; checked against the PRs before pinning, F7) |
| eg.pay.tenant-gateways | payment | roadmap | Planned, not available: tenant collection through Fawry and Paymob (planned), and InstaPay and Vodafone Cash (queued). None is a way to pay HelloGrowthCRM and none is live | none; evidence: coordinator instruction 2026-11-02; Fawry PLAN-HGC-0719 #10101, Paymob PLAN-HGC-0720 #10103 (research product draft; checked against the PRs before pinning, F7) |
| za.security.soc2 | attestation | capability | A SOC 2 Type II examination of Soor LLC for 2025-02-01 to 2025-06-30 was completed by Precision Assurance CPA LLC (criteria: Security, Availability, Privacy, Confidentiality, Processing Integrity). The report is available under NDA on request | soc2-scope; expires_on |
| ng.security.soc2 | attestation | capability | A SOC 2 Type II examination of Soor LLC for 2025-02-01 to 2025-06-30 was completed by Precision Assurance CPA LLC (criteria: Security, Availability, Privacy, Confidentiality, Processing Integrity). The report is available under NDA on request | soc2-scope; expires_on |
| eg.security.soc2 | attestation | capability | A SOC 2 Type II examination of Soor LLC for 2025-02-01 to 2025-06-30 was completed by Precision Assurance CPA LLC (criteria: Security, Availability, Privacy, Confidentiality, Processing Integrity). The report is available under NDA on request | soc2-scope; expires_on |
| za.positioning.suite | positioning | capability | HelloGrowthCRM is a full-stack business suite (pipeline, communication, commerce, operations, customers, marketing, intelligence); WhatsApp is one channel next to email, SMS, voice and live chat. | none; evidence: CLAUDE.md §1.1 product definition (founder, 2026-08-13) and the hellocrm `FEATURE_INVENTORY.md` |
| ng.positioning.suite | positioning | capability | HelloGrowthCRM is a full-stack business suite (pipeline, communication, commerce, operations, customers, marketing, intelligence); WhatsApp is one channel next to email, SMS, voice and live chat. | none; evidence: CLAUDE.md §1.1 product definition (founder, 2026-08-13) and the hellocrm `FEATURE_INVENTORY.md` |
| eg.positioning.suite | positioning | capability | HelloGrowthCRM is a full-stack business suite (pipeline, communication, commerce, operations, customers, marketing, intelligence); WhatsApp is one channel next to email, SMS, voice and live chat. | none; evidence: CLAUDE.md §1.1 product definition (founder, 2026-08-13) and the hellocrm `FEATURE_INVENTORY.md` |

Evidence for SMS, voice and live chat in the positioning fact is the hellocrm `FEATURE_INVENTORY.md` entries (cited by id in the data file) and the founder product definition; the PR records the grep it ran.

`withheld[]` per market (closed enum plus the conditional `soc2-report-period` and `price-pending`): **All three** `purchase-availability`. **ZA** `vat-rate`, `popia`, `popia-call-recording`, `sars-e-invoicing`, `za-accounting-integrations`, `bbbee`. **NG** `vat-rate`, `ndpa`, `nrs-e-invoicing`, `tin-invoices`, `sms-do-not-disturb`, `offline-mobile-capture`. **EG** `vat-rate`, `eta-e-invoicing`, `pdpl-151-2020`, `arabic-rtl`, `two-way-sms`. No residency topic, no residency sentence. The EGP figures on EG pages are not served (customer-record currency, not an HGC price).

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
- **The SOC 2 fact is unpublished** (gate unmet) until decision F3 is closed. Past `expires_on` the fact is withheld at request time and the `soc2-report-period` topic is served instead.
- **Where the checks live (0007 PR-A implements them; later plans only add data):** drift check in `scripts/build-market-facts.mjs --check`; release-evidence agreement in `scripts/check-release-evidence.mjs`; redaction in `scripts/check-market-facts-redaction.mjs`; all three run in `npm run verify`. The post-release cross-surface check is a checklist in `deploy/` plus the smoke table, owned by the PR author.
- **Drift check:** every fact's `release_evidence_version` must equal the manifest's; the PR body cites the website build id and the commit ids of the website, product and MCP sources; CI fails on a mismatch. A post-release cross-surface check runs after the deploy and after any rollback.
- **Release invariant and rollback.** The MCP never publishes a price the website does not serve. Planned order: website deploy, then the MCP gate PR. **Before any planned website rollback, the MCP price is withdrawn first** (revert of the gate PR plus deploy). Emergency revocation: a `MARKET_FACTS_KILL_SWITCH` environment variable (comma-separated market-qualified gate ids, or `all`), read from `process.env` on every request (no network call), which makes the predicate return false without a rebuild. **A changed variable reaches a running process only after a restart or replacement deployment**, so the BUILD PR names the hosting platform (the repository ships a `Dockerfile`) and the exact procedure, and records a drill demonstrating propagation to every replica and transport (HTTP and stdio). Maximum exposure is the measured drill time (target 1 hour) plus response cache lifetime. Responses from every tool that carries market facts are sent with `Cache-Control: no-store`, asserted through the deployed HTTP path and not only in a handler test, so a cache cannot return an expired response; `valid_until` in the payload is informational. Rollback authority: Rushabh; owner: the PR author.
- **Release verification.** Before PR-A, capture the live baseline of every fixture call from the deployed server (BLOCKED if unreachable, then the `main` fixtures stand in and that is stated). After deploy, run the smoke table with a 30-second timeout per call; any failure or any pattern match in the scan is a rollback.
- **Redaction check:** a release check scans the generated data and every response for Stripe ids, customer, tenant or credential strings and NDA report content.


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
2. **0009 PR-A merged** (it owns `ADDITIONAL_MARKETS` and the market-only `country_get` form). This plan only adds entries.
3. **PR-B**, per market, is blocked on that market's `website-deploy` (the hellocrmwebsite USD correction deployed) and `stripe-flow1` (Stripe access not granted; no resolution date, which is why no price is served meanwhile).
4. **0003 G1–G5** blocks public deploy; release approver Rushabh; smoke owner the PR author; evidence cited in each PR body.

## 3. Affected files

| Area | Files | PR |
|---|---|---|
| Facts and gates | `test-data/market-facts/2026-11-02/{za.json,ng.json,eg.json,gates.json,SHA256SUMS}`, `src/data/market-facts.ts` | A (gates edited in B) |
| Market list | `src/tools/countries.ts` (entries only) | A |
| Docs, release, fixtures | `README.md`, `CHANGELOG.md`, version strings, `test-data/fixtures/market-facts-<cc>-*.json` | A, B |
| Tests | `market-facts-za.test.ts`, `-ng.test.ts`, `-eg.test.ts` | A |

Not touched: `website-mirror.ts`, `pricing.ts`, `access.ts`, `index.ts`, `server.ts`, `server.json`, `smithery.yaml`, the generator, predicate and mechanism.

## 5. Blast radius and caller inventory

`country_get` (three codes that failed now succeed) and `countries_list.additional_markets` (three entries). Callers: the PR-A grep of `country_get|countries_list|COUNTRIES` over `src`, every hit listed. No change to tool count, names, descriptions, resources or llms.txt.

## 6. Acceptance criteria   (per PR; none weakened during implementation)

**PR-A**
- **AC-A1** Compatibility matrix (§7f) holds: only the listed keys and values differ from the `main` fixtures, per tool.
- **AC-A2** No response for South Africa, Nigeria or Egypt contains any string from the P-list: `PayFast`, `Yoco`, `Ozow`, `Paystack`, `Flutterwave`, `Moniepoint`, `OPay`, `Fawry`, `Paymob`, `InstaPay`, `Vodafone Cash`, `POPIA`, `NDPA`, `PDPL`, `VAT`, `ETA`, `NRS`, `TIN`, `ZAR`, `NGN`, `EGP`; the only exceptions are the roadmap facts named in §2, whose statements start "Planned, not available:". Topic identifiers are checked against the enum, not against these patterns.
- **AC-A3** Prose fields (`statement`, `message`, `note`, `qualifier`) match none of `/residen/i`, `/ISO ?27001/i`, `/HIPAA/i`, `/WhatsApp-first/i`, `/sales[- ]only/i`, `/sales[- ]first/i`, `/certified/i`.
- **AC-A4** Every fact validates against `scripts/market-facts.schema.json`; roadmap facts have `is_capability: false`; the roadmap facts in §2 are the only ones.
- **AC-A5** The positioning fact is positive: it names the suite areas and lists WhatsApp as one channel among several. (A negation such as "not sales-only" is not used, because AC-A3 bans the phrase.)
- **AC-A6** Generation tests (build-time) over this plan's data file: hash mismatch, duplicate `fact_id`, unknown status or gate, a fact whose `publish_gates` omit the policy's mandatory gates (rejected), roadmap with `is_capability: true`, missing `verified_on` or `release_evidence_version`, banned phrase, byte-identical output on two runs, a hand-edited generated file (start-up hash check fails closed), gated facts **still present in the artifact**, and **adding this market's file leaves every other market's generated bytes unchanged**. Runtime tests are AC-A9, not here.
- **AC-A7** Fixtures for the pending, published, expired and error states (§2c) are committed; serialized results of every changed tool validate against their `outputSchema`; `tools/list` differs from the baseline only by additive `outputSchema` properties of the changed tools.
- **AC-A8** Price fields are `null` with `price_status: "pending_verification"` while a gate is unmet.
- **AC-A9** Exact boundary and malformed input: a built server with an injected clock serves the fact at `expires_on - 1ms` and withholds it at `expires_on`; a missing or malformed `expires_on`, an unknown gate id and a `revoked` gate all withhold; `MARKET_FACTS_KILL_SWITCH` withholds without a rebuild; a response never outlives `valid_until` (it carries it). The clean-build walk (unmet, met, revoked) of §2b passes. The SOC 2 fact is absent while `soc2-scope` is unmet.
- **AC-A11** The baseline fixtures are captured at the **commit that contains every dependency of §2a** (0007 PR-A and, where listed, 0009 PR-A), recorded in the PR body, so inherited changes are not counted as this plan's. The PR's first step is the conformance run of §2a.
- **AC-A12** Composition: a committed test calls `country_get` then `pricing_get_plans`, and the reverse, and asserts that the pending note and the global-ladder disclaimer are present in the `country_get` answer in both orders. Price statements contain the approved qualifier next to the amounts whenever published.
- **AC-A13** Gate scoping: revoking, expiring or kill-switching one market's gate leaves every other market's output byte-identical.
- **AC-A10** Tool count equals the `main` count; the SDK client round trip (initialize, `tools/list`, call) succeeds; `annotations.test.ts` and `registry.test.ts` pass.

**PR-B**
- **AC-B1** With both price gates met: price rows carry USD 12 per user per month and USD 120 per user per year upfront with `applies_to`, `billing_currency: "USD"`; with either unmet, they are `null` and pending (the build does not fail, the server fails closed).
- **AC-B2** No price row, `MARKET_SCOPE` or hub row mentions these markets in a local currency; price facts appear only when both gates of that market are met and carry `billing_currency: "USD"`.
- **AC-B3** `release_evidence_version` agrees across the data file, `gates.json` and the PR body's cited commit ids.
- **AC-B4** The PR body contains the website build id, the affected-route coverage report, the measured cache behaviour and kill-switch time, and the rollback target; `CODEOWNERS` review by the approver is shown.

## 7b. Smoke test   (expected only; the BUILD PR records observed results)

| # | Call | Expected |
|---|---|---|
| 1 | `country_get({"code":"ng"})` after PR-A | market-only form; facts: Stripe payment, tenant-gateway roadmap, positioning (3); price facts absent with `price_status: pending_verification`; SOC 2 absent; `withheld` 7 base topics plus `price-pending` and `soc2-report-period` |
| 2 | `country_get({"code":"za"})`, `({"code":"eg"})` | same shape; ZA 7 base withheld topics, EG 6 |
| 3 | `countries_list()` | `count: 8`, `countries` unchanged, `additional_markets` includes `nl`, `za`, `ng`, `eg` |
| 4 | after PR-B for one market | that market's price present; the other two still pending |
| 5 | clock past `expires_on` | SOC 2 absent, `soc2-report-period` present, for each published market |
| 6 | pattern scan of every response | no AC-A2 or AC-A3 match |

## 7e. Competitors

Competitor MCP servers were not read this session; the research table keeps those cells as `?`. Competitor prices are not served (research rule R9).

## 7f. Compatibility test: per-tool, per-PR contract matrix

Fixtures captured at the dependency commit recorded under AC-A11 (not from today's `main`): `country_get` (all codes), `countries_list`, `pricing_get_country_plans`, `pricing_get_faq`, `pricing_get_plans`, `tools/list`.

| Tool | PR-A change | PR-B change |
|---|---|---|
| `country_get` for `za`, `ng`, `eg` | these codes now return the market-only form that 0009 introduced (`market_facts` with pending price); today they fail | `market_facts.price` goes from `pending_verification` to `published` for the market whose gates are met (payload change, no tool code change) |
| `country_get` for the 8 hubs | none beyond 0007's keys | none |
| `countries_list` | `additional_markets` gains these entries | none |
| `pricing_get_country_plans`, `pricing_get_faq`, `pricing_get_plans` | none (no row for these markets exists or is added) | none |

Every other tool is byte-identical.  The SDK client round trip stands in for external clients; it does not prove that consumers which only enumerate `countries` or assume a fixed country list tolerate the additions, so the README and CHANGELOG document them.

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
No 'sales market' product description, no Arabic or RTL claim, no offline-capture or do-not-disturb claim.
Deferred, with the reason: market competitors in `alternatives_list` (PR-C of 0007) for this plan's markets. Research vendor rows: ZA 34 (1 with a live page, CREATE 1 elsewhere), NG 49 (20 with an en-NG page), EG 49 (20 with an en-EG page); decisions HOLD or SKIP, so nothing is served.

## 10. Decisions owed

- **F1** closed: topic-only `withheld` entries are served. **F2** closed: nothing to withdraw. **F4** closed: no price is served until a market's gates are met.
- **F3 (open)** SOC 2 renewal, expiry policy (proposed 2026-12-31) and approved wording, shared across all markets.
- **F7 (merge condition, not a question)** PR-A may not merge until the gateway plan numbers and PR references in `evidence.ref` are checked against the hellocrm PRs; unverified references are removed from the data file.

## 11. Findings outside this plan   (D-EXP-14: recorded, not fixed here)

- `src/data/website-mirror.ts` USA row `compliance: "SOC 2, HIPAA and IRS filings"` asserts HIPAA (`grep -n HIPAA src/data/website-mirror.ts`).
- `src/tools/alternatives.ts` describes HelloGrowthCRM as WhatsApp-first in two places and as "Sales-first" in three (`grep -n "WhatsApp-first\|Sales-first" src/tools/alternatives.ts`). These sit in `alternatives_get` and `switch_get_guide` text for named competitors, not in the responses this plan changes. Each needs its own MCP plan.
- The mirror comment calls SOC 2 "certified"; it is an attestation.

## 12. Estimated token cost

Estimate, not a quote; input tokens at $3/M; reuses 0007's generator and predicate and 0009's mechanism.

| PR | Low | Expected | High |
|---|---|---|---|
| PR-A (three data files, tests) | 0.5M | 0.75M | 1.1M |
| PR-B (gates, per market, can be split) | 0.1M | 0.2M | 0.35M |
| **Total (reuse)** | **0.6M** | **0.95M** (about $3) | **1.45M** |

Three separate plans would add about 0.4M of repeated orientation and review; the combination is chosen because the tool changes are identical. This plan PR: about 0.35M.

## 13. Validation (this plan PR)

- **PASS**: plan id 0010 free after 0009 (#112); no remote `plan/hellog-0010*`.
- **PASS**: `main` @ `5190a02` has no ZA, NG or EG row in `COUNTRIES`/`COUNTRY_PRICING`.
- **PASS**: research `vendors.csv`: ZA 34 rows, NG 49 (20 en-NG), EG 49 (20 en-EG); none served here.
- **UNVERIFIABLE**: live server; gateway plan numbers and PRs (taken from research drafts and the coordinator); competitor MCP inventories; regulator hosts.
- **BLOCKED**: Stripe flow-1 bundle (Rushabh).

## 14. Review record

Astra, blind, role plan, 2026-11-02: **accept-with-changes** on rev 1 (five blockers). Each finding was checked against the plan and the repo before it changed anything.

| # | Finding | Verdict | Change |
|---|---|---|---|
| 1 | Editing a fact's `publish_gates` could bypass approval | Accepted. True | Mandatory gates by kind in a protected policy file; the generator rejects omissions and the predicate unions the policy's gates; start-up hash check of the generated data (§2b, AC-A6) |
| 2 | Baseline excluded the 0009 dependency; §7f wrong about what this plan introduces; unexplained compliance caveat | Accepted | Baseline at the commit containing every dependency (AC-A11); matrix says this plan extends `additional_markets` and that PR-B changes payloads; the compliance caveat is now only in the hub plans |
| 3 | Kill switch and cache guarantees exceeded the mechanism | Accepted | Restart or replacement deployment required, named procedure and recorded drill; `Cache-Control: no-store` asserted through the deployed HTTP path |
| 4 | Stripe fact implied regional availability | Accepted | Statement scoped to the global processor with a `purchase-availability` withheld topic; per-market eligibility is gate evidence |
| 5 | Generator test conflicted with the lifecycle | Accepted | Generation tests and runtime tests split (AC-A6, AC-A9) |

Risks and missing items taken: qualifier beside every price statement and checkout charges (tax, conversion, other); re-observation trigger and owner, 14-day expiry warning; indirect imports and alternate locales in the coverage inventory; market-qualified gate identity and tests (AC-A13); composition test in both call orders (AC-A12); one authoritative file inventory with README, CHANGELOG, versions and fixtures; conformance run on the merged dependencies; F7 turned into a merge condition; SOC 2 never activated in a price-gate PR and its wording must not imply all services were examined. Cut taken: gateway plan numbers moved out of public statements into `evidence.ref`; SOC 2 activation is its own PR. Not taken: nothing rejected. The review ran once; rev 2 was not re-reviewed.

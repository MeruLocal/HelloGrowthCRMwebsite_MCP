# Plan — MCP: United Kingdom country facts (pricing, payments, markets, security attestation)

- **Revision:** 3 (2026-11-02), Astra blind review of rev 1 folded; shared-contract updates from the 0008, 0009 and 0010 reviews (§14). Built on the contract of PLAN-HELLOG-0007 (#110) after its Astra review; this plan restates what it needs so it can be read alone.
- **Plan id:** PLAN-HELLOG-0007, allocated 2026-11-02 as the next free number after PLAN-HELLOG-0006 (#109). Sources: remote `plan/` branches and the REST PR list (highest plan title before this one: 0006). The adapter's `git fetch origin master` and GraphQL reads fail here (trunk is `main`; GraphQL is blocked), so the REST list is the check of record. Re-run `plan-id.mjs check` after the branch is pushed.
- **Branch:** `plan/hellog-0007-mcp-uk-country-facts` · **Repo:** MeruLocal/HelloGrowthCRMwebsite_MCP · **Trunk:** `main` (head `5190a02`)
- **Mode:** PLAN (plan only, no code). Each BUILD is its own PR carrying `Implements: PLAN-HELLOG-0007 (PR-x)`.
- **Change tags:** `public_api`, `product`
- **Tier:** T2. Owed: acceptance_criteria, blast_radius, caller_inventory, compatibility_test, competitor_scan, intent, necessary_changes, planned_file_coverage, premise_check, smoke_test
- **Restricted areas touched:** none. The server states prices; it does not bill.
- **Freeze in force?** Yes: the PLAN-HELLOG-0003 (#102) release gate G1–G5 blocks public deploy of every BUILD.
- **Origin:** founder standard D-EXP-14 (2026-11-02). Research: MeruLocal/Hellogrowthcrm-Researchsuite#94 (branch `claude/six-market-uk`); contract in `research-methodology/six-market-plan-2026-11-02.md` §7c, §7f.
- **Research evidence:** MeruLocal/Hellogrowthcrm-Researchsuite#94
- **Opportunity ID:** OPP-SIX-UK-001
- **Date:** 2026-11-02

## 0. Intent

- **Claim.** On `main` (`src/data/website-mirror.ts`, `src/tools/pricing.ts`, `src/tools/countries.ts`):
  1. Growth is `£8/user/mo` (annual) and `£10/user/mo` (monthly) in `COUNTRY_PRICING`, and `country.currency` is `GBP`. Founder decisions D-EXP-40, 44, 45: **USD 12 per user per month, or USD 120 per user per year charged once upfront, no tax line.**
  2. `paymentMethods: "Credit/debit card, Stripe, GoCardless, bank transfer"` and the `pricing_get_faq` answer `UK: card, Stripe, GoCardless, bank transfer`. Subscriptions are paid via Stripe (flow 1). GoCardless is **roadmap only** (PLAN-HGC-0723), never live; card and bank transfer are not evidenced.
  3. `compliance: "UK GDPR compliant, ICO-registered data processor"` and `GDPR, HMRC and FCA rules`. The research registry holds every UK compliance topic as `unverified` (government and regulator hosts unreachable from the research session). Compliance is stated only as verified.
  4. No SOC 2 scope is served (the mirror's `COMPANY` comment says "certified"; SOC 2 is an attestation).
  5. No market view of competitors: `alternatives_list` serves 23 India-centred routes; research found 57 vendors with a live `en-GB` page (UK `vendors.csv`: 164 rows). Deferred (§9).
- **Mechanism.** PR-A **owns the multi-market machinery** (generator, schema, policy, `gates.json`, publication predicate, kill switch, conformance script): it withdraws the unsupported UK text and the GBP price from every response path, rewires the UK price to the predicate (null and pending until its gates are met), and adds versioned `market_facts` to the existing `country_get`. PR-B publishes USD once the website and live Stripe evidence agree. Plans 0008 to 0010 are data on this contract. **No new tool and no new resource.**
- **Observable.** "What does HelloGrowthCRM cost in the UK, how do I pay, and is it SOC 2?" returns `price_status: pending_verification` until the gates are met, then USD 12 per user per month or USD 120 per user per year upfront; "paid via Stripe" throughout; and, once the SOC 2 gate is met, a historical attestation with entity, auditor and period. Asked about GoCardless it gets "Planned, not available". Asked about PECR, UK GDPR or Making Tax Digital it gets `withheld` entries.
- **Risk.** A price served before the website and Stripe agree; a roadmap gateway read as live; unverified compliance quoted; Arabic or Dutch UI claims before review; an old SOC 2 period read as current assurance; residency, ISO 27001 or HIPAA language; WhatsApp-first or sales-only positioning.

## 0a. Necessary changes   (planned-file coverage)

**PR-A: machinery, withdrawals, price rewiring and UK `market_facts`** (buildable now)
- [ ] `scripts/market-facts.schema.json`, `scripts/market-facts.policy.json` (mandatory gates by kind), `scripts/build-market-facts.mjs` (multi-market: discovers `test-data/market-facts/<as_of>/<cc>.json`, validates, embeds gates and an integrity hash, deterministic), `scripts/check-release-evidence.mjs`, `scripts/check-market-facts-redaction.mjs`, `scripts/check-contract-conformance.mjs`; `package.json`: `check:market-facts` (with `--warn-days`), added to `verify`; `ajv` as a devDependency (none exists today).
- [ ] `src/lib/market-publication.ts`: `isPublished(item, now)`, `getMarketPrice(market, now)`, the kill-switch read, the start-up integrity check.
- [ ] `src/data/market-facts.ts`: generated, never hand-edited.
- [ ] `test-data/market-facts/2026-11-02/uk.json`, `gates.json`, `SHA256SUMS`; `.github/CODEOWNERS` entry for `test-data/market-facts/**/gates.json` and `scripts/market-facts.policy.json`.
- [ ] `src/data/website-mirror.ts` (UK rows only): `COUNTRY_PRICING` UK price fields read from `getMarketPrice("uk", now)` (null while unmet), `pricingSummaryLine` becomes `Free Forever · Growth (price pending verification) · Enterprise (custom) · 14-day trial on paid plans`, `paymentMethods` becomes `Paid via Stripe`, `compliance` null with `compliance_status: "withheld_unverified"`; `COUNTRIES` UK `compliance` null with the same status.
- [ ] `src/tools/pricing.ts`: the UK clause of the `pricing_get_faq` payment answer becomes `UK: paid via Stripe`.
- [ ] `src/tools/countries.ts`: `country_get` adds `market_facts` (or null with top-level `market_facts_reason`) and, for the UK, `price_status`/`compliance_status`; `countries_list` rows add `market_facts_available`; every tool that carries market facts sends `Cache-Control: no-store`.
- [ ] `src/tools/output-schemas.ts`: nullable fields for `country_get`, `countries_list`, `pricing_get_country_plans`.
- [ ] `README.md`, `CHANGELOG.md`, version strings, fixtures `test-data/fixtures/market-facts-uk-{pending,published,expired,error}.json`.
- [ ] Tests: `market-facts-uk.test.ts`, generation tests, runtime and clock tests, composition test, HTTP/cache test, SDK client round trip.

**PR-B: gates and billing currency** (blocked, §2a)
- [ ] `gates.json` UK rows set to `met` by an approved diff; `src/data/market-facts.ts` regenerated; `src/data/website-mirror.ts` UK price-row `currencyCode`/`currencySymbol` to `USD`/`$` plus additive `billing_currency`; `COUNTRIES` UK `currency` unchanged.
- [ ] `src/tools/pricing.ts`: `MARKET_SCOPE.outside_india` drops the token "the UK (GBP)" (0008 drops "UAE (GBP)"; one token each).
- [ ] Update `pricing-country-aware.test.ts`, `pricing-truth.test.ts`. `soc2-scope` is activated in its own PR after decision F3 closes.

Client documentation: `README.md` gains a short section on market facts, the pending-price state, `withheld`, and (where applicable) additional-market discovery and the hub-only `countries_list.count`. Version and changelog: each BUILD bumps per `npm run check:versions` and adds a `CHANGELOG.md` line. **PR-C (market competitors in `alternatives_list`) is DEFERRED for this plan:** the route-status evidence it needs is not in the research export, and it does not repair an unsupported claim. It is recorded, not planned (§9).

## 0b. What we already know   (G4)

| Source | What it said | What this plan does about it |
|---|---|---|
| Research `plans-draft/SIX-UK/website.md` §4 | 10 UK pages show a GBP HGC price; wording USD 12 per user per month or USD 120 per user per year upfront; payments to HGC through Stripe, tenant gateways a separate flow; 3 UK pages lack hreflang alternates | Price rewired and corrected; hreflang gaps are website issues |
| Research `claims/registry/_inbox/uk.csv` | Seven rows: VAT 20%, PECR, UK GDPR and residency, MTD VAT, Companies House, accounting and payments all `unverified`; pricing `decided (founder)` | Only pricing becomes a fact; the rest are topic-only `withheld` |
| Research `plans-draft/SIX-UK/product.md` | GoCardless covered by an open hellocrm plan; Xero edge functions exist; no MTD or Companies House code; PECR strings in 23 files (presence is not compliance) | GoCardless is a roadmap fact; the rest withheld |
| Research §7c, §7f; SOC 2 evidence note | MCP row and contract; Soor LLC, Precision Assurance CPA LLC, 2025-02-01 to 2025-06-30, five criteria, NDA, no ISO 27001, period about 16 months old | Contract adopted; SOC 2 gated |
| PLAN-HELLOG-0003, 0005, 0006 | No tool growth (89 `defineTool(` calls on `main`); category facts; claims tools | No tool added |

## 1. Premise   (G8)

| Claim | Type | Evidence gathered | Running system? |
|---|---|---|---|
| UK price is GBP | wrong_fact | `COUNTRY_PRICING` UK `growthPriceShort: "£8/user/mo"`, `growthPriceMonthly: "£10/user/mo monthly"`; `COUNTRIES` UK `currency: "GBP"` | not required |
| GoCardless and unevidenced methods are served | wrong_fact | UK `paymentMethods` and the `pricing_get_faq` string in `src/tools/pricing.ts` | not required |
| Compliance strings are unverified assertions | unverified | `UK GDPR compliant, ICO-registered data processor`; `GDPR, HMRC and FCA rules`; research `uk.csv` all `unverified` | not required |
| No tool serves the SOC 2 scope | missing_feature | `grep -rn "Precision Assurance\|Type II" src` returns no hit | not required |
| The global Growth plan already says USD 12 monthly | context | `price_monthly: "$12/user/month"`, `price_annual: "$10/user/month (billed annually)"` (a monthly equivalent, not the USD 120 upfront statement) | not required |
| Live Stripe matches USD 12 / 120 and the methods enabled for UK buyers | external | Research §6a | **BLOCKED**: Stripe access (Rushabh) |

The live server was not queried in this session. Every claim is about `main` and the research branches.

## 2. What changes

**Compatibility exception (named).** PR-A removes served UK text of three kinds: the GBP price (replaced by a pending state), GoCardless and unevidenced payment methods, and the two compliance strings. This is an exception to D-EXP-16 (additive only), authorised by the founder's rules of 2026-11-02 (compliance only as verified; tenant gateways never live; one USD price) and D-EXP-22. Nothing else is removed. New facts never ship while the old assertions remain.

`status` is `capability` for text that is true and published now, `roadmap` for a planned or queued item. A roadmap fact always has `is_capability: false` and a statement that starts "Planned, not available:". `claim_id_status` is `provisional` until the Claim Registry export assigns ids, then `registry`; a re-pin keeps old ids in `claim_id_aliases`. Fact fields: `fact_id, claim_id, claim_id_status, claim_id_aliases, scope_ref, kind, statement, applies_to, market, status, is_capability, evidence{type,ref,public_url}, verified_on, fact_version, supersedes, release_evidence_version, commit_id, publish_gates`. The `withheld` list uses a closed enum of topic identifiers and the fixed message "HelloGrowthCRM has not published a verified statement on this topic."; the conditional topics `soc2-report-period` and `price-pending` are members of the enum.

| fact_id | kind | status | Statement | Gates and evidence |
|---|---|---|---|---|
| uk.price.monthly | price | capability | Growth is USD 12 per user per month | website-deploy, stripe-flow1 |
| uk.price.annual | price | capability | Growth is USD 120 per user per year, charged once upfront | website-deploy, stripe-flow1 |
| uk.pay.hgc-subscription | payment | capability | HelloGrowthCRM subscriptions are paid via Stripe, the global subscription processor. Whether buyers in this market can purchase, and with which methods, is not confirmed here | none; evidence: D-EXP-41, flow 1 only; regional availability is the withheld topic `purchase-availability` |
| uk.pay.gocardless | payment | roadmap | Planned, not available: GoCardless direct-debit collection. It is not a way to pay HelloGrowthCRM and is not live | none; evidence: PLAN-HGC-0723 (provenance, not in the statement) |
| uk.market.hub | market | capability | The UK hub is `/uk`, language en-GB. Hreflang values are those computed by the MCP's port of the website function (self en-GB) | none; evidence: `COUNTRIES` row, `getHreflangTags` port, observed 2026-11-02 |
| uk.security.soc2 | attestation | capability | A SOC 2 Type II examination of Soor LLC for 2025-02-01 to 2025-06-30 was completed by Precision Assurance CPA LLC (criteria: Security, Availability, Privacy, Confidentiality, Processing Integrity). The report is available under NDA on request | soc2-scope; expires_on |
| uk.positioning.suite | positioning | capability | HelloGrowthCRM is a full-stack business suite (pipeline, communication, commerce, operations, customers, marketing, intelligence); WhatsApp is one channel next to email, SMS, voice and live chat. | none; evidence: CLAUDE.md §1.1 product definition (founder, 2026-08-13) and the hellocrm `FEATURE_INVENTORY.md` |

Evidence for SMS, voice and live chat in the positioning fact is the hellocrm `FEATURE_INVENTORY.md` entries (cited by id in the data file) and the founder product definition; the PR records the grep it ran.

`withheld[]`: `purchase-availability`, `vat-rate`, `making-tax-digital`, `pecr-consent`, `uk-gdpr`, `companies-house`, `uk-accounting-integrations`, and the conditional `soc2-report-period` and `price-pending`. There is no residency topic and no residency sentence.

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

1. **PR-A** has no code dependency; it is the contract owner. Plans 0008 (#111), 0009 (#112) and 0010 start only after it merges and passes its own conformance script.
2. **PR-B** is blocked on gates `website-deploy:uk` and `stripe-flow1:uk` (Stripe access not granted; no resolution date, which is why PR-A already withdraws the GBP price).
3. **0003 G1–G5** blocks public deploy; release approver Rushabh; smoke owner the PR author (`test-mcp.mjs` plus §7b); evidence of G1–G5 cited in each PR body.
4. **0006 PR-A** is not required; if it lands, `claim_id` can be resolved through `claims_get`.

## 3. Affected files

| Area | Files | PR |
|---|---|---|
| Machinery | `scripts/market-facts.{schema,policy}.json`, `scripts/{build-market-facts,check-release-evidence,check-market-facts-redaction,check-contract-conformance}.mjs`, `src/lib/market-publication.ts`, `package.json`, `.github/CODEOWNERS` | A |
| Facts and gates | `test-data/market-facts/2026-11-02/{uk.json,gates.json,SHA256SUMS}`, `src/data/market-facts.ts` | A (gates edited in B) |
| Withdrawals and price rewiring | `src/data/website-mirror.ts` (UK rows), `src/tools/countries.ts`, `src/tools/pricing.ts`, `src/tools/output-schemas.ts` | A |
| Currency and scope | `src/data/website-mirror.ts` (UK price-row currency), `src/tools/pricing.ts` (`MARKET_SCOPE`) | B |
| Docs, release, fixtures | `README.md`, `CHANGELOG.md`, version strings, `test-data/fixtures/market-facts-uk-*.json` | A, B |
| Tests | see §0a | A, B |

Not touched: `access.ts`, `index.ts`, `server.ts` (the cache header is set where the tool response is built, in `src/tools/countries.ts` and `src/tools/pricing.ts`), `server.json`, `smithery.yaml`.

## 5. Blast radius and caller inventory

`country_get`/`countries_list`/`pricing_get_country_plans`/`pricing_get_plans` as in the §7f matrix. Callers: `grep -rn "country_get\|countries_list\|pricing_get_country_plans\|COUNTRY_PRICING\|\.compliance" src` is run in PR-A and every hit listed, including generic FAQ and plan responses that mention the UK (`pricing_get_faq`, `MARKET_SCOPE`). No change to tool count, names, descriptions, resources or llms.txt.

## 6. Acceptance criteria   (per PR; none weakened during implementation)

**PR-A**
- **AC-A1** Compatibility matrix (§7f) holds: only the listed keys and values differ from the `main` fixtures, per tool.
- **AC-A2** No response for the UK contains any string from the P-list: `GoCardless`, `bank transfer`, `UK GDPR compliant`, `ICO-registered`, `HMRC and FCA`, `£`, `GBP`; the only exceptions are the roadmap facts named in §2, whose statements start "Planned, not available:". Topic identifiers are checked against the enum, not against these patterns.
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
- **AC-B2** `MARKET_SCOPE.outside_india` no longer lists the UK in GBP; the other five local currencies are unchanged; `country.currency` stays `GBP` (market metadata) and `billing_currency` is `USD`.
- **AC-B3** `release_evidence_version` agrees across the data file, `gates.json` and the PR body's cited commit ids.
- **AC-B4** The PR body contains the website build id, the affected-route coverage report, the measured cache behaviour and kill-switch time, and the rollback target; `CODEOWNERS` review by the approver is shown.

## 7b. Smoke test   (expected only; the BUILD PR records observed results)

| # | Call | Expected |
|---|---|---|
| 1 | `country_get({"code":"uk"})` after PR-A | facts: Stripe payment, GoCardless roadmap, hub, positioning (4); price facts absent and `price_status: pending_verification`; SOC 2 absent; `withheld` has 8 base topics plus `price-pending` and `soc2-report-period`; compliance null |
| 2 | `pricing_get_country_plans({"country":"uk"})` after PR-A | `Paid via Stripe`; growth prices null and pending; compliance withheld |
| 3 | same after PR-B with both gates met | USD 12 per user per month, USD 120 per user per year upfront, `billing_currency: "USD"`; `price-pending` topic gone (6 facts) |
| 4 | `country_get({"code":"uk"})` with a clock past `expires_on` | SOC 2 absent, `soc2-report-period` present |
| 5 | pattern scan of every response above | no AC-A2 or AC-A3 match |

## 7e. Competitors

Competitor MCP servers were not read this session; the research table keeps those cells as `?`. Competitor prices are not served (research rule R9).

## 7f. Compatibility test: per-tool, per-PR contract matrix

Fixtures captured at the dependency commit recorded under AC-A11 (not from today's `main`): `country_get` (all codes), `countries_list`, `pricing_get_country_plans`, `pricing_get_faq`, `pricing_get_plans`, `tools/list`.

| Tool | PR-A change | PR-B change |
|---|---|---|
| `country_get` uk | + `market_facts`; `country.compliance` null; + `country.compliance_status`; `pricing_summary` growth price fields null, + `price_status`; `paymentMethods` `Paid via Stripe` | `pricing_summary` price fields USD; + `billing_currency`; `country.currency` unchanged |
| `country_get` other codes | none beyond 0007's keys | none |
| `countries_list` | none beyond 0007's keys | none |
| `pricing_get_country_plans` uk | growth price fields null + `price_status`; `pricingSummaryLine` as §0a; `paymentMethods`; `compliance` null + `compliance_status` | `currencyCode` `USD`, price strings, `billing_currency` |
| `pricing_get_country_plans` other | none | none |
| `pricing_get_plans` | none | `MARKET_SCOPE.outside_india` loses "the UK (GBP)" |
| `pricing_get_faq` | the UK clause of the payment answer becomes `UK: paid via Stripe` | none |

Every other tool is byte-identical. A field changing from a string to `null` (compliance, price) is a visible change; it is listed in the matrix, the README and the CHANGELOG. The SDK client round trip stands in for external clients; it does not prove that consumers which only enumerate `countries` or assume a fixed country list tolerate the additions, so the README and CHANGELOG document them.

## 8. Risks and edge cases

| Risk | Mitigation |
|---|---|
| Known wrong GBP price served while evidence is blocked | Withdrawn in PR-A (pending state) |
| Live Stripe does not enable UK currency or methods, or checkout adds tax | `stripe-flow1` gate with checkout tests, eligibility and renewal evidence; fail closed |
| Expiry or revocation not honoured after deploy | One predicate on every path, evaluated per request; AC-A9 |
| Tenant gateways read as live | Roadmap-only GoCardless; everything else withheld |
| Residency language | None written; AC-A3 |
| `country.currency` consumers | Unchanged (GBP); billing currency is a separate field |

## 9. What this deliberately does NOT do

No new tool, resource or llms.txt section. No tenant-gateway capability: every local gateway is roadmap or absent, and nothing says subscriptions are paid through one. No tax-rate, data-protection, e-invoicing, accounting-integration or language-UI claim, no data-residency sentence, no ISO 27001 or HIPAA claim. No competitor prices. No removal of existing text beyond the named withdrawals and the price correction. No edit to hellocrmwebsite or hellocrm.

Deferred, with the reason: market competitors in `alternatives_list` (PR-C of 0007) for this plan's markets. The 57 UK vendors with an `en-GB` page in research (`vendors.csv`: 164 rows) stay research data; page decisions are CREATE 0, EXPAND 1 (MailerLite evidence on an existing issue), HOLD 141, SKIP 22.

## 10. Decisions owed

- **F1** closed: topic-only `withheld` entries are served. **F2** closed: unsupported UK text is withdrawn (founder may veto). **F4** closed: the GBP price is withdrawn in PR-A.
- **F3 (open)** Is a SOC 2 examination after 2025-06-30 under way? Confirm the expiry policy (proposed `expires_on` 2026-12-31) and the approved wording. Until closed the SOC 2 fact stays unpublished.

## 11. Findings outside this plan   (D-EXP-14: recorded, not fixed here)

- `src/data/website-mirror.ts` USA row `compliance: "SOC 2, HIPAA and IRS filings"` asserts HIPAA (`grep -n HIPAA src/data/website-mirror.ts`).
- `src/tools/alternatives.ts` describes HelloGrowthCRM as WhatsApp-first in two places and as "Sales-first" in three (`grep -n "WhatsApp-first\|Sales-first" src/tools/alternatives.ts`). These sit in `alternatives_get` and `switch_get_guide` text for named competitors, not in the responses this plan changes. Each needs its own MCP plan.
- The mirror comment calls SOC 2 "certified"; it is an attestation.

## 12. Estimated token cost

Estimate, not a quote; input tokens at $3/M.

| PR | Low | Expected | High |
|---|---|---|---|
| PR-A (machinery, data, withdrawals, tests) | 1.0M | 1.4M | 2.0M |
| PR-B (gates, currency, scope token, tests) | 0.3M | 0.4M | 0.65M |
| **Total (reuse of `country_get`, `pricing_get_country_plans`)** | **1.3M** | **1.8M** (about $5.5) | **2.65M** |

A fresh path with a new `uk_facts` tool and resource would add registry, annotation, title and schema work (about 0.6M) and spend tool-selection budget; it is rejected. This plan PR: about 0.35M.

## 13. Validation (this plan PR)

- **PASS**: plan id 0007 free: REST PR list shows PLAN-HELLOG-0001 to 0006 only; no remote branch `plan/hellog-0007*`.
- **PASS**: `main` @ `5190a02`: UK `COUNTRY_PRICING` is `£8`/`£10`; `paymentMethods` lists GoCardless; compliance `UK GDPR compliant, ICO-registered data processor`; `COUNTRIES` UK compliance `GDPR, HMRC and FCA rules`; `package.json` has no JSON Schema validator.
- **PASS**: research UK `vendors.csv` 164 rows, 57 with `en-GB` (not served here).
- **UNVERIFIABLE**: live server; competitor MCP inventories; UK government and regulator hosts.
- **BLOCKED**: Stripe flow-1 bundle (Rushabh).
- **PASS**: one Astra blind review run (§14).

## 14. Review record

Astra, blind, role plan, 2026-11-02: **reject** on rev 1 (six blockers), checked against the plan and the repo before anything changed.

| # | Finding | Verdict | Change |
|---|---|---|---|
| 1 | PR-A published contradictory answers (old GoCardless and compliance strings beside new facts) | Accepted. True | PR-A withdraws the unsupported text (named exception to D-EXP-16); F2 closed |
| 2 | Acceptance criteria could not pass together | Accepted. True | ACs rewritten per PR; "no tax line" tested not stated; no residency topic; prose and identifier checks separated |
| 3 | No implementable gate contract | Accepted | The AND-gate manifest and one publication predicate (§2b), fail closed |
| 4 | 23 rows cannot become 57 vendors | Accepted | Market competitors are deferred until the research export carries route-status evidence (§9); nothing is served for them |
| 5 | Output-schema coverage incomplete; enum blocks custom failure | Accepted | All changed contracts listed (§0a, §7f matrix); wire fixtures (§2c) |
| 6 | SOC 2 publication gate missing | Accepted | Historical wording, `soc2-scope` gate, `expires_on` withheld at request time |

Shared-contract updates taken from the Astra reviews of 0008, 0009 and 0010 (plans on the same contract; no second review of this plan): price withdrawal in PR-A (reviewer 0008), one predicate on every path including mirror fields and expiry without rebuild, enforced approval and mandatory gates by kind, kill switch with restart semantics and a recorded drill, `no-store` through the HTTP path, lifecycle (all facts generated, absence is a served-response property), market-qualified gates, the public price qualifier, Stripe fact scoped to the global processor with `purchase-availability`, baselines at the dependency commit, conformance script, composition test, expiry warning, README and fixtures in the inventory. Not taken: nothing rejected. The review ran once; this revision was not re-reviewed.

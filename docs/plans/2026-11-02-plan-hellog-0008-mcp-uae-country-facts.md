# Plan — MCP: United Arab Emirates country facts (pricing, payments, markets, security attestation)

- **Revision:** 3 (2026-11-02), Astra blind review of rev 1 folded; shared-contract updates from the 0009 review (§14). Built on the contract of PLAN-HELLOG-0007 (#110) after its Astra review; this plan restates what it needs so it can be read alone.
- **Plan id:** PLAN-HELLOG-0008, allocated 2026-11-02 as the next free number after PLAN-HELLOG-0007 (#110). Sources: remote `plan/` branches and the REST PR list (highest plan title before this one: 0007). The adapter's `git fetch origin master` and GraphQL reads fail here (trunk is `main`; GraphQL is blocked), so the REST list is the check of record. Re-run `plan-id.mjs check` after the branch is pushed.
- **Branch:** `plan/hellog-0008-mcp-uae-country-facts` · **Repo:** MeruLocal/HelloGrowthCRMwebsite_MCP · **Trunk:** `main` (head `5190a02`)
- **Mode:** PLAN (plan only, no code). Each BUILD is its own PR carrying `Implements: PLAN-HELLOG-0008 (PR-x)`.
- **Change tags:** `public_api`, `product`
- **Tier:** T2. Owed: acceptance_criteria, blast_radius, caller_inventory, compatibility_test, competitor_scan, intent, necessary_changes, planned_file_coverage, premise_check, smoke_test
- **Restricted areas touched:** none. The server states prices; it does not bill.
- **Freeze in force?** Yes: the PLAN-HELLOG-0003 (#102) release gate G1–G5 blocks public deploy of every BUILD.
- **Origin:** founder standard D-EXP-14 (2026-11-02). Research: MeruLocal/Hellogrowthcrm-Researchsuite#95 (branch `claude/six-market-uae`); contract in `research-methodology/six-market-plan-2026-11-02.md` §7c, §7f.
- **Research evidence:** MeruLocal/Hellogrowthcrm-Researchsuite#95
- **Opportunity ID:** OPP-SIX-UAE-001
- **Date:** 2026-11-02

## 0. Intent

- **Claim.** On `main` (`src/data/website-mirror.ts`, `src/tools/pricing.ts`, `src/tools/countries.ts`):
  1. Growth is `AED 37/user/mo` (annual) and `AED 48/user/mo` (monthly) in `COUNTRY_PRICING`, and `country.currency` is `AED`. Founder decisions D-EXP-40, 44, 45: **USD 12 per user per month, or USD 120 per user per year charged once upfront, no tax line.**
  2. `paymentMethods: "Credit card, bank transfer, Stripe"`. Subscriptions are paid via Stripe (flow 1). Bank transfer is not evidenced. Tenant gateways are roadmap only (Tamara is queued); Telr and Tabby strings exist in code (39 and 9 files per research) with unverified status, so they are not stated either.
  3. `compliance: "UAE PDPL compliant"` and `VAT, ESR and free-zone rules`. The research registry holds every UAE compliance topic as `unverified` (official hosts unreachable from the research session). Compliance is stated only as verified.
  4. `COUNTRIES` lists `channels: ["WhatsApp","Email","Phone"]`, and the website carries WhatsApp-first wording on 10 UAE pages. HelloGrowthCRM is a full-stack suite.
  5. No SOC 2 scope is served (the mirror's `COMPANY` comment says "certified").
- **Mechanism.** PR-A withdraws the unsupported UAE text and the AED price from every response path, rewires the UAE price to the single publication predicate (null and pending until its gates are met), and adds versioned `market_facts` (data only, on 0007's generator). PR-B is the gate-and-currency PR that publishes USD once the website and live Stripe evidence agree. **No new tool and no new resource.**
- **Observable.** "What does HelloGrowthCRM cost in the UAE and how do I pay?" returns `price_status: pending_verification` until the gates are met, then USD 12 per user per month or USD 120 per user per year upfront, and "paid via Stripe" throughout. "Do you support Tamara, Telr, WPS files, UAE Pass or FTA e-invoicing?" returns a roadmap line for Tamara and `withheld` entries for the rest, never a yes.
- **Risk.** A price served before the website and Stripe agree; a roadmap gateway read as live; unverified compliance quoted; Arabic or Dutch UI claims before review; an old SOC 2 period read as current assurance; residency, ISO 27001 or HIPAA language; WhatsApp-first or sales-only positioning.

## 0a. Necessary changes   (planned-file coverage)

**Dependency: 0007 PR-A** (generator, schema, `gates.json`, predicate, `ajv`, `country_get` keys).

**PR-A: withdrawals, price rewiring and UAE `market_facts`**
- [ ] `test-data/market-facts/2026-11-02/uae.json`, `SHA256SUMS`: UAE facts and `withheld`.
- [ ] `test-data/market-facts/2026-11-02/gates.json`: UAE uses the shared gates `website-deploy`, `stripe-flow1` (per market evidence rows, `market: "uae"`) and `soc2-scope`.
- [ ] `src/data/market-facts.ts`: regenerated, never hand-edited.
- [ ] `src/data/website-mirror.ts` (UAE rows only): `COUNTRY_PRICING` UAE `growthPriceShort`, `growthPriceMonthly` read from `getMarketPrice("uae", now)` (null while unmet), `pricingSummaryLine` becomes `Free Forever · Growth (price pending verification) · Enterprise (custom) · 14-day trial on paid plans`, `paymentMethods` becomes `Paid via Stripe`, `compliance` null with `compliance_status: "withheld_unverified"`; `COUNTRIES` UAE `compliance` null with the same status.
- [ ] `src/tools/countries.ts` and `src/tools/pricing.ts`: serve `price_status` and `compliance_status` for the UAE rows; no other change.
- [ ] `src/tools/output-schemas.ts`: the nullable fields for `country_get` and `pricing_get_country_plans`.
- [ ] Tests: `src/tools/__tests__/market-facts-uae.test.ts`; UAE cases in the generator and clock tests.

**PR-B: gates and billing currency** (blocked on the gates, §2a)
- [ ] `gates.json` UAE rows set to `met` by an approved diff; `src/data/website-mirror.ts` UAE `currencyCode`/`currencySymbol` of the price row to `USD`/`$`, additive `billing_currency`; `COUNTRIES` UAE `currency` unchanged.
- [ ] `src/tools/pricing.ts`: `MARKET_SCOPE.outside_india` drops the token "UAE (AED)" (0007 drops "the UK (GBP)"; one token each).
- [ ] Update `pricing-country-aware.test.ts`, `pricing-truth.test.ts`.

Client documentation: `README.md` gains a short section on market facts, the pending-price state, `withheld`, and (where applicable) additional-market discovery and the hub-only `countries_list.count`. Version and changelog: each BUILD bumps per `npm run check:versions` and adds a `CHANGELOG.md` line. **PR-C (market competitors in `alternatives_list`) is DEFERRED for this plan:** the route-status evidence it needs is not in the research export, and it does not repair an unsupported claim. It is recorded, not planned (§9).

## 0b. What we already know   (G4)

| Source | What it said | What this plan does about it |
|---|---|---|
| Research `plans-draft/SIX-UAE/website.md` §4 | 48 UAE pages flagged local-currency; `/uae/pricing` AED 37, `/crm-uae` AED 44/176/500 and US$12; wording USD 12 per user per month or USD 120 per user per year upfront; 10 pages WhatsApp-first; 45 pages lack hreflang alternates | Price rewired and corrected; positioning fact and test; page hreflang gaps are website issues |
| Research `claims/registry/_inbox/uae.csv` | 9 rows: VAT 5%, FTA e-invoicing and TRN, PDPL and residency, WPS, UAE Pass, local payments, Arabic and RTL all `unverified`; pricing `decided (founder)`; WhatsApp-first `needs-copy-fix` | Only pricing becomes a fact; unverified rows are topic-only `withheld` |
| Research `plans-draft/SIX-UAE/product.md` | Property Finder (#8223) and VAT regime (#9630) have hellocrm plans; Bayut, WPS, UAE Pass, clinic registries new or unverified; Telr and Tabby strings exist; Tamara not found; Arabic needs a human RTL check | Nothing asserted; Tamara is a roadmap fact (queued) |
| Research §7c, §7f; SOC 2 evidence note | MCP row and publication contract; Soor LLC, Precision Assurance CPA LLC, 2025-02-01 to 2025-06-30, five criteria, NDA, no ISO 27001, period about 16 months old | Adopted via 0007's contract; SOC 2 gated |
| PLAN-HELLOG-0005, 0006, 0003 | Category facts, claims tools, no tool growth (89 `defineTool(` calls on `main`) | No tool added |
| PLAN-HELLOG-0007 (#110) | Contract and generator; its Astra review rejected rev 1 for contradictory answers, unimplementable gates and a 23-to-57 mismatch | Applied from the start; this plan was reviewed once by Astra too (§14) |

## 1. Premise   (G8)

| Claim | Type | Evidence gathered | Running system? |
|---|---|---|---|
| UAE price is AED | wrong_fact | `COUNTRY_PRICING` UAE `growthPriceShort: "AED 37/user/mo"`, `growthPriceMonthly: "AED 48/user/mo"`; `COUNTRIES` UAE `currency: "AED"` | not required |
| Payment line lists unevidenced methods | unverified | UAE `paymentMethods: "Credit card, bank transfer, Stripe"` | not required |
| Compliance strings are unverified assertions | unverified | `UAE PDPL compliant`; `VAT, ESR and free-zone rules`; research `uae.csv` all `unverified` | not required |
| No tool serves the SOC 2 scope | missing_feature | `grep -rn "Precision Assurance" src` returns no hit | not required |
| Live Stripe matches USD 12 / 120 and the currencies and methods enabled for UAE buyers | external | Research §6a | **BLOCKED**: Stripe access (Rushabh) |
| Arabic UI/RTL | external | Human review at three widths | **BLOCKED**: Arabic reviewer |

The live server was not queried in this session. Every claim is about `main` and the research branches.

## 2. What changes

**Compatibility exception (named).** PR-A removes served UAE text of three kinds: the AED price (replaced by a pending state), unevidenced payment methods, and the two compliance strings. This is an exception to D-EXP-16 (additive only), authorised by the founder's rules of 2026-11-02 (compliance only as verified; tenant gateways never live; one USD price) and D-EXP-22. Nothing else is removed. New facts never ship while the old assertions remain. The removed text stays in git history.

`status` is `capability` for text that is true and published now, `roadmap` for a planned or queued item. A roadmap fact always has `is_capability: false` and a statement that starts "Planned, not available:". `claim_id_status` is `provisional` until the Claim Registry export assigns ids, then `registry`; a re-pin keeps old ids in `claim_id_aliases`. Fact fields: `fact_id, claim_id, claim_id_status, claim_id_aliases, scope_ref, kind, statement, applies_to, market, status, is_capability, evidence{type,ref,public_url}, verified_on, fact_version, supersedes, release_evidence_version, commit_id, publish_gates`. The `withheld` list uses a closed enum of topic identifiers and the fixed message "HelloGrowthCRM has not published a verified statement on this topic."; the conditional topics `soc2-report-period` and `price-pending` are members of the enum.

| fact_id | kind | status | Statement | Gates and evidence |
|---|---|---|---|---|
| uae.price.monthly | price | capability | Growth is USD 12 per user per month | website-deploy, stripe-flow1 |
| uae.price.annual | price | capability | Growth is USD 120 per user per year, charged once upfront | website-deploy, stripe-flow1 |
| uae.pay.hgc-subscription | payment | capability | HelloGrowthCRM subscriptions are paid via Stripe, the global subscription processor. Whether buyers in this market can purchase, and with which methods, is not confirmed here | none; evidence: D-EXP-41, flow 1 only; regional availability is the withheld topic `purchase-availability` |
| uae.pay.tamara | payment | roadmap | Planned, not available: Tamara buy-now-pay-later for tenants. It is queued and is not a way to pay HelloGrowthCRM | none; evidence: founder instruction 2026-11-02 |
| uae.market.hub | market | capability | The UAE hub is `/uae`, language en-AE. Hreflang values are those computed by the MCP's port of the website function (self en-AE); no Arabic alternate is asserted | none; evidence: `COUNTRIES` row, `getHreflangTags` port, observed 2026-11-02 |
| uae.security.soc2 | attestation | capability | A SOC 2 Type II examination of Soor LLC for 2025-02-01 to 2025-06-30 was completed by Precision Assurance CPA LLC (criteria: Security, Availability, Privacy, Confidentiality, Processing Integrity). The report is available under NDA on request | soc2-scope; expires_on |
| uae.positioning.suite | positioning | capability | HelloGrowthCRM is a full-stack business suite (pipeline, communication, commerce, operations, customers, marketing, intelligence); WhatsApp is one channel next to email, SMS, voice and live chat. | none; evidence: CLAUDE.md §1.1 product definition (founder, 2026-08-13) and the hellocrm `FEATURE_INVENTORY.md` |

Evidence for SMS, voice and live chat in the positioning fact is the hellocrm `FEATURE_INVENTORY.md` entries (cited by id in the data file) and the founder product definition; the PR records the grep it ran.

`withheld[]`: `purchase-availability`, `vat-rate`, `fta-e-invoicing`, `pdpl`, `wps-payroll-files`, `uae-pass-signing`, `local-payment-gateways` (Telr, Tabby, Network International and any tenant method; confirm in code before any statement), `arabic-ui`, `property-portal-integrations`, `clinic-registries`, and the conditional `soc2-report-period` and `price-pending`. There is no residency topic and no residency sentence. Smoke counts are conditional on gate state (§7b). `COUNTRIES` UAE `channels` keeps its order: a data field, not positioning.

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
2. **PR-B** is blocked on gates `website-deploy` and `stripe-flow1` (Stripe access not granted; no resolution date exists, which is why PR-A already withdraws the AED price rather than waiting).
3. **0003 G1–G5** blocks public deploy; release approver Rushabh; post-deploy smoke owner the PR author (`test-mcp.mjs` plus §7b); evidence of G1–G5 cited in each PR body.
4. Arabic and RTL: no MCP statement until the human review passes, then a data PR.

## 3. Affected files

| Area | Files | PR |
|---|---|---|
| Facts and gates | `test-data/market-facts/2026-11-02/{uae.json,gates.json,SHA256SUMS}`, `src/data/market-facts.ts` | A (gates edited in B) |
| Withdrawals and price rewiring | `src/data/website-mirror.ts` (UAE rows), `src/tools/countries.ts`, `src/tools/pricing.ts`, `src/tools/output-schemas.ts` | A |
| Currency and scope | `src/data/website-mirror.ts` (UAE price row currency), `src/tools/pricing.ts` (`MARKET_SCOPE`) | B |
| Tests | `market-facts-uae.test.ts`, pricing tests | A, B |
| Docs, release, fixtures | `README.md`, `CHANGELOG.md`, version strings, `test-data/fixtures/market-facts-uae-*.json` | A, B |

Not touched: `access.ts`, `index.ts`, `server.ts`, `server.json`, `smithery.yaml`, and the generator and predicate (0007 owns them).

## 5. Blast radius and caller inventory

`country_get`/`countries_list`/`pricing_get_country_plans`/`pricing_get_plans` as in the §7f matrix. Callers: `grep -rn "country_get\|countries_list\|pricing_get_country_plans\|COUNTRY_PRICING\|\.compliance" src` is run in PR-A and every hit listed, including generic FAQ and plan responses that mention the UAE (`pricing_get_faq`, `MARKET_SCOPE`). No change to tool count, names, descriptions, resources or llms.txt.

## 6. Acceptance criteria   (per PR; none weakened during implementation)

**PR-A**
- **AC-A1** Compatibility matrix (§7f) holds: only the listed keys and values differ from the `main` fixtures, per tool.
- **AC-A2** No response for the UAE contains any string from the P-list: `Telr`, `Tabby`, `Network International`, `bank transfer`, `Tamara`, `UAE PDPL compliant`, `ESR`, `AED`, `د.إ`; the only exceptions are the roadmap facts named in §2, whose statements start "Planned, not available:". Topic identifiers are checked against the enum, not against these patterns.
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
- **AC-B2** `MARKET_SCOPE.outside_india` no longer lists the UAE in AED; the other five local currencies are unchanged; `country.currency` stays `AED` (market metadata) and `billing_currency` is `USD`.
- **AC-B3** `release_evidence_version` agrees across the data file, `gates.json` and the PR body's cited commit ids.
- **AC-B4** The PR body contains the website build id, the affected-route coverage report, the measured cache behaviour and kill-switch time, and the rollback target; `CODEOWNERS` review by the approver is shown.

## 7b. Smoke test   (expected only; the BUILD PR records observed results)

| # | Call | Expected |
|---|---|---|
| 1 | `country_get({"code":"uae"})` after PR-A | facts: Stripe payment, Tamara roadmap, hub, positioning (4); price facts absent and `price_status: pending_verification`; SOC 2 absent; `withheld` has 10 base topics plus `price-pending` and `soc2-report-period`; compliance null |
| 2 | `pricing_get_country_plans({"country":"uae"})` after PR-A | `Paid via Stripe`; growth prices null and pending; compliance withheld |
| 3 | same after PR-B with both gates met | USD 12 per user per month, USD 120 per user per year upfront, `billing_currency: "USD"`; `price-pending` topic gone (6 facts) |
| 4 | `country_get({"code":"uae"})` with a clock past `expires_on` | SOC 2 absent, `soc2-report-period` present |
| 5 | pattern scan of every response above | no AC-A2 or AC-A3 match |

## 7e. Competitors

Competitor MCP servers were not read this session; the research table keeps those cells as `?`. Competitor prices are not served (research rule R9).

## 7f. Compatibility test: per-tool, per-PR contract matrix

Fixtures captured at the dependency commit recorded under AC-A11 (not from today's `main`): `country_get` (all codes), `countries_list`, `pricing_get_country_plans`, `pricing_get_faq`, `pricing_get_plans`, `tools/list`.

| Tool | PR-A change | PR-B change |
|---|---|---|
| `country_get` uae | + `market_facts`; `country.compliance` null; + `country.compliance_status`; `pricing_summary` growth price fields null, + `price_status`; `paymentMethods` `Paid via Stripe` | `pricing_summary` price fields USD; + `billing_currency`; `country.currency` unchanged |
| `country_get` other codes | none beyond 0007's keys | none |
| `countries_list` | none beyond 0007's keys | none |
| `pricing_get_country_plans` uae | growth price fields null + `price_status`; `pricingSummaryLine` as §0a; `paymentMethods`; `compliance` null + `compliance_status` | `currencyCode` `USD`, price strings, `billing_currency` |
| `pricing_get_country_plans` other | none | none |
| `pricing_get_plans` | none | `MARKET_SCOPE.outside_india` loses "UAE (AED)" |
| `pricing_get_faq` | none | none |

Every other tool is byte-identical. A field changing from a string to `null` (compliance, price) is a visible change; it is listed in the matrix, the README and the CHANGELOG. The SDK client round trip stands in for external clients; it does not prove that consumers which only enumerate `countries` or assume a fixed country list tolerate the additions, so the README and CHANGELOG document them.

## 8. Risks and edge cases

| Risk | Mitigation |
|---|---|
| Known wrong AED price served while evidence is blocked | Withdrawn in PR-A (pending state) |
| Live Stripe does not enable UAE currency or methods, or checkout adds tax | `stripe-flow1` gate with checkout tests, eligibility and renewal evidence; fail closed |
| Expiry or revocation not honoured after deploy | One predicate on every path, evaluated per request; AC-A9 |
| Tenant gateways read as live | Roadmap-only Tamara; everything else withheld |
| Arabic claims | None until the human RTL review |
| Residency language | None written; AC-A3 |
| `country.currency` consumers | Unchanged (AED); billing currency is a separate field |

## 9. What this deliberately does NOT do

No new tool, resource or llms.txt section. No tenant-gateway capability: every local gateway is roadmap or absent, and nothing says subscriptions are paid through one. No tax-rate, data-protection, e-invoicing, accounting-integration or language-UI claim, no data-residency sentence, no ISO 27001 or HIPAA claim. No competitor prices. No removal of existing text beyond the named withdrawals and the price correction. No edit to hellocrmwebsite or hellocrm.

Deferred, with the reason: market competitors in `alternatives_list` (PR-C of 0007) for this plan's markets. The 24 UAE vendors with an `en-AE` page in research (`vendors.csv`: 57 rows) stay research data; page decisions are CREATE 0, EXPAND 0, HOLD 43, SKIP 14.

## 10. Decisions owed

- **F1** closed: topic-only `withheld` entries are served. **F2** closed: unsupported UAE text is withdrawn (founder may veto). **F4** closed: the AED price is withdrawn in PR-A.
- **F3 (open)** Is a SOC 2 examination after 2025-06-30 under way? Confirm the expiry policy (proposed `expires_on` 2026-12-31) and the approved public wording. Until closed the SOC 2 fact stays unpublished.
- **F5 (open)** Are Telr and Tabby tenant gateways in code? Confirm before any statement.

## 11. Findings outside this plan   (D-EXP-14: recorded, not fixed here)

- `src/data/website-mirror.ts` USA row `compliance: "SOC 2, HIPAA and IRS filings"` asserts HIPAA (`grep -n HIPAA src/data/website-mirror.ts`).
- `src/tools/alternatives.ts` describes HelloGrowthCRM as WhatsApp-first in two places and as "Sales-first" in three (`grep -n "WhatsApp-first\|Sales-first" src/tools/alternatives.ts`). These sit in `alternatives_get` and `switch_get_guide` text for named competitors, not in the responses this plan changes. Each needs its own MCP plan.
- The mirror comment calls SOC 2 "certified"; it is an attestation.

## 12. Estimated token cost

Estimate, not a quote; input tokens at $3/M; reuses 0007's generator, predicate and tests.

| PR | Low | Expected | High |
|---|---|---|---|
| PR-A (data, withdrawals, price rewiring, UAE tests) | 0.5M | 0.7M | 1.0M |
| PR-B (gates, currency, scope token, tests) | 0.3M | 0.4M | 0.65M |
| **Total (reuse)** | **0.8M** | **1.1M** (about $3) | **1.65M** |

If 0007 does not merge first this plan waits; it does not rebuild the generator (about 0.6M). This plan PR: about 0.3M.

## 13. Validation (this plan PR)

- **PASS**: plan id 0008 free after 0007 (#110); no remote `plan/hellog-0008*`.
- **PASS**: `main` @ `5190a02`: UAE price `AED 37`/`AED 48`; `paymentMethods` `Credit card, bank transfer, Stripe`; compliance `UAE PDPL compliant` and `VAT, ESR and free-zone rules`.
- **PASS**: research UAE `vendors.csv` 57 rows, 24 with `en-AE` (not served here).
- **UNVERIFIABLE**: live server; competitor MCP inventories; UAE government hosts.
- **BLOCKED**: Stripe flow-1 bundle (Rushabh); Arabic human review.
- **PASS**: one Astra blind review run (§14).

## 14. Review record

Astra, blind, role plan, 2026-11-02: **reject** on rev 1 (five blockers). Each finding was checked against the plan and the repo before it changed anything.

| # | Finding | Verdict | Change |
|---|---|---|---|
| 1 | PR-A preserved the known wrong AED price | Accepted. True | The price is withdrawn from every response path in PR-A (pending state); decision F4 closed |
| 2 | Gates enforced at build time only; mirror price literals bypass them; expiry after deploy unhandled | Accepted | One `isPublished` predicate on every path, evaluated per request; price read through `getMarketPrice`; revocation is revert plus redeploy; AC-A9 tests expiry without rebuild |
| 3 | Contract delegated to another draft; bootstrap and PR-C order contradictory | Accepted | Single order: 0007 PR-A merged first, pinned by commit and `market_facts_contract: 1`; no bootstrap path; PR-C deferred |
| 4 | `soc2-report-period` missing from the closed enum; smoke counts fixed | Accepted | Enum now includes `soc2-report-period` and `price-pending`; smoke counts conditional; SOC 2 unpublished until F3 closes |
| 5 | Compatibility rules contradicted the changes | Accepted | Per-tool, per-PR matrix in §7f; nullable and status fields in the schemas |

Risks and missing items taken: skew and cache (measured value, rollback authority), tax and eligibility evidence (not copy suppression), existing-subscriber scope (`applies_to`), billing currency separate from `country.currency`, redaction check, regeneration preserves other markets (AC-A6), evidence for positive claims, release verification, closed decisions. Not taken: nothing was rejected. The review ran once; rev 2 was not re-reviewed.

Shared-contract updates taken from the Astra review of PLAN-HELLOG-0009 (same contract, no second review of this plan): lifecycle (all facts generated, absence is a served-response property, PR-B regenerates data), the wire contract and fixtures (§2c), the release invariant and kill switch, enforced approval, evidence boundary and freshness, the global-ladder note, the public price qualifier, baselines taken after 0007 PR-A merges, exact-boundary tests, and positive-only positioning wording.

Shared-contract updates taken from the Astra review of PLAN-HELLOG-0010 (same contract, no second review of this plan): mandatory gates by kind, market-qualified gate identity, kill-switch restart semantics and drill, `no-store` through the HTTP path, Stripe fact scoped to the global processor with `purchase-availability`, generation and runtime tests split, baseline at the dependency commit, conformance run, composition test, expiry warning, README and fixtures in the inventory.

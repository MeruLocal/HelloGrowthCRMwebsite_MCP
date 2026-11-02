# Plan — MCP: United Kingdom country facts (pricing, markets, payments, security attestation, market competitors)

- **Revision:** 2 (2026-11-02), Astra blind review folded (§14). Rev 1 was the draft.
- **Plan id:** PLAN-HELLOG-0007, allocated 2026-11-02 with `plan-id.mjs next` (remote `plan/` branches) and confirmed against the REST PR list: the highest plan title is PLAN-HELLOG-0006 (#109). The adapter's `git fetch origin master` and GraphQL reads failed (trunk here is `main`; GraphQL is blocked), so the REST list is the check of record. Re-run `plan-id.mjs check` after the branch is pushed.
- **Branch:** `plan/hellog-0007-mcp-uk-country-facts` · **Repo:** MeruLocal/HelloGrowthCRMwebsite_MCP · **Trunk:** `main` (head `5190a02`)
- **Mode:** PLAN (plan only, no code in this PR). Each BUILD below is its own PR carrying `Implements: PLAN-HELLOG-0007 (PR-x)`.
- **Change tags:** `public_api` (additive keys on existing tools, one added input, three named withdrawals), `product` (what the server says about UK pricing, payments, security and competitors)
- **Tier:** T2. Owed: acceptance_criteria, blast_radius, caller_inventory, compatibility_test, competitor_scan, intent, necessary_changes, planned_file_coverage, premise_check, smoke_test
- **Restricted areas touched:** none. No auth, billing, migration, secret or email-send file. `src/tools/access.ts` is not touched. The server states prices; it does not bill.
- **Freeze in force?** Yes, inherited from PLAN-HELLOG-0003 (#102): no public deploy of a new anonymous surface before the G1–G5 release gate. This plan adds no tool and no resource, but obeys the gate for every BUILD.
- **Origin:** founder standard D-EXP-14 (2026-11-02): every finding gets an MCP plan PR when MCP coverage, naming, descriptions, schemas or discovery change. Research: MeruLocal/Hellogrowthcrm-Researchsuite#94 (branch `claude/six-market-uk`); publication contract in `research-methodology/six-market-plan-2026-11-02.md` §7c and §7f.
- **Research evidence:** MeruLocal/Hellogrowthcrm-Researchsuite#94
- **Opportunity ID:** OPP-SIX-UK-001
- **Date:** 2026-11-02

## 0. Intent

- **Claim.** The MCP server answers UK questions from a hand-kept mirror that contradicts the founder's decisions and the research. Verified on `main` (`src/data/website-mirror.ts`, `src/tools/pricing.ts`):
  1. `pricing_get_country_plans` and `country_get` serve the UK Growth plan as `£8/user/mo` (annual) and `£10/user/mo` (monthly). Founder decisions D-EXP-40, D-EXP-44 and D-EXP-45 set one price outside India: **USD 12 per user per month, or USD 120 per user per year charged once upfront, with no tax line.**
  2. The UK `paymentMethods` row says `Credit/debit card, Stripe, GoCardless, bank transfer` and `pricing_get_faq` says `UK: card, Stripe, GoCardless, bank transfer`. GoCardless is **roadmap only** (PLAN-HGC-0723), never live. Subscriptions to HelloGrowthCRM are paid via Stripe (research flow 1).
  3. The UK `compliance` row says `UK GDPR compliant, ICO-registered data processor` and the UK `COUNTRIES` row says `GDPR, HMRC and FCA rules`. The research registry holds every UK compliance topic as `unverified` (the government and regulator hosts were unreachable from the research session). The founder rule is that compliance is stated only as verified.
  4. There is **no market dimension on competitors.** `alternatives_list` serves 23 mostly India-centred routes. The research found 57 vendors behind a live page that serves `en-GB` (UK `vendors.csv`: 164 rows) that the server never mentions.
  5. SOC 2 appears only in a code comment of the mirror's `COMPANY` row ("SOC 2 certified under this name"). No tool serves the attestation scope, and "certified" is the wrong word for an attestation.
- **Mechanism.** (a) PR-A **withdraws** the three unsupported strings from UK responses (GoCardless and unverified methods, both compliance strings) and adds `market_facts` to the existing `country_get`: versioned facts in the research §7f schema, built at generation time from a sha256-pinned snapshot, plus a `withheld` list. (b) PR-B moves the UK price to the founder's value, behind an AND-gate evidence manifest that fails closed. (c) PR-C adds an optional `market` input to the existing `alternatives_list`, backed by a separate, route-verified market dataset. **No new tool and no new resource.**
- **Observable.** Asked "What does HelloGrowthCRM cost in the UK, how do I pay, and is it SOC 2?" an assistant gets USD 12 per user per month or USD 120 per user per year upfront, "subscriptions are paid via Stripe", and a historical SOC 2 Type II attestation with entity, auditor and period. Asked about GoCardless it gets "planned, not available". Asked about PECR, UK GDPR or Making Tax Digital it gets a `withheld` entry that says no verified statement is published, and no response anywhere contradicts that.
- **Risk.** Serving a price before the website and Stripe agree; a roadmap method read as live; unverified compliance still quotable; an old SOC 2 period read as current assurance; ISO 27001 or HIPAA or data-residency language; WhatsApp-first positioning; response growth in the competitors tool. Mitigations in §8.

## 0a. Necessary changes   (planned-file coverage)

**PR-A: withdrawals plus UK `market_facts`** (no price edit; buildable now). This PR owns the multi-market generator that PLAN-HELLOG-0008 reuses.
- [ ] `test-data/market-facts/2026-11-02/uk.json`: pinned UK fact list and `withheld` list (§2). `test-data/market-facts/2026-11-02/SHA256SUMS`. A refresh is a human PR that changes the sha.
- [ ] `test-data/market-facts/2026-11-02/gates.json`: the AND-gate evidence manifest (§2b). Reference ids, hashes and dates only; no raw Stripe or checkout data, no NDA report content.
- [ ] `scripts/market-facts.schema.json`: the one schema every market file validates against.
- [ ] `scripts/build-market-facts.mjs`: **multi-market**: it discovers every `test-data/market-facts/<as_of>/<cc>.json` file, validates it against the schema, evaluates gates, and writes `src/data/market-facts.ts`. It is deterministic (sorted keys and ids; no clock except the declared `--now` for expiry). `--check` fails if the generated file differs. Adding a market (UAE) is data only.
- [ ] `src/data/market-facts.ts`: generated; header carries source sha256 and `as_of`. Never hand-edited.
- [ ] `src/tools/countries.ts`: `country_get` adds `market_facts` (or null) and `market_facts_reason`; `countries_list` rows add `market_facts_available`. For `uk`, the served `country.compliance` is replaced by `null` with `country.compliance_status: "withheld_unverified"`.
- [ ] `src/data/website-mirror.ts` (UK rows only): `COUNTRIES` UK `compliance` and `COUNTRY_PRICING` UK `compliance` set to `null`, `compliance_status: "withheld_unverified"`; UK `paymentMethods` set to `"Paid via Stripe"`.
- [ ] `src/tools/pricing.ts`: the UK clause of the `pricing_get_faq` payment answer becomes `UK: paid via Stripe`.
- [ ] `src/tools/output-schemas.ts`: schemas for every output contract PR-A changes: `country_get` (`market_facts` nullable object; sibling top-level `market_facts_reason`; `country.compliance_status`), `countries_list` (row `market_facts_available`), `pricing_get_country_plans` (row `compliance_status`).
- [ ] `package.json`: `check:market-facts` (generator `--check`), added to `verify`; `ajv` as a devDependency for the output-schema round-trip tests (none exists today).
- [ ] Tests: `src/tools/__tests__/market-facts-uk.test.ts`, `src/data/__tests__/market-facts-schema.test.ts`, `src/data/__tests__/market-facts-generator.test.ts` (negative cases, §6), `src/tools/__tests__/market-facts-client.test.ts` (SDK client round trip).

**PR-B: UK price** (non-additive, founder D-EXP-40; **blocked on the website and on the evidence manifest**, §2a)
- [ ] `src/data/website-mirror.ts` UK `COUNTRY_PRICING`: `growthPriceShort`, `growthPriceMonthly`, `pricingSummaryLine`, `currencyCode`, `currencySymbol`; `COUNTRIES` UK `currency`, `currencySymbol`. Note `country_get` reads both, so `country.currency` and `pricing_summary` change with it.
- [ ] `src/tools/pricing.ts`: `MARKET_SCOPE.outside_india` drops the token "the UK (GBP)" (the UAE plan drops "UAE (AED)" in its own PR; a one-token edit each, no shared line rewrite).
- [ ] `test-data/market-facts/2026-11-02/uk.json` and `gates.json`: price facts' gates set to the recorded evidence (a human-approved diff).
- [ ] Update `pricing-country-aware.test.ts`, `pricing-truth.test.ts`; add the PR-B criteria in §6.

**PR-C: market competitors** (after PR-A; deferrable without affecting A or B)
- [ ] `scripts/build-market-competitors.mjs` (a separate script, not the facts generator): reads `test-data/market-facts/2026-11-02/uk-market-competitors.json`, derived from the research inventory and `vendors.csv`, and writes `src/data/market-competitors.ts`.
- [ ] `src/tools/alternatives.ts`: `alternatives_list` gains optional `market`, `limit`, `offset` (§2).
- [ ] `src/tools/output-schemas.ts`: schema for the market form of the response.
- [ ] `src/tools/__tests__/alternatives-market.test.ts`.

Version and changelog: each BUILD bumps per `npm run check:versions` and adds a `CHANGELOG.md` line. Not planned: a new tool, a new resource, a new llms.txt section.

## 0b. What we already know   (G4)

| Source | What it said | What this plan does about it |
|---|---|---|
| Research `plans-draft/SIX-UK/website.md` §4 | 10 UK pages show a GBP HGC price; proposed wording USD 12 per user per month or USD 120 per user per year upfront, no tax line; payments to HGC go through Stripe, tenant gateways are a separate flow | PR-B mirrors that wording once the website PR lands |
| Research `claims/registry/_inbox/uk.csv` | Seven rows: six `unverified` (VAT 20%, PECR, UK GDPR and residency, MTD VAT, Companies House, accounting and payments), one `decided (founder)` (pricing display) | Only the decided row becomes a price fact. Unverified rows are never asserted; they appear as topic-only `withheld` entries (no residency topic: §2) |
| Research `plans-draft/SIX-UK/product.md` | GoCardless covered by an open hellocrm plan (the draft cites #10109); Xero edge functions exist; no MTD or Companies House code; PECR strings in 23 files (presence is not compliance) | GoCardless is a `roadmap` fact with `is_capability: false`; the rest is withheld |
| Research six-market plan §7c, §7f | MCP row and publication contract: fact schema, versioned facts, roadmap serialised non-capability, drift check, shared release evidence version, all facts public, register claims never published | §2 adopts the schema; §2b is the drift and release check |
| Research `claims/evidence/soc2-type-ii-2026-11-02.md` | Soor LLC; Precision Assurance CPA LLC; 2025-02-01 to 2025-06-30; five criteria; NDA; no ISO 27001; the period is about 16 months old; open founder question on renewal | Historical attestation fact behind a scope gate and an expiry date (§2b, F3) |
| PLAN-HELLOG-0005 (#108) | Category facts as a resource plus a search kind; no category tools | UK facts reference category ids from 0005 records; they do not restate them |
| PLAN-HELLOG-0006 (#109) | `claims_list`/`claims_get`; additive only; status never raised | Each fact has `claim_id` with a resolution status (§2); `claims_get` is optional, not required |
| PLAN-HELLOG-0003 (#102) | Tool selection degrades past about 30–50 tools; the server has 89 `defineTool(` calls on `main` | No tool added (§9) |
| `main`, 2026-11-02 | `COUNTRIES` and `COUNTRY_PRICING` are hand-maintained and outside the auto-sync (`scripts/sync-website-mirror.mjs`); `check:mirror` cannot catch the UK price | PR-A and PR-B add their own checks |

## 1. Premise   (G8)

| Claim | Type | Evidence gathered | Running system? |
|---|---|---|---|
| UK price is GBP in the MCP | wrong_fact | `src/data/website-mirror.ts` UK `COUNTRY_PRICING`: `growthPriceShort: "£8/user/mo"`, `growthPriceMonthly: "£10/user/mo monthly"`; `COUNTRIES` UK `currency: "GBP"` | not required |
| GoCardless is served as an accepted payment | wrong_fact | UK `paymentMethods` and the `pricing_get_faq` string in `src/tools/pricing.ts` | not required |
| UK compliance strings are unverified assertions | unverified | UK `compliance` rows above; research `uk.csv` all `unverified`, quality 0 | not required |
| No tool serves the SOC 2 scope | missing_feature | `grep -rn "Precision Assurance\|Type II" src` on `main` returns no hit | not required |
| `alternatives_list` has no market filter | missing_feature | `alternativesList` input is `search` only; `ALTERNATIVE_PAGES` has no `/uk/` route | not required |
| The global Growth plan already says USD 12 monthly | context | `src/tools/pricing.ts`: `price_monthly: "$12/user/month"`, `price_annual: "$10/user/month (billed annually)"`; the annual line is a monthly equivalent, not the USD 120 upfront statement | not required |
| Live Stripe prices and checkout match USD 12 / USD 120 | external | Research §6a bundle | **BLOCKED**: read-only Stripe access (owner: Rushabh) |

The live server was not queried. Every claim is about `main` and the research branch.

## 2. What changes

Smallest shippable version: **PR-A**. It withdraws the unsupported strings and adds facts; no price moves.

**Compatibility exception (named, per the review).** PR-A removes three kinds of served text from UK responses: GoCardless and unverified payment methods, the UK compliance strings in both mirror rows. This is an exception to D-EXP-16 (additive only), authorised by the founder instruction of 2026-11-02 that tenant gateways are never stated as live and compliance is stated only as verified, and by D-EXP-22 (truth). The removed text stays in git history. Nothing else is removed. PR-A is not allowed to ship the new facts while the old assertions remain, so an assistant can never quote two answers.

**Fact record** (`market_facts.facts[]`; the research §7f fields plus `kind`, `claim_id_status`, `publish_gates`):

```json
{
  "fact_id": "uk.pay.hgc-subscription",
  "claim_id": "SIX-UK-PAY-001",
  "claim_id_status": "provisional",
  "claim_id_aliases": [],
  "scope_ref": "flow-1-platform-subscriptions",
  "kind": "payment",
  "statement": "HelloGrowthCRM subscriptions are paid via Stripe.",
  "market": "uk",
  "status": "capability",
  "is_capability": true,
  "evidence": { "type": "founder_decision", "ref": "D-EXP-41", "public_url": null },
  "verified_on": "2026-11-02",
  "fact_version": 1,
  "supersedes": null,
  "release_evidence_version": "2026-11-02.1",
  "commit_id": "<research commit sha at pin time>",
  "publish_gates": []
}
```

`status` is `capability` for text that is true and published now, `roadmap` for a planned item (always `is_capability: false` and a statement starting "Planned, not available:"). `claim_id_status` is `provisional` until the Claim Registry export assigns final ids, then `registry`; a re-pin keeps the old id in `claim_id_aliases` so a cached reference still resolves. `publish_gates` lists gate ids that must all be satisfied in `gates.json`.

| fact_id | kind | status | Statement | Gates |
|---|---|---|---|---|
| uk.price.monthly | price | capability | Growth is USD 12 per user per month | website-deploy, stripe-flow1 |
| uk.price.annual | price | capability | Growth is USD 120 per user per year, charged once upfront | website-deploy, stripe-flow1 |
| uk.pay.hgc-subscription | payment | capability | HelloGrowthCRM subscriptions are paid via Stripe | none (D-EXP-41, flow 1 only; no method list) |
| uk.pay.gocardless | payment | roadmap | Planned, not available: GoCardless direct-debit collection (PLAN-HGC-0723). It is not a way to pay HelloGrowthCRM and it is not live | none |
| uk.market.hub | market | capability | The UK hub is `/uk`, language en-GB; hreflang is whatever `getHreflangTags` computes (self en-GB); no alternate is asserted for a page the website does not emit | none |
| uk.security.soc2 | attestation | capability | A SOC 2 Type II examination of Soor LLC for 2025-02-01 to 2025-06-30 was completed by Precision Assurance CPA LLC (criteria: Security, Availability, Privacy, Confidentiality, Processing Integrity). The report is available under NDA on request | soc2-scope, expires_on |
| uk.positioning.suite | positioning | capability | HelloGrowthCRM is a full-stack business suite (pipeline, communication, commerce, operations, marketing); WhatsApp is one channel next to email, SMS, voice and live chat | none |

Price statements carry no tax wording; the "no tax line" decision is enforced by a test (AC-06), not by a sentence. The SOC 2 statement is historical by construction ("was completed"); it does not say HelloGrowthCRM is currently certified, and the word "certified" is banned.

**`withheld[]`** (topic identifiers from a closed enum, not prose): `vat-rate`, `making-tax-digital`, `pecr-consent`, `uk-gdpr`, `companies-house`, `uk-accounting-integrations`. Each is `{ topic, message: "HelloGrowthCRM has not published a verified statement on this topic." }`. There is no hosting-location or residency topic: the plan says nothing on residency, so an assistant has no residency entry to quote.

`country_get("uk")`, new keys only (every existing key stays, except the withdrawn UK compliance value):

```json
{
  "country": { "compliance": null, "compliance_status": "withheld_unverified" },
  "market_facts": {
    "market": "uk", "as_of": "2026-11-02", "fact_set_version": 1,
    "release_evidence_version": "2026-11-02.1",
    "source": { "file": "test-data/market-facts/2026-11-02/uk.json", "sha256": "<hex>" },
    "facts": [ { "fact_id": "uk.pay.gocardless", "status": "roadmap", "is_capability": false } ],
    "withheld": [ { "topic": "pecr-consent", "message": "HelloGrowthCRM has not published a verified statement on this topic." } ]
  }
}
```

For markets without a snapshot: `market_facts: null`, top-level `market_facts_reason: "no_snapshot_for_market"`.

### 2b. Release evidence: the AND-gate manifest and the drift check

`gates.json` is the one trusted source for gates. Each gate is an object `{ gate_id, status: "met"|"unmet", evidence_ref, evidence_sha256, observed_on, approver, expires_on }`. Rules: a fact is generated only if **all** its `publish_gates` are `met` and unexpired; a missing, unknown or expired gate means the fact is absent and the generator logs `GATED: <fact_id> <gate_id>` (fail closed). Nobody satisfies a gate by editing the fact; only a PR that changes `gates.json` with the approver's name can.

| gate_id | What `met` requires | Approver |
|---|---|---|
| website-deploy | The hellocrmwebsite D-EXP-40 correction is deployed: build id observed in the fetched `/uk/pricing` page, the fetch time, and a re-scan result showing no HGC price other than USD 12 per user per month or USD 120 per user per year upfront | Rushabh |
| stripe-flow1 | Live-mode evidence (not test mode): account identity, paginated active Price objects (currency, interval, unit amount), payment-method settings, and checkout tests for one seat and several seats, monthly and annual, recording currency, quantity, recurrence, upfront total, **tax behaviour** and renewal amount, reconciled with the advertised prices. "No tax line" is a display decision; tax behaviour is evidence of what checkout does. Raw exports stay in the restricted evidence store; the manifest holds the reference id, sha256, date and redaction note | Rushabh |
| soc2-scope | An authorised reading of the report confirms the examined system boundary and how it maps to HelloGrowthCRM services, and the public wording is approved. Report contents are never copied | Rushabh |

`uk.security.soc2` also carries `expires_on` (proposed 2026-12-31, decision F3). The generator fails `check:market-facts` after that date, and the handler withholds the fact at request time once `Date.now()` passes it, replacing it with a `withheld` topic `soc2-report-period`. Owner: Rushabh renews the manifest; an overdue fact fails closed, it does not stay served.

Drift check (AC-07): at build, every fact's `release_evidence_version` must equal the manifest's; at PR time the PR body lists the website build id and the commit ids of the website, product and MCP sources, and CI fails on a mismatch. The generation is build-time only; the request path performs no Stripe, Supabase or network lookup.

**Rollout skew.** The website deploys first, then PR-B, then the MCP deploy. Maximum permitted skew is 48 hours between the website serving USD and the MCP serving USD; if the website is rolled back, PR-B is reverted in the same window (rollback owner: the PR author, approver Rushabh). The release evidence version is returned in `/version` and in `market_facts`, so a cached copy is identifiable; the cache refresh and registry steps are those in `RELEASING.md` ("Deployment is separate from publishing"). A post-release cross-surface check (website, product, MCP) is run after the deploy and after any rollback.

### 2c. `alternatives_list` with `market` (PR-C)

The existing 23 rows are competitor **pages**, so filtering them cannot produce 57 vendors. PR-C therefore adds a separate, generated **market dataset**: `{ vendor_id (the research slug, canonical, lower-case), name, category, routes: [{ route, kind: "compare"|"alternative" }], hreflang, as_of }`. Rules:
- Only vendors with a live page that serves `en-GB` are included (57 of 164 rows today). A route is kept only if the research inventory records it as HTTP 200, indexable, self-canonical and emitting `en-GB`; any other route is dropped and counted in `market_coverage.routes_dropped`. If the inventory lacks those columns, PR-C is blocked until the research export carries them.
- Vendors are de-duplicated on `vendor_id`; a row missing `name` or `category` fails the build.
- Input: `market` (a string, validated in the handler so an unknown value reaches the custom `fail` that lists supported markets; no schema enum), `search` (case-insensitive substring over name, vendor_id, category), `limit` (default 25, maximum 60), `offset`.
- Output with `market`: `{ market, market_coverage: { vendors_with_live_page: 57, matched: <n after search>, returned: <n in this page>, next_offset|null, routes_dropped, source_sha256, as_of }, alternatives: [...] }`. Coverage is the market total and is not a result count. Without `market`, the response is byte-identical to today.
- Vendors the research found that have no live page (FibreCRM, Dotdigital, IRIS KashFlow, FreeAgent and others) are research rows with decision HOLD or SKIP; they are **not** served, and no page or comparison is invented.

**WhatsApp.** No generated string says "WhatsApp-first" (AC-09).

### 2a. Dependency order

1. **PR-A** has no external dependency. It owns the generator; PLAN-HELLOG-0008 adds `uae.json` and does not change the generator. If 0008's PR-A merges first, it ships the generator from the same §0a contract and this PR-A adds `uk.json` only.
2. **PR-B** is blocked on gates `website-deploy` and `stripe-flow1`, both **BLOCKED** today (Stripe access not granted). Until then the price facts are absent and the existing GBP price is a known, recorded defect (F4 asks whether to hide it meanwhile).
3. **PR-C** after PR-A, and on the research inventory export (965 pages, route status columns).
4. **0006 PR-A** is not required; if it lands, `claims_get` can resolve `claim_id`.
5. **0003 G1–G5** blocks public deploy of every PR here. Release approver: Rushabh. Post-deploy smoke owner: the PR author, using `test-mcp.mjs` and the §7b table. Evidence of G1–G5 is cited in each PR body; absent evidence blocks deploy.

## 3. Affected files

| Area | Files | PR |
|---|---|---|
| Facts and gates | `test-data/market-facts/2026-11-02/{uk.json,gates.json,SHA256SUMS}`, `scripts/{market-facts.schema.json,build-market-facts.mjs}`, `src/data/market-facts.ts`, `package.json` | A (gates edited in B) |
| Country tools and mirror (withdrawals) | `src/tools/countries.ts`, `src/data/website-mirror.ts` (UK rows), `src/tools/pricing.ts` (FAQ clause), `src/tools/output-schemas.ts` | A |
| Price | `src/data/website-mirror.ts` (UK price and currency), `src/tools/pricing.ts` (`MARKET_SCOPE`) | B |
| Market competitors | `scripts/build-market-competitors.mjs`, `src/data/market-competitors.ts`, `src/tools/alternatives.ts`, `src/tools/output-schemas.ts` | C |
| Tests | see §0a | A, B, C |
| Release | `CHANGELOG.md`, version strings | A, B, C |

Not touched: `src/tools/access.ts`, `src/tools/index.ts`, `src/server.ts`, `server.json`, `smithery.yaml`.

## 5. Blast radius and caller inventory

- `country_get`, `countries_list`: additive keys, plus the UK `compliance` value becoming `null`. Callers: MCP clients and `mirror-tools-*.test.ts`; PR-A runs `grep -rn "country_get\|countries_list\|\.compliance" src` and lists every hit. External consumers cannot be grepped, so §7f adds an SDK-client round trip.
- `pricing_get_country_plans`, `pricing_get_faq`: PR-A changes the UK `paymentMethods`/`compliance` and one FAQ clause; PR-B changes the UK price and currency, which also flow into `country_get.country.currency`, `country_get.pricing_summary` and `MARKET_SCOPE` in `pricing_get_plans`. All are enumerated in the PR-B fixture diff.
- `alternatives_list`: new optional inputs; unchanged without them.
- No change to tool names, tool descriptions, the tool count, resources or llms.txt.

## 6. Acceptance criteria   (per PR; none may be weakened during implementation)

**PR-A**
- **AC-A1** `country_get({code:"uk"})` equals the `main` fixture except: `market_facts`, `market_facts_reason` absent for uk, `country.compliance` is `null`, `country.compliance_status` is `"withheld_unverified"`. All other codes equal their fixtures plus `market_facts: null` and `market_facts_reason`.
- **AC-A2** No UK response (any tool, any key) contains the strings `GoCardless` except `uk.pay.gocardless`, whose statement starts "Planned, not available:". The UK payment line is `Paid via Stripe`.
- **AC-A3** No UK response contains `UK GDPR compliant`, `ICO-registered`, `HMRC and FCA`. `withheld[]` topics come from the closed enum and appear only as `topic` identifiers plus the fixed message.
- **AC-A4** Prose fields (`statement`, `message`) match none of `/residen/i`, `/ISO ?27001/i`, `/HIPAA/i`, `/WhatsApp-first/i`, `/PECR[- ]ready/i`, `/certified/i`. Topic identifiers are checked against the enum, not the prose patterns.
- **AC-A5** Every fact validates against `scripts/market-facts.schema.json`; every `roadmap` fact has `is_capability: false`; `uk.pay.gocardless` is the only roadmap fact.
- **AC-A6** `uk.positioning.suite` lists WhatsApp as one channel among others.
- **AC-A7** Generator negative tests: hash mismatch, duplicate `fact_id`, unknown `status`, unknown gate id, unmet or expired gate (fact absent plus `GATED` log), roadmap with `is_capability: true`, missing `verified_on` or `release_evidence_version`, a banned phrase, and non-deterministic output (two runs byte-identical).
- **AC-A8** Output contracts: the serialized result of `country_get`, `countries_list` and `pricing_get_country_plans` validates against its `outputSchema` (ajv), for uk, a non-uk code, and the unknown-code failure path.
- **AC-A9** An SDK client round trip (initialize, `tools/list`, call `country_get`) succeeds and `structuredContent` parses; `tools/list` length equals the `main` count (no tool added); `annotations.test.ts` and `registry.test.ts` pass.
- **AC-A10** SOC 2: with `soc2-scope` unmet, or `Date.now()` past `expires_on` (test with an injected clock), the fact is absent and the `soc2-report-period` topic is present.

**PR-B**
- **AC-B1** No UK price string contains `£`, `GBP` or a tax word; `pricing_get_country_plans({country:"uk"})` and `country_get` show USD 12 per user per month and USD 120 per user per year upfront; `country.currency` is `USD`.
- **AC-B2** `MARKET_SCOPE.outside_india` no longer lists the UK in GBP and still lists the other five local currencies unchanged.
- **AC-B3** With either `website-deploy` or `stripe-flow1` unmet, the build fails (PR-B cannot merge with the old GBP row nor with price facts ungated).
- **AC-B4** `release_evidence_version` agreement across `uk.json`, `gates.json` and the PR body's cited commit ids (AC-07 drift check).

**PR-C**
- **AC-C1** `alternatives_list()` and `alternatives_list({search:"hubspot"})` are byte-identical to `main` fixtures.
- **AC-C2** With `market:"uk"`: `market_coverage.vendors_with_live_page` equals the pinned count; `matched` and `returned` differ from it when `search` or `limit` is used; every returned route is in the pinned set; `limit` above 60 is clamped; `offset` past the end returns an empty page with `next_offset: null`.
- **AC-C3** `market:"xx"` returns `fail` listing supported markets; a market with no dataset says so.
- **AC-C4** The market response for `limit:60` is under a stated byte ceiling recorded in the PR (measured, then asserted).

## 7b. Smoke test   (expected only)

| # | Call | Expected |
|---|---|---|
| 1 | `country_get({"code":"uk"})` after PR-A | `market_facts.facts` has 4 facts (payment, roadmap payment, hub, positioning) plus SOC 2 only if `soc2-scope` is met; price facts absent; `withheld` has 6 topics; `country.compliance` null |
| 2 | `country_get({"code":"canada"})` | `market_facts: null`, `market_facts_reason: "no_snapshot_for_market"` |
| 3 | `pricing_get_country_plans({"country":"uk"})` after PR-A | payment line `Paid via Stripe`; compliance withheld; price still the old GBP value (recorded defect) |
| 4 | same call after PR-B | USD 12 per user per month, USD 120 per user per year upfront |
| 5 | `alternatives_list({"market":"uk","search":"bitrix","limit":5})` after PR-C | `market_coverage` with total, matched and returned counts; Bitrix24 row with `en-GB` routes if verified |
| 6 | `alternatives_list({"market":"xx"})` | `isError` with the supported markets |
| 7 | pattern scan of every response above | no AC-A4 match |

## 7e. Competitors

Competitor MCP servers were not read this session; the research table keeps those cells as `?`. This plan makes no claim about competitor MCP coverage. Competitor prices stay in research data (research rule R9) and are not served.

## 7f. Compatibility test

Fixtures captured from `main` before any edit: `country_get` for all eight codes, `countries_list`, `pricing_get_country_plans`, `pricing_get_faq`, `pricing_get_plans`, `alternatives_list`, `tools/list`. PR-A may differ from them only in the keys and values named in AC-A1 and the UK payment clause; PR-B only in the price and currency values named in §5; PR-C only by new inputs. Differences are reviewed line by line. The SDK client round trip (AC-A9) stands in for external clients, since a repository grep cannot inventory them; additive keys are treated as potentially breaking for strict-schema clients, so the schemas ship in the same PR as the keys.

## 8. Risks and edge cases

| Risk | Mitigation |
|---|---|
| The MCP shows USD while the website shows GBP | PR-B gated on `website-deploy`; 48-hour skew limit; rollback order in §2b |
| Live Stripe differs from USD 12 / USD 120, or checkout adds tax | `stripe-flow1` gate with tax behaviour and renewal amount; fail closed |
| Roadmap read as capability after caching | `is_capability: false` plus the statement prefix (AC-A5, AC-A2) |
| SOC 2 outlives its period | Historical wording, scope gate, expiry that withholds at request time (AC-A10) |
| Provisional claim ids change | `claim_id_status`, `claim_id_aliases`, re-pin keeps old ids |
| Two plans edit the same generator | §2a item 1: PR-A of whichever plan merges first owns it; the other is data only |
| Market competitors response grows | `limit` clamp and a measured byte ceiling (AC-C4) |
| Route in the inventory no longer renders | Only routes with 200, indexable, self-canonical, `en-GB` are kept; others dropped and counted |

## 9. What this deliberately does NOT do

- No new tool, resource or llms.txt section.
- No tenant-gateway capability: GoCardless and others are roadmap or absent. Nothing says subscriptions are paid via GoCardless.
- No VAT, MTD, PECR, UK GDPR, Companies House or accounting-integration claim, no data-residency sentence, no ISO 27001 or HIPAA.
- No competitor prices; no pages or comparisons for vendors with no live page.
- No other removal of existing fields, descriptions or text, beyond the three named withdrawals in PR-A and the price correction in PR-B.
- No edit to hellocrmwebsite or hellocrm.

## 10. Decisions owed

- **F1** Serve topic-only `withheld` entries (default yes) or nothing?
- **F2** Resolved in rev 2: unsupported UK compliance and GoCardless text is withdrawn in PR-A, not merely annotated. Founder may veto.
- **F3** Is a SOC 2 examination after 2025-06-30 under way? Confirm `expires_on` (proposed 2026-12-31) and the approved public wording.
- **F4** Until PR-B ships, hide the old GBP price (default no: it is gated by the website) or accept the recorded defect?

## 11. Findings outside this plan   (D-EXP-14: recorded, not fixed here)

- `src/data/website-mirror.ts` USA row `compliance: "SOC 2, HIPAA and IRS filings"` asserts HIPAA, which must never be claimed. Find: `grep -n HIPAA src/data/website-mirror.ts`. Needs its own MCP plan.
- `src/tools/alternatives.ts` describes HelloGrowthCRM as WhatsApp-first in two places. Find: `grep -n "WhatsApp-first" src/tools/alternatives.ts`. Needs its own MCP plan.
- The mirror comment says SOC 2 "certified"; it is an attestation.

## 12. Estimated token cost

Estimate, not a quote. Input tokens at $3/M.

| PR | Components (reuse of `country_get`, `pricing_get_country_plans`, `alternatives_list`) | Low | Expected | High |
|---|---|---|---|---|
| PR-A | orientation 150k, generator, schema and gates 300k, countries and mirror edits 100k, fact files 60k, 4 test files 220k, gate 150k | 0.8M | 1.0M | 1.5M |
| PR-B | orientation 100k, mirror edits 60k, tests 100k, evidence-manifest review 100k, gate 100k | 0.4M | 0.55M | 0.8M |
| PR-C | orientation 120k, dataset script 150k, `alternatives.ts` 100k, pinned data 40k, test 120k, gate 120k | 0.6M | 0.8M | 1.2M |
| **Total (reuse)** | | **1.8M** | **2.35M** (about $7) | **3.5M** |

A fresh path with a new `uk_facts` tool and resource would add registry, annotation, title and schema work (about 0.6M) and spend tool-selection budget; it is rejected. This plan PR: about 0.3M.

## 13. Validation (this plan PR)

- **PASS**: plan id 0007 is free: REST PR list shows PLAN-HELLOG-0001 to 0006 only; no remote branch `plan/hellog-0007*`.
- **PASS**: `main` @ `5190a02`: UK `COUNTRY_PRICING` is `£8`/`£10`; `paymentMethods` lists GoCardless; `compliance` is `UK GDPR compliant, ICO-registered data processor`; `COUNTRIES` UK compliance is `GDPR, HMRC and FCA rules`; `alternativesList` input is `search` only; `package.json` has no JSON Schema validator.
- **PASS**: research UK `vendors.csv` has 164 rows; 57 carry `en-GB` in `hreflang`.
- **UNVERIFIABLE**: live server not queried; competitor MCP inventories not read; UK government and regulator hosts unreachable from the research session; whether the research inventory carries route status columns.
- **BLOCKED**: Stripe flow-1 evidence bundle (owner Rushabh). The command `stripe prices list --active --limit 100` is one input, not the bundle (§2b lists the bundle).
- **PASS**: one Astra blind review run (§14).

## 14. Review record

Astra, blind, role plan, 2026-11-02: **reject** on rev 1 with six blockers. Each was checked against the plan text and the repo before it changed anything.

| # | Finding | Verdict | Change |
|---|---|---|---|
| 1 | PR-A published contradictory answers (old GoCardless/compliance strings plus new facts) | Accepted. True: rev 1 kept the strings until PR-B | PR-A withdraws the three unsupported strings (§2, named exception to D-EXP-16); F2 resolved |
| 2 | Acceptance criteria could not pass together (GoCardless, "no tax line", residency regex, §7f scope) | Accepted. True | ACs rewritten per PR (§6); "no tax line" removed from statements and tested; residency topic dropped; prose and identifier checks separated; §5 and §7f list the downstream fields |
| 3 | No implementable gate contract | Accepted | §2b: `gates.json` AND-gate manifest, fail closed, approver and expiry, tax behaviour in the Stripe bundle; F4 no longer weakens the gate |
| 4 | 23 rows cannot become 57 vendors | Accepted. True: the existing rows are pages | §2c: separate route-verified market dataset, dedup, search, coverage versus returned, paging; separate script |
| 5 | Output-schema coverage incomplete; enum blocks custom failure | Accepted | All changed contracts listed in §0a; `market_facts_reason` is top-level; `market` is a free string validated in the handler; ajv round-trip (AC-A8) |
| 6 | SOC 2 publication gate missing | Accepted | Historical wording, `soc2-scope` gate, `expires_on` with request-time withholding (AC-A10, F3) |

Risks and missing items taken: skew limit and rollback order (§2b), release approver and smoke owner (§2a), claim-id aliases, generator negative tests, SDK client round trip, response bound (AC-C4), route verification. Not taken: cutting token accounting (the founder requires a token estimate); cutting `uk.market.hub` (markets served and hreflang are required content); deferring PR-C is allowed but not forced (§0a marks it deferrable).

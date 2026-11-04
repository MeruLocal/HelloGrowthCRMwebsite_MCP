# Plan — MCP: country facts for twelve new hreflang markets (DE, FR, BR, MX, SA, IE, MY, PK, KE, TZ, UG, GH)

- **Revision:** 2 (2026-11-04), blind-review changes folded (Review record); twelve markets: Kenya, Tanzania, Uganda and Ghana added at the coordinator's instruction before the plan PR opened. Built on the contract of PLAN-HELLOG-0007 (#110) and the `additional_markets` mechanism of PLAN-HELLOG-0009 (#112); this plan restates what it needs so it can be read alone. It is data on that contract, plus one small extension (§2d).
- **Plan id:** PLAN-HELLOG-0012, allocated 2026-11-04 as the next free number after PLAN-HELLOG-0011 (#114). Sources: the REST PR list (all states) and the remote `plan/` branches; the highest plan number before this one is 0011. Re-run `plan-id.mjs check` after the branch is pushed.
- **Branch:** `plan/hellog-0012-mcp-twelve-hreflang-markets-country-facts` · **Repo:** MeruLocal/HelloGrowthCRMwebsite_MCP · **Trunk:** `main` (head `5190a02`)
- **Mode:** PLAN (plan only, no code). Each BUILD is its own PR carrying `Implements: PLAN-HELLOG-0012 (PR-x)`.
- **Change tags:** `public_api`, `product`
- **Tier:** T2. Owed: acceptance_criteria, blast_radius, caller_inventory, compatibility_test, competitor_scan, intent, necessary_changes, planned_file_coverage, premise_check, smoke_test
- **Restricted areas touched:** none. The server states prices; it does not bill.
- **Freeze in force?** Yes: the PLAN-HELLOG-0003 (#102) release gate G1–G5 blocks public deploy of every BUILD.
- **Origin:** founder, 2026-11-04: "we wanto to ensure we have good updates on all our repo". Standard D-EXP-14 (every finding updates all four repos) and D-EXP-51 (website, MCP and LLM answers consume the same facts).
- **Research evidence:** MeruLocal/hellogrowthcrm-researchsuite#101 (DE, `claude/hreflang-de`), #102 (FR), #103 (BR), #104 (MX), #105 (SA), #106 (IE), #107 (MY), #108 (PK), #109 (KE, `claude/hreflang-ke`), #110 (TZ), #111 (UG), #112 (GH)
- **Opportunity ID:** OPP-HREF-DE-001, OPP-HREF-FR-001, OPP-HREF-BR-001, OPP-HREF-MX-001, OPP-HREF-SA-001, OPP-HREF-IE-001, OPP-HREF-MY-001, OPP-HREF-PK-001, OPP-HREF-KE-001, OPP-HREF-TZ-001, OPP-HREF-UG-001, OPP-HREF-GH-001
- **Date:** 2026-11-04

## 0. Intent

- **Claim.** On `main` (`src/data/website-mirror.ts`, `src/tools/countries.ts`), `COUNTRIES` and `COUNTRY_PRICING` hold eight markets (in, usa, uk, canada, au, uae, singapore, new-zealand). None of Germany, France, Brazil, Mexico, Saudi Arabia, Ireland, Malaysia, Pakistan, Kenya, Tanzania, Uganda or Ghana is there, although the website serves pages for all twelve (KE `/ke`, `/crm-kenya` and about 20 pages; TZ 15; UG 14; GH 14, each with an en-XX hreflang) (research page inventories: DE 26, FR 3+ local pages with registry routes, BR `/br`, `/br/crm-portugues`, `/crm-brazil`, MX `/mx`, `/mx/crm-espanol`, `/crm-mexico`, SA 10, IE 29, MY 24, PK `/pk`, `/crm-pakistan`, and each market's hreflang tag). `country_get({code:"de"})` returns the not-found `fail`; an assistant asked about HelloGrowthCRM in these markets falls back to the global ladder or guesses. The only traces are hreflang rules in the MCP's port (for example `-malaysia` as en-MY).
- **What is true for all twelve (approved defaults, with provenance until the Product Truth export exists, #114).**
  1. Price: USD 12 per user per month, or USD 120 per user per year charged once upfront. No tax line. Provenance: D-EXP-40, 44, 45 (founder decisions).
  2. Free plan: 150 leads. This plan publishes no limit fact; the figure is served by the existing pricing surface and, later, the Product Truth export (§2e). No market file states it.
  3. Subscriptions are paid to HelloGrowthCRM via Stripe. Tenant gateways (collecting from a tenant's own customers) are roadmap only: M-Pesa for Kenya through Daraja (hellocrm #10095); Vodacom M-Pesa Tanzania needs its own plan (none exists, so it is not a fact); MTN MoMo, Airtel Money and Mixx by Yas go through Flutterwave (#10107); Paystack for Ghana (#10105). None is live. A plan PR number establishes that the item is planned, not that a named wallet is supported in a given country; each roadmap fact therefore says only "Planned, not available" and names the wallet only where the plan PR names it (F6). Use the current names "Telecel Cash" (formerly Vodafone Cash) and "Mixx by Yas" (formerly Tigo Pesa), never the old ones.
  4. Compliance is `unverified` in every research registry (`claims/registry/_inbox/<cc>.csv`): data-protection law, tax rate, e-invoicing, accounting. It is never asserted. This includes negative statements ("not supported"); a negative needs a registry row as much as a positive (§10 F2).
  5. Data residency: nothing is said.
  6. The app interface is available in English, Hindi, Gujarati, Spanish and French. German, Portuguese and Swahili interfaces do not exist; an Arabic interface is planned (hellocrm #10294). Every one of the twelve markets' pages is English-first except `/br/crm-portugues`, `/mx/crm-espanol`, `/pk/crm-urdu` and `/sa/crm-arabic`, which are marketing pages for an English-first app.
  7. HelloGrowthCRM is a full-stack business suite (pipeline, communication, commerce, operations, customers, marketing, intelligence). It is never "WhatsApp-first". WhatsApp is one channel next to email, SMS, voice and live chat.
- **Mechanism.** Reuse, no new machinery. Twelve data files on 0007's generator and gates, served through 0009's `additional_markets` on the existing `country_get` and `countries_list`. PR-A adds the twelve markets with versioned `market_facts` (price facts gated and pending, Stripe, languages, pages and hreflang, positioning, a few roadmap facts, topic-only `withheld`). PR-B publishes each market's price once its own gates are met. **No new tool and no new resource.**
- **Observable.** "What does HelloGrowthCRM cost in Riyadh, and does it do ZATCA e-invoicing?" returns a pending-price state until the gates are met, then USD 12 per user per month or USD 120 per user per year upfront; subscriptions paid via Stripe; ZATCA as a `withheld` topic, never a yes or a no. "Is there a German interface?" returns the list of shipped languages, which does not include German.
- **Risk.** A price served before the website and Stripe agree; a roadmap gateway read as live; a compliance or e-invoicing statement (LGPD, DSGVO, PDPL, PDPA, FBR, ZATCA, MyInvois, CFDI) served as fact; a hreflang tag read as an interface language (`de-DE` on an English page); residency, ISO 27001 or HIPAA language; WhatsApp-first or sales-only positioning; tool-count growth (none here).

## 0a. Necessary changes   (planned-file coverage)

**Dependencies:** 0007 PR-A (generator, schema, policy, `gates.json`, predicate, kill switch, `country_get` keys) and 0009 PR-A (`ADDITIONAL_MARKETS`, the market-only `country_get` form, `additional_markets` on `countries_list`). This plan starts only after both merge and pass their conformance script (AC-A11). Where 0011 PR-A (Product Truth reader) has merged first, the price, plan-limit and language values are read from it (§2e).

**PR-A: twelve markets as additional markets** (buildable once the dependencies merge; no mirror price row exists for any of the twelve, so nothing is withdrawn)
- [ ] `src/tools/countries.ts`: **extend** `ADDITIONAL_MARKETS` with twelve entries (`de`, `fr`, `br`, `mx`, `sa`, `ie`, `my`, `pk`, `ke`, `tz`, `ug`, `gh`). One extension to the mechanism: `route_prefix` may be `null` for a market with no hub route (DE and FR, §2d).
- [ ] `test-data/market-facts/2026-11-04/{de,fr,br,mx,sa,ie,my,pk,ke,tz,ug,gh}.json`, `SHA256SUMS`, and the matching rows in `gates.json` (gates `website-deploy:<cc>`, `stripe-flow1:<cc>`, `pages-observed:<cc>`; no SOC 2 row) per market.
- [ ] `scripts/market-facts.schema.json`: additive enum members for the closed `withheld` topic list (§2) and the new `evidence.type` value `approved_default` (§2e). Policy file unchanged: this plan adds no fact kind (language facts use kind `market`).
- [ ] `src/data/market-facts.ts`: regenerated, never hand-edited.
- [ ] `src/tools/output-schemas.ts`: conditional. Only if 0009's schema does not already make `country.url` optional (AC-A13); otherwise no change beyond 0009. Fixtures extended.
- [ ] `README.md` (one line per added market in the market-facts section, the hreflang-is-not-interface note), `CHANGELOG.md`, version strings (`npm run check:versions`), fixtures `test-data/fixtures/market-facts-<cc>-{pending,published,expired,error}.json` (48 files; generated from one template, §6 AC-A7).
- [ ] Tests: `src/tools/__tests__/market-facts-twelve-markets.test.ts` (parameterised over the twelve codes, one case table, not twelve copies), market cases added to 0007's generator and clock tests, and the language-claims test of AC-A5.

**PR-B: price gates** (blocked, §2a; one PR per market is allowed): `gates.json` (price gates of that market only), `SHA256SUMS` and the regenerated `src/data/market-facts.ts`, changed by an approved diff after the website price correction is deployed and the live Stripe evidence is recorded. No tool code changes. `MARKET_SCOPE` is untouched because it never listed these markets.

Client documentation and versioning follow 0007 (README, CHANGELOG, `check:versions`). **PR-C (market competitors in `alternatives_list`) is DEFERRED:** the research export holds no vendor-alternative demand for any of the twelve (decisions CREATE 0 and EXPAND 0 in all eight; cards need Keyword Planner metrics first), and it does not repair an unsupported claim. Recorded in §9, not planned.

## 0b. What we already know   (G4)

| Source | What it said | What this plan does about it |
|---|---|---|
| Research `plans-draft/SIX-<CC>/mcp.md` (8 files) | Each market is absent from `countries.ts` and `website-mirror.ts`; serve market metadata and shipped languages only; compliance "not claimed"; payments resource lists only shipped tenant gateways; competitors only after a card exists | Adopted; the shape follows 0007/0009 rather than new fields |
| Research `claims/registry/_inbox/<cc>.csv` | Every compliance row `unverified` | Topic-only `withheld`, never a statement |
| Research `plans-draft/SIX-<CC>/product.md` | App languages en, hi, gu, es, fr; German and Portuguese UI are build gaps; Arabic UI plan #10294; GoCardless #10109 (SEPA), e-invoicing foundation #10157 and #10159, shared gateway adapter #10095; Pix, OXXO, SPEI, JazzCash, Easypaisa, FPX, mada, STC Pay are new or queued | Only items with a hellocrm plan PR number become roadmap facts; the rest are withheld |
| Research `plans-draft/SIX-<CC>/website.md` | BR/MX/SA/PK hub pages and language pages lean on "WhatsApp-first"; MX and SA language pages say 200 leads; DE/FR "Deal values in EUR" wording to check | Not repeated in served text; AC-A3 scans prose; website fixes belong to the website plans |
| PLAN-HELLOG-0007 (#110), 0008 (#111), 0009 (#112), 0010 (#113) | Contract, gates, additional-market mechanism, four reviewed data plans | Applied from the start; nothing re-invented |
| PLAN-HELLOG-0011 (#114) | MCP becomes a consumer of the Product Truth export | Values carry `approved_default` provenance so 0011 can replace them mechanically (§2e) |
| Founder 2026-11-04 | Defaults listed in §0 | Adopted verbatim |

## 1. Premise   (G8)

| Claim | Type | Evidence gathered | Running system? |
|---|---|---|---|
| `main` has no data for the twelve markets | code | `COUNTRIES`/`COUNTRY_PRICING` hold eight other hubs; to be re-run in PR-A: `grep -n "germany\|france\|brazil\|mexico\|saudi\|ireland\|malaysia\|pakistan" src/data/website-mirror.ts src/tools/countries.ts` (research read of `origin/main` on 2026-11-04 found only hreflang suffix rules) | Live server not queried (UNVERIFIABLE here) |
| Each market has live website pages | research | Page inventories in the twelve research PRs read from hellocrmwebsite `origin/master`; `/pk/crm-urdu` and PK hub sub-pages are not in the routes manifest, so their live status is unverified | Not curl-ed |
| DE and FR have no hub route | research | DE/FR inventories list only `*-germany` and `*-france` slug pages; no `/de` or `/fr` row. BR `/br`, MX `/mx`, SA `/sa`, IE `/ie`, PK `/pk` are hubs; MY `/my` is stated by the MY research draft | PR-A re-checks against the routes manifest |
| The 0007/0009 mechanism can host these markets | plan | Both plans' reviews closed the contract; 0010 reuses it for ZA, NG, EG with no tool code | Not built yet (dependencies unmerged) |
| Shipped app languages are en, hi, gu, es, fr | founder | Stated in the brief; research `product.md` agrees | Locale files are in hellocrm, not read here |

## 2. What changes

**Compatibility exception:** none. Nothing is removed: no mirror row exists for these markets. Only additions, so D-EXP-16 holds. (The UK GBP and UAE AED corrections are 0007 and 0008's.)

Fact fields, `status` semantics, the publication predicate and the wire contract (`market_facts_contract: 1`) are 0007 §2 and §2b–§2c and are not repeated. A roadmap fact is `is_capability: false` and starts "Planned, not available:". `claim_id_status` is `provisional` until the Claim Registry export assigns ids.

**Facts per market** (`<cc>` is the lower-case code; counts are served facts when every gate is met):

| fact_id | kind | status | Statement | Gates and evidence | Markets |
|---|---|---|---|---|---|
| `<cc>.price.monthly` | price | capability | Growth is USD 12 per user per month | `website-deploy:<cc>`, `stripe-flow1:<cc>`; `approved_default` D-EXP-40/44/45 | all 12 |
| `<cc>.price.annual` | price | capability | Growth is USD 120 per user per year, charged once upfront | same | all 12 |
| `<cc>.pay.hgc-subscription` | payment | capability | HelloGrowthCRM subscriptions are paid via Stripe, the global subscription processor. Whether buyers in this market can purchase, and with which methods, is not confirmed here | none; D-EXP-41 flow 1 only | all 12 |
| `<cc>.market.pages` | market | capability | HelloGrowthCRM has these pages for this market (only routes with deployment evidence, listed with their declared hreflang and content language) | gate `pages-observed:<cc>`: for each listed route, the final URL, a successful response, canonical, rendered hreflang and content language, fetched on `observed_on`; a route without evidence is omitted, and with no verified route the fact is absent (a manifest or the MCP's hreflang port is a repository observation, not deployed behaviour) | all 12; tags: DE de-DE, FR fr-FR, BR pt-BR, MX es-MX, SA en-SA with ar-SA alternate, IE en-IE, MY en-MY, PK en-PK with ur-PK alternate, KE en-KE, TZ en-TZ, UG en-UG, GH en-GH (expected tags from research, to be confirmed by the deployed fetch, never taken from this table or the port) |
| `<cc>.language.app-ui` | market | capability | The app interface is available in English, Hindi, Gujarati, Spanish and French | none; shipped locales | all 12 |
| `<cc>.positioning.suite` | positioning | capability | HelloGrowthCRM is a full-stack business suite (pipeline, communication, commerce, operations, customers, marketing, intelligence); WhatsApp is one channel next to email, SMS, voice and live chat. | none; CLAUDE.md §1.1 and hellocrm `FEATURE_INVENTORY.md` (cited by id) | all 12 |
| `<cc>.pay.gocardless` | payment | roadmap | Planned, not available: GoCardless direct-debit collection (SEPA). It is not a way to pay HelloGrowthCRM and is not live | none; hellocrm #10109 | DE, FR, IE |
| `ke.pay.mpesa` | payment | roadmap | Planned, not available: M-Pesa (Daraja) collection for businesses. It is not a way to pay HelloGrowthCRM and is not live | none; hellocrm #10095 | KE |
| `<cc>.pay.mobile-money` | payment | roadmap | Planned, not available: mobile-money collection through Flutterwave (MTN Mobile Money, Airtel Money, and in Tanzania Mixx by Yas). Not live | none; hellocrm #10107 | TZ, UG (named wallets differ per market, taken from the market's `product.md`) |
| `gh.pay.paystack` | payment | roadmap | Planned, not available: Paystack collection for businesses. Not live | none; hellocrm #10105 | GH |
| `gh.pay.mobile-money` | payment | roadmap | Planned, not available: mobile-money collection through Flutterwave (MTN Mobile Money, Telecel Cash). Not live | none; hellocrm #10107 | GH |
| `ie.einvoicing.peppol` | einvoicing | roadmap | Planned, not available: Peppol e-invoice sending | none; hellocrm #10157 | IE |
| `sa.language.arabic-ui` | market | roadmap | Planned, not available: an Arabic app interface (right-to-left) | none; hellocrm #10294 | SA |

Six base rows (price x2, pages, language, positioning, Stripe) plus the market's roadmap rows give the fully published count: DE 7, FR 7, BR 6, MX 6, SA 7, IE 8, MY 6, PK 6, KE 7, TZ 7, UG 7, GH 8 (BR/MX/MY/PK have no roadmap row; SA has Arabic UI; DE/FR have GoCardless; IE has GoCardless and Peppol; KE has M-Pesa; TZ and UG have mobile money; GH has Paystack and mobile money; Vodacom M-Pesa Tanzania has no plan PR, so TZ states nothing about it and withholds `local-payment-methods`). Before PR-B the price rows are absent from the served response (the data file keeps them), and `pages` is present only for markets with deployment evidence, so the served count is 3 base facts (Stripe, languages, positioning) plus the roadmap rows, plus `pages` where evidenced. **No SOC 2 row is added by this plan:** the twelve markets inherit 0007's withholding unchanged and the attestation work stays there (§10 F3).

**`withheld[]`** (closed enum, additive to 0007's; fixed message "HelloGrowthCRM has not published a verified statement on this topic."). Generic identifiers, scoped by the market file: `purchase-availability`, `tax-rate`, `data-protection-law`, `e-invoicing`, `local-payment-methods`, `regional-language-variant` (BR, MX, PK, SA: whether the regional variant of the marketing language is complete in the app), `mobile-money-wallets` (KE, TZ, UG, GH: live status of any wallet, including Vodacom M-Pesa Tanzania, Airtel Money, MTN Mobile Money, Telecel Cash and Mixx by Yas), plus conditional `price-pending`. DE, FR and IE also withhold `accounting-integrations`; MY, PK, KE, TZ, UG and GH also withhold `sms-consent`. Kenya, Tanzania, Uganda and Ghana withhold e-invoicing as `e-invoicing` (eTIMS, EFD/VFD, EFRIS and GRA E-VAT are not named as supported or unsupported). There is **no residency topic and no residency sentence**. A question about DSGVO, LGPD, PDPL, PDPA, ZATCA, XRechnung, FBR, MyInvois, CFDI, FPX, eTIMS, EFD, EFRIS or E-VAT returns the matching topic, never a yes and never a no.

### 2a. Dependency order (single order)

1. 0007 PR-A, then 0009 PR-A; each passes its conformance script on the merge commit.
2. **PR-A** (this plan) after both. If 0011 PR-A has merged, §2e applies; if not, `approved_default` values stand.
3. **PR-B** per market: blocked on `website-deploy:<cc>` and `stripe-flow1:<cc>` (Stripe access not granted; no resolution date, so PR-A already serves the pending state). The `stripe-flow1:<cc>` evidence is 0007's list and must show the actual subscription flow, tied to the website terms deployed for that market: Stripe product and price identifiers (held in the restricted store; only a reference id and hash enter the repo), currency USD, unit amount, recurrence, per-seat quantity, monthly versus annual-upfront collection, **tax configuration**, and **buyer eligibility for this market**, none of which exists for the twelve today. If checkout adds tax or a charge inconsistent with the approved qualifier, the gate stays unmet.
4. **0003 G1–G5** blocks public deploy of every BUILD; release approver Rushabh; smoke owner the PR author.

### 2d. The one mechanism extension

0009's `ADDITIONAL_MARKETS` entry is `{ code, label, locale, route_prefix }`. Germany and France have no hub, so `route_prefix` becomes `string | null` and the market-only `country` object omits `url` when it is null. `locale` is the hreflang tag the website declares, not a statement about the interface; the `market.pages` fact says so in prose. Existing entries are unaffected (tested). If 0009 has already made `route_prefix` nullable, this item is a no-op.

### 2e. Reuse and the Product Truth export

Boundary: resolution happens **at generation time** in `scripts/build-market-facts.mjs`, not at request time. A data file may hold a literal (provenance `approved_default`, with decision ids) or a reference `{"$truth": "<path>"}` (provenance `registry`, with `truth_version`). The reference form exists only once 0011 PR-A has merged; it is resolved through `src/lib/product-truth.ts` (price, limit, and a language accessor that 0011 must expose, otherwise language stays a literal). An unresolvable reference, or a missing export, **fails the build**; the server never serves an unresolved value.
- **0011 not merged:** all price and language statements are literals with `approved_default`.
- **0011 merged first:** this plan writes references, no literals.
- **0011 merged after these files exist:** 0011's migration PR replaces exactly the `approved_default` fields (a grep-able list is produced by a test) with references, regenerates, and the fixtures must be unchanged byte for byte except provenance.
Both orders and the transition are tested (AC-A15). `approved_default` is a provenance label only: it cannot satisfy or bypass a gate, and the generator rejects it on `attestation` and `compliance` fact kinds (AC-A16).

## 3. Affected files

| Area | Files | PR |
|---|---|---|
| Mechanism extension | `src/tools/countries.ts` (`ADDITIONAL_MARKETS`, nullable `route_prefix`) | A |
| Facts and gates | `test-data/market-facts/2026-11-04/{de,fr,br,mx,sa,ie,my,pk,ke,tz,ug,gh}.json`, `SHA256SUMS`, `gates.json` rows, `src/data/market-facts.ts` (generated) | A (gates edited in B) |
| Schema | `scripts/market-facts.schema.json` (enum members, evidence type) | A |
| Docs, release, fixtures | `README.md`, `CHANGELOG.md`, version strings, `test-data/fixtures/market-facts-<cc>-*.json` | A |
| Tests | `src/tools/__tests__/market-facts-twelve-markets.test.ts`, generator and clock test cases | A, B |

Not touched: `src/data/website-mirror.ts` (no price row is added; hub rows would reopen the string-price problem 0011 removes), `src/tools/pricing.ts`, `access.ts`, `index.ts`, `server.ts`, `server.json`, `smithery.yaml`. Tool count, names and descriptions are unchanged.

## 5. Blast radius and caller inventory

`country_get` and `countries_list` only. Today these codes return a not-found `fail`; they will return the market-only form, an additive change for any caller that enumerates `countries_list.countries` (unchanged: `count: 8`, eight rows) and a visible one for a caller that treated these codes as errors. `additional_markets` grows from the entries of 0009/0010 by twelve. Callers: `grep -rn "country_get\|countries_list\|additional_markets\|ADDITIONAL_MARKETS" src test-data` is run in PR-A and every hit listed. The generator is shared with 0007–0010: adding twelve files must leave every other market's generated bytes unchanged (AC-A6).

## 6. Acceptance criteria   (per PR; none weakened during implementation)

**PR-A**
- **AC-A1** Compatibility matrix (§7f) holds: only the listed keys and values differ from the baseline fixtures, per tool.
- **AC-A2** No response for any of the twelve contains: `€`, `EUR`, `R$`, `BRL`, `MXN`, `SAR`, `MYR`, `PKR`, `Rs`, `GoCardless`, `Pix`, `OXXO`, `SPEI`, `JazzCash`, `Easypaisa`, `FPX`, `mada`, `Tamara`, `iDEAL`, `KES`, `TZS`, `UGX`, `GHS`, `Vodafone Cash`, `Tigo Pesa`, `M-Pesa` and the wallet names `MTN`, `Airtel`, `Telecel`, `Mixx`, `Paystack`, `Flutterwave` outside the roadmap facts named in §2 (the old names `Vodafone Cash` and `Tigo Pesa` are never allowed, even there) (whose statements start "Planned, not available:"). Topic identifiers are checked against the enum, not these patterns.
- **AC-A3** Prose fields (`statement`, `message`, `note`, `qualifier`) match none of `/residen/i`, `/ISO ?27001/i`, `/HIPAA/i`, `/WhatsApp-first/i`, `/sales[- ]only/i`, `/sales[- ]first/i`, `/certified/i`, `/compliant/i`, `/DSGVO|GoBD|XRechnung|LGPD|NFS-?e|ZATCA|PDPL|PDPA|FBR|MyInvois|CFDI|SPEI|eTIMS|EFRIS|VFD|E-VAT/` (the last as a prose match; identifiers are exempt).
- **AC-A4** Every fact validates against `scripts/market-facts.schema.json`; roadmap facts have `is_capability: false`; the roadmap facts in §2 are the only ones.
- **AC-A5** Language claims: every language named in a `language.app-ui` fact is in the shipped list `[en, hi, gu, es, fr]`; no fact or prose names German, Portuguese or Arabic as available (Arabic appears only inside the "Planned, not available" fact); the `market.pages` fact never uses the hreflang tag as an interface claim; no fact names Swahili or any of the three unshipped interfaces (German, Portuguese, Swahili) as available; payment brand names are the current ones (AC-A2).
- **AC-A6** Generation tests over this plan's files: hash mismatch, duplicate `fact_id`, unknown status or gate, a fact omitting the policy's mandatory gates (rejected), roadmap with `is_capability: true`, missing `verified_on` or `release_evidence_version`, banned phrase, byte-identical output on two runs, hand-edited generated file fails closed at start-up, gated facts still present in the artifact, and **adding these twelve files leaves every other market's generated bytes unchanged**.
- **AC-A7** Fixtures for pending, published, expired and error states are committed for each market and are generated from one template; serialized results of the changed tools validate against their `outputSchema`; `tools/list` differs from the baseline only by additive `outputSchema` properties already admitted by 0009.
- **AC-A8** While a market's price gate is unmet, its price fields are `null` with `price_status: "pending_verification"` and the 0007 note (the global USD ladder is not confirmation of availability, checkout terms or tax treatment for this market).
- **AC-A9** Exact boundary and malformed input as in 0007 AC-A9, run for these twelve markets: injected clock at `expires_on - 1ms` and at `expires_on`; unknown or revoked gate withholds; `MARKET_FACTS_KILL_SWITCH` withholds without a rebuild.
- **AC-A10** Tool count equals the baseline; the SDK client round trip succeeds; `annotations.test.ts` and `registry.test.ts` pass.
- **AC-A11** The baseline fixtures are captured at the commit that contains every dependency of §2a (0007 PR-A and 0009 PR-A), recorded in the PR body. The PR's first step is the conformance run of 0007 and 0009.
- **AC-A12** Gate scoping, parameterised over all twelve markets and each of `website-deploy`, `stripe-flow1`, `pages-observed` and the revoke, expire and per-market kill-switch scenarios: the other eleven markets and every earlier market's output stays byte-identical. The global kill switch (`all`) is tested separately and is expected to withhold everything.
- **AC-A13** First, a conformance assertion against 0009's actual `outputSchema` and serializer: `country.url` is optional there; if it is not, PR-A includes `src/tools/output-schemas.ts` and the serializer change. Then `country_get({code:"de"})` and `({code:"fr"})`, called through the SDK client, return the market-only form with `url` absent (not `null`, not an invented hub, not a concatenation) and validate against the schema; the eight existing hubs are byte-identical to the baseline.
- **AC-A14** Composition: `country_get` then `pricing_get_plans` and the reverse both carry the pending note and the global-ladder disclaimer in the `country_get` answer.
- **AC-A15** Each price and language statement is either a literal with `evidence.type: "approved_default"` and a `provenance` string, or a resolved `$truth` reference with `truth_version`; a test lists the literals and covers both dependency orders and the transition of §2e, including the build failing on an unresolvable reference.
- **AC-A16** `approved_default` cannot authorise an `attestation` or compliance fact and cannot satisfy a gate (generator rejects; test). No tenant credential, checkout session, customer record or raw Stripe export appears in any generated artifact or fixture.
- **AC-A17** Payload bounds: serialized `country_get` for each market and `countries_list` sizes are measured and recorded in the PR; `pages` lists at most 12 routes, each with `observed_on` and a refresh limit of 90 days.

**PR-B (per market)**
- **AC-B1** With both price gates met, price rows carry USD 12 per user per month and USD 120 per user per year upfront with `applies_to: "list price for new subscriptions"`, `billing_currency: "USD"` and the approved qualifier; with either unmet, they are `null` and pending.
- **AC-B2a** Evidence freshness: a price gate's `expires_on` is at most 90 days after `observed_on`; any merge to the website touching the market's routes triggers re-observation before the next MCP deploy (owner Rushabh); expiry or a revocation trigger returns the market to pending.
- **AC-B2** `release_evidence_version` agrees across the data file, `gates.json` and the PR body's cited commit ids.
- **AC-B3** The PR body contains the website build id, the affected-route coverage report for that market, the Stripe buyer-eligibility evidence for that market, the measured kill-switch time and the rollback target; `CODEOWNERS` review by the approver is shown.

## 7b. Smoke test   (expected only; the BUILD PR records observed results)

| # | Call | Expected |
|---|---|---|
| 1 | `country_get({"code":"de"})` after PR-A | market-only form, no `url`; facts: Stripe payment, languages, positioning, GoCardless roadmap (4), plus `pages` only if route evidence exists; price absent; `price_status: pending_verification`; `withheld` has 7 base topics plus `price-pending` |
| 2 | `country_get({"code":"sa"})` | facts: Stripe, languages, positioning, Arabic UI roadmap (4), plus `pages` if evidenced; ZATCA question returns `e-invoicing` topic |
| 3 | `country_get({"code":"ie"})` | five facts: Stripe, languages, positioning, GoCardless roadmap, Peppol roadmap, plus `pages` if evidenced |
| 3b | `country_get({"code":"ke"})` and `({"code":"tz"})` | KE: M-Pesa roadmap ("Planned, not available"), no Swahili interface in the language fact; TZ: Flutterwave mobile-money roadmap, nothing about Vodacom M-Pesa beyond the `local-payment-methods` topic |
| 4 | `countries_list()` | `count: 8`, `countries` unchanged, `additional_markets` includes all twelve codes |
| 5 | `country_get({"code":"br"})` after PR-B with both `br` gates met | USD 12 per user per month, USD 120 per user per year upfront; `price-pending` gone; the other seven still pending |
| 6 | `country_get({"code":"mx"})` with a clock past a price gate's `expires_on` | price absent and `price-pending` present again |
| 7 | pattern scan of every response above | no AC-A2, AC-A3 or AC-A5 match |

## 7e. Competitors

**Waiver:** the competitor scan owed at T2 is not run for this data-only change; nothing competitive is served. Competitor MCP servers were not read this session; the research table keeps those cells as `?`. Competitor prices are not served (research rule R9). Local vendor sets (DE 28 net-new, FR 19, BR 18, MX 20, SA 34, PK 31, KE 25, TZ 11, UG 11, GH 16, IE and MY in their research files) stay research data.

## 7f. Compatibility test: per-tool, per-PR contract matrix

Fixtures are captured at the dependency commit (AC-A11), not from today's `main`: `country_get` (all codes), `countries_list`, `pricing_get_country_plans`, `pricing_get_faq`, `pricing_get_plans`, `tools/list`.

| Tool | PR-A change | PR-B change |
|---|---|---|
| `country_get` for the twelve codes | new: market-only form (today: not-found `fail`) | price block becomes published for that market |
| `country_get` other codes | none beyond 0007/0009 | none |
| `countries_list` | `additional_markets` gains twelve entries; `countries` and `count` unchanged | none |
| `pricing_get_country_plans`, `pricing_get_faq`, `pricing_get_plans` | none | none |

Every other tool is byte-identical. The SDK client round trip stands in for external clients; it does not prove that a consumer which assumes a fixed country list tolerates the additions, so the README and CHANGELOG document them.

## 8. Risks and edge cases

| Risk | Mitigation |
|---|---|
| Price served before website and Stripe agree | Gated; pending state; AC-A8, AC-B1 |
| Live Stripe does not enable these markets or adds tax | `stripe-flow1:<cc>` with per-market eligibility; fail closed |
| `de-DE` / `pt-BR` / `es-MX` tag read as an interface language | `market.pages` prose and AC-A5; the language fact lists the shipped locales |
| A roadmap gateway or e-invoicing item read as live | Roadmap-only, "Planned, not available:", plan PR number in evidence |
| Negative compliance claim ("no ZATCA") served without a registry row | Withheld topic instead; F2 |
| A wallet brand read as connected, or an old brand name (Vodafone Cash, Tigo Pesa) served | Roadmap-only facts, current names, AC-A2 |
| Hub URL invented for DE/FR | `route_prefix: null`; no `url` |
| 0011 replaces the values later and the two disagree | `approved_default` provenance and a listing test (§2e) |
| Generator output for earlier markets changes | AC-A6, AC-A12 |

## 9. What this deliberately does NOT do

No new tool, resource or llms.txt section. No tenant-gateway capability: every local gateway is roadmap or absent. No tax-rate, data-protection, e-invoicing or accounting-integration statement, positive or negative, and no data-residency sentence. No ISO 27001, HIPAA or "certified" wording. No local currency anywhere (USD only outside India). No competitor prices. No hub-row additions to `website-mirror.ts`. No edit to hellocrmwebsite or hellocrm.

Deferred, with the reason: market competitors in `alternatives_list` for these twelve (no measured demand; CREATE 0 and EXPAND 0 in every research website plan). A `claims_get` row for the negative statements (ZATCA, FBR, MyInvois, FPX, JazzCash, Easypaisa "not supported today") waits for the Claim Registry export and PLAN-HELLOG-0006.

## 10. Decisions owed

- **F1 (proposed)** `withheld` topic identifiers are generic and scoped by the market file (not market-qualified like some of 0007's). Closes when the first review of PR-A accepts the enum.
- **F2 (open, founder)** The research drafts for SA, MY and PK ask for "not supported today" claim rows (ZATCA, FBR, JazzCash/Easypaisa, MyInvois, FPX). This plan serves a `withheld` topic instead, because compliance is unverified and a negative needs a registry row too. Founder may overrule once the registry export exists.
- **F3 (closed here)** No SOC 2 rows are added; attestation scope and expiry stay with 0007.
- **F6 (open)** Which wallets the Flutterwave and Paystack plans actually cover in each of KE, TZ, UG and GH. Until the plan PRs name them, facts say "mobile-money collection" without wallet names beyond those the coordinator listed.
- **F5 (open)** Vodacom M-Pesa Tanzania has no hellocrm plan PR (the coordinator: it needs its own plan). Until one exists TZ states nothing about it; a plan PR number would make it a roadmap fact.
- **F4 (open)** Whether `/pk/crm-urdu` and `/sa/crm-arabic` are live (not in the routes manifest for PK). PR-A lists only routes the manifest contains.

## 11. Findings outside this plan   (D-EXP-14: recorded, not fixed here)

Each item below is to be linked in the PR-A body to its owning website plan PR or issue before PR-A merges (owner: the market's website plan; release dependency: none for the MCP, since the MCP does not repeat these claims, AC-A3).


- `src/data/website-mirror.ts` Singapore row says "PDPA (Singapore) compliant" (`grep -n "PDPA" src/data/website-mirror.ts`): the same claim type as the Malaysian one withheld here. It belongs in the claim-type plan, not this one.
- USA row `compliance` asserts HIPAA; `src/tools/alternatives.ts` carries WhatsApp-first and Sales-first wording (both recorded in 0007 §11).
- UK (GBP) and UAE (AED) local-currency prices are the subject of 0007 and 0008.
- Website matters recorded in the research drafts, for the website plans: the 200-lead figure on `/mx/crm-espanol` and `/sa/crm-arabic`; WhatsApp-first meta on `/sa`, `/pk` and `/br/crm-portugues`; `de-DE` hreflang on English `*-germany` pages; no `fr-FR` signal on `*-france` pages.

## 12. Estimated token cost

Estimate, not a quote; input tokens at $3/M.

| PR | Low | Expected | High |
|---|---|---|---|
| PR-A (twelve data files, fixtures from one template, mechanism extension, tests) | 0.8M | 1.2M | 1.8M |
| PR-B (gate PRs; about eight expected, twelve at most, since gates arrive per market) | 0.15M each | 0.2M each | 0.3M each |
| **Total** | **2.0M** | **2.8M** (about $8.40) | **4.2M** |

Operational effort beyond tokens: website route fetches per market (PR-A) and Stripe evidence per market (PR-B, owner Rushabh). This plan PR: about 0.4M.

## 13. Validation (this plan PR)

- **PASS**: plan id 0012 free: REST PR list (all states) shows PLAN-HELLOG-0002 to 0011 and the remote `plan/` branches stop at `hellog-0011`; no branch or PR for 0012 before this one.
- **PASS**: `main` @ `5190a02` fetched; `docs/plans` holds no 0012 file.
- **PASS**: all twelve research `mcp.md` drafts read from branches `claude/hreflang-<cc>`; research PRs #101–#112 found via REST.
- **PASS**: 0007 (#110), 0009 (#112), 0010 (#113) and 0011 (#114) plan files read at their branch heads.
- **UNVERIFIABLE**: live server; the deployed website (the proxy refuses www.hellogrowthcrm.com from this session); whether `main` has other traces of these markets (not grepped in a full checkout of the data files this session beyond the research read); competitor MCP inventories; the website routes manifest.
- **BLOCKED**: Stripe flow-1 evidence per market (Rushabh); Product Truth export (#114).

## Review record

One blind second-opinion review of revision 1 (verdict: accept-with-changes, five blockers). Folded in revision 2: (1) `market.pages` is gated on deployed-route evidence and the blanket "not localised" sentence is gone; (2) Product Truth path defined at generation time with both dependency orders tested (AC-A15); (3) optional `url` is a conformance assertion with schema coverage conditional (AC-A13); (4) Stripe evidence names the real subscription flow and tax, and freshness is specified (§2a, AC-B2a); (5) isolation test parameterised over twelve markets and scenarios (AC-A12). Also taken: GH count corrected, SOC 2 rows cut, token-savings claim removed, competitor waiver recorded, payload bounds, follow-up linkage. Not taken: dropping the roadmap gateway facts (the coordinator specified them; their wording is limited, F6). No second review was run.

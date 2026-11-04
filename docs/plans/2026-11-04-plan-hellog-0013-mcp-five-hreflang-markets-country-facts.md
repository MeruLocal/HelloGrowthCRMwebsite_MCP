# Plan — MCP: country facts for five South and South-East Asian markets (PH, ID, BD, LK, NP)

- **Revision:** 2 (2026-11-04), blind-review changes folded (Review record). A second tranche on the contract of PLAN-HELLOG-0012 (#115), which is open and unmerged. It reuses 0012's mechanism, fact table, gates, `withheld` enum and acceptance criteria by reference and states only what differs, so it can be read next to 0012 and does not restate it.
- **Plan id:** PLAN-HELLOG-0013, allocated 2026-11-04 as the next free number after PLAN-HELLOG-0012 (#115). Sources: the REST PR list (all states) and the remote `plan/` branches; the highest plan number before this one is 0012. Re-run `plan-id.mjs check` after the branch is pushed.
- **Branch:** `plan/hellog-0013-mcp-five-hreflang-markets-country-facts` · **Repo:** MeruLocal/HelloGrowthCRMwebsite_MCP · **Trunk:** `main` (head `5190a02`)
- **Mode:** PLAN (plan only, no code). Each BUILD is its own PR carrying `Implements: PLAN-HELLOG-0013 (PR-x)`.
- **Change tags:** `public_api`, `product`
- **Tier:** T2.
- **Restricted areas touched:** none. The server states prices; it does not bill.
- **Freeze in force?** Yes: the PLAN-HELLOG-0003 (#102) release gate G1–G5 blocks public deploy of every BUILD.
- **Why a new plan and not an edit of 0012:** 0012 is open and its shape fits (data files on the 0007 generator, served through 0009's `additional_markets`), so this plan reuses it. It is not folded into 0012 because 0012 has been reviewed at twelve markets and carries its own review record; changing its scope from outside would invalidate that review. The two plans merge cleanly in either order (§2a).
- **Research evidence:** MeruLocal/hellogrowthcrm-researchsuite#113 (PH, `claude/hreflang-ph`), #114 (ID, `claude/hreflang-id`), #115 (BD, `claude/hreflang-bd`), #116 (LK, `claude/hreflang-lk`), #117 (NP, `claude/hreflang-np`)
- **Opportunity ID:** OPP-HREF-PH-001 (PH), OPP-HREF-ID-001 (ID), OPP-HREF-BD-001 (BD), OPP-HREF-LK-001 (LK), OPP-HREF-NP-001 (NP)
- **Origin:** founder, 2026-11-04: "what more we cna do research" (the hreflang market research), and the standard D-EXP-14 (every finding updates all four repos) with D-EXP-51 (website, MCP and LLM answers consume the same facts).
- **Date:** 2026-11-04

## 0. Intent

- **Claim.** On `main`, `COUNTRIES` and `COUNTRY_PRICING` hold eight markets, and 0012 will add twelve more as additional markets. None of the Philippines, Indonesia, Bangladesh, Sri Lanka or Nepal is in either set, although the website serves pages for all five (research page inventories: PH 26 routes with hub `/ph`, ID 50 with hub `/id`, BD 14 with hub `/bd`, LK `/lk` and `/crm-sri-lanka`, NP `/np` and `/crm-nepal`). `country_get({code:"ph"})` returns the not-found `fail`, so an assistant asked about HelloGrowthCRM in these markets falls back to the global ladder or guesses, and the research drafts show the website itself over-claims there (local-currency figures on `/ph/whatsapp-crm`, "GCash-friendly" copy with no gateway behind it, "PDPA-aligned" and "UU PDP-compliant" wording).
- **What is true for all five (founder-approved facts, with provenance until the Product Truth export exists, #114).**
  1. **Price:** USD 12 per user per month, or USD 120 per user per year, charged once upfront. No tax line. Provenance: D-EXP-40, 44, 45.
  2. **Free plan:** 150 free leads.
  3. **Payments:** HelloGrowthCRM subscriptions are paid via Stripe. Every local gateway is roadmap only and is not live: PH GCash and Maya; ID QRIS, OVO and DANA; BD bKash and Nagad; LK LankaQR and PayHere; NP eSewa and Khalti. The research drafts also mention GoPay, Fonepay and aggregator names; the founder's list does not include them, so this plan serves none of them.
  4. **Languages** (answer from the code, 2026-11-04): English, Hindi, Gujarati, Spanish and French are available through automatic translation. Native translations exist for English and French (Canada) only. Bahasa Indonesia, Bangla, Sinhala and Nepali are not offered. The set of available languages is closed: nothing outside it is described as available.
  5. **Compliance is `unverified`** in every research registry (`claims/registry/_inbox/<cc>.csv`, 12, 12, 9, 8 and 9 rows for PH, ID, BD, LK and NP). It is never asserted, positively or negatively.
  6. **Data residency:** nothing is said, in any field, test or fixture.
  7. HelloGrowthCRM is a full-stack business suite (pipeline, communication, commerce, operations, customers, marketing, intelligence). It is never "WhatsApp-first"; WhatsApp is one channel next to email, SMS, voice and live chat.
- **Mechanism.** Reuse, no new machinery. Five data files on 0007's generator and gates, served through 0009's `additional_markets` on the existing `country_get` and `countries_list`, using 0012's fact table with the differences in §2. **No new tool and no new resource.** All five markets have a hub or country route, so 0012's `route_prefix: null` extension is not needed here.
- **Observable (tool contract; the assistant evaluation in §7b is advisory, not a gate).** `country_get` for a code returns the facts and `withheld[]` below, and the same tool never returns a yes or a no on compliance. In plain terms, "What does HelloGrowthCRM cost in Manila, and can I pay with GCash?" returns a pending-price state until the gates are met, then USD 12 per user per month or USD 120 per user per year upfront with 150 free leads; subscriptions paid via Stripe; GCash and Maya as "Planned, not available", never as connected. "Is there a Bahasa Indonesia interface?" returns the list of available languages, which does not include Bahasa, and says native translations are English and French (Canada) only. "Is HelloGrowthCRM compliant with the Philippine Data Privacy Act?" returns the `data-protection-law` topic as withheld, never a yes and never a no.
- **Risk.** A price served before the website and Stripe agree; a roadmap gateway read as live; a hreflang tag (`id-ID` on a page, `bn-BD`) read as an interface language; an automatic translation read as a native one; a compliance, tax or e-invoicing statement served as fact; residency language; "WhatsApp-first"; a local-currency figure; a second, conflicting language fact next to 0012's (§2b).

## 0a. Necessary changes   (planned-file coverage)

**Dependencies (hard, pinned):** 0007 PR-A, 0009 PR-A and 0012 PR-A, all merged. 0012 PR-A supplies the file layout, fixture template, the `approved_default` evidence type, the schema enum members and the policy this plan reuses. This PR-A starts only from a recorded merge commit that contains all three, and its PR body pins that commit and the commit of the research branches #113–#117 it read. There is no fallback that carries 0012's prerequisites.

**PR-A: five markets as additional markets** (no mirror price row exists for any of the five, so nothing is withdrawn)
- [ ] `src/tools/countries.ts`: **extend** `ADDITIONAL_MARKETS` with five entries (`ph`, `id`, `bd`, `lk`, `np`), each with a route prefix (`/ph`, `/id`, `/bd`, `/lk`, `/np`).
- [ ] `test-data/market-facts/2026-11-04/{ph,id,bd,lk,np}.json`, `SHA256SUMS`, and the matching rows in `gates.json` (gates `website-deploy:<cc>`, `stripe-flow1:<cc>`, `pages-observed:<cc>`; no SOC 2 row).
- [ ] `scripts/market-facts.schema.json`: no change expected. The plan-limit fact uses the existing `market` kind (F2); if the 0007 policy does not permit that, the prerequisite is resolved in its own PR before this BUILD.
- [ ] `src/data/market-facts.ts`: regenerated, never hand-edited.
- [ ] `README.md` (one line per added market, the hreflang-is-not-interface note, the automatic-versus-native translation note), `CHANGELOG.md`, version strings (`npm run check:versions`), fixtures `test-data/fixtures/market-facts-<cc>-{pending,published,expired,error}.json` (20 files, generated from the one template 0012 introduces).
- [ ] Tests: `src/tools/__tests__/market-facts-five-asia-markets.test.ts` (parameterised over the five codes, one case table), plus the language and wallet scans of AC-A2 to AC-A5 below.

**PR-B: price gates** (blocked, §2a; one PR per market is allowed): `gates.json` price gates of that market only, `SHA256SUMS` and the regenerated `src/data/market-facts.ts`, changed by an approved diff after the website price correction is deployed and the live Stripe evidence is recorded. No tool code changes.

**Deferred:** market competitors in `alternatives_list` (§9). Local vendor sets stay research data (PH 21, ID 15, BD 15, LK 21, NP 21 rows, search-snippet quality 1, never competitor prices).

## 0b. What we already know   (G4)

| Source | What it said | What this plan does about it |
|---|---|---|
| Research `plans-draft/SIX-<CC>/mcp.md` (5 files) | Each market is absent from the MCP; state price, Stripe, shipped languages and manual payment entry; never state gateway, compliance or residency | Adopted, with three corrections below |
| Same drafts, "USD 10 billed annually" | Gives the annual price as a monthly equivalent | Not served; the founder's form is USD 120 per user per year upfront |
| Same drafts, "WhatsApp AI chat and voice cover the Indic languages listed in supportedLanguages.ts" and "support is remote on the US window" | Language and support-window statements | Replaced by the founder's code answer on languages (§0); the support window is not a founder-approved fact and is not served |
| Same drafts, "Data region must not be claimed" | Residency guard | Strengthened: nothing at all is said about residency, including negatives |
| Research `claims/registry/_inbox/<cc>.csv` | Every compliance row `unverified`; government hosts could not be fetched | Topic-only `withheld`, never a statement |
| Research `plans-draft/SIX-<CC>/product.md` | Gateways are new builds on the shared adapter (hellocrm #10095); none of the existing gateway plans covers these markets; e-invoicing profiles wait on #10157 and #10159; Bahasa, Bangla, Sinhala and Nepali interfaces are not built | Gateways become roadmap facts on the founder's word (§2, F1); e-invoicing and compliance stay withheld topics; unshipped interfaces are never described as available |
| PLAN-HELLOG-0012 (#115) | Twelve markets on the same contract; language fact lists "English, Hindi, Gujarati, Spanish and French" without the automatic-translation distinction; publishes no plan-limit fact | Reused; two refinements proposed in §2b |
| MCP PR #107 | Free-plan facts corrected to 150 leads in faqs and alternatives | Consistent with the 150-lead fact here |
| Founder 2026-11-04 | Facts in §0 | Adopted verbatim |

## 1. Premise   (G8)

| Claim | Type | Evidence gathered | Running system? |
|---|---|---|---|
| `main` has no data for the five markets | code | Research read of `origin/main` found only hreflang suffix rules; PR-A re-runs `grep -n "philippines\|indonesia\|bangladesh\|sri.lanka\|nepal" src/data/website-mirror.ts src/tools/countries.ts` | Live server not queried (UNVERIFIABLE here) |
| Each market has live website pages | research | Page inventories in #113–#117, read from hellocrmwebsite `origin/master` | Not fetched; the deployed fetch is the `pages-observed:<cc>` gate |
| Expected hreflang: PH en-PH; ID en-ID (34 Bahasa pages are marked `id-ID (unverified)` in the research); BD en-BD with a `bn-BD` alternate; LK en-LK; NP en-NP | research | The inventories' `hreflang_expected` column; LK and NP have only two routes each and no hreflang cluster | Confirmed only by the deployed fetch, never from this table |
| No Filipino, Bahasa, Bangla, Sinhala, Tamil or Nepali app interface | founder | Code answer of 2026-11-04 names Bahasa, Bangla, Sinhala and Nepali; the available set is closed. Filipino and Tamil are not named by the founder but are outside the available set | Locale files live in hellocrm and are not read here (F3) |
| The 0007/0009/0012 mechanism can host these markets | plan | Both plans' reviews closed the contract | Not built yet |

## 2. What changes

**Compatibility exception:** none. Nothing is removed. Only additions.

Fact fields, `status` semantics, the publication predicate, the wire contract and the `withheld` enum are 0007 §2 and 0012 §2, and are not repeated. A roadmap fact is `is_capability: false` and starts "Planned, not available:". `claim_id_status` is `provisional` until the Claim Registry export assigns ids.

**Facts per market** (`<cc>` is the lower-case code):

| fact_id | kind | status | Statement | Gates and evidence | Markets |
|---|---|---|---|---|---|
| `<cc>.price.monthly` | price | capability | Growth is USD 12 per user per month | `website-deploy:<cc>`, `stripe-flow1:<cc>`; `approved_default` D-EXP-40/44/45 | all 5 |
| `<cc>.price.annual` | price | capability | Growth is USD 120 per user per year, charged once upfront | same | all 5 |
| `<cc>.plan.free` | market | capability | The Free plan includes 150 free leads | none; `approved_default`, founder 2026-11-04, consistent with MCP #107; the kind is the existing `market` (F2) | all 5 |
| `<cc>.pay.hgc-subscription` | payment | capability | HelloGrowthCRM subscriptions are paid via Stripe, the global subscription processor. Whether buyers in this market can purchase, and with which methods, is not confirmed here | none; D-EXP-41 flow 1 only | all 5 |
| `<cc>.market.pages` | market | capability | HelloGrowthCRM has these pages for this market, listed with their declared hreflang and content language (only routes with deployment evidence) | gate `pages-observed:<cc>`; a route without evidence is omitted; with no verified route the fact is absent | all 5; expected routes: PH `/ph`, ID `/id`, BD `/bd`, LK `/lk` and `/crm-sri-lanka`, NP `/np` and `/crm-nepal`, to be confirmed by fetch |
| `<cc>.language.app-ui` | market | capability | The app interface is available in English, Hindi, Gujarati, Spanish and French through automatic translation. Native translations exist for English and French (Canada) only | none; code answer 2026-11-04 | all 5 |
| `id.language.not-offered`, `bd.language.not-offered`, `lk.language.not-offered`, `np.language.not-offered` | market | capability | An interface in <Bahasa Indonesia / Bangla / Sinhala / Nepali> is not offered | none; code answer 2026-11-04 | ID, BD, LK, NP (PH: none, because the founder named no Philippine language) |
| `<cc>.positioning.suite` | positioning | capability | HelloGrowthCRM is a full-stack business suite (pipeline, communication, commerce, operations, customers, marketing, intelligence); WhatsApp is one channel next to email, SMS, voice and live chat | none; CLAUDE.md §1.1 and hellocrm `FEATURE_INVENTORY.md` (cited by id) | all 5 |
| `ph.pay.local-wallets` | payment | roadmap | Planned, not available: GCash and Maya collection for businesses. It is not a way to pay HelloGrowthCRM and is not live | none; founder 2026-11-04; shared adapter hellocrm #10095 (F1) | PH |
| `id.pay.local-wallets` | payment | roadmap | Planned, not available: QRIS, OVO and DANA collection for businesses. Not a way to pay HelloGrowthCRM; not live | same | ID |
| `bd.pay.local-wallets` | payment | roadmap | Planned, not available: bKash and Nagad collection for businesses. Not a way to pay HelloGrowthCRM; not live | same | BD |
| `lk.pay.local-wallets` | payment | roadmap | Planned, not available: LankaQR and PayHere collection for businesses. Not a way to pay HelloGrowthCRM; not live | same | LK |
| `np.pay.local-wallets` | payment | roadmap | Planned, not available: eSewa and Khalti collection for businesses. Not a way to pay HelloGrowthCRM; not live | same | NP |

Served-fact count when every gate is met: PH 8, ID 9, BD 9, LK 9, NP 9 (six base rows, the plan-limit row, the roadmap row, and one not-offered language row for the four that have one; PH has no not-offered row). Before PR-B the two price rows are absent from the served response (the data file keeps them), and `pages` is present only where route evidence exists.

**`withheld[]`** reuses 0012's closed enum with no new member: `purchase-availability`, `tax-rate`, `data-protection-law`, `e-invoicing`, `local-payment-methods`, `sms-consent`, plus conditional `price-pending`. A question about the Data Privacy Act, BIR e-invoicing, UU PDP, e-Faktur or Coretax, Mushak or NBR e-invoicing, the Bangladesh data-protection law, PDPA (Sri Lanka), IRD e-invoicing, CBMS or the Nepal Individual Privacy Act returns the matching topic, never a yes and never a no. There is **no residency topic and no residency sentence**.

### 2a. Dependency order

1. 0007 PR-A, then 0009 PR-A; each passes its conformance script on the merge commit.
2. 0012 PR-A merged. The two plans touch disjoint data files and one shared array, `ADDITIONAL_MARKETS`; this plan appends its five entries on top of 0012's.
3. **PR-A** (this plan).
4. **PR-B** per market, blocked on `website-deploy:<cc>` and `stripe-flow1:<cc>` (Stripe access not granted; no resolution date, so PR-A already serves the pending state). Gate transitions are approved by the release approver (Rushabh) through a `CODEOWNERS`-reviewed diff; restricted evidence (Stripe identifiers, checkout data) stays outside the repo and only a sanitized attestation id and hash enter it. The Stripe evidence follows 0012 §2a: the actual subscription flow, currency USD, unit amount, recurrence, per-seat quantity, monthly versus annual upfront, tax configuration, and buyer eligibility for this market. If checkout adds tax or a charge inconsistent with the approved qualifier, the gate stays unmet.
5. **0003 G1–G5** blocks public deploy of every BUILD; release approver Rushabh; smoke owner the PR author.

### 2b. Two proposed refinements to 0012, recorded and not applied here

- **Language fact.** 0012 states "available in English, Hindi, Gujarati, Spanish and French". The founder's code answer separates automatic translation from native translation. This plan serves the precise form. Left unchanged, 0012 and 0013 would serve two different language facts, so the 0012 owner is asked to adopt the same wording before either merges (F4). Because this is a global app fact, not a per-market one, equality is mandatory (AC-A19).
- **Plan-limit fact.** 0012 deliberately publishes no limit; this plan publishes 150 free leads on the founder's instruction for these five markets only. It does not expand 0012's twelve.

## 3. Affected files

| Area | Files | PR |
|---|---|---|
| Mechanism | `src/tools/countries.ts` (`ADDITIONAL_MARKETS`, five entries) | A |
| Facts and gates | `test-data/market-facts/2026-11-04/{ph,id,bd,lk,np}.json`, `SHA256SUMS`, `gates.json` rows, `src/data/market-facts.ts` (generated) | A (gates edited in B) |
| Schema | `scripts/market-facts.schema.json` (only if absent after 0012) | A |
| Docs, release, fixtures | `README.md`, `CHANGELOG.md`, version strings, `test-data/fixtures/market-facts-<cc>-*.json` | A |
| Tests | `src/tools/__tests__/market-facts-five-asia-markets.test.ts`, generator and clock cases | A, B |

Not touched: `src/data/website-mirror.ts`, `src/tools/pricing.ts`, `access.ts`, `index.ts`, `server.ts`, `server.json`, `smithery.yaml`. Tool count, names and descriptions are unchanged.

## 5. Blast radius and caller inventory

`country_get` and `countries_list` only. Today these codes return a not-found `fail`; they will return the market-only form, additive for any caller that enumerates `countries_list.countries` (unchanged: eight rows) and visible for a caller that treated these codes as errors. `additional_markets` grows by five. Callers: `grep -rn "country_get\|countries_list\|additional_markets\|ADDITIONAL_MARKETS" src test-data` is run in PR-A and every hit listed. Adding five files must leave every other market's generated bytes unchanged (AC-A6).

## 6. Acceptance criteria   (per PR; none weakened during implementation)

The criteria of 0012 §6 (AC-A1, A4, A6 to A17 and AC-B1 to B3) apply to the five codes unchanged and are run by the same parameterised test. The ones below are the ones that differ.

**PR-A**
- **AC-A2** No response for any of the five contains a local-currency token or symbol (`PHP`, `₱`, `IDR`, `Rp`, `BDT`, `৳`, `LKR`, `NPR`, `Rs`), and none contains a wallet or gateway name (`GCash`, `Maya`, `QRIS`, `OVO`, `DANA`, `GoPay`, `bKash`, `Nagad`, `Rocket`, `LankaQR`, `PayHere`, `eSewa`, `Khalti`, `Fonepay`) or an aggregator or acquirer name (`Xendit`, `Midtrans`, `PayMongo`, `SSLCommerz`, `aamarPay`, `ShurjoPay`) outside the roadmap facts of §2, whose statements start "Planned, not available:". Topic identifiers are checked against the enum, not these patterns.
- **AC-A3** Prose fields (`statement`, `message`, `note`, `qualifier`) match none of `/residen/i`, `/data (region|location|center|centre)/i`, `/ISO ?27001/i`, `/HIPAA/i`, `/WhatsApp-first/i`, `/sales[- ]only/i`, `/sales[- ]first/i`, `/certified/i`, `/compliant/i`, `/aligned/i`, nor any of `Data Privacy Act`, `NPC`, `BIR`, `EIS`, `UU PDP`, `e-Faktur`, `Coretax`, `Mushak`, `NBR`, `RAMIS`, `IRD`, `CBMS`, `PDPA`, `Individual Privacy Act` (identifiers are exempt).
- **AC-A5** Language claims: every language named as available in a `language.app-ui` fact is in `[en, hi, gu, es, fr]`; the fact says automatic translation and names English and French (Canada) as the only native translations; no fact or prose names Bahasa Indonesia, Indonesian, Bangla, Bengali, Sinhala, Tamil, Nepali, Filipino or Tagalog as available; the `not-offered` facts exist exactly for ID, BD, LK and NP; the `market.pages` fact never uses a hreflang tag (`id-ID`, `bn-BD`) as an interface claim.
- **AC-A18** Dependency pin: the PR body records the merge commit containing 0007, 0009 and 0012 PR-A, and the first CI step is their conformance scripts on that commit. Baseline fixtures are captured there.
- **AC-A19** The `language.app-ui` string is byte-identical across the 0012 and 0013 markets; a difference fails the build unless verified market-specific behaviour is cited. The language claim is pinned to a hellocrm commit and locale-file path in the data file's evidence.
- **AC-A20** The plan-limit fact states exactly "150 free leads", agrees with `pricing_get_plans` and the Free-plan facts of MCP #107, and names no other plan limit.
- **AC-A22** Cross-tool: while a market's price gate is unmet, `country_get` and `pricing_get_plans` are called in both orders; the pending note stays in the `country_get` answer and the global ladder is not presented as purchase availability. Expiry is evaluated at serving time (injected clock at `expires_on - 1ms` and `expires_on`, UTC, invalid timestamp withholds, revocation withholds, kill switch withholds), including in a long-lived process.
- **AC-A23** Prose scans (AC-A3, AC-A5) run on word boundaries, case-folded after Unicode NFKC normalisation, over every string field of every served fact, `withheld` message and `note`; short tokens (`Rp`, `Rs`, `IRD`, `BIR`, `EIS`, `NPC`) match whole tokens only. Topic identifiers are exempt.
- **AC-A21** Every roadmap fact's evidence names the founder statement and, until a hellocrm plan PR names the wallet, says so (F1); none is `is_capability: true`.

## 7b. Smoke test   (expected only; the BUILD PR records observed results)

| # | Call | Expected |
|---|---|---|
| 1 | `country_get({"code":"ph"})` after PR-A | market-only form with `url` for `/ph`; facts: free plan (150), Stripe, languages, positioning, wallets roadmap (GCash, Maya), plus `pages` only if evidenced; price absent; `price_status: pending_verification`; `withheld` lists the base topics plus `price-pending` |
| 2 | `country_get({"code":"id"})` | same shape; wallets roadmap names QRIS, OVO, DANA; a `not-offered` fact for Bahasa Indonesia |
| 3 | `country_get({"code":"bd"})`, `lk`, `np` | wallets roadmap (bKash and Nagad; LankaQR and PayHere; eSewa and Khalti); `not-offered` for Bangla, Sinhala, Nepali respectively |
| 4 | `country_get` for each code | `withheld[]` contains `data-protection-law` and `e-invoicing`; no served string states compliance or non-compliance. Advisory only: an assistant evaluation on the natural-language questions (Data Privacy Act, UU PDP, IRD e-invoicing) answers from `withheld`, not a yes or no |
| 5 | `countries_list()` | `count: 8`, `countries` unchanged, `additional_markets` includes the five codes |
| 6 | `country_get({"code":"np"})` after PR-B with both `np` gates met | USD 12 per user per month, USD 120 per user per year upfront; `price-pending` gone; the other four still pending |
| 7 | `country_get({"code":"lk"})` with a clock past a price gate's `expires_on` | price absent and `price-pending` present again |
| 8 | pattern scan of every response above | no AC-A2, AC-A3 or AC-A5 match |

## 7e. Competitors

**Waiver:** the competitor scan owed at T2 is not run for this data-only change; nothing competitive is served. Competitor prices are never served (research rule R9). Local vendor sets stay research data.

## 7f. Compatibility test: per-tool, per-PR contract matrix

Fixtures are captured at the dependency commit (AC-A11 of 0012): `country_get` (all codes), `countries_list`, `pricing_get_country_plans`, `pricing_get_faq`, `pricing_get_plans`, `tools/list`.

| Tool | PR-A change | PR-B change |
|---|---|---|
| `country_get` for the five codes | new: market-only form (today: not-found `fail`) | price block becomes published for that market |
| `country_get` other codes | none beyond 0007, 0009 and 0012 | none |
| `countries_list` | `additional_markets` gains five entries; `countries` and `count` unchanged | none |
| `pricing_get_*` | none | none |

Every other tool is byte-identical. The README and CHANGELOG document the additions for consumers that assume a fixed country list.

## 8. Risks and edge cases

| Risk | Mitigation |
|---|---|
| Price served before website and Stripe agree | Gated; pending state; AC-A8, AC-B1 |
| Live Stripe does not enable these markets or adds tax | `stripe-flow1:<cc>` per market; fail closed |
| `id-ID` or `bn-BD` tag read as an interface language | `market.pages` prose, the `not-offered` facts and AC-A5 |
| Automatic translation read as a native one | The language fact names the two native translations; AC-A5 |
| A roadmap gateway read as live, or a wallet named where no one planned it | "Planned, not available:" wording, the founder-only list, F1, AC-A2, AC-A21 |
| Compliance or e-invoicing statement, positive or negative | Withheld topics only; AC-A3 |
| Two language facts diverge between 0012 and 0013 | §2b, F4, AC-A19 |
| Two plans edit `ADDITIONAL_MARKETS` and the schema | §2a, AC-A18 |
| 0011 replaces the values later | `approved_default` provenance and a listing test (0012 §2e) |

## 9. What this deliberately does NOT do

No new tool, resource or llms.txt section. No tenant-gateway capability: every local gateway is roadmap. No aggregator, acquirer or extra wallet beyond the founder's list. No tax-rate, data-protection, e-invoicing or accounting statement, positive or negative. No data-residency sentence, no data-region sentence, no ISO 27001, HIPAA or "certified" wording. No support-window statement. No local currency anywhere. No competitor prices. No edit to `website-mirror.ts`, to hellocrm or to hellocrmwebsite. No edit to the 0012 plan.

Deferred, with the reason: market competitors in `alternatives_list` (the research export shows no measured vendor-alternative demand for these five); a `claims_get` row for any negative statement waits for the Claim Registry export and PLAN-HELLOG-0006.

## 10. Decisions owed

- **F1 (open, founder)** No hellocrm plan PR names GCash, Maya, QRIS, OVO, DANA, bKash, Nagad, LankaQR, PayHere, eSewa or Khalti; the research product drafts say "none covers this market" and point at the shared adapter #10095. This plan serves them as roadmap facts on the founder's word. Confirm that "Planned, not available" is the right wording, or attach plan PR numbers when they exist. Until then the evidence field says the plan PR is absent.
- **F2 (closed here)** The plan-limit fact uses the existing `market` kind. If the 0007 policy forbids it, that prerequisite is its own PR; this plan does not widen 0012.
- **F3 (open, blocking BUILD)** Confirm and pin to a hellocrm commit, in the locale files, that Filipino and Tamil are not available either. The founder's list names four languages; the available set is closed, so the plan treats both as unavailable and never names them as available.
- **F4 (open, blocking BUILD)** The 0012 owner adopts the automatic-versus-native wording for the twelve markets before either BUILD merges; AC-A19 enforces equality.
- **F5 (open)** Whether `/ph` language pages (`tl`) and `/bd/crm-bangla` are live, and their hreflang. PR-A lists only routes the deployed fetch confirms.

## 11. Findings outside this plan   (D-EXP-14: recorded, not fixed here)

To be linked in the PR-A body to the owning website plan before PR-A merges. None blocks the MCP, since the MCP does not repeat these claims (AC-A3).

- Website pages carrying local-currency figures (`/ph/whatsapp-crm`: PHP conversions), "GCash-friendly" and "Confirm GCash payments" copy, "UU PDP-compliant" wording on `/id/whatsapp-crm`, "PDPA" and "Individual Privacy Act" citations on `/lk` and `/np`: recorded in the research claims files for the website plans.
- The research product drafts propose Bahasa, Bangla and Nepali interfaces as new builds. They are product decisions, not MCP facts.
- The usePricing hook maps `Asia/Manila` to PHP (research claims file): a website matter.

## 12. Owners, effort and rollback

- Owners: release approver and Stripe evidence, Rushabh; smoke, the PR author; website findings (§11), the owning website plan for each market (links added to the PR-A body).
- Effort beyond code: one deployed route fetch per market (PR-A), one Stripe evidence record per market (PR-B).
- Withdrawal: an expired or revoked gate returns that market to pending without a rebuild (AC-A22); the per-market and global kill switches are the rollback, and the rollback target is the previous release tag recorded in the PR body. A calendar reminder owned by the approver re-observes each gate before its 90-day expiry.

## 13. Validation (this plan PR)

- **PASS**: plan id 0013 free: the REST PR list (all states) shows PLAN-HELLOG-0010 to 0012 as the highest, and the remote `plan/` branches stop at `hellog-0012`.
- **PASS**: `main` @ `5190a02` fetched; `docs/plans` holds no 0013 file.
- **PASS**: the five research `mcp.md` and `product.md` drafts read from branches `claude/hreflang-<cc>`; research PRs #113–#117 found via REST, each carrying its Opportunity ID.
- **PASS**: the 0012 plan file read at its branch head (open, draft).
- **UNVERIFIABLE**: live server; the deployed website; locale files in hellocrm; competitor MCP inventories.
- **BLOCKED**: Stripe flow-1 evidence per market (Rushabh); Product Truth export (#114).

## Review record

One blind second-opinion review of revision 1 (verdict: accept-with-changes, three blockers). Folded in revision 2: (1) the dependency is hard and pinned to a merge commit containing 0007, 0009 and 0012 PR-A, the fallback is gone (§0a, §2a, AC-A18); (2) language equality with 0012 is mandatory, evidence pinned to a hellocrm commit, F3 and F4 block BUILD (AC-A19); (3) the observable is narrowed to the tool contract, the assistant evaluation is advisory (§0, smoke 4). Also taken: cross-tool and serving-time expiry scenario (AC-A22), token-boundary prose scans (AC-A23), gate approval and sanitized attestation (§2a), the token-cost section replaced by owners and rollback (§12), F2 closed without widening 0012. Not taken: external SDK inventory (not obtainable from the repository; the README and CHANGELOG document the additive change) and a separate manifest (the pin in AC-A18 serves). F1 stays open and is a founder call. No second review was run.

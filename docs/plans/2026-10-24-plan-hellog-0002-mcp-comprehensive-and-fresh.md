# Plan — MCP: comprehensive, country-aware and kept true  *(rev 2 — Sol r1 REJECT folded)*

- **Plan id:** PLAN-HELLOG-0002 (allocated by `plan-id.mjs next`; the trunk read warned because the script tried `master` — this repo's trunk is `main`; `plan-id.mjs check` run after the push: one branch, no collision)
- **Branch:** plan/hellog-0002-mcp-comprehensive-and-fresh · **Repo:** MeruLocal/HelloGrowthCRMwebsite_MCP · **Trunk:** `main` (verified: `origin/main` @ `751fc29`, PR #85 merged 2026-10-23)
- **Mode:** PLAN · **Change tags:** product, customer_visible, public_api
- **Tier:** T2 — Sol, then fold, then Astra (blind). No human gate is owed by tier, but every deploy and every founder decision below is human.
- **Owed (workflow.mjs obligations):** acceptance_criteria, blast_radius, caller_inventory, chatbot_kb, compatibility_test, competitor_scan, help_content, intent, necessary_changes, premise_check, smoke_test
- **Restricted areas touched (G2):** pricing, compliance and plan-entitlement wording. This plan authors none of those values; it ties the two pricing tools to the values already decided and states which founder answer each unknown needs.
- **Freeze in force?** none recorded for this repo. `main` moved on 2026-10-15 (#83, USD $12 monthly) and 2026-10-23 (#85).
- **Date:** 2026-10-24
- **Scope:** the **website-data MCP** (public, anonymous, read-only). Not the CRM-side MCP. Not release infrastructure.
- **Relationship to PLAN-HELLOG-0001:** 0001 owns the controlled release of the price fixes (its R1) and carries an **unresolved Astra REJECT on release infrastructure**. This plan is **content and coverage only**: it contains no build, deploy, promotion or rollback design and MUST NOT be read as a way around 0001's gate. Whatever reaches production does so through 0001's release path, which is human.

## 0. Intent
- **Claim** — The public MCP tells an AI assistant about 58 hand-written features (file last edited 2026-06-19) and 20 generic industry pages, while the product has 410 registered screens, 52 industry verticals and 28 website country markets. Assistants cannot find or correctly describe HelloGrowthCRM for most of what it does, and part of what it says is wrong (INR 1,099, "Unlimited users", Free tasks 500, USD $13).
- **Mechanism** — Serve a **verified capability catalogue** in which **an entry is published only after a recorded per-entry founder decision** (default closed), plus per-vertical module lists generated from the product's own inventory and country-aware pricing wording; add a **check that runs against the complete served responses** so the new content cannot regress into banned or structurally unsafe claims. Four draft PRs implement a first slice (#94 Free tasks value, #95 catalogue, #96 industry tools, #97 market scope); this plan governs them and **changes #95 to default-closed** (§0a).
- **Observable** — `features_list` returns the original 58 entries plus only those catalogue entries the founder approved, says when each was verified, and never omits the `availability` field; `industries_get_modules` returns the screens of any of the 52 verticals; `pricing_get_plans` and `pricing_get_country_plans` agree with each other and state that pricing is country-aware; no entry presents a gated, off-by-default, industry-only, plan-unconfirmed or planned-only capability as generally available.
- **Risk** — A public machine-readable surface is repeated verbatim by AI assistants. Over-claiming (a feature that is super-admin-only, industry-only, TEST-only or not built) is worse than silence. Mitigations: default-closed publication, `availability_note` + `limitations` on every entry, structural and banned-claim checks on the served output, planned-not-built items excluded, founder decisions before any entry is served.

## 0a. Necessary changes
Already built as drafts (this plan governs them; none may be marked ready before the plan's review is final):
- [ ] `src/tools/features.ts` — catalogue merged into `features_list` / `features_get` (PR #95); Free task allowance 500 → 100 (PR #94); **rev 2:** `availability` always present (`null` per tier = unknown, distinct from `false`), `entitlement_unconfirmed` list returned when a `plan` filter is used, only `decision` ≠ `pending` entries served, `catalogue.verified_at` per response
- [ ] `src/tools/__tests__/features-pricing-consistency.test.ts` — Free tasks agree with `pricing_get_plans` (PR #94)
- [ ] `src/data/capability-catalogue.ts` — 46 entries (PR #95); **rev 2:** each entry gains `decision` (`pending` | `approved` | `on_request`), `decided_on`, and `evidence` (product repo paths + whether the path is on `app`); all 46 start `pending`
- [ ] `src/tools/__tests__/capability-catalogue.test.ts` — honest-limit tests (PR #95); **rev 2:** pending entries are not served; null `availability`
- [ ] `src/data/industry-modules.ts`, `src/tools/industry-modules.ts`, `src/tools/index.ts`, `src/tools/annotations.ts`, `src/tools/__tests__/industry-modules.test.ts` — PR #96 as built
- [ ] `src/tools/pricing.ts` — `market_scope`, global ladder not labelled US-only (PR #97, stacked on #91); **rev 2:** `market_scope` USD numbers derive from the same constant as the global plan and the USA country row
- [ ] `src/tools/__tests__/pricing-country-aware.test.ts` — PR #97; **rev 2:** asserts `pricing_get_plans` global Growth monthly == `pricing_get_country_plans` USA monthly == the number in `market_scope`

Still to build under this plan (smallest first):
- [ ] `scripts/check-served.mjs` (new) + `package.json` — `check:served` wired into `verify`: starts the tools in-process, calls `features_list` (all categories), `features_get` for every slug, `industries_list_modules`, `industries_get_modules` for every key, `pricing_*`, `countries_list`, and scans **every returned string** for banned phrases (`Unlimited users`, `SOC 2`, `WhatsApp-first`, `WhatsApp-native`, `₹1,099`); verifies every served catalogue entry has a non-empty `limitations`, `availability_note`, `evidence` and a non-`pending` `decision`; verifies `availability` is present on every entry; enforces the size ceiling and freshness thresholds (§6). It proves only those properties — it does **not** prove the absence of other over-claims (§8)
- [ ] `README.md` — add `industries_list_modules` and `industries_get_modules` to the tool catalog and correct the tool counts (the table omits them; PR #96 is incomplete without this)
- [ ] `CHANGELOG.md` — one entry listing the additive changes and the eight new `category` enum values
- [ ] `docs/plans/2026-10-24-plan-hellog-0002-mcp-comprehensive-and-fresh.md` — this plan
- **Removed in rev 2 (Sol):** the tracker-row change — registry submission is deferred (§9, R-g)

## 0b. What we already know   (G4 · the learning brief)
`lessons.mjs brief --repo … --topic mcp` ran: 1 unrelated lesson (YouTube field resets), no MCP lesson. A failed read: none.
| Source | What it said | What this plan does about it |
|---|---|---|
| PLAN-HELLOG-0001 (#60), rev 4 | Four REJECTs: Sol once, Astra three times, all on **release infrastructure**. "Ship the content fix as a separate small plan." | This plan contains no release design. Deploys go through 0001's R1. |
| 0001 register F1–F6 | Free "200 leads" in `alternatives.ts`; integrations 630; no `instructions`; "WhatsApp-first"; transport PRs; public-only inputs | Not duplicated; they stay in 0001's register. |
| merged #83 (2026-10-15) | USD Growth monthly $12 on `main` | `origin/main` has $12 in both `pricing_get_plans` and the USA country row; the **live server still serves $13** (deploy drift, 0001's concern). Rev 2 ties the two tools together in a test. |
| open #50/#57/#91 | INR 899 + GST, drop "Unlimited users", SOC 2 wording; they overlap | #97 is stacked on #91; which lands is a human call (Q5). |
| open #81 / #78 / #92 / #80 / #93 | truthful integrations + paging + instructions; freshness on `/health`; tool titles; output schemas; discovery | Not duplicated. #81 owns paging; the size ceiling here is independent of it. |
| `docs/plans/DEV_HANDOFF_2026-09-05.md`, roadmap #38–#45 | owning tickets (#40 truth pipeline, #43 distribution) | the check maps to #40; registry work stays #43. |
| Sol and Astra coverage review (2026-10-24) | Per-entry gating, limitations, evidence and a freshness stamp; generate from the inventory later | Done here except generation (registered, R-a). |
| **Sol r1 on this plan (REJECT)** | (1) Free cap ownership; (2) path-on-`app` is not PROD enablement; (3) missing `availability` is not "additive"; (4) the check overclaims; (5) country-plans never reconciled; plus freshness, size, category enum, deployed-contract comparison, tracker rows, "smallest shippable" | Folded in this revision — see §10. |
| memory | master→TEST, `app`→PROD; "built on master" is not "live" | §1 row 6, Q0. |

## 1. Premise   (G8 — evidence by claim type)
Measured 2026-10-24.
| # | Claim | Type | Evidence gathered | Running system? |
|---|---|---|---|---|
| 1 | The live MCP serves 58 features, 20 industries, 8 countries, and wrong prices | documentation | live `tools/call`: `features_list` total 58; `content_list_industries` count 20; `countries_list` count 8; `pricing_get_plans` india Growth monthly "₹1,099" + "Unlimited users"; `pricing_get_country_plans` USA "$13/user/mo monthly"; `git log origin/main -- src/tools/features.ts` = one commit, 2026-06-19 | **yes — live endpoint** |
| 2 | The product has far more than the MCP serves | missing_feature | hellocrm `FEATURE_INVENTORY.md` @ `5680f9f0a6`: 410 registered views, 660 modules, 52 verticals; 11 read-only code-verification agents on `origin/master` each citing files; Opus, Fable, Sonnet and Haiku swept flags/cron jobs, 462 edge functions, 1,576 tables, 410 views | not required (code) |
| 3 | The website has more than the MCP | documentation | live sitemap index: 9 child sitemaps; 760 `/features` URLs; 441 unique `/industries/<niche>` pages × 8 hubs; 28 country prefixes (MCP: 8) | yes (live sitemap) |
| 4 | Several capabilities are gated, off by default, industry-only or not built | missing_feature | per-capability code reads (workbook *Verified_Capabilities*, column "What it does NOT do"): Field Sales = `agri_inputs` industry only; HR/payroll = `recruitment` industry; Notes = super-admin flag off; no recorded-call speech-to-text; no Instagram auto-reply; no scheduled reports; no invoice or quote API endpoints; vendor portal = PRD only | not required (code) |
| 5 | Neither HubSpot nor Zoho CRM publishes an anonymous vendor-knowledge MCP | documentation | Anthropic WebSearch agents: both are OAuth customer-data MCPs; vendor product/pricing/industry/country tool NOT FOUND. Astra: HubSpot publishes a Product & Services Catalog and Zoho an edition comparison as **web pages**; anonymous-MCP equivalent NOT KNOWN | yes (live docs) |
| 6 | **Code on `app` is necessary, not sufficient, evidence that a capability is available** | documentation | 14 sampled paths exist on `origin/app` (PROD branch). **Not checked, and unreachable from here:** migrations applied in PROD, feature flags set, tenant visibility, plan entitlement. Sol r1: path existence does not establish enablement | **PROD runtime not reachable → "available in production" is UNVERIFIABLE by this plan; resolved only by a recorded founder decision per entry (Q0/Q1)** |
| 7 | `features.ts` has no other consumer | documentation | `grep` of `src` and `scripts`: only `src/tools/index.ts` registers it; `generate_llms_txt` reads `website-mirror.ts` | no |
| 8 | The value 100 for Free tasks is already served and defined elsewhere | documentation | `pricing_get_plans` serves `limits.tasks: 100` for both regions; hellocrm Free caps are migration-defined (`20260804113254`: 150 leads / 100 tasks / 20 accounts) | yes (live `pricing_get_plans`) |
If any row is false at the head a build starts on, that build stops with Report B.

## 2. What changes
Additive content surfaces plus one guard: (1) the capability catalogue, **default-closed** — an entry is served only after a recorded decision (`approved` or `on_request`); (2) two industry tools; (3) a `market_scope` block and un-US-ified wording in pricing, with the two pricing tools tied together by test; (4) `check:served`, which runs over the complete served responses; (5) README catalog and CHANGELOG. **The smallest shippable version is: the mechanism (decision gate, `availability: null` contract, `check:served`) plus only the entries the founder has approved at that moment — possibly none.** Shipping all 46 is not assumed and is not the goal until Q0/Q1/Q3 are answered. Nothing is removed; no existing tool name, schema property or original entry changes.

## 3. Affected files
| Area | Files | Why |
|---|---|---|
| Features | `src/tools/features.ts`, `src/data/capability-catalogue.ts` | catalogue, decision gate, `availability` contract, `entitlement_unconfirmed` |
| Industries | `src/data/industry-modules.ts`, `src/tools/industry-modules.ts`, `src/tools/index.ts`, `src/tools/annotations.ts` | two read-only tools |
| Pricing | `src/tools/pricing.ts` | `market_scope`, wording, single source for the USD number |
| Guard | `scripts/check-served.mjs`, `package.json` | scan complete served responses |
| Docs | `README.md`, `CHANGELOG.md` | tool catalog, additive-change record |
| Tests | the test files in §0a | one per acceptance criterion |

## 5. Blast radius
- **Backward** — AI clients calling `features_list` / `features_get`: the `category` enum gains eight values (old values still valid — **a consumer that exhaustively switches on the old enum could break; recorded in the CHANGELOG, AC-14**); responses gain `catalogue`, `availability_note`, `limitations`, `verified_at`, `entitlement_unconfirmed`. **`availability` stays present on every entry.** For catalogue entries it is `{free:null, t1:null, t2:null, t3:null}`, where `null` means *entitlement unknown*, distinct from `false` (*not available*). The legacy `free/t1/t2/t3` flags describe managed-service packages, not CRM plans, which is why a catalogue entry cannot honestly fill them.
- **Plan filter contract** — `plan: "free"` returns confirmed matches in `features` (legacy entries whose flag is truthy) **and** lists catalogue entries whose entitlement is unknown in a separate `entitlement_unconfirmed` array with a count, so no client is silently handed an incomplete catalogue and none is told an unconfirmed feature is on Free.
- **Forward** — the server reads two more static data files (no network, database or new dependency).
- **Sideways** — website pages and chatbot sources untouched; vertical MCP repos untouched. `/.well-known/mcp.json` and `/version` compute tool counts from the registry, so they move from 76 to 78 anonymous tools on their own.

### 5a. Caller inventory
| Caller | Uses | Still gets what it expects? |
|---|---|---|
| AI assistants connected to `mcp.hellogrowthcrm.com` | `features_list`, `features_get`, `pricing_get_plans`, `pricing_get_country_plans` | yes for every pre-existing field; `availability` present on every entry; new fields additive; enum caveat above |
| `scripts/audit-live-mcp.mjs` | `tools/list` count, annotations on every tool | yes — the two new tools carry all four hints (annotations test) |
| `generate_llms_txt` / `check_llms_txt` | `website-mirror.ts` | unaffected (§1 row 7) |
| `/.well-known/mcp.json`, `/version` | registry counts | follow automatically |
| README tool table | hand-written | stale until the README item lands (AC-08) |
| Directory listings | none — nothing is listed | n/a |
| Weekly `weekly-mcp-audit` task | `audit-live-mcp.mjs` | yes; baseline becomes 78 anonymous tools |

## 6. Acceptance criteria
- **AC-01** — A `features_list` (category all, plan all) on the candidate returns the original 58 entries plus exactly the catalogue entries whose `decision` is `approved` or `on_request`; `catalogue.verified_at` is present; every served catalogue entry has `availability_note`, a non-empty `limitations` array and `evidence`.
- **AC-02** — NEGATIVE: `check:served`, run over the **complete served responses** (list of all categories, `features_get` for every slug, both industry tools for every key, `pricing_*`, `countries_list`), finds no occurrence of `Unlimited users`, `SOC 2`, `WhatsApp-first`, `WhatsApp-native` or `₹1,099`. This criterion claims only what the scan proves; it does not claim absence of other over-claims (§8, human review of each entry's decision).
- **AC-03** — REGRESSION: the original 58 entries are byte-identical in slug, title, summary, bullets and `availability`; `tools/list` differs from the candidate-parent baseline only by the two added tools; every other tool's name, schema and annotations are unchanged.
- **AC-04** — `industries_list_modules` returns 52 verticals (28 dedicated, 16 alias, 8 configuration-only); assigned screens total 317 plus 5 cross-cutting, which with the 88 core views account for all 410 registered views.
- **AC-05** — `pricing_get_plans` (global) Growth `price_monthly` equals `pricing_get_country_plans` USA `growthPriceMonthly` equals the USD number stated in `market_scope.outside_india` (all USD 12 per user per month), and the INR number in `market_scope.india` equals the India country row's number; the global plans' `best_for` does not say "US". The test fails if any of the three diverge.
- **AC-06** — Every catalogue entry served by `features_list` and `features_get` has an `availability` object (never missing) with `null` for each unconfirmed tier; `plan: "free"` returns no catalogue entry in `features` and lists each unconfirmed one in `entitlement_unconfirmed` with a matching count; no catalogue entry is ever reported as available on a tier unless the founder decision file says so.
- **AC-07** — NEGATIVE: `npm run check:served` exits non-zero when a banned phrase, a missing `limitations`/`evidence`/`availability_note`, a `pending` entry that is served, a missing `availability`, an over-size response or an expired freshness window is planted in a scratch copy, and exits zero on the real data.
- **AC-08** — `README.md` lists `industries_list_modules` and `industries_get_modules`, and its stated tool counts equal `/version` `tools_total` on the candidate.
- **AC-09** — NEGATIVE: an entry with `decision: "pending"` is **not** returned by `features_list` or `features_get`, and `features_get` for its slug returns the same not-found error as an unknown slug. Every served entry has a `decided_on` date and an `evidence` list recording, per path, whether it exists on `origin/app`; the decision itself (not the path) is the publication gate.
- **AC-10** — NEGATIVE: no step in this plan deploys, publishes to npm or a registry, merges, or changes production; the live `/version` is unchanged by this plan's PRs until a human releases through 0001's path.
- **AC-11** — Q0, Q1 and Q3 are answered in writing and translated into per-entry `decision` values before any of #95/#96/#97 is marked ready for review; entries without a decision remain `pending`.
- **AC-12** — The complete `features_list` response (all categories) is ≤ 64,000 characters on the candidate (measured today: 29,831 before; ≈ 50,500 with all 46 entries); `features_get` for any entry ≤ 3,000; `industries_get_modules` ≤ 4,000. If a limit is exceeded the build fails; the response strategy is to narrow by category/search (existing parameters), and paging is #81's.
- **AC-13** — Freshness: `check:served` **warns** when any served entry's `decided_on`/`verified_at` is older than 45 days and **fails** when older than 90 (defaults, founder-changeable), so the stamp cannot silently outlive the code it describes.
- **AC-14** — `CHANGELOG.md` lists the eight added `category` values, the new fields and the two tools; the entry is checked by `check:served`.
- **AC-15** — A **drift report** (evidence, not a gate) compares the candidate's `tools/list` and the four pricing/features outputs with the **live** server and records every difference, so drift between `main` and the deployed artifact is visible and attributed to 0001's release rather than to this plan.

## 7b. Smoke test — Expected only
Env: local `npm run dev` on the candidate head (HTTP, port per `README`) · client: `node scripts/audit-live-mcp.mjs http://localhost:<port>` and the `curl` handshake from the audit skill · no login · role: anonymous.
| # | Action | Expected |
|---|---|---|
| 1 ⭐ | `tools/list` | 78 tools; includes `industries_list_modules` and `industries_get_modules`; every tool has the four annotation hints **(new: +2)** |
| 2 ⭐ | `features_list` with `category` "Calling & AI Voice" after the founder approves the 7 calling entries | `total` 7; each has `availability_note`, `limitations`, and `availability` `{free:null,t1:null,t2:null,t3:null}` **(new)** |
| 3 | `features_get` slug `ticketing-sla` once approved | `limitations` contains "No round-robin or automatic assignment of tickets" **(new)** |
| 4 NEGATIVE ⭐ | `features_get` slug of a `pending` entry | the same error text as an unknown slug **(new)** |
| 5 ⭐ | `industries_get_modules` industry "Doctors / Clinic" | `key` "doctors_clinic", 10 screens, `not_built` contains "No treatment-plan module" **(new)** |
| 6 | `industries_get_modules` industry "cloud_kitchen" | `kind` "alias", `reuses.key` "restaurant_fnb" **(new)** |
| 7 ⭐ | `pricing_get_plans` region global and `pricing_get_country_plans` country "usa" | both show USD 12 per user per month; `market_scope.outside_india` contains "USD 12 per user per month" **(new wording)** |
| 8 NEGATIVE | `features_list` with `plan` "free" | `features` has no catalogue entry; `entitlement_unconfirmed.count` equals the number of approved catalogue entries **(new)** |
| 9 NEGATIVE | `industries_get_modules` industry "zzz-not-an-industry" | `isError` true with a hint |
| 10 REGRESSION | `features_get` slug `dashboard` | `availability` object present with `free` true; `learnMoreUrl` "https://hellogrowthcrm.com/product/crm-dialer" (`features.ts` Dashboard entry) |
| 11 | `npm run verify` | typecheck, version parity, `check:served` and the whole suite pass |

## 7e. Competitors   (product work)
| Product | How they solve it | Source: Astra / Anthropic / live page | We are |
|---|---|---|---|
| HubSpot | Remote MCP at mcp.hubspot.com, GA 2026-04-13: OAuth 2.1 + PKCE, read/write on the customer's CRM objects, writes need explicit confirmation, tool availability varies by account and plan (AEO tools need Marketing Hub Pro/Ent; quotes need Revenue Hub Pro/Ent). **No vendor product/pricing/industry/country tool found.** A public Product & Services Catalog exists as a web page. | Anthropic WebSearch agent (developer docs, GA changelog); Astra (catalog page) | **different lane**: we are a vendor-knowledge surface, they are customer-data tooling. At par on publishing gating; potentially ahead in per-entry limits **if** our content is accurate |
| Zoho CRM | Zoho MCP / CRM MCP: pre-built servers (data insights read-only, data operations write, module customization, workflow automation), OAuth bound to the user's roles, region-specific hosts (US, IN, EU, AU, JP; others reported), free "for now". **No vendor product/pricing tool found**; an edition-comparison **web page** exists. No freshness or version signals. | Anthropic WebSearch agent; Astra (edition comparison, API docs) | **different lane**; ahead on explicit freshness and limits; behind on authenticated operational scope (by design) |
- **Where the two engines disagree:** Astra cautions that neither vendor should be described as "only customer-data tools" because each publishes vendor-knowledge **web pages**; the Anthropic agents searched for an MCP tool and found none. Both are consistent: the vendor knowledge exists on the web, not in an MCP; the live docs support that reading. Astra also notes a verified-at stamp signals claimed timing, not completeness — which is why AC-07/AC-09/AC-13 gate content, decision and age, not the stamp alone.
- **Honest position:** "ahead in structured public product disclosure", not "ahead in MCP overall"; unproven against assistant answer quality (§8).

## 7f. Compatibility test
Baseline: `tools/list` (names, `inputSchema`, annotations) and `tools/call` outputs for `features_list`, `features_get`, `pricing_get_plans`, `pricing_get_country_plans` captured from the **candidate's parent commit** and compared, nested-structure and value-type exact, with the candidate. Permitted differences: the two added tools; the new properties in §5; the eight added `category` values; `availability: null` tiers on catalogue entries; `entitlement_unconfirmed`; `market_scope`; the reworded global `best_for`; the approved catalogue entries. Any other difference fails. Old-style calls (`features_list {}` with and without arguments, each of the original seven categories, `plan` "free"/"t1"/"t2"/"t3") are replayed. **Separately (AC-15), a drift report against the deployed server is recorded as evidence**, because a parent-commit baseline cannot see drift already present between `main` and production; it is not a gate and does not substitute for 0001's baseline.

## 8. Risks and edge cases
- **TEST ≠ PROD (Q0).** Code on `app` is not proof of a live feature (§1 row 6). The only gate is a recorded per-entry founder decision; entries default to `pending` and are not served.
- **Entitlement guesswork.** "Plan entitlement not confirmed" is shown as `null` tiers plus a note; it does not tell a buyer whether they can obtain the capability. The founder decision (`approved` with plan, or `on_request`) is what answers that, and an assistant may still drop the qualifier when repeating the entry — accepted, mitigated by putting the limit in the first line of `availability_note` where it exists.
- **The check proves less than the criterion title suggests.** `check:served` catches banned phrases, missing fields, pending-served, size and age. It cannot tell an availability claim from a limitation or catch a new kind of over-claim; each entry's wording is reviewed by the founder when deciding (Q1/Q3).
- **Staleness.** The catalogue is hand-maintained; AC-13 forces re-verification (warn 45 days, fail 90). The real fix (generate from the inventory in CI) is registered, not built.
- **Locale and currency.** Local-currency prices (GBP, CAD, AUD, AED, SGD, NZD) come from the 2026-08-06 mirror; USD annual ($10) is founder-unconfirmed. `market_scope` states only what the founder confirmed (India 899 + GST; USD 12 monthly; a yearly discount exists) and no USD annual figure.
- **Alias confusion.** 16 industry aliases resolve to another vertical's screens (`reuses`); a vertical with no screens says "configuration only".
- **Payload size.** Bounded by AC-12; paging is #81's.
- **Enum consumers.** Eight new `category` values can break a client that exhaustively handles the old seven; recorded in the CHANGELOG (AC-14).
- **Assistant answer quality is unmeasured.** Nothing here proves assistants recommend HelloGrowthCRM more; a before/after prompt test is registered, not built.
- **Rate limits, cost:** no new outbound calls; static data only.

## 9. What this deliberately does NOT do
- Does not touch release, deploy, promotion, rollback, npm publish or registry submission (0001 R1 and human actions). **Registry rows are not added here** (removed in rev 2).
- Does not **choose** any price, Free cap, SOC 2 or integration-count value. PR #94 copies the Free task value (100) that `pricing_get_plans` already serves and hellocrm's migration `20260804113254` defines; ownership of the value stays with the Free-plan decision (hellocrm #8114, website #1727). If that decision changes the cap, #94's test fails and forces both tools to move together.
- Does not publish **planned-only** capabilities (solar installer + AMC renewals, US accountant connectors, manufacturing e-invoice/e-way bill, vendor portal, branded vertical apps) — a public roadmap is a founder decision.
- **Register (each its own plan when unblocked):** R-a generate the catalogue and industry data from the product inventory in CI; R-b `countries_list` extended to the 20 further website markets (needs a validated market manifest from the website, per 0001 F2); R-c a trust/reviews tool (needs verified G2/Capterra figures and dates); R-d a `use_cases` tool (website has 115 `/use-cases` pages); R-e website parity — capabilities with no website page (CTWA ads tracker, Notes, voice notes, card scanner, Field Visits, Field Sales/SAP, own numbers/KYC, international calling, material tracking) and pages to check for over-claiming (call transcription, offline mode, payroll, analytics-and-reporting) → website plan; R-f the nine vertical MCPs' shared contract (freshness stamp, `get_started`, instructions, `list_markets`, trust tool, naming; KanchanFlow brand-isolation break) → one plan per repo; R-g registry submissions (60-row tracker, none submitted, npm 404, official registry 0 results; add Claude Connectors Directory and GitHub MCP Registry rows) after the content is released.
- Does not remove any existing capability, tool, field or entry (G13).

## 10. Review record
- **Reviewers selected:** Sol → Astra (second blind) — default sequence for T2; the user said "check with sol and astra as well".
| Reviewer | Plan version | Verdict | Accepted | Rejected, and why |
|---|---|---|---|---|
| Sol | rev 1 | REJECT | B1 Free-cap ownership → §1 row 8, §9 (value copied from the already-served, migration-defined cap; ownership stays with #8114/#1727). B2 path-on-`app` ≠ PROD → §1 row 6, default-closed `decision` gate, AC-09/AC-11. B3 missing `availability` ≠ additive → `availability` always present with `null` unknown, `entitlement_unconfirmed`, AC-06. B4 check overclaims → runs on complete served responses, claim narrowed, AC-02/AC-07, §8. B5 country plans → both pricing tools tied, AC-05. Risks: freshness → AC-13; size → AC-12; enum consumers → AC-14, §8. Missing: deployed-contract comparison → AC-15 (evidence), per-entry decisions → AC-09/AC-11, size limit → AC-12. Cut: tracker rows removed; "smallest shippable" restated (§2) | **Not accepted as written:** "exclude every entry that cannot be verified" — PROD runtime is unreachable from here, so *no* entry can be machine-verified; the plan instead makes publication depend on a recorded founder decision per entry and ships nothing undecided. Sol's "ONE THING" (replace path-existence with an approved per-entry decision) is adopted in full; the only difference is that the approver is the founder, because only the founder can confirm PROD enablement |
| Astra (blind) | rev 2 | pending | | |
- **Reconciliation:** Sol's five blockers are accepted in substance. The one divergence is who verifies PROD: not this plan or any script.
- **Human approval before ship:** not owed by tier; release, Q0–Q6 and the PR merges are human.
- **What left the machine (G9b):** plan text and evidence summaries only; `egress.mjs` CLEAN on every call so far (coverage review, competitor question, Sol r1). No customer data.

## 11b. Planned help content
This repo has no chatbot source. The MCP's customer-facing documentation is `README.md` (tool catalog) and the generated `llms.txt`. P3 updates the README catalog (AC-08) and the CHANGELOG (AC-14). The onboarding chatbot and website help articles are unchanged; website parity (R-e) belongs to the website plan. No existing chatbot answer goes stale, because the MCP is not a chatbot source.

## Founder questions
- **Q0** The code I read is `origin/master` (TEST); 14 sampled paths also exist on `origin/app` (PROD). Who confirms, per capability, that it is **enabled in production** for a buyer today?
- **Q1** For each of the 46 catalogue entries choose **approve (with the plan it belongs to: Free / Growth / Enterprise), on request, or exclude**. Until you decide, an entry stays `pending` and is not served. (Workbook sheet *Verified_Capabilities* is the list to mark.)
- **Q2** USD annual rate for the US and other markets (main carries $10/user/month billed annually; monthly $12 is confirmed).
- **Q3** May entries enabled only on request (own numbers, WhatsApp calling, Notes, HR modules, Field Sales) be listed publicly as "on request"?
- **Q4** Public roadmap: may planned-only items ever appear in the MCP, clearly labelled planned?
- **Q5** Which of #50 / #57 / #91 lands for the price fixes (they overlap), and who releases (0001's R1)?
- **Q6** SOC 2: four files still say "SOC 2 Type II" as fact; verify the report or soften (restricted copy; not changed here).

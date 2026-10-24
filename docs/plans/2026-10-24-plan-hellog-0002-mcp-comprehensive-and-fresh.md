# Plan — MCP: comprehensive, country-aware and kept true  *(rev 1)*

- **Plan id:** PLAN-HELLOG-0002 (allocated by `plan-id.mjs next`; the trunk read warned because the script tried `master` — this repo's trunk is `main`; `plan-id.mjs check` run after the push)
- **Branch:** plan/hellog-0002-mcp-comprehensive-and-fresh · **Repo:** MeruLocal/HelloGrowthCRMwebsite_MCP · **Trunk:** `main` (verified: `origin/main` @ `751fc29`, PR #85 merged 2026-10-23)
- **Mode:** PLAN · **Change tags:** product, customer_visible, public_api
- **Tier:** T2 — Sol, then fold, then Astra (blind). No human gate is owed by tier, but every deploy and every founder question below is human.
- **Owed (workflow.mjs obligations):** acceptance_criteria, blast_radius, caller_inventory, chatbot_kb, compatibility_test, competitor_scan, help_content, intent, necessary_changes, premise_check, smoke_test
- **Restricted areas touched (G2):** pricing, compliance and plan-entitlement wording. This plan authors none of those values. It states what the MCP may say about them and which founder answer each needs.
- **Freeze in force?** none recorded for this repo. `main` moved on 2026-10-15 (#83, USD $12 monthly) and 2026-10-23 (#85).
- **Date:** 2026-10-24
- **Scope:** the **website-data MCP** (public, anonymous, read-only). Not the CRM-side MCP. Not release infrastructure — see §0b.
- **Relationship to PLAN-HELLOG-0001:** 0001 owns the controlled release of the price fixes (its R1) and carries an **unresolved Astra REJECT on release infrastructure**. This plan is deliberately **content and coverage only**: it contains no build, deploy, promotion or rollback design, and it MUST NOT be read as a way around 0001's gate. Anything here that reaches production does so through 0001's release path, which is human.

## 0. Intent
- **Claim** — The public MCP tells an AI assistant about 58 hand-written features (file last edited 2026-06-19) and 20 generic industry pages, while the product has 410 registered screens, 52 industry verticals and sells in 28 country markets. Assistants therefore cannot find or correctly describe HelloGrowthCRM for most of what it does, and the little it says is partly wrong (INR 1,099, "Unlimited users", Free tasks 500).
- **Mechanism** — Serve a **verified capability catalogue** (each entry says how a buyer gets it and what it does NOT do, with a verified-at stamp), **per-vertical module lists** generated from the product's own inventory, and **country-aware pricing wording**; add a check that keeps the catalogue honest (no banned claims, no entry without limits and evidence). Four draft PRs already implement the first slice (#94 Free tasks 100, #95 catalogue of 46, #96 industry tools, #97 market scope); this plan governs them and defines the rest.
- **Observable** — `features_list` returns 104 entries (58 existing + 46 verified) and says when it was verified; `industries_get_modules` returns the screens of any of the 52 verticals; `pricing_get_plans` states that pricing is country-aware (India INR, elsewhere USD or local currency); no entry presents a gated, off-by-default, plan-unconfirmed or planned-only capability as generally available.
- **Risk** — A public machine-readable surface is repeated verbatim by AI assistants. Over-claiming (a feature that is super-admin-only, industry-only, TEST-only or not built) is worse than silence. Mitigations: `availability_note` + `limitations` on every entry, banned-claim tests, planned-not-built items excluded, founder questions answered before merge.

## 0a. Necessary changes
Already built as drafts (this plan governs them; none may merge before its review is final):
- [ ] `src/tools/features.ts` — Free task allowance 500 → 100 (PR #94); catalogue merged into `features_list` / `features_get`, 8 new categories, `catalogue.verified_at` (PR #95)
- [ ] `src/tools/__tests__/features-pricing-consistency.test.ts` — Free tasks agree with `pricing_get_plans` (PR #94)
- [ ] `src/data/capability-catalogue.ts` — 46 verified entries (PR #95)
- [ ] `src/tools/__tests__/capability-catalogue.test.ts` — honest-limit and banned-claim tests (PR #95)
- [ ] `src/data/industry-modules.ts` — 52 verticals, 317 screens assigned + 5 cross-cutting (PR #96)
- [ ] `src/tools/industry-modules.ts` — `industries_list_modules`, `industries_get_modules` (PR #96)
- [ ] `src/tools/index.ts`, `src/tools/annotations.ts` — register the two tools, read-only closed-world (PR #96)
- [ ] `src/tools/__tests__/industry-modules.test.ts` — 52 / 317 / 5 split and alias integrity (PR #96)
- [ ] `src/tools/pricing.ts` — `market_scope`, global ladder not labelled US-only, descriptions (PR #97, stacked on #91)
- [ ] `src/tools/__tests__/pricing-country-aware.test.ts` (PR #97)

Still to build under this plan (smallest first):
- [ ] `README.md` — add `industries_list_modules` and `industries_get_modules` to the tool catalog and correct the tool counts (the catalog table does not list them yet; PR #96 is incomplete without this)
- [ ] `scripts/check-catalogue.mjs` (new) + `package.json` — `check:catalogue` wired into `verify`: every catalogue and industry entry has non-empty `limitations`/`availability_note` (catalogue) or `kind` (industries); none contains a banned phrase (`Unlimited users`, `SOC 2`, `WhatsApp-first`, `WhatsApp-native`, `₹1,099`); none names a planned-only capability as available
- [ ] `src/data/capability-catalogue.ts` — add an `evidence` field (product repo paths) to every entry; the check requires it
- [ ] `hellogrowthcrm_mcp_submission_tracker.csv` — add two rows: Claude Connectors Directory and GitHub MCP Registry (both missing)
- [ ] `docs/plans/2026-10-24-plan-hellog-0002-mcp-comprehensive-and-fresh.md` — this plan

Register only, NOT built here (each becomes its own plan once unblocked): see §9.

## 0b. What we already know   (G4 · the learning brief)
`lessons.mjs brief --repo … --topic mcp` ran: 1 unrelated lesson (YouTube field resets), no MCP lesson. A failed read: none.
| Source | What it said | What this plan does about it |
|---|---|---|
| PLAN-HELLOG-0001 (#60), rev 4 | Four REJECTs: Sol once, Astra three times, all on **release infrastructure** (attested digests, promotion path, rollback). "Do not build; ship the content fix as a separate small plan." | This plan contains no release design at all. Deploys go through 0001's R1. |
| 0001 register F1–F6 | Free "200 leads" in `alternatives.ts`; integrations 630; no `instructions`; "WhatsApp-first" wording; transport PRs; public-only inputs | Not duplicated. F1/F2/F3/F4 stay in 0001's register. This plan adds coverage items they do not own. |
| merged #83 (2026-10-15) | USD Growth monthly $12 on `main` | `origin/main` already carries $12; the **live server still serves $13** (deploy behind main). PR #97 pins $12 in a test. |
| open #50/#57/#91 | INR 899 + GST, drop "Unlimited users", SOC 2 wording; they overlap | #97 is stacked on #91. Which of the three lands is a human call (§Founder questions). |
| open #81 / #78 / #92 / #80 / #93 | truthful integrations + paging + instructions; freshness on `/health`; tool titles; output schemas; discovery | Not duplicated. #92 (titles) is a prerequisite for the Claude Connectors Directory. |
| `docs/plans/DEV_HANDOFF_2026-09-05.md`, roadmap #38–#45 | owning tickets for phased MCP work (#40 truth pipeline, #43 distribution) | WP2 maps to #40; the tracker rows map to #43. |
| Sol and Astra coverage review (2026-10-24) | A single hand-written array cannot stay comprehensive and honest; ask for per-entry gating, limitations, evidence and a freshness stamp; generate from the inventory later | WP1/WP2 do the first three; "generate from inventory in CI" is registered (§9), not built here. |
| memory | master→TEST, `app`→PROD; "built on master" is not "live" | §1 row 6 and Q0. |

## 1. Premise   (G8 — evidence by claim type)
Measured 2026-10-24.
| # | Claim | Type | Evidence gathered | Running system? |
|---|---|---|---|---|
| 1 | The live MCP serves 58 features, 20 industries, 8 countries, and wrong prices | documentation | live `tools/call` of `features_list` (total 58), `content_list_industries` (count 20), `countries_list` (count 8), `pricing_get_plans` region india (Growth monthly "₹1,099", "Unlimited users"), `pricing_get_country_plans` (USA "$13/user/mo monthly"); `git log origin/main -- src/tools/features.ts` = one commit, 2026-06-19 | **yes — live endpoint** |
| 2 | The product has far more than the MCP serves | missing_feature | hellocrm `FEATURE_INVENTORY.md` @ `5680f9f0a6`: 410 registered views, 660 modules, 52 verticals; 11 read-only code-verification agents on `origin/master` (2026-10-24) each citing files; Opus, Fable, Sonnet and Haiku swept flags/cron jobs, 462 edge functions, 1,576 tables and the 410 views | not required (code) |
| 3 | The website has more than the MCP | documentation | live sitemap index: 9 child sitemaps; 760 `/features` URLs; 441 unique `/industries/<niche>` pages × 8 hubs; 28 country prefixes (MCP: 8) | yes (live sitemap) |
| 4 | Several capabilities the MCP could claim are gated, off by default, industry-only or not built | missing_feature | per-capability code reads (see the workbook sheet *Verified_Capabilities*, column "What it does NOT do"): Field Sales = `agri_inputs` industry only; HR/payroll = `recruitment` industry; Notes = super-admin flag off; no recorded-call speech-to-text; no Instagram auto-reply; no scheduled reports; no invoice or quote API endpoints; vendor portal = PRD only | not required (code) |
| 5 | Neither HubSpot nor Zoho CRM publishes an anonymous vendor-knowledge MCP | documentation | Anthropic WebSearch agents (one per vendor): HubSpot remote MCP and Zoho MCP are OAuth, customer-data tools; "product/pricing/industry/country information about the vendor itself: NOT FOUND". Astra: HubSpot publishes a Product & Services Catalog and Zoho an edition comparison as **web pages**, anonymous-MCP equivalent **NOT KNOWN** | yes (live docs) |
| 6 | The features exist in production code, not only on `master` (TEST) | documentation | 14 sampled paths (field-sales workspace, notes, Meta Ads page, Google Ads conversion function, sandbox manager, chat widget, material tracking, payroll calc, service worker, portal login, territories, lead finder, scheduler, commission dashboard) all present on `origin/app` (PROD branch). **Not checked:** migrations applied, flags set, tenant data | code only; **PROD runtime not reachable → UNVERIFIABLE for "live in production"** |
| 7 | The MCP repo's `features.ts` has no other consumer | documentation | `grep` of `src` and `scripts`: only `src/tools/index.ts` registers it; `generate_llms_txt` reads `website-mirror.ts`, not `features.ts` | no |
If any row is false at the head a build starts on, that build stops with Report B.

## 2. What changes
Three additive content surfaces, plus one guard and two doc fixes: (1) the verified capability catalogue inside `features_list`/`features_get`, (2) two industry tools, (3) a `market_scope` block and un-US-ified wording in pricing, (4) `check:catalogue` so the new content cannot regress into over-claiming, (5) README tool catalog and tool counts, (6) two tracker rows. The smallest shippable version is PRs #94 + #95 + the `check:catalogue` guard; #96 and #97 follow. Nothing is removed and no existing tool name, schema property or the original 58 entries change.

## 3. Affected files
| Area | Files | Why |
|---|---|---|
| Features | `src/tools/features.ts`, `src/data/capability-catalogue.ts` | catalogue + category enum + verified stamp |
| Industries | `src/data/industry-modules.ts`, `src/tools/industry-modules.ts`, `src/tools/index.ts`, `src/tools/annotations.ts` | two read-only tools |
| Pricing | `src/tools/pricing.ts` | `market_scope`, wording |
| Guard | `scripts/check-catalogue.mjs`, `package.json` | fail the build on banned claims or missing limits/evidence |
| Docs | `README.md`, `hellogrowthcrm_mcp_submission_tracker.csv` | tool catalog; missing directories |
| Tests | the four test files in §0a | one per acceptance criterion |

## 5. Blast radius
- **Backward** — AI clients calling `features_list` / `features_get`: the `category` enum gains eight values (old values still valid); responses gain `catalogue`, `availability_note`, `limitations`, `verified_at`; catalogue entries omit `availability` (the legacy `free/t1/t2/t3` flags describe managed-service packages, not CRM plans) and are excluded from `plan` filtering. A client that reads `availability.free` on every entry would see it missing on the 46 new ones — see AC-06.
- **Forward** — the server now reads two more static data files (no network, no database, no new dependency).
- **Sideways** — the website repo's pages and chatbot sources are untouched; the vertical MCP repos are untouched (register only). `/.well-known/mcp.json` and `/version` compute tool counts from the registry, so they move from 76 to 78 anonymous tools on their own.

### 5a. Caller inventory
| Caller | Uses | Still gets what it expects? |
|---|---|---|
| AI assistants connected to `mcp.hellogrowthcrm.com` | `features_list`, `features_get`, `pricing_get_plans`, `pricing_get_country_plans` | yes for every pre-existing field; new fields are additive |
| `scripts/audit-live-mcp.mjs` | `tools/list` count, annotations on every tool | yes — PR #96's two tools carry all four annotation hints (annotations test) |
| `generate_llms_txt` / `check_llms_txt` | `website-mirror.ts` | unaffected (verified, §1 row 7) |
| `/.well-known/mcp.json`, `/version` | registry counts | follow automatically; `well-known.test.ts` passes literal counts as input only |
| README tool table | hand-written | **stale until WP "README" lands** (lists 88 total, omits the two new tools) |
| Directory listings (Smithery, Glama, registries) | none yet — nothing is listed | n/a |
| Weekly `weekly-mcp-audit` task | `audit-live-mcp.mjs` | yes; baseline becomes 78 anonymous tools, 0 fail |

## 6. Acceptance criteria
- **AC-01** — On the release candidate, `features_list` (category all, plan all) returns `total` 104 (58 + 46), `catalogue.verified_at` "2026-10-24", and every entry that has `availability_note` also has a `limitations` array.
- **AC-02** — NEGATIVE: no served string in the catalogue, the industry data or `market_scope` contains `Unlimited users`, `SOC 2`, `WhatsApp-first`, `WhatsApp-native` or `₹1,099`; and none of the planned-only capabilities (solar installer industry, vendor portal, e-invoice / e-way bill, US accountant connectors) is presented as available.
- **AC-03** — REGRESSION: the original 58 entries are byte-identical in slug, title, summary, bullets and `availability`; `tools/list` differs from the pre-change baseline only by the two added tools (names, schemas and annotations of all others unchanged).
- **AC-04** — `industries_list_modules` returns 52 verticals (28 dedicated, 16 alias, 8 configuration-only); assigned screens total 317 with 5 cross-cutting, and with the 88 core views they account for all 410 registered views.
- **AC-05** — `pricing_get_plans` (region both, global, india) returns `market_scope` whose `outside_india` text says "USD 12 per user per month" and whose `india` text says "INR 899"; the global plans' `best_for` does not say "US".
- **AC-06** — A `features_list` call with `plan: "free"` returns only entries that have a legacy `availability` object (no catalogue entry), and `features_get` on a catalogue entry returns `availability_note` instead of `availability`.
- **AC-07** — NEGATIVE: `npm run check:catalogue` exits non-zero when a banned phrase, a missing `limitations`, a missing `evidence` or a missing `kind` is planted in a scratch copy, and zero on the real data.
- **AC-08** — `README.md` lists `industries_list_modules` and `industries_get_modules`, and its stated tool counts equal `/version` `tools_total` on the candidate.
- **AC-09** — Every catalogue entry's `evidence` paths exist on hellocrm `origin/app` or the entry says `master only`; checked at P4 with `git ls-tree` on the sampled and listed paths, recorded per entry.
- **AC-10** — NEGATIVE: no step in this plan deploys, publishes to npm or a registry, merges, or changes production; `curl /version` on the live endpoint is unchanged by the plan's PRs until a human releases through 0001's path.
- **AC-11** — Q0 (is the catalogue about TEST or PROD?) and Q1–Q3 below are answered in writing before any of #95/#96/#97 is marked ready for review.

## 7b. Smoke test — Expected only
Env: local `npm run dev` on the candidate head (HTTP, port per `README`) · client: `node scripts/audit-live-mcp.mjs http://localhost:<port>` and `curl` handshake from the audit skill · no login · role: anonymous.
| # | Action | Expected |
|---|---|---|
| 1 ⭐ | `tools/list` | 78 tools; includes `industries_list_modules` and `industries_get_modules`; every tool has the four annotation hints **(new: +2)** |
| 2 ⭐ | `features_list` with `category` "Calling & AI Voice" | `total` 7 and each entry has `availability_note` **(new)** |
| 3 | `features_get` slug `ticketing-sla` | `limitations` contains "No round-robin or automatic assignment of tickets" **(new)** |
| 4 ⭐ | `industries_get_modules` industry "Doctors / Clinic" | `key` "doctors_clinic", 10 screens, `not_built` contains "No treatment-plan module" **(new)** |
| 5 | `industries_get_modules` industry "cloud_kitchen" | `kind` "alias", `reuses.key` "restaurant_fnb" **(new)** |
| 6 ⭐ | `pricing_get_plans` region both | `market_scope.outside_india` contains "USD 12 per user per month"; global Growth `price_monthly` "$12/user/month" **(new wording)** |
| 7 NEGATIVE | `features_list` with `plan` "free" | no entry has `availability_note` |
| 8 NEGATIVE | `industries_get_modules` industry "zzz-not-an-industry" | `isError` true with a hint |
| 9 REGRESSION | `features_get` slug `dashboard` | `availability` object present with `free` true; `learnMoreUrl` "https://hellogrowthcrm.com/product/crm-dialer" (`features.ts` Dashboard entry) |
| 10 | `npm run verify` | typecheck, version parity, `check:catalogue` and the whole suite pass |

## 7e. Competitors   (product work)
| Product | How they solve it | Source: Astra / Anthropic / live page | We are |
|---|---|---|---|
| HubSpot | Remote MCP at mcp.hubspot.com, GA 2026-04-13: OAuth 2.1 + PKCE, read/write on the customer's CRM objects, writes need explicit confirmation, tool availability varies by account and plan (AEO tools need Marketing Hub Pro/Ent; quotes need Revenue Hub Pro/Ent). **No vendor product/pricing/industry/country tool found.** A public Product & Services Catalog exists as a web page. | Anthropic WebSearch agent (developer docs, GA changelog); Astra (catalog page) | **different lane**: we are a vendor-knowledge surface; they are customer-data tooling. At par on publishing gating; ahead in per-entry limits and industry depth **if** our content is accurate |
| Zoho CRM | Zoho MCP / CRM MCP: pre-built servers (data insights read-only, data operations write, module customization, workflow automation), OAuth bound to the user's roles, region-specific hosts (US, IN, EU, AU, JP; others reported), free "for now". **No vendor product/pricing tool found**; an edition-comparison **web page** exists. No freshness or version signals. | Anthropic WebSearch agent; Astra (edition comparison, API docs) | **different lane**; ahead on explicit freshness and limits; behind on authenticated operational scope (by design) |
- **Where the two engines disagree:** Astra cautions that neither vendor should be described as "only customer-data tools" because each publishes vendor-knowledge **web pages**; the Anthropic agents searched for an MCP tool and found none. Both are consistent: the vendor knowledge exists on the web, not in an MCP. The live docs support that reading. Astra also notes a verified-at stamp signals claimed timing, not completeness — which is why AC-07 and AC-09 check content and evidence, not the stamp.
- **Honest position:** "ahead in structured public product disclosure", not "ahead in MCP overall"; unproven against assistant answer quality (see §8).

## 7f. Compatibility test
Baseline: `tools/list` (names, `inputSchema`, annotations) and `tools/call` outputs for `features_list`, `features_get`, `pricing_get_plans`, `pricing_get_country_plans` captured from the **candidate's parent commit** and compared, nested-structure and value-type exact, with the candidate. Permitted differences: the two added tools; new properties listed in §5; the eight added `category` enum values; `market_scope`; the reworded global `best_for`; the 46 new entries. Any other difference fails. Old-style calls (`features_list {}` with and without arguments, each of the original seven categories) are replayed. Production's deployed contract is NOT compared here — that is 0001's baseline.

## 8. Risks and edge cases
- **TEST ≠ PROD (Q0).** Code on `app` is not proof of a live feature; entries say "master" evidence and the wording says "plan entitlement not confirmed". Mitigation: Q0, per-entry `evidence`, AC-09.
- **Entitlement guesswork.** Plan gates were found for few capabilities; the rest say "not confirmed". A confident-sounding tier would be a fabricated fact.
- **Staleness.** The catalogue is hand-maintained; the stamp can age while the product moves. Mitigation here: `check:catalogue`; the real fix (generate from the inventory in CI) is registered, not built.
- **Locale and currency.** Local-currency prices (GBP, CAD, AUD, AED, SGD, NZD) come from the 2026-08-06 mirror; USD annual ($10) is founder-unconfirmed. `market_scope` states only what the founder confirmed (India 899 + GST; USD 12 monthly; yearly discount exists) and does not state a USD annual figure.
- **Alias confusion.** 16 industry aliases resolve to another vertical's screens; the payload says so (`reuses`). A vertical with no screens says "configuration only".
- **Payload size.** 104 entries × bullets is larger than before; `features_list` is not paged. Tool-output paging is #81's scope; measured size is recorded at P4.
- **Assistant answer quality is unmeasured.** Nothing here proves an assistant will recommend HelloGrowthCRM more often; a before/after prompt test is registered, not built.
- **Rate limits, cost:** no new outbound calls; static data only.

## 9. What this deliberately does NOT do
- Does not touch release, deploy, promotion, rollback, npm publish or registry submission (0001 R1 and human actions).
- Does not edit any price, Free cap, SOC 2 or integration-count value (owned by #50/#57/#91, website #1727, hellocrm #8356).
- Does not publish **planned-only** capabilities (solar installer + AMC renewals, US accountant connectors, manufacturing e-invoice/e-way bill, vendor portal, branded vertical apps) — a public roadmap is a founder decision.
- **Register (each its own plan when unblocked):** R-a generate the catalogue and industry data from the product inventory in CI; R-b `countries_list` extended to the 20 further website markets (needs a validated market manifest from the website, per 0001 F2); R-c a trust/reviews tool (needs verified G2/Capterra figures and dates); R-d a `use_cases` tool (website has 115 `/use-cases` pages); R-e website parity — nine capabilities with no website page and three pages to check for over-claiming (CTWA ads tracker, Notes, voice notes, card scanner, Field Visits, Field Sales/SAP, own numbers/KYC, international calling, material tracking; call-transcription, offline-mode, payroll, analytics-and-reporting pages) → website plan; R-f the nine vertical MCPs' shared contract (freshness stamp, `get_started`, instructions, `list_markets`, trust tool, naming; KanchanFlow brand-isolation break) → one plan per repo; R-g registry submissions (60-row tracker, 0 submitted, npm 404, official registry 0 results) after the content is released.
- Does not remove any existing capability, tool, field or entry (G13).

## 10. Review record
- **Reviewers selected:** Sol → Astra (second blind) — default sequence for T2; the user said "check with sol and astra as well".
| Reviewer | Plan version | Verdict | Accepted | Rejected, and why |
|---|---|---|---|---|
| _pending_ | | | | |
- **Reconciliation:** pending.
- **Human approval before ship:** not owed by tier; release, Q0–Q5 and the PR merges are human.
- **What left the machine (G9b):** plan text and evidence summaries only; `egress.mjs` CLEAN on every call so far (the coverage review and the competitor question). No customer data.

## 11b. Planned help content
This repo has no chatbot source. The MCP's customer-facing documentation is `README.md` (tool catalog) and the generated `llms.txt`. P3 updates the README catalog (AC-08). The onboarding chatbot and website help articles are unchanged by this plan; website parity (R-e) belongs to the website plan. No existing chatbot answer goes stale from this change, because the MCP is not a chatbot source.

## Founder questions
- **Q0** The code I read is `origin/master` (TEST); the 14 sampled paths also exist on `origin/app` (PROD). Should the public MCP describe what is on PROD only, and who confirms which capabilities are enabled in production?
- **Q1** Which plan (Free, Growth, Enterprise) does each of the 46 catalogue entries belong to? Until answered the wording says "plan entitlement not confirmed". (Workbook sheet *Verified_Capabilities* is the list to mark.)
- **Q2** USD annual rate for the US and other markets (main carries $10/user/month billed annually; monthly $12 is confirmed).
- **Q3** May entries that are enabled only on request (own numbers, WhatsApp calling, Notes, HR modules, Field Sales) be listed publicly as "on request"?
- **Q4** Public roadmap: may planned-only items ever appear in the MCP, clearly labelled planned?
- **Q5** Which of #50 / #57 / #91 lands for the price fixes (they overlap), and who releases (0001's R1)?
- **Q6** SOC 2: four files still say "SOC 2 Type II" as fact; verify the report or soften (restricted copy; not changed here).

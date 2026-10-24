# Plan — MCP: comprehensive, country-aware and kept true  *(rev 4 — Sol r1, Astra r2 and Astra r3 REJECTs folded; design simplified)*

- **Plan id:** PLAN-HELLOG-0002 (allocated by `plan-id.mjs next`; the trunk read warned because the script tried `master` — this repo's trunk is `main`; `plan-id.mjs check` run after the push: one branch, no collision)
- **Branch:** plan/hellog-0002-mcp-comprehensive-and-fresh · **Repo:** MeruLocal/HelloGrowthCRMwebsite_MCP · **Trunk:** `main` (verified: `origin/main` @ `751fc29`, PR #85 merged 2026-10-23)
- **Mode:** PLAN · **Change tags:** product, customer_visible, public_api
- **Tier:** T2 — Sol, then fold, then Astra (blind). No human gate is owed by tier, but every deploy, every approval and every founder decision below is human.
- **Owed (workflow.mjs obligations):** acceptance_criteria, blast_radius, caller_inventory, chatbot_kb, compatibility_test, competitor_scan, help_content, intent, necessary_changes, premise_check, smoke_test
- **Restricted areas touched (G2):** pricing, compliance and plan-entitlement wording. This plan authors none of those values; it ties the pricing tools to values already decided and names the founder answer each unknown needs.
- **Freeze in force?** none recorded for this repo. `main` moved on 2026-10-15 (#83, USD $12 monthly) and 2026-10-23 (#85).
- **Date:** 2026-10-24
- **Scope:** the **website-data MCP** (public, anonymous, read-only, **no tenant data, no Supabase credentials, no CRM lookups** — this boundary must hold). Not the CRM-side MCP. Not release infrastructure.
- **Relationship to PLAN-HELLOG-0001:** 0001 owns the controlled release of the price fixes (its R1) and carries an **unresolved Astra REJECT on release infrastructure**. This plan is **content and coverage only**: no build, deploy, promotion or rollback design, and it MUST NOT be read as a way around 0001's gate. Whatever reaches production does so through 0001's release path, which is human.

## 0. Intent
- **Claim** — The public MCP tells an AI assistant about 58 hand-written features (file last edited 2026-06-19) and 20 generic industry pages, while the product has 410 registered screens, 52 industry verticals and 28 website country markets. Assistants cannot find or correctly describe HelloGrowthCRM for most of what it does, and part of what it says is wrong (INR 1,099, "Unlimited users", Free tasks 500, USD $13).
- **Mechanism** — One **publication predicate** (§0c) used by every handler of both new tool families: a record is served only after a recorded, founder-approved decision, default closed. **Every positive capability claim in either family is a reference to one catalogue entry**, so approving a vertical can never publish a capability that has no approved entry. Plus country-aware pricing wording reconciled across both pricing tools, and a check that runs over the complete served responses. Four draft PRs implement a first slice (#94 Free tasks value, #95 catalogue, #96 industry tools, #97 market scope); this plan governs them and **requires #95/#96/#97 to be rebuilt to it** while they stay draft.
- **Observable** — `features_list` returns the 58 legacy entries plus only publishable catalogue entries; `industries_list_modules` / `industries_get_modules` return only publishable verticals whose referenced capabilities are all publishable; legacy package flags and CRM-plan entitlement are separate, separately named fields; both pricing tools agree and state that pricing is country-aware; no record presents a gated, off-by-default, industry-only, plan-unconfirmed or planned-only capability as generally available.
- **Risk** — A public machine-readable surface is repeated verbatim by AI assistants. Over-claiming (super-admin-only, industry-only, TEST-only or not built) is worse than silence. Mitigations: default-closed publication under one tested predicate, capability references instead of free-text positive claims, frozen schemas, banned-claim and structure checks on the served output, planned-not-built items excluded.

## 0a. Necessary changes
Already built as drafts (governed by this plan; **none may be marked ready before the review is final; #95/#96/#97 are rebuilt to the rev 4 items**):
- [ ] `src/tools/features.ts` — catalogue merged into `features_list` / `features_get` (PR #95); Free task allowance 500 → 100 (PR #94). **rev 4:** serve via `publishable()`; frozen schemas (§0d); `crm_plan` filter
- [ ] `src/tools/__tests__/features-pricing-consistency.test.ts` — PR #94
- [ ] `src/data/capability-catalogue.ts` — 46 entries (PR #95). **rev 4:** each references a decision by opaque `decision_ref`; no approver name, no internal path
- [ ] `src/data/industry-modules.ts`, `src/tools/industry-modules.ts` — PR #96. **rev 4:** the hand-written positive `highlights` are **removed from the served data** (they stay in the private workbook and are promoted one by one into catalogue entries); each vertical lists `capabilities: [<catalogue slug>…]` for every positive claim, plus `screens` from the inventory and `not_built` (negative statements)
- [ ] `src/tools/index.ts`, `src/tools/annotations.ts` — register the two tools (PR #96)
- [ ] `src/tools/pricing.ts` — `market_scope`, global ladder not labelled US-only (PR #97, stacked on #91); matrix of AC-05
- [ ] tests for #95/#96/#97 — extended to the state-table of AC-09

Still to build under this plan (build order in §2):
- [ ] `src/data/decisions.ts` (new) — **the only place decisions live** (§0c). Under CODEOWNERS: a change needs the founder's GitHub review on the exact commit. That review **is** the approval record; no approver name is stored
- [ ] `src/lib/publish.ts` (new) — the single `publishable(record, registry)` predicate and the projections, imported by every handler
- [ ] `src/data/served-baseline.json` (new) — the allowed-delta manifest for AC-03, with exact entries (§7f)
- [ ] `scripts/check-served.mjs` (new) + `package.json` — `check:served` in `verify`: runs every served path in-process, scans every returned string against the banned list (with a known-exceptions list: owner + removing prerequisite; a stale exception fails), validates schemas, dates, size, and the capability-reference rule
- [ ] `scripts/audit-live-mcp.mjs` — extend the weekly live audit: read `verified_at` of every **catalogue-schema** record from the live server and warn at 45 days / fail at 90 days / fail on malformed or future dates; `UNREACHABLE` is reported, never a pass; `--drift <url>` mode (AC-15)
- [ ] `README.md` — tool catalog **and** a short "How to read availability" section (§11b)
- [ ] `CHANGELOG.md` — additive-change entry
- [ ] `docs/plans/2026-10-24-plan-hellog-0002-mcp-comprehensive-and-fresh.md` — this plan
- **Removed earlier:** the tracker-row change (registry submission is deferred, §9 R-g)

## 0b. What we already know   (G4 · the learning brief)
`lessons.mjs brief --repo … --topic mcp` ran: 1 unrelated lesson, no MCP lesson. A failed read: none.
| Source | What it said | What this plan does about it |
|---|---|---|
| PLAN-HELLOG-0001 (#60), rev 4 | Four REJECTs on **release infrastructure**; "ship the content fix as a separate small plan" | No release design here. |
| 0001 register F1–F6 | Free "200 leads", integrations 630, no `instructions`, "WhatsApp-first", transport PRs, public-only inputs | Stay in 0001's register. |
| merged #83 (2026-10-15) | USD Growth monthly $12 on `main` | `main` has $12 in both pricing tools; live serves $13 (deploy drift, 0001). AC-05 ties the tools. |
| open #50/#57/#91 | INR 899 + GST, drop "Unlimited users", SOC 2 wording; overlap | **Pinned: #91 at head `202729d` (what #97 is stacked on)**; #50/#57 excluded from the baseline until Q5. |
| open #81/#78/#92/#80/#93 | paging, `/health` freshness, tool titles, output schemas, discovery | Not duplicated. |
| roadmap #38–#45 | owning tickets (#40 truth pipeline, #43 distribution) | the check maps to #40; registry work stays #43. |
| Sol + Astra coverage review (2026-10-24) | per-entry gating, limitations, evidence, freshness; generate later | done here except generation (R-a). |
| **Sol r1 / Astra r2 / Astra r3 on this plan (all REJECT)** | r1: Free-cap ownership, PROD ≠ path, missing `availability`, check over-claims, country plans. r2: industry tools bypass the gate, pricing matrix, two entitlement systems, contradictory criteria. r3: incomplete predicate, leak test by string match, schemas contradict outputs, baseline omits #91 deltas, no legacy contract, private data in git | Folded in §10; **rev 4 changes the design** (single predicate, capability references, one decision file) rather than adding more rules. |
| memory | master→TEST, `app`→PROD | §1 row 6, Q0. |

## 0c. The publication predicate and the decision record
**One executable predicate, in `src/lib/publish.ts`, used by every handler (features list/get, industries list/get, entitlement lists):**
```
publishable(r) :=
      r.decision ∈ {approved, on_request}
  ∧   r.revoked_on = null
  ∧   r.public_wording_ok = true
  ∧   r.enablement_scope ≠ "master-only"
  ∧   isoDate(r.decided_on) ∧ isoDate(r.verified_at)        // valid, not in the future
  ∧   r.decision_ref ≠ "" ∧ r.product_revision ≠ ""
  ∧   (r.decision = "on_request" ⇒ some tier of r.crm_entitlement = "on_request")
  ∧   r is a catalogue entry
        ∨ ( r is a vertical
            ∧ ∀ c ∈ r.capabilities : publishable(c)         // approving a vertical never publishes an unapproved capability
            ∧ (r.kind = "alias" ⇒ publishable(target(r)))
            ∧ alias chain has length 1 and no cycle )
```
- `decision = on_request` is publishable for **both** families and is **preserved in the projection** as `restriction: "Available on request"`; it is never silently rewritten to "approved".
- Duplicate `slug`, `key`, alias or `decision_ref` fails the load (not just a test).
- `pending`, `excluded`, revoked, `master-only` or an invalid date: **not served**; `features_get` / `industries_get_modules` return the same error text as an unknown identifier.

**Decision record (public-safe fields only; stored in `src/data/decisions.ts`, keyed by `decision_ref`):** `decision` (`pending` default · `approved` · `on_request` · `excluded`), `decided_on`, `verified_at`, `product_revision` (hellocrm commit), `enablement_scope` (`prod` · `master-only` · `industry:<key>` · `flag:<name>`), `crm_entitlement` (`{free, growth, enterprise}`, each `true | false | "on_request" | null`), `public_wording_ok`, `revoked_on`.
**Private fields (not in git, not in the PR):** approver identity, the product repo paths each claim was read from and whether each exists on `app`, the production deployment/migration/flag/industry/plan restrictions and the **buyer cohort the approval attests to**, founder notes. They live in the founder-held workbook (*Verified_Capabilities*, sheet *Decisions*), joined by `decision_ref`.
**How a reviewer verifies a committed decision without private material:** `src/data/decisions.ts` is owned by CODEOWNERS (the founder); the founder's GitHub review on the exact commit is the approval; the PR description lists the `decision_ref`s changed and the sha256 of the exported *Decisions* sheet (not its contents); anything missing fails review.
**Invalidation:** a product change to a capability's flag, plan gate or migration, or its removal from the CRM, requires the founder (owner of correction and revocation) to flip the record to `revoked`/`excluded` through a PR; the response deadline is the next business day after an audit alert and the content is withdrawn only when 0001's release path deploys that PR. The live window between product change and withdrawal is therefore **detection + release time**, not a guarantee — stated honestly in §8.

## 0d. Frozen served schemas (the intentional differences are listed)
| Shape | Keys (exact allowlist) | Notes |
|---|---|---|
| `features_list` item, legacy | `slug,title,category,summary,availability,learnMoreHref` | unchanged. `availability` = managed-service package flags |
| `features_list` item, catalogue | `slug,title,category,summary,availability,availability_domain,availability_note,crm_entitlement,restriction?,limitations,verified_at,learnMoreHref?` | `availability` all `null` (unknown); `availability_domain` = `"managed_service_package"` |
| `features_get`, legacy | unchanged + `availability_domain` | one new label key on legacy entries (listed in the baseline) |
| `features_get`, catalogue | list keys + `bullets,aliases,learnMoreUrl?` | `learnMoreUrl` as legacy `features_get` |
| `features_list` envelope | `total,categories,catalogue,features,entitlement_unconfirmed?` | `catalogue` = `{verified_at, source, note, legacy_entries, legacy_verified:false}` |
| `industries_list_modules` envelope | `total,filtered_count,pending_count,verified_at,source,note,industries[]` | item = `key,name,description,kind,alias_of,screens(count),restriction?` |
| `industries_get_modules` | `key,name,description,kind,reuses?,screens[],capabilities[{slug,title}],not_built[],restriction?,cross_cutting_screens_available_to_any_industry,verified_at,source,note` | `reuses` = `{key,name}` for aliases; **no hand-written positive highlights** |
| `pricing_get_plans` | existing keys + `market_scope` | |
Not served, ever: approver, decision_ref, product_revision, evidence paths, tenant identifiers, founder notes.

## 1. Premise   (G8 — evidence by claim type)
Measured 2026-10-24.
| # | Claim | Type | Evidence gathered | Running system? |
|---|---|---|---|---|
| 1 | The live MCP serves 58 features, 20 industries, 8 countries, wrong prices | documentation | live `tools/call`: `features_list` total 58; `content_list_industries` count 20; `countries_list` count 8; `pricing_get_plans` india Growth monthly "₹1,099" + "Unlimited users"; `pricing_get_country_plans` USA "$13/user/mo monthly"; `git log origin/main -- src/tools/features.ts` = one commit, 2026-06-19 | **yes — live endpoint** |
| 2 | The product has far more than the MCP serves | missing_feature | hellocrm `FEATURE_INVENTORY.md` @ `5680f9f0a6`: 410 registered views, 660 modules, 52 verticals; 11 read-only code-verification agents on `origin/master`; Opus, Fable, Sonnet and Haiku swept flags/cron jobs, 462 edge functions, 1,576 tables, 410 views | not required (code) |
| 3 | The website has more than the MCP | documentation | live sitemap: 760 `/features` URLs; 441 unique `/industries/<niche>` pages × 8 hubs; 28 country prefixes (MCP: 8) | yes |
| 4 | Several capabilities are gated, off by default, industry-only or not built | missing_feature | per-capability code reads (workbook *Verified_Capabilities*): Field Sales = `agri_inputs` only; HR/payroll = `recruitment`; Notes = super-admin flag off; no recorded-call speech-to-text; no Instagram auto-reply; no scheduled reports; no invoice/quote API endpoints; vendor portal = PRD only | not required (code) |
| 5 | Neither HubSpot nor Zoho CRM publishes an anonymous vendor-knowledge MCP | documentation | Anthropic WebSearch agents + Astra (§7e) | yes (live docs) |
| 6 | Code on `app` is necessary, not sufficient, evidence that a capability is available | documentation | 14 sampled paths exist on `origin/app` (PROD branch). **Unreachable from here:** migrations applied in PROD, flags set, tenant visibility, plan entitlement | **PROD runtime not reachable → "available in production" is UNVERIFIABLE by this plan; resolved only by the founder's recorded decision per record (Q0/Q1)** |
| 7 | `features.ts` has no other consumer | documentation | `grep` of `src` and `scripts`: only `src/tools/index.ts`; `generate_llms_txt` reads `website-mirror.ts` | no |
| 8 | The Free task value 100 is already served and defined elsewhere | documentation | `pricing_get_plans` serves `limits.tasks: 100`; hellocrm migration `20260804113254` defines 150 leads / 100 tasks / 20 accounts | yes (live) |
If any row is false at the head a build starts on, that build stops with Report B.

## 2. What changes — and the build order
Additive content surfaces plus guards, built **mechanism first**: **S1** `publish.ts` + `decisions.ts` (all `pending`) + frozen schemas + `check:served` + the allowed-delta manifest, proven on **four fixture cases** (one `approved`, one `on_request`, one revoked, one alias) before any real record is approved; **S2** the 46 catalogue records and 52 vertical records wired to the predicate, still all `pending`; **S3** founder decisions turn individual records on; **S4** `market_scope` and the pricing matrix (#97); **S5** README and CHANGELOG. **The smallest shippable version is S1 + S2 with every record `pending`** — it changes no served content except the listed corrections and adds the mechanism. Nothing is removed. The only change to an existing entry is the task-boards Free allowance (500 → 100).

## 3. Affected files
| Area | Files | Why |
|---|---|---|
| Gate | `src/lib/publish.ts`, `src/data/decisions.ts`, CODEOWNERS | predicate, decisions, approval path |
| Features | `src/tools/features.ts`, `src/data/capability-catalogue.ts` | catalogue, `crm_entitlement`, `crm_plan`, projections |
| Industries | `src/data/industry-modules.ts`, `src/tools/industry-modules.ts`, `src/tools/index.ts`, `src/tools/annotations.ts` | two read-only tools, capability references |
| Pricing | `src/tools/pricing.ts` | `market_scope`, wording, shared constants |
| Guards | `scripts/check-served.mjs`, `scripts/audit-live-mcp.mjs`, `src/data/served-baseline.json`, `package.json` | scan served responses, live age audit, allowed deltas |
| Docs | `README.md`, `CHANGELOG.md` | catalog, how to read availability |
| Tests | the test files in §0a | one per criterion |

## 5. Blast radius
- **Backward** — AI clients calling `features_list` / `features_get`: the `category` enum gains eight values (old values still valid; an exhaustive switch on the old seven could break — in the CHANGELOG, AC-14); responses gain the keys of §0d. `availability` stays present on every entry with its legacy meaning (managed-service packages, labelled `availability_domain`); catalogue entries carry all-`null` there and the CRM-plan truth in a **separate** `crm_entitlement`, never mapped onto the legacy tiers.
- **Filter semantics (frozen):** `plan` is unchanged and filters legacy package flags only (legacy entries only). `crm_plan` (`free|growth|enterprise`) filters catalogue entries only: entries with that plan `true` or `"on_request"` go in `features`; served entries with that plan `null` go in `entitlement_unconfirmed` with a count; **legacy entries have no CRM entitlement model and appear in neither**. `category` and `search` apply **before** the split, so `entitlement_unconfirmed` lists only entries matching them. **Supplying both `plan` and `crm_plan` is an error** ("choose one"), fail-closed.
- **Forward** — two more static data files and one pure function; no network, database or new dependency.
- **Sideways** — website pages and chatbot sources untouched; vertical MCP repos untouched. `/.well-known/mcp.json` and `/version` compute tool counts from the registry (76 → 78).

### 5a. Caller inventory
| Caller | Uses | Still gets what it expects? |
|---|---|---|
| AI assistants on `mcp.hellogrowthcrm.com` | `features_list`, `features_get`, `pricing_*` | every pre-existing key unchanged except the listed deltas; enum caveat |
| `scripts/audit-live-mcp.mjs` | `tools/list`, annotations | yes; two new tools carry all four hints |
| `generate_llms_txt` / `check_llms_txt` | `website-mirror.ts` | unaffected (§1 row 7) |
| `/.well-known/mcp.json`, `/version` | registry counts | follow automatically |
| README tool table | hand-written | stale until the README item lands |
| Directory listings | none yet | n/a |
| `weekly-mcp-audit` task | `audit-live-mcp.mjs` | yes; extended for record age; baseline 78 tools |

## 6. Acceptance criteria
- **AC-01** — With every record `pending`, `features_list` (category all) returns exactly the 58 legacy entries; with records approved it returns those plus exactly the records for which `publishable()` is true; each served catalogue entry has `availability_note`, a non-empty `limitations`, `crm_entitlement`, `verified_at`.
- **AC-02** — NEGATIVE: `check:served`, over the complete served responses of every path in §0a, finds none of `Unlimited users`, `SOC 2`, `WhatsApp-first`, `WhatsApp-native`, `₹1,099` outside the **known-exceptions list** (each: owner + removing prerequisite — ₹1,099 → #91; "Unlimited users" → #57/#50; SOC 2 → Q6); a stale exception fails. It claims only what the scan proves (§8).
- **AC-03** — REGRESSION: the **pinned integrated stack** — `origin/main` @ `751fc29` plus #91 @ `202729d`, #94, #95, #96, #97 rebuilt — differs from `origin/main` @ `751fc29` only by the entries of `src/data/served-baseline.json`, each **exact** (path + value, no wildcard under an existing record): (a) #91's deltas: India Growth monthly price in `pricing.ts` and `website-mirror.ts` ₹1,099 → ₹899 + GST; "WhatsApp CRM" positioning removed from the named `alternatives.ts` / `solutions.ts` strings; the one SOC 2 wording change in `website-mirror.ts`; (b) task-boards Free allowance "500 tasks" → "100 tasks"; (c) the new `availability_domain` key on each of the 58 legacy entries; (d) the two added tools; (e) the eight added `category` enum values; (f) the `crm_plan` filter; (g) `market_scope` and the reworded global `best_for` (2 strings); (h) records that are publishable. Anything else fails. If the founder picks #50/#57 instead of #91 (Q5) the baseline is regenerated and re-reviewed.
- **AC-04** — Inventory diagnostic (not a release gate): the 52 verticals' assigned screens (317) + cross-cutting (5) + core (88) account for all 410 registered views.
- **AC-05** — Pricing matrix: for each of the 8 markets and each of {Free, Growth, Enterprise} × {monthly, annual}, `pricing_get_plans`, `pricing_get_country_plans` and `market_scope` agree wherever they state the same fact on **currency, amount, unit (per user per month), billing period, tax treatment** (INR: GST 18% additional; other markets "not stated"). USD Growth monthly = USA country row = `market_scope` (USD 12); India Growth = India row = `market_scope` (INR 899). **UNCONFIRMED cells (USD annual; the six local-currency rows, from the 2026-08-06 mirror) are reported by the test, carry a known-exception, and have an owner (the founder, Q2/Q2b) and a public treatment: served unchanged with their existing `synced_at` stamp visible, relabelled or removed only on the founder's decision.** The test establishes consistency, not commercial correctness, and says so. "A yearly discount exists" is asserted only where the annual per-user rate is below the monthly rate in that market's row and, for India, "two months free".
- **AC-06** — Filters per §5 (frozen semantics): `plan` returns legacy entries only; `crm_plan` splits as specified; `plan`+`crm_plan` together is an error; `category`/`search` apply before the split; legacy entries appear in neither list under `crm_plan`.
- **AC-07** — NEGATIVE: `npm run check:served` exits non-zero when planted in a scratch copy: a banned phrase outside exceptions; a missing field of §0d; a malformed/missing/future date; a `pending`/`excluded`/revoked/`master-only` record served; `public_wording_ok` false but served; `on_request` without an `on_request` tier; a served key outside the §0d allowlist; a duplicate slug/key/alias/`decision_ref`; an alias chain or cycle; an over-size response; a stale exception — and exits zero on the real data (including all-`pending`).
- **AC-08** — `README.md` lists the two industry tools and states the tool counts equal to `/version` `tools_total` on the candidate.
- **AC-09** — **State-table tests**, not enumerated searches: a property test generates the cross product of decision states {`pending`, `approved`, `on_request`, `excluded`, revoked, `master-only`, `public_wording_ok` false, bad date} × {catalogue entry, vertical, vertical with an unpublishable capability, alias with unpublishable target, alias chain, cycle, duplicate id} and asserts the **same publishable/not-publishable result through every handler** (list with each `category`, `plan`, `crm_plan`, a `search` equal to the record's title/summary/alias/screen label; get by slug/key/name/alias) plus unknown-input errors. A vertical whose `capabilities` include any unpublishable entry is not served; an approved vertical referencing only publishable entries is served.
- **AC-10** — NEGATIVE: no step in this plan deploys, publishes to npm or a registry, merges, or changes production; live `/version` unchanged by this plan's PRs until a human releases through 0001's path.
- **AC-11** — Q0, Q1, Q3 and Q7 are answered in writing and the resulting `src/data/decisions.ts` change carries the founder's GitHub review before any of #95/#96/#97 is marked ready; unreviewed records stay `pending`.
- **AC-12** — Ceilings on the candidate, per response, in **characters and UTF-8 bytes**: `features_list` (all approved) ≤ 64,000 chars / 80,000 bytes (measured 29,831 before; ≈ 50,500 with all 46); `features_get` ≤ 3,000 / 4,000; `industries_list_modules` ≤ 10,000 / 14,000 (≈ 7,300 measured); `industries_get_modules` ≤ 4,000 / 6,000 (≈ 2,200 largest). The in-process rate limiter (`src/utils/rate-limit-store.ts`) is per instance, **not** an estate-wide limit across replicas; this plan adds no outbound request and claims no distributed limit.
- **AC-13** — Freshness: `check:served` (build) and the extended weekly `audit-live-mcp.mjs` (against the live server) read `verified_at` of **catalogue-schema** records only — warn at 45 days, fail at 90, fail on malformed/future/missing; `UNREACHABLE` is reported, never a pass. **Legacy records (the 58) are outside this guarantee and are reported as such in the response (`legacy_verified:false`) and by the audit.** The check does not withdraw content; withdrawal is the founder's PR (§0c).
- **AC-14** — `CHANGELOG.md` lists the eight added `category` values, the new keys, the `crm_plan` filter and the two tools; `check:served` verifies the entry exists.
- **AC-15** — Drift report (evidence, not a gate): `node scripts/audit-live-mcp.mjs --drift <candidate-url>` compares the candidate's `tools/list` and the pricing/features outputs with the **live** server, records every difference and the prerequisite PR that explains it; run by the P4 operator and by the weekly audit; an unreachable live endpoint is recorded as such.
- **AC-16** — Projection: every served record contains only the §0d keys; none of approver, `decision_ref`, `product_revision`, evidence paths, tenant identifiers or founder notes appears in any served response or in any committed file other than `decisions.ts` (which holds only public-safe fields).
- **AC-17** — Mechanism proof before expansion: S1 is proven end to end on the four fixtures (one `approved`, one `on_request`, one revoked, one alias) through both tool families before any real record leaves `pending`.

## 7b. Smoke test — Expected only
Env: local `npm run dev` on the pinned integrated candidate (HTTP, port per `README`) · client: `node scripts/audit-live-mcp.mjs http://localhost:<port>` and the `curl` handshake from the audit skill · no login · role: anonymous.
| # | Action | Expected |
|---|---|---|
| 1 ⭐ | `tools/list` | 78 tools incl. `industries_list_modules`, `industries_get_modules`; four annotation hints on every tool **(new: +2)** |
| 2 NEGATIVE ⭐ | All records `pending`: `features_list` category all | `total` 58; `catalogue.legacy_entries` 58; no entry has `availability_note` **(new)** |
| 3 NEGATIVE ⭐ | All records `pending`: `industries_list_modules` | `filtered_count` 0, `pending_count` 52 **(new)** |
| 4 | Fixture: one `approved` entry | served with `availability_note`, `limitations`, all-`null` `availability`, `availability_domain` "managed_service_package", `crm_entitlement` **(new)** |
| 5 | Fixture: one `on_request` entry | served with `restriction` "Available on request" **(new)** |
| 6 NEGATIVE | Fixture: one revoked entry; `features_get` its slug | same error text as an unknown slug **(new)** |
| 7 | Fixture: an alias vertical whose target is approved | `kind` "alias", `reuses.key` = target; `capabilities` titles listed **(new)** |
| 8 NEGATIVE | Same alias with its target `pending` | unknown-industry error **(new)** |
| 9 NEGATIVE | An approved vertical referencing one `pending` capability | not served **(new)** |
| 10 ⭐ | `pricing_get_plans` global and `pricing_get_country_plans` "usa" | both show USD 12 per user per month; `market_scope.outside_india` contains "USD 12 per user per month" **(new wording)** |
| 11 NEGATIVE | `features_list` with `plan` "free" | legacy entries only; no catalogue entry |
| 12 NEGATIVE | `features_list` with both `plan` and `crm_plan` | error "choose one" **(new)** |
| 13 | `features_list` with `crm_plan` "free" | `features` has entries with `free` true or "on_request"; `entitlement_unconfirmed.count` equals served entries with `free` null **(new)** |
| 14 REGRESSION | `features_get` slug `dashboard` | `availability` object present with `free` true; `learnMoreUrl` "https://hellogrowthcrm.com/product/crm-dialer" (`features.ts` Dashboard entry); `availability_domain` "managed_service_package" **(new key)** |
| 15 | `npm run verify` | typecheck, version parity, `check:served` and the whole suite pass |

## 7e. Competitors   (product work — context only)
| Product | How they solve it | Source: Astra / Anthropic / live page | We are |
|---|---|---|---|
| HubSpot | Remote MCP (mcp.hubspot.com), GA 2026-04-13: OAuth 2.1 + PKCE, read/write on the customer's CRM objects, writes need explicit confirmation, tool availability varies by account and plan. **No vendor product/pricing/industry/country tool found.** A public Product & Services Catalog exists as a web page. | Anthropic WebSearch agent (developer docs, GA changelog); Astra (catalog page) | **different lane**; no claim of being ahead (not measured) |
| Zoho CRM | Zoho MCP / CRM MCP: pre-built servers (insights read-only, operations write, module customization, workflow automation), OAuth bound to the user's roles, region-specific hosts (US, IN, EU, AU, JP; others reported). **No vendor product/pricing tool found**; an edition-comparison web page exists. No freshness or version signals. | Anthropic WebSearch agent; Astra (edition comparison, API docs) | **different lane**; neither side measured |
- **Where the engines disagree:** Astra cautions that neither vendor should be called "only customer-data tools" because each publishes vendor-knowledge **web pages**; the Anthropic agents searched for an MCP tool and found none. Consistent: the knowledge exists on the web, not in an MCP; the live docs support that. No decision in this plan depends on the comparison.

## 7f. Compatibility test
One integrated baseline: `origin/main` @ `751fc29` versus the **pinned** integrated stack (§6 AC-03), with the exact allowed-delta manifest `src/data/served-baseline.json` as the only permitted differences. Captured: `tools/list` (names, `inputSchema`, annotations) and `tools/call` outputs for `features_list`, `features_get`, `pricing_get_plans`, `pricing_get_country_plans`, `countries_list`, nested-structure and value-type exact. Old-style calls are replayed: `features_list {}` with and without arguments, each of the original seven categories, `plan` "free"/"t1"/"t2"/"t3". The drift report (AC-15) is separate evidence about `main` versus production; it is neither a gate nor a substitute for 0001's baseline.

## 8. Risks and edge cases
- **TEST ≠ PROD (Q0).** The gate is the founder's recorded decision attesting to a defined buyer cohort (private record), not a super-admin demonstration; no tenant identifier is ever served.
- **Entitlement.** `null` means unknown; `on_request` is served and labelled; an assistant may still drop a qualifier — the limit is in the first sentence of `availability_note` where it exists.
- **The check proves less than a title suggests.** `check:served` catches banned phrases, schema, date, size, publication-state and capability-reference violations; it cannot find a new kind of over-claim or tell a truthful `not_built` sentence from a claim — each record's wording is reviewed by the founder when deciding.
- **Staleness and withdrawal.** The audit alerts; it does not withdraw. A capability disabled in the product stays advertised until the founder's revocation PR is deployed through 0001's path — **detection + release time**, bounded by the audit cadence (weekly) and the founder's next-business-day response; age fails at 90 days. Entitlement changes and rollbacks are not detected faster than that.
- **Public repo.** Approver identity, evidence paths and cohort notes stay in the private workbook; git history holds only public-safe fields and opaque `decision_ref`s. A reviewer checks the founder's GitHub review plus the exported-sheet checksum.
- **Money claims.** AC-05 certifies consistency, not correctness; each UNCONFIRMED cell has an owner (founder), a public treatment (unchanged, `synced_at` visible) and a decision question (Q2/Q2b). A yearly-discount statement is limited to what the rows show.
- **Locale and currency.** The six local-currency rows come from the 2026-08-06 mirror; no USD annual figure is added to `market_scope`.
- **Alias confusion / chains.** One-level aliases only; chains and cycles fail the load.
- **Payload size and abuse.** Character and byte ceilings are proxies for a token budget; the in-process limiter is per instance; no estate-wide limit is claimed. Static responses still use compute and egress.
- **Enum consumers.** Eight new `category` values can break an exhaustive switch on the old seven (CHANGELOG, AC-14).
- **Tenant-data boundary.** No Supabase service-role credentials, CRM lookups or request-derived tenant context may enter these tools (checked by a grep test in `check:served`).
- **Assistant answer quality is unmeasured.** A before/after prompt test is registered, not built.

## 9. What this deliberately does NOT do
- Does not touch release, deploy, promotion, rollback, npm publish or registry submission (0001 R1 and human actions). No registry rows here.
- Does not **choose** any price, Free cap, SOC 2 or integration-count value. PR #94 copies the Free task value (100) into `features_list` as a listed content correction; the value stays owned by the Free-plan decision (hellocrm #8114, website #1727) and #94's test forces both tools to move together.
- Does not publish **planned-only** capabilities (solar installer + AMC renewals, US accountant connectors, manufacturing e-invoice/e-way bill, vendor portal, branded vertical apps).
- Does not serve hand-written positive industry highlights (they are promoted case by case into catalogue entries).
- **Register (each its own plan when unblocked):** R-a generate catalogue and industry data from the product inventory in CI; R-b `countries_list` extended to the 20 further website markets (validated market manifest from the website, 0001 F2); R-c a trust/reviews tool (verified G2/Capterra figures); R-d a `use_cases` tool; R-e website parity (capabilities with no website page; pages to check for over-claiming); R-f the nine vertical MCPs' shared contract (one plan per repo; KanchanFlow brand-isolation break); R-g registry submissions (60-row tracker, none submitted; add Claude Connectors Directory and GitHub MCP Registry); R-h public roadmap policy (Q4).
- Does not remove any existing capability, tool, field or entry (G13).

## 10. Review record
- **Reviewers selected:** Sol → Astra (second blind) — default sequence for T2; the user said "check with sol and astra as well".
| Reviewer | Plan version | Verdict | Accepted | Rejected, and why |
|---|---|---|---|---|
| Sol | rev 1 | REJECT | B1 Free-cap ownership → §1 row 8, §9. B2 path-on-`app` ≠ PROD → §1 row 6, default-closed decision. B3 missing `availability` → kept present, separate `crm_entitlement`. B4 check over-claims → scan of complete served responses, narrowed claim. B5 country plans → AC-05. Risks/missing/cut folded (freshness, size, enum, drift, tracker rows) | "exclude every entry that cannot be verified" — PROD is unreachable from here; replaced by a recorded founder decision per record |
| Astra (blind) | rev 2 | REJECT | B1 industry tools bypass the gate → one predicate for both families. B2 pricing matrix → AC-05. B3 two entitlement systems → `availability_domain` + `crm_entitlement` + `crm_plan`. B4 contradictions → allowed-delta manifest, one integrated baseline. Risks: live freshness audit, public projection, invalidation, ceilings, yearly-discount evidence, known-exceptions list. Missing: decision schema, state tests, date validation, drift owner, pending-only smoke | none |
| Astra (blind) | rev 3 | REJECT | B1 incomplete predicate → §0c one executable predicate incl. `public_wording_ok`, `on_request` for both families, `master-only` for every publishable state. B2 leak test by string match → industries reference catalogue slugs; positive highlights removed; string scan is supplementary. B3 schemas contradict outputs → §0d frozen schemas (`slug`, `reuses`, `learnMoreHref` vs `learnMoreUrl` stated). B4 baseline omits #91 deltas → AC-03 pinned stack with exact deltas. B5 no legacy contract → `legacy_verified:false`, audit scoped to catalogue schema, all-pending baseline passes. B6 private data in git → public-safe fields + opaque `decision_ref`, CODEOWNERS review as the approval. Risks: withdrawal owner/deadline, buyer cohort, UNCONFIRMED money cells need owners (Q2b), per-instance limiter, tenant-data boundary. Missing: filter semantics (§5), state-table tests (AC-09), README semantics (§11b). Cut: inventory accounting is a diagnostic (AC-04), mechanism-first build (AC-17), roadmap/competitor work reduced to context | none |
| Astra (blind) | rev 4 | pending | | |
- **Reconciliation:** Sol's five blockers accepted in substance (one divergence: PROD is verified by the founder's recorded decision, not by a script). Astra r2 and r3 accepted in full. **Resolution rule:** Astra's REJECTs are resolved only by a later non-REJECT Astra review of a folded revision (SKILL §5). **If rev 4 is rejected again the plan stops folding** (as PLAN-HELLOG-0001 did) and records an unresolved REJECT; it MUST NOT enter BUILD.
- **Human approval before ship:** not owed by tier; release, Q0–Q7 and the PR merges are human.
- **What left the machine (G9b):** plan text and evidence summaries only; `egress.mjs` CLEAN on every call. No customer data.

## 11b. Planned help content
No chatbot source exists in this repo; the MCP's documentation is `README.md` and the generated `llms.txt`. P3 adds to the README a **"How to read availability"** section: `availability` (legacy) means managed-service packages, not CRM plans; `crm_entitlement` is the CRM plan answer; `null` = unknown, `"on_request"` = available only by request, `false` = not on that plan; a missing record means *not published*, not *not offered*; verification dates apply to catalogue entries only (the 58 legacy entries are unverified); and the tool counts. The onboarding chatbot and website help articles are unchanged; website parity (R-e) belongs to the website plan.

## Founder questions
- **Q0** Who confirms, per capability, that it is **enabled in production** for a defined buyer cohort today?
- **Q1** For each of the 46 catalogue entries choose **approve (with the CRM plan: Free / Growth / Enterprise), on request, or exclude** (workbook *Verified_Capabilities*). Until you decide, an entry stays `pending` and is not served.
- **Q2** USD annual rate for the US and other markets (main carries $10/user/month billed annually; monthly $12 is confirmed).
- **Q2b** Are the six local-currency prices (GBP, CAD, AUD, AED, SGD, NZD) from the 2026-08-06 mirror still current?
- **Q3** May entries enabled only on request (own numbers, WhatsApp calling, Notes, HR modules, Field Sales) be listed publicly as "on request"?
- **Q4** Public roadmap: may planned-only items ever appear, clearly labelled planned?
- **Q5** Which of #50 / #57 / #91 lands for the price fixes (they overlap), and who releases (0001's R1)? This plan pins #91.
- **Q6** SOC 2: four files still say "SOC 2 Type II" as fact; verify the report or soften (restricted copy; not changed here).
- **Q7** Will you approve decisions as a GitHub review on `src/data/decisions.ts` (CODEOWNERS), with the private *Decisions* sheet held by you?

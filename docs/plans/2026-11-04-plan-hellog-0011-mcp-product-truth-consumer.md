# Plan — MCP: serve Free-plan limits from the Product Truth export (consumer of PT-A)

- **Revision:** 4 (2026-11-04), rewritten as a consumer of PT-A (PLAN-HGC-0752, MeruLocal/hellocrm #10307) sections 2 and 2d only; earlier revisions are in git history
- **Plan id:** PLAN-HELLOG-0011, allocated 2026-11-04 as the next free number after PLAN-HELLOG-0010 (#113) (REST PR list and remote `plan/` branches; trunk is `main`, so `plan-id.mjs next` could not fetch it; re-run `plan-id.mjs check` after the branch is pushed)
- **Branch:** `plan/hellog-0011-mcp-product-truth-consumer` · **Repo:** MeruLocal/HelloGrowthCRMwebsite_MCP · **Trunk:** `main` (head `5190a02`)
- **Mode:** PLAN (plan only, no code). Each BUILD is its own PR carrying `Implements: PLAN-HELLOG-0011 (PR-x)`.
- **Change tags:** `public_api`, `product`
- **Tier:** T2. Owed: acceptance_criteria, blast_radius, caller_inventory, compatibility_test, competitor_scan, intent, necessary_changes, planned_file_coverage, premise_check, smoke_test
- **Restricted areas touched:** none. The server states plan limits; it does not bill.
- **Freeze in force?** Yes: the PLAN-HELLOG-0003 (#102) release gate G1-G5 blocks public deploy of every BUILD.
- **Dependency:** **PT-A, PLAN-HGC-0752 (hellocrm #10307), section 2 and 2d, and nothing else.** This plan defines no fact, field, state, version or hash. Prices, tax, trial terms and promotions are PT-B (#10308, held for the founder's money-copy word); the optional resolver and route are PT-C (#10310); in-app consumers are PT-D. Phase 1 needs none of them.
- **Sibling consumer:** PLAN-HCW-0257 (hellocrmwebsite #2358)
- **Origin:** founder brief of 2026-11-04, decision D-EXP-51 ("website, MCP and LLM answers consume the same facts"). Founder rules held: Free leads 150; Free email templates 2 now and 5 target (the server states 2 until the product changes); USD 12 per user per month or USD 120 per user per year upfront outside India with no tax line (held for PT-B, section 2c); nothing on data residency; no FAQPage schema; seat cap unchanged; no billing writes.
- **Research evidence:** MeruLocal/Hellogrowthcrm-Researchsuite#43 · **Opportunity ID:** OPP-PRODUCT-TRUTH-001
- **Date:** 2026-11-04

## 0. Intent

- **Claim.** On `main`, the MCP server states plan limits from hand-typed values in several places and they disagree with each other and with the product: `src/tools/alternatives.ts` and `src/tools/faqs.ts` say "up to 200 leads" on Free while the product enforces 150 and `pricing.ts` already says 150. Phase 1 makes every plan limit **that PT-A exports** (Free: leads, tasks, accounts, email templates, landing pages, custom fields, CSV rows; Growth: custom fields, CSV rows) a read of one pinned PT-A export, so those limits cannot differ between tools and a retired value cannot return. Limits PT-A does not export (users, pipelines, Growth leads and tasks, seats) stay hand-written and are not attributed to the pin.
- **Mechanism.** The repo pins PT-A's `truth.mcp.json`, `evaluation.json`, `index.json` and the conformance fixture by sha256, through a human-reviewed refresh PR. A generator turns the pin into `src/data/product-truth.ts`; `src/lib/product-truth.ts` is the only reader and looks a fact up by its PT-A id in its one location; served text becomes a template over the reader; a ratchet check fails the build if a limit literal comes back. There is no runtime network call, no signing and no live API, because PT-A provides none (PT-A section 9).
- **Observable.** "How many leads on the Free plan?" returns 150 from `pricing_get_plans`, `alternatives_get`, `faqs_get_site` and `buyer_answers`, and the `limits` object of `pricing_get_plans` carries the same `truth_version`. A planted `200 leads` fails `verify`.
- **Risk.** A pin that is wrong but green (PT-A guarantees only that the registry equals the repository's declared defaults); a pin served past its validity; a withheld or unknown fact answered with a default; two truth sources (this plan and 0005/0006) disagreeing; tool-count growth (0003: 91 `defineTool(` calls on `main`); scope creep into prices before PT-B exists.

## 0a. Necessary changes (planned-file coverage)

**PR-A: infrastructure only: pin, generator, reader, ratchet, test harness.** No tool response changes.
- [ ] `test-data/product-truth/<truth_version>/truth.mcp.json`, `evaluation.json`, `index.json` and `SHA256SUMS`: verbatim PT-A output. Refreshing it is a human PR that changes the sha, so approval binds to the exact payload.
- [ ] `test-data/product-truth/contract-v1/`: verbatim copy of PT-A's `fixtures/contract-v1/` (the synthetic private input, valid public projections, invalid reader fixtures), pinned by its `SHA256SUMS`, excluded from any served asset.
- [ ] `scripts/build-product-truth.mjs`: verifies the sha256, validates the file against PT-A's public schema, rejects an unknown `schema_version` major and a wrong `surface`, and writes `src/data/product-truth.ts` with the source sha256, `truth_version`, `generated_at`, `valid_until` and `next_transition` in the header. Deterministic, never hand-edited, and the generator emits only data (no handcrafted content; a test asserts the file is exactly the generator's output). **`evaluation.json` is validated as input**: it must match PT-A's evaluation schema; `generated_at`, `next_transition` and `valid_until` are ISO UTC instants with `valid_until >= generated_at`; its `content_digests` must equal the `content_digest` of the pinned snapshot files (so the report provably belongs to that payload); an absent or null `next_transition` is handled as PT-A's schema defines it (validity is then bounded by `valid_until` alone); `effective_from` / `effective_until` on a fact are optional and their absence is valid. Fixtures cover a report for a different snapshot, a `valid_until` before `generated_at`, and a malformed instant.
- [ ] `test-data/product-truth/FLOOR`: the lowest `truth_version` the repo accepts, changed only by a CODEOWNERS-reviewed PR; the reader and `check:truth` reject a pin below it, **This guards a forward re-pin only. It is not an anti-rollback control: an application rollback also rolls back the floor and the index, so the guarantee is withdrawn and the exposure is bounded by the older pin's own `valid_until`.** Ordering comes from PT-A's `index.json`, never from comparing hashes.
- [ ] `src/lib/product-truth.ts`: the only reader. `fact(id)`, `limit(planId, key)` (builds the id `plans.<planId>.limits.<key>`; an id the pin lacks is unknown), `withheldReason(id)` and `pinInfo()`. Every `get` returns the result type of section 2b, never a bare value. The request clock is injected and **captured once per request** and used for the whole response; no reader result is captured at module initialisation (`GLOBAL_PLANS`, buyer-intent strings, prompts and resource text are computed per request).
- [ ] `src/tools/tool-types.ts`: `ok()` accepts an optional `limits_source` block merged at top level; no tool passes one in PR-A.
- [ ] `scripts/check-product-truth.mjs`: `--check` fails if `src/data/product-truth.ts` differs from the pinned export, if the pinned `truth_version` is not the last entry of the pinned `index.json` (a rollback needs a stated reason in the PR), or if a pinned file differs from `SHA256SUMS`; `--literals` is the ratchet of section 2b. `package.json`: `check:truth`, added to `verify`.
- [ ] `src/tools/__tests__/product-truth-reader.test.ts` and the consistency and forbidden-value test harness (section 6); each migration PR adds its tool to the harness.
- [ ] `README.md`, `CHANGELOG.md`, version strings (`npm run check:versions`).

**PR-B: plan limits in served text read the pin.**
- [ ] `src/tools/pricing.ts`: the `limits` of `GLOBAL_PLANS` read the reader; `pricing_get_plans` gains an optional `plan` input (what the brief calls `plans_get`) and `limits_detail` plus a `limits_source` block (section 2c1). **No alias tool is registered**; the brief's names are mapped in `README.md` only (F1).
- [ ] `src/tools/alternatives.ts`, `src/tools/faqs.ts`, `src/tools/buyer-answers.ts`, `src/data/buyer-intents.ts`, and any prompt, resource or `llms.txt` text found by the PR-A inventory: every plan limit in served text becomes a template over `limit()`. (Absorbs PR #107's hand fix; whichever lands second rebases.)

**PR-B0: hand copy corrections, a separate PR with no registry dependency (reviewable on its own).** Not registry-backed and labelled as such in the PR body: remove the unsupported `HIPAA and IRS filings` statement in the USA mirror row of `src/data/website-mirror.ts`; rewrite the WhatsApp-first and sales-first positioning rows in `src/tools/alternatives.ts` (the exact rows are the PR-A inventory hits of `grep -n "WhatsApp-first\|Sales-first\|sales-first" src/tools/alternatives.ts`). These are corrections toward the recorded facts, not claims a build could make true. PR-B does not start its AC-B3 scan until PR-B0 is merged or rebased in.

**Later phase, not part of this plan's phase 1** (each needs PT-B, a real claim seed, or a separately authorised plan; section 2c): prices and the country plan tools, `tax_line`, India wording, `country_get` compliance text, `features_get` availability, `claims_*`, `promotions_list`, the Product Truth API client, withdrawal and signed control data.

## 0b. What we already know (G4)

| Source | What it said | What this plan does about it |
|---|---|---|
| PT-A (#10307) section 2, 2d | One content contract: fact record, closed `state`, `lifecycle` and `withheld` vocabularies, one location per value, per-surface projections, `truth_version`, immutable snapshots, unsigned `evaluation.json`; no price, tax or promotion in the registry | Consumed as written (section 2a); nothing redefined |
| PT-A section 9 | No signed envelope, pointer, withdrawal list, key custody or live-database comparison; a pin is accepted because a person reviewed the refresh PR and the sha256 matches | Said plainly; the pin is never called verified |
| Founder brief 2026-11-04 | Free leads 150, one source of truth, approved claims not booleans | The design above, limited to what PT-A exports |
| PLAN-HELLOG-0007..0010 (#110-#113) | 0007 PR-A owns the multi-market machinery; markets are data on it | Untouched in phase 1: PT-A exports no market fact. Their hand-written price values stay until the later phase |
| PLAN-HELLOG-0006 (#109) | `claims_list` / `claims_get` on a research snapshot | Untouched: PT-A seeds no real claim |
| PLAN-HELLOG-0005 (#108) | Category-level capability facts | Not touched |
| PLAN-HELLOG-0003 (#102) | No tool growth; one release gate | No new tool; G1-G5 applies |
| PR #107 (open) | Hand fix of 200 to 150 in `faqs` and `alternatives` | Superseded by PR-B's templating; it can merge first |
| `scripts/sync-website-mirror.mjs` | Auto-syncs only some surfaces; `COUNTRY_PRICING` and `pricing.ts` are in neither list | A test asserts the sync target list excludes the PR-B fields |

## 1. Premise (G8)

| Claim | Type | Evidence gathered | Running system? |
|---|---|---|---|
| Free-plan leads are stated as 200 in served text | wrong_fact | `grep -rnE "200 leads" src --include=*.ts` (non-test): 10 lines in `alternatives.ts` and `faqs.ts` | not required |
| The same fact is 150 elsewhere in the same server | wrong_fact | `GLOBAL_PLANS` Free limits `leads: 150`; 8 lines say 150 in `pricing.ts` | not required |
| Prices are typed per country, not read | missing_feature | `COUNTRY_PRICING` in `website-mirror.ts` | not required; **later phase (PT-B)** |
| Feature availability uses non-live tier names | wrong_fact | `PlanAvailability` fields `t1`, `t2`, `t3` in `features.ts` | not required; **later phase** |
| `truth_version` / `verified_on` are not served | missing_feature | `grep -rn "truth_version\|verified_on" src` returns no hit | not required |
| The registry export exists | external | Planned in PT-A (#10307) | **BLOCKED**: BUILD waits for PT-A's generated `product-truth/dist/` and fixture |

The live server was not queried in this session. Every claim is about `main`.

## 2. What changes

### 2a. Consumed contract (PT-A, by reference)

The MCP reads PT-A's `mcp` projection exactly as PT-A defines it. Names used here are PT-A's: `schema_version` (accept its own major), `truth_version` (`<UTC date>.<12 hex>`), `surface`, `limits`, `features`, `claims`, `urls`, `currencies`, `countries`, `withheld[{id, reason}]`, `consumers`, `forbidden_values`; per fact `value`, `unit`, `plans`, `countries` (explicit list or `global`), optional `effective_from` / `effective_until`, `lifecycle` (`live | beta | pilot | roadmap`), `provenance` (`enforced | decision | derived`), `verified_on`, `evidence_ref`; `unlimited` is the string `unlimited`; `withheld` reasons are exactly `draft`, `undecided`, `withdrawn`, `expired`, `future`, `surface_not_approved`; the report `evaluation.json` (`generated_at`, `next_transition`, `valid_until`, `content_digests`) is unsigned and mutable. `pricing`, `tax` and `promotions` are reserved by PT-A and absent until PT-B; a pin carrying one fails the build until the later phase is approved. The MCP defines no field of its own and no money type.

### 2b. Rules the MCP enforces on what it reads

1. **Lookup.** A fact is read by its id in its one location. Absent from its section and not in `withheld` is **unknown**; absent never means a default. PT-A forbids scope variants and a resolver, so the MCP does none.
2. **Result type.** `{status: "served", value, unit, verified_on, lifecycle}` or `{status: "withheld", reason}` where `reason` is one of PT-A's six or the consumer-side `stale`; unknown ids return `{status: "unknown"}`. Prose rendering of a withheld or unknown result: "Not available from this server right now; check the pricing page." A response that mixes served and withheld facts lists the withheld ids; the wire shape is frozen in section 2c1.
3. **Validity at request time.** The server has a request clock, so unlike a static site it enforces validity per request: a fact is served only when `effective_from <= now < effective_until`; every fact is withheld as `stale` once `now >= valid_until` of the pinned `evaluation.json` or once `now >= next_transition`, unless a newer pin has been deployed. `/health` reports truth freshness, with an alert when fewer than 3 days remain; liveness stays separate so staleness never causes a restart loop. Responses of truth-backed tools carry `Cache-Control: no-store`, asserted through the deployed HTTP path.
4. **Published defaults, not entitlement (PT-A 2d item 6).** The README and tool descriptions state that limits are published plan defaults; no tool derives a quota or authorisation from them. A tenant override or grandfather window can differ.
5. **Provenance is attached to the backed keys, not the tool or the whole `limits` object.** A `limits_source` block with `scope: "limits_detail"` sits beside `limits_detail`, and each backed limit carries its own `verified_on` (section 2c1). No whole-tool label is added in phase 1 because no tool is fully registry-backed until PT-B supplies prices; labelling a hand-written answer, or a mixed object as a whole, is not allowed. Handwritten commercial terms next to the limits (prices, `COUNTRY_PRICING`) are not made to look registry-approved: the README says they are not yet covered.
6. **Ratchet.** `check-product-truth.mjs --literals` scans non-test source for limit literals of ids present in the pin and for the pin's `forbidden_values` (initially `200 leads`), against the allowlist `scripts/product-truth-literals.allow` (CODEOWNERS; a test compares it with its git base and fails if it grew). It excludes `src/data/product-truth.ts` and tests, and scans template pieces, not only whole values. Values assembled in prose are covered by the AC-B3 response scan, which sees the final text.
7. **Pin integrity (interim, unsigned).** Authenticity is git review of `test-data/product-truth/**` (CODEOWNERS) plus the sha256. The refresh PR states "git-reviewed, sha256-pinned, unsigned" and shows the changed fact ids, lifecycle, scope and withholding changes. The adversarial fixtures of AC-A3 are required before a pin is merged. Because the signature mechanism does not exist, "verified" appears nowhere.
8. **Public-only boundary.** PT-A's public schema has closed objects and excludes `owner`, `approved_surfaces`, `history`, `pending_change`, `evidence_notes`, `approved_by` and `approval_ref`. The build fails, not filters, on any of them. Free email templates: the server states the public value (2); a pin in which the string `pending_change` appears fails.
9. **Recorded decisions win over the brief's examples.** Nothing on data residency (a test fails if a served string asserts a data location, targeted patterns, not the bare word). No programme values served (startup, NGO, partner are undecided). HGC is a full-stack suite: `/WhatsApp-first/i`, `/sales[- ]only/i`, `/sales[- ]first/i` fail the scan (MCP-local hygiene, not a registry fact).

### 2c. Dependency matrix: what PT-A provides, and what this plan therefore does

| Item the MCP needs | In PT-A sections 2 and 2d? | Phase 1 action |
|---|---|---|
| Free leads 150, tasks 100, accounts 20, email templates 2 (public), landing pages 0, custom fields 3, CSV rows 200; Growth custom fields and CSV rows `unlimited` | Yes (`limits`, AC-01, AC-05) | Consume (PR-A, PR-B) |
| Free email templates target 5 | Private `pending_change`; in no snapshot | Server states 2 until the product value changes |
| Growth leads and tasks `unlimited`; Free users; Free pipelines | No (PT-A seeds only what a migration states) | Stay as they are today, not claimed as registry-backed |
| Plan names (Free, Growth) | Yes (`plans`, identity only) | Consume for plan names |
| `forbidden_values`, `consumers`, `withheld`, `truth_version` | Yes | Consume (ratchet, harness, reader) |
| Prices, annual total, `tax_line`, India GST wording, currencies per market, trial terms, offers, promotions | **No.** Reserved and absent until PT-B | **Later phase, depends on PT-B.** `pricing_get_country_plans`, `country_get`, `countries_list`, `COUNTRY_PRICING` and every price string stay as they are; the USD 12 / USD 120 target is delivered by the later phase |
| Feature availability by plan and country | Schema plus a seed limited to `feature_key`s in `FEATURE_REGISTRY` that a migration or the registry gates | **Later phase.** `features_get` keeps its legacy shape until the pin covers enough features that a tool is entirely registry-backed; coverage is read from the pin at that time |
| Approved claims (SOC 2 scope, Arabic coverage) | Schema only; **no real claim seeds** | Out. `claims_*` stays on its current source; SOC 2 wording is untouched |
| Market gates (0007) | Not a PT-A concept | Not needed in phase 1: every phase-1 fact is `country_scope: global`. They return with market facts in the later phase |
| Signed envelope, `released_on`, key id, revocation file, withdrawal list, pointer, serving-time withdrawal, live-database comparison | **No. Deferred by PT-A section 9** | **BLOCKED.** Interim: git-reviewed pin, sha256, request-time `valid_until` and `next_transition` enforcement. A withdrawal is a registry revert, a new pin and a redeploy; it reaches a running process only by restart or replacement deployment, and the README says so (stdio installs and conversation history are outside any window) |
| Promotions, Product Truth API client | No | Deferred, as before; requirements recorded in section 2e |

### 2c1. Wire contract (phase 1, frozen here)

**Backed key set.** Exactly the ids PT-A exports: Free `leads`, `tasks`, `accounts`, `email_templates`, `landing_pages`, `custom_fields`, `csv_rows`; Growth `custom_fields`, `csv_rows`. Provenance is attached to these keys only. Every other key of the legacy `limits` object (users, pipelines, Growth leads and tasks, seats) is untouched and carries no provenance.

**Existing numeric fields keep their type.** `limits.leads` stays a number when served. New, additive keys on `pricing_get_plans`:

*Served:*
```json
{ "plan": { "id": "free",
    "limits": { "leads": 150, "tasks": 100, "accounts": 20 },
    "limits_detail": { "leads": { "status": "served", "value": 150, "unit": "count", "verified_on": "2026-11-04" },
                       "tasks": { "status": "served", "value": 100, "unit": "count", "verified_on": "2026-11-04" },
                       "accounts": { "status": "served", "value": 20, "unit": "count", "verified_on": "2026-11-04" } },
    "limits_source": { "scope": "limits_detail", "truth_version": "2026-11-04.3fa9c1d27b0e", "valid_until": "2026-11-18T00:00:00Z",
                       "snapshot": { "kind": "pinned", "ref": "test-data/product-truth/2026-11-04.3fa9c1d27b0e/truth.mcp.json", "sha256": "<hex>" } } } }
```
*Partially withheld* (one backed fact withheld or outside its window): that key's legacy number is `null`, its `limits_detail` entry is `{ "status": "withheld", "reason": "<PT-A reason>" }`, the other keys are served, and a top-level `withheld: [{id, reason}]` lists the ids. *Wholly withheld or stale* (`now >= valid_until` or `next_transition` with no newer pin): every backed key is `null`, every `limits_detail` entry is `{status: "withheld", reason: "stale"}`, `limits_source` stays (it describes the pin) with `"stale": true`, and the answer text is "Not available from this server right now; check the pricing page." An **unknown** id (not in the pin and not in `withheld`) is `{status: "unknown"}` and the legacy field is `null`; an unknown **plan or limit name in the request** returns `fail` listing the valid ids, as an error result. `limits_source` backs exactly the keys in `limits_detail` and says so in `scope`.

**Compatibility exception (named, here, not deferred to BUILD).** For the backed keys only, a number may become `null` when the fact is withheld, stale or unknown; no other key changes type. Old-parser expectations: a parser that reads `limits.leads` as a number sees `null` and must treat it as "not stated"; the README and `CHANGELOG.md` announce it; an old-parser fixture per state (served, partial, wholly withheld, stale, unknown) is part of AC-B5. Prose answers (`faqs_get_site`, `alternatives_get`, `buyer_answers`) render the withheld sentence in place of the number.

### 2e. Requirements recorded for the deferred follow-ups

For the API client plan: monotonic version ordering against the **active** version; same version with a different payload rejected; atomic whole-view replacement with the payload captured together per request; a revoked or withdrawn record persisted so a restart on an older snapshot does not resurrect it; authenticated fetch; bounded fetch time and body size; jittered, serialised refresh per replica. For the promotions plan: a price shown with an offer needs `list` and `effective`, a withdrawal path covering every surface that embeds the discounted price, and a time-window answer that is clearly current-only unless the registry supplies intervals. For the price phase: a decision table for country context, the 0007 gates, India tax wording while the product code and documentation disagree on whether the GSTIN changes the price, and nullable price fields listed as visible changes.

## 3. Affected files

| Area | Files | PR |
|---|---|---|
| Pin and generator | `test-data/product-truth/**`, `test-data/product-truth/FLOOR`, `scripts/{build-product-truth.mjs,check-product-truth.mjs,product-truth-literals.allow}`, `src/data/product-truth.ts`, `src/lib/product-truth.ts`, `src/tools/tool-types.ts`, `package.json`, `.github/CODEOWNERS` | A |
| Truth freshness in health | `src/lib/content-freshness.ts`, `src/server.ts` (health) | A |
| Limits and served text | `src/tools/{pricing,alternatives,faqs,buyer-answers}.ts`, `src/data/buyer-intents.ts`, `src/tools/output-schemas.ts` | B |
| Copy corrections | `src/data/website-mirror.ts` (USA compliance string only), the positioning rows of `src/tools/alternatives.ts` | B0 |
| Prompts, resources, `llms.txt` text that quote a limit | `src/prompts.ts`, `src/server.ts` (resources), `src/tools/llms-txt.ts` (inventory decides) | B |
| Docs and release | `README.md`, `CHANGELOG.md`, version strings, `deploy/` note | each |
| Tests | see section 6 | each |

Not touched: `access.ts`, `server.json`, `smithery.yaml`, `scripts/sync-website-mirror.mjs`, the bot-governance tools, `features.ts`, `claims.ts`, `countries.ts`. This plan edits neither hellocrm nor hellocrmwebsite.

## 5. Blast radius and caller inventory

Tools changed in phase 1: `pricing_get_plans`, `alternatives_get`, `faqs_get_site`, `buyer_answers`; no new tool. PR-A's inventory is built from the pin, not from one grep: for **every exported limit id** (leads, tasks, accounts, email templates, landing pages, custom fields, CSV rows, `unlimited`) and the legacy spellings of each (users, seats, pipelines are listed as intentionally uncovered), it lists every renderer and template in `src/tools`, `src/data`, `src/prompts.ts`, `src/server.ts` resources and `llms.txt` text, **including `countries.ts`, `country_get` and `countries_list`, which are unchanged in phase 1 and are inventoried for any limit they state**. Every hit is assigned to PR-B, recorded as intentionally uncovered, or recorded as history (a changelog line stays). External callers cannot be listed from the repo. The SDK client round trip is not evidence that existing parsers cope, so PR-B replays the captured baseline responses, errors and structured output through the new shapes and lists every key whose type or nullability changes.

## 6. Acceptance criteria (per PR; none weakened during implementation)

**PR-A (infrastructure; no served change)**
- **AC-A1** Every response of every tool is byte-identical to the baseline fixtures; `tools/list` is identical; tool count equals `main`; SDK round trip succeeds on HTTP and stdio; `annotations.test.ts` and `registry.test.ts` pass.
- **AC-A2** Generation: a sha mismatch fails the build; an unknown `schema_version` major fails; a pin whose `surface` is not `mcp` fails; a pin carrying `pricing`, `tax` or `promotions` fails; a hand-edited generated file fails `check:truth`; output is byte-identical on two runs.
- **AC-A3** Contract conformance and adversarial pins (omitted optional `effective_from` / `effective_until` are accepted; mismatched-report fixtures of section 0a fail): the copied `fixtures/contract-v1` matches its `SHA256SUMS`; the reader accepts the valid public projections and rejects the invalid set (a state, lifecycle or withheld reason outside the closed lists; a float amount; a private-only field in a public record; a report key named `verified_on`); an expired or future-dated record, a record with an unknown or missing window instant, a string containing `pending_change`, oversize or script-like strings and an unknown key each fail or are withheld.
- **AC-A4** Reader with an injected clock, one captured instant per request across structured output, narrative, prompts and resources, and a test that starts the server and then advances the clock past `valid_until` and repeats the same calls on the running process: served at `effective_until - 1ms`, withheld at `effective_until`; every fact `stale` at `valid_until` and at `next_transition` with no newer pin; each of the six PT-A reasons and `unknown` returned for a fixture; `Cache-Control: no-store` on the deployed HTTP path; `/health` degrades truth freshness without failing liveness.
- **AC-A5** The ratchet passes with the allowlist it ships and fails on a fixture that adds a limit literal; the harness runs the consistency and forbidden-value checks over an empty tool set.
- **AC-A6** Inventory: the grep of section 5 is run, every hit is assigned, and the sync-script target list excludes the PR-B fields.
- **AC-A7** Pin lifecycle: `check:truth` fails when the pinned `truth_version` is not the last entry of the pinned `index.json` without a stated rollback reason, and a forward re-pin below `FLOOR` fails (an application rollback is a documented, bounded exposure, not a tested guarantee); a refresh dry run opens a PR listing changed fact ids; a missed-refresh alert fires in a test (the refresh is a locally scheduled job because `.github/workflows` is billing-blocked; owner: the registry owner and Rushabh).

**PR-B (limits in served text)**
- **AC-B1** `pricing_get_plans` returns `limits_detail` for exactly the backed key set of section 2c1, `limits_source` equal to the pin, and each limit's own `verified_on`; no legacy key outside the backed set carries provenance; no other tool carries them.
- **AC-B2** Cross-surface consistency: for every id the export lists under `consumers: ["mcp"]`, the value each tool states equals the pin. Pinned: Free leads 150 in `pricing_get_plans`, `alternatives_get`, `faqs_get_site`, `buyer_answers`; tasks 100; accounts 20; email templates 2.
- **AC-B3** Forbidden-values scan over every changed tool with every fixture argument combination and over prompts, resources and `llms.txt` text: no `forbidden_values` pattern of the pin, no `200 leads`, no targeted data-residency assertion. The MCP-local positioning patterns (`/WhatsApp-first/i`, `/sales[- ]only/i`, `/sales[- ]first/i`) and the HIPAA check run from PR-B0 onward. The scan covers narrative text.
- **AC-B4** `grep -rnE "200 leads" src --include=*.ts` returns nothing outside tests; the allowlist has shrunk.
- **AC-B5** Compatibility (sections 2c1 and 7f): against the captured baseline every existing `limits` field keeps its type when served; the five old-parser fixtures (served, partial, wholly withheld, stale, unknown) pass; error shapes and structured output are unchanged; every new key is listed.
- **AC-B6** NEGATIVE, two separate tests. (a) Runtime: with an injected test pin (fixture, never deployable) in which a backed fact is listed under `withheld`, the tool returns the withheld object and prose, not a default; with an id absent from both its section and `withheld`, it returns `unknown`; the two outcomes differ. (b) Build time: a template naming an id the real pin lacks fails `verify`.
- **AC-B7** Regression: against the captured baseline every response is byte-identical **except** the allowed text changes, which are exactly: the backed-limit values and sentences the PR-A inventory assigned to PR-B (200 becomes 150), and the new additive keys of section 2c1. Every price string, `COUNTRY_PRICING` row, India wording, feature availability value, claim, and the unchanged country tools are byte-identical. The PR-B0 text changes are covered by PR-B0's own baseline comparison, which lists its exact rows.

## 7b. Smoke test (expected only; the BUILD PR records observed results)

| # | Call | Expected |
|---|---|---|
| 1 | `pricing_get_plans({"plan":"free"})` | `limits.leads` 150, `limits_source.truth_version` present |
| 2 | `faqs_get_site` Free-plan answer and `alternatives_get` Free row | 150 |
| 3 | `buyer_answers` Free-plan answer | 150, 100 tasks |
| 4 | pattern scan of every response above | no AC-B3 match |
| 5 NEGATIVE | test pin with the Free leads fact in `withheld`, repeat call 1 | `limits.leads` null, `limits_detail.leads` withheld with its reason, withheld prose, no number |
| 6 REGRESSION | `pricing_get_country_plans({"country":"eg"})` | identical to the baseline fixture |

## 7e. Competitors

Competitor MCP servers were not read this session. Competitor prices and limits are not served (research rule R9).

## 7f. Compatibility test: per-tool contract matrix

Fixtures are captured from the deployed server before PR-A, or from `main` if the server is unreachable (BLOCKED, then stated).

| Tool | PR-A | PR-B |
|---|---|---|
| `pricing_get_plans` | none | + `limits_source`, `limits_detail`, optional `plan` input; existing numeric `limits` unchanged when served, `null` for a backed key when withheld, stale or unknown (named exception, section 2c1) |
| `alternatives_get`, `faqs_get_site`, `buyer_answers` | none | limit text from the pin; 200 becomes 150 (named correction) |
| every other tool | none | none |

**Compatibility exception (named).** PR-B replaces a hand-written value that was already wrong (200 leads) and allows a backed number to be `null` when truth is unavailable (section 2c1). PR-B0 removes an unsupported `HIPAA and IRS filings` statement and rewrites the positioning rows. These are exceptions to D-EXP-16 (additive only), authorised by D-EXP-51. Nothing else is removed.

## 8. Risks and edge cases

| Risk | Mitigation |
|---|---|
| Missed refresh withholds every backed fact; replicas may disagree during a deployment | Refresh deadline: at least weekly and within two business days of a limit change; the refresh approver and the deployment owner are the registry owner and Rushabh; a missed-refresh runbook (re-pin, or accept withheld answers) is part of the PR-A deploy note; a skew between replicas is accepted for one deployment and noted |
| Repository defaults precede or lag deployed enforcement | The refresh PR carries the registry owner's attestation of current enforcement tied to the deployed product state, not only a migration file |
| Private synthetic fixture shipped | A package/release exclusion test asserts `test-data/**` is absent from the published package and the Docker image's served assets |
| Pin older than the product after a limit change | Per-limit `verified_on` served; request-time `valid_until`/`next_transition` withholding; `check:truth` proves reproducibility only, so freshness is the reader's job |
| A pin that is wrong but green | Said plainly (section 2b item 7): git-reviewed, unsigned; a limit change needs the registry owner's attestation of current enforcement in the refresh PR |
| A withdrawn fact stays live until redeploy | Stated in the README and section 2c; a drill is recorded in the BUILD PR with measured propagation time; the hosting platform is named there (the repository ships a `Dockerfile`) |
| Two truth snapshots (0005/0006 and this one) disagree | Phase 1 touches no capability or claim surface; overlap with 0005 is an owner action recorded for the later phase |
| Private data in a pinned export | Public-only schema, closed objects, fixture excluded from served assets, `pending_change` string check |
| Tool-selection degradation | No new tool; the brief's names are documentation only (F1) |
| Cross-repository skew with the website | Agreement on `truth_version` is an eventual-consistency target with a skew alert, not a release gate |

## 9. What this deliberately does NOT do

No price, tax line, currency, trial term, offer or promotion work: PT-B. No feature-availability, claim or compliance-statement migration. No signed envelope, key lifecycle, withdrawal list or serving-time withdrawal. No live API client and no MCP-side resolution logic or arithmetic. No data-residency sentence. No FAQPage schema. No draft programme served. No edit to hellocrm, hellocrmwebsite or the registry. No change to the bot-governance tools. No `pricing_get`, `plans_get` or `claims_get` duplicate and no alias tool.

## 10. Decisions owed

- **F1** Brief tool names versus tool count: map `pricing_get` and `plans_get` to the existing tools in the README only; no tool is added (0003 caps tool growth).
- **F2** Closed by reference: the content contract is PT-A (#10307) section 2 and 2d.
- **F3** India wording while the registry has no tax note: unchanged in phase 1; decided with PT-B.
- **F4** Startup, NGO and partner programme values: not in recorded decisions; nothing served.
- **F5** Refresh path for the pinned export: a scheduled PR with a human merge (default).
- **F6** Whether the cuts of `promotions_list` and the API client stand (default: cut).

## 11. Findings outside this plan (recorded, not fixed here)

- `src/data/website-mirror.ts` USA `compliance: "SOC 2, HIPAA and IRS filings"` asserts HIPAA; the mirror comment says SOC 2 is "certified" (`grep -n "HIPAA\|certified" src/data/website-mirror.ts`). PR-B removes the HIPAA and IRS statement; the "certified" comment and SOC 2 wording wait for a claim seed.
- `src/tools/alternatives.ts` describes HelloGrowthCRM as WhatsApp-first or sales-first in several rows (`grep -n "WhatsApp-first\|Sales-first" src/tools/alternatives.ts`); PR-B owns the rewrite.
- `COUNTRY_PRICING` USA row `growthPriceShort: "$10/user/mo"` states the annual price as a monthly equivalent; the decision is USD 120 per user per year upfront; the later price phase owns the fix.

## 12. Estimated token cost

Estimate, not a quote.

| PR | Low | Expected | High |
|---|---|---|---|
| A (pin, generator, reader, ratchet, harness) | 0.8M | 1.1M | 1.6M |
| B0 (copy corrections) | 0.1M | 0.2M | 0.3M |
| B (limits in served text) | 0.5M | 0.8M | 1.2M |
| **Phase 1 total** | **1.4M** | **2.1M** | **3.1M** |

The later price, feature and claim PRs are estimated by their own plan. This plan PR: about 0.4M.

## 13. Validation (this plan PR)

- **PASS**: plan id 0011 free: REST PR list and remote `plan/` branches show PLAN-HELLOG-0001 to 0010 only.
- **PASS**: `main` @ `5190a02`: `200 leads` in 10 non-test lines of `alternatives.ts` and `faqs.ts`; `COUNTRY_PRICING` holds per-country price strings; `features.ts` uses `t1/t2/t3`; no `truth_version` in `src`; 91 `defineTool(` calls.
- **UNVERIFIABLE**: the live server; competitor MCP inventories.
- **BLOCKED**: the PT-A generated artifact and fixture (hellocrm #10307, a plan PR); BUILD stays blocked until they exist.
- **PASS**: PT-A section 2 and 2d read in full for this revision.

## Review record

| Reviewer | Plan version | Verdict | Disposition |
|---|---|---|---|
| Astra (blind) | rev 1 | REJECT | Seven blockers accepted: infrastructure-only PR-A, three-axis contract, derived legacy keys, API client cut, request-time temporal check, gates in the reader, public-only export |
| Astra (blind) | rev 2 | REJECT | Folded in rev 3: market context, compliance strings, stale and partial responses, one date vocabulary, safe pins |
| Astra (blind) | rev 3 | ACCEPT-WITH-CHANGES | List-price view, wire schemas, market classification, expiry coverage, compatibility |
| Astra (blind) | rev 3 after contract update | REJECT | Reader targeted a signed-envelope contract PT-A does not provide; replaced by rev 4 |
| Astra (blind) | rev 4, against PT-A | REJECT | Four blockers folded once into rev 4 (fold note in the Revision 4 section) |
| Astra (blind) | rev 4 after the fold | ACCEPT-WITH-CHANGES | Carried as binding BUILD requirements (the note after the Revision 4 section) |

- **Human approval before ship:** founder decides at merge; this is a plan PR, no build.
- **What left the machine:** the plan text only, through `ask-sol.mjs` (egress gate CLEAN); no keys, no customer data.

## Revision 4 (2026-11-04): rewrite against PT-A

Astra blind, run once against PT-A, returned REJECT on revision 3 for: (1) a reader aimed at a different contract (signed envelope, `released_on`, key id, revocation file); (2) withdrawal and rollback with no mechanism in a compiled snapshot; (3) PR-B and PR-C needing prices and claims PT-A does not seed (PT-B is held); (4) lookup assuming a resolver and scope variants PT-A forbids; (5) an undefined `country_required` reason in the wire contract. Disposition: (1) all signature, envelope, `released_on`, key and revocation text removed; the envelope fields are PT-A's `truth_version`, `valid_until` and the pin sha256; (2) withdrawal and rollback are stated as registry revert, new pin and redeploy, with a pin-lifecycle check (AC-A7) and BLOCKED for anything faster; (3) prices, tax, features, claims and promotions moved to a later phase with a dependency matrix (section 2c); phase 1 is the plan limits PT-A exports; (4) lookup is by id in one location, no resolver, no scope variants, no market context in phase 1; (5) `country_required` removed together with the price tools it belonged to.

**Fold of the rev 4 review (one fold):** Astra returned REJECT on revision 4 for (1) a wire contract that deferred the stale and withheld schemas to BUILD and changed `limits.leads` from number to object; (2) provenance attributed to a `limits` object that mixes backed and hand-written keys; (3) acceptance criteria that could not all pass (byte-identical versus the HIPAA and positioning edits; a runtime missing-fact test versus a build-time rejection); (4) `evaluation.json` accepted without validating its binding to the snapshot. Folded: section 2c1 freezes the served, partial, wholly withheld, stale and unknown shapes with a named compatibility exception (numbers keep their type when served; `null` only for backed keys when truth is unavailable); provenance is scoped to `limits_detail` and the enumerated backed key set; the positioning and HIPAA edits are a separate PR-B0 and AC-B7 lists its allowed text changes; AC-B6 is split into a runtime test and a build-time test, and unknown differs from withheld; `evaluation.json` is validated (schema, instant ordering, `content_digests` bound to the pinned snapshots, optional windows) with mismatched-report fixtures. Also added: a `FLOOR` file against rollback, a shrink-only ratchet allowlist, per-request single clock, an inventory built from every exported limit id including the unchanged country tools, a refresh runbook and a fixture-exclusion test.

**Review record, re-run after the fold: ACCEPT-WITH-CHANGES.** No further fold. Binding for PR-A and PR-B: (1) the rollback guarantee is withdrawn as above and documented as a bounded exposure, with a test of a forward re-pin only; (2) an id listed under `withheld` stays a valid template reference, and the literal ratchet keeps a consumer-owned list of protected ids (ids only, no values) so a removed fact cannot reopen a hand-written fallback; tested served, withheld, absent across successive pins; (3) the old-parser fixtures preserve authentic pre-change parser behaviour, record which clients break, and the release is declared breaking or migrated by decision, with AC-B5's "structured output unchanged" amended to permit the named nullability; (4) inventory completion is a scope gate: every rendering of a backed id migrates (including in the country tools), and "intentionally uncovered" applies only to users, seats and pipelines; an expired-pin test exercises the unchanged surfaces too; (5) the provenance placement is one decision (inside `plan`, beside `limits_detail`), `tool-types.ts` is not extended and `output-schemas.ts` freezes the exact shapes for the default multi-plan, filtered and withheld responses, validated on structured output and serialised content; refresh is scheduled against `min(valid_until, next_transition)`; a future-dated report, clock skew and each optional bound absent versus malformed have fixtures; a startup test proves the production package runs without `test-data/**`; the hosting platform and an executable refresh and withdrawal runbook, including who may authorise an emergency deploy under G1-G5, are named before BUILD acceptance; the alias-tool option in F1 is removed (no tool growth); PR-B0 owns the copy corrections; the stale commercial copy beside correct limits is tracked as a separate release risk.

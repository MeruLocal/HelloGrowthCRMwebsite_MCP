# Plan — MCP: proof layer for product claims (Claim Registry tools, proof fields on features, shared name map)

- **Revision:** 3 (2026-10-30) — applies founder rule D-EXP-22 (§14): PR-B no longer attaches limits, LIVE-LIMITED or PLANNED status to existing `features_*` rows. Rev 2 (2026-10-30) — reviewer decisions on F1–F4, delegated by the founder: §13. Rev 1 was the draft. Sol/Astra BLOCKED (§10).
- **Plan id:** PLAN-HELLOG-0006, allocated by hand on 2026-10-30 from three sources: `git ls-tree origin/main docs/plans/` has no `plan-hellog-*` file; `git branch -r` shows `plan/hellog-0001..0005` only; the REST PR list (`gh api repos/MeruLocal/hellogrowthcrmwebsite_mcp/pulls?state=all`) shows `PLAN-HELLOG-0001..0005` as the only plan titles (0004 = #106, 0005 = #108). GraphQL `gh pr list` is blocked in this environment.
- **Branch:** `plan/hellog-0006-mcp-proof-layer` · **Repo:** MeruLocal/HelloGrowthCRMwebsite_MCP · **Trunk:** `main` (head `5190a02`)
- **Mode:** PLAN (plan only — no code in this PR). Each BUILD below is its own PR carrying `Implements: PLAN-HELLOG-0006 (PR-x)`.
- **Change tags:** `public_api` (two new read tools, one new resource, additive response fields, one added llms.txt section), `product` (what the server says is proven about HGC capabilities)
- **Tier:** T2. Owed: acceptance_criteria · blast_radius · caller_inventory · compatibility_test · competitor_scan · intent · necessary_changes · planned_file_coverage · premise_check · smoke_test
- **Restricted areas touched (G2):** none. No auth, billing, migration, secret or email-send file. `src/tools/access.ts` is not touched; the new tools are anonymous read tools like `features_*`.
- **Freeze in force?** Yes, inherited. The PLAN-HELLOG-0003 release gate (#102 §0c, widened by 0004 and 0005) blocks a public deploy of any new anonymous surface until G1–G5 are deployed and verified. All three BUILD PRs here add an anonymous surface and obey it: they may merge, they do not deploy publicly before the gate.
- **Origin:** founder decision **D-EXP-18** (approved 2026-10-30), "proof layer for product claims". Spec: research suite `research-methodology/proof-layer-2026-10-30.md` (branch `claude/usa-competitors-list-5373vp`), §6 row "MCP". Applies with D-EXP-15 (last verified), D-EXP-16 (additive only — wins on conflict), D-EXP-17 (honest tables).
- **Date:** 2026-10-30

## 0. Intent

- **Claim.** The spec's goal is "for every major sentence on the marketing site, a path to evidence showing why it is true — for a buyer, for Google and for an LLM". For the LLM path, this server is the surface. Today it serves capability statements with no evidence: `features_list` / `features_get` return title, summary, plan availability and a learn-more link — no product status, no limits, no screenshot, doc, video, release or verified date. There is no tool or resource that serves a claim and its proof. And there is no single map from what a buyer calls a category ("ATS", "recruitment software", "candidate management") to the product module, the docs page and the MCP tools that answer it.
- **Mechanism.** Three additive BUILD PRs. **PR-A** pins an exported Claim Registry snapshot (research repo `claims/registry/claims.json`, PR to follow) and serves it through two new read tools, `claims_list` and `claims_get`. **PR-B** adds one new `proof` object to each `features_list` / `features_get` row (status, plans, regions, limitations, screenshot, doc_url, video_url, changelog_ref, last verified, proof score), joined from the same snapshot; where a feature shipped in a curated release, `proof.changelog_ref` names the version and the tool `changelog_get_release`. **PR-C** serves a shared name map — category → synonyms → product module name → docs path → MCP tool names — as one resource, and adds it as one new section of the generated llms.txt.
- **Observable.** An assistant asked "does HelloGrowth have an ATS?" can read the name map, find `applicant-tracking-recruitment`, see the module name, the docs path (or that none exists), and the claims it should call, then call `claims_get` and get status, plans, limits, evidence links, dates and proof score. `features_get` on any matrix feature returns the existing fields byte-identical plus a `proof` block, or `proof: null` with a reason.
- **Risk.** Serving a claim above its code-proven status; leaking internal evidence (private file paths, owners, customer names without permission); two truth snapshots (this plan and 0005 PR-B) disagreeing; duplicating 0005's category records; tool-count growth (0003: selection degrades past about 30–50 tools); a proof score read as a deletion gate. Mitigations in §8.

## 0a. Necessary changes   (planned-file coverage)

PR-A — Claim Registry snapshot + `claims_list` / `claims_get` (after the research Claim Registry export; cross-check leg after 0005 PR-B)
- [ ] `test-data/claim-registry/<as_of>/claims.json` + `SHA256SUMS` — pinned copy of the research export. Refreshing it is a human PR that changes the sha, so approval binds to the exact payload (0002 blocker 1, same rule as 0005 PR-B)
- [ ] `scripts/build-claims-data.mjs` — reads the pinned JSON, applies the **public filter** (§2), writes `src/data/claims.ts`; header carries source sha256 and `as_of`. Never hand-edited
- [ ] `src/data/claims.ts` — generated output
- [ ] `src/tools/claims.ts` — `claims_list` and `claims_get` via `defineTool` / `ok` / `fail` from `src/tools/tool-types.ts` (same pattern as `src/tools/features.ts`)
- [ ] `src/tools/index.ts` — register both in `tools`; `src/tools/annotations.ts` (read-only set), `src/tools/titles.ts`, `src/tools/output-schemas.ts` — one entry each (additive)
- [ ] `src/server.ts` — one resource `hellocrmwebsite://site/claims` (application/json, the same filtered records), so a client that prefers resources needs no tool call
- [ ] `package.json` — `check:claims` script (runs the build with `--check`: fails if `src/data/claims.ts` differs from what the pinned JSON produces), added to `verify`
- [ ] `src/tools/__tests__/claims.test.ts`, `src/data/__tests__/claims-public-filter.test.ts` — gates in §6
- [ ] `test-data/fixtures/tools-list-<date>.json`, `test-data/fixtures/resources-<date>/*.json` — **reuse 0005 PR-A's fixtures if merged**; otherwise PR-A captures its own from `main` before any edit (`test-data/` does not exist on `main` today)

PR-B — proof fields on `features_list` / `features_get` (after PR-A)
- [ ] `src/data/feature-claim-map.ts` — feature slug → `claim_id[]`. **Preferred source:** a `mcp_feature_slugs` column in the research export, so the map is generated. **Fallback:** a reviewed hand map in this repo, with a test that every slug exists in `FEATURES` and every claim id exists in the snapshot. Research decision R1 (§11)
- [ ] `src/tools/features.ts` — add **one new key `proof`** to each row. `features_list` rows get the compact form `{status, proof_score, band, last_verified, claim_ids}`; `features_get` gets the full form (§2). No existing key, value, input or description text changes. The existing `availability` key (plan tiers) is **not** renamed or reused — the D-EXP-17 legend lives at `proof.availability_legend` to avoid a name collision
- [ ] `src/tools/changelog.ts` — read only. PR-B resolves `changelog_ref` against `CHANGELOG_RELEASES`; a version that does not resolve is served as `null` with a reason, never guessed
- [ ] `src/tools/output-schemas.ts` — extend the existing `features_list` schema with the optional `proof` property (additive; existing properties unchanged)
- [ ] `src/tools/__tests__/features-proof.test.ts` — gates in §6

PR-C — shared name map (after 0005 PR-C; after PR-A)
- [ ] `scripts/build-name-map.mjs` — joins **0005 PR-C's generated category records** (`src/data/category-map.ts`: category id, name, `aliases`) to: product module name (from the research category YAML `live_modules`, pinned with the 0005 snapshot), docs/help path (live sitemap URLs only), and MCP tool names (validated against the `tools` registry). Synonyms are **read from 0005's records, not re-sourced** — one source, no second alias list
- [ ] `src/data/name-map.ts` — generated output, header with source shas and `as_of`
- [ ] `src/server.ts` — one resource `hellocrmwebsite://site/name-map` (application/json)
- [ ] `src/tools/llms-txt.ts` — one **new** section "Category names" generated from the name map (one line per category: name, top synonyms, module, docs path or "no dedicated doc", tools). Every existing section is unchanged
- [ ] `src/well-known.ts` — one added line in the MCP-host llms text pointing to the name-map resource (existing lines verbatim)
- [ ] `src/data/__tests__/name-map.test.ts`, extend `src/tools/__tests__/llms-txt.test.ts` — gates in §6

## 0b. What we already know   (G4)

| Source | What it said | What this plan does about it |
|---|---|---|
| D-EXP-18 spec §1 | MCP `features_list`/`features_get` exist but carry "no availability, plan, limits, screenshot or doc fields"; "feature pages don't link to their release"; "no website ↔ docs ↔ product nav ↔ MCP tool map" | PR-B, PR-B `changelog_ref`, PR-C respectively |
| D-EXP-18 spec §2–3 | Proof score 0–100, live module a precondition (score 0 if not LIVE/LIVE-LIMITED); bands 80/60/40; under D-EXP-16 a low score never removes a claim; registry columns incl. `plans`, `default_enabled`, `regions`; "status is never raised without code proof" | Served as computed by the research repo; this server **never computes or raises** a score or status (AC-04) |
| PLAN-HELLOG-0005 (#108, rev 3) | Category records `{category, aliases, modules, depth, status, availability, evidence, limitations, not_built, canonical_urls, …}` from `growth/categories/*.yaml`; served as resource + `kind:"category"` in 0004 search/fetch; **rev 3 §13.2 M1: no `categories_list`/`category_get` tools** (DEFERRED to 0003 `capability_check`, founder F5); PR-B pins a Product Truth Audit snapshot with sha256 | PR-C **consumes** 0005's records for category id + synonyms, does not rebuild them. PR-A **cross-checks** against 0005 PR-B's snapshot instead of pinning a second audit copy. See §0c |
| PLAN-HELLOG-0004 (#106) | `search`/`fetch`, `/mcp/knowledge` profile, `outputSchema` coverage, query suite | `claims_*` join the knowledge profile when it exists; no search kind is added for claims in this plan (§9) |
| PLAN-HELLOG-0003 (#102) | Truth policy, status vocabulary, deny list; tool selection degrades past about 30–50 tools; additive only | Two tools added (founder named them in D-EXP-18); name map is a resource, not a tool. Tension recorded as founder decision F1 — **resolved rev 2 (§13 F1): the two tools stay, under the shared stance with #108** |
| `main` code, 2026-10-30 | 89 `defineTool(` calls; 9 resources; `features_list` already returns an `availability` object = plan tiers; `CHANGELOG_RELEASES` has 6 curated releases (1.0.0–1.5.0) | `proof` is a new key, not `availability`; most features will have `changelog_ref: null` — that is honest, not a bug (AC-06) |
| Research suite, branch `claude/usa-competitors-list-5373vp` | `claims/claims.csv` (2,411 rows, website-claim fix list with `claim_id`, `checked_on`, `expiry`, `confidence`); `claims/product-truth-v5/*`; 9 category YAMLs with `synonyms`, `live_modules`, `limitations`; **`claims/registry/` does not exist yet** | PR-A is blocked until the export lands (§2a dependency 1). The plan fixes the JSON contract the research PR must produce (§2) |

## 0c. Coordination with #108 (PLAN-HELLOG-0005) — reference, do not duplicate

| Concern | Owned by | This plan |
|---|---|---|
| Category records, depth, category-level availability, `aliases`/buyer terms | 0005 PR-C | Reads them. Adds only module name, docs path and tool names, keyed by 0005's category id |
| `categories_list` / `category_get` tools | 0005 §13.2 M1 → **RESOLVED (0005 F5, rev 5): not added** | Not added here. The name map is a resource keyed by 0005's category id (rev 2: the conditional "field of `category_get`" branch is gone) |
| Product Truth Audit snapshot + `check:product-truth` | 0005 PR-B | Not re-pinned. PR-A adds a test: every claim whose capability matches a pinned 0005 audit row has the same status |
| Agents `status`, `access` block | 0005 PR-A | Untouched |
| Search/fetch `kind:"category"` | 0005 PR-C / 0004 Phase B | Untouched; no `kind:"claim"` here |

## 1. Premise   (G8)

| Claim | Type | Evidence gathered | Running system? |
|---|---|---|---|
| No tool or resource serves claims or proof | missing_feature | `grep -rn "claims_" src` on `main` → no hit; `resources/list` source in `src/server.ts` lists 9 URIs, none for claims | not required |
| `features_*` have no proof fields | missing_feature | `src/tools/features.ts`: `Feature` interface = slug, title, category, summary, bullets, free/t1/t2/t3, learnMoreHref, aliases. Responses add `coverage` and `availability` (plan tiers) only | not required |
| Features don't link to releases | missing_feature | `changelog_get_release` exists (`src/tools/changelog.ts`, 6 curated releases); no reference from `features.ts` | not required |
| No shared name map | missing_feature | Synonyms exist only in research YAML (`synonyms:`) and, once built, in 0005's `aliases`; no module-name, docs-path or tool-name join anywhere on `main`; `llms-txt.ts` groups list features/agents/industries but no category names | not required |
| Brief said "117 tools exist" | count | `main` has **89** `defineTool(`; #106 measured live `/version` tools 77 / total 89. 117 may include tools in open PRs (#95, #96, #103) — **UNVERIFIABLE** here. Plan uses 89 | not required |

The live server was not queried in this session; all claims are about `main` and the research branch.

## 2. What changes

Smallest shippable version: **PR-A alone**. It turns the Claim Registry into a served, sha-pinned, filtered surface. PR-B and PR-C each add a join on top.

**Claim record served by `claims_get`** (subset of the research columns, after the public filter):
`{ claim_id, capability, category_ids[], public_wording, status: "LIVE"|"LIVE-LIMITED"|"PLANNED"|"NOT_BUILT", plans[], default_enabled, regions[], limitations[], evidence: {product: "code-verified"|"unverified", screenshot, doc_url, video_url, demo_url, mcp_evidence[], api_evidence, customer_evidence, third_party, changelog_ref: {version, tool:"changelog_get_release"}|null}, availability_legend: "native"|"partial"|"integration"|"not_available"|"unverified", hgc_verified_on, competitor_checked_on, proof_score, proof_band, as_of, source: {file, sha256, row} }`

**`claims_list`** inputs (all optional): `category_id`, `status`, `region`, `min_proof_score`, `search` (claim id, capability, wording). Output: `total`, `coverage` (what this population is and is not — same pattern as `FEATURES_COVERAGE`), `as_of`, `sha256`, compact rows. **`claims_get`** input: `claim_id`; unknown id → `fail` with up to 5 suggestions (same pattern as `features_get`).

**Public filter (PR-A, generated, tested):**
- `HIDDEN` rows are **not served** (internal flag; founder F2 — **confirmed rev 2, §13**). Every other status in the export is served **verbatim** (the #59 README carries `BETA`, `PARTIAL`, `CONFIGURATION`, `UNKNOWN` alongside the spec's five); only `LIVE` and `LIVE-LIMITED` may carry a non-zero `proof_score`. `PLANNED` and `NOT_BUILT` rows **are** served with that status and `proof_score: 0` — nothing is presented as available.
- `product_evidence` (hellocrm file paths and routes, a private repo) is reduced to `"code-verified"` + `hgc_verified_on`; the path is never served.
- `owner` is never served.
- `customer_evidence` is served only when the registry's `customer_evidence_permission` is `named` (rev 2, F4 — the field #59 defines: blank · `none` · `anonymised` · `named`); `anonymised`, `none` and blank → `null` with `customer_evidence_permission` echoed, so a consumer can see that evidence exists but is not public (D-EXP-18 §8: no invented customer figures).
- URL fields are served only if they are `https://` and on an allowlisted host — rev 2 (F3): `hellogrowthcrm.com` (help and blog paths live there; `www.` is normalised to the apex), `mcp.hellogrowthcrm.com` (`mcp_evidence` only), and for `video_url` only `www.youtube.com`, `youtu.be`, `www.youtube-nocookie.com` (the only video host the website embeds today). The list is one exported const `EVIDENCE_URL_HOSTS` with a test; adding a host is a one-line PR. Anything else → `null` with `evidence_note: "not public"`.

**Status and score rules:** served `status` and `proof_score` equal the pinned snapshot exactly. The server never derives, rounds or raises them. A claim with status other than LIVE/LIVE-LIMITED and a non-zero score is a **build error** (spec §2 precondition). A claim below 40 is still served (D-EXP-16), with `proof_band: "below_40"` — the score sets priority, it is not a deletion gate.

**`proof` block on `features_get`** (PR-B; rev 3, D-EXP-22: the block is attached **only where the lowest linked claim status is LIVE**. For a feature whose lowest linked status is LIVE-LIMITED, PLANNED or NOT_BUILT the block is `proof: null, proof_reason: "deferred_build_first_d_exp_22"`: limits and downgrade statuses are not placed beside an existing live feature row. Those claims stay readable, with limits, on the NEW `claims_list` / `claims_get` tools. Status `DEFERRED — build first (D-EXP-22)`, mapped in §14): `{ claim_ids[], status, plans[], regions[], limitations[], screenshot, doc_url, video_url, changelog_ref, last_verified, proof_score, proof_band, availability_legend }`, each value taken from the linked claims (the lowest status and lowest score win when a feature maps to several claims — never the highest). No linked claim → `proof: null, proof_reason: "no_claim_recorded"`.

**Name map row** (PR-C): `{ category_id, category_name, synonyms[] (= 0005 aliases), module_names[], module_status: "code-verified"|"unverified", docs_path|null, docs_status: "live"|"no_dedicated_doc", mcp_tools[], claim_ids[], as_of }`. Example (from research `growth/categories/applicant-tracking-recruitment.yaml`): ATS / applicant tracking software / recruitment software / candidate management software → module "Recruitment (Jobs, Candidates, Pipeline, Interviews…)" → docs path `null` until the website category docs ship (spec §5 step 4) → tools `claims_list`, `features_get`, `content_list_industries`.

**D-EXP-17:** any served comparison-like field uses the legend in machine form: ✓ Native = `native`, ◐ Partial = `partial`, ↗ Integration = `integration`, — Not available = `not_available`, ? Could not verify = `unverified`, always with evidence and both verified dates. A row with no evidence is `unverified`, never `native`.

**WhatsApp:** described as one channel among email, SMS, voice, live chat, social and scheduling. No generated string says "WhatsApp-first" (AC-03 test over all three generated data files and the llms.txt section).

### 2a. Dependency order

1. **Research: Claim Registry v1 export** `claims/registry/claims.json` (D-EXP-18 §6 research row; PR to follow). Must carry the §2 columns; ideally `mcp_feature_slugs` (R1). **Blocks PR-A.**
2. **0005 PR-B** (Product Truth Audit snapshot). Blocks only PR-A's cross-check test. **Fallback:** PR-A ships with that test marked `skip` and a logged `BLOCKED: 0005 PR-B not merged`, and PR-B of this plan un-skips it. Never silently dropped.
3. **This plan PR-A** → **this plan PR-B** (needs the snapshot and tools).
4. **0005 PR-C** (category records). **Blocks PR-C** here. No fallback that re-sources synonyms — PR-C waits, because a second alias list is the duplication this plan exists to avoid.
5. **0004 Phase C** (`/mcp/knowledge` profile) — not blocking; when it lands, `claims_*` join it.
6. **0003 release gate G1–G5** — blocks public deploy of every PR here.
7. **#103** (LLM visibility phase 1, version 2.2.0) — not blocking; each BUILD PR rebases on it and follows `check:versions`.

0005 PR-A and this plan are independent of each other.

## 3. Affected files

| Area | Files | PR |
|---|---|---|
| Claim data | `test-data/claim-registry/**`, `scripts/build-claims-data.mjs`, `src/data/claims.ts`, `package.json` | A |
| Claim tools + resource | `src/tools/claims.ts`, `src/tools/index.ts`, `src/tools/annotations.ts`, `src/tools/titles.ts`, `src/tools/output-schemas.ts`, `src/server.ts` | A |
| Feature proof | `src/data/feature-claim-map.ts`, `src/tools/features.ts`, `src/tools/output-schemas.ts` | B |
| Name map | `scripts/build-name-map.mjs`, `src/data/name-map.ts`, `src/server.ts`, `src/tools/llms-txt.ts`, `src/well-known.ts` | C |
| Tests | `src/tools/__tests__/claims.test.ts`, `src/data/__tests__/claims-public-filter.test.ts`, `src/tools/__tests__/features-proof.test.ts`, `src/data/__tests__/name-map.test.ts`, `src/tools/__tests__/llms-txt.test.ts` | A/B/C |

## 5. Blast radius and caller inventory

- **Backward.** `features_list` / `features_get` callers (any MCP client on `/sse`, `/mcp`; `llms-txt.ts` via `callTool("features_list")`; `src/data/buyer-intents.ts` and `src/prompts.ts` name the tool) get one extra key `proof`; every existing key, value, input schema and description is unchanged. `llms-txt.ts` reads `title`/`summary`/`url` only, so the Features section output is unchanged (AC-08). `tools/list` gains exactly two names; `resources/list` gains exactly two URIs (claims, name-map); the 9 existing URIs return byte-identical output. Registry consumers of `/.well-known/mcp.json` and the server card see the higher tool count — `scripts/audit-live-mcp.mjs` and the `registry.test.ts` "every tool is registered" check are updated in PR-A.
- **Forward.** No new network host, database read or secret. All three PRs read bundled, sha-pinned files at build time.
- **Sideways.** The research repo owns the registry and the proof score; the website owns docs/help paths and the "See it in action" block (spec §5 step 3); hellocrm owns the product modules and any public category actions (spec §6 hellocrm row). A website rename of a docs path breaks a `docs_path` — PR-C's test checks every path against the pinned sitemap, and a refresh is a human PR.
- **Response size.** `features_list` adds a compact `proof` (≈ 6 fields) to ≤ 58 rows; the full block is only on `features_get`. `claims_list` pages (default 50) because the registry may hold thousands of rows.

## 6. Acceptance criteria

- **AC-01** — `claims_list` with no arguments returns `total` equal to the count of rows in the pinned snapshot that pass the public filter, plus `as_of` and `sha256` equal to `SHA256SUMS`. `claims_get` on every served id returns a record with all §2 keys present (value or `null`).
- **AC-02** — `npm run check:claims` exits 0 on the pinned snapshot, and exits 1 when `src/data/claims.ts` is hand-edited (one-byte change fixture).
- **AC-03 NEGATIVE** — no served claim, `proof` block, name-map row or llms.txt line: (a) presents a `PLANNED`/`NOT_BUILT` row as available or with `proof_score > 0`; (b) contains a hellocrm file path, an `owner`, or a non-permissioned customer name; (c) has `availability_legend: "native"` with no evidence; (d) contains a `HIDDEN` row; (e) contains the string "WhatsApp-first" (case-insensitive). One failing fixture per sub-clause.
- **AC-04 NEGATIVE (rev 3: the `features_*` rows with a non-LIVE lowest status serve `proof: null`; the lowest-status rule below still governs `claims_*` and the choice of whether to attach)** — served `status` and `proof_score` equal the snapshot for every row (test over all rows); a fixture that raises one status or score fails the build. When a feature maps to several claims, `proof.status` is the lowest and `proof.proof_score` the lowest (fixture with LIVE + LIVE-LIMITED → LIVE-LIMITED).
- **AC-05** — Every feature in `FEATURES` has `proof` or `proof: null` with `proof_reason`; every `claim_id` in `feature-claim-map.ts` exists in the snapshot; every slug exists in `FEATURES`.
- **AC-06** — Every non-null `changelog_ref.version` resolves through `changelog_get_release` (test calls the handler). A version absent from `CHANGELOG_RELEASES` is served as `null` with `changelog_reason: "release_not_in_mirror"`, never guessed.
- **AC-07** — Name map: one row per 0005 category record; `synonyms` equal 0005's `aliases` exactly (no second source); every `mcp_tools` name exists in the `tools` registry; every `docs_path` is in the pinned sitemap, otherwise `docs_path: null` + `docs_status: "no_dedicated_doc"`. The ATS row resolves "ATS", "recruitment software" and "candidate management software" to `applicant-tracking-recruitment`.
- **AC-08 REGRESSION** — `tools/list` names, `inputSchema`s and annotations for the 89 existing tools are identical to the pinned fixture; `features_list` / `features_get` outputs with the `proof` key removed are byte-identical to the fixture; the 9 existing resources are byte-identical; generated llms.txt (`index` and `full`) with the new "Category names" section removed is byte-identical. No tool, field, resource, section or line is removed (D-EXP-16).
- **AC-09** — The cross-check against 0005 PR-B's snapshot passes, or is skipped with the logged `BLOCKED` line (§2a). A skip without the line fails the test.

## 7b. Smoke test — Expected only

Env: local `npm run dev` on each BUILD branch, then the deployed host after the 0003 gate · Login: none (anonymous) · Role: MCP client (SDK `Client`, streamable HTTP)

| # | Action | Expected |
|---|---|---|
| 1 ⭐ | `tools/list` | contains `claims_list`, `claims_get`; the other 89 unchanged **(new)** |
| 2 | `claims_list {category_id:"applicant-tracking-recruitment"}` | rows with status, plans, limits, both dates, proof score; `as_of` + `sha256` **(new)** |
| 3 NEGATIVE | `claims_list {status:"NOT_BUILT"}` | rows served with `proof_score: 0`; none labelled available **(new)** |
| 4 NEGATIVE | `claims_get {claim_id:"CLM-DOES-NOT-EXIST"}` | `isError`, suggestions, no crash **(new)** |
| 5 ⭐ | `features_get {slug:"dashboard"}` | existing fields unchanged + `proof` block or `proof: null` with reason **(new)** |
| 6 | `features_get` on a feature with a linked release; then `changelog_get_release` with that version | release found **(new)** |
| 7 ⭐ | `resources/read hellocrmwebsite://site/name-map`; find "ATS" | `applicant-tracking-recruitment`, module, `docs_status`, tools **(new)** |
| 8 | `GET /llms.txt` | new "Category names" section; every other section unchanged **(new)** |
| 9 REGRESSION | `features_list` | same 58 rows, same `availability` values, `coverage` unchanged |

## 7e. Competitors

Legend (D-EXP-17): ✓ Native · ◐ Partial · ↗ Integration · — Not available · ? Could not verify. **HGC last verified: 2026-10-30** (`main` code; live server not queried). **Competitors last checked: 2026-10-30** (research-suite `mcp-competitors.csv` as cited in #108 §7e; live pages not re-checked this session). Gaps kept.

| Product | Serves claims with evidence over MCP | Feature records with limits/verified dates | Category → module → tool name map | Evidence |
|---|---|---|---|---|
| **HelloGrowth** | — Not available (PR-A adds it) | ◐ Partial (plan tiers only; PR-B adds proof) | — Not available (PR-C adds it) | `src/tools/features.ts`, `src/server.ts` on `main` |
| Attio | ? Could not verify | ? Could not verify | ? Could not verify | docs MCP exists per #108 §7e; tool inventory not read |
| Salesforce | ? Could not verify | ? Could not verify | ◐ Partial (Metadata Grounding describes its own data model, not buyer categories) | per #108 §7e |
| HubSpot | ? Could not verify | ? Could not verify | ? Could not verify | per #108 §7e |

No competitor MCP was found serving per-claim evidence, but tool inventories are pending for most, so this is **not proof of absence**. Anthropic live-page check: **UNVERIFIABLE** (not run); the PR-A BUILD re-checks Attio and Salesforce before quoting.

## 7f. Compatibility test

- Fixture capture from `main` before any edit (or reuse 0005 PR-A's): `tools/list`, 9 resources, `features_list` (all, default args), `features_get` for every slug, llms.txt `index` and `full`.
- A helper strips only the new keys/sections and diffs against the fixture (AC-08).
- `output-schemas.ts`: the extended `features_list` schema validates both the fixture (no `proof`) and new output (with `proof`).

## 8. Risks and edge cases

- **Claim above its proven status.** Status and score are copied, never computed (AC-04); multi-claim features take the lowest; NOT_BUILT/PLANNED scored 0 (AC-03a).
- **Internal evidence leak.** Public filter is generated and tested per field (AC-03b, AC-03d); URL host allowlist.
- **Two truth snapshots disagree.** No second audit pin; cross-check against 0005 PR-B (AC-09). If the registry and the audit disagree, the build prints the difference and fails — a human PR resolves it in the research repo.
- **Duplicating #108.** Synonyms come only from 0005 records (AC-07); no category tools; no new search kind.
- **Tool count.** +2 tools (89 → 91) against 0003's degradation concern. Mitigated by the knowledge-profile split (0004 Phase C) and by also serving the same data as a resource. F1 resolved rev 2 (§13): the tools stay; a later switch to resource-only would be a founder decision reversing D-EXP-18.
- **Score misuse.** Served with `proof_band`; `coverage` text states the score sets proof-work priority and never removes a claim (D-EXP-16). Not merged with the other founder scores (D-EXP-11).
- **Stale snapshot.** `as_of` and `expiry` served; a claim past `expiry` gets `stale: true` (data, not removal). Refresh is a human PR that changes the sha.
- **Sparse proof today.** Spec §1: one app screenshot, 13 help articles, 6 curated releases. Most `proof` fields will be `null`. That is the honest state, and it is the queue for the website and hellocrm proof work (spec §5).

## 9. What this deliberately does NOT do

- No `categories_list` / `category_get` — 0005 §13.2 M1 (founder F5 there).
- No `kind:"claim"` in 0004 search/fetch; no `outputSchema` work beyond the two new tools and the additive `features_list` property.
- No public category **actions** (recruitment, logistics, BOQ) — those are hellocrm's `crm-mcp-server` (spec §6 hellocrm row).
- No website change (proof block, methodology page, docs paths) and no screenshots, videos or demo workspaces — website and hellocrm plans.
- No removal, trimming or rewording of any existing tool, description, feature row, agent text or llms.txt line. Anything a reviewer proposes to cut is recorded as **DEFERRED — founder hold (D-EXP-16)**. None was proposed in rev 1.
- No copy check over this server's own strings against claim bands — spec §3 makes it report-only first; it belongs in the 0003 truth guard once the registry is pinned. **DEFERRED** to that plan.

## 10. Review record

| Reviewer | Plan version | Verdict |
|---|---|---|
| Sol | rev 1 | **BLOCKED** — `AZURE_SOL_API_KEY` / `AZURE_OPENAI_API_KEY` not set |
| Astra (blind) | rev 1 | **BLOCKED** — `AZURE_ASTRA_API_KEY` not set |

Commands to run when the keys exist (from a hellocrm checkout):

```bash
node .claude/skills/rss-plan-pr/scripts/ask-sol.mjs --file <this plan> --role plan --out /tmp/0006-sol-r1.md
node .claude/skills/rss-plan-pr/scripts/ask-sol.mjs --file <this plan> --role plan --model astra --blind --out /tmp/0006-astra-r1.md
```

- **What left the machine (G9b):** nothing beyond this plan text in the PR.

## 11. Decisions owed

Founder:
- **F1 — RESOLVED rev 2 (§13): the two tools stay.** The question was: two new tools `claims_list`/`claims_get` (as D-EXP-18 names them; default) or resource-only, matching 0005's "no new tool" stance for categories?
- **F2 — RESOLVED rev 2 (§13): `HIDDEN` not served; `PLANNED`/`NOT_BUILT` served with status and score 0.**
- **F3 — RESOLVED rev 2 (§13): `hellogrowthcrm.com`, `mcp.hellogrowthcrm.com` (mcp evidence), YouTube hosts for video only.**
- **F4 — RESOLVED rev 2 (§13): `customer_evidence_permission` (#59), served only when `named`.**

Research (owner of the export):
- **R1** — Add `mcp_feature_slugs` to the export so `feature-claim-map.ts` is generated, not hand-kept.
- **R2** — Confirm the export's status vocabulary is exactly `LIVE|LIVE-LIMITED|HIDDEN|PLANNED|NOT_BUILT` and that `proof_score` is pre-computed there.

## 12. Estimated token cost

Estimate, not a quote (method: research-suite `growth/token-estimate-method.md`; low = no contingency, expected = +20 % review +25 % contingency, high = +50 % over expected). **Reuse** = builds on 0005 PR-B's snapshot convention and 0005 PR-C's category records, and 0005 PR-A's fixtures if merged.

| PR | Components (reuse) | Low | Expected | High |
|---|---|---|---|---|
| PR-A | orientation 300k (6 files) · authoring 390k (new tools file 180k, build script 90k, 3 small registry edits 120k) · 2 tests 120k · gate 250k | 1.1M | 1.5M | 2.3M |
| PR-B | orientation 275k (5 files) · authoring 220k (`features.ts` 90k, map 90k, schema 40k) · 2 tests 120k · gate 250k | 0.9M | 1.3M | 1.9M |
| PR-C | orientation 300k (6 files) · authoring 300k (generator 90k, data 40k, `server.ts` 40k, `llms-txt.ts` 90k, `well-known.ts` 40k) · 2 tests 120k · gate 250k | 1.0M | 1.4M | 2.1M |
| **Total, reuse** | | **3.0M** | **4.2M** | **6.3M** |
| **Total, fresh** | + own audit snapshot and guard 0.6M · own category synonyms 0.5M | 4.1M | 5.3M | 8.0M |

At the $3/M input rate: expected ≈ $13 (reuse), ≈ $16 (fresh); about 5× at the $15/M rate. This plan PR: about 0.2M (anchor: one plan PR = 179k–208k).

## 13. Reviewer decisions (delegated by founder, 2026-10-30)

The founder delegated F1–F4 to the delegated reviewer ("ask the reviewer and do as per the reviewer", 2026-10-30). Each was checked against `origin/main` `5190a02`, the Claim Registry README on research PR #59 (`claude/claim-registry-v1`, `claims/registry/README.md`) and the hosts hellocrmwebsite `origin/master` actually links or embeds. Rules applied: D-EXP-16 (additive only), D-EXP-17 (honest legend), D-EXP-18 (no claim above its proof), least exposure on the public server, nothing unverified served, HIDDEN never public, and one tool-vs-resource stance shared with PLAN-HELLOG-0005 (#108 §15).

| # | Decision | Reason | Effect on the plan |
|---|---|---|---|
| **F1** | **Keep the two tools `claims_list` / `claims_get`**, and keep the same data as a resource (§2). This is consistent with #108's "no category tools" under one shared rule, now written in both plans: **a tool is added only when (i) a founder decision names it and (ii) it takes query inputs a resource cannot carry (filters).** Claims meet both — D-EXP-18 names the tools, and `claims_list` filters by `category_id`, `status`, `region`, `min_proof_score`, `search`. Category records (#108) meet neither, so they stay resource plus `kind:"category"` | The 0003 count concern is real but is already mitigated by the 0004 profile split and by serving the resource too; overriding a founder-named tool would not be a reviewer's call, and a filtered claim query has no resource equivalent. The two plans now differ in *outcome* for a stated reason, not in *stance* | §0b row, §0c row and §8 "Tool count" updated. Scope, ACs and the §12 estimate (3.0M / 4.2M / 6.3M reuse) unchanged. R1/R2 (research) unchanged |
| **F2** | **`HIDDEN` is never served** (the README's `public: false` flag is honoured by the generated public filter, not by a hand list). `PLANNED` and `NOT_BUILT` **are** served with that status and `proof_score: 0`. Every other status the export carries (`BETA`, `PARTIAL`, `CONFIGURATION`, `UNKNOWN` — #59 README keeps them verbatim) is served verbatim with score 0 unless it is `LIVE` or `LIVE-LIMITED`; the build never maps a status up | Least exposure on an anonymous server, and D-EXP-17: a planned item shown as planned is honest; a hidden item shown at all is a leak; a mapped status is a claim above its proof (D-EXP-18) | §2 public-filter bullet updated. AC-03a now reads "non-live status ⇒ score 0" for *every* non-live value, not only PLANNED/NOT_BUILT. R2's question to research is narrowed to "confirm `proof_score` is pre-computed"; the vocabulary answer is in #59. No token change |
| **F3** | **Allowlist, as one tested const `EVIDENCE_URL_HOSTS`:** `hellogrowthcrm.com` (apex; `www.` normalised to it — help articles and blog posts live under it, there is no separate docs host), `mcp.hellogrowthcrm.com` for `mcp_evidence` only, and for `video_url` only `www.youtube.com`, `youtu.be`, `www.youtube-nocookie.com`. **Not allowlisted:** `app.hellogrowthcrm.com` (a login surface; no public demo workspace exists — §8 "Sparse proof"), `staging.*`, `api.*`, `seo.*`, and any third-party doc host. Any other URL → `null` + `evidence_note: "not public"`. Adding a host is a one-line PR with a test update | The website's `origin/master` links `hellogrowthcrm.com` 1,158× and embeds YouTube 53× and no other video host; the help sitemap is served from the apex. Allowlisting only what is already public keeps exposure least and makes the filter checkable by grep | §2 URL bullet updated. AC-03d's host test enumerates the const. No scope or token change |
| **F4** | **Use `customer_evidence_permission` exactly as #59 defines it** (blank · `none` · `anonymised` · `named`; any other value fails the registry build). `customer_evidence` is served **only when the value is `named`**. For `anonymised`, `none` and blank the text is `null` and the permission value is echoed, so a consumer can tell "evidence exists, not public" from "none recorded". No MCP-side consent wording is invented; the consent record lives in the registry | The research PR already owns the field and its enum; defining a second field here would fork the truth. `anonymised` text is still a customer statement without a name attached, and serving it anonymously on a public server is a judgement the founder has not made — so it stays unserved until the founder says otherwise (least exposure) | §2 customer-evidence bullet updated. AC-03b (per-field filter test) gains the four-value case table. No token change |

**What did not change:** nothing is removed, trimmed or reworded (D-EXP-16). WhatsApp stays one channel among many (AC-03). Sol and Astra stay BLOCKED; these are reviewer decisions, not a Sol/Astra verdict.

## 14. D-EXP-22 audit (rev 3, 2026-10-30)

**Rule (founder, verbatim):** "do not have anything which reduces the things we have instead we can do a pr in hellocrm to fix that or build that. pls audit that across this session". Not affected: PR-A `claims_list` / `claims_get` (new tools, statuses served verbatim with the D-EXP-17 legend), PR-C name map (new data). Affected: PR-B.

| Item | Where | Reducing step | Status | Build in hellocrm |
|---|---|---|---|---|
| `proof.limitations[]`, `proof.status` LIVE-LIMITED / PLANNED, `proof_band below_40` on existing feature rows | `src/tools/features.ts` (`features_list`, `features_get`) | places limits and downgrade marks beside an existing live feature | DEFERRED — build first (D-EXP-22) | Per claim, via the registry: each LIVE-LIMITED claim is closed by its own hellocrm plan (see the audit tables in PLAN-HCW-0202, 0204, 0205 and PLAN-HELLOG-0005 §16). Screens and synthetic-tenant proof: PLAN-HGC-0626 (#9791) |
| Features with no linked claim | `features_*` | `proof: null, proof_reason: "no_claim_recorded"` | Not affected (no mark added to a claim) | — |

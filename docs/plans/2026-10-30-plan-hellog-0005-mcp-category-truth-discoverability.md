# Plan — MCP: category-level capability facts kept true, an honest access model, and a discoverability score

- **Revision:** 2 (2026-10-30) — folds the PROVISIONAL Fable review (PR comment 6523387659) and applies founder rules **D-EXP-16 additive only** and **D-EXP-17 honest tables**. What changed and why: §10a. Still a draft: Sol/Astra BLOCKED.
- **Plan id:** PLAN-HELLOG-0005, from `plan-id.mjs next`. Two of its three sources failed, as they did for 0004: it read trunk `master` instead of `main`, and `gh pr list` is GraphQL, which is blocked here. Re-checked by hand on 2026-10-30: the REST PR list shows 0001–0004 as the only `PLAN-HELLOG-*` titles (#60, #98, #102, #106), `git ls-remote` shows `plan/hellog-0001..0004` only, and `origin/main` has no `plan-hellog-*` file.
- **Branch:** `plan/hellog-0005-mcp-category-truth-discoverability` · **Repo:** MeruLocal/HelloGrowthCRMwebsite_MCP · **Trunk:** `main` (head `5190a02`)
- **Mode:** PLAN (CEO office, plan only — no code in this PR). Each BUILD below is its own PR carrying `Implements: PLAN-HELLOG-0005 (PR-x)`.
- **Change tags:** `public_api` (a new resource, new manifest fields, changed served copy), `product` (which capabilities the server says HGC has)
- **Tier:** T2. Owed (`workflow.mjs obligations --mode BUILD --tags public_api,product`): acceptance_criteria · blast_radius · caller_inventory · compatibility_test · competitor_scan · intent · necessary_changes · planned_file_coverage · premise_check · smoke_test
- **Restricted areas touched (G2):** none. No auth, billing, migration, secret or email-send file. `src/tools/access.ts` (the bearer gate for the eight operator write tools) is read, not changed.
- **Freeze in force?** Yes, inherited. The PLAN-HELLOG-0003 release gate (PR #102 §0c, widened by 0004) blocks a public deploy of any new anonymous surface until G1–G5 are deployed and verified. PR-C (a new resource) obeys it.
- **Origin:** founder decision D-EXP-13 (research-suite `research-methodology/expansion-plan-2026-10-30.md` §6j: "four PRs per research output"; item 3 is this repo). Items an open plan already covers went to that plan as evidence comments instead (§0c).
- **Date:** 2026-10-30

## 0. Intent

- **Claim.** The research found three things the open MCP plans do not cover. (1) HGC competes in many software categories beyond CRM — the compete map has 77 rows (32 full depth, 38 partial, 7 thin) — but the server can only answer "CRM for X". A buyer's assistant asking "does HelloGrowth do freight-forwarding software / salon software / applicant tracking?" gets no category-level fact. (2) The server's own description of itself is wrong: it serves "12 AI Agents. 3 Autonomy Levels" (the Product Truth Audit v5 rates this a P1 phantom: 4 agents are registered) and says the MCP connects assistants "directly to your CRM data", which describes a different server. (3) Nobody measures the fourth founder score, **Agent/MCP Discoverability**, so no plan can show it moved.
- **Mechanism.** Rev 2: **three** additive build PRs here (PR-D moved to the research suite, §10a). PR-A adds a per-entry `status` and accurate descriptions **alongside** the existing agent copy (nothing removed or relabelled — D-EXP-16) and a machine-readable `access` block. PR-B adds a CI check that pins served capability statuses to a snapshot of the Product Truth Audit (LIVE vs LIVE-LIMITED, limits carried). PR-C serves category records — built from data #95 and #96 already carry, plus the compete map — as one resource and as a `kind` inside 0004's `search`/`fetch`. The Discoverability score script (rev 1 PR-D) now belongs to the research suite.
- **Observable.** An assistant can read one resource and learn, per category, the depth, the status, the limits and the canonical page, or that no dedicated page exists. The manifest says plainly that the public server is read-only and holds no CRM data. A monthly research-suite run prints one score row with every component sourced.
- **Risk.** Category records could overclaim depth (a "partial" read as "is a TMS"). A truth check that is too strict blocks honest edits. A copy correction could be read as removing a claim the founder wants. Score components could be read as one merged "AI visibility" number, which D-EXP-11 forbids. Mitigations in §8.

## 0a. Necessary changes   (planned-file coverage)

PR-A — per-entry status, accurate descriptions alongside, access model (no dependency). PR #108 opened on this plan
- [ ] `src/tools/agents.ts` — **rev 2 (Fable finding 1, verified: `AGENTS` holds 12 records — voice, journey, cold-outreach, lead-routing, post-call, call-coach, sales-assistant, crm-command, deal-risk, account-health, mcp, ai-email-composer — and `AgentRecord` has no status field).** Additive: (1) add `status: "LIVE" | "LIVE-LIMITED" | "PLANNED" | "UNKNOWN"` to `AgentRecord` and to **every** entry, from the Product Truth Audit v5 rows, plus `status_source` (audit file + row) and `hgc_verified_at`; (2) add `verified_description` beside the existing `description` where the audit differs (e.g. Deal Risk: "runs on demand"), leaving the existing text in place; (3) add a **derived** `status_summary` (e.g. `{live: n, live_limited: n, planned: n, unknown: n}`, computed from the entries, never hand-typed) next to the existing badge. On the `mcp` entry keep slug, route and copy, and add `servers: [{kind:"public-knowledge", access:"read-only", auth:"none", crm_data:false}, {kind:"tenant-crm", status:"LIVE-LIMITED", auth:"per-workspace scoped key, admin setup", verified_clients:[…]}]`. Bump the `SYNCED_AT` stamp (Fable finding 6).
  - **DEFERRED — founder hold (D-EXP-16):** changing the badge text "12 AI Agents. 3 Autonomy Levels" to the registered count; replacing Deal Risk "24/7"/"real time" with "on demand"; removing "The Only CRM MCP Server with Native WhatsApp Tools" and "90% of deals close on WhatsApp"; removing or trimming any of the 12 agents. Evidence kept: `grep -n "12 AI Agents\|24/7\|real time\|The Only CRM MCP" src/tools/agents.ts`, audit v5 `overclaims_phantoms` rows for `/agentic-ai`. Not built.
- [ ] `src/well-known.ts` — add `access: {public:"read-only", auth:"none", crm_data:false, operator_write_tools:"bearer-gated, not for buyers"}` to `/.well-known/mcp.json` and the server card. The existing prose ("Public read-only website mirror … No customer data, no CRM actions") **stays verbatim**; a test asserts the block and the prose agree (Fable finding 4, partially accepted — see §10a)
- [ ] ~~`src/data/deny-claims.ts` — `twelve-agents`, `public-mcp-read-write`, `only-crm-mcp` deny entries~~ — **DEFERRED — founder hold (D-EXP-16)**: a deny entry would fail the build until the existing strings are removed. Kept as evidence; when #103 merges, they may be added as **report-only warnings** if the founder agrees
- [ ] `test-data/fixtures/tools-list-<date>.json` + `test-data/fixtures/resources-<date>/*.json` — **rev 2 (Fable finding 2, verified: `test-data/` does not exist on this branch; the 0004 fixture is in an open plan, not built code)** — PR-A captures its own `tools/list`, resource and `agents_list`/`agents_get` fixtures from `main` before any edit
- [ ] `src/tools/__tests__/agents-status.test.ts`, `src/__tests__/well-known-access.test.ts` — the gates (every entry has a status; `status_summary` equals the count derived from entries; every pre-existing field is unchanged)

PR-B — truth sync against the Product Truth Audit (after #95 and #96 merge; **fallback:** if either stalls, PR-B pins only the audit rows for what this server already serves — agents, pricing, integrations — and adds the #95/#96 joins when they merge)
- [ ] `test-data/product-truth/2026-10-24/` — pinned CSV subset (`verified_capabilities`, `industries_detail`, `planned_not_built`, `unknown-verified-2026-10-30`, and the `overclaims_phantoms` rows for pages this server mirrors) plus `SHA256SUMS`
- [ ] `scripts/check-product-truth.mjs` + `package.json` script `check:product-truth`, added to `verify`
- [ ] `src/tools/__tests__/product-truth.test.ts` — runs the check on the pinned snapshot and on two failing fixtures

PR-C — category facts (after PR-B; the `search` kind after 0004 Phase B)
- [ ] `scripts/build-category-map.mjs` — builds the records from the pinned compete-map rows joined to #95 capability ids and #96 vertical keys
- [ ] `src/data/category-map.ts` — generated output, header carries source sha and `as_of`
- [ ] `src/server.ts` — one resource `hellocrmwebsite://site/categories` (application/json)
- [ ] `src/knowledge-index.ts` (0004 Phase B file) — index the records as `kind:"category"`. **Fallback (Fable finding 3):** if 0004 Phase B has not merged, PR-C ships the resource alone and this leg waits
- [ ] `src/data/__tests__/category-map.test.ts` — shape, qualification and negative tests

PR-D — Agent/MCP Discoverability score — **rev 2: moved out of this repo (Fable finding 5, accepted).** It reads the research suite's `hellogrowthcrm_mcp_submission_tracker.csv` and 0004's query-suite output and prints a row back to the research suite; D1 and D2 cannot be computed from this repo. It becomes a research-suite item (D-EXP-13 item 4), reading this server's pinned `tools/list` fixture from PR-A for D3/D4. No file in this repo.

## 0b. What we already know   (G4)

| Source | What it said | What this plan does about it |
|---|---|---|
| Learning brief (`lessons.mjs brief`) | 0 lessons in the corpus; the merged-PR read **FAILED** (GraphQL blocked) | Recorded as a failed read. Merged PRs were read by REST instead: #91, #97, #99, #101, #104, #105 |
| PLAN-HELLOG-0002 (#98, closed) | Astra REJECTed rev 4 on three points: approval must bind to a digest of the exact claim payload; a vertical that references an `on_request` / enterprise / other-industry capability loses that qualification; a committed-data criterion contradicted the data model. Closed as "largely implemented" by #97 and #99 | PR-B binds the truth check to a snapshot **sha256**, and refreshing it is a human PR. AC-02 makes qualification inheritance a test. Records are generated, never hand-edited, so no criterion can contradict the data |
| PLAN-HELLOG-0003 (#102) + strategy doc | Truth policy (status vocabulary, deny list, freshness), Phase 2 tools including `capability_check` and `buyer_get_industry_fit`; additive only; tool selection degrades past about 30–50 tools | Reused, not repeated. PR-A adds deny entries to its list. PR-C adds **no tool**, so the tool count is unchanged. Category records are input `capability_check` can read when 0003 Phase 2 is built |
| PLAN-HELLOG-0004 (#106) | Registry, `search`/`fetch`, tool split, `outputSchema`, client setup docs, directory pack, 4-prompt query suite | Not repeated. PR-C adds one `kind` to its index. PR-D reads its query-suite result as one input |
| #95 (46 capabilities), #96 (52 verticals, `kind` dedicated/alias/configuration_only) | Both name "generate from the product inventory" as a follow-up | PR-B and PR-C are that follow-up, bound to the audit snapshot |
| #52 (AI citation audit script) | Monthly 10-prompt citation run | Out of scope here; Citation Share is a different score (§9) |
| #94 vs #107 | #94 serves Free task boards as "100 tasks"; #107 says Task Boards are a Growth module, not on Free | Conflict posted as evidence on both (§0c). PR-B's check would flag it once the ruling is in the snapshot |

## 0c. Covered elsewhere — evidence posted, not re-planned

| Research item | Already covered by | Evidence comment posted |
|---|---|---|
| Registry listing; competitor registry presence | #106 Phase A | #106: US-1 found 19 of 238 open US competitors with an official MCP in the registry; pilot found 8 of 11 via vendor docs, only monday in the registry |
| `search`/`fetch`; tool naming, descriptions, `outputSchema`; per-client setup docs; directories | #106 Phases B–F | #106: competitor patterns (Attio docs MCP, Pipedrive in Claude and ChatGPT directories, HighLevel via agent directories, Zoho per-client pages); website MCP page lacks Claude Code and VS Code steps |
| Verified-claims record, freshness stamps, monthly live eval | #102 §6 and §8 | #102: audit status counts and the `/agentic-ai` overclaims this server mirrors |
| Capability facts | #95 | #95: 147 rows in `unknown-verified-2026-10-30` (80 LIVE, 66 LIVE-LIMITED, 1 HIDDEN) are candidates to extend the catalogue |
| Vertical facts | #96 | #96: audit `module_matrix` — 34 of 63 modules, all industry verticals, have 0 % public-MCP coverage |
| Free-plan facts | #94, #107 | both: the two PRs disagree with each other, and research §6d flags website 100 vs app 500 |

## 1. Premise   (G8)

| Claim | Type | Evidence gathered | Running system? |
|---|---|---|---|
| No category-level facts are served | missing_feature | `content_list_industries` (`src/tools/content.ts`) returns only name + `crm-for-*` URL; no tool or resource on `main` takes a category; #95 is horizontal features in 8 categories; #96 is verticals. Requirement: compete map (77 rows) and §6d "copy says business software, never just a CRM" | not required |
| The server describes itself wrongly | documentation | `src/tools/agents.ts`: badge "12 AI Agents. 3 Autonomy Levels. One CRM."; `mcp` entry "Connect ChatGPT, Claude, or Gemini directly to your CRM data", "The Only CRM MCP Server with Native WhatsApp Tools", "90% of deals close on WhatsApp". Authority: audit v5 `overclaims_phantoms` (`/agentic-ai`: 12 agents = NOT FOUND/P1; 4 registered; Deal Risk "run on demand"; MCP connector LIVE-LIMITED, ChatGPT not confirmed). `scripts/sync-website-mirror.mjs` lists `agents` as a MANUAL surface assembled from the website's MCP page, so the website's "read/write" framing flows in here | not required |
| The audit statuses are not checked against served data | missing_feature | No test on `main` reads the audit; #95 and #96 bodies both defer generation; #103 deny list has 8 entries, none on agents | not required |
| No Discoverability score exists | missing_feature | Requirement: spec addendum 2026-10-30 item 1 and expansion plan §6i (four scores, never merged). Repo: no score script; #52 measures citations only | not required |

The live server was not queried in this session; the claims above are about `main`. The research recorded the live build as 2.0.0 while `main` is 2.1.0 (0004 §1), so the BUILD PRs re-check live output before quoting it.

## 2. What changes

Smallest shippable version: PR-A alone (per-entry status, accurate descriptions alongside, `access` block, own fixtures) — it has **no** external dependency in rev 2. Then PR-B, which makes PR-C safe, then PR-C. PR-D is research-suite work.

**Category record** (PR-C), one per compete-map row:
`{ category, aliases[], hgc_area, modules: [{type:"capability"|"vertical", id, kind?}], depth: "full"|"partial"|"thin", status: "LIVE"|"LIVE-LIMITED"|"UNKNOWN", availability: "native"|"partial"|"integration"|"not_available"|"unverified", evidence: [{source, row}], hgc_verified_at, competitor_checked_at, limitations[], not_built[], canonical_urls[], no_dedicated_page: bool, markets[], as_of, source: {file, sha256, row} }`

- **D-EXP-17 (rev 2):** `availability` is the honest-table legend in machine form — ✓ Native = `native`, ◐ Partial = `partial`, ↗ Integration = `integration`, — Not available = `not_available`, ? Could not verify = `unverified` — with `evidence` per record and the two last-verified dates (`hgc_verified_at`, `competitor_checked_at`). A record with no evidence is `unverified`, never `native`. Any served text rendering these records uses the same legend.

- Served text never says "HGC **is** a <category> tool" for `partial` or `thin`; it says the depth and the limits.
- Competitor names and the compete map's marketing angle are **not** served. Comparisons belong to the alternatives tools.
- `canonical_urls` lists only live sitemap URLs. If there are none, `no_dedicated_page: true` — never a guessed URL.
- A `thin` or `UNKNOWN` row is served with that status, not dropped. G13: nothing silently narrowed.

**Score** (rev 2: research-suite item, not built here — kept for reference): five components, each `{value, source, as_of}`, or `null` with a reason — never 0 for "not measured".
D1 registry listing present · D2 directory listings that describe the server correctly (from `hellogrowthcrm_mcp_submission_tracker.csv`) · D3 protocol surface (`search`/`fetch` present, `outputSchema` share, annotation completeness, valid manifest and card) · D4 description lint pass rate · D5 correct tool use from 0004's query suite. D1 and D3 are also computed for competitor servers from the research registry scan, so the score has a benchmark. It is printed as one row for the research suite to file; this repo does not write there.

## 3. Affected files

| Area | Files | Why |
|---|---|---|
| Served copy | `src/tools/agents.ts` | PR-A truth fix |
| Discovery manifest | `src/well-known.ts` | PR-A `access` block |
| Truth guard | `scripts/check-product-truth.mjs`, `test-data/product-truth/**`, `test-data/fixtures/**` (deny entries DEFERRED, D-EXP-16) | PR-A fixtures, PR-B |
| Category data | `scripts/build-category-map.mjs`, `src/data/category-map.ts`, `src/server.ts`, `src/knowledge-index.ts` | PR-C |
| Measurement | — (rev 2: PR-D moved to the research suite) | — |

## 5. Blast radius and caller inventory

- **Backward.** Callers of `agents_list` / `agents_get` (any MCP client on `/sse`, `/mcp`) get corrected text and an extra `servers` field; field names stay. Consumers of `/.well-known/mcp.json` and `/.well-known/mcp/server-card.json` (registries, Smithery, `scripts/audit-live-mcp.mjs`) get one extra key. `resources/list` gains one entry; the 9 existing URIs are unchanged. `tools/list` is unchanged.
- **Forward.** No new network host or database read. PR-B and PR-C read bundled files only; the research-suite score script reads PR-A's pinned tool-list fixture.
- **Sideways.** hellocrmwebsite owns the MCP page (`/agentic-ai/mcp`) whose "read/write access" line seeds `agents.ts`; a manual re-sync could bring the old wording back, so PR-A's test pins it. The website fix is in the website plan PR for this research output. hellocrm owns `crm-mcp-server`; PR-A states its status from the audit and does not test it.

## 6. Acceptance criteria

- **AC-01** — `resources/read hellocrmwebsite://site/categories` returns one record per pinned compete-map row (77 for the 2026-10-30 snapshot). Every record has `category`, `depth`, `status`, `as_of` and `source.sha256`. `limitations` is non-empty whenever `depth != "full"` or `status == "LIVE-LIMITED"`.
- **AC-02** — Qualification is inherited: a record that references a #96 vertical with `kind` alias or configuration_only, or a #95 capability with an availability note, carries that `kind` or note unchanged (test over every record).
- **AC-03 NEGATIVE** — No **new** served record or string presents a `planned_not_built` item as available; no category record contains a competitor name; no category record has `availability: "native"` without evidence. (Rev 1's "no served string matches `twelve-agents`…" is DEFERRED with the copy changes — D-EXP-16.)
- **AC-03b** — Every entry `agents_list` serves (all 12 today) carries a `status`; `status_summary` equals the counts derived from the entries; no entry is removed and every pre-existing field keeps its value (Fable finding 1).
- **AC-04** — `npm run check:product-truth` exits 0 on the pinned snapshot and prints its sha256; it exits 1 on a fixture where a LIVE-LIMITED item has no limitation, and on one where a served status differs from the snapshot.
- **AC-05** — `/.well-known/mcp.json` and the server card both carry `access.public = "read-only"` and `access.crm_data = false`; `agents_get {slug:"mcp"}` returns two `servers` entries with different `kind`s. The block **formalises an existing statement** (`authentication.note` and the llms text already say read-only, no customer data); a test asserts the two agree.
- **AC-06** — moved to the research suite with PR-D (rev 2).
- **AC-07 REGRESSION** — `tools/list` names, `inputSchema`s and annotations are identical to **PR-A's own** pinned fixture (captured from `main` before any edit — 0004's fixture does not exist on `main`); the 9 existing resource URIs return byte-identical output.

## 7b. Smoke test — Expected only

Env: local `npm run dev` on the build branch, then the deployed host after the 0003 gate · Login: none (anonymous) · Role: MCP client (SDK `Client`, streamable HTTP)

| # | Action | Expected |
|---|---|---|
| 1 ⭐ | `resources/list` | contains `hellocrmwebsite://site/categories` **(new)** |
| 2 | `resources/read` that URI; find `"freight forwarding software"` | `depth: "full"`, module `freight_forwarding` (compete-map row) **(new)** |
| 3 ⭐ | `GET /.well-known/mcp.json` | `"access": {"public": "read-only", …}` **(new)** |
| 4 | `agents_get {slug:"mcp"}` | two `servers`; the `public-knowledge` one says `crm_data: false` **(new)** |
| 5 NEGATIVE | search the categories output for "e-invoice" | appears only under `not_built` (#96 note: manufacturing e-invoice / e-way bill planned, not built) **(new)** |
| 6 REGRESSION | `tools/list` | same names and count as the pinned 0004 fixture |
| 7 ⭐ | `agents_list` | still 12 entries; each now has `status` **(new)**; existing text unchanged |

## 7e. Competitors

Legend (D-EXP-17): ✓ Native · ◐ Partial · ↗ Integration · — Not available · ? Could not verify. **HGC last verified: 2026-10-30** (`main` code; live server not queried) · **Competitors last checked: 2026-10-30** (research-suite CSVs; live pages not re-checked this session). Gaps kept.

| Product | Public knowledge MCP | Tenant-data MCP | Category-level facts | In MCP Registry | Evidence |
|---|---|---|---|---|---|
| **HelloGrowth** | ✓ Native (this server) | ◐ Partial (LIVE-LIMITED per audit v5; ChatGPT not confirmed) | — Not available (PR-C adds it) | — Not available (#106) | `src/server.ts`, `src/well-known.ts`; audit v5 |
| Attio | ✓ Native (`docs.attio.com/mcp`) | ✓ Native | ? Could not verify | ? Could not verify | research `mcp-competitors.csv` |
| Salesforce | ◐ Partial (Metadata Grounding, Discover/Describe — own data model) | ✓ Native | — Not available (none found; tool inventory pending, not proof of absence) | ? Could not verify | same |
| HubSpot | ? Could not verify | ✓ Native (OAuth, CRM search API) | ? Could not verify | ? Could not verify | same |
| Vonage + 18 others | ? Could not verify | ? Could not verify | ? Could not verify | ✓ Native (listed) | `registry-official-us-x1-2026-10-30.csv` |

No competitor MCP found serves category-level "does it do X for Y" facts, but tool inventories (A2) are pending for most, so this is **not proof of absence**. Astra: **BLOCKED** (no key). Anthropic live-page check: **UNVERIFIABLE** in this session (not run); the BUILD PR for PR-C re-checks Attio and Salesforce before quoting.

## 7f. Compatibility test

- PR-A captures the `tools/list` fixture itself (AC-07) and `test-data/fixtures/resources-<date>/*.json` for the 9 existing resources, from `main` before any edit.
- `agents_get`: a test asserts every pre-existing key is still present with the same type; only text values and the new `servers` key change.
- Manifest and card: a test asserts every pre-existing key is unchanged; `access` is additive.

## 8. Risks and edge cases

- **Depth overclaim.** Mitigated by the served-text rule in §2 and AC-01/AC-02. Founder decides whether a `partial` category is listed at all (F1).
- **Stale snapshot.** The audit is dated 2026-10-24 and v6 is in progress. `as_of` is served; refreshing the snapshot is a human PR that changes the sha, so approval binds to the exact payload (0002 blocker 1).
- **Check too strict.** PR-B reports overclaim matches as warnings for the first release, and fails only on status mismatch and missing limitation.
- **Copy correction read as a removal.** Rev 2 settles this with **D-EXP-16**: no existing copy is changed or removed; accurate status and descriptions are served **alongside**. The copy corrections are DEFERRED with their evidence. No tool, field, route or agent entry is removed.
- **Score misuse.** Kept as five separate components and never folded into the other three scores (D-EXP-11).
- **Tenant MCP facts.** Stated from the audit only; verified clients come from hellocrm, not from this repo (F2).

## 9. What this deliberately does NOT do

- No new tool; `capability_check` and the profile split stay with 0003 Phase 2 and 0004 Phase C.
- No registry, `search`/`fetch`, schema or setup-doc work — that is #106.
- No AI Recommendation, Citation or Knowledge Share measurement, and no monthly citation reverse-engineering: those are research-suite (capability child 6) and website work; #52 holds the citation script.
- No website change. The "read/write access" line and the missing Claude Code / VS Code steps on `/agentic-ai/mcp` go in the hellocrmwebsite plan for this research output.
- No price, plan-limit or Free-plan ruling (#94 / #107).

## 10. Review record

| Reviewer | Plan version | Verdict | Accepted | Rejected, and why |
|---|---|---|---|---|
| Sol | rev 1 | **BLOCKED** — `AZURE_SOL_API_KEY` / `AZURE_OPENAI_API_KEY` not set | — | — |
| Astra (blind) | rev 1+fold | **BLOCKED** — `AZURE_ASTRA_API_KEY` not set | — | — |
| Fable (PROVISIONAL, D-EXP-10) | rev 1 | **ACCEPT_WITH_CHANGES** (PR comment 6523387659) | F1 per-entry status (badge *derived* as an added `status_summary`, not by editing the badge) · F2 own fixtures · F3 dependency fallbacks · F4 access block formalises existing prose · F5 PR-D out · F6 bump `SYNCED_AT` · estimate | F1 "derive the badge count" by changing the badge text → **DEFERRED (D-EXP-16)**; F4 "derive the prose from the block" → rejected, it rewrites existing prose; a consistency test is used instead. §10a |
| Fresh blind Opus (PROVISIONAL) | rev 2 | **PENDING** — run by the parent session on rev 2 with §10 stripped | | |

Commands to run when the keys exist (from a hellocrm checkout):

```bash
node .claude/skills/rss-plan-pr/scripts/ask-sol.mjs --file /home/user/wt-mcp-plan/docs/plans/2026-10-30-plan-hellog-0005-mcp-category-truth-discoverability.md --role plan --out /tmp/0005-sol-r1.md
node .claude/skills/rss-plan-pr/scripts/ask-sol.mjs --file /home/user/wt-mcp-plan/docs/plans/2026-10-30-plan-hellog-0005-mcp-category-truth-discoverability.md --role plan --model astra --out /tmp/0005-astra-r2.md
```

- **What left the machine (G9b):** nothing from this repo beyond the plan text the parent gave to the provisional reviewer.

### 10a. Rev 2 fold — each Fable finding, verified before it was accepted
| # | Finding | Verified how | Decision |
|---|---|---|---|
| 1 | Badge fix leaves 12 served agents with no status | `grep -n "slug:" src/tools/agents.ts` → 12 entries in `AGENTS` (plus 4 `vs-*` comparisons); `interface AgentRecord` has no `status` | **Accepted (additive):** `status` on every entry, `status_summary` derived and added beside the badge, AC-03b. Editing the badge and removing agents → **DEFERRED (D-EXP-16)** |
| 2 | AC-07 fixture missing | `ls test-data` → no such directory on this branch | **Accepted:** PR-A captures its own fixtures |
| 3 | Four dependencies, no fallback | `ls src/data/deny-claims.ts src/knowledge-index.ts` → neither exists | **Accepted:** fallbacks stated for PR-A (none needed now), PR-B, PR-C |
| 4 | `access` block restates prose | `grep -n "read-only" src/well-known.ts` → `authentication.note` and llms text already say it | **Partially accepted:** AC-05 says it formalises an existing statement; deriving the prose from the block **rejected** (rewrites existing copy, D-EXP-16) — a consistency test instead |
| 5 | PR-D is research work | PR-D inputs live in the research suite; D1/D2 not computable here | **Accepted:** PR-D moved to the research suite |
| 6 | Freshness stamps | `SYNCED_AT 2026-06-11` comments in `agents.ts` | **Accepted:** PR-A bumps the stamp; its tests pin the added fields |
| est | ~20 % high; PR-A 0.7–0.9M | — | **Accepted:** §12 rev 2 |

Founder rules applied in rev 2: **D-EXP-16** — badge text, Deal Risk wording, the two unsourced lines, the deny entries and any removal of the 12 agents are DEFERRED with evidence; only additions ship. **D-EXP-17** — §7e rewritten with the legend, evidence and both dates; category records carry `availability` + `evidence` + two dates.
- **Founder decisions owed:** F1 — list `partial` and `thin` categories publicly, or `full` only? (rev 2: under D-EXP-16 the default is to list all, with honest `availability`; "full only" would be a trim and needs the founder.) F2 — describe the tenant CRM MCP on the public server at all, and with which verified clients? F3 — targets for D1–D5 (research suite). **F4 (D-EXP-16 hold)** — when, if ever, to apply the DEFERRED copy corrections in `agents.ts`.

## 12. Estimated token cost

Estimate, not a quote (method: research-suite `growth/token-estimate-method.md`). **Reuse** builds on #95, #96, the #103 deny list, 0004's index and query suite. **Fresh** re-derives vertical and capability data, a truth guard and a query harness.

| PR | Components (reuse) | Low | Expected | High |
|---|---|---|---|---|
| PR-A | orientation 200k · 2 files 140k (additive fields, access block) · fixture capture 60k · 2 tests 100k · gate 150k · +20 % +25 % | 0.6M | 0.8M | 1.2M |
| PR-B | orientation 350k · script + fixtures 220k · 2 adapters 180k · 2 tests 120k · gate 300k | 1.2M | 1.7M | 2.6M |
| PR-C | orientation 350k · data + generator 270k · server + index 130k · 2 tests 120k · gate 300k | 1.2M | 1.7M | 2.6M |
| ~~PR-D~~ | moved to the research suite (rev 2) | — | — | — |
| **Total, reuse (rev 2)** | | **3.0M** | **4.2M** | **6.4M** |
| **Total, fresh (rev 2)** | + vertical/capability derivation 1.0M · own guard 0.8M · own index 0.5M | 4.6M | 6.5M | 9.8M |

Why it moved (rev 1: 6.1M reuse): Fable called rev 1 ~20 % high and PR-A 0.7–0.9M; PR-A also shrank because D-EXP-16 removed its copy edits and deny entries, and PR-D (1.4M) left this repo. PR-B and PR-C are unchanged (Fable: fair). Low assumes #95/#96 merge first; high assumes the PR-B fallback path and a re-pin when audit v6 lands.

At the Sonnet input rate ($3/M): rev 2 reuse ≈ $13 expected, fresh ≈ $20 (rev 1: $18 / $27); Opus ≈ 5×. This plan PR: about 0.2M (anchor: one plan PR = 179k–208k).

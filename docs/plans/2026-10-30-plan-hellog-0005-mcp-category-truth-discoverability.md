# Plan — MCP: category-level capability facts kept true, an honest access model, and a discoverability score

- **Revision:** 1 (draft, not yet reviewed — §10)
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
- **Mechanism.** Four additive build PRs. PR-A corrects the self-description and adds a machine-readable `access` block. PR-B adds a CI check that pins served capability statuses to a snapshot of the Product Truth Audit (LIVE vs LIVE-LIMITED, limits carried). PR-C serves category records — built from data #95 and #96 already carry, plus the compete map — as one resource and as a `kind` inside 0004's `search`/`fetch`. PR-D adds a script that computes the Discoverability score from inputs 0003 and 0004 already produce.
- **Observable.** An assistant can read one resource and learn, per category, the depth, the status, the limits and the canonical page, or that no dedicated page exists. The manifest says plainly that the public server is read-only and holds no CRM data. A monthly run prints one score row with every component sourced.
- **Risk.** Category records could overclaim depth (a "partial" read as "is a TMS"). A truth check that is too strict blocks honest edits. A copy correction could be read as removing a claim the founder wants. Score components could be read as one merged "AI visibility" number, which D-EXP-11 forbids. Mitigations in §8.

## 0a. Necessary changes   (planned-file coverage)

PR-A — self-description and access model (no dependency; deny entries wait for #103)
- [ ] `src/tools/agents.ts` — correct the hub badge ("12 AI Agents. 3 Autonomy Levels") to the registered agent count, and change Deal Risk "24/7"/"real time" wording to "on demand", per audit rows on `/agentic-ai`. Correct the `mcp` entry: keep slug and route; add `servers: [{kind:"public-knowledge", access:"read-only", auth:"none", crm_data:false}, {kind:"tenant-crm", status:"LIVE-LIMITED", auth:"per-workspace scoped key, admin setup", verified_clients:[…]}]`. Remove the unsourced "the only CRM MCP server with native WhatsApp tools" and "90% of deals close on WhatsApp" lines
- [ ] `src/well-known.ts` — add `access: {public:"read-only", auth:"none", crm_data:false, operator_write_tools:"bearer-gated, not for buyers"}` to `/.well-known/mcp.json` and the server card
- [ ] `src/data/deny-claims.ts` (exists once #103 merges) — add `twelve-agents`, `public-mcp-read-write`, `only-crm-mcp` entries, each citing its audit row
- [ ] `src/tools/__tests__/agents-truth.test.ts`, `src/__tests__/well-known-access.test.ts` — the gates

PR-B — truth sync against the Product Truth Audit (after #95 and #96 merge)
- [ ] `test-data/product-truth/2026-10-24/` — pinned CSV subset (`verified_capabilities`, `industries_detail`, `planned_not_built`, `unknown-verified-2026-10-30`, and the `overclaims_phantoms` rows for pages this server mirrors) plus `SHA256SUMS`
- [ ] `scripts/check-product-truth.mjs` + `package.json` script `check:product-truth`, added to `verify`
- [ ] `src/tools/__tests__/product-truth.test.ts` — runs the check on the pinned snapshot and on two failing fixtures

PR-C — category facts (after PR-B; the `search` kind after 0004 Phase B)
- [ ] `scripts/build-category-map.mjs` — builds the records from the pinned compete-map rows joined to #95 capability ids and #96 vertical keys
- [ ] `src/data/category-map.ts` — generated output, header carries source sha and `as_of`
- [ ] `src/server.ts` — one resource `hellocrmwebsite://site/categories` (application/json)
- [ ] `src/knowledge-index.ts` (0004 Phase B file) — index the records as `kind:"category"`
- [ ] `src/data/__tests__/category-map.test.ts` — shape, qualification and negative tests

PR-D — Agent/MCP Discoverability score
- [ ] `scripts/discoverability-score.mjs` + `package.json` script `score:discoverability`
- [ ] `scripts/lib/description-lint.mjs` — static checks on tool descriptions (the 0003 §5 design rules)
- [ ] `scripts/__tests__/discoverability-score.test.ts`
- [ ] `docs/DISCOVERABILITY_SCORE.md` — the formula, each input's source, and the monthly cadence

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
| Capability facts | #95 | #95: 146 rows in `unknown-verified-2026-10-30` (80 LIVE, 66 LIVE-LIMITED) are candidates to extend the catalogue |
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

Smallest shippable version: PR-A alone (copy correction plus `access` block). Then PR-B, which makes PR-C safe, then PR-C, then PR-D.

**Category record** (PR-C), one per compete-map row:
`{ category, aliases[], hgc_area, modules: [{type:"capability"|"vertical", id, kind?}], depth: "full"|"partial"|"thin", status: "LIVE"|"LIVE-LIMITED"|"UNKNOWN", limitations[], not_built[], canonical_urls[], no_dedicated_page: bool, markets[], as_of, source: {file, sha256, row} }`

- Served text never says "HGC **is** a <category> tool" for `partial` or `thin`; it says the depth and the limits.
- Competitor names and the compete map's marketing angle are **not** served. Comparisons belong to the alternatives tools.
- `canonical_urls` lists only live sitemap URLs. If there are none, `no_dedicated_page: true` — never a guessed URL.
- A `thin` or `UNKNOWN` row is served with that status, not dropped. G13: nothing silently narrowed.

**Score** (PR-D): five components, each `{value, source, as_of}`, or `null` with a reason — never 0 for "not measured".
D1 registry listing present · D2 directory listings that describe the server correctly (from `hellogrowthcrm_mcp_submission_tracker.csv`) · D3 protocol surface (`search`/`fetch` present, `outputSchema` share, annotation completeness, valid manifest and card) · D4 description lint pass rate · D5 correct tool use from 0004's query suite. D1 and D3 are also computed for competitor servers from the research registry scan, so the score has a benchmark. It is printed as one row for the research suite to file; this repo does not write there.

## 3. Affected files

| Area | Files | Why |
|---|---|---|
| Served copy | `src/tools/agents.ts` | PR-A truth fix |
| Discovery manifest | `src/well-known.ts` | PR-A `access` block |
| Truth guard | `src/data/deny-claims.ts`, `scripts/check-product-truth.mjs`, `test-data/product-truth/**` | PR-A, PR-B |
| Category data | `scripts/build-category-map.mjs`, `src/data/category-map.ts`, `src/server.ts`, `src/knowledge-index.ts` | PR-C |
| Measurement | `scripts/discoverability-score.mjs`, `scripts/lib/description-lint.mjs`, `docs/DISCOVERABILITY_SCORE.md` | PR-D |

## 5. Blast radius and caller inventory

- **Backward.** Callers of `agents_list` / `agents_get` (any MCP client on `/sse`, `/mcp`) get corrected text and an extra `servers` field; field names stay. Consumers of `/.well-known/mcp.json` and `/.well-known/mcp/server-card.json` (registries, Smithery, `scripts/audit-live-mcp.mjs`) get one extra key. `resources/list` gains one entry; the 9 existing URIs are unchanged. `tools/list` is unchanged.
- **Forward.** No new network host or database read. PR-B and PR-C read bundled files only; PR-D reads the bundled tool list, the tracker CSV and the query-suite output file.
- **Sideways.** hellocrmwebsite owns the MCP page (`/agentic-ai/mcp`) whose "read/write access" line seeds `agents.ts`; a manual re-sync could bring the old wording back, so PR-A's test pins it. The website fix is in the website plan PR for this research output. hellocrm owns `crm-mcp-server`; PR-A states its status from the audit and does not test it.

## 6. Acceptance criteria

- **AC-01** — `resources/read hellocrmwebsite://site/categories` returns one record per pinned compete-map row (77 for the 2026-10-30 snapshot). Every record has `category`, `depth`, `status`, `as_of` and `source.sha256`. `limitations` is non-empty whenever `depth != "full"` or `status == "LIVE-LIMITED"`.
- **AC-02** — Qualification is inherited: a record that references a #96 vertical with `kind` alias or configuration_only, or a #95 capability with an availability note, carries that `kind` or note unchanged (test over every record).
- **AC-03 NEGATIVE** — No served record or string presents a `planned_not_built` item as available; no category record contains a competitor name; no served string matches `twelve-agents`, `public-mcp-read-write` or `only-crm-mcp`.
- **AC-04** — `npm run check:product-truth` exits 0 on the pinned snapshot and prints its sha256; it exits 1 on a fixture where a LIVE-LIMITED item has no limitation, and on one where a served status differs from the snapshot.
- **AC-05** — `/.well-known/mcp.json` and the server card both carry `access.public = "read-only"` and `access.crm_data = false`; `agents_get {slug:"mcp"}` returns two `servers` entries with different `kind`s.
- **AC-06** — `npm run score:discoverability -- --offline` prints JSON with D1–D5; each is `{value, source, as_of}` or `null` with a `reason`; no component is merged with any other score.
- **AC-07 REGRESSION** — `tools/list` names, `inputSchema`s and annotations are identical to 0004's pinned fixture (`test-data/fixtures/tools-list-2026-10-29.json`); the 9 existing resource URIs return byte-identical output.

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
| 7 ⭐ | `npm run score:discoverability -- --offline` | JSON with keys `D1`…`D5` **(new)** |

## 7e. Competitors

| Product | How they solve it | Source | We are |
|---|---|---|---|
| Attio | Public read-only docs MCP (`docs.attio.com/mcp`) next to a workspace MCP | research `mcp-competitors.csv` | at the knowledge-MCP pattern; behind on docs search (#106) |
| Salesforce | Several servers incl. Metadata Grounding and Discover/Describe — describes its own data model | same | ahead on buyer-facing capability facts; no category facts found there |
| HubSpot | OAuth account-data MCP built on the CRM search API | same | different job (tenant data) |
| Vonage, 18 others | Official servers in the MCP Registry (US-1 scan) | `registry-official-us-x1-2026-10-30.csv` | behind: HGC is not listed (#106) |

No competitor MCP found serves category-level "does it do X for Y" facts, but tool inventories (A2) are pending for most, so this is **not proof of absence**. Astra: **BLOCKED** (no key). Anthropic live-page check: **UNVERIFIABLE** in this session (not run); the BUILD PR for PR-C re-checks Attio and Salesforce before quoting.

## 7f. Compatibility test

- Reuse 0004's fixture for `tools/list` (AC-07). Add `test-data/fixtures/resources-2026-10-30/*.json` for the 9 existing resources, captured from `main` before PR-C.
- `agents_get`: a test asserts every pre-existing key is still present with the same type; only text values and the new `servers` key change.
- Manifest and card: a test asserts every pre-existing key is unchanged; `access` is additive.

## 8. Risks and edge cases

- **Depth overclaim.** Mitigated by the served-text rule in §2 and AC-01/AC-02. Founder decides whether a `partial` category is listed at all (F1).
- **Stale snapshot.** The audit is dated 2026-10-24 and v6 is in progress. `as_of` is served; refreshing the snapshot is a human PR that changes the sha, so approval binds to the exact payload (0002 blocker 1).
- **Check too strict.** PR-B reports overclaim matches as warnings for the first release, and fails only on status mismatch and missing limitation.
- **Copy correction read as a removal.** Correcting a false statement is a truth fix, as in #91 and #101. No tool, field or route is removed; the `mcp` slug and route stay.
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
| Fable (PROVISIONAL, D-EXP-10) | rev 1 | **PENDING** — run by the parent session | | |
| Fresh blind Opus (PROVISIONAL) | rev 1 | **PENDING** — run by the parent session | | |

Commands to run when the keys exist (from a hellocrm checkout):

```bash
node .claude/skills/rss-plan-pr/scripts/ask-sol.mjs --file /home/user/wt-mcp-plan/docs/plans/2026-10-30-plan-hellog-0005-mcp-category-truth-discoverability.md --role plan --out /tmp/0005-sol-r1.md
node .claude/skills/rss-plan-pr/scripts/ask-sol.mjs --file /home/user/wt-mcp-plan/docs/plans/2026-10-30-plan-hellog-0005-mcp-category-truth-discoverability.md --role plan --model astra --out /tmp/0005-astra-r2.md
```

- **What left the machine (G9b):** nothing; no reviewer call was made.
- **Founder decisions owed:** F1 — list `partial` and `thin` categories publicly, or `full` only? F2 — describe the tenant CRM MCP on the public server at all, and with which verified clients? F3 — targets for D1–D5.

## 12. Estimated token cost

Estimate, not a quote (method: research-suite `growth/token-estimate-method.md`). **Reuse** builds on #95, #96, the #103 deny list, 0004's index and query suite. **Fresh** re-derives vertical and capability data, a truth guard and a query harness.

| PR | Components (reuse) | Low | Expected | High |
|---|---|---|---|---|
| PR-A | orientation 300k · 4 files 210k · 2 tests 120k · gate 250k · +20 % +25 % | 0.9M | 1.3M | 1.9M |
| PR-B | orientation 350k · script + fixtures 220k · 2 adapters 180k · 2 tests 120k · gate 300k | 1.2M | 1.7M | 2.6M |
| PR-C | orientation 350k · data + generator 270k · server + index 130k · 2 tests 120k · gate 300k | 1.2M | 1.7M | 2.6M |
| PR-D | orientation 300k · script + lint 270k · 2 tests 120k · gate 250k | 0.9M | 1.4M | 2.1M |
| **Total, reuse** | | **4.2M** | **6.1M** | **9.2M** |
| **Total, fresh** | + vertical/capability derivation 1.0M · own guard 0.8M · own harness 0.6M · own index 0.5M | 6.2M | 9.0M | 13.5M |

At the Sonnet input rate ($3/M): reuse ≈ $18 expected, fresh ≈ $27; Opus ≈ 5×. This plan PR: about 0.2M (anchor: one plan PR = 179k–208k).

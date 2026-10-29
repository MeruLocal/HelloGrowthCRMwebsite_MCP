# R3 - MCP merge train (MeruLocal/HelloGrowthCRMwebsite_MCP)

Prepared 2026-10-26, re-based on reality 2026-10-28 after a session restart.
Companion data: `R3_merge_train.json` (59 entries, one per PR in scope, with `state_now`, `action`, `risk`, `notes`).
Nothing was merged, approved, closed or commented on. All testing was done in a scratch clone under the session scratchpad, not in any working checkout.

## 0. The ground moved - read this first

The brief said 56 PRs open and main untouched since 2026-09-24. Both were out of date by the time I finished.

| Fact | 2026-10-26 (brief) | 2026-10-28 (verified) |
|---|---|---|
| Open PRs | 56 | **6**: #47, #52, #54, #94, #95, #96 |
| main HEAD | 751fc29 (merges #83-#85, 10-15) | **b9be7a7** = 2.1.0 (merges 10-27: #99, #90, #91, #92, #93, #97, #100, #101) |
| Live `/version` | 2.0.0, 76 tools | **2.0.0, 77 tools** (buyer_find_answer_pages), `/health` = `degraded` |
| Live uptime | 11.2 days (old build) | 25.9 h: redeployed about 2026-10-27 09:36 UTC, **before** #100/#101, so 2.1.0 is not live |

On 10-27 keyur-meru closed about 45 PRs with "superseded" comments and merged #99 (a consolidation branch), #90-#93, #97, #100, #101.
**Several of those closure comments are wrong** (see section 3): the security stack #76/#79 and the agent-output PR #81 were closed as "already landed" but large parts are not on main, and I verified that in main's source and against the live endpoint.

Also found on 10-26 and since fixed by #100: main's `package.json` had `"build": "npx rtk wrap tsc"` and the Dockerfile runs `npm run build`. npm's `rtk` is an unrelated release tool (cliffano/rtk 4.3.0), so a deploy of main would have downloaded and executed a stranger's package. Not a problem on current main.

## 1. Live state vs repo (version check)

| Item | Value |
|---|---|
| Live `/version`, `/health` | version 2.0.0, tools 77, tools_total 89, gated 12, resources 9, `status: degraded` |
| main `package.json` | **2.1.0** (server.json, server-info.ts, CHANGELOG agree - `check-versions` passes in my run) |
| PR heads | #94, #95, #96: 2.0.0 (branched from 751fc29); #57 head was 2.0.1 (obsolete); nothing else bumps |
| Why `degraded` | #99's freshness gate: 12 website mirrors are 50-139 days old (changelog 2026-06-11 oldest). It is correct, and it will stay degraded until `sync-website-mirror.yml` runs, which needs repo secret `WEBSITE_REPO_TOKEN` and variable `WEBSITE_REPO` |

Live content checks (read-only, 2026-10-28):

- Pricing is good: `pricing_get_plans` has 0 x "1,099", 0 x "$13", 6 x "899", 2 x "$12", `market_scope` present. Titles on 77/77 tools, `outputSchema` on 25.
- `/llms.txt` 200, `/.well-known/mcp/server-card.json` 200, `/.well-known/mcp.json` 200, `/mcp` reachable (GET 400, by design).
- **Still broken:** `OPTIONS /sse` returns 405 with no CORS headers (browser clients cannot connect); `POST /sse` with `Accept: application/json` returns 406; `initialize` returns no `instructions`; `integrations_list` default response is **386,310 bytes** with 516 "planned" mentions; `analytics_social_proof` is a public tool whose source still returns partially masked subscriber emails and subscribe timestamps.

## 2. What is left, by gap (G-items)

These are the real remaining work. G1-G4 and G6 were each in a closed PR whose closing comment says it landed; I checked each against main's source.

| ID | Gap | Evidence it is not on main | Came from | Value |
|---|---|---|---|---|
| G1 | `analytics_social_proof` returns masked emails + timestamps on the public endpoint | `src/tools/analytics.ts` selects `email, subscribed_at`; tool absent from `PRIVILEGED_TOOLS`; present in live tools/list | #76 (plan #65) | safety: high |
| G2 | `robotsTxtPath` on `list_allowed_bots` / `list_blocked_bots` does `readFile(arg)` and echoes `err.message` | `src/tools/list-allowed-bots.ts:68-75` | #76 (plan #62) | safety: medium |
| G3 | SSRF guard resolves then lets the HTTP client resolve again (DNS rebinding); no body cap; no outbound budget | `src/utils/ssrf-guard.ts` header admits it | #76 safe-fetch, #79 budget | safety: medium |
| G4 | Client-IP trust (CF-Connecting-IP believed from any peer), no Host/Origin allowlist, no body cap (413), no session cap, no generic error ids, stdio trust, admin-token length early return | grep of main finds no `MCP_ALLOWED_HOSTS`, `MAX_BODY`, `MAX_SESSIONS`, `OUTBOUND_BUDGET`, `MCP_STDIO_TRUSTED`; `client-ip.ts` unchanged | #79 (plans #64 #66 #67 #71 #75) | safety: high |
| G5 | Browser CORS on `/sse` and Accept tolerance | live 405 / 406 | #32, #33 | visibility: medium |
| G6 | Routing `instructions`, `get_started`, UTM, paged lists, shipped-only integrations | live initialize has none; 386 KB integrations_list | #81 (plans #68 #69 #72 #73) | visibility: **high** |
| G7 | LLM message pack is data nobody serves | nothing in `src/` imports it | #89 | visibility: medium (after wiring) |
| G8 | Hygiene: 20 stray `vitest.config.ts.timestamp-*.mjs` tracked; SDK range `^1.0.4` | both still on main | #82 (plans #70 #74) | none |
| G9 | Red-team boundary test | closing comment says re-extract | #77 | safety: tests |
| G10 | Client-fitness audit script | not on main | #35 | low |
| G11 | "SOC 2 certified" in `website-mirror.ts` (lines 33, 314) vs `prompts.ts` which instructs the model to say "Type II examination, not a certification"; faqs says "SOC 2 Type II" | grep | #91 only partly | founder decision |
| G12 | Mirror staleness: `/health` degraded, sync workflow unconfigured | live `/health` | #99 | visibility: medium (stale answers) |
| G13 | No npm package: `registry.npmjs.org/mcp-bot-crawler` is 404, so no `npx` path and no npm-based directory indexing | npm view | #35/#36/#47 | visibility: medium, founder decision |

## 3. Duplicates, supersession and the wrong closure comments

| Pair / chain | Verdict |
|---|---|
| #50 -> #57 -> #88 | #50 closed (superseded by #99; also conflicted with #83's $12). #57 "merged" only into its stack base branch, never main; #101 re-landed it. #88 is a byte-identical duplicate of #57 (same two commits). All finished. Do not release 2.0.1. |
| #91 -> #97 | Both merged; live pricing verified. #91 had already superseded #50's ₹899 part. |
| #92 vs #80 | #92 (humanized fallback in server.ts) merged, #99 landed the strict `titles.ts` map. They coexist: `annotations.title` set by `titles.ts` wins. #80's remaining unique piece is only the `hellogrowth://changelog` resource. |
| #34 vs #93 | #93's `/mcp` alias is live. #34 only adds "advertise /mcp as canonical"; optional. |
| #90 vs #76 + #79 | #90 is a strict subset of #76 (no pinned IP, no robotsTxtPath, no social-proof, no budget) and has nothing from #79. Closing #76/#79 as "superseded by #90" lost G1-G4. |
| #78 vs #99 | #99's `content-freshness.ts` is equivalent; fine. |
| #81 vs #99 | Only derived integration counts overlap. Instructions, get_started, UTM, paging were **not** folded in. |
| #32 "CORS already landed" | False for `/sse` (live 405). Only static routes have CORS. |
| #95 vs #94 | Different lines of `features.ts`; merge together cleanly. #95 vs #99 conflict (description + coverage wording). |
| #96 vs #99 | No textual conflict, but #99's `applyToolTitles()` makes #96 crash the server at boot. |

Historic stacking chains (for reading the old branches): #32 <- #33 <- #34 <- #35; #50 <- #57; #76 <- #79 <- #81; #91 <- #97. All other PRs branched from main. Chain parents are proper ancestors of their children, so a child's diff includes the parent.

## 4. File-overlap matrix

### 4a. Open PRs against current main (tested with `git merge-tree`, then a real merge in a scratch clone)

| File | PRs touching it | Result |
|---|---|---|
| `src/tools/features.ts` | #94 (1 line), #95 (+73/-11), main (#99 description + coverage) | #94 clean; **#95 conflicts** (description string) |
| `src/tools/titles.ts` | #96 needs 2 new entries; #99 owns the map | **#96 boot-fatal without them** |
| `src/tools/index.ts`, `annotations.ts` | #96 | clean |
| `src/data/*` | #95 (capability-catalogue.ts), #96 (industry-modules.ts) | new files, no overlap |
| `.github/workflows/*` | #47 (3 new), main has sync-website-mirror.yml | clean |
| `scripts/`, `docs/` | #52; #54 (1-line comment in audit-live-mcp.mjs) | clean |

Simulation result (main + #94 + #96 + #95, with the 2 titles and the features.ts description resolved): `tsc --noEmit` clean, **323/323 tests pass**, `check-versions` agrees on 2.1.0. Without the titles fix: 6 test files fail with "Tools registered without a title".

### 4b. Closed branches that carry unlanded work (re-extract candidates), against current main

| File | #76 | #79 | #81 | #32/#33 | #77 | #82 | #89 |
|---|---|---|---|---|---|---|---|
| `src/server.ts` | x | x | x | x | x | x | |
| `CHANGELOG.md`, `README.md`, `.env.example` | x | x | x | | | | |
| `src/core/crawler.ts`, `report-generator.ts` | x | x | x | | | | |
| `src/tools/{analyze-access-logs,export-bot-report,geo-diagnostics,scan-website-bots,suggest-bot-policy}.ts` | x | x | x | | | | |
| `src/tools/analytics.ts` (G1) | x | x | x | | | | |
| `src/tools/list-allowed-bots.ts`, `list-blocked-bots.ts` (G2) | x | x | x | | | | |
| `src/tools/integrations.ts`, `index.ts`, `annotations.ts` | | | x | | | | |
| `src/utils/{client-ip,http-guards,outbound-budget,cidr}.ts` | | x | x | | | | |
| `package.json` | | | | | | x | |
| conflicts with main | 9 files | 9 files | 10 files | server.ts | server.ts | pkg + server.ts | **none** |

`src/server.ts` is the hot file for everything in 4b. That decides the order below: each re-landing PR touches a different region, but they must be merged one at a time and each rebased on the one before.

## 5. The merge train

Convention: "deploy" = your existing redeploy of the Docker image from main; "verify" = commands I used against the live host and can be re-run. Wave 1 has two tracks that are independent of each other.

### Wave 0 - redeploy only, no merge (do first, 15 minutes)

1. Redeploy main HEAD b9be7a7. Verify: `curl -s https://mcp.hellogrowthcrm.com/version` shows `"version": "2.1.0"` and `tools: 77`.
2. (Maintainer) add repo secret `WEBSITE_REPO_TOKEN` and variable `WEBSITE_REPO`, then run the "Sync website mirror" workflow by hand. It opens a mirror-refresh PR; merge it, redeploy, and `/health` should return to `"ok"`. Until then `/health` says `degraded` and any uptime monitor keyed to status may page.

Conflicts expected: none. Risk: low (the build wrapper problem is already fixed).

### Wave 1 - ready-now content + the smallest security closes

**Track 1A - existing PRs (merge in this order)**

1. **#94** merge as is. Clean.
2. **#96** add the two entries to `src/tools/titles.ts` (`industries_list_modules`, `industries_get_modules`), then merge. This is the PR that would take production down if merged unchanged.
3. **#95** rebase on main and resolve `src/tools/features.ts`: keep #95's `features_list` description, and change `FEATURES_COVERAGE.scope` / `scope_note` so they no longer say the list is only the "plan-comparison matrix". Then merge. Before merging, a product owner reads the 46 `availability_note` / `limitations` entries (gated features must not be over-claimed).
4. Release PR: bump to **2.2.0** in `package.json`, `server.json`, `src/server-info.ts` and `CHANGELOG.md` (`npm run check:versions` fails if any disagree; two new tools are a minor bump per the changelog's own rule).

Conflicts to expect: `features.ts` (#95), `titles.ts` (#96), `CHANGELOG.md` only in the release PR. Deploy 1 after step 4.
Verify: `/version` = 2.2.0, tools 79 / total 91; `features_list` shows `catalogue.verified_at` and task-boards Free = "100 tasks"; `industries_list_modules` returns 52 verticals; `tools/list` still has a `title` on every tool.

**Track 1B - new small PR(s) from the closed #76 branch (urgent safety; needs an author, no existing PR can be merged)**

- G1: make `analytics_social_proof` counts-only (`confirmed_subscribers`, `new_last_30_days`) - the exact change in #76's `analytics.ts` and its test.
- G2: refuse `robotsTxtPath` for public callers on `list_allowed_bots` / `list_blocked_bots`, add the inline `robotsTxt` input, stop echoing `err.message`.
- Add the `generate_robots_txt` line-break guard.

Conflicts to expect: `analytics.ts` and the two list tools are untouched by #90, so cherry-picking those files from #76 should be clean; do not cherry-pick `call-context.ts` yet (it is the base the rest of #76 builds on). Deploy with Deploy 1 if ready, otherwise as its own deploy. Risk: low.
Verify (no private data touched): `tools/call analytics_social_proof` returns only counts; `list_allowed_bots` with a `robotsTxtPath` returns a refusal.

### Wave 2 - transport hardening (G3, G4) - needs host configuration, stage it

Two PRs re-extracted from #79 / #76, merged in this order:
1. Outbound: `safe-fetch` with pinned-IP connect + body cap + outbound budget (from #76/#79), replacing `ssrf-guard.ts` call sites in `crawler.ts` and the five URL-fetching tools.
2. HTTP guards: trusted-proxy client IP, Host/Origin allowlist, 1 MB body cap, session cap, generic error ids, `MCP_STDIO_TRUSTED`, constant-time admin-token compare.

Conflicts to expect: `src/server.ts`, `crawler.ts`, `report-generator.ts` and four tool files (9 files; main moved under both branches). Re-do the changes by hand on main rather than merging the old branches.
**Before Deploy 2 set on the host:** `TRUST_PROXY_HEADERS=true`, `TRUST_CLOUDFLARE=true`, `TRUSTED_PROXY_CIDRS` = `127.0.0.1/32,::1/128` + Cloudflare IPv4/IPv6 ranges, `CLOUDFLARE_CIDRS` = the same ranges, `MCP_ALLOWED_HOSTS` including `mcp.hellogrowthcrm.com`, `MCP_ALLOWED_ORIGINS` (decide now - see founder decision D3), and Apache `ProxyPreserveHost On`. If these are missed the symptoms are: every caller shares one bucket and gets 429, or the real Host gets 403.
Verify: two requests with different spoofed `X-Forwarded-For` hit the same bucket; a request with a wrong `Host` header returns 403; a body over 1 MB returns 413; MCP clients still initialize (smoke-test with the Claude connector and `npx @modelcontextprotocol/inspector`). Keep the previous image tagged for rollback. Risk: **high** (can lock out real clients).

### Wave 3 - agent-facing output (G6) - the biggest remaining visibility win

Re-extract #81 onto main as three PRs, merged in this order (all touch `server.ts` or `tools/index.ts`):
1. Server `instructions` + `get_started` + UTM helper. New tool needs `titles.ts` and `annotations.ts` entries in the same PR (see the #96 lesson). Decide whether the instruction text comes from #89's pack (D2).
2. Paging and a size backstop for the 13 large list tools.
3. `integrations_list` defaults to shipped rows; planned rows labelled and opt-in.

Conflicts to expect: `server.ts` (instructions + result post-processing), `tools/index.ts`, `integrations.ts` (#99 already rewrote counts), `CHANGELOG.md`. Minor bump to 2.3.0.
Deploy 3. Verify: `initialize` result contains `instructions`; `integrations_list` default response drops from 386 KB to a few KB with a next-page marker; `get_started` returns the signup/demo links with UTM; run `scripts/ai-citation-audit.mjs` (#52) and compare to the pre-wave-2 run.

### Wave 4 - browser-client compatibility (G5)

Re-land #32 (CORS + Expose-Headers: mcp-session-id on `/sse` and `/mcp`), then #33 (Accept tolerance; re-test against the installed SDK because it depends on SDK internals), then #35 (audit script that guards both).
Conflicts to expect: `server.ts` only; also semantic: wave 2's Origin allowlist will 403 browser clients unless `MCP_ALLOWED_ORIGINS` includes them or is `*`.
Deploy 4. Verify: `OPTIONS /sse` with an Origin returns 204 with `Access-Control-Allow-Origin` and `Access-Control-Expose-Headers` containing `mcp-session-id`; `POST /sse` with `Accept: application/json` no longer 406.

### Wave 5 - tooling and housekeeping (no runtime effect, any time after wave 1)

- **#52** merge (measurement script; re-run baseline first).
- **#47** merge `ci.yml` + `production-check.yml`; leave `publish.yml` until D4.
- **#54** merge (rename).
- #82 hygiene re-extract after wave 2/3 (removes 20 files, fixes the SDK range).
- #77 red-team test re-extract after waves 1-2 (it should pass then).
- #89 pack: per D2.

## 6. Founder decisions needed

| # | Decision | Default I would pick |
|---|---|---|
| D1 | SOC 2 wording: mirror says "SOC 2 certified" (website-mirror.ts:33, 314) but the prompts instruct "Type II examination, not a certification" and a changelog entry says "completed SOC 2 Type II examination" | Use one phrase everywhere: "SOC 2 Type II examination completed (report under NDA)" |
| D2 | Wire #89's LLM message pack into the `instructions` field / a resource, or park it | Wire it in wave 3 PR 1; keep the 7 truth tests |
| D3 | `MCP_ALLOWED_ORIGINS`: `*` (browser clients anywhere, matches the CORS goal) vs a named list | `*` for the read-only public tool set; the 12 privileged tools still need the bearer token |
| D4 | Publish `mcp-bot-crawler` to npm (needs `NPM_TOKEN`; today a 404) | Yes - it unlocks `npx` installs and directory indexing |
| D5 | Free-plan facts the MCP and website disagree on (150 vs 200 leads; integrations 630 vs 259+) - noted in #91's body | Out of scope for this train; hold until the Free plan v2 decision |
| D6 | Are the #95/#96 availability and limitation statements approved to be said to AI engines? | Spot-check, then ship; both lists carry their own `not_built` / `limitations` fields |

## 7. Per-PR actions (summary; full text in the JSON)

| PR | Action now | One line |
|---|---|---|
| #94 | merge | wave 1A.1 |
| #96 | rebase-then-merge | add 2 titles (boot-fatal otherwise) |
| #95 | rebase-then-merge | resolve features.ts; update coverage wording |
| #47 | founder-decision | CI now, publish after NPM_TOKEN |
| #52 | merge | measurement tooling |
| #54 | merge | trivial rename |
| #76 | rebase-then-merge (new PRs) | G1, G2, G3 |
| #79 | rebase-then-merge (new PRs) | G4, staged with host env |
| #81 | rebase-then-merge (3 new PRs) | G6 |
| #32, #33, #35 | rebase-then-merge | G5, G10 |
| #77, #82 | rebase-then-merge | G9, G8 |
| #89 | founder-decision | data only, unwired |
| #34, #78, #80, #88, #50, #57, #98 and all docs/plan PRs | close (already closed) | duplicates or superseded; #34/#80 each leave a tiny optional remainder |
| #90, #91, #92, #93, #97, #99, #100, #101 | already merged | no action |

## 8. Method and limits

- File lists, merge bases and conflicts: `git diff`/`git merge-tree --write-tree` in a bare mirror of the repo, with `refs/pull/*/head` fetched on 2026-10-26 and again on 2026-10-28. GitHub's own `mergeable` was UNKNOWN for many PRs, so I did not rely on it.
- Simulated merges and the 323-test run used a scratch clone; the 2026-10-26 run (before the consolidation) is superseded and not reported here except the #77/#79 `server.ts` conflict.
- Live probes were read-only: `/version`, `/health`, `OPTIONS /sse`, one `initialize`, `tools/list`, `pricing_get_plans`, `integrations_list`. I deliberately did not call `analytics_social_proof` (it could return subscriber data) or probe SSRF; those findings come from source.
- GitHub Actions run history shows one CI run (2026-09-03, success) and no production-check runs.
- I did not verify the truth of the 46 capability entries or the 52 industry entries against the hellocrm product; that is D6.

# Apply: geo/agent-safety (v1.1.0 — findings X, Y, BB, L′)

One commit (`57b2fdf`) on top of **origin/main** (`6f32fa3`, the merge of PR #16).

⚠️ **Do not apply this onto your current checkout.** Your working copy is on
`chore/sync-website-mirror-2026-08-06`, which is **behind** `origin/main` —
PRs #12, #13, #15, #16 and #17 are already merged on GitHub but your local
clone hasn't fetched them (the Claude VM has no network, so this couldn't be
done for you). This branch depends on files those PRs added
(`src/utils/client-ip.ts` among others).

## From a terminal with network (GitHub Desktop's cmd, or any shell)

```bash
cd path/to/HelloGrowthCRMwebsite_MCP
git fetch origin
git checkout main && git pull

# Option A — the bundle (exact commit, recommended)
git fetch patches/geo-agent-safety.bundle geo/agent-safety:geo/agent-safety
git checkout geo/agent-safety

# Option B — the patch
git checkout -b geo/agent-safety
git am patches/geo-agent-safety.patch

# Verify (should print: 4 versions agree at 1.1.0; 235 tests pass)
npm ci && npm run verify

# Push and open the PR
git push -u origin geo/agent-safety
```

## What's in it

| Finding | Change |
|---|---|
| **X** | `serverInfo` → `hellogrowthcrm-website` / "HelloGrowthCRM Website & Bot Governance MCP"; description states it is NOT a CRM API, holds no customer data, needs no key. Identity centralised in `src/server-info.ts`; `check-versions.mjs` now enforces its version too. `server.json` description aligned. |
| **Y** | MCP annotations on all 88 tools (`src/tools/annotations.ts`): 80 read-only, 8 write (`blog_create/update/revalidate`, `help_create/update_article`, `newsletter_subscribe/unsubscribe`, `forms_submit`), 9 open-world. Startup guard throws if a tool ships unannotated; `annotations.test.ts` pins the exact write/open-world lists. |
| **BB** | `GET /version` (name, version, tool/resource counts, changelog link) + `CHANGELOG.md`. Version bumped to **1.1.0** everywhere (package.json, server.json ×2, server-info.ts). |
| **L′** | Rate-limit buckets can now live in a shared store: set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (REST API via fetch — no new npm dependency). Default stays in-memory. Store failure → in-memory fallback (local limiting, never unlimited), warn throttled to 1/min. |

## Merge-conflict warning

Open **PR #14** (`geo/server-hardening`) also rewrites `src/server.ts`
(HEAD /, /healthz, /robots.txt, /favicon.ico, landing page). Whichever merges
second will conflict in `server.ts` — small, but plan for it. Note #14's
branch currently also **deletes `scripts/mcp-monitor.sh`** (probably a bad
merge on that branch) — check that before merging it.

## Two things found while doing this, outside this repo

1. **The live manifest is still wrong.** As of 2026-08-12,
   `https://hellogrowthcrm.com/.well-known/mcp.json` still advertises the 14
   CRM tools ("10 live, 4 beta") with API-key instructions — so hcweb #1114
   (finding V, marked ✅ FIXED) is not deployed or was reverted. The
   credential-exposure fix is not actually live. Check the website repo's
   deploy.
2. Your local MCP clone can't `git fetch` from inside the Claude VM — run
   fetches from a normal terminal.

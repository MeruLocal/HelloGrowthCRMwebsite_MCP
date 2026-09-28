# CLAUDE.md — HelloGrowthCRMwebsite_MCP

Claude loads this file in every session, so keep it **short** (under ~100 lines). Details live in `docs/memory/` and are read **only when the task needs them**.

## What this repo is
- The **public HelloGrowthCRM website MCP server** (`mcp-bot-crawler`, v2.0.0), live at `https://mcp.hellogrowthcrm.com` (Streamable HTTP at `/sse`; `GET /version`, `/.well-known/mcp.json`).
- Two jobs: bot governance tools (scan, analyze, verify, robots.txt) and **read-mirrors of hellogrowthcrm.com content** (pricing, features, company, FAQs …) that AI assistants quote verbatim.
- Not the CRM MCP (that lives in the `hellocrm` repo). No UI, so no design system.
- TypeScript + `@modelcontextprotocol/sdk`, vitest. Tools: one file per group in `src/tools/`, registered in `src/tools/index.ts`. Mirror data: `src/data/website-mirror.ts`.
- Trunk is `main`.

## Hard rules
1. **Branch from `origin/main`; open a draft PR; never push to `main`; never merge; never force-push.** A human merges and deploys.
2. **Describe only what the live server serves.** Manifest (`server.json`, `/.well-known/mcp.json`), README, CHANGELOG, marketing and code change in the **same release**. Never advertise an unpublished npm package (C8).
3. **Pricing truth:** mirror prices come from the website / CRM source (`gstPlanSync.ts`). **Never present ₹1,099 as a price.** India Growth = ₹899/user/month + 18% GST on both billing modes.
4. **Privileged tools stay gated.** The 8 write tools and 4 personal-data readers are served only with `Authorization: Bearer $MCP_ADMIN_TOKEN`; unset = not served (fail-closed). Never call the personal-data tools in audits.
5. **Version lives in 3 places** (`package.json` version, `server.json` version and `packages[0].version`). Move them together; `npm run check:versions` enforces it. Publish npm **before** the registry. See `RELEASING.md`.
6. **No secrets, customer data, emails or phones** in code, docs, PRs, fixtures or audit logs. `.env.example` holds placeholders only.
7. Follow the MCP rules in `docs/memory/mcp-guidelines.md` (spec 2025-11-25, auth, tool annotations, registry, directory).
8. Tool counts, test counts and PR counts drift. Derive them live (`GET /version`, `npm test`, `gh pr list`); never hard-code them in docs.

## Before you push
- `npm run verify` (typecheck + version parity + tests). A typecheck alone is not a test.
- For tool or transport changes: `npm run audit:live` against production after deploy, and check `/version` matches `main`.

## Memory (read on demand, write as you learn)
| File | Read when |
|---|---|
| `docs/memory/pr-map.md` | **before opening any PR or plan**: every open PR, overlaps, merge order |
| `docs/memory/decisions.md` | before changing behaviour, pricing, gating or distribution (dated decisions) |
| `docs/memory/gotchas.md` | before touching transport, pricing/mirror data, releases, telemetry or tests |
| `docs/memory/mcp-guidelines.md` | before any tool, auth, manifest or registry/directory work |
| `docs/memory/ai-usage.md` | before AI-heavy work (audits, citation checks, reviews) |

**Memory protocol:**
- When you learn something a future session needs (a decision, a trap, a PR's owner or status), add **one dated line** to the right file in the same PR.
- Supersede outdated lines by marking them `~~old~~ → new (date)`; don't silently delete them.
- Don't copy what git already records. Record the *why* and the non-obvious.
- Keep each file skimmable (under ~150 lines). Summarise and prune when a file grows.

## AI usage (short version; see `docs/memory/ai-usage.md`)
- Read the one memory file you need. `rg` before opening big files (`src/data/website-mirror.ts`, `src/server.ts`, the root audit reports).
- **Don't open a new audit/plan PR** for something already in `docs/memory/pr-map.md`; add to the owning PR.
- For a broad search, use one Explore subagent and keep its conclusion. Run reviewers one at a time.
- Don't re-run the live audit to "check" a result recorded in the last week; the weekly Monday audit already does it.

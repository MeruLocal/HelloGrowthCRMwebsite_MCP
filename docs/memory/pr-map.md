# PR map: every open PR, what it owns, and where they overlap

**Read this before opening any PR or plan.** Status as of 2026-09-28: **17 open PRs**, none merged since 2026-09-02 (the last merges were #23–#30). Re-check with:

```bash
gh pr list --state open --limit 60 --json number,title,headRefName,updatedAt
```

Update this file in the same PR when a PR opens, merges, closes or changes owner.

## 1. Merge first (live defect)
| PR | Branch | One line | Overlap / note |
|---|---|---|---|
| **#50** | `fix/mirror-pricing-canonical-2026-09-07` | Pricing mirror: India Growth ₹899 + 18% GST on both modes, USD monthly $13 → $12, FAQ "India prices include GST" corrected; test pin updated | **The only live fix outstanding.** `main` still serves "₹1,099/user/month" (`src/tools/pricing.ts`, `src/data/website-mirror.ts`). Green since 9/7, mergeable. Needs merge **+ redeploy**; then confirm with `npm run audit:live`. #53 and #55 both exist only to say "merge #50" |

## 2. Transport stack (merge in order; each is based on the one before)
| PR | Base | One line | Overlap / note |
|---|---|---|---|
| #32 | `main` | CORS preflight (204) + `Access-Control-Expose-Headers: mcp-session-id` so browser MCP clients can connect | touches `src/server.ts` |
| #33 | #32 | Accept-header tolerance: answer JSON instead of 406 when a client offers only `application/json` (rewrites `req.rawHeaders` too) | `src/server.ts` |
| #34 | #33 | Serve `/mcp` as canonical, keep `/sse` as a permanent alias; manifest + `/version` advertise both | `src/server.ts`, `src/well-known.ts`. **Contradicts the README**, which says the endpoint "moved from `/mcp` to `/sse`"; README must change with it (rule: describe only what is served) |
| #35 | #34 | Audit skill + `scripts/audit-live-mcp.mjs` gain a client-fitness section (CORS, Accept, `/mcp`, protocol versions, npm published) | **Conflicts with #31 and #54**: all three edit `.claude/skills/mcp-server-audit/SKILL.md`; #54 renames that folder and edits `audit-live-mcp.mjs` |

## 3. Audit skill / tooling
| PR | One line | Overlap / note |
|---|---|---|
| #31 | Audit skill update: v2.0.0 baseline 0F/4W/14P, gating rules (76 anon / 88 with token), 2026 benchmark §6 | same file as #35 and #54. Merge #31 → #35 → #54 (rename last) |
| #54 | Rename skill folder `mcp-server-audit` → `rss-mcp-server-audit` | rename; rebase after #31 and #35 or they conflict |
| #46 | Vendor Anthropic `mcp-builder` skill into `.claude/skills/` (+3.5k lines) | No file overlap. The founder's Claude setup already has `mcp-builder` globally; vendoring only helps other devs' sessions. Decide keep or close |
| #52 | `scripts/ai-citation-audit.mjs` + queries JSON + AI-traffic runbook | Standalone. Needs model API keys from env only. Boundary with hellocrmwebsite PR #1424 is in its runbook |
| #47 | CI: `ci.yml` (verify on Node 18.18 + 22), `production-check.yml` (daily: prod `/version` vs `main`), `publish.yml` (npm with provenance, dry-run default) | Implements item 2 of #36. Needs an `NPM_TOKEN` secret before first publish. The only PR adding workflows |

## 4. Plans, handoffs and audit reports (docs only; heavy overlap)
| PR | One line | Overlap / note |
|---|---|---|
| #37 | Upgrade roadmap 2026-09-02 (Sol-reviewed): Phases 0–6 | **The roadmap of record**; issues #38–#45 track it. Other plans should point here, not re-scope |
| #36 | Release + distribution work order: publish `mcp-bot-crawler@2.0.0` to npm, CD gap, registry | Item 2 = #47. Publishing = issue #43 (Phase 5) |
| #48 | Dev handoff 2026-09-05: priority checklist of everything missing | Superseded in part by #49 (fix list) and #53 (9/16 audit) |
| #49 | Fix list 2026-09-07, adversarially challenged (Astra), live-verified | Item 1 = #50; item 6 = #51. Keep as the challenged fact list |
| #51 | Submission report refresh: 88 tools / 12 gated, Claude Connectors Directory + GitHub MCP Registry targets | Gated on #50 being deployed (listings must point at a truthful server) |
| #53 | Audit 2026-09-16: protocol clean; "merge #50 + redeploy is the only live fix" | Duplicate intent of #55 |
| #55 | Audit 2026-09-24: `pricing_get_plans` serves ₹1,099 (FAIL) | Calls it a "regression"; in fact #50 was never merged, so `main` never changed. Duplicate intent of #53 |

## Suggested merge order (for the human who merges)
1. #50 → redeploy → `npm run audit:live`.
2. #32 → #33 → #34 (with the README endpoint line fixed) → redeploy.
3. #31 → #35 → #54.
4. #47 (then make `ci.yml` required once green).
5. Docs batch: #37, #49, #36, #52, #51. Then close or fold #48, #53, #55 (they only restate "merge #50").
6. Decide #46 (keep or close).

## Rules
- **Don't open another audit or plan PR** whose conclusion is "merge #50" or restates the roadmap. Add a dated line here or comment on the owning PR.
- New stacked PRs: state the base PR in the title or body, and list it here.

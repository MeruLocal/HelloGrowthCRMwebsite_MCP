# Gotchas: things that have bitten us

One dated line each. Add one when something surprises you.

## Pricing / mirror data
- 2026-09-28: **`main` still serves ₹1,099** in `src/tools/pricing.ts` (`price_monthly`) and `src/data/website-mirror.ts` (`growthPriceMonthly`), plus USD $13. AI assistants quote `pricing_get_plans` verbatim. PR #50 fixes it; it is not merged. Don't re-audit it; merge and redeploy.
- 2026-09-24: Audit #55 called ₹1,099 "back again". It never left: the fix was never merged. Check `git log origin/main -- src/tools/pricing.ts` before calling anything a regression.
- 2026-09-07: "All India prices include GST" was wrong. India prices are **exclusive** of GST (₹899 bills as ₹1,060.82).
- 2026-09-02: Integrations counts disagree across surfaces (630 vs 525 vs "259+"); the mirror's `SYNCED_AT` was 2026-06-17 for that block. Owned by issue #40 (truth pipeline).
- 2026-08-06: There is no sync command; the mirror is hand-copied from hellocrmwebsite files listed in its PROVENANCE header. A `scripts/sync-mirror.mjs` is proposed (#48), not built.

## Deploy / production
- 2026-09-02: **Merging does not deploy.** There is no CD. Security fixes #22 and #29 merged and production still served the old behaviour hours later. After a merge, check `GET /version` and behaviour, not just the tool count.
- 2026-08-05: A matching tool count does not mean a matching build: `fetch_page_content` returned 3194 words locally and 0 in production with the same 83 tool names. Only behaviour proves a deploy (`./scripts/geo-audit.sh`).
- 2026-09-02: A mis-merge on `main` broke the build and un-did the `/openapi.json` 410 (fixed in `295fb90`). Run `npm run verify` after every merge from `main` into a branch.
- 2026-09-03: `server.json` advertises `mcp-bot-crawler@2.0.0` but npm returns 404: every registry-originated install fails. Publish npm first (#36 / #47).
- 2026-09-01: MCP/GA4 telemetry is **dark** unless `ENABLE_MCP_ANALYTICS` is exactly `"true"` and both GA4 vars are set in the **host** environment. `.env` does not travel with a push.

## Transport / HTTP
- 2026-09-02: `GET /sse` returns 400 because the path is named `/sse` but speaks Streamable HTTP, not legacy SSE. External audits misread this as "no AI client can connect". The inspector needs `--transport http`. PR #34 adds `/mcp`.
- 2026-09-02: `OPTIONS /sse` → 405 with no CORS headers locks out every browser MCP client; `Access-Control-Expose-Headers: mcp-session-id` is the half people forget (#32).
- 2026-09-02: Rewriting `req.headers.accept` alone does nothing: the SDK builds Web `Headers` from `req.rawHeaders`. Rewrite both (#33).
- 2026-08-31: `/openapi.json` returning **410 is by design**, not a bug. Don't "fix" it.
- Always: leave `TRUST_PROXY_HEADERS=true` behind Cloudflare; set it false only with no proxy, or any client picks its own rate-limit bucket. Without Upstash, rate limits are per-process (N instances = N× the limit).

## Security
- 2026-09-01: Supabase is used with the **service-role key** (bypasses RLS) for the live-content tools. Any new tool that writes or reads personal data must go behind the `MCP_ADMIN_TOKEN` gate; there is an invariant test in `src/tools/__tests__/access.test.ts`.
- 2026-09-07: One shared bearer token for all privileged tools, and service-role on public reads: DB least-privilege is still open (fix list #49 item 3, issue #39).

## Repo hygiene
- 2026-09-28: 20 `vitest.config.ts.timestamp-*.mjs` files are **tracked** even though `.gitignore` ignores them. Don't add more; removing them is a separate chore PR.
- 2026-09-28: `.claude/settings.json` holds another developer's machine-specific allow-list paths. Don't copy it; don't add personal paths to it.
- 2026-09-28: There is no `samples/access.log` although `DEFAULT_ACCESS_LOG` defaults to that path. Pass `logPath`/`logText` explicitly.
- 2026-09-28: No `.github/workflows` on `main`; nothing runs on a PR until #47 merges. Run `npm run verify` yourself.
- 2026-09-28: Many dated audit/plan reports sit at the repo root and in `docs/plans/`. They are history; the current truth is `GET /version`, the latest audit and this memory folder.

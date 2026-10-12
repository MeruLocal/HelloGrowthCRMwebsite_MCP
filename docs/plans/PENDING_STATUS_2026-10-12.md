# Website MCP — what is still pending from the plans (2026-10-12)

**Server audited:** `mcp.hellogrowthcrm.com` (the public website + bot-governance MCP, v2.0.0, 76 of 88 tools visible anonymously). Not the CRM MCP server.
**Measured:** 2026-10-12 with `node scripts/audit-live-mcp.mjs` plus hand-checks of `pricing_get_plans` and `integrations_list`.
**Plans reconciled:** dev handoff (PR #48), upgrade roadmap and issues #38–#45, fix list (PR #49), and the pending tracker on hellocrmwebsite (`docs/seo-reports/MCP_REMEDIATION_PENDING_TRACKER_2026-09-01.md`).

## Headline

`main` has not moved since **2026-09-02**. Wire audit is unchanged at **0 fail · 4 warn · 14 pass**. Issues #38–#45 are all unticked and every plan PR (#36–#57) is still open. The server is safe (C0 is closed) but its content is wrong in the ways the plans already described. The bottleneck is merging the written work, not more planning.

## Live content is still wrong (verified today)

| Item | Live now | Canonical | Plan ref | Fix PR |
|---|---|---|---|---|
| INR price | `₹1,099/user/month` still present in `pricing_get_plans` | ₹899 + 18% GST, both billing modes | A3, issue #40 | #50 (open) |
| USD monthly | `$13/user/month` | $12 | A3 | #50 (open) |
| "Unlimited users" | still in the Growth plan text | remove | tracker | #57 (open) |
| Integration count | `630`, `synced_at 2026-06-17` (about 16 weeks old) | one canonical count; website says "259+" | B1 | no job exists |
| `features_list` | `58` | needs taxonomy first | issue #40 | none |

Regression note: #55 records the ₹1,099 reappearing on 2026-09-24 after it had been purged from the website (hellocrmwebsite #1403, merged 2026-09-05).

## Pending, by plan item

**Do first (small, unblocked)**
1. Merge #50, then #57 (stacked), redeploy. Add the pricing-truth test from #57 so a third regression fails CI.
2. Ship the sync command (B1): `scripts/sync-mirror.mjs` and a weekly Action that opens a PR. Decide the integration/feature taxonomy first (issue #40 task 2.1).
3. Freshness gate (B2, task 2.3): `/health` degrades and the audit script FAILs when `SYNCED_AT` is older than about 10 days.
4. Sweep `?? 0` / `?? []` over query results (task 2.4).

**Phase 0 and 1 (issues #38, #39), none ticked**
5. Extract or red-team the 12 gated tools: CI invariant tests that anonymous sessions cannot list or invoke them (0.1/0.2).
6. Rotate the service-role key and record the exposure determination (0.3). Not verifiable from outside; confirm with the owner.
7. DB isolation off the service-role key (1.1), launch-blocking for distribution.
8. Abuse controls and a Cloudflare per-IP limit on `/sse` (1.3).
9. Telemetry sink, synthetic probes, alert owner (1.4). #27 was only a plan.

**Phase 3 polish (issue #41): the four standing warns, unchanged**
10. `title` on all tools. 11. `outputSchema` on top tools. 12. Document or alias `/sse`. 13. Decide `tools.listChanged`. 14. Run `modelcontextprotocol/conformance`. Plus C2: changelog as an MCP resource.

**Phase 5 distribution (issue #43), gated behind the above by design**
15. Publish npm `mcp-bot-crawler` (still 404), or drop the `packages` block from `server.json`.
16. Refresh the submission report (#51); add Claude Connectors Directory and GitHub MCP Registry.
17. Correct the mcp.so listing, only after item 1 is live.

**Website repo (hellocrmwebsite), from the tracker**
18. G4: add the regional pricing/compliance line to `src/lib/llms-txt.ts` (grep found none).
19. Custom API domain for the Edge Function. `/docs` still renders the raw `*.supabase.co` ref; this is documented as by design until the domain exists.
20. G2: locale parameters on pricing and compliance tools.

## Closed since the plans were written
- C0: auth gate deployed (76/88 visible, 12 gated, `/health` 200, `/openapi.json` 410).
- Fictional CRM copy removed from the landing page and discovery files; `mcp-discovery-truth.test.ts` is on hellocrmwebsite master.
- hellocrmwebsite #1403 (website-side ₹1,099 removal) merged 2026-09-05.

## Not verified
- Whether the service-role key was rotated (0.3) and the content pipeline received `MCP_ADMIN_TOKEN` (A2).
- Whether hellocrmwebsite CI is healthy now (A1).
- The Monday weekly-audit task output.
- URL resolution in payloads and `content_get_comparison`.
- The CRM MCP server (`crm-mcp-server`), which is out of scope here.

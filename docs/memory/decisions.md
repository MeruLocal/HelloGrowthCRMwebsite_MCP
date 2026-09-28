# Decisions (dated). Newest first within each area.

Supersede lines like this: `~~old~~ → new (date)`. Quote the founder verbatim where it matters.

## Truth / content
- 2026-09-03: **Canonical INR price rule** (founder, billing ground truth = hellocrm `gstPlanSync.ts`): India Growth is **₹899/user/month + 18% GST on both billing modes** (bills ₹1,060.82/month). Annual = 10 months paid, 2 free. **Never present ₹1,099 as a price**; it matches no billing plan. Fix = PR #50.
- 2026-08-12: USD Growth monthly is **$12** (HG-004, hellocrmwebsite pricing constants), not $13. Fix = PR #50.
- 2026-09-02: **Describe only what the live server serves.** Manifest, README, CHANGELOG, marketing and code change in the same release (lessons C1/C8: `/openapi.json` described a different product; `server.json` advertised an unpublished npm package).
- 2026-08-06: The website is the source of truth; `src/data/website-mirror.ts` is a downstream copy with a provenance map. Never edit mirror values to differ from the website; re-extract and bump `SYNCED_AT`.

## Security / gating
- 2026-09-01: **C0 auth gate.** The 8 write tools and 4 personal-data readers are served only with `Authorization: Bearer $MCP_ADMIN_TOKEN`; unset = not served (fail-closed). stdio stays trusted. Anonymous: 76 tools; with token: 88 (as of v2.0.0).
- 2026-09-01: Audits run anonymous only. Never call the personal-data tools in an audit.
- 2026-08-31: `/openapi.json` retired with **410 Gone** (v2.0.0, a breaking major bump). The planned authenticated CRM spec lives in `crm-mcp-tools/openapi.planned.json` and must never be served from this host.

## Transport / protocol
- 2026-09-02: Stay on MCP spec **2025-11-25** (SDK 1.29.x). The 2026-07-28 spec is stateless (no initialize handshake, no `Mcp-Session-Id`); plan session handling before any SDK bump past 1.29.x.
- 2026-09-02: Authless is acceptable for this server because it serves public data only. Any account-data tool needs OAuth 2.1 (bearer-only blocks the Claude directory).
- 2026-09-02 (proposed, PR #34): `/mcp` canonical, `/sse` a permanent alias. Not merged; `main` serves `/sse`.

## Release / distribution
- 2026-08-31: The version lives in 3 strings (`package.json`, `server.json` ×2); `smithery.yaml` carries none, on purpose. `npm run check:versions` gates it.
- 2026-08-31: Publish order is **npm first, MCP Registry second**, never the reverse.
- 2026-09-02: Roadmap of record = PR #37 (Phases 0–6), tracked by issues #38–#45. **Distribution (Phase 5) waits for Phases 0–4**; Phase 2 (truth pipeline, #40) gates all marketing.

## Process
- 2026-09-28: Every repo gets the N15 kit (memory system, efficient AI use, PR checklist). No UI here, so no design system. Admin COMBINED plan N15.
- 2026-09-02: A weekly automated audit (Mondays 09:05 IST) guards the baseline **0 fail / 4 warn / 14 pass**. ₹1,099 in `pricing_get_plans` is an automatic FAIL.
- Always: devs merge and deploy; Claude plans, audits and drafts code for review.

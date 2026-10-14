# Plan: cap outbound crawling for anonymous callers

**Severity:** P1 · **Effort:** S · **Server:** website MCP, `origin/main` 7312627

## Finding
- `crawl_pages` allows `limit` up to 25 (`src/tools/fetch-page-content.ts`, schema `max(25)`).
- A call fetches robots.txt, every listed sitemap, and child sitemaps until `MAX_SITEMAP_PAGES` (25) entries are collected (`src/core/crawler.ts:101-119`), then up to 25 pages.
- `scan_website_bots` `sampleSize` allows up to 100, capped by `MAX_SITEMAP_PAGES`.
- `check_ai_extractability` accepts up to 25 URLs.
- The HTTP limiter is 60 requests/min per IP (`src/server.ts:395-397`). One IP can therefore trigger roughly 60 × 25+ ≈ 1,500+ outbound fetches a minute against a third-party site of its choosing, all coming from our server's IP. That turns us into an amplifier, and abuse complaints land on our infrastructure.
- `PoliteCrawler`'s per-host delay (1 s) is per crawler instance. Each call makes a new instance, so parallel calls are not throttled.

Not measured: I did not run load against any target. The numbers above come from the code limits.

## Proposed fix
- Use the per-call context (`src/tools/call-context.ts`, from the export_bot_report plan) for `authorized` and `clientIp`.
- New `src/utils/outbound-budget.ts`:
  - `takeOutbound(ip, n)` on top of the existing `RateLimitStore` (`src/utils/rate-limit-store.ts`), which is in-memory by default and Upstash when configured.
  - Key it as `outbound:<ip>`.
  - Defaults: `OUTBOUND_BUDGET_PER_MIN=30` fetches per IP per minute, `OUTBOUND_BUDGET_PER_HOUR=300`. Authorised callers are exempt.
- Charge the budget once per actual network fetch inside the safe-fetch / `PoliteCrawler.fetchText` path, not per tool call. A call that runs out stops early and returns a partial result plus a warning, for example "outbound budget exhausted; retry in Ns".
- Per-call page caps for unauthorised callers, read from the context, configurable through `PUBLIC_MAX_PAGES_PER_CALL`:

| Tool | Public cap per call |
|---|---|
| `crawl_pages` `limit` | 5 |
| `scan_website_bots` `sampleSize` | 5 |
| `check_ai_extractability` URLs | 5 |
| sitemap child expansion | 5 |

- Leave the existing request rate limiter unchanged.

## Tests to add
- Unit tests for `outbound-budget`: exhaustion, window reset, authorised exemption.
- A `crawl_pages` test with a stubbed crawler and a public context, asking for `limit:25`: at most 5 page fetches, and a warning naming the cap.
- An authorised context still gets 25.
- With the budget set to 3, the fourth fetch is refused and a partial result comes back.

## Risks / rollout
- Public users get smaller crawls, so the tool descriptions must say so.
- Behind Cloudflare, the IP comes from `resolveClientIp` (right-most XFF hop only when `TRUST_PROXY=1`). If the proxy is misconfigured, every caller shares one budget. Check `TRUST_PROXY` in production before rollout.
- Depends on the call-context base commit. Order it after the SSRF plan so both touch `fetchText` once.
- Founder decision: the default caps (5 pages per call, 30 fetches per minute).

## Not checked
- The production `TRUST_PROXY` setting and how Cloudflare forwards headers.
- Real traffic volumes.

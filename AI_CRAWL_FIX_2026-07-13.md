# AI Crawl Fix — 2026-07-13

## Problem

The deployed MCP tools `fetch_page_content` and `crawl_pages` returned empty content for **every** page (`text: ""`, `wordCount: 0`, no headings, no links), even though the site is fully crawlable. AI clients calling the MCP got titles and meta only — no page content.

## Root cause (verified against live HTML)

The site now uses Next.js App Router streaming (Suspense/PPR). The raw HTML of e.g. `/pricing` is 663 KB, but `<main>` is an **empty streaming shell** (~155 chars of skeleton). The real content — 19,341 chars including the H1 — is streamed later in the document inside `<div hidden id="S:0">` / `<div hidden id="S:1">` blocks, outside `<main>`.

`extract()` in `src/tools/fetch-page-content.ts` unconditionally preferred `<main>`, so it extracted the empty shell. Not a robots.txt, UA-blocking, or SSR problem (same HTML is served to browser, crawler, and GPTBot UAs — verified).

## Fix

`extract()` now validates each candidate region (`<main>` → `<body>` → whole doc) and only accepts one with ≥ 200 chars of readable text; otherwise it falls back to the next region (picking the least-empty if none qualify). On the live pages this selects `<body>`, which includes the streamed hidden content divs.

- Changed: `src/tools/fetch-page-content.ts` (shared by `fetch_page_content` and `crawl_pages`)
- Added: `src/tools/__tests__/fetch-page-content.test.ts` — 5 tests incl. a regression test reproducing the streaming-shell HTML
- `npm run build` clean; 149/149 tests pass

## Action required

1. **Redeploy the MCP server** — the fix only takes effect after deployment. Then verify: ask an AI client to "read and summarize https://hellogrowthcrm.com/pricing" → expect real text, headings, links.

## Site-side AI visibility status (all verified live today)

| Asset | Status |
|---|---|
| robots.txt — all 8 Semrush-checked AI bots + CCBot, Copilot, Brave allowed | ✅ |
| /llms.txt (curated index) + /llms-full.txt (full corpus) | ✅ |
| /ai.txt (AI usage policy) | ✅ |
| Sitemap index + 9 child sitemaps, 211 entries | ✅ |
| /.well-known/mcp.json manifest | ⚠️ see below |

## Two remaining site-side items (website repo, not this one)

1. **MCP endpoint mismatch:** `/.well-known/mcp.json` says `server_url: https://api.hellogrowthcrm.com/mcp/v1`, but llms.txt, llms-full.txt, and this repo's openapi.json all say `https://mcp.hellogrowthcrm.com/mcp`. AI agents auto-discovering via the manifest may hit the wrong endpoint. Align the manifest to the canonical URL.
2. **robots.txt cache variance:** one edge variant includes the `Content-Signal:` line, another doesn't. Purge the CDN cache for `/robots.txt` so all crawlers see the current version.

Optional (website repo): because content is streamed outside `<main>`, naive AI extractors that only read `<main>` may see an empty page. Consider disabling streaming/PPR (or forcing full SSR) for known AI-bot user agents.

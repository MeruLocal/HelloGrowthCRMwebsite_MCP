# Plan: one safe-fetch helper to stop SSRF from public tools

**Severity:** P0 · **Effort:** M · **Server:** website MCP, `origin/main` 7312627

## Finding
Public tools fetch caller-chosen URLs with no address checks:

| Tool | Where it fetches |
|---|---|
| `fetch_page_content`, `crawl_pages` | `src/tools/fetch-page-content.ts` → `PoliteCrawler.fetchText` |
| `scan_website_bots` `targetUrl` | `src/tools/scan-website-bots.ts:70-90`, which also follows `Sitemap:` lines from the fetched robots.txt |
| `check_ai_extractability` | `src/tools/geo-diagnostics.ts` (crawler) |
| `validate_sitemaps` | `geo-diagnostics.ts:237`, raw `fetch` |
| `check_llms_txt` | `src/tools/llms-txt.ts:308`, raw `fetch` with no timeout |

- `PoliteCrawler.fetchText` (`src/core/crawler.ts:70-80`) uses undici with `maxRedirections: 3`. Each hop's host is never re-checked, despite the header comment saying "never follows redirects to a different host". The body is unbounded: `res.body.text()` at `:79`.
- So a caller can reach `http://127.0.0.1:*`, `169.254.169.254` (cloud metadata), RFC1918 and CGNAT addresses, IPv6 ULA and link-local addresses, or a public host that redirects there. The response comes back as page text.
- `generate_robots_txt` does not fetch. But `sitemapUrls` is only `z.string()` and is printed into the output as `Sitemap: <value>`. Embedded newlines can inject extra robots.txt directives. This should be fixed in the same pass.

Not measured: I did not probe any internal address from the sandbox. The analysis above comes from reading the code.

## Proposed fix
- New `src/core/safe-fetch.ts`, `safeFetch(url, {timeoutMs, maxBytes = 2 MB, maxRedirects = 3, headers})`:
  1. Parse the URL. Allow only `http:` and `https:`. Reject userinfo (`user:pass@`).
  2. Resolve DNS with `dns.lookup(host, {all:true})`. Reject the request if **any** address is in a blocked range:
     - IPv4: 0/8, 10/8, 100.64/10, 127/8, 169.254/16 (including metadata), 172.16/12, 192.0.0/24, 192.168/16, 198.18/15, 224/4, 240/4, 255.255.255.255
     - IPv6: ::, ::1, fc00::/7, fe80::/10, ff00::/8, ::ffff:0:0/96 (checked against the IPv4 list), 64:ff9b::/96
     - IP-literal hosts get the same check without a DNS lookup.
  3. Pin the connection to the vetted address with an undici `Agent` `connect.lookup` override that returns the checked IP. This closes the DNS-rebinding race between check and connect.
  4. Set `redirect: "manual"`. On a 3xx, resolve `Location` against the current URL and repeat steps 1–3 for that hop.
  5. Stream the body and abort once `maxBytes` is reached, returning `truncated: true`. Enforce a total timeout covering every hop.
  6. Errors are generic codes only (`blocked_address`, `timeout`, `too_large`, `bad_scheme`, `network_error`), with no internal messages.
- Use it everywhere a tool fetches:
  - `PoliteCrawler.fetchText`, which covers `fetch_page_content`, `crawl_pages`, `scan_website_bots` and `check_ai_extractability`
  - `validate_sitemaps` `timedFetch`
  - `check_llms_txt` `head()`
- Add a grep test that fails if `fetch(` or undici `request(` appears in `src/tools` or `src/core` outside `safe-fetch.ts`. The YouTube feed in `src/lib/youtube-feed.ts` uses a fixed URL, so it is allowlisted.
- Escape hatch: `SAFE_FETCH_ALLOW_PRIVATE=1`, for local development only and documented as such. Never set it in production.
- `generate_robots_txt`: change `sitemapUrls` to `z.string().url()`, then refine it to http(s) only with no CR/LF.

## Tests to add
- `src/core/__tests__/safe-fetch.test.ts`:
  - Range table (v4 and v6, with edge addresses on both sides of each boundary).
  - A scheme other than http(s) is rejected.
  - A local test HTTP server on 127.0.0.1 is blocked by default.
  - With the escape hatch set:
    - a redirect chain whose second hop is private is blocked
    - more than 3 redirects fails
    - a body over the cap comes back truncated
    - a slow server times out
- A tool-level test: `fetch_page_content {url:"http://169.254.169.254/latest/meta-data/"}` returns `isError` with `blocked_address`.
- A `generate_robots_txt` test where newline injection is rejected.

## Risks / rollout
- Sites that only resolve to private addresses can no longer be scanned. That is intended.
- IPv6-only hosts still work as long as their addresses are public.
- Watch for false positives in CGNAT ranges used by some CDNs. In practice CDNs use public ranges.
- Pinning the DNS answer needs an undici `Agent`, and undici is already a dependency.
- Founder decision: none.

## Not checked
- The live server and the production network layout, for example whether Apache on the host exposes an admin port to localhost.

# Why AI Isn't Returning Your Website Content Through MCP — Diagnosis & Fix

**Site:** https://hellogrowthcrm.com  ·  **MCP server:** `mcp-bot-crawler` (deployed as the HelloGrowthCRM website MCP)  ·  **Date:** 2026-06-16

This is not a generic checklist. Every claim below was tested against your **live** site and your **deployed** MCP server during this session.

---

## TL;DR — the real root cause

**Your website is perfectly crawlable. The problem is on the MCP side: no tool in your server actually returns page *content*.**

Two concrete, confirmed issues:

1. **`scan_website_bots` is a bot-governance tool, not a content tool.** It fetches robots.txt + sitemap and *samples pages only to check the HTTP status code*. The crawler literally discards the HTML — `crawler.ts` says so in a comment: *"We only verify reachability — no content is stored or analyzed downstream."* The result object returns `sampledPages: 5` (a **count**), never the page text, title, headings, metadata, or links. So when you ask the AI to "crawl and summarize my pages," the tool has nothing to give it.

2. **Your content tools that *should* return text are throwing DB errors.** `blog_list` and `blog_search` `SELECT ... meta_description`, but that column **does not exist** in the `blog_posts` table — the real column is **`excerpt`**. Live call returned: `Supabase error: column blog_posts.meta_description does not exist`. So the one path that does serve real content is broken for two of three blog tools.

Everything else — SSL, DNS, robots.txt, sitemaps, server-side rendering, AI-bot allowances — checked out clean.

---

## What I tested live (evidence)

| Check | Method | Result |
|-------|--------|--------|
| Site reachable over HTTPS | fetched `https://hellogrowthcrm.com/` | **200**, valid cert, no redirect loop |
| Content server-rendered (not JS-only) | fetched homepage **without** JS execution | Full hero copy, nav, comparison table, blog list, footer **all present in raw HTML** ✅ |
| robots.txt | fetched `/robots.txt` | `User-agent: *  Allow: /`; GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Gemini, etc. **explicitly allowed** ✅ |
| Sitemaps | `scan_website_bots` + `/robots.txt` | sitemap-index + 8 child sitemaps declared; **211 sitemap entries** parsed ✅ |
| MCP scan tool | called deployed `scan_website_bots` | Returned robots + `sitemapCount: 211` + `sampledPages: 5` — **no page content** ⚠️ |
| MCP content tool | called deployed `blog_list` | **ERROR**: `column blog_posts.meta_description does not exist` ❌ |
| MCP content tool | called deployed `blog_get` | Works (`select("*")`); real columns include `excerpt`, `content`, `cover_image` ✅ |
| Access-log correlation | `scan_website_bots` | Warning: `./samples/access.log` ENOENT in the deployed env (historical bot detection silently skipped) ⚠️ |

---

## Where the problem is NOT (so you can stop looking there)

- **Not the website.** SSR/SSG is working — the full text of every page is in the initial HTML response. A no-JS fetcher (GPTBot, ClaudeBot, Perplexity, your own crawler) sees the real content. No empty React root, no hydration-only content.
- **Not robots.txt.** AI crawlers are explicitly allowed. Only AhrefsBot/SemrushBot/DotBot are blocked (intentional).
- **Not SSL / DNS / redirects.** Clean 200, valid chain, canonical host resolves.
- **Not a WAF / bot block / CORS issue.** The polite crawler (honest UA `mcp-bot-crawler/1.0`) fetched robots, sitemaps, and sampled pages with no 403/429/challenge.
- **Not JS rendering.** This means **you do NOT need Playwright/Puppeteer.** A plain `fetch` returns full content. (Playwright code is still provided at the end as a fallback, but it is not required here.)

---

## How to tell which side a problem is on (decision tree)

```
AI returns nothing / wrong website data through MCP
│
├─ Does `scan_website_bots` return robots + sitemapCount > 0?
│     YES → website + network + crawler transport are FINE. Problem is tool output design. → MCP side
│     NO  → check DEFAULT_TARGET_URL, outbound network egress from the MCP host, SSL. → MCP host / network
│
├─ Does a content tool (blog_get) return real data, but blog_list errors?
│     YES → DB schema drift (column renamed). → MCP side (query bug)  ← YOUR CASE
│
├─ Does the AI client never call the tool at all?
│     YES → tool not registered / server not connected / schema invalid. → AI-client / registration side
│
└─ Does the tool return huge payloads then the answer truncates?
      YES → token-limit / chunking problem. → MCP side (response shaping)
```

Your case lands in the two middle branches: **tool output design** + **a query bug**.

---

## Root causes, ranked by likelihood (for *your* setup)

1. **(Confirmed, primary) No content-extraction tool exists.** `scan_website_bots` returns reachability counts, not text/metadata/links. The AI cannot summarize pages it never receives. → *Add a `fetch_page_content` / `crawl_pages` tool.*
2. **(Confirmed) `blog_list` / `blog_search` query a non-existent column** (`meta_description` → should be `excerpt`). → *One-line fix per tool.*
3. **(Confirmed, minor) `DEFAULT_ACCESS_LOG` path invalid in production**, so bot-history correlation silently no-ops. → *Make the warning explicit or ship a real log path / Supabase-backed log source.*
4. **(Watch) Large-payload truncation.** `blog_get` returns the full article body (your sample was a ~31-min read). Returning many of those at once will blow the context budget. → *Summarize/chunk; default to excerpts in list views.*
5. **(Not applicable) JS rendering / WAF / robots blocks.** Ruled out by live tests.

---

## Fix 1 — repair the broken content tools (one line each)

**File:** `src/tools/blog.ts`. The real `blog_posts` columns are: `slug, title, excerpt, content, author, cover_image, published_at, category, status, reading_time_minutes, …`. Replace `meta_description` with `excerpt`.

```diff
 // blog_list
-      .select("slug, title, author, category, published_at, meta_description, cover_image")
+      .select("slug, title, author, category, published_at, excerpt, cover_image")
```

```diff
 // blog_search
-      .select("slug, title, author, category, published_at, meta_description")
+      .select("slug, title, author, category, published_at, excerpt")
       ...
-      .or(`title.ilike.%${args.query}%,meta_description.ilike.%${args.query}%,content.ilike.%${args.query}%`)
+      .or(`title.ilike.%${args.query}%,excerpt.ilike.%${args.query}%,content.ilike.%${args.query}%`)
```

Also update the two tool **descriptions** that still say "meta_description" so the schema matches reality. Then add a regression test that selects every advertised column against the live table so schema drift fails CI instead of failing at call time.

> **Guard against this class of bug:** generate your `select()` column lists from a single shared `BLOG_COLUMNS` constant (or from Supabase generated types), so a renamed column is a TypeScript error, not a runtime 500.

---

## Fix 2 — add a real content tool (the missing piece)

This is what makes "AI crawl/read my pages and return content, links, metadata, summaries" actually work. It reuses your existing `PoliteCrawler` (so robots.txt is still respected) and your `defineTool/ok/fail` pattern. Add as `src/tools/fetch-page-content.ts` and register it in `src/tools/index.ts`.

```ts
// src/tools/fetch-page-content.ts
import { z } from "zod";
import { PoliteCrawler } from "../core/crawler.js";
import { isDisallowed } from "../core/robots-parser.js";
import { defineTool, fail, ok } from "./tool-types.js";

const MAX_TEXT = 8_000; // chars per page returned to the model (token-budget safe)

const Input = z.object({
  url: z.string().url().describe("Absolute URL on hellogrowthcrm.com to read."),
  maxChars: z.number().int().min(500).max(20_000).default(MAX_TEXT)
    .describe("Truncate extracted text to this many characters."),
});

/** Strip a Next.js SSR HTML doc down to title, meta, headings, text, links. */
function extract(html: string, baseUrl: string) {
  const pick = (re: RegExp) => (html.match(re)?.[1] ?? "").trim();
  const meta = (name: string) =>
    pick(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"));

  // Prefer <main>; fall back to <body>.
  const main = pick(/<main[^>]*>([\s\S]*?)<\/main>/i) || pick(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const stripped = main
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");

  const headings = [...stripped.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)]
    .map((m) => ({ level: Number(m[1]), text: m[2].replace(/<[^>]+>/g, " ").trim() }))
    .filter((h) => h.text);

  const links = [...stripped.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => {
      let href = m[1];
      try { href = new URL(href, baseUrl).toString(); } catch { /* keep raw */ }
      return { href, text: m[2].replace(/<[^>]+>/g, " ").trim() };
    })
    .filter((l) => l.text && l.href.startsWith("http"));

  const text = stripped.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  return {
    title: pick(/<title[^>]*>([\s\S]*?)<\/title>/i),
    metaDescription: meta("description"),
    canonical: pick(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i),
    robots: meta("robots"),
    ogTitle: meta("og:title"),
    headings,
    links: links.slice(0, 100),
    text,
  };
}

export const fetchPageContent = defineTool({
  schema: Input,
  definition: {
    name: "fetch_page_content",
    description:
      "Fetch a single hellogrowthcrm.com page and return its title, meta description, canonical, headings, in-page links, and readable text. Respects robots.txt.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", format: "uri" },
        maxChars: { type: "integer", minimum: 500, maximum: 20000, default: MAX_TEXT },
      },
      required: ["url"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    const crawler = new PoliteCrawler();
    const base = new URL(args.url);

    // Honour robots.txt for our own UA before fetching.
    const robots = await crawler.fetchRobots(base.origin);
    if (robots && isDisallowed(robots, crawler.identity, base.pathname)) {
      return fail(`Blocked by robots.txt for UA ${crawler.identity}: ${base.pathname}`);
    }

    const res = await crawler.fetchText(args.url);
    if (!res) return fail(`Fetch failed (network/timeout) for ${args.url}`);
    if (res.status >= 400) return fail(`HTTP ${res.status} for ${args.url}`);

    const data = extract(res.body, args.url);
    const truncated = data.text.length > args.maxChars;
    return ok({
      url: args.url,
      status: res.status,
      title: data.title,
      metaDescription: data.metaDescription,
      canonical: data.canonical,
      robots: data.robots,
      ogTitle: data.ogTitle,
      headings: data.headings,
      links: data.links,
      wordCount: data.text.split(/\s+/).length,
      truncated,
      text: truncated ? data.text.slice(0, args.maxChars) + " …[truncated]" : data.text,
    });
  },
});
```

Register it:

```ts
// src/tools/index.ts
import { fetchPageContent } from "./fetch-page-content.js";
export const tools = [/* …existing… */, fetchPageContent];
```

For multi-page crawling, add a thin `crawl_pages` wrapper that pulls N URLs from the sitemap (you already have `crawler.fetchSitemap`) and calls `extract` on each, returning **one compact object per page** (title + metaDescription + first ~600 chars), never the full body for every page — that's the chunking strategy that keeps you under token limits.

---

## Response format the AI can actually consume

Return small, structured JSON — not raw HTML. The shape above is ideal: scalar metadata at top, `headings`/`links` as short arrays, `text` truncated with an explicit `truncated` flag. Rules that matter:

- **List endpoints → excerpts only** (`excerpt`, not `content`). Let the model call `blog_get`/`fetch_page_content` for the one page it needs.
- **Cap every text field** (`MAX_TEXT`) and expose `truncated` so the model knows to paginate.
- **Always include the source `url`** so the model can cite and follow links.
- **Never return raw HTML** — strip to text + structured fields. Raw markup wastes 60–80% of tokens.

---

## Practical debugging commands

```bash
# 1. Site reachable + status + redirects
curl -sSL -o /dev/null -w "%{http_code} %{url_effective}\n" https://hellogrowthcrm.com/

# 2. Full headers (content-type, cache-control, x-robots-tag, server)
curl -sSI https://hellogrowthcrm.com/ | sed -n '1,40p'

# 3. robots.txt
curl -s https://hellogrowthcrm.com/robots.txt

# 4. Sitemap (is it XML? how many <loc>?)
curl -s https://hellogrowthcrm.com/sitemap-index.xml | grep -c "<loc>"

# 5. Does a no-JS fetch see real content? (proves SSR)
curl -s https://hellogrowthcrm.com/ | grep -o "Stop Losing Deals" | head -1
#    → prints the hero headline = content is in the HTML, no JS render needed

# 6. Behave like an AI crawler (UA test — confirms you are NOT UA-blocked)
curl -s -A "GPTBot/1.0 (+https://openai.com/gptbot)" -o /dev/null -w "%{http_code}\n" https://hellogrowthcrm.com/

# 7. Run the MCP server locally on stdio and watch logs
cd HelloGrowthCRMwebsite_MCP && npm run build && LOG_LEVEL=debug node dist/index.js

# 8. List the tools the server actually advertises (manual MCP handshake)
node test-tools.mjs        # repo already ships this harness
```

Node fetch sanity test (matches what your crawler does):

```js
// quick-fetch-test.mjs  →  node quick-fetch-test.mjs
const r = await fetch("https://hellogrowthcrm.com/pricing", {
  headers: { "user-agent": "mcp-bot-crawler/1.0 (+https://hellogrowthcrm.com/bot-info)" },
});
const html = await r.text();
console.log("status:", r.status, "bytes:", html.length,
  "has H1:", /<h1/i.test(html), "has 'Pricing':", html.includes("Pricing"));
```

**Confirm the AI client is actually calling the tool:** turn on `LOG_LEVEL=debug` and watch for the `CallTool` entry when you ask the model to read a page. No log line = the client never invoked it (registration/connection problem, not a crawl problem). A log line followed by a thin payload = the tool ran but returned nothing useful (your current situation).

---

## Playwright fallback (only if a page ever becomes JS-only)

You do **not** need this today — your pages are server-rendered. Keep it for any future client-rendered route:

```js
import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ userAgent: "mcp-bot-crawler/1.0 (+https://hellogrowthcrm.com/bot-info)" });
await page.goto("https://hellogrowthcrm.com/some-spa-route", { waitUntil: "networkidle" });
const text = await page.evaluate(() => document.querySelector("main")?.innerText ?? document.body.innerText);
const links = await page.$$eval("a[href]", as => as.map(a => ({ href: a.href, text: a.innerText.trim() })));
await browser.close();
// feed `text`/`links` into the same extract→truncate→return shape as fetch_page_content
```

---

## MCP-server / registration checklist (rule out the client side)

- Server starts clean: `node dist/index.js` prints no stack trace, holds stdio open.
- Tools advertised: client's tool list shows `scan_website_bots`, `blog_get`, `fetch_page_content`, etc. (run `test-tools.mjs`).
- Input schemas valid JSON Schema (`type: object`, `additionalProperties: false`) — yours are.
- Every handler returns `{ content: [{ type: "text", text }] }` via `ok()`/`fail()` — yours do.
- Errors surface as `isError: true` text, not thrown exceptions that kill the stream — yours do.
- Required env present in the deployed environment: `SUPABASE_URL`, service key, `DEFAULT_TARGET_URL`. (Missing keys = silent empty content tools.)

---

## Best practices for making a site AI-crawlable (you already pass most)

1. Server-render or statically generate content so it exists in the first HTML response. ✅ (you do)
2. Allow AI user-agents in robots.txt (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended…). ✅
3. Publish and reference a sitemap (and a sitemap index). ✅
4. Keep canonical + meta description + structured headings on every page. ✅
5. Consider an **`/llms.txt`** at the root summarizing your key pages for AI agents — you don't have one; it's a cheap GEO win.
6. Expose a content-returning MCP tool with **bounded, structured** output. ⚠️ (the gap this report closes)
7. Don't ship secrets in `.env` to the repo; your `.env` is tracked alongside `.env.example` — verify it's gitignored.

---

## Final checklist before retesting

```
[ ] blog.ts: meta_description → excerpt (blog_list + blog_search) + descriptions updated
[ ] Regression test selects all advertised columns from live blog_posts (catches drift in CI)
[ ] New fetch_page_content tool added + registered in tools/index.ts
[ ] (optional) crawl_pages wrapper returns 1 compact object/page, excerpts not full bodies
[ ] MAX_TEXT cap + `truncated` flag on every text-returning tool
[ ] DEFAULT_ACCESS_LOG points to a real source in prod (or warning made explicit)
[ ] npm run build && npm test green
[ ] Manual: ask the AI "read and summarize https://hellogrowthcrm.com/pricing"
      → expect title, meta, headings, links, summarized text (not a status count)
[ ] LOG_LEVEL=debug shows CallTool → fetch_page_content with a populated payload
[ ] Open PR against the MCP repo (every change = a PR)
```

**Bottom line:** the website is doing its job; the MCP server just needs (a) the `excerpt` column fix and (b) a tool that actually returns extracted page content. Once `fetch_page_content` is live, "AI, crawl and summarize my pages" will return real titles, metadata, links, and text instead of a reachability count.

# GEO / AEO Master Plan — AI-Search Visibility

**Status:** Proposed
**Created:** 2026-08-05
**Owner:** Growth + Web
**Goal:** Be the recommended answer when a buyer asks ChatGPT / Gemini / Perplexity / Google AI
Overviews something like *"best CRM for travel agents in India"*.

---

## 0. How to read this

Every claim in §2 is a **live measurement taken 2026-08-05**, not an assumption. Commands to
reproduce each one are in §8.

This plan was ranked, then re-ranked by an independent reviewer with no repo access. **The
reviewer overturned the original ordering** and that correction is the single most important
thing in this document. It is recorded honestly in §1 rather than quietly folded in.

Work items live in **two repos**. This plan lives in the MCP repo because that is where the
audit originated, but most of the high-impact work belongs to `hellocrmwebsite`:

| Tag | Repo |
|---|---|
| `[web]` | `MeruLocal/hellocrmwebsite` |
| `[mcp]` | `MeruLocal/HelloGrowthCRMwebsite_MCP` (this repo) |
| `[ops]` | No repo — console / account work |

---

## 1. The ranking correction (read this before planning sprints)

The original ordering put **"publish the MCP server to npm and submit it to 26 directories"**
near the top, on the theory that DR-70+ directory backlinks would lift AI-search visibility.

**That was wrong, and the plan is corrected accordingly.**

An independent reviewer's verdict, which this plan now adopts:

> ChatGPT Search, Gemini and Perplexity do not discover an arbitrary MCP server and invoke its
> tools when a user asks for the best CRM. An MCP server has to be explicitly connected by a
> user, or bundled into a client. That is **product distribution, not organic answer ranking**.

Publishing to npm and the official registry is still worth doing — it is an hour of work and it
protects the package name. But it is **item 15 of 25**, not item 1. A 26-directory submission
campaign is **directory-count theatre** and is explicitly descoped in §6.

The second correction, equally important:

> Deploying the extraction fallback *inside the MCP server* is **not** equivalent to fixing the
> website's `<main>` output. It repairs our own tool. It does nothing for ChatGPT's, Gemini's or
> Perplexity's independent extractors.

And the assumption the whole effort is most likely to die on:

> Machine readability only makes your claims **retrievable**. "Best CRM" recommendations are
> driven by independent corroboration — reviews, real customer evidence, and the domains each
> answer engine already trusts. If G2, Capterra, Reddit, Techjockey and travel-industry sources
> do not validate the product, AI systems will keep recommending competitors that have that
> external consensus.

**Implication:** §5 (third-party corroboration) is not a "nice to have" appendix. For the
outcome we actually want, it outranks most of the engineering in §4.

---

## 2. Verified findings

### 2.1 Blocking — content and discovery

**F1. Three sitemaps hard-fail at a ~15.3s edge timeout.** `[web]` — **worst finding in this
document.**

| Sitemap | Result (3/3 attempts) |
|---|---|
| `tools-sitemap.xml` | HTTP 000 after 15.48s |
| `alternatives-sitemap.xml` | HTTP 000 after 15.28s |
| `image-sitemap.xml` | HTTP 000 after 15.36s |

`alternatives-sitemap.xml` covers the **42 competitor-alternative pages** — the highest
commercial-intent, most citation-worthy content on the site. Its discovery path is dead. The
consistent ~15.3s cutoff means these are generated at request time and hitting a platform
timeout, not a transient blip.

Working for contrast: `sitemap.xml` (263 KB), `blog-sitemap.xml` (465 URLs),
`industries-sitemap.xml` (513), `help-sitemap.xml` (79), `agentic-ai-sitemap.xml` (10).

**F2. No IndexNow.** `[web]` `/indexnow.txt` → 404. No key file, no submission pipeline.
2026 GEO research is consistent that **Bing indexing is a hard prerequisite for ChatGPT
citations**. IndexNow is the cheapest path into Bing's index.

**F3. Bing Webmaster Tools appears unverified.** `[ops]` No `msvalidate.01` meta tag on the
homepage. Google and Ahrefs verification tags are both present. We are operating blind on the
one index that gates ChatGPT.

**F4. `<main>` extracts to zero characters on every page.** `[web]`

| Page | HTML | `<main>` text | `<body>` text |
|---|---|---|---|
| `/` | 853 KB | **0** | 16,061 |
| `/pricing` | 610 KB | **0** | 21,131 |
| `/features/whatsapp-crm` | 364 KB | **0** | 17,745 |
| `/compare/hubspot` | 462 KB | **0** | 32,397 |
| `/blog` | 439 KB | **0** | 12,625 |

Next.js App Router PPR streams the real content into `<div hidden id="S:n">` blocks *outside*
`<main>`. Any extractor that prefers `<main>` — a very common default in boilerplate-removal
pipelines — reads an empty page. Do not assume every retrieval system correctly reconstructs
Next.js streaming.

### 2.2 Performance — crawl throughput

**F5. Nothing is CDN-cached. TTFB 1.7–1.85 s on every page.** `[web]`

Measured from the Singapore edge as GPTBot: TTFB 1.715–1.841 s, total 2.08–3.17 s. Every page
returns `CF-Cache-Status: DYNAMIC` — the origin is hit on every single request.

The cause is a stack of contradictory directives on the same response:

```
cdn-cache-control: private, no-store                 <- tells the CDN never to cache
vercel-cdn-cache-control: public, max-age=86400, stale-while-revalidate=86400
cache-control: public, max-age=0, must-revalidate
set-cookie: hgcrm_geo=IN; Path=/; Max-Age=2592000    <- most CDNs refuse to cache Set-Cookie HTML
vary: rsc,next-router-state-tree,next-router-prefetch,next-router-segment-prefetch,accept-encoding
x-nextjs-cache: HIT                                  <- origin HAS it prerendered
x-nextjs-prerender: 1
```

The origin has already prerendered the page. We then forbid the CDN from reusing it, and set a
geo cookie on every HTML response which independently defeats caching. Crawl throughput across
thousands of URLs is paying for this.

**F6. Oversized HTML.** `[web]` Homepage 853 KB uncompressed / 105 KB gzip; `/pricing` 610 KB /
73 KB. Mostly serialised RSC payload. Wastes crawler budget and raises parser-failure risk.

**F7. Locale split between bots and users.** `[web]` `/` serves **200 directly to GPTBot** but
**307-redirects an Indian browser to `/in`**. AI crawlers index `/` while Indian users see
`/in`. Two URL systems, ambiguous canonical identity, split mentions and links.

### 2.3 Structured data

**F8. Homepage schema is noise.** `[web]` 63 × `Organization`, 61 × `VideoObject`, 1 × `WebPage`,
1 × `BreadcrumbList`. **No `SoftwareApplication`, no `Offer`.**

Already good, leave alone: `/pricing` (21 `Offer`, 16 `UnitPriceSpecification`, 6 `Question`/
`Answer`), `/compare/hubspot` (`SoftwareApplication`, 5 `Question`/`Answer`, 2
`SpeakableSpecification`).

**F9. `llms-full.txt` is smaller than `llms.txt`.** `[web]` 10.2 KB vs 14.7 KB. A "full corpus"
smaller than its own index is internally incoherent.

Working and worth keeping as-is: `robots.txt` (all major AI bots allowed), `llms.txt`,
`ai.txt`, `.well-known/mcp.json`, `.well-known/ai-plugin.json`, `oauth-protected-resource`,
`oauth-authorization-server`, `auth.md`, `security.txt`.

### 2.4 This repo

**F10. The 2026-07-13 extraction fix is committed but never deployed.** `[mcp]`
`MIN_REGION_TEXT_CHARS = 200` region-fallback is present in
`src/tools/fetch-page-content.ts` on `main`. Live probe of `fetch_page_content` against
`/pricing` still returns `wordCount: 0, text: "", headings: []`. Production is running an older
build.

**F11. Repo/package hygiene gaps.** `[mcp]`
- `registry.npmjs.org/mcp-bot-crawler` → **404, never published**
- GitHub `topics: []`, `homepage: null`
- No `server.json` (blocks the official MCP Registry)
- No `smithery.yaml`
- **No `.env.example`** — yet `README.md` instructs `cp .env.example .env`. Setup is broken for
  anyone following the README.

**F12. MCP telemetry is coded but unverified in production.** `[mcp]` `[ops]` Six events
(`mcp_request`, `mcp_tool_call`, `mcp_bot_visit`, `mcp_sse_connection_open`/`_close`,
`mcp_error`) are fully wired to the GA4 Measurement Protocol. But `ENABLE_MCP_ANALYTICS`
defaults to `false`, and `docs/MCP_GA4_VERIFICATION.md` states the live verification
"was not executed". Events are sent without `debug_mode`, so **DebugView will never show them**
even when enabled.

Net effect: **we cannot currently tell whether any AI client has ever connected to the MCP
server.** Every argument about MCP distribution value is unfalsifiable until this is on.

### 2.5 Measurement

**F13. Brand Radar tracks the wrong things.** `[ops]` Two reports exist
(`019e53a4-b87a-704d-81b7-b35bd1b4be86` / project 9658939, and
`019e5367-922d-7250-adf8-24930220f414` / project 9658945). **Both have zero custom prompts.**
Only Ahrefs' generic prompt set is tracked — never the vertical queries that matter.

**F14. Ahrefs API is exhausted and lacks the addon.** `[ops]` API units = 0 remaining. Brand
Radar SOV/mentions endpoints return `Missing addon: Brand Radar` on this plan.

**F15. Two GA4 properties fire on the site.** `[web]` `G-4QS17WFH8R` and `G-ZLRF73DCXS`.
Attribution is fragmented across both.

---

## 3. What we have NOT measured (reviewer's gap list)

These are **not findings** — they are unknowns, and several of them likely outrank the
engineering in §4. Closing them is Wave 0.

| # | Unknown | Why it matters | How to close |
|---|---|---|---|
| U1 | **Bing index coverage** | "Bing may be unverified" and "Bing has indexed 4 of 42 alternatives pages" are radically different problems. Everything about ChatGPT citation depends on this. | Verify BWT, then URL-Inspect `/pricing`, all comparison pages, top 20 industry pages. Record indexed/discovered/excluded counts, last crawl, Bing-selected canonical, `/` vs `/in`. |
| U2 | **The actual citation graph** | We do not know which domains currently win our target prompts. Without this we are optimising blind. | 50+ fixed prompts × ChatGPT / Gemini / Perplexity × {IN, intl}. Per answer capture: products recommended, cited domains + exact URLs, source type, and whether we are cited / mentioned-uncited / absent. Build a source-gap table. |
| U3 | **Independent review coverage** | We measured schema *for* ratings, never whether independent ratings exist. The latter matters vastly more. | Audit G2, Capterra, GetApp, Software Advice, Techjockey, SoftwareSuggest, SaaSworthy: presence, category, review count, India availability. |
| U4 | **Are the 513 industry pages actually distinct?** | Programmatic scale without information gain is not a moat; it is a cannibalisation and quality risk. | Text/heading similarity across pages; % industry-specific vs template; unique screenshots, workflows, objections, evidence; indexation and impressions per page. If "travel agents" vs "tour operators" is noun-replacement, consolidate. |
| U5 | **Server-log crawler behaviour** | GA4 cannot tell us what search crawlers fetched. This matters more than MCP GA4 events. | CDN/origin logs for Bingbot, OAI-SearchBot, GPTBot, PerplexityBot, Googlebot, ClaudeBot: URLs, status, bytes, latency, sitemap fetch failures, whether large responses get terminated. |
| U6 | **Page-level canonical/indexability across the full URL set** | We only measured the homepage redirect. | Full crawl recording canonical, hreflang, robots meta+header, status/redirect chain, duplicate locale equivalents, soft-404 signals, source-vs-rendered agreement. |
| U7 | **Claim sourceability** | Unqualified superlatives are weak retrieval material; specific bounded verifiable claims are usable. | Audit for exact INR pricing and limits, WhatsApp API vs Web distinction, setup time, named integrations, stated limitations, comparison methodology + update date, competitor-claim citations. |
| U8 | **Entity consistency across the web** | More useful than adding another `Organization` block. | Same name/spelling/URL/logo/founding entity across LinkedIn, Crunchbase, G2, Capterra, GitHub, npm, Meta partner records, Indian marketplaces. |

---

## 4. Engineering plan (reviewer-corrected order)

### Wave 1 — discovery and index (do first)

**W1.1 `[web]` Make the three failing sitemaps static and edge-cached.**
Generate XML at build time; do not assemble through runtime/database work. Order:
`alternatives-sitemap.xml` first, `tools` second, `image` last.
*Accept:* all 9 child sitemaps return 200 in < 2 s, three consecutive runs, from a cold edge.

**W1.2 `[web]` Implement IndexNow.**
Key file at `/indexnow.txt`; submit on publish/update. Backfill all comparison, alternatives,
industry, pricing and integration URLs.
*Accept:* key file 200; submission returns 200/202; Bing shows URLs as submitted.

**W1.3 `[ops]` Verify Bing Webmaster Tools and close U1.**
Verify **account ownership**, not merely the presence of a meta tag. Then run the U1 inspection
and record the result in this doc.
*Accept:* U1 table filled in with real numbers.

### Wave 2 — extraction and crawl throughput

**W2.1 `[web]` Put real server-rendered content inside `<main>`.**
This is the actual extraction fix. Options in preference order: (a) render primary content
outside Suspense on marketing routes, (b) force full SSR for these routes, (c) serve
non-streamed HTML to known AI-bot UAs. (c) is last because divergent bot/user output is a
cloaking risk and (F7) shows we already have a locale divergence problem.
*Accept:* `<main>` text ≥ 2,000 chars on `/`, `/pricing`, `/compare/hubspot`,
`/features/whatsapp-crm`, `/blog` fetched as GPTBot.

**W2.2 `[web]` Fix the cacheability chain.**
Remove `cdn-cache-control: private, no-store`. Stop setting `hgcrm_geo` on cacheable documents —
move geo to an edge header or a separate non-document request. Separate caching for HTML
documents vs RSC navigation requests. **Do not blindly strip the RSC `Vary` values**; isolate
the two request classes and cache each safely.
*Accept:* `CF-Cache-Status: HIT` on a warm second request; TTFB < 500 ms at edge.

**W2.3 `[web]` Reduce HTML/RSC payload.**
Start with homepage and `/pricing`. Remove duplicated structured data (F8) and stop serialising
component state the document does not need.
*Accept:* homepage < 300 KB uncompressed.

**W2.4 `[web]` One coherent locale policy.**
`/`, `/in`, canonical and hreflang must express a single policy. Geo routing must not create a
second ambiguously-canonical product identity.
*Accept:* bots and Indian users resolve to the same canonical; hreflang validates.

### Wave 3 — this repo

**W3.1 `[mcp]` Redeploy to pick up the 2026-07-13 extraction fallback.** (F10)
*Accept:* live `fetch_page_content` on `/pricing` returns `wordCount > 1000`.
*Note:* fixes our tool only. Not a substitute for W2.1.

**W3.2 `[mcp]` Repo and package hygiene.** (F11)
Add `.env.example` (README is currently broken without it), `server.json`, `smithery.yaml`;
set GitHub `topics` and `homepage`; add `homepage`/`repository` to `package.json`; `npm publish`.
*Accept:* `npx -y mcp-bot-crawler` works from a clean machine; README steps execute verbatim.

**W3.3 `[mcp]` `[ops]` Make MCP telemetry verifiable.** (F12)
Add `debug_mode` support so DebugView works. Set `ENABLE_MCP_ANALYTICS=true`,
`GA4_MEASUREMENT_ID`, `GA4_API_SECRET` in the deployment env. Run `scripts/verify-mcp-ga4.sh`.
*Accept:* `mcp_request` and `mcp_tool_call` visible in GA4 Realtime; a 7-day count of distinct
AI `clientName` values recorded here.
*Decision gate:* **if 7-day AI-client tool calls remain at zero, stop treating MCP distribution
as an acquisition channel** and cut W3.4 entirely.

**W3.4 `[mcp]` Official MCP Registry + at most 3 directories.** (descoped from 26 — see §6)
Only after W3.2 and the W3.3 gate. Official registry, then claim the auto-indexed Glama /
PulseMCP / Smithery listings. Nothing else.

### Wave 4 — structured data and measurement

**W4.1 `[web]` Homepage schema.** Deduplicate to one `Organization`. Add one accurate
`SoftwareApplication` with visible pricing/offer data. **Do not add self-referential
`AggregateRating`.** `FAQPage` is not a strategy.

**W4.2 `[web]` Fix `llms-full.txt`.** Either make it a real maintained corpus (full page text,
not a summary) or rename/remove it. Current state is incoherent.

**W4.3 `[ops]` Rebuild the measurement baseline.** Add ~50 vertical custom prompts to Brand
Radar (or run them manually — see §6 on the addon). Track: query, country, model, cited URL,
cited domain, answer position, recommendation sentiment.

**W4.4 `[web]` Consolidate or document the two GA4 properties.** (F15)

---

## 5. Third-party corroboration — the part that actually decides the outcome

Per §1: this outranks most of §4 for the stated goal. No engineering dependency; can start today
and run in parallel.

**Tier 1 — buyer-intent review platforms**
- **G2** — CRM + industry categories; verified Indian SMB reviews that explicitly describe
  travel / real-estate / education / WhatsApp workflows.
- **Gartner Digital Markets (Capterra + GetApp + Software Advice)** — one presence propagates
  across three properties. Correct CRM and WhatsApp-CRM categorisation, India availability, INR
  context. **A profile with no reviews is worthless — the reviews are the asset.**

**Tier 2 — India-specific marketplaces** (more relevant to an Indian SMB query than any MCP
directory): **Techjockey**, **SoftwareSuggest**, **SaaSworthy**. Secondary: SourceForge,
TrustRadius, Crozdesk, AlternativeTo, SaaSHub.

**Tier 3 — Reddit** (~46.7% of Perplexity's sourced content): r/CRM, r/sales, r/smallbusiness,
r/indianstartups, r/IndiaBusiness, plus active travel-operator communities.
**Founder-seeded "has anyone tried X?" posts are transparent spam and will damage the brand.**
The mechanism is real customers describing real workflows.

**Tier 4 — travel-vertical authority** (directly targets the motivating query): **TAAI**,
**TAFI**, **IATO**, **ETTravelWorld**, **TravelBiz Monitor**, **TravTalk India**.
One named case study from a real TAAI/TAFI member beats ten more self-authored
"CRM for travel agents" landing pages.

**Tier 5 — ecosystem corroboration**
- Meta Business Partner / WhatsApp Business Platform listings **if formally eligible** — do not
  imply partnership without status. (Business verification completed 2026-06-26.)
- Integration marketplaces where the integration genuinely exists: Zapier, Make, Pabbly,
  Google Workspace Marketplace, Microsoft AppSource.
- YouTube: *independent* Indian CRM/WhatsApp-business channel reviews. Several independent
  demonstrations beat 61 self-published videos.

---

## 6. Explicitly descoped

| Descoped | Why |
|---|---|
| **26-directory MCP submission campaign** | Directory DR does not transfer when the listing page is templated, duplicated, orphaned, `nofollow` or never cited. Reduced to: official registry + claim 3 auto-indexed listings (W3.4), gated on W3.3 telemetry. |
| **Product Hunt launch chasing** | Vanity. |
| **Generic press-release syndication / bulk "top SaaS" list submissions** | Vanity. |
| **Wikipedia creation attempt** | Will fail notability and can backfire. |
| **Buying Ahrefs API units / Brand Radar addon now** (F14) | Not justified at near-zero budget. A manual 50–100 prompt benchmark is more useful than more generic vendor reporting. Revisit after U2. |
| **Adding more AI bot names to `robots.txt`** | Permission is not selection. Already sufficient. |
| **IndiaMART / Justdial listings** | Only if U2 shows them in the actual citation graph for software queries. |

---

## 7. Sequencing

```
Now, no dependencies:  §5 corroboration (Tier 1-4)   <- longest lead time, highest impact
Wave 0 (measure):      U1, U2, U3, U5
Wave 1 (index):        W1.1 -> W1.2 -> W1.3
Wave 2 (extract+perf): W2.1, W2.2 -> W2.3, W2.4
Wave 3 (this repo):    W3.1, W3.2 -> W3.3 -> [gate] -> W3.4
Wave 4 (polish):       W4.1, W4.2, W4.3, W4.4
```

§5 starts immediately and in parallel — it has the longest lead time and, per §1, decides
whether any of §4 converts into citations.

---

## 8. Reproducing the measurements

```bash
# F4 - <main> extraction (expect main-text=0)
curl -s -A "GPTBot/1.2 (+https://openai.com/gptbot)" https://hellogrowthcrm.com/pricing -o p.html
node -e "const h=require('fs').readFileSync('p.html','utf8');
const strip=s=>s.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const m=h.match(/<main[\s\S]*?<\/main>/i);
console.log('main:',m?strip(m[0]).length:'none','body:',strip(h).length)"

# F1 - failing sitemaps (expect http=000 at ~15.3s)
for s in tools alternatives image; do
  curl -s -o /dev/null -w "$s http=%{http_code} t=%{time_total}s\n" \
    --max-time 120 "https://hellogrowthcrm.com/$s-sitemap.xml"
done

# F5 - cache headers (expect CF-Cache-Status: DYNAMIC + contradictory directives)
curl -sI -A "GPTBot/1.2" https://hellogrowthcrm.com/pricing | grep -iE 'cache|set-cookie|vary'

# F10 - deployed MCP extraction (expect wordCount:0)
SID=$(curl -s -D- -o /dev/null -X POST https://mcp.hellogrowthcrm.com/mcp \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"p","version":"1"}}}' \
  | tr -d '\r' | grep -i '^mcp-session-id:' | cut -d' ' -f2)
curl -s -X POST https://mcp.hellogrowthcrm.com/mcp \
  -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -H "mcp-session-id: $SID" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"fetch_page_content","arguments":{"url":"https://hellogrowthcrm.com/pricing"}}}'

# F3 - Bing verification tag (expect no output)
curl -sL -A "Mozilla/5.0" https://hellogrowthcrm.com/ | grep -o 'msvalidate[^>]*'

# F11 - npm publication (expect 404)
curl -s -o /dev/null -w "%{http_code}\n" https://registry.npmjs.org/mcp-bot-crawler
```

---

## 9. Success criteria

| Horizon | Criterion |
|---|---|
| 2 weeks | All 9 sitemaps 200 in < 2 s. IndexNow live. BWT verified, U1 table filled. |
| 4 weeks | `<main>` ≥ 2,000 chars on the 5 key pages. `CF-Cache-Status: HIT` warm. U2 baseline recorded. |
| 8 weeks | G2 + Capterra + Techjockey profiles live with real reviews. First independent travel-vertical mention. |
| 12 weeks | Measurable movement in the U2 prompt set: cited (not merely mentioned) in ≥ 1 target vertical query. |

**The metric is citation rate on the U2 prompt set — not directory count, not tool count, not
page count.**

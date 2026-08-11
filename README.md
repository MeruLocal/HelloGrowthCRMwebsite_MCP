# mcp-bot-crawler

An MCP (Model Context Protocol) server that helps you **discover, identify, and govern every bot interacting with your website** — search engines, AI crawlers, SEO tools, social-preview fetchers, security scanners, and the long tail of suspicious scripts. Plug it into any MCP-capable client (Claude Desktop, Cursor, Claude Code, custom Agent SDK app, etc.) and ask natural-language questions about your traffic.

It is **polite by design**: it respects `robots.txt`, rate-limits its own fetches, advertises an honest User-Agent, and never tries to bypass any control.

## Features

- **Eight MCP tools** covering the full bot-governance lifecycle (scan, analyze, verify, list, generate, suggest, export) — plus 80 more, see [the full catalog](#full-mcp-tool-catalog-88-tools).
- **Curated database of 58 well-known bots** — Googlebot, Bingbot, GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot, Amazonbot, Google-Extended, Applebot-Extended, FacebookBot, LinkedInBot, AhrefsBot, SemrushBot, Bytespider, and more — each tagged with category, operator, baseline risk, and reverse-DNS verification suffixes.
- **Behavioural risk scoring**: combines UA matching, robots.txt compliance, error rate, request rate, and unique-path fan-out into a 0–100 score and a recommended action (`allow` / `monitor` / `rate-limit` / `block` / `verify-identity`).
- **Cryptographic-grade identity verification** via PTR + forward DNS (same method documented by Google, Microsoft, OpenAI).
- **robots.txt + sitemap.xml parser** with proper longest-match Allow/Disallow semantics.
- **Reports** in Markdown, JSON, and CSV.
- **TypeScript-first**, modular file layout, zero unsafe parsing.

## Repository layout

```
HelloGrowthCRMwebsite_MCP/
├─ src/
│  ├─ index.ts                # entrypoint: loads .env, starts the MCP server
│  ├─ server.ts               # wires tools into ListTools / CallTool
│  ├─ tools/                  # 36 files — one per tool group, plus:
│  │  ├─ tool-types.ts        #   defineTool() / ok() / fail() helpers
│  │  ├─ index.ts             #   the registry every tool must be added to
│  │  └─ …                    #   bot governance, page content, and the
│  │                          #   website-mirror groups (see catalog below)
│  ├─ core/                   # detection engine
│  │  ├─ bot-detector.ts
│  │  ├─ aggregator.ts
│  │  ├─ log-parser.ts
│  │  ├─ robots-parser.ts
│  │  ├─ reverse-dns.ts
│  │  └─ crawler.ts           # polite HTTP client
│  ├─ data/
│  │  ├─ known-bots.ts        # signature database (58 bots)
│  │  └─ website-mirror.ts    # read-mirror of the website source
│  ├─ lib/                    # supabase client, telemetry, client detection
│  ├─ middleware/             # MCP/SSE analytics hooks
│  ├─ reports/report-generator.ts
│  └─ utils/                  # types, logger, rate limiter
├─ crm-mcp-tools/             # standalone CRM tools (WhatsApp, calls, sequences)
├─ docs/                      # analytics, GA4 verification, release notes
│  └─ plans/                  # GEO/AEO master plan
├─ scripts/
│  ├─ verify-mcp-ga4.sh        # live GA4 telemetry check
│  ├─ geo-audit.sh             # re-derives every GEO plan finding; exit 1 on regression
│  └─ check-versions.mjs       # release gate: the 3 version strings must agree
├─ samples/
│  ├─ robots.txt
│  ├─ sitemap.xml
│  └─ sitemap-main.xml
├─ examples/usage.md
├─ server.json                # official MCP Registry manifest
├─ smithery.yaml              # Smithery configuration
├─ .env.example
├─ package.json
├─ tsconfig.json
├─ RELEASING.md               # version-bump procedure enforced by check-versions
└─ README.md
```

> There is **no `samples/access.log`** in the repo, though `DEFAULT_ACCESS_LOG`
> defaults to that path. Point `DEFAULT_ACCESS_LOG` at a real log, or pass
> `logPath` / `logText` explicitly to `analyze_access_logs` and
> `export_bot_report`. `reports/` is created on first export.

## Quick start

This is a **standalone repository** — it is no longer a subdirectory of
`hellocrmwebsite`.

```bash
git clone https://github.com/MeruLocal/HelloGrowthCRMwebsite_MCP.git
cd HelloGrowthCRMwebsite_MCP

cp .env.example .env          # already pre-configured for hellogrowthcrm.com

npm install
npm run build
```

Run it on stdio:

```bash
node dist/index.js
```

Or dev-mode (no build step, uses `tsx`):

```bash
npm run dev
```

The server speaks MCP over **stdio**. Any MCP-capable client can launch it.

### Claude Desktop / Claude Code

Add the following to your `claude_desktop_config.json` (or the equivalent `mcpServers` block in your client):

```json
{
  "mcpServers": {
    "bot-crawler": {
      "command": "node",
      "args": ["/absolute/path/to/HelloGrowthCRMwebsite_MCP/dist/index.js"],
      "env": {
        "DEFAULT_TARGET_URL": "https://hellogrowthcrm.com",
        "DEFAULT_ACCESS_LOG": "/var/log/nginx/access.log",
        "CRAWLER_USER_AGENT": "mcp-bot-crawler/1.0 (+https://hellogrowthcrm.com/bot-info)"
      }
    }
  }
}
```

### Or use the hosted server (no clone, no build)

A deployment is live at `https://mcp.hellogrowthcrm.com` — Streamable HTTP at
`/sse`. Manifest: `https://hellogrowthcrm.com/.well-known/mcp.json`.

> **Endpoint change:** the Streamable HTTP endpoint moved from `/mcp` to `/sse`,
> and the legacy SSE transport (`GET /sse` + `POST /message`) has been removed.
> Point clients at `https://mcp.hellogrowthcrm.com/sse`.

> ⚠️ **The hosted deployment can lag `main`.** Verified 2026-08-05: local `main`
> and production both exposed the same 83 tools, but `fetch_page_content` on
> `/pricing` returned `wordCount: 3194` locally and `wordCount: 0` in production
> — production is running a build that predates the 2026-07-13 extraction fix.
> **A matching tool count does not mean a matching build.** If a tool behaves
> unexpectedly against the hosted endpoint, reproduce it locally before
> filing a bug. As of 2026-08-06 `main` is at **88** tools, so a hosted server
> still reporting 83 has not picked this branch up either.

## The eight MCP tools

| Tool | What it does |
|------|--------------|
| `scan_website_bots` | Polite live scan: robots.txt + sitemap + sample pages, correlated with your access log. |
| `analyze_access_logs` | Parses Apache/Nginx Combined-format logs and returns per-bot summaries with risk scores. |
| `verify_bot_identity` | PTR + forward DNS verification of a specific `(ip, userAgent)` pair. |
| `list_allowed_bots` | Bots permitted under the current policy (default curated, or live robots.txt). |
| `list_blocked_bots` | Bots blocked under the current policy (default high-risk, or live robots.txt). |
| `generate_robots_txt` | Policy-driven robots.txt generator (block AI / SEO / scrapers / security scanners, declare sitemaps, set Crawl-delay). |
| `suggest_bot_policy` | For each bot observed in a log, recommends allow / monitor / rate-limit / block with rationale and ready-to-paste nginx snippet. |
| `export_bot_report` | Writes a Markdown / JSON / CSV report under `REPORT_OUTPUT_DIR`. |

Full payload examples live in [`examples/usage.md`](examples/usage.md).

## Full MCP tool catalog (88 tools)

Beyond the original eight bot-governance tools, this server exposes the entire
hellogrowthcrm.com website — every module, feature, product, pricing table, AI
agent, and integration — as MCP tools. Live content (blog, help, newsletter,
forms, social proof) is served from Supabase; everything else is a read-mirror
of the website source files (see [`WEBSITE_DATA_TOOLS.md`](WEBSITE_DATA_TOOLS.md)).

| Category | Tools |
|----------|-------|
| Bot governance (8) | `scan_website_bots`, `analyze_access_logs`, `verify_bot_identity`, `list_allowed_bots`, `list_blocked_bots`, `generate_robots_txt`, `suggest_bot_policy`, `export_bot_report` |
| Page content (2) | `fetch_page_content`, `crawl_pages` — fetch a live page (or walk the sitemap) and return title, meta, canonical, headings, links and readable text |
| llms.txt corpus (2) | `generate_llms_txt`, `check_llms_txt` — build an `llms-full.txt` grounding corpus from the mirror and compare it against the live file |
| GEO/AEO diagnostics (2) | `check_ai_extractability`, `validate_sitemaps` — measure `<main>` vs `<body>` readable text to catch pages that are HTTP 200 but blank to an extractor, and expand a sitemap index to catch children that time out, reset or 5xx |
| Blog (7) | `blog_list`, `blog_get`, `blog_search`, `blog_create`, `blog_update`, `blog_revalidate`, `blog_get_categories` |
| Help center (6) | `help_list_categories`, `help_list_articles`, `help_get_article`, `help_search`, `help_create_article`, `help_update_article` |
| Newsletter (4) | `newsletter_subscribe`, `newsletter_unsubscribe`, `newsletter_get_subscribers`, `newsletter_get_stats` |
| Contact forms (4) | `forms_submit`, `forms_list_submissions`, `forms_get_submission`, `forms_export_csv` |
| Static content (6) | `content_list_case_studies`, `content_list_comparisons`, `content_get_comparison`, `content_list_industries`, `content_list_tools`, `content_get_seo_rules` |
| Pricing (6) | `pricing_get_plans`, `pricing_get_addons`, `pricing_get_faq`, `pricing_compare_plans`, `pricing_get_country_plans`, `pricing_get_managed_revops` — the CRM ladder is Free → Growth → Enterprise; Managed RevOps is a flat monthly service retainer, not a per-seat tier |
| Features (3) | `features_list`, `features_get`, `features_list_products` |
| Analytics (1) | `analytics_social_proof` |
| Countries (2) | `countries_list`, `country_get` |
| Company (2) | `company_get_profile`, `company_get_contacts` |
| SEO (5) | `seo_get_site_config`, `seo_get_hreflang`, `seo_get_canonical`, `seo_get_sitemaps`, `seo_get_schema` |
| Products (2) | `products_list`, `product_get` |
| Integrations (3) | `integrations_list`, `integrations_get`, `integrations_list_categories` — 630-entry catalog, 116 categories |
| AI Agents / Agentic AI (4) | `agents_list`, `agents_get`, `agents_get_autonomy_levels`, `agents_list_comparisons` — 12 agents, autonomy matrix, 4 vs-competitor pages |
| Glossary (2) | `glossary_list_terms`, `glossary_get_term` — 58 terms |
| Templates (2) | `templates_list`, `templates_get` — 42 templates in 7 categories |
| Feature guides (2) | `guides_list`, `guides_get` — 32 guides |
| Alternatives & migration (4) | `alternatives_list`, `alternatives_get`, `switch_list_competitors`, `switch_get_guide` — 42 alternatives pages, 26 switch-from guides |
| Changelog (2) | `changelog_list_releases`, `changelog_get_release` — 6 releases |
| Site FAQs (1) | `faqs_get_site` |
| Media (2) | `media_list_videos`, `media_list_testimonials` |
| Partner program (2) | `partners_get_program`, `partners_get_application_schema` |
| Solutions (2) | `solutions_list_whatsapp_use_cases`, `solutions_get_managed_revops` — incl. 9 market variants + 25 US city pages |

All mirror tools carry `synced_at` provenance and validate inputs with zod;
unknown slugs return a clear error listing valid values.

**`synced_at` is per tool group, not global** — as of 2026-08-05 the values in
the tree range from `2026-06-11` (templates, guides) through `2026-06-17`
(integrations) to `2026-07-08` (glossary, alternatives, agents). Read the
`synced_at` in the response rather than assuming a single site-wide sync date.

Run `npm run build && node test-tools.mjs` for the catalog smoke assertions.

## How detection works

1. **User-Agent matching.** The signature database in `src/data/known-bots.ts` defines each known bot with one or more case-insensitive UA patterns. The first match wins, so more specific signatures come first (e.g. `Googlebot-Image` before generic `Googlebot`).
2. **Generic heuristics.** If no signature hits, we look for automation hints (`bot`, `crawler`, `spider`, `python-requests`, `headless`, …) and classify the source as `unknown` — flagged for verification.
3. **Behavioural enrichment.** When access logs are available, the aggregator (`src/core/aggregator.ts`) computes hit count, unique IPs, error rate, request rate, unique paths, and how many requests hit paths Disallowed in robots.txt for that UA. These signals nudge the risk score and emit human-readable notes.
4. **Identity verification.** For high-trust signatures we keep documented PTR suffixes (`.googlebot.com`, `.search.msn.com`, etc.). `verify_bot_identity` runs reverse DNS, checks the suffix, then forward-resolves to ensure the IP matches. Spoofed Googlebots show up as `spoofed`.

## Risk scoring

Baseline risk per bot lives in the signature DB (`0` = trusted search engine, `100` = hostile scraper). The aggregator adds bonuses for:

- Bot ignoring robots.txt (+20)
- Very high request rate (>1000 req/hr, +25; >300 req/hr, +10)
- Error rate >50% — probing behaviour (+15)
- Touching >5000 unique paths (+10)

The recommended action is derived from the final score plus the category:

- `search`/`social` ≤ 25 → **allow**
- `ai` ≤ 40 → **monitor**
- Score ≥ 70 → **block**
- Score ≥ 45 → **rate-limit**
- `unknown` → **verify-identity**

Tune these thresholds in `src/core/bot-detector.ts` if your environment is more or less permissive.

## Security & politeness

- **Respects robots.txt** for outbound fetches. `scan_website_bots` will not retrieve paths Disallowed for its own UA.
- **Per-host rate limiter** (`CRAWL_DELAY_MS`, default 1 s).
- **Hard cap on sitemap pages** (`MAX_SITEMAP_PAGES`, default 25).
- **HTTP timeout** (`HTTP_TIMEOUT_MS`, default 10 s).
- **No content storage**: only URL + HTTP status is recorded from sampled fetches.
- **Honest User-Agent** with a contact URL — change it via `CRAWLER_USER_AGENT`.
- **stdout reserved for MCP**: all logs go to stderr.

The tools never attempt to bypass authentication, CAPTCHAs, paywalls, WAFs, or any other access control. They also never accept arbitrary code from inputs.

## Configuration

All knobs live in `.env` (see [`.env.example`](.env.example)):

| Variable | Default | Purpose |
|----------|---------|---------|
| `DEFAULT_ACCESS_LOG` | `./samples/access.log` | Fallback log path. **This file is not in the repo** — set it to a real log. |
| `DEFAULT_TARGET_URL` | `https://example.com` | Fallback site for scans. |
| `MAX_SITEMAP_PAGES` | `25` | Hard cap per scan. |
| `CRAWL_DELAY_MS` | `1000` | Per-host delay. |
| `HTTP_TIMEOUT_MS` | `10000` | Per-request timeout. |
| `CRAWLER_USER_AGENT` | `mcp-bot-crawler/1.0 (+...)` | Outbound UA. |
| `REPORT_OUTPUT_DIR` | `./reports` | Where exports land. |
| `LOG_LEVEL` | `info` | `error` / `warn` / `info` / `debug`. |
| `ENABLE_MCP_ANALYTICS` | `false` | Master switch for MCP/SSE analytics — must be `true` to send. |
| `GA4_MEASUREMENT_ID` | — | GA4 stream id for MCP/SSE analytics (optional). |
| `GA4_API_SECRET` | — | GA4 Measurement Protocol API secret (optional). |

Privacy-first MCP/SSE usage analytics (connections, requests, tools, bots) are
emitted to GA4 **only when `ENABLE_MCP_ANALYTICS=true` and the `GA4_*` vars are
set** — and silently no-op otherwise. No raw IP, User-Agent, request body, or
tool arguments are ever tracked. See [`docs/MCP_ANALYTICS.md`](docs/MCP_ANALYTICS.md).

## Extending

Add a new bot:

```ts
// src/data/known-bots.ts
{
  name: "MyCorpBot",
  category: "search",
  operator: "MyCorp",
  userAgentPatterns: [/MyCorpBot/i],
  verifiedHostnameSuffixes: [".mycorp.com"],
  respectsRobotsTxt: true,
  baselineRisk: 10,
  description: "MyCorp search index crawler.",
}
```

Add a new tool:

1. Create `src/tools/<name>.ts` exporting `{ definition, schema, handle }`.
2. Drop it into the `tools` array in `src/tools/index.ts`.

Everything else (registration, schema validation, error handling) is automatic.

## Development

```bash
npm run dev          # run with tsx, no build needed
npm run typecheck    # strict TS check
npm run build        # compile to dist/
npm test             # vitest — 149 tests across 10 files
npm run test:watch   # vitest in watch mode
npm run test:coverage
```

Tests live in `__tests__/` directories next to the code they cover
(`src/core/__tests__`, `src/tools/__tests__`, `src/lib/__tests__`,
`src/middleware/__tests__`, `src/data/__tests__`).

## License

MIT — see [`LICENSE`](LICENSE).

## Disclaimer

This project helps you observe and govern bots interacting with **your own** website. Do not use it to crawl, scrape, or analyze third-party sites without permission. Always respect `robots.txt`, terms of service, and applicable law.

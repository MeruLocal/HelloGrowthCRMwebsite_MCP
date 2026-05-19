# mcp-bot-crawler

An MCP (Model Context Protocol) server that helps you **discover, identify, and govern every bot interacting with your website** — search engines, AI crawlers, SEO tools, social-preview fetchers, security scanners, and the long tail of suspicious scripts. Plug it into any MCP-capable client (Claude Desktop, Cursor, Claude Code, custom Agent SDK app, etc.) and ask natural-language questions about your traffic.

It is **polite by design**: it respects `robots.txt`, rate-limits its own fetches, advertises an honest User-Agent, and never tries to bypass any control.

## Features

- **Eight MCP tools** covering the full bot-governance lifecycle (scan, analyze, verify, list, generate, suggest, export).
- **Curated database of 55+ well-known bots** — Googlebot, Bingbot, GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot, Amazonbot, Google-Extended, Applebot-Extended, FacebookBot, LinkedInBot, AhrefsBot, SemrushBot, Bytespider, and more — each tagged with category, operator, baseline risk, and reverse-DNS verification suffixes.
- **Behavioural risk scoring**: combines UA matching, robots.txt compliance, error rate, request rate, and unique-path fan-out into a 0–100 score and a recommended action (`allow` / `monitor` / `rate-limit` / `block` / `verify-identity`).
- **Cryptographic-grade identity verification** via PTR + forward DNS (same method documented by Google, Microsoft, OpenAI).
- **robots.txt + sitemap.xml parser** with proper longest-match Allow/Disallow semantics.
- **Reports** in Markdown, JSON, and CSV.
- **TypeScript-first**, modular file layout, zero unsafe parsing.

## Repository layout

```
mcp-bot-crawler/
├─ src/
│  ├─ index.ts                # entrypoint: loads .env, starts the MCP server
│  ├─ server.ts               # wires tools into ListTools / CallTool
│  ├─ tools/                  # one file per MCP tool
│  │  ├─ scan-website-bots.ts
│  │  ├─ analyze-access-logs.ts
│  │  ├─ verify-bot-identity.ts
│  │  ├─ list-allowed-bots.ts
│  │  ├─ list-blocked-bots.ts
│  │  ├─ generate-robots-txt.ts
│  │  ├─ suggest-bot-policy.ts
│  │  ├─ export-bot-report.ts
│  │  ├─ tool-types.ts
│  │  └─ index.ts
│  ├─ core/                   # detection engine
│  │  ├─ bot-detector.ts
│  │  ├─ aggregator.ts
│  │  ├─ log-parser.ts
│  │  ├─ robots-parser.ts
│  │  ├─ reverse-dns.ts
│  │  └─ crawler.ts           # polite HTTP client
│  ├─ data/known-bots.ts      # signature database
│  ├─ reports/report-generator.ts
│  └─ utils/                  # types, logger, rate limiter
├─ samples/
│  ├─ access.log              # realistic mixed-bot traffic
│  ├─ robots.txt
│  └─ sitemap.xml
├─ examples/usage.md
├─ reports/                   # generated reports land here
├─ .env.example
├─ package.json
├─ tsconfig.json
└─ README.md
```

## Quick start

```bash
# From the hellocrmwebsite repo root:
cd mcp-bot-crawler

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
      "args": ["/absolute/path/to/hellocrmwebsite/mcp-bot-crawler/dist/index.js"],
      "env": {
        "DEFAULT_TARGET_URL": "https://hellogrowthcrm.com",
        "DEFAULT_ACCESS_LOG": "/var/log/nginx/access.log",
        "CRAWLER_USER_AGENT": "mcp-bot-crawler/1.0 (+https://hellogrowthcrm.com/bot-info)"
      }
    }
  }
}
```

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
| `DEFAULT_ACCESS_LOG` | `./samples/access.log` | Fallback log path. |
| `DEFAULT_TARGET_URL` | `https://example.com` | Fallback site for scans. |
| `MAX_SITEMAP_PAGES` | `25` | Hard cap per scan. |
| `CRAWL_DELAY_MS` | `1000` | Per-host delay. |
| `HTTP_TIMEOUT_MS` | `10000` | Per-request timeout. |
| `CRAWLER_USER_AGENT` | `mcp-bot-crawler/1.0 (+...)` | Outbound UA. |
| `REPORT_OUTPUT_DIR` | `./reports` | Where exports land. |
| `LOG_LEVEL` | `info` | `error` / `warn` / `info` / `debug`. |

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
npm test             # (add your own tests under src/__tests__/)
```

## License

MIT — see [`LICENSE`](LICENSE).

## Disclaimer

This project helps you observe and govern bots interacting with **your own** website. Do not use it to crawl, scrape, or analyze third-party sites without permission. Always respect `robots.txt`, terms of service, and applicable law.

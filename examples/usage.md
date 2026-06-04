# Example tool calls

Every example shows the JSON-RPC `params.arguments` payload you'd send to the
MCP server's `tools/call` method. Names match `tools/list`.

## 1. `analyze_access_logs`

```json
{
  "name": "analyze_access_logs",
  "arguments": {
    "logPath": "./samples/access.log",
    "topN": 25
  }
}
```

Returns: per-bot summary with hits, unique IPs, error rate, risk score, and
recommended action. Try it after dropping a real `access.log` from your web
server into the path.

## 2. `scan_website_bots`

```json
{
  "name": "scan_website_bots",
  "arguments": {
    "targetUrl": "https://example.com",
    "sampleSize": 10,
    "logPath": "./samples/access.log"
  }
}
```

Politely fetches `/robots.txt` and `sitemap.xml`, samples up to `sampleSize`
URLs (capped by `MAX_SITEMAP_PAGES`), and correlates with the supplied access
log. Will never fetch a path Disallowed for our own UA.

## 3. `verify_bot_identity`

```json
{
  "name": "verify_bot_identity",
  "arguments": {
    "ip": "66.249.66.1",
    "userAgent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
  }
}
```

Performs PTR-then-forward DNS verification. Returns `verified` only when the
PTR ends in a documented suffix (e.g. `.googlebot.com`) **and** the forward
resolution of that hostname includes the original IP.

## 4. `list_allowed_bots` / `list_blocked_bots`

```json
{ "name": "list_allowed_bots", "arguments": { "category": "search" } }
```

```json
{ "name": "list_blocked_bots", "arguments": { "minRisk": 50 } }
```

Pass `robotsTxtPath` to switch from the curated default policy to whatever
your live robots.txt currently enforces.

## 5. `generate_robots_txt`

```json
{
  "name": "generate_robots_txt",
  "arguments": {
    "siteUrl": "https://example.com",
    "blockAi": true,
    "blockSeo": false,
    "blockScrapers": true,
    "blockSecurityScanners": true,
    "extraDisallowPaths": ["/admin", "/api/internal"],
    "crawlDelaySeconds": 5,
    "sitemapUrls": ["https://example.com/sitemap.xml"]
  }
}
```

Returns a ready-to-paste robots.txt body. Remember: robots.txt is advisory.
Bots that ignore it must be blocked at the firewall / CDN layer — see
`suggest_bot_policy` for matching nginx rules.

## 6. `suggest_bot_policy`

```json
{
  "name": "suggest_bot_policy",
  "arguments": { "logPath": "./samples/access.log" }
}
```

For each bot observed in the log, returns a recommended action (`allow`,
`monitor`, `rate-limit`, `block`, `verify-identity`) with rationale plus
optional robots.txt / nginx snippets.

## 7. `export_bot_report`

```json
{
  "name": "export_bot_report",
  "arguments": {
    "logPath": "./samples/access.log",
    "format": "markdown",
    "saveToDisk": true,
    "filename": "bot-report-may-2026.md"
  }
}
```

Generates a polished report and (by default) saves it under
`REPORT_OUTPUT_DIR`. Switch `format` to `csv` or `json` for spreadsheets or
downstream tooling.

## Local sanity check

```bash
npm install
npm run build
node dist/index.js     # speaks MCP over stdio — wire it into your client
```

Or run in dev mode without compiling:

```bash
npm run dev
```

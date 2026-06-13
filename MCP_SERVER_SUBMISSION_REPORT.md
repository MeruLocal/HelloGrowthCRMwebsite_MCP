# MCP Server Submission Report — `mcp-bot-crawler`

**Goal:** Get the `mcp-bot-crawler` MCP server listed on every high‑authority MCP
directory, registry, and community surface — prioritised by **Domain Rating (DR)**
so each listing also returns a strong backlink to `hellogrowthcrm.com`.

| Field | Value |
|-------|-------|
| Server name | `mcp-bot-crawler` |
| What it is | MCP server that discovers, identifies & governs every bot (search engines, AI crawlers, SEO tools, scrapers) hitting your website |
| Tools | 81 total (8 bot‑governance + 73 hellogrowthcrm.com content/data tools) |
| Transport | stdio + Streamable HTTP |
| License | MIT |
| Language | TypeScript (Node ≥ 18.18) |
| Backlink target | `https://hellogrowthcrm.com` |
| Report date | 2026‑06‑12 |
| DR source | Ahrefs Domain Rating (live, free API), today |

> **DR = Ahrefs Domain Rating (0–100), the industry "domain authority" metric.**
> All values below are **live, pulled today** — not estimates.

---

## 1. Prerequisites before you submit anywhere

Most directories ingest from a **public GitHub repo** and/or a **published npm package**.
Lock these down first or half the listings will be rejected/auto‑skipped:

- [ ] **Public GitHub repo** with a clear `README.md` (✅ you have this), `LICENSE` (MIT), and topics: `mcp`, `model-context-protocol`, `bot-detection`, `ai-crawlers`, `seo`.
- [ ] **Publish to npm** (`npm publish`) — `package.json` is ready (`bin: mcp-bot-crawler`). This unlocks Smithery, Glama, mcp-get, PulseMCP auto‑indexing.
- [ ] **`server.json`** manifest at repo root (official registry schema) — required for the canonical `registry.modelcontextprotocol.io`.
- [ ] **Homepage link** in `package.json` + repo "About" → point to `https://hellogrowthcrm.com/...` so the backlink is captured.
- [ ] **One 16:9 screenshot / logo** (PNG) — needed for Product Hunt, mcp.so, MCP Market cards.

---

## 2. Master submission table (sorted by Domain Rating, highest first)

### 🟢 Tier 1 — DR 90+ (submit to ALL of these first)

| # | Site | DR | Type | How to submit | Effort | Backlink |
|---|------|----|------|---------------|--------|----------|
| 1 | **github.com** | **97** | Source + awesome lists | Push repo public; PR into `modelcontextprotocol/servers` (community list) + `punkpeye/awesome-mcp-servers` | Low | Dofollow (repo + README) |
| 2 | **reddit.com** | **95** | Community | Post in r/mcp, r/modelcontextprotocol, r/ClaudeAI | Low | Nofollow (still traffic) |
| 3 | **medium.com** | **94** | Article | "How we built an MCP bot‑governance server" launch post | Med | Nofollow |
| 4 | **npmjs.com** | **92** | Package registry | `npm publish` | Low | Dofollow (homepage field) |
| 5 | **producthunt.com** | **91** | Launch | Submit as a launch w/ screenshots + tagline | Med | Dofollow (after approval) |
| 6 | **news.ycombinator.com** | **91** | Community | "Show HN: mcp-bot-crawler" | Low | Nofollow (high traffic) |
| 7 | **modelcontextprotocol.io** | **90** | Official registry | Add `server.json`, submit to official MCP Registry | Med | Dofollow |
| 8 | **dev.to** | **90** | Article | Cross‑post the launch article w/ canonical | Low | Nofollow |

### 🟡 Tier 2 — DR 70–89 (the core MCP directory ecosystem)

| # | Site | DR | Type | How to submit | Effort | Backlink |
|---|------|----|------|---------------|--------|----------|
| 9 | **pipedream.com** | **83** | MCP/app registry | Submit MCP app via Pipedream MCP directory | Med | Dofollow |
| 10 | **hashnode.com** | **83** | Article | Cross‑post launch article | Low | Nofollow |
| 11 | **apify.com** | **80** | Actor/MCP store | Publish as Actor or list MCP server | Med | Dofollow |
| 12 | **smithery.ai** | **75** | MCP registry (major) | Auto‑indexes from GitHub; add `smithery.yaml` to claim/configure | Low | Dofollow |
| 13 | **composio.dev** | **74** | MCP/tools registry | Submit server via Composio MCP directory | Med | Dofollow |
| 14 | **lobehub.com** | **74** | MCP marketplace | Submit via LobeHub MCP plugin/marketplace form | Med | Dofollow |
| 15 | **glama.ai** | **72** | MCP registry (major) | Auto‑indexes public GitHub MCP repos; claim listing | Low | Dofollow |
| 16 | **mcp.so** | **72** | MCP directory (largest) | Submit at mcp.so/submit | Low | Dofollow |
| 17 | **portkey.ai** | **72** | MCP directory | Submit to Portkey MCP list (GitHub PR) | Low | Dofollow |
| 18 | **pulsemcp.com** | **70** | MCP directory + newsletter | Auto‑indexes; use "submit/update" form to claim | Low | Dofollow |

### 🟠 Tier 3 — DR 50–69 (still worth it, niche MCP catalogs)

| # | Site | DR | Type | How to submit | Effort | Backlink |
|---|------|----|------|---------------|--------|----------|
| 19 | **cursor.directory** | **69** | MCP + rules directory | Submit MCP at cursor.directory/mcp | Low | Dofollow |
| 20 | **mcpservers.org** | **67** | Curated GitHub list | PR into the repo behind the site | Low | Dofollow |
| 21 | **mcpmarket.com** | **54** | MCP marketplace | Submit form | Low | Dofollow |
| 22 | **opentools.com** | **54** | MCP/tools registry | Submit server | Low | Dofollow |
| 23 | **mcp.run** | **52** | MCP servlet registry | Package as servlet / submit | Med | Dofollow |

### ⚪ Tier 4 — DR < 50 (optional; low authority — do last or skip)

| # | Site | DR | Notes |
|---|------|----|-------|
| 24 | **mcp-get.com** | **32** | CLI installer registry — good for discoverability, weak backlink |
| 25 | **mcphub.io** | **18** | Low DR; submit only if zero effort |
| 26 | **mcpindex.net** | **6** | Very low DR; skip unless auto‑listing |

---

## 3. DR distribution at a glance

```
github.com           97 ████████████████████  DR 97
reddit.com           95 ███████████████████
medium.com           94 ███████████████████
npmjs.com            92 ██████████████████
producthunt.com      91 ██████████████████
news.ycombinator.com 91 ██████████████████
modelcontextprotocol 90 ██████████████████
dev.to               90 ██████████████████
pipedream.com        83 ████████████████
hashnode.com         83 ████████████████
apify.com            80 ████████████████
smithery.ai          75 ███████████████
composio.dev         74 ██████████████
lobehub.com          74 ██████████████
glama.ai             72 ██████████████
mcp.so               72 ██████████████
portkey.ai           72 ██████████████
pulsemcp.com         70 ██████████████
cursor.directory     69 █████████████
mcpservers.org       67 █████████████
mcpmarket.com        54 ███████████
opentools.com        54 ███████████
mcp.run              52 ██████████
mcp-get.com          32 ██████
mcphub.io            18 ███
mcpindex.net          6 █
```

**18 of 26 targets are DR 70+. 8 are DR 90+.** Hitting just Tiers 1–2 gives you
18 high‑authority listings, the great majority being **dofollow** backlinks.

---

## 4. Ready‑to‑paste listing copy

**Name:** `mcp-bot-crawler`

**Tagline (≤60 chars):** Discover, identify & govern every bot hitting your site

**Short description (≤160 chars):**
> An MCP server that discovers, identifies, and governs every bot — search engines, AI crawlers, SEO tools, and scrapers — interacting with your website.

**Long description:**
> mcp-bot-crawler is a polite-by-design MCP (Model Context Protocol) server for bot governance. It scans robots.txt + sitemaps, parses Apache/Nginx access logs, scores each bot 0–100 on behaviour, and cryptographically verifies bot identity via reverse + forward DNS (the same method Google, Microsoft, and OpenAI document). It ships a curated database of 55+ known bots (Googlebot, GPTBot, ClaudeBot, PerplexityBot, Bytespider, AhrefsBot, and more), generates policy-driven robots.txt, and exports Markdown/JSON/CSV reports. Works with Claude Desktop, Claude Code, Cursor, and any MCP client over stdio or Streamable HTTP.

**Categories/tags:** `bot-detection` · `security` · `seo` · `ai-crawlers` · `web` · `analytics` · `robots.txt`

**Homepage:** `https://hellogrowthcrm.com`
**Repo:** `https://github.com/<your-org>/HelloGrowthCRMwebsite_MCP`
**License:** MIT

**Install (npm):**
```bash
npx -y mcp-bot-crawler
```

**Claude Desktop config:**
```json
{
  "mcpServers": {
    "bot-crawler": {
      "command": "npx",
      "args": ["-y", "mcp-bot-crawler"],
      "env": { "DEFAULT_TARGET_URL": "https://hellogrowthcrm.com" }
    }
  }
}
```

---

## 5. Prioritised action plan

**Week 1 — foundation (unlocks everything else)**
1. Make the GitHub repo public; add topics + homepage link.
2. `npm publish` the package.
3. Add `server.json` (official schema) and a screenshot/logo.

**Week 2 — Tier 1 + auto‑indexers**
4. PR into `modelcontextprotocol/servers` + `awesome-mcp-servers` (GitHub, DR 97).
5. Submit to official MCP Registry (modelcontextprotocol.io, DR 90).
6. Claim listings on Smithery, Glama, PulseMCP (they auto‑index from GitHub once public).
7. Submit mcp.so, Portkey, Composio, LobeHub forms.

**Week 3 — launch surfaces**
8. Product Hunt launch (DR 91) with screenshots.
9. "Show HN" (DR 91) + Reddit r/mcp (DR 95).
10. Publish launch article on Medium (DR 94) → cross‑post Dev.to + Hashnode (canonical back to your blog).

**Week 4 — long tail**
11. cursor.directory, mcpservers.org, mcpmarket.com, opentools.com, mcp.run, apify.com, pipedream.com.
12. Optional Tier 4 (mcp-get, mcphub, mcpindex) only if low‑effort.

---

## 6. Submission tracker (fill as you go)

| Site | DR | Submitted | URL | Status | Live link |
|------|----|-----------|-----|--------|-----------|
| github.com (servers list) | 97 | ☐ | | | |
| reddit.com (r/mcp) | 95 | ☐ | | | |
| medium.com | 94 | ☐ | | | |
| npmjs.com | 92 | ☐ | | | |
| producthunt.com | 91 | ☐ | | | |
| news.ycombinator.com | 91 | ☐ | | | |
| modelcontextprotocol.io | 90 | ☐ | | | |
| dev.to | 90 | ☐ | | | |
| pipedream.com | 83 | ☐ | | | |
| hashnode.com | 83 | ☐ | | | |
| apify.com | 80 | ☐ | | | |
| smithery.ai | 75 | ☐ | | | |
| composio.dev | 74 | ☐ | | | |
| lobehub.com | 74 | ☐ | | | |
| glama.ai | 72 | ☐ | | | |
| mcp.so | 72 | ☐ | | | |
| portkey.ai | 72 | ☐ | | | |
| pulsemcp.com | 70 | ☐ | | | |
| cursor.directory | 69 | ☐ | | | |
| mcpservers.org | 67 | ☐ | | | |
| mcpmarket.com | 54 | ☐ | | | |
| opentools.com | 54 | ☐ | | | |
| mcp.run | 52 | ☐ | | | |
| mcp-get.com | 32 | ☐ | | | |
| mcphub.io | 18 | ☐ | | | |
| mcpindex.net | 6 | ☐ | | | |

---

### Notes
- **DR is live** (Ahrefs, 2026‑06‑12). Re‑check before a campaign — directory DR climbs fast.
- "Dofollow/Nofollow" indicates SEO link value; nofollow sites (Reddit, HN, Medium, Dev.to) still drive **referral traffic and discovery**, so keep them.
- The biggest SEO wins are the **auto‑indexers** (Smithery, Glama, PulseMCP) and **GitHub awesome lists** — one public repo + npm publish cascades into most of Tier 2 automatically.

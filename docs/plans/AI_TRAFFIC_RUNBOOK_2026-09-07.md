# AI Traffic Runbook — measurement, baselines, and what this repo owns

**Date:** 2026-09-07 · **Companion:** website action plan hellocrmwebsite PR #1424 · full advisory https://claude.ai/code/artifact/07a9a163-bb43-409b-92c2-b2ab898f8212

## Baselines (measured 9/5–9/7)

- **Referrals (MS Clarity, 3d):** google/cpc 566 · google/organic 127 · **chatgpt.com 14** · bing 4 · Perplexity/Copilot/Gemini/Grok/DeepSeek 0. Published context: ChatGPT = 75–87% of ALL AI referrals; Copilot's documented ratio is **104 citations : 1 click**; Gemini app traffic strips the referrer (shows as Direct); Grok/DeepSeek send ~nothing to B2B. **Zeros over 3 days are Poisson-normal.**
- **Citations (10-prompt audit, this repo's script):** unbranded presence **1/9 Gemini · 0/9 Grok · 0/2 Copilot spot**; branded healthy everywhere via G2/Capterra/SoftwareAdvice/GetApp. All engines cited the web 10/10 → the cause is absence from the source set, not platform mechanics.

## What THIS repo owns

### 1. Enable MCP telemetry (deployer, ~5 min) — currently DARK
The server ships privacy-first GA4 telemetry (`docs/MCP_ANALYTICS.md`) that silently no-ops today. On the production host set:
```
ENABLE_MCP_ANALYTICS=true
GA4_MEASUREMENT_ID=<GA4 web stream id>
GA4_API_SECRET=<GA4 Admin → Data Streams → Measurement Protocol API secret>
```
Then run `scripts/verify-mcp-ga4.sh` and watch GA4 Realtime. Until this is set, "how many agents use our MCP" is unanswerable. Follow-up: the Supabase sink (PR #27 plan / issue #39 item 1.4) for queryable history.

### 2. Monthly citation audit — `node scripts/ai-citation-audit.mjs`
New in this PR. Needs `GEMINI_API_KEY` + `XAI_API_KEY` in the environment. Edits go in `scripts/ai-citation-queries.json`. Covers Gemini (grounded) + Grok (Agent Tools web_search — the old `search_parameters` API is deprecated); Copilot = manual spot-check at `bing.com/copilotsearch?q=…` (answer renders in shadow DOM, read visually); Perplexity/DeepSeek = manual logged-in pass. Exit 1 only on all-errors (API breakage), not on zero citations — zero is a data point. **Success metric: unbranded presence rising month over month; commit each dated results JSON.**

### 3. Cadence
An automated weekly task (founder's machine) already runs the wire audit + Clarity AI-referral pull every Monday 09:05 IST against these baselines. The monthly citation audit is manual until someone wires it to CI (needs both API keys as secrets — do NOT commit keys).

## What this repo does NOT own (don't duplicate)

Website content/freshness/homepage work → hellocrmwebsite PR #1424 workstream A. Listicles/G2/Reddit → workstream B (marketing). GA4 channel-group config → analytics admin. Signup attribution field → hellocrm repo.

## Standing rules

Never call the 4 personal-data MCP tools in any audit. Never publish invented statistics to chase citations. Treat single-run zeros as noise; three consecutive runs make a trend.

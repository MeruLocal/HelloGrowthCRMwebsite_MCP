---
name: mcp-server-audit
description: >-
  Audit an MCP server end to end — protocol conformance, tool-schema and
  annotation hygiene, session and error handling, discovery surfaces, write-tool
  safety, and whether the CONTENT it serves is actually true. Use this whenever
  someone asks to "audit the MCP", "check mcp.hellogrowthcrm.com", "is our MCP
  server compliant / secure / discoverable", when an external report about the
  MCP server arrives and needs fact-checking, or before publishing to any MCP
  registry. Runs with zero downloads by default.
---

# Auditing an MCP server

## Start here — do not reach for a scanner first

```bash
node scripts/audit-live-mcp.mjs                      # production
node scripts/audit-live-mcp.mjs http://localhost:3001
```

Zero dependencies, node built-ins only, installs nothing. Exit 1 on any FAIL.
It covers the machine-checkable half of what the popular third-party scanners
check (§4). **Everything it prints is measured, never inferred** — that matters,
because the most common failure in MCP auditing is a confident report about a
server nobody actually connected to.

Baseline for `mcp.hellogrowthcrm.com` on 2026-08-31: **2 fail · 5 warn · 12 pass**.
A new FAIL is a regression. Record the run in the audit report.

---

## 1. The checks a script cannot do — always do these by hand

The wire protocol can be perfect while the server confidently serves false
information. This is where the real defects were found:

- **Are the numbers true?** Call `features_list`, `integrations_list`,
  `content_list_industries`, `pricing_get_plans` and reconcile each against the
  codebase. On 2026-08-31 the server reported **630 integrations against 525 in
  the code**, and a feature list of 58 against 232 screens / 135 catalogue
  entries / 99 public-catalog features. Nothing regenerates the mirror from the
  source of truth, so it drifts silently.
- **Do the URLs resolve?** `curl -o /dev/null -w "%{http_code}"` every URL the
  server emits. A `sameAs` entry published as an entity signal was returning
  **404** while a second field in the same payload held a working one.
- **Are pricing / compliance / residency claims sourced?** These end up quoted
  verbatim by AI assistants. Check against the canonical source, not against a
  draft someone pasted. Real values live in `pricing_get_plans` and
  `countries_list`.
- **Is the freshness stamp moving?** Payloads carry `synced_at`. A stamp weeks
  old with no regeneration job is the same silent-rot failure as any generated
  file.

## 2. Traps specific to this server

- **The endpoint is named `/sse` but speaks Streamable HTTP.** `GET /sse` returns
  `400 Invalid or missing session ID` — correct behaviour, not a fault. The
  official Inspector fails against it with `SSE error: Non-200 status code (400)`
  unless you pass `--transport http`. Every external audit so far has misread
  this as an outage.
- **`/openapi.json` and `/version` return 200, not 403.** Four separate AI audits
  claimed 403 and prescribed WAF/CORS fixes. Measure before believing.
- **JSON-RPC errors come back at HTTP 200.** Any wrapper deriving success from
  the status code records every failed tool call as a success.
- **A failed Supabase count returns `{count: null, error}`.** `count ?? 0` turns
  a broken query into a confident zero, which an AI client will repeat verbatim.
  Grep for `?? 0` and `?? []` over query results.
- **Never turn a free-text error into an error code.** Lowercasing and stripping
  punctuation passes a code-shaped regex while carrying PII intact.
- **There are TWO MCP servers.** The CRM MCP (`hellocrm`, Deno edge function,
  API-key scoped) and this website MCP (Node, public, anonymous). Every arriving
  spec conflates them. State which one you are auditing in the first line of the
  report.
- **`robots.txt` is per-origin.** `hellogrowthcrm.com/robots.txt` has never
  governed `mcp.hellogrowthcrm.com`.

## 3. Fact-checking an external report

Externally produced MCP audits have a poor hit rate here — four were checked,
all were wrong in overlapping ways. Before acting on any of them:

1. **Check every identifier it names exists.** All five tools one report audited
   were invented (`get_pricing`, `search_features`, `compare_competitor`,
   `get_crawler_policy`, `capture_inbound_lead`). The real names are
   `pricing_get_plans`, `features_list`, `content_get_comparison`,
   `list_allowed_bots`.
2. **Check the passes as hard as the failures.** One scorecard marked annotations
   *missing* (all 88 tools have them) and `listChanged` *pass* (not declared) —
   wrong in both directions.
3. **Check the advice targets this transport.** Guidance mentioning
   `event: endpoint`, `/message?sessionId=`, or an NGINX `location /message`
   block is for the legacy transport. Implementing it is a regression.
4. **Treat every number as fabricated until sourced.** A drafted `llms.txt`
   invented a four-currency pricing table, inflating the real India price ~3.3×,
   and claimed data residency in three regions the product does not use.
5. **Agreement between AI tools is propagation, not corroboration.**

## 4. Third-party tooling — coverage map and risk posture

**Do not `npx` an unpinned scanner against production.** Fetching an arbitrary
package and letting it run is the supply-chain exposure the audit is meant to
find. If you use one: read the source, pin the version, run it in a container,
and never give it credentials — this server has none to give.

Verified to exist on GitHub, 2026-08-31 (`Janix-ai/mcp-validator`, cited in one
external report, returns **404 — it does not exist**):

| Tool | Covers | Our equivalent |
|---|---|---|
| `modelcontextprotocol/inspector` | interactive + CLI protocol client, `--strict` schema report, exit 6 on error-severity | §0 script covers the CLI assertions. **Worth running** for interactive debugging — see below |
| `modelcontextprotocol/conformance` | official wire-schema conformance harness | not replicated; the closest thing to an authority. Run it before any registry submission |
| `cisco-ai-defense/mcp-scanner` | YARA / LLM / cloud threat analysis, scans a remote URL, Apache-2.0. YARA engine is fully local | §0 covers schema + annotation + write-surface checks; the YARA engine adds tool-poisoning patterns we do not detect |
| `snyk/agent-scan` | MCP servers, tools, prompts, resources, agent skills | overlaps §0; adds config-file discovery we do not need (this server has no client config) |
| `ModelContextProtocol-Security/mcpserver-audit` | CSA-backed "is this server safe to use" checklist + findings DB | useful as a checklist to diff against §1–§2 |
| `RHEcosystemAppEng/mcp-validation` | enterprise readiness, rate handling, parameter strictness | not replicated |
| `Accenture/mcp-bench`, `mcp-tool-bench/MCPToolBenchPP` | whether LLMs actually pick your tools from fuzzy instructions | not replicated, and the honest answer to "do our descriptions work" |

The one third-party command worth running, because it is first-party and the
invocation is now known-good:

```bash
npx @modelcontextprotocol/inspector --cli https://mcp.hellogrowthcrm.com/sse \
  --transport http --method tools/list
```

Without `--transport http` it fails misleadingly (see §2).

## 5. Registry readiness

Check before claiming the server is distributable:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://registry.npmjs.org/mcp-bot-crawler
```

On 2026-08-31 this returned **404 — the package is not published**, which by the
repo's own `MCP_SERVER_SUBMISSION_REPORT.md` is what gates Smithery / Glama /
mcp-get / PulseMCP auto-indexing. Also confirm `scripts/check-versions.mjs`
passes (package.json / server.json / packages[0].version parity) and that
`/.well-known/mcp.json` is served.

## 6. Report format

Lead with which of the two servers was audited and the commit or version it was
measured at. Then: FAILs with the command and output that prove each, WARNs,
what you checked and found clean, and — explicitly — **what you did not check**.
Silence reads as a pass.

One PR per finding. Never bundle.

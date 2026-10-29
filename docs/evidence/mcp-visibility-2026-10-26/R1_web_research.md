# R1 - Web research: how an MCP server is discovered and chosen (as of 2026-10-26)

Scope: advise HelloGrowthCRM (HGC) on the public, no-auth, read-only product-knowledge MCP server at https://mcp.hellogrowthcrm.com/mcp.
Method: WebSearch + WebFetch only (no Firecrawl). Every claim carries a source id [S#] from the table at the end. "unverified" = I could not confirm it from a primary page. Facts that came only from a search-result summary or a third-party blog are labelled "secondary".
Current stable MCP spec revision seen: 2026-07-28 [S1].

---

## 0. Headline findings

1. Only a directory listing makes a connector discoverable inside Claude. Anthropic states that listings in the open MCP Registry "don't" surface a server in Claude, and that only directory connectors are eligible for in-chat "Suggested Connectors"; custom connectors are never suggested [S2]. The official MCP Registry is a metadata feed for aggregators, still in preview, and is explicitly "not intended to be directly consumed by host applications" [S3].
2. A public, no-auth, read-only server is explicitly allowed by Claude's directory ("no authentication for public data") [S4] and by ChatGPT's submission portal (no-auth is supported) [S5]. The risks are policy ones, not technical: ChatGPT guidelines say "Trial or demo plugins will not be accepted", forbid advertising, and ban fields that "manipulate how the model picks among plugins" [S6]; Claude review rejects tool descriptions that "promote products and services" [S7]. A brand-knowledge server must therefore be framed as factual reference, not marketing.
3. Tool choice is driven by tool name, description and argument text (what tool search indexes), plus server `instructions`, and degrades with tool count. Anthropic says selection "degrades once you exceed 30-50 available tools" [S8]. HGC's own `/.well-known/mcp.json` declares 88 tools [S34, own check], well above that band and above Gemini Enterprise's 100-enabled-action cap only if all are public (live count not probed).
4. No evidence exists that a public brand-knowledge MCP server changes what assistants say about a company, with or without it connected. I found no study (see section 4). Standard GEO levers (third-party mentions, crawlable pages) have vendor-grade evidence only; llms.txt has measured near-zero AI-crawler consumption [S26].
5. The "server card" is real but young: SEP-2127 is marked Final on the MCP site [S9] while the extension repo still calls itself Experimental and names no consuming client [S10]. Canonical card location is `<streamable-http-url>/server-card`; the `/.well-known/mcp.json` path HGC serves today is not the final design [S9][S11].

---

## 1. Discovery channels

### 1.1 Summary table

| Channel | How a server is listed | Does a public no-auth knowledge server qualify? | Review criteria that matter | Lead time |
|---|---|---|---|---|
| Official MCP Registry (registry.modelcontextprotocol.io) | `mcp-publisher` CLI; `server.json` with `remotes: [{type: streamable-http, url}]`; namespace proof via GitHub OAuth (`io.github.<org>/*`), DNS TXT, or `/.well-known/mcp-registry-auth` HTTP file (`com.example/*`) [S12][S13] | Yes: "A remote server MUST be publicly accessible"; private servers unsupported [S3][S14] | No human review; namespace authentication, field validation, manual takedown for spam [S3] | Immediate on publish. Registry status: preview; GA "will follow later", no date [S15] |
| GitHub MCP Registry (github.com/mcp) | Publish to official registry, then email <vendor contact email, see source> asking for inclusion (blog 2025-10-24); blog said self-publication "expected in the next couple months" [S16] | Not stated either way. Needs valid server.json, verified ownership, public GitHub repo recommended [S16] | Not published | Unknown. Whether self-serve has since launched: unverified |
| Anthropic Connectors Directory (claude.ai/directory) | Developer portal claude.ai/directory/manage -> "MCP connector"; 10-step form [S4] | Yes. Authentication step: choose whether users must sign in; checklist says "OAuth 2.0 ... or no authentication for public data" [S4] | Every tool needs `title` + `readOnlyHint`/`destructiveHint`; tool names <=64 chars; narrow accurate descriptions; no prompt-injection patterns incl. "promote products and services"; MCP domain should match your service; actionable errors; reasonable response size; test account "required" even for populated-account semantics; public docs by publish date; privacy policy URL [S4][S7] | Automated scan, then listed by default as "Community" connector; some get human review, "times vary with queue volume"; no number published [S4]. "Verified" is assigned by Anthropic escalation, no application [S17] |
| OpenAI ChatGPT apps/plugins directory | OpenAI developer dashboard: upload plugin ZIP, connect MCP server, domain verification (`/.well-known/openai-apps-challenge`), 5 positive + 3 negative test cases, demo video URL, release notes, website/support/privacy/ToS URLs, policy attestations [S5] | Yes: portal supports no auth; do not mark a protected server `none`. No special no-auth rules [S5][S6] | Explicit `readOnlyHint`, `destructiveHint`, `openWorldHint` on every tool (reviewers compare with behaviour); descriptions state purpose, when to use, limits; no promotional/comparative language; no demo/trial; no ads; minimal data; privacy policy + support contact [S6][S18]. EU data-residency projects cannot submit [S5] | No fixed timeline published; support will not expedite [S18] |
| Microsoft Copilot (Copilot Studio / Foundry / M365) | Partner Center offer type "Apps and Agents for M365 and Copilot"; package = manifest + tool file + intro.md + Azure Key Vault auth config [S19] | Unlikely/unclear: requires verified publisher with Partner Center account, "approved authentication method", Key Vault OAuth secrets. A no-auth path is not described: unverified | Automated validation, then functional/safety review [S19] | "Slower than usual" during preview; legacy path open to 2026-10-31 [S19] |
| Google Gemini | Gemini Enterprise: admin adds a custom MCP data store (StreamableHTTP only, public-CA TLS), chooses allowed actions [S20]. Consumer Gemini custom-app support: sources conflict (plan tier unclear) | Yes for Gemini Enterprise: "no authentication or OAuth 2.0"; "Enable no more than 100 actions at a time"; actions off by default [S20] | n/a (customer-side configuration, not a public directory). No Google public MCP directory found | n/a |
| Perplexity | Customer adds a custom remote connector (HTTPS URL, auth None/API key/OAuth, Streamable HTTP or SSE) [S21] | Yes (auth "None" is an option) [S21] | No directory or review process found in the article; Perplexity says it cannot verify third-party MCP servers (secondary) | n/a |
| Cursor | Official Cursor Marketplace (plugins); community cursor.directory; manual `mcp.json`; team marketplaces [S22] | Not documented | Cursor docs describe no submission process: unverified. cursor.directory submission form (secondary, Glama-hosted doc) asks for repo, npm package | unknown |
| VS Code (Copilot) | Extensions view `@mcp` gallery (Preview), "Browse MCP Servers", manual URL [S23] | Not documented | Gallery source/curation not stated in the page: unverified | unknown |
| Cline | GitHub issue on `cline/mcp-marketplace` with repo link, 400x400 PNG, tested install [S24] | Built around GitHub repos with README install; remote-only servers not addressed [S24] | Community adoption, developer credibility, maturity, security | "A couple of days" target [S24] |
| Smithery | smithery.ai/new, paste public HTTPS URL; or `smithery mcp publish "<url>" -n <name>`. Gateway proxies to your server [S25] | Yes: "Public servers are scanned automatically"; Streamable HTTP required [S25] | Scan extracts tools/resources/prompts; if scan fails serve static card at `/.well-known/mcp/server-card.json` (Smithery-specific shape); allowlist `SmitheryBot/1.0`; official-vendor verification checklist under Settings [S25] | Not stated |
| PulseMCP | Submission page says submissions and listing changes are paused, no reopening date; page says publish to official registry and PulseMCP "will pick it up automatically" once it reopens [S27] | n/a | n/a | n/a |
| Glama | Claim a listing by signing in / linked GitHub identity (secondary); listing page shows letter grades for license, quality, maintenance; grading method not documented on page fetched [S28] | Unverified | Unverified | Unverified |
| mcp.so | Submit form (type "MCP Server" or "Remote Server"; repo URL + name). Paid option: "$39 one-time publishing fee" = no review wait, verified badge, featured placement [S29] | Form lists a "Remote Server" type; criteria not described | Unpaid review criteria/timeline not stated | Unpaid: unstated |
| Composio and other aggregators | Not researched | unverified | unverified | unverified |

### 1.2 Notes that change the plan

- Claude: any paid Claude plan can submit (the portal page says so [S4]); an earlier search summary claimed Team/Enterprise only and the primary page contradicts it. Local servers are no longer accepted as MCPB; remote only [S4]. The doc says escalations go to `<vendor contact email, see source>` [S4]. Installed-by-URL "custom connector" works the same technically but gets no in-product discovery; Anthropic documents a prefilled install link `https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=NAME&connectorUrl=ENCODED_URL` [S2] (useful on HGC's own site even before listing).
- Claude directory entries have a permanent slug URL `claude.ai/directory/connectors/SLUG` [S2]. A secondary source says ranking is usage-based; the Anthropic page fetched does not state ranking rules: unverified.
- ChatGPT: public apps are now submitted "as plugins" in a shared catalog [S5][S18]. OpenAI says strong utility and satisfaction "may be eligible for enhanced distribution opportunities" such as proactive suggestions, but gives no ranking algorithm [S6]. Third-party claims about name/description weighting are anecdotal.
- ChatGPT policy tension for a brand server: "We cannot approve plugins that primarily function as unofficial connectors to third-party services" targets third-party relays, not first-party; "Trial or demo plugins will not be accepted" and "Advertising ... embedded in the plugin" are the clauses a reviewer could apply to a pure marketing knowledge feed [S6]. This is my inference, not an OpenAI statement.
- Registry: HGC's own `/.well-known/mcp.json` already declares `registry_name: io.github.merulocal/hellogrowthcrm-bot-crawler` [S34], but a registry API search for "hellogrowthcrm" on 2026-10-26 returned 0 servers (my curl; search may be name-substring based). Treat as "not listed" pending a direct lookup by exact name.

---

## 2. What makes an assistant pick a server's tool

### 2.1 Protocol surfaces (spec 2026-07-28) [S1][S30][S31]

- Tool fields: `name` (1-128 chars, SHOULD be A-Z a-z 0-9 _ - .), `title`, `description`, `icons`, `inputSchema`, `outputSchema`, `annotations`. Annotations MUST be treated as untrusted unless from a trusted server [S30].
- `instructions`: optional natural-language guidance for LLMs, returned by `server/discover` (which servers MUST now implement; the `initialize` handshake was removed) [S31][S1-changelog].
- Statelessness: sessions and `Mcp-Session-Id` removed; `tools/list` MUST NOT vary per connection; SHOULD return tools in deterministic order for caching and prompt-cache hits; results carry `ttlMs` and `cacheScope` [S30][S32].
- `listChanged`: now delivered over a `subscriptions/listen` stream, only to clients that opt in [S30][S32]. For a static knowledge server, `listChanged:false` is fine; ttlMs/cacheScope matter more.
- `outputSchema`/`structuredContent`: spec says they help clients and LLMs "properly parse"; servers SHOULD also return serialized JSON in a text block [S30]. I found no measured evidence that outputSchema changes tool selection: unverified.
- Prompts and resources: spec features; I found no client documentation or study showing they influence tool selection or discovery. Claude's directory portal does sync "tools, prompts, and resources" for display [S4]. Impact on selection: unverified.
- Deprecated in this revision: Roots, Sampling, Logging; HTTP+SSE transport; DCR as the preferred client-registration route (CIMD preferred) [S32]. Streamable HTTP is what every directory above accepts; HGC's well-known file lists a `/sse` URL under type `streamable-http` [S34]: worth a consistency check by another workstream.

### 2.2 Client behaviour and limits

| Client | Behaviour | Source |
|---|---|---|
| Claude Code | Tool search on by default: only tool names and server instructions load at session start; "Claude Code doesn't impose a fixed per-server tool cap". `auto` mode turns search on when tool definitions reach 10% of context. Server instructions truncated at 4,096 chars; a deferred tool's description at 16,384 chars, but "tool search ... reads only the part within the shorter limit", so "put the words Claude would search for near the start". Per-tool `_meta: {"anthropic/alwaysLoad": true}` keeps a tool upfront. Docs tell server authors to write instructions covering what task categories the tools handle, when to search, key capabilities. | [S33] |
| Anthropic API tool search | Regex and BM25 variants search tool names, descriptions, argument names, argument descriptions; returns 5 by default. Guidance: use 10+ tools threshold, consistent namespace prefixes, keywords users would use, keep 3-5 most used tools non-deferred. States selection accuracy "degrades once you exceed 30-50 available tools". | [S8] |
| Anthropic measured | Tool Search Tool lifted MCP-eval accuracy Opus 4 49% -> 74%, Opus 4.5 79.5% -> 88.1%; ~77K -> ~8.7K upfront tokens (post dated 2025-11-24). | [S35] |
| ChatGPT | Model picks tools from metadata and past usage; falls back to built-ins if no clear match. OpenAI guidance: name tools domain + action (e.g. `calendar.create_event`), start descriptions with "Use this when...", list disallowed cases, document each parameter with examples; build a golden prompt set of direct, indirect and negative prompts and measure precision/recall; set `openWorldHint:true` for tools reaching public/open-ended entities. | [S36][S6] |
| Gemini Enterprise | Admin must enable actions individually; no more than 100 enabled at a time; `readOnlyHint` tools can skip user confirmation. | [S20] |
| VS Code Copilot | Cap "128 tools per request": from a blog only; not in the VS Code page I fetched: unverified. | [S23] |
| Cursor | "About 40 tools" cap appears in forum posts; a Cursor staff reply attributes the error to a per-model provider cap; the Cursor MCP docs mention no tool-count limit. Treat as unverified/variable. | [S22] |

Policy constraint on description wording: Anthropic rejects descriptions that instruct Claude beyond the tool's function, "interfere with Claude calling other tools", or "promote products and services" [S7]; OpenAI forbids fields that "manipulate how the model picks among plugins" and descriptions that "broaden triggering beyond the plugin's actual purpose" [S6]. So "make the assistant prefer us" wording in descriptions is both disallowed and unnecessary; accuracy and keyword coverage are the legitimate levers.

### 2.3 Measured studies

| Study | Finding | Caveat |
|---|---|---|
| arXiv 2602.18914 (submitted 2026-02-21): "From Docs to Descriptions", 10,831 servers | 18 smell categories; in a controlled mutation study, functionality and accuracy fixes raised selection by 11.6% and 8.8% (p<0.001); with functionally equivalent servers, standard-compliant descriptions reached 72% selection probability vs 20% baseline; 73% of servers repeat tool names | Abstract-level check only; competitive-setting numbers are from the authors' experimental setup |
| arXiv 2602.14878 (submitted 2026-02-16, v3 2026-05-31): "MCP Tool Descriptions Are Smelly", 856 tools / 103 servers | 97.1% of descriptions have a smell; 56% do not state purpose clearly; augmenting descriptions raised task success by a median 5.85 points but increased steps 67.46% and regressed 16.67% of cases; compact variants often keep gains cheaper | Longer is not automatically better |
| arXiv 2608.08467 (submitted 2026-08-09): "LLM within MCP Matters", 24 LLMs, 54,000 trials, one legal-information server | When a search tool is available, 9 models fell below 15% use of data embedded in server instructions ("behavioral preference rather than missing capability"); combining three instruction-level interventions restored >=86% for 20 of 24; authors recommend hosts prioritise server instructions | Single server/domain; preprint, unreviewed. Directly relevant: do not rely on facts inside `instructions` alone; give a clear first-choice tool |
| Anthropic engineering post (2025-11-24) | See section 2.2 | Vendor benchmark on its own models |

---

## 3. Peer servers (one row each)

| Vendor | Hosted URL | Auth | Tools | Tool-name style | Server card / llms.txt / docs page | Where listed |
|---|---|---|---|---|---|---|
| HubSpot | `https://mcp.hubspot.com` [S37] | OAuth with PKCE required; admin creates "MCP connector" in account [S37] | 32 publicly listed (page fetched 2026-10-26) incl. `tool_guidance`, `discover_hubspot_schema`, `get_aeo_metrics`, `manage_aeo_prompts` [S37] | `verb_object` snake_case, with `manage_*` multi-action tools | Docs page on developers.hubspot.com; server card / llms.txt: none seen | Own developer site; Claude/ChatGPT/Gemini named as supported for some tools [S37]; directory listing status: unverified |
| Salesforce | Pattern `api.salesforce.com/platform/mcp/v1/platform/<server>` (secondary only) | OAuth via org (secondary) | `sobject-all` reported as 11 tools (secondary) | camelCase e.g. `soqlQuery`, `getObjectSchema` (secondary) | Official docs exist at developer.salesforce.com/docs/platform/hosted-mcp-servers (fetch returned 403, not read) | GA April 2026 per third-party blogs; **primary not verified** |
| Zoho CRM | URL generated in Zoho MCP console, treated like a password (secondary); no public URL pattern on zoho.com/mcp [S38] | OAuth, user-level permissions [S38][S39] | Five pre-built CRM servers: Data Insights, Data Operations, Module Customization, Workflow & Process Automation, plus one unnamed; per-server tool counts not stated [S39] | PascalCase examples (`GetRecords`, `SearchRecords`) (secondary) | Help article and zoho.com/mcp; no card/llms.txt seen | Own product; zoho.com/mcp states no MCP directory [S38] |
| Pipedrive | `https://mcp.pipedrive.ai/mcp` (secondary: directory listing, tldv blog); the pipedrive.com page omits it [S40] | OAuth login; on every plan with token limits [S40] | ~15 reported (secondary); official count not stated | camelCase (`getDeals`, `addDeal`) (secondary) | Marketing page `pipedrive.com/en/features/mcp-server` [S40] | Setup guides for ChatGPT and Claude; directory listing not mentioned |
| Attio | `https://mcp.attio.com/mcp` [S41] | OAuth; follows user permissions [S41] | 48 (Records 9, Lists 8, Activities 6, Notes 5, Comments 4, Tasks 4, Meetings 4, Emails 3, Workspace 3, Reporting 1, SQL 1) [S41] | lowercase hyphenated verb-noun (`list-objects`, `create-record`) [S41] | Docs page; card/llms.txt none seen | Installable from Claude connector catalog and ChatGPT apps per its docs [S41] |
| Close | `https://mcp.close.com/mcp`, Streamable HTTP, SSE unsupported [S42] | OAuth 2.0 + DCR recommended; or API key headers; scopes `mcp.read`, `mcp.write_safe`, `mcp.write_destructive` [S42] | Not given on page; separate "Close MCP Tools" page [S42] | Not specified | developer.close.com/mcp(.md) | Claude connector directory (page links it), ChatGPT official plugin, Cursor, VS Code, n8n [S42] |
| monday.com | `https://mcp.monday.com/mcp` [S43] | OAuth (DCR/PKCE), API token, or own OAuth app [S43] | "60+ tools, organized by category" per monday docs; third parties say 20 or 42 (conflict) [S43] | Not stated | developer.monday.com MCP overview + security pages | monday docs list compatible clients; directory listing: unverified. (An older monday page described a local `npx` server only.) |
| Stripe | `https://mcp.stripe.com` [S44] | OAuth, or agent API key bearer; non-agent secret keys stop working Dec 2026 [S44] | 15 documented: `stripe_api_search`, `stripe_api_details`, `stripe_api_read`, `stripe_api_write`, `get_stripe_account_info`, `atlas_company_formation`, `stripe_analytics`, `get_balance_summary`, `convert_currency`, `send_money`, `setup_recipient`, `transfer_money`, `search_stripe_documentation`, `stripe_implementation_planner`, `send_stripe_feedback` [S44] | Mostly `stripe_`-prefixed snake_case; generic search/read/write meta-tools keep count low | docs.stripe.com/mcp, agent skills and plugin pages; docs say "Read this page in your terminal" via CLI | Official Claude directory entry and ChatGPT plugin linked from docs; Cursor/VS Code deeplinks [S44] |

Pattern worth copying (all inference): Stripe keeps the tool count at 15 by exposing generic search/details/read/write tools over a large API, and ships a `search_stripe_documentation` knowledge tool; HubSpot ships a `tool_guidance` tool and a schema-discovery tool. All eight vendors use OAuth because they expose customer data; none is a no-auth knowledge server, so none is a direct comparable for HGC's public endpoint. None publicly documents a server card or llms.txt for its MCP endpoint (only absence on the pages I fetched; a direct probe of their hosts was not done).

---

## 4. Does a public brand-knowledge MCP server change what assistants say about a company?

### 4.0 Evidence found

None. A targeted search for studies comparing brand mention/citation with and without an MCP server found only vendor tooling that reads AI-visibility data via MCP (Writesonic, GEOly, geoSurge), i.e. measurement, not influence [S45]. Anything below is mechanism-based inference unless marked.

### 4a. Assistants WITH the server connected

- Mechanism (inference): once a user connects it, the model can call the tools and quote what they return. Whether it does so depends on tool selection (section 2). The 2608.08467 result shows models can systematically prefer a generic search tool over data sitting in server `instructions` [S46], so answer content should come from a clearly named, first-choice tool, not only from `instructions`.
- Reach limit: in Claude, only directory-listed connectors can be suggested to users; custom connectors never are [S2]. So reach = number of users who deliberately connect it. No usage numbers for comparable knowledge servers were found.
- Perplexity and Gemini Enterprise require the customer/admin to add the server manually [S20][S21]. ChatGPT: users can name an app to surface it; otherwise the model falls back to built-ins if no clear match [S6].
- Directory-policy risk: see section 1.2 (advertising/promotional clauses).

### 4b. Assistants WITHOUT it (web search / training data)

An MCP endpoint is a JSON-RPC API, not a crawlable HTML page, so it is not an input to training or web retrieval by itself (inference). What influences these answers (all evidence is weak-to-moderate and mostly secondhand):

| Lever | Evidence | Source |
|---|---|---|
| llms.txt / llms-full.txt | Adoption: Common Crawl found ~11.72% of sampled hosts returned a text body at /llms.txt in the July 2026 crawl, but ~40% of "200" responses were HTML fallbacks and 68% of files are templated [S47]. Consumption: an Ahrefs log study (137,000 domains, May 2026, reported secondhand via Originality.ai and PPC Land, 2026-07-02) found 97% of files had zero requests and AI retrieval bots made 1.1% of requests to them [S26]. Google's AI-features page (updated 2025-12-10) says you do not need "new machine readable files, AI text files, or markup" for AI Overviews/AI Mode, and does not mention llms.txt [S48]. OpenAI and Anthropic statements on llms.txt: none found. | [S26][S47][S48] |
| Structured data (schema.org) | Google: no special schema needed for AI features [S48]. A May 2026 Ahrefs-style before/after test (1,885 pages vs 4,000 controls) reportedly showed no meaningful citation lift (secondary; primary not read). Correlational "65%/71% of cited pages have schema" claims (SE Ranking, secondary) are not causal. | [S48]; secondary search summary |
| Third-party mentions and reviews | Vendor studies (AirOps via Authority Tech) say ~85% of brand mentions in AI search come from third-party pages and brands are ~6.5x more likely to be cited through third-party sources than owned domains; platform citation mixes differ (ChatGPT vs Perplexity overlap only 11% of domains). Review sites G2/Capterra/Trustpilot reported at 8-12% of citations by one vendor, 42% for a broader "UGC" grouping by another: figures do not reconcile. All vendor-sourced; primaries not read. | secondary search summaries; treat as directional |
| Indexable first-party pages | Google states eligibility follows ordinary Search indexing and snippet rules [S48]. | [S48] |

Practical reading: for (b), the levers are the same as classical SEO plus presence on third-party sources the models retrieve; the MCP server contributes nothing here beyond (indirectly) giving you a place to keep facts consistent with the website.

---

## 5. Machine-readable discovery standards: real vs proposed

| Mechanism | Status as of 2026-10-26 | Adoption evidence | Source |
|---|---|---|---|
| `server/discover` RPC + `instructions` | In the stable 2026-07-28 spec; servers MUST implement | Spec-level; client uptake not measured | [S31][S1] |
| MCP Registry `server.json` + namespace auth (`/.well-known/mcp-registry-auth`, DNS TXT, GitHub) | Real, in use; registry itself in preview, API frozen at v0.1 (2025-10-24), GA undated | Aggregators consume it (PulseMCP says it will pick up automatically; GitHub registry draws from it) [S15][S16][S27] | [S12][S13][S15] |
| MCP Server Card (SEP-2127) | MCP site labels SEP "Final", Extensions Track, created 2026-01-21; card schema lives in `experimental-ext-server-card`, which says "Experimental ... not an accepted or official MCP extension" and tracks the SEP as "still under review"; the two sources conflict. Cards are optional; carry identity + remote endpoints + protocol versions, no tools/resources/prompts. Reserved location `GET <streamable-http-url>/server-card` (e.g. `https://host/mcp/server-card`), media type `application/mcp-server-card+json`; `/.well-known/mcp/server-card` explicitly "not recommended" | Repo's "Used by" is empty; no consuming client or registry named. Reference implementations: Python SDK PR #2951, Go SDK PR #1024, a Goose fork. Smithery uses its own fallback `/.well-known/mcp/server-card.json` [S25] | [S9][S10][S11][S25] |
| `/.well-known/mcp.json` | Origin: SEP-1649 (issue #1649, "original" proposal). Not the path the final SEP chose. HGC serves one (200 application/json, own check) | No consumer found | [S9][S34] |
| AI Catalog `/.well-known/ai-catalog.json` | Draft (Linux Foundation temp repo; "when the specification is finalized" A2A and MCP committees vote); media type `application/ai-catalog+json`. SEP-2127 says an AI Catalog entry can link to a card | "None confirmed" adopters | [S11][S49] |
| IETF individual drafts: `draft-serra-mcp-discovery-uri` (`/.well-known/mcp-server`, `mcp://`), `draft-soden-wellknown-mcp-commerce` (June 2026) | Individual Internet-Drafts, not standards; seen only in a search snippet, not opened | None | search snippet; unverified |
| `Link` HTTP header for card discovery | Considered and not chosen in SEP-2127 ("requires an HTTP request to the main endpoint first") | none | [S9] |
| OpenAI `/.well-known/openai-apps-challenge` | Real, vendor-specific domain verification for ChatGPT submission | Required for ChatGPT listing | [S5] |
| RFC 9728 protected-resource metadata | Real; used by clients for OAuth discovery (Cursor docs), irrelevant to a no-auth server | n/a | [S22] |
| llms.txt / llms-full.txt | Community convention, widely published, little consumed (section 4b). MCP docs and Claude docs themselves publish `/llms.txt` indexes for their docs sites | See 4b | [S26][S47] |
| schema.org markup | Real web standard; Google says not required for AI features; causal AI-citation lift unproven | See 4b | [S48] |

HGC's own endpoint today (my curl, 2026-10-26, unauthenticated GETs): `/.well-known/mcp.json` 200 JSON; `/.well-known/mcp/server-card.json`, `/.well-known/mcp/server-card`, `/mcp/server-card`, `/.well-known/ai-catalog.json`, `/llms.txt` and `/.well-known/mcp-registry-auth` all 404 on mcp.hellogrowthcrm.com. www.hellogrowthcrm.com returned 301 for /llms.txt, /.well-known/mcp.json, /.well-known/ai-catalog.json (final target not followed). The well-known JSON says `tools.count: 88`, `listChanged:false`, `authentication: none`, and lists `transport.type: streamable-http` with URL `https://mcp.hellogrowthcrm.com/sse`. I did not run `tools/list`, so the live public tool count, annotations, titles and outputSchema coverage are unmeasured here [S34].

---

## 6. Advice for HGC (derived; each item rests on the cited findings)

1. Priority order by reach: (a) Claude directory submission (no-auth allowed, free, automated scan then Community listing, in-chat Suggested Connectors eligibility) [S2][S4]; (b) ChatGPT plugin submission, after rewriting descriptions to factual and non-promotional, adding explicit three annotations on every tool, 5+3 test cases and a demo video [S5][S6]; (c) official MCP Registry publish with a `com.hellogrowthcrm/...` namespace via HTTP/DNS proof, which is cheap and feeds PulseMCP/GitHub/aggregators [S12][S3][S27]; (d) Smithery URL publish [S25].
2. Before submitting: cut the public tool surface to a small, namespaced set (target well under 30), with each tool having `title`, `readOnlyHint:true`, `openWorldHint` set, front-loaded keyword-rich description (first ~4,096 chars matter for Claude Code), and an `instructions` block stating when to use the server (e.g. product, pricing, integrations, comparisons questions) [S8][S33][S36].
3. Keep bot-governance and admin tools off the public listing: a brand-knowledge server mixed with "bot detection, crawler verification and robots.txt governance" tools [S34] widens the surface that reviewers and tool search must judge and blurs the "purpose" that both directories require descriptions to match [S6][S7].
4. Do not invest in server cards, ai-catalog or llms.txt for the MCP host as a visibility lever; they are cheap hygiene only (no known consumer for cards [S10]; llms.txt barely read [S26]). If done, serve a card at `/mcp/server-card` with the registered media type rather than `/.well-known/mcp.json`.
5. For (b)-type visibility, spend effort on third-party presence and crawlable pages, and measure it with citation tracking, not on the MCP server.

---

## Sources (accessed 2026-10-26 unless noted)

| ID | URL | Date on page | Supports |
|---|---|---|---|
| S1 | https://modelcontextprotocol.io/specification/latest (and /specification/2026-07-28/changelog.md) | rev 2026-07-28 | Current stable spec; stateless; server/discover; ttlMs/cacheScope; deprecations |
| S2 | https://claude.com/docs/connectors/building/directory-vs-custom.md | undated | Only directory listing gives in-product discovery and Suggested Connectors; registry does not surface in Claude; install link format |
| S3 | https://modelcontextprotocol.io/registry/about | undated (preview note) | Registry purpose, preview, namespace verification, not for host apps, spam controls |
| S4 | https://claude.com/docs/connectors/building/submission.md | undated | Claude submission steps, requirements, no-auth allowed, Community default, review timing |
| S5 | https://developers.openai.com/apps-sdk/deploy/submission | undated | ChatGPT submission: no-auth supported, domain challenge, test cases, one review at a time, no timeline |
| S6 | https://developers.openai.com/apps-sdk/app-submission-guidelines | undated | ChatGPT guidelines: no trial/demo, no manipulation, annotations, enhanced distribution |
| S7 | https://claude.com/docs/connectors/building/review-criteria.md | undated | Claude review criteria: annotations, names <=64, prompt-injection patterns, promote products, API ownership |
| S8 | https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool | undated | Tool search mechanics, 30-50 tool degradation, naming tips, 10+ tool threshold |
| S9 | https://modelcontextprotocol.io/seps/2127-mcp-server-cards | created 2026-01-21, status Final | Server card design, location, Link header rejected, AI Catalog |
| S10 | https://github.com/modelcontextprotocol/experimental-ext-server-card | undated | Extension "Experimental", no consumers listed |
| S11 | https://github.com/modelcontextprotocol/experimental-ext-server-card/blob/main/docs/discovery.md | undated | `/server-card` path, media types, `/.well-known/mcp/server-card` not recommended, ai-catalog path |
| S12 | https://modelcontextprotocol.io/registry/authentication | undated | GitHub/DNS/HTTP namespace auth, `/.well-known/mcp-registry-auth` |
| S13 | https://modelcontextprotocol.io/registry/remote-servers | undated | `remotes` in server.json, streamable-http, example `com.example/...` |
| S14 | https://modelcontextprotocol.io/registry/about (private servers unsupported) | undated | Same as S3 |
| S15 | https://github.com/modelcontextprotocol/registry | 2025-09-08 / 2025-10-24 notes | Preview status, v0.1 API freeze, GA undated |
| S16 | https://github.blog/ai-and-ml/generative-ai/how-to-find-install-and-manage-mcp-servers-with-the-github-mcp-registry/ | 2025-10-24 | GitHub MCP Registry listing via email to <vendor contact email, see source> |
| S17 | https://claude.com/docs/connectors/verification.md | undated | Community vs Verified; no application for Verified |
| S18 | https://developers.openai.com/plugins/deploy/app-review | undated | Annotation rules, no fixed timeline, reviewer checks |
| S19 | https://learn.microsoft.com/microsoft-copilot-studio/mcp-certification | ms.date 2026-09-25, updated 2026-10-17 | Microsoft certification: Partner Center, Key Vault, legacy to 2026-10-31 |
| S20 | https://docs.cloud.google.com/gemini/enterprise/docs/connectors/custom-mcp-server/set-up-custom-mcp-server | undated | Gemini Enterprise custom MCP: no-auth/OAuth, 100 actions, allowlist |
| S21 | https://www.perplexity.ai/help-center/en/articles/13915507-adding-custom-remote-connectors | undated (search tool says ~236 days old) | Perplexity custom remote connector: auth None allowed |
| S22 | https://cursor.com/docs/context/mcp | undated | Cursor marketplace/cursor.directory, no tool limit stated, RFC 9728 OAuth |
| S23 | https://code.visualstudio.com/docs/copilot/customization/mcp-servers | undated | VS Code MCP gallery (Preview); no 128 limit stated |
| S24 | https://github.com/cline/mcp-marketplace | undated | Cline submission via GitHub issue; review criteria |
| S25 | https://smithery.ai/docs/build/publish | undated | Smithery URL publish, scan, `/.well-known/mcp/server-card.json` fallback |
| S26 | https://ppc.land/llms-txt-adoption-rises-8-8x-but-97-of-files-get-zero-ai-requests/ | 2026-07-02 | Ahrefs/Originality.ai llms.txt consumption figures (secondary) |
| S27 | https://www.pulsemcp.com/submit | undated | PulseMCP submissions paused; registry pickup |
| S28 | https://glama.ai/mcp/servers | undated | Glama listing grades; claim process not documented on page |
| S29 | https://mcp.so/submit | undated | mcp.so submit form, $39 fast-track |
| S30 | https://modelcontextprotocol.io/specification/2026-07-28/server/tools.md | rev 2026-07-28 | Tool fields, names, annotations untrusted, outputSchema, listChanged |
| S31 | https://modelcontextprotocol.io/specification/2026-07-28/server/discover.md | rev 2026-07-28 | `server/discover` and `instructions` |
| S32 | https://modelcontextprotocol.io/specification/2026-07-28/changelog.md | rev 2026-07-28 | Changes and deprecations |
| S33 | https://code.claude.com/docs/en/mcp | undated | Claude Code tool search, 4,096/16,384 char limits, alwaysLoad, 10% threshold |
| S34 | https://mcp.hellogrowthcrm.com/.well-known/mcp.json and probed paths | fetched 2026-10-26 | HGC own state (88 declared tools, 404s on card paths); registry API search returned 0 |
| S35 | https://www.anthropic.com/engineering/advanced-tool-use | 2025-11-24 | Tool search accuracy and token numbers |
| S36 | https://developers.openai.com/apps-sdk/guides/optimize-metadata | undated | ChatGPT metadata/annotation guidance, golden prompts |
| S37 | https://developers.hubspot.com/docs/apps/developer-platform/build-apps/integrate-with-hubspot-mcp-server (and /mcp) | undated | HubSpot MCP: URL, OAuth PKCE, 32 tools |
| S38 | https://www.zoho.com/mcp/ | undated | Zoho MCP product page: OAuth, no directory, no URL pattern |
| S39 | https://help.zoho.com/portal/en-gb/community/topic/zoho-crm-with-built-in-mcp-support | undated | Zoho CRM five pre-built MCP servers |
| S40 | https://www.pipedrive.com/en/features/mcp-server | video metadata 2026-06-26 | Pipedrive MCP marketing page; OAuth; all plans |
| S41 | https://docs.attio.com/mcp/overview | undated | Attio: URL, OAuth, 48 tools, naming |
| S42 | https://developer.close.com/mcp.md | undated | Close: URL, OAuth/DCR, scopes, listings |
| S43 | https://developer.monday.com/api-reference/docs/mondaycom-mcp | undated | monday: hosted URL, 60+ tools |
| S44 | https://docs.stripe.com/mcp | undated (key-migration notice to 2026-11-30) | Stripe: URL, auth, tools, listings |
| S45 | WebSearch (apidocs.writesonic.com/mcp, mcpservers.org geoly, docs.geosurge.ai) | search 2026-10-26 | Only measurement-type MCP servers found; no influence study |
| S46 | https://arxiv.org/abs/2608.08467 | submitted 2026-08-09 | Models prefer search over instructions-embedded data |
| S47 | https://commoncrawl.org/blog/a-content-analysis-of-llms-txt-files-from-the-july-2026-crawl-archive | 2026-08-31 | llms.txt adoption and quality in July 2026 crawl |
| S48 | https://developers.google.com/search/docs/appearance/ai-features | last updated 2025-12-10 | Google: no extra files or schema needed for AI features |
| S49 | https://github.com/Agent-Card/ai-catalog | undated | AI Catalog is Draft; no confirmed adopters |
| S50 | https://arxiv.org/abs/2602.18914 and https://arxiv.org/abs/2602.14878 | 2026-02-21; 2026-02-16 (v3 2026-05-31) | Tool description studies |

---

## What I could not verify

- Salesforce hosted MCP server details (URL, tool names, count, GA date): developer.salesforce.com pages returned HTTP 403; everything is from third-party blogs.
- Pipedrive hosted URL and tool count: only a third-party directory listing and blog; Pipedrive's page omits them.
- Zoho: fifth CRM server's name, tool counts, URL pattern; whether the console URL is secret-like (secondary).
- HubSpot, Close, monday.com, Salesforce, Zoho, Pipedrive directory-listing status in Claude/ChatGPT (only Close and Stripe are shown linked from their own docs).
- Whether the GitHub MCP Registry now has self-serve listing (blog from 2025-10-24 only); whether `github.com/mcp` accepts remote no-auth knowledge servers.
- Official MCP Registry GA date and whether VS Code or other host apps currently consume it.
- Typical review lead time for Claude directory, ChatGPT plugins, Microsoft certification (none published; only "varies").
- Whether a no-auth server needs the "test account" step in Claude's portal (the doc requires credentials "for a fully populated account"; applicability to no-auth is not stated).
- How Claude Suggested Connectors and ChatGPT proactive suggestions are ranked (a secondary source says usage-based for Claude; not on the Anthropic page; OpenAI gives no algorithm).
- Whether a ChatGPT or Claude reviewer would treat a first-party brand-knowledge feed as "advertising"/"demo" (inference from policy text only).
- Consumer Gemini custom-MCP availability and plan tier (sources conflict); whether Gemini/Copilot/Perplexity have any public directory accepting third-party remote servers.
- VS Code 128-tool and Cursor 40-tool limits (blogs/forums only; Cursor staff attribute errors to a per-model cap).
- Any client that actually consumes MCP Server Cards or AI Catalog; status conflict between the SEP page ("Final") and the extension repo ("Experimental", "under review").
- IETF drafts draft-serra-mcp-discovery-uri and draft-soden-wellknown-mcp-commerce (seen only in a search snippet).
- The Ahrefs schema-markup before/after study and the AirOps/SE Ranking/BrightEdge citation statistics (secondhand summaries; primaries not read).
- Any evidence that `outputSchema`, prompts or resources affect tool selection or discovery.
- Composio and other aggregator listing processes (not researched); Glama claim/scoring rules; PulseMCP/mcp.so review criteria.
- HGC's live `tools/list` (count, annotations, titles, schema coverage): my probe attempt was abandoned, so only the self-declared 88 in `/.well-known/mcp.json` is known, and the declared transport URL `/sse` vs the stated endpoint `/mcp` is unexplained.

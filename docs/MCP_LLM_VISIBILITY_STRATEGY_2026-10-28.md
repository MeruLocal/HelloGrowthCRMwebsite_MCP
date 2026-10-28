# HelloGrowthCRM MCP — how to be found by AI assistants and answer correctly

**Status:** proposal for review · **Date:** 2026-10-28 · **Plan:** PLAN-HELLOG-0003 (`docs/plans/2026-10-28-plan-hellog-0003-mcp-llm-visibility-phase-1.md`)
**Server measured:** `https://mcp.hellogrowthcrm.com` (live 2.0.0, 77 tools / 89 total; repo `main` = 2.1.0, not yet deployed)
**Evidence base:** four measurements taken 2026-10-26..28 (section 2), a web research pass with sources (section 3), and the product truth audit of 2026-10-24..28 (known truths KT-1..KT-19, 2,401 website claims re-graded, 1,185 registry entries). Anything not measured is marked *unverified*.

---

## 1. The honest summary

1. **The MCP server is a distribution and answer-quality channel. It is not an organic ranking lever.** ChatGPT Search, Gemini and Perplexity do not discover an arbitrary MCP server and call its tools when someone asks "best CRM for travel agents". A user, an admin or a client directory has to connect it first (the repo's own `GEO_AEO_MASTER_PLAN.md` reached the same conclusion on 2026-08-05; the 2026 research below confirms it). We found **no study** showing that a public brand-knowledge MCP server changes what assistants say about a company.
2. **Discovery inside an assistant happens through directories, not the open registry.** Anthropic states that open-registry listings do not surface a server in Claude; only directory connectors can be suggested in chat. ChatGPT has its own submission portal. Both accept a public, no-auth, read-only server — with policy risks for something that looks like marketing (section 6).
3. **Once connected, the server is judged on whether it picks the right tool and returns a true, complete answer — and today it does neither well.** We played an assistant against the live server with 160 realistic buyer prompts: only **24–32 %** of tool choices were unambiguous, **3–8 %** of called answers were complete, **10–20 %** contained a fact that contradicts what we verified in code, and **35–50 %** came back empty. Not one "best CRM for <industry> in <country>" prompt got a recommendation.
4. **Our listings misdescribe us.** 6 of 60 target directories list the server; Glama, LobeHub and MCP Market call it "mcp-bot-crawler", mcp.so and mcpservers.org say it gives "secure AI access to CRM data, lead and customer management", and the npm package they link to does not exist (404).
5. **So the plan is, in order: be true → be selectable → be listed correctly → be measurable → fix the website layers that assistants without our MCP actually read.** Do not buy placements, stuff keywords or add descriptions that tell the model to prefer us: both Anthropic and OpenAI reject that, and it would not work.

---

## 2. What we measured

### 2.1 Could an assistant answer buyer questions from the live server? (two independent runs, 160 prompts, 80 real calls)

| Measure | Run A (industry×country, pricing, competitors, features, integrations, trust) | Run B (shortlists, implementation, procurement, ROI, agent-native, regional, edge) |
|---|---|---|
| Tool choice unambiguous | 26 / 80 (32.5 %) | 19 / 80 (24 %) |
| Tool choice ambiguous (2+ plausible) | 47 (59 %) | 47 (59 %) |
| No tool can answer | 7 (9 %) | 14 (18 %) |
| Answer complete (of 40 called) | 1 (2.5 %) | 3 (8 %) |
| Answer partial | 11 (27.5 %) | 19 (48 %) |
| Answer **wrong** vs verified truth | 8 (20 %) | 4 (10 %) |
| Answer empty / error | 20 (50 %) | 14 (35 %) |

Reading: it is a decent **catalogue lookup** (list agents, list countries, a Singapore payment-method question) and a poor **answer engine**. The "can it do X?" probes returned *empty* with no "not supported" signal, so an assistant will tell a buyer we lack SSO/MFA (we have both), payroll (partial) or Instagram (DM inbox exists).
Top missing tool types: an industry-fit profile (would fix all 20 "best CRM for X" prompts), an implementation playbook (13 prompts), explicit capability checks with negatives, a trust/compliance tool, a shortlist/comparison tool.

### 2.2 Wrong or stale facts served as fact (selected; status on `main` 2026-10-28)

| Fact served | Truth (source) | On `main` now |
|---|---|---|
| India Growth ₹1,099 / "prices include GST" / US $13 | ₹899 + 18 % GST; $12 (KT-10) | Fixed by #91/#97/#101; the GST FAQ line still needs re-checking |
| "SOC 2 certified" / "SOC 2 Type II" as fact | Report unverified (KT-12) | **Still present** (`website-mirror.ts:33,314,322`, `faqs.ts:65`) and contradicts `prompts.ts:74` |
| Tally integration "imports or exports ledger-aligned data" (+ 7 competitor rows "Tally: Yes") | Only Tally.so forms; no TallyPrime sync | **Still present** (`integrations.ts:278`, `alternatives.ts`) |
| Paytm, PayU "live"; Cashfree payment links | No handler / 501 (KT-18) | **Still present** (`integrations.ts:267,814,815`) |
| "Unlimited pipelines" | One pipeline on every plan (KT-17) | **Still present** (`pricing.ts:76`) |
| "Unlimited exports + scheduled reports" | No user-configurable scheduled reports (KT-5) | **Still present** (`pricing.ts:118,219`) |
| Field Operations on t2/t3 | Field Sales only for `agri_inputs` (KT-6) | Not re-checked on 2.1.0 |
| "630 integrations" / "90 integrations" | Defensible: 190+ (194 code-verified of 360 live cards; KT-19) | Not re-checked |
| Local-currency prices (AED, GBP, SGD…) as fact | From a 2026-08-06 mirror, unconfirmed (KT-10) | Not re-checked |

### 2.3 Where we are listed (60 tracker sites, 2026-10-26)

6 listed (Glama, MCP.so, LobeHub, mcpservers.org, MCP Market, YouTube); **0** in the official MCP Registry, Smithery, PulseMCP, Cline, Cursor Directory, Composio, Portkey, Speakeasy, Continue, OpenTools; 8 could not be checked. The tracker marks every row "Not started", so the six listings were auto-indexed from the repo README, whose H1 is `# mcp-bot-crawler`. GitHub topics are empty, stars 0.

### 2.4 Live-server fitness (2026-10-26..28)

`/health` is `degraded` (12 of the mirror files are 50–139 days old; the sync workflow has no repo secret). `OPTIONS /sse` returns 405 with no CORS headers (browser clients cannot connect) and `Accept: application/json` gets 406. `initialize` returns no `instructions`. `integrations_list` returns 386 KB by default with 516 "planned" mentions. The first 16 rapid requests trigger a plain-text rate-limit body that breaks strict JSON-RPC clients. `analytics_social_proof` still returns masked subscriber emails on the public endpoint (P0, separate PR). `/llms.txt` and `/.well-known/mcp/server-card.json` are served by 2.0.0+ builds.

---

## 3. What the 2026 research says (sources and dates in `docs/evidence/mcp-visibility-2026-10-26/R1_web_research.md`)

- **Directories.** Claude's directory accepts public data with no auth; every tool needs a `title` and read/write annotations; descriptions that interfere with other tools or promote a product are rejected. ChatGPT's portal supports no-auth servers; "trial or demo plugins will not be accepted", advertising is banned, and so are fields that "manipulate how the model picks among plugins". Official MCP Registry: public remote server + namespace proof, no human review, an aggregator feed rather than an end-user surface. GitHub's registry: email-based inclusion. PulseMCP submissions were paused at the time of research. Smithery scans a public URL and can use a static server card. mcp.so sells a $39 "verified/featured" placement — do not buy.
- **How tools get picked.** Name, description and argument text are what tool search indexes; Anthropic says selection degrades past about 30–50 available tools (our live count is 77, of which about 25 are bot-governance tools no buyer needs). Server `instructions` matter and are truncated around 4 KB in Claude Code. A 2026 study of 24 models found that many ignore data embedded in server instructions when a search tool exists unless the instructions are written as explicit routing rules; two other studies found 97 % of tool descriptions have a defect and that clearer purpose/accuracy statements raised selection by 9–12 points. Longer is not automatically better.
- **Peers.** HubSpot (32 tools incl. `tool_guidance`), Attio (48), Stripe (15, with a documentation-search tool), Close, monday, Pipedrive, Zoho and Salesforce all use OAuth because they expose customer data; none is a no-auth knowledge server, so none is a direct comparable. Pattern worth copying: few, generic, well-named tools; a guidance tool; a docs-search tool.
- **Standards.** Server cards are young (SEP marked final but the extension repo says experimental and names no consuming client; the canonical location differs from our `/.well-known/mcp.json`). `llms.txt` has near-zero measured AI-crawler consumption. Do not over-invest.

---

## 4. The levers, ranked by what they buy

| Tier | Lever | Why it matters | In this repo? |
|---|---|---|---|
| A | **Be true.** A verified-claims layer + a CI guard that fails when served content contains a known-false claim | A wrong answer pasted into a vendor-risk form is worse than no answer; 10–20 % of called answers were wrong | Yes — Phase 1 |
| A | **Say "no" explicitly.** Capability checks return `supported / partly / not_supported / unknown` with the caveat and a source date, never a silent zero | Silent empties cause false negatives about features we have | Phase 1 (zero-result guidance), Phase 2 (capability tool) |
| B | **Be selectable.** Fewer, better-named tools; `instructions` that route; descriptions that start with "Use this when…" and state what the tool does *not* do | 24–32 % unambiguous today | Phase 1 (instructions, zero-result hints, paging); Phase 2 (tool surface) |
| B | **Answer shape.** concise structured output, `outputSchema`, canonical URL + `as_of` + confidence on every fact, pagination, helpful errors | Assistants re-parse prose and drop caveats | Phase 1 |
| C | **Be listed, correctly.** Fix README H1, description, topics; publish npm or drop the npm links; official registry with namespace proof; Claude directory and ChatGPT submissions; claim and correct the six existing listings | Only way a user discovers it inside an assistant | Phase 1 (identity files + submission pack); humans submit |
| D | **Be measurable.** Golden prompt set (the 160 prompts, scrubbed), deterministic CI subset, monthly live run, GA4/telemetry gate | Without it every claim about MCP value is unfalsifiable | Phase 1 (harness + fixtures) |
| E | **Fix the layers assistants without our MCP read.** Website llms.txt (456 KB, positions the product as "WhatsApp-native … for Indian SMBs"), schema.org, IndexNow/Bing, third-party reviews | The only layer that can change an unconnected assistant's answer | No — `hellocrmwebsite`; listed in section 9 |

---

## 5. Target tool surface (Phase 2, needs founder agreement)

Today: 77 tools in one namespace — roughly 25 bot-governance tools (scan_website_bots, analyze_access_logs, crawl_pages, fetch_page_content, export_bot_report …) mixed with ~50 product-knowledge tools. A buyer's assistant sees both, and the server identifies itself as "Website & Bot Governance MCP".

**Recommendation:** two profiles. `/mcp` (or the default) = the **buyer/knowledge profile** of about 25 tools; the bot-governance tools move to a separate path or server (`/mcp/governance`) with their own listing. Candidate buyer profile:

| Tool | Answers | Source of truth |
|---|---|---|
| `buyer_find_answer_pages` (exists) | route a question to canonical pages and the right tool | buyer-intents |
| `buyer_get_started` (new, Phase 1 as `get_started`) | the 6 things to know + which tool next | instructions |
| `buyer_get_industry_fit` (new) | industry (52 verticals) + country + team size → what ships, what does not, setup notes, pages | #96 industry-modules + verified claims |
| `buyer_compare` (new; absorbs alternatives/switch/comparison tools) | HGC vs named competitor, by criterion, with sources | alternatives + verified claims |
| `capability_check` (new) | "does it have X?" → supported/partly/not supported/unknown + caveat + plan | verified-claims pack (from the audit) |
| `pricing_get_plans`, `pricing_estimate` (new) | plans by country; cost for N seats; discount/yearly rules; GST/VAT notes | pricing mirror + KT-10 |
| `integrations_check` (replaces 386 KB `integrations_list`) | "does it connect to X?" → live/partly/not; count = 190+ | audit (194 code-verified) |
| `trust_get_compliance` (new) | security, privacy, residency, SOC 2 wording, DPA/sub-processors, with `verified:false` flags | founder-approved wording only |
| `implementation_get_playbook` (new) | onboarding, migration, roles, timelines by scenario | help + guides |
| `countries_*`, `country_get`, `content_list_industries`, `guides_*`, `help_*`, `glossary_*` (exist) | reference | mirror |
| MCP `prompts`: `shortlist_crm`, `evaluate_hellogrowthcrm` (exists in part) | guided workflows | prompts.ts |

Design rules: names are `domain_verb_object`; every description starts "Use this when …" and ends "Does not …"; no tool tells the model to prefer HelloGrowthCRM; read-only annotations on all; `outputSchema` + a JSON text block on all.

---

## 6. Content truth policy

1. **One verified-claims record per fact:** `id`, `statement`, `status` (`true | true_with_caveat | partly | not_built | unverified`), `caveat`, `plans`, `country_scope`, `source` (KT id or code path), `verified_at`, `confirmed_by` (`code | founder | none`).
2. **Serve the caveat with the claim.** A `true_with_caveat` fact is never returned without its caveat (a standard Astra review point).
3. **Unconfirmed values carry `confirmed:false`** (annual USD $10, local-currency prices, G2/Capterra numbers, SOC 2 report).
4. **A deny list in CI** (`truth-guard`): known-false strings (Tally ERP sync, Cashfree/PayU/Paytm as gateways, scheduled/emailed reports, unlimited pipelines, SOC 2 as a certification, GST-inclusive prices, residency claims, "630 integrations") fail the build if they appear in served content. Each entry cites its KT id.
5. **Freshness stamps** per dataset; `/health` stays `degraded` when data is older than the gate; a monthly job re-syncs from the website repo. Needs repo secrets (human).
6. **No fact without a source.** If we cannot cite code, a document or a founder decision, the answer is `unverified` and says so.

---

## 7. Distribution plan (humans submit; nothing here is done by code)

| Order | Action | Prerequisite | Owner | Notes |
|---|---|---|---|---|
| 0 | Fix identity in repo: README H1/lede, `package.json` description, `server.json`, GitHub About + topics | Phase 1 PR | engineer | removes "mcp-bot-crawler" framing for scrapers |
| 1 | Deploy `main` (2.1.0+); run mirror sync; `/health` back to `ok` | repo secrets `WEBSITE_REPO_TOKEN`, `WEBSITE_REPO` | maintainer | pricing is already live-correct |
| 2 | Decide npm: publish a correctly named package, or remove npm links from listings | founder | founder | `mcp-bot-crawler` is wrong for a buyer-facing server |
| 3 | Official MCP Registry | namespace proof (`io.github.merulocal` via GitHub, or DNS) | maintainer | feeds aggregators; not an in-Claude surface |
| 4 | Claim and correct Glama, MCP.so, LobeHub, mcpservers.org, MCP Market; request removal of the second mcpservers.org page | corrected README + listing copy (Phase 1 pack) | marketing | fix the false "CRM data access" claim |
| 5 | Smithery (static server card at `/.well-known/mcp/server-card.json`), Cline, Cursor Directory, Portkey, Speakeasy, Continue, Composio | npm decision, `/mcp` alias verified | marketing | free only |
| 6 | **Claude connectors directory** | titles + annotations (done), accurate descriptions, test account not needed (no auth), neutral non-promotional framing | founder + engineer | the only in-chat discovery path for Claude |
| 7 | **ChatGPT apps portal** | domain verification file, 5 positive + 3 negative test cases, privacy/ToS/support URLs, demo video | founder + engineer | real risk of rejection as "promotional"; position as a *CRM buyer's guide* with neutral comparison data |
| 8 | GitHub MCP registry | official registry listing; email partnerships | founder | |
| — | Do not pay for placements; do not run a 26-directory campaign | | | the repo's GEO plan already descoped it |

---

## 8. Measurement

- **Golden prompt set** (the 160 prompts, scrubbed of nothing sensitive) with expected tool(s) and the facts that must / must not appear. Stored as fixtures (`src/eval/prompts.json`).
- **Deterministic CI subset:** every prompt group has at least one tool whose description contains the group's intent words; every `must-not` string is absent from every tool's output; no tool returns an empty answer without guidance.
- **Monthly live run** (`npm run eval:live`, needs a network and a model; not CI): the same method as 2.1, outputs the table in 2.1.
- **Targets (proposed):** ≥ 70 % unambiguous tool choice; ≥ 80 % usable (complete+partial) on the core groups; 0 known-false facts; ≥ 6 correctly described listings; Claude directory submission accepted.
- **Telemetry gate (from GEO plan W3.3):** enable the GA4 events; if 7-day AI-client tool calls stay at zero, stop treating MCP distribution as an acquisition channel and cut Phase 3.

---

## 9. What is outside this repo but moves the needle more

1. `hellogrowthcrm.com/llms.txt` is 456 KB and opens with "WhatsApp-native AI CRM … built for Indian SMBs"; the founder's target is mostly outside India and a 2026-09 audit corrected the positioning to "not WhatsApp-first". Replace with a short, accurate, country-aware file generated from the same verified-claims pack.
2. Website pages still advertise items the code does not do (50 of the 137 team-listed "do not claim" items; see the Verdict_Overrides sheet). An assistant that reads the site repeats them.
3. IndexNow and Bing Webmaster verification (GEO plan W1.2/W1.3) gate ChatGPT citation.
4. Third-party corroboration (G2, Capterra, review sites, community threads) is what answer engines rely on for "best CRM" recommendations; a connected MCP does not substitute for it.
5. Country-aware server card and schema.org `SoftwareApplication` + `Offer` consistent with the MCP's pricing.

---

## 10. Roadmap and decisions

| Phase | Content | Needs |
|---|---|---|
| **1 (PLAN-HELLOG-0003 build)** | server `instructions`; `get_started`; zero-result guidance; paged/shipped-only integrations; UTM; truth fixes + truth-guard; identity files + submission pack; eval harness + fixtures | this review |
| 2 | verified-claims pack as data; `capability_check`, `buyer_get_industry_fit`, `buyer_compare`, `trust_get_compliance`, `implementation_get_playbook`, `pricing_estimate`, `integrations_check`; profile split (buyer vs governance); resolve #95/#96 merge | founder: tool-surface split; SOC 2 wording; annual USD; local-currency prices; public roadmap policy |
| 3 | register/submit (human); monthly live eval; telemetry gate; country-aware server card | founder: npm name; directory submissions |
| Separate, urgent | security: `analytics_social_proof` emails, `robotsTxtPath` file read, SSRF rebinding, transport hardening (G1–G4 from the merge-train review) | maintainer; its own PR |

**Founder decisions needed:** (1) split bot-governance into its own server/profile? (2) SOC 2 wording: remove, or "Type II examination, report under NDA" everywhere? (3) npm: publish under a buyer-facing name or drop it? (4) approve submitting to Claude's directory and ChatGPT with a neutral buyer-guide framing; (5) annual USD price, local-currency prices; (6) public roadmap policy (what we may say is "planned").

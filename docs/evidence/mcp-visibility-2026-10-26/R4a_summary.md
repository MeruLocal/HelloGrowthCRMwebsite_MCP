# R4a - Could an AI assistant answer buyer questions from the live HGC MCP? (2026-10-26)

Server: `https://mcp.hellogrowthcrm.com/sse`, 76 tools, 9 resources, serverInfo "Website & Bot Governance MCP". The assistant sees only the tool list. 80 prompts were written; 40 were run for real (40 of 40 call budget, anonymous, read-only; `analytics_social_proof` and all writers untouched). Judged against `known_truths.md` (KT-n) and the lenient claim verdicts in `reclass_all.json`.

Data: `R4a_prompts.json` (80 records). Raw responses for the 40 calls: `R4a_raw_calls.json`.

## Headline

| Measure | Result |
|---|---|
| Tool choice UNAMBIGUOUS | 26 / 80 = **32.5%** (AMBIGUOUS 47 = 58.8%, NO_TOOL 7 = 8.8%) |
| Answer COMPLETE (of 40 called) | 1 / 40 = **2.5%** |
| PARTIAL (usable but thin or unverified) | 11 / 40 = 27.5% |
| WRONG (contradicts verified truth) | 8 / 40 = **20%** |
| EMPTY (error or zero results) | 20 / 40 = 50% |
| Unambiguous AND called | 15 calls gave 1 COMPLETE, 4 PARTIAL, 4 WRONG, 6 EMPTY. Picking the right tool does not make the answer right. |

Caveats. (1) No retries were allowed by the 40-call cap, so 5 of the 20 EMPTY results (A03, A20, B26, B29, C48) were recoverable argument-format misses; the error text lists valid values and a real assistant would likely retry. Even so, only about 15/40 would then be EMPTY and the COMPLETE rate stays below 10%. (2) The 40 were stratified across groups but not random; group A deliberately probed unsupported countries and industries. (3) The 40 non-called prompts are labelled PREDICTED and are not scored.

## Coverage by group

| Group (n) | Unambiguous | Ambiguous | No tool | Called | COMPLETE | PARTIAL | WRONG | EMPTY |
|---|---|---|---|---|---|---|---|---|
| Best CRM for industry in country (20) | 0 (0%) | 15 | 5 | 8 | 0 | 1 | 0 | 7 |
| Pricing / plans / currency (15) | 9 (60%) | 5 | 1 | 8 | 0 | 2 | 3 | 3 |
| Competitors (15) | 3 (20%) | 11 | 1 | 5 | 0 | 2 | 0 | 3 |
| Does it have feature X (15) | 7 (47%) | 8 | 0 | 8 | 0 | 3 | 1 | 4 |
| Integrations (10) | 6 (60%) | 4 | 0 | 6 | 1 | 2 | 3 | 0 |
| Trust / compliance (5) | 1 (20%) | 4 | 0 | 5 | 0 | 1 | 1 | 3 |
| **Total (80)** | **26 (32.5%)** | 47 | 7 | 40 | 1 | 11 | 8 | 20 |

Reading it: the server is built to mirror website pages, not to answer "which CRM fits me". Group A has no tool that returns a recommendation at all. Pricing and integrations are the only groups where the tool choice is usually clear, and those are exactly where the wrong facts sit (3 of 8 pricing calls and 3 of 6 integration calls were WRONG).

## The 10 most damaging wrong or stale facts (served as plain fact to a buyer)

1. **India monthly price Rs 1,099/user** (`pricing_get_plans region=india`, Growth `price_monthly`). KT-10: Rs 899/user/month + 18% GST in both billing modes. Rs 1,099 is a figure the site's own pricing guard lists as retired.
2. **"All India prices include GST."** (`pricing_get_faq search=GST`). KT-10: Rs 899 **plus** 18% GST. A buyer budgets 18% too low.
3. **USD monthly $13/user** (`pricing_get_plans region=global`). KT-10: $12/user/month (founder-confirmed 2026-10-13); annual $10 unconfirmed. $13 is also retired.
4. **"HelloGrowthCRM is SOC 2 Type II ... daily backups in US data centers."** (`faqs_get_site search=SOC 2`). KT-12: SOC 2 report unverified; claims audit says remove until the report is obtained. The "US data centers" line also reads as a residency statement to Indian and EU buyers, and `help_search` has nothing on DPDP, GDPR or residency (count 0).
5. **Tally accounting integration** - "Imports or exports ledger-aligned customer and invoice data with TallyPrime / Tally ERP ... for Indian GST compliance" (`integrations_list search=tally`). Claims audit: FALSE; only Tally.so forms exist. High harm for Indian accountant and SME buyers.
6. **Field Operations "route planning"** listed for tiers t2/t3 (`features_list search=field sales`). KT-6: Field Sales / Sales Planning exists only for workspaces with the agri_inputs flag, not tenant-toggleable.
7. **SAP Business One "status: live"** (`integrations_list search=sap`, which also returns 10 WhatsApp-related entries because "sap" is a substring of "WhatsApp"). KT-6: SAP connector defaults off (simulation mode); no S/4HANA entry.
8. **Shopify "Syncs customers, products, orders, abandoned carts, and order history."** Feature truth row 158: read-only app install with products syncing in; the settings card is instructions only.
9. **Plan bullets that overclaim**: Enterprise "Unlimited exports + scheduled reports" (KT-5: no user-configurable scheduled or emailed reports); Growth "Territory & team management with map view" (claims audit: map view FALSE); Growth "Built-in dialer" while `pricing_get_addons` charges $15-49 or Rs 799-2,499 per user for dialer tiers (internal contradiction, unverified either way).
10. **Integration and API counts contradict each other**: plans say "API access & all 630 integrations", `features_list` says "API & Integrations - 90 integrations", the lenient claim fix says "250+". Nothing says the REST API sits behind the `integrations_v1` flag (default off) or lacks invoice and quote endpoints (KT-2).

Also flagged, not ranked: 6 named testimonials ("70% cost reduction vs HubSpot", "3x deals") carry only an "illustrative" disclaimer and no third-party review link; "50% off Growth for nonprofits" is unverified; the Enterprise `cta_url` embeds a booking token; integrations were synced 2026-06-17 (131 days old) and alternatives, FAQ and testimonials 2026-07-08 (110 days old).

## Tool descriptions and schemas that cause mis-selection

| Tool | Wording or schema problem | Observed effect |
|---|---|---|
| `country_get` (`code`), `pricing_get_country_plans` (`country`) | Untyped string; text says "country code" / "8 market hubs", but only slugs `in, usa, uk, au, canada, uae, singapore, new-zealand` work. ISO codes (US, AE, SA, NG) fail. | 6 of 6 calls errored (2 were ISO-code format misses, 4 were countries with no hub). |
| `pricing_compare_plans` (`plan_a`, `plan_b`) | No enum; plan names are case-sensitive slugs. | "Free" rejected. |
| `content_list_case_studies` (`industry`) | Free string; only 7 exact names are valid; "Returns all industries if no filter" suggests broader coverage. | 3 of 3 calls errored (clinics, solar, accountants). |
| `content_list_industries` | "List all industry vertical pages" returns 20 bare name+URL rows; the site has about 446 industry pages. | Group A tops out at a link. |
| `alternatives_list` / `alternatives_get` | "All competitor alternative pages" omits Kylas, Odoo and Bitrix24. `switch_*` has Kylas and Bitrix24, `content_get_comparison` lacks Odoo. Slugs differ (`zoho` vs `zoho-crm`, `monday-crm` vs `monday-com`). Four overlapping tools: alternatives, comparison, switch, agent comparisons. | Kylas and Odoo prompts EMPTY; 11 of 15 competitor prompts AMBIGUOUS. |
| `features_list` | "List all HelloGrowthCRM product features" is the marketing subset; plan filter `free/t1/t2/t3` is never mapped to Free/Growth/Enterprise. | AI calling, offline, payroll and vendor portal all return `total: 0`; zero cannot be told apart from "not built". |
| `integrations_list` | Advertises "630 documented entries"; substring search; most entries have no `status`, direction or entities. | SAP search returns WhatsApp noise; Tally and Shopify overclaim. |
| `pricing_get_faq` | Keyword match on a tiny FAQ; "GST" returns the payment-methods answer. | Wrong GST answer. |
| `pricing_get_managed_revops` vs `solutions_get_managed_revops` | Two tools for one service. | Duplicate surface. |
| `solutions_list_whatsapp_use_cases` | Says messages go via `wa.me` deep links, while integrations list the Cloud API. | Conflicting WhatsApp answers (predicted). |
| `faqs_get_site` / `help_search` | "Covers ... security" but the programmatic FAQ directory is empty and compliance searches return 0. | GDPR, DPDP and residency EMPTY. |
| Server surface | About 19 of 76 tools are bot-governance or SEO-ops tools (`scan_website_bots`, `analyze_access_logs`, `generate_robots_txt`, `seo_get_*` and similar), plus `newsletter_get_stats` and `analytics_social_proof`. | Noise for buyer questions; serverInfo says "NOT a CRM API". |

## Missing tool types, ranked by prompts fixed (of 80)

| Rank | Missing tool or field | Prompts fixed | Notes |
|---|---|---|---|
| 1 | `industry_fit_profile(industry, country)` over all about 446 industry pages, with modules, known gaps, pricing, case studies | **20** (all of group A) | KT-14 gaps (no solar vertical, clinic without session packages, NGO configuration-only) should be stated, not hidden. |
| 2 | Verified feature and integration status layer: `feature_status(query)` returning live, limited, beta, gated or not_built, plus plan and caveat; `status`, direction and entities on every integration | **26 unique** (17 feature, 9 integration; 4 of the 8 WRONG answers) | Fixes both the false positives (Tally, SAP, Shopify, Field Ops) and the silent zeros (AI calling, offline, payroll, vendor portal). |
| 3 | `competitor_compare(competitor)` with structured rows and prices, covering Kylas, Odoo, Bitrix24, Zoho, Close | 15 | Today only marketing blurbs. |
| 4 | Pricing single source of truth: GST flag, monthly vs annual, retire $13 and Rs 1,099, mark unconfirmed currency rows | 14 | A data fix more than a new tool; fixes 3 WRONG answers. |
| 5 | `market_availability(country)` for any country with USD fallback, payment methods, support hours | 9 | Saudi, Nigeria, Kenya, Malaysia, Philippines, Indonesia and South Africa all dead-end. |
| 6 | `trust_center(topic)`: verified certifications, residency, sub-processors, DPA, DPDP/GDPR | 5 | Replaces the unverified SOC 2 FAQ with a sourced answer. |
| 7 | Tolerant arguments (ISO codes, case-insensitive plans, slug aliases, enums in schema) | 7 | Cheap; recovers 5 of 20 EMPTY results. |
| 8 | `api_capabilities()` (entities, scopes, webhooks, flag state) | 1 | Plus a `reviews_summary()` with third-party sources (1). |

Overlap: a prompt can need more than one fix, so the counts do not sum to 80. Three prompts (free plan, refund/trial, IndiaMART) needed none.

## Recommended order

1. Correct the pricing payloads and the GST FAQ now (items 1-3 above); these are the only wrong facts that directly misquote a number a buyer will pay.
2. Pull the SOC 2 sentence and the Tally, SAP, Shopify and Field Operations claims, or add a `status` field so an assistant can hedge.
3. Build the industry profile tool and a feature status tool; they remove the two largest failure clusters (EMPTY on group A, silent zeros in group D).
4. Fix the argument schemas (enums and aliases) so a correct tool choice is not lost to a slug mismatch.

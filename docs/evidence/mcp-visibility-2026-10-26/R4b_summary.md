# R4b - Buyer-question coverage of the live public MCP (run 2 of 2: long-form, agentic, multi-step)

Server: https://mcp.hellogrowthcrm.com/sse, 76 tools, read-only anonymous, tools synced 2026-06-11 to 2026-08-06.
Judged against: known_truths.md (KT-1..KT-16) and reclass_all.json. Prompts and per-prompt verdicts: `R4b_prompts.json` (80 rows).

## Method and call accounting
- 80 prompts written (15 shortlist/RFP, 15 implementation, 10 procurement/risk, 10 ROI, 10 agent-native, 10 regional, 10 edge). Each is a multi-part ask ("build a table", "write a plan", "tell me what you could not verify"), not a single-fact lookup.
- Tool choice made from the tool list only. 40 prompts then got exactly one real call each (40 distinct successful calls, no write tools, `analytics_social_proof` never called). Rows with `called:false` carry a clearly marked "PREDICTED (not called)" note and are not counted in quality rates.
- Rate limit: the first batch was rejected after about 16 rapid requests (23 further attempts returned a plain-text body starting "Rate limit", not JSON-RPC, which breaks any strict client). I waited 65 s, opened a new session, paced calls at 4 s, and re-ran only the rejected ones. Rejected attempts returned no data; the 40 judged calls are the ones that returned content.
- `c40` (`features_list{}`) is the call for the "feature-by-plan matrix" prompt and doubled as the catalogue probe that explained why every niche `features_list(search=...)` came back empty.

## Headline numbers
| Measure | Result |
|---|---|
| Tool selection UNAMBIGUOUS | 19 / 80 = 24% |
| AMBIGUOUS (2+ plausible tools) | 47 / 80 = 59% |
| NO_TOOL (nothing can supply the core fact) | 14 / 80 = 18% |
| Called answers COMPLETE | 3 / 40 = 8% |
| PARTIAL (usable but needs more calls or has gaps) | 19 / 40 = 48% |
| WRONG (contradicts verified truth) | 4 / 40 = 10% |
| EMPTY | 14 / 40 = 35% |
| "Usable" (COMPLETE + PARTIAL) | 22 / 40 = 55% |

## Coverage by group
| Group | n | UNAMB | AMB | NO_TOOL | called | COMPLETE | PARTIAL | WRONG | EMPTY |
|---|---|---|---|---|---|---|---|---|---|
| Shortlist / RFP table | 15 | 1 | 13 | 1 | 7 | 0 | 5 | 1 | 1 |
| Implementation planning | 15 | 2 | 12 | 1 | 6 | 0 | 4 | 0 | 2 |
| Procurement and risk | 10 | 2 | 4 | 4 | 6 | 0 | 4 | 1 | 1 |
| ROI / business case | 10 | 4 | 5 | 1 | 5 | 0 | 3 | 2 | 0 |
| Agent-native | 10 | 1 | 3 | 6 | 5 | 1 | 1 | 0 | 3 |
| Regional / local | 10 | 2 | 7 | 1 | 5 | 2 | 2 | 0 | 1 |
| Edge | 10 | 7 | 3 | 0 | 6 | 0 | 0 | 0 | 6 |
| ALL | 80 | 19 | 47 | 14 | 40 | 3 | 19 | 4 | 14 |

Reading it: the server is a good catalogue lookup (list agents, list countries, Singapore payment methods = COMPLETE) and a poor answer engine for multi-step buyer asks. Not one shortlist, implementation, procurement or ROI prompt was answered completely by a single call. All six "can it do X?" edge probes returned EMPTY.

## The 10 most damaging wrong or stale facts
1. **GST included (WRONG).** `pricing_get_faq(search=gst)`: "All India prices include GST." KT-10: INR 899/user/month **plus** 18% GST. Every India budget built from this is 18% low.
2. **India monthly price (WRONG).** `pricing_get_plans(india)` and `country_get(in)`: Growth monthly "₹1,099/user/month". KT-10: INR 899 on both billing modes (annual = 10 months paid). Overstates monthly by 22%, and the annual line shows no GST.
3. **US monthly price (WRONG).** `pricing_get_country_plans(usa)`: "$13/user/mo monthly". Founder-confirmed (KT-10): $12/user/month monthly. Annual "$10" is also unconfirmed.
4. **SOC 2 claim (WRONG/unsupported).** `pricing_get_country_plans(usa)`: compliance "SOC 2 Type II, CCPA compliant". KT-12: SOC 2 report is unverified. This is the sort of line that gets pasted into a vendor risk form.
5. **Scheduled reports (WRONG).** `pricing_get_plans(india)` Enterprise: "Unlimited exports + scheduled reports". KT-5: no user-configurable scheduled or emailed reports exist (only a fixed owner digest behind a flag). `features_list` then lists "Weekly KPI Report" (a human-delivered Managed RevOps item) as a t2/t3 feature.
6. **Field Operations on paid tiers (WRONG).** `features_list{}`: `field-operations` t2:true, t3:true. KT-6: Field Sales is available only to agri_inputs workspaces. Also `api-integrations` = "90 integrations" vs 630 documented elsewhere, and Growth lists "API access" although the public REST API sits behind `integrations_v1` (default off, KT-2).
7. **Silent false negatives.** `features_list(search=sso | payroll | instagram | e-invoice | insurance | transcription | scheduled report)` all return `total: 0` with no "not supported" signal. A buyer's agent will say "no SSO/MFA" (KT-12 says both exist), "no payroll" (KT-7: partial, no Form 16), "no Instagram" (KT-4: DM inbox and comment tools exist, no auto-reply). The catalogue holds only 58 coarse rows and no security, payroll or social entries.
8. **MCP / agentic over-claims.** `agents_list_comparisons`: "HelloGrowthCRM delivers ... voice agents, MCP support" and "equivalent agentic AI capability". CRM-action MCP is draft/gated; this server itself says it is "NOT a CRM API". Also `integrations_list` says "630+ total apps reachable incl. Zapier" while no Zapier/Make/n8n directory listing exists yet. API/webhook questions return nothing true: KT-2's outbound `invoice.*`/`quote.*` webhooks and the REST entities are absent.
9. **Contract-grade claims with no source.** "SLA-backed 99.9% uptime" (Enterprise bullet only), "India data residency available", "ICO-registered data processor", "UAE PDPL compliant". None is marked verified, none has a document, and the Growth plan has no SLA at all in the data.
10. **Unconfirmed local-currency prices served as fact.** AED 37/48, GBP 8/10, SGD 14/18, NZD, CAD, AUD from a 2026-08-06 mirror that KT-10 labels unconfirmed; the response carries a `synced_at` but no `confirmed:false`. Also `features_list` tiers t1/t2/t3 are the Managed RevOps ladder (Software Only / Growth Engine / RevOps Partner), which contradicts the Free/Growth/Enterprise ladder the pricing tools state.

Honourable mentions: `solutions_list_whatsapp_use_cases` says the composer sends "wa.me deep links" (understates KT-16: AI auto-reply and Flows); `country_get` for UAE and UK resolves support to the US office (Mon-Fri ET); `features_list` `learnMoreHref` is wrong for several rows (dashboard -> /product/crm-dialer, customer-portal -> /product/customer-health-score).

## Tool descriptions and behaviours that cause mis-selection
| Tool / text | Why it misleads |
|---|---|
| `features_list` "List all HelloGrowthCRM product features... plan: free, t1 (Software Only/Starter), t2 (Growth Engine), t3 (RevOps Partner)" | Reads as the full catalogue and the plan ladder. It is 58 coarse rows mixing software with managed-service deliverables; a miss means "not in this list", not "unsupported". |
| `pricing_get_plans` "Free Forever -> Growth -> Enterprise in every market" vs `features_list` t1/t2/t3 | Two incompatible plan taxonomies; an agent cannot build a Free/Growth/Enterprise matrix from the catalogue. |
| `help_search` "Full-text search" | Multi-word queries return 0 ("import contacts excel"), "api" matches WhatsApp Business API articles, "webhook" returns 0. Not full-text. |
| `faqs_get_site` "17 Q&A pairs covering ... security ... imports" | `search=security` returns 0 items; the description promises coverage the search cannot reach. |
| `alternatives_*`, `content_*_comparisons`, `switch_*`, `agents_list_comparisons` | Four overlapping "competitor" families (42 / 16 / 26 / 4 rows) with different slugs for the same rival; none returns pricing or a feature matrix. `content_get_comparison` says "metadata" only. |
| `switch_list_competitors` | Lists excel, hubspot, tally, whatsapp as migration pages but `has_guide_data:false`; the most common source systems have no guide. |
| `agents_list` description names "MCP Connector" | Slug is `mcp`; `agents_get("mcp-connector")` errors (recoverably, lists valid slugs). |
| `pricing_get_addons` "India AI credit top-up bundles" | Sounds like AI-calling minutes; it is generic credits. No AI-calling minute price exists (KT-15: contact us). |
| `pricing_get_managed_revops` vs `solutions_get_managed_revops` | Both "Managed RevOps pricing"; KPIs sit in one and prices in the other. |
| `partners_get_program` | Referral commission program, not implementation partners. |
| `integrations_list` "630+ total apps reachable incl. Zapier" | Implies a listed Zapier app and 630 working connectors. |
| `generate_llms_txt` / `check_llms_txt` | Descriptions carry internal ops commentary ("the live llms-full.txt is currently smaller than llms.txt"); the first 13 tools in the list are bot-governance utilities irrelevant to a buyer, burying the buyer tools. |
| `country_get.contact` | Falls back to US support for UAE, UK, etc. with no flag that no local office exists. |

## Missing tool types, ranked by prompts fixed (of the 80; counts are prompts that were AMBIGUOUS/NO_TOOL or non-COMPLETE)
| Rank | Missing tool type | Prompts fixed | What it must return |
|---|---|---|---|
| 1 | **Implementation playbook** (`implementation_get_playbook(source_system, users)`) | 13 | Phases, durations, roles/permissions, import field spec and limits, dedupe, integration setup steps; guides for Excel, HubSpot, Tally. |
| 2 | **Comparison / shortlist matrix** (`compare_build_matrix(vendors, criteria, country)`) | 11 | Per-criterion status with source and `verified_at`, including rivals' published prices and our explicit gaps. |
| 3 | **Capability check** (`features_check_capability(capability)`) | 9 | `native / plan_gated / flag_gated / integration / roadmap / not_supported`, plan, source; explicit negatives plus nearest alternative. This is the fix for the silent false negatives and has the highest damage per prompt. |
| 4 | **Quote and ROI calculator** (`pricing_calculate_quote`) | 9 | Seats x billing mode x region x add-ons -> subtotal, GST/VAT, total, payback; AI-calling minutes as price or "contact us". |
| 5 | **Developer / API reference** (`developer_get_api_reference`, webhooks, MCP status) | 9 | Auth, scopes, entities, rate limits, sample payloads, `invoice.*`/`quote.*` webhook events, flag status, sandbox answer, Zapier/Make triggers and actions. |
| 6 | **Regional compliance** (`regional_get_compliance(country, topic)`) | 9 | Tax treatment (GST e-invoice, VAT rate), UI languages vs SEO languages, gateways, WhatsApp number rules, consent law, local support office. |
| 7 | **Trust centre** (`security_get_trust_center`) | 6 | Verified certifications only, data locations, DPA, sub-processors, SLA by plan, support hours by plan, status page. |
| 8 | **Legal policies** (`legal_get_policies`) | 4 | Refund, cancellation, contract term, data export on exit, GST invoice, contracting entity by country with GSTIN/CIN. |
| 9 | **Human hand-off** (`human_handoff` / sales contact options) | 2 | Coupon, custom quote, security-document requests, with a local-hours contact. |

Data fixes that need no new tool (highest value first): remove "include GST" from the pricing FAQ and add "+18% GST"; set India monthly to 899; set US monthly to 12; delete or verify "SOC 2 Type II"; remove "scheduled reports" from Enterprise or qualify it; remove or gate `field-operations`; make empty `features_list` results say "not in catalogue, try X"; mark local-currency prices `confirmed:false`; replace `t1/t2/t3` with the pricing ladder; fix `help_search` to match any word; add a `synced_at`/`as_of` to FAQ responses.

## Caveats
- 40 of 80 prompts were called once each; a real assistant would chain 2-4 calls, so PARTIAL rows may reach COMPLETE with more calls, but the WRONG and EMPTY rows would not.
- Competitor facts were not verified here (no competitor truth file); only HelloGrowthCRM facts were judged against KT-1..KT-16.
- Items 8 and 9 rest on the server's own descriptions and on prior internal findings (MCP gating, Zapier listing status) rather than on known_truths.md alone; they are flagged as over-claim risks, not as proven false.

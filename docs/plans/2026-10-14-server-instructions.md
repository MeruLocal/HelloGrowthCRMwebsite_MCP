# Plan: server `instructions` that route agents to the right tool

**Severity:** P2 · **Effort:** S · **Server:** website MCP, `origin/main` 7312627

## Finding
- `buildServer()` (`src/server.ts:77-87`) passes no `instructions` in the server options, and `src/server-info.ts` defines none.
- An agent connecting to the public endpoint sees a flat list: 76 public tools out of 88 (measured with a local `tools/list`) across two unrelated domains, product knowledge and bot governance. Nothing tells it which tool answers "how much does HelloGrowthCRM cost" or "does it integrate with X".
- Agents guess. `fetch_page_content` on the website is a common wrong pick: it is slower, open-world and rate-limited, while the mirrored tools are exact.
- The audit script does not check for instructions.

## Proposed fix
- Add `SERVER_INSTRUCTIONS` to `src/server-info.ts`, a single source used by `buildServer`. Pass it as `new Server(info, { capabilities, instructions: SERVER_INSTRUCTIONS })`. It should be short (under ~1,500 characters), plain text, and grouped by purpose:

| Question type | Tools |
|---|---|
| Pricing / plans / cost | `pricing_get_plans` (country param), `pricing_get_country_plans`, `pricing_compare_plans`, `pricing_get_addons`, `pricing_get_faq`, `pricing_get_managed_revops` |
| What the product does | `products_list`, `product_get`, `features_list`, `features_get`, `features_list_products`, `agents_*`, `solutions_*` |
| Integrations | `integrations_list`, `integrations_get`, `integrations_list_categories` |
| Comparisons / switching | `content_get_comparison`, `content_list_comparisons`, `alternatives_*`, `switch_*` |
| Company, contact, regions | `company_get_profile`, `company_get_contacts`, `countries_list`, `country_get` |
| Learning content | `blog_*` (read), `help_*` (read), `guides_*`, `glossary_*`, `templates_*`, `media_*`, `changelog_*`, `faqs_get_site`, `content_list_case_studies`, `content_list_industries` |
| Getting started | `get_started`, added by the UTM/get_started plan. Mention it only once that lands, or land this plan second. |
| Bot governance (your own site) | `analyze_access_logs`, `scan_website_bots`, `verify_bot_identity`, `list_allowed_bots`, `list_blocked_bots`, `suggest_bot_policy`, `generate_robots_txt`, `export_bot_report` |
| Live page / GEO diagnostics | `fetch_page_content`, `crawl_pages`, `check_ai_extractability`, `validate_sitemaps`, `generate_llms_txt`, `check_llms_txt` |

- Add rules to the instructions:
  1. Prefer the mirror tools over live fetches for HelloGrowthCRM facts.
  2. Quote prices exactly as `pricing_get_plans` returns them, with the currency and tax note, and never convert them.
  3. Data carries `synced_at`, so report it when freshness matters.
  4. This is not the CRM API: no customer data, never send credentials.
- Generate the tool lists from the registry (`toolsByName` plus name prefixes) rather than hand-writing them, so they cannot drift (CLAUDE rule: derive counts live). A test fails if a public tool falls into no group.

## Tests to add
- `src/__tests__/server-instructions.test.ts`:
  - `initialize` (in-process client and server pair) returns `instructions`.
  - Every public tool name appears in exactly one group.
  - The instructions contain no privileged tool names and no price figures.
  - Length is under 2,000 characters.

## Risks / rollout
- None functional. Clients that ignore `instructions` are unaffected.
- Founder decision: the wording of the pricing rule. This plan does not change any price.

## Not checked
- How the various clients (Claude, ChatGPT, Cursor) surface `instructions`.
- Real tool-selection accuracy, which would need an mcp-bench-style eval (see skill §4).

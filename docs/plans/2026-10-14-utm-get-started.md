# Plan: UTM-tag own-site URLs and add a `get_started` tool

**Severity:** P1 (corrected 2026-10-14: skill §4 V1/V2 rate missing UTM and a missing conversion tool P1). Re-measured with the new script: `WARN X.utm`, with 0 of 3 URLs in the `pricing_get_plans` output tagged. `X.conversion_tool` passes only on a name heuristic (`company_get_contacts`); there is still no `get_started` tool. · **Effort:** M · **Server:** website MCP, `origin/main` 7312627

## Finding
- Tools return many hellogrowthcrm.com URLs: product pages, comparisons, pricing, country hubs and resources (`src/server.ts:175-205`). A grep finds 81 literal `https://hellogrowthcrm.com…` occurrences in non-test `src/**/*.ts`, plus URLs built from `routePrefix`/`pricingHref` in `src/data/website-mirror.ts`.
- None of them carry attribution, so traffic from AI agents is invisible in GA4/Ahrefs and lands as direct or referral.
- There is no single "how do I sign up / see a demo" answer. The URLs exist but are scattered:
  - signup: `https://app.hellogrowthcrm.com/signup` (`src/tools/pricing.ts:54`)
  - demo: `https://app.hellogrowthcrm.com/book/hellogrowthcrm-app-free-demo` (`pricing.ts:121`)
  - contact: `https://hellogrowthcrm.com/contact` (`src/server.ts:286`)
  - per-country pricing: `pricingHref` (`website-mirror.ts:315-355`)

## Proposed fix
1. **`src/lib/utm.ts` with `withUtm(url, toolName)`.**
   - Only for hosts `hellogrowthcrm.com` and `*.hellogrowthcrm.com`, excluding `mcp.`.
   - Append `utm_source=mcp&utm_medium=ai_agent&utm_campaign=<tool_name>`.
   - Preserve existing query strings and `#fragment`. Never override an existing `utm_*` parameter.
   - Leave external URLs (competitors, YouTube, partners) untouched.
2. **Apply it centrally, not per tool.**
   - In `buildServer`'s `tools/call` handler, post-process the result. For each text content block that parses as JSON, walk string values and tag own-site URLs. For non-JSON text, run a URL regex replace.
   - Apply the same to resource reads, with campaign = resource name.
   - One choke point means new tools are covered automatically.
   - Skip the tag for `canonical`, `hreflang` and `sitemap` values returned by the `seo_*` tools and `generate_robots_txt` / `generate_llms_txt`. Those must stay canonical; keep an exclusion list of keys and tools.
3. **New tool `get_started`.**
   - Tools have no server-wide prefix, only per-domain prefixes, so the name is `get_started`.
   - Read-only and closed-world. Add it to `READ_ONLY_CLOSED` in `annotations.ts`.
   - Input: optional `country` (from `countries_list` codes).
   - Returns: `signup_url`, `demo_url`, `contact_url`, `pricing_url` (the country's `pricingHref`, or the global `/pricing` if that path exists in the mirror), all UTM-tagged with campaign `get_started`, plus a one-line call to action.
   - Use only URLs already in the repo. If a URL is not known, omit it and say so. Never invent paths.
   - Return no price figures. Point to `pricing_get_plans`.
   - Update the counts: `registry.test.ts`, the `annotations.test.ts` lists, and the `/version` and README counts (derived, not hard-coded).

## Tests to add
- `src/lib/__tests__/utm.test.ts`: own host, `app.` subdomain, an existing query, a fragment, an existing `utm_source` left alone, an external URL left untouched, `mcp.` excluded.
- An integration test: `pricing_compare_plans` or `content_get_comparison` output URLs carry `utm_campaign=<tool>`, and `seo_get_canonical` output does not.
- `get_started` test:
  - All URLs are own-host and tagged.
  - No currency symbols or digits followed by `/user`.
  - An unknown country falls back to the global URLs.

## Risks / rollout
- Tagged URLs shown to users are longer.
- Some AI clients strip query strings. That is harmless.
- Make sure no URL used as an identifier (canonical, sameAs, schema `@id`) gets tagged. That is why the exclusion list exists.
- Founder decisions:
  - whether `app.hellogrowthcrm.com` links should be tagged (recommended yes)
  - the CTA wording
  - Prices are out of scope and are not touched.

## Not checked
- That the signup, demo and contact URLs resolve. The sandbox cannot reach the website. Verify with `curl -o /dev/null -w "%{http_code}"` before merging (skill §1).

# MCP ↔ Website Alignment Audit & Implementation Report

**Date:** 2026-06-04
**Repos:** `hellocrmwebsite` (website, source of truth) · `HelloGrowthCRMwebsite_MCP` (MCP server)
**Direction applied:** Update the **MCP server to mirror the website**. The website codebase was **not modified**.

---

## Key architectural finding

The website is a Next.js static site (1,419 `page.tsx` routes, `force-static`) whose SEO/content
source of truth lives in `src/lib/*.ts` + Supabase. It does **not** consume the MCP server.
The MCP server is a downstream read-mirror for LLM clients and was missing entire data categories
and had drifted on pricing. All work below brings the MCP into alignment with the website.

---

## Step 1 — Website codebase audit

| Website Area | File / Route | Data Needed | Current Data Source | Issue |
|---|---|---|---|---|
| Country hubs | `/in,/usa,/uk,/au,/canada,/uae,/singapore,/new-zealand` | currency, locale, cities, tax/compliance | `lib/country-industry-categories.ts` | Absent from MCP |
| Country pricing | `lib/pricing-{usa,uk,au,canada,uae,singapore,nz,india}-data.ts` | plan names, short prices | static TS | MCP had only global/India |
| Hreflang | `lib/hreflang.ts` | tag set per path | static logic | Absent from MCP |
| Canonical | `lib/seo/site.ts` + hreflang rules | apex host, no-www, no trailing slash | static | Absent from MCP |
| Schema | `lib/seo/schema.ts` | Organization / SoftwareApplication / BlogPosting | builders | Absent from MCP |
| Company / contact | `lib/seo/site.ts`, `lib/contact-matrix.ts`, `lib/brand.ts` | legal entities, offices, sameAs, brand | static | Absent from MCP |
| Products | `lib/product-feature-pages.ts` | 25 `/product/[slug]` pages | static | Absent from MCP |
| Sitemaps | `app/sitemap-index.xml` + 9 sub-sitemaps | index + children | generated | Absent from MCP |
| Blog / Help | Supabase | posts, categories | DB | Already mirrored |

---

## Step 2 — MCP server audit

| MCP Data Category | Exists? | Latest? | Complete? | Exposed to Website? | Action Needed |
|---|---|---|---|---|---|
| Pricing | ✅ | ⚠️ global/India only | ❌ no countries | ✅ | Added country plans |
| Country pages / SEO | ❌ | — | — | — | Added |
| Hreflang / Canonical | ❌ | — | — | — | Added |
| Schema / Sitemap | ❌ | — | — | — | Added |
| Company / Contact | ❌ | — | — | — | Added |
| Products | ❌ | — | — | — | Added |
| Blog / Help / Forms / Analytics | ✅ | ✅ (live Supabase) | ✅ | ✅ | None |
| Bot-crawler tools (8) | ✅ | ✅ | ✅ | ✅ | None (untouched) |

---

## Step 3 — Website needs vs MCP data (gap closure)

All previously-missing categories were added to the MCP, sourced verbatim from the website files
and centralized in `src/data/website-mirror.ts` (with `SYNCED_AT` + provenance comments).

---

## Step 5 — Country-specific SEO status

| Country target | Currency / locale | Pricing | Canonical | Hreflang | Status (mirror) |
|---|---|---|---|---|---|
| `/in` India | INR / en-IN | ✅ | ✅ | ✅ | ✅ Good |
| `/usa` United States | USD / en-US | ✅ | ✅ | ✅ | ✅ Good |
| `/uk` United Kingdom | GBP / en-GB | ✅ | ✅ | ✅ | ✅ Good |
| `/canada` Canada | CAD / en-CA | ✅ | ✅ | ✅ | ✅ Good |
| `/au` Australia hub | AUD / en-AU | ✅ | ✅ | ✅ | ✅ Good |
| `/uae` UAE | AED / en-AE | ✅ | ✅ | ✅ | ✅ Good |
| `/singapore` Singapore | SGD / en-SG | ✅ | ✅ | ✅ | ✅ Good |
| `/new-zealand` New Zealand | NZD / en-NZ | ✅ | ✅ | ✅ | ✅ Good |
| `/crm-for-*-australia` verticals | — | n/a | ✅ | ⚠️ | ⚠️ Website bug (see below) |

**Latent website bug surfaced:** `/crm-for-*-australia` pages are excluded from the generic
`crm-for-*` hreflang handler (`lib/hreflang.ts` ~line 255) but no `-australia` handler was ever
written, so they emit `en` / `en-US` / `x-default` instead of `en-AU`. Mirrored faithfully; the
website team should add an `-australia → en-AU` handler if that targeting is intended.

---

## Files changed (MCP repo only — website untouched)

**New:** `src/data/website-mirror.ts`, `src/tools/countries.ts`, `src/tools/company.ts`,
`src/tools/seo.ts`, `src/tools/products.ts`, `test-tools.mjs`, `WEBSITE_DATA_TOOLS.md`,
`MCP_WEBSITE_ALIGNMENT_AUDIT.md`.
**Edited:** `src/tools/pricing.ts`, `src/tools/index.ts`, `src/server.ts`.

## MCP tools added (11) + resources (3)

`countries_list`, `country_get`, `company_get_profile`, `company_get_contacts`,
`seo_get_site_config`, `seo_get_hreflang`, `seo_get_canonical`, `seo_get_sitemaps`,
`seo_get_schema`, `products_list`, `product_get`, `pricing_get_country_plans`.
Resources: `site/countries`, `site/company`, `site/contacts`.

## Tests

`test-tools.mjs` — 28 assertions across the new tools. **Result: 28 passed, 0 failed.**
`npm run typecheck` and `npm run build` pass clean.

## Remaining risks / manual verification

1. **Commit from your machine** — this environment's git index was corrupted and the Windows↔Linux
   mount introduced repo-wide CRLF/LF churn, so committing here would create a garbage diff. All
   files are correct on your real disk and verified.
2. Confirm USA `growthPriceShort: "$1,500/user/mo"` in `pricing-usa-data.ts` is intentional
   (mirrored verbatim, not guessed).
3. Consider fixing the `/crm-for-*-australia` hreflang gap on the website.

## Commands

```bash
cd HelloGrowthCRMwebsite_MCP
npm run typecheck && npm run build && node test-tools.mjs
git add src/data/website-mirror.ts src/tools/countries.ts src/tools/company.ts \
        src/tools/seo.ts src/tools/products.ts src/tools/pricing.ts \
        src/tools/index.ts src/server.ts test-tools.mjs WEBSITE_DATA_TOOLS.md \
        MCP_WEBSITE_ALIGNMENT_AUDIT.md
git commit -m "Mirror website SEO/content data: country, hreflang, canonical, schema, company, products"
```

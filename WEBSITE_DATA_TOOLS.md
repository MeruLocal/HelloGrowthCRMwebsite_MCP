# Website-Mirror Tools & Resources

This MCP server doubles as a **read-mirror of `hellogrowthcrm.com`'s SEO/content
source-of-truth data** for LLM clients. The **website is the source of truth**;
the data here is a downstream copy.

All mirror data is centralized in [`src/data/website-mirror.ts`](src/data/website-mirror.ts)
with a `SYNCED_AT` date and per-block provenance comments pointing at the exact
website source files. When the website changes, re-extract the matching block and
bump `SYNCED_AT` — never hand-edit values to differ from the website.

## Tools added

| Tool | Purpose | Website source |
|------|---------|----------------|
| `countries_list` | 8 country market hubs (currency, locale, route prefix, tax ref) | `lib/country-industry-categories.ts` |
| `country_get` | Full country profile + contact + pricing summary + hreflang + canonical | same + `lib/contact-matrix.ts`, `lib/pricing-*-data.ts`, `lib/hreflang.ts` |
| `company_get_profile` | Legal entities (Soor LLC / Meru Technosoft), address, `sameAs`, brand | `lib/seo/site.ts`, `lib/brand.ts` |
| `company_get_contacts` | Regional support phone / office / hours | `lib/contact-matrix.ts` |
| `seo_get_site_config` | Canonical host, default description, brand/alternate names | `lib/seo/site.ts` |
| `seo_get_hreflang` | Exact hreflang tag set for any path (faithful port) | `lib/hreflang.ts` |
| `seo_get_canonical` | Canonical absolute URL for any path | `lib/hreflang.ts` rules |
| `seo_get_sitemaps` | Sitemap index + 9 child sitemaps | `app/sitemap-index.xml` + sub-sitemaps |
| `seo_get_schema` | JSON-LD types in use + live Organization schema | `lib/seo/schema.ts` |
| `products_list` / `product_get` | `/product/[slug]` feature pages | `lib/product-feature-pages.ts` |
| `pricing_get_country_plans` | Country-localized pricing summaries (8 markets) | `lib/pricing-*-data.ts` |

## Resources added

- `hellocrmwebsite://site/countries` — country markets with pricing summary
- `hellocrmwebsite://site/company` — company profile
- `hellocrmwebsite://site/contacts` — regional contacts

## Tests

`node test-tools.mjs` (after `npm run build`) runs 28 assertions against the
mirror tools without needing a running server.

## Known website findings surfaced during mirroring

- **hreflang gap:** `/crm-for-*-australia` pages are excluded from the generic
  `crm-for-*` handler in `lib/hreflang.ts` (line ~255) but no `-australia`
  handler was ever written, so they fall through to `en` / `en-US` / `x-default`
  instead of `en-AU`. The mirror reproduces this faithfully; the website team
  should add an `-australia` → `en-AU` handler if `en-AU` targeting is intended.

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

## Website feature-coverage tools (added 2026-06-11)

Second alignment pass: every remaining website module is now exposed as an MCP
tool. Same read-mirror policy — website is the source of truth, data blocks
carry `SYNCED_AT 2026-06-11` provenance comments.

| Tool | Purpose | Website source |
|------|---------|----------------|
| `integrations_list` / `integrations_get` / `integrations_list_categories` | Full 397-entry integrations catalog (55 categories) incl. route aliases | `lib/integrations-catalog-data.ts`, `lib/generated-integrations-report-catalog.ts`, `lib/integration-routes.ts` |
| `agents_list` / `agents_get` | 12 Agentic-AI agents (voice, post-call, deal-risk, MCP + 8 alias pages) | `views/agentic/*.tsx`, `app/(public)/agentic-ai/[slug]/page.tsx` |
| `agents_get_autonomy_levels` | 3 autonomy levels, 9-row capability matrix, safety rails | `views/agentic/AutonomyLevelsPage.tsx` |
| `agents_list_comparisons` | vs Agentforce / Breeze / Zia / Copilot positioning | `views/agentic/Vs*.tsx` |
| `glossary_list_terms` / `glossary_get_term` | 44 CRM glossary terms | `lib/glossary-data.ts` |
| `templates_list` / `templates_get` | 42 downloadable templates, 7 categories | `lib/templates-data.ts` |
| `guides_list` / `guides_get` | 32 feature guides | `lib/feature-guide-data.ts` |
| `alternatives_list` / `alternatives_get` | 42 competitor/alternatives pages incl. WhatsApp-CRM detail | `lib/alternatives-shortlist.ts`, `lib/wa-alternatives-data.ts`, `app/(public)/*-alternative` |
| `switch_list_competitors` / `switch_get_guide` | 26 switch-from migration pages (22 with full guide data) | `lib/switch-data.ts` |
| `changelog_list_releases` / `changelog_get_release` | 6 product releases, 7-tag taxonomy | `lib/changelog-curated.ts`, `lib/changelog-types.ts` |
| `faqs_get_site` | 17 site-level FAQs + FAQ category labels | `lib/site-faqs.ts`, `lib/faq-data.ts` |
| `media_list_videos` | Seeded YouTube product videos (`/videos`) | `lib/home-youtube-videos.ts`, `lib/youtube-videos.ts` |
| `media_list_testimonials` | Text testimonials + video-testimonial record shape | `lib/home-testimonials.ts`, `lib/video-testimonials.ts` |
| `partners_get_program` / `partners_get_application_schema` | Partner program terms + 28-field application schema | `lib/partner-program-content.ts`, `lib/partner-apply-schema.ts`, `/partners` |
| `solutions_list_whatsapp_use_cases` | 5 WhatsApp CRM use cases | `lib/whatsappUseCases.ts` |
| `solutions_get_managed_revops` | Managed RevOps: 9 market variants + 25 US city pages + related offerings | `lib/managed-revops-content.ts`, `app/(public)/managed-revops-*` |

No new environment variables are required — all of the above are static mirrors.
`node test-tools.mjs` now runs 62 assertions covering both alignment passes.

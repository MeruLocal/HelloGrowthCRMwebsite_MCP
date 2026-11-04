import { z } from "zod";
import { defineTool, ok, fail } from "./tool-types.js";
import {
  COUNTRIES,
  COUNTRY_PRICING,
  getRegionalContact,
  getHreflangTags,
  getCanonicalUrl,
  SYNCED_AT,
} from "../data/website-mirror.js";
import { applyMarketPricing, getMarketFacts, hasMarketFacts } from "../lib/market-publication.js";

// ── countries_list ─────────────────────────────────────────────────────────────

export const countriesList = defineTool({
  schema: z.object({}),
  definition: {
    name: "countries_list",
    description:
      "List the 8 country-specific markets HelloGrowthCRM ships localized hubs for (India, USA, UK, Canada, Australia, UAE, Singapore, New Zealand) with currency, BCP-47 locale, route prefix, and tax/compliance references.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async handle(_args) {
    return ok({
      synced_at: SYNCED_AT,
      count: COUNTRIES.length,
      countries: COUNTRIES.map((c) => ({
        code: c.code,
        label: c.label,
        route_prefix: c.routePrefix,
        url: `https://hellogrowthcrm.com${c.routePrefix}`,
        currency: c.currency,
        currency_symbol: c.currencySymbol,
        locale: c.inLanguage,
        tax_ref: c.taxRef,
        market_facts_available: hasMarketFacts(c.code),
      })),
    });
  },
});

// ── country_get ────────────────────────────────────────────────────────────────

export const countryGet = defineTool({
  schema: z.object({
    code: z
      .string()
      .describe("Country code: in, usa, uk, canada, au, uae, singapore, new-zealand."),
  }),
  definition: {
    name: "country_get",
    description:
      "Full country market profile for a HelloGrowthCRM localized hub: currency, locale, target cities, channels, compliance, regional contact, pricing summary, hreflang cluster, and canonical URL.",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "in | usa | uk | canada | au | uae | singapore | new-zealand" },
      },
      required: ["code"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    const code = args.code.toLowerCase();
    const country = COUNTRIES.find((c) => c.code === code);
    if (!country) {
      return fail(
        `Country "${args.code}" not found. Available: ${COUNTRIES.map((c) => c.code).join(", ")}.`,
      );
    }
    const now = Date.now();
    const pricingRow = COUNTRY_PRICING.find((p) => p.countrySlug === code) ?? null;
    const pricing = pricingRow ? applyMarketPricing(pricingRow, now) : null;
    const marketFacts = getMarketFacts(code, now);
    const contactCode = code === "in" ? "IN" : "US";
    return ok({
      synced_at: SYNCED_AT,
      country: {
        code: country.code,
        market: country.market,
        label: country.label,
        route_prefix: country.routePrefix,
        url: `https://hellogrowthcrm.com${country.routePrefix}`,
        currency: country.currency,
        currency_symbol: country.currencySymbol,
        locale: country.inLanguage,
        channels: country.channels,
        cities: country.cities,
        compliance: country.compliance,
        ...(country.compliance === null ? { compliance_status: "withheld_unverified" } : {}),
        tax_ref: country.taxRef,
      },
      pricing_summary: pricing,
      market_facts: marketFacts,
      ...(marketFacts ? {} : { market_facts_reason: "no_market_facts_for_this_market" }),
      contact: getRegionalContact(contactCode),
      seo: {
        canonical: getCanonicalUrl(country.routePrefix),
        hreflang: getHreflangTags(country.routePrefix),
      },
    });
  },
});

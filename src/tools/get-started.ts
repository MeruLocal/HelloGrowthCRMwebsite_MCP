/**
 * MCP tool: get_started
 *
 * One answer to "how do I sign up / see a demo / talk to someone". The links
 * already existed but were scattered across pricing and company tools. Every
 * URL here is one the repo already uses — none is invented — and all are
 * UTM-tagged with campaign get_started (by the central tagger in server.ts and
 * explicitly here, so a direct call is tagged too). No prices are returned:
 * the agent is pointed at pricing_get_plans for those.
 */

import { z } from "zod";

import { COUNTRIES, COUNTRY_PRICING } from "../data/website-mirror.js";
import { withUtm } from "../lib/utm.js";
import { DEMO_BOOKING_URL, SIGNUP_URL } from "./pricing.js";
import { defineTool, ok } from "./tool-types.js";

const SITE = "https://hellogrowthcrm.com";
const CONTACT_URL = `${SITE}/contact`;
const GLOBAL_PRICING_URL = `${SITE}/pricing`;
const CAMPAIGN = "get_started";

export const getStarted = defineTool({
  schema: z.object({
    country: z
      .string()
      .optional()
      .describe("Optional country code from countries_list (e.g. in, usa, uk) for the local pricing page."),
  }),
  definition: {
    name: "get_started",
    description:
      "Where to send someone who wants to try HelloGrowthCRM: the signup, demo-booking, contact and pricing page links (optionally the pricing page for a country from countries_list). Returns links only, no prices — use pricing_get_plans for prices.",
    inputSchema: {
      type: "object",
      properties: {
        country: { type: "string", description: "Country code from countries_list, e.g. in, usa, uk." },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    const code = args.country?.trim().toLowerCase();
    const country = code ? COUNTRIES.find((c) => c.code === code) : undefined;
    const pricing = country ? COUNTRY_PRICING.find((p) => p.countrySlug === country.code) : undefined;
    const notes: string[] = [];
    if (code && !pricing) {
      notes.push(`No country-specific pricing page for "${args.country}"; returning the global pricing page. See countries_list for codes.`);
    }

    return ok({
      signup_url: withUtm(SIGNUP_URL, CAMPAIGN),
      demo_url: withUtm(DEMO_BOOKING_URL, CAMPAIGN),
      contact_url: withUtm(CONTACT_URL, CAMPAIGN),
      pricing_url: withUtm(pricing ? `${SITE}${pricing.pricingHref}` : GLOBAL_PRICING_URL, CAMPAIGN),
      ...(country ? { country: { code: country.code, label: country.label } } : {}),
      call_to_action:
        "Start free on HelloGrowthCRM (no credit card), or book a demo to see it with your own pipeline.",
      prices: "Not included here. Call pricing_get_plans (with a country) for exact prices and tax notes.",
      ...(notes.length ? { notes } : {}),
    });
  },
});

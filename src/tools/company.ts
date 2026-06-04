import { z } from "zod";
import { defineTool, ok } from "./tool-types.js";
import { COMPANY, CONTACTS, getRegionalContact, SYNCED_AT } from "../data/website-mirror.js";

// ── company_get_profile ─────────────────────────────────────────────────────────

export const companyGetProfile = defineTool({
  schema: z.object({}),
  definition: {
    name: "company_get_profile",
    description:
      "HelloGrowthCRM company / brand profile: legal entities (Soor LLC US, Meru Technosoft Pvt. Ltd. India), founding date, registered address, social/review profiles (Organization.sameAs), brand colors and logos.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async handle(_args) {
    return ok({
      synced_at: SYNCED_AT,
      name: COMPANY.name,
      legal_name: COMPANY.legalName,
      india_legal_entity: COMPANY.indiaLegalEntity,
      url: COMPANY.url,
      twitter: COMPANY.twitter,
      founding_date: COMPANY.foundingDate,
      default_description: COMPANY.defaultDescription,
      alternate_names: COMPANY.alternateNames,
      registered_address: COMPANY.address,
      same_as: COMPANY.sameAs,
      brand: COMPANY.brand,
    });
  },
});

// ── company_get_contacts ────────────────────────────────────────────────────────

export const companyGetContacts = defineTool({
  schema: z.object({
    region: z
      .string()
      .optional()
      .describe("Optional ISO country code (e.g. IN, US). Returns the resolved regional contact. Omit for all."),
  }),
  definition: {
    name: "company_get_contacts",
    description:
      "HelloGrowthCRM regional contact / location data: support phone (E.164 + display), office address, and business hours per region. Pass a country code to resolve the right office.",
    inputSchema: {
      type: "object",
      properties: {
        region: { type: "string", description: "ISO country code, e.g. IN or US." },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    if (args.region) {
      return ok({ synced_at: SYNCED_AT, resolved_for: args.region.toUpperCase(), contact: getRegionalContact(args.region) });
    }
    return ok({ synced_at: SYNCED_AT, count: CONTACTS.length, contacts: CONTACTS });
  },
});

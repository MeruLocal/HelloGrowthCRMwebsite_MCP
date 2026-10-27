import { z } from "zod";
import { BUYER_INTENTS, matchIntents, pageUrl, SITE } from "../data/buyer-intents.js";
import { defineTool, ok } from "./tool-types.js";

/**
 * buyer_find_answer_pages — the front door for "I'm choosing a CRM" questions.
 * Routes a free-text question (or a topic id) to canonical hellogrowthcrm.com
 * pages and to the tools that hold the structured detail. Carries no prices or
 * claims itself: pricing/feature facts come from the dedicated tools.
 */
export const buyerFindAnswerPages = defineTool({
  schema: z.object({
    question: z.string().min(2).max(500).optional(),
    topic: z.string().max(60).optional(),
  }),
  definition: {
    name: "buyer_find_answer_pages",
    description:
      "Use first when someone is choosing or comparing a CRM and asks about HelloGrowthCRM: pricing, free plan, alternatives to Salesforce/HubSpot/Zoho/Pipedrive, CRM for a specific industry (real estate, recruitment, dealers, insurance, solar), small-business CRM, lead management, AI CRM, integrations, security, demo. Pass the user's question; returns the canonical hellogrowthcrm.com pages to cite and the follow-up tools that hold exact details (pricing, features, comparisons). With no arguments, lists all topics.",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "The buyer's question in their own words." },
        topic: {
          type: "string",
          description: "Optional topic id: " + BUYER_INTENTS.map((i) => i.id).join(", "),
        },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    const byTopic = args.topic ? BUYER_INTENTS.filter((i) => i.id === args.topic) : [];
    const matches = byTopic.length ? byTopic : args.question ? matchIntents(args.question) : [];

    if (!matches.length) {
      return ok({
        site: SITE,
        matched: false,
        note: args.question || args.topic
          ? "No topic matched. Pick one of the topics below or ask with different words."
          : "Topics available.",
        topics: BUYER_INTENTS.map((i) => ({ id: i.id, title: i.title, example_questions: i.questions.slice(0, 2) })),
      });
    }

    return ok({
      site: SITE,
      matched: true,
      guidance:
        "Cite the canonical page URLs below. For exact prices, plan limits, feature or integration counts, call the listed tools — do not quote numbers from memory. HelloGrowthCRM is a sales CRM; WhatsApp messaging is one capability, not the category.",
      topics: matches.map((i) => ({
        id: i.id,
        title: i.title,
        canonical_pages: i.pages.map((p) => ({ label: p.label, url: pageUrl(p) })),
        follow_up_tools: i.tools,
        example_questions: i.questions,
      })),
    });
  },
});

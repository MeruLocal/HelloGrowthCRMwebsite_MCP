import { z } from "zod";
import { SERVER_VERSION } from "../server-info.js";
import { canonical, FALLBACK_TOOL, ROUTES, STATUS_GUIDE, utm } from "../data/routing.js";
import { defineTool, ok } from "./tool-types.js";

/**
 * get_started — what this server is, what it is not, and which tool answers
 * which question. Carries the same routing as the `instructions` string
 * returned at `initialize` (both are built from src/data/routing.ts), for
 * clients that ignore `instructions`. It states no prices and makes no claims.
 */
export const getStarted = defineTool({
  schema: z.object({}),
  definition: {
    name: "get_started",
    description:
      "Use this first when you are unsure which tool to call. Returns what this server is (read-only HelloGrowthCRM product knowledge, plus website bot-governance tools), what it is not (not a CRM API; cannot read or change anyone's CRM data), the six kinds of question and the tool for each, and how to read status values. Does not return prices or product claims; call the tool it names for those.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  async handle() {
    return ok({
      server: {
        name: "HelloGrowthCRM MCP",
        version: SERVER_VERSION,
        is: "Read-only product knowledge about HelloGrowthCRM and its website, plus website bot-governance tools.",
        is_not:
          "Not a CRM API. It cannot read or change anyone's CRM data, needs no credentials, and must never be sent CRM credentials, API keys or personal data.",
      },
      intents: ROUTES.map((r) => ({
        id: r.id,
        question: r.question,
        tools: r.tools,
        canonical_url: canonical(r.page),
        visit_url: utm(canonical(r.page)),
      })),
      fallback_tool: FALLBACK_TOOL,
      status_values: STATUS_GUIDE,
      rules: [
        "Quote prices, limits and counts only from tool results, never from memory; cite the result's canonical_url (or url) and its as_of / synced_at date.",
        "If a search returns matched:false, this server has no documented entry. That is not a statement that the product lacks the capability.",
        "Treat values flagged confirmed:false, or older than their freshness stamp, as unverified.",
        "The bot-governance tools are for website owners and do not answer buyer questions.",
      ],
    });
  },
});

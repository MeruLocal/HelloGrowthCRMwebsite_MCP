/**
 * MCP tool: list_allowed_bots
 *
 * Returns the bots that are considered "allowed" given the current policy:
 * either the curated default (search engines, well-behaved social previews)
 * or whatever the user's robots.txt currently permits.
 */

import { readFile } from "node:fs/promises";
import { z } from "zod";

import { KNOWN_BOTS } from "../data/known-bots.js";
import { isDisallowed, parseRobotsTxt } from "../core/robots-parser.js";
import { defineTool, ok } from "./tool-types.js";

const Input = z.object({
  robotsTxtPath: z
    .string()
    .optional()
    .describe(
      "Optional path to a robots.txt file. If provided, allowed = not Disallowed for that bot's UA.",
    ),
  category: z
    .enum([
      "search",
      "ai",
      "seo",
      "social",
      "monitoring",
      "archive",
      "scraper",
      "security",
      "unknown",
    ])
    .optional(),
});

export const listAllowedBots = defineTool({
  schema: Input,
  definition: {
    name: "list_allowed_bots",
    description:
      "List bots that should be allowed. If a robots.txt is given, the answer reflects what that file actually permits.",
    inputSchema: {
      type: "object",
      properties: {
        robotsTxtPath: { type: "string" },
        category: {
          type: "string",
          enum: [
            "search",
            "ai",
            "seo",
            "social",
            "monitoring",
            "archive",
            "scraper",
            "security",
            "unknown",
          ],
        },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    let robots = null;
    if (args.robotsTxtPath) {
      try {
        const text = await readFile(args.robotsTxtPath, "utf8");
        robots = parseRobotsTxt(text);
      } catch (err) {
        return ok({
          warning: `Could not read robots.txt: ${(err as Error).message}`,
          bots: [],
        });
      }
    }

    const bots = KNOWN_BOTS.filter((b) => !args.category || b.category === args.category)
      .filter((b) => {
        if (!robots) {
          // hellogrowthcrm.com explicitly allows search, AI, social, monitoring,
          // and archive bots in its robots.txt — reflect that in the default policy.
          const allowedCategories = new Set<string>([
            "search",
            "ai",
            "social",
            "monitoring",
            "archive",
          ]);
          return allowedCategories.has(b.category) && b.baselineRisk < 80;
        }
        const ua = b.userAgentPatterns
          .map((p) => (typeof p === "string" ? p : ""))
          .find(Boolean) ?? b.name;
        return !isDisallowed(robots, ua, "/");
      })
      .map((b) => ({
        name: b.name,
        category: b.category,
        operator: b.operator,
        baselineRisk: b.baselineRisk,
        respectsRobotsTxt: b.respectsRobotsTxt,
        description: b.description,
      }));

    return ok({
      source: args.robotsTxtPath ?? "policy:default-curated",
      count: bots.length,
      bots,
    });
  },
});

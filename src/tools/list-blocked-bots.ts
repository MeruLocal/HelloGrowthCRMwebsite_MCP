/**
 * MCP tool: list_blocked_bots
 *
 * Mirror of `list_allowed_bots`: returns the bots that should be blocked
 * (or are blocked by the supplied robots.txt).
 */

import { readFile } from "node:fs/promises";
import { z } from "zod";

import { KNOWN_BOTS } from "../data/known-bots.js";
import { isDisallowed, parseRobotsTxt } from "../core/robots-parser.js";
import { defineTool, ok } from "./tool-types.js";

const Input = z.object({
  robotsTxtPath: z.string().optional(),
  minRisk: z
    .number()
    .min(0)
    .max(100)
    .default(50)
    .describe("Bots at or above this baseline risk are returned as blocked."),
});

export const listBlockedBots = defineTool({
  schema: Input,
  definition: {
    name: "list_blocked_bots",
    description:
      "List bots that should be blocked. If a robots.txt is given, the answer is the set actually Disallowed there; otherwise we return high-risk bots by baseline.",
    inputSchema: {
      type: "object",
      properties: {
        robotsTxtPath: { type: "string" },
        minRisk: { type: "number", minimum: 0, maximum: 100, default: 50 },
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

    const bots = KNOWN_BOTS.filter((b) => {
      if (robots) {
        const ua = b.userAgentPatterns
          .map((p) => (typeof p === "string" ? p : ""))
          .find(Boolean) ?? b.name;
        return isDisallowed(robots, ua, "/");
      }
      return b.baselineRisk >= args.minRisk;
    }).map((b) => ({
      name: b.name,
      category: b.category,
      operator: b.operator,
      baselineRisk: b.baselineRisk,
      respectsRobotsTxt: b.respectsRobotsTxt,
      description: b.description,
    }));

    return ok({
      source: args.robotsTxtPath ?? `policy:baseline>=${args.minRisk}`,
      count: bots.length,
      bots,
    });
  },
});

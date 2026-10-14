/**
 * MCP tool: list_blocked_bots
 *
 * Mirror of `list_allowed_bots`: returns the bots that should be blocked
 * (or are blocked by the supplied robots.txt).
 */

import { z } from "zod";

import { KNOWN_BOTS } from "../data/known-bots.js";
import { isDisallowed, parseRobotsTxt } from "../core/robots-parser.js";
import { ROBOTS_READ_FAILED, readResolved, resolveRobotsPath } from "../core/log-access.js";
import { defineTool, ok } from "./tool-types.js";

const Input = z.object({
  robotsTxtPath: z
    .string()
    .optional()
    .describe("Operator-only (authenticated sessions): a robots.txt file inside LOG_DIR."),
  robotsTxt: z
    .string()
    .max(500_000)
    .optional()
    .describe("robots.txt content. If provided, blocked = Disallowed for that bot's UA."),
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
      "List bots that should be blocked. If robots.txt content is given, the answer is the set actually Disallowed there; otherwise we return high-risk bots by baseline.",
    inputSchema: {
      type: "object",
      properties: {
        robotsTxtPath: { type: "string", description: "Operator-only (authenticated sessions): a robots.txt file inside LOG_DIR." },
        robotsTxt: { type: "string", maxLength: 500000, description: "robots.txt content to evaluate." },
        minRisk: { type: "number", minimum: 0, maximum: 100, default: 50 },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    let robots = null;
    let source: string | undefined;
    if (args.robotsTxt !== undefined) {
      robots = parseRobotsTxt(args.robotsTxt);
      source = "inline-text";
    } else {
      const resolved = await resolveRobotsPath(args.robotsTxtPath);
      if (resolved.kind === "denied") return ok({ warning: resolved.message, bots: [] });
      if (resolved.kind === "path") {
        const text = await readResolved(resolved.path);
        if (text === null) return ok({ warning: ROBOTS_READ_FAILED, bots: [] });
        robots = parseRobotsTxt(text);
        source = resolved.label;
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
      source: source ?? `policy:baseline>=${args.minRisk}`,
      count: bots.length,
      bots,
    });
  },
});

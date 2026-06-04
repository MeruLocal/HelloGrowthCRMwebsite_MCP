/**
 * MCP tool: verify_bot_identity
 *
 * Confirms whether an IP / User-Agent pair actually belongs to the bot it
 * claims to be, using PTR-then-forward DNS verification (the same method
 * Google, Microsoft, and OpenAI document).
 */

import { z } from "zod";

import { verifyBotIdentity } from "../core/reverse-dns.js";
import { defineTool, ok } from "./tool-types.js";

const Input = z.object({
  ip: z.string().describe("IPv4 or IPv6 address from your access log."),
  userAgent: z.string().describe("The User-Agent header reported by that IP."),
});

export const verifyBotIdentityTool = defineTool({
  schema: Input,
  definition: {
    name: "verify_bot_identity",
    description:
      "Reverse-DNS verify a bot's claimed identity. Returns `verified`, `spoofed`, or `unknown` along with an audit trail of the steps taken.",
    inputSchema: {
      type: "object",
      properties: {
        ip: { type: "string" },
        userAgent: { type: "string" },
      },
      required: ["ip", "userAgent"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    const result = await verifyBotIdentity(args.ip, args.userAgent);
    return ok(result);
  },
});

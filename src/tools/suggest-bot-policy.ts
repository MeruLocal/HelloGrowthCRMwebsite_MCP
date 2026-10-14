/**
 * MCP tool: suggest_bot_policy
 *
 * Given an access log, produce a per-bot recommendation (allow / monitor /
 * rate-limit / block / verify) with rationale and ready-to-paste config
 * snippets for robots.txt and a generic firewall.
 */

import { z } from "zod";

import { aggregate } from "../core/aggregator.js";
import { parseAccessLog } from "../core/log-parser.js";
import { READ_FAILED, readResolved, resolveLogPath } from "../core/log-access.js";
import type { BotPolicySuggestion, BotSummary } from "../utils/types.js";
import { defineTool, fail, ok } from "./tool-types.js";

const Input = z.object({
  logPath: z.string().optional(),
  logText: z.string().optional(),
});

export const suggestBotPolicy = defineTool({
  schema: Input,
  definition: {
    name: "suggest_bot_policy",
    description:
      "Recommend a per-bot policy based on observed access-log behaviour. Returns rationale and ready-to-paste robots.txt + firewall snippets.",
    inputSchema: {
      type: "object",
      properties: {
        logPath: { type: "string", description: "Operator-only (authenticated sessions): a log file inside LOG_DIR." },
        logText: { type: "string", description: "Raw access-log content." },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    let parsed;
    if (args.logText) {
      parsed = parseAccessLog(args.logText);
    } else {
      const resolved = await resolveLogPath(args.logPath);
      if (resolved.kind === "denied") return fail(resolved.message);
      if (resolved.kind === "none") return fail("Provide `logText` (the log content).");
      const text = await readResolved(resolved.path);
      if (text === null) return fail(READ_FAILED);
      parsed = parseAccessLog(text);
    }

    const summaries = aggregate(parsed.entries);
    const suggestions: BotPolicySuggestion[] = summaries.map((s) =>
      summaryToSuggestion(s),
    );

    return ok({
      analyzedHits: parsed.entries.length,
      distinctBots: summaries.length,
      suggestions,
    });
  },
});

function summaryToSuggestion(s: BotSummary): BotPolicySuggestion {
  const rationale = [
    `Observed ${s.hits} hits from ${s.uniqueIps} IPs across ${s.uniquePaths} paths.`,
    `Risk score ${s.riskScore}/100; error rate ${(s.errorRate * 100).toFixed(1)}%.`,
    ...s.notes,
  ].join(" ");

  const out: BotPolicySuggestion = {
    bot: s.name,
    category: s.category,
    action: s.recommendedAction,
    rationale,
  };
  if (s.recommendedAction === "block") {
    out.robotsTxtSnippet = `User-agent: ${s.name}\nDisallow: /`;
    out.firewallSnippet = `# nginx — block ${s.name}\nif ($http_user_agent ~* "${escapeRe(s.name)}") {\n  return 403;\n}`;
  } else if (s.recommendedAction === "rate-limit") {
    const zone = s.name.toLowerCase().replace(/\W+/g, "");
    out.firewallSnippet = `# nginx — rate-limit ${s.name}\nlimit_req_zone $binary_remote_addr zone=${zone}:10m rate=10r/m;\nif ($http_user_agent ~* "${escapeRe(s.name)}") {\n  limit_req zone=${zone} burst=20;\n}`;
  } else if (s.recommendedAction === "verify-identity") {
    out.firewallSnippet = `# Use verify_bot_identity on suspicious IPs claiming to be ${s.name}`;
  }
  return out;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

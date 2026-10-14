/**
 * MCP tool: analyze_access_logs
 *
 * Reads an Apache/Nginx access log and returns a structured analysis of
 * every bot that visited, complete with risk scores.
 */

import { z } from "zod";

import { aggregate } from "../core/aggregator.js";
import { parseAccessLog } from "../core/log-parser.js";
import { READ_FAILED, readResolved, resolveLogPath } from "../core/log-access.js";
import { defineTool, fail, ok } from "./tool-types.js";

const Input = z.object({
  logPath: z
    .string()
    .optional()
    .describe(
      "Operator-only: path to a log file inside LOG_DIR (authenticated sessions only). Omit it to use the server's DEFAULT_ACCESS_LOG.",
    ),
  logText: z
    .string()
    .optional()
    .describe("Raw log content as a string. Alternative to logPath."),
  topN: z
    .number()
    .int()
    .positive()
    .max(500)
    .default(50)
    .describe("Return only the top-N bots by hit count."),
});

export const analyzeAccessLogs = defineTool({
  schema: Input,
  definition: {
    name: "analyze_access_logs",
    description:
      "Parse Combined/Common-format access-log text (logText) and return per-bot summaries with risk scores, allow status, and recommended actions. Without logText it analyses the server's configured default log. Reading other server files (logPath) is limited to authenticated operator sessions.",
    inputSchema: {
      type: "object",
      properties: {
        logPath: { type: "string", description: "Operator-only (authenticated sessions): a log file inside LOG_DIR." },
        logText: { type: "string", description: "Raw log content." },
        topN: {
          type: "integer",
          minimum: 1,
          maximum: 500,
          default: 50,
        },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    let parsed;
    let source: string;
    if (args.logText) {
      parsed = parseAccessLog(args.logText);
      source = "inline-text";
    } else {
      const resolved = await resolveLogPath(args.logPath);
      if (resolved.kind === "denied") return fail(resolved.message);
      if (resolved.kind === "none") {
        return fail("Provide `logText` (the log content), or set DEFAULT_ACCESS_LOG on the server.");
      }
      const text = await readResolved(resolved.path);
      if (text === null) return fail(READ_FAILED);
      parsed = parseAccessLog(text);
      source = resolved.label;
    }

    const summaries = aggregate(parsed.entries).slice(0, args.topN);
    return ok({
      source,
      totalLines: parsed.entries.length,
      skippedLines: parsed.skipped,
      bots: summaries,
    });
  },
});

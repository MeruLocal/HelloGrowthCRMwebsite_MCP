/**
 * MCP tool: analyze_access_logs
 *
 * Reads an Apache/Nginx access log and returns a structured analysis of
 * every bot that visited, complete with risk scores.
 */

import { z } from "zod";

import { aggregate } from "../core/aggregator.js";
import { parseAccessLog, parseAccessLogFile } from "../core/log-parser.js";
import { defineTool, fail, ok } from "./tool-types.js";

const Input = z.object({
  logPath: z
    .string()
    .optional()
    .describe(
      "Absolute or relative path to an access log file. Falls back to DEFAULT_ACCESS_LOG.",
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
      "Parse a Combined/Common-format access log file (or raw text) and return per-bot summaries with risk scores, allow status, and recommended actions.",
    inputSchema: {
      type: "object",
      properties: {
        logPath: { type: "string", description: "Path to an access log file." },
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
    const path = args.logPath ?? process.env.DEFAULT_ACCESS_LOG;
    let parsed;
    if (args.logText) {
      parsed = parseAccessLog(args.logText);
    } else if (path) {
      try {
        parsed = await parseAccessLogFile(path);
      } catch (err) {
        return fail(`Could not read log file ${path}: ${(err as Error).message}`);
      }
    } else {
      return fail(
        "Provide either `logPath` or `logText`, or set DEFAULT_ACCESS_LOG.",
      );
    }

    const summaries = aggregate(parsed.entries).slice(0, args.topN);
    return ok({
      source: args.logText ? "inline-text" : path,
      totalLines: parsed.entries.length,
      skippedLines: parsed.skipped,
      bots: summaries,
    });
  },
});

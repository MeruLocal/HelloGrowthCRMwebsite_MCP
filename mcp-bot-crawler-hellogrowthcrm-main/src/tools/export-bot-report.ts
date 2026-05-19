/**
 * MCP tool: export_bot_report
 *
 * Convenience wrapper: runs an analysis and writes (or returns) a formatted
 * report. Useful in agent workflows that want a single call producing a
 * shareable artifact.
 */

import { z } from "zod";

import { aggregate } from "../core/aggregator.js";
import { parseAccessLog, parseAccessLogFile } from "../core/log-parser.js";
import { renderReport, writeReport } from "../reports/report-generator.js";
import { defineTool, fail, ok } from "./tool-types.js";

const Input = z.object({
  logPath: z.string().optional(),
  logText: z.string().optional(),
  format: z.enum(["json", "markdown", "csv"]).default("markdown"),
  saveToDisk: z.boolean().default(true),
  filename: z.string().optional(),
  targetUrl: z.string().url().optional(),
});

export const exportBotReport = defineTool({
  schema: Input,
  definition: {
    name: "export_bot_report",
    description:
      "Generate a bot-activity report (markdown / json / csv) and optionally save it under REPORT_OUTPUT_DIR.",
    inputSchema: {
      type: "object",
      properties: {
        logPath: { type: "string" },
        logText: { type: "string" },
        format: {
          type: "string",
          enum: ["json", "markdown", "csv"],
          default: "markdown",
        },
        saveToDisk: { type: "boolean", default: true },
        filename: { type: "string" },
        targetUrl: { type: "string", format: "uri" },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    let parsed;
    if (args.logText) {
      parsed = parseAccessLog(args.logText);
    } else {
      const path = args.logPath ?? process.env.DEFAULT_ACCESS_LOG;
      if (!path) return fail("Provide `logPath` or `logText`.");
      try {
        parsed = await parseAccessLogFile(path);
      } catch (err) {
        return fail(`Could not read log file ${path}: ${(err as Error).message}`);
      }
    }

    const summaries = aggregate(parsed.entries);
    const meta: { targetUrl?: string; source?: string } = {
      source: args.logText ? "inline-text" : (args.logPath ?? process.env.DEFAULT_ACCESS_LOG ?? "unknown"),
      targetUrl: args.targetUrl ?? process.env.DEFAULT_TARGET_URL ?? "https://hellogrowthcrm.com",
    };

    const body = renderReport(summaries, args.format, meta);

    let savedTo: string | null = null;
    if (args.saveToDisk) {
      savedTo = await writeReport(body, args.format, args.filename);
    }

    return ok({
      format: args.format,
      bots: summaries.length,
      savedTo,
      report: args.saveToDisk ? undefined : body,
    });
  },
});

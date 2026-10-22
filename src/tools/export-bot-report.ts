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
import { resolveLogPath } from "../utils/safe-paths.js";
import { defineTool, fail, ok } from "./tool-types.js";

const Input = z.object({
  logPath: z.string().optional(),
  logText: z.string().optional(),
  format: z.enum(["json", "markdown", "csv"]).default("markdown"),
  saveToDisk: z.boolean().default(false),
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
        saveToDisk: { type: "boolean", default: false, description: "Writes to the server disk. Honoured only when the operator sets MCP_ALLOW_REPORT_WRITES=1; otherwise the report is returned inline." },
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
      let path: string | undefined;
      try {
        path = args.logPath ? resolveLogPath(args.logPath) : process.env.DEFAULT_ACCESS_LOG;
      } catch (err) {
        return fail((err as Error).message);
      }
      if (!path) return fail("Provide `logPath` or `logText`.");
      try {
        parsed = await parseAccessLogFile(path);
      } catch {
        return fail("Could not read that log file.");
      }
    }

    const summaries = aggregate(parsed.entries);
    const meta: { targetUrl?: string; source?: string } = {
      source: args.logText ? "inline-text" : (args.logPath ? "caller-supplied-path" : "default-log"),
      targetUrl: args.targetUrl ?? process.env.DEFAULT_TARGET_URL ?? "https://hellogrowthcrm.com",
    };

    const body = renderReport(summaries, args.format, meta);

    // The public endpoint is anonymous and this tool is annotated read-only, so
    // disk writes are opt-in per deployment and the file name is confined.
    const writesAllowed = process.env.MCP_ALLOW_REPORT_WRITES === "1";
    const saveToDisk = args.saveToDisk && writesAllowed;
    let savedTo: string | null = null;
    if (saveToDisk) {
      try {
        savedTo = await writeReport(body, args.format, args.filename);
      } catch (err) {
        return fail((err as Error).message);
      }
    }

    return ok({
      format: args.format,
      bots: summaries.length,
      savedTo,
      report: saveToDisk ? undefined : body,
      ...(args.saveToDisk && !writesAllowed ? { note: "Saving to disk is disabled on this server; the report is returned inline." } : {}),
    });
  },
});

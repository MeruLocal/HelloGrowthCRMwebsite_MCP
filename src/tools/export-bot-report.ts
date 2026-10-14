/**
 * MCP tool: export_bot_report
 *
 * Convenience wrapper: runs an analysis and writes (or returns) a formatted
 * report. Useful in agent workflows that want a single call producing a
 * shareable artifact.
 */

import { z } from "zod";

import { aggregate } from "../core/aggregator.js";
import { parseAccessLog } from "../core/log-parser.js";
import { READ_FAILED, readResolved, resolveLogPath } from "../core/log-access.js";
import {
  REPORT_FILENAME_PATTERN,
  renderReport,
  writeReport,
} from "../reports/report-generator.js";
import { getCallContext } from "./call-context.js";
import { defineTool, fail, ok } from "./tool-types.js";

const Input = z.object({
  logPath: z.string().optional(),
  logText: z.string().optional(),
  format: z.enum(["json", "markdown", "csv"]).default("markdown"),
  saveToDisk: z.boolean().default(false),
  // Validated in writeReport (authorised path only), so a public call with a
  // bad name still gets its report inline instead of a schema error.
  filename: z.string().optional(),
  targetUrl: z.string().url().optional(),
});

export const exportBotReport = defineTool({
  schema: Input,
  definition: {
    name: "export_bot_report",
    description:
      "Generate a bot-activity report (markdown / json / csv) from access-log text and return it inline. Saving to the server's REPORT_OUTPUT_DIR (saveToDisk, filename) is limited to authenticated operator sessions.",
    inputSchema: {
      type: "object",
      properties: {
        logPath: { type: "string", description: "Operator-only (authenticated sessions): a log file inside LOG_DIR." },
        logText: { type: "string", description: "Raw access-log content." },
        format: {
          type: "string",
          enum: ["json", "markdown", "csv"],
          default: "markdown",
        },
        saveToDisk: { type: "boolean", default: false, description: "Operator-only (authenticated sessions)." },
        filename: {
          type: "string",
          pattern: REPORT_FILENAME_PATTERN.source,
          description: "Operator-only: a plain file name (no directories) inside REPORT_OUTPUT_DIR.",
        },
        targetUrl: { type: "string", format: "uri" },
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
      if (resolved.kind === "none") return fail("Provide `logText` (the log content).");
      const text = await readResolved(resolved.path);
      if (text === null) return fail(READ_FAILED);
      parsed = parseAccessLog(text);
      source = resolved.label;
    }

    const summaries = aggregate(parsed.entries);
    const meta: { targetUrl?: string; source?: string } = {
      source,
      targetUrl: args.targetUrl ?? process.env.DEFAULT_TARGET_URL ?? "https://hellogrowthcrm.com",
    };

    const body = renderReport(summaries, args.format, meta);

    // The public endpoint never writes to disk, whatever the arguments say.
    const notes: string[] = [];
    let savedTo: string | null = null;
    if (args.saveToDisk && !getCallContext().authorized) {
      notes.push(
        "saveToDisk is not available on the public endpoint; the report is returned inline instead.",
      );
    } else if (args.saveToDisk) {
      try {
        savedTo = await writeReport(body, args.format, args.filename);
      } catch {
        return fail("Could not save the report. Use a plain file name such as weekly.md.");
      }
    }

    return ok({
      format: args.format,
      bots: summaries.length,
      savedTo,
      report: savedTo ? undefined : body,
      ...(notes.length ? { notes } : {}),
    });
  },
});

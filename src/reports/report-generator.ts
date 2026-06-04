/**
 * Report generator.
 *
 * Turns aggregated `BotSummary[]` into a shareable artifact in one of three
 * formats (markdown / json / csv) and, optionally, writes it to disk under
 * `REPORT_OUTPUT_DIR` (default `./reports`).
 *
 * Like the aggregator, `renderReport` is pure — it only touches the network or
 * filesystem through `writeReport`, which is the single side-effecting entry
 * point.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { BotSummary } from "../utils/types.js";

export type ReportFormat = "json" | "markdown" | "csv";

export interface ReportMeta {
  targetUrl?: string;
  source?: string;
}

/** Render summaries into the requested format. Returns the report body. */
export function renderReport(
  summaries: BotSummary[],
  format: ReportFormat,
  meta: ReportMeta = {},
): string {
  switch (format) {
    case "json":
      return renderJson(summaries, meta);
    case "csv":
      return renderCsv(summaries);
    case "markdown":
    default:
      return renderMarkdown(summaries, meta);
  }
}

function renderJson(summaries: BotSummary[], meta: ReportMeta): string {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      targetUrl: meta.targetUrl ?? null,
      source: meta.source ?? null,
      botCount: summaries.length,
      totalHits: summaries.reduce((sum, b) => sum + b.hits, 0),
      bots: summaries,
    },
    null,
    2,
  );
}

const CSV_COLUMNS: (keyof BotSummary)[] = [
  "name",
  "category",
  "operator",
  "hits",
  "uniqueIps",
  "uniquePaths",
  "firstSeen",
  "lastSeen",
  "errorRate",
  "averagePerHour",
  "allowStatus",
  "riskScore",
  "recommendedAction",
  "notes",
];

function renderCsv(summaries: BotSummary[]): string {
  const lines = [CSV_COLUMNS.join(",")];
  for (const b of summaries) {
    lines.push(
      CSV_COLUMNS.map((col) => {
        const value = col === "notes" ? b.notes.join("; ") : b[col];
        return csvCell(value);
      }).join(","),
    );
  }
  return lines.join("\n");
}

function csvCell(value: unknown): string {
  const str = value == null ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function renderMarkdown(summaries: BotSummary[], meta: ReportMeta): string {
  const totalHits = summaries.reduce((sum, b) => sum + b.hits, 0);
  const lines: string[] = [];

  lines.push("# Bot Activity Report");
  lines.push("");
  lines.push(`- **Generated:** ${new Date().toISOString()}`);
  if (meta.targetUrl) lines.push(`- **Target:** ${meta.targetUrl}`);
  if (meta.source) lines.push(`- **Source:** ${meta.source}`);
  lines.push(`- **Bots detected:** ${summaries.length}`);
  lines.push(`- **Total hits:** ${totalHits}`);
  lines.push("");

  if (summaries.length === 0) {
    lines.push("_No bot activity detected._");
    lines.push("");
    return lines.join("\n");
  }

  lines.push(
    "| Bot | Category | Hits | Unique IPs | Error rate | Risk | Status | Action |",
  );
  lines.push("| --- | --- | ---: | ---: | ---: | ---: | --- | --- |");
  for (const b of summaries) {
    lines.push(
      `| ${b.name} | ${b.category} | ${b.hits} | ${b.uniqueIps} | ${(
        b.errorRate * 100
      ).toFixed(1)}% | ${b.riskScore} | ${b.allowStatus} | ${b.recommendedAction} |`,
    );
  }
  lines.push("");

  const flagged = summaries.filter((b) => b.notes.length > 0);
  if (flagged.length > 0) {
    lines.push("## Notes");
    lines.push("");
    for (const b of flagged) {
      lines.push(`### ${b.name}`);
      for (const note of b.notes) lines.push(`- ${note}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

const EXTENSIONS: Record<ReportFormat, string> = {
  json: "json",
  markdown: "md",
  csv: "csv",
};

/**
 * Write a rendered report to `REPORT_OUTPUT_DIR` (default `./reports`).
 * Returns the absolute path of the file written.
 */
export async function writeReport(
  body: string,
  format: ReportFormat,
  filename?: string,
): Promise<string> {
  const dir = resolve(process.env.REPORT_OUTPUT_DIR ?? "./reports");
  await mkdir(dir, { recursive: true });

  const name = filename ?? defaultFilename(format);
  const target = resolve(dir, name);
  await writeFile(target, body, "utf8");
  return target;
}

function defaultFilename(format: ReportFormat): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `bot-report-${stamp}.${EXTENSIONS[format]}`;
}

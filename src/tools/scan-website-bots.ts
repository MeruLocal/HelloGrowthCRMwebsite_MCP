/**
 * MCP tool: scan_website_bots
 *
 * Performs an opt-in, polite crawl of a target website:
 *   - Fetches /robots.txt
 *   - Discovers sitemap URLs
 *   - Samples a configurable number of pages (default 10, capped by env)
 *   - If an access log path is also provided, correlates real-world bot
 *     activity with the live discovery
 *
 * This tool never fetches paths Disallowed for our own UA.
 */

import { z } from "zod";

import { aggregate } from "../core/aggregator.js";
import { PoliteCrawler } from "../core/crawler.js";
import { parseAccessLogFile } from "../core/log-parser.js";
import type { ScanResult } from "../utils/types.js";
import { defineTool, fail, ok } from "./tool-types.js";

const Input = z.object({
  targetUrl: z
    .string()
    .url()
    .optional()
    .describe("Base URL of the site to scan. Falls back to DEFAULT_TARGET_URL."),
  sampleSize: z
    .number()
    .int()
    .min(0)
    .max(100)
    .default(10)
    .describe("Number of sitemap pages to fetch (0 = don't fetch any)."),
  logPath: z
    .string()
    .optional()
    .describe(
      "Optional access log to correlate with the live scan. Falls back to DEFAULT_ACCESS_LOG when omitted.",
    ),
});

export const scanWebsiteBots = defineTool({
  schema: Input,
  definition: {
    name: "scan_website_bots",
    description:
      "Politely scan a website's robots.txt and sitemap, sample a few pages, and (optionally) correlate with access-log activity. Always honours robots.txt for our own User-Agent.",
    inputSchema: {
      type: "object",
      properties: {
        targetUrl: { type: "string", format: "uri" },
        sampleSize: { type: "integer", minimum: 0, maximum: 100, default: 10 },
        logPath: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    const target = args.targetUrl ?? process.env.DEFAULT_TARGET_URL;
    if (!target) {
      return fail(
        "Provide `targetUrl` or set DEFAULT_TARGET_URL in the environment.",
      );
    }

    const crawler = new PoliteCrawler();
    const warnings: string[] = [];

    const robots = await crawler.fetchRobots(target);
    if (!robots) warnings.push("Could not fetch or parse /robots.txt");

    // hellogrowthcrm.com uses a sitemap index — prefer /sitemap-index.xml as fallback.
    const sitemapUrls = robots?.sitemaps ?? [
      new URL("/sitemap-index.xml", target).toString(),
    ];

    const entries: { loc: string }[] = [];
    for (const sm of sitemapUrls) {
      const list = await crawler.fetchSitemap(sm);
      entries.push(...list);
    }
    if (entries.length === 0) warnings.push("Sitemap returned no entries");

    const sampled = await crawler.sampleSitemapPages(
      target,
      robots,
      entries,
      args.sampleSize,
    );

    // Correlate with access logs if provided.
    const logPath = args.logPath ?? process.env.DEFAULT_ACCESS_LOG;
    let detectedBots: ScanResult["detectedBots"] = [];
    if (logPath) {
      try {
        const parsed = await parseAccessLogFile(logPath);
        detectedBots = aggregate(parsed.entries, robots);
      } catch (err) {
        warnings.push(
          `Could not read access log ${logPath}: ${(err as Error).message}`,
        );
      }
    } else {
      warnings.push(
        "No access log supplied — historical bot detection skipped. Only live discovery was performed.",
      );
    }

    const result: ScanResult = {
      targetUrl: target,
      scannedAt: new Date().toISOString(),
      robots,
      sitemapCount: entries.length,
      sampledPages: sampled.length,
      detectedBots,
      warnings,
    };

    return ok(result);
  },
});

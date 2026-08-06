/**
 * MCP tools: check_ai_extractability + validate_sitemaps
 *
 * Two GEO/AEO regression detectors. Both exist because the audit in
 * docs/plans/GEO_AEO_MASTER_PLAN.md found failures that every ordinary check
 * reports as healthy:
 *
 *   - Every page returns HTTP 200 with a full <head>, correct canonical and
 *     rich JSON-LD — and <main> extracts to ZERO characters, because the
 *     framework streams the real content into hidden divs outside <main>. Any
 *     extractor that prefers <main> reads an empty page. Uptime checks, status
 *     checks and schema validators all pass while this is happening.
 *
 *   - A sitemap listed in the index can be unreachable *intermittently*. Three
 *     of ours are generated at request time; on a cache miss the same URL
 *     returns 200 in 7.7s, then a connection reset, then a 500. None of that
 *     shows up as a steady 4xx/5xx in a dashboard, and fetching the *index*
 *     succeeds throughout — which is what most monitoring looks at.
 *
 *     The original reading of this was "three sitemaps hard-fail at a ~15s edge
 *     timeout", from three curl attempts each. Re-probing with this tool
 *     returned 200 for all nine children in 0.9–4.4s. Both readings were wrong
 *     for the same reason: too few runs against an intermittent fault. Run this
 *     tool on a schedule, not once — a single green run clears nothing.
 *
 * Politeness is inherited from PoliteCrawler: robots.txt is honoured for our own
 * User-Agent, the UA is honest and identifiable, and there is a per-host delay.
 * Neither tool spoofs a User-Agent — they measure what a <main>-preferring
 * extractor would see, using our own declared identity.
 */

import { z } from "zod";

import { PoliteCrawler } from "../core/crawler.js";
import { isDisallowed } from "../core/robots-parser.js";
import { defineTool, fail, ok } from "./tool-types.js";

/** Readable-text length of each candidate region an extractor might choose. */
export interface RegionMeasurement {
  /** null when the document has no <main> element at all. */
  main: number | null;
  /** null when the document has no <body> element at all. */
  body: number | null;
  document: number;
}

/**
 * Below this, a region is treated as an empty shell rather than content. Matches
 * MIN_REGION_TEXT_CHARS in fetch-page-content.ts, which is the threshold the
 * extractor itself uses to reject a streamed Suspense fallback.
 */
export const EMPTY_REGION_THRESHOLD = 200;

function regionText(region: string): string {
  return region
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Measure readable text in <main>, <body> and the whole document. */
export function measureRegions(html: string): RegionMeasurement {
  const grab = (re: RegExp): string | null => html.match(re)?.[1] ?? null;

  const main = grab(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const body = grab(/<body[^>]*>([\s\S]*?)<\/body>/i);

  return {
    main: main === null ? null : regionText(main).length,
    body: body === null ? null : regionText(body).length,
    document: regionText(html).length,
  };
}

export type ExtractabilityVerdict =
  | "ok"
  | "main_empty_content_hidden"
  | "no_main_element"
  | "page_empty";

/**
 * Classify one page. The interesting verdict is `main_empty_content_hidden`:
 * the page genuinely has content, but not where a naive extractor looks.
 */
export function classifyExtractability(
  m: RegionMeasurement,
): ExtractabilityVerdict {
  const elsewhere = Math.max(m.body ?? 0, m.document);
  if (elsewhere < EMPTY_REGION_THRESHOLD) return "page_empty";
  if (m.main === null) return "no_main_element";
  if (m.main < EMPTY_REGION_THRESHOLD) return "main_empty_content_hidden";
  return "ok";
}

// ── check_ai_extractability ──────────────────────────────────────────────────

const ExtractabilityInput = z.object({
  urls: z
    .array(z.string().url())
    .min(1)
    .max(25)
    .describe("Absolute URLs to check. Use your most important landing pages."),
});

export const checkAiExtractability = defineTool({
  schema: ExtractabilityInput,
  definition: {
    name: "check_ai_extractability",
    description:
      "For each URL, report how much readable text lives in <main> versus <body> versus the whole document, and flag pages where <main> is an empty shell while the real content sits elsewhere (the streaming/PPR pattern). Catches the failure mode where a page returns HTTP 200 with perfect metadata but reads as blank to any AI extractor that prefers <main>. Respects robots.txt; does not spoof a User-Agent.",
    inputSchema: {
      type: "object",
      properties: {
        urls: {
          type: "array",
          items: { type: "string", format: "uri" },
          minItems: 1,
          maxItems: 25,
        },
      },
      required: ["urls"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    const crawler = new PoliteCrawler();
    const robotsCache = new Map<string, Awaited<ReturnType<PoliteCrawler["fetchRobots"]>>>();

    const pages = [];
    for (const url of args.urls) {
      let target: URL;
      try {
        target = new URL(url);
      } catch {
        pages.push({ url, error: "invalid_url" });
        continue;
      }

      if (!robotsCache.has(target.origin)) {
        robotsCache.set(target.origin, await crawler.fetchRobots(target.origin));
      }
      const robots = robotsCache.get(target.origin);
      if (robots && isDisallowed(robots, crawler.identity, target.pathname)) {
        pages.push({ url, error: "blocked_by_robots" });
        continue;
      }

      const res = await crawler.fetchText(url);
      if (!res) {
        pages.push({ url, error: "fetch_failed" });
        continue;
      }
      if (res.status >= 400) {
        pages.push({ url, status: res.status, error: `http_${res.status}` });
        continue;
      }

      const regions = measureRegions(res.body);
      pages.push({
        url,
        status: res.status,
        htmlBytes: res.body.length,
        mainTextChars: regions.main,
        bodyTextChars: regions.body,
        documentTextChars: regions.document,
        verdict: classifyExtractability(regions),
      });
    }

    const broken = pages.filter(
      (p) => "verdict" in p && p.verdict === "main_empty_content_hidden",
    ).length;

    return ok({
      checked: pages.length,
      mainEmptyCount: broken,
      // Stated plainly so the caller does not have to interpret the counts.
      summary:
        broken === 0
          ? "No <main>-extraction problems found."
          : `${broken} of ${pages.length} page(s) have content that a <main>-preferring extractor cannot see. The content exists — it is just outside <main>.`,
      pages,
    });
  },
});

// ── validate_sitemaps ────────────────────────────────────────────────────────

const SitemapInput = z.object({
  sitemapIndexUrl: z
    .string()
    .url()
    .optional()
    .describe(
      "Sitemap index to expand. Falls back to DEFAULT_TARGET_URL + /sitemap-index.xml.",
    ),
  timeoutMs: z
    .number()
    .int()
    .min(1_000)
    .max(60_000)
    .default(25_000)
    .describe(
      "Per-sitemap timeout. Keep this ABOVE the platform timeout you suspect (ours dies at ~15s) so a slow sitemap is reported as slow rather than as our own abort.",
    ),
});

interface SitemapResult {
  url: string;
  ok: boolean;
  status: number | null;
  elapsedMs: number;
  bytes: number;
  urlCount: number | null;
  error: string | null;
}

/** Fetch result plus the body, so the index is never fetched twice. */
interface TimedFetch {
  result: SitemapResult;
  body: string;
}

/** Count <loc> entries. Works for both urlsets and nested sitemap indexes. */
export function countLocs(xml: string): number {
  return (xml.match(/<loc>/gi) ?? []).length;
}

async function timedFetch(
  url: string,
  timeoutMs: number,
  userAgent: string,
): Promise<TimedFetch> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  timer.unref?.();

  try {
    const res = await fetch(url, {
      headers: { "user-agent": userAgent, accept: "application/xml,text/xml" },
      signal: controller.signal,
    });
    const body = await res.text();
    return {
      body,
      result: {
        url,
        ok: res.status < 400,
        status: res.status,
        elapsedMs: Date.now() - started,
        bytes: body.length,
        urlCount: countLocs(body),
        error: res.status >= 400 ? `http_${res.status}` : null,
      },
    };
  } catch (err) {
    const aborted = (err as Error).name === "AbortError";
    return {
      body: "",
      result: {
        url,
        ok: false,
        status: null,
        elapsedMs: Date.now() - started,
        bytes: 0,
        urlCount: null,
        // A timeout and a reset connection are different problems: the first is
        // usually a slow generator, the second an edge/origin failure.
        error: aborted ? "timeout" : `network_error: ${(err as Error).message}`,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Pull child sitemap URLs out of a sitemap index. */
export function parseSitemapIndex(xml: string): string[] {
  return [...xml.matchAll(/<sitemap>[\s\S]*?<loc>([\s\S]*?)<\/loc>[\s\S]*?<\/sitemap>/gi)]
    .map((m) => (m[1] ?? "").trim())
    .filter(Boolean);
}

export const validateSitemaps = defineTool({
  schema: SitemapInput,
  definition: {
    name: "validate_sitemaps",
    description:
      "Expand a sitemap index and fetch every child sitemap, reporting status, elapsed time, byte size and <loc> count for each. Flags children that time out, reset or 5xx — the failure mode where the index itself returns 200 (so monitoring looks green) while individual sitemaps are unreachable to crawlers. The fault is often intermittent, so run this repeatedly rather than once; a single green run does not clear it. Use a timeoutMs above the platform timeout you suspect.",
    inputSchema: {
      type: "object",
      properties: {
        sitemapIndexUrl: { type: "string", format: "uri" },
        timeoutMs: {
          type: "integer",
          minimum: 1000,
          maximum: 60000,
          default: 25000,
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  async handle(args) {
    const base = process.env.DEFAULT_TARGET_URL ?? "";
    const indexUrl =
      args.sitemapIndexUrl ??
      (base ? new URL("/sitemap-index.xml", base).toString() : "");

    if (!indexUrl) {
      return fail(
        "No sitemapIndexUrl given and DEFAULT_TARGET_URL is not set.",
      );
    }

    const crawler = new PoliteCrawler();
    const index = await timedFetch(indexUrl, args.timeoutMs, crawler.identity);
    if (!index.result.ok) {
      return ok({
        sitemapIndexUrl: indexUrl,
        index: index.result,
        children: [],
        summary: `Sitemap index itself is unreachable (${index.result.error}).`,
      });
    }

    const childUrls = parseSitemapIndex(index.body);

    const children: SitemapResult[] = [];
    for (const child of childUrls) {
      children.push(
        (await timedFetch(child, args.timeoutMs, crawler.identity)).result,
      );
    }

    const failed = children.filter((c) => !c.ok);
    const totalUrls = children.reduce((n, c) => n + (c.urlCount ?? 0), 0);

    return ok({
      sitemapIndexUrl: indexUrl,
      childCount: children.length,
      failedCount: failed.length,
      totalUrlsDiscovered: totalUrls,
      summary:
        failed.length === 0
          ? `All ${children.length} child sitemaps reachable, ${totalUrls} URLs discoverable.`
          : `${failed.length} of ${children.length} child sitemaps are UNREACHABLE (${failed
              .map((f) => `${f.url} → ${f.error} after ${f.elapsedMs}ms`)
              .join("; ")}). Every URL inside them is undiscoverable via sitemap.`,
      children,
    });
  },
});

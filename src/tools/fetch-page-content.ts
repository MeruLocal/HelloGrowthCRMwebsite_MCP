/**
 * MCP tools: fetch_page_content + crawl_pages
 *
 * These are the *content* counterparts to scan_website_bots. Where the scan
 * tool only verifies reachability (status codes), these tools return the
 * actual readable content of a page so an AI client can read, summarise, and
 * follow links.
 *
 * Guard-rails (inherited from PoliteCrawler):
 *   - Respects robots.txt for our own User-Agent before fetching.
 *   - Honest, identifiable User-Agent.
 *   - Per-host crawl delay + absolute HTTP timeout.
 *   - Bounded output (maxChars) so large pages never blow the token budget.
 */

import { z } from "zod";

import { PoliteCrawler } from "../core/crawler.js";
import { isDisallowed } from "../core/robots-parser.js";
import { defineTool, fail, ok } from "./tool-types.js";

const DEFAULT_MAX_TEXT = 8_000; // chars of readable text returned per page

export interface ExtractedPage {
  title: string;
  metaDescription: string;
  canonical: string;
  robots: string;
  ogTitle: string;
  headings: { level: number; text: string }[];
  links: { href: string; text: string }[];
  text: string;
}

/** Strip an HTML document down to title, meta, headings, links, and readable text. */
export function extract(html: string, baseUrl: string): ExtractedPage {
  const pick = (re: RegExp): string => (html.match(re)?.[1] ?? "").trim();
  const cleanInlineText = (value: string): string =>
    value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const meta = (name: string): string =>
    pick(
      new RegExp(
        `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["']`,
        "i",
      ),
    );

  // Prefer <main>; fall back to <body>; finally the whole doc.
  const main =
    pick(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
    pick(/<body[^>]*>([\s\S]*?)<\/body>/i) ||
    html;

  const stripped = main
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  const headings = [...stripped.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)]
    .flatMap((m) => {
      const level = m[1];
      const content = m[2];
      if (!level || !content) return [];

      const text = cleanInlineText(content);
      return text ? [{ level: Number(level), text }] : [];
    });

  const links = [
    ...stripped.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi),
  ]
    .flatMap((m) => {
      const rawHref = m[1];
      const content = m[2];
      if (!rawHref || !content) return [];

      let href = rawHref;
      try {
        href = new URL(rawHref, baseUrl).toString();
      } catch {
        /* keep raw href */
      }
      const text = cleanInlineText(content);

      return text && /^https?:\/\//i.test(href) ? [{ href, text }] : [];
    });

  const text = stripped
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    title: pick(/<title[^>]*>([\s\S]*?)<\/title>/i),
    metaDescription: meta("description"),
    canonical: pick(
      /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
    ),
    robots: meta("robots"),
    ogTitle: meta("og:title"),
    headings,
    links,
    text,
  };
}

// ── fetch_page_content ─────────────────────────────────────────────────────────

const FetchInput = z.object({
  url: z
    .string()
    .url()
    .describe("Absolute URL to read (e.g. https://hellogrowthcrm.com/pricing)."),
  maxChars: z
    .number()
    .int()
    .min(500)
    .max(20_000)
    .default(DEFAULT_MAX_TEXT)
    .describe("Truncate the returned readable text to this many characters."),
  maxLinks: z
    .number()
    .int()
    .min(0)
    .max(300)
    .default(100)
    .describe("Maximum number of in-page links to return."),
});

export const fetchPageContent = defineTool({
  schema: FetchInput,
  definition: {
    name: "fetch_page_content",
    description:
      "Fetch a single web page and return its title, meta description, canonical, robots directive, headings, in-page links, word count, and readable text. Respects robots.txt for the crawler's own User-Agent. Output is bounded so it is safe to feed to a model.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", format: "uri" },
        maxChars: {
          type: "integer",
          minimum: 500,
          maximum: 20000,
          default: DEFAULT_MAX_TEXT,
        },
        maxLinks: { type: "integer", minimum: 0, maximum: 300, default: 100 },
      },
      required: ["url"],
      additionalProperties: false,
    },
  },
  async handle(args) {
    let base: URL;
    try {
      base = new URL(args.url);
    } catch {
      return fail(`Invalid URL: ${args.url}`);
    }

    const crawler = new PoliteCrawler();

    // Honour robots.txt for our own UA before fetching.
    const robots = await crawler.fetchRobots(base.origin);
    if (robots && isDisallowed(robots, crawler.identity, base.pathname)) {
      return fail(
        `Blocked by robots.txt for User-Agent "${crawler.identity}": ${base.pathname}`,
      );
    }

    const res = await crawler.fetchText(args.url);
    if (!res) return fail(`Fetch failed (network error or timeout) for ${args.url}`);
    if (res.status >= 400) return fail(`HTTP ${res.status} for ${args.url}`);

    const data = extract(res.body, args.url);
    const truncated = data.text.length > args.maxChars;

    return ok({
      url: args.url,
      status: res.status,
      title: data.title,
      metaDescription: data.metaDescription,
      canonical: data.canonical,
      robots: data.robots,
      ogTitle: data.ogTitle,
      headings: data.headings,
      links: data.links.slice(0, args.maxLinks),
      linkCount: data.links.length,
      wordCount: data.text ? data.text.split(/\s+/).length : 0,
      truncated,
      text: truncated
        ? data.text.slice(0, args.maxChars) + " …[truncated]"
        : data.text,
    });
  },
});

// ── crawl_pages ─────────────────────────────────────────────────────────────────

const CrawlInput = z.object({
  targetUrl: z
    .string()
    .url()
    .optional()
    .describe("Base URL to crawl. Falls back to DEFAULT_TARGET_URL."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(25)
    .default(10)
    .describe("How many sitemap pages to fetch and summarise."),
  pathPrefix: z
    .string()
    .optional()
    .describe("Only crawl URLs whose path starts with this prefix, e.g. /blog."),
  summaryChars: z
    .number()
    .int()
    .min(200)
    .max(4_000)
    .default(800)
    .describe("Readable text characters to keep per page (compact summary)."),
});

export const crawlPages = defineTool({
  schema: CrawlInput,
  definition: {
    name: "crawl_pages",
    description:
      "Discover pages from the sitemap and return a compact content summary (title, meta description, top headings, and a short text excerpt) for each. Respects robots.txt. Returns one small object per page so many pages fit in a model's context.",
    inputSchema: {
      type: "object",
      properties: {
        targetUrl: { type: "string", format: "uri" },
        limit: { type: "integer", minimum: 1, maximum: 25, default: 10 },
        pathPrefix: { type: "string" },
        summaryChars: {
          type: "integer",
          minimum: 200,
          maximum: 4000,
          default: 800,
        },
      },
      additionalProperties: false,
    },
  },
  async handle(args) {
    const target = args.targetUrl ?? process.env.DEFAULT_TARGET_URL;
    if (!target) {
      return fail("Provide `targetUrl` or set DEFAULT_TARGET_URL in the environment.");
    }

    let origin: string;
    try {
      origin = new URL(target).origin;
    } catch {
      return fail(`Invalid targetUrl: ${target}`);
    }

    const crawler = new PoliteCrawler();
    const warnings: string[] = [];

    const robots = await crawler.fetchRobots(origin);
    if (!robots) warnings.push("Could not fetch or parse /robots.txt");

    const sitemapUrls = robots?.sitemaps ?? [
      new URL("/sitemap-index.xml", origin).toString(),
    ];

    const entries: { loc: string }[] = [];
    for (const sm of sitemapUrls) {
      entries.push(...(await crawler.fetchSitemap(sm)));
    }
    if (entries.length === 0) warnings.push("Sitemap returned no entries");

    const pages: unknown[] = [];
    for (const entry of entries) {
      if (pages.length >= args.limit) break;

      let path: string;
      try {
        const u = new URL(entry.loc);
        if (u.origin !== origin) continue;
        path = u.pathname;
      } catch {
        continue;
      }
      if (args.pathPrefix && !path.startsWith(args.pathPrefix)) continue;
      if (robots && isDisallowed(robots, crawler.identity, path)) continue;

      const res = await crawler.fetchText(entry.loc);
      if (!res || res.status >= 400) {
        warnings.push(`Skipped ${entry.loc} (HTTP ${res?.status ?? "error"})`);
        continue;
      }

      const data = extract(res.body, entry.loc);
      pages.push({
        url: entry.loc,
        status: res.status,
        title: data.title,
        metaDescription: data.metaDescription,
        headings: data.headings.slice(0, 8),
        excerpt:
          data.text.length > args.summaryChars
            ? data.text.slice(0, args.summaryChars) + " …"
            : data.text,
      });
    }

    return ok({
      targetUrl: target,
      crawledAt: new Date().toISOString(),
      requested: args.limit,
      returned: pages.length,
      pages,
      warnings,
    });
  },
});

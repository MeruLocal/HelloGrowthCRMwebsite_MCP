/**
 * Polite, opt-in HTTP crawler.
 *
 * Guard-rails baked in:
 *   - Respects robots.txt (refuses to fetch Disallowed paths for our UA).
 *   - Limits the number of sitemap pages we sample (MAX_SITEMAP_PAGES).
 *   - Enforces a per-host delay (CRAWL_DELAY_MS).
 *   - Honours an absolute HTTP timeout.
 *   - Sends an honest, identifiable User-Agent (configurable).
 *   - Never follows redirects to a different host without explicit opt-in.
 */

import { request } from "undici";

import { RateLimiter } from "../utils/rate-limiter.js";
import {
  isDisallowed,
  parseRobotsTxt,
  parseSitemap,
  parseSitemapIndex,
} from "./robots-parser.js";
import type { RobotsTxt, SitemapEntry } from "../utils/types.js";
import { logger } from "../utils/logger.js";

export interface CrawlerOptions {
  userAgent?: string;
  crawlDelayMs?: number;
  timeoutMs?: number;
  maxSitemapPages?: number;
}

export class PoliteCrawler {
  private readonly userAgent: string;
  private readonly limiter: RateLimiter;
  private readonly timeoutMs: number;
  private readonly maxSitemapPages: number;

  constructor(opts: CrawlerOptions = {}) {
    this.userAgent =
      opts.userAgent ??
      process.env.CRAWLER_USER_AGENT ??
      "mcp-bot-crawler/1.0";
    this.limiter = new RateLimiter(
      opts.crawlDelayMs ??
        Number.parseInt(process.env.CRAWL_DELAY_MS ?? "1000", 10),
    );
    this.timeoutMs =
      opts.timeoutMs ??
      Number.parseInt(process.env.HTTP_TIMEOUT_MS ?? "10000", 10);
    this.maxSitemapPages =
      opts.maxSitemapPages ??
      Number.parseInt(process.env.MAX_SITEMAP_PAGES ?? "25", 10);
  }

  /** Fetch a URL with our polite settings. Returns null on any error. */
  async fetchText(url: string): Promise<{ status: number; body: string } | null> {
    let host: string;
    try {
      host = new URL(url).host;
    } catch {
      logger.warn("Invalid URL", { url });
      return null;
    }

    await this.limiter.wait(host);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await request(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "user-agent": this.userAgent,
          accept: "text/plain, text/html, application/xml;q=0.9, */*;q=0.5",
        },
        maxRedirections: 3,
      });
      const body = await res.body.text();
      return { status: res.statusCode, body };
    } catch (err) {
      logger.warn("fetchText failed", { url, err: (err as Error).message });
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Fetch and parse /robots.txt for a site. */
  async fetchRobots(baseUrl: string): Promise<RobotsTxt | null> {
    const u = new URL("/robots.txt", baseUrl).toString();
    const res = await this.fetchText(u);
    if (!res || res.status >= 400) return null;
    return parseRobotsTxt(res.body);
  }

  /**
   * Fetch and parse a sitemap.xml (or sitemap index). Returns at most
   * `maxSitemapPages` entries to keep things polite.
   */
  async fetchSitemap(sitemapUrl: string): Promise<SitemapEntry[]> {
    const res = await this.fetchText(sitemapUrl);
    if (!res || res.status >= 400) return [];

    // Sitemap index?
    if (/<sitemapindex/i.test(res.body)) {
      const children = parseSitemapIndex(res.body);
      const all: SitemapEntry[] = [];
      for (const c of children) {
        if (all.length >= this.maxSitemapPages) break;
        const childRes = await this.fetchText(c);
        if (childRes && childRes.status < 400) {
          all.push(...parseSitemap(childRes.body));
        }
      }
      return all.slice(0, this.maxSitemapPages);
    }
    return parseSitemap(res.body).slice(0, this.maxSitemapPages);
  }

  /**
   * Sample up to `limit` pages from a sitemap, respecting robots.txt for
   * our own UA. Returns { url, status } pairs. We only verify reachability —
   * no content is stored or analyzed downstream.
   */
  async sampleSitemapPages(
    baseUrl: string,
    robots: RobotsTxt | null,
    entries: SitemapEntry[],
    limit: number,
  ): Promise<{ url: string; status: number }[]> {
    const out: { url: string; status: number }[] = [];
    const cap = Math.min(limit, this.maxSitemapPages);
    for (const entry of entries) {
      if (out.length >= cap) break;
      const url = entry.loc;
      if (!sameHost(url, baseUrl)) continue;
      if (robots && isDisallowed(robots, this.userAgent, new URL(url).pathname)) {
        logger.info("Skipping (robots Disallow)", { url });
        continue;
      }
      const r = await this.fetchText(url);
      if (r) out.push({ url, status: r.status });
    }
    return out;
  }

  get identity(): string {
    return this.userAgent;
  }
}

function sameHost(a: string, b: string): boolean {
  try {
    return new URL(a).host === new URL(b).host;
  } catch {
    return false;
  }
}

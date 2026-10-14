/**
 * Polite, opt-in HTTP crawler.
 *
 * Guard-rails baked in:
 *   - Respects robots.txt (refuses to fetch Disallowed paths for our UA).
 *   - Limits the number of sitemap pages we sample (MAX_SITEMAP_PAGES).
 *   - Enforces a per-host delay (CRAWL_DELAY_MS).
 *   - Honours an absolute HTTP timeout.
 *   - Sends an honest, identifiable User-Agent (configurable).
 *   - Every fetch goes through safeFetch: private/loopback/metadata addresses
 *     are refused, every redirect hop is re-vetted (max 3), and bodies are
 *     capped. See src/core/safe-fetch.ts.
 */

import { safeFetch, type SafeFetchResult } from "./safe-fetch.js";
import { publicPageCap } from "../utils/outbound-budget.js";

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
  /** Set once a fetch is refused for the caller's outbound budget. */
  budgetExhausted = false;

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
    const res = await this.fetchResult(url);
    return res.ok ? { status: res.status, body: res.body } : null;
  }

  /** Like fetchText, but keeps the generic error code (blocked_address, timeout, …). */
  async fetchResult(url: string): Promise<SafeFetchResult> {
    let host: string;
    try {
      host = new URL(url).host;
    } catch {
      return { ok: false, error: "bad_url" };
    }

    await this.limiter.wait(host);

    const res = await safeFetch(url, {
      timeoutMs: this.timeoutMs,
      headers: {
        "user-agent": this.userAgent,
        accept: "text/plain, text/html, application/xml;q=0.9, */*;q=0.5",
      },
    });
    if (!res.ok) {
      if (res.error === "budget_exhausted") this.budgetExhausted = true;
      logger.warn("fetch refused or failed", { host, error: res.error });
    }
    return res;
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
      // Public callers expand at most PUBLIC_MAX_PAGES_PER_CALL child sitemaps.
      const childCap = publicPageCap(children.length).value;
      const all: SitemapEntry[] = [];
      for (const c of children.slice(0, childCap)) {
        if (all.length >= this.maxSitemapPages || this.budgetExhausted) break;
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
      if (out.length >= cap || this.budgetExhausted) break;
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

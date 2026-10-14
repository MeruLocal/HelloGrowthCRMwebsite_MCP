import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { runWithCallContext } from "../../tools/call-context.js";
import { crawlPages } from "../../tools/fetch-page-content.js";
import { checkAiExtractability } from "../../tools/geo-diagnostics.js";
import { scanWebsiteBots } from "../../tools/scan-website-bots.js";
import type { RegisteredTool } from "../../tools/tool-types.js";
import { OUTBOUND_BUDGET_WARNING, publicPageCap, setOutboundStores, takeOutbound } from "../outbound-budget.js";
import { MemoryRateLimitStore } from "../rate-limit-store.js";

const env = { ...process.env };
beforeEach(() => {
  setOutboundStores({ minute: new MemoryRateLimitStore(), hour: new MemoryRateLimitStore() });
  process.env = { ...env, CRAWL_DELAY_MS: "0", SAFE_FETCH_ALLOW_PRIVATE: "1" };
});
afterEach(() => {
  vi.useRealTimers();
  setOutboundStores(null);
  process.env = { ...env };
});

describe("takeOutbound", () => {
  it("exhausts after the per-minute budget", async () => {
    process.env.OUTBOUND_BUDGET_PER_MIN = "3";
    const r = [];
    for (let i = 0; i < 4; i += 1) r.push(await takeOutbound("198.51.100.7"));
    expect(r).toEqual([true, true, true, false]);
    expect(await takeOutbound("198.51.100.8")).toBe(true); // other IPs unaffected
  });

  it("resets after the window", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-14T00:00:00Z"));
    process.env.OUTBOUND_BUDGET_PER_MIN = "1";
    expect(await takeOutbound("198.51.100.7")).toBe(true);
    expect(await takeOutbound("198.51.100.7")).toBe(false);
    vi.setSystemTime(new Date("2026-10-14T00:01:01Z"));
    expect(await takeOutbound("198.51.100.7")).toBe(true);
  });

  it("enforces the hour budget too", async () => {
    process.env.OUTBOUND_BUDGET_PER_MIN = "100";
    process.env.OUTBOUND_BUDGET_PER_HOUR = "2";
    expect([await takeOutbound("x"), await takeOutbound("x"), await takeOutbound("x")]).toEqual([true, true, false]);
  });

  it("caps pages for public callers only", () => {
    expect(publicPageCap(25)).toEqual({ value: 5, capped: true });
    expect(runWithCallContext({ authorized: true }, () => publicPageCap(25))).toEqual({ value: 25, capped: false });
  });
});

describe("crawl tools against a local site", () => {
  let server: http.Server;
  let base: string;
  let pageHits = 0;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      const u = new URL(req.url ?? "/", "http://x");
      if (u.pathname === "/robots.txt") return res.end(`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
      if (u.pathname === "/sitemap.xml") {
        const locs = Array.from({ length: 30 }, (_, i) => `<url><loc>${base}/p${i}</loc></url>`).join("");
        return res.end(`<?xml version="1.0"?><urlset>${locs}</urlset>`);
      }
      pageHits += 1;
      res.setHeader("content-type", "text/html");
      res.end(`<html><head><title>P</title></head><body><main>${"word ".repeat(60)}</main></body></html>`);
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => new Promise<void>((r) => server.close(() => r())));
  beforeEach(() => {
    pageHits = 0;
  });

  async function run(tool: RegisteredTool, args: Record<string, unknown>, authorized: boolean) {
    const parsed = tool.schema.parse(args);
    const res = await runWithCallContext({ authorized, clientIp: "198.51.100.20" }, () => tool.handle(parsed));
    return JSON.parse(res.content[0]!.text);
  }

  it("crawl_pages: a public limit:25 fetches at most 5 pages and says so", async () => {
    const out = await run(crawlPages, { targetUrl: base, limit: 25 }, false);
    expect(out.returned).toBe(5);
    expect(pageHits).toBe(5);
    expect(out.warnings.join(" ")).toMatch(/capped at 5 \(requested 25\)/);
  });

  it("crawl_pages: an authorised session still gets 25", async () => {
    const out = await run(crawlPages, { targetUrl: base, limit: 25 }, true);
    expect(out.returned).toBe(25);
  });

  it("crawl_pages: with a budget of 3 the fourth fetch is refused and the result is partial", async () => {
    process.env.OUTBOUND_BUDGET_PER_MIN = "3";
    const out = await run(crawlPages, { targetUrl: base, limit: 5 }, false);
    // robots + sitemap + 1 page = 3 fetches
    expect(out.returned).toBe(1);
    expect(out.warnings).toContain(OUTBOUND_BUDGET_WARNING);
  });

  it("scan_website_bots: public sampleSize is capped at 5", async () => {
    const out = await run(scanWebsiteBots, { targetUrl: base, sampleSize: 100 }, false);
    expect(out.sampledPages).toBe(5);
    expect(out.warnings.join(" ")).toMatch(/sampleSize capped at 5/);
  });

  it("check_ai_extractability: public calls check the first 5 URLs", async () => {
    const urls = Array.from({ length: 8 }, (_, i) => `${base}/p${i}`);
    const out = await run(checkAiExtractability, { urls }, false);
    expect(out.checked).toBe(5);
    expect(out.warnings.join(" ")).toMatch(/urls capped at 5/);
  });
});

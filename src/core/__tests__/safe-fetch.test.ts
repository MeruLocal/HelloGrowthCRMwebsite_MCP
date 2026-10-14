import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { fetchPageContent } from "../../tools/fetch-page-content.js";
import { generateRobotsTxt } from "../../tools/generate-robots-txt.js";
import { isBlockedAddress, safeFetch } from "../safe-fetch.js";

describe("isBlockedAddress", () => {
  it.each([
    // [address, blocked]
    ["0.0.0.0", true],
    ["0.255.255.255", true],
    ["1.0.0.0", false],
    ["9.255.255.255", false],
    ["10.0.0.0", true],
    ["10.255.255.255", true],
    ["11.0.0.0", false],
    ["100.63.255.255", false],
    ["100.64.0.0", true],
    ["100.127.255.255", true],
    ["100.128.0.0", false],
    ["126.255.255.255", false],
    ["127.0.0.1", true],
    ["128.0.0.0", false],
    ["169.253.255.255", false],
    ["169.254.169.254", true],
    ["169.255.0.0", false],
    ["172.15.255.255", false],
    ["172.16.0.0", true],
    ["172.31.255.255", true],
    ["172.32.0.0", false],
    ["192.0.0.1", true],
    ["192.0.1.0", false],
    ["192.167.255.255", false],
    ["192.168.1.1", true],
    ["192.169.0.0", false],
    ["198.17.255.255", false],
    ["198.18.0.0", true],
    ["198.19.255.255", true],
    ["198.20.0.0", false],
    ["223.255.255.255", false],
    ["224.0.0.1", true],
    ["240.0.0.1", true],
    ["255.255.255.255", true],
    ["8.8.8.8", false],
    ["::", true],
    ["::1", true],
    ["::2", true], // ::/96 IPv4-compatible → 0.0.0.2
    ["fc00::1", true],
    ["fdff:ffff::1", true],
    ["fe80::1", true],
    ["febf::1", true],
    ["fec0::1", false],
    ["ff02::1", true],
    ["::ffff:127.0.0.1", true],
    ["::ffff:7f00:1", true],
    ["::ffff:169.254.169.254", true],
    ["::ffff:8.8.8.8", false],
    ["64:ff9b::a00:1", true],
    ["2002:7f00:1::", true],
    ["2001:0:4136:e378:8000:63bf:3fff:fdd2", true], // Teredo
    ["2001:db8::1", false],
    ["192.88.99.1", true],
    ["192.88.100.1", false],
    ["2002:808:808::", false],
    ["2606:4700:4700::1111", false],
    ["2001:4860:4860::8888", false],
    ["not-an-ip", true],
  ])("%s → blocked=%s", (ip, blocked) => {
    expect(isBlockedAddress(ip)).toBe(blocked);
  });
});

describe("safeFetch", () => {
  let server: http.Server;
  let base: string;
  const prev = process.env.SAFE_FETCH_ALLOW_PRIVATE;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      const u = new URL(req.url ?? "/", "http://x");
      if (u.pathname === "/ok") return res.end("hello");
      if (u.pathname === "/to-metadata") {
        res.writeHead(302, { location: "http://169.254.169.254/latest/meta-data/" });
        return res.end();
      }
      if (u.pathname === "/to-private-name") {
        res.writeHead(302, { location: "http://10.1.2.3/" });
        return res.end();
      }
      if (u.pathname.startsWith("/loop/")) {
        const n = Number(u.pathname.split("/")[2]);
        res.writeHead(302, { location: `/loop/${n + 1}` });
        return res.end();
      }
      if (u.pathname === "/big") {
        res.write("x".repeat(64 * 1024));
        res.write("x".repeat(64 * 1024));
        return res.end("x".repeat(64 * 1024));
      }
      if (u.pathname === "/slow") {
        setTimeout(() => res.end("late"), 2_000);
        return;
      }
      res.statusCode = 404;
      res.end();
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => new Promise<void>((r) => server.close(() => r())));
  afterEach(() => {
    if (prev === undefined) delete process.env.SAFE_FETCH_ALLOW_PRIVATE;
    else process.env.SAFE_FETCH_ALLOW_PRIVATE = prev;
  });

  it("rejects non-http schemes and userinfo", async () => {
    expect(await safeFetch("file:///etc/hostname")).toEqual({ ok: false, error: "bad_scheme" });
    expect(await safeFetch("gopher://example.com/")).toEqual({ ok: false, error: "bad_scheme" });
    expect(await safeFetch("http://user:pass@example.com/")).toEqual({ ok: false, error: "bad_url" });
  });

  it("blocks a loopback server by default", async () => {
    delete process.env.SAFE_FETCH_ALLOW_PRIVATE;
    expect(await safeFetch(`${base}/ok`)).toEqual({ ok: false, error: "blocked_address" });
    expect(await safeFetch("http://localhost:1/")).toEqual({ ok: false, error: "blocked_address" });
    expect(await safeFetch("http://[::1]:1/")).toEqual({ ok: false, error: "blocked_address" });
  });

  describe("with the loopback escape hatch", () => {
    it("fetches loopback", async () => {
      process.env.SAFE_FETCH_ALLOW_PRIVATE = "1";
      const res = await safeFetch(`${base}/ok`);
      expect(res).toMatchObject({ ok: true, status: 200, body: "hello", truncated: false });
    });

    it("still blocks a redirect to the metadata address or RFC 1918", async () => {
      process.env.SAFE_FETCH_ALLOW_PRIVATE = "1";
      expect(await safeFetch(`${base}/to-metadata`)).toEqual({ ok: false, error: "blocked_address" });
      expect(await safeFetch(`${base}/to-private-name`)).toEqual({ ok: false, error: "blocked_address" });
    });

    it("fails after more than 3 redirects", async () => {
      process.env.SAFE_FETCH_ALLOW_PRIVATE = "1";
      expect(await safeFetch(`${base}/loop/0`)).toEqual({ ok: false, error: "too_many_redirects" });
      const three = await safeFetch(`${base}/loop/0`, { maxRedirects: 5 });
      expect(three.ok).toBe(false); // /loop never ends
    });

    it("truncates a body over the cap", async () => {
      process.env.SAFE_FETCH_ALLOW_PRIVATE = "1";
      const res = await safeFetch(`${base}/big`, { maxBytes: 1000 });
      expect(res).toMatchObject({ ok: true, truncated: true, bytes: 1000 });
      if (res.ok) expect(res.body.length).toBe(1000);
    });

    it("times out a slow server", async () => {
      process.env.SAFE_FETCH_ALLOW_PRIVATE = "1";
      expect(await safeFetch(`${base}/slow`, { timeoutMs: 200 })).toEqual({ ok: false, error: "timeout" });
    });
  });
});

describe("tools refuse private addresses", () => {
  it("fetch_page_content on the metadata address is an error naming blocked_address", async () => {
    const res = await fetchPageContent.handle(
      fetchPageContent.schema.parse({ url: "http://169.254.169.254/latest/meta-data/" }),
    );
    expect(res.isError).toBe(true);
    expect(res.content[0]!.text).toContain("blocked_address");
  });
});

describe("generate_robots_txt", () => {
  it("rejects newline injection in sitemapUrls and disallow values", () => {
    expect(
      generateRobotsTxt.schema.safeParse({ sitemapUrls: ["https://example.com/s.xml\nUser-agent: *\nDisallow: /"] })
        .success,
    ).toBe(false);
    expect(generateRobotsTxt.schema.safeParse({ sitemapUrls: ["ftp://example.com/s.xml"] }).success).toBe(false);
    expect(generateRobotsTxt.schema.safeParse({ extraDisallowPaths: ["/a\r\nAllow: /"] }).success).toBe(false);
    expect(generateRobotsTxt.schema.safeParse({ extraDisallowUserAgents: ["X\nDisallow:"] }).success).toBe(false);
    expect(generateRobotsTxt.schema.safeParse({ sitemapUrls: ["https://example.com/sitemap.xml"] }).success).toBe(true);
  });
});

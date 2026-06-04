import { describe, expect, it } from "vitest";
import {
  isDisallowed,
  parseRobotsTxt,
  parseSitemap,
  parseSitemapIndex,
  rulesFor,
} from "../robots-parser.js";

const SAMPLE = `
# Example robots.txt
User-agent: *
Disallow: /admin
Allow: /admin/public
Crawl-delay: 5

User-agent: Googlebot
Disallow: /no-google

Sitemap: https://example.com/sitemap.xml
`;

describe("parseRobotsTxt", () => {
  it("parses groups, rules, crawl-delay and sitemaps", () => {
    const robots = parseRobotsTxt(SAMPLE);
    expect(robots.groups).toHaveLength(2);
    expect(robots.sitemaps).toEqual(["https://example.com/sitemap.xml"]);

    const star = robots.groups.find((g) => g.userAgents.includes("*"));
    expect(star?.disallow).toContain("/admin");
    expect(star?.allow).toContain("/admin/public");
    expect(star?.crawlDelaySeconds).toBe(5);
  });

  it("ignores comments and blank lines", () => {
    const robots = parseRobotsTxt("# only a comment\n\n");
    expect(robots.groups).toHaveLength(0);
  });
});

describe("rulesFor", () => {
  it("prefers the most specific matching user-agent", () => {
    const robots = parseRobotsTxt(SAMPLE);
    const rules = rulesFor(robots, "Googlebot/2.1");
    expect(rules?.disallow).toContain("/no-google");
  });

  it("falls back to the wildcard group", () => {
    const robots = parseRobotsTxt(SAMPLE);
    const rules = rulesFor(robots, "SomeUnknownBot");
    expect(rules?.disallow).toContain("/admin");
  });
});

describe("isDisallowed", () => {
  const robots = parseRobotsTxt(SAMPLE);

  it("blocks a disallowed path", () => {
    expect(isDisallowed(robots, "RandomBot", "/admin/settings")).toBe(true);
  });

  it("honours a more specific Allow rule", () => {
    expect(isDisallowed(robots, "RandomBot", "/admin/public")).toBe(false);
  });

  it("allows unrelated paths", () => {
    expect(isDisallowed(robots, "RandomBot", "/blog/post-1")).toBe(false);
  });
});

describe("sitemap parsing", () => {
  it("extracts url entries with optional metadata", () => {
    const xml = `
      <urlset>
        <url><loc>https://example.com/a</loc><priority>0.8</priority></url>
        <url><loc>https://example.com/b</loc><lastmod>2026-01-01</lastmod></url>
      </urlset>`;
    const entries = parseSitemap(xml);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ loc: "https://example.com/a", priority: 0.8 });
    expect(entries[1]?.lastmod).toBe("2026-01-01");
  });

  it("extracts child sitemaps from an index", () => {
    const xml = `
      <sitemapindex>
        <sitemap><loc>https://example.com/sitemap-1.xml</loc></sitemap>
        <sitemap><loc>https://example.com/sitemap-2.xml</loc></sitemap>
      </sitemapindex>`;
    expect(parseSitemapIndex(xml)).toEqual([
      "https://example.com/sitemap-1.xml",
      "https://example.com/sitemap-2.xml",
    ]);
  });
});

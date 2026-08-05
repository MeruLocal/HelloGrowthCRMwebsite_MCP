import { describe, expect, it } from "vitest";
import {
  classifyExtractability,
  countLocs,
  measureRegions,
  parseSitemapIndex,
} from "../geo-diagnostics.js";

/**
 * The regression this file exists for: a page that looks perfectly healthy —
 * HTTP 200, full <head>, canonical, JSON-LD — while <main> is an empty
 * streaming shell and the real content sits in hidden divs outside it.
 */
const STREAMED_SHELL_HTML = `<!doctype html><html><head>
<title>AI CRM Software Pricing 2026</title>
<link rel="canonical" href="https://example.com/pricing">
</head><body>
<main><div class="skeleton"></div></main>
<div hidden id="S:0"><h1>Pricing</h1><p>${"Real streamed content. ".repeat(60)}</p></div>
<div hidden id="S:1"><p>${"More streamed content. ".repeat(60)}</p></div>
</body></html>`;

const HEALTHY_HTML = `<!doctype html><html><head><title>Fine</title></head><body>
<main><h1>Pricing</h1><p>${"Content rendered inside main. ".repeat(60)}</p></main>
</body></html>`;

describe("measureRegions", () => {
  it("reports <main> as empty while content lives elsewhere", () => {
    const m = measureRegions(STREAMED_SHELL_HTML);
    expect(m.main).toBeLessThan(200);
    expect(m.body).toBeGreaterThan(2000);
  });

  it("measures a normally-rendered page as healthy", () => {
    const m = measureRegions(HEALTHY_HTML);
    expect(m.main).toBeGreaterThan(1000);
  });

  it("returns null for a missing region rather than 0", () => {
    // 0 would be indistinguishable from "present but empty" — a different bug.
    const m = measureRegions("<div>no main, no body tag</div>");
    expect(m.main).toBeNull();
    expect(m.body).toBeNull();
    expect(m.document).toBeGreaterThan(0);
  });

  it("ignores script and style content when measuring", () => {
    const html = `<body><main><script>${"x".repeat(5000)}</script><style>${"y".repeat(
      5000,
    )}</style>short</main></body>`;
    expect(measureRegions(html).main).toBeLessThan(200);
  });
});

describe("classifyExtractability", () => {
  it("flags the streamed-shell page as content-hidden, not as empty", () => {
    expect(classifyExtractability(measureRegions(STREAMED_SHELL_HTML))).toBe(
      "main_empty_content_hidden",
    );
  });

  it("passes a normally-rendered page", () => {
    expect(classifyExtractability(measureRegions(HEALTHY_HTML))).toBe("ok");
  });

  it("distinguishes a genuinely empty page from a hidden-content one", () => {
    expect(classifyExtractability({ main: 0, body: 10, document: 10 })).toBe(
      "page_empty",
    );
  });

  it("reports a missing <main> separately from an empty one", () => {
    expect(
      classifyExtractability({ main: null, body: 5000, document: 5000 }),
    ).toBe("no_main_element");
  });
});

describe("parseSitemapIndex", () => {
  it("extracts child sitemap URLs from an index", () => {
    const xml = `<?xml version="1.0"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/blog-sitemap.xml</loc><lastmod>2026-08-05</lastmod></sitemap>
  <sitemap><loc>https://example.com/alternatives-sitemap.xml</loc></sitemap>
</sitemapindex>`;
    expect(parseSitemapIndex(xml)).toEqual([
      "https://example.com/blog-sitemap.xml",
      "https://example.com/alternatives-sitemap.xml",
    ]);
  });

  it("does not mistake a urlset's <loc> entries for child sitemaps", () => {
    const urlset = `<urlset><url><loc>https://example.com/a</loc></url></urlset>`;
    expect(parseSitemapIndex(urlset)).toEqual([]);
  });

  it("returns an empty list for junk rather than throwing", () => {
    expect(parseSitemapIndex("not xml at all")).toEqual([]);
  });
});

describe("countLocs", () => {
  it("counts URL entries", () => {
    expect(
      countLocs("<urlset><url><loc>a</loc></url><url><loc>b</loc></url></urlset>"),
    ).toBe(2);
  });

  it("returns 0 for an empty sitemap", () => {
    expect(countLocs("<urlset></urlset>")).toBe(0);
  });
});

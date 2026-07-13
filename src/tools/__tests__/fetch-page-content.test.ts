/**
 * Regression tests for the extract() helper behind fetch_page_content and
 * crawl_pages.
 *
 * The critical case: Next.js App Router streaming (Suspense/PPR) ships an
 * EMPTY <main> shell in the initial HTML and streams the real content later
 * in the document inside `<div hidden id="S:n">` blocks. extract() must not
 * blindly prefer <main> — it must fall back to a region that actually
 * contains readable text. (Live bug: every hellogrowthcrm.com page returned
 * text: "" / wordCount: 0 through the deployed MCP.)
 */

import { describe, expect, it } from "vitest";

import { extract } from "../fetch-page-content.js";

const BASE = "https://hellogrowthcrm.com/pricing";

const HEAD = `<head>
  <title>CRM pricing comparison — AI CRM Software | HelloGrowthCRM</title>
  <meta name="description" content="Transparent CRM pricing: free forever plan." />
  <meta name="robots" content="index, follow" />
  <meta property="og:title" content="CRM pricing comparison" />
  <link rel="canonical" href="https://hellogrowthcrm.com/pricing" />
</head>`;

const CONTENT = `
  <h1>CRM Pricing</h1>
  <p>${"Transparent pricing for every team size. ".repeat(20)}</p>
  <h2>Free plan</h2>
  <p>Up to 200 leads, no credit card required.</p>
  <a href="/free-trial">Start free trial</a>
  <a href="https://hellogrowthcrm.com/compare/hubspot">Compare with HubSpot</a>`;

describe("extract", () => {
  it("uses <main> when it contains real content", () => {
    const html = `<html>${HEAD}<body><nav><a href="/">Home</a></nav><main>${CONTENT}</main><footer>Footer</footer></body></html>`;
    const out = extract(html, BASE);

    expect(out.title).toContain("CRM pricing comparison");
    expect(out.headings.map((h) => h.text)).toContain("CRM Pricing");
    expect(out.text).toContain("Transparent pricing");
    // Content came from <main>, so the nav link is not included.
    expect(out.links.find((l) => l.text === "Home")).toBeUndefined();
  });

  it("falls back to <body> when <main> is an empty streaming shell (Next.js Suspense/PPR)", () => {
    const html = `<html>${HEAD}<body>
      <nav><a href="/">Home</a></nav>
      <main id="main-content"><div class="loading-skeleton"></div></main>
      <script>self.__next_f.push([1,"chunk"])</script>
      <div hidden id="S:0">${CONTENT}</div>
      <div hidden id="S:1"><p>More streamed content about WhatsApp CRM plans.</p></div>
    </body></html>`;
    const out = extract(html, BASE);

    // Must NOT return the empty <main> shell.
    expect(out.text.length).toBeGreaterThan(200);
    expect(out.text).toContain("Transparent pricing");
    expect(out.text).toContain("More streamed content");
    expect(out.headings.map((h) => h.text)).toContain("CRM Pricing");
    expect(out.links.some((l) => l.href.includes("/free-trial"))).toBe(true);
    // Script content must never leak into the text.
    expect(out.text).not.toContain("__next_f");
  });

  it("falls back to the whole document when there is no <main> or <body>", () => {
    const html = `${HEAD}${CONTENT}`;
    const out = extract(html, BASE);

    expect(out.text).toContain("Transparent pricing");
    expect(out.title).toContain("CRM pricing comparison");
  });

  it("still returns the least-empty region when nothing meets the threshold", () => {
    const html = `<html>${HEAD}<body><main><p>Tiny.</p></main></body></html>`;
    const out = extract(html, BASE);

    expect(out.text).toContain("Tiny.");
  });

  it("extracts head metadata regardless of body shape", () => {
    const html = `<html>${HEAD}<body><main></main></body></html>`;
    const out = extract(html, BASE);

    expect(out.metaDescription).toContain("Transparent CRM pricing");
    expect(out.canonical).toBe("https://hellogrowthcrm.com/pricing");
    expect(out.robots).toBe("index, follow");
    expect(out.ogTitle).toBe("CRM pricing comparison");
  });
});

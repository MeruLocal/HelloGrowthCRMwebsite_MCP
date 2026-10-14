import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { HOME_PAGE_HTML, ROBOTS_TXT } from "../server.js";

const count = (hay: string, needle: string) => hay.split(needle).length - 1;
const main = HOME_PAGE_HTML.slice(HOME_PAGE_HTML.indexOf("<main>"), HOME_PAGE_HTML.indexOf("</main>"));

describe("landing page (#74)", () => {
  it.each(["Read-only", "never send", "No credentials"])("says %j exactly once", (s) => {
    expect(count(main, s)).toBe(1);
  });

  it.each(["/health", "/version", "/.well-known/mcp.json"])("links %s exactly once (one status row)", (path) => {
    expect(count(main, `href="${path}"`)).toBe(1);
  });

  it("says /sse speaks Streamable HTTP and how to use Inspector", () => {
    expect(main).toContain("Streamable HTTP");
    expect(main).toContain("--transport http");
  });

  it("keeps both analytics tags", () => {
    expect(HOME_PAGE_HTML).toContain("googletagmanager.com/gtag/js");
    expect(HOME_PAGE_HTML).toContain("analytics.ahrefs.com/analytics.js");
  });
});

describe("robots.txt (#74)", () => {
  it("is today's served content", () => {
    expect(ROBOTS_TXT).toBe("User-agent: *\nAllow: /$\nDisallow: /sse\n");
  });

  it("has a single source in server.ts", () => {
    const src = readFileSync(join(__dirname, "..", "server.ts"), "utf8");
    expect(count(src, "Disallow:")).toBe(1);
    expect(src).toMatch(/send\(200, "text\/plain; charset=utf-8", ROBOTS_TXT\)/);
  });
});

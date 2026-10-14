import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";

import { buildServer } from "../../server.js";
import { tagContentText, tagText, withUtm } from "../utm.js";

const Q = "utm_source=mcp&utm_medium=ai_agent&utm_campaign=t";

describe("withUtm", () => {
  it("tags the own host", () => {
    expect(withUtm("https://hellogrowthcrm.com/pricing", "t")).toBe(`https://hellogrowthcrm.com/pricing?${Q}`);
  });
  it("tags the app. subdomain", () => {
    expect(withUtm("https://app.hellogrowthcrm.com/signup", "t")).toBe(`https://app.hellogrowthcrm.com/signup?${Q}`);
  });
  it("keeps an existing query and the fragment", () => {
    expect(withUtm("https://hellogrowthcrm.com/a?x=1#top", "t")).toBe(`https://hellogrowthcrm.com/a?x=1&${Q}#top`);
  });
  it("leaves an existing utm_source alone", () => {
    const u = "https://hellogrowthcrm.com/a?utm_source=newsletter";
    expect(withUtm(u, "t")).toBe(u);
  });
  it("leaves external URLs untouched", () => {
    for (const u of ["https://www.hubspot.com/pricing", "https://youtube.com/watch?v=x", "https://evilhellogrowthcrm.com/"]) {
      expect(withUtm(u, "t")).toBe(u);
    }
  });
  it("excludes the mcp. host", () => {
    expect(withUtm("https://mcp.hellogrowthcrm.com/sse", "t")).toBe("https://mcp.hellogrowthcrm.com/sse");
  });
  it("tags URLs inside prose without swallowing punctuation", () => {
    expect(tagText("See https://hellogrowthcrm.com/pricing.", "t")).toBe(`See https://hellogrowthcrm.com/pricing?${Q}.`);
  });
  it("does not tag identifier keys in JSON", () => {
    const out = JSON.parse(
      tagContentText(JSON.stringify({ canonical: "https://hellogrowthcrm.com/a", url: "https://hellogrowthcrm.com/a" }), "t"),
    );
    expect(out.canonical).toBe("https://hellogrowthcrm.com/a");
    expect(out.url).toContain("utm_campaign=t");
  });
});

describe("over the protocol", () => {
  async function client() {
    const server = buildServer();
    const [a, b] = InMemoryTransport.createLinkedPair();
    const c = new Client({ name: "t", version: "0" });
    await Promise.all([server.connect(a), c.connect(b)]);
    return c;
  }
  const urlsIn = (text: string) => text.match(/https?:\/\/[^\s"]+/g) ?? [];

  it("content_get_comparison output URLs carry utm_campaign=<tool>", async () => {
    const c = await client();
    const res = await c.callTool({ name: "content_get_comparison", arguments: { slug: "hubspot" } });
    const own = urlsIn((res.content as { text: string }[])[0]!.text).filter((u) => /\/\/([a-z]+\.)?hellogrowthcrm\.com/.test(u) && !u.includes("mcp."));
    expect(own.length).toBeGreaterThan(0);
    for (const u of own) expect(u).toContain("utm_campaign=content_get_comparison");
  });

  it("seo_get_canonical output is not tagged", async () => {
    const c = await client();
    const res = await c.callTool({ name: "seo_get_canonical", arguments: { path: "/pricing" } });
    expect((res.content as { text: string }[])[0]!.text).not.toContain("utm_");
  });

  it("resources are tagged except the SEO rules", async () => {
    const c = await client();
    const cmp = await c.readResource({ uri: "hellocrmwebsite://site/comparisons" });
    expect((cmp.contents[0] as { text: string }).text).toContain("utm_campaign=resource_comparisons");
    const rules = await c.readResource({ uri: "hellocrmwebsite://site/seo-rules" });
    expect((rules.contents[0] as { text: string }).text).not.toContain("utm_");
  });
});

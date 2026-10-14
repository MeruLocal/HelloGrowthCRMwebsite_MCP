/**
 * Roadmap Phase 3 (issue #41) and dev handoff C1/C2, checked over the real
 * protocol with the SDK client. The client validates structuredContent against
 * each tool's outputSchema itself, so a schema/payload mismatch fails here the
 * same way it would fail in a real MCP client.
 */

import { describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { CHANGELOG_URI, buildServer } from "../server.js";
import { toolsByName } from "../tools/index.js";
import { TOOL_TITLES } from "../tools/titles.js";
import { OUTPUT_SCHEMAS } from "../tools/output-schemas.js";

async function connect(): Promise<Client> {
  const server = buildServer({ authorized: false });
  const [c, s] = InMemoryTransport.createLinkedPair();
  await server.connect(s);
  const client = new Client({ name: "polish-test", version: "0.0.0" });
  await client.connect(c);
  return client;
}

describe("3.1 titles", () => {
  it("every registered tool has a title, and the map has no stale entries", () => {
    for (const [name, t] of toolsByName) expect(t.definition.title, name).toBeTruthy();
    expect(Object.keys(TOOL_TITLES).sort()).toEqual([...toolsByName.keys()].sort());
  });

  it("titles are short and unique", () => {
    const titles = Object.values(TOOL_TITLES);
    expect(new Set(titles).size).toBe(titles.length);
    for (const t of titles) expect(t.length).toBeLessThanOrEqual(40);
  });

  it("tools/list carries the title", async () => {
    const client = await connect();
    const { tools } = await client.listTools();
    expect(tools.every((t) => typeof t.title === "string" && t.title.length > 0)).toBe(true);
    await client.close();
  });
});

describe("3.2 outputSchema + structuredContent", () => {
  // Every argument variant that changes the payload's shape.
  const VARIANTS: Record<string, Array<Record<string, unknown>>> = {
    pricing_get_plans: [{}, { region: "global" }, { region: "india" }, { plan: "growth" }],
    features_list: [{}, { category: "Core CRM" }, { plan: "free" }],
    templates_list: [{}, { category: "pipeline" }, { search: "zzz-no-match" }],
    changelog_list_releases: [{}, { limit: 1 }, { tag: "fix" }],
    glossary_list_terms: [{}, { search: "lead" }],
    products_list: [{}, { search: "zzz-no-match" }],
    guides_list: [{}, { search: "lead" }],
    alternatives_list: [{}, { search: "hubspot" }],
    faqs_get_site: [{}, { search: "price" }],
  };

  it("only public, registered tools carry an outputSchema", () => {
    for (const name of Object.keys(OUTPUT_SCHEMAS)) {
      expect(toolsByName.get(name)?.definition.outputSchema, name).toBeDefined();
    }
  });

  it.each(Object.keys(OUTPUT_SCHEMAS))("%s returns structuredContent that matches its schema", async (name) => {
    const client = await connect();
    const listed = (await client.listTools()).tools.find((t) => t.name === name);
    expect(listed?.outputSchema).toBeDefined();
    for (const args of VARIANTS[name] ?? [{}]) {
      // callTool throws if structuredContent is missing or fails the schema.
      const result = await client.callTool({ name, arguments: args });
      expect(result.isError, JSON.stringify(args)).toBeFalsy();
      expect(result.structuredContent).toEqual(
        JSON.parse((result.content as Array<{ text: string }>)[0]!.text),
      );
    }
    await client.close();
  });

  it("tools without a schema are unchanged (no structuredContent)", async () => {
    const client = await connect();
    const result = await client.callTool({ name: "pricing_get_faq", arguments: {} });
    expect(result.structuredContent).toBeUndefined();
    await client.close();
  });
});

describe("3.4 listChanged decision", () => {
  it("declares tools.listChanged false explicitly", async () => {
    const client = await connect();
    expect(client.getServerCapabilities()?.tools).toEqual({ listChanged: false });
    await client.close();
  });
});

describe("C2 changelog resource", () => {
  it("is listed and returns this repo's CHANGELOG.md", async () => {
    const client = await connect();
    const { resources } = await client.listResources();
    expect(resources.map((r) => r.uri)).toContain(CHANGELOG_URI);
    const read = await client.readResource({ uri: CHANGELOG_URI });
    const text = (read.contents[0] as { text: string }).text;
    expect(read.contents[0]!.mimeType).toBe("text/markdown");
    expect(text).toMatch(/^# Changelog/);
    expect(text).toMatch(/## \[2\.0\.0\]/);
    await client.close();
  });
});

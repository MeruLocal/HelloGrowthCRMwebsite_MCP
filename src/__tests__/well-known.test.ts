import { describe, expect, it } from "vitest";
import { buildWellKnownManifest } from "../well-known.js";
import { SERVER_NAME, SERVER_TITLE, SERVER_VERSION, SERVER_DESCRIPTION } from "../server-info.js";

describe("/.well-known/mcp.json manifest", () => {
  const doc = JSON.parse(buildWellKnownManifest({ tools: 88, resources: 9 }));

  it("reports the same identity as serverInfo, /version and the landing page", () => {
    // The whole point of building this from server-info.ts: a fourth hand-written
    // copy of the identity is a fourth thing to forget, and the last hand-written
    // description of this server (openapi.json) described a different product.
    expect(doc.name).toBe(SERVER_NAME);
    expect(doc.title).toBe(SERVER_TITLE);
    expect(doc.version).toBe(SERVER_VERSION);
    expect(doc.description).toBe(SERVER_DESCRIPTION);
  });

  it("declares the transport this server actually speaks", () => {
    expect(doc.transport.type).toBe("streamable-http");
    expect(doc.transport.url).toBe("https://mcp.hellogrowthcrm.com/sse");
  });

  it("declares no authentication and warns against sending credentials", () => {
    expect(doc.authentication.type).toBe("none");
    expect(doc.authentication.note).toMatch(/never send/i);
  });

  it("passes through live counts rather than hard-coding them", () => {
    const other = JSON.parse(buildWellKnownManifest({ tools: 1, resources: 2 }));
    expect(other.capabilities.tools.count).toBe(1);
    expect(other.capabilities.resources.count).toBe(2);
  });

  it("does NOT enumerate tool names — that is what tools/list is for", () => {
    // Guard against re-introducing the /openapi.json failure mode: a second,
    // hand-maintained list of tool names that silently rots out of date.
    const serialized = JSON.stringify(doc);
    expect(serialized).not.toMatch(/"tools"\s*:\s*\[/);
    expect(doc.discovery.tools).toMatch(/tools\/list/);
  });

  it("is valid JSON with a stable shape", () => {
    expect(() => JSON.parse(buildWellKnownManifest({ tools: 88, resources: 9 }))).not.toThrow();
    expect(doc.repository).toContain("MeruLocal/HelloGrowthCRMwebsite_MCP");
  });
});

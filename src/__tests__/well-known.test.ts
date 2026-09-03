import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildWellKnownManifest } from "../well-known.js";
import { SERVER_NAME, SERVER_TITLE, SERVER_VERSION, SERVER_DESCRIPTION } from "../server-info.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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

  it("agrees with the registry manifest on version", () => {
    // server.json is what registries install from; a manifest that advertises a
    // different version points clients at a package that may not exist.
    const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
    const registry = JSON.parse(readFileSync(join(root, "server.json"), "utf8"));
    expect(doc.version).toBe(registry.version);
  });

  it("agrees with server.json about what this server is called", () => {
    // Version parity alone would not have caught this: `name` was the field that
    // actually diverged (hellogrowthcrm-website vs the reverse-DNS registry name),
    // and two manifests disagreeing about the server's own name is the same class
    // of defect that made openapi.json unshippable.
    const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
    const registry = JSON.parse(readFileSync(join(root, "server.json"), "utf8"));
    expect(doc.registry_name).toBe(registry.name);
    expect(doc.version).toBe(registry.version);
  });

  it("declares the transport this server actually speaks", () => {
    expect(doc.transport.type).toBe("streamable-http");
    // Canonical path is /mcp. /sse stays as an alias because published client
    // configs point at it, and because an endpoint NAMED /sse makes clients try
    // the legacy transport and get a 400 — the misdiagnosis this alias exists to end.
    expect(doc.transport.url).toBe("https://mcp.hellogrowthcrm.com/mcp");
    expect(doc.transport.legacy_alias_url).toBe("https://mcp.hellogrowthcrm.com/sse");
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

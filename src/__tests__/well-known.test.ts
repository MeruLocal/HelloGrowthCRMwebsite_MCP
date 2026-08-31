import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildWellKnownManifest } from "../well-known.js";
import {
  SERVER_NAME,
  SERVER_TITLE,
  SERVER_VERSION,
  SERVER_DESCRIPTION,
} from "../server-info.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const manifest = JSON.parse(buildWellKnownManifest({ tools: 88, resources: 9 }));

describe("/.well-known/mcp.json", () => {
  it("reports the same identity as serverInfo", () => {
    expect(manifest.name).toBe(SERVER_NAME);
    expect(manifest.title).toBe(SERVER_TITLE);
    expect(manifest.version).toBe(SERVER_VERSION);
    expect(manifest.description).toBe(SERVER_DESCRIPTION);
  });

  it("agrees with server.json on name-independent release version", () => {
    const registry = JSON.parse(readFileSync(join(root, "server.json"), "utf8"));
    expect(manifest.version).toBe(registry.version);
  });

  it("declares the transport this server actually speaks", () => {
    // Not "sse": that names the older HTTP+SSE transport with a separate
    // /message endpoint, which this server does not implement. GET /sse is a
    // 400 here; the endpoint is POST-only Streamable HTTP.
    expect(manifest.transport.type).toBe("streamable-http");
    expect(manifest.transport.url).toBe("https://mcp.hellogrowthcrm.com/sse");
  });

  it("declares no authentication and warns against sending credentials", () => {
    expect(manifest.authentication.type).toBe("none");
    expect(manifest.authentication.note).toMatch(/never send/i);
  });

  it("carries live counts, not a hand-written tool list", () => {
    // A tool list in the manifest is a second place for names to rot — the
    // exact failure that made /openapi.json advertise 14 tools that did not
    // exist. Counts come from the registry; names come from tools/list.
    expect(manifest.capabilities.tools.count).toBe(88);
    expect(manifest.capabilities.resources.count).toBe(9);
    expect(manifest).not.toHaveProperty("tools");
    expect(JSON.stringify(manifest)).not.toMatch(/get_pricing|search_features|create_contact/);
  });

  it("is valid JSON with a stable shape", () => {
    expect(() => JSON.parse(buildWellKnownManifest({ tools: 1, resources: 0 }))).not.toThrow();
  });
});

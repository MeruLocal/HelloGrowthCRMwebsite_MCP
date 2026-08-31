/**
 * `/.well-known/mcp.json` — the discovery manifest agents and registries probe
 * before they will talk to a remote MCP server.
 *
 * WHY THIS EXISTS: the path returned 404 (so did `/server.json`), even though a
 * registry manifest has been committed at the repo root the whole time. The
 * Dockerfile copies `package.json`, `tsconfig.json`, `src` and `samples` — not
 * `server.json` — so reading that file at runtime would have worked locally and
 * 404'd in production, which is the worse failure. The manifest is therefore
 * BUILT FROM `server-info.ts`, the same single source of truth that feeds
 * `serverInfo`, the landing page and `/version`, so this surface cannot drift
 * from the wire identity the way `/openapi.json` did.
 *
 * DELIBERATELY NOT INCLUDED: a hand-written tool list. A manifest that names
 * tools is a second place for tool names to rot, and the last time this server
 * published a hand-maintained description of its own surface, it advertised 14
 * CRM operations that did not exist. Counts are passed in from the live
 * registry; names are enumerated over the protocol via `tools/list`, which is
 * the one answer that cannot go stale.
 */
import {
  SERVER_NAME,
  SERVER_TITLE,
  SERVER_VERSION,
  SERVER_DESCRIPTION,
} from "./server-info.js";

export const PUBLIC_ORIGIN = "https://mcp.hellogrowthcrm.com";

export interface WellKnownCounts {
  tools: number;
  resources: number;
}

export function buildWellKnownManifest(counts: WellKnownCounts): string {
  return JSON.stringify(
    {
      name: SERVER_NAME,
      title: SERVER_TITLE,
      version: SERVER_VERSION,
      description: SERVER_DESCRIPTION,
      homepage: "https://hellogrowthcrm.com",
      repository: "https://github.com/MeruLocal/HelloGrowthCRMwebsite_MCP",
      changelog:
        "https://github.com/MeruLocal/HelloGrowthCRMwebsite_MCP/blob/main/CHANGELOG.md",
      transport: {
        type: "streamable-http",
        url: `${PUBLIC_ORIGIN}/sse`,
      },
      authentication: {
        type: "none",
        note:
          "Public read-only website mirror + bot governance. No customer data, no CRM " +
          "actions, no API key — never send HelloGrowthCRM credentials to this server.",
      },
      capabilities: {
        tools: { count: counts.tools, listChanged: false },
        resources: { count: counts.resources, subscribe: false, listChanged: false },
      },
      // Enumerate the actual surface here — never a copy of it.
      discovery: {
        tools: "POST /sse → JSON-RPC 'initialize', then 'tools/list'",
        status: `${PUBLIC_ORIGIN}/version`,
      },
    },
    null,
    2,
  );
}

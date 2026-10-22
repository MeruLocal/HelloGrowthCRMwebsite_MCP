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
 *
 * SHAPE IS BESPOKE, DELIBERATELY. `/.well-known/mcp.json` is not a path the MCP
 * specification defines — the SDK vendored here knows only the OAuth well-known
 * paths — so there is no schema to conform to and none is claimed here. The
 * manifest that DOES have a schema is `server.json` at the repo root
 * (`server.schema.json`, reverse-DNS name). To stop the two disagreeing about
 * what this server is called, that registry name is carried here verbatim as
 * `registry_name`, and well-known.test.ts asserts the two stay equal.
 */
import {
  SERVER_NAME,
  SERVER_TITLE,
  SERVER_VERSION,
  SERVER_DESCRIPTION,
} from "./server-info.js";

/**
 * Hardcoded by default on purpose: deriving the origin from the request Host
 * would let anyone who CNAMEs at this server publish their own hostname as the
 * canonical MCP endpoint. Overridable so staging does not advertise production.
 */
export const PUBLIC_ORIGIN =
  process.env.PUBLIC_ORIGIN ?? "https://mcp.hellogrowthcrm.com";

/** Registry manifest name — must equal `name` in the repo-root server.json. */
export const REGISTRY_NAME = "io.github.merulocal/hellogrowthcrm-bot-crawler";

export interface WellKnownCounts {
  tools: number;
  resources: number;
}

export function buildWellKnownManifest(counts: WellKnownCounts): string {
  return JSON.stringify(
    {
      name: SERVER_NAME,
      registry_name: REGISTRY_NAME,
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

/**
 * `/.well-known/mcp/server-card.json` — the SEP-1649-style server card some
 * registries and clients probe. Same single source of truth as the manifest;
 * the spec for cards is still a draft, so this carries only fields that are
 * already facts elsewhere in this file.
 */
export function buildServerCard(counts: { tools: number; resources: number; prompts: number }): string {
  return JSON.stringify(
    {
      serverInfo: { name: SERVER_NAME, title: SERVER_TITLE, version: SERVER_VERSION },
      description: SERVER_DESCRIPTION,
      transport: { type: "streamable-http", endpoint: `${PUBLIC_ORIGIN}/sse`, alias: `${PUBLIC_ORIGIN}/mcp` },
      authentication: { required: false },
      capabilities: {
        tools: { count: counts.tools },
        resources: { count: counts.resources },
        prompts: { count: counts.prompts },
      },
      documentation: "https://hellogrowthcrm.com/agentic-ai/mcp",
      repository: "https://github.com/MeruLocal/HelloGrowthCRMwebsite_MCP",
      registry_name: REGISTRY_NAME,
    },
    null,
    2,
  );
}

/** `llms.txt` for the MCP host: tells an AI agent what this endpoint is and where the canonical pages are. */
export function buildMcpLlmsTxt(): string {
  return [
    "# HelloGrowthCRM MCP server",
    "",
    "> Public, read-only Model Context Protocol server with HelloGrowthCRM product knowledge: pricing, features, integrations, comparisons, guides. No API key. It is not a CRM API and performs no CRM actions.",
    "",
    `- Endpoint (Streamable HTTP): ${PUBLIC_ORIGIN}/sse (alias ${PUBLIC_ORIGIN}/mcp)`,
    `- Manifest: ${PUBLIC_ORIGIN}/.well-known/mcp.json`,
    `- Server card: ${PUBLIC_ORIGIN}/.well-known/mcp/server-card.json`,
    "- Start with the tool buyer_find_answer_pages: it routes a buyer's question to canonical pages and the right detail tool.",
    "- Prices and plan limits come from pricing_get_plans / pricing_get_country_plans; do not quote them from memory.",
    "",
    "## Canonical site",
    "- [HelloGrowthCRM](https://hellogrowthcrm.com)",
    "- [Pricing](https://hellogrowthcrm.com/pricing)",
    "- [About the MCP server](https://hellogrowthcrm.com/agentic-ai/mcp)",
    "- [Site llms.txt](https://hellogrowthcrm.com/llms.txt)",
    "- [Security](https://hellogrowthcrm.com/security)",
    "",
  ].join("\n");
}

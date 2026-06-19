#!/usr/bin/env tsx
/**
 * Seed the standard set of MCP clients and print each plaintext key ONCE.
 *
 * Run:  npx tsx scripts/seed-mcp-clients.ts
 * Or a single client:
 *       npx tsx scripts/seed-mcp-clients.ts --name "Internal AI" --rate 300
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the environment (.env).
 *
 * IMPORTANT: the printed keys are the only time you will ever see them. Store
 * them in your secret manager immediately. Only the SHA-256 hash is saved.
 */

import "dotenv/config";

import {
  createMcpClient,
  type CreateClientInput,
} from "../src/admin/mcpAdmin.js";

const DEFAULT_DOMAINS = ["hellobooks.ai", "hellogrowthcrm.com"];
const PAGE_TOOLS = [
  "getWebsitePage",
  "searchWebsite",
  "getWebsiteSitemap",
  "getWebsiteContent",
];

const SEED: CreateClientInput[] = [
  { aiName: "ChatGPT", clientId: "client_chatgpt", rateLimitPerMinute: 60, allowedTools: PAGE_TOOLS, allowedDomains: DEFAULT_DOMAINS },
  { aiName: "Claude", clientId: "client_claude", rateLimitPerMinute: 60, allowedTools: PAGE_TOOLS, allowedDomains: DEFAULT_DOMAINS },
  { aiName: "Gemini", clientId: "client_gemini", rateLimitPerMinute: 60, allowedTools: PAGE_TOOLS, allowedDomains: DEFAULT_DOMAINS },
  { aiName: "Cursor", clientId: "client_cursor", rateLimitPerMinute: 120, allowedTools: PAGE_TOOLS, allowedDomains: DEFAULT_DOMAINS },
  { aiName: "Windsurf", clientId: "client_windsurf", rateLimitPerMinute: 120, allowedTools: PAGE_TOOLS, allowedDomains: DEFAULT_DOMAINS },
  { aiName: "Perplexity", clientId: "client_perplexity", rateLimitPerMinute: 60, allowedTools: PAGE_TOOLS, allowedDomains: DEFAULT_DOMAINS },
  // Internal AI: higher limit, all tools (empty allowedTools = unrestricted).
  { aiName: "Internal AI", clientId: "client_internal_ai", rateLimitPerMinute: 300, allowedTools: [], allowedDomains: DEFAULT_DOMAINS },
];

function parseArgs(argv: string[]): Partial<CreateClientInput> | null {
  const out: Partial<CreateClientInput> = {};
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    const val = argv[i + 1];
    if (!val) continue;
    if (flag === "--name") out.aiName = val;
    else if (flag === "--rate") out.rateLimitPerMinute = Number(val);
    else if (flag === "--domains") out.allowedDomains = val.split(",");
  }
  return out.aiName ? out : null;
}

async function main() {
  const single = parseArgs(process.argv.slice(2));
  const toCreate = single
    ? [{ aiName: single.aiName!, allowedDomains: DEFAULT_DOMAINS, allowedTools: PAGE_TOOLS, ...single }]
    : SEED;

  console.log("\n  Seeding MCP clients — copy these keys now, they are shown ONCE:\n");
  console.log("  " + "─".repeat(78));

  for (const input of toCreate) {
    try {
      const res = await createMcpClient(input);
      console.log(
        `  ${res.aiName.padEnd(16)} ${res.clientId.padEnd(24)} ${res.apiKey}`,
      );
    } catch (err) {
      console.error(`  ✗ ${input.aiName}: ${(err as Error).message}`);
    }
  }

  console.log("  " + "─".repeat(78));
  console.log("\n  Done. Distribute each key to its client via your secret manager.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

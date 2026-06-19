#!/usr/bin/env tsx
/**
 * ONE-COMMAND real setup for MCP AI-name tracking.
 *
 * Run on a machine that can reach your Supabase (your laptop / server — NOT a
 * sandbox without egress). It:
 *   1. Applies supabase/migrations/0001_mcp_tracking.sql  (creates the tables)
 *   2. Generates a real API key per client, stores only the SHA-256 hash,
 *      and prints each plaintext key ONCE.
 *
 * Everything it writes is REAL data in YOUR database.
 *
 * Requirements:
 *   - npm i pg            (direct Postgres driver, needed to run the DDL)
 *   - In .env, a direct connection string:
 *       SUPABASE_DB_URL=postgresql://postgres:<PASSWORD>@db.<ref>.supabase.co:5432/postgres
 *     Get it from Supabase → Project Settings → Database → Connection string → URI.
 *     (Or use the Session pooler URI on port 5432.)
 *
 * Usage:
 *   npx tsx scripts/setup-mcp-tracking.ts                 # migrate + seed all 7
 *   npx tsx scripts/setup-mcp-tracking.ts --seed-only     # skip migration
 *   npx tsx scripts/setup-mcp-tracking.ts --migrate-only  # tables only, no keys
 */

import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { randomBytes, createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATION = resolve(__dirname, "../supabase/migrations/0001_mcp_tracking.sql");

const DEFAULT_DOMAINS = ["hellobooks.ai", "hellogrowthcrm.com"];
const PAGE_TOOLS = ["getWebsitePage", "searchWebsite", "getWebsiteSitemap", "getWebsiteContent"];

const CLIENTS: {
  aiName: string;
  clientId: string;
  rate: number;
  tools: string[];
}[] = [
  { aiName: "ChatGPT", clientId: "client_chatgpt", rate: 60, tools: PAGE_TOOLS },
  { aiName: "Claude", clientId: "client_claude", rate: 60, tools: PAGE_TOOLS },
  { aiName: "Gemini", clientId: "client_gemini", rate: 60, tools: PAGE_TOOLS },
  { aiName: "Cursor", clientId: "client_cursor", rate: 120, tools: PAGE_TOOLS },
  { aiName: "Windsurf", clientId: "client_windsurf", rate: 120, tools: PAGE_TOOLS },
  { aiName: "Perplexity", clientId: "client_perplexity", rate: 60, tools: PAGE_TOOLS },
  { aiName: "Internal AI", clientId: "client_internal_ai", rate: 300, tools: [] },
];

const genKey = () => `mcp_live_${randomBytes(24).toString("base64url")}`;
const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

async function loadPg() {
  try {
    const mod = await import("pg");
    return (mod as any).default ?? mod;
  } catch {
    console.error(
      "\n  ✗ The 'pg' package is not installed. Run:\n\n      npm i pg\n\n" +
        "  (needed to create tables; the service-role REST key cannot run DDL)\n",
    );
    process.exit(1);
  }
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const seedOnly = args.has("--seed-only");
  const migrateOnly = args.has("--migrate-only");

  const conn = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
  if (!conn) {
    console.error(
      "\n  ✗ Missing SUPABASE_DB_URL (or DATABASE_URL) in .env.\n\n" +
        "  Supabase → Project Settings → Database → Connection string → URI.\n" +
        "  Example:\n" +
        "    SUPABASE_DB_URL=postgresql://postgres:YOURPASS@db.wevwnnzjbrwidvycbkon.supabase.co:5432/postgres\n",
    );
    process.exit(1);
  }

  const pg = await loadPg();
  const client = new pg.Client({
    connectionString: conn,
    ssl: { rejectUnauthorized: false }, // Supabase requires TLS
  });

  await client.connect();
  console.log("  ✓ Connected to Postgres");

  try {
    // 1. Migration
    if (!seedOnly) {
      const sql = await readFile(MIGRATION, "utf8");
      await client.query(sql);
      console.log("  ✓ Migration applied (tables, indexes, RLS, trigger)");
    }
    if (migrateOnly) {
      console.log("\n  Migration-only run complete.\n");
      return;
    }

    // 2. Seed real keys
    console.log("\n  Generating real keys — copy these now, shown ONCE:\n");
    console.log("  " + "─".repeat(82));
    for (const c of CLIENTS) {
      const apiKey = genKey();
      await client.query(
        `insert into public.mcp_clients
           (ai_name, client_id, api_key_hash, status, allowed_tools, allowed_domains, rate_limit_per_minute)
         values ($1,$2,$3,'active',$4::jsonb,$5::jsonb,$6)
         on conflict (client_id) do update
           set api_key_hash = excluded.api_key_hash,
               ai_name = excluded.ai_name,
               allowed_tools = excluded.allowed_tools,
               allowed_domains = excluded.allowed_domains,
               rate_limit_per_minute = excluded.rate_limit_per_minute,
               status = 'active',
               updated_at = now()`,
        [
          c.aiName,
          c.clientId,
          sha256(apiKey),
          JSON.stringify(c.tools),
          JSON.stringify(DEFAULT_DOMAINS),
          c.rate,
        ],
      );
      console.log(`  ${c.aiName.padEnd(13)} ${c.clientId.padEnd(22)} rate=${String(c.rate).padEnd(4)} ${apiKey}`);
    }
    console.log("  " + "─".repeat(82));

    const { rows } = await client.query(
      "select count(*)::int as n from public.mcp_clients",
    );
    console.log(`\n  ✓ ${rows[0].n} clients now stored in mcp_clients (real data).`);
    console.log("  Store the keys in your secret manager — they are unrecoverable.\n");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("\n  ✗ Setup failed:", err.message, "\n");
  process.exit(1);
});

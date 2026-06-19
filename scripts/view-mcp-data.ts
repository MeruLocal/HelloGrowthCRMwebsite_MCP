#!/usr/bin/env tsx
/**
 * View MCP tracking data from the terminal.
 *
 * Reads from your real Supabase using the service-role key already in .env
 * (no DB password / no 'pg' needed). Run on a machine that can reach Supabase.
 *
 * Usage:
 *   npx tsx scripts/view-mcp-data.ts                 # clients + today's summary
 *   npx tsx scripts/view-mcp-data.ts --logs          # + recent 25 audit rows
 *   npx tsx scripts/view-mcp-data.ts --logs --n 100  # last 100 rows
 *   npx tsx scripts/view-mcp-data.ts --ai ChatGPT    # filter logs to one AI
 *   npx tsx scripts/view-mcp-data.ts --status denied # only denied calls
 */

import "dotenv/config";

import {
  listMcpClients,
  viewAuditLogs,
  getDailyActivitySummary,
  type AuditLogFilter,
} from "../src/admin/mcpAdmin.js";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const has = (name: string) => process.argv.includes(`--${name}`);

function rule(label = "") {
  console.log(`\n── ${label} ${"─".repeat(Math.max(0, 70 - label.length))}`);
}

async function main() {
  // 1. Registered clients
  rule("Registered MCP clients");
  const clients = await listMcpClients();
  if (clients.length === 0) {
    console.log("  (none yet — run scripts/seed-mcp-clients.ts or setup-mcp-tracking.ts)");
  } else {
    console.log(
      "  " +
        "AI".padEnd(14) +
        "client_id".padEnd(22) +
        "status".padEnd(10) +
        "rate/min".padEnd(10) +
        "tools  domains",
    );
    for (const c of clients) {
      console.log(
        "  " +
          c.ai_name.padEnd(14) +
          c.client_id.padEnd(22) +
          c.status.padEnd(10) +
          String(c.rate_limit_per_minute).padEnd(10) +
          `${c.allowed_tools.length}      ${c.allowed_domains.length}`,
      );
    }
  }

  // 2. Today's activity summary
  rule("Today's activity (per AI)");
  const summary = await getDailyActivitySummary();
  if (summary.length === 0) {
    console.log("  (no calls logged today)");
  } else {
    console.log(
      "  " +
        "AI".padEnd(28) +
        "calls".padEnd(8) +
        "pages".padEnd(8) +
        "denied",
    );
    for (const s of summary) {
      console.log(
        "  " +
          s.ai_name.padEnd(28) +
          String(s.total_calls).padEnd(8) +
          String(s.pages_accessed).padEnd(8) +
          String(s.denied),
      );
    }
    const blocked = summary.find((s) => s.ai_name === "Unknown / Invalid Client");
    if (blocked) console.log(`\n  → Invalid clients blocked ${blocked.denied} time(s) today.`);
  }

  // 3. Recent audit rows (optional)
  if (has("logs")) {
    const filter: AuditLogFilter = {
      limit: Number(arg("n") ?? 25),
      aiName: arg("ai"),
      status: arg("status") as AuditLogFilter["status"],
      toolName: arg("tool"),
    };
    rule(`Recent audit logs (limit ${filter.limit})`);
    const rows = await viewAuditLogs(filter);
    if (rows.length === 0) {
      console.log("  (no matching rows)");
    } else {
      for (const r of rows) {
        const when = new Date(r.created_at).toISOString().replace("T", " ").slice(0, 19);
        const tag =
          r.status === "success" ? "[ok]" : r.status === "denied" ? "[denied]" : "[fail]";
        console.log(
          `  ${when}  ${tag} ${String(r.ai_name ?? "?").padEnd(12)} ${r.tool_name.padEnd(18)} ${r.status.padEnd(8)} ${r.resource_url ?? r.error_message ?? ""}`,
        );
      }
    }
  } else {
    console.log("\n  (add --logs to see individual audit rows)\n");
  }
}

main().catch((err) => {
  console.error("\n  ✗ Could not read data:", err.message);
  console.error("    Check SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env and network access.\n");
  process.exit(1);
});

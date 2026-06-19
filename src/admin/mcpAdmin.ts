/**
 * Admin operations for MCP client management + audit reporting.
 *
 * Uses the Supabase SERVICE ROLE (server-side only — never expose to a
 * browser). Plaintext API keys are generated here, returned ONCE, and only the
 * SHA-256 hash is persisted.
 */

import { randomBytes } from "node:crypto";

import { getSupabase } from "../lib/supabase.js";
import { hashApiKey, type McpClientStatus } from "../lib/mcpTracking.js";

// ─────────────────────────────────────────────────────────────────────────────
// API key generation
// ─────────────────────────────────────────────────────────────────────────────

/** Generate a random plaintext key like `mcp_live_a1b2c3...` (URL-safe). */
export function generateApiKey(prefix = "mcp_live"): string {
  const random = randomBytes(24).toString("base64url"); // 32 chars, URL-safe
  return `${prefix}_${random}`;
}

/** Stable client_id slug from an AI name, e.g. "Internal AI" → "internal-ai". */
export function slugifyClientId(aiName: string): string {
  return `client_${aiName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Create / rotate
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateClientInput {
  aiName: string;
  clientId?: string;
  allowedTools?: string[];
  allowedDomains?: string[];
  rateLimitPerMinute?: number;
  status?: McpClientStatus;
}

export interface CreateClientResult {
  clientId: string;
  aiName: string;
  /** Plaintext key — show to the operator ONCE, then it is unrecoverable. */
  apiKey: string;
}

/**
 * Create a client. Generates a key, stores only its SHA-256 hash, and returns
 * the plaintext key exactly once.
 */
export async function createMcpClient(
  input: CreateClientInput,
): Promise<CreateClientResult> {
  const supabase = getSupabase();
  const clientId = input.clientId ?? slugifyClientId(input.aiName);
  const apiKey = generateApiKey();

  const { error } = await supabase.from("mcp_clients").insert({
    ai_name: input.aiName,
    client_id: clientId,
    api_key_hash: hashApiKey(apiKey),
    status: input.status ?? "active",
    allowed_tools: input.allowedTools ?? [],
    allowed_domains: input.allowedDomains ?? [],
    rate_limit_per_minute: input.rateLimitPerMinute ?? 60,
  });

  if (error) throw new Error(`createMcpClient failed: ${error.message}`);
  return { clientId, aiName: input.aiName, apiKey };
}

/** Rotate a client's key: returns a new plaintext key, stores the new hash. */
export async function rotateApiKey(clientId: string): Promise<string> {
  const supabase = getSupabase();
  const apiKey = generateApiKey();
  const { error } = await supabase
    .from("mcp_clients")
    .update({ api_key_hash: hashApiKey(apiKey) })
    .eq("client_id", clientId);
  if (error) throw new Error(`rotateApiKey failed: ${error.message}`);
  return apiKey;
}

// ─────────────────────────────────────────────────────────────────────────────
// List / status changes
// ─────────────────────────────────────────────────────────────────────────────

export interface McpClientSummary {
  id: string;
  ai_name: string;
  client_id: string;
  status: McpClientStatus;
  allowed_tools: string[];
  allowed_domains: string[];
  rate_limit_per_minute: number;
  created_at: string;
  updated_at: string;
}

/** List clients. Never returns api_key_hash. */
export async function listMcpClients(): Promise<McpClientSummary[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("mcp_clients")
    .select(
      "id, ai_name, client_id, status, allowed_tools, allowed_domains, rate_limit_per_minute, created_at, updated_at",
    )
    .order("created_at", { ascending: true });
  if (error) throw new Error(`listMcpClients failed: ${error.message}`);
  return (data ?? []) as McpClientSummary[];
}

async function setStatus(
  clientId: string,
  status: McpClientStatus,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("mcp_clients")
    .update({ status })
    .eq("client_id", clientId);
  if (error) throw new Error(`setStatus(${status}) failed: ${error.message}`);
}

export const activateMcpClient = (clientId: string) => setStatus(clientId, "active");
export const deactivateMcpClient = (clientId: string) => setStatus(clientId, "inactive");
export const blockMcpClient = (clientId: string) => setStatus(clientId, "blocked");

/** Update a client's tool/domain/rate-limit policy. */
export async function updateMcpClientPolicy(
  clientId: string,
  patch: Partial<
    Pick<
      CreateClientInput,
      "allowedTools" | "allowedDomains" | "rateLimitPerMinute"
    >
  >,
): Promise<void> {
  const supabase = getSupabase();
  const update: Record<string, unknown> = {};
  if (patch.allowedTools) update.allowed_tools = patch.allowedTools;
  if (patch.allowedDomains) update.allowed_domains = patch.allowedDomains;
  if (patch.rateLimitPerMinute !== undefined)
    update.rate_limit_per_minute = patch.rateLimitPerMinute;
  if (Object.keys(update).length === 0) return;

  const { error } = await supabase
    .from("mcp_clients")
    .update(update)
    .eq("client_id", clientId);
  if (error) throw new Error(`updateMcpClientPolicy failed: ${error.message}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit log viewer (filtered)
// ─────────────────────────────────────────────────────────────────────────────

export interface AuditLogFilter {
  aiName?: string;
  clientId?: string;
  toolName?: string;
  status?: "success" | "failed" | "denied";
  from?: string; // ISO date/time (inclusive)
  to?: string; // ISO date/time (inclusive)
  limit?: number; // default 100, max 1000
  offset?: number;
}

export interface AuditLogRow {
  id: string;
  client_id: string | null;
  ai_name: string | null;
  tool_name: string;
  resource_type: string;
  resource_url: string | null;
  status: string;
  error_message: string | null;
  input_summary: string | null;
  output_summary: string | null;
  ip_address: string | null;
  request_id: string | null;
  created_at: string;
}

/** Query audit logs with optional filters. Newest first. */
export async function viewAuditLogs(
  filter: AuditLogFilter = {},
): Promise<AuditLogRow[]> {
  const supabase = getSupabase();
  const limit = Math.min(Math.max(filter.limit ?? 100, 1), 1000);
  const offset = Math.max(filter.offset ?? 0, 0);

  let q = supabase
    .from("mcp_audit_logs")
    .select(
      "id, client_id, ai_name, tool_name, resource_type, resource_url, status, error_message, input_summary, output_summary, ip_address, request_id, created_at",
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter.aiName) q = q.eq("ai_name", filter.aiName);
  if (filter.clientId) q = q.eq("client_id", filter.clientId);
  if (filter.toolName) q = q.eq("tool_name", filter.toolName);
  if (filter.status) q = q.eq("status", filter.status);
  if (filter.from) q = q.gte("created_at", filter.from);
  if (filter.to) q = q.lte("created_at", filter.to);

  const { data, error } = await q;
  if (error) throw new Error(`viewAuditLogs failed: ${error.message}`);
  return (data ?? []) as AuditLogRow[];
}

/**
 * Aggregate "today's" activity per AI name (pages accessed, tools used,
 * denials). Used by the dashboard summary cards.
 */
export async function getDailyActivitySummary(
  day: string = new Date().toISOString().slice(0, 10),
): Promise<
  {
    ai_name: string;
    total_calls: number;
    pages_accessed: number;
    denied: number;
  }[]
> {
  const supabase = getSupabase();
  const start = `${day}T00:00:00.000Z`;
  const end = `${day}T23:59:59.999Z`;

  const { data, error } = await supabase
    .from("mcp_audit_logs")
    .select("ai_name, status, tool_name")
    .gte("created_at", start)
    .lte("created_at", end);
  if (error) throw new Error(`getDailyActivitySummary failed: ${error.message}`);

  const PAGE_TOOLS = new Set([
    "getWebsitePage",
    "getWebsiteContent",
    "fetch_page_content",
  ]);
  const map = new Map<
    string,
    { ai_name: string; total_calls: number; pages_accessed: number; denied: number }
  >();

  for (const row of (data ?? []) as {
    ai_name: string | null;
    status: string;
    tool_name: string;
  }[]) {
    const key = row.ai_name ?? "Unknown / Invalid Client";
    const acc =
      map.get(key) ??
      { ai_name: key, total_calls: 0, pages_accessed: 0, denied: 0 };
    acc.total_calls += 1;
    if (row.status === "success" && PAGE_TOOLS.has(row.tool_name)) {
      acc.pages_accessed += 1;
    }
    if (row.status === "denied") acc.denied += 1;
    map.set(key, acc);
  }

  return [...map.values()].sort((a, b) => b.total_calls - a.total_calls);
}

/**
 * MCP AI-name tracking.
 *
 * Establishes WHICH AI / client (ChatGPT, Claude, Gemini, Cursor, Windsurf,
 * Perplexity, Internal AI, ...) is calling the website tools, and writes an
 * audit trail of every call.
 *
 * Identity is proven by an API key (or OAuth client id), NOT by user-agent —
 * user-agents are trivially spoofed. The plaintext key is only ever hashed
 * (SHA-256) here; we compare against `mcp_clients.api_key_hash`.
 *
 * Privacy: audit rows store only the URL, a short summary, the tool name, and
 * status. Full page bodies / sensitive content are never persisted.
 */

import { createHash } from "node:crypto";

import { getSupabase } from "./supabase.js";
import { logger } from "../utils/logger.js";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type McpClientStatus = "active" | "inactive" | "blocked";
export type McpAuditStatus = "success" | "failed" | "denied";

/** The identity attached to a request once a client is recognised. */
export interface McpClientContext {
  aiName: string;
  clientId: string;
  allowedTools: string[];
  allowedDomains: string[];
  rateLimitPerMinute: number;
}

/** Minimal request shape we need — works for Node http, SSE, and tests. */
export interface RequestLike {
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string | null };
  method?: string;
}

/** Row shape of `mcp_clients`. */
interface McpClientRow {
  ai_name: string;
  client_id: string;
  status: McpClientStatus;
  allowed_tools: unknown;
  allowed_domains: unknown;
  rate_limit_per_minute: number;
}

/** Error subclass so callers can map identification failures to a 401/403. */
export class McpClientError extends Error {
  constructor(
    message: string,
    readonly code:
      | "no_api_key"
      | "unknown_client"
      | "inactive_client"
      | "blocked_client",
  ) {
    super(message);
    this.name = "McpClientError";
  }
}

/** Thrown by assertToolAllowed / assertDomainAllowed / blockPrivateUrls. */
export class McpAccessError extends Error {
  constructor(
    message: string,
    readonly code:
      | "tool_not_allowed"
      | "domain_not_allowed"
      | "private_url_blocked"
      | "invalid_url",
  ) {
    super(message);
    this.name = "McpAccessError";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API-key handling
// ─────────────────────────────────────────────────────────────────────────────

/** SHA-256 hex digest of a plaintext API key. */
export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey.trim(), "utf8").digest("hex");
}

function headerValue(
  req: RequestLike,
  name: string,
): string | undefined {
  const v = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  const raw = Array.isArray(v) ? v[0] : v;
  return raw?.trim() || undefined;
}

/**
 * Read the API key from `x-mcp-api-key` or `Authorization: Bearer <key>`.
 * Returns null when neither is present.
 */
export function getApiKeyFromRequest(req: RequestLike): string | null {
  const direct = headerValue(req, "x-mcp-api-key");
  if (direct) return direct;

  const auth = headerValue(req, "authorization");
  if (auth) {
    const match = /^Bearer\s+(.+)$/i.exec(auth);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Client identification
// ─────────────────────────────────────────────────────────────────────────────

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  return [];
}

/**
 * Identify the calling MCP client from the request's API key.
 *
 * Steps: extract key → SHA-256 → look up `mcp_clients.api_key_hash` →
 * reject if not found or status !== 'active'. On success returns the context
 * to attach to the request.
 *
 * Throws {@link McpClientError} for every rejection so the caller can both log
 * the denial (with the right code) and return a safe error to the client.
 */
export async function identifyMcpClient(
  req: RequestLike,
): Promise<McpClientContext> {
  const apiKey = getApiKeyFromRequest(req);
  if (!apiKey) {
    throw new McpClientError(
      "Missing API key. Provide 'x-mcp-api-key' or 'Authorization: Bearer <key>'.",
      "no_api_key",
    );
  }

  const apiKeyHash = hashApiKey(apiKey);
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("mcp_clients")
    .select(
      "ai_name, client_id, status, allowed_tools, allowed_domains, rate_limit_per_minute",
    )
    .eq("api_key_hash", apiKeyHash)
    .maybeSingle<McpClientRow>();

  if (error) {
    logger.error("identifyMcpClient: Supabase lookup failed", {
      err: error.message,
    });
    throw new McpClientError("Client lookup failed.", "unknown_client");
  }

  if (!data) {
    throw new McpClientError("Unknown client (no matching API key).", "unknown_client");
  }

  if (data.status === "blocked") {
    throw new McpClientError(
      `Client '${data.ai_name}' is blocked.`,
      "blocked_client",
    );
  }
  if (data.status !== "active") {
    throw new McpClientError(
      `Client '${data.ai_name}' is not active (status: ${data.status}).`,
      "inactive_client",
    );
  }

  return {
    aiName: data.ai_name,
    clientId: data.client_id,
    allowedTools: toStringArray(data.allowed_tools),
    allowedDomains: toStringArray(data.allowed_domains),
    rateLimitPerMinute: data.rate_limit_per_minute,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit logging
// ─────────────────────────────────────────────────────────────────────────────

/** Cap a summary so we never accidentally persist large/sensitive content. */
const SUMMARY_MAX = 500;

function clip(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const s = String(value);
  return s.length > SUMMARY_MAX ? `${s.slice(0, SUMMARY_MAX)}…` : s;
}

export interface AuditLogInput {
  clientId?: string | null;
  aiName?: string | null;
  toolName: string;
  resourceType?: string;
  resourceUrl?: string | null;
  method?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  status: McpAuditStatus;
  errorMessage?: string | null;
  inputSummary?: string | null;
  outputSummary?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Insert one audit row. Non-throwing — a logging failure must never break the
 * tool call. Returns true on success.
 */
export async function createMcpAuditLog(data: AuditLogInput): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("mcp_audit_logs").insert({
      client_id: data.clientId ?? null,
      ai_name: data.aiName ?? null,
      tool_name: data.toolName,
      resource_type: data.resourceType ?? "website",
      resource_url: data.resourceUrl ?? null,
      method: data.method ?? null,
      ip_address: data.ipAddress ?? null,
      user_agent: clip(data.userAgent) ?? null,
      request_id: data.requestId ?? null,
      status: data.status,
      error_message: clip(data.errorMessage) ?? null,
      input_summary: clip(data.inputSummary) ?? null,
      output_summary: clip(data.outputSummary) ?? null,
      metadata: data.metadata ?? {},
    });

    if (error) {
      logger.error("createMcpAuditLog: insert failed", { err: error.message });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("createMcpAuditLog: unexpected error", {
      err: (err as Error).message,
    });
    return false;
  }
}

/** Convenience wrapper: log a successful call. */
export function logMcpSuccess(
  data: Omit<AuditLogInput, "status">,
): Promise<boolean> {
  return createMcpAuditLog({ ...data, status: "success" });
}

/**
 * Convenience wrapper: log a failed or denied call. Defaults to 'failed';
 * pass `denied: true` for permission/security rejections.
 */
export function logMcpFailure(
  data: Omit<AuditLogInput, "status"> & { denied?: boolean },
): Promise<boolean> {
  const { denied, ...rest } = data;
  return createMcpAuditLog({ ...rest, status: denied ? "denied" : "failed" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Permission checks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Assert the client may call `toolName`. An empty `allowedTools` list means
 * "all tools allowed". Throws {@link McpAccessError} otherwise.
 */
export function assertToolAllowed(
  client: McpClientContext,
  toolName: string,
): void {
  if (client.allowedTools.length === 0) return; // unrestricted
  if (!client.allowedTools.includes(toolName)) {
    throw new McpAccessError(
      `Tool '${toolName}' is not permitted for client '${client.aiName}'.`,
      "tool_not_allowed",
    );
  }
}

/**
 * Compare two hostnames as registrable domains. `host` matches `allowed` when
 * it equals it OR is a subdomain of it. Comparison is on parsed hostnames, so
 * `https://evil.com?redirect=hellobooks.ai` does NOT match `hellobooks.ai`.
 */
function hostMatchesDomain(host: string, allowed: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, "");
  const a = allowed.toLowerCase().replace(/^\*\./, "").replace(/\.$/, "");
  return h === a || h.endsWith(`.${a}`);
}

/**
 * Assert the resource URL's HOST is within the client's allowed domains. An
 * empty `allowedDomains` list means "all domains allowed". Validation is by
 * parsed hostname, never substring contains. Throws {@link McpAccessError}.
 */
export function assertDomainAllowed(
  client: McpClientContext,
  resourceUrl: string,
): void {
  if (client.allowedDomains.length === 0) return; // unrestricted

  let host: string;
  try {
    host = new URL(resourceUrl).hostname;
  } catch {
    throw new McpAccessError(`Invalid URL: ${resourceUrl}`, "invalid_url");
  }

  const ok = client.allowedDomains.some((d) => hostMatchesDomain(host, d));
  if (!ok) {
    throw new McpAccessError(
      `Domain '${host}' is not in the allowed list for client '${client.aiName}'.`,
      "domain_not_allowed",
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SSRF protection
// ─────────────────────────────────────────────────────────────────────────────

/** Hostnames that must never be fetched. */
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "ip6-localhost",
  "ip6-loopback",
  "metadata",
  "metadata.google.internal",
]);

/** Exact-match blocked addresses (cloud metadata + obvious loopback/any). */
const BLOCKED_ADDRESSES = new Set([
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "::",
  "169.254.169.254", // AWS/GCP/Azure metadata
  "100.100.100.200", // Alibaba metadata
  "fd00:ec2::254", // AWS IMDS over IPv6
]);

/** True when an IPv4 literal falls in a private / reserved / link-local range. */
function isPrivateIpv4(host: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return false;
  const o = m.slice(1, 5).map(Number);
  if (o.some((n) => n > 255)) return true; // malformed → treat as unsafe
  const [a, b] = o as [number, number, number, number];
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // link-local / metadata
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  if (a >= 224) return true; // multicast / reserved
  return false;
}

/** True for IPv6 loopback, unique-local (fc00::/7), or link-local (fe80::/10). */
function isPrivateIpv6(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (h === "::1" || h === "::") return true;
  if (h.startsWith("fc") || h.startsWith("fd")) return true; // unique local
  if (h.startsWith("fe8") || h.startsWith("fe9") || h.startsWith("fea") || h.startsWith("feb")) {
    return true; // link local fe80::/10
  }
  // IPv4-mapped IPv6, e.g. ::ffff:127.0.0.1
  const mapped = /::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i.exec(h);
  if (mapped?.[1]) return isPrivateIpv4(mapped[1]);
  return false;
}

/**
 * Reject URLs that point at internal / private / metadata endpoints (SSRF
 * defence). Also rejects non-http(s) schemes. Returns the validated URL host
 * on success; throws {@link McpAccessError} otherwise.
 *
 * NOTE: this is a literal-host check. For full protection, also pin DNS
 * resolution at fetch time so a public hostname can't resolve to a private IP
 * (DNS-rebinding). See validateAndResolveUrl() in the example tools.
 */
export function blockPrivateUrls(resourceUrl: string): string {
  let url: URL;
  try {
    url = new URL(resourceUrl);
  } catch {
    throw new McpAccessError(`Invalid URL: ${resourceUrl}`, "invalid_url");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new McpAccessError(
      `Blocked URL scheme '${url.protocol}'. Only http/https are allowed.`,
      "private_url_blocked",
    );
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    BLOCKED_HOSTNAMES.has(host) ||
    BLOCKED_ADDRESSES.has(host) ||
    host.endsWith(".internal") ||
    host.endsWith(".local") ||
    host.endsWith(".localhost") ||
    !host.includes(".") || // bare hostnames like "router" are internal-only
    isPrivateIpv4(host) ||
    isPrivateIpv6(host)
  ) {
    throw new McpAccessError(
      `Blocked internal/private URL: ${host}`,
      "private_url_blocked",
    );
  }

  return host;
}

// ─────────────────────────────────────────────────────────────────────────────
// Request helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Best-effort client IP, honouring x-forwarded-for / x-real-ip if present. */
export function clientIpFromRequest(req: RequestLike): string | undefined {
  const xff = headerValue(req, "x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim();
  return headerValue(req, "x-real-ip") ?? req.socket?.remoteAddress ?? undefined;
}

/** Raw (unparsed) user-agent header, for storage in the audit log. */
export function userAgentFromRequest(req: RequestLike): string | undefined {
  return headerValue(req, "user-agent");
}

/** Request id from a header, or a freshly generated one. */
export function requestIdFromRequest(req: RequestLike): string {
  return (
    headerValue(req, "x-request-id") ??
    headerValue(req, "x-mcp-request-id") ??
    createHash("sha256")
      .update(`${Date.now()}-${Math.random()}`)
      .digest("hex")
      .slice(0, 24)
  );
}

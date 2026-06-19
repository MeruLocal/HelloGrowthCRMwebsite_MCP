/**
 * MCP client-auth middleware.
 *
 * Front door for every website tool call: it identifies the calling AI/client
 * by API key, enforces the per-client rate limit, and produces a "tracking
 * envelope" that tool handlers use to run their permission checks and write
 * audit logs.
 *
 * It does not write a "success" audit row itself — the tool does that once it
 * has an output summary. But it DOES write a 'denied' row on auth / rate-limit
 * rejections so invalid clients still show up in the dashboard
 * ("Invalid clients blocked 3 times").
 */

import {
  McpAccessError,
  McpClientError,
  clientIpFromRequest,
  identifyMcpClient,
  logMcpFailure,
  requestIdFromRequest,
  userAgentFromRequest,
  type McpClientContext,
  type RequestLike,
} from "../lib/mcpTracking.js";
import { mcpRateLimiter } from "../lib/mcpRateLimiter.js";
import { logger } from "../utils/logger.js";

/** Per-request metadata captured once, reused by tool audit logging. */
export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
  requestId: string;
  method?: string;
}

/** What a tool handler receives after successful authentication. */
export interface TrackingContext {
  client: McpClientContext;
  meta: RequestMeta;
}

export interface AuthFailure {
  ok: false;
  /** Stable code → map to HTTP 401/403/429 at the transport layer. */
  code:
    | "no_api_key"
    | "unknown_client"
    | "inactive_client"
    | "blocked_client"
    | "rate_limited";
  /** Safe, client-facing message (never leaks internal detail). */
  message: string;
  retryAfterSeconds?: number;
}

export type AuthResult =
  | { ok: true; ctx: TrackingContext }
  | AuthFailure;

function readMeta(req: RequestLike): RequestMeta {
  return {
    ipAddress: clientIpFromRequest(req),
    userAgent: userAgentFromRequest(req),
    requestId: requestIdFromRequest(req),
    method: req.method,
  };
}

/**
 * Authenticate + rate-limit a request. On rejection writes a 'denied' audit
 * row and returns a typed failure. On success returns the tracking context.
 * Never throws.
 */
export async function authenticateMcpRequest(
  req: RequestLike,
  toolName: string,
): Promise<AuthResult> {
  const meta = readMeta(req);

  let client: McpClientContext;
  try {
    client = await identifyMcpClient(req);
  } catch (err) {
    const code =
      err instanceof McpClientError ? err.code : "unknown_client";
    const message =
      err instanceof McpClientError
        ? err.message
        : "Client identification failed.";

    // Record the blocked attempt (no client_id when unidentified).
    void logMcpFailure({
      toolName,
      clientId: null,
      aiName: code === "blocked_client" ? "Blocked" : "Unknown / Invalid Client",
      method: meta.method,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      requestId: meta.requestId,
      errorMessage: message,
      denied: true,
      metadata: { reason: code },
    });

    return { ok: false, code, message };
  }

  // Per-client rate limit.
  const rl = mcpRateLimiter.check(client.clientId, client.rateLimitPerMinute);
  if (!rl.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((rl.resetAt - Date.now()) / 1000),
    );

    void logMcpFailure({
      toolName,
      clientId: client.clientId,
      aiName: client.aiName,
      method: meta.method,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      requestId: meta.requestId,
      errorMessage: `Rate limit exceeded (${rl.limit}/min).`,
      denied: true,
      metadata: { reason: "rate_limited", count: rl.count, limit: rl.limit },
    });

    logger.warn("MCP rate limit hit", {
      aiName: client.aiName,
      clientId: client.clientId,
      limit: rl.limit,
    });

    return {
      ok: false,
      code: "rate_limited",
      message: `Rate limit exceeded. Try again in ${retryAfterSeconds}s.`,
      retryAfterSeconds,
    };
  }

  return { ok: true, ctx: { client, meta } };
}

export { McpAccessError };

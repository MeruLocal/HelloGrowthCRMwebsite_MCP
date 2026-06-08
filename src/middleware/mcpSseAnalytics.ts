/**
 * MCP / SSE traffic analytics hooks.
 *
 * Thin, non-blocking instrumentation wired into the HTTP server in
 * `src/server.ts`. Every function here is guarded so a tracking failure can
 * never break an SSE stream or an MCP response.
 *
 * PRIVACY: only derived, low-cardinality metadata is emitted. We never track
 * raw IP, raw User-Agent, full URLs, auth headers, cookies, request bodies,
 * tool arguments, or any customer/CRM data. See `docs/MCP_ANALYTICS.md`.
 */

import type { IncomingMessage } from "node:http";

import { detectClient, safeHost } from "../lib/clientDetection.js";
import { track } from "../lib/telemetry.js";
import { logger } from "../utils/logger.js";

export const MCP_EVENTS = {
  SSE_OPEN: "mcp_sse_connection_open",
  SSE_CLOSE: "mcp_sse_connection_close",
  REQUEST: "mcp_request",
  TOOL_CALL: "mcp_tool_call",
  BOT_VISIT: "mcp_bot_visit",
  ERROR: "mcp_error",
} as const;

/** Safe, derived metadata extracted from a request. Never contains raw PII. */
export interface SafeRequestMeta {
  endpoint: string;
  method: string;
  transport: string;
  clientName: string;
  clientType: string;
  isBot: boolean;
  botName?: string;
  originHost?: string;
  refererHost?: string;
  country?: string;
  sessionId?: string;
}

/** State returned by {@link trackSseConnectionOpen}, fed back into close. */
export interface SseConnectionState {
  meta: SafeRequestMeta;
  startedAt: number;
}

// In-memory counters (process-local). GA4 is the source of truth for totals;
// these exist for health endpoints / debugging only.
let totalSseConnections = 0;
let openSseConnections = 0;

export function getSseCounters(): {
  total: number;
  open: number;
} {
  return { total: totalSseConnections, open: openSseConnections };
}

function header(req: IncomingMessage, name: string): string | undefined {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
}

/**
 * Build safe, derived metadata from a request. The raw User-Agent is read only
 * to derive a client label and is never returned or stored.
 */
export function buildSafeMeta(
  req: IncomingMessage,
  opts: { endpoint: string; transport: string; sessionId?: string },
): SafeRequestMeta {
  const client = detectClient(header(req, "user-agent"));
  return {
    endpoint: opts.endpoint,
    method: req.method ?? "UNKNOWN",
    transport: opts.transport,
    clientName: client.clientName,
    clientType: client.clientType,
    isBot: client.isBot,
    botName: client.botName,
    originHost: safeHost(header(req, "origin")),
    refererHost: safeHost(header(req, "referer")),
    country: header(req, "cf-ipcountry"),
    sessionId: opts.sessionId,
  };
}

function metaParams(meta: SafeRequestMeta): Record<string, unknown> {
  return {
    endpoint: meta.endpoint,
    http_method: meta.method,
    transport: meta.transport,
    clientName: meta.clientName,
    clientType: meta.clientType,
    isBot: meta.isBot,
    botName: meta.botName,
    originHost: meta.originHost,
    refererHost: meta.refererHost,
    country: meta.country,
    sessionId: meta.sessionId,
  };
}

/**
 * Record an opened SSE connection. Emits `mcp_sse_connection_open` (plus
 * `mcp_bot_visit` for crawlers) and returns state to pass into
 * {@link trackSseConnectionClose}. Never throws.
 */
export function trackSseConnectionOpen(
  req: IncomingMessage,
  opts: { sessionId?: string; endpoint?: string },
): SseConnectionState {
  const meta = buildSafeMeta(req, {
    endpoint: opts.endpoint ?? "/sse",
    transport: "sse",
    sessionId: opts.sessionId,
  });
  const startedAt = Date.now();

  try {
    totalSseConnections += 1;
    openSseConnections += 1;

    track(MCP_EVENTS.SSE_OPEN, {
      ...metaParams(meta),
      totalConnections: totalSseConnections,
    });

    if (meta.isBot) {
      track(MCP_EVENTS.BOT_VISIT, metaParams(meta));
    }
  } catch (err) {
    logger.debug("trackSseConnectionOpen suppressed error", {
      err: (err as Error).message,
    });
  }

  return { meta, startedAt };
}

/**
 * Record a closed SSE connection. Emits `mcp_sse_connection_close` with the
 * connection duration. `success` is true unless the stream errored. Never throws.
 */
export function trackSseConnectionClose(
  state: SseConnectionState | undefined,
  opts: { errored?: boolean } = {},
): void {
  try {
    if (openSseConnections > 0) openSseConnections -= 1;
    if (!state) return;

    const connectionDurationMs = Math.max(0, Date.now() - state.startedAt);
    track(MCP_EVENTS.SSE_CLOSE, {
      ...metaParams(state.meta),
      connectionDurationMs,
      success: !opts.errored,
    });
  } catch (err) {
    logger.debug("trackSseConnectionClose suppressed error", {
      err: (err as Error).message,
    });
  }
}

/**
 * Safely extract the JSON-RPC method and (for `tools/call`) the tool name from
 * a parsed request body. Tool ARGUMENTS are deliberately never read.
 */
export function extractMcpInvocation(body: unknown): {
  mcpMethod?: string;
  toolName?: string;
} {
  // Batch requests arrive as an array; classify by the first call.
  const msg = Array.isArray(body) ? body[0] : body;
  if (!msg || typeof msg !== "object") return {};

  const record = msg as Record<string, unknown>;
  const mcpMethod =
    typeof record.method === "string" ? record.method : undefined;

  let toolName: string | undefined;
  if (mcpMethod === "tools/call") {
    const params = record.params;
    if (params && typeof params === "object") {
      const name = (params as Record<string, unknown>).name;
      if (typeof name === "string") toolName = name;
    }
  }

  return { mcpMethod, toolName };
}

/**
 * Record an MCP message/request once its HTTP response has finished. Emits
 * `mcp_request`, plus `mcp_tool_call` for `tools/call`, plus `mcp_error` when
 * the status is >= 400. Body is read only for method/tool name — never args.
 * Never throws.
 */
export function trackMcpMessage(opts: {
  meta: SafeRequestMeta;
  body: unknown;
  statusCode: number;
  responseTimeMs: number;
}): void {
  try {
    const { mcpMethod, toolName } = extractMcpInvocation(opts.body);
    const success = opts.statusCode < 400;

    const base = {
      ...metaParams(opts.meta),
      mcpMethod,
      toolName,
      statusCode: opts.statusCode,
      success,
      responseTimeMs: opts.responseTimeMs,
    };

    track(MCP_EVENTS.REQUEST, base);

    if (mcpMethod === "tools/call") {
      track(MCP_EVENTS.TOOL_CALL, base);
    }

    if (!success) {
      track(MCP_EVENTS.ERROR, base);
    }
  } catch (err) {
    logger.debug("trackMcpMessage suppressed error", {
      err: (err as Error).message,
    });
  }
}

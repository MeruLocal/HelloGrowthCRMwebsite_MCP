/**
 * Telemetry sink — GA4 Measurement Protocol.
 *
 * A tiny, fire-and-forget event emitter. `track()` is fully guarded: it never
 * throws and never blocks the caller, so analytics can be wired into hot paths
 * (SSE connect, MCP message) without risking the underlying response.
 *
 * Analytics is OFF by default. It is active only when `ENABLE_MCP_ANALYTICS`
 * is exactly "true" AND both `GA4_MEASUREMENT_ID` and `GA4_API_SECRET` are set.
 * Otherwise `track()` returns immediately (a debug log only), so the server
 * runs fine — and silently — without GA4.
 *
 * Configuration (all via env, matching the existing `.env` style):
 *   ENABLE_MCP_ANALYTICS  Master switch — must be "true" to send anything
 *   GA4_MEASUREMENT_ID    GA4 stream measurement id (e.g. "G-XXXXXXXXXX")
 *   GA4_API_SECRET        Measurement Protocol API secret
 *   GA4_ENDPOINT          Override collect endpoint (default Google's prod URL)
 *   GA4_TIMEOUT_MS        Abort the send after N ms (default 3000)
 */

import { randomUUID } from "node:crypto";
import { logger } from "../utils/logger.js";

export interface TelemetryEvent {
  name: string;
  params: Record<string, unknown>;
}

export type TelemetrySink = (event: TelemetryEvent) => void;

const DEFAULT_ENDPOINT = "https://www.google-analytics.com/mp/collect";

function analyticsEnabled(): boolean {
  // OFF unless explicitly switched on.
  if ((process.env.ENABLE_MCP_ANALYTICS ?? "").toLowerCase() !== "true") {
    return false;
  }
  // ...and only when GA4 credentials are present.
  return Boolean(
    process.env.GA4_MEASUREMENT_ID && process.env.GA4_API_SECRET,
  );
}

/**
 * Default sink: GA4 Measurement Protocol. Non-blocking — the fetch is fired
 * without `await`, with an abort timeout, and all failures are swallowed.
 */
function ga4Sink(event: TelemetryEvent): void {
  if (!analyticsEnabled()) {
    logger.debug("Telemetry: GA4 not configured, event dropped", {
      event: event.name,
    });
    return;
  }

  const measurementId = process.env.GA4_MEASUREMENT_ID!;
  const apiSecret = process.env.GA4_API_SECRET!;
  const endpoint = process.env.GA4_ENDPOINT ?? DEFAULT_ENDPOINT;
  const timeoutMs = Number.parseInt(process.env.GA4_TIMEOUT_MS ?? "3000", 10);

  const url =
    `${endpoint}?measurement_id=${encodeURIComponent(measurementId)}` +
    `&api_secret=${encodeURIComponent(apiSecret)}`;

  // GA4 requires a client_id. Reuse the opaque session id when we have one so
  // events from the same MCP session group together; otherwise a random id.
  const sessionId = event.params.sessionId;
  const clientId =
    typeof sessionId === "string" && sessionId ? sessionId : randomUUID();

  const body = JSON.stringify({
    client_id: clientId,
    events: [{ name: event.name, params: event.params }],
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  // Some runtimes keep the event loop alive for pending timers; don't block exit.
  timer.unref?.();

  void fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    signal: controller.signal,
  })
    .catch((err: unknown) =>
      logger.debug("Telemetry send failed", {
        event: event.name,
        err: (err as Error).message,
      }),
    )
    .finally(() => clearTimeout(timer));
}

let currentSink: TelemetrySink = ga4Sink;

/** Override the active sink. Intended for tests and custom integrations. */
export function setTelemetrySink(sink: TelemetrySink): void {
  currentSink = sink;
}

/** Restore the default GA4 sink. */
export function resetTelemetrySink(): void {
  currentSink = ga4Sink;
}

/**
 * Emit a telemetry event. Guaranteed non-throwing and non-blocking — a failing
 * or throwing sink can never break the caller's control flow.
 */
export function track(
  name: string,
  params: Record<string, unknown> = {},
): void {
  try {
    // Strip undefined values so we never send empty/garbage params.
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) clean[k] = v;
    }
    currentSink({ name, params: clean });
  } catch (err) {
    logger.debug("Telemetry track suppressed error", {
      event: name,
      err: (err as Error).message,
    });
  }
}

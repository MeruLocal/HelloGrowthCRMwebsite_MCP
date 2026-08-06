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
 *   GA4_DEBUG_MODE        "true" -> tag every event with `debug_mode: 1` so it
 *                         shows up in GA4 -> Admin -> DebugView. Events are
 *                         still recorded normally. Turn off after verifying.
 *   GA4_VALIDATE          "true" -> POST to Google's /debug/mp/collect
 *                         validation endpoint instead and log the returned
 *                         validationMessages. Payloads sent this way are
 *                         checked but NOT recorded — one-off diagnosis only.
 *
 * Why both switches: DebugView is populated by the `debug_mode` parameter on
 * the NORMAL endpoint. The /debug/mp/collect endpoint validates a payload and
 * returns errors but records nothing, so it can never make an event appear in
 * DebugView. They answer different questions ("is it arriving?" vs "is it
 * well-formed?"), hence two flags.
 */

import { randomUUID } from "node:crypto";
import { logger } from "../utils/logger.js";

export interface TelemetryEvent {
  name: string;
  params: Record<string, unknown>;
}

export type TelemetrySink = (event: TelemetryEvent) => void;

const DEFAULT_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const VALIDATION_ENDPOINT = "https://www.google-analytics.com/debug/mp/collect";

function envFlag(name: string): boolean {
  return (process.env[name] ?? "").toLowerCase() === "true";
}

function analyticsEnabled(): boolean {
  // OFF unless explicitly switched on.
  if (!envFlag("ENABLE_MCP_ANALYTICS")) {
    return false;
  }
  // ...and only when GA4 credentials are present.
  return Boolean(
    process.env.GA4_MEASUREMENT_ID && process.env.GA4_API_SECRET,
  );
}

/** Resolve the collect endpoint, honouring GA4_VALIDATE and GA4_ENDPOINT. */
function resolveEndpoint(): { url: string; validating: boolean } {
  if (envFlag("GA4_VALIDATE")) {
    return { url: VALIDATION_ENDPOINT, validating: true };
  }
  return { url: process.env.GA4_ENDPOINT ?? DEFAULT_ENDPOINT, validating: false };
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
  const timeoutMs = Number.parseInt(process.env.GA4_TIMEOUT_MS ?? "3000", 10);
  const { url: endpoint, validating } = resolveEndpoint();

  const url =
    `${endpoint}?measurement_id=${encodeURIComponent(measurementId)}` +
    `&api_secret=${encodeURIComponent(apiSecret)}`;

  // GA4 requires a client_id. Reuse the opaque session id when we have one so
  // events from the same MCP session group together; otherwise a random id.
  const sessionId = event.params.sessionId;
  const clientId =
    typeof sessionId === "string" && sessionId ? sessionId : randomUUID();

  // `debug_mode: 1` is what surfaces an event in GA4's DebugView. Without it
  // DebugView stays empty no matter how many events land — which is exactly
  // why MCP telemetry was previously unverifiable in production.
  const params: Record<string, unknown> = envFlag("GA4_DEBUG_MODE")
    ? { ...event.params, debug_mode: 1 }
    : event.params;

  const body = JSON.stringify({
    client_id: clientId,
    events: [{ name: event.name, params }],
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
    .then(async (res) => {
      if (!validating) return;
      // The validation endpoint returns 200 with a validationMessages array;
      // an empty array means the payload is well-formed. Surface it at info
      // level — this only runs when an operator explicitly set GA4_VALIDATE.
      let detail: unknown = null;
      try {
        detail = await res.json();
      } catch {
        detail = null;
      }
      logger.info("Telemetry: GA4 payload validation result", {
        event: event.name,
        status: res.status,
        validation: detail,
      });
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

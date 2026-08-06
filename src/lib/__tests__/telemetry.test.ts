import { afterEach, describe, expect, it, vi } from "vitest";
import {
  resetTelemetrySink,
  resetTelemetryWarnings,
  setTelemetrySink,
  track,
  type TelemetryEvent,
} from "../telemetry.js";
import { logger } from "../../utils/logger.js";

afterEach(() => {
  resetTelemetrySink();
  resetTelemetryWarnings();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("track", () => {
  it("forwards events to the active sink", () => {
    const seen: TelemetryEvent[] = [];
    setTelemetrySink((e) => seen.push(e));
    track("mcp_request", { endpoint: "/message", statusCode: 200 });
    expect(seen).toHaveLength(1);
    expect(seen[0].name).toBe("mcp_request");
    expect(seen[0].params.statusCode).toBe(200);
  });

  it("strips undefined/null params before emitting", () => {
    const seen: TelemetryEvent[] = [];
    setTelemetrySink((e) => seen.push(e));
    track("mcp_request", { a: 1, b: undefined, c: null });
    expect(seen[0].params).toEqual({ a: 1 });
  });

  it("never throws when the sink throws", () => {
    setTelemetrySink(() => {
      throw new Error("boom");
    });
    expect(() => track("mcp_error", { x: 1 })).not.toThrow();
  });

  it("default GA4 sink no-ops (no network) when unconfigured", () => {
    vi.stubEnv("ENABLE_MCP_ANALYTICS", "true");
    vi.stubEnv("GA4_MEASUREMENT_ID", "");
    vi.stubEnv("GA4_API_SECRET", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));
    resetTelemetrySink();
    track("mcp_sse_connection_open", { sessionId: "s" });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("does NOT send when ENABLE_MCP_ANALYTICS is unset, even with GA4 creds", () => {
    vi.stubEnv("ENABLE_MCP_ANALYTICS", "");
    vi.stubEnv("GA4_MEASUREMENT_ID", "G-TEST");
    vi.stubEnv("GA4_API_SECRET", "secret");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));
    resetTelemetrySink();
    track("mcp_request", { sessionId: "s" });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("does NOT send when ENABLE_MCP_ANALYTICS=false", () => {
    vi.stubEnv("ENABLE_MCP_ANALYTICS", "false");
    vi.stubEnv("GA4_MEASUREMENT_ID", "G-TEST");
    vi.stubEnv("GA4_API_SECRET", "secret");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));
    resetTelemetrySink();
    track("mcp_request", { sessionId: "s" });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("sends to GA4 when ENABLE_MCP_ANALYTICS=true and creds present", () => {
    vi.stubEnv("ENABLE_MCP_ANALYTICS", "true");
    vi.stubEnv("GA4_MEASUREMENT_ID", "G-TEST");
    vi.stubEnv("GA4_API_SECRET", "secret");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));
    resetTelemetrySink();
    track("mcp_tool_call", { sessionId: "s", toolName: "x" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain("measurement_id=G-TEST");
    expect(String(url)).toContain("api_secret=secret");
    const sent = JSON.parse((init as RequestInit).body as string);
    expect(sent.client_id).toBe("s");
    expect(sent.events[0].name).toBe("mcp_tool_call");
    fetchSpy.mockRestore();
  });

  it("omits debug_mode by default so prod events stay clean", () => {
    vi.stubEnv("ENABLE_MCP_ANALYTICS", "true");
    vi.stubEnv("GA4_MEASUREMENT_ID", "G-TEST");
    vi.stubEnv("GA4_API_SECRET", "secret");
    vi.stubEnv("GA4_DEBUG_MODE", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));
    resetTelemetrySink();
    track("mcp_request", { sessionId: "s" });
    const sent = JSON.parse(
      (fetchSpy.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(sent.events[0].params.debug_mode).toBeUndefined();
    fetchSpy.mockRestore();
  });

  it("tags debug_mode:1 when GA4_DEBUG_MODE=true so DebugView shows the run", () => {
    vi.stubEnv("ENABLE_MCP_ANALYTICS", "true");
    vi.stubEnv("GA4_MEASUREMENT_ID", "G-TEST");
    vi.stubEnv("GA4_API_SECRET", "secret");
    vi.stubEnv("GA4_DEBUG_MODE", "true");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));
    resetTelemetrySink();
    track("mcp_tool_call", { sessionId: "s", toolName: "fetch_page_content" });
    const [url, init] = fetchSpy.mock.calls[0];
    // debug_mode rides on the NORMAL endpoint - the event is still recorded.
    expect(String(url)).toContain("/mp/collect");
    expect(String(url)).not.toContain("/debug/mp/collect");
    const sent = JSON.parse((init as RequestInit).body as string);
    expect(sent.events[0].params.debug_mode).toBe(1);
    expect(sent.events[0].params.toolName).toBe("fetch_page_content");
    fetchSpy.mockRestore();
  });

  it("posts to the validation endpoint when GA4_VALIDATE=true", () => {
    vi.stubEnv("ENABLE_MCP_ANALYTICS", "true");
    vi.stubEnv("GA4_MEASUREMENT_ID", "G-TEST");
    vi.stubEnv("GA4_API_SECRET", "secret");
    vi.stubEnv("GA4_VALIDATE", "true");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ validationMessages: [] })));
    resetTelemetrySink();
    track("mcp_request", { sessionId: "s" });
    expect(String(fetchSpy.mock.calls[0][0])).toContain("/debug/mp/collect");
    fetchSpy.mockRestore();
  });

  it("GA4_VALIDATE wins over a custom GA4_ENDPOINT", () => {
    vi.stubEnv("ENABLE_MCP_ANALYTICS", "true");
    vi.stubEnv("GA4_MEASUREMENT_ID", "G-TEST");
    vi.stubEnv("GA4_API_SECRET", "secret");
    vi.stubEnv("GA4_ENDPOINT", "https://example.test/collect");
    vi.stubEnv("GA4_VALIDATE", "true");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ validationMessages: [] })));
    resetTelemetrySink();
    track("mcp_request", { sessionId: "s" });
    expect(String(fetchSpy.mock.calls[0][0])).toContain("/debug/mp/collect");
    fetchSpy.mockRestore();
  });

  it("warns (not debug) when enabled but GA4 creds are missing", () => {
    vi.stubEnv("ENABLE_MCP_ANALYTICS", "true");
    vi.stubEnv("GA4_MEASUREMENT_ID", "G-TEST");
    vi.stubEnv("GA4_API_SECRET", "");
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
    resetTelemetrySink();
    track("mcp_request", { sessionId: "s" });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain("telemetry is being dropped");
  });

  it("warns only once, so a busy server cannot flood the log", () => {
    vi.stubEnv("ENABLE_MCP_ANALYTICS", "true");
    vi.stubEnv("GA4_MEASUREMENT_ID", "");
    vi.stubEnv("GA4_API_SECRET", "");
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
    resetTelemetrySink();
    for (let i = 0; i < 50; i += 1) track("mcp_request", { sessionId: "s" });
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("stays silent when analytics is simply switched off", () => {
    vi.stubEnv("ENABLE_MCP_ANALYTICS", "false");
    vi.stubEnv("GA4_MEASUREMENT_ID", "");
    vi.stubEnv("GA4_API_SECRET", "");
    const warnSpy = vi.spyOn(logger, "warn").mockImplementation(() => {});
    resetTelemetrySink();
    track("mcp_request", { sessionId: "s" });
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

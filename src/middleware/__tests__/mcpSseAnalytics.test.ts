import type { IncomingMessage } from "node:http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  setTelemetrySink,
  resetTelemetrySink,
  type TelemetryEvent,
} from "../../lib/telemetry.js";
import {
  MCP_EVENTS,
  buildSafeMeta,
  extractMcpInvocation,
  trackMcpMessage,
  trackSseConnectionOpen,
  trackSseConnectionClose,
} from "../mcpSseAnalytics.js";

let events: TelemetryEvent[] = [];

beforeEach(() => {
  events = [];
  setTelemetrySink((e) => events.push(e));
});

afterEach(() => {
  resetTelemetrySink();
});

function fakeReq(headers: Record<string, string>, method = "GET"): IncomingMessage {
  return { headers, method } as unknown as IncomingMessage;
}

const names = (): string[] => events.map((e) => e.name);
const byName = (name: string): TelemetryEvent | undefined =>
  events.find((e) => e.name === name);

describe("SSE connection tracking", () => {
  it("emits mcp_sse_connection_open with derived client fields", () => {
    const req = fakeReq({
      "user-agent": "Mozilla/5.0 ChatGPT-User/1.0",
      origin: "https://chat.openai.com/some/path",
      "cf-ipcountry": "US",
    });
    trackSseConnectionOpen(req, { sessionId: "sess-1" });

    const open = byName(MCP_EVENTS.SSE_OPEN);
    expect(open).toBeDefined();
    expect(open!.params.clientName).toBe("ChatGPT");
    expect(open!.params.clientType).toBe("ai");
    expect(open!.params.transport).toBe("sse");
    expect(open!.params.originHost).toBe("chat.openai.com");
    expect(open!.params.country).toBe("US");
    expect(open!.params.sessionId).toBe("sess-1");
  });

  it("emits mcp_bot_visit when a crawler connects", () => {
    const req = fakeReq({ "user-agent": "Mozilla/5.0 (compatible; GPTBot/1.2)" });
    trackSseConnectionOpen(req, { sessionId: "sess-bot" });
    expect(names()).toContain(MCP_EVENTS.BOT_VISIT);
    expect(byName(MCP_EVENTS.BOT_VISIT)!.params.botName).toBe("GPTBot");
  });

  it("emits mcp_sse_connection_close with a duration and success flag", () => {
    const req = fakeReq({ "user-agent": "Cursor/0.4" });
    const state = trackSseConnectionOpen(req, { sessionId: "sess-2" });
    trackSseConnectionClose(state, { errored: false });

    const close = byName(MCP_EVENTS.SSE_CLOSE);
    expect(close).toBeDefined();
    expect(close!.params.success).toBe(true);
    expect(typeof close!.params.connectionDurationMs).toBe("number");
    expect(close!.params.connectionDurationMs as number).toBeGreaterThanOrEqual(0);
  });

  it("marks success=false when the stream errored", () => {
    const state = trackSseConnectionOpen(fakeReq({}), { sessionId: "s" });
    trackSseConnectionClose(state, { errored: true });
    expect(byName(MCP_EVENTS.SSE_CLOSE)!.params.success).toBe(false);
  });
});

describe("extractMcpInvocation", () => {
  it("extracts the method for tools/list", () => {
    expect(extractMcpInvocation({ jsonrpc: "2.0", id: 1, method: "tools/list" })).toEqual({
      mcpMethod: "tools/list",
      toolName: undefined,
    });
  });

  it("extracts the tool name for tools/call without arguments", () => {
    const r = extractMcpInvocation({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "scan_website_bots", arguments: { targetUrl: "secret" } },
    });
    expect(r.mcpMethod).toBe("tools/call");
    expect(r.toolName).toBe("scan_website_bots");
  });

  it("handles batch arrays and non-objects safely", () => {
    expect(extractMcpInvocation([{ method: "ping" }]).mcpMethod).toBe("ping");
    expect(extractMcpInvocation(null)).toEqual({});
    expect(extractMcpInvocation("oops")).toEqual({});
  });
});

describe("trackMcpMessage", () => {
  const meta = () =>
    buildSafeMeta(fakeReq({ "user-agent": "PostmanRuntime/7" }, "POST"), {
      endpoint: "/message",
      transport: "sse",
      sessionId: "sess-3",
    });

  it("emits mcp_request for tools/list", () => {
    trackMcpMessage({
      meta: meta(),
      body: { method: "tools/list" },
      statusCode: 200,
      responseTimeMs: 12,
    });
    expect(names()).toContain(MCP_EVENTS.REQUEST);
    expect(names()).not.toContain(MCP_EVENTS.TOOL_CALL);
    expect(byName(MCP_EVENTS.REQUEST)!.params.responseTimeMs).toBe(12);
  });

  it("emits mcp_tool_call for tools/call with the tool name", () => {
    trackMcpMessage({
      meta: meta(),
      body: { method: "tools/call", params: { name: "verify_bot_identity", arguments: { ip: "1.2.3.4" } } },
      statusCode: 200,
      responseTimeMs: 30,
    });
    expect(names()).toContain(MCP_EVENTS.TOOL_CALL);
    expect(byName(MCP_EVENTS.TOOL_CALL)!.params.toolName).toBe("verify_bot_identity");
  });

  it("emits mcp_error when status >= 400", () => {
    trackMcpMessage({
      meta: meta(),
      body: { method: "tools/call", params: { name: "x" } },
      statusCode: 400,
      responseTimeMs: 5,
    });
    expect(names()).toContain(MCP_EVENTS.ERROR);
    expect(byName(MCP_EVENTS.ERROR)!.params.success).toBe(false);
  });
});

describe("privacy guarantees", () => {
  it("never includes raw IP, raw UA, full URL, cookies, auth, or tool arguments", () => {
    const req = fakeReq(
      {
        "user-agent": "Mozilla/5.0 ChatGPT-User/1.0 SECRET-UA-STRING",
        "x-forwarded-for": "203.0.113.9",
        cookie: "session=abc123",
        authorization: "Bearer super-secret",
        origin: "https://chat.openai.com/c/private-thread",
        referer: "https://chat.openai.com/c/private-thread?token=xyz",
      },
      "POST",
    );
    const m = buildSafeMeta(req, { endpoint: "/message", transport: "sse", sessionId: "s" });
    trackSseConnectionClose(trackSseConnectionOpen(req, { sessionId: "s" }), {});
    trackMcpMessage({
      meta: m,
      body: { method: "tools/call", params: { name: "t", arguments: { secretArg: "leak-me" } } },
      statusCode: 200,
      responseTimeMs: 1,
    });

    const blob = JSON.stringify(events);
    expect(blob).not.toContain("203.0.113.9");
    expect(blob).not.toContain("SECRET-UA-STRING");
    expect(blob).not.toContain("abc123");
    expect(blob).not.toContain("super-secret");
    expect(blob).not.toContain("leak-me");
    expect(blob).not.toContain("private-thread");
    expect(blob).not.toContain("token=xyz");
    // Only the safe host survives.
    expect(blob).toContain("chat.openai.com");
  });
});

describe("failure isolation", () => {
  it("a throwing telemetry sink never breaks tracking calls", () => {
    setTelemetrySink(() => {
      throw new Error("sink exploded");
    });
    const req = fakeReq({ "user-agent": "Cursor/0.4" });
    expect(() => {
      const state = trackSseConnectionOpen(req, { sessionId: "s" });
      trackSseConnectionClose(state, {});
      trackMcpMessage({
        meta: buildSafeMeta(req, { endpoint: "/message", transport: "sse" }),
        body: { method: "tools/list" },
        statusCode: 200,
        responseTimeMs: 1,
      });
    }).not.toThrow();
  });
});

import { type ChildProcess, spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Runs the real server process (src/index.ts) and talks to it over HTTP:
 * proves the Cache-Control header on the deployed path (not just in a handler
 * test), the SDK client round trip (initialize, tools/list, call), and that
 * MARKET_FACTS_KILL_SWITCH is honoured by a freshly started process.
 */
const repo = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const PORT = 38000 + Math.floor(Math.random() * 1000);
let child: ChildProcess;

async function waitUp(): Promise<void> {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/health`);
      if (r.status < 500) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server did not start");
}

beforeAll(async () => {
  child = spawn(join(repo, "node_modules/.bin/tsx"), ["src/index.ts"], {
    cwd: repo,
    env: { ...process.env, TRANSPORT: "http", PORT: String(PORT), MCP_DISABLE_LIVE_YOUTUBE: "true", MARKET_FACTS_KILL_SWITCH: "all" },
    stdio: "ignore",
  });
  await waitUp();
}, 30_000);

afterAll(() => {
  child?.kill("SIGKILL");
});

describe("market facts over the HTTP path", () => {
  it("POST responses are sent with Cache-Control: no-store", async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/sse`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "t", version: "1" } },
      }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    await res.text();
  });

  it("SDK client round trip: initialize, tools/list, country_get uk with the kill switch on", async () => {
    const client = new Client({ name: "market-facts-test", version: "1.0.0" });
    await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${PORT}/sse`)));
    const list = await client.listTools();
    expect(list.tools.length).toBeGreaterThan(70); // public subset of the 89 registered tools
    const cg = list.tools.find((t) => t.name === "country_get")!;
    expect(cg.outputSchema).toBeTruthy();
    const res: any = await client.callTool({ name: "country_get", arguments: { code: "uk" } });
    expect(res.isError).toBeFalsy();
    expect(res.structuredContent.market_facts.price.price_status).toBe("pending_verification");
    expect(res.structuredContent.pricing_summary.growthPriceShort).toBeNull();
    await client.close();
  }, 30_000);
});

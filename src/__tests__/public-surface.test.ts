/**
 * Over the protocol: a public session is never offered (and cannot use)
 * arguments that name a server-side path, and tools/call runs inside the
 * call context that handlers use to decide.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";

import { buildServer } from "../server.js";
import { OPERATOR_ONLY_PROPERTIES } from "../tools/call-context.js";

async function connect(authorized: boolean) {
  const prev = process.env.MCP_ADMIN_TOKEN;
  process.env.MCP_ADMIN_TOKEN = "test-token-not-real";
  const server = buildServer({ authorized });
  process.env.MCP_ADMIN_TOKEN = prev;
  const [a, b] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "t", version: "0" });
  await Promise.all([server.connect(a), client.connect(b)]);
  return client;
}

describe("public tool surface", () => {
  it("tools/list never advertises a path or file argument", async () => {
    const client = await connect(false);
    const { tools } = await client.listTools();
    const offenders = tools.flatMap((t) =>
      Object.keys((t.inputSchema.properties ?? {}) as object)
        .filter((k) => OPERATOR_ONLY_PROPERTIES.has(k))
        .map((k) => `${t.name}.${k}`),
    );
    expect(offenders).toEqual([]);
  });

  it("export_bot_report over the protocol returns inline and writes nothing", async () => {
    const client = await connect(false);
    const res = await client.callTool({
      name: "export_bot_report",
      arguments: {
        logText: '203.0.113.5 - - [10/Oct/2025:13:55:36 +0000] "GET / HTTP/1.1" 200 1 "-" "GPTBot/1.0"',
        saveToDisk: true,
        filename: "../../pwn.md",
      },
    });
    const payload = JSON.parse((res.content as { text: string }[])[0]!.text);
    expect(payload.savedTo).toBeNull();
    expect(payload.report).toBeTruthy();
  });

  it("analyze_access_logs over the protocol refuses logPath", async () => {
    const client = await connect(false);
    const res = await client.callTool({ name: "analyze_access_logs", arguments: { logPath: "/etc/hostname" } });
    expect(res.isError).toBe(true);
    expect(JSON.stringify(res.content)).not.toContain("/etc/hostname");
  });
});

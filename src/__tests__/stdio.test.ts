import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";

import { buildServer, stdioServerOptions } from "../server.js";

const ROOT = join(__dirname, "..", "..");
const ENV = { ...process.env };
afterEach(() => {
  process.env = { ...ENV };
});

describe("stdioServerOptions", () => {
  it("is untrusted by default, even with a token in the environment", () => {
    expect(stdioServerOptions({ MCP_ADMIN_TOKEN: "x" })).toEqual({ authorized: false });
  });

  it("MCP_STDIO_TRUSTED=1 opts in", () => {
    expect(stdioServerOptions({ MCP_STDIO_TRUSTED: "1" })).toEqual({ authorized: true });
  });

  it("the flag without a token still yields the public surface (buildServer ANDs with the token)", async () => {
    delete process.env.MCP_ADMIN_TOKEN;
    const server = buildServer(stdioServerOptions({ MCP_STDIO_TRUSTED: "1" }));
    const [a, b] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "t", version: "0" });
    await Promise.all([server.connect(a), client.connect(b)]);
    const { tools } = await client.listTools();
    expect(tools.map((t: { name: string }) => t.name)).not.toContain("blog_create");
  });
});

describe("packaging", () => {
  it("smithery.yaml launches with TRANSPORT: 'stdio'", () => {
    const yaml = readFileSync(join(ROOT, "smithery.yaml"), "utf8");
    const fn = yaml.slice(yaml.indexOf("commandFunction"));
    expect(fn).toMatch(/env:\s*\{[\s\S]*TRANSPORT:\s*'stdio'/);
  });

  it("server.json tells registry installs to use stdio", () => {
    const json = JSON.parse(readFileSync(join(ROOT, "server.json"), "utf8"));
    const transport = json.packages[0].environmentVariables.find((e: { name: string }) => e.name === "TRANSPORT");
    expect(transport?.default).toBe("stdio");
  });
});

describe("spawned over stdio", () => {
  it("answers initialize + tools/list with the public set", async () => {
    const env: NodeJS.ProcessEnv = { ...ENV, TRANSPORT: "stdio", MCP_ADMIN_TOKEN: "not-a-real-token", LOG_LEVEL: "error" };
    delete env.MCP_STDIO_TRUSTED;
    const child = spawn(process.execPath, ["--import", "tsx", join(ROOT, "src/index.ts")], { env, cwd: ROOT });
    let out = "";
    child.stdout.on("data", (c) => (out += c));
    const send = (m: unknown) => child.stdin.write(`${JSON.stringify(m)}\n`);
    send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "0" } },
    });
    send({ jsonrpc: "2.0", method: "notifications/initialized" });
    send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    const deadline = Date.now() + 20_000;
    while (!out.includes('"id":2') && Date.now() < deadline) await new Promise((r) => setTimeout(r, 100));
    child.kill();
    const list = out
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l))
      .find((m) => m.id === 2);
    const names = list.result.tools.map((t: { name: string }) => t.name);
    expect(names).toContain("pricing_get_plans");
    expect(names).not.toContain("blog_create");
  }, 30_000);
});

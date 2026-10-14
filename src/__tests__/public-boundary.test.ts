/**
 * Public-boundary invariant tests (roadmap Phase 0, task 0.2; issue #38).
 *
 * The 12 privileged tools (8 content writes + 4 personal-data readers) live in
 * the same binary as the 76 public ones, and only a bearer-token filter keeps
 * them apart. The roadmap's Sol review called that out: a routing bug can
 * re-expose them. Until (or unless) the privileged tools are extracted into a
 * separate deployment (task 0.1, an open decision), these tests are the
 * mandatory compensation. They red-team the boundary on every run:
 *
 *   - an unauthenticated session can neither LIST nor INVOKE any privileged
 *     tool, by exact name, by alias/variant spelling, or with a malformed,
 *     wrong, rotated-out or empty token;
 *   - "authorized" is fail-closed: with no MCP_ADMIN_TOKEN configured even an
 *     operator-trusted build serves only the public set;
 *   - a session's privilege is fixed at initialize; presenting the token on a
 *     later request of an anonymous session does not upgrade it;
 *   - every public tool is annotated read-only and non-destructive;
 *   - no tool module can dispatch to another tool by a caller-chosen name
 *     (the only internal dispatcher, generate_llms_txt, calls a fixed list of
 *     public tools).
 *
 * These tests go through the real MCP protocol (SDK client <-> server) and,
 * for the session test, through the real HTTP transport, not through helper
 * functions, so they catch a wiring mistake in server.ts as well as a wrong
 * list in access.ts.
 */

import { readFileSync, readdirSync } from "node:fs";
import type http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { FEEDBACK_EMAIL, FEEDBACK_URL, buildServer, runServer } from "../server.js";
import { toolsByName } from "../tools/index.js";
import { PRIVILEGED_TOOLS, isAuthorized } from "../tools/access.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOOLS_DIR = path.resolve(HERE, "../tools");

const TOKEN = "test-admin-token-0123456789";
const ORIGINAL_TOKEN = process.env.MCP_ADMIN_TOKEN;

function restoreToken(): void {
  if (ORIGINAL_TOKEN === undefined) delete process.env.MCP_ADMIN_TOKEN;
  else process.env.MCP_ADMIN_TOKEN = ORIGINAL_TOKEN;
}

afterEach(() => {
  restoreToken();
  vi.restoreAllMocks();
});

/** Connect an SDK client to a fresh server instance over an in-memory pair. */
async function connect(authorized: boolean): Promise<Client> {
  const server = buildServer({ authorized });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const client = new Client({ name: "boundary-test", version: "0.0.0" });
  await client.connect(clientSide);
  return client;
}

/**
 * Spy on every privileged handler so a test can prove the handler never ran,
 * not merely that the reply looked like a refusal.
 */
function spyOnPrivilegedHandlers() {
  return [...PRIVILEGED_TOOLS].map((name) => {
    const tool = toolsByName.get(name)!;
    return { name, spy: vi.spyOn(tool, "handle") };
  });
}

function textOf(result: unknown): string {
  const content = (result as { content?: Array<{ text?: string }> }).content ?? [];
  return content.map((c) => c.text ?? "").join("\n");
}

const PRIVILEGED = [...PRIVILEGED_TOOLS].sort();
const PUBLIC_COUNT = toolsByName.size - PRIVILEGED_TOOLS.size;

describe("anonymous sessions cannot list privileged tools", () => {
  it("no token configured: tools/list is exactly the public set", async () => {
    delete process.env.MCP_ADMIN_TOKEN;
    const client = await connect(false);
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);
    expect(names).toHaveLength(PUBLIC_COUNT);
    for (const name of PRIVILEGED) expect(names).not.toContain(name);
    await client.close();
  });

  it("token configured but not presented: still exactly the public set", async () => {
    process.env.MCP_ADMIN_TOKEN = TOKEN;
    const client = await connect(false);
    const names = (await client.listTools()).tools.map((t) => t.name);
    expect(names).toHaveLength(PUBLIC_COUNT);
    for (const name of PRIVILEGED) expect(names).not.toContain(name);
    await client.close();
  });

  it("fail-closed: authorized:true with no token configured serves only the public set", async () => {
    delete process.env.MCP_ADMIN_TOKEN;
    const client = await connect(true);
    const names = (await client.listTools()).tools.map((t) => t.name);
    expect(names).toHaveLength(PUBLIC_COUNT);
    for (const name of PRIVILEGED) expect(names).not.toContain(name);
    await client.close();
  });

  it("control: an authorized session with a configured token does see them", async () => {
    process.env.MCP_ADMIN_TOKEN = TOKEN;
    const client = await connect(true);
    const names = (await client.listTools()).tools.map((t) => t.name);
    expect(names).toHaveLength(toolsByName.size);
    for (const name of PRIVILEGED) expect(names).toContain(name);
    await client.close();
  });
});

describe("anonymous sessions cannot invoke privileged tools", () => {
  it.each(PRIVILEGED)("%s is refused by exact name and its handler never runs", async (name) => {
    process.env.MCP_ADMIN_TOKEN = TOKEN;
    const spies = spyOnPrivilegedHandlers();
    const client = await connect(false);
    const result = await client.callTool({ name, arguments: {} });
    expect(result.isError).toBe(true);
    expect(textOf(result)).toMatch(/not available on the public endpoint/);
    for (const { spy } of spies) expect(spy).not.toHaveBeenCalled();
    await client.close();
  });

  it("is refused even when the server has no token configured", async () => {
    delete process.env.MCP_ADMIN_TOKEN;
    const spies = spyOnPrivilegedHandlers();
    const client = await connect(true); // fail-closed path
    for (const name of PRIVILEGED) {
      const result = await client.callTool({ name, arguments: {} });
      expect(result.isError).toBe(true);
    }
    for (const { spy } of spies) expect(spy).not.toHaveBeenCalled();
    await client.close();
  });

  // Spellings a sloppy lookup (case-folding, trimming, separator
  // normalisation, namespacing) might map onto a privileged tool.
  const variants = (name: string): string[] => [
    name.toUpperCase(),
    `${name[0]!.toUpperCase()}${name.slice(1)}`,
    ` ${name}`,
    `${name} `,
    `${name}\n`,
    name.replaceAll("_", "-"),
    name.replaceAll("_", ""),
    name.replaceAll("_", "."),
    `functions.${name}`,
    `default_api.${name}`,
    `hellogrowthcrm/${name}`,
    `${name}​`, // zero-width space
    name.replace("o", "о"), // Cyrillic o
  ];

  it("alias and variant spellings never reach a privileged handler", async () => {
    process.env.MCP_ADMIN_TOKEN = TOKEN;
    const spies = spyOnPrivilegedHandlers();
    const client = await connect(false);
    for (const name of PRIVILEGED) {
      for (const variant of variants(name)) {
        if (variant === name) continue;
        const result = await client.callTool({ name: variant, arguments: {} });
        expect(result.isError, `variant ${JSON.stringify(variant)}`).toBe(true);
      }
    }
    for (const { spy } of spies) expect(spy).not.toHaveBeenCalled();
    await client.close();
  });

  it("an alias spelling is not a privileged tool's lookup key", () => {
    for (const name of PRIVILEGED) {
      for (const variant of variants(name)) {
        if (variant === name) continue;
        expect(toolsByName.has(variant), variant).toBe(false);
      }
    }
  });
});

describe("tokens that must not authorize", () => {
  it.each([
    ["missing header", undefined],
    ["empty header", ""],
    ["scheme only", "Bearer"],
    ["scheme and spaces", "Bearer    "],
    ["wrong token", "Bearer not-the-token"],
    ["token with suffix", `Bearer ${TOKEN}x`],
    ["token prefix", `Bearer ${TOKEN.slice(0, -1)}`],
    ["token without scheme", TOKEN],
    ["Basic scheme", `Basic ${TOKEN}`],
    ["Token scheme", `Token ${TOKEN}`],
    ["two tokens", `Bearer ${TOKEN}, Bearer ${TOKEN}`],
    ["embedded newline", `Bearer ${TOKEN}\nX-Other: 1`],
    ["quoted token", `Bearer "${TOKEN}"`],
  ])("%s", (_label, header) => {
    process.env.MCP_ADMIN_TOKEN = TOKEN;
    expect(isAuthorized(header as string | undefined)).toBe(false);
  });

  it("a rotated-out token stops working as soon as the configured token changes", () => {
    process.env.MCP_ADMIN_TOKEN = TOKEN;
    expect(isAuthorized(`Bearer ${TOKEN}`)).toBe(true);
    process.env.MCP_ADMIN_TOKEN = `${TOKEN}-rotated`;
    expect(isAuthorized(`Bearer ${TOKEN}`)).toBe(false);
    expect(isAuthorized(`Bearer ${TOKEN}-rotated`)).toBe(true);
  });
});

describe("public tool annotations", () => {
  it("every publicly served tool is read-only and non-destructive", async () => {
    delete process.env.MCP_ADMIN_TOKEN;
    const client = await connect(false);
    const { tools } = await client.listTools();
    for (const t of tools) {
      expect(t.annotations?.readOnlyHint, t.name).toBe(true);
      expect(t.annotations?.destructiveHint, t.name).toBe(false);
    }
    await client.close();
  });

  it("every tool that is not read-only is privileged", () => {
    for (const [name, tool] of toolsByName) {
      if (tool.definition.annotations?.readOnlyHint !== true) {
        expect(PRIVILEGED_TOOLS.has(name), name).toBe(true);
      }
    }
  });
});

describe("no meta-dispatch path", () => {
  // A tool that imports the registry could call any tool by a name the caller
  // supplies, which would walk straight past the gate in server.ts. Only the
  // llms.txt generator does this today, with a fixed list of names.
  const ALLOWED_DISPATCHERS = new Set(["llms-txt.ts"]);

  const toolSources = readdirSync(TOOLS_DIR)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => ({ file: f, src: readFileSync(path.join(TOOLS_DIR, f), "utf8") }));

  it("only the allow-listed module imports the tool registry", () => {
    const importers = toolSources
      .filter(({ file }) => file !== "index.ts")
      .filter(({ src }) => /from\s+["']\.\/index\.js["']/.test(src) || /\btoolsByName\b/.test(src))
      .map(({ file }) => file);
    expect(importers.sort()).toEqual([...ALLOWED_DISPATCHERS].sort());
  });

  it("the llms.txt generator dispatches only to fixed, public tool names", () => {
    const src = toolSources.find((s) => s.file === "llms-txt.ts")!.src;
    // Every dispatch must use a string literal, never a variable from args.
    const literalCalls = [...src.matchAll(/await\s+callTool\(\s*"([a-z0-9_]+)"/g)].map((m) => m[1]!);
    const tableEntries = [...src.matchAll(/\btool:\s*"([a-z0-9_]+)"/g)].map((m) => m[1]!);
    const dynamicCalls = [...src.matchAll(/await\s+callTool\(\s*([^")\s][^,)]*)/g)].map((m) => m[1]!.trim());
    expect(literalCalls.length + tableEntries.length).toBeGreaterThan(0);
    // The one dynamic call reads `g.tool` from the fixed table above.
    expect(dynamicCalls).toEqual(["g.tool"]);
    for (const name of [...literalCalls, ...tableEntries]) {
      expect(toolsByName.has(name), name).toBe(true);
      expect(PRIVILEGED_TOOLS.has(name), name).toBe(false);
    }
  });
});

describe("HTTP transport: a session's privilege is fixed at initialize", () => {
  let httpServer: http.Server | undefined;
  let base = "";
  const ORIGINAL_PORT = process.env.PORT;
  const ORIGINAL_TRANSPORT = process.env.TRANSPORT;

  // The outer afterEach restores the token after every test, so set it again
  // before each one: isAuthorized reads the environment per request.
  beforeEach(() => {
    process.env.MCP_ADMIN_TOKEN = TOKEN;
  });

  beforeAll(async () => {
    process.env.PORT = "0"; // let the OS pick a free port
    delete process.env.TRANSPORT;
    httpServer = await runServer();
    const { port } = httpServer!.address() as AddressInfo;
    base = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    if (ORIGINAL_PORT === undefined) delete process.env.PORT;
    else process.env.PORT = ORIGINAL_PORT;
    if (ORIGINAL_TRANSPORT !== undefined) process.env.TRANSPORT = ORIGINAL_TRANSPORT;
    await new Promise<void>((resolve) => httpServer?.close(() => resolve()) ?? resolve());
  });

  const HEADERS = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };

  /** Parse a JSON or single-event SSE reply into the JSON-RPC message. */
  async function rpcBody(res: Response): Promise<Record<string, unknown>> {
    const text = await res.text();
    const dataLine = text.split("\n").find((l) => l.startsWith("data:"));
    return JSON.parse(dataLine ? dataLine.slice(5) : text) as Record<string, unknown>;
  }

  async function initialize(authorization?: string): Promise<string> {
    const res = await fetch(`${base}/sse`, {
      method: "POST",
      headers: { ...HEADERS, ...(authorization ? { Authorization: authorization } : {}) },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "boundary-test", version: "0.0.0" },
        },
      }),
    });
    expect(res.status).toBe(200);
    await res.text();
    const sid = res.headers.get("mcp-session-id");
    expect(sid).toBeTruthy();
    await fetch(`${base}/sse`, {
      method: "POST",
      headers: { ...HEADERS, "mcp-session-id": sid! },
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
    });
    return sid!;
  }

  async function rpc(sid: string, id: number, method: string, params: unknown, authorization?: string) {
    const res = await fetch(`${base}/sse`, {
      method: "POST",
      headers: {
        ...HEADERS,
        "mcp-session-id": sid,
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    });
    return rpcBody(res);
  }

  it("an anonymous session stays anonymous when a later request carries the token", async () => {
    const spies = spyOnPrivilegedHandlers();
    const sid = await initialize();

    const list = await rpc(sid, 2, "tools/list", {}, `Bearer ${TOKEN}`);
    const names = ((list.result as { tools: Array<{ name: string }> }).tools).map((t) => t.name);
    expect(names).toHaveLength(PUBLIC_COUNT);

    const call = await rpc(sid, 3, "tools/call", { name: "forms_export_csv", arguments: {} }, `Bearer ${TOKEN}`);
    expect((call.result as { isError?: boolean }).isError).toBe(true);
    for (const { spy } of spies) expect(spy).not.toHaveBeenCalled();
  });

  it("a wrong token at initialize yields an anonymous session", async () => {
    const sid = await initialize("Bearer wrong-token");
    const list = await rpc(sid, 2, "tools/list", {});
    const names = ((list.result as { tools: Array<{ name: string }> }).tools).map((t) => t.name);
    expect(names).toHaveLength(PUBLIC_COUNT);
    for (const name of PRIVILEGED) expect(names).not.toContain(name);
  });

  it("the landing page carries the feedback contact (roadmap 0.4), not a feedback tool", async () => {
    const res = await fetch(`${base}/`);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain(`mailto:${FEEDBACK_EMAIL}`);
    expect(html).toContain(FEEDBACK_URL);
    expect([...toolsByName.keys()].some((n) => /feedback/.test(n))).toBe(false);
  });

  it("control: the correct token at initialize yields the full set", async () => {
    const sid = await initialize(`Bearer ${TOKEN}`);
    const list = await rpc(sid, 2, "tools/list", {});
    const names = ((list.result as { tools: Array<{ name: string }> }).tools).map((t) => t.name);
    expect(names).toHaveLength(toolsByName.size);
  });
});

/**
 * In-process tests of the HTTP transport: Host/Origin allowlist, body cap,
 * session cap + idle sweep, rate-limit key (plan #71) and generic errors.
 */
import http from "node:http";
import type { AddressInfo } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";

import { buildServer, createHttpServer } from "../server.js";
import { toolsByName } from "../tools/index.js";

const ENV = { ...process.env };
const servers: http.Server[] = [];

afterEach(async () => {
  process.env = { ...ENV };
  await Promise.all(servers.splice(0).map((s) => new Promise<void>((r) => s.close(() => r()))));
});

async function start(env: Record<string, string> = {}): Promise<number> {
  process.env = { ...ENV, ...env };
  for (const k of ["TRUST_PROXY_HEADERS", "TRUST_CLOUDFLARE", "CLOUDFLARE_CIDRS", "TRUSTED_PROXY_CIDRS", "MCP_ALLOWED_ORIGINS", "MCP_ALLOWED_HOSTS"]) {
    if (!(k in env)) delete process.env[k];
  }
  const s = createHttpServer();
  s.keepAliveTimeout = 1;
  servers.push(s);
  await new Promise<void>((r) => s.listen(0, "127.0.0.1", r));
  return (s.address() as AddressInfo).port;
}

const INIT = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "0" } },
});

function post(
  port: number,
  body: string | Buffer,
  headers: Record<string, string> = {},
  opts: { chunked?: boolean } = {},
): Promise<{ status: number; headers: http.IncomingHttpHeaders; text: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path: "/sse",
        method: "POST",
        agent: false,
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          ...(opts.chunked ? {} : { "content-length": String(Buffer.byteLength(body)) }),
          ...headers,
        },
      },
      (res) => {
        let text = "";
        res.on("data", (c) => (text += c));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, headers: res.headers, text }));
      },
    );
    req.on("error", (e) => {
      // The server may close a too-large upload early; that still counts as refused.
      if ((e as NodeJS.ErrnoException).code === "ECONNRESET" || (e as NodeJS.ErrnoException).code === "EPIPE") {
        resolve({ status: 413, headers: {}, text: "reset" });
      } else reject(e);
    });
    if (opts.chunked) {
      const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
      for (let i = 0; i < buf.length; i += 64 * 1024) req.write(buf.subarray(i, i + 64 * 1024));
      req.end();
    } else req.end(body);
  });
}

describe("Host / Origin allowlist", () => {
  it("Host: evil.example → 403", async () => {
    const port = await start();
    const r = await post(port, INIT, { host: "evil.example" });
    expect(r.status).toBe(403);
    expect(JSON.parse(r.text).error.message).toBe("Forbidden");
  });

  it("Origin: https://evil.example → 403", async () => {
    const port = await start();
    expect((await post(port, INIT, { origin: "https://evil.example" })).status).toBe(403);
  });

  it("no Origin → 200; an allowed localhost Origin on any port → 200", async () => {
    const port = await start();
    expect((await post(port, INIT)).status).toBe(200);
    expect((await post(port, INIT, { origin: `http://localhost:${port}` })).status).toBe(200);
    expect((await post(port, INIT, { host: "mcp.hellogrowthcrm.com", origin: "https://mcp.hellogrowthcrm.com" })).status).toBe(200);
  });

  it("MCP_ALLOWED_ORIGINS=* disables the Origin check but keeps the Host check", async () => {
    const port = await start({ MCP_ALLOWED_ORIGINS: "*" });
    expect((await post(port, INIT, { origin: "https://partner.example" })).status).toBe(200);
    expect((await post(port, INIT, { host: "evil.example" })).status).toBe(403);
  });
});

describe("body cap", () => {
  it("a 2 MB body with Content-Length → 413", async () => {
    const port = await start();
    const r = await post(port, `{"x":"${"a".repeat(2 * 1024 * 1024)}"}`);
    expect(r.status).toBe(413);
  });

  it("a 2 MB chunked body → 413", async () => {
    const port = await start();
    const r = await post(port, `{"x":"${"a".repeat(2 * 1024 * 1024)}"}`, {}, { chunked: true });
    expect(r.status).toBe(413);
  });
});

describe("sessions", () => {
  const sid = (r: { headers: http.IncomingHttpHeaders }) => String(r.headers["mcp-session-id"]);
  const ping = (port: number, id: string) =>
    post(port, JSON.stringify({ jsonrpc: "2.0", id: 2, method: "ping" }), {
      "mcp-session-id": id,
      "mcp-protocol-version": "2025-06-18",
    });

  it("opening MAX_SESSIONS+1 sessions evicts the least recently used", async () => {
    const port = await start({ MCP_MAX_SESSIONS: "2" });
    const a = sid(await post(port, INIT));
    await new Promise((r) => setTimeout(r, 5));
    const b = sid(await post(port, INIT));
    await new Promise((r) => setTimeout(r, 5));
    expect((await ping(port, a)).status).toBe(200); // a is now more recent than b
    const c = sid(await post(port, INIT));
    expect(new Set([a, b, c]).size).toBe(3);
    expect((await ping(port, b)).status).toBe(400); // evicted
    expect((await ping(port, a)).status).toBe(200);
    expect((await ping(port, c)).status).toBe(200);
  });

  it("an idle sweep closes a stale session", async () => {
    const port = await start({ MCP_SESSION_IDLE_MS: "50" });
    const a = sid(await post(port, INIT));
    await new Promise((r) => setTimeout(r, 250));
    expect((await ping(port, a)).status).toBe(400);
  });
});

describe("sessions with an open GET stream", () => {
  const sid = (r: { headers: http.IncomingHttpHeaders }) => String(r.headers["mcp-session-id"]);
  const ping = (port: number, id: string) =>
    post(port, JSON.stringify({ jsonrpc: "2.0", id: 2, method: "ping" }), {
      "mcp-session-id": id,
      "mcp-protocol-version": "2025-06-18",
    });
  const openStream = (port: number, id: string): Promise<http.ClientRequest> =>
    new Promise((resolve, reject) => {
      const req = http.request(
        {
          host: "127.0.0.1",
          port,
          path: "/sse",
          method: "GET",
          agent: false,
          headers: { accept: "text/event-stream", "mcp-session-id": id, "mcp-protocol-version": "2025-06-18" },
        },
        (res) => {
          res.resume();
          resolve(req);
        },
      );
      req.on("error", () => undefined);
      req.on("error", reject);
      req.end();
    });

  it("is not closed by the idle sweep while the stream is open", async () => {
    const port = await start({ MCP_SESSION_IDLE_MS: "50" });
    const a = sid(await post(port, INIT));
    const stream = await openStream(port, a);
    await new Promise((r) => setTimeout(r, 250));
    expect((await ping(port, a)).status).toBe(200);
    stream.destroy();
  });

  it("is not evicted by LRU while the stream is open", async () => {
    const port = await start({ MCP_MAX_SESSIONS: "2" });
    const a = sid(await post(port, INIT)); // oldest, but streaming
    const stream = await openStream(port, a);
    await new Promise((r) => setTimeout(r, 5));
    const b = sid(await post(port, INIT));
    await new Promise((r) => setTimeout(r, 5));
    const c = sid(await post(port, INIT));
    expect((await ping(port, a)).status).toBe(200); // kept
    expect((await ping(port, b)).status).toBe(400); // evicted instead
    expect((await ping(port, c)).status).toBe(200);
    stream.destroy();
  });

  it("is swept normally once the stream closes", async () => {
    const port = await start({ MCP_SESSION_IDLE_MS: "50" });
    const a = sid(await post(port, INIT));
    const stream = await openStream(port, a);
    stream.destroy();
    await new Promise((r) => setTimeout(r, 400));
    expect((await ping(port, a)).status).toBe(400);
  });
});

describe("rate-limit key (plan #71)", () => {
  async function burst(port: number, header: (i: number) => Record<string, string>) {
    const out: number[] = [];
    for (let i = 0; i < 7; i += 1) out.push((await post(port, INIT, header(i))).status);
    return out;
  }

  it("rotating X-Forwarded-For from an untrusted peer still hits 429 on the 6th request (default env)", async () => {
    const port = await start({ RATE_LIMIT_MAX_REQUESTS: "5" });
    const s = await burst(port, (i) => ({ "x-forwarded-for": `198.51.100.${i}` }));
    expect(s.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(s[5]).toBe(429);
  });

  it("rotating CF-Connecting-IP is ignored unless TRUST_CLOUDFLARE and a trusted peer", async () => {
    const port = await start({ RATE_LIMIT_MAX_REQUESTS: "5", TRUST_PROXY_HEADERS: "true", TRUSTED_PROXY_CIDRS: "10.0.0.0/8" });
    const s = await burst(port, (i) => ({ "cf-connecting-ip": `198.51.100.${i}`, "x-forwarded-for": `198.51.100.${i}` }));
    expect(s[5]).toBe(429);
  });

  it("behind a configured trusted proxy, distinct clients get distinct buckets", async () => {
    const port = await start({ RATE_LIMIT_MAX_REQUESTS: "5", TRUST_PROXY_HEADERS: "true" });
    const s = await burst(port, (i) => ({ "x-forwarded-for": `198.51.100.${i}` }));
    expect(s.every((x) => x === 200)).toBe(true);
  });
});

describe("generic errors", () => {
  it("a tool that throws does not echo its message", async () => {
    const tool = toolsByName.get("countries_list")!;
    const original = tool.handle;
    tool.handle = async () => {
      throw new Error('relation "secret_table" does not exist');
    };
    try {
      const server = buildServer();
      const [x, y] = InMemoryTransport.createLinkedPair();
      const client = new Client({ name: "t", version: "0" });
      await Promise.all([server.connect(x), client.connect(y)]);
      const res = await client.callTool({ name: "countries_list", arguments: {} });
      const text = JSON.stringify(res.content);
      expect(res.isError).toBe(true);
      expect(text).not.toContain("secret");
      expect(text).toMatch(/Internal error in countries_list\. The error was logged \(id [0-9a-f]{8}\)/);
    } finally {
      tool.handle = original;
    }
  });

  it("a failing resource read says only 'Error fetching resource.'", async () => {
    delete process.env.SUPABASE_URL;
    const server = buildServer();
    const [x, y] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "t", version: "0" });
    await Promise.all([server.connect(x), client.connect(y)]);
    const res = await client.readResource({ uri: "hellocrmwebsite://blog/recent" });
    expect((res.contents[0] as { text: string }).text).toBe("Error fetching resource.");
  });
});

/**
 * Quick smoke-test: connects via the Streamable HTTP /mcp endpoint,
 * initializes the MCP session, and lists tools.
 * Run: node test-mcp.mjs
 */
import http from "http";

const BASE = "http://localhost:3008";
const MCP_PATH = "/mcp";

// POST a JSON-RPC message to /mcp. Returns { status, sessionId, message }.
// The server replies as an SSE stream (event: message\ndata: {...}\n\n); we
// parse out the first data line.
function rpc(body, sessionId) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "Content-Length": Buffer.byteLength(data),
    };
    if (sessionId) headers["mcp-session-id"] = sessionId;

    const req = http.request(`${BASE}${MCP_PATH}`, { method: "POST", headers }, (res) => {
      let out = "";
      res.on("data", (c) => (out += c));
      res.on("end", () => {
        const dataLine = out.split("\n").find((l) => l.startsWith("data:"));
        let message = null;
        if (dataLine) {
          try { message = JSON.parse(dataLine.slice(5).trim()); } catch { /* ignore */ }
        } else if (out.trim()) {
          try { message = JSON.parse(out.trim()); } catch { /* ignore */ }
        }
        resolve({ status: res.statusCode, sessionId: res.headers["mcp-session-id"], message });
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// 1. Initialize — the server assigns a session id in the mcp-session-id header.
const init = await rpc({
  jsonrpc: "2.0", id: 1, method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test-client", version: "1.0.0" },
  },
});
console.log("initialize →", init.status, "session:", init.sessionId);
const sessionId = init.sessionId;

// 2. Send the initialized notification.
await rpc({ jsonrpc: "2.0", method: "notifications/initialized", params: {} }, sessionId);

// 3. List tools.
const tools = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, sessionId);
console.log("tools/list →", tools.status);
console.log("Tools returned:", tools.message?.result?.tools?.map((t) => t.name) ?? []);

process.exit(0);

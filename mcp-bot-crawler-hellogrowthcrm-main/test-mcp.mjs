/**
 * Quick smoke-test: connects via SSE, initializes the MCP session, lists tools.
 * Run: node test-mcp.mjs
 */
import http from "http";

const BASE = "http://localhost:3008";

async function getLine(stream) {
  return new Promise((resolve) => {
    let buf = "";
    stream.on("data", function onData(chunk) {
      buf += chunk.toString();
      const lines = buf.split("\n");
      for (const line of lines) {
        if (line.startsWith("data:")) {
          stream.removeListener("data", onData);
          resolve(line.slice(5).trim());
          return;
        }
      }
      buf = lines[lines.length - 1];
    });
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
    }, (res) => {
      let out = "";
      res.on("data", (c) => (out += c));
      res.on("end", () => resolve({ status: res.statusCode, body: out }));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// 1. Open SSE connection
const sseReq = http.request(`${BASE}/sse`, { method: "GET" });
sseReq.end();

const sseRes = await new Promise((resolve) => sseReq.on("response", resolve));
console.log("SSE connected, status:", sseRes.statusCode);

// 2. Read the endpoint event to get sessionId
const endpointPath = await getLine(sseRes);
console.log("Endpoint path:", endpointPath);

// 3. Send initialize
const initRes = await post(endpointPath, {
  jsonrpc: "2.0", id: 1, method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test-client", version: "1.0.0" },
  },
});
console.log("initialize →", initRes.status, initRes.body);

// 4. Send initialized notification
await post(endpointPath, { jsonrpc: "2.0", method: "notifications/initialized", params: {} });

// 5. List tools — read the SSE response (event: message\ndata: {...}\n\n)
const toolsRes = await post(endpointPath, {
  jsonrpc: "2.0", id: 2, method: "tools/list", params: {},
});
console.log("tools/list →", toolsRes.status);

const rawEvent = await new Promise((resolve) => {
  let b = "";
  sseRes.on("data", (c) => {
    b += c.toString();
    if (b.includes("\n\n")) resolve(b);
  });
});
const dataLine = rawEvent.split("\n").find((l) => l.startsWith("data:"));
const tools = JSON.parse(dataLine.slice(5).trim());
console.log("Tools returned:", tools?.result?.tools?.map((t) => t.name) ?? []);

sseReq.destroy();
process.exit(0);

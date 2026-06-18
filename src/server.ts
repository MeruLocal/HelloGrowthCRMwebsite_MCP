/**
 * MCP server setup.
 *
 * Supports two transports selected by the TRANSPORT env var:
 *   http  (default) — Streamable HTTP on PORT (default 3008), endpoint POST/GET/DELETE /mcp.
 *                     The legacy SSE endpoint (/sse + /message) is kept for backward
 *                     compatibility with already-connected clients.
 *   stdio           — stdin/stdout for MCP host processes
 */

import http from "http";
import { randomUUID } from "node:crypto";
// NOSONAR — the low-level `Server` is intentionally used for this advanced,
// resource-heavy MCP setup (the SDK explicitly supports `Server` for advanced
// use cases). `SSEServerTransport` is retained for backward compatibility with
// already-connected /sse clients; new clients should use the StreamableHTTP /mcp endpoint.
import { Server } from "@modelcontextprotocol/sdk/server/index.js"; // NOSONAR
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js"; // NOSONAR
import {
  isInitializeRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { toolsByName } from "./tools/index.js";
import { openApiSpecJson } from "./openapi.js";
import { logger } from "./utils/logger.js";
import { getSupabase } from "./lib/supabase.js";
import {
  buildSafeMeta,
  trackMcpMessage,
  trackSseConnectionOpen,
  trackSseConnectionClose,
} from "./middleware/mcpSseAnalytics.js";
import {
  COMPANY,
  CONTACTS,
  COUNTRIES,
  COUNTRY_PRICING,
  SYNCED_AT,
} from "./data/website-mirror.js";

export function buildServer(): Server { // NOSONAR — advanced low-level Server (see import note)
  const server = new Server( // NOSONAR
    {
      name: "hellogrowthcrm-bot-crawler",
      version: "1.0.0",
      description:
        "Bot detection & governance MCP server for hellogrowthcrm.com — scans, analyzes, and reports on every crawler interacting with the site.",
    },
    { capabilities: { tools: {}, resources: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [...toolsByName.values()].map((t) => t.definition),
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server.setRequestHandler(CallToolRequestSchema, (async (req: any) => {
      const tool = toolsByName.get(req.params.name);
      if (!tool) {
        return {
          content: [
            { type: "text", text: `Unknown tool: ${req.params.name}` },
          ],
          isError: true,
        };
      }

      const parsed = tool.schema.safeParse(req.params.arguments ?? {});
      if (!parsed.success) {
        return {
          content: [
            {
              type: "text",
              text: `Invalid arguments for ${req.params.name}: ${parsed.error.message}`,
            },
          ],
          isError: true,
        };
      }

      try {
        const result = await tool.handle(parsed.data);
        return result;
      } catch (err) {
        logger.error("Tool handler threw", {
          tool: req.params.name,
          err: (err as Error).message,
        });
        return {
          content: [
            {
              type: "text",
              text: `Internal error in ${req.params.name}: ${(err as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any);

  // ── MCP Resources ────────────────────────────────────────────────────────────

  const RESOURCES = [
    { uri: "hellocrmwebsite://blog/recent", name: "Recent Blog Posts", description: "Last 20 blog posts from hellogrowthcrm.com", mimeType: "application/json" },
    { uri: "hellocrmwebsite://help/categories", name: "Help Center Categories", description: "All help center categories", mimeType: "application/json" },
    { uri: "hellocrmwebsite://site/seo-rules", name: "SEO Rules & Guidelines", description: "SEO guardrails for hellogrowthcrm.com content", mimeType: "text/markdown" },
    { uri: "hellocrmwebsite://site/comparisons", name: "Competitor Comparisons", description: "All competitor comparison page slugs and names", mimeType: "application/json" },
    { uri: "hellocrmwebsite://site/case-studies", name: "Case Studies", description: "All case study scenarios grouped by industry", mimeType: "application/json" },
    { uri: "hellocrmwebsite://site/industries", name: "Industry Pages", description: "All industry vertical page slugs", mimeType: "application/json" },
    { uri: "hellocrmwebsite://site/countries", name: "Country Markets", description: "8 country-specific market hubs with currency, locale, and pricing summary", mimeType: "application/json" },
    { uri: "hellocrmwebsite://site/company", name: "Company Profile", description: "Legal entities, registered address, social profiles, and brand info", mimeType: "application/json" },
    { uri: "hellocrmwebsite://site/contacts", name: "Regional Contacts", description: "Support phone, office address, and hours per region", mimeType: "application/json" },
  ];

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: RESOURCES,
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
    const uri = req.params.uri;

    if (uri === "hellocrmwebsite://site/seo-rules") {
      const text = `# SEO Rules (Guardrails)\n\n1. Always link to canonical host: \`https://hellogrowthcrm.com\` (never \`www\`).\n2. Never add internal links to legacy redirect sources.\n3. Add new indexable routes to sitemap unless intentionally excluded.\n4. Do not include redirecting URLs in sitemap entries.\n5. Keep one logical h1 per page.\n6. Every non-decorative image must have meaningful alt text.\n7. Use absolute canonical URLs in metadata.\n8. Keep paginated archives indexable and canonicalized per page.\n9. For out-of-range pagination, redirect to a valid page.\n10. Blog post OpenGraph type must be \`article\`.\n11. Static marketing pages should prefer force-static or ISR when possible.\n12. Avoid duplicate database reads between page render and metadata generation.\n13. Prefer lightweight OG/WebP assets for heavy pages.\n14. Keep Organization.sameAs current across major profiles.\n15. Add structured data only when truthful and complete.\n16. Do not ship broken hreflang references.\n17. Keep internal links crawlable (avoid JS-only critical nav links).\n18. Validate changes with typecheck + lint before merge.`;
      return { contents: [{ uri, mimeType: "text/markdown", text }] };
    }

    if (uri === "hellocrmwebsite://site/comparisons") {
      const comparisons = [
        { slug: "hubspot", name: "HubSpot", url: "https://hellogrowthcrm.com/compare/hubspot" },
        { slug: "salesforce", name: "Salesforce", url: "https://hellogrowthcrm.com/compare/salesforce" },
        { slug: "pipedrive", name: "Pipedrive", url: "https://hellogrowthcrm.com/compare/pipedrive" },
        { slug: "zoho", name: "Zoho CRM", url: "https://hellogrowthcrm.com/compare/zoho" },
        { slug: "monday-crm", name: "Monday CRM", url: "https://hellogrowthcrm.com/compare/monday-crm" },
        { slug: "freshsales", name: "Freshsales", url: "https://hellogrowthcrm.com/compare/freshsales" },
        { slug: "close-crm", name: "Close CRM", url: "https://hellogrowthcrm.com/compare/close-crm" },
        { slug: "wati", name: "Wati", url: "https://hellogrowthcrm.com/compare/wati" },
        { slug: "aisensy", name: "AiSensy", url: "https://hellogrowthcrm.com/compare/aisensy" },
        { slug: "interakt", name: "Interakt", url: "https://hellogrowthcrm.com/compare/interakt" },
        { slug: "leadsquared", name: "LeadSquared", url: "https://hellogrowthcrm.com/in/compare/leadsquared" },
        { slug: "best-crm-for-small-business", name: "Best CRM for Small Business", url: "https://hellogrowthcrm.com/compare/best-crm-for-small-business" },
      ];
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(comparisons, null, 2) }] };
    }

    if (uri === "hellocrmwebsite://site/industries") {
      const industries = ["Real Estate", "Legal", "Healthcare", "Manufacturing", "SaaS", "Recruitment", "Finance", "Construction", "Education", "Insurance", "Retail", "E-commerce", "Hospitality", "Logistics", "Automotive", "Professional Services", "Non-Profit", "Technology", "Media", "Consulting"].map((name) => ({
        name,
        url: `https://hellogrowthcrm.com/crm-for-${name.toLowerCase().replaceAll(/\s+/g, "-")}`,
      }));
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(industries, null, 2) }] };
    }

    if (uri === "hellocrmwebsite://site/countries") {
      const countries = COUNTRIES.map((c) => {
        const pricing = COUNTRY_PRICING.find((p) => p.countrySlug === c.code) ?? null;
        return {
          code: c.code,
          label: c.label,
          url: `https://hellogrowthcrm.com${c.routePrefix}`,
          currency: c.currency,
          locale: c.inLanguage,
          tax_ref: c.taxRef,
          pricing_summary: pricing,
        };
      });
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ synced_at: SYNCED_AT, countries }, null, 2) }] };
    }

    if (uri === "hellocrmwebsite://site/company") {
      const company = {
        synced_at: SYNCED_AT,
        name: COMPANY.name,
        legal_name: COMPANY.legalName,
        india_legal_entity: COMPANY.indiaLegalEntity,
        url: COMPANY.url,
        founding_date: COMPANY.foundingDate,
        registered_address: COMPANY.address,
        same_as: COMPANY.sameAs,
        brand: COMPANY.brand,
      };
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(company, null, 2) }] };
    }

    if (uri === "hellocrmwebsite://site/contacts") {
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ synced_at: SYNCED_AT, contacts: CONTACTS }, null, 2) }] };
    }

    if (uri === "hellocrmwebsite://site/case-studies") {
      // Return summary — full data available via content_list_case_studies tool
      const summary = { note: "Use content_list_case_studies tool for full data with filtering.", industries: ["Real Estate", "Legal", "Healthcare", "SaaS", "Manufacturing", "Finance", "Recruitment"] };
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(summary, null, 2) }] };
    }

    // DB-backed resources
    try {
      const db = getSupabase();

      if (uri === "hellocrmwebsite://blog/recent") {
        const { data, error } = await db.from("blog_posts").select("slug, title, author, category, published_at").order("published_at", { ascending: false }).limit(20);
        if (error) throw new Error(error.message);
        return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
      }

      if (uri === "hellocrmwebsite://help/categories") {
        const { data, error } = await db.from("help_categories").select("*").order("title");
        if (error) throw new Error(error.message);
        return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
      }
    } catch (e) {
      return { contents: [{ uri, mimeType: "text/plain", text: `Error fetching resource: ${(e as Error).message}` }] };
    }

    return { contents: [{ uri, mimeType: "text/plain", text: `Unknown resource: ${uri}` }] };
  });

  return server;
}

const GOOGLE_SITE_VERIFICATION_PATH = "/google7c8140a495901343.html";
const GOOGLE_SITE_VERIFICATION_BODY = "google-site-verification: google7c8140a495901343.html";

class IpRateLimiter {
  private readonly windowMs: number;
  private readonly maxRequests: number;
  // ip → [request timestamps]
  private readonly buckets = new Map<string, number[]>();

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    // Prune stale buckets every window to prevent unbounded memory growth
    setInterval(() => this.prune(), windowMs).unref();
  }

  allow(ip: string): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const hits = (this.buckets.get(ip) ?? []).filter((t) => t > cutoff);
    hits.push(now);
    this.buckets.set(ip, hits);
    return hits.length <= this.maxRequests;
  }

  private prune(): void {
    const cutoff = Date.now() - this.windowMs;
    for (const [ip, hits] of this.buckets) {
      if (hits.at(-1)! <= cutoff) this.buckets.delete(ip);
    }
  }
}

export async function runServer(): Promise<void> {
  const transport = (process.env.TRANSPORT ?? "http").toLowerCase();

  if (transport === "stdio") {
    const server = buildServer();
    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
    logger.info("hellogrowthcrm-bot-crawler ready (stdio)", {
      site: process.env.DEFAULT_TARGET_URL ?? "https://hellogrowthcrm.com",
      tools: [...toolsByName.keys()],
    });
    return;
  }

  // Streamable HTTP transport (with legacy SSE kept for backward compatibility)
  const port = Number.parseInt(process.env.PORT ?? "3008", 10);
  const rateLimitWindow = Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10);
  const rateLimitMax    = Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "60", 10);
  const limiter = new IpRateLimiter(rateLimitWindow, rateLimitMax);

  const clientIp = (req: http.IncomingMessage): string =>
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
      ?? req.socket.remoteAddress
      ?? "unknown";

  const sendRateLimited = (res: http.ServerResponse, ip: string): void => {
    res.writeHead(429, { "Content-Type": "text/plain", "Retry-After": String(Math.ceil(rateLimitWindow / 1000)) })
      .end(`Rate limit exceeded — max ${rateLimitMax} requests per ${rateLimitWindow / 1000}s`);
    logger.warn("Rate limit hit", { ip });
  };

  // Read and JSON-parse a request body (StreamableHTTP needs the parsed body
  // to detect the `initialize` request that opens a new session).
  const readJsonBody = (req: http.IncomingMessage): Promise<unknown> =>
    new Promise((resolve) => {
      let raw = "";
      req.on("data", (chunk) => { raw += chunk; });
      req.on("end", () => {
        if (!raw) { resolve(undefined); return; }
        try { resolve(JSON.parse(raw)); } catch { resolve(undefined); }
      });
      req.on("error", () => resolve(undefined));
    });

  // StreamableHTTP sessions, keyed by mcp-session-id
  const httpTransports = new Map<string, StreamableHTTPServerTransport>();
  // Legacy SSE sessions, keyed by sessionId
  const sseTransports = new Map<string, SSEServerTransport>(); // NOSONAR — see import note

  const handleStreamableHttp = async (req: http.IncomingMessage, res: http.ServerResponse): Promise<void> => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    // GET (server→client notification stream) and DELETE (session teardown)
    // are routed to the existing session's transport.
    if (req.method === "GET" || req.method === "DELETE") {
      const transport = sessionId ? httpTransports.get(sessionId) : undefined;
      if (!transport) {
        res.writeHead(400, { "Content-Type": "text/plain" }).end("Invalid or missing session ID");
        return;
      }
      await transport.handleRequest(req, res);
      return;
    }

    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "text/plain", Allow: "GET, POST, DELETE" }).end("Method not allowed");
      return;
    }

    const body = await readJsonBody(req);
    let transport = sessionId ? httpTransports.get(sessionId) : undefined;

    if (!transport) {
      if (sessionId || !isInitializeRequest(body)) {
        res.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32000, message: "Bad Request: no valid session ID for a non-initialize request" },
          id: null,
        }));
        return;
      }

      // New session: the SDK assigns the id on initialize and reports it via onsessioninitialized.
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => { httpTransports.set(sid, transport!); },
      });
      transport.onclose = () => {
        if (transport!.sessionId) httpTransports.delete(transport!.sessionId);
      };

      const server = buildServer();
      await server.connect(transport);
    }

    // Non-blocking analytics: emit once the response finishes. Derived from the
    // already-parsed body (method/tool name only — never arguments).
    try {
      const meta = buildSafeMeta(req, {
        endpoint: "/mcp",
        transport: "streamable-http",
        sessionId: req.headers["mcp-session-id"] as string | undefined,
      });
      const startedAt = Date.now();
      res.on("finish", () => {
        trackMcpMessage({
          meta,
          body,
          statusCode: res.statusCode,
          responseTimeMs: Date.now() - startedAt,
        });
      });
    } catch (err) {
      logger.debug("mcp analytics setup failed", { err: (err as Error).message });
    }

    await transport.handleRequest(req, res, body);
  };

  const handleLegacySse = async (req: http.IncomingMessage, res: http.ServerResponse, url: URL): Promise<void> => {
    if (req.method === "GET" && url.pathname === "/sse") {
      const sseTransport = new SSEServerTransport("/message", res); // NOSONAR — see import note
      sseTransports.set(sseTransport.sessionId, sseTransport);

      // Non-blocking SSE connection analytics. Tracking is fully guarded and
      // must never affect the stream itself.
      const analytics = trackSseConnectionOpen(req, { sessionId: sseTransport.sessionId });
      let streamErrored = false;
      res.on("error", () => { streamErrored = true; });
      res.on("close", () => {
        sseTransports.delete(sseTransport.sessionId);
        trackSseConnectionClose(analytics, { errored: streamErrored });
      });

      const server = buildServer();
      await server.connect(sseTransport);
      return;
    }

    // req.method === "POST" && url.pathname === "/message"
    const sessionId = url.searchParams.get("sessionId") ?? "";
    const sseTransport = sseTransports.get(sessionId);
    if (!sseTransport) {
      res.writeHead(404).end("No SSE session found");
      return;
    }

    // Parse the body once so we can both feed it to the transport (avoiding a
    // double stream read) and derive safe analytics (method/tool name only).
    const body = await readJsonBody(req);
    try {
      const meta = buildSafeMeta(req, {
        endpoint: "/message",
        transport: "sse",
        sessionId,
      });
      const startedAt = Date.now();
      res.on("finish", () => {
        trackMcpMessage({
          meta,
          body,
          statusCode: res.statusCode,
          responseTimeMs: Date.now() - startedAt,
        });
      });
    } catch (err) {
      logger.debug("sse message analytics setup failed", { err: (err as Error).message });
    }

    await sseTransport.handlePostMessage(req, res, body);
  };

  const httpServer = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    const ip = clientIp(req);

    if (url.pathname === "/mcp") {
      if (!limiter.allow(ip)) { sendRateLimited(res, ip); return; }
      await handleStreamableHttp(req, res);
      return;
    }

    if ((req.method === "GET" && url.pathname === "/sse")
      || (req.method === "POST" && url.pathname === "/message")) {
      if (!limiter.allow(ip)) { sendRateLimited(res, ip); return; }
      await handleLegacySse(req, res, url);
      return;
    }

    // OpenAPI spec for the HelloGrowthCRM CRM tools — importable as ChatGPT GPT
    // Actions. Served as a static document (not rate-limited) with permissive
    // CORS so browser-based importers can fetch it.
    if (url.pathname === GOOGLE_SITE_VERIFICATION_PATH) {
      if (req.method === "GET") {
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        }).end(`${GOOGLE_SITE_VERIFICATION_BODY}\n`);
        return;
      }
      res.writeHead(405, { "Content-Type": "text/plain", Allow: "GET" }).end("Method not allowed");
      return;
    }

    if (url.pathname === "/openapi.json") {
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Authorization, Content-Type",
          "Access-Control-Max-Age": "86400",
        }).end();
        return;
      }
      if (req.method === "GET") {
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300",
        }).end(openApiSpecJson);
        return;
      }
      res.writeHead(405, { "Content-Type": "text/plain", Allow: "GET, OPTIONS" }).end("Method not allowed");
      return;
    }

    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" }).end(
        "MCP Bot Crawler — connect via the Streamable HTTP endpoint at /mcp"
      );
      return;
    }

    res.writeHead(404).end("Not found");
  });

  await new Promise<void>((resolve) => httpServer.listen(port, resolve));
  logger.info("hellogrowthcrm-bot-crawler ready (http)", {
    url: `http://localhost:${port}`,
    mcp: `http://localhost:${port}/mcp`,
    site: process.env.DEFAULT_TARGET_URL ?? "https://hellogrowthcrm.com",
    tools: [...toolsByName.keys()],
  });
}

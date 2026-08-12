/**
 * MCP server setup.
 *
 * Supports two transports selected by the TRANSPORT env var:
 *   http  (default) — Streamable HTTP on PORT (default 3008), endpoint POST/GET/DELETE /sse.
 *   stdio           — stdin/stdout for MCP host processes
 */

import http from "http";
import { randomUUID } from "node:crypto";
// NOSONAR — the low-level `Server` is intentionally used for this advanced,
// resource-heavy MCP setup (the SDK explicitly supports `Server` for advanced
// use cases).
import { Server } from "@modelcontextprotocol/sdk/server/index.js"; // NOSONAR
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
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
import { resolveClientIp } from "./utils/client-ip.js";
import { getSupabase } from "./lib/supabase.js";
import {
  buildSafeMeta,
  trackMcpMessage,
} from "./middleware/mcpSseAnalytics.js";
import {
  COMPANY,
  CONTACTS,
  COUNTRIES,
  COUNTRY_PRICING,
  SYNCED_AT,
} from "./data/website-mirror.js";

// Module scope (not inside buildServer) so /version can report the count.
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

export function buildServer(): Server { // NOSONAR — advanced low-level Server (see import note)
  const server = new Server( // NOSONAR
    {
      // Finding X: this identity must describe what the server actually runs —
      // website mirror + bot governance. Edit src/server-info.ts, not here.
      name: SERVER_NAME,
      title: SERVER_TITLE,
      version: SERVER_VERSION,
      description: SERVER_DESCRIPTION,
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

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [...RESOURCES],
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
// Counts shown on the landing page. Derived from the registries, never
// hand-maintained — a hard-coded tool count is exactly how the README came to
// claim 81 while the server served 83.
const TOOL_COUNT = toolsByName.size;
const RESOURCE_COUNT = MCP_RESOURCES.length;

const GOOGLE_TAG_ID = "G-TRJT49XKH5";
const AHREFS_ANALYTICS_KEY = "typKHgOUagJygUMAlJyQKA";
const HOME_PAGE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>HelloGrowthCRM MCP Server</title>
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', '${GOOGLE_TAG_ID}');
  </script>
  <script>
    var ahrefs_analytics_script = document.createElement('script');
    ahrefs_analytics_script.async = true;
    ahrefs_analytics_script.src = 'https://analytics.ahrefs.com/analytics.js';
    ahrefs_analytics_script.setAttribute('data-key', '${AHREFS_ANALYTICS_KEY}');
    document.getElementsByTagName('head')[0].appendChild(ahrefs_analytics_script);
  </script>
  <style>
    :root { color-scheme: light dark; }
    body { font: 16px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
           max-width: 52rem; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
    code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    pre { padding: .85rem 1rem; overflow-x: auto; border-radius: 6px;
          background: rgba(127,127,127,.12); }
    code { font-size: .92em; }
    table { border-collapse: collapse; width: 100%; margin: .5rem 0 1.5rem; }
    th, td { text-align: left; padding: .4rem .6rem; border-bottom: 1px solid rgba(127,127,127,.25);
             vertical-align: top; }
    th { font-weight: 600; }
    .muted { opacity: .72; font-size: .93em; }
    h2 { margin-top: 2.25rem; font-size: 1.15rem; }
    h1 { margin-bottom: .25rem; }
  </style>
</head>
<body>
  <main>
    <h1>HelloGrowthCRM Website &amp; Bot Governance MCP Server</h1>
    <p>Read-only HelloGrowthCRM website mirror (product knowledge: pricing, features, integrations, comparisons) plus bot detection &amp; crawler governance tools. Connect via the Streamable HTTP endpoint at <code>/sse</code>. No API key is required — this server holds no customer data and performs no CRM actions.</p>
    <p>Status: <a href="/version">/version</a> &middot; Spec: <a href="/openapi.json">/openapi.json</a></p>
  </main>
</body>
</html>
`;

/**
 * Finding L′ (residual): buckets used to live in a private in-process Map, so
 * a horizontally-scaled deployment enforced N× the configured limit. The
 * storage is now behind RateLimitStore — in-memory by default, shared
 * (Upstash Redis) when UPSTASH_REDIS_REST_URL/_TOKEN are set. See
 * src/utils/rate-limit-store.ts.
 */
class IpRateLimiter {
  constructor(
    private readonly windowMs: number,
    private readonly maxRequests: number,
    private readonly store: RateLimitStore,
  ) {}

  allow(ip: string): Promise<boolean> {
    return this.store.hit(ip, this.windowMs, this.maxRequests);
  }
}

export async function runServer(): Promise<void> {
  const transport = (process.env.TRANSPORT ?? "http").toLowerCase();

  if (transport === "stdio") {
    const server = buildServer();
    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
    logger.info(`${SERVER_NAME} ready (stdio)`, {
      site: process.env.DEFAULT_TARGET_URL ?? "https://hellogrowthcrm.com",
      tools: [...toolsByName.keys()],
    });
    return;
  }

  // Streamable HTTP transport, served at /sse
  const port = Number.parseInt(process.env.PORT ?? "3008", 10);
  const rateLimitWindow = Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10);
  const rateLimitMax    = Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "60", 10);
  const limiter = new IpRateLimiter(rateLimitWindow, rateLimitMax, createRateLimitStore());

  // See src/utils/client-ip.ts. Do NOT go back to x-forwarded-for[0]: it is
  // client-controlled, and Cloudflare appends rather than replaces, so the
  // first entry is whatever the caller sent. That made the limiter bypassable
  // by rotating a spoofed header.
  const clientIp = (req: http.IncomingMessage): string =>
    resolveClientIp(req.headers, req.socket.remoteAddress);

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
        endpoint: "/sse",
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

  const httpServer = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    const ip = clientIp(req);

    if (url.pathname === "/sse") {
      if (!(await limiter.allow(ip))) { sendRateLimited(res, ip); return; }
      await handleStreamableHttp(req, res);
      return;
    }

    // Version / status surface (finding BB): a machine-readable signal for
    // third parties that depend on this server, so tool-set changes are
    // discoverable instead of silent. See CHANGELOG.md for the human version.
    if (url.pathname === "/version") {
      if (req.method === "GET" || req.method === "HEAD") {
        const body = JSON.stringify(
          {
            name: SERVER_NAME,
            title: SERVER_TITLE,
            version: SERVER_VERSION,
            mcp_endpoint: "/sse",
            transport: "streamable-http",
            tools: toolsByName.size,
            resources: RESOURCES.length,
            changelog:
              "https://github.com/MeruLocal/HelloGrowthCRMwebsite_MCP/blob/main/CHANGELOG.md",
          },
          null,
          2,
        );
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=300",
          "Content-Length": Buffer.byteLength(body),
        });
        res.end(req.method === "HEAD" ? undefined : body);
        return;
      }
      res.writeHead(405, { "Content-Type": "text/plain", Allow: "GET, HEAD" }).end("Method not allowed");
      return;
    }

    // OpenAPI spec for the HelloGrowthCRM CRM tools — importable as ChatGPT GPT
    // Actions. Served as a static document (not rate-limited) with permissive
    // CORS so browser-based importers can fetch it.
    if (url.pathname === GOOGLE_SITE_VERIFICATION_PATH) {
      if (req.method === "GET" || req.method === "HEAD") {
        const body = `${GOOGLE_SITE_VERIFICATION_BODY}\n`;
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Length": String(Buffer.byteLength(body)),
          "Cache-Control": "public, max-age=300",
        });
        if (req.method === "HEAD") res.end();
        else res.end(body);
        return;
      }
      res.writeHead(405, { "Content-Type": "text/plain", Allow: "GET, HEAD" }).end("Method not allowed");
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
      if (req.method === "GET" || req.method === "HEAD") {
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Length": String(Buffer.byteLength(openApiSpecJson)),
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300",
        });
        if (req.method === "HEAD") res.end();
        else res.end(openApiSpecJson);
        return;
      }
      res.writeHead(405, { "Content-Type": "text/plain", Allow: "GET, HEAD, OPTIONS" }).end("Method not allowed");
      return;
    }

    // HEAD must be served wherever GET is: same status and headers, no body.
    // Previously only GET was matched here, so `HEAD /` fell through to the 404
    // below — uptime monitors, link checkers and registry validators that
    // preflight with HEAD saw the homepage as dead.
    if (req.method === "GET" || req.method === "HEAD") {
      const send = (
        status: number,
        contentType: string,
        body: string,
        cache = "public, max-age=300",
      ): void => {
        res.writeHead(status, {
          "Content-Type": contentType,
          "Content-Length": String(Buffer.byteLength(body)),
          "Cache-Control": cache,
        });
        // A HEAD response carries the headers a GET would, and no body.
        if (req.method === "HEAD") res.end();
        else res.end(body);
      };

      if (url.pathname === "/") {
        send(200, "text/html; charset=utf-8", HOME_PAGE_HTML);
        return;
      }

      // Liveness probe. Deliberately cheap and uncached: it must reflect the
      // process answering right now, not a CDN copy of a healthy past.
      if (url.pathname === "/healthz" || url.pathname === "/health") {
        send(
          200,
          "application/json; charset=utf-8",
          `${JSON.stringify({
            status: "ok",
            version: SERVER_VERSION,
            uptimeSeconds: Math.floor(process.uptime()),
            tools: TOOL_COUNT,
            resources: RESOURCE_COUNT,
            transport: "streamable-http",
            endpoint: "/mcp",
          })}\n`,
          "no-store",
        );
        return;
      }

      if (url.pathname === "/robots.txt") {
        // This host serves a protocol endpoint, not indexable content. The
        // landing page is the only thing worth crawling.
        send(
          200,
          "text/plain; charset=utf-8",
          [
            "User-agent: *",
            "Allow: /$",
            "Disallow: /mcp",
            "Disallow: /sse",
            "Disallow: /message",
            "",
          ].join("\n"),
        );
        return;
      }

      if (url.pathname === "/favicon.ico") {
        // 204 rather than a binary asset: browsers and directory cards stop
        // asking, and we avoid shipping an icon that would drift from the brand.
        res.writeHead(204, { "Cache-Control": "public, max-age=86400" }).end();
        return;
      }
    }

    res.writeHead(404).end("Not found");
  });

  await new Promise<void>((resolve) => httpServer.listen(port, resolve));
  logger.info(`${SERVER_NAME} ready (http)`, {
    url: `http://localhost:${port}`,
    mcp: `http://localhost:${port}/sse`,
    site: process.env.DEFAULT_TARGET_URL ?? "https://hellogrowthcrm.com",
    tools: [...toolsByName.keys()],
  });
}

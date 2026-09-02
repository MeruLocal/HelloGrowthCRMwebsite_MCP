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
  LATEST_PROTOCOL_VERSION,
  isInitializeRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { toolsByName } from "./tools/index.js";
import { buildWellKnownManifest } from "./well-known.js";
import {
  isAuthorized,
  isPrivileged,
  adminTokenConfigured,
  PRIVILEGED_TOOLS,
} from "./tools/access.js";
import { logger } from "./utils/logger.js";
import { resolveClientIp } from "./utils/client-ip.js";
import {
  SERVER_NAME,
  SERVER_TITLE,
  SERVER_VERSION,
  SERVER_DESCRIPTION,
} from "./server-info.js";
import {
  createRateLimitStore,
  type RateLimitStore,
} from "./utils/rate-limit-store.js";
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

export function buildServer(opts: { authorized?: boolean } = {}): Server { // NOSONAR — advanced low-level Server (see import note)
  // Finding C0: privileged tools (writes + personal-data reads) are served only
  // to a session that presented a valid bearer token. Unauthenticated sessions
  // never see them in tools/list and cannot reach them via tools/call.
  const authorized = opts.authorized === true && adminTokenConfigured();
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
      tools: [...toolsByName.values()]
        .filter((t) => authorized || !isPrivileged(t.definition.name))
        .map((t) => t.definition),
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server.setRequestHandler(CallToolRequestSchema, (async (req: any) => {
      // Finding C0: refuse before lookup so an unauthenticated caller cannot
      // distinguish "gated" from "does not exist" by probing.
      if (!authorized && isPrivileged(req.params.name)) {
        return {
          content: [
            {
              type: "text",
              text:
                `Tool ${req.params.name} is not available on the public endpoint. ` +
                "It writes data or reads personal data and requires an authenticated session.",
            },
          ],
          isError: true,
        };
      }

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

/**
 * The MCP protocol revision this build actually speaks, read from the SDK
 * rather than written down by hand. A hand-written revision is a claim that
 * silently goes stale on the next SDK bump — the same class of untruth as
 * finding C1. Currently "2025-11-25" (SDK 1.29.0).
 */
const MCP_SPEC_REVISION = LATEST_PROTOCOL_VERSION;

/**
 * Finding C4. The JSON-RPC surface has nothing to index and indexing it only
 * invites junk traffic; the landing page is fair game. No sitemap is served —
 * an API host has no pages to enumerate.
 */
const ROBOTS_TXT = `User-agent: *
Disallow: /sse
Disallow: /messages
Allow: /$
`;

/** Finding C4. Mirrors https://hellogrowthcrm.com/.well-known/security.txt. */
const SECURITY_TXT = `Contact: mailto:security@hellogrowthcrm.com
Contact: https://hellogrowthcrm.com/contact
Expires: 2027-04-27T00:00:00.000Z
Acknowledgments: https://hellogrowthcrm.com/security-acknowledgments
Preferred-Languages: en, hi
Canonical: https://hellogrowthcrm.com/.well-known/security.txt
Canonical: https://mcp.hellogrowthcrm.com/.well-known/security.txt
Policy: https://hellogrowthcrm.com/security-policy
Hiring: https://hellogrowthcrm.com/careers
`;

const GOOGLE_SITE_VERIFICATION_PATH = "/google7c8140a495901343.html";
const GOOGLE_SITE_VERIFICATION_BODY = "google-site-verification: google7c8140a495901343.html";
// Counts shown on the landing page. Derived from the registries, never
// hand-maintained — a hard-coded tool count is exactly how the README came to
// claim 81 while the server served 83.
const TOOL_COUNT = toolsByName.size;
const RESOURCE_COUNT = RESOURCES.length;

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
    <p>Status: <a href="/version">/version</a> &middot; Discovery: <a href="/.well-known/mcp.json">/.well-known/mcp.json</a> &middot; Tools: <code>POST /sse</code> &rarr; <code>tools/list</code></p>
    <p><small>This is not a customer CRM API. It holds no customer data, performs no CRM actions, and needs no API key &mdash; never send one here.</small></p>
    <p>Read-only HelloGrowthCRM website mirror (product knowledge: pricing, features, integrations, comparisons) plus bot detection &amp; crawler governance tools. Connect via the Streamable HTTP endpoint at <code>/sse</code>. No API key is required, and the public endpoint returns no personal data. This is not a CRM API and it performs no CRM actions — never send CRM credentials here.</p>
    <p>Content-management tools and the tools that read newsletter subscribers or contact-form submissions are not served on this endpoint; they require an authenticated session.</p>
    <p>Status: <a href="/version">/version</a> &middot; Health: <a href="/health">/health</a></p>
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
    // stdio is an operator-run local process with the deployment's own env —
    // it is trusted, unlike the public HTTP endpoint.
    const server = buildServer({ authorized: true });
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

      const server = buildServer({
        authorized: isAuthorized(req.headers.authorization),
      });
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

    // Finding C5: baseline security headers on every response. Set with
    // setHeader (not writeHead) so each route below keeps its own headers and
    // these ride along. No CSP here — it belongs on the HTML landing page only,
    // never on JSON-RPC responses.
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    if (url.pathname === "/sse") {
      if (!(await limiter.allow(ip))) { sendRateLimited(res, ip); return; }
      await handleStreamableHttp(req, res);
      return;
    }

    // Version / status surface (finding BB): a machine-readable signal for
    // third parties that depend on this server, so tool-set changes are
    // discoverable instead of silent. See CHANGELOG.md for the human version.
    // Discovery manifest. Agents and registries probe this path before they will
    // talk to a remote server; it returned 404, so automated discovery saw
    // nothing at all. Built from server-info.ts so it cannot drift from the
    // identity reported by initialize / the landing page / /version.
    if (url.pathname === "/.well-known/mcp.json") {
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        }).end();
        return;
      }
      if (req.method === "GET" || req.method === "HEAD") {
        const body = buildWellKnownManifest({
          tools: toolsByName.size,
          resources: RESOURCES.length,
        });
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300",
          "Content-Length": Buffer.byteLength(body),
        });
        res.end(req.method === "HEAD" ? undefined : body);
        return;
      }
      res.writeHead(405, { "Content-Type": "text/plain", Allow: "GET, HEAD, OPTIONS" }).end("Method not allowed");
      return;
    }

    if (url.pathname === "/version") {
      if (req.method === "GET" || req.method === "HEAD") {
        const body = JSON.stringify(
          {
            name: SERVER_NAME,
            title: SERVER_TITLE,
            version: SERVER_VERSION,
            mcp_endpoint: "/sse",
            transport: "streamable-http",
            mcp_spec: MCP_SPEC_REVISION,
            // Finding C0: the public endpoint no longer serves every tool, so
            // report the public count (what an anonymous client will see) and
            // the gated count separately. `tools` staying the total would make
            // this endpoint lie to the registries that read it.
            tools: toolsByName.size - PRIVILEGED_TOOLS.size,
            tools_total: toolsByName.size,
            tools_gated: PRIVILEGED_TOOLS.size,
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

    // /openapi.json — RETIRED (bug: the served spec described a different product).
    //
    // Until 2026-08-31 this path served an OpenAPI document titled
    // "HelloGrowthCRM MCP" v1.0.0 describing 14 authenticated CRM operations
    // (create_contact, update_deal, send_whatsapp, trigger_sequence, …) behind a
    // bearer API key from app.hellogrowthcrm.com. None of those endpoints exist
    // here — every POST /tools/<name> returned 404 — and the document directly
    // contradicted this server's own stated identity: no customer data, no CRM
    // actions, no API key. Anyone importing it into ChatGPT Actions was being
    // told to send a live CRM credential to a host that must never receive one.
    //
    // An MCP server is enumerated over the protocol, not over OpenAPI, so the
    // honest answer is a 410 that points at the real surface. The planned
    // authenticated CRM spec now lives with the package it describes, at
    // crm-mcp-tools/openapi.planned.json, and must not be served from this host.
    //
    // Restored 2026-09-02: the merge that brought this comment onto main kept
    // the prose and dropped the behaviour — the handler below was still
    // returning 200 with the very document the comment says was withdrawn. The
    // retirement was merged; only its effect was lost.
    if (url.pathname === "/openapi.json") {
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        }).end();
        return;
      }
      if (req.method === "GET" || req.method === "HEAD") {
        const goneBody = `${JSON.stringify({
          error: "gone",
          message:
            "GET /openapi.json is retired. It described 14 authenticated CRM " +
            "operations that do not exist on this host. This is an MCP server: " +
            "connect to /sse and enumerate tools over the protocol.",
          endpoint: "/sse",
          catalogue: "/version",
        })}\n`;
        res.writeHead(410, {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Length": String(Buffer.byteLength(goneBody)),
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300",
        });
        if (req.method === "HEAD") res.end();
        else res.end(goneBody);
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
        // Finding C5: CSP belongs on this HTML route only — never on JSON-RPC
        // responses. script-src/connect-src/img-src must keep the two analytics
        // tags in HOME_PAGE_HTML working (gtag from googletagmanager, the Ahrefs
        // script injected at runtime), so tightening these means editing
        // HOME_PAGE_HTML in the same change.
        res.setHeader(
          "Content-Security-Policy",
          [
            "default-src 'none'",
            "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://analytics.ahrefs.com",
            "connect-src https://www.google-analytics.com https://analytics.google.com https://analytics.ahrefs.com",
            "img-src 'self' data: https://www.google-analytics.com https://www.googletagmanager.com",
            "style-src 'unsafe-inline'",
            "base-uri 'none'",
            "form-action 'none'",
            "frame-ancestors 'none'",
          ].join("; "),
        );
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
            mcp_spec: MCP_SPEC_REVISION,
            uptimeSeconds: Math.floor(process.uptime()),
            // Public count, matching what an unauthenticated tools/list returns
            // (finding C0). Reporting TOOL_COUNT here would advertise the gated
            // tools to callers that cannot reach them.
            tools: TOOL_COUNT - PRIVILEGED_TOOLS.size,
            tools_total: TOOL_COUNT,
            tools_gated: PRIVILEGED_TOOLS.size,
            resources: RESOURCE_COUNT,
            transport: "streamable-http",
            // This server routes /sse. It has never routed /mcp — the previous
            // value sent probes to a 404.
            endpoint: "/sse",
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
            // Only /sse exists on this host; /mcp and /message never did.
            "Disallow: /sse",
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

      // Finding C4. Mirrors the main site's policy so a researcher landing on
      // the API host has the same reporting path. Restored 2026-09-02: the
      // merge that combined the two hygiene branches dropped this route.
      if (url.pathname === "/.well-known/security.txt") {
        send(200, "text/plain; charset=utf-8", SECURITY_TXT, "public, max-age=86400");
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

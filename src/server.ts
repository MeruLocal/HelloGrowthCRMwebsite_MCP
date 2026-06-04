/**
 * MCP server setup.
 *
 * Supports two transports selected by the TRANSPORT env var:
 *   http  (default) — HTTP + SSE on PORT (default 3008)
 *   stdio           — stdin/stdout for MCP host processes
 */

import http from "http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { toolsByName } from "./tools/index.js";
import { logger } from "./utils/logger.js";
import { getSupabase } from "./lib/supabase.js";

export function buildServer(): Server {
  const server = new Server(
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
        url: `https://hellogrowthcrm.com/crm-for-${name.toLowerCase().replace(/\s+/g, "-")}`,
      }));
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(industries, null, 2) }] };
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
      if (hits[hits.length - 1]! <= cutoff) this.buckets.delete(ip);
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

  // HTTP + SSE transport
  const port = parseInt(process.env.PORT ?? "3008", 10);
  const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10);
  const rateLimitMax    = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "60", 10);
  const limiter = new IpRateLimiter(rateLimitWindow, rateLimitMax);

  // One SSEServerTransport per connected client
  const transports = new Map<string, SSEServerTransport>();

  const httpServer = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
      ?? req.socket.remoteAddress
      ?? "unknown";

    if (req.method === "GET" && url.pathname === "/sse") {
      if (!limiter.allow(ip)) {
        res.writeHead(429, { "Content-Type": "text/plain", "Retry-After": String(Math.ceil(rateLimitWindow / 1000)) })
          .end(`Rate limit exceeded — max ${rateLimitMax} requests per ${rateLimitWindow / 1000}s`);
        logger.warn("Rate limit hit", { ip });
        return;
      }
      const sseTransport = new SSEServerTransport("/message", res);
      transports.set(sseTransport.sessionId, sseTransport);

      res.on("close", () => transports.delete(sseTransport.sessionId));

      const server = buildServer();
      await server.connect(sseTransport);
      return;
    }

    if (req.method === "POST" && url.pathname === "/message") {
      if (!limiter.allow(ip)) {
        res.writeHead(429, { "Content-Type": "text/plain", "Retry-After": String(Math.ceil(rateLimitWindow / 1000)) })
          .end(`Rate limit exceeded — max ${rateLimitMax} requests per ${rateLimitWindow / 1000}s`);
        logger.warn("Rate limit hit", { ip });
        return;
      }
      const sessionId = url.searchParams.get("sessionId") ?? "";
      const sseTransport = transports.get(sessionId);
      if (!sseTransport) {
        res.writeHead(404).end("No SSE session found");
        return;
      }
      await sseTransport.handlePostMessage(req, res);
      return;
    }

    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" }).end(
        "MCP Bot Crawler — connect via GET /sse"
      );
      return;
    }

    res.writeHead(404).end("Not found");
  });

  await new Promise<void>((resolve) => httpServer.listen(port, resolve));
  logger.info("hellogrowthcrm-bot-crawler ready (http)", {
    url: `http://localhost:${port}`,
    sse: `http://localhost:${port}/sse`,
    site: process.env.DEFAULT_TARGET_URL ?? "https://hellogrowthcrm.com",
    tools: [...toolsByName.keys()],
  });
}

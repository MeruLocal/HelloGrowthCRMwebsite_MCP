/**
 * Example: website tools with full AI-name tracking wired in.
 *
 * Demonstrates the required flow for every website tool call:
 *   1. Identify the MCP client (API key → mcp_clients)            [middleware]
 *   2. Enforce the per-client rate limit                          [middleware]
 *   3. Check the tool is permitted for this client
 *   4. Check the resource domain is allowed (by hostname)
 *   5. Block private / internal / metadata URLs (SSRF)
 *   6. Execute the tool
 *   7. Write a success audit log → return the result
 *   On any error: write a failed/denied audit log → return a SAFE message.
 *
 * Tools here take the raw request alongside their args so they can read the
 * API key + headers. Wire `getWebsitePage` etc. into your SSE/HTTP handler,
 * passing the live `IncomingMessage` (or any object with `.headers`).
 */

import { fetch as undiciFetch } from "undici";

import {
  McpAccessError,
  assertDomainAllowed,
  assertToolAllowed,
  blockPrivateUrls,
  logMcpFailure,
  logMcpSuccess,
  type McpClientContext,
} from "../lib/mcpTracking.js";
import {
  authenticateMcpRequest,
  type RequestMeta,
} from "../middleware/mcpClientAuth.js";
import type { RequestLike } from "../lib/mcpTracking.js";

// ─────────────────────────────────────────────────────────────────────────────
// Shared result shape (safe for returning to any client)
// ─────────────────────────────────────────────────────────────────────────────

export interface ToolResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  /** Stable code for the transport to map to an HTTP status. */
  code?: string;
}

/** A tool's real work: gets the validated args + client, returns data + a short summary. */
type Executor<A, T> = (
  args: A,
  ctx: { client: McpClientContext; meta: RequestMeta },
) => Promise<{ data: T; outputSummary: string; resourceUrl?: string }>;

/**
 * The reusable tracking wrapper. Runs auth → permission/domain/SSRF checks →
 * executor → audit. Every branch logs exactly once and returns a safe result.
 */
export async function runTrackedTool<A, T>(opts: {
  req: RequestLike;
  toolName: string;
  args: A;
  /** Pulls the URL to validate out of args (when the tool touches a URL). */
  resourceUrlOf?: (args: A) => string | undefined;
  inputSummary?: string;
  execute: Executor<A, T>;
}): Promise<ToolResult<T>> {
  const { req, toolName, args, execute } = opts;

  // 1–2. Identify client + rate limit (writes its own 'denied' log on failure).
  const auth = await authenticateMcpRequest(req, toolName);
  if (!auth.ok) {
    return { ok: false, error: auth.message, code: auth.code };
  }
  const { client, meta } = auth.ctx;
  const resourceUrl = opts.resourceUrlOf?.(args);

  try {
    // 3. Tool permission.
    assertToolAllowed(client, toolName);

    // 4–5. Domain allow-list + SSRF block (only when the tool uses a URL).
    if (resourceUrl) {
      assertDomainAllowed(client, resourceUrl);
      blockPrivateUrls(resourceUrl);
    }

    // 6. Execute.
    const { data, outputSummary, resourceUrl: usedUrl } = await execute(args, {
      client,
      meta,
    });

    // 7. Success audit.
    void logMcpSuccess({
      toolName,
      clientId: client.clientId,
      aiName: client.aiName,
      resourceUrl: usedUrl ?? resourceUrl ?? null,
      method: meta.method,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      requestId: meta.requestId,
      inputSummary: opts.inputSummary ?? null,
      outputSummary,
    });

    return { ok: true, data };
  } catch (err) {
    const denied = err instanceof McpAccessError;
    const message = err instanceof Error ? err.message : "Tool execution failed.";
    const code = err instanceof McpAccessError ? err.code : "execution_error";

    void logMcpFailure({
      toolName,
      clientId: client.clientId,
      aiName: client.aiName,
      resourceUrl: resourceUrl ?? null,
      method: meta.method,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      requestId: meta.requestId,
      inputSummary: opts.inputSummary ?? null,
      errorMessage: message,
      denied,
      metadata: { code },
    });

    // Safe error: pass through validation messages, mask unexpected internals.
    return {
      ok: false,
      code,
      error: denied ? message : "The request could not be completed.",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Minimal fetch helper used by the example executors
// ─────────────────────────────────────────────────────────────────────────────

async function fetchText(url: string, timeoutMs = 10_000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await undiciFetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "hellogrowth-mcp/1.0 (+website-tools)" },
      // Don't auto-follow redirects: a 30x could bounce to an internal host.
      redirect: "manual",
    });
    if (res.status >= 300 && res.status < 400) {
      throw new Error(`Refusing to follow redirect (HTTP ${res.status}).`);
    }
    if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function textSummary(s: string, n = 200): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > n ? `${clean.slice(0, n)}…` : clean;
}

// ─────────────────────────────────────────────────────────────────────────────
// getWebsitePage — fetch a single page
// ─────────────────────────────────────────────────────────────────────────────

export interface GetWebsitePageArgs {
  url: string;
  maxChars?: number;
}

export function getWebsitePage(req: RequestLike, args: GetWebsitePageArgs) {
  return runTrackedTool({
    req,
    toolName: "getWebsitePage",
    args,
    resourceUrlOf: (a) => a.url,
    inputSummary: `GET ${args.url}`,
    async execute(a) {
      const html = await fetchText(a.url);
      const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() ?? "";
      const body = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const max = a.maxChars ?? 8_000;
      const text = body.length > max ? `${body.slice(0, max)}…[truncated]` : body;
      return {
        data: { url: a.url, title, wordCount: body.split(/\s+/).length, text },
        outputSummary: `title="${textSummary(title, 80)}" words=${body.split(/\s+/).length}`,
        resourceUrl: a.url,
      };
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// searchWebsite — query the site's indexed content (example: Supabase RPC/table)
// ─────────────────────────────────────────────────────────────────────────────

export interface SearchWebsiteArgs {
  query: string;
  limit?: number;
}

export function searchWebsite(req: RequestLike, args: SearchWebsiteArgs) {
  return runTrackedTool({
    req,
    toolName: "searchWebsite",
    args,
    // No external URL here — domain/SSRF checks are skipped automatically.
    inputSummary: `q="${textSummary(args.query, 120)}"`,
    async execute(a) {
      // Replace with your real search (e.g. Supabase full-text / vector RPC).
      const results: { title: string; url: string }[] = [];
      return {
        data: { query: a.query, results, count: results.length },
        outputSummary: `query="${textSummary(a.query, 80)}" results=${results.length}`,
      };
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// getWebsiteSitemap — list URLs from sitemap.xml
// ─────────────────────────────────────────────────────────────────────────────

export interface GetWebsiteSitemapArgs {
  url: string; // sitemap URL, e.g. https://hellobooks.ai/sitemap.xml
}

export function getWebsiteSitemap(req: RequestLike, args: GetWebsiteSitemapArgs) {
  return runTrackedTool({
    req,
    toolName: "getWebsiteSitemap",
    args,
    resourceUrlOf: (a) => a.url,
    inputSummary: `SITEMAP ${args.url}`,
    async execute(a) {
      const xml = await fetchText(a.url);
      const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)]
        .map((m) => m[1]?.trim())
        .filter((u): u is string => Boolean(u));
      return {
        data: { sitemap: a.url, urls: locs, count: locs.length },
        outputSummary: `urls=${locs.length}`,
        resourceUrl: a.url,
      };
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// getWebsiteContent — structured extract (title, meta, headings, text)
// ─────────────────────────────────────────────────────────────────────────────

export interface GetWebsiteContentArgs {
  url: string;
}

export function getWebsiteContent(req: RequestLike, args: GetWebsiteContentArgs) {
  return runTrackedTool({
    req,
    toolName: "getWebsiteContent",
    args,
    resourceUrlOf: (a) => a.url,
    inputSummary: `CONTENT ${args.url}`,
    async execute(a) {
      const html = await fetchText(a.url);
      const pick = (re: RegExp) => re.exec(html)?.[1]?.trim() ?? "";
      const title = pick(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const metaDescription = pick(
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
      );
      const headings = [...html.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)]
        .map((m) => ({
          level: Number(m[1]),
          text: (m[2] ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
        }))
        .filter((h) => h.text);
      return {
        data: { url: a.url, title, metaDescription, headings },
        outputSummary: `title="${textSummary(title, 80)}" headings=${headings.length}`,
        resourceUrl: a.url,
      };
    },
  });
}

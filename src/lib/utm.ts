/**
 * UTM attribution for links to our own site.
 *
 * Tools hand AI agents many hellogrowthcrm.com URLs. Without attribution,
 * traffic an agent sends lands as direct/referral in GA4 and Ahrefs, so the
 * channel is invisible. withUtm() tags own-site URLs only:
 *   - hosts hellogrowthcrm.com and *.hellogrowthcrm.com, except mcp.
 *   - adds utm_source=mcp, utm_medium=ai_agent, utm_campaign=<tool name>
 *   - keeps the query string and #fragment; never overrides an existing utm_*
 *   - external URLs (competitors, YouTube, partners) are untouched
 *
 * tagToolResult() applies it centrally to every tools/call result, so new
 * tools are covered automatically. URLs that are identifiers (canonical,
 * hreflang, sitemaps, sameAs, schema @id) and the tools that report what is
 * live on a site are excluded: tagging those would change their meaning.
 */

import type { McpCallResult } from "../tools/tool-types.js";

const OWN_DOMAIN = "hellogrowthcrm.com";
const EXCLUDED_HOSTS = new Set(["mcp.hellogrowthcrm.com"]);

/** Tools whose URLs must stay exactly as the site publishes or serves them. */
export const UTM_EXCLUDED_TOOLS: ReadonlySet<string> = new Set([
  "seo_get_site_config",
  "seo_get_hreflang",
  "seo_get_canonical",
  "seo_get_sitemaps",
  "seo_get_schema",
  "content_get_seo_rules",
  "generate_robots_txt",
  "generate_llms_txt",
  // Live diagnostics and bot governance report what a site actually serves.
  "fetch_page_content",
  "crawl_pages",
  "check_ai_extractability",
  "validate_sitemaps",
  "check_llms_txt",
  "scan_website_bots",
  "analyze_access_logs",
  "export_bot_report",
  "suggest_bot_policy",
  "verify_bot_identity",
  "list_allowed_bots",
  "list_blocked_bots",
]);

/** JSON keys whose values are identifiers, never links to click. */
const EXCLUDED_KEYS = new Set([
  "canonical",
  "canonical_url",
  "canonicalUrl",
  "hreflang",
  "alternates",
  "sitemap",
  "sitemaps",
  "sitemap_url",
  "sameAs",
  "same_as",
  "@id",
  "loc",
]);

function isOwnHost(host: string): boolean {
  const h = host.toLowerCase();
  if (EXCLUDED_HOSTS.has(h)) return false;
  return h === OWN_DOMAIN || h.endsWith(`.${OWN_DOMAIN}`);
}

export function withUtm(url: string, campaign: string): string {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return url;
  if (!isOwnHost(u.hostname)) return url;
  if ([...u.searchParams.keys()].some((k) => k.toLowerCase().startsWith("utm_"))) return url;
  u.searchParams.set("utm_source", "mcp");
  u.searchParams.set("utm_medium", "ai_agent");
  u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}

const URL_RE = /https?:\/\/[^\s"'<>()[\]{}`]+/g;

/** Tag every own-site URL inside free text (trailing punctuation kept outside). */
export function tagText(text: string, campaign: string): string {
  return text.replace(URL_RE, (match) => {
    const trail = /[.,;:!?]+$/.exec(match)?.[0] ?? "";
    const core = trail ? match.slice(0, -trail.length) : match;
    return withUtm(core, campaign) + trail;
  });
}

function tagValue(value: unknown, campaign: string): unknown {
  if (typeof value === "string") return tagText(value, campaign);
  if (Array.isArray(value)) return value.map((v) => tagValue(v, campaign));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, EXCLUDED_KEYS.has(k) ? v : tagValue(v, campaign)]),
    );
  }
  return value;
}

/** Tag a block of text that may be JSON (keeps the JSON formatting style). */
export function tagContentText(text: string, campaign: string): string {
  if (!text.includes(OWN_DOMAIN)) return text;
  const trimmed = text.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      const pretty = text.includes("\n");
      return JSON.stringify(tagValue(parsed, campaign), null, pretty ? 2 : undefined);
    } catch {
      /* not JSON — fall through */
    }
  }
  return tagText(text, campaign);
}

export function tagToolResult(result: McpCallResult, toolName: string): McpCallResult {
  if (UTM_EXCLUDED_TOOLS.has(toolName)) return result;
  return {
    ...result,
    content: result.content.map((c) =>
      c.type === "text" ? { ...c, text: tagContentText(c.text, toolName) } : c,
    ),
  };
}

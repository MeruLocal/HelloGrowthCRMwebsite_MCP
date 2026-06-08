/**
 * Client & bot detection for MCP/SSE analytics.
 *
 * Given a raw User-Agent (and optional origin/referer), this derives a SAFE,
 * low-cardinality label — `clientName`, `clientType`, `isBot`, `botName`. The
 * raw User-Agent is read here and never returned or stored, so callers only
 * ever handle derived metadata.
 *
 * This is intentionally separate from `core/bot-detector.ts`: that engine powers
 * the bot-governance *tools* (risk scoring, robots policy). This helper is a
 * tiny, dependency-free classifier scoped to analytics labelling.
 */

export type ClientType = "ai" | "browser" | "tool" | "bot" | "unknown";

export interface ClientInfo {
  /** Friendly, low-cardinality label, e.g. "ChatGPT", "Claude", "Googlebot". */
  clientName: string;
  clientType: ClientType;
  isBot: boolean;
  /** Set only when a known crawler signature matched. */
  botName?: string;
}

interface Signature {
  name: string;
  pattern: RegExp;
}

/**
 * Crawler / automated-fetcher signatures. Checked FIRST so that, e.g.,
 * `Google-Extended` is reported as a bot rather than the Gemini AI client.
 * Order matters: more specific tokens appear before broader ones.
 */
const BOT_SIGNATURES: Signature[] = [
  { name: "GPTBot", pattern: /GPTBot/i },
  { name: "OAI-SearchBot", pattern: /OAI-SearchBot/i },
  { name: "ClaudeBot", pattern: /ClaudeBot|anthropic-ai/i },
  { name: "PerplexityBot", pattern: /PerplexityBot/i },
  { name: "Google-Extended", pattern: /Google-Extended/i },
  { name: "Googlebot", pattern: /Googlebot/i },
  { name: "CCBot", pattern: /CCBot/i },
  { name: "Bytespider", pattern: /Bytespider/i },
  { name: "Bingbot", pattern: /bingbot/i },
  { name: "Applebot", pattern: /Applebot/i },
  { name: "Amazonbot", pattern: /Amazonbot/i },
  { name: "AhrefsBot", pattern: /AhrefsBot/i },
  { name: "SemrushBot", pattern: /SemrushBot/i },
];

/**
 * AI / agent client signatures (user-initiated, not crawlers). Checked after
 * bots so crawler tokens win, and before the generic browser heuristic.
 */
const AI_CLIENT_SIGNATURES: Signature[] = [
  { name: "ChatGPT", pattern: /ChatGPT|OpenAI|ChatGPT-User/i },
  { name: "Claude", pattern: /Claude-User|Claude-Web|Claude(?!Bot)|Anthropic/i },
  { name: "Cursor", pattern: /Cursor/i },
  { name: "Perplexity", pattern: /Perplexity/i },
  { name: "Gemini", pattern: /Gemini|google-generativeai|GoogleOther/i },
  { name: "Copilot", pattern: /Copilot|github-copilot/i },
];

/** API / developer tools that are neither browsers nor crawlers. */
const TOOL_SIGNATURES: Signature[] = [
  { name: "Postman", pattern: /PostmanRuntime|Postman/i },
];

/** Heuristic for a genuine browser User-Agent. */
const BROWSER_HINT =
  /Mozilla\/\d.*(Chrome|Safari|Firefox|Edg|OPR|Version)\//i;

/**
 * Derive a safe client label from a User-Agent. The raw UA is consumed here and
 * never surfaced — callers receive only the derived, low-cardinality fields.
 */
export function detectClient(userAgent: string | undefined | null): ClientInfo {
  const ua = (userAgent ?? "").trim();

  if (!ua) {
    return { clientName: "Unknown", clientType: "unknown", isBot: false };
  }

  for (const sig of BOT_SIGNATURES) {
    if (sig.pattern.test(ua)) {
      return {
        clientName: sig.name,
        clientType: "bot",
        isBot: true,
        botName: sig.name,
      };
    }
  }

  for (const sig of AI_CLIENT_SIGNATURES) {
    if (sig.pattern.test(ua)) {
      return { clientName: sig.name, clientType: "ai", isBot: false };
    }
  }

  for (const sig of TOOL_SIGNATURES) {
    if (sig.pattern.test(ua)) {
      return { clientName: sig.name, clientType: "tool", isBot: false };
    }
  }

  if (BROWSER_HINT.test(ua)) {
    return { clientName: "Browser", clientType: "browser", isBot: false };
  }

  return { clientName: "Unknown", clientType: "unknown", isBot: false };
}

/**
 * Reduce a full Origin / Referer header to its host only (no scheme, port,
 * path, or query). Returns `undefined` when the value is absent or unparseable,
 * so no full URL ever reaches telemetry.
 */
export function safeHost(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const raw = value.trim();
  if (!raw || raw === "null") return undefined;
  try {
    const url = raw.includes("://") ? new URL(raw) : new URL(`http://${raw}`);
    return url.hostname || undefined;
  } catch {
    return undefined;
  }
}

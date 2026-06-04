/**
 * Shared types for mcp-bot-crawler.
 *
 * These types are imported by detectors, tools, and report generators.
 * Keep this file free of runtime imports so it stays cheap to load.
 */

export type BotCategory =
  | "search"
  | "ai"
  | "seo"
  | "social"
  | "monitoring"
  | "archive"
  | "scraper"
  | "security"
  | "unknown";

export type AllowStatus = "allowed" | "blocked" | "rate-limited" | "unknown";

export type RecommendedAction =
  | "allow"
  | "monitor"
  | "rate-limit"
  | "block"
  | "verify-identity";

/** A signature record in the known-bots database. */
export interface BotSignature {
  /** Canonical bot name, e.g. "Googlebot". */
  name: string;
  /** Bot category for grouping in reports. */
  category: BotCategory;
  /** Operator / vendor that runs the bot. */
  operator: string;
  /**
   * Case-insensitive substrings or RegExps used to match the User-Agent
   * header. The first match wins, so order more-specific patterns first.
   */
  userAgentPatterns: (string | RegExp)[];
  /** PTR (reverse DNS) suffixes used for verification, e.g. ".googlebot.com". */
  verifiedHostnameSuffixes?: string[];
  /** Documented IP ranges or ASN identifiers (informational). */
  ipRanges?: string[];
  /** Whether respect-for-robots.txt is officially claimed by the operator. */
  respectsRobotsTxt: boolean;
  /**
   * Baseline risk: 0 = fully trusted (e.g. Googlebot), 100 = hostile scraper.
   * The detector may adjust this based on behavior.
   */
  baselineRisk: number;
  /** Public docs / verification page. */
  docsUrl?: string;
  /** Description shown in reports. */
  description: string;
}

/** One parsed line of an access log. */
export interface LogEntry {
  ip: string;
  timestamp: string;
  method: string;
  path: string;
  status: number;
  bytes: number;
  referer: string;
  userAgent: string;
  raw: string;
}

/** Result of matching a single log entry / UA against the bot database. */
export interface BotDetection {
  matched: boolean;
  bot?: BotSignature;
  /** Heuristic category when no signature matched. */
  inferredCategory: BotCategory;
  /** Reasons that contributed to the detection (audit trail). */
  reasons: string[];
}

/** Aggregated stats for one bot across many log lines. */
export interface BotSummary {
  name: string;
  category: BotCategory;
  operator: string;
  hits: number;
  uniqueIps: number;
  uniquePaths: number;
  firstSeen: string;
  lastSeen: string;
  errorRate: number;
  averagePerHour: number;
  allowStatus: AllowStatus;
  riskScore: number;
  recommendedAction: RecommendedAction;
  notes: string[];
}

/** robots.txt parsing result. */
export interface RobotsTxt {
  source: string;
  groups: RobotsGroup[];
  sitemaps: string[];
}

export interface RobotsGroup {
  userAgents: string[];
  allow: string[];
  disallow: string[];
  crawlDelaySeconds?: number;
}

/** Sitemap.xml entry. */
export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
}

/** Full scan response from scan_website_bots. */
export interface ScanResult {
  targetUrl: string;
  scannedAt: string;
  robots: RobotsTxt | null;
  sitemapCount: number;
  sampledPages: number;
  detectedBots: BotSummary[];
  warnings: string[];
}

/** Bot identity verification result. */
export interface VerificationResult {
  ip: string;
  userAgent: string;
  ptr: string | null;
  forwardConfirmed: boolean;
  identifiedAs: string | null;
  trustLevel: "verified" | "spoofed" | "unknown";
  reasons: string[];
}

/** Suggested policy block returned by suggest_bot_policy. */
export interface BotPolicySuggestion {
  bot: string;
  category: BotCategory;
  action: RecommendedAction;
  rationale: string;
  robotsTxtSnippet?: string;
  firewallSnippet?: string;
}

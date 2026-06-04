/**
 * Bot detection engine.
 *
 * Given a User-Agent (and optionally an IP / log entry), returns the matched
 * signature plus an audit trail explaining why it matched. We never trust the
 * UA alone — high-trust bots (Googlebot etc.) should additionally be checked
 * via reverse-DNS using `verify-bot-identity`.
 */

import { GENERIC_BOT_HINTS, KNOWN_BOTS } from "../data/known-bots.js";
import type {
  BotCategory,
  BotDetection,
  BotSignature,
  LogEntry,
} from "../utils/types.js";

export function detectByUserAgent(userAgent: string): BotDetection {
  const reasons: string[] = [];
  if (!userAgent || userAgent === "-") {
    reasons.push("Empty / placeholder User-Agent");
    return {
      matched: true,
      inferredCategory: "scraper",
      reasons,
    };
  }

  for (const bot of KNOWN_BOTS) {
    if (matchesAny(userAgent, bot.userAgentPatterns)) {
      reasons.push(`User-Agent matched signature for ${bot.name}`);
      return { matched: true, bot, inferredCategory: bot.category, reasons };
    }
  }

  for (const hint of GENERIC_BOT_HINTS) {
    if (hint.test(userAgent)) {
      reasons.push(`Generic automation hint matched: ${hint.source}`);
      return {
        matched: true,
        inferredCategory: "unknown",
        reasons,
      };
    }
  }

  return {
    matched: false,
    inferredCategory: "unknown",
    reasons: ["No bot signature or automation hint matched"],
  };
}

function matchesAny(ua: string, patterns: (string | RegExp)[]): boolean {
  for (const p of patterns) {
    if (typeof p === "string") {
      if (ua.toLowerCase().includes(p.toLowerCase())) return true;
    } else if (p.test(ua)) {
      return true;
    }
  }
  return false;
}

/**
 * Aggregate behavioural risk on top of the baseline. Used by analyze and scan
 * to nudge scores up for noisy / suspicious actors.
 */
export interface BehaviorSignals {
  hits: number;
  uniquePaths: number;
  errorRate: number;
  hoursObserved: number;
  ignoresRobots: boolean;
}

export function scoreRisk(
  bot: BotSignature | null,
  signals: BehaviorSignals,
): { score: number; notes: string[] } {
  const notes: string[] = [];
  let score = bot?.baselineRisk ?? 50;

  if (signals.ignoresRobots) {
    score += 20;
    notes.push("Hit Disallowed paths after fetching robots.txt");
  }

  const rate = signals.hoursObserved > 0
    ? signals.hits / signals.hoursObserved
    : signals.hits;
  if (rate > 1000) {
    score += 25;
    notes.push(`Very high request rate (~${Math.round(rate)} req/hr)`);
  } else if (rate > 300) {
    score += 10;
    notes.push(`Elevated request rate (~${Math.round(rate)} req/hr)`);
  }

  if (signals.errorRate > 0.5) {
    score += 15;
    notes.push(`Error rate ${(signals.errorRate * 100).toFixed(0)}% — probing behaviour`);
  }

  if (signals.uniquePaths > 5000) {
    score += 10;
    notes.push(`Touched ${signals.uniquePaths} unique paths`);
  }

  return { score: clamp(score, 0, 100), notes };
}

export function recommendAction(score: number, category: BotCategory): {
  status: "allowed" | "blocked" | "rate-limited" | "unknown";
  action: "allow" | "monitor" | "rate-limit" | "block" | "verify-identity";
} {
  if (category === "search" && score <= 25) {
    return { status: "allowed", action: "allow" };
  }
  if (category === "social" && score <= 30) {
    return { status: "allowed", action: "allow" };
  }
  if (category === "ai" && score <= 40) {
    return { status: "allowed", action: "monitor" };
  }
  if (score >= 70) {
    return { status: "blocked", action: "block" };
  }
  if (score >= 45) {
    return { status: "rate-limited", action: "rate-limit" };
  }
  if (category === "unknown") {
    return { status: "unknown", action: "verify-identity" };
  }
  return { status: "allowed", action: "monitor" };
}

/** Convenience: classify a single log entry. */
export function classifyEntry(entry: LogEntry): BotDetection {
  return detectByUserAgent(entry.userAgent);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

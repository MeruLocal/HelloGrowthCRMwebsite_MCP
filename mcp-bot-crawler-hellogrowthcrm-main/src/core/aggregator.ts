/**
 * Aggregates parsed log entries into per-bot summaries with risk scores.
 *
 * The aggregator is pure: it takes data in, returns data out, and never
 * touches the network or filesystem. That makes it easy to unit-test and
 * reuse across `analyze_access_logs` and `scan_website_bots`.
 */

import {
  classifyEntry,
  recommendAction,
  scoreRisk,
} from "./bot-detector.js";
import { clfToIso } from "./log-parser.js";
import type {
  BotCategory,
  BotSummary,
  LogEntry,
  RobotsTxt,
} from "../utils/types.js";
import { isDisallowed } from "./robots-parser.js";

interface Bucket {
  name: string;
  category: BotCategory;
  operator: string;
  baselineRisk: number | null;
  respectsRobotsTxt: boolean;
  ips: Set<string>;
  paths: Set<string>;
  hits: number;
  errors: number;
  firstSeenMs: number;
  lastSeenMs: number;
  disallowedHits: number;
  notes: Set<string>;
}

export function aggregate(
  entries: LogEntry[],
  robots: RobotsTxt | null = null,
): BotSummary[] {
  const buckets = new Map<string, Bucket>();

  for (const e of entries) {
    const det = classifyEntry(e);
    if (!det.matched) continue;
    const name = det.bot?.name ?? "Unknown / Suspicious";
    const key = name;

    let b = buckets.get(key);
    if (!b) {
      b = {
        name,
        category: det.bot?.category ?? det.inferredCategory,
        operator: det.bot?.operator ?? "unknown",
        baselineRisk: det.bot?.baselineRisk ?? null,
        respectsRobotsTxt: det.bot?.respectsRobotsTxt ?? false,
        ips: new Set(),
        paths: new Set(),
        hits: 0,
        errors: 0,
        firstSeenMs: Number.POSITIVE_INFINITY,
        lastSeenMs: 0,
        disallowedHits: 0,
        notes: new Set(),
      };
      buckets.set(key, b);
    }

    b.hits += 1;
    b.ips.add(e.ip);
    b.paths.add(e.path);
    if (e.status >= 400) b.errors += 1;

    const tsMs = Date.parse(clfToIso(e.timestamp));
    if (Number.isFinite(tsMs)) {
      b.firstSeenMs = Math.min(b.firstSeenMs, tsMs);
      b.lastSeenMs = Math.max(b.lastSeenMs, tsMs);
    }

    if (robots && isDisallowed(robots, e.userAgent, e.path)) {
      b.disallowedHits += 1;
    }
  }

  return [...buckets.values()].map((b) => bucketToSummary(b)).sort(
    (a, z) => z.hits - a.hits,
  );
}

function bucketToSummary(b: Bucket): BotSummary {
  const hoursObserved =
    Number.isFinite(b.firstSeenMs) && b.lastSeenMs > b.firstSeenMs
      ? (b.lastSeenMs - b.firstSeenMs) / 36e5
      : 1;
  const errorRate = b.hits === 0 ? 0 : b.errors / b.hits;
  const ignoresRobots = b.respectsRobotsTxt === false || b.disallowedHits > 0;

  const { score, notes } = scoreRisk(
    b.baselineRisk === null
      ? null
      : {
          name: b.name,
          category: b.category,
          operator: b.operator,
          userAgentPatterns: [],
          respectsRobotsTxt: b.respectsRobotsTxt,
          baselineRisk: b.baselineRisk,
          description: "",
        },
    {
      hits: b.hits,
      uniquePaths: b.paths.size,
      errorRate,
      hoursObserved,
      ignoresRobots,
    },
  );

  for (const n of notes) b.notes.add(n);
  if (b.disallowedHits > 0) {
    b.notes.add(
      `${b.disallowedHits} request(s) hit paths disallowed in robots.txt`,
    );
  }

  const { status, action } = recommendAction(score, b.category);

  return {
    name: b.name,
    category: b.category,
    operator: b.operator,
    hits: b.hits,
    uniqueIps: b.ips.size,
    uniquePaths: b.paths.size,
    firstSeen:
      Number.isFinite(b.firstSeenMs) && b.firstSeenMs > 0
        ? new Date(b.firstSeenMs).toISOString()
        : "",
    lastSeen: b.lastSeenMs > 0 ? new Date(b.lastSeenMs).toISOString() : "",
    errorRate: round(errorRate, 3),
    averagePerHour: round(b.hits / Math.max(hoursObserved, 1 / 60), 1),
    allowStatus: status,
    riskScore: score,
    recommendedAction: action,
    notes: [...b.notes],
  };
}

function round(n: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

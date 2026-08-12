/**
 * Rate-limit bucket storage (finding L′, residual).
 *
 * PR #13 fixed the spoofable client-IP resolution, but the buckets stayed
 * in-memory and per-process — so a deployment scaled to N instances enforces
 * an effective limit of N× the configured one, and every restart resets all
 * buckets. This module adds an optional shared store while keeping the
 * in-memory implementation as the default and as the fallback.
 *
 * Backend selection (createRateLimitStore):
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN set → Upstash Redis via
 *     its REST API (plain fetch — no new npm dependency), fixed-window
 *     INCR + PEXPIRE in one pipelined request.
 *   otherwise → in-memory sliding window (previous behaviour).
 *
 * Failure policy: if the shared store errors or times out, the decision falls
 * back to the in-memory store for that request (fail-open to LOCAL limiting,
 * not to unlimited) and a warning is logged once per minute. A Redis outage
 * must never take the MCP endpoint down with it.
 */

import { logger } from "./logger.js";

export interface RateLimitStore {
  /**
   * Record a hit for `key` and decide whether it is within `maxRequests` per
   * `windowMs`. Returns true when the request is allowed.
   */
  hit(key: string, windowMs: number, maxRequests: number): Promise<boolean>;
}

/** Sliding-window, in-memory. Identical behaviour to the previous IpRateLimiter. */
export class MemoryRateLimitStore implements RateLimitStore {
  // key → [request timestamps]
  private readonly buckets = new Map<string, number[]>();
  private lastPrune = Date.now();

  async hit(key: string, windowMs: number, maxRequests: number): Promise<boolean> {
    const now = Date.now();
    // Amortised pruning so stale buckets cannot grow memory without bound.
    if (now - this.lastPrune > windowMs) this.prune(windowMs);

    const cutoff = now - windowMs;
    const hits = (this.buckets.get(key) ?? []).filter((t) => t > cutoff);
    hits.push(now);
    this.buckets.set(key, hits);
    return hits.length <= maxRequests;
  }

  private prune(windowMs: number): void {
    const cutoff = Date.now() - windowMs;
    for (const [key, hits] of this.buckets) {
      if ((hits.at(-1) ?? 0) <= cutoff) this.buckets.delete(key);
    }
    this.lastPrune = Date.now();
  }
}

/**
 * Fixed-window counter in Upstash Redis, shared across all instances.
 *
 * One pipelined REST call per request: INCR rl:{key}:{window} + PEXPIRE.
 * Fixed-window admits at most 2× the limit across a window boundary in the
 * worst case — acceptable for abuse control, and it keeps the store to a
 * single round trip.
 */
export class UpstashRateLimitStore implements RateLimitStore {
  private lastWarnAt = 0;

  constructor(
    private readonly restUrl: string,
    private readonly restToken: string,
    private readonly fallback: RateLimitStore = new MemoryRateLimitStore(),
    private readonly timeoutMs = 2000,
  ) {}

  async hit(key: string, windowMs: number, maxRequests: number): Promise<boolean> {
    const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
    // Encode the key so an IP (or a forged header that slipped through) cannot
    // inject Redis command segments via the REST path.
    const redisKey = `rl:${encodeURIComponent(key)}:${windowStart}`;

    try {
      const res = await fetch(`${this.restUrl.replace(/\/$/, "")}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.restToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", redisKey],
          // Expire two windows out so boundary reads never race the TTL.
          ["PEXPIRE", redisKey, String(windowMs * 2)],
        ]),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);

      const results = (await res.json()) as Array<{ result?: unknown; error?: string }>;
      const incr = results?.[0];
      if (!incr || incr.error !== undefined || typeof incr.result !== "number") {
        throw new Error(`Upstash INCR failed: ${incr?.error ?? "malformed response"}`);
      }
      return incr.result <= maxRequests;
    } catch (err) {
      this.warnThrottled((err as Error).message);
      // Fail open to LOCAL limiting, never to unlimited.
      return this.fallback.hit(key, windowMs, maxRequests);
    }
  }

  private warnThrottled(message: string): void {
    const now = Date.now();
    if (now - this.lastWarnAt > 60_000) {
      this.lastWarnAt = now;
      logger.warn("Shared rate-limit store unavailable — using in-memory fallback", {
        err: message,
      });
    }
  }
}

/** Pick the store from the environment. */
export function createRateLimitStore(
  env: NodeJS.ProcessEnv = process.env,
): RateLimitStore {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    logger.info("Rate limiting: shared store (Upstash Redis)", { url });
    return new UpstashRateLimitStore(url, token);
  }
  logger.info(
    "Rate limiting: in-memory (per-process). Set UPSTASH_REDIS_REST_URL and " +
      "UPSTASH_REDIS_REST_TOKEN for a shared store when scaling horizontally.",
  );
  return new MemoryRateLimitStore();
}

/**
 * In-memory, per-client_id rate limiter (sliding 60s window).
 *
 * Memory-based by design — fast and dependency-free, scoped to a single
 * process. If you later run multiple instances, swap the store for Redis or a
 * Postgres counter; the public API here stays the same.
 *
 * Each client carries its own `rate_limit_per_minute` (from `mcp_clients`), so
 * the limit is passed in per check rather than fixed at construction:
 *   ChatGPT/Claude/Gemini: 60, Cursor: 120, Internal AI: 300, ...
 */

export interface RateLimitResult {
  allowed: boolean;
  /** Calls already counted in the current window (including this one if allowed). */
  count: number;
  limit: number;
  /** Calls left in the window after this check. */
  remaining: number;
  /** Epoch ms when the window's oldest call ages out (≈ when capacity frees up). */
  resetAt: number;
}

const WINDOW_MS = 60_000;

export class McpRateLimiter {
  // client_id -> ascending list of call timestamps within the window.
  private readonly hits = new Map<string, number[]>();

  constructor(private readonly windowMs: number = WINDOW_MS) {}

  /**
   * Record an attempt for `clientId` against `limitPerMinute`. Returns whether
   * it is allowed plus window accounting. A non-positive limit means unlimited.
   */
  check(clientId: string, limitPerMinute: number): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const recent = (this.hits.get(clientId) ?? []).filter(
      (t) => t > windowStart,
    );

    if (limitPerMinute <= 0) {
      // Unlimited — still record for observability.
      recent.push(now);
      this.hits.set(clientId, recent);
      return {
        allowed: true,
        count: recent.length,
        limit: limitPerMinute,
        remaining: Number.POSITIVE_INFINITY,
        resetAt: now + this.windowMs,
      };
    }

    if (recent.length >= limitPerMinute) {
      const oldest = recent[0] ?? now;
      this.hits.set(clientId, recent);
      return {
        allowed: false,
        count: recent.length,
        limit: limitPerMinute,
        remaining: 0,
        resetAt: oldest + this.windowMs,
      };
    }

    recent.push(now);
    this.hits.set(clientId, recent);
    return {
      allowed: true,
      count: recent.length,
      limit: limitPerMinute,
      remaining: limitPerMinute - recent.length,
      resetAt: (recent[0] ?? now) + this.windowMs,
    };
  }

  /** Drop empty/expired buckets. Call periodically if the process is long-lived. */
  prune(): void {
    const windowStart = Date.now() - this.windowMs;
    for (const [key, times] of this.hits) {
      const kept = times.filter((t) => t > windowStart);
      if (kept.length === 0) this.hits.delete(key);
      else this.hits.set(key, kept);
    }
  }

  reset(clientId?: string): void {
    if (clientId) this.hits.delete(clientId);
    else this.hits.clear();
  }
}

/** Shared singleton used by the middleware / tools. */
export const mcpRateLimiter = new McpRateLimiter();

/**
 * A minimal per-host rate limiter so the crawler stays polite.
 *
 * Each call to `wait(host)` resolves no sooner than `delayMs` after the
 * previous call for the same host. Use it as:
 *
 *   await rateLimiter.wait(host);
 *   const res = await fetch(url);
 */

export class RateLimiter {
  private lastCall = new Map<string, number>();
  constructor(private readonly delayMs: number) {}

  async wait(host: string): Promise<void> {
    const now = Date.now();
    const last = this.lastCall.get(host) ?? 0;
    const wait = Math.max(0, last + this.delayMs - now);
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    this.lastCall.set(host, Date.now());
  }
}

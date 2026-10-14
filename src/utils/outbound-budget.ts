/**
 * Outbound fetch budget for anonymous callers.
 *
 * crawl_pages, scan_website_bots, check_ai_extractability and
 * validate_sitemaps turn one tool call into many fetches against a site the
 * caller chooses, all from this server's IP. With 60 requests/min per IP that
 * was roughly 1,500+ outbound fetches a minute — an amplifier whose abuse
 * complaints land on us. Each actual network fetch (every redirect hop) is
 * charged here, keyed by the caller's rate-limit IP; authorised sessions are
 * exempt.
 *
 * Settings (read per call, so tests and operators can change them):
 *   OUTBOUND_BUDGET_PER_MIN   default 30
 *   OUTBOUND_BUDGET_PER_HOUR  default 300
 *   PUBLIC_MAX_PAGES_PER_CALL default 5 (per-call page caps, see publicPageCap)
 *
 * The key comes from resolveClientIp (src/utils/client-ip.ts). If the proxy
 * trust settings are wrong in production, every caller shares one budget.
 */

import { getCallContext } from "../tools/call-context.js";
import { createRateLimitStore, type RateLimitStore } from "./rate-limit-store.js";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

// Two stores: the in-memory store prunes by the window of the call that
// triggers pruning, so mixing a 1-minute and a 1-hour window in one store
// would drop hour buckets early.
let stores: { minute: RateLimitStore; hour: RateLimitStore } | null = null;

function getStores() {
  stores ??= { minute: createRateLimitStore(), hour: createRateLimitStore() };
  return stores;
}

/** Test hook: replace (or reset with null) the backing stores. */
export function setOutboundStores(next: { minute: RateLimitStore; hour: RateLimitStore } | null): void {
  stores = next;
}

function intEnv(name: string, fallback: number): number {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export const OUTBOUND_BUDGET_WARNING =
  "Outbound fetch budget for this client is exhausted; the result is partial. Retry in about a minute.";

/**
 * Charge one outbound fetch for `ip`. Returns false when either window is
 * exhausted. Both windows are always charged so a burst cannot dodge the hour.
 */
export async function takeOutbound(ip: string): Promise<boolean> {
  const { minute, hour } = getStores();
  const key = `outbound:${ip}`;
  const [m, h] = await Promise.all([
    minute.hit(key, MINUTE, intEnv("OUTBOUND_BUDGET_PER_MIN", 30)),
    hour.hit(key, HOUR, intEnv("OUTBOUND_BUDGET_PER_HOUR", 300)),
  ]);
  return m && h;
}

/** Charge the current call's caller; authorised sessions are exempt. */
export async function chargeCurrentCaller(): Promise<boolean> {
  const ctx = getCallContext();
  if (ctx.authorized) return true;
  return takeOutbound(ctx.clientIp ?? "unknown");
}

/**
 * Per-call page cap. Public callers get min(requested, PUBLIC_MAX_PAGES_PER_CALL);
 * authorised sessions get what they asked for.
 */
export function publicPageCap(requested: number): { value: number; capped: boolean } {
  if (getCallContext().authorized) return { value: requested, capped: false };
  const cap = intEnv("PUBLIC_MAX_PAGES_PER_CALL", 5);
  return requested > cap ? { value: cap, capped: true } : { value: requested, capped: false };
}

export function capWarning(what: string, requested: number, used: number): string {
  return `${what} capped at ${used} (requested ${requested}) for the public endpoint. Authenticated sessions are not capped.`;
}

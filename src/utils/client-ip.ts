/**
 * Resolve the client IP used as the rate-limiter (and outbound-budget) key.
 *
 * ── History ─────────────────────────────────────────────────────────────────
 * 1. The first version took X-Forwarded-For[0], which is caller-controlled:
 *    rotating it minted a fresh bucket per request.
 * 2. The second took CF-Connecting-IP, then the right-most XFF hop — but
 *    trusted them by default from ANY peer. A caller that reaches Node without
 *    a header-rewriting proxy in front still picks its own bucket, because
 *    CF-Connecting-IP was taken verbatim and the right-most XFF hop is its own
 *    value. Measured: rotating either header gave 7/7 HTTP 200 past a limit of
 *    5 (audit FAIL X.rate_limit).
 *
 * ── Trust model (now) ───────────────────────────────────────────────────────
 * Forwarded headers are honoured only when ALL of these hold:
 *   - TRUST_PROXY_HEADERS=true (default FALSE — production must opt in), and
 *   - the TCP peer (req.socket.remoteAddress) is inside TRUSTED_PROXY_CIDRS
 *     (default 127.0.0.1/32,::1/128 — a reverse proxy on the same host).
 * Then:
 *   - CF-Connecting-IP is used only when TRUST_CLOUDFLARE=true as well.
 *   - Otherwise X-Forwarded-For is walked from the RIGHT, skipping hops that
 *     are themselves trusted proxies; the first untrusted hop is the client.
 * Anything else → the socket address.
 *
 * Production (Cloudflare → Apache on the same host → Node) is expected to set
 * TRUST_PROXY_HEADERS=true and, if Apache passes CF-Connecting-IP through,
 * TRUST_CLOUDFLARE=true. Ops must confirm the topology before deploy: with
 * the defaults behind a proxy, every caller shares the proxy's bucket.
 */

import { ipInCidrs, normalizeIp, parseCidrList, type Cidr } from "./cidr.js";

export interface ClientIpHeaders {
  [key: string]: string | string[] | undefined;
}

export interface ClientIpConfig {
  trustProxy: boolean;
  trustedProxies: readonly Cidr[];
  trustCloudflare: boolean;
}

export type ClientIpMode = "direct" | "proxy" | "proxy+cloudflare";

const DEFAULT_TRUSTED_PROXY_CIDRS = "127.0.0.1/32,::1/128";

const truthy = (v: string | undefined): boolean => ["1", "true", "yes"].includes((v ?? "").trim().toLowerCase());

export function clientIpConfigFromEnv(env: NodeJS.ProcessEnv = process.env): ClientIpConfig {
  return {
    trustProxy: truthy(env.TRUST_PROXY_HEADERS),
    trustedProxies: parseCidrList(env.TRUSTED_PROXY_CIDRS ?? DEFAULT_TRUSTED_PROXY_CIDRS),
    trustCloudflare: truthy(env.TRUST_CLOUDFLARE),
  };
}

export function clientIpMode(config: ClientIpConfig): ClientIpMode {
  if (!config.trustProxy) return "direct";
  return config.trustCloudflare ? "proxy+cloudflare" : "proxy";
}

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * @param headers        Incoming request headers (lower-cased keys, as Node supplies).
 * @param socketAddress  `req.socket.remoteAddress` — the TCP peer.
 * @param config         Trust settings; defaults to the environment.
 */
export function resolveClientIp(
  headers: ClientIpHeaders,
  socketAddress?: string,
  config: ClientIpConfig = clientIpConfigFromEnv(),
): string {
  const peer = socketAddress ? normalizeIp(socketAddress) : undefined;
  if (!peer) return "unknown";

  if (!config.trustProxy || !ipInCidrs(peer, config.trustedProxies)) return peer;

  if (config.trustCloudflare) {
    const cf = firstValue(headers["cf-connecting-ip"])?.trim();
    if (cf) return normalizeIp(cf);
  }

  const xff = firstValue(headers["x-forwarded-for"]);
  if (xff) {
    const hops = xff.split(",").map((h) => normalizeIp(h)).filter(Boolean);
    // Walk from the right: everything left of the first untrusted hop is
    // caller-supplied and worthless.
    for (let i = hops.length - 1; i >= 0; i -= 1) {
      const hop = hops[i]!;
      if (!ipInCidrs(hop, config.trustedProxies)) return hop;
    }
  }

  return peer;
}

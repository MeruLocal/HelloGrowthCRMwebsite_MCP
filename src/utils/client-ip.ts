/**
 * Resolve the client IP used as the rate-limiter bucket key.
 *
 * ── Why this file exists ────────────────────────────────────────────────────
 * The previous implementation was:
 *
 *   req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ?? req.socket.remoteAddress
 *
 * Taking `[0]` of X-Forwarded-For is client-controlled, and this server sits
 * behind Cloudflare. Cloudflare **appends** the real client IP to any incoming
 * X-Forwarded-For rather than replacing it, so a request sent as:
 *
 *   X-Forwarded-For: 1.2.3.4
 *
 * arrives at the origin as:
 *
 *   X-Forwarded-For: 1.2.3.4, <real client IP>
 *
 * …and `[0]` is the attacker's value. Rotating that header gives every request
 * a fresh bucket, so the rate limit could be bypassed entirely — while still
 * looking correctly configured. That is a worse failure than having no limiter,
 * because it reads as protection that is not there.
 *
 * ── Resolution order ────────────────────────────────────────────────────────
 * 1. `CF-Connecting-IP` — set by Cloudflare, overwritten on every request, so a
 *    client cannot forge it through the edge.
 * 2. The **last** entry of `X-Forwarded-For` — the hop appended by the closest
 *    trusted proxy. Client-supplied values sit to the left of it.
 * 3. `req.socket.remoteAddress`.
 *
 * Set `TRUST_PROXY_HEADERS=false` when the server is exposed directly with no
 * proxy in front: then no forwarded header is honoured at all, and only the
 * socket address is used. Trusting them without a proxy is the mirror-image
 * vulnerability.
 */

export interface ClientIpHeaders {
  [key: string]: string | string[] | undefined;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * @param headers        Incoming request headers (lower-cased keys, as Node supplies).
 * @param socketAddress  `req.socket.remoteAddress`.
 * @param trustProxy     Honour forwarded headers. Defaults to the
 *                       `TRUST_PROXY_HEADERS` env var (default: true).
 */
export function resolveClientIp(
  headers: ClientIpHeaders,
  socketAddress?: string,
  trustProxy: boolean = (process.env.TRUST_PROXY_HEADERS ?? "true").toLowerCase() !== "false",
): string {
  if (trustProxy) {
    // Cloudflare sets this itself and overwrites any client-supplied value.
    const cf = firstValue(headers["cf-connecting-ip"])?.trim();
    if (cf) return cf;

    // Take the LAST hop, not the first: everything to its left is caller-supplied.
    const xff = firstValue(headers["x-forwarded-for"]);
    if (xff) {
      const hops = xff.split(",").map((h) => h.trim()).filter(Boolean);
      const last = hops.at(-1);
      if (last) return last;
    }
  }

  return socketAddress ?? "unknown";
}

/**
 * Outbound-fetch guard for the tools that fetch caller-supplied URLs
 * (scan_website_bots, fetch_page_content, crawl_pages, validate_sitemaps,
 * check_ai_extractability). The public endpoint is anonymous, so without this
 * a caller could point the server at loopback, cloud metadata
 * (169.254.169.254) or private-network addresses.
 *
 * Known limit: the hostname is resolved here and again by the HTTP client, so a
 * DNS-rebinding host could still differ between the two lookups. Closing that
 * needs a pinned-IP dispatcher; tracked in the audit report.
 */

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function ipv4Blocked(ip: string): boolean {
  const [a = 0, b = 0] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) || // link-local + cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast + reserved
  );
}

export function isBlockedIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return ipv4Blocked(ip);
  if (v === 6) {
    const l = ip.toLowerCase();
    if (l === "::1" || l === "::") return true;
    const mapped = l.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return ipv4Blocked(mapped[1] ?? "0.0.0.0");
    return /^(fc|fd|fe[89ab])/.test(l) || l.startsWith("ff");
  }
  return true; // not an IP at all: treat as blocked
}

/** Throws if the URL is not a public http(s) destination. */
export async function assertPublicUrl(raw: string): Promise<URL> {
  const u = new URL(raw);
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Only http(s) URLs may be fetched.");
  }
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) {
    throw new Error("That host is not a public destination.");
  }
  const addrs = isIP(host)
    ? [{ address: host }]
    : await lookup(host, { all: true }).catch(() => {
        throw new Error("Could not resolve that host.");
      });
  if (addrs.length === 0 || addrs.some((a) => isBlockedIp(a.address))) {
    throw new Error("That host is not a public destination.");
  }
  return u;
}

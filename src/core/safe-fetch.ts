/**
 * The only way tool code may make an outbound HTTP request to a caller-chosen
 * URL. Public tools (fetch_page_content, crawl_pages, scan_website_bots,
 * check_ai_extractability, validate_sitemaps, check_llms_txt) take arbitrary
 * URLs, so without this a caller could reach 127.0.0.1, the cloud metadata
 * address, RFC 1918 hosts, or a public host that redirects to any of them, and
 * read the answer back as "page text".
 *
 * Every hop:
 *   1. http/https only, no userinfo.
 *   2. DNS resolved once; the request is refused if ANY address is in a blocked
 *      range (IP literals are checked without a lookup).
 *   3. The connection is pinned to the vetted address (undici connect.lookup),
 *      so DNS rebinding between check and connect cannot swap it.
 *   4. Redirects are followed manually, each Location re-vetted, max 3.
 *   5. The body is streamed and cut at maxBytes; one deadline covers all hops.
 *   6. Errors are generic codes; no internal messages leave this module.
 *
 * Escape hatch for local development ONLY: SAFE_FETCH_ALLOW_PRIVATE=1 permits
 * loopback addresses (127.0.0.0/8, ::1). Every other blocked range stays
 * blocked. Never set it in production.
 */

import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { LookupFunction } from "node:net";

import { Agent, request } from "undici";

import { chargeCurrentCaller } from "../utils/outbound-budget.js";

export type SafeFetchError =
  | "bad_url"
  | "bad_scheme"
  | "blocked_address"
  | "timeout"
  | "too_many_redirects"
  | "network_error";

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  headers?: Record<string, string>;
  /**
   * Called once per network request (each redirect hop counts) after the
   * address is vetted. Return false to stop with `budget_exhausted`.
   * Defaults to charging the current caller's outbound budget.
   */
  beforeRequest?: () => Promise<boolean> | boolean;
}

export type SafeFetchResult =
  | {
      ok: true;
      status: number;
      body: string;
      bytes: number;
      truncated: boolean;
      finalUrl: string;
      contentType: string | null;
    }
  | { ok: false; error: SafeFetchError | "budget_exhausted" };

export const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;

// ── address policy ───────────────────────────────────────────────────────────

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((n, octet) => (n << 8) + Number(octet), 0) >>> 0;
}

const V4_BLOCKED: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.88.99.0", 24], // deprecated 6to4 relay anycast
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4], // includes 255.255.255.255
];

function inV4(ip: string, base: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}

function isLoopback(ip: string): boolean {
  if (isIP(ip) === 4) return inV4(ip, "127.0.0.0", 8);
  const h = expandIpv6(ip);
  if (!h) return false;
  if (h.slice(0, 7).every((x) => x === 0) && h[7] === 1) return true;
  const v4 = mappedV4(h);
  return v4 ? inV4(v4, "127.0.0.0", 8) : false;
}

/** Expand an IPv6 address to 8 16-bit groups. Returns null if malformed. */
export function expandIpv6(ip: string): number[] | null {
  let s = ip.split("%")[0] ?? "";
  // Embedded dotted IPv4 tail (::ffff:1.2.3.4).
  const dotted = /(\d+\.\d+\.\d+\.\d+)$/.exec(s);
  if (dotted?.[1]) {
    if (isIP(dotted[1]) !== 4) return null;
    const n = ipv4ToInt(dotted[1]);
    s = s.slice(0, -dotted[1].length) + `${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const parts = s.split("::");
  if (parts.length > 2) return null;
  const head = parts[0] ? parts[0].split(":") : [];
  const tail = parts.length === 2 && parts[1] ? parts[1].split(":") : [];
  const fill = 8 - head.length - tail.length;
  if (parts.length === 1 && fill !== 0) return null;
  if (fill < 0) return null;
  const groups = [...head, ...Array(parts.length === 2 ? fill : 0).fill("0"), ...tail];
  if (groups.length !== 8) return null;
  const out = groups.map((g) => (/^[0-9a-f]{1,4}$/i.test(g) ? Number.parseInt(g, 16) : Number.NaN));
  return out.some(Number.isNaN) ? null : out;
}

function mappedV4(h: number[]): string | null {
  // ::ffff:a.b.c.d (mapped) and ::a.b.c.d (deprecated compatible)
  const zeros5 = h.slice(0, 5).every((x) => x === 0);
  if (zeros5 && (h[5] === 0xffff || h[5] === 0)) {
    const hi = h[6] ?? 0;
    const lo = h[7] ?? 0;
    return `${hi >> 8}.${hi & 0xff}.${lo >> 8}.${lo & 0xff}`;
  }
  return null;
}

/** True when an address must never be fetched from a public tool. */
export function isBlockedAddress(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return V4_BLOCKED.some(([base, bits]) => inV4(ip, base, bits));
  if (family !== 6) return true; // not an IP at all: refuse
  const h = expandIpv6(ip);
  if (!h) return true;
  const [a = 0, b = 0] = h;
  if (h.every((x) => x === 0)) return true; // ::
  if (h.slice(0, 7).every((x) => x === 0) && h[7] === 1) return true; // ::1
  if ((a & 0xfe00) === 0xfc00) return true; // fc00::/7
  if ((a & 0xffc0) === 0xfe80) return true; // fe80::/10
  if ((a & 0xff00) === 0xff00) return true; // ff00::/8
  if (a === 0x64 && b === 0xff9b && h.slice(2, 6).every((x) => x === 0)) return true; // 64:ff9b::/96
  if (a === 0x2001 && b === 0) return true; // Teredo 2001:0::/32
  const v4 = mappedV4(h);
  if (v4) return isBlockedAddress(v4); // ::ffff:0:0/96 and ::/96
  if (a === 0x2002) {
    // 6to4 embeds an IPv4 address in bits 16-47.
    const c = h[2] ?? 0;
    return isBlockedAddress(`${b >> 8}.${b & 0xff}.${c >> 8}.${c & 0xff}`);
  }
  return false;
}

function allowedAddress(ip: string): boolean {
  if (!isBlockedAddress(ip)) return true;
  return process.env.SAFE_FETCH_ALLOW_PRIVATE === "1" && isLoopback(ip);
}

// ── fetch ────────────────────────────────────────────────────────────────────

interface Vetted {
  url: URL;
  address: string;
  family: 4 | 6;
}

async function vet(raw: string, base?: URL): Promise<Vetted | SafeFetchError> {
  let url: URL;
  try {
    url = base ? new URL(raw, base) : new URL(raw);
  } catch {
    return "bad_url";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return "bad_scheme";
  if (url.username || url.password) return "bad_url";

  const host = url.hostname.replace(/^\[|\]$/g, "");
  const literal = isIP(host);
  if (literal) {
    return allowedAddress(host) ? { url, address: host, family: literal as 4 | 6 } : "blocked_address";
  }

  let addresses: { address: string; family: number }[];
  try {
    addresses = await dnsLookup(host, { all: true, verbatim: true });
  } catch {
    return "network_error";
  }
  if (addresses.length === 0) return "network_error";
  if (addresses.some((a) => !allowedAddress(a.address))) return "blocked_address";
  const first = addresses[0]!;
  return { url, address: first.address, family: first.family === 6 ? 6 : 4 };
}

function pinnedAgent(v: Vetted): Agent {
  const pinned: LookupFunction = (_hostname, options, callback) => {
    if ((options as { all?: boolean }).all) {
      (callback as unknown as (e: null, a: { address: string; family: number }[]) => void)(null, [
        { address: v.address, family: v.family },
      ]);
    } else {
      callback(null, v.address, v.family);
    }
  };
  return new Agent({ connect: { lookup: pinned }, connections: 1, pipelining: 0 });
}

export async function safeFetch(rawUrl: string, opts: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxRedirects = opts.maxRedirects ?? 3;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  timer.unref?.();

  let current: URL | undefined;
  let next = rawUrl;
  try {
    for (let hop = 0; hop <= maxRedirects; hop += 1) {
      const vetted = await vet(next, current);
      if (typeof vetted === "string") return { ok: false, error: vetted };
      if (controller.signal.aborted) return { ok: false, error: "timeout" };
      if (!(await (opts.beforeRequest ?? chargeCurrentCaller)())) {
        return { ok: false, error: "budget_exhausted" };
      }

      const agent = pinnedAgent(vetted);
      try {
        const res = await request(vetted.url, {
          method: "GET",
          headers: opts.headers,
          signal: controller.signal,
          dispatcher: agent,
          maxRedirections: 0,
        });

        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          await res.body.dump({ limit: 64 * 1024 }).catch(() => undefined);
          const loc = res.headers.location;
          next = Array.isArray(loc) ? (loc[0] ?? "") : loc;
          current = vetted.url;
          continue;
        }

        const chunks: Buffer[] = [];
        let bytes = 0;
        let truncated = false;
        for await (const chunk of res.body) {
          const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
          if (bytes + buf.length > maxBytes) {
            chunks.push(buf.subarray(0, maxBytes - bytes));
            bytes = maxBytes;
            truncated = true;
            res.body.destroy();
            break;
          }
          chunks.push(buf);
          bytes += buf.length;
        }
        const ct = res.headers["content-type"];
        return {
          ok: true,
          status: res.statusCode,
          body: Buffer.concat(chunks).toString("utf8"),
          bytes,
          truncated,
          finalUrl: vetted.url.toString(),
          contentType: Array.isArray(ct) ? (ct[0] ?? null) : (ct ?? null),
        };
      } finally {
        agent.close().catch(() => undefined);
      }
    }
    return { ok: false, error: "too_many_redirects" };
  } catch {
    return { ok: false, error: controller.signal.aborted ? "timeout" : "network_error" };
  } finally {
    clearTimeout(timer);
  }
}

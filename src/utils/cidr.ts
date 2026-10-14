/** Minimal CIDR matching for IPv4 and IPv6 (no dependencies). */

import { isIP } from "node:net";

import { expandIpv6 } from "../core/safe-fetch.js";

export interface Cidr {
  family: 4 | 6;
  bits: number[]; // 32 or 128 bits as 0/1
  prefix: number;
}

function toBits(ip: string): { family: 4 | 6; bits: number[] } | null {
  const plain = normalizeIp(ip);
  const family = isIP(plain);
  if (family === 4) {
    const bits = plain
      .split(".")
      .flatMap((o) => Number(o).toString(2).padStart(8, "0").split("").map(Number));
    return { family: 4, bits };
  }
  if (family === 6) {
    const groups = expandIpv6(plain);
    if (!groups) return null;
    return { family: 6, bits: groups.flatMap((g) => g.toString(2).padStart(16, "0").split("").map(Number)) };
  }
  return null;
}

/** Strip brackets, a zone id and the IPv4-mapped prefix Node puts on sockets. */
export function normalizeIp(ip: string): string {
  let s = ip.trim().replace(/^\[|\]$/g, "").split("%")[0] ?? "";
  if (/^::ffff:\d+\.\d+\.\d+\.\d+$/i.test(s)) s = s.slice(7);
  return s;
}

export function parseCidr(spec: string): Cidr | null {
  const [addr, len] = spec.trim().split("/");
  if (!addr) return null;
  const parsed = toBits(addr);
  if (!parsed) return null;
  const max = parsed.family === 4 ? 32 : 128;
  const prefix = len === undefined ? max : Number(len);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > max) return null;
  return { family: parsed.family, bits: parsed.bits, prefix };
}

export function parseCidrList(list: string): Cidr[] {
  return list
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseCidr)
    .filter((c): c is Cidr => c !== null);
}

export function ipInCidrs(ip: string | undefined, cidrs: readonly Cidr[]): boolean {
  if (!ip) return false;
  const parsed = toBits(ip);
  if (!parsed) return false;
  return cidrs.some(
    (c) => c.family === parsed.family && c.bits.slice(0, c.prefix).every((b, i) => parsed.bits[i] === b),
  );
}

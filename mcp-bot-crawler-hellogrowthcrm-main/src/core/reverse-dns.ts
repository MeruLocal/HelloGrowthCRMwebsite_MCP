/**
 * Reverse-DNS verification of bot identity.
 *
 * The canonical way to verify a bot like Googlebot is:
 *   1. PTR lookup the source IP        →  e.g.  crawl-66-249-66-1.googlebot.com
 *   2. Confirm the hostname suffix matches the bot's documented domain
 *   3. Forward-resolve that hostname and confirm the IP matches the original
 *
 * This module implements all three steps using only Node's built-in `dns`
 * module so no extra dependencies are required.
 */

import { promises as dns } from "node:dns";
import { isIP } from "node:net";

import { KNOWN_BOTS } from "../data/known-bots.js";
import type { BotSignature, VerificationResult } from "../utils/types.js";
import { logger } from "../utils/logger.js";

export async function verifyBotIdentity(
  ip: string,
  userAgent: string,
): Promise<VerificationResult> {
  const reasons: string[] = [];
  if (!isIP(ip)) {
    return {
      ip,
      userAgent,
      ptr: null,
      forwardConfirmed: false,
      identifiedAs: null,
      trustLevel: "unknown",
      reasons: ["Invalid IP address"],
    };
  }

  let ptr: string | null = null;
  try {
    const hostnames = await dns.reverse(ip);
    ptr = hostnames[0] ?? null;
    if (ptr) reasons.push(`PTR record: ${ptr}`);
    else reasons.push("PTR returned no hostnames");
  } catch (err) {
    const msg = (err as Error).message;
    reasons.push(`PTR lookup failed: ${msg}`);
    if (/ENOTFOUND|ENODATA|SERVFAIL|EAI_AGAIN|getHostByAddr/i.test(msg)) {
      reasons.push(
        "Note: PTR lookups require a network environment with functioning reverse-DNS. Results will be unreliable in local/sandboxed environments.",
      );
    }
  }

  const claimed = matchSignatureByUa(userAgent);
  if (!claimed) {
    return {
      ip,
      userAgent,
      ptr,
      forwardConfirmed: false,
      identifiedAs: null,
      trustLevel: "unknown",
      reasons: [
        ...reasons,
        "User-Agent did not match any known bot signature",
      ],
    };
  }
  reasons.push(`UA claims to be ${claimed.name}`);

  const suffixes = claimed.verifiedHostnameSuffixes ?? [];
  if (!ptr || suffixes.length === 0) {
    return {
      ip,
      userAgent,
      ptr,
      forwardConfirmed: false,
      identifiedAs: claimed.name,
      trustLevel: ptr ? "unknown" : "spoofed",
      reasons: [
        ...reasons,
        suffixes.length === 0
          ? `${claimed.name} has no documented verification suffix`
          : "No PTR available — cannot verify",
      ],
    };
  }

  const suffixOk = suffixes.some((s) => ptr!.toLowerCase().endsWith(s.toLowerCase()));
  if (!suffixOk) {
    return {
      ip,
      userAgent,
      ptr,
      forwardConfirmed: false,
      identifiedAs: claimed.name,
      trustLevel: "spoofed",
      reasons: [
        ...reasons,
        `PTR suffix not in allowed list: [${suffixes.join(", ")}]`,
      ],
    };
  }
  reasons.push(`PTR suffix matches ${claimed.name}'s documented domain`);

  let forwardOk = false;
  try {
    const addrs = await dns.resolve(ptr);
    forwardOk = addrs.includes(ip);
    reasons.push(
      forwardOk
        ? `Forward lookup of ${ptr} includes ${ip}`
        : `Forward lookup of ${ptr} did NOT include ${ip}`,
    );
  } catch (err) {
    reasons.push(`Forward lookup failed: ${(err as Error).message}`);
  }

  return {
    ip,
    userAgent,
    ptr,
    forwardConfirmed: forwardOk,
    identifiedAs: claimed.name,
    trustLevel: forwardOk ? "verified" : "spoofed",
    reasons,
  };
}

function matchSignatureByUa(ua: string): BotSignature | null {
  for (const bot of KNOWN_BOTS) {
    for (const p of bot.userAgentPatterns) {
      if (typeof p === "string") {
        if (ua.toLowerCase().includes(p.toLowerCase())) return bot;
      } else if (p.test(ua)) {
        return bot;
      }
    }
  }
  return null;
}

/** Best-effort batched verify; ignores per-IP errors. */
export async function verifyMany(
  pairs: { ip: string; userAgent: string }[],
): Promise<VerificationResult[]> {
  const out: VerificationResult[] = [];
  for (const { ip, userAgent } of pairs) {
    try {
      out.push(await verifyBotIdentity(ip, userAgent));
    } catch (err) {
      logger.warn("verifyMany: entry failed", { ip, err: (err as Error).message });
    }
  }
  return out;
}

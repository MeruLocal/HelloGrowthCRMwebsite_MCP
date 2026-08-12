import { describe, expect, it } from "vitest";
import { resolveClientIp } from "../client-ip.js";

const SOCKET = "10.0.0.1";

describe("resolveClientIp", () => {
  it("prefers CF-Connecting-IP over anything the caller sent", () => {
    const ip = resolveClientIp(
      {
        "cf-connecting-ip": "203.0.113.9",
        "x-forwarded-for": "1.2.3.4, 203.0.113.9",
      },
      SOCKET,
      true,
    );
    expect(ip).toBe("203.0.113.9");
  });

  /**
   * The bypass this file exists to close. Cloudflare APPENDS the real client IP
   * to any incoming X-Forwarded-For, so the first entry is whatever the caller
   * sent. Keying the rate limiter on it let an attacker mint a fresh bucket per
   * request just by rotating the header.
   */
  it("ignores a spoofed leading X-Forwarded-For entry", () => {
    const ip = resolveClientIp(
      { "x-forwarded-for": "1.2.3.4, 203.0.113.9" },
      SOCKET,
      true,
    );
    expect(ip).toBe("203.0.113.9");
    expect(ip).not.toBe("1.2.3.4");
  });

  it("gives the same bucket key however the attacker varies the prefix", () => {
    const keys = [
      "9.9.9.9, 203.0.113.9",
      "8.8.8.8, 203.0.113.9",
      "7.7.7.7, 6.6.6.6, 203.0.113.9",
    ].map((xff) => resolveClientIp({ "x-forwarded-for": xff }, SOCKET, true));
    expect(new Set(keys).size).toBe(1);
    expect(keys[0]).toBe("203.0.113.9");
  });

  it("handles a single-hop X-Forwarded-For", () => {
    expect(
      resolveClientIp({ "x-forwarded-for": "203.0.113.9" }, SOCKET, true),
    ).toBe("203.0.113.9");
  });

  it("tolerates whitespace and empty segments", () => {
    expect(
      resolveClientIp({ "x-forwarded-for": " 1.2.3.4 ,  , 203.0.113.9 " }, SOCKET, true),
    ).toBe("203.0.113.9");
  });

  it("accepts a header array, as Node may supply", () => {
    expect(
      resolveClientIp({ "cf-connecting-ip": ["203.0.113.9"] }, SOCKET, true),
    ).toBe("203.0.113.9");
  });

  it("falls back to the socket address when no forwarded header is present", () => {
    expect(resolveClientIp({}, SOCKET, true)).toBe(SOCKET);
  });

  it("ignores forwarded headers entirely when trustProxy is false", () => {
    // The mirror-image vulnerability: trusting forwarded headers with no proxy
    // in front means any client can set its own bucket key.
    const ip = resolveClientIp(
      { "cf-connecting-ip": "203.0.113.9", "x-forwarded-for": "1.2.3.4" },
      SOCKET,
      false,
    );
    expect(ip).toBe(SOCKET);
  });

  it("returns 'unknown' rather than undefined when nothing is available", () => {
    expect(resolveClientIp({}, undefined, true)).toBe("unknown");
  });

  it("does not fall through to the socket when a forwarded header is usable", () => {
    expect(
      resolveClientIp({ "x-forwarded-for": "203.0.113.9" }, SOCKET, true),
    ).not.toBe(SOCKET);
  });
});

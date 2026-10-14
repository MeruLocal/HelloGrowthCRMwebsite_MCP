import { describe, expect, it } from "vitest";

import { parseCidrList } from "../cidr.js";
import { clientIpConfigFromEnv, clientIpMode, resolveClientIp, type ClientIpConfig } from "../client-ip.js";

const LOCAL_PROXY = "127.0.0.1";
const STRANGER = "203.0.113.9";

const proxy = (extra: Partial<ClientIpConfig> = {}): ClientIpConfig => ({
  trustProxy: true,
  trustedProxies: parseCidrList("127.0.0.1/32,::1/128"),
  trustCloudflare: false,
  ...extra,
});

describe("resolveClientIp — defaults (no env)", () => {
  const def = clientIpConfigFromEnv({});

  it("is direct mode", () => {
    expect(clientIpMode(def)).toBe("direct");
  });

  it("ignores CF-Connecting-IP and XFF and uses the socket", () => {
    const ip = resolveClientIp(
      { "cf-connecting-ip": "198.51.100.1", "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
      STRANGER,
      def,
    );
    expect(ip).toBe(STRANGER);
  });

  it("does so even from localhost — trust is opt-in", () => {
    expect(resolveClientIp({ "x-forwarded-for": "5.6.7.8" }, LOCAL_PROXY, def)).toBe(LOCAL_PROXY);
  });
});

describe("resolveClientIp — trusted proxy", () => {
  it("a trusted peer with XFF '1.2.3.4, 5.6.7.8' → 5.6.7.8 (right-most)", () => {
    expect(resolveClientIp({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }, LOCAL_PROXY, proxy())).toBe("5.6.7.8");
  });

  it("an untrusted peer with the same headers → its own address", () => {
    expect(resolveClientIp({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }, STRANGER, proxy())).toBe(STRANGER);
  });

  it("recognises the IPv4-mapped socket address Node reports", () => {
    expect(resolveClientIp({ "x-forwarded-for": "5.6.7.8" }, "::ffff:127.0.0.1", proxy())).toBe("5.6.7.8");
  });

  it("skips hops that are themselves trusted proxies", () => {
    const cfg = proxy({ trustedProxies: parseCidrList("127.0.0.1/32,10.0.0.0/8") });
    expect(resolveClientIp({ "x-forwarded-for": "1.1.1.1, 5.6.7.8, 10.1.1.1" }, LOCAL_PROXY, cfg)).toBe("5.6.7.8");
  });

  it("gives the same key however the caller varies the left of the header", () => {
    const keys = ["9.9.9.9, 5.6.7.8", "8.8.8.8, 5.6.7.8", "7.7.7.7, 6.6.6.6, 5.6.7.8"].map((x) =>
      resolveClientIp({ "x-forwarded-for": x }, LOCAL_PROXY, proxy()),
    );
    expect(new Set(keys)).toEqual(new Set(["5.6.7.8"]));
  });

  it("falls back to the socket when no forwarded header is usable", () => {
    expect(resolveClientIp({}, LOCAL_PROXY, proxy())).toBe(LOCAL_PROXY);
    expect(resolveClientIp({ "x-forwarded-for": "127.0.0.1" }, LOCAL_PROXY, proxy())).toBe(LOCAL_PROXY);
  });
});

describe("resolveClientIp — Cloudflare", () => {
  it("CF-Connecting-IP is ignored without TRUST_CLOUDFLARE", () => {
    expect(resolveClientIp({ "cf-connecting-ip": "198.51.100.1" }, LOCAL_PROXY, proxy())).toBe(LOCAL_PROXY);
  });

  it("CF-Connecting-IP is honoured with TRUST_CLOUDFLARE and a trusted peer", () => {
    const cfg = proxy({ trustCloudflare: true });
    expect(clientIpMode(cfg)).toBe("proxy+cloudflare");
    expect(resolveClientIp({ "cf-connecting-ip": ["198.51.100.1"] }, LOCAL_PROXY, cfg)).toBe("198.51.100.1");
  });

  it("CF-Connecting-IP from an untrusted peer is ignored even with TRUST_CLOUDFLARE", () => {
    const cfg = proxy({ trustCloudflare: true });
    expect(resolveClientIp({ "cf-connecting-ip": "198.51.100.1" }, STRANGER, cfg)).toBe(STRANGER);
  });
});

describe("resolveClientIp — env parsing", () => {
  it("reads the three settings", () => {
    const cfg = clientIpConfigFromEnv({
      TRUST_PROXY_HEADERS: "true",
      TRUSTED_PROXY_CIDRS: "10.0.0.0/8",
      TRUST_CLOUDFLARE: "1",
    });
    expect(cfg.trustProxy).toBe(true);
    expect(cfg.trustCloudflare).toBe(true);
    expect(resolveClientIp({ "x-forwarded-for": "5.6.7.8" }, "10.2.3.4", cfg)).toBe("5.6.7.8");
    expect(resolveClientIp({ "x-forwarded-for": "5.6.7.8" }, LOCAL_PROXY, cfg)).toBe(LOCAL_PROXY);
  });

  it("returns 'unknown' when there is no socket address", () => {
    expect(resolveClientIp({}, undefined, proxy())).toBe("unknown");
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MemoryRateLimitStore,
  UpstashRateLimitStore,
  createRateLimitStore,
} from "../rate-limit-store.js";

const WINDOW = 60_000;
const MAX = 3;

describe("MemoryRateLimitStore", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("allows up to the limit and rejects beyond it", async () => {
    const store = new MemoryRateLimitStore();
    for (let i = 0; i < MAX; i++) {
      expect(await store.hit("1.2.3.4", WINDOW, MAX)).toBe(true);
    }
    expect(await store.hit("1.2.3.4", WINDOW, MAX)).toBe(false);
  });

  it("tracks keys independently", async () => {
    const store = new MemoryRateLimitStore();
    for (let i = 0; i < MAX + 1; i++) await store.hit("a", WINDOW, MAX);
    expect(await store.hit("b", WINDOW, MAX)).toBe(true);
  });

  it("frees the bucket after the window slides past", async () => {
    const store = new MemoryRateLimitStore();
    for (let i = 0; i < MAX + 1; i++) await store.hit("a", WINDOW, MAX);
    expect(await store.hit("a", WINDOW, MAX)).toBe(false);
    vi.advanceTimersByTime(WINDOW + 1);
    expect(await store.hit("a", WINDOW, MAX)).toBe(true);
  });
});

describe("UpstashRateLimitStore", () => {
  const url = "https://fake.upstash.io";
  const token = "tok";

  afterEach(() => vi.unstubAllGlobals());

  function stubPipeline(incrResult: number): ReturnType<typeof vi.fn> {
    const mock = vi.fn(async () => ({
      ok: true,
      json: async () => [{ result: incrResult }, { result: 1 }],
    }));
    vi.stubGlobal("fetch", mock);
    return mock;
  }

  it("allows when the shared counter is within the limit", async () => {
    const mock = stubPipeline(MAX);
    const store = new UpstashRateLimitStore(url, token);
    expect(await store.hit("1.2.3.4", WINDOW, MAX)).toBe(true);
    expect(mock).toHaveBeenCalledOnce();
    const [calledUrl, init] = mock.mock.calls[0] as unknown as [string, RequestInit];
    expect(calledUrl).toBe(`${url}/pipeline`);
    const body = JSON.parse(init.body as string);
    expect(body[0][0]).toBe("INCR");
    expect(body[1][0]).toBe("PEXPIRE");
  });

  it("rejects when the shared counter exceeds the limit", async () => {
    stubPipeline(MAX + 1);
    const store = new UpstashRateLimitStore(url, token);
    expect(await store.hit("1.2.3.4", WINDOW, MAX)).toBe(false);
  });

  it("falls back to the local store when Redis is unreachable — local limiting, not unlimited", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("connect ECONNREFUSED");
    }));
    const store = new UpstashRateLimitStore(url, token);
    for (let i = 0; i < MAX; i++) {
      expect(await store.hit("1.2.3.4", WINDOW, MAX)).toBe(true);
    }
    // The in-memory fallback still enforces the limit.
    expect(await store.hit("1.2.3.4", WINDOW, MAX)).toBe(false);
  });

  it("treats a malformed Redis response as an error, not an allow", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => [{ error: "WRONGTYPE" }],
    })));
    const store = new UpstashRateLimitStore(url, token);
    // Falls back to memory: first hit allowed there.
    expect(await store.hit("k", WINDOW, MAX)).toBe(true);
  });

  it("encodes hostile keys so they cannot inject command segments", async () => {
    const mock = stubPipeline(1);
    const store = new UpstashRateLimitStore(url, token);
    await store.hit("evil/../key with spaces", WINDOW, MAX);
    const body = JSON.parse(
      (mock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string,
    );
    const redisKey: string = body[0][1];
    expect(redisKey).not.toContain(" ");
    expect(redisKey).not.toContain("/");
  });
});

describe("createRateLimitStore", () => {
  it("uses memory when Upstash env vars are absent", () => {
    expect(createRateLimitStore({} as NodeJS.ProcessEnv)).toBeInstanceOf(
      MemoryRateLimitStore,
    );
  });

  it("uses Upstash when both env vars are present", () => {
    const store = createRateLimitStore({
      UPSTASH_REDIS_REST_URL: "https://x.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "t",
    } as NodeJS.ProcessEnv);
    expect(store).toBeInstanceOf(UpstashRateLimitStore);
  });

  it("ignores a URL without a token (misconfiguration must not half-enable)", () => {
    const store = createRateLimitStore({
      UPSTASH_REDIS_REST_URL: "https://x.upstash.io",
    } as NodeJS.ProcessEnv);
    expect(store).toBeInstanceOf(MemoryRateLimitStore);
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";

// The bug this guards: a failed Supabase count returns { count: null, error },
// and `count ?? 0` reported it as a confident zero. An AI client cannot tell a
// fabricated "0 confirmed subscribers" from a real one, and will repeat it.
const counts = vi.hoisted(() => ({
  all: { count: 3, error: null as unknown },
  byStatus: { count: null as number | null, error: null as unknown },
}));

vi.mock("../../lib/supabase.js", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        // unfiltered count — resolves directly
        then: (r: (v: unknown) => unknown) => Promise.resolve(counts.all).then(r),
        eq: () => Promise.resolve(counts.byStatus),
      }),
    }),
  }),
}));

const { newsletterGetStats } = await import("../newsletter.js");

async function call() {
  return (await newsletterGetStats.handle({} as never)) as {
    isError?: boolean;
    content: { type: string; text: string }[];
  };
}

describe("newsletter_get_stats", () => {
  beforeEach(() => {
    counts.all = { count: 3, error: null };
    counts.byStatus = { count: null, error: null };
  });

  it("never reports a failed count as zero", async () => {
    counts.byStatus = { count: null, error: { message: "column newsletter_subscribers.status does not exist" } };
    const payload = JSON.parse((await call()).content[0].text);
    expect(payload.confirmed).toBeNull();
    expect(payload.confirmed).not.toBe(0);
    expect(payload.partial).toBe(true);
    expect(payload.unavailable).toEqual(["confirmed", "pending", "unsubscribed"]);
  });

  it("keeps the total that succeeded instead of failing the whole call", async () => {
    counts.byStatus = { count: null, error: { message: "boom" } };
    const payload = JSON.parse((await call()).content[0].text);
    expect(payload.total).toBe(3);
  });

  it("never leaks the Postgres error text to the caller", async () => {
    counts.byStatus = { count: null, error: { message: "column newsletter_subscribers.status does not exist" } };
    const text = (await call()).content[0].text;
    expect(text).not.toContain("does not exist");
    expect(text).not.toContain("newsletter_subscribers.status");
  });

  it("fails outright only when even the unfiltered total failed", async () => {
    counts.all = { count: null, error: { message: "relation does not exist" } };
    const res = await call();
    expect(res.isError).toBe(true);
    expect(res.content[0].text).not.toContain("relation does not exist");
  });

  it("returns plain counts with no partial marker when everything succeeds", async () => {
    counts.byStatus = { count: 1, error: null };
    const payload = JSON.parse((await call()).content[0].text);
    expect(payload).toMatchObject({ total: 3, confirmed: 1, pending: 1, unsubscribed: 1 });
    expect(payload.partial).toBeUndefined();
  });
});

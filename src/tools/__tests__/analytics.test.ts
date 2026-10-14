import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  all: { count: 42 as number | null, error: null as unknown },
  recent: { count: 5 as number | null, error: null as unknown },
  selected: [] as string[],
}));

vi.mock("../../lib/supabase.js", () => ({
  getSupabase: () => ({
    from: () => ({
      select: (cols: string) => {
        state.selected.push(cols);
        return {
          eq: () => {
            const p = Promise.resolve(state.all) as Promise<unknown> & { gte?: unknown };
            p.gte = () => Promise.resolve(state.recent);
            return p;
          },
        };
      },
    }),
  }),
}));

const { analyticsSocialProof } = await import("../analytics.js");

async function call() {
  return analyticsSocialProof.handle(analyticsSocialProof.schema.parse({ limit: 10 }));
}

describe("analytics_social_proof", () => {
  beforeEach(() => {
    state.all = { count: 42, error: null };
    state.recent = { count: 5, error: null };
    state.selected = [];
  });

  it("returns counts only — no emails or per-person data", async () => {
    const res = await call();
    const text = res.content[0]!.text;
    expect(text).not.toContain("@");
    const payload = JSON.parse(text);
    expect(payload).toMatchObject({ confirmed_subscribers: 42, new_last_30_days: 5 });
    expect(Object.keys(payload)).not.toContain("email");
    expect(Object.keys(payload)).not.toContain("signups");
    expect(state.selected.every((c) => !c.includes("email"))).toBe(true);
  });

  it("a count error is an error, never a 0, and does not leak the DB message", async () => {
    state.all = { count: null, error: { message: 'relation "newsletter_subscribers" does not exist' } };
    const res = await call();
    expect(res.isError).toBe(true);
    expect(res.content[0]!.text).not.toMatch(/relation|does not exist|\b0\b/);
  });
});

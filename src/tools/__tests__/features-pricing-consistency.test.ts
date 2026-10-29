import { describe, expect, it } from "vitest";
import { featuresGet } from "../features.js";
import { pricingGetPlans } from "../pricing.js";

type Handler = { handle: (a: unknown) => Promise<{ content: { text: string }[]; isError?: boolean }> };

async function json(tool: Handler, args: unknown = {}) {
  const res = await tool.handle(args);
  expect(res.isError).toBeFalsy();
  return JSON.parse(res.content[0]!.text) as Record<string, any>;
}

describe("features_get and pricing_get_plans agree on Free-plan limits", () => {
  it("task-boards Free allowance equals the Free plan's task cap", async () => {
    const feature = await json(featuresGet, { slug: "task-boards" });
    const plans = await json(pricingGetPlans, { region: "global" });
    const free = (plans.global_usd.plans as { slug: string; limits: { tasks: number } }[]).find((p) => p.slug === "free");
    expect(free).toBeDefined();
    const served = JSON.stringify(feature);
    expect(served).toContain(`${free!.limits.tasks} tasks`);
    expect(served).not.toContain("500 tasks");
  });
});

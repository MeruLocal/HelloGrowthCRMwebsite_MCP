import { describe, expect, it } from "vitest";
import { MARKET_SCOPE, pricingGetCountryPlans, pricingGetPlans } from "../pricing.js";

type Handler = { handle: (a: unknown) => Promise<{ content: { text: string }[]; isError?: boolean }> };

async function json(tool: Handler, args: unknown) {
  const res = await tool.handle(args);
  expect(res.isError).toBeFalsy();
  return JSON.parse(res.content[0]!.text) as Record<string, any>;
}

describe("pricing is country-aware, not India-only or US-only", () => {
  it("pricing_get_plans returns market_scope with the India and outside-India rates", async () => {
    const out = await json(pricingGetPlans, { region: "both" });
    expect(out.market_scope).toEqual(MARKET_SCOPE);
    expect(out.market_scope.outside_india).toMatch(/USD 12 per user per month/);
    expect(out.market_scope.india).toMatch(/INR 899/);
    expect(out.market_scope.yearly_discount).toMatch(/Yearly billing is discounted/);
  });

  it("the global USD ladder is not labelled as US-only", async () => {
    const out = await json(pricingGetPlans, { region: "global" });
    const text = JSON.stringify(out.global_usd);
    expect(text).not.toMatch(/Growing US sales teams/);
    expect(text).not.toMatch(/Large US enterprises/);
    expect(text).toMatch(/outside India/);
  });

  it("the global Growth monthly price is USD 12", async () => {
    const out = await json(pricingGetPlans, { region: "global", plan: "growth" });
    expect(out.global_usd.plans[0].price_monthly).toBe("$12/user/month");
  });

  it("pricing_get_country_plans covers the 8 market hubs", async () => {
    const out = await json(pricingGetCountryPlans, {});
    expect(out.count).toBe(8);
    const slugs = (out.country_pricing as { countrySlug: string }[]).map((c) => c.countrySlug).sort();
    expect(slugs).toEqual(["au", "canada", "in", "new-zealand", "singapore", "uae", "uk", "usa"]);
  });
});

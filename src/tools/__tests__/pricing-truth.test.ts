import { describe, expect, it } from "vitest";
import {
  pricingGetPlans,
  pricingGetAddons,
  pricingGetFaq,
  pricingComparePlans,
  pricingGetCountryPlans,
  pricingGetManagedRevOps,
} from "../pricing.js";

/**
 * Pricing truth (MCP issue #40), stacked on #50. Billing truth: hellocrm
 * `src/components/superadmin/billing/gstPlanSync.ts`: India Growth is
 * ₹899/user/month + 18% GST (annual ₹8,990 + GST). ₹1,099 matches no
 * billed amount and no Razorpay plan, and Growth is priced per user —
 * so no response may say "₹1,099" or "Unlimited users".
 */

type Tool = { handle: (a: never) => Promise<{ content: { text: string }[]; isError?: boolean }> };

async function text(tool: Tool, args: unknown): Promise<string> {
  const res = await tool.handle(args as never);
  expect(res.isError).toBeFalsy();
  return res.content.map((c) => c.text).join("\n");
}

const CALLS: [string, Tool, unknown][] = [
  ["pricing_get_plans both", pricingGetPlans, { region: "both" }],
  ["pricing_get_plans india", pricingGetPlans, { region: "india" }],
  ["pricing_get_plans global", pricingGetPlans, { region: "global" }],
  ["pricing_get_addons both/all", pricingGetAddons, { region: "both", type: "all" }],
  ["pricing_get_faq", pricingGetFaq, {}],
  ["pricing_compare_plans india", pricingComparePlans, { plan_a: "free", plan_b: "growth", region: "india" }],
  ["pricing_compare_plans global", pricingComparePlans, { plan_a: "free", plan_b: "growth", region: "global" }],
  ["pricing_get_country_plans all", pricingGetCountryPlans, {}],
  ["pricing_get_managed_revops all", pricingGetManagedRevOps, {}],
];

const FORBIDDEN = [/1,099/, /\b1099\b/, /unlimited users/i];

describe("pricing truth — no response carries a price that matches nothing billed", () => {
  for (const [label, tool, args] of CALLS) {
    it(`${label}: no ₹1,099 and no "Unlimited users"`, async () => {
      const out = await text(tool, args);
      for (const re of FORBIDDEN) expect(out).not.toMatch(re);
    });
  }

  it("India Growth states ₹899 and GST, monthly and annual", async () => {
    const json = JSON.parse(await text(pricingGetPlans, { region: "india", plan: "growth" }));
    const growth = json.india_inr.plans[0];
    expect(growth.price_monthly).toBe("₹899/user/month + 18% GST (same rate; annual adds 2 months free)");
    expect(growth.price_annual).toBe(
      "₹899/user/month + 18% GST (annual — 10 months paid, 2 months free = ₹8,990/user/year + GST)",
    );
  });

  it("USD Growth matches website pricing-constants.ts ($10 annual, $12 monthly)", async () => {
    const json = JSON.parse(await text(pricingGetPlans, { region: "global", plan: "growth" }));
    const growth = json.global_usd.plans[0];
    expect(growth.price_annual).toBe("$10/user/month (billed annually)");
    expect(growth.price_monthly).toBe("$12/user/month");
  });

  it("country hub prices match billing and the website; other markets unchanged", async () => {
    const json = JSON.parse(await text(pricingGetCountryPlans, {}));
    const bySlug = Object.fromEntries(
      (json.country_pricing as { countrySlug: string; growthPriceShort: string; growthPriceMonthly: string }[]).map(
        (r) => [r.countrySlug, [r.growthPriceShort, r.growthPriceMonthly]],
      ),
    );
    expect(bySlug.in).toEqual(["₹899/user/mo + GST", "₹899/user/mo + 18% GST billed monthly"]);
    // USD per website src/lib/pricing-constants.ts; every other market is a pre-edit snapshot.
    expect(bySlug.usa).toEqual(["$10/user/mo", "$12/user/mo monthly"]);
    expect(bySlug.uk).toEqual(["£8/user/mo", "£10/user/mo monthly"]);
    expect(bySlug.au).toEqual(["A$16/user/mo", "A$20/user/mo monthly"]);
    expect(bySlug.canada).toEqual(["C$14/user/mo", "C$18/user/mo monthly"]);
    expect(bySlug.uae).toEqual(["AED 37/user/mo", "AED 48/user/mo monthly"]);
    expect(bySlug.singapore).toEqual(["S$14/user/mo", "S$18/user/mo monthly"]);
    expect(bySlug["new-zealand"]).toEqual(["NZ$17/user/mo", "NZ$22/user/mo monthly"]);
  });

  it("unknown country falls back to the documented not-found message", async () => {
    const json = JSON.parse(await text(pricingGetCountryPlans, { country: "xx" }));
    expect(json.error).toMatch(/^Country "xx" not found\. Available: /);
  });
});

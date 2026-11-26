import { describe, expect, it } from "vitest";
import { FREE_PLAN, GROWTH_PLAN } from "../../data/plan-truth.js";
import { pricingGetPlans, pricingGetFaq, pricingComparePlans, pricingGetAddons, pricingGetCountryPlans } from "../pricing.js";
import { faqsGetSite } from "../faqs.js";
import { featuresList, featuresGet } from "../features.js";
import { switchGetGuide, switchListCompetitors } from "../alternatives.js";
import { countryGet } from "../countries.js";

/**
 * Plan truth (live MCP audit 2026-11-19). The Free-plan rebalance (hellocrm
 * PLAN-HGC-0652, #9852) is live on PROD: Free = 500 leads, 1 task board,
 * 1 booking page, 1 landing page, 30-day analytics, 20 accounts, 100 tasks.
 * Enforced AI allowance: Free 100, Growth 1,000 credits per user per month.
 * The ladder is Free / Growth / Enterprise.
 *
 * Every figure the server used to serve for these — 200 leads, 150 leads,
 * "200 contacts", "500 tasks", unlimited boards on Free, 2,500 / 10,000 /
 * "50 total" AI credits, Starter / Growth Engine / RevOps Partner as plan
 * columns — is asserted absent from every tool that carried it.
 */

type Tool = { handle: (a: never) => Promise<{ content: { text: string }[]; isError?: boolean }> };
async function text(tool: Tool, args: unknown): Promise<string> {
  const res = await tool.handle(args as never);
  expect(res.isError).toBeFalsy();
  return res.content.map((c) => c.text).join("\n");
}

const STALE_FREE = [
  /\b(150|200) (leads|contacts)/i,
  /500 tasks/i,
  /unlimited boards, pipelines, and automation/i,
  /(?<!₹)2,500 (AI credits|per user)/i,
  /(?<!₹)10,000 (AI credits|per user)/i,
  /"50 total"/,
  /5 uses\/month/,
];

describe("plan truth — one Free plan, one AI allowance, one ladder", () => {
  it("the constant matches the post-#9852 Free plan", () => {
    expect(FREE_PLAN).toMatchObject({
      leads: 500, accounts: 20, tasks: 100, taskBoards: 1, bookingPages: 1, landingPages: 1,
      analyticsWindowDays: 30, aiCreditsPerUserPerMonth: 100,
    });
    expect(GROWTH_PLAN.aiCreditsPerUserPerMonth).toBe(1000);
  });

  it("pricing_get_plans builds Free from the constant in both regions", async () => {
    const json = JSON.parse(await text(pricingGetPlans, { region: "both", plan: "free" }));
    for (const plan of [json.global_usd.plans[0], json.india_inr.plans[0]]) {
      expect(plan.limits).toMatchObject({ leads: 500, accounts: 20, tasks: 100, task_boards: 1, booking_pages: 1, landing_pages: 1, analytics_window_days: 30 });
      expect(plan.ai_credits).toBe("100 per user/month");
    }
  });

  it("Growth states 1,000 AI credits; Enterprise states no unverified figure", async () => {
    const json = JSON.parse(await text(pricingGetPlans, { region: "both" }));
    for (const region of [json.global_usd, json.india_inr]) {
      const growth = region.plans.find((p: { slug: string }) => p.slug === "growth");
      const ent = region.plans.find((p: { slug: string }) => p.slug === "enterprise");
      expect(growth.ai_credits).toBe("1,000 per user/month");
      expect(ent.ai_credits).toBe("Set per contract");
    }
  });

  const SURFACES: [string, Tool, unknown][] = [
    ["pricing_get_plans", pricingGetPlans, { region: "both" }],
    ["pricing_get_faq", pricingGetFaq, {}],
    ["pricing_compare_plans", pricingComparePlans, { plan_a: "free", plan_b: "growth", region: "india" }],
    ["pricing_get_addons", pricingGetAddons, { region: "both", type: "all" }],
    ["faqs_get_site", faqsGetSite, {}],
    ["features_list", featuresList, {}],
  ];
  for (const [label, tool, args] of SURFACES) {
    it(`${label}: no stale Free-plan cap or AI figure`, async () => {
      const out = await text(tool, args);
      for (const re of STALE_FREE) expect(out, String(re)).not.toMatch(re);
    });
  }

  it("every switch guide's Free-plan row quotes the current cap", async () => {
    const list = JSON.parse(await text(switchListCompetitors, {}));
    const slugs: string[] = list.switch_pages.filter((g: { has_guide_data: boolean }) => g.has_guide_data).map((g: { slug: string }) => g.slug);
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      const res = await switchGetGuide.handle({ slug } as never);
      if (res.isError) continue;
      const out = res.content.map((c) => c.text).join("\n");
      for (const re of STALE_FREE) expect(out, `${slug} ${re}`).not.toMatch(re);
    }
  });

  it("Trello guide no longer promises unlimited boards on Free", async () => {
    const out = await text(switchGetGuide, { slug: "trello" });
    expect(out).toMatch(/1 task board/);
    expect(out).not.toMatch(/free plan has unlimited boards/i);
  });

  it("features are keyed Free / Growth / Enterprise — no retired tier names", async () => {
    const json = JSON.parse(await text(featuresList, {}));
    for (const f of json.features) {
      expect(Object.keys(f.availability).sort()).toEqual(["enterprise", "free", "growth"]);
    }
    expect(JSON.stringify(json.coverage)).toMatch(/Free \/ Growth \/ Enterprise/);
    const tb = JSON.parse(await text(featuresGet, { slug: "task-boards" }));
    expect(tb.availability.free).toBe("1 board, 100 tasks");
    const sched = JSON.parse(await text(featuresGet, { slug: "scheduling-booking" }));
    expect(sched.availability.free).toBe("1 booking page");
    const lp = JSON.parse(await text(featuresGet, { slug: "landing-pages" }));
    expect(lp.availability.free).toBe("1 landing page");
  });

  it("legacy t1 filter still works and maps to growth", async () => {
    const a = JSON.parse(await text(featuresList, { plan: "t1" }));
    const b = JSON.parse(await text(featuresList, { plan: "growth" }));
    expect(a.total).toBe(b.total);
  });

  it("India country profile states ₹899 + 18% GST and never GSTIN-conditional", async () => {
    const out = await text(countryGet, { code: "in" });
    expect(out).toMatch(/18% GST/);
    expect(out).not.toMatch(/GSTIN[- ]conditional|1,099/i);
    const cp = await text(pricingGetCountryPlans, { country: "in" });
    expect(cp).not.toMatch(/GSTIN[- ]conditional|1,099/i);
  });
});

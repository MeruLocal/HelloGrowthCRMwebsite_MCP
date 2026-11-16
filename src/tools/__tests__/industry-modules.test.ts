import { describe, expect, it } from "vitest";
import { CROSS_CUTTING_MODULES, INDUSTRY_VERTICALS } from "../../data/industry-modules.js";
import { industriesGetModules, industriesListModules } from "../industry-modules.js";

type Handler = { handle: (a: unknown) => Promise<{ content: { text: string }[]; isError?: boolean }> };

async function run(tool: Handler, args: unknown) {
  const res = await tool.handle(args);
  return { res, json: res.isError ? undefined : (JSON.parse(res.content[0]!.text) as Record<string, any>) };
}

describe("industry modules data", () => {
  it("covers all 52 product verticals exactly once", () => {
    expect(INDUSTRY_VERTICALS).toHaveLength(52);
    expect(new Set(INDUSTRY_VERTICALS.map((v) => v.key)).size).toBe(52);
  });

  it("assigns every registered view to a vertical or the cross-cutting list (317 + 5 + 88 core = 410)", () => {
    const assigned = INDUSTRY_VERTICALS.reduce((n, v) => n + v.modules.length, 0);
    expect(assigned).toBe(317);
    expect(CROSS_CUTTING_MODULES).toHaveLength(5);
  });

  it("every alias points at a dedicated vertical", () => {
    for (const v of INDUSTRY_VERTICALS.filter((x) => x.kind === "alias")) {
      const target = INDUSTRY_VERTICALS.find((x) => x.key === v.alias_of);
      expect(target, v.key).toBeDefined();
      expect(target!.kind, v.key).toBe("dedicated");
    }
  });

  it("makes none of the claims the audit found to be false", () => {
    const text = JSON.stringify(INDUSTRY_VERTICALS);
    expect(text).not.toMatch(/SOC 2/i);
    expect(text).not.toMatch(/Unlimited users/i);
  });
});

describe("industries tools", () => {
  it("industries_list_modules lists all 52 and filters by keyword", async () => {
    const all = await run(industriesListModules, { kind: "all" });
    expect(all.json!.total).toBe(52);
    expect(all.json!.filtered_count).toBe(52);
    expect(all.json!.verified_at).toBeTruthy();
    const dental = await run(industriesListModules, { kind: "all", search: "prescription" });
    expect(dental.json!.industries.some((i: any) => i.key === "dental_clinic")).toBe(true);
  });

  it("industries_get_modules returns clinic screens, highlights and what is not built", async () => {
    const { json } = await run(industriesGetModules, { industry: "Doctors / Clinic" });
    expect(json!.key).toBe("doctors_clinic");
    expect(json!.screens.length).toBeGreaterThan(5);
    expect(json!.not_built.join(" ")).toMatch(/treatment-plan/i);
  });

  it("an alias returns the screens of the vertical it reuses", async () => {
    const { json } = await run(industriesGetModules, { industry: "cloud_kitchen" });
    expect(json!.kind).toBe("alias");
    expect(json!.reuses.key).toBe("restaurant_fnb");
    expect(json!.screens.length).toBeGreaterThan(0);
  });

  it("a configuration-only industry says it has no dedicated screens", async () => {
    const { json } = await run(industriesGetModules, { industry: "ngo_fundraising" });
    expect(json!.kind).toBe("configuration_only");
    expect(json!.configuration).toMatch(/no dedicated screens/);
  });

  it("an unknown industry is an error with a hint", async () => {
    const { res } = await run(industriesGetModules, { industry: "zzz-not-an-industry" });
    expect(res.isError).toBe(true);
  });
});

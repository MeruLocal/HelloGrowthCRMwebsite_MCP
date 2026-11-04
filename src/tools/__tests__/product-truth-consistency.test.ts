import { type ChildProcess, spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PRODUCT_TRUTH_PIN } from "../../data/product-truth.js";
import { productTruth } from "../../lib/product-truth.js";
import { pricingGetPlans } from "../pricing.js";
import { switchGetGuide } from "../alternatives.js";
import { faqsGetSite } from "../faqs.js";
import { featuresGet } from "../features.js";

/**
 * Cross-surface consistency harness (PLAN-HELLOG-0011). Each migration PR adds its tool to
 * MIGRATED. PR-A migrated none; PR-B migrates every tool that stated a Free-plan limit, so each
 * must state exactly the registry value. Also proves /health reports the pin.
 */
type Handler = { handle: (a: never) => Promise<{ content: { text: string }[]; structuredContent?: any; isError?: boolean }> };
interface Surface { name: string; tool: Handler; args: unknown; /** every (plan, key, number) the tool's text must state */ states: [string, string, number][] }

const MIGRATED: Surface[] = [
  { name: "pricing_get_plans", tool: pricingGetPlans, args: { region: "global", plan: "free" }, states: [["free", "leads", 150], ["free", "tasks", 100], ["free", "accounts", 20], ["free", "email_templates", 2], ["free", "custom_fields", 3]] },
  { name: "faqs_get_site", tool: faqsGetSite, args: { search: "really free" }, states: [["free", "leads", 150]] },
  { name: "switch_get_guide", tool: switchGetGuide, args: { slug: "leadsquared" }, states: [["free", "leads", 150]] },
  { name: "features_get", tool: featuresGet, args: { slug: "task-boards" }, states: [["free", "tasks", 100]] },
];
// buyer_find_answer_pages and alternatives_get carry no plan limit in their responses (verified by the guard sweep), so they need no entry.
const NOW = Date.parse(PRODUCT_TRUTH_PIN.generated_at) + 3600_000;

describe("harness over the migrated tool set", () => {
  it("every migrated surface states exactly the registry value", async () => {
    for (const s of MIGRATED) {
      const text = (await s.tool.handle(s.args as never)).content.map((c) => c.text).join("\n");
      for (const [plan, key, n] of s.states) {
        const r = productTruth.limit(plan, key, NOW);
        expect(r.status === "served" && r.value).toBe(n);
        expect(text).toContain(String(n));
      }
    }
    expect(MIGRATED.length).toBeGreaterThanOrEqual(4);
  });
});

describe("cross-surface: Free leads", () => {
  it("the registry value is 150 (founder rule)", () => {
    expect(productTruth.limit("free", "leads", NOW)).toMatchObject({ status: "served", value: 150 });
  });
  it("the MCP's pricing_get_plans Free leads equals the registry value", async () => {
    const reg = productTruth.limit("free", "leads", NOW);
    const res = await pricingGetPlans.handle({ region: "global", plan: "free" } as never);
    expect(res.isError).toBeFalsy();
    const free = (res.structuredContent ?? JSON.parse(res.content[0]!.text)).global_usd.plans.find((p: any) => p.slug === "free");
    expect(reg.status === "served" && reg.value).toBe(150);
    expect(free.limits.leads).toBe(reg.status === "served" ? reg.value : -1);
    expect(free.limits.accounts).toBe(productTruth.limit("free", "accounts", NOW).status === "served" ? (productTruth.limit("free", "accounts", NOW) as any).value : -1);
    expect(free.limits.tasks).toBe((productTruth.limit("free", "tasks", NOW) as any).value);
  });
});

const repo = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const PORT = 39000 + Math.floor(Math.random() * 900);
let child: ChildProcess;
beforeAll(async () => {
  child = spawn(join(repo, "node_modules/.bin/tsx"), ["src/index.ts"], {
    cwd: repo, env: { ...process.env, TRANSPORT: "http", PORT: String(PORT), MCP_DISABLE_LIVE_YOUTUBE: "true" }, stdio: "ignore",
  });
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(`http://127.0.0.1:${PORT}/health`)).status < 500) return; } catch { /* not up */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server did not start");
}, 30_000);
afterAll(() => { child?.kill("SIGKILL"); });

describe("/health over the deployed HTTP path", () => {
  it("reports the pin, sends no-store, and keeps liveness at 200", async () => {
    const res = await fetch(`http://127.0.0.1:${PORT}/health`);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body: any = await res.json();
    expect(body.product_truth).toMatchObject({ truth_version: PRODUCT_TRUTH_PIN.truth_version, integrity_ok: true });
    expect(typeof body.product_truth.days_remaining).toBe("number");
    expect(["ok", "degraded"]).toContain(body.status);
    if (body.product_truth.alert) expect(body.status).toBe("degraded");
  });
});

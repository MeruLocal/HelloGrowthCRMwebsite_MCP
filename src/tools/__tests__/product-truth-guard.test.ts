import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PRODUCT_TRUTH_PIN } from "../../data/product-truth.js";
import { PROMPTS } from "../../prompts.js";
import { WITHHELD_PROSE, productTruth } from "../../lib/product-truth.js";
import { malformedTokens, renderTruth, tokenIds } from "../../lib/truth-template.js";
import { tools, toolsByName } from "../index.js";

/**
 * GUARD (PLAN-HELLOG-0011 PR-B, AC-B2 / AC-B3 / AC-B6): no MCP response may carry a plan or limit
 * literal that disagrees with the pinned Product Truth snapshot, and no hand-typed limit may come
 * back. The scan runs over the FINAL response text (structured output and prose), not over source,
 * so a value assembled in prose is still seen. It complements `npm run check:truth` (source ratchet).
 */

const repo = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const NOW = Date.parse(PRODUCT_TRUTH_PIN.generated_at) + 3600_000;

/** noun in prose -> PT-A limit key */
const NOUNS: [RegExp, string][] = [
  [/leads?|contacts?/, "leads"],
  [/tasks?/, "tasks"],
  [/accounts?/, "accounts"],
  [/(?:basic )?email templates?/, "email_templates"],
  [/landing pages?/, "landing_pages"],
  [/custom fields?/, "custom_fields"],
  [/csv rows?/, "csv_rows"],
];

export interface Mismatch { key: string; stated: string; registry: string; context: string }

/**
 * Find every "<number> <limit noun>" stated in a free-plan context and compare it with the registry.
 * A container (array/object) is in a free-plan context when its direct string children mention
 * "free" (or whose own key is "free", as in availability: {free: "100 tasks"}), so a feature row ["Free plan", "Yes - 200 leads", ...] is judged against Free leads.
 */
export function findLimitMismatches(payload: unknown, nowMs = NOW): Mismatch[] {
  const out: Mismatch[] = [];
  const visit = (node: unknown) => {
    if (Array.isArray(node) || (node && typeof node === "object")) {
      const kids = Object.values(node as object);
      const strings = kids.filter((k): k is string => typeof k === "string");
      const joined = [...strings, ...(Array.isArray(node) ? [] : Object.keys(node as object))].join(" \n ");
      if (/\bfree\b/i.test(joined)) {
        for (const s of strings) {
          for (const [noun, key] of NOUNS) {
            for (const m of s.matchAll(new RegExp(`(?<![\\w.$₹])(\\d[\\d,]*)(\\+?)\\s+(?:${noun.source})\\b`, "gi"))) {
              const stated = m[1]!.replace(/,/g, "");
              const reg = productTruth.limit("free", key, nowMs);
              const want = reg.status === "served" ? String(reg.value) : "(withheld)";
              if (stated !== want) out.push({ key, stated, registry: want, context: s.slice(Math.max(0, m.index! - 30), m.index! + 60) });
            }
          }
        }
      }
      for (const k of kids) visit(k);
    }
  };
  visit(payload);
  return out;
}

type Res = { content: { text: string }[]; structuredContent?: unknown; isError?: boolean };
const run = async (name: string, args: unknown = {}): Promise<Res> => toolsByName.get(name)!.handle(args as never) as Promise<Res>;
const payloadOf = (r: Res): unknown => {
  if (r.structuredContent) return r.structuredContent;
  const t = r.content[0]!.text;
  try { return JSON.parse(t); } catch { return [t]; } // fail() and markdown payloads are plain text
};

/** Every closed-world read-only tool that takes no required argument, plus fixtures for the ones that do. */
async function responses(): Promise<{ label: string; payload: unknown }[]> {
  const out: { label: string; payload: unknown }[] = [];
  for (const t of tools) {
    const a = t.definition.annotations;
    if (!a?.readOnlyHint || a.openWorldHint || !t.schema.safeParse({}).success) continue;
    if (t.definition.name === "generate_robots_txt") continue; // needs policy input
    const r = (await t.handle({} as never)) as Res;
    out.push({ label: t.definition.name, payload: payloadOf(r) });
  }
  const slugs = async (list: string, pick: (j: any) => string[]) => pick(payloadOf(await run(list)));
  for (const plan of ["free", "growth", "enterprise"]) for (const region of ["global", "india", "both"]) out.push({ label: `pricing_get_plans ${plan}/${region}`, payload: payloadOf(await run("pricing_get_plans", { plan, region })) });
  for (const region of ["global", "india"]) out.push({ label: `pricing_compare_plans ${region}`, payload: payloadOf(await run("pricing_compare_plans", { plan_a: "free", plan_b: "growth", region })) });
  for (const s of await slugs("alternatives_list", (j) => [...new Set<string>((j.alternatives ?? j.competitors ?? []).map((x: any) => x.slug))])) out.push({ label: `alternatives_get ${s}`, payload: payloadOf(await run("alternatives_get", { slug: s })) });
  for (const s of await slugs("switch_list_competitors", (j) => (j.guides ?? []).map((x: any) => x.slug))) out.push({ label: `switch_get_guide ${s}`, payload: payloadOf(await run("switch_get_guide", { slug: s })) });
  for (const s of await slugs("features_list", (j) => (j.features ?? []).map((x: any) => x.slug))) out.push({ label: `features_get ${s}`, payload: payloadOf(await run("features_get", { slug: s })) });
  out.push({ label: "faqs_get_site search=free", payload: payloadOf(await run("faqs_get_site", { search: "free" })) });
  for (const p of PROMPTS) out.push({ label: `prompt ${p.name}`, payload: [p.build({})] });
  return out;
}

afterEach(() => { vi.useRealTimers(); });

describe("guard: no response disagrees with the registry snapshot", () => {
  it("the scanner itself flags a planted retired literal (it is not vacuous)", () => {
    expect(findLimitMismatches({ rows: [["Free plan", "Yes - up to 200 leads", "No free plan"]] })).toHaveLength(1);
    expect(findLimitMismatches({ rows: [["Free Plan", "200 contacts, forever", "x"]] })).toHaveLength(1);
    expect(findLimitMismatches({ f: { free: "500 tasks" } })).toHaveLength(1);
    expect(findLimitMismatches({ rows: [["Free plan", "Yes - 150 leads", "x"]] })).toHaveLength(0);
    expect(findLimitMismatches("a free plan with 200 leads")).toHaveLength(0); // bare string: no container context; covered by the forbidden-value scan below
  });

  it("every swept response states only registry values for Free-plan limits", async () => {
    const all = await responses();
    expect(all.length).toBeGreaterThan(60); // the sweep really ran over the mirror tools
    const bad = all.flatMap((r) => findLimitMismatches(r.payload).map((m) => ({ tool: r.label, ...m })));
    expect(bad).toEqual([]);
  });

  it("no response contains a forbidden_values pattern of the pin, or a retired Free cap in prose", async () => {
    const forbidden = productTruth.forbiddenValues().map((p) => new RegExp(p, "i"));
    const retired = [/\b200\s+(?:free\s+)?(?:leads?|contacts?)\b/i, /\b500\s+tasks\b/i];
    const hits: string[] = [];
    for (const r of await responses()) {
      const text = JSON.stringify(r.payload);
      for (const re of [...forbidden, ...retired]) if (re.test(text)) hits.push(`${r.label}: ${re}`);
    }
    expect(hits).toEqual([]);
  });

  it("the surfaces that used to say 200 now say the registry value (150)", async () => {
    const reg = productTruth.limit("free", "leads", NOW);
    expect(reg).toMatchObject({ status: "served", value: 150 });
    const text = async (n: string, a?: unknown) => JSON.stringify(payloadOf(await run(n, a)));
    expect(await text("faqs_get_site", { search: "really free" })).toContain("up to 150 leads");
    expect(await text("switch_get_guide", { slug: "leadsquared" })).toContain("Yes — up to 150 leads, forever");
    expect(await text("pricing_get_plans", { plan: "free", region: "global" })).toContain('"leads":150');
    expect(await text("features_get", { slug: "task-boards" })).toContain("100 tasks");
  });
});

describe("withheld / stale: no number, no default (AC-B6a, named null exception)", () => {
  it("past valid_until every backed limit is withheld as stale in prose and in the legacy field", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.parse(PRODUCT_TRUTH_PIN.valid_until) + 1000);
    const plans: any = payloadOf(await run("pricing_get_plans", { plan: "free", region: "global" }));
    const free = plans.global_usd.plans[0];
    expect(free.limits).toMatchObject({ leads: null, accounts: null, tasks: null, users: 1, pipelines: 1 });
    expect(free.limits_detail.leads).toEqual({ status: "withheld", reason: "stale" });
    expect(free.limits_source).toMatchObject({ scope: "limits_detail", truth_version: PRODUCT_TRUTH_PIN.truth_version, stale: true });
    expect(free.withheld).toHaveLength(7);
    expect(free.billing).toBe(WITHHELD_PROSE);
    const faq = JSON.stringify(payloadOf(await run("faqs_get_site", { search: "really free" })));
    expect(faq).toContain(WITHHELD_PROSE);
    expect(faq).not.toMatch(/\b(150|200) leads/);
    const sw = JSON.stringify(payloadOf(await run("switch_get_guide", { slug: "leadsquared" })));
    expect(sw).not.toMatch(/\b(150|200) leads/);
    expect(JSON.stringify(payloadOf(await run("features_get", { slug: "task-boards" })))).not.toMatch(/\b(100|500) tasks/);
  });
  it("unknown differs from withheld at the renderer", () => {
    const at = { fact: (id: string) => productTruth.fact(id, NOW) };
    expect(renderTruth("{{plans.free.limits.users}}", at)).toBeNull(); // not exported: unknown
    expect(renderTruth("{{plans.free.limits.users}} users", at)).toBe(WITHHELD_PROSE);
    expect(productTruth.fact("plans.free.limits.users", NOW)).toEqual({ status: "unknown" });
  });
});

describe("served shape (AC-B1, AC-B5)", () => {
  it("keeps numeric legacy fields numeric and adds limits_detail + limits_source only for the backed keys", async () => {
    const j: any = payloadOf(await run("pricing_get_plans", { region: "global" }));
    const [free, growth, ent] = j.global_usd.plans;
    expect(free.limits).toEqual({ users: 1, leads: 150, accounts: 20, pipelines: 1, tasks: 100 });
    expect(Object.keys(free.limits_detail)).toEqual(["leads", "tasks", "accounts", "email_templates", "landing_pages", "custom_fields", "csv_rows"]);
    expect(free.limits_detail.leads).toEqual({ status: "served", value: 150, unit: "count", verified_on: "2026-11-04" });
    expect(free.limits_source).toMatchObject({ scope: "limits_detail", truth_version: PRODUCT_TRUTH_PIN.truth_version, snapshot: { kind: "pinned", sha256: PRODUCT_TRUTH_PIN.source_sha256 } });
    expect(free.limits_source.stale).toBeUndefined();
    expect(Object.keys(growth.limits_detail)).toEqual(["custom_fields", "csv_rows"]);
    expect(growth.limits).toEqual({ leads: "Unlimited", accounts: "Unlimited", pipelines: "Unlimited", tasks: "Unlimited" }); // hand-written, no provenance
    expect(ent.limits_detail).toBeUndefined();
    expect(ent.limits_source).toBeUndefined();
    expect(JSON.stringify(payloadOf(await run("pricing_get_country_plans", { country: "eg" })))).not.toContain("limits_source");
  });
});

describe("build-time: every template names an id the real pin has (AC-B6b)", () => {
  const walk = (d: string, o: string[] = []): string[] => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) { if (n !== "__tests__") walk(p, o); } else if (/\.ts$/.test(n) && !/\.test\.ts$/.test(n)) o.push(p);
    }
    return o;
  };
  const known = new Set(productTruth.ids());
  it("every {{token}} in non-test source is well formed and present in the pin (served or withheld)", () => {
    let seen = 0;
    for (const f of walk(join(repo, "src"))) {
      if (f.endsWith("lib/truth-template.ts") || f.endsWith("data/product-truth.ts")) continue;
      const text = readFileSync(f, "utf8");
      expect(malformedTokens(text), f).toEqual([]);
      for (const id of tokenIds(text)) { seen++; expect(known.has(id), `${f}: ${id}`).toBe(true); }
    }
    expect(seen).toBeGreaterThan(20);
  });
  it("a template naming an id the pin lacks would fail this check", () => {
    expect(tokenIds("{{plans.free.limits.nonexistent}}").every((id) => known.has(id))).toBe(false);
    expect(malformedTokens("{{ free leads }} {{plans.free.limits.leads}}")).toEqual(["{{ free leads }}"]);
  });
});

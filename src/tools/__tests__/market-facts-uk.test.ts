import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ALL_UK_MET, withGates } from "../../lib/__tests__/market-facts-helpers.js";
import type { Gate } from "../../lib/market-publication.js";

const repo = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const FIX = join(repo, "test-data/fixtures");
const BASE = join(FIX, "baseline-main-5190a02");
const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8"));

const PENDING_CLOCK = "2026-12-01T00:00:00Z";
const EXPIRED_CLOCK = "2027-02-01T00:00:00Z";
const EXPIRY = "2027-01-31T00:00:00Z";

type Tools = Record<string, { handle: (a: unknown) => Promise<any>; definition: any }>;

/** Fresh tool modules bound to the generated data with the given gates replaced. */
async function load(gates: Gate[] | null): Promise<Tools> {
  vi.resetModules();
  vi.doUnmock("../../data/market-facts.js");
  if (gates) {
    const { data, integrity } = withGates(gates);
    vi.doMock("../../data/market-facts.js", () => ({ MARKET_FACTS_DATA: data, MARKET_FACTS_SHA256: integrity }));
  }
  const idx = await import("../index.js");
  return Object.fromEntries(idx.tools.map((t: any) => [t.definition.name, t]));
}
const body = (r: any) => r.structuredContent ?? JSON.parse(r.content[0].text);

async function snapshot(gates: Gate[] | null, clock: string) {
  const tools = await load(gates);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(clock));
  try {
    return {
      country_get_uk: body(await tools.country_get!.handle({ code: "uk" })),
      pricing_get_country_plans_uk: body(await tools.pricing_get_country_plans!.handle({ country: "uk" })),
    };
  } finally {
    vi.useRealTimers();
  }
}

const STATES = {
  pending: () => snapshot(null, PENDING_CLOCK),
  published: () => snapshot(ALL_UK_MET(EXPIRY), PENDING_CLOCK),
  expired: () => snapshot(ALL_UK_MET(EXPIRY), EXPIRED_CLOCK),
  error: async () => {
    const tools = await load(null);
    const r = await tools.country_get!.handle({ code: "zz" });
    return { isError: r.isError, text: r.content[0].text };
  },
} as const;

afterEach(() => vi.useRealTimers());

describe("AC-A7 fixtures (pending, published, expired, error)", () => {
  for (const [state, make] of Object.entries(STATES)) {
    it(`${state} matches the committed fixture`, async () => {
      const actual = await make();
      const path = join(FIX, `market-facts-uk-${state}.json`);
      if (process.env.UPDATE_FIXTURES === "1") {
        mkdirSync(FIX, { recursive: true });
        writeFileSync(path, `${JSON.stringify(actual, null, 2)}\n`);
      }
      expect(existsSync(path)).toBe(true);
      expect(actual).toEqual(readJson(path));
    });
  }

  it("error state lists hubs and the unknown code", async () => {
    const e = (await STATES.error()) as { isError: boolean; text: string };
    expect(e.isError).toBe(true);
    expect(e.text).toMatch(/^Country "zz" not found\. Available: in, usa, uk,/);
  });

  it("the serialised results validate against each tool's outputSchema", async () => {
    const tools = await load(null);
    const ajv = new Ajv({ strict: false, allErrors: true });
    for (const state of ["pending", "published", "expired"] as const) {
      const snap = (await STATES[state]()) as any;
      for (const [fixture, tool] of [["country_get_uk", "country_get"], ["pricing_get_country_plans_uk", "pricing_get_country_plans"]] as const) {
        const v = ajv.compile(tools[tool]!.definition.outputSchema);
        expect(v(snap[fixture]), `${tool} ${state}: ${ajv.errorsText(v.errors)}`).toBe(true);
      }
    }
    const v = ajv.compile(tools.countries_list!.definition.outputSchema);
    expect(v(body(await tools.countries_list!.handle({})))).toBe(true);
  });
});

describe("AC-A8 / pending state", () => {
  it("UK price fields are null with price_status pending_verification", async () => {
    const s = (await STATES.pending()) as any;
    const ps = s.country_get_uk.pricing_summary;
    expect(ps).toMatchObject({ growthPriceShort: null, growthPriceMonthly: null, currencyCode: null, currencySymbol: null, price_status: "pending_verification", billing_currency: "USD" });
    expect(ps.paymentMethods).toBe("Paid via Stripe");
    expect(ps.pricingSummaryLine).toBe("Free Forever · Growth (price pending verification) · Enterprise (custom) · 14-day trial on paid plans");
    expect(s.country_get_uk.country.compliance).toBeNull();
    expect(s.country_get_uk.country.compliance_status).toBe("withheld_unverified");
    expect(s.country_get_uk.market_facts.facts.map((f: any) => f.fact_id)).toEqual(["uk.pay.hgc-subscription", "uk.pay.gocardless", "uk.market.hub", "uk.positioning.suite"]);
    expect(s.pricing_get_country_plans_uk.country_pricing[0]).toMatchObject({ price_status: "pending_verification", compliance: null, compliance_status: "withheld_unverified", paymentMethods: "Paid via Stripe" });
  });
});

describe("AC-A2 / AC-A3 pattern scans over every state", () => {
  const P_LIST = [/GoCardless/, /bank transfer/i, /UK GDPR compliant/, /ICO-registered/, /HMRC and FCA/, /£/, /GBP/];
  const PROSE = [/residen/i, /ISO ?27001/i, /HIPAA/i, /WhatsApp-first/i, /sales[- ]only/i, /sales[- ]first/i, /certified/i];

  function proseOf(v: unknown, key = "", out: string[] = []): string[] {
    if (typeof v === "string") { if (["statement", "message", "note", "qualifier", "price_note", "price_qualifier"].includes(key)) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => proseOf(x, key, out));
    else if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => proseOf(x, k, out));
    return out;
  }
  // The market's local-currency metadata (country.currency, currency_symbol) is
  // deliberately retained (plan AC-B2); everything else is scanned.
  function scannable(snap: any) {
    const c = JSON.parse(JSON.stringify(snap));
    delete c.country_get_uk?.country?.currency;
    delete c.country_get_uk?.country?.currency_symbol;
    for (const f of c.country_get_uk?.market_facts?.facts ?? []) if (f.status === "roadmap") f.statement = "(roadmap)";
    return JSON.stringify(c);
  }

  for (const state of ["pending", "published", "expired"] as const) {
    it(`${state}: no unsupported UK string and no banned prose`, async () => {
      const snap = (await STATES[state]()) as any;
      const text = scannable(snap);
      for (const re of P_LIST) expect(text, `${re} in ${state}`).not.toMatch(re);
      for (const p of proseOf(snap)) for (const re of PROSE) expect(p, `${re} in ${state}`).not.toMatch(re);
    });
  }

  it("roadmap statements are the only place GoCardless appears, and they start 'Planned, not available:'", async () => {
    const snap = (await STATES.pending()) as any;
    const withGC = snap.country_get_uk.market_facts.facts.filter((f: any) => /GoCardless/.test(f.statement));
    expect(withGC).toHaveLength(1);
    expect(withGC[0].statement.startsWith("Planned, not available:")).toBe(true);
    expect(withGC[0].is_capability).toBe(false);
  });

  it("no tax line, rate or residency topic is served in any state", async () => {
    for (const state of ["pending", "published"] as const) {
      const mf = ((await STATES[state]()) as any).country_get_uk.market_facts;
      expect(mf.facts.some((f: any) => /tax/i.test(f.kind) || /\bVAT\b|\d\s?%/.test(f.statement))).toBe(false);
      expect(mf.withheld.map((w: any) => w.topic).some((t: string) => /resid/.test(t))).toBe(false);
    }
  });

  it("the positioning fact is positive: suite areas, WhatsApp as one channel among several", async () => {
    const f = ((await STATES.pending()) as any).country_get_uk.market_facts.facts.find((x: any) => x.fact_id === "uk.positioning.suite");
    expect(f.statement).toMatch(/pipeline, communication, commerce, operations, customers, marketing, intelligence/);
    expect(f.statement).toMatch(/WhatsApp is one channel next to email, SMS, voice and live chat/);
    expect(f.statement).not.toMatch(/\bnot\b/i);
  });
});

describe("published and expired lifecycle through the tools", () => {
  it("published: USD 12 monthly, USD 120 upfront, qualifier beside the amounts, SOC 2 historical statement", async () => {
    const s = (await STATES.published()) as any;
    const mf = s.country_get_uk.market_facts;
    expect(mf.price).toMatchObject({ price_status: "published", billing_currency: "USD", monthly: { amount: 12 }, annual: { amount: 120 } });
    expect(mf.price.qualifier).toBeTruthy();
    const soc2 = mf.facts.find((f: any) => f.fact_id === "uk.security.soc2");
    expect(soc2.statement).toMatch(/Soor LLC for 2025-02-01 to 2025-06-30.*Precision Assurance CPA LLC/);
    expect(soc2.statement).not.toMatch(/currently|ongoing|all services/i);
    expect(s.pricing_get_country_plans_uk.country_pricing[0]).toMatchObject({ currencyCode: "USD", growthPriceMonthly: "$12/user/month", price_status: "published" });
    expect(mf.withheld.map((w: any) => w.topic)).not.toContain("price-pending");
  });

  it("expired (clock past expires_on): back to pending and SOC 2 swaps for soc2-report-period, with no rebuild", async () => {
    const s = (await STATES.expired()) as any;
    const mf = s.country_get_uk.market_facts;
    expect(mf.price.price_status).toBe("pending_verification");
    expect(mf.facts.map((f: any) => f.fact_id)).not.toContain("uk.security.soc2");
    expect(mf.withheld.map((w: any) => w.topic)).toEqual(expect.arrayContaining(["soc2-report-period", "price-pending"]));
  });
});

describe("AC-A12 composition", () => {
  it("country_get then pricing_get_plans, and the reverse, keep the pending note with country_get", async () => {
    const tools = await load(null);
    const a1 = body(await tools.country_get!.handle({ code: "uk" }));
    const b1 = body(await tools.pricing_get_plans!.handle({ region: "both" }));
    const b2 = body(await tools.pricing_get_plans!.handle({ region: "both" }));
    const a2 = body(await tools.country_get!.handle({ code: "uk" }));
    for (const a of [a1, a2]) {
      expect(a.market_facts.price.note).toMatch(/global USD ladder in pricing_get_plans is not confirmation/);
      expect(a.pricing_summary.price_note).toMatch(/global USD ladder in pricing_get_plans is not confirmation/);
    }
    expect(b1).toEqual(b2);
  });
});

describe("compatibility against the captured main fixtures (AC-A1, AC-A10)", () => {
  let tools: Tools;
  beforeAll(async () => { tools = await load(null); });

  it("tool count equals main (89) and tools/list differs only by additive outputSchema on the changed tools", async () => {
    const base = readJson(join(BASE, "tools-list.json")) as any[];
    expect(Object.keys(tools)).toHaveLength(base.length);
    expect(base).toHaveLength(89);
    const changed = new Set(["country_get", "countries_list", "pricing_get_country_plans"]);
    for (const b of base) {
      const cur = tools[b.name]!.definition;
      const strip = (d: any) => { const c = JSON.parse(JSON.stringify(d)); if (changed.has(c.name)) delete c.outputSchema; return c; };
      expect(strip(cur), b.name).toEqual(strip(b));
      if (changed.has(b.name) && b.outputSchema) {
        for (const key of Object.keys(b.outputSchema.properties)) expect(cur.outputSchema.properties, `${b.name}.${key}`).toHaveProperty(key);
      }
    }
  });

  it("country_get for every non-UK code adds only market_facts (null) and market_facts_reason", async () => {
    const base = readJson(join(BASE, "country_get.json"));
    for (const code of Object.keys(base).filter((c) => c !== "uk")) {
      const now = body(await tools.country_get!.handle({ code }));
      const { market_facts, market_facts_reason, ...rest } = now;
      expect(market_facts).toBeNull();
      expect(market_facts_reason).toBe("no_market_facts_for_this_market");
      expect(rest, code).toEqual(base[code]);
    }
  });

  it("country_get uk differs from main only in the matrix keys", async () => {
    const base = readJson(join(BASE, "country_get.json")).uk;
    const now = body(await tools.country_get!.handle({ code: "uk" }));
    const { market_facts, ...rest } = now;
    expect(market_facts).toBeTruthy();
    const diff = (a: any, b: any, p = ""): string[] =>
      JSON.stringify(a) === JSON.stringify(b)
        ? []
        : a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a)
          ? [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap((k) => diff(a[k], b[k], `${p}.${k}`))
          : [p];
    expect(diff(base, rest).sort()).toEqual([
      ".country.compliance", ".country.compliance_status", ".pricing_summary.compliance",
      ".pricing_summary.compliance_status", ".pricing_summary.currencyCode", ".pricing_summary.currencySymbol",
      ".pricing_summary.growthPriceMonthly", ".pricing_summary.growthPriceShort", ".pricing_summary.paymentMethods",
      ".pricing_summary.price_note", ".pricing_summary.price_status", ".pricing_summary.pricingSummaryLine",
      ".pricing_summary.billing_currency",
    ].sort());
  });

  it("countries_list differs from main only by market_facts_available", async () => {
    const base = readJson(join(BASE, "countries_list.json"));
    const now = body(await tools.countries_list!.handle({}));
    expect(now.countries.map(({ market_facts_available, ...r }: any) => r)).toEqual(base.countries);
    expect(Object.fromEntries(now.countries.map((c: any) => [c.code, c.market_facts_available]))).toEqual({
      in: false, usa: false, uk: true, canada: false, au: false, uae: false, singapore: false, "new-zealand": false,
    });
    expect({ ...now, countries: base.countries }).toEqual(base);
  });

  it("pricing_get_country_plans: every market except uk is byte-identical", async () => {
    const base = readJson(join(BASE, "pricing_get_country_plans.json"));
    const now = body(await tools.pricing_get_country_plans!.handle({}));
    const strip = (o: any) => o.country_pricing.filter((r: any) => r.countrySlug !== "uk");
    expect(strip(now)).toEqual(strip(base));
  });

  it("pricing_get_faq differs only in the UK clause; pricing_get_plans is unchanged except additive provenance", async () => {
    const baseFaq = readJson(join(BASE, "pricing_get_faq.json"));
    const faq = body(await tools.pricing_get_faq!.handle({}));
    const norm = (o: any) => JSON.stringify(o).replace("UK: card, Stripe, GoCardless, bank transfer.", "UK: paid via Stripe.");
    expect(JSON.stringify(faq)).toBe(norm(baseFaq));
    expect(JSON.stringify(faq)).toContain("UK: paid via Stripe.");
    // PLAN-HELLOG-0011 PR-B (AC-B7): the only allowed difference is the additive provenance keys.
    const stripProvenance = (o: any) => JSON.parse(JSON.stringify(o, (k, v) => (k === "limits_detail" || k === "limits_source" || k === "withheld" ? undefined : v)));
    expect(stripProvenance(body(await tools.pricing_get_plans!.handle({ region: "both" })))).toEqual(readJson(join(BASE, "pricing_get_plans.json")));
  });
});

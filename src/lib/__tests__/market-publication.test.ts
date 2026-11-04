import { describe, expect, it } from "vitest";
import { MARKET_FACTS_DATA, MARKET_FACTS_SHA256 } from "../../data/market-facts.js";
import { canonicalJson, createMarketFacts, sha256Hex, type MarketFactsData } from "../market-publication.js";
import { ALL_UK_MET, clone, metGate, withGates } from "./market-facts-helpers.js";

const T0 = Date.parse("2026-12-01T00:00:00Z");
const EXP = "2027-01-31T00:00:00Z";
const EXP_MS = Date.parse(EXP);
const noEnv = () => ({});

function mf(gates = ALL_UK_MET(EXP), env: () => Record<string, string | undefined> = noEnv) {
  const { data, integrity } = withGates(gates);
  return createMarketFacts(data, { integrity, env });
}
const ids = (r: ReturnType<ReturnType<typeof mf>["getMarketFacts"]>) => (r && "facts" in r ? r.facts.map((f) => f.fact_id) : []);
const topics = (r: ReturnType<ReturnType<typeof mf>["getMarketFacts"]>) => (r && "withheld" in r ? r.withheld.map((w) => w.topic) : []);

describe("generated data integrity", () => {
  it("the shipped digest matches the shipped data (default instance is trusted)", () => {
    expect(sha256Hex(canonicalJson(MARKET_FACTS_DATA))).toBe(MARKET_FACTS_SHA256);
  });

  it("a hand-edited generated file fails closed: nothing is published", () => {
    const { data } = withGates(ALL_UK_MET(EXP));
    const edited = createMarketFacts(data, { integrity: MARKET_FACTS_SHA256, env: noEnv });
    expect(edited.integrityOk).toBe(false);
    expect(edited.getMarketPrice("uk", T0)!.price_status).toBe("pending_verification");
    expect(edited.getMarketFacts("uk", T0)).toMatchObject({ unavailable: "integrity_check_failed" });
    const uk = data.markets.uk!.data.facts[0]!;
    expect(edited.isPublished(uk, T0)).toBe(false);
  });
});

describe("pending state (all gates unmet, as shipped)", () => {
  const shipped = createMarketFacts(MARKET_FACTS_DATA, { env: noEnv });
  it("price is null and pending; SOC 2 and price facts are absent from the served response", () => {
    const r = shipped.getMarketFacts("uk", T0)!;
    expect(r).toHaveProperty("price.price_status", "pending_verification");
    expect(r).toHaveProperty("price.monthly", null);
    expect(r).toHaveProperty("price.annual", null);
    expect(ids(r)).toEqual(["uk.pay.hgc-subscription", "uk.pay.gocardless", "uk.market.hub", "uk.positioning.suite"]);
    expect(topics(r)).toContain("price-pending");
    expect(topics(r)).toContain("soc2-report-period");
  });
});

describe("AC-A9 boundaries", () => {
  it("serves everything one millisecond before expires_on and withholds at expires_on", () => {
    const m = mf();
    const before = m.getMarketFacts("uk", EXP_MS - 1)!;
    expect(ids(before)).toEqual(expect.arrayContaining(["uk.price.monthly", "uk.price.annual", "uk.security.soc2"]));
    expect(before).toHaveProperty("price.price_status", "published");
    const at = m.getMarketFacts("uk", EXP_MS)!;
    expect(ids(at)).not.toContain("uk.price.monthly");
    expect(ids(at)).not.toContain("uk.security.soc2");
    expect(at).toHaveProperty("price.price_status", "pending_verification");
    expect(topics(at)).toEqual(expect.arrayContaining(["price-pending", "soc2-report-period"]));
  });

  it("published price carries amounts, applies_to, qualifier, valid_until and the qualifier beside every price statement", () => {
    const r = mf().getMarketFacts("uk", T0)!;
    expect(r).toMatchObject({
      price: {
        price_status: "published",
        billing_currency: "USD",
        monthly: { amount: 12, unit: "per user per month" },
        annual: { amount: 120, unit: "per user per year, charged once upfront" },
        applies_to: "list price for new subscriptions",
        valid_until: "2027-01-31T00:00:00.000Z",
      },
    });
    const price = (r as any).price;
    expect(price.qualifier).toMatch(/confirmed at checkout/);
    const statements = (r as any).facts.filter((f: any) => f.kind === "price").map((f: any) => f.statement);
    expect(statements).toHaveLength(2);
    for (const s of statements) expect(s).toContain(price.qualifier);
    expect(statements[0]).toMatch(/^Growth is USD 12 per user per month/);
    expect(statements[1]).toMatch(/^Growth is USD 120 per user per year, charged once upfront/);
    expect(topics(r)).not.toContain("price-pending");
    expect(topics(r)).not.toContain("soc2-report-period");
    expect(ids(r)).toHaveLength(7);
  });

  it.each([
    ["missing expires_on", { expires_on: null }],
    ["malformed expires_on", { expires_on: "next tuesday" }],
    ["missing evidence hash", { evidence_sha256: null }],
    ["missing observed_on", { observed_on: null }],
    ["revoked", { status: "revoked" as const }],
    ["unmet", { status: "unmet" as const }],
  ])("a stripe-flow1 gate with %s withholds the price", (_n, patch) => {
    const gates = ALL_UK_MET(EXP).map((g) => (g.gate_id === "stripe-flow1:uk" ? { ...g, ...patch } : g));
    const r = mf(gates).getMarketFacts("uk", T0)!;
    expect(r).toHaveProperty("price.price_status", "pending_verification");
    expect(ids(r)).not.toContain("uk.price.monthly");
    // an unrelated, still-valid gate keeps SOC 2 published
    expect(ids(r)).toContain("uk.security.soc2");
  });

  it("an unknown gate id withholds the fact (fail closed)", () => {
    const { data, integrity } = withGates(ALL_UK_MET(EXP));
    data.markets.uk!.data.facts.find((f) => f.fact_id === "uk.pay.hgc-subscription")!.publish_gates = ["no-such-gate"];
    const m = createMarketFacts(data, { integrity: sha256Hex(canonicalJson(data)), env: noEnv });
    void integrity;
    expect(ids(m.getMarketFacts("uk", T0))).not.toContain("uk.pay.hgc-subscription");
  });

  it("a fact whose own publish_gates are emptied is still held by the policy's mandatory gates", () => {
    const { data } = withGates([metGate("soc2-scope", "global", EXP)]); // price gates stay unmet
    for (const f of data.markets.uk!.data.facts.filter((x) => x.kind === "price")) f.publish_gates = [];
    const m = createMarketFacts(data, { integrity: sha256Hex(canonicalJson(data)), env: noEnv });
    expect(ids(m.getMarketFacts("uk", T0))).not.toContain("uk.price.monthly");
    expect(ids(m.getMarketFacts("uk", T0))).toContain("uk.security.soc2");
  });

  it("a price is never published without the approved public qualifier", () => {
    const gates = ALL_UK_MET(EXP).map((g) => (g.gate_id === "stripe-flow1:uk" ? { ...g, public_price_qualifier: "  " } : g));
    expect(mf(gates).getMarketPrice("uk", T0)!.price_status).toBe("pending_verification");
  });

  it("the SOC 2 fact is absent while soc2-scope is unmet and present when met", () => {
    const priceOnly = ALL_UK_MET(EXP).filter((g) => g.gate_id !== "soc2-scope");
    expect(ids(mf(priceOnly).getMarketFacts("uk", T0))).not.toContain("uk.security.soc2");
    expect(ids(mf().getMarketFacts("uk", T0))).toContain("uk.security.soc2");
  });
});

describe("kill switch", () => {
  it("withholds without a rebuild and is read on every call", () => {
    let env: Record<string, string | undefined> = {};
    const m = mf(ALL_UK_MET(EXP), () => env);
    expect(m.getMarketPrice("uk", T0)!.price_status).toBe("published");
    env = { MARKET_FACTS_KILL_SWITCH: "stripe-flow1:uk" };
    expect(m.getMarketPrice("uk", T0)!.price_status).toBe("pending_verification");
    expect(ids(m.getMarketFacts("uk", T0))).toContain("uk.security.soc2");
    env = { MARKET_FACTS_KILL_SWITCH: "soc2-scope" };
    expect(ids(m.getMarketFacts("uk", T0))).not.toContain("uk.security.soc2");
    expect(m.getMarketPrice("uk", T0)!.price_status).toBe("published");
    env = { MARKET_FACTS_KILL_SWITCH: " ALL " };
    expect(m.getMarketPrice("uk", T0)!.price_status).toBe("pending_verification");
    env = {};
    expect(m.getMarketPrice("uk", T0)!.price_status).toBe("published");
  });
});

describe("AC-A13 gate scoping", () => {
  function twoMarkets() {
    const { data } = withGates(ALL_UK_MET(EXP));
    const ng = clone(data.markets.uk!);
    ng.data.market = "ng";
    ng.data.facts = ng.data.facts.map((f) => ({ ...f, market: "ng", fact_id: f.fact_id.replace(/^uk\./, "ng.") }));
    data.markets.ng = ng;
    data.gates.push(metGate("website-deploy:ng", "ng", EXP), metGate("stripe-flow1:ng", "ng", EXP));
    return data;
  }
  const build = (d: MarketFactsData, env: () => Record<string, string | undefined> = noEnv) =>
    createMarketFacts(d, { integrity: sha256Hex(canonicalJson(d)), env });

  it("revoking, expiring or kill-switching one market's gate leaves the other byte-identical", () => {
    const base = build(twoMarkets());
    const ngBase = JSON.stringify(base.getMarketFacts("ng", T0));
    const ukBase = JSON.stringify(base.getMarketFacts("uk", T0));

    const revoked = twoMarkets();
    revoked.gates.find((g) => g.gate_id === "stripe-flow1:uk")!.status = "revoked";
    expect(JSON.stringify(build(revoked).getMarketFacts("ng", T0))).toBe(ngBase);
    expect(JSON.stringify(build(revoked).getMarketFacts("uk", T0))).not.toBe(ukBase);

    const expired = twoMarkets();
    expired.gates.find((g) => g.gate_id === "stripe-flow1:uk")!.expires_on = "2026-11-30T00:00:00Z";
    expect(JSON.stringify(build(expired).getMarketFacts("ng", T0))).toBe(ngBase);

    const killed = build(twoMarkets(), () => ({ MARKET_FACTS_KILL_SWITCH: "stripe-flow1:uk,website-deploy:uk" }));
    expect(JSON.stringify(killed.getMarketFacts("ng", T0))).toBe(ngBase);
    expect(killed.getMarketPrice("uk", T0)!.price_status).toBe("pending_verification");
  });
});

describe("applyMarketPricing", () => {
  const row = { countrySlug: "uk", compliance: null as string | null, growthPriceShort: null as string | null };
  it("leaves markets without market facts untouched (same object)", () => {
    const m = mf();
    const other = { countrySlug: "usa", compliance: "x" };
    expect(m.applyMarketPricing(other, T0)).toBe(other);
  });
  it("pending: nulls stay, status and note are added; published: USD strings and qualifier", () => {
    const pending = createMarketFacts(MARKET_FACTS_DATA, { env: noEnv }).applyMarketPricing(row, T0) as any;
    expect(pending).toMatchObject({ price_status: "pending_verification", billing_currency: "USD", growthPriceShort: null, compliance_status: "withheld_unverified" });
    expect(pending.price_note).toMatch(/not confirmation of availability/);
    const pub = mf().applyMarketPricing(row, T0) as any;
    expect(pub).toMatchObject({ price_status: "published", currencyCode: "USD", currencySymbol: "$", growthPriceMonthly: "$12/user/month" });
    expect(pub.price_qualifier).toMatch(/checkout/);
  });
});

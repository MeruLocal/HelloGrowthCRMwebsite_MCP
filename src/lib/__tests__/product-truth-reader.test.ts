import { describe, expect, it } from "vitest";
import { canonicalJson, sha256Hex } from "../market-publication.js";
import { PRODUCT_TRUTH_DATA, PRODUCT_TRUTH_PIN } from "../../data/product-truth.js";
import { ALERT_DAYS, WITHHELD_PROSE, createProductTruth, productTruth, requestInstant } from "../product-truth.js";
import type { ProductTruthData, ProductTruthPin, PublicFact } from "../product-truth.js";

const T0 = Date.parse(PRODUCT_TRUTH_PIN.generated_at) + 3600_000;
const VALID_UNTIL = Date.parse(PRODUCT_TRUTH_PIN.valid_until);

const fact = (over: Partial<PublicFact> = {}): PublicFact => ({
  value: 7, unit: "count", plans: ["free"], countries: "global", lifecycle: "live",
  provenance: "enforced", verified_on: "2026-11-04", evidence_ref: "x", ...over,
});
function reader(data: Partial<ProductTruthData>, pin: Partial<ProductTruthPin> = {}) {
  const d: ProductTruthData = { ...JSON.parse(JSON.stringify(PRODUCT_TRUTH_DATA)), ...data };
  const p: ProductTruthPin = { ...PRODUCT_TRUTH_PIN, ...pin };
  return createProductTruth(d, p, { integrity: sha256Hex(canonicalJson({ pin: p, data: d })) });
}

describe("lookup", () => {
  it("serves Free leads 150 from the pin, with unit, verified_on and lifecycle", () => {
    expect(productTruth.limit("free", "leads", T0)).toEqual({ status: "served", value: 150, unit: "count", verified_on: "2026-11-04", lifecycle: "live" });
    expect(productTruth.limit("free", "email_templates", T0)).toMatchObject({ status: "served", value: 2 });
    expect(productTruth.limit("growth", "csv_rows", T0)).toMatchObject({ status: "served", value: "unlimited" });
    expect(productTruth.planName("growth")).toBe("Growth");
  });
  it("an id absent from its section and not withheld is unknown, never a default", () => {
    for (const [p, k] of [["free", "users"], ["growth", "leads"], ["nope", "leads"], ["free", "Leads"], ["free", "leads.x"], ["__proto__", "leads"]])
      expect(productTruth.limit(p!, k!, T0)).toEqual({ status: "unknown" });
    expect(productTruth.fact("constructor", T0)).toEqual({ status: "unknown" });
  });
  it("a withheld id returns its PT-A reason and differs from unknown", () => {
    const r = reader({ withheld: [{ id: "plans.free.limits.users", reason: "undecided" }] });
    expect(r.limit("free", "users", T0)).toEqual({ status: "withheld", reason: "undecided" });
    expect(r.limit("free", "pipelines", T0)).toEqual({ status: "unknown" });
    expect(r.withheldReason("plans.free.limits.users")).toBe("undecided");
  });
  it.each(["draft", "undecided", "withdrawn", "expired", "future", "surface_not_approved"] as const)("returns reason %s", (reason) => {
    const r = reader({ withheld: [{ id: "plans.free.limits.users", reason }] });
    expect(r.limit("free", "users", T0)).toEqual({ status: "withheld", reason });
  });
  it("a roadmap fact is never served as a capability", () => {
    const d = JSON.parse(JSON.stringify(PRODUCT_TRUTH_DATA)); d.limits["plans.free.limits.leads"] = fact({ lifecycle: "roadmap", value: 500 });
    expect(reader({ limits: d.limits }).limit("free", "leads", T0)).toEqual({ status: "withheld", reason: "future" });
  });
});

describe("validity at the request instant", () => {
  const withWindow = (w: Partial<PublicFact>) => {
    const d = JSON.parse(JSON.stringify(PRODUCT_TRUTH_DATA)); d.limits["plans.free.limits.leads"] = fact({ value: 150, ...w });
    return reader({ limits: d.limits });
  };
  it("served at effective_until - 1ms, withheld (expired) at effective_until", () => {
    const until = T0 + 60_000;
    const r = withWindow({ effective_until: new Date(until).toISOString().replace(".000", "") });
    expect(r.limit("free", "leads", until - 1).status).toBe("served");
    expect(r.limit("free", "leads", until)).toEqual({ status: "withheld", reason: "expired" });
  });
  it("withheld (future) before effective_from, served at effective_from", () => {
    const from = T0 + 60_000;
    const r = withWindow({ effective_from: new Date(from).toISOString().replace(".000", "") });
    expect(r.limit("free", "leads", from - 1)).toEqual({ status: "withheld", reason: "future" });
    expect(r.limit("free", "leads", from).status).toBe("served");
  });
  it("a malformed window instant is withheld, not served", () => {
    expect(withWindow({ effective_until: "soon" }).limit("free", "leads", T0)).toEqual({ status: "withheld", reason: "stale" });
  });
  it("every pinned id is stale at valid_until, and at next_transition when there is no newer pin", () => {
    expect(productTruth.limit("free", "leads", VALID_UNTIL - 1).status).toBe("served");
    expect(productTruth.limit("free", "leads", VALID_UNTIL)).toEqual({ status: "withheld", reason: "stale" });
    expect(productTruth.limit("growth", "csv_rows", VALID_UNTIL)).toEqual({ status: "withheld", reason: "stale" });
    expect(productTruth.limit("free", "users", VALID_UNTIL)).toEqual({ status: "unknown" });
    const nt = T0 + 1000;
    const r = reader({}, { next_transition: new Date(nt).toISOString().replace(".000", "") });
    expect(r.limit("free", "leads", nt - 1).status).toBe("served");
    expect(r.limit("free", "leads", nt)).toEqual({ status: "withheld", reason: "stale" });
  });
  it("a future-dated report (clock skew beyond 5 minutes) withholds; small skew does not", () => {
    const gen = Date.parse(PRODUCT_TRUTH_PIN.generated_at);
    expect(productTruth.limit("free", "leads", gen - 6 * 60_000).status).toBe("withheld");
    expect(productTruth.limit("free", "leads", gen - 60_000).status).toBe("served");
  });
  it("a malformed report instant fails closed", () => {
    expect(reader({}, { valid_until: "never" }).limit("free", "leads", T0)).toEqual({ status: "withheld", reason: "stale" });
  });
  it("a hand-edited data object (integrity mismatch) serves nothing", () => {
    const d = JSON.parse(JSON.stringify(PRODUCT_TRUTH_DATA)); d.limits["plans.free.limits.leads"].value = 151;
    const r = createProductTruth(d, PRODUCT_TRUTH_PIN);
    expect(r.limit("free", "leads", T0)).toEqual({ status: "withheld", reason: "stale" });
    expect(r.pinInfo(T0).integrity_ok).toBe(false);
  });
  it("one captured instant serves a whole response; the singleton is clock-free and re-reads on the next request", async () => {
    const { vi } = await import("vitest");
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(T0);
      const view = productTruth.at(requestInstant());
      vi.setSystemTime(VALID_UNTIL + 1000); // clock moves mid-request: this response still agrees with itself
      expect(view.limit("free", "leads").status).toBe("served");
      expect(view.limit("free", "tasks").status).toBe("served");
      // next request on the same running object
      expect(productTruth.at(requestInstant()).limit("free", "leads")).toEqual({ status: "withheld", reason: "stale" });
    } finally { vi.useRealTimers(); }
  });
});

describe("pinInfo (health)", () => {
  it("reports days remaining, alerts under ALERT_DAYS, and stale after valid_until", () => {
    const day = 86400_000;
    expect(productTruth.pinInfo(T0)).toMatchObject({ truth_version: PRODUCT_TRUTH_PIN.truth_version, stale: false, alert: false, integrity_ok: true });
    expect(productTruth.pinInfo(VALID_UNTIL - (ALERT_DAYS - 1) * day).alert).toBe(true);
    expect(productTruth.pinInfo(VALID_UNTIL)).toMatchObject({ stale: true, alert: true, days_remaining: 0 });
  });
  it("prose for a withheld or unknown result is fixed", () => {
    expect(WITHHELD_PROSE).toBe("Not available from this server right now; check the pricing page.");
  });
});

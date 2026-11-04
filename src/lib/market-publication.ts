/**
 * market-publication.ts — the ONE predicate that decides whether a per-market
 * fact or price may be served (PLAN-HELLOG-0007, market_facts_contract 1).
 *
 * Rules, all enforced here and nowhere else:
 *   - A served item needs EVERY gate it names, plus every gate the policy
 *     (scripts/market-facts.policy.json) makes mandatory for its kind, to be
 *     `met`, not revoked, not kill-switched and not past `expires_on`.
 *   - Gate lookup is by (gate_id, market) so one market's gate can never
 *     affect another's. `policy.global_gates` (soc2-scope) are market-free.
 *   - A missing or unknown gate is unmet, a malformed `expires_on` is expired
 *     (fail closed).
 *   - Expiry is evaluated against the `now` passed in on every request: no
 *     rebuild, no network call. `expires_on` is a UTC instant; a bare date
 *     means 00:00:00Z of that day.
 *   - The generated data carries a sha256; if it does not match, nothing is
 *     published (a hand edit of src/data/market-facts.ts fails closed).
 *   - MARKET_FACTS_KILL_SWITCH (comma-separated gate keys such as
 *     "stripe-flow1:uk", or "all") is read from the environment on every call.
 *     A changed variable reaches a running process only after a restart.
 */
import { createHash } from "node:crypto";
import { MARKET_FACTS_DATA, MARKET_FACTS_SHA256 } from "../data/market-facts.js";

export interface Gate {
  gate_id: string;
  market: string;
  status: "unmet" | "met" | "revoked";
  evidence_ref: string | null;
  evidence_sha256: string | null;
  observed_on: string | null;
  approver: string | null;
  expires_on: string | null;
  public_price_qualifier?: string;
}

export interface Fact {
  fact_id: string;
  claim_id: string;
  claim_id_status: "provisional" | "registry";
  claim_id_aliases: string[];
  scope_ref: string;
  kind: "price" | "payment" | "market" | "attestation" | "positioning";
  statement: string;
  applies_to: string | null;
  market: string;
  status: "capability" | "roadmap";
  is_capability: boolean;
  evidence: { type: string; ref: string; public_url: string | null };
  source: string;
  verified_on: string;
  truth_version: string;
  fact_version: number;
  supersedes: string | null;
  release_evidence_version: string;
  commit_id: string;
  publish_gates: string[];
}

export interface PriceAmount {
  amount: number;
  unit: string;
}

export interface MarketFile {
  market: string;
  as_of: string;
  fact_set_version: number;
  market_facts_contract: 1;
  release_evidence_version: string;
  price: {
    billing_currency: "USD";
    monthly: PriceAmount;
    annual: PriceAmount;
    applies_to: string;
    source: string;
    verified_on: string;
    truth_version: string;
    publish_gates: string[];
    pending_note: string;
  };
  facts: Fact[];
  withheld: string[];
}

export interface Policy {
  market_facts_contract: 1;
  global_gates: string[];
  mandatory_gates_by_kind: Record<string, string[]>;
  banned_prose_patterns: string[];
  withheld_topics: string[];
  withheld_message: string;
  max_price_gate_days: number;
}

export interface MarketFactsData {
  market_facts_contract: 1;
  release_evidence_version: string;
  as_of: string;
  policy: Policy;
  gates: Gate[];
  markets: Record<string, { source: { file: string; sha256: string }; data: MarketFile }>;
}

/** Deterministic JSON (sorted keys). Mirrored in scripts/build-market-facts.mjs; a test keeps them equal. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`)
    .join(",")}}`;
}

export function sha256Hex(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export const PRICE_PENDING_NOTE_TOPIC = "price-pending";
export const SOC2_PERIOD_TOPIC = "soc2-report-period";

type Env = Record<string, string | undefined>;

export interface MarketFactsOptions {
  /** Expected sha256 of the data; defaults to the generated MARKET_FACTS_SHA256. */
  integrity?: string;
  /** Environment reader; defaults to process.env, read on every call. */
  env?: () => Env;
}

export function createMarketFacts(data: MarketFactsData, opts: MarketFactsOptions = {}) {
  const expected = opts.integrity ?? MARKET_FACTS_SHA256;
  const readEnv = opts.env ?? (() => process.env as Env);
  const integrityOk = sha256Hex(canonicalJson(data)) === expected;
  const gateByKey = new Map(data.gates.map((g) => [g.gate_id, g] as const));
  const globalGates = new Set(data.policy.global_gates);

  const gateKey = (id: string, market: string) => (globalGates.has(id) ? id : id.includes(":") ? id : `${id}:${market}`);

  function killed(key: string): boolean {
    const raw = readEnv().MARKET_FACTS_KILL_SWITCH;
    if (!raw) return false;
    const set = raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    return set.includes("all") || set.includes(key.toLowerCase());
  }

  function gateExpiryMs(g: Gate): number {
    return g.expires_on ? Date.parse(g.expires_on) : Number.NaN;
  }

  function gateOpen(key: string, nowMs: number): boolean {
    if (!integrityOk) return false;
    const g = gateByKey.get(key);
    if (!g || g.status !== "met") return false;
    if (killed(key)) return false;
    if (!g.evidence_sha256 || !g.observed_on) return false;
    const exp = gateExpiryMs(g);
    return Number.isFinite(exp) && nowMs < exp;
  }

  function requiredKeys(kind: string, market: string, own: string[]): string[] {
    const mandatory = data.policy.mandatory_gates_by_kind[kind] ?? [];
    return [...new Set([...mandatory, ...own].map((id) => gateKey(id, market)))];
  }

  const toMs = (now: Date | number) => (typeof now === "number" ? now : now.getTime());

  function qualifier(market: string): string {
    return (gateByKey.get(gateKey("stripe-flow1", market))?.public_price_qualifier ?? "").trim();
  }

  /** The single publication predicate. */
  function isPublished(item: { kind: string; market: string; publish_gates: string[] }, now: Date | number = Date.now()): boolean {
    const nowMs = toMs(now);
    const keys = requiredKeys(item.kind, item.market, item.publish_gates);
    if (!keys.every((k) => gateOpen(k, nowMs))) return false;
    // A price is never served without the approved public qualifier beside it.
    if (item.kind === "price" && qualifier(item.market) === "") return false;
    return true;
  }

  function validUntil(keys: string[]): string | null {
    const times = keys.map((k) => gateExpiryMs(gateByKey.get(k)!)).filter(Number.isFinite);
    return times.length ? new Date(Math.min(...times)).toISOString() : null;
  }

  function getMarketPrice(market: string, now: Date | number = Date.now()) {
    const rec = data.markets[market];
    if (!rec) return null;
    const p = rec.data.price;
    const item = { kind: "price", market, publish_gates: p.publish_gates };
    if (!integrityOk || !isPublished(item, now)) {
      return {
        price_status: "pending_verification" as const,
        billing_currency: p.billing_currency,
        monthly: null,
        annual: null,
        note: p.pending_note,
      };
    }
    return {
      price_status: "published" as const,
      billing_currency: p.billing_currency,
      monthly: p.monthly,
      annual: p.annual,
      applies_to: p.applies_to,
      qualifier: qualifier(market),
      valid_until: validUntil(requiredKeys("price", market, p.publish_gates)),
      source: p.source,
      verified_on: p.verified_on,
      truth_version: p.truth_version,
    };
  }

  function getMarketFacts(market: string, now: Date | number = Date.now()) {
    const rec = data.markets[market];
    if (!rec) return null;
    if (!integrityOk) {
      return { market, market_facts_contract: 1 as const, unavailable: "integrity_check_failed" };
    }
    const f = rec.data;
    const price = getMarketPrice(market, now)!;
    const served = f.facts
      .filter((x) => isPublished(x, now))
      .map((x) => (x.kind === "price" ? { ...x, statement: `${x.statement}. ${qualifier(market)}` } : x));
    const msg = data.policy.withheld_message;
    const topics = [...f.withheld];
    if (price.price_status !== "published") topics.push(PRICE_PENDING_NOTE_TOPIC);
    const soc2 = f.facts.find((x) => x.kind === "attestation");
    if (soc2 && !isPublished(soc2, now)) topics.push(SOC2_PERIOD_TOPIC);
    return {
      market,
      as_of: f.as_of,
      fact_set_version: f.fact_set_version,
      market_facts_contract: f.market_facts_contract,
      release_evidence_version: f.release_evidence_version,
      source: rec.source,
      price,
      facts: served,
      withheld: topics.map((topic) => ({ topic, message: msg })),
    };
  }

  /**
   * Overlay the gated price/compliance state on a COUNTRY_PRICING row. Markets
   * with no market-facts record are returned untouched (byte-identical).
   */
  function applyMarketPricing<R extends { countrySlug: string; compliance: string | null }>(row: R, now: Date | number = Date.now()) {
    const price = getMarketPrice(row.countrySlug, now);
    if (!price) return row;
    const out: Record<string, unknown> = { ...row, price_status: price.price_status, billing_currency: price.billing_currency };
    if (price.price_status === "published") {
      out.growthPriceShort = `$${price.annual!.amount}/user/year, charged once upfront`;
      out.growthPriceMonthly = `$${price.monthly!.amount}/user/month`;
      out.pricingSummaryLine = String(out.pricingSummaryLine ?? "").replace(
        "Growth (price pending verification)",
        `Growth $${price.monthly!.amount}/user/month or $${price.annual!.amount}/user/year upfront`,
      );
      out.currencyCode = "USD";
      out.currencySymbol = "$";
      out.price_applies_to = price.applies_to;
      out.price_qualifier = price.qualifier;
      out.price_valid_until = price.valid_until;
    } else {
      out.price_note = price.note;
    }
    if (row.compliance === null) out.compliance_status = "withheld_unverified";
    return out as R & Record<string, unknown>;
  }

  return {
    integrityOk,
    isPublished,
    getMarketPrice,
    getMarketFacts,
    applyMarketPricing,
    hasMarket: (code: string) => Object.hasOwn(data.markets, code),
  };
}

/** Default instance bound to the generated data. */
const instance = createMarketFacts(MARKET_FACTS_DATA);
export const isPublished = instance.isPublished;
export const getMarketPrice = instance.getMarketPrice;
export const getMarketFacts = instance.getMarketFacts;
export const applyMarketPricing = instance.applyMarketPricing;
export const hasMarketFacts = instance.hasMarket;
export const marketFactsIntegrityOk = instance.integrityOk;

/**
 * product-truth.ts - the ONE reader of the pinned Product Truth export
 * (PLAN-HELLOG-0011; contract: hellocrm PLAN-HGC-0752 / PT-A sections 2, 2d).
 *
 * Rules, all enforced here and nowhere else:
 *   - A fact is read by its PT-A id in its one location. An id absent from its
 *     section and not listed under `withheld` is UNKNOWN. Absent never means a
 *     default, and there is no resolver or scope variant (PT-A forbids both).
 *   - Every read takes the request instant. The caller captures it ONCE per
 *     request (`requestInstant()`) and uses it for the whole response; nothing
 *     here captures a clock at module initialisation.
 *   - A fact is served only inside [effective_from, effective_until). Every
 *     fact is withheld as `stale` once `now >= valid_until` or
 *     `now >= next_transition` of the pinned evaluation.json, and when the
 *     report claims to be generated in the future (clock skew beyond
 *     FUTURE_SKEW_MS), unless a newer pin has been deployed.
 *   - If the generated data does not hash to PRODUCT_TRUTH_SHA256 (a hand edit),
 *     nothing is served.
 *   - A `roadmap` fact is never served as a capability.
 *
 * Trust: the pin is git-reviewed, sha256-pinned and UNSIGNED. Nothing here
 * proves the values match the deployed product, and no value here is an
 * entitlement: a tenant override or grandfather window can differ. Nothing may
 * derive a quota or an authorisation from this module.
 */
import { PRODUCT_TRUTH_DATA, PRODUCT_TRUTH_PIN, PRODUCT_TRUTH_SHA256 } from "../data/product-truth.js";
import { canonicalJson, sha256Hex } from "./market-publication.js";

export type WithheldReason = "draft" | "undecided" | "withdrawn" | "expired" | "future" | "surface_not_approved";
/** PT-A's six reasons plus the consumer-side `stale`. */
export type TruthWithheldReason = WithheldReason | "stale";

export interface PublicFact {
  value: number | string | boolean;
  unit: "count" | "boolean" | "text" | "url" | "percent" | "date";
  plans: string[];
  countries: "global" | string[];
  lifecycle: "live" | "beta" | "pilot" | "roadmap";
  availability?: "available" | "not_available";
  provenance: "enforced" | "decision" | "derived";
  verified_on: string;
  evidence_ref: string;
  effective_from?: string;
  effective_until?: string;
}

export interface ProductTruthData {
  schema_version: string;
  surface: string;
  plans: Record<string, { name: string }>;
  limits: Record<string, PublicFact>;
  features: Record<string, PublicFact>;
  claims: Record<string, PublicFact>;
  urls: Record<string, PublicFact>;
  currencies: Record<string, PublicFact>;
  withheld: { id: string; reason: WithheldReason }[];
  consumers: Record<string, string[]>;
  forbidden_values: { pattern: string; reason: string }[];
}

export interface ProductTruthPin {
  truth_version: string;
  content_digest: string;
  /** sha256 of the verbatim truth.mcp.json bytes. */
  source_sha256: string;
  generated_at: string;
  valid_until: string;
  next_transition: string | null;
}

export type TruthResult =
  | { status: "served"; value: number | string | boolean; unit: PublicFact["unit"]; verified_on: string; lifecycle: PublicFact["lifecycle"] }
  | { status: "withheld"; reason: TruthWithheldReason }
  | { status: "unknown" };

export interface PinInfo {
  truth_version: string;
  source_sha256: string;
  generated_at: string;
  valid_until: string;
  next_transition: string | null;
  integrity_ok: boolean;
  /** `now >= min(valid_until, next_transition)`, or a future-dated report. */
  stale: boolean;
  /** Whole days left before the pin stops being served (0 when stale). */
  days_remaining: number;
  /** True when fewer than ALERT_DAYS remain, or stale. */
  alert: boolean;
}

/** Shown wherever a withheld or unknown result is rendered as prose. */
export const WITHHELD_PROSE = "Not available from this server right now; check the pricing page.";

/** A report generated more than this far in the future is treated as untrustworthy (clock skew). */
export const FUTURE_SKEW_MS = 5 * 60 * 1000;
/** /health alerts when fewer than this many days of validity remain. */
export const ALERT_DAYS = 3;

type Clock = () => Date | number;
const toMs = (now: Date | number) => (typeof now === "number" ? now : now.getTime());
const instantMs = (s: string | null | undefined) => (typeof s === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s) ? Date.parse(s) : Number.NaN);
const ID = /^[a-z][a-z0-9_]*$/;

/**
 * Capture the request instant. Call ONCE at the start of a request and pass the
 * result to every read, so structured output, narrative, prompts and resources
 * of one response agree on the same instant.
 */
export function requestInstant(clock: Clock = Date.now): number {
  return toMs(clock());
}

export interface ProductTruthOptions {
  /** Expected sha256 of {pin, data}; defaults to the generated PRODUCT_TRUTH_SHA256. */
  integrity?: string;
}

function sectionOf(id: string): "limits" | "features" | "claims" | "urls" | "currencies" | null {
  if (/^plans\.[a-z][a-z0-9_]*\.limits\.[a-z][a-z0-9_]*$/.test(id)) return "limits";
  const head = id.split(".")[0];
  return head === "features" || head === "claims" || head === "urls" || head === "currencies" ? head : null;
}

export function createProductTruth(data: ProductTruthData, pin: ProductTruthPin, opts: ProductTruthOptions = {}) {
  const expected = opts.integrity ?? PRODUCT_TRUTH_SHA256;
  const integrityOk = sha256Hex(canonicalJson({ pin, data })) === expected;
  const withheldById = new Map(data.withheld.map((w) => [w.id, w.reason] as const));
  const validUntil = instantMs(pin.valid_until);
  const generatedAt = instantMs(pin.generated_at);
  const nextTransition = pin.next_transition === null ? null : instantMs(pin.next_transition);

  /** The instant at which this pin stops being served: min(valid_until, next_transition). NaN if malformed. */
  function horizonMs(): number {
    if (Number.isNaN(validUntil)) return Number.NaN;
    if (nextTransition === null) return validUntil;
    return Number.isNaN(nextTransition) ? Number.NaN : Math.min(validUntil, nextTransition);
  }

  function pinStale(nowMs: number): boolean {
    const h = horizonMs();
    if (Number.isNaN(h) || Number.isNaN(generatedAt)) return true; // fail closed
    if (generatedAt > nowMs + FUTURE_SKEW_MS) return true; // future-dated report
    return nowMs >= h;
  }

  function known(id: string): boolean {
    const section = sectionOf(id);
    return withheldById.has(id) || (section !== null && Object.hasOwn(data[section], id));
  }

  /** Read one fact by its PT-A id. `now` is the request instant. */
  function fact(id: string, now: Date | number): TruthResult {
    if (typeof id !== "string" || !known(id)) return { status: "unknown" };
    const nowMs = toMs(now);
    if (!integrityOk || pinStale(nowMs)) return { status: "withheld", reason: "stale" };
    const section = sectionOf(id);
    const f = section ? data[section][id] : undefined;
    if (!f) return { status: "withheld", reason: withheldById.get(id) ?? "draft" };
    if (f.effective_from !== undefined) {
      const from = instantMs(f.effective_from);
      if (Number.isNaN(from)) return { status: "withheld", reason: "stale" };
      if (nowMs < from) return { status: "withheld", reason: "future" };
    }
    if (f.effective_until !== undefined) {
      const until = instantMs(f.effective_until);
      if (Number.isNaN(until)) return { status: "withheld", reason: "stale" };
      if (nowMs >= until) return { status: "withheld", reason: "expired" };
    }
    // A planned item is never stated as something the product does.
    if (f.lifecycle === "roadmap") return { status: "withheld", reason: "future" };
    return { status: "served", value: f.value, unit: f.unit, verified_on: f.verified_on, lifecycle: f.lifecycle };
  }

  /** `plans.<planId>.limits.<key>`. An id the pin lacks is unknown. */
  function limit(planId: string, key: string, now: Date | number): TruthResult {
    if (!ID.test(planId) || !ID.test(key)) return { status: "unknown" };
    return fact(`plans.${planId}.limits.${key}`, now);
  }

  /** The PT-A reason an id is listed under `withheld`, or null. Static: it does not read the clock. */
  function withheldReason(id: string): WithheldReason | null {
    return withheldById.get(id) ?? null;
  }

  function planName(planId: string): string | null {
    return Object.hasOwn(data.plans, planId) ? data.plans[planId]!.name : null;
  }

  function pinInfo(now: Date | number): PinInfo {
    const nowMs = toMs(now);
    const stale = !integrityOk || pinStale(nowMs);
    const h = horizonMs();
    const daysRemaining = stale || Number.isNaN(h) ? 0 : Math.floor((h - nowMs) / 86400000);
    return {
      truth_version: pin.truth_version,
      source_sha256: pin.source_sha256,
      generated_at: pin.generated_at,
      valid_until: pin.valid_until,
      next_transition: pin.next_transition,
      integrity_ok: integrityOk,
      stale,
      days_remaining: daysRemaining,
      alert: stale || daysRemaining < ALERT_DAYS,
    };
  }

  /** Every read of one response bound to the same instant. */
  function at(now: Date | number) {
    const t = toMs(now);
    return {
      now: t,
      fact: (id: string) => fact(id, t),
      limit: (planId: string, key: string) => limit(planId, key, t),
      planName,
      withheldReason,
      pinInfo: () => pinInfo(t),
    };
  }

  return {
    fact,
    limit,
    withheldReason,
    planName,
    pinInfo,
    at,
    /** Every id the pin lists, served or withheld (for the ratchet and the harness). */
    ids: (): string[] => [
      ...(["limits", "features", "claims", "urls", "currencies"] as const).flatMap((s) => Object.keys(data[s])),
      ...data.withheld.map((w) => w.id),
    ],
    forbiddenValues: () => data.forbidden_values.map((f) => f.pattern),
    consumersOf: (id: string) => data.consumers[id] ?? [],
    truthVersion: () => pin.truth_version,
  };
}

/** The deployed reader: the generated pin. Holds data only; no clock is captured here. */
export const productTruth = createProductTruth(PRODUCT_TRUTH_DATA, PRODUCT_TRUTH_PIN);

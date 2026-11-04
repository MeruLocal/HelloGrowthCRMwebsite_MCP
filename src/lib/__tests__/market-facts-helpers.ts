import { MARKET_FACTS_DATA } from "../../data/market-facts.js";
import { canonicalJson, sha256Hex, type Gate, type MarketFactsData } from "../market-publication.js";

export const EVIDENCE = sha256Hex("test-evidence");
export const QUALIFIER = "List price for new subscriptions; the final amount is confirmed at checkout.";

export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export function metGate(gate_id: string, market: string, expires_on: string, extra: Partial<Gate> = {}): Gate {
  return {
    gate_id,
    market,
    status: "met",
    evidence_ref: `test-evidence/${gate_id}`,
    evidence_sha256: EVIDENCE,
    observed_on: "2026-11-04",
    approver: "test-approver",
    expires_on,
    ...(gate_id.startsWith("stripe-flow1") ? { public_price_qualifier: QUALIFIER } : {}),
    ...extra,
  };
}

/** The generated data with the named gates replaced, plus the matching integrity digest. */
export function withGates(replace: Gate[]): { data: MarketFactsData; integrity: string } {
  const data = clone(MARKET_FACTS_DATA);
  for (const g of replace) {
    const i = data.gates.findIndex((x) => x.gate_id === g.gate_id);
    if (i >= 0) data.gates[i] = g;
    else data.gates.push(g);
  }
  return { data, integrity: sha256Hex(canonicalJson(data)) };
}

export const ALL_UK_MET = (until = "2027-01-31T00:00:00Z") => [
  metGate("website-deploy:uk", "uk", until),
  metGate("stripe-flow1:uk", "uk", until),
  metGate("soc2-scope", "global", until),
];

/**
 * truth-template.ts - plan limits in served text are TEMPLATES over the Product Truth reader
 * (PLAN-HELLOG-0011 PR-B). Source text never carries a limit number; it carries a token:
 *
 *     "Yes - up to {{plans.free.limits.leads}} leads, forever"
 *
 * and the token is resolved per request, against one captured instant, by `renderTruth`.
 * Nothing here runs at module initialisation, so no reader result outlives its request.
 *
 * Rendering rules (PLAN-HELLOG-0011 sections 2b, 2c1):
 *   - served + a string that is exactly one token  -> the typed value (number or "unlimited")
 *   - served + a token inside prose                 -> String(value)
 *   - withheld / stale / unknown + a token inside prose -> the WHOLE string becomes WITHHELD_PROSE,
 *       so a sentence never keeps half a number
 *   - withheld / stale / unknown + an exact-token string -> null (the named compatibility exception)
 *   - an id that is not a plan-limit id is left untouched and is reported by `tokenIds` so the
 *       build-time test (AC-B6b) fails on it.
 */
import { WITHHELD_PROSE, type TruthResult } from "./product-truth.js";

const TOKEN_G = /\{\{\s*(plans\.[a-z][a-z0-9_]*\.limits\.[a-z][a-z0-9_]*)\s*\}\}/g;
const ANY_TOKEN_G = /\{\{[^}]*\}\}/g;
const EXACT = /^\{\{\s*(plans\.[a-z][a-z0-9_]*\.limits\.[a-z][a-z0-9_]*)\s*\}\}$/;

/** The token for a limit, for source text and fixtures. */
export const limitToken = (planId: string, key: string): string => `{{plans.${planId}.limits.${key}}}`;

/** The minimal reader surface the renderer needs (a request-bound `productTruth.at(now)`). */
export interface TruthAt {
  fact: (id: string) => TruthResult;
}

/** Every plan-limit id named by a token anywhere in `text` (for the build-time check). */
export function tokenIds(text: string): string[] {
  return [...text.matchAll(TOKEN_G)].map((m) => m[1]!);
}

/** Every `{{...}}` in `text` that is NOT a well-formed plan-limit token (always a mistake). */
export function malformedTokens(text: string): string[] {
  return (text.match(ANY_TOKEN_G) ?? []).filter((t) => !new RegExp(EXACT.source).test(t));
}

function renderString(s: string, at: TruthAt): string | number | null {
  if (!s.includes("{{")) return s;
  const exact = EXACT.exec(s);
  if (exact) {
    const r = at.fact(exact[1]!);
    return r.status === "served" ? r.value as number | string : null;
  }
  let withheld = false;
  const out = s.replace(TOKEN_G, (_m, id: string) => {
    const r = at.fact(id);
    if (r.status !== "served") {
      withheld = true;
      return "";
    }
    return String(r.value);
  });
  return withheld ? WITHHELD_PROSE : out;
}

/** Deep-render every token in a string, array or plain object. Pure; never mutates its input. */
export function renderTruth<T>(value: T, at: TruthAt): T {
  if (typeof value === "string") return renderString(value, at) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => renderTruth(v, at)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = renderTruth(v, at);
    return out as T;
  }
  return value;
}

/**
 * Zero-result contract (PLAN-HELLOG-0003, AC-04).
 *
 * A search that finds nothing must never read as "the product lacks it". This
 * server holds a bundled snapshot of the website, so "no entry" means "this
 * server has no documented entry" and nothing more. A capability the audit
 * PROVED is missing is not a zero result at all: it is an entry with
 * status "not_available" (see src/data/claim-overrides.ts).
 */

export const NO_ENTRY_SENTENCE =
  "No entry in this server's data matched. This does not mean the product lacks it; it means this server has no documented entry.";

export const NOT_THE_SAME_ITEM = "Suggestions are similar names, not the same item.";

/** Levenshtein distance, early-exit above `max`. */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let last = prev[0]!;
    prev[0] = i;
    let rowMin = prev[0]!;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]!;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
      last = tmp;
      if (prev[j]! < rowMin) rowMin = prev[j]!;
    }
    if (rowMin > max) return max + 1;
  }
  return prev[b.length]!;
}

/** Up to `limit` candidates within edit distance 2 of the query. Never a substring free-for-all. */
export function didYouMean(query: string, candidates: readonly string[], limit = 3): string[] {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return [];
  const scored: { c: string; d: number }[] = [];
  for (const c of candidates) {
    const d = editDistance(q, c.toLowerCase(), 2);
    if (d <= 2) scored.push({ c, d });
  }
  return scored
    .sort((x, y) => x.d - y.d || x.c.localeCompare(y.c))
    .slice(0, limit)
    .map((s) => s.c);
}

export interface ZeroResultOptions {
  query: string;
  suggestedTools: readonly string[];
  candidates?: readonly string[];
}

export function zeroResult(opts: ZeroResultOptions): Record<string, unknown> {
  const suggestions = opts.candidates ? didYouMean(opts.query, opts.candidates) : [];
  return {
    matched: false,
    guidance: NO_ENTRY_SENTENCE,
    suggested_tools: [...opts.suggestedTools],
    ...(suggestions.length ? { did_you_mean: suggestions, did_you_mean_note: NOT_THE_SAME_ITEM } : {}),
  };
}

/**
 * Paging for large list tools, plus a central size backstop.
 *
 * List tools used to return their whole dataset: integrations_list was ~200k
 * characters (~50k tokens) for a call with no arguments. Clients that cap tool
 * results (often ~25k characters) cut it silently, so the agent saw a partial
 * list as if it were complete. Now each list returns at most `limit` items
 * (default 50, max 200) and stops early before ~24k characters, with
 * `next_cursor` / `has_more` telling the agent how to continue.
 */

import { z } from "zod";

import { fail, type McpCallResult, type RegisteredTool } from "./tool-types.js";

export const DEFAULT_PAGE_LIMIT = 50;
export const MAX_PAGE_LIMIT = 200;
export const DEFAULT_MAX_CHARS = 24_000;
export const CENTRAL_MAX_CHARS = 100_000;

export class BadCursorError extends Error {
  constructor() {
    super("Invalid cursor");
    this.name = "BadCursorError";
  }
}

export function encodeCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ o: offset }), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): number {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as { o?: unknown };
    if (typeof parsed.o === "number" && Number.isInteger(parsed.o) && parsed.o >= 0) return parsed.o;
  } catch {
    /* fall through */
  }
  throw new BadCursorError();
}

export interface Page<T> {
  items: T[];
  total: number;
  next_cursor: string | null;
  has_more: boolean;
  truncated_note?: string;
}

export function paginate<T>(
  items: readonly T[],
  opts: { cursor?: string; limit?: number; maxChars?: number } = {},
): Page<T> {
  const offset = opts.cursor ? decodeCursor(opts.cursor) : 0;
  if (offset > items.length) throw new BadCursorError();
  const limit = Math.min(Math.max(opts.limit ?? DEFAULT_PAGE_LIMIT, 1), MAX_PAGE_LIMIT);
  const maxChars = opts.maxChars ?? DEFAULT_MAX_CHARS;

  const out: T[] = [];
  let chars = 0;
  let stoppedForSize = false;
  for (let i = offset; i < items.length && out.length < limit; i += 1) {
    const size = JSON.stringify(items[i]).length + 1;
    // Always return at least one item so paging can make progress.
    if (out.length > 0 && chars + size > maxChars) {
      stoppedForSize = true;
      break;
    }
    out.push(items[i]!);
    chars += size;
  }
  const next = offset + out.length;
  const hasMore = next < items.length;
  return {
    items: out,
    total: items.length,
    next_cursor: hasMore ? encodeCursor(next) : null,
    has_more: hasMore,
    ...(stoppedForSize
      ? { truncated_note: `Page stopped at ${out.length} items to stay under ~${maxChars} characters; pass next_cursor for more.` }
      : {}),
  };
}

const PAGING_PROPS = {
  cursor: {
    type: "string",
    description: "Opaque cursor from a previous call's next_cursor. Omit for the first page.",
  },
  limit: {
    type: "integer",
    minimum: 1,
    maximum: MAX_PAGE_LIMIT,
    default: DEFAULT_PAGE_LIMIT,
    description: `Items per page (default ${DEFAULT_PAGE_LIMIT}, max ${MAX_PAGE_LIMIT}). Pages also stop before ~${DEFAULT_MAX_CHARS} characters.`,
  },
};

const PAGING_NOTE =
  " Results are paged: the reply's `page` object carries total, has_more and next_cursor; pass cursor=next_cursor to get the next page.";

/**
 * Wrap a list tool so its main array (`arrayKey` in the JSON payload) is paged.
 * Existing arguments and filters keep working; cursor/limit are additive.
 */
export function withPaging(tool: RegisteredTool, arrayKey: string): RegisteredTool {
  const base = tool.schema;
  if (!(base instanceof z.ZodObject)) throw new Error(`${tool.definition.name}: paging needs an object schema`);
  if ("cursor" in base.shape || "limit" in base.shape) {
    throw new Error(`${tool.definition.name}: already has cursor/limit`);
  }
  const schema = base.extend({
    cursor: z.string().optional(),
    limit: z.number().int().min(1).max(MAX_PAGE_LIMIT).default(DEFAULT_PAGE_LIMIT),
  });

  return {
    definition: {
      ...tool.definition,
      description: tool.definition.description + PAGING_NOTE,
      inputSchema: {
        ...tool.definition.inputSchema,
        properties: { ...tool.definition.inputSchema.properties, ...PAGING_PROPS },
      },
    },
    schema,
    async handle(args: unknown): Promise<McpCallResult> {
      const { cursor, limit, ...rest } = args as { cursor?: string; limit: number } & Record<string, unknown>;
      if (cursor !== undefined) {
        try {
          decodeCursor(cursor);
        } catch {
          return fail("Invalid cursor. Use the next_cursor value from the previous page, or omit cursor for page 1.");
        }
      }
      const result = await tool.handle(rest);
      if (result.isError) return result;
      const first = result.content[0];
      if (!first || first.type !== "text") return result;
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(first.text) as Record<string, unknown>;
      } catch {
        return result;
      }
      const list = payload[arrayKey];
      if (!Array.isArray(list)) return result;
      let page: Page<unknown>;
      try {
        page = paginate(list, { cursor, limit });
      } catch {
        return fail("Invalid cursor. Use the next_cursor value from the previous page, or omit cursor for page 1.");
      }
      const { items, ...meta } = page;
      // Paging metadata lives under `page` because several payloads already
      // use `total` for their own (pre-filter) count.
      const out = { ...payload, [arrayKey]: items, page: { returned: items.length, ...meta } };
      return { ...result, content: [{ type: "text", text: JSON.stringify(out, null, 2) }, ...result.content.slice(1)] };
    },
  };
}

const CAP_NOTE = "truncated by the server; narrow the request or use paging arguments (limit / cursor)";

/**
 * Cap one text block. JSON text is never cut mid-token: the largest array is
 * trimmed at an item boundary, with a `_truncated` note; if that cannot fit, a
 * small valid JSON object says so. Non-JSON text keeps the plain cut + note.
 */
function capText(text: string, maxChars: number): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return text.slice(0, maxChars) + `\n…[truncated by the server at ${maxChars} characters; narrow the request or use paging arguments]`;
  }
  const render = (v: unknown): string => JSON.stringify(v, null, 2);
  const fallback = (): string =>
    render({ _truncated: true, original_chars: text.length, note: CAP_NOTE });

  // Locate the largest array: the value itself or a top-level property.
  let key: string | null = null;
  let arr: unknown[] | null = null;
  if (Array.isArray(parsed)) arr = parsed;
  else if (parsed && typeof parsed === "object") {
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(v) && (!arr || v.length > arr.length)) { key = k; arr = v; }
    }
  }
  if (!arr || arr.length === 0) return fallback();

  const build = (n: number): string => {
    const kept = arr!.slice(0, n);
    const meta = { _truncated: true, returned: n, original_count: arr!.length, note: CAP_NOTE };
    return render(key === null ? { items: kept, ...meta } : { ...(parsed as Record<string, unknown>), [key]: kept, ...meta });
  };
  let lo = 0;
  let hi = arr.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (build(mid).length <= maxChars) lo = mid;
    else hi = mid - 1;
  }
  const out = build(lo);
  return out.length <= maxChars ? out : fallback();
}

/** Backstop for every tool: cut any text block over CENTRAL_MAX_CHARS, with a note. */
export function capToolResult(result: McpCallResult, maxChars = CENTRAL_MAX_CHARS): McpCallResult {
  if (!result.content.some((c) => c.type === "text" && c.text.length > maxChars)) return result;
  return {
    ...result,
    content: result.content.map((c) =>
      c.type === "text" && c.text.length > maxChars ? { ...c, text: capText(c.text, maxChars) } : c,
    ),
  };
}

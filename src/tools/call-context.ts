/**
 * Per-call context for tool handlers.
 *
 * Tool handlers take only their parsed arguments, so they cannot tell an
 * anonymous HTTP caller from an authenticated session. Some decisions need to
 * (whether a report may be written to disk, whether a server-side file may be
 * read, how much outbound crawling a caller may trigger). buildServer() runs
 * every tools/call inside runWithCallContext(); handlers read it with
 * getCallContext().
 *
 * Fail closed: code that runs outside any context (a direct call from a test, a
 * script, a future code path that forgets the wrapper) is treated as PUBLIC.
 */

import { AsyncLocalStorage } from "node:async_hooks";

export interface CallContext {
  /** True only for a session that presented a valid admin token. */
  authorized: boolean;
  /** Rate-limit key of the caller (HTTP only). Never logged with arguments. */
  clientIp?: string;
}

const PUBLIC_CONTEXT: CallContext = Object.freeze({ authorized: false });

const storage = new AsyncLocalStorage<CallContext>();

export function runWithCallContext<T>(ctx: CallContext, fn: () => T): T {
  return storage.run({ authorized: ctx.authorized === true, clientIp: ctx.clientIp }, fn);
}

export function getCallContext(): CallContext {
  return storage.getStore() ?? PUBLIC_CONTEXT;
}

/**
 * Input properties that name a path or file on the server. They are refused
 * for public callers at runtime, and removed from the inputSchema an
 * unauthenticated tools/list returns, so a public client is never invited to
 * send one.
 */
export const OPERATOR_ONLY_PROPERTIES: ReadonlySet<string> = new Set([
  "logPath",
  "robotsTxtPath",
  "saveToDisk",
  "filename",
]);

/** A copy of an inputSchema with operator-only properties removed. */
export function publicInputSchema<T extends { properties: Record<string, unknown>; required?: string[] }>(
  schema: T,
): T {
  const keys = Object.keys(schema.properties);
  if (!keys.some((k) => OPERATOR_ONLY_PROPERTIES.has(k))) return schema;
  const properties = Object.fromEntries(
    Object.entries(schema.properties).filter(([k]) => !OPERATOR_ONLY_PROPERTIES.has(k)),
  );
  const out = { ...schema, properties };
  if (schema.required) out.required = schema.required.filter((k) => !OPERATOR_ONLY_PROPERTIES.has(k));
  return out;
}

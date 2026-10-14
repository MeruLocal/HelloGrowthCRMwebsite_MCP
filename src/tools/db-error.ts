/**
 * Generic failure for public Supabase-backed read tools.
 *
 * Supabase/Postgres error text ("relation \"x\" does not exist", "column
 * y.z does not exist", missing-env messages) is schema and configuration
 * enumeration for an anonymous caller. Log it server-side; return a fixed
 * message. Same pattern as newsletter_get_stats.
 */

import { logger } from "../utils/logger.js";
import { fail, type McpCallResult } from "./tool-types.js";

export const DB_UNAVAILABLE = "The content service is unavailable right now. The error was logged.";

export function dbError(tool: string, err: unknown): McpCallResult {
  const message =
    err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : String(err);
  logger.error(`${tool}: database error`, { err: message });
  return fail(DB_UNAVAILABLE);
}

/** PostgREST "no rows" for .single(): a real not-found, safe to say so. */
export function isNotFound(err: unknown): boolean {
  return Boolean(err && typeof err === "object" && (err as { code?: string }).code === "PGRST116");
}

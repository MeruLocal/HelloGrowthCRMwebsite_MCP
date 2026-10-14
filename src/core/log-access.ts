/**
 * Gate for server-side file reads requested by tool arguments.
 *
 * analyze_access_logs, export_bot_report, scan_website_bots and
 * suggest_bot_policy accept `logPath`; list_allowed_bots and list_blocked_bots
 * accept `robotsTxtPath`. All of them used to pass the value straight to
 * readFile and echo the OS error back, which made every public caller a reader
 * of the server's disk (and an existence oracle through ENOENT).
 *
 * Rules:
 *   - No path given → the operator's DEFAULT_ACCESS_LOG (unchanged behaviour),
 *     reported by its label, never by the path.
 *   - Public caller passes a path → denied.
 *   - Authorised caller → allowed only inside LOG_DIR (realpath on both sides,
 *     so `..` and symlink escapes are caught). With LOG_DIR unset, authorised
 *     callers are denied too: an explicit directory is the only opt-in.
 *   - Missing file and out-of-directory file give the same denial, so the reply
 *     is not an oracle.
 */

import { readFile, realpath } from "node:fs/promises";
import { resolve, sep } from "node:path";

import { getCallContext } from "../tools/call-context.js";
import { logger } from "../utils/logger.js";

export type ResolvedPath =
  | { kind: "none" }
  | { kind: "path"; path: string; label: string }
  | { kind: "denied"; message: string };

export const LOG_PATH_DENIED =
  "logPath is not available on the public endpoint. Send the log content as logText instead.";
export const ROBOTS_PATH_DENIED =
  "robotsTxtPath is not available on the public endpoint. Send the robots.txt content as robotsTxt instead.";
export const READ_FAILED = "Could not read the log file.";
export const ROBOTS_READ_FAILED = "Could not read the robots.txt file.";

async function insideLogDir(requested: string): Promise<string | null> {
  const dir = process.env.LOG_DIR?.trim();
  if (!dir) return null;
  try {
    const dirReal = await realpath(resolve(dir));
    const fileReal = await realpath(resolve(dirReal, requested));
    return fileReal.startsWith(dirReal + sep) ? fileReal : null;
  } catch {
    return null;
  }
}

async function resolveRequested(
  requested: string | undefined,
  denied: string,
  fallbackEnv: string | undefined,
  fallbackLabel: string,
): Promise<ResolvedPath> {
  if (requested === undefined || requested === "") {
    const fallback = fallbackEnv ? process.env[fallbackEnv]?.trim() : undefined;
    return fallback ? { kind: "path", path: fallback, label: fallbackLabel } : { kind: "none" };
  }
  if (!getCallContext().authorized) return { kind: "denied", message: denied };
  const safe = await insideLogDir(requested);
  if (!safe) return { kind: "denied", message: denied };
  return { kind: "path", path: safe, label: "LOG_DIR" };
}

/** Resolve a caller-supplied `logPath`. */
export function resolveLogPath(requested: string | undefined): Promise<ResolvedPath> {
  return resolveRequested(requested, LOG_PATH_DENIED, "DEFAULT_ACCESS_LOG", "DEFAULT_ACCESS_LOG");
}

/** Resolve a caller-supplied `robotsTxtPath` (no default file). */
export function resolveRobotsPath(requested: string | undefined): Promise<ResolvedPath> {
  return resolveRequested(requested, ROBOTS_PATH_DENIED, undefined, "");
}

/** Read a resolved file. Errors are logged server-side and never returned. */
export async function readResolved(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch (err) {
    logger.warn("operator file read failed", { code: (err as NodeJS.ErrnoException).code });
    return null;
  }
}

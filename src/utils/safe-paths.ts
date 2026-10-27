/**
 * Filesystem confinement for tools reachable by anonymous callers.
 * Callers may only name files inside an operator-chosen directory; with no
 * directory configured, path arguments are refused (inline `logText` still works).
 */

import { basename, resolve, sep } from "node:path";

/** Resolve a caller-supplied log path inside MCP_LOG_DIR, or throw a path-free error. */
export function resolveLogPath(requested: string): string {
  const dirEnv = process.env.MCP_LOG_DIR;
  if (!dirEnv) {
    throw new Error("Reading log files by path is disabled on this server. Pass the log content as `logText`.");
  }
  const dir = resolve(dirEnv);
  const target = resolve(dir, requested);
  if (target !== dir && !target.startsWith(dir + sep)) {
    throw new Error("That log path is outside the allowed log directory.");
  }
  return target;
}

const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

/** A bare file name only: no separators, no traversal. */
export function assertSafeFilename(name: string): string {
  if (name !== basename(name) || !SAFE_NAME.test(name) || name.includes("..")) {
    throw new Error("filename must be a plain file name (letters, digits, . _ -).");
  }
  return name;
}

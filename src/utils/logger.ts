/**
 * Tiny stderr logger.
 *
 * MCP servers must keep stdout reserved for protocol traffic, so all logging
 * goes to stderr. Level is controlled by the LOG_LEVEL env var.
 */

type Level = "error" | "warn" | "info" | "debug";

const LEVELS: Record<Level, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

function currentLevel(): number {
  const raw = (process.env.LOG_LEVEL ?? "info").toLowerCase() as Level;
  return LEVELS[raw] ?? LEVELS.info;
}

function emit(level: Level, msg: string, meta?: unknown): void {
  if (LEVELS[level] > currentLevel()) return;
  const time = new Date().toISOString();
  const line = meta
    ? `${time} ${level.toUpperCase()} ${msg} ${safeStringify(meta)}`
    : `${time} ${level.toUpperCase()} ${msg}`;
  process.stderr.write(line + "\n");
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export const logger = {
  error: (m: string, meta?: unknown) => emit("error", m, meta),
  warn: (m: string, meta?: unknown) => emit("warn", m, meta),
  info: (m: string, meta?: unknown) => emit("info", m, meta),
  debug: (m: string, meta?: unknown) => emit("debug", m, meta),
};

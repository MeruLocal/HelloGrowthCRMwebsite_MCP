/**
 * Access-log parser.
 *
 * Supports both Common Log Format (CLF) and the Combined Log Format used by
 * Apache, Nginx and CloudFront. We deliberately keep the regex permissive so
 * minor format variations (extra fields appended) still parse.
 *
 *   127.0.0.1 - - [10/Oct/2025:13:55:36 +0000] "GET /index.html HTTP/1.1" 200 2326 "-" "Mozilla/5.0 ..."
 */

import { readFile } from "node:fs/promises";
import type { LogEntry } from "../utils/types.js";

const COMBINED = new RegExp(
  // ip                              - -      [timestamp]                "method path proto" status bytes "referer" "user-agent"
  /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) [^"]*" (\d{3}) (\d+|-) "([^"]*)" "([^"]*)"/,
);

/** Parse a single line. Returns null if it isn't a recognisable access log line. */
export function parseLine(line: string): LogEntry | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const m = COMBINED.exec(trimmed);
  if (!m) return null;

  const [, ip, ts, method, path, status, bytes, referer, ua] = m;
  return {
    ip: ip ?? "",
    timestamp: ts ?? "",
    method: method ?? "",
    path: path ?? "",
    status: status ? Number.parseInt(status, 10) : 0,
    bytes: bytes && bytes !== "-" ? Number.parseInt(bytes, 10) : 0,
    referer: referer === "-" ? "" : (referer ?? ""),
    userAgent: ua ?? "",
    raw: trimmed,
  };
}

/** Parse a whole file. Skips unparseable lines silently but counts them. */
export async function parseAccessLogFile(path: string): Promise<{
  entries: LogEntry[];
  skipped: number;
}> {
  const text = await readFile(path, "utf8");
  return parseAccessLog(text);
}

export function parseAccessLog(text: string): {
  entries: LogEntry[];
  skipped: number;
} {
  const entries: LogEntry[] = [];
  let skipped = 0;
  for (const raw of text.split(/\r?\n/)) {
    const e = parseLine(raw);
    if (e) entries.push(e);
    else if (raw.trim()) skipped += 1;
  }
  return { entries, skipped };
}

/** Convert a CLF-style timestamp to ISO 8601, if possible. */
export function clfToIso(ts: string): string {
  // 10/Oct/2025:13:55:36 +0000
  const m = /^(\d{2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) ([+-]\d{4})$/.exec(
    ts,
  );
  if (!m) return ts;
  const months: Record<string, string> = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };
  const [, dd, mon, yyyy, hh, mm, ss, tz] = m;
  const monthNum = months[mon ?? ""] ?? "01";
  const tzFmt = tz ? `${tz.slice(0, 3)}:${tz.slice(3)}` : "+00:00";
  return `${yyyy}-${monthNum}-${dd}T${hh}:${mm}:${ss}${tzFmt}`;
}

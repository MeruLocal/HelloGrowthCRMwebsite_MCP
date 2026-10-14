/**
 * HTTP transport guards for the MCP endpoint: Host/Origin allowlists (DNS
 * rebinding), request-body cap, and the settings for the session cap.
 *
 * Why a pre-check here rather than only the SDK's enableDnsRebindingProtection:
 * the SDK compares the Host header verbatim, port included, so "localhost"
 * would reject "localhost:3008". This check ignores the port for entries that
 * do not name one, runs on GET/POST/DELETE alike, and rejects before a Server
 * is ever built.
 */

export interface HttpGuardConfig {
  /** Lower-cased host entries, each optionally with :port. */
  allowedHosts: string[];
  /** Origins (scheme://host[:port]); null = any origin ("*"). */
  allowedOrigins: string[] | null;
  maxBodyBytes: number;
  maxSessions: number;
  sessionIdleMs: number;
}

export const DEFAULT_ALLOWED_HOSTS = "localhost,127.0.0.1,[::1],mcp.hellogrowthcrm.com";
export const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost",
  "https://localhost",
  "http://127.0.0.1",
  "https://127.0.0.1",
  "http://[::1]",
  "https://[::1]",
  "https://mcp.hellogrowthcrm.com",
].join(",");

function list(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function intEnv(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const n = Number.parseInt(env[name] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function httpGuardConfigFromEnv(env: NodeJS.ProcessEnv = process.env): HttpGuardConfig {
  const origins = env.MCP_ALLOWED_ORIGINS?.trim() || DEFAULT_ALLOWED_ORIGINS;
  return {
    allowedHosts: list(env.MCP_ALLOWED_HOSTS?.trim() || DEFAULT_ALLOWED_HOSTS),
    allowedOrigins: origins === "*" ? null : list(origins),
    maxBodyBytes: intEnv(env, "MCP_MAX_BODY_BYTES", 1024 * 1024),
    maxSessions: intEnv(env, "MCP_MAX_SESSIONS", 1000),
    sessionIdleMs: intEnv(env, "MCP_SESSION_IDLE_MS", 30 * 60 * 1000),
  };
}

/** Split "host:port" / "[v6]:port" into its parts (lower-cased host). */
function splitHostPort(value: string): { host: string; port: string | null } {
  const v = value.trim().toLowerCase();
  const bracket = /^(\[[^\]]+\])(?::(\d+))?$/.exec(v);
  if (bracket) return { host: bracket[1]!, port: bracket[2] ?? null };
  const idx = v.lastIndexOf(":");
  if (idx > -1 && v.indexOf(":") === idx) return { host: v.slice(0, idx), port: v.slice(idx + 1) };
  return { host: v, port: null };
}

function entryMatches(entry: string, value: string): boolean {
  const e = splitHostPort(entry);
  const v = splitHostPort(value);
  return e.host === v.host && (e.port === null || e.port === v.port);
}

export function isAllowedHost(hostHeader: string | undefined, cfg: HttpGuardConfig): boolean {
  if (!hostHeader) return false;
  return cfg.allowedHosts.some((entry) => entryMatches(entry, hostHeader));
}

/** A request with no Origin (server-side MCP clients) passes. */
export function isAllowedOrigin(originHeader: string | undefined, cfg: HttpGuardConfig): boolean {
  if (originHeader === undefined) return true;
  if (cfg.allowedOrigins === null) return true;
  let origin: URL;
  try {
    origin = new URL(originHeader);
  } catch {
    return false; // includes the literal "null" origin
  }
  return cfg.allowedOrigins.some((entry) => {
    let allowed: URL;
    try {
      allowed = new URL(entry);
    } catch {
      return false;
    }
    if (allowed.protocol !== origin.protocol) return false;
    if (allowed.hostname !== origin.hostname) return false;
    return allowed.port === "" || allowed.port === origin.port;
  });
}

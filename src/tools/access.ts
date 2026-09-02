/**
 * Public vs privileged tool surface (finding C0, 2026-09-01).
 *
 * Why this file exists: this server talks to Supabase with
 * SUPABASE_SERVICE_ROLE_KEY (src/lib/supabase.ts), which bypasses row-level
 * security completely. Until this change, every one of the 88 tools was served
 * over the unauthenticated public endpoint, so an anonymous caller could read
 * newsletter subscribers and contact-form submissions (personal data) and
 * write to production content tables.
 *
 * The rule now: the public endpoint serves only the read-only product-knowledge
 * and bot-governance tools. Anything that writes, or that reads personal data,
 * requires a bearer token.
 *
 * Fail-closed by design: when MCP_ADMIN_TOKEN is unset, the privileged tools
 * are not merely unauthenticated — they are not served at all. A missing env
 * var can therefore never re-open the hole.
 */

import { timingSafeEqual } from "node:crypto";

import { TOOL_ANNOTATIONS } from "./annotations.js";

/**
 * Read-only tools that nevertheless return personal data. These are read-only
 * in the MCP-annotation sense (they change nothing), so they are NOT caught by
 * the readOnlyHint sweep below and have to be named explicitly.
 */
export const PII_READ_TOOLS: readonly string[] = [
  "newsletter_get_subscribers", // subscriber email addresses
  "forms_list_submissions", // contact-form submissions
  "forms_get_submission", // a single submission, in full
  "forms_export_csv", // bulk export of the above
];

/**
 * Every tool that must never be reachable without a token: all write-capable
 * tools (readOnlyHint: false) plus the personal-data readers above.
 *
 * Derived from TOOL_ANNOTATIONS rather than hand-listed, so a new write tool is
 * gated the moment it is annotated — there is no second list to forget.
 */
export const PRIVILEGED_TOOLS: ReadonlySet<string> = new Set<string>([
  ...Object.entries(TOOL_ANNOTATIONS)
    .filter(([, annotation]) => annotation.readOnlyHint === false)
    .map(([name]) => name),
  ...PII_READ_TOOLS,
]);

export function isPrivileged(toolName: string): boolean {
  return PRIVILEGED_TOOLS.has(toolName);
}

/** The configured admin token, or undefined when the deployment has none. */
export function adminToken(): string | undefined {
  const token = process.env.MCP_ADMIN_TOKEN?.trim();
  return token && token.length > 0 ? token : undefined;
}

export function adminTokenConfigured(): boolean {
  return adminToken() !== undefined;
}

/**
 * Constant-time comparison of the request's Authorization header against the
 * configured token. Returns false when no token is configured, which is what
 * makes the default fail-closed.
 */
export function isAuthorized(authorizationHeader: string | undefined): boolean {
  const expected = adminToken();
  if (!expected) return false;
  if (!authorizationHeader) return false;

  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
  const presented = match?.[1]?.trim();
  if (!presented) return false;

  const a = Buffer.from(presented, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Tool names served to an unauthenticated caller. */
export function publicToolNames(allToolNames: Iterable<string>): string[] {
  return [...allToolNames].filter((name) => !isPrivileged(name));
}

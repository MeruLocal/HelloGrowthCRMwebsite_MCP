/**
 * Shared types and helpers for the HelloGrowthCRM **CRM product** MCP tools.
 *
 * ⚠️  These tools belong to the authenticated CRM MCP server deployed at
 *     `mcp.hellogrowthcrm.com`, NOT to the public bot-crawler / website-data
 *     MCP server in `src/`. They are intentionally kept out of `src/tools/`
 *     so they are never registered on the public, unauthenticated server.
 *
 * Every tool receives a `CrmToolContext` carrying the caller's API-key scope,
 * tenant, and PII-masking preference. The hosting CRM backend is responsible
 * for authenticating the Bearer API key and constructing this context before
 * dispatch. Integration points that depend on the live CRM schema are marked
 * with `// INTEGRATION:`.
 */

import type { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ApiKeyScope = "read" | "read_write";

export interface CrmToolContext {
  /** Supabase (or equivalent) client scoped to the calling tenant. */
  db: SupabaseClient;
  /** Tenant / workspace the API key belongs to. */
  tenantId: string;
  /** Id of the API key making the call — recorded in the audit log. */
  apiKeyId: string;
  /** Scope granted to the API key. Write tools require "read_write". */
  scope: ApiKeyScope;
  /** When true, phone numbers and recording URLs are masked in responses. */
  piiMasking: boolean;
}

export interface McpTextContent {
  type: "text";
  text: string;
}

export interface McpCallResult {
  content: McpTextContent[];
  isError?: boolean;
}

export interface CrmToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

export interface RegisteredCrmTool {
  definition: CrmToolDefinition;
  schema: z.ZodTypeAny;
  /** Write tools set this so dispatch can reject read-only keys up front. */
  requiresWrite: boolean;
  handle: (args: unknown, ctx: CrmToolContext) => Promise<McpCallResult>;
}

export function defineCrmTool<S extends z.ZodTypeAny>(config: {
  definition: CrmToolDefinition;
  schema: S;
  requiresWrite?: boolean;
  handle: (args: z.infer<S>, ctx: CrmToolContext) => Promise<McpCallResult>;
}): RegisteredCrmTool {
  return {
    definition: config.definition,
    schema: config.schema,
    requiresWrite: config.requiresWrite ?? false,
    handle: (args: unknown, ctx: CrmToolContext) =>
      config.handle(args as z.infer<S>, ctx),
  };
}

export function ok(payload: unknown): McpCallResult {
  const text =
    typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  return { content: [{ type: "text", text }] };
}

export function fail(message: string): McpCallResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

/** Mask all but the last 4 digits of a phone number, e.g. "+1•••••1234". */
export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "••••";
  return `${phone.slice(0, 1)}${"•".repeat(Math.max(3, digits.length - 4))}${digits.slice(-4)}`;
}

/**
 * Append a row to the `mcp_audit_log` table. Best-effort: a logging failure
 * must never block the tool result, but it is surfaced to the server logger.
 *
 * INTEGRATION: confirm the `mcp_audit_log` table name and columns.
 */
export async function writeAuditLog(
  ctx: CrmToolContext,
  entry: {
    tool: string;
    contactId?: string;
    activityId?: string;
    messagePreview?: string;
    result: string;
  },
): Promise<void> {
  try {
    await ctx.db.from("mcp_audit_log").insert({
      tenant_id: ctx.tenantId,
      api_key_id: ctx.apiKeyId,
      tool: entry.tool,
      contact_id: entry.contactId ?? null,
      activity_id: entry.activityId ?? null,
      // Truncate the preview to 80 chars — never log full message bodies.
      message_preview: entry.messagePreview?.slice(0, 80) ?? null,
      result: entry.result,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Surface but do not throw — see helper contract above.
    console.error("[mcp_audit_log] write failed", (err as Error).message);
  }
}

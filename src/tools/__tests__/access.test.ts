import { afterEach, describe, expect, it } from "vitest";

import { toolsByName } from "../index.js";
import {
  PII_READ_TOOLS,
  PRIVILEGED_TOOLS,
  adminTokenConfigured,
  isAuthorized,
  isPrivileged,
  publicToolNames,
} from "../access.js";

/**
 * Finding C0 (2026-09-01): this server holds a Supabase SERVICE_ROLE_KEY, so
 * anything it serves without a token is served with RLS bypassed. Before this
 * gate, the public endpoint exposed newsletter subscribers, contact-form
 * submissions and every content write tool to anonymous callers.
 *
 * These tests are the regression guard. The exact-set assertion is the point:
 * a new write tool or personal-data reader must consciously extend the list,
 * exactly like the annotations test it mirrors.
 */

const ORIGINAL_TOKEN = process.env.MCP_ADMIN_TOKEN;

afterEach(() => {
  if (ORIGINAL_TOKEN === undefined) delete process.env.MCP_ADMIN_TOKEN;
  else process.env.MCP_ADMIN_TOKEN = ORIGINAL_TOKEN;
});

const EXPECTED_PRIVILEGED = [
  // write-capable
  "blog_create",
  "blog_update",
  "blog_revalidate",
  "help_create_article",
  "help_update_article",
  "newsletter_subscribe",
  "newsletter_unsubscribe",
  "forms_submit",
  // personal-data readers
  "newsletter_get_subscribers",
  "forms_list_submissions",
  "forms_get_submission",
  "forms_export_csv",
].sort();

describe("public vs privileged tool surface", () => {
  it("gates exactly the write and personal-data tools", () => {
    expect([...PRIVILEGED_TOOLS].sort()).toEqual(EXPECTED_PRIVILEGED);
  });

  it("names only tools that actually exist", () => {
    for (const name of PRIVILEGED_TOOLS) {
      expect(toolsByName.has(name)).toBe(true);
    }
  });

  it("keeps every personal-data reader gated even though it is read-only", () => {
    for (const name of PII_READ_TOOLS) {
      expect(isPrivileged(name)).toBe(true);
      expect(toolsByName.get(name)?.definition.annotations?.readOnlyHint).toBe(true);
    }
  });

  it("leaves the product-knowledge tools public", () => {
    const publicNames = publicToolNames(toolsByName.keys());
    expect(publicNames).toContain("pricing_get_plans");
    expect(publicNames).toContain("features_list");
    expect(publicNames).toContain("scan_website_bots");
    expect(publicNames).not.toContain("forms_export_csv");
    expect(publicNames).not.toContain("blog_create");
  });

  it("still serves a substantial public surface", () => {
    expect(publicToolNames(toolsByName.keys())).toHaveLength(
      toolsByName.size - EXPECTED_PRIVILEGED.length,
    );
  });
});

describe("bearer authorization", () => {
  it("fails closed when no token is configured", () => {
    delete process.env.MCP_ADMIN_TOKEN;
    expect(adminTokenConfigured()).toBe(false);
    expect(isAuthorized("Bearer anything")).toBe(false);
    expect(isAuthorized(undefined)).toBe(false);
  });

  it("treats a blank token as unconfigured", () => {
    process.env.MCP_ADMIN_TOKEN = "   ";
    expect(adminTokenConfigured()).toBe(false);
    expect(isAuthorized("Bearer    ")).toBe(false);
  });

  it("accepts the configured token and rejects everything else", () => {
    process.env.MCP_ADMIN_TOKEN = "s3cret-token-value";
    expect(isAuthorized("Bearer s3cret-token-value")).toBe(true);
    expect(isAuthorized("bearer s3cret-token-value")).toBe(true);
    expect(isAuthorized("Bearer  s3cret-token-value  ")).toBe(true);
    expect(isAuthorized("Bearer wrong")).toBe(false);
    expect(isAuthorized("s3cret-token-value")).toBe(false);
    expect(isAuthorized("Basic s3cret-token-value")).toBe(false);
    expect(isAuthorized("")).toBe(false);
  });

  it("does not leak length via an early match", () => {
    process.env.MCP_ADMIN_TOKEN = "abcdef";
    expect(isAuthorized("Bearer abcde")).toBe(false);
    expect(isAuthorized("Bearer abcdefg")).toBe(false);
  });
});

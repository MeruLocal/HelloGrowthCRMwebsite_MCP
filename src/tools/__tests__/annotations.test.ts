import { describe, expect, it } from "vitest";

import { tools, toolsByName } from "../index.js";
import { TOOL_ANNOTATIONS } from "../annotations.js";

/**
 * Finding Y: annotations are how an MCP client decides what needs human
 * approval. The spec defaults are the dangerous direction (readOnlyHint:
 * false, destructiveHint: true, openWorldHint: true), so every tool must
 * carry an explicit, complete set — and the write-capable list must be
 * exact, because a write tool mislabelled read-only is worse than no
 * annotation at all.
 */

// The complete list of tools allowed to write. Adding a write tool means
// consciously extending this list — that is the point of the test.
const EXPECTED_WRITE_TOOLS = [
  "blog_create",
  "blog_update",
  "blog_revalidate",
  "help_create_article",
  "help_update_article",
  "newsletter_subscribe",
  "newsletter_unsubscribe",
  "forms_submit",
].sort();

// Tools that reach beyond the server's own backend (live crawls, DNS,
// revalidation calls). Everything else must be closed-world.
const EXPECTED_OPEN_WORLD_TOOLS = [
  "scan_website_bots",
  "verify_bot_identity",
  "fetch_page_content",
  "crawl_pages",
  "generate_llms_txt",
  "check_llms_txt",
  "check_ai_extractability",
  "validate_sitemaps",
  "blog_revalidate",
].sort();

describe("tool annotations", () => {
  it("annotates every registered tool", () => {
    const missing = tools
      .filter((t) => t.definition.annotations === undefined)
      .map((t) => t.definition.name);
    expect(missing, "tools served without annotations").toEqual([]);
  });

  it("sets all four hints explicitly on every tool (no spec-default fallbacks)", () => {
    for (const t of tools) {
      const a = t.definition.annotations!;
      for (const hint of [
        "readOnlyHint",
        "destructiveHint",
        "idempotentHint",
        "openWorldHint",
      ] as const) {
        expect(typeof a[hint], `${t.definition.name}.${hint}`).toBe("boolean");
      }
    }
  });

  it("has no annotation entries for tools that do not exist", () => {
    const stale = Object.keys(TOOL_ANNOTATIONS).filter(
      (name) => !toolsByName.has(name),
    );
    expect(stale, "annotation entries without a registered tool").toEqual([]);
  });

  it("flags exactly the known write-capable tools as non-read-only", () => {
    const writeTools = tools
      .filter((t) => t.definition.annotations!.readOnlyHint === false)
      .map((t) => t.definition.name)
      .sort();
    expect(writeTools).toEqual(EXPECTED_WRITE_TOOLS);
  });

  it("never marks a read-only tool destructive", () => {
    const contradictions = tools
      .filter(
        (t) =>
          t.definition.annotations!.readOnlyHint === true &&
          t.definition.annotations!.destructiveHint === true,
      )
      .map((t) => t.definition.name);
    expect(contradictions).toEqual([]);
  });

  it("flags exactly the tools that reach the open world", () => {
    const openWorld = tools
      .filter((t) => t.definition.annotations!.openWorldHint === true)
      .map((t) => t.definition.name)
      .sort();
    expect(openWorld).toEqual(EXPECTED_OPEN_WORLD_TOOLS);
  });

  it("keeps updates idempotent and creates non-idempotent", () => {
    expect(
      toolsByName.get("blog_update")!.definition.annotations!.idempotentHint,
    ).toBe(true);
    expect(
      toolsByName.get("blog_create")!.definition.annotations!.idempotentHint,
    ).toBe(false);
    expect(
      toolsByName.get("forms_submit")!.definition.annotations!.idempotentHint,
    ).toBe(false);
  });
});

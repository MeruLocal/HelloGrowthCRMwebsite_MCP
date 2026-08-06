import { describe, expect, it } from "vitest";
import { toolsByName } from "../index.js";

/**
 * Every call goes through schema.safeParse first — the same path server.ts uses.
 *
 * Calling `tool.handle({})` directly skips zod, so `.default(...)` never applies.
 * That makes `templates_list`, `features_list` and `content_list_tools` return
 * ZERO items while still reporting a non-zero `total`, which looks exactly like
 * three dead tools. Tests must not reproduce that mistake.
 */
async function call(
  name: string,
  args: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const tool = toolsByName.get(name);
  if (!tool) throw new Error(`No such tool: ${name}`);
  const parsed = tool.schema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.message);
  const res = await tool.handle(parsed.data);
  return JSON.parse(res.content[0].text) as Record<string, unknown>;
}

describe("generate_llms_txt", () => {
  it("is registered under both tool names", () => {
    expect(toolsByName.has("generate_llms_txt")).toBe(true);
    expect(toolsByName.has("check_llms_txt")).toBe(true);
  });

  it("generates a corpus far larger than the hand-written one it replaces", async () => {
    const r = await call("generate_llms_txt", {
      variant: "full",
      includeContent: false,
    });
    // The live llms-full.txt was 10,182 B when this was written.
    expect(r.byteLength as number).toBeGreaterThan(50_000);
    expect(r.entryCount as number).toBeGreaterThan(500);
  });

  it("pulls in every major mirror group", async () => {
    const r = await call("generate_llms_txt", {
      variant: "full",
      includeContent: false,
    });
    const headings = (r.sections as { heading: string }[]).map((s) => s.heading);
    for (const expected of [
      "Features",
      "Integrations",
      "Glossary",
      "Free tools",
      "Templates",
      "Competitor alternatives",
    ]) {
      expect(headings).toContain(expected);
    }
  });

  it("never emits a section with zero entries", async () => {
    // An empty heading reads as a gap in the product, not the generator.
    const r = await call("generate_llms_txt", {
      variant: "full",
      includeContent: false,
    });
    for (const s of r.sections as { heading: string; entries: number }[]) {
      expect(s.entries, `${s.heading} is empty`).toBeGreaterThan(0);
    }
  });

  it("renders the full variant larger than the index variant", async () => {
    const full = await call("generate_llms_txt", {
      variant: "full",
      includeContent: false,
    });
    const index = await call("generate_llms_txt", {
      variant: "index",
      includeContent: false,
    });
    // This is the exact invariant the live files currently violate.
    expect(full.byteLength as number).toBeGreaterThan(index.byteLength as number);
  });

  it("omits the text when includeContent is false", async () => {
    const r = await call("generate_llms_txt", { includeContent: false });
    expect(r.content).toBeUndefined();
    expect(r.byteLength as number).toBeGreaterThan(0);
  });

  it("includes markdown headings and links when content is returned", async () => {
    const r = await call("generate_llms_txt", {
      variant: "full",
      includeContent: true,
    });
    const text = r.content as string;
    expect(text).toContain("# HelloGrowthCRM — Full AI Corpus");
    expect(text).toMatch(/^## /m);
    expect(text).toContain("https://hellogrowthcrm.com");
  });

  it("defaults to the full variant", async () => {
    const r = await call("generate_llms_txt", { includeContent: false });
    expect(r.variant).toBe("full");
  });

  it("rejects an unknown variant rather than silently defaulting", async () => {
    await expect(call("generate_llms_txt", { variant: "partial" })).rejects.toThrow();
  });
});

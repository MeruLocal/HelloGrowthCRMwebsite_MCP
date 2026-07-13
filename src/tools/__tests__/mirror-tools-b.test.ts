import { describe, expect, it } from "vitest";
import { changelogListReleases, changelogGetRelease } from "../changelog.js";
import { partnersGetProgram, partnersGetApplicationSchema } from "../partners.js";
import { mediaListVideos, mediaListTestimonials } from "../media.js";
import { templatesList, templatesGet } from "../templates.js";
import { faqsGetSite } from "../faqs.js";

/** Helper: run a tool handler and return the parsed JSON payload. */
async function run(
  tool: { handle: (a: unknown) => Promise<{ content: { text: string }[]; isError?: boolean }> },
  args: unknown = {},
) {
  const res = await tool.handle(args);
  // ok() payloads are JSON; fail() payloads are raw text, so only parse on success.
  const json = res.isError ? undefined : (JSON.parse(res.content[0]!.text) as Record<string, unknown>);
  return { res, json: json as Record<string, unknown> };
}

describe("changelog tools", () => {
  it("changelog_list_releases returns all curated releases newest-first", async () => {
    const { res, json } = await run(changelogListReleases, { limit: 20 });
    expect(res.isError).toBeFalsy();
    expect(json.total_releases).toBe(6);
    expect(json.filtered_count).toBe(6);
    expect(json.returned).toBe(6);
    const releases = json.releases as { version: string; isoDate: string }[];
    expect(releases[0]!.version).toBe("1.5.0");
    expect(releases[releases.length - 1]!.version).toBe("1.0.0");
    // newest-first ordering
    for (let i = 1; i < releases.length; i++) {
      expect(releases[i - 1]!.isoDate >= releases[i]!.isoDate).toBe(true);
    }
    expect((json.routes as string[]).some((r) => r.endsWith("/whats-new"))).toBe(true);
  });

  it("changelog_list_releases respects the limit", async () => {
    const { json } = await run(changelogListReleases, { limit: 2 });
    expect(json.returned).toBe(2);
    expect((json.releases as unknown[]).length).toBe(2);
    expect(json.filtered_count).toBe(6);
  });

  it("changelog_list_releases filters releases and items by tag", async () => {
    const { json } = await run(changelogListReleases, { limit: 20, tag: "infra" });
    const releases = json.releases as { version: string; items: { tag: string }[] }[];
    expect(json.filtered_count).toBe(1);
    expect(releases.length).toBe(1);
    expect(releases[0]!.version).toBe("1.0.0");
    expect(releases[0]!.items.every((i) => i.tag === "infra")).toBe(true);
  });

  it("changelog_list_releases drops releases with no matching items", async () => {
    const { json } = await run(changelogListReleases, { limit: 20, tag: "fix" });
    const releases = json.releases as { items: { tag: string }[] }[];
    expect((json.filtered_count as number)).toBeLessThan(6);
    expect(releases.every((r) => r.items.length > 0)).toBe(true);
    expect(releases.every((r) => r.items.every((i) => i.tag === "fix"))).toBe(true);
  });

  it("changelog_get_release resolves a version and accepts a leading v", async () => {
    const { res, json } = await run(changelogGetRelease, { version: "1.5.0" });
    expect(res.isError).toBeFalsy();
    expect(json.version).toBe("1.5.0");
    expect(json.date).toBe("March 27, 2026");
    expect((json.items as unknown[]).length).toBe(4);
    expect(String(json.url)).toContain("/changelog");

    const prefixed = await run(changelogGetRelease, { version: " V1.0.0 " });
    expect(prefixed.res.isError).toBeFalsy();
    expect(prefixed.json.version).toBe("1.0.0");
  });

  it("changelog_get_release returns an error for an unknown version", async () => {
    const { res } = await run(changelogGetRelease, { version: "9.9.9" });
    expect(res.isError).toBe(true);
    expect(res.content[0]!.text).toContain("not found");
    expect(res.content[0]!.text).toContain("1.5.0");
  });
});

describe("partners tools", () => {
  it("partners_get_program returns program overview and the 8 FAQs", async () => {
    const { res, json } = await run(partnersGetProgram);
    expect(res.isError).toBeFalsy();
    expect(json.program).toBeTruthy();
    expect(json.faq_count).toBe(8);
    expect((json.faqs as unknown[]).length).toBe(8);
    expect(json.synced_at).toBe("2026-06-11");
  });

  it("partners_get_application_schema returns every form field with apply URL", async () => {
    const { res, json } = await run(partnersGetApplicationSchema);
    expect(res.isError).toBeFalsy();
    expect(json.apply_url).toBe("https://hellogrowthcrm.com/partners");
    const fields = json.fields as { name: string }[];
    expect(json.field_count).toBe(fields.length);
    expect(fields.length).toBeGreaterThan(0);
    expect(fields.some((f) => f.name === "products_interested")).toBe(true);
    expect(String(json.submission_note)).toContain("/partners");
  });
});

describe("media tools", () => {
  it("media_list_videos returns the 28 seeded videos with watch URLs", async () => {
    const { res, json } = await run(mediaListVideos);
    expect(res.isError).toBeFalsy();
    expect(json.count).toBe(28);
    const videos = json.videos as { id: string; url: string; badge: string | null; tabs: string[] }[];
    expect(videos.length).toBe(28);
    expect(videos[0]!.url).toBe(`https://www.youtube.com/watch?v=${videos[0]!.id}`);
    expect(videos.some((v) => v.id === "5CKGKLVMKko")).toBe(true);
    expect(videos.every((v) => Array.isArray(v.tabs))).toBe(true);
    expect(json.page_url).toBe("https://hellogrowthcrm.com/videos");
  });

  it("media_list_testimonials returns both groups for type=all", async () => {
    const { json } = await run(mediaListTestimonials, { type: "all" });
    const text = json.text_testimonials as Record<string, unknown>;
    expect(text.count).toBe(6);
    expect((text.items as unknown[]).length).toBe(6);
    expect(json.video_testimonials).toBeTruthy();
    expect(String(json.disclaimer)).toContain("illustrative");
  });

  it("media_list_testimonials type=text omits video info", async () => {
    const { json } = await run(mediaListTestimonials, { type: "text" });
    expect(json.text_testimonials).toBeTruthy();
    expect(json.video_testimonials).toBeUndefined();
  });

  it("media_list_testimonials type=video omits text quotes", async () => {
    const { json } = await run(mediaListTestimonials, { type: "video" });
    expect(json.text_testimonials).toBeUndefined();
    const video = json.video_testimonials as Record<string, unknown>;
    expect(video.page_url).toBe("https://hellogrowthcrm.com/testimonials");
    expect(Array.isArray(video.record_fields)).toBe(true);
  });
});

describe("templates tools", () => {
  it("templates_list returns the full catalog for category=all", async () => {
    const { res, json } = await run(templatesList, { category: "all" });
    expect(res.isError).toBeFalsy();
    expect(json.total).toBe(42);
    expect(json.filtered_count).toBe(42);
    expect((json.categories as unknown[]).length).toBe(7);
    const templates = json.templates as { slug: string; category: string; url: string }[];
    const pipeline = templates.find((t) => t.slug === "sales-pipeline-template")!;
    expect(pipeline.url).toBe("https://hellogrowthcrm.com/templates/pipeline/sales-pipeline-template");
  });

  it("templates_list filters by category", async () => {
    const { json } = await run(templatesList, { category: "lead-scoring" });
    const templates = json.templates as { category: string }[];
    expect(json.filtered_count).toBe(templates.length);
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.every((t) => t.category === "lead-scoring")).toBe(true);
  });

  it("templates_list filters by search keyword across fields", async () => {
    const { json } = await run(templatesList, { category: "all", search: "Forecasting" });
    const templates = json.templates as { slug: string }[];
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.some((t) => t.slug === "sales-forecasting-model")).toBe(true);
  });

  it("templates_list combines category and search filters", async () => {
    const { json } = await run(templatesList, { category: "audit", search: "migration" });
    const templates = json.templates as { slug: string; category: string }[];
    expect(templates.length).toBe(1);
    expect(templates[0]!.slug).toBe("crm-migration-checklist");
    expect(templates[0]!.category).toBe("audit");
  });

  it("templates_list returns empty for a no-match search", async () => {
    const { json } = await run(templatesList, { category: "all", search: "zzz-no-such-template" });
    expect(json.filtered_count).toBe(0);
    expect((json.templates as unknown[]).length).toBe(0);
  });

  it("templates_get resolves a slug case-insensitively with defaulted popular flag", async () => {
    const { res, json } = await run(templatesGet, { slug: "  B2B-Lead-Scoring-Model  " });
    expect(res.isError).toBeFalsy();
    expect(json.slug).toBe("b2b-lead-scoring-model");
    expect(json.popular).toBe(true);
    expect(json.url).toBe("https://hellogrowthcrm.com/templates/lead-scoring/b2b-lead-scoring-model");

    const nonPopular = await run(templatesGet, { slug: "webinar-follow-up-sequence" });
    expect(nonPopular.json.popular).toBe(false);
  });

  it("templates_get returns an error for an unknown slug", async () => {
    const { res } = await run(templatesGet, { slug: "does-not-exist" });
    expect(res.isError).toBe(true);
    expect(res.content[0]!.text).toContain("not found");
    expect(res.content[0]!.text).toContain("sales-pipeline-template");
  });
});

describe("faqs tools", () => {
  it("faqs_get_site returns all 17 site FAQs plus the empty directory group", async () => {
    const { res, json } = await run(faqsGetSite);
    expect(res.isError).toBeFalsy();
    const groups = json.groups as Record<string, unknown>[];
    expect(groups.length).toBe(2);
    const site = groups[0]!;
    expect(site.group).toBe("site_faq");
    expect(site.total).toBe(17);
    expect(site.filtered_count).toBe(17);
    const directory = groups[1]!;
    expect(directory.group).toBe("faq_directory");
    expect(directory.entries).toBe(0);
    expect((directory.categories as unknown[]).length).toBe(5);
  });

  it("faqs_get_site filters by keyword in question or answer", async () => {
    const { json } = await run(faqsGetSite, { search: "WhatsApp" });
    const site = (json.groups as Record<string, unknown>[])[0]!;
    const items = site.items as { q: string; a: string }[];
    expect((site.filtered_count as number)).toBeGreaterThan(0);
    expect((site.filtered_count as number)).toBeLessThan(17);
    expect(items.every((f) => /whatsapp/i.test(f.q) || /whatsapp/i.test(f.a))).toBe(true);
    expect(site.total).toBe(17);
  });

  it("faqs_get_site marks the pricing answer as a placeholder", async () => {
    const { json } = await run(faqsGetSite, { search: "pricing_get_plans" });
    const site = (json.groups as Record<string, unknown>[])[0]!;
    const items = site.items as { placeholder?: boolean; links?: { href: string }[] }[];
    expect(items.length).toBe(1);
    expect(items[0]!.placeholder).toBe(true);
    expect(items[0]!.links![0]!.href).toBe("/pricing");
  });

  it("faqs_get_site returns zero items for a no-match search", async () => {
    const { json } = await run(faqsGetSite, { search: "zzz-no-such-faq" });
    const site = (json.groups as Record<string, unknown>[])[0]!;
    expect(site.filtered_count).toBe(0);
    expect((site.items as unknown[]).length).toBe(0);
  });
});

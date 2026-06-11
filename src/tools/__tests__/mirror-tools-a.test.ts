import { describe, expect, it } from "vitest";
import {
  alternativesList,
  alternativesGet,
  switchListCompetitors,
  switchGetGuide,
} from "../alternatives.js";
import {
  solutionsListWhatsappUseCases,
  solutionsGetManagedRevops,
} from "../solutions.js";
import {
  agentsList,
  agentsGet,
  agentsGetAutonomyLevels,
  agentsListComparisons,
} from "../agents.js";
import { glossaryListTerms, glossaryGetTerm } from "../glossary.js";
import { guidesList, guidesGet } from "../guides.js";

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

describe("alternatives tools", () => {
  it("alternatives_list returns the full deduped competitor set", async () => {
    const { res, json } = await run(alternativesList);
    expect(res.isError).toBeFalsy();
    expect(json.total as number).toBeGreaterThan(0);
    expect(json.total).toBe(json.filtered_count);
    const rows = json.alternatives as { slug: string; url: string | null }[];
    expect(rows.some((r) => r.slug === "hubspot")).toBe(true);
    expect(rows.some((r) => r.slug === "gallabox")).toBe(true);
  });

  it("alternatives_list filters by keyword", async () => {
    const { json } = await run(alternativesList, { search: "hubspot" });
    const rows = json.alternatives as { slug: string }[];
    expect(rows.length).toBeGreaterThan(0);
    expect(json.filtered_count as number).toBeLessThan(json.total as number);
    expect(rows.every((r) => JSON.stringify(r).toLowerCase().includes("hubspot"))).toBe(true);
  });

  it("alternatives_get resolves a shortlist-only competitor", async () => {
    const { res, json } = await run(alternativesGet, { slug: "hubspot" });
    expect(res.isError).toBeFalsy();
    expect(json.slug).toBe("hubspot");
    expect(json.shortlist).toBeTruthy();
    expect(json.whatsapp_detail).toBeNull();
  });

  it("alternatives_get resolves a WhatsApp competitor with detail content", async () => {
    const { json } = await run(alternativesGet, { slug: "wati" });
    expect(json.slug).toBe("wati");
    expect(json.shortlist).toBeTruthy();
    const wa = json.whatsapp_detail as Record<string, unknown>;
    expect(wa).toBeTruthy();
    expect(Array.isArray(wa.feature_rows)).toBe(true);
    expect((wa.feature_rows as unknown[]).length).toBeGreaterThan(0);
  });

  it("alternatives_get resolves a WA-only slug (no shortlist entry)", async () => {
    const { json } = await run(alternativesGet, { slug: "gallabox" });
    expect(json.shortlist).toBeNull();
    expect(json.whatsapp_detail).toBeTruthy();
  });

  it("alternatives_get applies aliases and strips suffixes/prefix slashes", async () => {
    const aliased = await run(alternativesGet, { slug: "zoho-crm" });
    expect(aliased.json.slug).toBe("zoho");
    const suffixed = await run(alternativesGet, { slug: "/hubspot-alternative-india" });
    expect(suffixed.json.slug).toBe("hubspot");
    const plain = await run(alternativesGet, { slug: "pipedrive-alternative" });
    expect(plain.json.slug).toBe("pipedrive");
  });

  it("alternatives_get fails for an unknown competitor", async () => {
    const { res } = await run(alternativesGet, { slug: "definitely-not-a-crm" });
    expect(res.isError).toBe(true);
    expect(res.content[0]!.text).toContain("not found");
    expect(res.content[0]!.text).toContain("Valid slugs");
  });

  it("switch_list_competitors lists guide-backed and page-only entries", async () => {
    const { json } = await run(switchListCompetitors);
    const pages = json.switch_pages as { slug: string; has_guide_data: boolean }[];
    expect(json.total).toBe(pages.length);
    expect(pages.some((p) => p.slug === "zoho" && p.has_guide_data)).toBe(true);
    expect(pages.some((p) => p.slug === "excel" && !p.has_guide_data)).toBe(true);
  });

  it("switch_get_guide returns the full migration guide", async () => {
    const { res, json } = await run(switchGetGuide, { slug: "zoho" });
    expect(res.isError).toBeFalsy();
    expect(json.route).toBe("/switch-from-zoho");
    expect(Array.isArray(json.feature_comparison)).toBe(true);
    expect(Array.isArray(json.migration_steps)).toBe(true);
  });

  it("switch_get_guide strips the switch-from- prefix", async () => {
    const { json } = await run(switchGetGuide, { slug: "/switch-from-salesforce" });
    expect(json.slug).toBe("salesforce");
  });

  it("switch_get_guide fails distinctly for page-only competitors", async () => {
    const { res } = await run(switchGetGuide, { slug: "excel" });
    expect(res.isError).toBe(true);
    expect(res.content[0]!.text).toContain("standalone page");
  });

  it("switch_get_guide fails for an unknown slug", async () => {
    const { res } = await run(switchGetGuide, { slug: "faxmachine" });
    expect(res.isError).toBe(true);
    expect(res.content[0]!.text).toContain("not found");
  });
});

describe("solutions tools", () => {
  it("solutions_list_whatsapp_use_cases returns templated use cases", async () => {
    const { res, json } = await run(solutionsListWhatsappUseCases);
    expect(res.isError).toBeFalsy();
    expect(json.count).toBe((json.use_cases as unknown[]).length);
    expect(json.count as number).toBeGreaterThan(0);
    expect(json.feature_url).toBe("https://hellogrowthcrm.com/features/whatsapp-crm");
  });

  it("solutions_get_managed_revops returns the full overview without a city", async () => {
    const { json } = await run(solutionsGetManagedRevops);
    expect(String(json.service)).toContain("Managed RevOps");
    const markets = json.markets as Record<string, unknown>;
    expect(markets.count).toBe(9);
    const cities = json.city_pages as Record<string, unknown>;
    expect(cities.count).toBe(25);
    expect(Array.isArray(json.related_offerings)).toBe(true);
  });

  it("solutions_get_managed_revops resolves a city slug", async () => {
    const { res, json } = await run(solutionsGetManagedRevops, { city: "atlanta" });
    expect(res.isError).toBeFalsy();
    expect(json.slug).toBe("atlanta");
    expect(json.url).toBe("https://hellogrowthcrm.com/managed-revops-atlanta");
    expect(json.offer).toBeTruthy();
  });

  it("solutions_get_managed_revops normalizes whitespace in city input", async () => {
    const { json } = await run(solutionsGetManagedRevops, { city: "  New York " });
    expect(json.slug).toBe("new-york");
  });

  it("solutions_get_managed_revops fails for an unknown city", async () => {
    const { res } = await run(solutionsGetManagedRevops, { city: "gotham" });
    expect(res.isError).toBe(true);
    expect(res.content[0]!.text).toContain("Unknown city");
  });
});

describe("agents tools", () => {
  it("agents_list returns all 12 agents with hub metadata", async () => {
    const { json } = await run(agentsList);
    expect(json.total_agents).toBe(12);
    expect(json.filtered_count).toBe(12);
    const agents = json.agents as { slug: string; url: string }[];
    expect(agents.some((a) => a.slug === "voice-agent")).toBe(true);
    expect(String((json.hub as Record<string, unknown>).url)).toContain("hellogrowthcrm.com");
  });

  it("agents_list filters by autonomy level", async () => {
    const { json } = await run(agentsList, { autonomy_level: "autonomous" });
    const agents = json.agents as { autonomy_level: string }[];
    expect(agents.length).toBeGreaterThan(0);
    expect(json.filtered_count as number).toBeLessThan(json.total_agents as number);
    expect(agents.every((a) => a.autonomy_level === "autonomous")).toBe(true);
  });

  it("agents_get returns full detail for a known agent", async () => {
    const { res, json } = await run(agentsGet, { slug: "Voice-Agent" });
    expect(res.isError).toBeFalsy();
    expect(json.slug).toBe("voice-agent");
    expect(String(json.url)).toContain("/agentic-ai");
    expect(json.detail).toBeTruthy();
  });

  it("agents_get covers agents with optional risk signals", async () => {
    const { json } = await run(agentsGet, { slug: "deal-risk-agent" });
    expect(json.slug).toBe("deal-risk-agent");
  });

  it("agents_get fails for an unknown slug", async () => {
    const { res } = await run(agentsGet, { slug: "skynet" });
    expect(res.isError).toBe(true);
    expect(res.content[0]!.text).toContain("not found");
  });

  it("agents_get_autonomy_levels returns the three-level framework", async () => {
    const { json } = await run(agentsGetAutonomyLevels);
    expect((json.levels as unknown[]).length).toBe(3);
    expect(Array.isArray(json.capability_matrix)).toBe(true);
    expect(Array.isArray(json.safety_rails)).toBe(true);
  });

  it("agents_list_comparisons returns the four vs pages", async () => {
    const { json } = await run(agentsListComparisons);
    expect(json.count).toBe(4);
    const comps = json.comparisons as { slug: string }[];
    expect(comps.map((c) => c.slug).sort((a, b) => a.localeCompare(b))).toEqual([
      "vs-agentforce",
      "vs-breeze",
      "vs-copilot",
      "vs-zia",
    ]);
  });
});

describe("glossary tools", () => {
  it("glossary_list_terms returns every term with canonical URLs", async () => {
    const { json } = await run(glossaryListTerms);
    expect(json.total).toBe(json.filtered_count);
    const terms = json.terms as { slug: string; url: string }[];
    expect(terms.length).toBeGreaterThan(0);
    expect(terms.some((t) => t.url === "https://hellogrowthcrm.com/glossary/lead-scoring")).toBe(true);
  });

  it("glossary_list_terms filters by keyword", async () => {
    const { json } = await run(glossaryListTerms, { search: "pipeline" });
    const terms = json.terms as { slug: string }[];
    expect(terms.length).toBeGreaterThan(0);
    expect(json.filtered_count as number).toBeLessThan(json.total as number);
  });

  it("glossary_get_term resolves by slug", async () => {
    const { res, json } = await run(glossaryGetTerm, { slug: "lead-scoring" });
    expect(res.isError).toBeFalsy();
    expect(json.slug).toBe("lead-scoring");
    expect(json.url).toBe("https://hellogrowthcrm.com/glossary/lead-scoring");
    expect(Array.isArray(json.related)).toBe(true);
  });

  it("glossary_get_term resolves by exact term name (case-insensitive)", async () => {
    const { json } = await run(glossaryGetTerm, { slug: "Sales Pipeline" });
    expect(json.slug).toBe("sales-pipeline");
  });

  it("glossary_get_term fails for an unknown term", async () => {
    const { res } = await run(glossaryGetTerm, { slug: "blockchain-synergy" });
    expect(res.isError).toBe(true);
    expect(res.content[0]!.text).toContain("not found");
  });
});

describe("guides tools", () => {
  it("guides_list returns guides with category labels", async () => {
    const { json } = await run(guidesList);
    expect(json.total).toBe(json.filtered_count);
    const cats = json.categories as { slug: string; label: string }[];
    expect(cats.length).toBe(7);
    const guides = json.guides as { slug: string; category_label: string }[];
    expect(guides.some((g) => g.slug === "contact-management")).toBe(true);
    expect(guides.every((g) => typeof g.category_label === "string")).toBe(true);
  });

  it("guides_list filters by keyword across name and category label", async () => {
    const byName = await run(guidesList, { search: "dialer" });
    expect((byName.json.guides as unknown[]).length).toBeGreaterThan(0);
    expect(byName.json.filtered_count as number).toBeLessThan(byName.json.total as number);
    const byCategory = await run(guidesList, { search: "AI-Powered" });
    expect((byCategory.json.guides as unknown[]).length).toBeGreaterThan(0);
  });

  it("guides_get resolves a known slug with deep-dive URL", async () => {
    const { res, json } = await run(guidesGet, { slug: " Contact-Management " });
    expect(res.isError).toBeFalsy();
    expect(json.slug).toBe("contact-management");
    expect(json.url).toBe("https://hellogrowthcrm.com/feature-guide/contact-management");
    expect(String(json.deep_dive_url)).toContain("https://hellogrowthcrm.com/");
  });

  it("guides_get fails for an unknown slug", async () => {
    const { res } = await run(guidesGet, { slug: "time-travel" });
    expect(res.isError).toBe(true);
    expect(res.content[0]!.text).toContain("not found");
  });
});

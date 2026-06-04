import { describe, expect, it } from "vitest";
import {
  seoGetSiteConfig,
  seoGetHreflang,
  seoGetCanonical,
  seoGetSitemaps,
  seoGetSchema,
} from "../seo.js";
import { countriesList, countryGet } from "../countries.js";
import { companyGetProfile, companyGetContacts } from "../company.js";
import { productsList, productGet } from "../products.js";

/** Helper: run a tool handler and return the parsed JSON payload. */
async function run(tool: { handle: (a: unknown) => Promise<{ content: { text: string }[]; isError?: boolean }> }, args: unknown = {}) {
  const res = await tool.handle(args);
  // ok() payloads are JSON; fail() payloads are raw text, so only parse on success.
  const json = res.isError ? undefined : (JSON.parse(res.content[0]!.text) as Record<string, unknown>);
  return { res, json: json as Record<string, unknown> };
}

describe("seo tools", () => {
  it("seo_get_site_config returns canonical host and brand basics", async () => {
    const { res, json } = await run(seoGetSiteConfig);
    expect(res.isError).toBeFalsy();
    expect(json.canonical_host).toBe("https://hellogrowthcrm.com");
    expect(json.brand_name).toBe("HelloGrowthCRM");
    expect(Array.isArray(json.alternate_names)).toBe(true);
  });

  it("seo_get_hreflang returns a tag set for a market path", async () => {
    const { json } = await run(seoGetHreflang, { path: "/usa" });
    expect(json.path).toBe("/usa");
    expect((json.count as number)).toBeGreaterThan(0);
    expect(Array.isArray(json.hreflang)).toBe(true);
  });

  it("seo_get_canonical resolves to the apex host with no trailing slash", async () => {
    const { json } = await run(seoGetCanonical, { path: "/pricing/" });
    expect(json.canonical).toBe("https://hellogrowthcrm.com/pricing");
  });

  it("seo_get_canonical maps root to the bare host", async () => {
    const { json } = await run(seoGetCanonical, { path: "/" });
    expect(json.canonical).toBe("https://hellogrowthcrm.com");
  });

  it("seo_get_sitemaps lists the sitemap index and children", async () => {
    const { json } = await run(seoGetSitemaps);
    expect(String(json.index)).toContain("sitemap-index.xml");
    expect((json.child_count as number)).toBeGreaterThan(0);
  });

  it("seo_get_schema includes the live Organization JSON-LD when requested", async () => {
    const withOrg = await run(seoGetSchema, { include_org_jsonld: true });
    expect(withOrg.json.organization_jsonld).toBeTruthy();
    const withoutOrg = await run(seoGetSchema, { include_org_jsonld: false });
    expect(withoutOrg.json.organization_jsonld).toBeUndefined();
  });
});

describe("countries tools", () => {
  it("countries_list returns all eight markets", async () => {
    const { json } = await run(countriesList);
    expect(json.count).toBe(8);
    expect((json.countries as unknown[]).length).toBe(8);
  });

  it("country_get resolves a known market with seo + contact", async () => {
    const { res, json } = await run(countryGet, { code: "IN" });
    expect(res.isError).toBeFalsy();
    expect((json.country as Record<string, unknown>).code).toBe("in");
    expect((json.seo as Record<string, unknown>).canonical).toBe("https://hellogrowthcrm.com/in");
    expect((json.contact as Record<string, unknown>).region).toBe("IN");
  });

  it("country_get falls back to US contact for non-India markets", async () => {
    const { json } = await run(countryGet, { code: "usa" });
    expect((json.contact as Record<string, unknown>).region).toBe("US");
  });

  it("country_get returns an error for an unknown code", async () => {
    const { res } = await run(countryGet, { code: "atlantis" });
    expect(res.isError).toBe(true);
    expect(res.content[0]!.text).toContain("not found");
  });
});

describe("company tools", () => {
  it("company_get_profile returns legal entities and brand", async () => {
    const { json } = await run(companyGetProfile);
    expect(json.legal_name).toBe("Soor LLC");
    expect(json.india_legal_entity).toBe("Meru Technosoft Pvt. Ltd.");
    expect((json.brand as Record<string, unknown>)).toBeTruthy();
  });

  it("company_get_contacts returns all contacts when no region given", async () => {
    const { json } = await run(companyGetContacts);
    expect((json.count as number)).toBe(2);
  });

  it("company_get_contacts resolves a specific region", async () => {
    const { json } = await run(companyGetContacts, { region: "in" });
    expect(json.resolved_for).toBe("IN");
    expect((json.contact as Record<string, unknown>).region).toBe("IN");
  });
});

describe("products tools", () => {
  it("products_list returns the full catalog", async () => {
    const { json } = await run(productsList);
    expect((json.total as number)).toBeGreaterThan(0);
    expect(json.total).toBe(json.filtered_count);
  });

  it("products_list filters by keyword", async () => {
    const { json } = await run(productsList, { search: "dialer" });
    const products = json.products as { slug: string }[];
    expect(products.length).toBeGreaterThan(0);
    expect(products.some((p) => p.slug === "built-in-dialer")).toBe(true);
  });

  it("product_get resolves a known slug with its canonical URL", async () => {
    const { res, json } = await run(productGet, { slug: "ai-pipeline" });
    expect(res.isError).toBeFalsy();
    expect(json.slug).toBe("ai-pipeline");
    expect(json.url).toBe("https://hellogrowthcrm.com/product/ai-pipeline");
  });

  it("product_get returns an error for an unknown slug", async () => {
    const { res } = await run(productGet, { slug: "does-not-exist" });
    expect(res.isError).toBe(true);
    expect(res.content[0]!.text).toContain("not found");
  });
});

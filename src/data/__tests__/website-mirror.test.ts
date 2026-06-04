import { describe, expect, it } from "vitest";
import {
  COMPANY,
  CONTACTS,
  COUNTRIES,
  COUNTRY_PRICING,
  PRODUCTS,
  SITEMAPS,
  SCHEMA_TYPES,
  SYNCED_AT,
  getRegionalContact,
  getCanonicalUrl,
  getHreflangTags,
  orgSchema,
} from "../website-mirror.js";

describe("static data integrity", () => {
  it("exposes a stable sync date and source of truth", () => {
    expect(SYNCED_AT).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(COMPANY.url).toBe("https://hellogrowthcrm.com");
  });

  it("ships eight country markets each with a matching pricing row", () => {
    expect(COUNTRIES).toHaveLength(8);
    for (const c of COUNTRIES) {
      const pricing = COUNTRY_PRICING.find((p) => p.countrySlug === c.code);
      expect(pricing, `pricing for ${c.code}`).toBeTruthy();
    }
  });

  it("has a non-empty product catalogue and sitemap children", () => {
    expect(PRODUCTS.length).toBeGreaterThan(10);
    expect(SITEMAPS.children.length).toBeGreaterThan(0);
    expect(SCHEMA_TYPES.length).toBeGreaterThan(0);
    expect(CONTACTS).toHaveLength(2);
  });
});

describe("getRegionalContact", () => {
  it("returns the India desk for IN (any casing)", () => {
    expect(getRegionalContact("in").region).toBe("IN");
    expect(getRegionalContact("IN").region).toBe("IN");
  });
  it("falls back to the US desk for everything else", () => {
    expect(getRegionalContact("US").region).toBe("US");
    expect(getRegionalContact("fr").region).toBe("US");
    expect(getRegionalContact(undefined).region).toBe("US");
    expect(getRegionalContact(null).region).toBe("US");
  });
});

describe("getCanonicalUrl", () => {
  it("returns the bare host for root", () => {
    expect(getCanonicalUrl("/")).toBe("https://hellogrowthcrm.com");
  });
  it("strips trailing slashes and collapses duplicate slashes", () => {
    expect(getCanonicalUrl("/pricing/")).toBe("https://hellogrowthcrm.com/pricing");
    expect(getCanonicalUrl("//in//pricing/")).toBe("https://hellogrowthcrm.com/in/pricing");
  });
  it("drops query strings and hash fragments", () => {
    expect(getCanonicalUrl("/blog/post?utm=1#top")).toBe("https://hellogrowthcrm.com/blog/post");
  });
});

describe("orgSchema", () => {
  it("emits a valid Organization JSON-LD object", () => {
    const org = orgSchema();
    expect(org["@type"]).toBe("Organization");
    expect(org.name).toBe(COMPANY.legalName);
    expect(Array.isArray(org.sameAs)).toBe(true);
  });
});

describe("getHreflangTags", () => {
  const langsOf = (path: string) => getHreflangTags(path).map((t) => t.hreflang);

  it("returns the India language cluster for /in and language slugs", () => {
    expect(langsOf("/in")).toContain("en-IN");
    expect(langsOf("/in")).toContain("hi");
    expect(langsOf("/in/crm-tamil")).toContain("ta");
  });

  it("returns the global market cluster for market roots", () => {
    const tags = getHreflangTags("/usa");
    const langs = tags.map((t) => t.hreflang);
    expect(langs).toContain("en");
    expect(langs).toContain("en-US");
    expect(langs).toContain("x-default");
  });

  it("handles market-scoped suffixes like /uk/pricing", () => {
    expect(langsOf("/uk/pricing")).toContain("en-GB");
  });

  it("resolves single-language country pages exactly", () => {
    expect(langsOf("/crm-singapore")).toContain("en-SG");
    expect(langsOf("/crm-uae")).toContain("en-AE");
    expect(langsOf("/crm-dubai")).toContain("en-AE");
    expect(langsOf("/crm-canada")).toContain("en-CA");
    expect(langsOf("/crm-usa")).toContain("en-US");
  });

  it("resolves /crm-for-* slugs to en-US unless region-suffixed", () => {
    expect(langsOf("/crm-for-builders")).toContain("en-US");
    expect(langsOf("/crm-for-agencies-uk")).toContain("en-GB");
    expect(langsOf("/crm-for-x-philippines")).toContain("en-PH");
    expect(langsOf("/crm-for-x-malaysia")).toContain("en-MY");
  });

  it("emits a German cluster for germany pages", () => {
    expect(langsOf("/crm-germany")).toContain("de-DE");
    expect(langsOf("/crm-for-x-germany")).toContain("de-DE");
  });

  it("does NOT treat australia-suffixed /crm-for-* pages as the en-US single page", () => {
    // Falls through to the generic fallback (x-default points at the page itself,
    // not the homepage as the single-language en-US branch would emit).
    expect(getHreflangTags("/crm-for-realtors-australia")).toEqual([
      { hreflang: "en", href: "https://hellogrowthcrm.com/crm-for-realtors-australia" },
      { hreflang: "en-US", href: "https://hellogrowthcrm.com/crm-for-realtors-australia" },
      { hreflang: "x-default", href: "https://hellogrowthcrm.com/crm-for-realtors-australia" },
    ]);
  });

  it("resolves country-hub clusters with their language subpages", () => {
    const ng = getHreflangTags("/ng");
    expect(ng.map((t) => t.hreflang)).toEqual(
      expect.arrayContaining(["en-NG", "yo-NG", "ha-NG", "ig-NG", "x-default"]),
    );
  });

  it("returns the homepage and pricing clusters", () => {
    expect(langsOf("/")).toContain("en-IN");
    expect(langsOf("/pricing")).toContain("en-IN");
  });

  it("falls back to a generic en/en-US/x-default set for unknown paths", () => {
    expect(langsOf("/random-page")).toEqual(["en", "en-US", "x-default"]);
  });
});

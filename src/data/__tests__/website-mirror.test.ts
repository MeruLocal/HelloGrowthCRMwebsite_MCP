import { describe, expect, it } from "vitest";
import {
  COMPANY,
  CONTACTS,
  COUNTRIES,
  COUNTRY_PRICING,
  MANAGED_REVOPS,
  PRODUCTS,
  SITEMAPS,
  SCHEMA_TYPES,
  RETIRED_SCHEMA_TYPES,
  SUPPORT_HOURS,
  SYNCED_AT,
  getRegionalContact,
  getSupportHours,
  getCanonicalUrl,
  getHreflangTags,
  getHreflangLanguageMap,
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
    // IN, US and GLOBAL desks (GLOBAL mirrors GLOBAL_CONTACT on the website).
    expect(CONTACTS).toHaveLength(3);
  });

  it("never advertises FAQPage — it is retired site-wide", () => {
    expect(RETIRED_SCHEMA_TYPES).toContain("FAQPage");
    expect(SCHEMA_TYPES.map((s) => s.type)).not.toContain("FAQPage");
  });

  it("publishes only public profile URLs in sameAs", () => {
    for (const url of COMPANY.sameAs) {
      expect(url, `${url} must not be a logged-in-only URL`).not.toMatch(/\/admin\//);
    }
    // The LinkedIn entry is the public vanity URL, not the numeric admin page.
    expect(COMPANY.sameAs[0]).toBe("https://www.linkedin.com/company/hellogrowthcrm/");
    // Software Advice moved to the numeric Gartner listing ID; the old slug 404s.
    expect(COMPANY.sameAs).toContain(
      "https://www.softwareadvice.com/product/539392-HelloGrowthCRM/",
    );
    // 2026-08-31: this GitHub URL 404s. A dead entry in sameAs breaks the exact
    // entity link it was added to make, and does it silently.
    expect(COMPANY.sameAs).not.toContain("https://github.com/hellogrowthcrm");
    expect(COMPANY.sameAs).toContain("https://github.com/hellocrmmerufintech-star");
  });

  it("spells each social account the same way in sameAs and brand", () => {
    // The failure this guards is the one sameAs exists to prevent: the same
    // account written two different ways across surfaces. GitHub had it (a 404ing
    // URL in sameAs, a working one in brand) and YouTube acquired it when the
    // channel-ID form was added to sameAs while brand kept the @handle.
    expect(COMPANY.sameAs).toContain(COMPANY.brand.github);
    expect(COMPANY.sameAs).toContain(COMPANY.brand.youtube);
    expect(COMPANY.sameAs).toContain(COMPANY.brand.linkedin);
    expect(COMPANY.sameAs).toContain(COMPANY.brand.x);
  });
});

describe("COUNTRY_PRICING", () => {
  it("quotes the Growth CRM plan per user, not the Managed RevOps retainer", () => {
    const usa = COUNTRY_PRICING.find((p) => p.countrySlug === "usa")!;
    expect(usa.growthPriceShort).toBe("$10/user/mo");
    expect(usa.growthPriceMonthly).toBe("$13/user/mo monthly");
    // Regression guard: the retainer figures must never reappear here.
    for (const row of COUNTRY_PRICING) {
      expect(row.growthPriceShort, `${row.countrySlug} looks like a retainer`).not.toMatch(
        /[\d,]{4,}/,
      );
    }
  });

  it("carries no Starter tier — the ladder is Free → Growth → Enterprise", () => {
    for (const row of COUNTRY_PRICING) {
      expect(row).not.toHaveProperty("starterPriceShort");
      expect(row.pricingSummaryLine).toContain("Free Forever");
      expect(row.pricingSummaryLine).toContain("Enterprise");
      expect(row.pricingSummaryLine).not.toContain("Starter");
    }
  });

  it("gives every market payment methods and a compliance note", () => {
    for (const row of COUNTRY_PRICING) {
      expect(row.paymentMethods.length).toBeGreaterThan(0);
      expect(row.compliance.length).toBeGreaterThan(0);
    }
  });
});

describe("MANAGED_REVOPS", () => {
  it("holds the flat retainers at their current prices", () => {
    expect(MANAGED_REVOPS.usa).toEqual([
      { slug: "growth-engine", name: "Growth Engine", priceLabel: "$1,499/mo flat", priceValue: "1499", priceCurrency: "USD" },
      { slug: "revops-partner", name: "RevOps Partner", priceLabel: "$3,999/mo flat", priceValue: "3999", priceCurrency: "USD" },
    ]);
  });

  it("covers every country market plus a global default", () => {
    expect(MANAGED_REVOPS.global).toBeTruthy();
    for (const c of COUNTRIES) {
      expect(MANAGED_REVOPS[c.code], `revops tiers for ${c.code}`).toHaveLength(2);
    }
  });
});

describe("getRegionalContact", () => {
  it("returns the India desk for IN (any casing)", () => {
    expect(getRegionalContact("in").region).toBe("IN");
    expect(getRegionalContact("IN").region).toBe("IN");
  });
  it("returns the US desk for US and for an unset code", () => {
    expect(getRegionalContact("US").region).toBe("US");
    expect(getRegionalContact(undefined).region).toBe("US");
    expect(getRegionalContact(null).region).toBe("US");
  });
  it("returns the Global desk for any other country", () => {
    expect(getRegionalContact("fr").region).toBe("GLOBAL");
    expect(getRegionalContact("DE").label).toBe("Global support");
  });
});

describe("getSupportHours", () => {
  it("advertises the 9 AM-6 PM Eastern US window", () => {
    expect(getSupportHours("US").short).toBe("Mon–Fri, 9 AM–6 PM ET (6 AM–3 PM PT)");
    expect(SUPPORT_HOURS.US.spec.closes).toBe("18:00");
  });
  it("routes IN and CA to their own windows and everything else to GLOBAL", () => {
    expect(getSupportHours("IN").timeZone).toBe("Asia/Kolkata");
    expect(getSupportHours("CA").timeZone).toBe("America/Toronto");
    expect(getSupportHours("fr").label).toBe("Support hours");
  });
  it("keeps CONTACTS.hours in sync with SUPPORT_HOURS", () => {
    expect(CONTACTS[0].hours).toBe(SUPPORT_HOURS.IN.short);
    expect(CONTACTS[1].hours).toBe(SUPPORT_HOURS.US.short);
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
  it("puts the public brand in name and the legal entity in legalName", () => {
    const org = orgSchema();
    expect(org["@type"]).toBe("Organization");
    expect(org.name).toBe(COMPANY.name);
    expect(org.legalName).toBe(COMPANY.legalName);
    expect(Array.isArray(org.sameAs)).toBe(true);
  });

  it("never repeats the brand name inside alternateName", () => {
    const org = orgSchema();
    expect(org.alternateName).not.toContain(COMPANY.name);
    expect(org.alternateName).toContain(COMPANY.legalName);
  });
});

describe("getHreflangTags", () => {
  const langsOf = (path: string) => getHreflangTags(path).map((t) => t.hreflang);

  it("returns the India language cluster for /in and language slugs", () => {
    expect(langsOf("/in")).toContain("en-IN");
    expect(langsOf("/in")).toContain("hi");
    expect(langsOf("/in/crm-tamil")).toContain("ta");
  });

  it("lists the Arabic UAE homepage in the hub-level cluster", () => {
    expect(langsOf("/")).toContain("ar-AE");
    // /uae/crm-arabic returns the same full mesh — fully reciprocal.
    expect(langsOf("/uae/crm-arabic")).toContain("ar-AE");
    expect(langsOf("/uae/crm-arabic")).toContain("en-AE");
  });

  it("returns the global market cluster for market roots", () => {
    const langs = langsOf("/usa");
    expect(langs).toContain("en");
    expect(langs).toContain("en-US");
    expect(langs).toContain("x-default");
  });

  it("handles market-scoped suffixes like /uk/pricing", () => {
    expect(langsOf("/uk/pricing")).toContain("en-GB");
  });

  it("meshes /free-trial and /tools across all markets (site change 2026-08-05)", () => {
    expect(langsOf("/free-trial")).toContain("en-GB");
    expect(langsOf("/au/free-trial")).toContain("en-AU");
    expect(langsOf("/tools")).toContain("en-IN");
    expect(langsOf("/uk/tools")).toContain("en-US");
    // /demo is deliberately excluded — /au/demo 301s to /demo.
    expect(getHreflangTags("/au/demo")).toEqual([]);
  });

  it("drops per-market variants for category combos that 404", () => {
    const langs = langsOf("/industries/categories/agriculture-allied");
    expect(langs).toContain("en-IN");
    expect(langs).not.toContain("en-US");
    expect(langs).not.toContain("en-GB");
  });

  it("pairs /crm-canada with /canada/fr bidirectionally", () => {
    const canada = getHreflangLanguageMap("/crm-canada");
    expect(canada["en-CA"]).toBe("https://hellogrowthcrm.com/crm-canada");
    expect(canada["fr-CA"]).toBe("https://hellogrowthcrm.com/canada/fr");

    const fr = getHreflangLanguageMap("/canada/fr");
    expect(fr["fr-CA"]).toBe("https://hellogrowthcrm.com/canada/fr");
    expect(fr["en-CA"]).toBe("https://hellogrowthcrm.com/crm-canada");
  });

  it("suppresses deeper French pages that have no English twin", () => {
    // fr-CA + x-default both self-referencing = a cluster of one.
    expect(getHreflangTags("/canada/fr/tarifs")).toEqual([]);
  });

  it("resolves country-hub clusters with their language subpages", () => {
    expect(langsOf("/ng")).toEqual(
      expect.arrayContaining(["en-NG", "yo-NG", "ha-NG", "ig-NG", "x-default"]),
    );
  });

  it("no longer treats /ae as a hub — it 301s to /uae (site change 2026-07-14)", () => {
    expect(getHreflangTags("/ae")).toEqual([]);
    expect(getHreflangTags("/ae/crm-arabic")).toEqual([]);
  });

  it("returns the homepage and pricing clusters", () => {
    expect(langsOf("/")).toContain("en-IN");
    expect(langsOf("/pricing")).toContain("en-IN");
  });

  /**
   * Cluster-of-one suppression (site behaviour since 2026-07-31). A tag set in
   * which every tag resolves to the same URL declares no alternate for anyone,
   * so the site emits nothing at all. These pages still resolve to the right
   * LOCALE internally — the rule below only decides whether the set is worth
   * emitting.
   */
  describe("cluster-of-one suppression", () => {
    it.each([
      ["/crm-singapore"],
      ["/crm-uae"],
      ["/crm-dubai"],
      ["/real-estate-crm-dubai"],
      ["/crm-usa"],
      ["/crm-for-builders"],
      ["/crm-for-agencies-uk"],
      ["/crm-for-realtors-australia"],
      ["/crm-germany"],
      ["/random-page"],
    ])("emits nothing for %s", (path) => {
      expect(getHreflangTags(path)).toEqual([]);
    });

    it("leaves genuine multi-URL clusters untouched", () => {
      for (const path of ["/", "/pricing", "/usa", "/in/crm-hindi", "/ng", "/crm-canada"]) {
        expect(getHreflangTags(path).length, path).toBeGreaterThan(1);
      }
    });
  });
});

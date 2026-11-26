import { describe, expect, it } from "vitest";
import { faqsGetSite } from "../faqs.js";
import { solutionsGetManagedRevops } from "../solutions.js";
import { pricingGetCountryPlans } from "../pricing.js";
import { countryGet } from "../countries.js";
import { agentsList, agentsGet } from "../agents.js";
import { switchGetGuide, alternativesGet } from "../alternatives.js";
import {
  integrationsList,
  integrationsGet,
  LIVE_INTEGRATION_COUNT,
  WEBSITE_LIVE_INTEGRATION_COUNT,
  PRODUCT_COMING_SOON_SLUGS,
} from "../integrations.js";
import { guidesGet } from "../guides.js";
import { featuresListProducts } from "../features.js";
import { changelogListReleases } from "../changelog.js";

/**
 * Claims truth (live MCP audit 2026-11-19). Each assertion pins a claim the
 * server made that the product does not support:
 *   - SOC 2 Type II / "SOC 2 certified" / "US data centers" / a signed BAA —
 *     no SOC 2 report has been verified;
 *   - "ML-based" lead routing (routing is rules + round-robin);
 *   - every call transcribed / AI summaries on dialer calls (only AI-agent calls
 *     are summarised automatically; dialer transcripts are on request, rolling out);
 *   - AI forecasting (the forecast is stage-probability weighted);
 *   - integrations the website calls live whose product Connect shows Coming soon;
 *   - "WhatsApp-first" positioning and the "Only CRM MCP Server" superlative.
 */

type Tool = { handle: (a: never) => Promise<{ content: { text: string }[]; isError?: boolean }> };
async function text(tool: Tool, args: unknown): Promise<string> {
  const res = await tool.handle(args as never);
  expect(res.isError).toBeFalsy();
  return res.content.map((c) => c.text).join("\n");
}

const UNVERIFIED_COMPLIANCE = /SOC ?2|data cent(er|re)s?|\bBAA\b/i;

describe("claims truth — no unverified compliance claims", () => {
  const SURFACES: [string, Tool, unknown][] = [
    ["faqs_get_site", faqsGetSite, {}],
    ["solutions_get_managed_revops", solutionsGetManagedRevops, {}],
    ["solutions_get_managed_revops usa", solutionsGetManagedRevops, { country: "usa" }],
    ["pricing_get_country_plans", pricingGetCountryPlans, {}],
    ["country_get in", countryGet, { code: "in" }],
    ["changelog_list_releases", changelogListReleases, { limit: 20 }],
  ];
  for (const [label, tool, args] of SURFACES) {
    it(`${label}: no SOC 2 / data-centre / BAA claim`, async () => {
      expect(await text(tool, args)).not.toMatch(UNVERIFIED_COMPLIANCE);
    });
  }
});

describe("claims truth — capability over-claims", () => {
  it("lead routing is rules-based, not ML", async () => {
    const out = await text(agentsGet, { slug: "lead-routing-agent" });
    expect(out).not.toMatch(/ML-based|machine learning/i);
    expect(out).toMatch(/round-robin/);
  });

  it("post-call agent does not claim to transcribe every call", async () => {
    const out = await text(agentsGet, { slug: "post-call-agent" });
    expect(out).not.toMatch(/from every call|Full call transcription|All calls are transcribed|above 90%/i);
    expect(out).toMatch(/on request/i);
  });

  it("MCP connector carries no 'Only' superlative or WhatsApp-led framing", async () => {
    const out = await text(agentsList, {});
    expect(out).not.toMatch(/The Only CRM MCP|90% of deals close on WhatsApp/i);
  });

  it("dialer is not sold with AI summaries in competitor comparisons", async () => {
    for (const slug of ["trello", "copper-crm", "insightly", "keap", "leadsquared", "microsoft-dynamics-365", "kylas", "kommo"]) {
      const res = await switchGetGuide.handle({ slug } as never);
      if (res.isError) continue;
      expect(res.content[0]!.text, slug).not.toMatch(/AI summaries|AI forecasting/);
    }
  });

  it("product pages describe the forecast as probability-weighted and the dialer honestly", async () => {
    const out = await text(featuresListProducts, { status: "all" });
    expect(out).not.toMatch(/AI-assisted revenue forecasting|recording, and AI summaries/);
    expect(out).toMatch(/Probability-weighted/);
  });

  it("call transcription guides no longer say every call is processed automatically", async () => {
    for (const slug of ["call-transcription", "ai-call-summaries"]) {
      const json = JSON.parse(await text(guidesGet, { slug }));
      expect(json.tagline).not.toMatch(/^Every call automatically/);
      expect(json.product_truth_note).toBeTruthy();
    }
  });
});

describe("claims truth — integrations", () => {
  it("stubbed integrations are marked and excluded from the working count", async () => {
    expect(PRODUCT_COMING_SOON_SLUGS.size).toBeGreaterThan(0);
    expect(LIVE_INTEGRATION_COUNT).toBe(WEBSITE_LIVE_INTEGRATION_COUNT - PRODUCT_COMING_SOON_SLUGS.size);
    const json = JSON.parse(await text(integrationsList, {}));
    expect(json.public_integration_count).toBe(LIVE_INTEGRATION_COUNT);
    expect(json.product_coming_soon_count).toBe(PRODUCT_COMING_SOON_SLUGS.size);
    const marked = (json.items as { slug: string; product_status?: string }[]).filter((i) => i.product_status === "coming-soon");
    expect(marked.map((i) => i.slug).sort()).toEqual([...PRODUCT_COMING_SOON_SLUGS].sort());
  });

  it("every overlay slug exists in the mirrored catalog", async () => {
    for (const slug of PRODUCT_COMING_SOON_SLUGS) {
      const json = JSON.parse(await text(integrationsGet, { slug }));
      expect(json.product_status, slug).toBe("coming-soon");
    }
  });

  it("a working integration carries no product_status", async () => {
    const json = JSON.parse(await text(integrationsGet, { slug: "shopify" }));
    expect(json.product_status).toBeUndefined();
  });
});

describe("brand — never WhatsApp-first", () => {
  it("vtiger and kylas switch guides describe a multi-channel product", async () => {
    for (const slug of ["vtiger", "kylas"]) {
      const out = await text(switchGetGuide, { slug });
      expect(out, slug).not.toMatch(/WhatsApp-first/i);
      expect(out, slug).toMatch(/multi-channel/i);
    }
  });

  it("alternatives_get never calls HelloGrowthCRM WhatsApp-first", async () => {
    const res = await alternativesGet.handle({ slug: "vtiger" } as never);
    if (!res.isError) expect(res.content[0]!.text).not.toMatch(/HelloGrowthCRM is built for the WhatsApp-first/);
  });
});

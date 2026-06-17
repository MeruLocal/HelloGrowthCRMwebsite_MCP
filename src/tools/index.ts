/**
 * Central registry of MCP tools exposed by this server.
 *
 * Adding a new tool: create it under `src/tools/`, then drop it into the
 * `tools` array below. The server picks the rest up automatically.
 */

// ── Bot detection (original) ──────────────────────────────────────────────────
import { analyzeAccessLogs } from "./analyze-access-logs.js";
import { exportBotReport } from "./export-bot-report.js";
import { generateRobotsTxt } from "./generate-robots-txt.js";
import { listAllowedBots } from "./list-allowed-bots.js";
import { listBlockedBots } from "./list-blocked-bots.js";
import { scanWebsiteBots } from "./scan-website-bots.js";
import { suggestBotPolicy } from "./suggest-bot-policy.js";
import { verifyBotIdentityTool } from "./verify-bot-identity.js";

// ── Page content (live crawl → readable content) ──────────────────────────────
import { fetchPageContent, crawlPages } from "./fetch-page-content.js";

// ── Blog ──────────────────────────────────────────────────────────────────────
import {
  blogList,
  blogGet,
  blogSearch,
  blogCreate,
  blogUpdate,
  blogRevalidate,
  blogGetCategories,
} from "./blog.js";

// ── Help center ───────────────────────────────────────────────────────────────
import {
  helpListCategories,
  helpListArticles,
  helpGetArticle,
  helpSearch,
  helpCreateArticle,
  helpUpdateArticle,
} from "./help.js";

// ── Newsletter ────────────────────────────────────────────────────────────────
import {
  newsletterSubscribe,
  newsletterUnsubscribe,
  newsletterGetSubscribers,
  newsletterGetStats,
} from "./newsletter.js";

// ── Contact forms ─────────────────────────────────────────────────────────────
import {
  formsListSubmissions,
  formsGetSubmission,
  formsSubmit,
  formsExportCsv,
} from "./forms.js";

// ── Static content ────────────────────────────────────────────────────────────
import {
  contentListCaseStudies,
  contentGetComparison,
  contentListComparisons,
  contentListIndustries,
  contentListTools,
  contentGetSeoRules,
} from "./content.js";

// ── Pricing ───────────────────────────────────────────────────────────────────
import {
  pricingGetPlans,
  pricingGetAddons,
  pricingGetFaq,
  pricingComparePlans,
  pricingGetCountryPlans,
} from "./pricing.js";

// ── Features ──────────────────────────────────────────────────────────────────
import {
  featuresList,
  featuresGet,
  featuresListProducts,
} from "./features.js";

// ── Analytics ─────────────────────────────────────────────────────────────────
import {
  analyticsSocialProof,
} from "./analytics.js";

// ── Countries (country-specific markets & SEO) ─────────────────────────────────
import { countriesList, countryGet } from "./countries.js";

// ── Company / contact ──────────────────────────────────────────────────────────
import { companyGetProfile, companyGetContacts } from "./company.js";

// ── SEO (site config, hreflang, canonical, sitemaps, schema) ───────────────────
import {
  seoGetSiteConfig,
  seoGetHreflang,
  seoGetCanonical,
  seoGetSitemaps,
  seoGetSchema,
} from "./seo.js";

// ── Products ──────────────────────────────────────────────────────────────────
import { productsList, productGet } from "./products.js";

// ── Integrations catalog ──────────────────────────────────────────────────────
import {
  integrationsList,
  integrationsGet,
  integrationsListCategories,
} from "./integrations.js";

// ── AI Agents (Agentic AI) ────────────────────────────────────────────────────
import {
  agentsList,
  agentsGet,
  agentsGetAutonomyLevels,
  agentsListComparisons,
} from "./agents.js";

// ── Glossary ──────────────────────────────────────────────────────────────────
import { glossaryListTerms, glossaryGetTerm } from "./glossary.js";

// ── Templates ─────────────────────────────────────────────────────────────────
import { templatesList, templatesGet } from "./templates.js";

// ── Feature guides ────────────────────────────────────────────────────────────
import { guidesList, guidesGet } from "./guides.js";

// ── Alternatives & switch-from migration guides ───────────────────────────────
import {
  alternativesList,
  alternativesGet,
  switchListCompetitors,
  switchGetGuide,
} from "./alternatives.js";

// ── Changelog / What's New ────────────────────────────────────────────────────
import { changelogListReleases, changelogGetRelease } from "./changelog.js";

// ── Site FAQs ─────────────────────────────────────────────────────────────────
import { faqsGetSite } from "./faqs.js";

// ── Media (videos & testimonials) ─────────────────────────────────────────────
import { mediaListVideos, mediaListTestimonials } from "./media.js";

// ── Partner program ───────────────────────────────────────────────────────────
import {
  partnersGetProgram,
  partnersGetApplicationSchema,
} from "./partners.js";

// ── Solutions (WhatsApp use cases, Managed RevOps) ────────────────────────────
import {
  solutionsListWhatsappUseCases,
  solutionsGetManagedRevops,
} from "./solutions.js";

import type { RegisteredTool } from "./tool-types.js";

export const tools: RegisteredTool[] = [
  // Bot detection
  scanWebsiteBots,
  analyzeAccessLogs,
  verifyBotIdentityTool,
  listAllowedBots,
  listBlockedBots,
  generateRobotsTxt,
  suggestBotPolicy,
  exportBotReport,

  // Page content (live crawl → readable content)
  fetchPageContent,
  crawlPages,

  // Blog
  blogList,
  blogGet,
  blogSearch,
  blogCreate,
  blogUpdate,
  blogRevalidate,
  blogGetCategories,

  // Help center
  helpListCategories,
  helpListArticles,
  helpGetArticle,
  helpSearch,
  helpCreateArticle,
  helpUpdateArticle,

  // Newsletter
  newsletterSubscribe,
  newsletterUnsubscribe,
  newsletterGetSubscribers,
  newsletterGetStats,

  // Contact forms
  formsListSubmissions,
  formsGetSubmission,
  formsSubmit,
  formsExportCsv,

  // Static content
  contentListCaseStudies,
  contentGetComparison,
  contentListComparisons,
  contentListIndustries,
  contentListTools,
  contentGetSeoRules,

  // Pricing
  pricingGetPlans,
  pricingGetAddons,
  pricingGetFaq,
  pricingComparePlans,
  pricingGetCountryPlans,

  // Features
  featuresList,
  featuresGet,
  featuresListProducts,

  // Analytics
  analyticsSocialProof,

  // Countries (country-specific markets & SEO)
  countriesList,
  countryGet,

  // Company / contact
  companyGetProfile,
  companyGetContacts,

  // SEO (site config, hreflang, canonical, sitemaps, schema)
  seoGetSiteConfig,
  seoGetHreflang,
  seoGetCanonical,
  seoGetSitemaps,
  seoGetSchema,

  // Products
  productsList,
  productGet,

  // Integrations catalog
  integrationsList,
  integrationsGet,
  integrationsListCategories,

  // AI Agents (Agentic AI)
  agentsList,
  agentsGet,
  agentsGetAutonomyLevels,
  agentsListComparisons,

  // Glossary
  glossaryListTerms,
  glossaryGetTerm,

  // Templates
  templatesList,
  templatesGet,

  // Feature guides
  guidesList,
  guidesGet,

  // Alternatives & switch-from migration guides
  alternativesList,
  alternativesGet,
  switchListCompetitors,
  switchGetGuide,

  // Changelog / What's New
  changelogListReleases,
  changelogGetRelease,

  // Site FAQs
  faqsGetSite,

  // Media (videos & testimonials)
  mediaListVideos,
  mediaListTestimonials,

  // Partner program
  partnersGetProgram,
  partnersGetApplicationSchema,

  // Solutions (WhatsApp use cases, Managed RevOps)
  solutionsListWhatsappUseCases,
  solutionsGetManagedRevops,
];

export const toolsByName: Map<string, RegisteredTool> = new Map(
  tools.map((t) => [t.definition.name, t]),
);

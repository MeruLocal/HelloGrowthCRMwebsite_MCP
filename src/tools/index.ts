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

  // Features
  featuresList,
  featuresGet,
  featuresListProducts,

  // Analytics
  analyticsSocialProof,
];

export const toolsByName: Map<string, RegisteredTool> = new Map(
  tools.map((t) => [t.definition.name, t]),
);

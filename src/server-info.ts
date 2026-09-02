/**
 * Single source of truth for this server's wire identity (finding X).
 *
 * The server previously self-identified as a pure "Bot detection & governance"
 * server while the published manifest sold it as a CRM integration — and the
 * server actually mirrors the whole hellogrowthcrm.com website (88 tools,
 * 9 resources) on top of the bot-governance tools. serverInfo, the landing
 * page, the /version endpoint and the logs all read from here so the identity
 * cannot drift again.
 *
 * SERVER_VERSION must match package.json / server.json — enforced by
 * scripts/check-versions.mjs (see RELEASING.md).
 */

export const SERVER_NAME = "hellogrowthcrm-website";

export const SERVER_TITLE = "HelloGrowthCRM Website & Bot Governance MCP";

export const SERVER_VERSION = "2.0.0";

export const SERVER_DESCRIPTION =
  "Read-only website mirror + bot governance MCP server for hellogrowthcrm.com. " +
  "The public endpoint serves HelloGrowthCRM product knowledge (pricing, " +
  "features, integrations, comparisons, guides) as tools and resources, plus " +
  "bot detection, crawler verification and robots.txt governance tools. It " +
  "requires no API key and returns no personal data. This is NOT a CRM API and " +
  "performs no CRM actions — never send CRM credentials to this server. " +
  "Content-management tools that write to the website, and the tools that read " +
  "newsletter subscribers or contact-form submissions, are not served on the " +
  "public endpoint; they require an authenticated session (see MCP_ADMIN_TOKEN).";

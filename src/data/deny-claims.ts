/**
 * Deny list for the truth guard (src/tools/__tests__/truth-guard.test.ts).
 *
 * Each entry is a CLAIM about HelloGrowthCRM that the product audit of
 * 2026-10-24..28 showed is not true in code. The guard fails if any pattern
 * matches served content. Every pattern carries:
 *   - a positive example it MUST match (so a refactor cannot silently weaken it),
 *   - a negative example it must NOT match (a correction or a true statement),
 *   - a known-truth id (`kt`) or the decision that justifies it.
 *
 * Known-truth ids refer to the HelloGrowthCRM product audit, summarised in
 * src/data/claim-overrides.ts. Patterns target statements about HelloGrowthCRM;
 * true statements about competitors are covered by COMPETITOR_ALLOW (file+text),
 * not by weakening a pattern.
 */

export interface DenyClaim {
  id: string;
  regex: RegExp;
  kt: string;
  positive: string;
  negative: string;
  note: string;
}

export const DENY_CLAIMS: readonly DenyClaim[] = [
  {
    id: "soc2-asserted",
    regex: /\b(?:is|are|was|completed|achieved|holds?|with)\s+(?:a\s+)?SOC\s?2(?:\s+Type\s+(?:II|2))?\b(?!\s+(?:status|work|is not|not))|SOC\s?2\s+(?:certified|certification\s+(?:is|achieved|complete)|compliant)|\bSOC\s?2\s+Type\s+II\b(?!\s+(?:at|from|of)\s+(?:Zoho|HubSpot|Salesforce|competitor))/i,
    kt: "KT-12",
    positive: "HelloGrowthCRM is SOC 2 Type II with AES-256 encryption",
    negative: "This server does not state a certification; ask the company for security documentation.",
    note: "SOC 2 report is unverified. State no certification, examination or report.",
  },
  {
    id: "tally-sync",
    regex: /\b(?:Tally\s?(?:Prime|ERP)|Tally\s+(?:sync|integration|accounting))\b[^.\n]{0,80}\b(?:sync|syncs|bidirectional|ledger|imports?|exports?)\b|\bsyncs?\b[^.\n]{0,60}\bwith\s+Tally\b(?!\.so)/i,
    kt: "KT-20",
    positive: "HelloGrowthCRM syncs customer records and invoice status with Tally",
    negative: "there is no TallyPrime accounting sync; Tally.so form submissions become leads",
    note: "Only Tally.so form submissions create leads; TallyPrime/Tally ERP has no sync.",
  },
  {
    id: "indian-gateways-live",
    regex: /\b(?:Cashfree|PayU|Paytm|PhonePe|Instamojo)\b[^.\n]{0,60}\b(?:payment\s+links?|gateway)\b[^.\n]{0,40}\b(?:supported|live|available|works?|included)\b/i,
    kt: "KT-18",
    positive: "Cashfree gateway payment links are available",
    negative: "Cashfree: the card is listed live but create_link returns HTTP 501",
    note: "Payment-link dialog offers Razorpay and Stripe only; Cashfree returns 501; PayU/Paytm have no handler.",
  },
  {
    id: "scheduled-reports",
    regex: /\b(?:scheduled|emailed|recurring)\s+reports\b(?![^.\n]{0,40}\b(?:not|no|never|without)\b)/i,
    kt: "KT-5",
    positive: "Unlimited exports + scheduled reports",
    negative: "there are no user-configurable scheduled or emailed reports",
    note: "No user-configurable scheduled or emailed reports; only a fixed owner digest behind a flag.",
  },
  {
    id: "unlimited-pipelines",
    regex: /\bunlimited\s+(?:sales\s+)?pipelines?\b/i,
    kt: "KT-17",
    positive: "Unlimited leads, contacts & deals with unlimited pipelines",
    negative: "one pipeline on every plan; the plan cap is lead stages",
    note: "One pipeline on every plan.",
  },
  {
    id: "gst-included-prices",
    regex: /\b(?:prices?|₹\s?899)[^.\n?]{0,40}\b(?:include|includes|inclusive of)\s+GST\b(?!\s*\?)/i,
    kt: "KT-10",
    positive: "All India prices include GST",
    negative: "INR 899 per user per month plus 18% GST",
    note: "INR 899 + 18% GST on both billing modes.",
  },
  {
    id: "data-residency",
    regex: /\b(?:data\s+(?:is\s+)?(?:stored|hosted|resides?)\s+in\s+(?:the\s+)?(?:US|India|EU|UK)|(?:US|Indian|EU)\s+data\s+cent(?:er|re)s|India\s+data\s+residency\s+available)\b/i,
    kt: "decision-101",
    positive: "daily backups in US data centers",
    negative: "this server states no data-residency position",
    note: "Residency claims were removed in PR #101; no verified position exists (founder decision pending).",
  },
  {
    id: "integration-count-630",
    regex: /\b630\+?\s*(?:integrations|apps)\b/i,
    kt: "KT-19",
    positive: "API access & all 630 integrations",
    negative: "194 integrations with working connect or inbound code",
    note: "Defensible public number is 190+; 630 is the catalogue length including unbuilt entries.",
  },
] as const;

/**
 * Competitor rows that legitimately mention a denied topic about a COMPETITOR
 * (for example "Zoho offers SOC 2"). Keyed by exact text so an allow-list entry
 * cannot silently cover a new claim. Empty today: the Tally rows were corrected.
 */
export const COMPETITOR_ALLOW: readonly { file: string; text: string; why: string }[] = [];

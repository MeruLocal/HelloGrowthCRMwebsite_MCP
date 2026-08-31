/**
 * website-mirror.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Centralized, typed mirror of hellogrowthcrm.com's source-of-truth SEO/content
 * data. The WEBSITE is the source of truth; this file is a downstream copy that
 * the MCP tools expose to LLM clients.
 *
 * SYNC POLICY
 *   When the website changes any of the source files below, re-extract the
 *   matching block here and bump SYNCED_AT. Never edit these values to differ
 *   from the website — that would re-introduce drift.
 *
 * PROVENANCE (hellocrmwebsite/src/…)
 *   COMPANY ............ lib/seo/site.ts (SITE) + lib/brand.ts
 *   CONTACTS ........... lib/contact-matrix.ts + lib/support-hours.ts
 *   COUNTRIES .......... lib/country-industry-categories.ts + lib/home-market.ts
 *   COUNTRY_PRICING .... lib/pricing-{usa,uk,au,canada,uae,singapore,nz,india}-data.ts
 *                        + lib/market-pricing.ts
 *   MANAGED_REVOPS ..... lib/managed-revops-content.ts (MANAGED_REVOPS_CONTENT)
 *   PRODUCTS ........... lib/product-feature-pages.ts (PRODUCT_FEATURE_PAGES)
 *   HREFLANG ........... lib/hreflang.ts (getHreflangTags)
 *   SITEMAPS ........... app/sitemap-index.xml + app/*-sitemap.xml routes
 *   SCHEMA ............. lib/seo/schema.ts (orgSchema, softwareAppSchema, …)
 */

export const SYNCED_AT = "2026-08-06";
export const WEBSITE_SOURCE_OF_TRUTH = "https://hellogrowthcrm.com";

/* ── Company / Organization (lib/seo/site.ts + lib/brand.ts) ─────────────────── */

export const COMPANY = {
  name: "HelloGrowthCRM",
  /** Operating legal entity (Delaware, USA; SOC 2 certified under this name). */
  legalName: "Soor LLC",
  /** India operating entity. */
  indiaLegalEntity: "Meru Technosoft Pvt. Ltd.",
  url: WEBSITE_SOURCE_OF_TRUTH,
  twitter: "@hellogrowthcrm",
  foundingDate: "2022-01-01",
  defaultDescription:
    "AI-powered CRM for small business sales teams with lead scoring, built-in dialer, WhatsApp/SMS, email automation, forecasting, and optional Managed RevOps.",
  /**
   * Canonical AI-friendly brand description (AEO/GEO entity anchor) —
   * mirror of SITE.entityDescription in lib/seo/site.ts. Emitted as
   * Organization.description in the site-wide JSON-LD.
   */
  entityDescription:
    "HelloGrowthCRM is an AI-powered CRM for small and mid-sized sales teams that combines lead management, a built-in dialer, WhatsApp/SMS, email automation, quotes and invoicing, and AI insights with optional Managed RevOps specialists who run follow-up, pipeline hygiene, and weekly reporting.",
  alternateNames: ["HelloGrowthCRM", "Soor LLC"],
  /** Registered office (Organization.address). */
  address: {
    streetAddress: "16192 Coastal Hwy",
    addressLocality: "Lewes",
    addressRegion: "DE",
    postalCode: "19958",
    addressCountry: "US",
  },
  /**
   * Organization.sameAs profiles — exact order and values of SITE.sameAs.
   *
   * Fixed 2026-08-06: sameAs[0] was the LinkedIn *admin dashboard* URL
   * (/company/112020713/admin/dashboard/), a logged-in-only page that was being
   * published as a public entity profile. The website has always used the public
   * vanity URL. The Software Advice entry was also stale — the old
   * "/crm/hellogrowthcrm-profile/" slug 404s; the live profile is keyed by the
   * Gartner Digital Markets numeric listing ID (corrected on the site 2026-07-13).
   */
  sameAs: [
    "https://www.linkedin.com/company/hellogrowthcrm/",
    "https://x.com/hellogrowthcrm",
    // 2026-08-31: was "https://github.com/hellogrowthcrm", which 404s. A dead URL in
    // sameAs is worse than an absent one — it is the signal search engines and AI
    // answer engines use to consolidate an entity, and a 404 breaks that link.
    // brand.github already carried the account that resolves; the two disagreed.
    "https://github.com/hellocrmmerufintech-star",
    // YouTube was present in brand but missing from sameAs, so the 28 videos the
    // MCP already mirrors were not attached to the entity.
    "https://www.youtube.com/@HelloGrowthCRM",
    "https://www.instagram.com/hellogrowthcrm",
    "https://www.facebook.com/profile.php?id=61588263746188",
    "https://www.g2.com/products/hellogrowthcrm/reviews",
    "https://www.capterra.com/p/10037980/HelloGrowthCRM/",
    "https://www.producthunt.com/products/hellogrowthcrm",
    "https://www.softwareadvice.com/product/539392-HelloGrowthCRM/",
    "https://www.getapp.com/customer-management-software/a/hellogrowthcrm/",
    "https://play.google.com/store/apps/details?id=com.hellogrowthcrm.app",
  ],
  brand: {
    purpleHex: "#6344E7",
    blueHex: "#2B38A5",
    logoLight: "/HelloGrowthCRM_LIGHT_560.webp",
    logoDark: "/HelloGrowthCRM_DARK_560.webp",
    /** 324w srcset variants — the header renders ≤323 CSS px. */
    logoLight324: "/HelloGrowthCRM_LIGHT_324.webp",
    logoDark324: "/HelloGrowthCRM_DARK_324.webp",
    logoWidth: 560,
    logoHeight: 97,
    x: "https://x.com/hellogrowthcrm",
    github: "https://github.com/hellocrmmerufintech-star",
    linkedin: "https://www.linkedin.com/company/hellogrowthcrm/",
    youtube: "https://www.youtube.com/@HelloGrowthCRM",
    instagram: "https://www.instagram.com/hellogrowthcrm",
    facebook: "https://www.facebook.com/profile.php?id=61588263746188",
    productHunt: "https://www.producthunt.com/products/hellogrowthcrm",
    /** Review-site profiles verified live on the website 2026-07-13. */
    alternativeTo: "https://alternativeto.net/software/hellogrowthcrm/about/",
    slashdot: "https://slashdot.org/software/p/HelloGrowthCRM/alternatives",
    technologyAdvice: "https://technologyadvice.com/products/hellogrowthcrm/",
    softwareAdvice: "https://www.softwareadvice.com/product/539392-HelloGrowthCRM/",
  },
} as const;

/* ── Support hours (lib/support-hours.ts — ops-editable source of truth) ─────── */

export interface SupportHours {
  label: string;
  short: string;
  long: string;
  timeZone: string;
  spec: { dayOfWeek: string[]; opens: string; closes: string };
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const MON_TO_SAT = [...WEEKDAYS, "Saturday"];

/**
 * Mirror of SUPPORT_HOURS. The US window is 9 AM–6 PM Eastern, NOT the
 * "9am–5pm EST" this file previously claimed — the mirror was advertising a
 * shorter support window than the website does.
 */
export const SUPPORT_HOURS: Record<"IN" | "US" | "CA" | "GLOBAL", SupportHours> = {
  IN: {
    label: "India support hours",
    short: "Mon–Sat, 10 AM–7 PM IST",
    long: "Monday–Saturday, 10:00 AM–7:00 PM IST",
    timeZone: "Asia/Kolkata",
    spec: { dayOfWeek: MON_TO_SAT, opens: "10:00", closes: "19:00" },
  },
  US: {
    label: "US support hours",
    short: "Mon–Fri, 9 AM–6 PM ET (6 AM–3 PM PT)",
    long: "Monday–Friday, 9:00 AM–6:00 PM Eastern (6:00 AM–3:00 PM Pacific)",
    timeZone: "America/New_York",
    spec: { dayOfWeek: WEEKDAYS, opens: "09:00", closes: "18:00" },
  },
  CA: {
    label: "Canada support hours",
    short: "Mon–Fri, 9 AM–6 PM ET (6 AM–3 PM PT)",
    long: "Monday–Friday, 9:00 AM–6:00 PM Eastern (6:00 AM–3:00 PM Pacific)",
    timeZone: "America/Toronto",
    spec: { dayOfWeek: WEEKDAYS, opens: "09:00", closes: "18:00" },
  },
  GLOBAL: {
    label: "Support hours",
    short: "Mon–Fri, 9 AM–6 PM ET (6 AM–3 PM PT)",
    long: "Monday–Friday, 9:00 AM–6:00 PM Eastern (6:00 AM–3:00 PM Pacific)",
    timeZone: "America/New_York",
    spec: { dayOfWeek: WEEKDAYS, opens: "09:00", closes: "18:00" },
  },
};

/** Mirrors getSupportHours(): IN→IN, CA→CA, US/empty→US, anything else→GLOBAL. */
export function getSupportHours(countryCode?: string | null): SupportHours {
  const c = (countryCode ?? "").toUpperCase();
  if (c === "IN") return SUPPORT_HOURS.IN;
  if (c === "CA") return SUPPORT_HOURS.CA;
  if (c === "US" || !c) return SUPPORT_HOURS.US;
  return SUPPORT_HOURS.GLOBAL;
}

/* ── Regional contacts (lib/contact-matrix.ts) ───────────────────────────────── */

export interface RegionalContact {
  region: string;
  label: string;
  phoneE164: string;
  phoneDisplay: string;
  addressLabel: string;
  addressLines: string[];
  hours: string;
}

export const CONTACTS: RegionalContact[] = [
  {
    region: "IN",
    label: "India support",
    phoneE164: "+917069083968",
    phoneDisplay: "+91 70690 83968",
    addressLabel: "Ahmedabad, India",
    addressLines: [
      "902, 903, Shivalik Complex, Panchvati Cir, opp. Bank of Baroda nr",
      "Panchavati Society, Ambawadi, Ahmedabad, Gujarat 380006, India",
    ],
    hours: SUPPORT_HOURS.IN.short,
  },
  {
    region: "US",
    label: "US support",
    phoneE164: "+16073182126",
    phoneDisplay: "+1 607 318-2126",
    addressLabel: "Lewes, Delaware, USA",
    addressLines: ["16192 Coastal Hwy", "Lewes, DE 19958, USA"],
    hours: SUPPORT_HOURS.US.short,
  },
  {
    // GLOBAL_CONTACT on the website: same desk and address as US, different
    // label. Previously absent, so non-US/non-IN callers were told "US support".
    region: "GLOBAL",
    label: "Global support",
    phoneE164: "+16073182126",
    phoneDisplay: "+1 607 318-2126",
    addressLabel: "Lewes, Delaware, USA",
    addressLines: ["16192 Coastal Hwy", "Lewes, DE 19958, USA"],
    hours: SUPPORT_HOURS.US.short,
  },
];

/** Mirrors getRegionalContact(): IN→India, US/empty→US, anything else→Global. */
export function getRegionalContact(countryCode?: string | null): RegionalContact {
  const normalized = (countryCode ?? "").toUpperCase();
  if (normalized === "IN") return CONTACTS[0]!;
  if (!normalized || normalized === "US") return CONTACTS[1]!;
  return CONTACTS[2]!;
}

/* ── Country market contexts (lib/country-industry-categories.ts) ────────────── */

export interface CountryMarket {
  code: string;
  market: string;
  label: string;
  routePrefix: string;
  currency: string;
  currencySymbol: string;
  inLanguage: string;
  channels: string[];
  cities: string[];
  compliance: string;
  taxRef: string;
}

export const COUNTRIES: CountryMarket[] = [
  { code: "in", market: "india", label: "India", routePrefix: "/in", currency: "INR", currencySymbol: "₹", inLanguage: "en-IN", channels: ["WhatsApp", "IndiaMART", "Phone"], cities: ["Mumbai", "Bengaluru", "Delhi", "Pune", "Chennai", "Hyderabad", "Ahmedabad"], compliance: "GST, MSME and ICAI deadlines", taxRef: "GST" },
  { code: "usa", market: "usa", label: "United States", routePrefix: "/usa", currency: "USD", currencySymbol: "$", inLanguage: "en-US", channels: ["Email", "SMS", "LinkedIn"], cities: ["New York", "Los Angeles", "Chicago", "Houston", "Atlanta", "Dallas", "Boston"], compliance: "SOC 2, HIPAA and IRS filings", taxRef: "sales tax" },
  { code: "uk", market: "uk", label: "United Kingdom", routePrefix: "/uk", currency: "GBP", currencySymbol: "£", inLanguage: "en-GB", channels: ["Email", "Phone", "SMS"], cities: ["London", "Manchester", "Birmingham", "Edinburgh", "Leeds", "Bristol"], compliance: "GDPR, HMRC and FCA rules", taxRef: "VAT" },
  { code: "canada", market: "canada", label: "Canada", routePrefix: "/canada", currency: "CAD", currencySymbol: "C$", inLanguage: "en-CA", channels: ["Email", "Phone", "SMS"], cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton"], compliance: "PIPEDA, CRA filings and provincial HST/GST", taxRef: "HST/GST" },
  { code: "au", market: "australia", label: "Australia", routePrefix: "/au", currency: "AUD", currencySymbol: "A$", inLanguage: "en-AU", channels: ["Email", "SMS", "Phone"], cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast"], compliance: "Privacy Act, ATO BAS and ASIC filings", taxRef: "GST" },
  { code: "uae", market: "uae", label: "United Arab Emirates", routePrefix: "/uae", currency: "AED", currencySymbol: "AED", inLanguage: "en-AE", channels: ["WhatsApp", "Email", "Phone"], cities: ["Dubai", "Abu Dhabi", "Sharjah", "Ras Al Khaimah", "Ajman"], compliance: "VAT, ESR and free-zone rules", taxRef: "VAT" },
  { code: "singapore", market: "singapore", label: "Singapore", routePrefix: "/singapore", currency: "SGD", currencySymbol: "S$", inLanguage: "en-SG", channels: ["WhatsApp", "Email", "Phone"], cities: ["Singapore CBD", "Jurong", "Tampines", "Woodlands"], compliance: "PDPA, ACRA and IRAS GST", taxRef: "GST" },
  { code: "new-zealand", market: "new-zealand", label: "New Zealand", routePrefix: "/new-zealand", currency: "NZD", currencySymbol: "NZ$", inLanguage: "en-NZ", channels: ["Email", "SMS", "Phone"], cities: ["Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga"], compliance: "Privacy Act 2020, IRD and FMA rules", taxRef: "GST" },
];

/* ── Country pricing summaries (lib/pricing-*-data.ts + market-pricing.ts) ────── */

/**
 * RESTRUCTURED 2026-08-06 — the field names were wrong, not (mostly) the values.
 *
 * The previous shape carried two prices per market under names that described
 * neither of them:
 *   • `starterPriceShort` held the GROWTH CRM plan price. There is no Starter
 *     tier in any market — the ladder is Free Forever → Growth → Enterprise.
 *     India's ₹99 Starter was retired in 2026-06/07 and the field was left
 *     named after a plan nobody sells.
 *   • `growthPriceShort` held the Managed RevOps GROWTH ENGINE retainer — a
 *     flat monthly service fee, not a per-user CRM price. Two products with
 *     similar names sharing one field name.
 *
 * Most values were right. Reading the old rows correctly (starter=CRM,
 * growth=retainer), 7 of 8 CRM prices and 7 of 8 retainers matched the site.
 * Only India's retainer was genuinely wrong here — it duplicated the CRM price
 * (₹899) instead of carrying the retainer (₹39,999).
 *
 * The USA retainer discrepancy went the other way: the mirror said $1,500 and
 * managed-revops-content.ts said $1,499, but the site's own comparison pages
 * said $1,500 in eight places. $1,500 was correct and the WEBSITE was fixed
 * (hellocrmwebsite 2ebbaa4c, 49 files). Same for RevOps Partner: $4,000, not
 * $3,999. UK CRM is £8 per the site; the mirror's old £9 was stale.
 *
 * So this change is mainly about naming and structure: `growthPriceShort` now
 * means what it says, and the retainers move to MANAGED_REVOPS below.
 *
 * Note on currency symbols: COUNTRIES.currencySymbol for UAE is "AED"
 * (country-industry-categories.ts, used for prose) while the pricing surface
 * uses the Arabic "د.إ" (pricing-uae-data.ts). Both are correct for their own
 * context; they are deliberately not unified.
 */
export interface CountryPricingSummary {
  countryName: string;
  countrySlug: string;
  currencyCode: string;
  currencySymbol: string;
  homeHref: string;
  /** Growth plan, annual billing — the headline per-user price. */
  growthPriceShort: string;
  /** Growth plan billed monthly (higher than the annual rate). */
  growthPriceMonthly: string;
  /** Full plan-ladder line shown on the pricing page. */
  pricingSummaryLine: string;
  paymentMethods: string;
  compliance: string;
  pricingHref: string;
}

export const COUNTRY_PRICING: CountryPricingSummary[] = [
  {
    countryName: "India", countrySlug: "in", currencyCode: "INR", currencySymbol: "₹", homeHref: "/in",
    growthPriceShort: "₹899/user/mo", growthPriceMonthly: "₹1,099/user/mo monthly",
    pricingSummaryLine: "Free Forever · Growth ₹899/user/mo · Enterprise (custom) · 14-day trial on paid plans",
    paymentMethods: "UPI, Razorpay, Net Banking, Credit/Debit card",
    compliance: "DPDPA compliant, India data residency available",
    pricingHref: "/in/pricing",
  },
  {
    countryName: "United States", countrySlug: "usa", currencyCode: "USD", currencySymbol: "$", homeHref: "/usa",
    growthPriceShort: "$10/user/mo", growthPriceMonthly: "$13/user/mo monthly",
    pricingSummaryLine: "Free Forever · Growth $10/user/mo · Enterprise (custom) · 14-day trial on paid plans",
    paymentMethods: "Credit card, ACH, PayPal, Stripe",
    compliance: "SOC 2 Type II, CCPA compliant",
    pricingHref: "/usa/pricing",
  },
  {
    countryName: "United Kingdom", countrySlug: "uk", currencyCode: "GBP", currencySymbol: "£", homeHref: "/uk",
    growthPriceShort: "£8/user/mo", growthPriceMonthly: "£10/user/mo monthly",
    pricingSummaryLine: "Free Forever · Growth £8/user/mo · Enterprise (custom) · 14-day trial on paid plans",
    paymentMethods: "Credit/debit card, Stripe, GoCardless, bank transfer",
    compliance: "UK GDPR compliant, ICO-registered data processor",
    pricingHref: "/uk/pricing",
  },
  {
    countryName: "Australia", countrySlug: "au", currencyCode: "AUD", currencySymbol: "A$", homeHref: "/au",
    growthPriceShort: "A$16/user/mo", growthPriceMonthly: "A$20/user/mo monthly",
    pricingSummaryLine: "Free Forever · Growth A$16/user/mo · Enterprise (custom) · 14-day trial on paid plans",
    paymentMethods: "Credit card, Stripe, PayPal, BPAY",
    compliance: "Australian Privacy Act compliant",
    pricingHref: "/au/pricing",
  },
  {
    countryName: "Canada", countrySlug: "canada", currencyCode: "CAD", currencySymbol: "C$", homeHref: "/canada",
    growthPriceShort: "C$14/user/mo", growthPriceMonthly: "C$18/user/mo monthly",
    pricingSummaryLine: "Free Forever · Growth C$14/user/mo · Enterprise (custom) · 14-day trial on paid plans",
    paymentMethods: "Credit card, Stripe, PayPal, Interac e-Transfer",
    compliance: "PIPEDA compliant",
    pricingHref: "/canada/pricing",
  },
  {
    countryName: "UAE", countrySlug: "uae", currencyCode: "AED", currencySymbol: "د.إ", homeHref: "/uae",
    growthPriceShort: "AED 37/user/mo", growthPriceMonthly: "AED 48/user/mo monthly",
    pricingSummaryLine: "Free Forever · Growth AED 37/user/mo · Enterprise (custom) · 14-day trial on paid plans",
    paymentMethods: "Credit card, bank transfer, Stripe",
    compliance: "UAE PDPL compliant",
    pricingHref: "/uae/pricing",
  },
  {
    countryName: "Singapore", countrySlug: "singapore", currencyCode: "SGD", currencySymbol: "S$", homeHref: "/singapore",
    growthPriceShort: "S$14/user/mo", growthPriceMonthly: "S$18/user/mo monthly",
    pricingSummaryLine: "Free Forever · Growth S$14/user/mo · Enterprise (custom) · 14-day trial on paid plans",
    paymentMethods: "Credit card, PayNow, Stripe, bank transfer",
    compliance: "PDPA (Singapore) compliant",
    pricingHref: "/singapore/pricing",
  },
  {
    countryName: "New Zealand", countrySlug: "new-zealand", currencyCode: "NZD", currencySymbol: "NZ$", homeHref: "/new-zealand",
    growthPriceShort: "NZ$17/user/mo", growthPriceMonthly: "NZ$22/user/mo monthly",
    pricingSummaryLine: "Free Forever · Growth NZ$17/user/mo · Enterprise (custom) · 14-day trial on paid plans",
    paymentMethods: "Credit card, Stripe, PayPal, POLi, bank transfer",
    compliance: "New Zealand Privacy Act 2020 compliant",
    pricingHref: "/new-zealand/pricing",
  },
];

/* ── Managed RevOps retainers (lib/managed-revops-content.ts) ─────────────────── */

/**
 * Managed RevOps is a SERVICE sold alongside the CRM, not a plan tier. Growth
 * lists it as an add-on; Enterprise bundles it. Flat monthly retainer, not
 * per-seat — which is why it does not belong in a field named "per user/mo",
 * where COUNTRY_PRICING used to keep it.
 */
export interface ManagedRevOpsTier {
  slug: string;
  name: string;
  priceLabel: string;
  priceValue: string;
  priceCurrency: string;
}

export const MANAGED_REVOPS: Record<string, ManagedRevOpsTier[]> = {
  global: [
    { slug: "growth-engine", name: "Growth Engine", priceLabel: "$1,499/mo flat", priceValue: "1499", priceCurrency: "USD" },
    { slug: "revops-partner", name: "RevOps Partner", priceLabel: "$3,999/mo flat", priceValue: "3999", priceCurrency: "USD" },
  ],
  in: [
    { slug: "growth-engine", name: "Growth Engine", priceLabel: "₹39,999/mo flat", priceValue: "39999", priceCurrency: "INR" },
    { slug: "revops-partner", name: "RevOps Partner", priceLabel: "₹1,07,999/mo flat", priceValue: "107999", priceCurrency: "INR" },
  ],
  usa: [
    { slug: "growth-engine", name: "Growth Engine", priceLabel: "$1,499/mo flat", priceValue: "1499", priceCurrency: "USD" },
    { slug: "revops-partner", name: "RevOps Partner", priceLabel: "$3,999/mo flat", priceValue: "3999", priceCurrency: "USD" },
  ],
  uk: [
    { slug: "growth-engine", name: "Growth Engine", priceLabel: "£1,199/mo flat", priceValue: "1199", priceCurrency: "GBP" },
    { slug: "revops-partner", name: "RevOps Partner", priceLabel: "£3,199/mo flat", priceValue: "3199", priceCurrency: "GBP" },
  ],
  au: [
    { slug: "growth-engine", name: "Growth Engine", priceLabel: "A$2,299/mo flat", priceValue: "2299", priceCurrency: "AUD" },
    { slug: "revops-partner", name: "RevOps Partner", priceLabel: "A$6,099/mo flat", priceValue: "6099", priceCurrency: "AUD" },
  ],
  canada: [
    { slug: "growth-engine", name: "Growth Engine", priceLabel: "C$2,049/mo flat", priceValue: "2049", priceCurrency: "CAD" },
    { slug: "revops-partner", name: "RevOps Partner", priceLabel: "C$5,499/mo flat", priceValue: "5499", priceCurrency: "CAD" },
  ],
  uae: [
    { slug: "growth-engine", name: "Growth Engine", priceLabel: "AED 5,499/mo flat", priceValue: "5499", priceCurrency: "AED" },
    { slug: "revops-partner", name: "RevOps Partner", priceLabel: "AED 14,699/mo flat", priceValue: "14699", priceCurrency: "AED" },
  ],
  singapore: [
    { slug: "growth-engine", name: "Growth Engine", priceLabel: "S$1,999/mo flat", priceValue: "1999", priceCurrency: "SGD" },
    { slug: "revops-partner", name: "RevOps Partner", priceLabel: "S$5,399/mo flat", priceValue: "5399", priceCurrency: "SGD" },
  ],
  "new-zealand": [
    { slug: "growth-engine", name: "Growth Engine", priceLabel: "NZ$2,499/mo flat", priceValue: "2499", priceCurrency: "NZD" },
    { slug: "revops-partner", name: "RevOps Partner", priceLabel: "NZ$6,649/mo flat", priceValue: "6649", priceCurrency: "NZD" },
  ],
};

/* ── Products (lib/product-feature-pages.ts → /product/[slug]) ───────────────── */

export interface ProductPage {
  slug: string;
  title: string;
}

export const PRODUCTS: ProductPage[] = [
  { slug: "ai-pipeline", title: "AI Pipeline" },
  { slug: "ai-email", title: "AI Email" },
  { slug: "ai-reporting", title: "AI Reporting" },
  { slug: "ai-copilot", title: "AI Copilot" },
  { slug: "contact-mgmt", title: "Contact Management" },
  { slug: "pipeline-mgmt", title: "Pipeline Management" },
  { slug: "built-in-dialer", title: "Built-in Dialer" },
  { slug: "deal-pipeline", title: "Deal Pipeline" },
  { slug: "smart-workflows", title: "Smart Workflows" },
  { slug: "team-collaboration", title: "Team Collaboration" },
  { slug: "predictive-analytics", title: "Predictive Analytics" },
  { slug: "sales-automation", title: "Sales Automation" },
  { slug: "commerce", title: "Commerce" },
  { slug: "scheduling", title: "Scheduling" },
  { slug: "web-chat", title: "Web Chat" },
  { slug: "market-radar", title: "Market Radar" },
  { slug: "hello-mail", title: "HelloMail" },
  { slug: "gamification", title: "Gamification" },
  { slug: "custom-fields", title: "Custom Fields" },
  { slug: "role-permissions", title: "Role Permissions" },
  { slug: "mobile-crm", title: "Mobile CRM" },
  { slug: "reporting-dashboards", title: "Reporting Dashboards" },
  { slug: "workflow-automation", title: "Workflow Automation" },
  { slug: "api-webhooks", title: "API & Webhooks" },
  // `doc-mgmt` exists in the data map but is excluded from PRODUCT_FEATURE_SLUGS on the website.
];

/* ── Sitemaps (app/sitemap-index.xml + sub-sitemap routes) ───────────────────── */

export const SITEMAPS = {
  index: `${WEBSITE_SOURCE_OF_TRUTH}/sitemap-index.xml`,
  children: [
    { name: "core", url: `${WEBSITE_SOURCE_OF_TRUTH}/sitemap.xml`, note: "App-router generated routes (revalidate 3600s)" },
    { name: "blog", url: `${WEBSITE_SOURCE_OF_TRUTH}/blog-sitemap.xml` },
    { name: "help", url: `${WEBSITE_SOURCE_OF_TRUTH}/help-sitemap.xml` },
    { name: "tools", url: `${WEBSITE_SOURCE_OF_TRUTH}/tools-sitemap.xml` },
    { name: "industries", url: `${WEBSITE_SOURCE_OF_TRUTH}/industries-sitemap.xml` },
    { name: "alternatives", url: `${WEBSITE_SOURCE_OF_TRUTH}/alternatives-sitemap.xml` },
    { name: "agentic-ai", url: `${WEBSITE_SOURCE_OF_TRUTH}/agentic-ai-sitemap.xml` },
    { name: "image", url: `${WEBSITE_SOURCE_OF_TRUTH}/image-sitemap.xml` },
    { name: "video", url: `${WEBSITE_SOURCE_OF_TRUTH}/video-sitemap.xml` },
  ],
} as const;

/* ── Schema types used on the site (lib/seo/schema.ts) ───────────────────────── */

export const SCHEMA_TYPES = [
  { type: "Organization", scope: "site-wide (global layout, do not duplicate per page)", builder: "orgSchema()" },
  { type: "SoftwareApplication", scope: "product / feature pages (includes softwareRatingFields() — single verified review, no fabricated aggregate)", builder: "softwareAppSchema()" },
  { type: "BlogPosting", scope: "individual blog posts", builder: "blogPostingSchema()" },
  { type: "BreadcrumbList", scope: "all pages (BreadcrumbJsonLd)", builder: "breadcrumbSchema()" },
  { type: "WebSite", scope: "homepage", builder: "site.ts" },
  { type: "VideoObject", scope: "pages with video (home-video-schema.ts)", builder: "home-video-schema" },
  { type: "Review/AggregateRating", scope: "only with real review counts (customer-review-schema.ts)", builder: "customer-review-schema" },
  { type: "HowTo", scope: "guide pages, auto-detected from markdown", builder: "detectHowToSchemaFromMarkdown()" },
] as const;

/**
 * FAQPage is RETIRED site-wide. `faqPageSchema()` in lib/seo/schema.ts now
 * returns `null` unconditionally — FAQs must be rendered as visible page
 * content, never as structured data alone. Do not add FAQPage to SCHEMA_TYPES
 * and do not emit it from any tool.
 */
export const RETIRED_SCHEMA_TYPES = ["FAQPage"] as const;

/**
 * Live Organization JSON-LD object (mirror of orgSchema()).
 *
 * Fixed 2026-08-06 to match the website's entity fix ("issue 16"): the public
 * brand goes in `name` with the legal entity in `legalName`, and
 * `alternateName` excludes the brand name itself. The old shape put the legal
 * entity in `name` and repeated the brand inside `alternateName`, which splits
 * the brand across two competing entity labels in structured data.
 */
export function orgSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${COMPANY.url}/#organization`,
    name: COMPANY.name,
    legalName: COMPANY.legalName,
    alternateName: COMPANY.alternateNames.filter((n) => n !== COMPANY.name),
    url: COMPANY.url,
    // Canonical AI-friendly brand description (GEO entity anchor).
    description: COMPANY.entityDescription,
    foundingDate: COMPANY.foundingDate,
    address: { "@type": "PostalAddress", ...COMPANY.address },
    sameAs: COMPANY.sameAs,
  };
}

/* ── Hreflang (faithful port of lib/hreflang.ts getHreflangTags, synced 2026-08-06) ── */

const BASE_URL = WEBSITE_SOURCE_OF_TRUTH;

export interface HreflangTag {
  hreflang: string;
  href: string;
}

function normalizePath(currentPath: string): string {
  const withoutHash = currentPath.split("#")[0] ?? currentPath;
  const [pathname] = withoutHash.split("?");
  const normalized = (pathname ?? "").replaceAll(/\/+/g, "/").replace(/\/$/, "") || "/";
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

/** Query + hash suffix preserved for self-referencing hreflang on paginated/filtered URLs. */
function getSearchAndHashSuffix(currentPath: string): string {
  const withoutHash = currentPath.split("#")[0] ?? currentPath;
  const q = withoutHash.indexOf("?");
  if (q === -1) return "";
  return withoutHash.slice(q);
}

function toAbsoluteUrl(p: string): string {
  return p === "/" ? BASE_URL : `${BASE_URL}${p}`;
}

const INDIA_LANGUAGE_SLUG_HREFLANG: Record<string, string> = {
  "/in/crm-hindi": "hi", "/in/crm-tamil": "ta", "/in/crm-telugu": "te",
  "/in/crm-kannada": "kn", "/in/crm-marathi": "mr", "/in/crm-gujarati": "gu",
  "/in/crm-bengali": "bn", "/in/crm-malayalam": "ml", "/in/crm-punjabi": "pa",
  "/in/crm-odia": "or", "/in/crm-urdu": "ur", "/in/crm-assamese": "as",
};

/**
 * Non-India language pages that belong to the HUB-LEVEL market cluster. These
 * are full localized homepages, so they join the same reciprocal tag set as the
 * India language pages rather than self-referencing.
 *
 * /uae/crm-arabic became the Arabic-first RTL homepage in the July 2026
 * country-homepage rebuild (moved from /ae/crm-arabic).
 */
const HUB_LANGUAGE_PAGE_HREFLANG: Record<string, string> = {
  "/uae/crm-arabic": "ar-AE",
};

const MARKET_HREFLANG_VARIANTS: ReadonlyArray<{ prefix: string; hreflang: string }> = [
  { prefix: "/in", hreflang: "en-IN" },
  { prefix: "/usa", hreflang: "en-US" },
  { prefix: "/uk", hreflang: "en-GB" },
  { prefix: "/au", hreflang: "en-AU" },
  { prefix: "/canada", hreflang: "en-CA" },
  { prefix: "/uae", hreflang: "en-AE" },
  { prefix: "/singapore", hreflang: "en-SG" },
  { prefix: "/new-zealand", hreflang: "en-NZ" },
];

/**
 * Industry DETAIL slugs that exist as real, indexable pages on every country
 * prefix. Only these join the 9-market hreflang mesh; all other
 * /industries/<slug> pages are US/global-only (Semrush audit 2026-06-05).
 */
const MARKET_INDUSTRY_DETAIL_SLUGS: ReadonlySet<string> = new Set([
  "printing-agency",
  "textile-trader",
  "security-agency",
  "music-academy",
  "catering-company",
  "jewellery-showroom",
]);

function isMarketScopedSuffix(s: string): boolean {
  if (
    s === "" ||
    s === "/pricing" ||
    // Added on the website 2026-08-05 (audit): these two ship in all 8 markets
    // AND bare, exactly like /pricing, so the mesh cannot advertise a 404 or a
    // redirect. /demo is deliberately EXCLUDED — /au/demo and /canada/demo 301
    // to /demo.
    s === "/free-trial" ||
    s === "/tools" ||
    s === "/services/managed-revops" ||
    s === "/industries" ||
    s === "/industries/categories" ||
    s.startsWith("/industries/categories/")
  ) {
    return true;
  }
  if (s.startsWith("/industries/")) {
    const slug = s.slice("/industries/".length);
    return MARKET_INDUSTRY_DETAIL_SLUGS.has(slug);
  }
  return false;
}

/**
 * Industry-category slugs intentionally NOT built for a given country (404),
 * so their country variants must not be advertised in hreflang. Mirrors
 * COUNTRY_CATEGORY_EXCLUDE in lib/country-industry-categories.ts.
 */
const CATEGORY_EXCLUDED_BY_PREFIX: Record<string, ReadonlySet<string>> = {
  "/usa": new Set(["agriculture-allied"]),
  "/uk": new Set(["agriculture-allied"]),
  "/uae": new Set(["agriculture-allied", "nonprofits-cooperatives"]),
  "/singapore": new Set(["agriculture-allied"]),
};

const CATEGORY_SUFFIX_PREFIX = "/industries/categories/";

function getCategorySlugFromSuffix(suffix: string): string | null {
  if (!suffix.startsWith(CATEGORY_SUFFIX_PREFIX)) return null;
  const slug = suffix.slice(CATEGORY_SUFFIX_PREFIX.length);
  return slug && !slug.includes("/") ? slug : null;
}

function getMarketClusterTags(path: string): HreflangTag[] | null {
  let suffix: string | null = null;
  for (const variant of MARKET_HREFLANG_VARIANTS) {
    if (path === variant.prefix) { suffix = ""; break; }
    if (path.startsWith(`${variant.prefix}/`)) {
      const rest = path.slice(variant.prefix.length);
      if (isMarketScopedSuffix(rest)) { suffix = rest; break; }
    }
  }
  if (suffix === null) {
    if (path === "/") suffix = "";
    else if (isMarketScopedSuffix(path)) suffix = path;
  }
  if (suffix === null) return null;

  const globalHref = suffix === "" ? BASE_URL : toAbsoluteUrl(suffix);
  const categorySlug = getCategorySlugFromSuffix(suffix);
  const variantTags: HreflangTag[] = MARKET_HREFLANG_VARIANTS
    // Drop country variants whose category combo is a 404 (excluded per-market).
    .filter((v) => !(categorySlug && CATEGORY_EXCLUDED_BY_PREFIX[v.prefix]?.has(categorySlug)))
    .map((v) => ({
      hreflang: v.hreflang,
      href: toAbsoluteUrl(`${v.prefix}${suffix}` || "/"),
    }));

  // Hub-level cluster ("" suffix) also lists the 12 India language pages and
  // the Arabic UAE homepage, so every page in the cluster returns the
  // identical, fully-reciprocal tag set.
  const languageTags: HreflangTag[] =
    suffix === ""
      ? [
          ...Object.entries(INDIA_LANGUAGE_SLUG_HREFLANG),
          ...Object.entries(HUB_LANGUAGE_PAGE_HREFLANG),
        ].map(([p, hreflang]) => ({
          hreflang,
          href: toAbsoluteUrl(p),
        }))
      : [];

  return [
    { hreflang: "en", href: globalHref },
    ...variantTags,
    ...languageTags,
    { hreflang: "x-default", href: globalHref },
  ];
}

/**
 * Self-referencing locale for country-prefixed sub-pages that are NOT part of
 * the 9-market cluster (e.g. /uk/crm-london, /us/revops-services).
 */
const COUNTRY_PREFIX_SELF_HREFLANG: ReadonlyArray<{ prefix: string; hreflang: string }> = [
  { prefix: "/usa", hreflang: "en-US" },
  { prefix: "/us", hreflang: "en-US" },
  { prefix: "/uk", hreflang: "en-GB" },
  { prefix: "/au", hreflang: "en-AU" },
  { prefix: "/australia", hreflang: "en-AU" },
  { prefix: "/canada", hreflang: "en-CA" },
  { prefix: "/new-zealand", hreflang: "en-NZ" },
  { prefix: "/nz", hreflang: "en-NZ" },
];

const COUNTRY_HUB_HREFLANG: Record<string, string> = {
  "/ng": "en-NG", "/pk": "en-PK", "/ph": "en-PH", "/ke": "en-KE", "/gh": "en-GH",
  // "/ae" removed on the website 2026-07-14 — it 301s to /uae. /uae owns en-AE
  // in the 9-market mesh, and two live UAE hubs were sending Google conflicting
  // country signals. Keeping it here made the mirror advertise a redirect.
  "/ug": "en-UG", "/tz": "en-TZ", "/sg": "en-SG", "/id": "en-ID",
  "/br": "en-BR", "/mx": "en-MX", "/bd": "en-BD", "/my": "en-MY", "/vn": "en-VN", "/th": "en-TH",
};

const COUNTRY_LANG_SUBPAGES: Record<string, ReadonlyArray<{ hreflang: string; path: string }>> = {
  "/ng": [{ hreflang: "yo-NG", path: "/ng/crm-yoruba" }, { hreflang: "ha-NG", path: "/ng/crm-hausa" }, { hreflang: "ig-NG", path: "/ng/crm-igbo" }],
  "/pk": [{ hreflang: "ur-PK", path: "/pk/crm-urdu" }],
  "/ph": [{ hreflang: "tl", path: "/ph/crm-filipino" }],
  "/ke": [{ hreflang: "sw-KE", path: "/ke/crm-swahili" }],
  "/tz": [{ hreflang: "sw-TZ", path: "/tz/crm-swahili" }],
  // "/ae" entry removed with the hub above; the Arabic homepage now lives at
  // /uae/crm-arabic and is listed in HUB_LANGUAGE_PAGE_HREFLANG.
  "/id": [{ hreflang: "id-ID", path: "/id/crm-bahasa" }],
  "/br": [{ hreflang: "pt-BR", path: "/br/crm-portugues" }],
  "/mx": [{ hreflang: "es-MX", path: "/mx/crm-espanol" }],
  "/bd": [{ hreflang: "bn-BD", path: "/bd/crm-bangla" }],
};

/** Faithful port of website resolveHreflangTags(currentPath). */
function resolveHreflangTags(currentPath: string): HreflangTag[] {
  const normalizedPath = normalizePath(currentPath);
  const querySuffix = getSearchAndHashSuffix(currentPath);

  // India language sub-pages are part of the homepage-level market cluster:
  // the mesh lists them and they return the full mesh — fully reciprocal.
  // (/in itself is handled by getMarketClusterTags below.)
  if (normalizedPath in INDIA_LANGUAGE_SLUG_HREFLANG) {
    return getMarketClusterTags("/") ?? [];
  }

  // 9-market cluster: homepage + /pricing + /services/managed-revops +
  // /industries(+categories/whitelisted details) across all market prefixes.
  const marketClusterTags = getMarketClusterTags(normalizedPath);
  if (marketClusterTags) {
    if (querySuffix) {
      const selfPrefix = toAbsoluteUrl(normalizedPath);
      return marketClusterTags.map((tag) =>
        tag.href === selfPrefix ? { ...tag, href: selfPrefix + querySuffix } : tag,
      );
    }
    return marketClusterTags;
  }

  // Arabic UAE homepage under the canonical /uae hub. Listed in the hub-level
  // cluster via HUB_LANGUAGE_PAGE_HREFLANG, so it returns the full mesh exactly
  // like the India language homepages — fully reciprocal. Checked after the
  // market-cluster lookup so /uae itself keeps the full mesh.
  if (normalizedPath === "/uae/crm-arabic") {
    return getMarketClusterTags("/") ?? [];
  }

  // Other /in/* product pages not in the cluster suffix list.
  if (normalizedPath.startsWith("/in/")) {
    const selfHref = toAbsoluteUrl(normalizedPath) + querySuffix;
    return [
      { hreflang: "en-IN", href: selfHref },
      { hreflang: "x-default", href: selfHref },
    ];
  }

  const self = toAbsoluteUrl(normalizedPath) + querySuffix;
  const selfCluster = (lang: string): HreflangTag[] => [
    { hreflang: lang, href: self },
    { hreflang: "en", href: self },
    { hreflang: "x-default", href: self },
  ];

  // Single-country marketing pages (all now self-referencing incl. x-default).
  if (normalizedPath === "/crm-singapore") return selfCluster("en-SG");
  if (
    normalizedPath === "/crm-uae" ||
    normalizedPath === "/crm-dubai" ||
    normalizedPath === "/real-estate-crm-dubai" ||
    normalizedPath === "/best-crm-for-real-estate-dubai"
  ) {
    return selfCluster("en-AE");
  }
  if (normalizedPath === "/crm-nigeria") return selfCluster("en-NG");
  if (normalizedPath === "/crm-kenya") return selfCluster("en-KE");

  // French-Canada (Québec / Bill 96) route tree under /canada/fr/*. MUST be
  // checked BEFORE the /canada COUNTRY_PREFIX_SELF_HREFLANG rule below, which
  // would otherwise mislabel these French pages as en-CA.
  //   • /canada/fr forms a reciprocal fr-CA ↔ en-CA pair with /crm-canada.
  //   • Deeper French pages self-reference fr-CA only — they are standalone
  //     French surfaces, not translated twins of a specific English URL.
  if (normalizedPath === "/canada/fr" || normalizedPath.startsWith("/canada/fr/")) {
    if (normalizedPath === "/canada/fr") {
      return [
        { hreflang: "fr-CA", href: self },
        { hreflang: "en-CA", href: toAbsoluteUrl("/crm-canada") },
        { hreflang: "x-default", href: toAbsoluteUrl("/crm-canada") },
      ];
    }
    return [
      { hreflang: "fr-CA", href: self },
      { hreflang: "x-default", href: self },
    ];
  }

  // Canada-specific pages. Tag set must be IDENTICAL to the one /canada/fr
  // emits (fr-CA / en-CA / x-default) — an extra generic "en" self-tag made the
  // two group members advertise different variant sets, which crawlers flag as
  // "missing reciprocal hreflang (no return tag)". (Crawl audit 2026-07-10.)
  if (normalizedPath === "/crm-canada") {
    return [
      { hreflang: "fr-CA", href: toAbsoluteUrl("/canada/fr") },
      { hreflang: "en-CA", href: self },
      { hreflang: "x-default", href: self },
    ];
  }

  // North America hub targets USA + Canada.
  if (normalizedPath === "/north-america") {
    return [
      { hreflang: "en-US", href: self },
      { hreflang: "en-CA", href: self },
      { hreflang: "en", href: self },
      { hreflang: "x-default", href: self },
    ];
  }

  // India-targeted /crm-for-* page — checked BEFORE the generic en-US block.
  if (normalizedPath === "/crm-for-indian-businesses") return selfCluster("en-IN");

  // USA hub + /crm-for-* verticals (country-suffixed variants excluded).
  if (
    normalizedPath === "/crm-usa" ||
    (normalizedPath.startsWith("/crm-for-") &&
      normalizedPath !== "/crm-for-indian-businesses" &&
      !normalizedPath.endsWith("-australia") &&
      !normalizedPath.endsWith("-uk") &&
      !normalizedPath.endsWith("-philippines") &&
      !normalizedPath.endsWith("-south-africa") &&
      !normalizedPath.endsWith("-malaysia") &&
      !normalizedPath.endsWith("-germany"))
  ) {
    return [
      { hreflang: "en-US", href: self },
      { hreflang: "en", href: self },
      { hreflang: "x-default", href: self },
    ];
  }

  // Australia-specific pages (/crm-australia, /best-crm-australia,
  // /crm-for-tradies-australia). The "-australia" suffix is excluded from the
  // en-US /crm-for-* block above; without this handler those paths fell through
  // to the generic en/en-US default and emitted the wrong locale.
  if (normalizedPath === "/crm-australia" || normalizedPath.endsWith("-australia")) {
    return selfCluster("en-AU");
  }

  if (normalizedPath === "/crm-uk" || normalizedPath.endsWith("-uk")) return selfCluster("en-GB");
  if (normalizedPath === "/crm-philippines" || normalizedPath.endsWith("-philippines")) return selfCluster("en-PH");
  if (normalizedPath === "/crm-south-africa" || normalizedPath.endsWith("-south-africa")) return selfCluster("en-ZA");
  if (normalizedPath === "/crm-malaysia" || normalizedPath.endsWith("-malaysia")) return selfCluster("en-MY");

  // Germany-specific pages — bilingual (de-DE + de).
  if (normalizedPath === "/crm-germany" || normalizedPath.endsWith("-germany")) {
    return [
      { hreflang: "de-DE", href: self },
      { hreflang: "de", href: self },
      { hreflang: "x-default", href: self },
    ];
  }

  // Country-prefixed sub-pages NOT in the 9-market cluster suffix list
  // (e.g. /uk/crm-london, /us/revops-services): self-reference + x-default.
  const countrySelfPrefix = COUNTRY_PREFIX_SELF_HREFLANG.find(
    (v) => normalizedPath === v.prefix || normalizedPath.startsWith(`${v.prefix}/`),
  );
  if (countrySelfPrefix) {
    return [
      { hreflang: countrySelfPrefix.hreflang, href: self },
      { hreflang: "x-default", href: self },
    ];
  }

  // International country hubs (/ng, /pk, …) and their language sub-pages.
  const countryPrefix = Object.keys(COUNTRY_HUB_HREFLANG).find(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
  );
  if (countryPrefix) {
    const hubHreflang = COUNTRY_HUB_HREFLANG[countryPrefix]!;
    const subpages = COUNTRY_LANG_SUBPAGES[countryPrefix] ?? [];

    // Sub-pages NOT part of the hub/language cluster self-reference instead.
    const isClusterPage =
      normalizedPath === countryPrefix ||
      subpages.some((sub) => sub.path === normalizedPath);
    if (!isClusterPage) {
      return [
        { hreflang: hubHreflang, href: self },
        { hreflang: "x-default", href: self },
      ];
    }

    // x-default points at the hub so the group stays fully reciprocal.
    return [
      { hreflang: hubHreflang, href: toAbsoluteUrl(countryPrefix) },
      ...subpages.map((s) => ({ hreflang: s.hreflang, href: toAbsoluteUrl(s.path) })),
      { hreflang: "x-default", href: toAbsoluteUrl(countryPrefix) },
    ];
  }

  // Root homepage / /pricing are handled by getMarketClusterTags above; these
  // branches are kept for parity with the website source (unreachable there too).
  if (normalizedPath === "/") {
    return [
      { hreflang: "en", href: BASE_URL },
      { hreflang: "en-US", href: BASE_URL },
      { hreflang: "en-IN", href: `${BASE_URL}/in` },
      { hreflang: "x-default", href: self },
    ];
  }

  if (normalizedPath === "/pricing") {
    return [
      { hreflang: "en", href: `${BASE_URL}/pricing` },
      { hreflang: "en-US", href: `${BASE_URL}/pricing` },
      { hreflang: "en-IN", href: `${BASE_URL}/in/pricing` },
      { hreflang: "x-default", href: `${BASE_URL}/pricing` },
    ];
  }

  return [
    { hreflang: "en", href: self },
    { hreflang: "en-US", href: self },
    { hreflang: "x-default", href: self },
  ];
}

/**
 * Cluster-of-one suppression — added to the website 2026-07-31 and previously
 * MISSING from this mirror, which is why the MCP reported hreflang tags for
 * pages that emit none in the shipped HTML.
 *
 * An hreflang group whose members all resolve to the same single URL declares
 * no alternate for any other language or region, so it carries no signal. Worse,
 * hundreds of pages each self-declaring `x-default` is noise — x-default names
 * the ONE fallback page, and a regional page claiming it competes with the
 * homepage for generic queries.
 *
 *   • one distinct href   → emit nothing
 *   • many distinct hrefs → emit unchanged
 *
 * Genuine clusters pass through untouched: the 9-market mesh, the India-language
 * mesh, /crm-canada ↔ /canada/fr, the country hubs, and /pricing ↔ /in/pricing
 * all resolve to 2+ distinct URLs.
 */
function sanitizeHreflangTags(tags: HreflangTag[]): HreflangTag[] {
  if (tags.length === 0) return tags;
  const distinctTargets = new Set(tags.map((tag) => tag.href));
  if (distinctTargets.size <= 1) return [];
  return tags;
}

/** Faithful port of website getHreflangTags(currentPath). */
export function getHreflangTags(currentPath: string): HreflangTag[] {
  return sanitizeHreflangTags(resolveHreflangTags(currentPath));
}

/** Faithful port of website getHreflangLanguageMap(currentPath). */
export function getHreflangLanguageMap(currentPath: string): Record<string, string> {
  return Object.fromEntries(
    getHreflangTags(currentPath).map((tag) => [tag.hreflang, tag.href]),
  );
}

/** Canonical URL for a path — always the non-www apex host, no trailing slash. */
export function getCanonicalUrl(currentPath: string): string {
  const normalized = normalizePath(currentPath);
  return normalized === "/" ? BASE_URL : `${BASE_URL}${normalized}`;
}


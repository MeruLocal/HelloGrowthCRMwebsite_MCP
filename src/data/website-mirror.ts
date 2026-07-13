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
 *   CONTACTS ........... lib/contact-matrix.ts
 *   COUNTRIES .......... lib/country-industry-categories.ts + lib/home-market.ts
 *   COUNTRY_PRICING .... lib/pricing-{usa,uk,au,canada,uae,singapore,nz,india}-data.ts
 *                        + lib/market-pricing.ts
 *   PRODUCTS ........... lib/product-feature-pages.ts (PRODUCT_FEATURE_PAGES)
 *   HREFLANG ........... lib/hreflang.ts (getHreflangTags)
 *   SITEMAPS ........... app/sitemap-index.xml + app/*-sitemap.xml routes
 *   SCHEMA ............. lib/seo/schema.ts (orgSchema, softwareAppSchema, …)
 */

export const SYNCED_AT = "2026-07-08";
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
  /** Organization.sameAs profiles. */
  sameAs: [
    "https://www.linkedin.com/company/112020713/admin/dashboard/",
    "https://x.com/hellogrowthcrm",
    "https://github.com/hellogrowthcrm",
    "https://www.instagram.com/hellogrowthcrm",
    "https://www.facebook.com/profile.php?id=61588263746188",
    "https://www.g2.com/products/hellogrowthcrm/reviews",
    "https://www.capterra.com/p/10037980/HelloGrowthCRM/",
    "https://www.producthunt.com/products/hellogrowthcrm",
    "https://www.softwareadvice.com/crm/hellogrowthcrm-profile/",
    "https://www.getapp.com/customer-management-software/a/hellogrowthcrm/",
    "https://play.google.com/store/apps/details?id=com.hellogrowthcrm.app",
  ],
  brand: {
    purpleHex: "#6344E7",
    blueHex: "#2B38A5",
    logoLight: "/HelloGrowthCRM_LIGHT_560.webp",
    logoDark: "/HelloGrowthCRM_DARK_560.webp",
    logoWidth: 560,
    logoHeight: 97,
    x: "https://x.com/hellogrowthcrm",
    github: "https://github.com/hellocrmmerufintech-star",
    linkedin: "https://www.linkedin.com/company/hellogrowthcrm/",
    youtube: "https://www.youtube.com/@HelloGrowthCRM",
    instagram: "https://www.instagram.com/hellogrowthcrm",
    facebook: "https://www.facebook.com/profile.php?id=61588263746188",
    productHunt: "https://www.producthunt.com/products/hellogrowthcrm",
  },
} as const;

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
    hours: "Mon–Sat, 10am–7pm IST",
  },
  {
    region: "US",
    label: "US support",
    phoneE164: "+16073182126",
    phoneDisplay: "+1 607 318-2126",
    addressLabel: "Lewes, Delaware, USA",
    addressLines: ["16192 Coastal Hwy", "Lewes, DE 19958, USA"],
    hours: "Mon–Fri, 9am–5pm EST",
  },
];

/** Mirrors getRegionalContact(): IN→India, US/empty→US, anything else→US (global). */
export function getRegionalContact(countryCode?: string | null): RegionalContact {
  const normalized = (countryCode ?? "").toUpperCase();
  if (normalized === "IN") return CONTACTS[0]!;
  return CONTACTS[1]!;
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

export interface CountryPricingSummary {
  countryName: string;
  countrySlug: string;
  currencyCode: string;
  currencySymbol: string;
  homeHref: string;
  starterPriceShort: string;
  growthPriceShort: string;
  pricingHref: string;
}

export const COUNTRY_PRICING: CountryPricingSummary[] = [
  // India Starter (₹99) tier was removed on the website 2026-06/07 — Growth is now the entry paid plan.
  { countryName: "India", countrySlug: "in", currencyCode: "INR", currencySymbol: "₹", homeHref: "/in", starterPriceShort: "₹899/user/mo", growthPriceShort: "₹899/user/mo", pricingHref: "/in/pricing" },
  { countryName: "United States", countrySlug: "usa", currencyCode: "USD", currencySymbol: "$", homeHref: "/usa", starterPriceShort: "$10/user/mo", growthPriceShort: "$1,500/user/mo", pricingHref: "/usa/pricing" },
  { countryName: "United Kingdom", countrySlug: "uk", currencyCode: "GBP", currencySymbol: "£", homeHref: "/uk", starterPriceShort: "£9/user/mo", growthPriceShort: "£1,199/user/mo", pricingHref: "/uk/pricing" },
  { countryName: "Australia", countrySlug: "au", currencyCode: "AUD", currencySymbol: "A$", homeHref: "/au", starterPriceShort: "A$16/user/mo", growthPriceShort: "A$2,299/user/mo", pricingHref: "/au/pricing" },
  { countryName: "Canada", countrySlug: "canada", currencyCode: "CAD", currencySymbol: "C$", homeHref: "/canada", starterPriceShort: "C$14/user/mo", growthPriceShort: "C$2,049/user/mo", pricingHref: "/canada/pricing" },
  { countryName: "UAE", countrySlug: "uae", currencyCode: "AED", currencySymbol: "AED", homeHref: "/uae", starterPriceShort: "AED 37/user/mo", growthPriceShort: "AED 5,499/user/mo", pricingHref: "/uae/pricing" },
  { countryName: "Singapore", countrySlug: "singapore", currencyCode: "SGD", currencySymbol: "S$", homeHref: "/singapore", starterPriceShort: "S$14/user/mo", growthPriceShort: "S$1,999/user/mo", pricingHref: "/singapore/pricing" },
  { countryName: "New Zealand", countrySlug: "new-zealand", currencyCode: "NZD", currencySymbol: "NZ$", homeHref: "/new-zealand", starterPriceShort: "NZ$17/user/mo", growthPriceShort: "NZ$2,499/user/mo", pricingHref: "/new-zealand/pricing" },
];

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
  { type: "BreadcrumbList", scope: "all pages (BreadcrumbJsonLd)", builder: "breadcrumb component" },
  { type: "WebSite", scope: "homepage", builder: "site.ts" },
  { type: "VideoObject", scope: "pages with video (home-video-schema.ts)", builder: "home-video-schema" },
  { type: "Review/AggregateRating", scope: "only with real review counts (customer-review-schema.ts)", builder: "customer-review-schema" },
] as const;

/** Live Organization JSON-LD object (mirror of orgSchema()). */
export function orgSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${COMPANY.url}/#organization`,
    name: COMPANY.legalName,
    alternateName: [COMPANY.name, ...COMPANY.alternateNames],
    url: COMPANY.url,
    // Canonical AI-friendly brand description (GEO entity anchor) — added to
    // the website orgSchema() in lib/seo/schema.ts (synced 2026-07-08).
    description: COMPANY.entityDescription,
    foundingDate: COMPANY.foundingDate,
    address: { "@type": "PostalAddress", ...COMPANY.address },
    sameAs: COMPANY.sameAs,
  };
}

/* ── Hreflang (faithful port of lib/hreflang.ts getHreflangTags, synced 2026-07-08) ── */

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

  // Hub-level cluster ("" suffix) also lists the 12 India language pages so
  // every page in the cluster returns the identical, fully-reciprocal tag set.
  const languageTags: HreflangTag[] =
    suffix === ""
      ? Object.entries(INDIA_LANGUAGE_SLUG_HREFLANG).map(([p, hreflang]) => ({
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
  "/ug": "en-UG", "/tz": "en-TZ", "/sg": "en-SG", "/ae": "en-AE", "/id": "en-ID",
  "/br": "en-BR", "/mx": "en-MX", "/bd": "en-BD", "/my": "en-MY", "/vn": "en-VN", "/th": "en-TH",
};

const COUNTRY_LANG_SUBPAGES: Record<string, ReadonlyArray<{ hreflang: string; path: string }>> = {
  "/ng": [{ hreflang: "yo-NG", path: "/ng/crm-yoruba" }, { hreflang: "ha-NG", path: "/ng/crm-hausa" }, { hreflang: "ig-NG", path: "/ng/crm-igbo" }],
  "/pk": [{ hreflang: "ur-PK", path: "/pk/crm-urdu" }],
  "/ph": [{ hreflang: "tl", path: "/ph/crm-filipino" }],
  "/ke": [{ hreflang: "sw-KE", path: "/ke/crm-swahili" }],
  "/tz": [{ hreflang: "sw-TZ", path: "/tz/crm-swahili" }],
  "/ae": [{ hreflang: "ar-AE", path: "/ae/crm-arabic" }],
  "/id": [{ hreflang: "id-ID", path: "/id/crm-bahasa" }],
  "/br": [{ hreflang: "pt-BR", path: "/br/crm-portugues" }],
  "/mx": [{ hreflang: "es-MX", path: "/mx/crm-espanol" }],
  "/bd": [{ hreflang: "bn-BD", path: "/bd/crm-bangla" }],
};

/** Faithful port of website getHreflangTags(currentPath). */
export function getHreflangTags(currentPath: string): HreflangTag[] {
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
  if (normalizedPath === "/crm-uae" || normalizedPath === "/crm-dubai") return selfCluster("en-AE");
  if (normalizedPath === "/crm-nigeria") return selfCluster("en-NG");
  if (normalizedPath === "/crm-kenya") return selfCluster("en-KE");
  if (normalizedPath === "/crm-canada") return selfCluster("en-CA");

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

/** Canonical URL for a path — always the non-www apex host, no trailing slash. */
export function getCanonicalUrl(currentPath: string): string {
  const normalized = normalizePath(currentPath);
  return normalized === "/" ? BASE_URL : `${BASE_URL}${normalized}`;
}


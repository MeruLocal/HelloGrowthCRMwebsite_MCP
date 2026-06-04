/**
 * Standalone unit smoke-test for the website-mirror tools (no server needed).
 * Verifies the country / company / SEO / products / pricing tools return the
 * data that mirrors hellogrowthcrm.com. Run after build:
 *   npm run build && node test-tools.mjs
 */
import { toolsByName } from "./dist/tools/index.js";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error("  x FAIL:", msg);
  }
}

async function call(name, args = {}) {
  const tool = toolsByName.get(name);
  if (!tool) throw new Error(`Tool not registered: ${name}`);
  const res = await tool.handle(args);
  const text = res.content?.[0]?.text ?? "";
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

console.log("Running website-mirror tool tests...\n");

// countries_list
const countries = await call("countries_list");
assert(countries.count === 8, `countries_list should return 8 markets (got ${countries.count})`);
assert(countries.countries.some((c) => c.code === "in" && c.currency === "INR"), "India market present with INR");
assert(countries.countries.some((c) => c.code === "uae" && c.locale === "en-AE"), "UAE market present with en-AE");

// country_get
const india = await call("country_get", { code: "in" });
assert(india.country.label === "India", "country_get(in) label India");
assert(india.contact.phoneDisplay === "+91 70690 83968", "country_get(in) resolves India contact");
assert(india.pricing_summary?.currencyCode === "INR", "country_get(in) pricing INR");
assert(Array.isArray(india.seo.hreflang) && india.seo.hreflang.length > 0, "country_get(in) has hreflang tags");

// country_get invalid
const badTool = toolsByName.get("country_get");
const badRes = await badTool.handle({ code: "zz" });
assert(badRes.isError === true, "country_get(zz) flagged as error");

// company_get_profile
const company = await call("company_get_profile");
assert(company.legal_name === "Soor LLC", "company legal_name Soor LLC");
assert(company.india_legal_entity === "Meru Technosoft Pvt. Ltd.", "india entity present");
assert(Array.isArray(company.same_as) && company.same_as.length >= 8, "sameAs profiles present");
assert(company.brand.purpleHex === "#6344E7", "brand purple correct");

// company_get_contacts
const contacts = await call("company_get_contacts");
assert(contacts.count === 2, "two regional contacts");
const usContact = await call("company_get_contacts", { region: "US" });
assert(usContact.contact.phoneDisplay === "+1 607 318-2126", "US contact resolved");

// seo_get_site_config
const siteCfg = await call("seo_get_site_config");
assert(siteCfg.canonical_host === "https://hellogrowthcrm.com", "canonical host correct");

// seo_get_hreflang -- market cluster
const hl = await call("seo_get_hreflang", { path: "/usa/pricing" });
assert(hl.hreflang.some((t) => t.hreflang === "en-US"), "/usa/pricing has en-US");
assert(hl.hreflang.some((t) => t.hreflang === "x-default"), "/usa/pricing has x-default");

// seo_get_hreflang -- AU vertical suffix.
// NOTE: the website EXCLUDES "-australia" from the generic crm-for handler but never
// wrote an "-australia" handler, so these pages fall through to the en/en-US/x-default
// default (a latent website bug). We faithfully mirror that behavior here.
const hlAu = await call("seo_get_hreflang", { path: "/crm-for-builders-australia" });
assert(hlAu.hreflang.some((t) => t.hreflang === "x-default"), "AU vertical falls through to default (mirrors website)");
assert(!hlAu.hreflang.some((t) => t.hreflang === "en-AU"), "AU vertical does NOT emit en-AU (website gap, faithfully mirrored)");

// seo_get_hreflang -- generic US crm-for
const hlUs = await call("seo_get_hreflang", { path: "/crm-for-accounting-firms" });
assert(hlUs.hreflang.some((t) => t.hreflang === "en-US"), "generic crm-for -> en-US");

// seo_get_canonical
const canon = await call("seo_get_canonical", { path: "/pricing/" });
assert(canon.canonical === "https://hellogrowthcrm.com/pricing", "canonical strips trailing slash");

// seo_get_sitemaps
const sm = await call("seo_get_sitemaps");
assert(sm.child_count >= 8, "sitemap has 8+ children");

// seo_get_schema
const schema = await call("seo_get_schema", { include_org_jsonld: true });
assert(schema.organization_jsonld["@type"] === "Organization", "org JSON-LD type");
assert(schema.retired_types.some((t) => t.includes("FAQPage")), "FAQPage marked retired");

// products
const products = await call("products_list");
assert(products.total >= 24, `products_list >= 24 (got ${products.total})`);
const dialer = await call("product_get", { slug: "built-in-dialer" });
assert(dialer.title === "Built-in Dialer", "product_get built-in-dialer");

// pricing_get_country_plans
const cp = await call("pricing_get_country_plans");
assert(cp.count === 8, "country pricing has 8 entries");
const ukp = await call("pricing_get_country_plans", { country: "uk" });
assert(ukp.country_pricing[0].currencyCode === "GBP", "UK pricing GBP");

console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed === 0 ? 0 : 1);

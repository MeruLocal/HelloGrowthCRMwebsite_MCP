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
  const parsed = tool.schema.safeParse(args);
  const res = await tool.handle(parsed.success ? parsed.data : args);
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

// ─────────────────────────────// ─────────────────────────────────────────────────────────────────────────────
// Website feature coverage tools (integrations, agents, glossary, templates,
// guides, alternatives/switch, changelog, FAQs, media, partners, solutions)
// — added 2026-06-11
// ─────────────────────────────────────────────────────────────────────────────

// integrations
const ints = await call("integrations_list");
assert(ints.items.length >= 390, `integrations_list >= 390 (got ${ints.items.length})`);
const intsWa = await call("integrations_list", { search: "whatsapp" });
assert(intsWa.filtered_count >= 1, "integrations_list search=whatsapp finds results");
const intCats = await call("integrations_list_categories");
assert(intCats.category_count >= 50, `integrations categories >= 50 (got ${intCats.category_count})`);
const mailchimp = await call("integrations_get", { slug: "mailchimp" });
assert(mailchimp.integration?.slug === "mailchimp" || mailchimp.slug === "mailchimp", "integrations_get mailchimp");
const badInt = await (async () => { const t = toolsByName.get("integrations_get"); return t.handle({ slug: "zzz-nope" }); })();
assert(badInt.isError === true, "integrations_get unknown slug fails");

// AI agents
const agents = await call("agents_list");
assert(agents.agents.length === 12, `agents_list returns 12 agents (got ${agents.agents.length})`);
const voice = await call("agents_get", { slug: "voice-agent" });
assert(JSON.stringify(voice).toLowerCase().includes("voice"), "agents_get voice-agent");
const levels = await call("agents_get_autonomy_levels");
assert(levels.levels.length === 3, "autonomy levels = 3");
assert(levels.capability_matrix.length === 9, "autonomy capability matrix = 9 rows");
const agentVs = await call("agents_list_comparisons");
assert(agentVs.count === 4, "agent comparisons = 4 (agentforce, breeze, zia, copilot)");

// glossary
const gl = await call("glossary_list_terms");
assert(gl.total === 44, `glossary has 44 terms (got ${gl.total})`);
const term = await call("glossary_get_term", { slug: gl.terms[0].slug });
assert(typeof JSON.stringify(term) === "string" && !term.isError, "glossary_get_term first term");

// templates
const tpl = await call("templates_list");
assert(tpl.total === 42, `templates has 42 entries (got ${tpl.total})`);
assert(tpl.categories.length === 7, "templates have 7 categories");
const tplOne = await call("templates_get", { slug: tpl.templates[0].slug });
assert(!tplOne.isError, "templates_get first template");

// feature guides
const guides = await call("guides_list");
assert(guides.total === 32, `guides has 32 entries (got ${guides.total})`);
const guideOne = await call("guides_get", { slug: guides.guides[0].slug });
assert(!guideOne.isError, "guides_get first guide");

// alternatives & switch
const alts = await call("alternatives_list");
assert(alts.total >= 40, `alternatives_list >= 40 (got ${alts.total})`);
const altHs = await call("alternatives_get", { slug: "hubspot" });
assert(!altHs.isError, "alternatives_get hubspot");
const sw = await call("switch_list_competitors");
assert(sw.switch_pages.length >= 26, `switch pages >= 26 (got ${sw.switch_pages.length})`);
const swZoho = await call("switch_get_guide", { slug: "zoho" });
assert(!swZoho.isError, "switch_get_guide zoho");

// changelog
const cl = await call("changelog_list_releases", { limit: 3 });
assert(cl.total_releases === 6, `changelog has 6 releases (got ${cl.total_releases})`);
assert(cl.returned === 3, "changelog limit=3 respected");
const rel = await call("changelog_get_release", { version: "1.5.0" });
assert(!rel.isError, "changelog_get_release 1.5.0");

// site FAQs
const faqs = await call("faqs_get_site");
assert(faqs.groups.length === 2, "site FAQs have 2 groups");
assert(faqs.groups[0].items?.length >= 15, "site FAQ group 1 has 15+ entries");

// media
const vids = await call("media_list_videos");
assert(vids.videos.length >= 5, `media_list_videos >= 5 (got ${vids.videos.length})`);
const tst = await call("media_list_testimonials", { type: "text" });
assert(JSON.stringify(tst).includes("text_testimonials"), "media_list_testimonials text");

// partners
const pp = await call("partners_get_program");
assert(pp.faqs.length === 8, `partner FAQs = 8 (got ${pp.faqs.length})`);
const pa = await call("partners_get_application_schema");
assert(pa.field_count >= 27, `partner application fields >= 27 (got ${pa.field_count})`);

// solutions
const wa = await call("solutions_list_whatsapp_use_cases");
assert(wa.count === 5, `whatsapp use cases = 5 (got ${wa.count})`);
const revops = await call("solutions_get_managed_revops");
assert(JSON.stringify(revops).includes("atlanta"), "managed revops lists city pages");
const revopsCity = await call("solutions_get_managed_revops", { city: "atlanta" });
assert(!revopsCity.isError, "managed revops atlanta city page");
const revopsBad = await (async () => { const t = toolsByName.get("solutions_get_managed_revops"); return t.handle({ city: "zzz-nope" }); })();
assert(revopsBad.isError === true, "managed revops unknown city fails");

console.log(`\n${passed} passed, ${failed} failed.`);
process.exit(failed === 0 ? 0 : 1);

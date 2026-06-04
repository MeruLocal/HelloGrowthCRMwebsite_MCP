// Standalone equivalence check: OLD vs NEW getHreflangTags after the
// cognitive-complexity refactor in src/data/website-mirror.ts.
// Run: node verify-hreflang.mjs   ->  prints PASS/FAIL across a path corpus.

const BASE_URL = "https://hellogrowthcrm.com";

function normalizePath(currentPath) {
  const withoutHash = currentPath.split("#")[0] ?? currentPath;
  const [pathname] = withoutHash.split("?");
  const normalized = (pathname ?? "").replaceAll(/\/+/g, "/").replace(/\/$/, "") || "/";
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}
function toAbsoluteUrl(p) { return p === "/" ? BASE_URL : `${BASE_URL}${p}`; }

const INDIA_LANGUAGE_SLUG_HREFLANG = {
  "/in/crm-hindi": "hi", "/in/crm-tamil": "ta", "/in/crm-telugu": "te",
  "/in/crm-kannada": "kn", "/in/crm-marathi": "mr", "/in/crm-gujarati": "gu",
  "/in/crm-bengali": "bn", "/in/crm-malayalam": "ml", "/in/crm-punjabi": "pa",
  "/in/crm-odia": "or", "/in/crm-urdu": "ur", "/in/crm-assamese": "as",
};
const INDIA_LANG_CLUSTER = [
  { hreflang: "en-IN", href: `${BASE_URL}/in` },
  ...Object.entries(INDIA_LANGUAGE_SLUG_HREFLANG).map(([p, hreflang]) => ({ hreflang, href: toAbsoluteUrl(p) })),
  { hreflang: "x-default", href: BASE_URL },
];
const MARKET_HREFLANG_VARIANTS = [
  { prefix: "/in", hreflang: "en-IN" }, { prefix: "/usa", hreflang: "en-US" },
  { prefix: "/uk", hreflang: "en-GB" }, { prefix: "/au", hreflang: "en-AU" },
  { prefix: "/canada", hreflang: "en-CA" }, { prefix: "/uae", hreflang: "en-AE" },
  { prefix: "/singapore", hreflang: "en-SG" }, { prefix: "/new-zealand", hreflang: "en-NZ" },
];
function isMarketScopedSuffix(s) {
  return s === "" || s === "/pricing" || s === "/services/managed-revops" || s === "/industries" || s.startsWith("/industries/");
}
function getMarketClusterTags(path) {
  let suffix = null;
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
  const variantTags = MARKET_HREFLANG_VARIANTS.map((v) => ({
    hreflang: v.hreflang, href: toAbsoluteUrl(`${v.prefix}${suffix}` || "/"),
  }));
  return [{ hreflang: "en", href: globalHref }, ...variantTags, { hreflang: "x-default", href: globalHref }];
}
const COUNTRY_HUB_HREFLANG = {
  "/ng": "en-NG", "/pk": "en-PK", "/ph": "en-PH", "/ke": "en-KE", "/gh": "en-GH",
  "/ug": "en-UG", "/tz": "en-TZ", "/sg": "en-SG", "/ae": "en-AE", "/id": "en-ID",
  "/br": "en-BR", "/mx": "en-MX", "/bd": "en-BD", "/my": "en-MY", "/vn": "en-VN", "/th": "en-TH",
};
const COUNTRY_LANG_SUBPAGES = {
  "/ng": [{ hreflang: "yo-NG", path: "/ng/crm-yoruba" }, { hreflang: "ha-NG", path: "/ng/crm-hausa" }, { hreflang: "ig-NG", path: "/ng/crm-igbo" }],
  "/pk": [{ hreflang: "ur-PK", path: "/pk/crm-urdu" }],
  "/ph": [{ hreflang: "fil", path: "/ph/crm-filipino" }],
  "/ke": [{ hreflang: "sw-KE", path: "/ke/crm-swahili" }],
  "/tz": [{ hreflang: "sw-TZ", path: "/tz/crm-swahili" }],
  "/ae": [{ hreflang: "ar-AE", path: "/ae/crm-arabic" }],
  "/id": [{ hreflang: "id-ID", path: "/id/crm-bahasa" }],
  "/br": [{ hreflang: "pt-BR", path: "/br/crm-portugues" }],
  "/mx": [{ hreflang: "es-MX", path: "/mx/crm-espanol" }],
  "/bd": [{ hreflang: "bn-BD", path: "/bd/crm-bangla" }],
};

// ---------- OLD implementation (pre-refactor) ----------
function OLD(currentPath) {
  const normalizedPath = normalizePath(currentPath);
  if (normalizedPath === "/in" || normalizedPath in INDIA_LANGUAGE_SLUG_HREFLANG) return INDIA_LANG_CLUSTER;
  const marketClusterTags = getMarketClusterTags(normalizedPath);
  if (marketClusterTags) return marketClusterTags;
  if (normalizedPath.startsWith("/in/")) {
    return [
      { hreflang: "en-IN", href: toAbsoluteUrl(normalizedPath) },
      { hreflang: "en", href: BASE_URL },
      { hreflang: "x-default", href: BASE_URL },
    ];
  }
  const single = (lang) => [
    { hreflang: lang, href: toAbsoluteUrl(normalizedPath) },
    { hreflang: "en", href: toAbsoluteUrl(normalizedPath) },
    { hreflang: "x-default", href: BASE_URL },
  ];
  if (normalizedPath === "/crm-singapore") return single("en-SG");
  if (normalizedPath === "/crm-uae" || normalizedPath === "/crm-dubai") return single("en-AE");
  if (normalizedPath === "/crm-nigeria") return single("en-NG");
  if (normalizedPath === "/crm-kenya") return single("en-KE");
  if (normalizedPath === "/crm-canada") return single("en-CA");
  if (
    normalizedPath === "/crm-usa" ||
    (normalizedPath.startsWith("/crm-for-") &&
      !normalizedPath.endsWith("-australia") && !normalizedPath.endsWith("-uk") &&
      !normalizedPath.endsWith("-philippines") && !normalizedPath.endsWith("-south-africa") &&
      !normalizedPath.endsWith("-malaysia") && !normalizedPath.endsWith("-germany"))
  ) { return single("en-US"); }
  if (normalizedPath === "/crm-uk" || normalizedPath.endsWith("-uk")) return single("en-GB");
  if (normalizedPath === "/crm-philippines" || normalizedPath.endsWith("-philippines")) return single("en-PH");
  if (normalizedPath === "/crm-south-africa" || normalizedPath.endsWith("-south-africa")) return single("en-ZA");
  if (normalizedPath === "/crm-malaysia" || normalizedPath.endsWith("-malaysia")) return single("en-MY");
  if (normalizedPath === "/crm-germany" || normalizedPath.endsWith("-germany")) {
    return [
      { hreflang: "de-DE", href: toAbsoluteUrl(normalizedPath) },
      { hreflang: "de", href: toAbsoluteUrl(normalizedPath) },
      { hreflang: "x-default", href: BASE_URL },
    ];
  }
  const countryPrefix = Object.keys(COUNTRY_HUB_HREFLANG).find(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
  );
  if (countryPrefix) {
    const hubHreflang = COUNTRY_HUB_HREFLANG[countryPrefix];
    const subpages = COUNTRY_LANG_SUBPAGES[countryPrefix] ?? [];
    return [
      { hreflang: hubHreflang, href: toAbsoluteUrl(countryPrefix) },
      ...subpages.map((s) => ({ hreflang: s.hreflang, href: toAbsoluteUrl(s.path) })),
      { hreflang: "x-default", href: BASE_URL },
    ];
  }
  if (normalizedPath === "/") {
    return [
      { hreflang: "en", href: BASE_URL }, { hreflang: "en-US", href: BASE_URL },
      { hreflang: "en-IN", href: `${BASE_URL}/in` }, { hreflang: "x-default", href: BASE_URL },
    ];
  }
  if (normalizedPath === "/pricing") {
    return [
      { hreflang: "en", href: `${BASE_URL}/pricing` }, { hreflang: "en-US", href: `${BASE_URL}/pricing` },
      { hreflang: "en-IN", href: `${BASE_URL}/in/pricing` }, { hreflang: "x-default", href: `${BASE_URL}/pricing` },
    ];
  }
  return [
    { hreflang: "en", href: toAbsoluteUrl(normalizedPath) },
    { hreflang: "en-US", href: toAbsoluteUrl(normalizedPath) },
    { hreflang: "x-default", href: toAbsoluteUrl(normalizedPath) },
  ];
}

// ---------- NEW implementation (refactored) ----------
const SINGLE_LANG_EXACT = {
  "/crm-singapore": "en-SG", "/crm-uae": "en-AE", "/crm-dubai": "en-AE",
  "/crm-nigeria": "en-NG", "/crm-kenya": "en-KE", "/crm-canada": "en-CA",
  "/crm-usa": "en-US", "/crm-uk": "en-GB", "/crm-philippines": "en-PH",
  "/crm-south-africa": "en-ZA", "/crm-malaysia": "en-MY",
};
const SINGLE_LANG_SUFFIX = [
  { suffix: "-uk", lang: "en-GB" }, { suffix: "-philippines", lang: "en-PH" },
  { suffix: "-south-africa", lang: "en-ZA" }, { suffix: "-malaysia", lang: "en-MY" },
];
function singleLangTags(path, lang) {
  return [
    { hreflang: lang, href: toAbsoluteUrl(path) },
    { hreflang: "en", href: toAbsoluteUrl(path) },
    { hreflang: "x-default", href: BASE_URL },
  ];
}
function germanTags(path) {
  return [
    { hreflang: "de-DE", href: toAbsoluteUrl(path) },
    { hreflang: "de", href: toAbsoluteUrl(path) },
    { hreflang: "x-default", href: BASE_URL },
  ];
}
function getSingleLangHreflang(path) {
  if (path === "/crm-germany" || path.endsWith("-germany")) return germanTags(path);
  const exact = SINGLE_LANG_EXACT[path];
  if (exact) return singleLangTags(path, exact);
  const suffixRule = SINGLE_LANG_SUFFIX.find((r) => path.endsWith(r.suffix));
  if (suffixRule) return singleLangTags(path, suffixRule.lang);
  if (path === "/crm-usa") return singleLangTags(path, "en-US");
  if (path.startsWith("/crm-for-") && !path.endsWith("-australia")) return singleLangTags(path, "en-US");
  return null;
}
function getCountryHubHreflang(path) {
  const countryPrefix = Object.keys(COUNTRY_HUB_HREFLANG).find(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  if (!countryPrefix) return null;
  const hubHreflang = COUNTRY_HUB_HREFLANG[countryPrefix];
  const subpages = COUNTRY_LANG_SUBPAGES[countryPrefix] ?? [];
  return [
    { hreflang: hubHreflang, href: toAbsoluteUrl(countryPrefix) },
    ...subpages.map((s) => ({ hreflang: s.hreflang, href: toAbsoluteUrl(s.path) })),
    { hreflang: "x-default", href: BASE_URL },
  ];
}
function NEW(currentPath) {
  const normalizedPath = normalizePath(currentPath);
  if (normalizedPath === "/in" || normalizedPath in INDIA_LANGUAGE_SLUG_HREFLANG) return INDIA_LANG_CLUSTER;
  const marketClusterTags = getMarketClusterTags(normalizedPath);
  if (marketClusterTags) return marketClusterTags;
  if (normalizedPath.startsWith("/in/")) {
    return [
      { hreflang: "en-IN", href: toAbsoluteUrl(normalizedPath) },
      { hreflang: "en", href: BASE_URL },
      { hreflang: "x-default", href: BASE_URL },
    ];
  }
  const singleLangTagsResult = getSingleLangHreflang(normalizedPath);
  if (singleLangTagsResult) return singleLangTagsResult;
  const countryHubTags = getCountryHubHreflang(normalizedPath);
  if (countryHubTags) return countryHubTags;
  if (normalizedPath === "/") {
    return [
      { hreflang: "en", href: BASE_URL }, { hreflang: "en-US", href: BASE_URL },
      { hreflang: "en-IN", href: `${BASE_URL}/in` }, { hreflang: "x-default", href: BASE_URL },
    ];
  }
  if (normalizedPath === "/pricing") {
    return [
      { hreflang: "en", href: `${BASE_URL}/pricing` }, { hreflang: "en-US", href: `${BASE_URL}/pricing` },
      { hreflang: "en-IN", href: `${BASE_URL}/in/pricing` }, { hreflang: "x-default", href: `${BASE_URL}/pricing` },
    ];
  }
  return [
    { hreflang: "en", href: toAbsoluteUrl(normalizedPath) },
    { hreflang: "en-US", href: toAbsoluteUrl(normalizedPath) },
    { hreflang: "x-default", href: toAbsoluteUrl(normalizedPath) },
  ];
}

const corpus = [
  "/", "/pricing", "/in", "/in/", "/in/pricing", "/in/crm-hindi", "/in/crm-tamil", "/in/something",
  "/usa", "/usa/pricing", "/uk", "/au", "/canada", "/uae", "/singapore", "/new-zealand",
  "/usa/industries", "/uk/industries/legal", "/in/services/managed-revops",
  "/crm-singapore", "/crm-uae", "/crm-dubai", "/crm-nigeria", "/crm-kenya", "/crm-canada",
  "/crm-usa", "/crm-uk", "/crm-philippines", "/crm-south-africa", "/crm-malaysia", "/crm-germany",
  "/crm-for-builders", "/crm-for-realtors-australia", "/crm-for-agencies-uk",
  "/crm-for-x-philippines", "/crm-for-x-south-africa", "/crm-for-x-malaysia", "/crm-for-x-germany",
  "/crm-for-x-australia", "/foo-uk", "/foo-philippines", "/foo-malaysia", "/foo-germany",
  "/ng", "/ng/crm-yoruba", "/pk", "/ph", "/ke", "/tz", "/ae", "/id", "/br", "/mx", "/bd",
  "/sg", "/gh/anything", "/random-page", "/about", "/blog/post#frag", "/x?y=1", "//double//slash/",
  "/crm-for-uk", "/crm-germany/extra", "/vn", "/th",
];

let fails = 0;
for (const p of corpus) {
  const a = JSON.stringify(OLD(p));
  const b = JSON.stringify(NEW(p));
  if (a !== b) { fails++; console.log("MISMATCH:", p, "\n  OLD:", a, "\n  NEW:", b); }
}
console.log(fails === 0 ? `PASS — ${corpus.length} paths identical` : `FAIL — ${fails} mismatches`);
process.exit(fails === 0 ? 0 : 1);

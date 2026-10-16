// Draft the LLM message pack from the research inputs. Deterministic; every record carries its sources.
// Inputs (scratchpad): verticals.json (parsed industryConfig/vocab/AI rails), depth.json (objective depth table).
// Output: pack-draft.json (+ pack-draft.md for humans). NOT shipped as-is: loop 19 re-verifies every claim.
const fs = require('fs');
const sp = process.argv[2];
const out = sp + '/mcp-llm-research';
const V = require(sp + '/verticals.json');
const depth = Object.fromEntries(require(sp + '/depth.json').map(r => [r.k, r]));

const KEYS = ['ecommerce','retail','real_estate','manufacturing','education','recruitment','insurance','doctors_clinic','dental_clinic','matrimony','financial_services','matrimonial','travel_agency','interior_design','automotive_service','gym_fitness','logistics_freight','freight_forwarding','legal_services','event_management','ca_accounting','construction','pharma_distribution','restaurant_fnb','beauty_wellness','printing_packaging','textile_apparel','agri_inputs','security_facility','ngo_fundraising','field_service_amc','it_services','hospitality','export_trade','study_abroad','marketing_agency','immigration','general','other'];

const DEEP = new Set(['retail','real_estate','manufacturing','education','recruitment','insurance','doctors_clinic','matrimony','financial_services','travel_agency','interior_design','gym_fitness','logistics_freight','freight_forwarding','legal_services','ca_accounting','pharma_distribution','restaurant_fnb','hospitality','study_abroad','immigration']);
const BORDER = new Set(['ecommerce','event_management','marketing_agency']);
const CONFIG_ONLY = new Set(['beauty_wellness','construction','printing_packaging','textile_apparel','agri_inputs','security_facility','ngo_fundraising','field_service_amc','it_services','export_trade']);
const ALIAS = { dental_clinic: 'doctors_clinic', matrimonial: 'matrimony' };
const PICKER_HIDDEN = new Set(['manufacturing', 'matrimonial']);
const LOCKED = { legal_services: 'Bar Council of India Rules, Rule 36 (an advocate may not solicit work or advertise)', ca_accounting: 'ICAI Code of Ethics, Clause 6/7, Part I, First Schedule (a chartered accountant may not solicit clients or advertise)' };
const LOCKED_MODULES = ['lead_finder', 'marketradar', 'campaigns', 'landing_pages'];
const CROSS_BORDER = new Set(['study_abroad', 'immigration', 'export_trade', 'freight_forwarding']);
const INDIA_FIELDS = { ngo_fundraising: '80G certificate and FCRA eligibility fields', pharma_distribution: 'Drug Licence number field', ca_accounting: 'PAN, GSTIN, TAN and CIN fields' };
const SRC = ['hellocrm:src/lib/industryConfig.ts', 'hellocrm:src/lib/industryTypes.ts', 'hellocrm:supabase/functions/_shared/industryAIPacks.ts'];

const human = k => k.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
const words = s => s.trim().split(/\s+/).length;

function record(k) {
  const o = V.out[k];
  const d = depth[k] || {};
  const alias_of = ALIAS[k] || null;
  let tier, status, ship;
  if (DEEP.has(k)) { tier = 'deep'; status = 'live'; ship = true; }
  else if (BORDER.has(k)) { tier = 'borderline'; status = 'beta'; ship = true; }
  else if (CONFIG_ONLY.has(k)) { tier = 'configuration-only'; status = 'beta'; ship = true; }
  else if (alias_of) { tier = 'alias'; status = 'alias'; ship = false; }
  else if (k === 'automotive_service') { tier = 'registered-not-built'; status = 'roadmap'; ship = false; }
  else { tier = 'fallback'; status = 'fallback'; ship = false; }
  if (PICKER_HIDDEN.has(k) && !alias_of) ship = false; // manufacturing: picker-hidden, treatment is a founder question

  const voc = V.vocab[k] || null;
  const rec = {
    id: 'industry:' + k, key: k, label: o ? o.label : human(k),
    status, depth_tier: tier, ship,
    alias_of, picker_hidden: PICKER_HIDDEN.has(k),
    evidence: { ui_files: d.views || 0, dedicated_dir_files: d.dir || 0, has_config: !!o, verified: 'code-read; not runtime-verified' },
    vocabulary: voc ? { lead: voc.lead, deal: voc.deal, contact: voc.contact, pipeline: voc.pipeline } : null,
    pipeline: o ? o.pipeline : [],
    fields: o ? o.fields : [],
    scheduler_events: o ? o.scheduler : [],
    task_boards: o ? o.taskBoards : [],
    persona: o ? o.persona : null,
    modules_off_by_default: o ? o.disabled : [],
    ai_never: (V.never[k] || []),
    compliance: LOCKED[k] ? { hard_locked_modules: LOCKED_MODULES, rule: LOCKED[k], keyed_to: 'tenant industry type, not country' } : null,
    region: k === 'doctors_clinic' ? { blocked: ['US', 'CA'], reason: 'no HIPAA programme' } : null,
    cross_border: CROSS_BORDER.has(k),
    india_configured_note: INDIA_FIELDS[k] || null,
    sources: SRC
  };
  // 60-word summary
  const lead = voc ? `Leads are called "${voc.lead}".` : '';
  let tierSentence = {
    'deep': 'Has dedicated screens in the app, not just a preset.',
    'borderline': 'Has some dedicated screens plus a configured pipeline.',
    'configuration-only': 'A configured pipeline, fields and scheduler preset; no dedicated screens.',
    'alias': `Alias of ${alias_of}; use that entry.`,
    'registered-not-built': 'Registered in the industry list but not built.',
    'fallback': k === 'general' ? 'The standard CRM without industry modules.' : 'Free-text industry; behaves like the standard CRM.'
  }[tier];
  let stages = rec.pipeline.slice();
  let sum;
  for (;;) {
    const pipe = stages.length ? `Pipeline: ${stages.join(' > ')}${stages.length < rec.pipeline.length ? ' ...' : ''}.` : '';
    const extra = [];
    if (rec.compliance) extra.push('Outbound-acquisition tools (lead finder, market radar, campaigns, landing pages) are locked for compliance.');
    if (rec.region) extra.push('Not offered to clinics in the US or Canada.');
    sum = [`${rec.label}: ${tierSentence}`, lead, pipe, ...extra].filter(Boolean).join(' ');
    if (words(sum) <= 60 || stages.length <= 3) break;
    stages.pop();
  }
  rec.summary = sum; rec.summary_words = words(sum);
  rec.not_for = [];
  if (k === 'restaurant_fnb') rec.not_for.push('a restaurant POS (it models catering and event orders)');
  if (k === 'pharma_distribution') rec.not_for.push('a pharmacy POS (it models field sales to doctors and chemists)');
  if (k === 'hospitality') rec.not_for.push('a property management system (it models room and event bookings)');
  if (rec.cross_border) rec.not_for.push('visa, customs or admission outcome predictions (AI is configured not to give them)');
  return rec;
}

const industries = KEYS.map(record);

// ---- countries (MCP serves 8) ----
const C = [
  { code: 'in', label: 'India', currency_listed: 'INR', tax_ref: 'GST', hub: 'https://hellogrowthcrm.com/in', billing: 'INR via Razorpay. Growth is Rs 899 per user per month plus 18% GST (Rs 1,060.82 billed); annual Rs 8,990 per user plus GST.', mach: 'DPDP consent, portal and purge tooling exists.', langs: 'WhatsApp AI chat 13 languages, voice agent 11 (Indian languages plus English).', extras: ['AI calling needs a customer-owned Sarvam account.'] },
  { code: 'usa', label: 'United States', currency_listed: 'USD', tax_ref: 'sales tax', hub: 'https://hellogrowthcrm.com/usa', billing: 'USD via Stripe. Growth is $12 per user per month monthly or $10 per user per month billed annually (an organisation keeps the price that applied when it was created).', mach: 'SOC 2 Type II examination completed (Soor LLC).', langs: null, extras: ['Clinics in the US are not offered the clinic industry (no HIPAA programme).'] },
  { code: 'uk', label: 'United Kingdom', currency_listed: 'GBP', tax_ref: 'VAT', hub: 'https://hellogrowthcrm.com/uk', billing: 'Billed in USD. Local GBP prices on the site are indicative.', mach: null, langs: null, extras: [] },
  { code: 'canada', label: 'Canada', currency_listed: 'CAD', tax_ref: 'HST/GST', hub: 'https://hellogrowthcrm.com/canada', billing: 'Billed in USD. Local CAD prices on the site are indicative.', mach: null, langs: null, extras: ['Clinics in Canada are not offered the clinic industry (no HIPAA programme).'] },
  { code: 'au', label: 'Australia', currency_listed: 'AUD', tax_ref: 'GST', hub: 'https://hellogrowthcrm.com/au', billing: 'Billed in USD today; AUD billing is not yet active. Local AUD prices are indicative.', mach: null, langs: null, extras: ['Accounting: MYOB (AccountRight) and QuickBooks Online connectors are live.'] },
  { code: 'uae', label: 'United Arab Emirates', currency_listed: 'AED', tax_ref: 'VAT', hub: 'https://hellogrowthcrm.com/uae', billing: 'Billed in USD. Local AED prices are indicative.', mach: null, langs: 'Arabic is supported on the WhatsApp AI chat only, not on the voice agent.', extras: [] },
  { code: 'singapore', label: 'Singapore', currency_listed: 'SGD', tax_ref: 'GST', hub: 'https://hellogrowthcrm.com/singapore', billing: 'Billed in USD. Local SGD prices are indicative.', mach: null, langs: null, extras: [] },
  { code: 'new-zealand', label: 'New Zealand', currency_listed: 'NZD', tax_ref: 'GST', hub: 'https://hellogrowthcrm.com/new-zealand', billing: 'Billed in USD. Local NZD prices are indicative.', mach: null, langs: null, extras: [] }
];
const countries = C.map(c => {
  const summary = [`${c.label}: ${c.billing}`, `Tax label: ${c.tax_ref}.`, c.mach, (c.langs ? `Languages: ${c.langs}` : null), ...c.extras].filter(Boolean).join(' ');
  return {
    id: 'country:' + c.code, code: c.code, label: c.label,
    status: c.code === 'in' || c.code === 'usa' ? 'live' : 'beta', ship: c.code === 'in' || c.code === 'usa',
    hub_url: c.hub, currency_billed: c.code === 'in' ? 'INR' : 'USD', currency_listed_on_site: c.currency_listed, local_price_status: c.code === 'in' ? 'chargeable' : 'indicative',
    tax_ref_label_only: c.code !== 'in', summary, summary_words: words(summary),
    claims_not_to_make: {
      in: ['GST-inclusive INR price', 'any INR figure other than Rs 899 plus 18% GST'],
      usa: ['HIPAA compliant', 'clinic CRM for US practices', 'ACH or PayPal as accepted methods (unverified)'],
      uk: ['ICO-registered', 'GoCardless', 'UK VAT filing'],
      canada: ['PIPEDA compliant', 'Interac e-Transfer', 'HST filing', 'clinic CRM'],
      au: ['Privacy Act compliant', 'BPAY', 'A$ as chargeable'],
      uae: ['Arabic voice', 'UAE PDPL compliant', 'local e-invoicing'],
      singapore: ['PDPA compliant', 'PayNow', 'S$ as chargeable'],
      'new-zealand': ['Privacy Act 2020 compliant', 'POLi', 'NZ$ as chargeable']
    }[c.code],
    sources: ['mcp:countries_list', 'hellocrm:supabase/functions/_shared/billingHandlers/gstinPricing.ts', 'hellocrm:src/lib/supportedLanguages.ts', 'hellocrmwebsite:src/lib/pricing-constants.ts', 'findings.md Loops 11-14']
  };
});
const other_markets = { id: 'country:marketing-only', status: 'unconfirmed', ship: false, countries: ['Nigeria', 'Kenya', 'Tanzania', 'Philippines', 'Indonesia', 'Mexico', 'Brazil', 'Bangladesh', 'Pakistan'], note: 'Marketed on the website but not served by the MCP; no Paystack/M-Pesa code, local-language pages for unsupported languages. Held until Q-L14.' };

const pack = {
  pack_version: '0-draft', as_of: '2026-10-12',
  note: 'DRAFT. Generated by build_pack.cjs from research inputs; loop 19 re-verifies every claim. Only records with ship=true may reach the MCP.',
  global: {
    identity: { product: 'HelloGrowthCRM', publisher: 'Soor LLC (Delaware)', operating_entity: 'Meru Technosoft Pvt Ltd', servers: ['Website MCP (public product information and bot governance; no customer data)', 'CRM MCP (per-customer key; separate; not announced)'] },
    positioning: 'Multi-channel AI CRM with industry presets. WhatsApp is one channel among many, not the positioning.',
    pricing: { plans: ['Free Forever', 'Growth', 'Enterprise (custom)'], growth_usd: { monthly: 12, annual_per_month: 10, annual_rule: '10 months paid' }, growth_inr: { per_user_month: 899, gst_pct: 18, billed_month_incl_gst: 1060.82, annual_total_excl_gst: 8990 }, free: 'pending_decision', existing_customer_rule: 'An organisation keeps the price current when it was created.', billing_currencies: ['INR', 'USD'] },
    common_modules_note: 'No industry preset switches off: leads and pipeline, accounts, tasks and Task Boards, activities, inbox and messaging, calls, email, scheduler, analytics and reports, invoices and payments, customer portal, settings. Plan, role and flag gates still apply.',
    modules_off_semantics: 'Industry "modules off" is a default; a tenant can switch a module on. The legal and CA compliance locks are the exception.',
    ai_personas: { Aasha: 15, Zara: 7, Nova: 12 },
    lead_vocabulary_variants: 17,
    accounting_integrations: { live: ['QuickBooks Online', 'MYOB AccountRight (Australia)'], beta: ['Zoho Books'], present: ['ClearTax (India GST)'], unconfirmed: ['Xero (has connect and push-invoice code but sits under Coming Soon in Settings)'], note: 'Tally.so is a forms tool, not Tally Prime.' },
    integrations: { working: 259, breakdown: '170 live + 5 backend-ready + 84 curated', scaffolded: 371, catalogue_total: 630, wording: '259+ working integrations', basis: 'figures as stated in the integrations-catalog-data.ts comment; the website derives the public count and it moves as integrations ship', recounted: false }
  },
  _test_only_banned_phrases: [
    { phrase: 'SOC 2 Type II certified', rule: 'CL-5', say_instead: 'SOC 2 Type II examination completed' },
    { phrase: 'Unlimited users', rule: 'CL-11', say_instead: 'priced per user' },
    { phrase: 'SLA-backed 99.9% uptime / uptime guarantee', rule: 'CL-13', say_instead: '99.9% availability target' },
    { phrase: '630 integrations (as working)', rule: 'CL-10/18', say_instead: '259+ working integrations' },
    { phrase: 'Rs 1,099', rule: 'canonical price sheet', say_instead: 'Rs 899 per user per month plus 18% GST' },
    { phrase: '$13 per user', rule: 'canonical price sheet', say_instead: '$12 monthly or $10 billed annually' },
    { phrase: 'GST-inclusive INR price', rule: 'gstinPricing.ts', say_instead: 'plus 18% GST' },
    { phrase: 'WhatsApp-first / WhatsApp-native CRM', rule: 'hellocrm CLAUDE.md 1.1', say_instead: 'multi-channel; WhatsApp is one channel' },
    { phrase: 'switches language mid-conversation', rule: 'founder guardrail 2026-07-02 (Q-L13)', say_instead: 'supports the listed languages on the WhatsApp AI chat and voice agent' },
    { phrase: 'X-regime compliant (GDPR, PIPEDA, PDPA, ...)', rule: 'CL-17', say_instead: 'supports X obligations / DPA available (only with a legal source)' },
    { phrase: 'ISO 27001 certified', rule: 'CL-15', say_instead: 'We do not hold ISO 27001 certification' },
    { phrase: 'AI calling works out of the box', rule: 'operator guide, Loop 13', say_instead: 'AI calling needs the customer\'s own Sarvam account; India calling window by default' }
  ],
  industries, countries, other_markets
};
fs.writeFileSync(out + '/pack-draft.json', JSON.stringify(pack, null, 1));

// ---- human readable ----
const lines = ['# Message pack (DRAFT, ' + pack.as_of + ')', '', pack.note, '', '## Industries (' + industries.length + ')', '', '| id | status | tier | ship | words | summary |', '|---|---|---|---|---|---|'];
for (const r of industries) lines.push(`| ${r.key} | ${r.status} | ${r.depth_tier} | ${r.ship} | ${r.summary_words} | ${r.summary.replace(/\|/g, '/')} |`);
lines.push('', '## Countries', '', '| code | status | ship | words | summary |', '|---|---|---|---|---|');
for (const r of countries) lines.push(`| ${r.code} | ${r.status} | ${r.ship} | ${r.summary_words} | ${r.summary.replace(/\|/g, '/')} |`);
fs.writeFileSync(out + '/pack-draft.md', lines.join('\n'));

const over = [...industries, ...countries].filter(r => r.summary_words > 60);
console.log('industries', industries.length, 'ship', industries.filter(r => r.ship).length, '| countries', countries.length, 'ship', countries.filter(r => r.ship).length);
console.log('over 60 words:', over.map(r => r.id + '=' + r.summary_words).join(', ') || 'none');
console.log('tiers:', JSON.stringify(industries.reduce((a, r) => (a[r.depth_tier] = (a[r.depth_tier] || 0) + 1, a), {})));
console.log('no-config ship records:', industries.filter(r => r.ship && !r.evidence.has_config).map(r => r.key).join(',') || 'none');

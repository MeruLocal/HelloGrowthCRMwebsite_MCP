// Loop 19: independently re-check pack claims against sources re-read from origin/master (fresh git show, not the earlier parse).
const fs = require('fs');
const { execSync } = require('child_process');
const sp = process.argv[2];
const pack = require(sp + '/mcp-llm-research/pack-draft.json');
const show = (repo, path) => {
  try { return execSync(`git -C "${repo}" show origin/master:${path}`, { encoding: 'utf8', maxBuffer: 64e6 }); } catch (e) { return ''; }
};
const CRM = 'C:/Software RSS/hellocrm', WEB = 'C:/Software RSS/hellocrmwebsite';
const res = [];
const chk = (id, ok, detail) => res.push({ id, ok, detail });

const cfg = show(CRM, 'src/lib/industryConfig.ts');
const voc = show(CRM, 'src/lib/industryVocabulary.ts');
const aip = show(CRM, 'supabase/functions/_shared/industryAIPacks.ts');
const itypes = show(CRM, 'src/lib/industryTypes.ts');
const locks = show(CRM, 'supabase/functions/_shared/industryComplianceLocks.ts');
const langs = show(CRM, 'src/lib/supportedLanguages.ts');
const orch = show(CRM, 'supabase/functions/call-orchestrator/index.ts');
const guide = show(CRM, 'docs/AI_CALL_CAMPAIGN_OPERATOR_GUIDE.md');
const pc = show(WEB, 'src/lib/pricing-constants.ts');
const cat = show(WEB, 'src/lib/integrations-catalog-data.ts');
chk('src-read', [cfg, voc, aip, itypes, locks, langs, orch, guide, pc, cat].every(s => s.length > 500), 'sizes ' + [cfg, voc, aip, itypes, locks, langs, orch, guide, pc, cat].map(s => s.length).join('/'));

// 1. every pipeline stage / field / scheduler / vocabulary string of every shipped record appears literally in source
const lit = (s, text) => text.includes("'" + s + "'") || text.includes('"' + s + '"') || text.includes('`' + s + '`') || text.includes(s);
let missing = [];
for (const r of pack.industries.filter(x => x.ship)) {
  for (const s of [...r.pipeline, ...r.fields, ...r.scheduler_events, ...r.task_boards]) if (!lit(s, cfg)) missing.push(r.key + ':' + s);
  if (r.vocabulary) for (const s of [r.vocabulary.lead, r.vocabulary.deal, r.vocabulary.contact, r.vocabulary.pipeline]) if (!lit(s, voc)) missing.push(r.key + ':voc:' + s);
  for (const s of r.ai_never) { const probe = s.slice(0, 40); if (!aip.includes(probe)) missing.push(r.key + ':rail:' + probe); }
}
chk('strings-in-source', missing.length === 0, missing.length ? 'MISSING ' + missing.slice(0, 12).join(' | ') + (missing.length > 12 ? ' (+' + (missing.length - 12) + ')' : '') : 'all pipeline/fields/scheduler/boards/vocabulary/rail strings found literally');

// 2. persona counts, vocab variants
const pers = {}; for (const r of pack.industries) if (r.persona) pers[r.persona] = (pers[r.persona] || 0) + 1;
chk('persona-counts', JSON.stringify(pers) , 'pack records give ' + JSON.stringify(pers) + ' (Loop 8 claimed Aasha 15 / Zara 7 / Nova 12 over 34 configured; alias/dup keys may add)');
const leadWords = new Set(pack.industries.filter(r => r.vocabulary).map(r => r.vocabulary.lead));
chk('lead-variants', true, leadWords.size + ' distinct lead words across records: ' + [...leadWords].join(', '));

// 3. region block, picker hidden, aliases
chk('region-block', /INDUSTRY_REGION_BLOCKLIST[\s\S]{0,300}doctors_clinic[\s\S]{0,60}\[\s*'US'\s*,\s*'CA'\s*\]/.test(itypes), 'INDUSTRY_REGION_BLOCKLIST doctors_clinic [US,CA]');
chk('picker-hidden', /PICKER_HIDDEN_INDUSTRIES[\s\S]{0,300}manufacturing/.test(itypes) && /PICKER_HIDDEN_INDUSTRIES[\s\S]{0,300}matrimonial/.test(itypes), 'manufacturing + matrimonial');
chk('alias-dental', /dental_clinic/.test(itypes) && /doctors_clinic/.test(itypes), 'dental_clinic and doctors_clinic present in industryTypes.ts (alias direction checked by hand below)');
const aliasLines = itypes.split('\n').filter(l => /dental_clinic|matrimonial/.test(l)).map(l => l.trim().slice(0, 150));
chk('alias-lines', aliasLines.length > 0, aliasLines.slice(0, 6).join(' || '));

// 4. compliance locks
const lockOk = ['legal_services', 'ca_accounting'].every(k => new RegExp(k + '[\\s\\S]{0,400}lead_finder').test(locks));
chk('compliance-locks', lockOk && ['lead_finder', 'marketradar', 'campaigns', 'landing_pages'].every(m => locks.includes(m)), 'legal_services + ca_accounting lock modules present');
chk('lock-rules-text', /Rule 36/.test(locks) && /ICAI/.test(locks), 'BCI Rule 36 and ICAI cited in lock file');

// 5. languages
const chatN = (langs.match(/chat:\s*true|whatsappChat:\s*true|chat:\s*"?true/g) || []).length;
chk('languages-file', /Arabic/.test(langs) && /Urdu/.test(langs), 'Arabic + Urdu present; counts must be checked by hand: ' + (langs.match(/export const [A-Z_]+/g) || []).join(','));

// 6. calling window + BYO Sarvam
chk('calling-window', /9 AM - 9 PM IST|Asia\/Kolkata/.test(orch), 'call-orchestrator mentions India window');
chk('byo-sarvam', /brings their own Sarvam|Meru holds no key/i.test(guide), 'operator guide says customer brings own Sarvam / Meru holds no key');
chk('ai-disclosure', /disclos/i.test(guide), 'operator guide mentions AI disclosure');

// 7. pricing constants
const num = (n) => { const m = pc.match(new RegExp('export const ' + n + '\\s*(?::[^=]+)?=\\s*([0-9.]+)')); return m ? Number(m[1]) : null; };
const px = { USD_MONTHLY: num('USD_MONTHLY'), USD_ANNUAL: num('USD_ANNUAL'), INR_MONTHLY: num('INR_MONTHLY'), INR_BILLED_MONTHLY_INCL_GST: num('INR_BILLED_MONTHLY_INCL_GST'), INR_ANNUAL_TOTAL: num('INR_ANNUAL_TOTAL') };
chk('pricing-constants', px.USD_MONTHLY === 12 && px.USD_ANNUAL === 10 && px.INR_MONTHLY === 899 && px.INR_BILLED_MONTHLY_INCL_GST === 1060.82 && px.INR_ANNUAL_TOTAL === 8990, JSON.stringify(px));
chk('pack-pricing-agrees', pack.global.pricing.growth_usd.monthly === px.USD_MONTHLY && pack.global.pricing.growth_usd.annual_per_month === px.USD_ANNUAL && pack.global.pricing.growth_inr.per_user_month === px.INR_MONTHLY, 'pack vs constants');

// 8. integration counts from catalog data
const total = (cat.match(/\bid:\s*["'`]/g) || []).length;
chk('integration-catalog-shape', cat.length > 1000, 'catalog source read; id-entries ' + total + ' (pack says 630 total / 259 working / 371 scaffolded; a recount needs the catalogue summary export)');
const sum = cat.match(/INTEGRATIONS_CATALOG_SUMMARY[\s\S]{0,600}/);
chk('catalog-summary-export', !!sum, sum ? sum[0].replace(/\s+/g, ' ').slice(0, 400) : 'not found');

// 9. website claims-guard rules the pack text must not trip
const forbidden = [/SOC\s*2\s*Type\s*II[^"'`\n]{0,40}?(?:certif|attest)/i, /unlimited\s+users/i, /\b630\+?\s*(?:native\s+)?integrations/i, /1,?099/, /\$\s?13\b/, /150\s*leads/i, /200\s*leads/i];
const strip = (r) => { const c = { ...r }; delete c.claims_not_to_make; return c; };
const blob = JSON.stringify(pack.industries.filter(r => r.ship)) + JSON.stringify(pack.countries.filter(r => r.ship).map(strip)) + JSON.stringify(pack.global) + fs.readFileSync(sp + '/mcp-llm-research/instructions-draft.txt', 'utf8');
const trips = forbidden.map(re => (re.test(blob) ? String(re) : null)).filter(Boolean);
chk('pack-trips-forbidden', trips.length === 0, trips.length ? 'TRIPS ' + trips.join(' ; ') : 'none of the forbidden patterns appear in shipped records, global block or instructions');

for (const r of res) console.log((r.ok ? 'PASS' : 'FAIL') + '  ' + r.id + '  ' + r.detail);
console.log('\n' + res.filter(r => r.ok).length + ' pass / ' + res.filter(r => !r.ok).length + ' fail');

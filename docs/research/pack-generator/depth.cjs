// Objective depth table for every INDUSTRY_OPTIONS entry (read-only inputs, all in the scratchpad).
const fs = require('fs');
const sp = process.argv[2];
const j = require(sp + '/verticals.json');
const lines = (f) => fs.readFileSync(sp + '/' + f, 'utf8').split('\n').filter(Boolean);
const industry = lines('industry_files.txt');
const crm = lines('crm_files.txt');
const inv = fs.readFileSync(sp + '/FEATURE_INVENTORY.md', 'utf8');

const keys = ['ecommerce','retail','real_estate','manufacturing','education','recruitment','insurance','doctors_clinic','dental_clinic','matrimony','financial_services','matrimonial','travel_agency','interior_design','automotive_service','gym_fitness','logistics_freight','freight_forwarding','legal_services','event_management','ca_accounting','construction','pharma_distribution','restaurant_fnb','beauty_wellness','printing_packaging','textile_apparel','agri_inputs','security_facility','ngo_fundraising','field_service_amc','it_services','hospitality','export_trade','study_abroad','marketing_agency','immigration','general','other'];

// table-name prefixes per vertical (approximate: inventory table names are matched by prefix)
const pref = {
  ecommerce: 'ecom_|shopify_', retail: 'retail_', real_estate: 're_', manufacturing: 'mfg_|manufacturing_',
  education: 'edu_', recruitment: 'rec_|recruit|candidate', insurance: 'ins_|insurance_', doctors_clinic: 'clinic_',
  dental_clinic: '', matrimony: 'matrimon', financial_services: 'loan_|fin_', matrimonial: '',
  travel_agency: 'travel_', interior_design: 'interior_|boq_', automotive_service: 'vehicle_|job_card',
  gym_fitness: 'gym_', logistics_freight: 'logistics_|shipment', freight_forwarding: 'freight_', legal_services: 'legal_',
  event_management: 'event_', ca_accounting: 'ca_', construction: 'constr', pharma_distribution: 'pharma_',
  restaurant_fnb: 'restaurant_|fnb_', beauty_wellness: 'beauty_|salon_', printing_packaging: 'print_|packag',
  textile_apparel: 'textile_|garment', agri_inputs: 'agri_', security_facility: 'guard_|facility_|security_',
  ngo_fundraising: 'ngo_|donor|donation', field_service_amc: 'amc_|field_service', it_services: 'msp_|it_service',
  hospitality: 'hotel_|hospitality_', export_trade: 'export_', study_abroad: 'abroad|study_', marketing_agency: 'agency_',
  immigration: 'immigration|visa_', general: '', other: ''
};
// dedicated component directories under src/components/crm/ (beyond industry/<key>/)
const dirs = {
  ecommerce: ['ecommerce'], retail: ['retail'], real_estate: ['realestate'], manufacturing: ['manufacturing'],
  education: ['education', 'lms'], recruitment: ['recruitment'], insurance: ['insurance'],
  financial_services: ['loan', 'investments'], travel_agency: ['travel']
};

const rows = [];
for (const k of keys) {
  const views = industry.filter(f => f.includes('/industry/' + k + '/') && /\.tsx$/.test(f) && !/test|_kit/.test(f)).length;
  const dir = (dirs[k] || []).reduce((a, d) => a + crm.filter(f => f.includes('/crm/' + d + '/') && /\.tsx?$/.test(f) && !/test/.test(f)).length, 0);
  let tables = 0;
  if (pref[k]) {
    const re = new RegExp('(?<![a-z0-9])(' + pref[k] + ')[a-z0-9_]*', 'g');
    tables = new Set(inv.match(re) || []).size;
  }
  const o = j.out[k];
  rows.push({
    k, cfg: !!o, stages: o ? o.pipeline.length : 0, fields: o ? o.fields.length : 0,
    views, dir, tables, rails: (j.never[k] || []).length, off: o ? o.disabled.length : 0
  });
}
fs.writeFileSync(sp + '/depth.json', JSON.stringify(rows, null, 1));
console.log('key | config | stages | fields | industry-views | dedicated-dir-files | tables~ | rails | modules_off');
rows.forEach(r => console.log([r.k, r.cfg ? 'Y' : 'N', r.stages, r.fields, r.views, r.dir, r.tables, r.rails, r.off].join(' | ')));

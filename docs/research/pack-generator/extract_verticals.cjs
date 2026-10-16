// Extract per-vertical facts from industryConfig.ts / industryVocabulary.ts / industryAIPacks.ts (read-only).
const fs = require('fs');
const sp = process.argv[2];
const cfg = fs.readFileSync(sp + '/industryConfig.ts', 'utf8');
const voc = fs.readFileSync(sp + '/industryVocabulary.ts', 'utf8');
const packs = fs.readFileSync(sp + '/industryAIPacks.ts', 'utf8');

// split INDUSTRY_CONFIGS into blocks at 2-space-indented keys
const lines = cfg.split('\n');
const starts = [];
lines.forEach((l, i) => { const m = l.match(/^  ([a-z_]+): \{\s*$/); if (m) starts.push([m[1], i]); });
const blocks = {};
starts.forEach(([k, i], idx) => {
  const end = idx + 1 < starts.length ? starts[idx + 1][1] : lines.length;
  blocks[k] = lines.slice(i, end).join('\n');
});

const names = (txt, re) => [...txt.matchAll(re)].map(m => m[1]);
const arrOf = (txt, key) => {
  const m = txt.match(new RegExp(key + ':\\s*\\[([\\s\\S]*?)\\]\\s*,'));
  return m ? names(m[1], /['"]([^'"]+)['"]/g) : [];
};

const out = {};
for (const [k, b] of Object.entries(blocks)) {
  if (k === 'general' && !b.includes('defaultPipeline')) { /* keep anyway */ }
  const seg = (name) => { const m = b.match(new RegExp(name + ':\\s*\\[([\\s\\S]*?)\\n    \\],')); return m ? m[1] : ''; };
  out[k] = {
    label: (b.match(/label:\s*'([^']+)'/) || [])[1] || null,
    entityTypes: names(seg('entityTypes'), /label:\s*'([^']+)'/g),
    pipeline: names(seg('defaultPipeline'), /name:\s*'([^']+)'/g),
    fields: names(seg('defaultFields'), /name:\s*'([^']+)'/g),
    scheduler: names(seg('schedulerSeed'), /name:\s*'([^']+)'/g),
    taskBoards: names(seg('taskBoardSeed'), /name:\s*'([^']+)'/g),
    widgets: arrOf(b, 'dashboardWidgets'),
    persona: (b.match(/persona:\s*'([^']+)'/) || [])[1] || null,
    allow: arrOf(b, 'tool_allowlist'),
    block: arrOf(b, 'tool_blocklist'),
    disabled: arrOf(b, 'defaultDisabledFeatures'),
  };
}

// vocabulary: lead/deal/contact terms per key
const vocab = {};
const vstarts = [];
voc.split('\n').forEach((l, i) => { const m = l.match(/^  ([a-z_]+): \{\s*$/); if (m) vstarts.push([m[1], i]); });
const vl = voc.split('\n');
vstarts.forEach(([k, i], idx) => {
  const end = idx + 1 < vstarts.length ? vstarts[idx + 1][1] : vl.length;
  const b = vl.slice(i, end).join('\n');
  const g = (t) => (b.match(new RegExp('\\b' + t + ":\\s*'([^']+)'")) || [])[1];
  vocab[k] = { lead: g('lead'), leads: g('leads'), pipeline: g('pipeline'), deal: g('deal'), contact: g('contact'), dashboard: g('dashboard_title') };
});

// AI packs: NEVER lines
const never = {};
const pstarts = [];
packs.split('\n').forEach((l, i) => { const m = l.match(/^  ([a-z_]+):\s*(`|\{)/); if (m) pstarts.push([m[1], i]); });
const pl = packs.split('\n');
pstarts.forEach(([k, i], idx) => {
  const end = idx + 1 < pstarts.length ? pstarts[idx + 1][1] : pl.length;
  const b = pl.slice(i, end).join('\n');
  const n = b.match(/NEVER[^\n]*\n([\s\S]*?)(\n\n|`,|$)/);
  never[k] = n ? n[1].split('\n').map(s => s.replace(/^[\s\-•*]+/, '').trim()).filter(Boolean).slice(0, 6) : [];
});

fs.writeFileSync(sp + '/verticals.json', JSON.stringify({ out, vocab, never }, null, 1));
const want = (process.argv[3] || '').split(',').filter(Boolean);
for (const k of want) {
  const o = out[k]; const v = vocab[k] || {}; const nv = never[k] || [];
  console.log('\n### ' + k + (o ? ' — ' + o.label : ' — (NO IndustryConfig entry)'));
  if (o) {
    console.log(' vocab: lead=' + v.lead + ' | deal=' + v.deal + ' | contact=' + v.contact + ' | pipeline=' + v.pipeline + ' | dashboard=' + v.dashboard);
    console.log(' entities: ' + o.entityTypes.join(', '));
    console.log(' pipeline (' + o.pipeline.length + '): ' + o.pipeline.join(' > '));
    console.log(' fields (' + o.fields.length + '): ' + o.fields.join(', '));
    console.log(' scheduler: ' + o.scheduler.join(', ') + ' | boards: ' + o.taskBoards.join(', '));
    console.log(' widgets: ' + o.widgets.join(', '));
    console.log(' persona: ' + o.persona + ' | tools: ' + o.allow.join(', ') + (o.block.length ? ' | blocked: ' + o.block.join(', ') : ''));
    console.log(' disabled: ' + o.disabled.join(', '));
  }
  console.log(' AI NEVER rails (' + nv.length + '): ' + nv.map(s => s.slice(0, 110)).join(' ;; '));
}
console.log('\nconfig keys parsed: ' + Object.keys(out).length + ' | vocab keys: ' + Object.keys(vocab).length + ' | pack keys: ' + Object.keys(never).length);

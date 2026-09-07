#!/usr/bin/env node
/**
 * ai-citation-audit.mjs — measure HelloGrowthCRM's citation presence in
 * AI-engine answers for commercial queries. Zero dependencies.
 *
 * WHY: 2026-09-07 baseline (see docs/plans/AI_TRAFFIC_RUNBOOK_2026-09-07.md):
 * unbranded presence 1/9 (Gemini) · 0/9 (Grok) · 0/2 (Copilot spot) while all
 * engines cited the web 10/10. Success = that number rising month over month.
 *
 * USAGE:
 *   GEMINI_API_KEY=... XAI_API_KEY=... node scripts/ai-citation-audit.mjs
 * Queries live in scripts/ai-citation-queries.json — edit there, not here.
 *
 * COVERAGE: Gemini (grounded google_search) + Grok (Agent Tools web_search).
 * Perplexity/DeepSeek login-wall automation — run those 10 queries manually
 * from a logged-in browser and record in the same shape. Copilot: spot-check
 * at bing.com/copilotsearch?q=<query> (answer renders in shadow DOM; read
 * visually). ChatGPT presence is evidenced by live referral traffic instead.
 *
 * GOTCHAS (hard-won):
 *  - xAI: search_parameters is DEPRECATED → use POST /v1/responses with
 *    tools:[{type:"web_search"}]. Citations arrive as output_text annotations.
 *  - Gemini grounding URIs are vertexaisearch redirect wrappers — detect "us
 *    cited" via answer TEXT mention + redirect targets, not hostname alone.
 *  - Treat zero as data only across >= 3 runs; single-run zeros can be model
 *    nondeterminism. Never call the personal-data MCP tools in any audit.
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const HERE = dirname(fileURLToPath(import.meta.url));
const { queries, competitors, brand } = JSON.parse(
  readFileSync(join(HERE, "ai-citation-queries.json"), "utf8"),
);
const GEM = process.env.GEMINI_API_KEY;
const XAI = process.env.XAI_API_KEY;
if (!GEM && !XAI) {
  console.error("Set GEMINI_API_KEY and/or XAI_API_KEY in the environment.");
  process.exit(2);
}

const hostsOf = (urls) => [
  ...new Set(
    urls
      .map((u) => {
        try {
          return new URL(u).hostname.replace(/^www\./, "");
        } catch {
          return null;
        }
      })
      .filter(Boolean),
  ),
];

const row = (id, text, cites) => {
  const t = text.toLowerCase();
  const hosts = hostsOf(cites);
  return {
    id,
    web_cited: cites.length > 0,
    us_cited: hosts.some((h) => h.includes(brand)) || t.includes(brand),
    competitors_in_text: competitors.filter((c) => t.includes(c)),
    cited_hosts: hosts.slice(0, 10),
  };
};

const results = {};
for (const [engine, enabled] of [["gemini", !!GEM], ["grok", !!XAI]]) {
  if (!enabled) continue;
  results[engine] = [];
  for (const { id, q } of queries) {
    try {
      let text = "", cites = [];
      if (engine === "gemini") {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEM}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: q }] }],
              tools: [{ google_search: {} }],
            }),
          },
        );
        const j = await r.json();
        if (j.error) throw new Error(j.error.message);
        const cand = j.candidates?.[0];
        text = (cand?.content?.parts || []).map((p) => p.text || "").join(" ");
        cites = (cand?.groundingMetadata?.groundingChunks || [])
          .map((c) => c.web?.uri)
          .filter(Boolean);
      } else {
        const r = await fetch("https://api.x.ai/v1/responses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + XAI,
          },
          body: JSON.stringify({
            model: "grok-4-fast",
            input: q,
            tools: [{ type: "web_search" }],
          }),
        });
        const j = await r.json();
        if (j.error) throw new Error(j.error.message || String(j.error));
        for (const o of j.output || [])
          for (const c of o.content || [])
            if (c.type === "output_text") {
              text += c.text;
              for (const a of c.annotations || []) if (a.url) cites.push(a.url);
            }
        if (j.citations) cites.push(...j.citations);
      }
      results[engine].push(row(id, text, cites));
    } catch (e) {
      results[engine].push({ id, err: String(e.message || e).slice(0, 120) });
    }
    process.stdout.write(`${engine}:${id} `);
  }
}

const stamp = new Date().toISOString().slice(0, 10);
const outFile = join(HERE, `..`, `ai-citation-audit-${stamp}.json`);
writeFileSync(outFile, JSON.stringify(results, null, 1));
console.log(`\nsaved ${outFile}`);
let regression = false;
for (const [engine, rows] of Object.entries(results)) {
  const unbranded = rows.filter((r) => !r.id.includes("BRANDED"));
  const us = unbranded.filter((r) => r.us_cited).length;
  const errs = rows.filter((r) => r.err).length;
  console.log(
    `${engine}: unbranded presence ${us}/${unbranded.length} · errors ${errs}`,
  );
  if (errs === rows.length) regression = true;
}
// process.exitCode (not process.exit) — hard exit races libuv teardown on
// Windows and aborts with an async.c assertion after output is flushed.
process.exitCode = regression ? 1 : 0;

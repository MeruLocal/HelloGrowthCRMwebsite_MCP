# GEO/AEO — Consolidated Findings & Remediation Plan (Rev 2)

**Created:** 2026-08-10 · **Supersedes:** parts of `GEO_AEO_MASTER_PLAN.md` (MCP repo, PR #2, merged 2026-08-05)
**Repos:** `[web]` `MeruLocal/hellocrmwebsite` · `[mcp]` `MeruLocal/HelloGrowthCRMwebsite_MCP` · `[ops]` console work
**Reviewers consulted:** GPT-5.6-sol (R1), GPT-5.3-codex (R2, briefed with R1), Gemini (R3, browser)

---

## 0. Corrections to Rev 1 — read before doing anything

Rev 1 was written from live measurement, but **five of its findings were wrong**. Two would
have wasted a developer's day; one would have caused a production outage. They are corrected
first because acting on stale findings is worse than having none.

| # | Rev 1 said | Truth | Consequence if acted on |
|---|---|---|---|
| **C-1** | `CDN-Cache-Control: private, no-store` is a bug — remove it | **Deliberate and correct.** `next.config.js:292-323` documents why, dated 2026-07-08 | **Would have broken geo-routing in production** |
| **C-2** | Bot/user locale split is a cloaking risk | **Deliberate.** `src/middleware.ts:39` has a `BOT_UA` allowlist — *"never redirect these"* | Wasted investigation |
| **C-3** | No IndexNow | **Shipped and working.** Key file `/bdfd433fe13b4062a8a11f2a12586be9.txt` → 200 | Would have rebuilt a working feature |
| **C-4** | 3 sitemaps hard-fail at a 15.3s timeout | **Intermittent**, not permanent. Later: 200 for all 9 in 0.9–4.4s | Wrong root-cause hunt |
| **C-5** | `features_list`, `templates_list`, `content_list_tools` return zero items | **They work.** My probe called `handle({})` directly, bypassing the zod defaults `server.ts:76` applies | Would have "fixed" working code |

### C-1 in full, because it is the dangerous one

> `/` and `/pricing` responses DIFFER PER VISITOR — a 307 → `/in` for India, `/usa` for the US,
> plain HTML for global — decided by middleware AT THE ORIGIN. Cloudflare sits IN FRONT of the
> origin and its cache key is URL-only (no country, and `Vary` is ignored on non-Enterprise
> plans). Any `public` CDN caching here means: (1) CF serves its cached copy without the
> middleware ever running → geo redirect silently dead, OR (2) CF caches one visitor's 307 and
> replays it for every country.
> — `next.config.js`, 2026-07-08

`src/middleware.ts:132` confirms `matcher: ["/", "/pricing"]`. **I measured cacheability on
`/pricing` — one of exactly two deliberately-excluded paths — and generalised to the site.**

### The methodological lesson

Three findings changed under re-verification. Every one came from a **single-shot probe through
a non-production path**. Rules adopted for this document:

1. Never call `tool.handle()` directly — always `schema.safeParse()` first.
2. Never characterise an intermittent fault from one run. Cache-bust and repeat ≥10×.
3. Never conclude "missing" from a guessed URL — find the writer in the source first.
4. Always `curl -L`. This site geo-redirects; a bare request measures the redirect.

---

## 1. What is genuinely still broken

Re-measured live 2026-08-10, after all 8 GEO PRs merged.

| ID | Finding | Sev | Repo |
|---|---|---|---|
| **A** | `<main>` extracts to **0 chars** on all 5 key pages (body: 10,940–30,334) | **P0** | web |
| **B** | Cloudflare returns `CF-Cache-Status: DYNAMIC` even where headers say `public, max-age=86400` | P1 | ops |
| **C** | `/blog` sends `private, no-store` — and is *not* in the middleware matcher | P1 | web |
| **D** | Bing Webmaster unverified; `layout.tsx` has `"PASTE_BING_CODE_HERE"` commented out | P1 | web+ops |
| **E** | `llms-full.txt` 10,206 B < `llms.txt` 14,737 B. Generator merged but never wired | P2 | web |
| **F** | `/in/pricing` sends `s-maxage=31536000` (1 year), no `CDN-Cache-Control` | P2 | web |
| **G** | `geo-audit.sh` has 2 false positives (C3 samples `/pricing`; C5 checks `/indexnow.txt`) | P1 | mcp |
| **H** | **No citation baseline exists** — we cannot answer "which keywords do we rank for in AI search" | P1 | ops |
| **I** | `HEAD /` on the MCP server returns **404** (GET returns 200) | P2 | mcp |
| **J** | MCP origin 404s: `/health`, `/robots.txt`, `/favicon.ico`, `/.well-known/mcp.json` | P3 | mcp |
| **K** | **Three** GA4 properties: `G-TRJT49XKH5` (MCP), `G-ZLRF73DCXS` + `G-4QS17WFH8R` (site) | P2 | web+mcp |
| **L** | Public MCP endpoint has no documented rate limiting / abuse controls | P1 | mcp |
| **V** | **`.well-known/mcp.json` advertises 14 CRM tools. The live server serves 0 of them.** | **P0** | mcp+web |

### V — the manifest promises a product that is not there

Found by R4 (framed as a branding issue), verified 2026-08-10 as a **functional** one.

`https://hellogrowthcrm.com/.well-known/mcp.json` — our documented discovery path — advertises:

```
create_contact · create_task · get_analytics · get_call_recording · get_lead_score
get_meeting_notes · get_pipeline · get_sequence_status · get_whatsapp_thread
log_activity · search_contacts · send_whatsapp · trigger_sequence · update_deal
```

…and points at `https://mcp.hellogrowthcrm.com/mcp`, with `auth: bearer` and *"Generate your
API key at app.hellogrowthcrm.com → Settings → API Keys"*.

**That endpoint serves 88 tools. Zero of the 14 are among them.** It identifies itself as:

```json
"serverInfo": { "name": "hellogrowthcrm-bot-crawler",
  "description": "Bot detection & governance MCP server for hellogrowthcrm.com" }
```

So any AI client following our own published discovery path connects successfully, asks for
the advertised CRM tools, and finds **none of them**. This is worse than a missing feature —
we are publishing a machine-readable promise that the server cannot keep. It will be read by
exactly the automated clients we are trying to attract.

Four of the fourteen (`send_whatsapp`, `get_whatsapp_thread`, `get_call_recording`,
`get_sequence_status`) exist in the repo under `crm-mcp-tools/` but are **not registered in
`src/tools/index.ts`**, so they are never served.

**Two honest options — pick one, do not leave it as-is:**

1. **Correct the manifest** to describe what actually runs (website-mirror + bot governance),
   and move the CRM tool list to a `"planned"` block or remove it. ~1 hour. **Do this now
   regardless**, because the current state is a false statement to machines.
2. **Build the CRM MCP** the manifest describes — which is R1's authenticated-CRM-MCP
   recommendation and R4's *"separate the CRM MCP identity from the bot-governance project"*.
   That is a product decision, not a bug fix.

**Do (1) this week. Decide (2) separately.**

**Fixed since Rev 1 — no action:** deploy drift (prod `wordCount` 2916 = local 2916), all 9
sitemaps passing, `.env.example`, registry manifests, GA4 `debug_mode` + `GA4_VALIDATE`.

### A — the detail that matters

Measured as GPTBot, 2026-08-10:

| Page | `<main>` | `<body>` |
|---|---|---|
| `/` (→ `/in`) | **0** | 16,106 |
| `/pricing` (→ `/in/pricing`) | **0** | 16,914 |
| `/compare/hubspot` | **0** | 30,334 |
| `/features/whatsapp-crm` | **0** | 15,699 |
| `/blog` | **0** | 10,940 |

Next.js PPR streams content into `<div hidden id="S:n">` outside `<main>`. Fix order:
(1) render primary content outside Suspense, (2) force SSR on marketing routes,
(3) *last resort* non-streamed HTML for AI-bot UAs — cloaking risk, needs SEO sign-off.

**Accept:** `<main>` ≥ 2,000 chars on all 5 pages as GPTBot; `check_ai_extractability`
returns `mainEmptyCount: 0`.

---

## 2. MCP server — coverage vs the website

`sitemap.xml` = 1,822 URLs. MCP `main` = 88 tools.

| Site section | URLs | MCP coverage | Verdict |
|---|---|---|---|
| integrations | 270 | 630 entries | covered |
| features | 232 | 58 | **gap** |
| compare | 127 | 16 | **gap** |
| templates | 62 | 42 | gap |
| product | 61 | 24 | **gap** |
| glossary | 59 | 58 | covered |
| feature-guide | 34 | 32 | covered |
| agentic-ai | 18 | 12 | gap |
| use-cases | 18 | 5 | **gap** |
| downloads | 13 | — | **no tool** |
| legal | 14 | — | **no tool** |
| resources / why-hellogrowthcrm | 9 | — | **no tool** |
| locales (in, sg, au, uk, usa, uae, ca, nz, my, ph, ng, hi, id) | 13+ | `countries_list` = 8 | **gap** |

**But all three reviewers say closing these gaps is the wrong goal.** See §3.

---

## 3. Reviewer findings

### R1 — GPT-5.6-sol

- **No causal path to the goal.** *"Availability is not discovery, and discovery is not
  invocation."* Until a user deliberately connects the server, its content does not exist from
  an assistant's perspective.
- **It exposes the wrong product** — brochure content as callable tools. Dozens of overlapping
  marketing tools make **tool selection harder**. Static content belongs behind one search tool
  plus MCP *resources*, not one tool family per website section.
- Proposed shape: `search_product_knowledge(query, market, vertical, content_type)`,
  `get_product_fact(id)`, `check_integration(name, market)`, `assess_fit(requirements)`,
  `get_policy(topic)`.
- **"Mirror 100% of the website" is a trap.** URL parity is the wrong metric; the site contains
  locale variants and programmatic pages whose only purpose is search acquisition.
- Most 404s are noise. `/health` matters less than an external **protocol-level synthetic check**
  (`initialize` → `tools/list` → a real `tools/call`).
- Landing-page work is **cosmetic** for ranking. *"Fix it, but do not pretend it is growth work."*
- **The big miss:** build an **authenticated, tenant-scoped CRM MCP** — search leads, summarise
  conversations, update pipeline, draft WhatsApp replies. That is a retention/integration
  feature with real commercial value. Keep it **separate** from the public knowledge server.
- GA/Ahrefs on a developer endpoint measure browser visits, not MCP usage → **false confidence**.

### R2 — GPT-5.3-codex (briefed with R1)

**Where R1 is wrong:**
- *"Landing page is cosmetic"* is too dismissive — for **adoption** it is not. No install
  command, no tool list, no auth model ⇒ near-zero intentional integrations.
- *"Collapse to 5 tools"* can backfire: not all MCP clients handle resources well, and one giant
  search tool becomes a junk drawer with less deterministic model behaviour.
- *"Separate public and authenticated servers"* may be too heavy for one dev; logical separation
  (paths + auth boundary + isolated registries) is enough initially.

**What both missed — the biggest blind spot:**
> **Abuse and cost exposure on a public unauthenticated MCP endpoint.** Bot traffic hammering
> `/mcp`; competitors scraping structured product knowledge at scale; **cost-amplification**
> attacks if tools trigger upstream fetches; and fake traffic making you think "AI adoption is
> growing" when it is junk.

**Migration sequence if collapsing tools** (do **not** big-bang):
1. Add v2 tools, keep all old tools alive
2. Make old tools wrapper aliases to the new backend, same output shape
3. Deprecation warnings in metadata for 60–90 days
4. Instrument per-tool usage; identify what is actually used
5. Remove only zero-usage tools

**Authenticated CRM MCP — concrete failure modes:** missing `tenant_id` on one query = cross-account
leak · RBAC bypass via a broader MCP token · prompt-injection-driven sends (*"send this to all
contacts"*) · no explicit send confirmation → WhatsApp number quality collapse · idempotency
failure duplicating sends · unvalidated webhook signatures · opt-in/opt-out mismatch · DPDPA
lawful-basis evidence gap · erasure requests not reaching logs/vector stores/backups ·
cross-border PII to LLM providers · PII in logs/prompts · no breach playbook.
**If these can't be solved, keep the CRM MCP read-only.**

### R3 — Gemini (browser, logged in)

Gemini **disagrees with R1/R2 on review sites** and offers a different mechanism. ⚠️ **Treat with
caution: a model describing its own retrieval is an unreliable narrator.** The *tactics* are
cheap and testable; the *mechanism claims* are unfalsifiable.

- Claims Gemini leans on **Knowledge Graph entity consensus** + Search Grounding, **not** G2/
  Capterra review volume.
- **First-party Google corroboration nodes:** Google Play Store / Chrome Web Store listings as
  "first-party factual truth"; **Google Business Profile** with a Software Company category for
  geographic entity confidence.
- **YouTube transcript indexing** — claims disproportionate weight for niche Indian queries.
  Suggests 15 workflow videos with verbatim transcripts, e.g. *"How Indian Travel Agents
  Automate Package Quotes on WhatsApp for ₹899/mo"*.
- **Indian entity registries:** SoftwareSuggest, **SaaSBoomi**, **Tracxn**, **Inc42 Directory**.
- **Government/corporate graph signals:** DPIIT / Startup India registration, MCA filing
  signals, **GSTIN in the footer** as proof of a legitimate Indian operating entity.
- Schema: `SoftwareApplication` + `Offer` with `price: "899"`, `priceCurrency: "INR"`, plus
  40–60 word extractable answer blocks under clear `##` headings.

**Where the three reviewers disagree — record, do not resolve:** R1/R2 say independent reviews
decide recommendations; R3 says entity consensus does. **§7 (H) settles it with data.**
GSTIN/DPIIT/GBP/Play Store are cheap and low-risk regardless of who is right.

---

### R4 — ChatGPT (user-supplied)

Longest and most operational of the four. **One claim in it is the most valuable thing any
reviewer produced — see §4.** Verified items:

| Claim | Verified? |
|---|---|
| GSC now has Search Generative AI performance reports | ✅ **TRUE** — launched 2026-06-03, see §4 |
| `OAI-SearchBot` is separate from `GPTBot`; must be allowed for ChatGPT Search | ✅ TRUE, and **already done** — see below |
| HTTP+SSE transport is deprecated in the current MCP spec | ✅ TRUE — **and we still serve `/sse`**, declared in `.well-known/mcp.json` |
| Google says `llms.txt` / special AI markup are **not needed** for Google Search | ✅ Consistent with R1/R2 scepticism. We invested in `llms.txt` anyway |
| Entity inconsistency: homepage says Meru Technosoft, About/FAQ say Soor LLC | ⚠️ **Plausible and worth fixing** — `llms.txt` states both correctly ("built by Soor LLC (Delaware), Indian operating entity Meru Technosoft Pvt. Ltd."), so the *relationship* exists but may not be stated identically everywhere |
| "I couldn't pull Ahrefs — 0 API units" | ✅ Matches our own finding (F14) |

**Already incorporated — no action:** our `robots.txt` has a single explicit allow group
covering `GPTBot`, `ChatGPT-User`, **`OAI-SearchBot`**, `ClaudeBot`, `anthropic-ai`,
`Claude-Web`, `Claude-SearchBot`, `Google-Extended`, `Googlebot-AI`, `Gemini-Deep-Research`,
`Google-NotebookLM`. This is more thorough than R4's suggested policy.

**New and worth adopting:**
- **Two MCPs, not one** — public product MCP + a *private Search Intelligence MCP* for
  marketing (GSC + Bing + Ahrefs + AI-visibility monitoring in one agent surface). The second
  is genuinely novel and nobody else proposed it.
- **Resources + Prompts, not just Tools.** We expose 88 Tools and **zero Resources**. R1 said
  the same from the opposite direction ("static content belongs behind resources").
- **One internal source of truth** → website + API + MCP + schema all render from it, so
  product facts cannot drift. We currently maintain the mirror separately from the site.
- **Entity consistency before more pages** — same company relationship, founders, pricing and
  description on site, schema, G2, Capterra, LinkedIn, Crunchbase.
- **Deprecate `/sse`.** We advertise a deprecated transport in our own manifest.
- **"Say choose the competitor instead if X"** in comparison pages — counter-intuitively
  raises credibility, and is the kind of bounded, verifiable claim retrieval systems favour.

**Where R4 overlaps and confirms:** small number of excellent tools not 100 poorly-described
ones (R1, R2); authority + third-party citations dominate (R1, R2, and §7); original research
as the moat; scaled near-identical pages are a risk (this is our U4 question about the 513
industry pages).

---

## 4. "Which keywords do we rank for in AI search?"

### ⚠️ Correction: a free measurement layer exists that we assumed did not

**Google Search Console launched Search Generative AI performance reports on 2026-06-03.**
This was flagged by R4 and independently verified.

- Covers **AI Overviews and AI Mode** impressions, plus generative AI features in Discover
- Broken down by **page, country, device and date** (hourly → monthly)
- Data begins **2026-05-18**; no earlier history
- **Impressions only** — no clicks, CTR, or query data yet
- Rolling out to a **subset of sites** — we must check whether ours is included
- Also adds a toggle to block content from AI Overviews / AI Mode / Discover AI

**This partially closes finding H at zero cost**, and it is the single highest-value action in
this document relative to effort. It does **not** give you keywords — there is no query data —
so the prompt-sweep below is still required for the "which questions" half.

Also actionable and free: ChatGPT referrals carry **`utm_source=chatgpt.com`**, so existing
GA4 can already segment ChatGPT-referred traffic. Nobody has checked whether it is non-zero.

### What we still genuinely do not know

- Both Ahrefs Brand Radar reports (`019e53a4-…` proj 9658939, `019e5367-…` proj 9658945) have
  **zero custom prompts** — only Ahrefs' generic set is tracked.
- Ahrefs API units = 0; Brand Radar SOV/mentions return `Missing addon`.
- `docs/paid-ads/BING_KEYWORD_RESEARCH_INDIA_2026-08-06.md` (10,975 keywords) is **paid-search
  research — the wrong unit.** AI search is won on prompt-shaped questions
  (*"best CRM for travel agents in India under ₹1000 per user"*), not head terms with volume.

- Both Ahrefs Brand Radar reports (`019e53a4-…` proj 9658939, `019e5367-…` proj 9658945) have
  **zero custom prompts** — only Ahrefs' generic set is tracked.
- Ahrefs API units = 0; Brand Radar SOV/mentions return `Missing addon` on this plan.
- The existing `docs/paid-ads/BING_KEYWORD_RESEARCH_INDIA_2026-08-06.md` (10,975 keywords) is
  **paid-search research — the wrong unit.** AI search is won on prompt-shaped questions
  (*"best CRM for travel agents in India under ₹1000 per user"*), not head terms with volume.

---

## 5. Work items

| ID | Task | Repo | Effort |
|---|---|---|---|
| **A** | Render real content inside `<main>` on marketing routes | web | 1–2 d |
| **B** | Cloudflare Cache Rule so HTML is eligible; leave `/`+`/pricing` on `no-store` | ops | ½ d |
| **C** | Justify or remove `private, no-store` on `/blog` | web | 1 h |
| **D** | Paste Bing code into `layout.tsx` ~L88, deploy, verify, then URL-Inspect | web+ops | 20 m + human |
| **E** | Resolve the **five** llms.txt sources, then wire `generate_llms_txt` | web | ½ d |
| **F** | Fix `/in/pricing` 1-year `s-maxage` | web | 30 m |
| **G** | Fix my 2 false positives in `geo-audit.sh` | mcp | 1 h |
| **H** | Citation baseline: 50–100 prompts × 4 engines × 2 markets | ops | 1 d |
| **I** | `HEAD /` → 200 | mcp | 15 m |
| **J** | Add `/healthz`, `/robots.txt`, `/favicon.ico`; real landing page | mcp | ½ d |
| **K** | Consolidate/document the 3 GA4 properties | web+mcp | 2 h |
| **L** | **Rate limiting + abuse monitoring on public `/mcp`** | mcp | ½ d |
| **M** | Protocol synthetic monitor (`initialize`→`tools/list`→`tools/call`) | mcp | ½ d |
| **N** | Cheap entity signals: GSTIN in footer, GBP, DPIIT, Tracxn, SaaSBoomi, Inc42 | ops | 1 d |
| **O** | *Optional pilot:* read-only authenticated CRM MCP, 1 design partner | mcp | 2 w |
| **P** | **Check GSC for the Search Generative AI report** — free AI Overviews/AI Mode impressions | ops | **30 m** |
| **Q** | Segment GA4 on `utm_source=chatgpt.com` — is ChatGPT referral traffic non-zero? | ops | 30 m |
| **R** | Entity consistency pass: Meru Technosoft ↔ Soor LLC stated identically everywhere | web+ops | 1 d |
| **S** | Expose MCP **Resources** (currently 88 Tools, **zero Resources**) | mcp | 1 d |
| **T** | Deprecate `/sse`; stop advertising it in `.well-known/mcp.json` | mcp+web | 2 h |
| **U** | *Bigger bet:* private Search Intelligence MCP (GSC + Bing + Ahrefs + AI monitoring) | mcp | 2 w |

**E note — found while planning:** there are **five** llms.txt sources on `origin/master`
(`public/llms.txt`, `public/llms-full.txt`, `src/content/llms-full.txt`,
`src/app/llms-full.txt/route.ts`, `src/app/api/llms.txt/route.ts`,
`src/app/.well-known/llms.txt/route.ts`). Determine which actually serves, delete/redirect the
rest, **then** wire generation. Shipping into a five-way ambiguity produces a file nobody can
trace.

---

## 6. Sequence — R2's 30-day answer, adopted

R2 was asked: one dev, near-zero budget, only 3 things in 30 days.

```
0.  P + Q      30 minutes each, do them TODAY. Check whether GSC has the
               Search Generative AI report for us, and whether GA4 shows any
               utm_source=chatgpt.com traffic. Both are free and may change
               what the rest of this plan should prioritise.
1.  A          fix <main> on the top ~20 commercial pages.
               "If you skip this, MCP work does nothing for the goal."
2.  I+J+L+M    harden the public MCP to "not embarrassing" — HEAD, /healthz,
               robots, rate limiting, synthetic monitor, real landing page.
3.  O (pilot)  read-only authenticated CRM MCP, 1 design partner, NO writes.
```

**P and Q are inserted ahead of R2's list.** They did not exist when R2 answered, they cost an
hour combined, and measuring before building is the whole lesson of §0.

Then, in parallel and with no engineering dependency: **D** (Bing, human-blocked), **H**
(baseline — you cannot tell whether any of this worked without it), and **N** (entity signals,
cheap, useful whichever reviewer is right).

Deferred: B, C, E, F, G, K.

---

## 7. What none of this fixes

All three reviewers, in different words:

> Machine readability only makes claims **retrievable**. Recommendations are decided by
> independent corroboration and by whichever domains each engine already trusts.

Nothing in §5 produces a single independent review or a single named customer story. That work
— G2, Capterra/GetApp/Software Advice, Techjockey/SoftwareSuggest/SaaSworthy, genuine Reddit
discussion, TAAI/TAFI/IATO case studies — has the longest lead time and the highest ceiling,
and **no engineering dependency**. It should start now, not after Week 3.

⚠️ Founder-seeded *"has anyone tried X?"* posts are transparent spam and damage the brand.
Fabricated reviews are worse. Real customers are the only version of this that works.

---

## 8. Merge discipline

**This document merges LAST, after §5 is executed.** A merged plan doc reads as a completion
claim. Rev 1 merged on 2026-08-05 with its entire `[web]` half unexecuted — the exact failure
mode this note exists to prevent.

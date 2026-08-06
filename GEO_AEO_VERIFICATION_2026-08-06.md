# GEO / AEO Master Plan — Re-verification

**Date:** 2026-08-06 (one day after the plan's measurements)
**Scope:** Every finding in §2 of `GEO / AEO Master Plan — AI-Search Visibility`, re-measured live where this environment allowed it.
**Verdict summary:** No finding was overturned. Five were re-confirmed live, one is worse than recorded, one resolved into a security issue, and seven could not be re-measured here for a reason worth writing down (§0).

---

## 0. What this session could and could not measure

This matters more than any single verdict, because it determines which numbers in the plan are still assumptions.

`hellogrowthcrm.com` is **not reachable over raw HTTP from this session**. Three independent paths were tried:

| Path | Result |
|---|---|
| Cloud container `curl` | egress proxy returns `403 Forbidden` on `CONNECT hellogrowthcrm.com:443` |
| Local device shell | no network at all (`curl` exits 56 in 5 ms) |
| Browser automation | Claude-in-Chrome extension not connected |

What remained usable: the hosted **HelloGrowthCRM MCP server** (runs server-side, reaches the site), the **WebFetch** tool (fetches, but returns model-summarised markdown — no headers, no status codes, no byte counts, no custom User-Agent), the **Ahrefs API**, the **npm registry**, and the **local git repo**.

**Consequence:** every finding that depends on response headers, byte sizes, wall-clock timing, or User-Agent variation — **F3, F5, F6, F7, F8, F15, and F1's exact numbers** — could not be re-measured. §8's `curl` recipes still need to run from a machine with ordinary network access. Nothing below silently fills those gaps with an estimate.

> **Superseded later the same day — see §7.** A networked machine became available and every finding in this gap list has now been measured directly. Two of them (F8, F15) did not survive it, and one number reported in §2 (F9's byte counts, taken from a summarising fetcher) turned out to be wrong. Read §7 before quoting anything from §2.

---

## 1. Findings re-confirmed live

### F10 — the 2026-07-13 extraction fix is still not deployed ✅ CONFIRMED

Tested live today against `mcp.hellogrowthcrm.com` via `fetch_page_content`, all five key pages:

| Page | HTTP | title/meta/canonical | `wordCount` | `headings` | `text` |
|---|---|---|---|---|---|
| `/` | 200 | parsed fine | **0** | `[]` | `""` |
| `/pricing` | 200 | parsed fine | **0** | `[]` | `""` |
| `/compare/hubspot` | 200 | parsed fine | **0** | `[]` | `""` |
| `/features/whatsapp-crm` | 200 | parsed fine | **0** | `[]` | `""` |
| `/blog` | 200 | parsed fine | **0** | `[]` | `""` |

Source side, in the connected repo: `src/tools/fetch-page-content.ts:45` has `const MIN_REGION_TEXT_CHARS = 200;` and line 87 applies it. The fix is on `main`; production is running an older build. **24 days after the fix was written, every AI client calling this MCP server still gets an empty page.**

### F4 — `<main>` still extracts to zero ✅ CONFIRMED (indirectly, but tightly)

The deployed extractor unconditionally prefers `<main>` (that is precisely what F10's fix changes). It returns 0 characters on all five pages *while successfully parsing `<title>`, `<meta name="description">`, `<link rel="canonical">` and `<meta name="robots">` from the same document*. The HTML parses; `<main>` is empty. That is F4.

**Caveat, stated plainly:** F4 and F10 produce the same single observable here. Separating them needs raw HTML, which §0 explains this session cannot get. The inference is strong but it is an inference.

### F2 — no IndexNow ✅ CONFIRMED

`https://hellogrowthcrm.com/indexnow.txt` → **404** today. No key file, no submission pipeline.

### F13 — Brand Radar tracks zero custom prompts ✅ CONFIRMED

Both report IDs in the plan are exact matches, and both return `{ "prompts": [] }`:

| Report ID | Project | Custom prompts | Models polled |
|---|---|---|---|
| `019e53a4-b87a-704d-81b7-b35bd1b4be86` | 9658939 | **0** | chatgpt, copilot, gemini, perplexity, google_ai_overviews, google_ai_mode — all daily |
| `019e5367-922d-7250-adf8-24930220f414` | 9658945 | **0** | chatgpt only; everything else `off` |

Worth noting what this means in practice: report 1 is burning a daily poll across six engines to answer questions nobody chose. The instrument is running; it is aimed at nothing.

### F11 — repo and package hygiene ✅ CONFIRMED (with one item resolved into something worse — see §3)

| Item | Status today |
|---|---|
| `registry.npmjs.org/mcp-bot-crawler` | **404** — still never published |
| GitHub topics | **none** |
| GitHub homepage | **none** |
| `server.json` | **was missing** — created today |
| `smithery.yaml` | **was missing** — created today |
| `package.json` `homepage` / `repository` / `bugs` | **were missing** — added today |
| `.env.example` | present locally but **gitignored and untracked** → a fresh clone still has none, so `cp .env.example .env` from the README still fails. See §3. |

### F12 — MCP telemetry is coded but unverifiable ✅ CONFIRMED

`src/lib/telemetry.ts:35` gates on `ENABLE_MCP_ANALYTICS` being exactly `"true"`, default off. A grep for `debug_mode` / `debugMode` across `src/` returned **zero matches** — DebugView could never have shown anything. Fixed in code today (§4).

---

## 2. Findings that changed

### F14 — Ahrefs is not at zero, it is over ⚠️ WORSE THAN RECORDED

The plan says "API units = 0 remaining." Live today:

```
subscription:              Lite, billed monthly
units_limit_workspace:     100,000
units_usage_workspace:     102,529     <- 2,529 over the cap
usage_reset_date:          2026-08-26
```

**Implication for the plan:** W4.3 says "add ~50 vertical custom prompts to Brand Radar (or run them manually)". The parenthetical is now the only option. Nothing quota-consuming can run for **20 more days**. The manual 50–100 prompt benchmark (U2) is not a fallback — it is the entire measurement plan until 2026-08-26.

### F9 — direction holds, magnitudes are unrecognisable ⚠️ CHANGED

| | Plan (2026-08-05) | Today |
|---|---|---|
| `llms.txt` | 14.7 KB | ~109,800 chars |
| `llms-full.txt` | 10.2 KB | ~31,500 chars |

The **incoherence reproduces** — the "full corpus" is roughly a third the size of its own index — and `llms-full.txt` describes itself as "summaries and indexed links rather than full page reproductions," which is the defect, not a rendering artefact. But the absolute numbers are ~7× and ~3× the plan's. Treat both sets as unreliable: today's counts come from a summarising model, not `wc -c`. **Re-measure with `curl … | wc -c` before quoting either figure.** W4.2 stands regardless.

### F1 — intermittency reproduces; nothing quantitative does ⚠️ PARTIAL

Six URLs were fetched in one batch, then three more in a second batch:

| URL | Batch 1 | Batch 2 |
|---|---|---|
| `alternatives-sitemap.xml?cb=1` | **read timeout** | — |
| `alternatives-sitemap.xml?cb=2` | — | returned content |
| `alternatives-sitemap.xml?cb=3` | — | returned content |
| `image-sitemap.xml?cb=1` | **read timeout** | — |
| `tools-sitemap.xml?cb=1` | **read timeout** | — |
| `llms.txt`, `llms-full.txt`, `robots.txt` | all returned promptly | — |

Three signals worth having: the failures landed on **exactly the three sitemaps F1 names** and nothing else; three plain-text files on the same host in the same batch returned fine, so this is not general host slowness; and the same URL failed then succeeded, which is the intermittency F1's correction describes.

No status codes, no timings — the fetcher does not expose them, and it renders XML as `[binary data]` so entry counts are unavailable too. **The 500s, the connection reset and the 7–10 s figures are not re-verified.**

This is the finding whose guard note matters most: *"a single green run does not clear an intermittent fault — that is exactly how the original measurement went wrong in both directions."* Nine data points from one tool is not a measurement either.

---

## 3. New findings (not in the plan)

### N1 — `.env.example` contained live production secrets 🔴 FIXED TODAY

The local `.env.example` held a **real Supabase `service_role` key** (full database access, `exp` 2036) and a **real Resend API key**. Not placeholders — the same values as `.env`.

**It was never exposed.** `.gitignore` listed `.env.example`, `git ls-files` confirms it untracked, and `git show HEAD:.env.example` finds no such blob. The public GitHub repo is clean. But the margin was one `git add -f`, or one paste into an issue, away from a full-access database key going public.

This also explains F11 more precisely than the plan does. The plan says "no `.env.example` — yet README instructs `cp .env.example .env`". The file exists; it is *ignored*, so a fresh clone genuinely has none. **The README is broken for exactly the reason stated, via a different mechanism — and the mechanism was hiding a credential.**

Fixed: `.env.example` rewritten with placeholders only (verified: zero occurrences of either key), removed from `.gitignore` so it actually ships, and extended to cover the `TRANSPORT`/`PORT`/rate-limit and GA4 variables it was missing. `.env` was not touched; every key name in the old file was confirmed present in `.env` first, so nothing was lost.

### N2 — the working tree is a whole-repo line-ending flip 🟠 UNRESOLVED

```
44 files changed, 10747 insertions(+), 10747 deletions(-)
```

Insertions exactly equal deletions across 44 files — CRLF/LF normalisation, not content. Any commit made from this machine buries the real change in a 10,000-line diff and rewrites `git blame` for the whole repo.

**Left deliberately untouched** — normalising is correct but it is its own commit. Recommended: add `.gitattributes` with `* text=auto eol=lf`, run `git add --renormalize .`, commit alone with a message saying so, *then* commit the changes from §4.

### N3 — `validate_sitemaps` does not exist on `main` 🟠 BLOCKS W1.1

§8 says "once PR #5 lands, the same check as one tool call: `validate_sitemaps {...}`", and W1.1's acceptance criterion is "run `validate_sitemaps` on ten consecutive cache-busted runs." No such file is in `src/tools/` locally, and it is not in the deployed tool list. **W1.1 has an acceptance criterion that cannot currently be executed.** Land PR #5 before starting W1.1, or W1.1 has no way to prove it is done.

### N4 — the site's own schema mirror contradicts F8 🟡 WORTH A LOOK

`seo_get_schema` (synced 2026-06-04) documents `Organization` as *"site-wide (global layout, **do not duplicate per page**)"* and `FAQPage` as *"permanently retired 2026-05-07; never emit"*. F8 measured **63 × Organization** on the homepage.

So the implementation has drifted from its own documented contract, or the mirror is stale. Either way W4.1 ("deduplicate to one Organization") is not a new decision — it is restoring a rule the codebase already claims to follow. That should make it an easier sell and a smaller change than the plan implies.

---

## 4. What was implemented today (all in `HelloGrowthCRMwebsite_MCP`)

Everything below is written to the working tree, uncommitted, typechecked and tested.

| File | Change | Plan item |
|---|---|---|
| `.env.example` | Rewritten placeholders-only; added `TRANSPORT`, `PORT`, rate-limit and all GA4 variables | N1, W3.2 |
| `.gitignore` | `.env.example` un-ignored (so it ships); `.env` still ignored — verified; added the stray `vitest.config.ts.timestamp-*.mjs` files | N1 |
| `server.json` | New — official MCP Registry manifest: `io.github.merulocal/hellogrowthcrm-bot-crawler`, npm package, stdio transport, documented env vars, `streamable-http` remote | W3.4 |
| `smithery.yaml` | New — Smithery `startCommand` config with a typed `configSchema` and `exampleConfig` | W3.4 |
| `package.json` | Added `homepage`, `repository`, `bugs`, `author`, `publishConfig.access: public`, and `mcpName` (registry npm-ownership proof) | W3.2 |
| `src/lib/telemetry.ts` | Added `GA4_DEBUG_MODE` (tags `debug_mode: 1`, event still recorded → DebugView works) and `GA4_VALIDATE` (posts to `/debug/mp/collect`, logs `validationMessages`, records nothing) | W3.3 |
| `src/lib/__tests__/telemetry.test.ts` | +4 cases: no `debug_mode` by default; `debug_mode: 1` on the **normal** endpoint when enabled; validation endpoint when `GA4_VALIDATE=true`; `GA4_VALIDATE` beats a custom `GA4_ENDPOINT` | W3.3 |
| `docs/MCP_ANALYTICS.md` | Config table extended with both switches, plus a note on why they are two flags | W3.3 |
| `docs/MCP_GA4_VERIFICATION.md` | Stale precondition #2 ("DebugView will never show them") struck through and corrected | W3.3 |

**Why two telemetry flags rather than one:** DebugView is populated by the `debug_mode` parameter on the *normal* collect endpoint. The `/debug/mp/collect` endpoint validates a payload and records **nothing** — it can never make an event appear in DebugView. The plan's W3.3 conflates them. One flag answers "is it arriving?", the other "is it well-formed?"

**Verification:** `tsc --noEmit` clean. `vitest run src/lib src/tools/__tests__/fetch-page-content.test.ts` → **31/31 pass** (11 in telemetry). The full suite was not run to completion here — it hangs on network-dependent tests, and this machine has no network (§0).

### Still open in W3.2, and why I did not do them

- **GitHub topics + homepage** — needs GitHub API write access, which this session does not have. Set on the repo page: Settings → About.
- **`npm publish`** — needs npm authentication, and publishing to a public registry is your call, not mine. `npm run prepublishOnly` is already wired to clean + build. Suggested first step: `npm publish --dry-run` to confirm the `files` allowlist.
- **`server.json` schema validation** — the schema URL is unreachable from here. Run `mcp-publisher validate` before submitting; treat the file as unvalidated until then.

---

## 5. What this does to the plan's ordering

The re-verification does not overturn §1's correction. It sharpens three things.

**§1 gets stronger, not weaker.** F10 confirmed for a 24th day is the cleanest possible demonstration of the reviewer's second correction: the fix has been sitting on `main`, fully tested, doing nothing, because deploying our own tool was never the same as fixing the website. If a fix this small can go a month unshipped, W3.4's directory work would have been pure motion.

**Wave 0 outranks Wave 1 harder than the plan says.** §0 is the argument: this session could not measure headers, timings, byte sizes, or bot-vs-user divergence at all. F3, F5, F6, F7, F8 and F15 are today exactly as unverified as U1–U8 are — the plan lists them under "Verified findings" and the U-list under "not measured," but as of now that line sits in the wrong place. **Before sprint-planning Wave 1 or 2, re-run §8 from a machine with network access and move whatever fails to re-confirm into §3.**

**F14 forces W4.3's hand.** No Ahrefs quota until **2026-08-26**. The manual 50–100 prompt U2 benchmark is not the cheap alternative any more; it is the only instrument you have for the next 20 days. It also has the longest lead time of anything in Wave 0. Start it first.

One thing the plan gets right that today reinforced: **§5 has no engineering dependency and can start now.** Nothing in §0's tooling gap touches it. G2, Capterra and Techjockey profiles do not care whether `<main>` is empty.

---

## 6. Recommended next actions, in order

1. **Rotate or scope-check the Supabase `service_role` key** — it was never public, so this is precautionary, not an incident. Decide deliberately rather than by default. (N1)
2. **Normalise line endings as a standalone commit** before committing anything from §4. (N2)
3. **Re-run §8 from a networked machine.** Everything in §0's gap list is currently assumption. (F1, F3, F5, F6, F7, F8, F15)
4. **Redeploy the MCP server** — W3.1, one deploy, unblocks the tool that has been returning empty pages for 24 days. (F10)
5. **Start the manual U2 prompt benchmark.** Longest lead time, no quota, no dependencies. (F14, U2)
6. **Land PR #5** so W1.1 has an executable acceptance criterion. (N3)
7. **Start §5 Tier 1 profiles** in parallel with all of the above.

---

## 7. Addendum — §0's gap list, closed from a networked machine (2026-08-06, later same day)

§0 said seven findings could not be re-measured because this environment had no raw HTTP access, and §6 item 3 made re-running §8 from a networked machine the third-highest priority. That machine was available later the same day. **All of §0's gap list is now measured.** Two findings did not survive contact.

Method: `scripts/geo-audit.sh` (PR #7) for F1/F3/F4/F5/F10/F11, plus direct `curl` for F6/F7/F8/F15 and `curl | wc -c` for F9. Byte counts here are `wc -c`, not a summarising model — which is the specific correction §2 asked for.

### 7.1 Findings that changed

**F8 — half of W4.1 is already done. ⚠️ CHANGED**

The plan records "63 × `Organization`, 61 × `VideoObject`, 1 × `WebPage`, 1 × `BreadcrumbList`. **No `SoftwareApplication`, no `Offer`**." Counting `@type` occurrences across all five JSON-LD blocks on `/` today:

| Type | Plan (2026-08-05) | Today |
|---|---|---|
| `Organization` | 63 | **64** |
| `VideoObject` | 61 | 61 |
| `SoftwareApplication` | **0** | **1** |
| `Offer` | **0** | **16** |
| `UnitPriceSpecification` | — | 16 |
| `Product` / `Review` / `Rating` | — | 1 each |
| `AggregateRating` | — | **0** |

So the *additive* half of W4.1 ("add one accurate `SoftwareApplication` with visible pricing/offer data") is **already shipped**. What remains is purely the deduplication half, and it got marginally worse: 64 `Organization` blocks, against a mirror that documents `Organization` as *"site-wide, do not duplicate per page"* (N4).

One thing to look at that the plan did not anticipate: `AggregateRating` is correctly absent, but a self-referential `Review` + `Rating` pair is present. The plan's reasoning for banning self-referential `AggregateRating` applies to a self-authored `Review` in exactly the same way. Decide it deliberately rather than by omission.

**F15 — the second GA4 property is gone from the homepage. ⚠️ CHANGED (likely resolved)**

The plan records two properties firing: `G-4QS17WFH8R` and `G-ZLRF73DCXS`. The homepage source today contains **one**: `G-ZLRF73DCXS`. W4.4 may already be closed. Caveat worth stating: this is a source-level grep of `/` only — a tag fired from GTM, or present on other routes, would not appear. Confirm in the GA4 admin before marking W4.4 done.

### 7.2 Findings re-confirmed, now with real numbers

**F1 — W1.1's acceptance criterion is MET.** ✅ Ten consecutive cache-busted runs of `validate_sitemaps` against `sitemap-index.xml`, which is exactly the bar W1.1 sets and which N3 said could not be executed:

| | Result |
|---|---|
| Clean rounds | **10 / 10** |
| Children failing | **0 / 90** child-fetches |
| Slowest child | `image-sitemap.xml` at **1,829 ms** (plan: 9.74 s warm) |
| `alternatives-sitemap.xml` | worst **580 ms**, 0 failures (plan: 500 on cache miss, 7.68 s) |
| Next slowest | `sitemap.xml` 1,556 ms; all six others ≤ 666 ms |
| URLs discovered | **6,024**, stable across all ten rounds (plan: 6,625) |

Every child returned 200 in under 2 s on all ten runs. Read this carefully, in the spirit of F1's own guard note: ten green runs is the criterion the plan set, and it is met — but the fault was always intermittent, and this measurement was taken from one network vantage point on one afternoon. **Keep `validate_sitemaps` on a schedule.** The URL count also dropped by 601 from the plan's figure; that is a separate question worth asking, not a sitemap-health signal.

**F9 — the plan's original numbers were right; §2 of this document was wrong.** ✅ `curl | wc -c`: `llms.txt` **14,737 bytes**, `llms-full.txt` **10,182 bytes** — matching the plan's 14.7 KB / 10.2 KB almost exactly. §2 above reported ~109,800 and ~31,500 chars from a summarising fetcher and warned the figures were unreliable; they were. Disregard them. The incoherence is real and unchanged: the full corpus is 69% the size of its own index. W4.2 stands, and PR #8's generator (91 KB from the mirror) is the fix.

**F7 — confirmed exactly as recorded.** ✅ `/` returns **200 to GPTBot** and **307 → `/in`** to a browser sending `Accept-Language: en-IN`. Two URL systems, split canonical identity, precisely as F7 states.

**F5 — confirmed.** ✅ `CF-Cache-Status: DYNAMIC`; `cdn-cache-control: no-store` still forbids CDN caching of already-prerendered HTML; `Set-Cookie: hgcrm_geo=IN` still on the HTML document. TTFB on `/pricing` measured **1.42 s** (plan: 1.7–1.85 s) — the same defect, marginally faster.

**F6 — confirmed, direction and magnitude both hold.** ✅ As GPTBot: `/` **786 KB** uncompressed / 120 KB gzip (plan: 853 / 105), `/pricing` **549 KB** / 70 KB (plan: 610 / 73), `/compare/hubspot` 404 KB, `/blog` 383 KB, `/features/whatsapp-crm` 309 KB. Still far above W2.3's < 300 KB target for the homepage.

**F3 — confirmed.** ✅ No `msvalidate.01` on the homepage. **F2 — confirmed.** ✅ `/indexnow.txt` → 404.

**F4 + F10 — confirmed, and now separated.** ✅ §1 flagged that F4 and F10 collapsed into one observable without raw HTML. With raw HTML they separate cleanly: all five key pages have `<main>` = **0 chars** against `<body>` of 10,896–30,352 chars (that is F4, measured directly at the source), while production `fetch_page_content` returns `wordCount: 0` and the local build returns **2,918** on the same URL (that is F10, deploy drift). Two distinct defects, both real. The inference in §1 was correct.

**F11 — confirmed.** ✅ `registry.npmjs.org/mcp-bot-crawler` → 404, still unpublished.

### 7.3 What this does to §6

Item 3 ("re-run §8 from a networked machine") is **done**. Item 6 ("land PR #5") is **done** — and it did more than unblock W1.1: the two tools had been merged without ever being added to the registry in `index.ts`, so they were unreachable to every client. Both are now registered, and `src/tools/__tests__/registry.test.ts` fails the build if any future tool ships the same way.

The revised order for what remains:

1. **Redeploy the MCP server** (was item 4, now the top). F10 is the only finding here that is fully understood, fully fixed in source, and blocked on nothing but a deploy. 25 days.
2. **Rotate or scope-check the Supabase `service_role` key** (N1) — still outstanding, still precautionary.
3. **Start the manual U2 prompt benchmark** (F14) — unchanged, longest lead time, no quota until 2026-08-26.
4. **Re-scope W4.1** — it is now a deduplication task only, plus a decision on the self-authored `Review`.
5. **Confirm W4.4 in the GA4 admin** — the homepage suggests it is already done.
6. **§5 Tier 1 profiles** — unchanged, no engineering dependency, decides the outcome.

W1.1 has passed its acceptance criterion but should not be closed on one afternoon's data; put `validate_sitemaps` on a schedule and close it after a week of green.

---

*Every claim above is either a live measurement taken 2026-08-06 or explicitly labelled as not re-measured. Where a finding rests on inference rather than direct observation — F4 in §1 — the report says so at the point of the claim; §7.2 then resolves that particular inference with direct evidence.*

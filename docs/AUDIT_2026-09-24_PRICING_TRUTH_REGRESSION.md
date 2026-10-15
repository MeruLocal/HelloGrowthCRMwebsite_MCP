# Audit 2026-09-24 — pricing truth regression, and two standing content defects

**Server audited:** the **website MCP**, `https://mcp.hellogrowthcrm.com`, reported version **v2.0.0**, 76 tools
visible anonymously (correct under v2.0.0 gating). **Not** the CRM MCP (`crm-mcp-server`, a Deno edge function in
`hellocrm`), which is audited separately in hellocrm PR #6813.

**Method:** `audit-live-mcp.mjs` for the protocol half, then the hand-checks the script cannot do. Anonymous session
only; **no admin token was used and none was requested**, so the four gated personal-data readers were never called.
Everything below is measured output.

**Owning ticket:** #40 — Phase 2, Truth pipeline. All three findings are content-mirror defects, not protocol defects.

---

## 1. Protocol: clean, no regression

```
0 fail · 4 warn · 14 pass
```

Identical to the 2026-09-02 baseline. The four standing warns are unchanged and already tracked:
`/sse` naming, `tools.listChanged` undeclared, no tool `title`, no `outputSchema`.

Passing: `/.well-known/mcp.json` served · `/openapi.json` 410 by design · `GET /sse` 400 (Streamable HTTP, as
expected) · session id issued and enforced · 76 tools, all names valid, all with substantive descriptions and object
input schemas · all four safety hints present on every tool · 76 read-only / 0 write / 0 destructive · unknown tool
produces a JSON-RPC error · **error responses do not echo caller arguments**.

## 2. 🔴 FAIL — `pricing_get_plans` is serving ₹1,099 again

Measured, `pricing_get_plans`, India block:

```json
{
  "name": "Growth",
  "slug": "growth",
  "price_annual":  "₹899/user/month (annual — 10 months paid, 2 months free = ₹8,990/user/year)",
  "price_monthly": "₹1,099/user/month"
}
```

**Canonical billing truth** (hellocrm `_shared/billingHandlers/gstPlanSync.ts`): **₹899/user/month + 18% GST on both
billing modes** → billed **₹1,060.82**; annual ₹8,990/year + GST.

- The **annual** line is correct.
- The **monthly** line is the fiction that was purged from the website in PR #1403. Its reappearance in the mirror
  means a **bad resync**, which is exactly the failure mode #40 exists to close.

**Impact.** This tool is consumed by AI assistants, which quote it verbatim. We are currently telling them a monthly
price we do not charge — roughly **3.6% above** the real GST-inclusive figure, and presented as a list price rather
than a tax-inclusive one. This is a customer-facing accuracy defect, not a cosmetic one.

**Fix:** regenerate the pricing mirror from `gstPlanSync.ts` and assert `₹1,099` can never re-enter. A unit test
pinning `price_monthly` for the India Growth plan would have caught this resync.

## 3. WARN — USD monthly still drifted

```json
"price_annual":  "$10/user/month (billed annually)",
"price_monthly": "$13/user/month"
```

Canonical is **$12** monthly (constants HG-004). The annual `$10` is correct. This is the previously recorded `$13`
drift — still present, still unfixed, and it shares a root cause with §2: nothing regenerates this mirror from the
source of truth.

## 4. WARN — the freshness stamp has not moved in 14 weeks

| Tool | Value | First flagged |
|---|---|---|
| `integrations_list` | `synced_at: 2026-06-17` | 2026-08-31 (then 11 weeks stale; now **~14**) |
| `features_list` | `total: 58` | 2026-08-31 (vs 232 screens / 135 catalogue / 99 public-catalog entries) |

Neither number has moved across three audits. There is still **no regeneration job**, so this is silent rot rather
than a one-off: the stamp will keep aging until something regenerates it, and any consumer reading `synced_at` is
being told the data is current as of a date three months past.

## 5. What was checked and found clean

Protocol conformance (all 18 script assertions, §1), tool naming and descriptions, input schemas, safety annotations,
unknown-tool error handling, and that error responses do not leak caller arguments.

## 6. What was NOT checked — stated explicitly, because silence reads as a pass

- **The four gated personal-data readers** — the audit method forbids calling them, and no admin token was held.
- **Authenticated tool surface** — the anonymous session sees 76 of 88 tools; the 12 gated tools were not exercised.
- **URL resolution across payloads** (`sameAs` and similar) — not run this pass. Note the known false positive:
  g2.com returns 403 to curl, which is its bot wall, not a dead link.
- **npm registry readiness** (`mcp-bot-crawler` publication) and `scripts/check-versions.mjs` parity.
- **`content_list_industries` and the remaining content tools** — only `pricing_get_plans`, `integrations_list` and
  `features_list` were reconciled.

## 7. Disposition

| # | Finding | Severity | Owner |
|---|---|---|---|
| 1 | `pricing_get_plans` serves ₹1,099 monthly for India | **FAIL** | #40 — fix first, it is customer-facing |
| 2 | `pricing_get_plans` serves $13 monthly USD (canonical $12) | WARN | #40 |
| 3 | `integrations_list` / `features_list` stale and unregenerated | WARN | #40 |

**One PR per fix**, per the audit method — this document is the report, not the remediation. It is raised as a
docs-only PR because the author's standing role is plan-and-report, not code changes.

**Reviewers:** none. Sol and Astra were unreachable (Azure OpenAI 401) throughout the session that produced this.
The measurements are reproducible from the commands in the audit skill; the judgements are unreviewed.

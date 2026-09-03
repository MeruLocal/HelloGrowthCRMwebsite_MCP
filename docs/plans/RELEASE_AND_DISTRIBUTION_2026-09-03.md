# Release & distribution — dev work order

| | |
|---|---|
| **Status** | NOT STARTED. Work order, no code. |
| **Date** | 2026-09-03 · against `main` @ current |
| **Why now** | Four client-fitness gaps were found by probing the live server. Three are fixed in PRs #32–#35. The fourth cannot be fixed by a PR, and three related gaps were found alongside it. |

---

## 1. Publish `mcp-bot-crawler@2.0.0` to npm — BLOCKING everything downstream

### The actual defect

This is not "we should get around to publishing". It is a live inconsistency:

```
server.json  packages[0]  ->  mcp-bot-crawler @ 2.0.0
registry.npmjs.org/mcp-bot-crawler  ->  404
```

`server.json` is the **published MCP registry manifest**. It tells any registry that finds
this server to install `mcp-bot-crawler@2.0.0`. That package does not exist. So every
install that originates from the registry entry fails — and the failure lands on the user,
who concludes the server is broken, not on us.

`RELEASING.md:47` already warns about exactly this ordering ("`server.json` points at an npm
package; publishing the manifest first…"). The manifest is out; the package is not.

### The repo is already ready — verified 2026-09-03

Nothing needs writing. Every prerequisite is in place:

| | |
|---|---|
| `name` | `mcp-bot-crawler` |
| `version` | `2.0.0` (agrees across package.json / server-info.ts / server.json ×2 — `check-versions` passes) |
| `private` | `false` |
| `files` | `["dist","README.md","LICENSE"]` |
| `bin` | `mcp-bot-crawler` → `dist/index.js` |
| `main` / `type` | `dist/index.js` / `module` |
| `prepublishOnly` | `npm run clean && npm run check:versions && npm run build` |
| `license` / `repository` | MIT / correct GitHub URL |

The name is **unclaimed** (the 404 means available, not taken) — which is also a small
standing risk: an unclaimed name matching a public server is squattable.

### Do this

```bash
npm login                 # needs credentials this repo does not and should not hold
npm publish               # prepublishOnly re-runs clean + check-versions + build
```

Then verify, per `RELEASING.md` §"What to check after publishing":

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://registry.npmjs.org/mcp-bot-crawler   # expect 200
npx -y mcp-bot-crawler --help                                                          # expect it to run
npm run audit:live                                                                     # the npm fitness WARN should clear
```

### What it unblocks

Smithery, Glama, PulseMCP and mcp-get key their auto-indexing off a published package.
`MCP_SERVER_SUBMISSION_REPORT.md` in this repo already lists 26 DR-ranked submission targets
and identifies npm publish as the prerequisite. **One command gates that entire list.**

⚠️ Do not bump the version to publish. 2.0.0 is what the manifest advertises; publishing
anything else re-creates the same mismatch one version along.

---

## 2. Nothing deploys or publishes on merge — and it bit us today

`.github/workflows/` does not exist. There is no CI, no CD, no publish automation.

**This is not theoretical.** On 2026-09-02, five PRs were merged to `main` — including
#22 (retiring an `/openapi.json` that told callers to POST a live CRM API key to a public
host) and #29 (stopping anonymous access to 8 write and 4 personal-data tools). Hours later
production still served the old behaviour: `/openapi.json` returned 200 with the original
document, and all 12 tools were still anonymously callable. A manual redeploy fixed it.

Between merge and that redeploy, **a merged security fix was decorative** and the repo said
otherwise. `AI_CRAWL_FIX_2026-07-13.md:23` records the same lesson from July.

### Options, cheapest first

1. **A `deploy` line in `RELEASING.md` and a post-merge checklist item.** Zero infrastructure,
   relies on discipline — which is what just failed.
2. **A scheduled `npm run audit:live` against production** that fails when `/version` reports a
   version older than `package.json` on `main`. Catches the gap within a day, does not close it.
   This is the highest value per unit of effort and it reuses tooling that already exists.
3. **Real CD** on merge to `main`. Correct, and the only option that actually closes it.

Recommend **2 now, 3 when someone owns the deploy target**. Note the host is behind Cloudflare
with `Via: Apache/2.4.58`; whoever owns that box owns this decision.

---

## 3. `tools.listChanged` is not declared

`initialize` returns `capabilities: { tools: {}, resources: {} }`.

Consequence: a connected client can never be told the tool set changed. It serves whatever it
cached at connect time until the user restarts it. The tool count moved 88 → 76 on 2026-09-02
when write tools were gated; every already-connected client kept offering the 12 that had been
withdrawn, and would have failed on call.

The manifest reports `listChanged: false`, so the server is at least *honest* — this is an
absent feature, not a lie. Declaring it means emitting `notifications/tools/list_changed`
whenever the gated set changes, which this server now does have a real trigger for
(authorized vs anonymous tool sets).

Three external audits reported this capability as **present**. It is not.

---

## 4. No tool sets `title` or `outputSchema` — 0 of 76

- **`title`** — clients show raw `snake_case` names in their UI. `pricing_get_plans` instead of
  "Pricing plans".
- **`outputSchema`** — every result comes back as text the model must re-parse. For tools that
  already return structured JSON (`pricing_get_plans`, `features_list`, `integrations_list`,
  `company_get_profile`) this is free reliability being left on the table.

Both are optional in the spec and both are recommended. The auditor already warns on them
(`audit-live-mcp.mjs`, "no tool sets `title`" / "no tool sets `outputSchema`").

Scope suggestion: do `outputSchema` for the handful of tools whose output is already a fixed
JSON shape, not all 76. `title` is cheap enough to do everywhere.

---

## 5. Order

1. **§1 npm publish** — one command, unblocks 26 submission targets, and clears a live
   manifest/package mismatch. Do this first.
2. **§2 option 2** — a scheduled production-version check, so "merged but not shipped" cannot
   go unnoticed again.
3. **§3 `listChanged`** — small, and it is the one genuine protocol gap left.
4. **§4 `title` / `outputSchema`** — quality, not correctness. Last.

§1 and §2 are independent of PRs #32–#35 and can proceed in parallel. §3 and §4 touch the tool
registry and should land after that stack merges to avoid conflicts.

# MCP Upgrade Roadmap — status and execution log, 2026-09-08

**Companion to:** `UPGRADE_ROADMAP_2026-09-02.md` (PR #37, the actionable workplan) and the
strategy record of the same date.
**This document:** what was verified true on 2026-09-08, what was changed in the working
tree today, and what is left — separated by who can do it.

Branch: `feat/truth-and-protocol-2026-09-08` (MCP repo). Changes are **uncommitted**, for review.
Website-repo changes are in the working tree of `fix/clarity-friction-2026-09-08` — see the note
under Phase 0.

---

## 1. What the audit found before any change

Verified against the live server (`GET /health`, 2026-09-08) and both working trees:

| Surface | Reported | Truth |
|---|---|---|
| `integrations_list` → `public_integration_count` | **630** | **259**. 630 is the raw catalog length; 371 rows are scaffolded directory pages that are not built |
| `integrations_list` tool description | "630 documented entries … 630+ total apps reachable" | same error, read by the model *before* it calls |
| `pricing_get_plans` / `pricing_compare_plans` | "API access & all 630+ integrations", "All 630 integrations + custom integration support" | the false count inside a **plan feature bullet**, on four plan tiers |
| `IntegrationRecord.status` doc comment | "entries without a status are planned/scaffolded" | **backwards** — absent status means LIVE (84 curated entries predate the website's `status` field) |
| every mirror's `SYNCED_AT` | not read by anything | 12 mirrors, oldest 89 days stale, `/health` green throughout |
| `features_list` | bare `total: 58` | 58 is the **plan-comparison matrix**, not the feature surface; the website publishes several hundred feature pages |
| 88 tools | no `title` | clients showed raw `pricing_get_managed_revops` to users |
| `public/llms.txt` (website) | "Australia … Growth **A$2,299/user/mo**" | live page says **A$16/user/mo** annual, A$20 monthly. A$2,299 is the Managed RevOps flat retainer — a **143×** overstatement served to AI answer engines |

The last row was not on the roadmap. It was found while writing the G4 line and is the same
defect class as the 630 problem: a flat retainer read as a seat price.

**The generalisation worth keeping:** every one of these is a number that was *typed* somewhere
instead of *derived*, on a surface nothing checked. The website already learned this
(`INTEGRATIONS_CATALOG_SUMMARY`, HG-006, 2026-08-12) and gates it with
`scripts/check-integration-count.mjs`. The mirror never inherited the lesson.

---

## 2. Shipped today (working tree, uncommitted)

### Phase 0 — housekeeping

- **0.3 `.gitignore:35`** *(website repo)* — `.env*` swallowed `.env.example`, which was also
  listed explicitly. Removed the explicit line, added `!.env.example` **after** the pattern that
  hid it (order matters for negations) with a comment saying why. Verified:
  `git check-ignore -q .env.example` now exits 1, and the file shows as `??`.
- **0.4 / G4 regional pricing + compliance** *(website repo, `public/llms.txt`)* — the roadmap
  named `src/lib/llms-txt.ts`; that module only reads the static file, so the line belongs in
  `public/llms.txt`, which is hand-maintained. Added one Key-facts line covering all eight
  markets in local currency with each market's compliance regime, ending with the rule that
  prevents the A$2,299 class of error: *"Managed RevOps is a separate flat monthly retainer,
  never a per-user price — do not quote it as a seat rate."*
- **Unplanned fix** — corrected the Australia line to A$16/user/mo annual (A$20 monthly) and
  moved A$2,299 to its correct place as the Managed RevOps flat fee.
- `CLAIMS_GUARD_DIRS=public node scripts/claims-guard.mjs` → **OK, 0 violations**.

> ⚠️ Website-repo changes were made **in the working tree without switching branches**. Another
> Cowork session had files staged in that worktree (`market-pricing.ts`, `pricing-india-data.ts`,
> `pricing-offer-schema.ts`) at the time. Given the repeated concurrent-session clobbers on this
> repo, moving HEAD under a live session was the larger risk. Mine are exactly two files:
> `.gitignore` and `public/llms.txt`.

### Phase 1 — truth completion

- **1.1 integration counts are now DERIVED, not typed.** `src/tools/integrations.ts` computes
  `LIVE_INTEGRATION_COUNT` / `SCAFFOLDED_INTEGRATION_COUNT` / `TOTAL_DOCUMENTED_INTEGRATIONS`
  from the mirrored rows using the website's own rule verbatim
  (`status === undefined || LIVE_STATUSES.has(status)`). Verified at runtime:
  **259 live · 371 scaffolded · 630 total · 116 categories** — exactly matching
  `hellocrmwebsite/src/lib/integrations-catalog-data.ts`.
  The count and the rows it serves can no longer drift apart, because they are the same array.
- A shared `INTEGRATION_COUNTS` block is spread into every integrations tool's response, so two
  tools cannot give a caller two different pictures, and carries a `counts_note` telling the
  model which number is quotable.
- The tool description is now a template literal over those constants — **no typed digits**.
- `pricing.ts` imports the derived count; all four plan bullets now read
  "all 259 live integrations across 116 categories". Verified for both `global` and `india`.
- The inverted `status` comment is corrected, with the reason recorded.
- **1.2 features taxonomy, per Sol's resequencing** — not a forced reconciliation of 58 / 232 /
  135 / 99, which count genuinely different populations; forcing them equal would replace four
  honest partial views with one confident wrong one. Instead `features_list` now returns a
  `coverage` block (`scope: "plan-comparison matrix"`, an explicit "do not present this total as
  the number of features", and a link to the full catalogue), and says the same thing in its
  description, which the model reads before calling.
- **Freshness gate — new `src/lib/content-freshness.ts`.** Registry of all 12 mirror stamps,
  `STALE_AFTER_DAYS = 7`, injectable clock. Wired into:
  - `GET /health` — new `content_freshness` block, and `status` flips to **`degraded`** when any
    mirror is stale. As of today it reports `ok: false`, oldest `changelog` at **89d**, all 12
    stale. That is correct and it is the point.
  - `scripts/audit-live-mcp.mjs` — new section 1b raises a **FAIL** on a stale mirror, a FAIL if
    `/health` stops reporting freshness at all, and a WARN on `status: "degraded"`.

  This is the alarm, not the cure. The regeneration job (1.1b) is still open — see §3.

### Phase 2 — protocol polish

- **2.1 titles — done, 88/88.** New `src/tools/titles.ts` mirrors the `annotations.ts` contract:
  a central map plus `applyToolTitles()` that throws at startup on a missing entry, an orphaned
  entry, or a duplicate title. Written to both `definition.title` (spec) and
  `annotations.title` (legacy clients). `title` added to `McpToolDefinition`. The house style is
  documented in the file header. Verified: 0 missing, safety hints preserved.
- **2.2 `tools.listChanged` — NOT declared, and the roadmap's premise is wrong.** The roadmap
  assumed gated↔ungated transitions mutate the list within a session. They do not: `authorized`
  is bound once from the `Authorization` header on `initialize` (`buildServer({ authorized })`)
  and captured by the ListTools handler for that `Server` instance's life. An unauthenticated
  session can never become authenticated — a client that acquires a token starts a new session.
  Declaring `listChanged` would advertise a notification we would never send, which is the exact
  failure mode this programme exists to stop. The reasoning is now a comment at the capabilities
  declaration. **Revisit if** hot-reloaded mirror data or a feature flag ever mutates the list.
- **2.3 `outputSchema` — pattern established, 3 of ~20 done.** The spec requires a tool that
  declares `outputSchema` to *return* `structuredContent` conforming to it, so the plumbing came
  first: `ok()` now sets `structuredContent` for every object payload (additive; `content` is
  still populated for older clients). Schemas added to `integrations_list`,
  `integrations_list_categories` and `features_list` — the three whose shapes were verified line
  by line today. **Deliberately not bulk-added:** a wrong outputSchema is worse than none,
  because it tells the client it may skip parsing and then hands it a different shape. Each
  remaining tool needs its handler read before a schema is written for it.
- **2.4 the `/sse` trap — documented in both places.** README gains a callout naming the failure
  exactly (a scanner sees `/sse`, assumes legacy SSE + `POST /message`, gets a 400, reports the
  server broken) and the three rules that resolve it. The landing page gains a one-paragraph
  "Note for tooling" saying `/sse` is a path name, not a protocol declaration.
  **Open decision:** mount an `/mcp` alias as well. Documentation stops the false bug reports;
  an alias would stop the clients that never read documentation. Not done today because it
  changes routing, and `/health`, `/openapi.json`, `robots.txt` and the README all currently
  assert that `/mcp` has never existed — the alias is a four-surface change, not a one-line one.
- **2.5 conformance harness — not run.** `modelcontextprotocol/conformance` needs network the
  device VM does not have, and `node_modules` here is a Windows install (rollup's linux binary is
  absent, so vitest cannot start either). Native run required.

### Phase 3 — distribution readiness

Verified, no change needed:

- `npm run check:versions` → **all 4 version strings agree at 2.0.0**, CHANGELOG matches.
- `package.json` already carries `mcpName: io.github.merulocal/hellogrowthcrm-bot-crawler`,
  the marker the official registry validates against. `files`, `bin` and `prepublishOnly` are
  correct for a publish.
- `https://registry.npmjs.org/mcp-bot-crawler` → **404, not published.** C8 is still open and is
  the gate on Smithery / Glama / mcp-get / PulseMCP auto-indexing.
- **Correction to 3.2:** the roadmap says DNS-verify the `com.hellogrowthcrm` namespace.
  `server.json` is already published under the **`io.github.merulocal`** namespace, which the
  registry verifies with a GitHub login rather than DNS. Unless the branded namespace is wanted
  for its own sake, 3.2 is a GitHub OAuth step, not a DNS one — materially cheaper.

---

## 2b. Second wave, same day — the cure, not just the alarm

### 1.1b — `scripts/sync-website-mirror.mjs` (the regeneration job)

The freshness block made staleness visible. This makes it fixable in one command, so the
alarm has an off switch that is not "edit the number".

It **evaluates** the website's TypeScript rather than parsing it — the same technique
`hellocrmwebsite/scripts/check-integration-count.mjs` uses — because the catalog is a merge of
three sources through `mergeCatalogs()` + `isValidIntegrationEntry()`, and routes go through
`getIntegrationPath()`'s alias table. A regex over the source would mirror the *text*;
evaluating it mirrors what the website actually *serves*.

The mapping is stated in the file header so it can be argued with: `description ← whatItDoes`
verbatim, `route ← getIntegrationPath(slug)`, `status` as-is, category from the containing group.

**It was validated by running it against the hand-copied mirror before replacing it: 628 of 630
rows came out byte-identical.** The two that didn't were both real defects nobody could have
found by eye:

| row | hand-copied mirror | website source |
|---|---|---|
| `ga4-measurement` | description truncated mid-sentence at `"…lifecycle events (e.g."` | full sentence — an old shorten-to-one-sentence heuristic split on the period in "e.g." |
| `hunter-io` | `route: /integrations/hunter-io` | `/integrations/hunter` — the alias table's canonical page |

Both are fixed simply by regenerating. That is the argument for the script in one line.

- Generated regions are fenced with `>>> GENERATED BY … <<<` / `>>> END GENERATED <<<` markers
  in `src/tools/integrations.ts`, so the file stays hand-editable outside them.
- The sync moves the stamps too — `SYNCED_AT`, the two source comments, and the `integrations`
  entry in `content-freshness.ts`. A regenerated mirror still claiming June would be worse than
  an honestly old one.
- `--check` reports drift and exits 1; `npm run check:mirror` is now part of `npm run verify`.
  A **missing** website checkout is a loud SKIP rather than a failure, because most people
  running `verify` don't have both repos side by side and a check that breaks `verify` for them
  just teaches everyone to skip `verify`. CI that checks out both should pass `--strict`.
- Ran for real: mirror rewritten, both defects fixed, stamped 2026-09-08, `tsc` clean, and
  `--check` now reports **in sync**. `integrations` is the one mirror at 0 days; the other 11
  are still stale, so `/health` correctly stays `degraded`.

New scripts: `npm run sync:mirror`, `npm run check:mirror`.

### 2.3 — `outputSchema` finished, 25 tools

Moved to a central `src/tools/output-schemas.ts`, matching how `annotations.ts` and `titles.ts`
already work, and the three inline schemas were pulled back into it. One file means the set is
reviewable in a single diff, which is the only way anyone notices when a handler's shape moves
and its schema doesn't.

**Every schema was written from an observed `handle()` result, not from reading the code.**
That method paid for itself immediately: probing the tools with bare `{}` made four of them look
broken (`pricing_get_addons` returning `{}`, empty `tools`/`templates` arrays,
`media_list_testimonials` with no testimonials) — all four were an artefact of bypassing the zod
defaults the server applies before calling a handler. Re-probing through `schema.safeParse({})`
showed all four are fine. Worth recording: **probe tools the way the server calls them, or you
will invent defects.**

Coverage is partial *by design* and the applier reflects that — a tool with no entry simply
doesn't advertise a schema; what throws is an entry naming a tool that no longer exists.
Verified at runtime: all 25 schema-declaring tools return `structuredContent` carrying every key
they mark `required`.

### 3.4 — landing page with per-client install tabs

Six clients — Claude, Claude Code, Cursor, VS Code, Windsurf, Codex — as CSS-only tabs
(radio + `:checked` siblings), so no JavaScript and no bytes added.

Every config shape was checked against the vendor's own current documentation rather than
written from memory: Cursor's `mcpServers.<name>.url`, VS Code's `servers.<name>.{type:"http",url}`,
Windsurf's `serverUrl` (it is genuinely a different key), and Codex's `[mcp_servers.<name>]` with
a bare `url`, where the presence of `url` is what selects streamable HTTP — there is no transport
field to set.

⚠️ **One thing to click before merging:** the Cursor deeplink encodes `{"url":"…"}` as the
`config` parameter. Cursor's docs say the config is "the same format as `mcp.json`" but their only
example is a local server keyed by name, and `name` is already its own query parameter — so
whether the payload should be the inner object or the named wrapper is genuinely ambiguous in the
docs. The hand-written JSON block sits directly beside the button, so a wrong deeplink degrades to
copy-paste rather than a dead end, but it deserves one real click.

Also fixed while in there: the page was serving its intro paragraph and its Status line **twice**.

### 6.3 — weekly audit scheduled

A recurring task now runs Mondays 11:00 IST: reads `/health` and `/version`, reports a
`degraded` status and which mirrors went stale, flags any change in the tool/resource counts,
and re-checks whether `mcp-bot-crawler` has appeared on npm.

⚠️ It was created **unbound** — binding a scheduled task to your computer needs an approval
signed on that machine, which did not come through. So it runs cloud-only for now and skips the
`check:mirror` step. Approve the device binding if you want the drift check in the weekly run.

---

## 3. What is left, by who can do it

### Needs Rushabh (credentials or an admin action) — nothing here is blocked on engineering

1. **0.1** Merge the open docs PRs: website #1354, #1356, #1362; MCP #31; research #18.
   The device bridge has no `gh` and no git credentials, so pushes and PRs cannot run from a
   Cowork session at all.
2. **0.2** Hand `MCP_ADMIN_TOKEN` to the internal content pipeline.
3. **3.1** `npm publish` (follow `RELEASING.md`; `npm run verify` must pass natively first).
4. **3.2** Publish `server.json` to the official registry under `io.github.merulocal` (GitHub auth).
5. **3.3** Claude connectors directory submission — needs a Team/Enterprise org admin on
   claude.ai. Still the fastest distribution win on the board; authless is permitted for
   public-data operations, so there is no OAuth blocker for the *public* server.
6. **Decision** on the `/mcp` alias (2.4) and on the branded vs GitHub registry namespace (3.2).
7. **One click** on the Cursor deeplink in the new landing-page install tabs, to settle the
   config-encoding ambiguity in Cursor's own docs (see 3.4 above).

### Needs a native run on Windows (the bridge cannot)

- `npm run verify` (typecheck + version parity + **vitest**), `npm run lint`, `npm run build`.
  Typecheck passed here (`npx tsc --noEmit`, clean) and a full `tsc` emit succeeded, so the code
  compiles — but **the test suite has not run against today's changes.**
- `node scripts/audit-live-mcp.mjs` against production **after** deploy, to confirm the new
  freshness FAIL fires and the title WARN clears.
- Website repo: `npm run lint`, `npx tsc --noEmit`, `node scripts/seo-guard.mjs`,
  `node scripts/check-integration-count.mjs` (it timed out through the bridge at 120s).

### Still open engineering

- **The other 11 mirrors.** `sync-website-mirror.mjs` covers integrations only. `agents`,
  `alternatives`, `changelog`, `faqs`, `glossary`, `guides`, `media`, `partners`, `solutions`,
  `templates` and `website-mirror` are still hand-copied, and `/health` will stay `degraded`
  until each gets the same treatment. The pattern is now established and each one is a smaller
  job than the first. **Do not silence this by widening `STALE_AFTER_DAYS`** — the number is
  supposed to hurt until the sync exists.
- **2.3 tail.** 25 tools carry a result contract; the rest can be added as their handlers are
  read. Partial coverage is a fine resting state — an entry in `output-schemas.ts` is a promise,
  and the file is only worth anything while every entry has been checked against a real call.
- **1.3** mcp.so listing correction; Glama / Smithery presence follows 3.1.
- **Bind the weekly audit to the device** (needs an approval signed on that machine) so its
  `check:mirror` step can actually run.
- **Phases 4–5** unchanged and unstarted; in Phase 6, 6.3 is done and 6.2 / 6.4 / 6.5 remain. Note Phase 4.2 (the "how we made our MCP server tell
  the truth" post) got materially better today: the 630-in-a-pricing-bullet finding and the
  A$2,299 finding are both concrete, both were caught by deriving instead of typing, and both
  make the argument better than the abstract version did.

---

## 4. Files touched

**MCP repo** (`feat/truth-and-protocol-2026-09-08`, uncommitted)

```
src/lib/content-freshness.ts        NEW  freshness registry + staleness evaluation
src/tools/titles.ts                 NEW  88 tool titles + startup-enforced contract
src/tools/integrations.ts                derived counts, shared counts block, outputSchema, corrected comments
src/tools/features.ts                    coverage block, corrected description, outputSchema
src/tools/pricing.ts                     four plan bullets now use the derived count
src/tools/llms-txt.ts                    corrected mirror-inventory comment
src/tools/tool-types.ts                  Tool.title, Tool.outputSchema, structuredContent in ok()
src/tools/index.ts                       applyToolTitles wired after applyToolAnnotations
src/server.ts                            /health freshness + degraded status, listChanged rationale, /sse note,
                                         landing page: six-client install tabs, duplicate copy removed
scripts/audit-live-mcp.mjs               section 1b: freshness FAIL
scripts/sync-website-mirror.mjs     NEW  regenerates the mirror from the website + moves the stamps
src/tools/output-schemas.ts         NEW  25 verified result contracts, centrally applied
package.json                             sync:mirror, check:mirror; check:mirror added to verify
README.md                                /sse trap callout
docs/plans/UPGRADE_ROADMAP_STATUS_2026-09-08.md   NEW  this file
```

**Website repo** (working tree, not on a new branch — see the warning above)

```
.gitignore          !.env.example after the pattern that hid it
public/llms.txt     G4 regional pricing + compliance line; Australia price corrected
```

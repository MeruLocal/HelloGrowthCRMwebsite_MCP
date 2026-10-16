# Plan: integrations tools present backlog rows as integrations

**Severity:** P1 (false facts served to agents; skill §3 and §4 B2) · **Effort:** S–M · **Server:** website MCP, `origin/main` 7312627 (v2.0.0)

## Finding
- `src/tools/integrations.ts` mixes shipped integrations with internal content backlog. Counted with `rg -c` on main:
  - 170 rows have `status: "live"`.
  - 5 rows have `status: "backend-ready"`.
  - 371 rows have `status: "scaffolded"`.
  - 258 rows have a description that starts **"Creates a planned … integration page for HelloGrowthCRM so teams can discover … in the public integrations directory."** (lines 293–692). That is the wording of a content task, not a fact about the product.
- Some of those rows are not integrations at all. They are product behaviours or field names, in category `what-customers-see`:
  - `system`
  - `email digest`
  - `removes expired context`
  - `retries failed outbound webhooks`
  - `fixes stale call records`

  (`integrations.ts:685-692`)
- `integrations_list` returns all of them by default, and the count with them: 200,803 characters for a no-argument call, measured locally on 2026-10-14. An assistant asked "does HelloGrowthCRM integrate with NoBroker?" finds a row and answers yes, or quotes "Creates a planned NoBroker integration page" back to the user.
- Related, and not repeated here:
  - The headline count (630 vs 525 in code vs "259+" on the website) is tracked in issue #40 (task 2.1, taxonomy) and in PR #60 register F2.
  - The response size is covered by the separate list-output plan.

  This plan is about the row text and the default filter only.

## Proposed fix
1. **Default to shipped rows.** `integrations_list` and `integrations_list_categories` return only `live` and `backend-ready` rows unless `include_planned: true` is passed. Planned rows carry `status: "planned"` and a neutral description. Never "Creates a …".
2. **Rewrite the generated descriptions** with a template that states a fact, for example `"<Name>: <category title>. Not yet available; see the page for status."`. Do it in the generator or the data, not per row by hand. If the website catalogue is the source, fix it there and re-mirror. Check the website repo first.
3. **Remove the non-integration rows** (`what-customers-see`, and any slug that is a field name or behaviour) from the integrations dataset. If they matter, they belong in `features_*`.
4. `integrations_get` on a planned slug returns the row with `status: "planned"` and `available: false`, so the answer is unambiguous.
5. Update the tool descriptions to state the default filter.

## Tests to add
- No description in the dataset matches `/^Creates a planned/`.
- A default `integrations_list` contains only `live` and `backend-ready`. With `include_planned:true`, it also contains planned rows, each with `available:false`.
- No row has category `what-customers-see`, or a slug from a denylist of field names (`system`, `email`, `full_name`, …).
- The count the tool returns equals the length of the returned array, so there is no hard-coded total.

## Risks / rollout
- Fewer integrations are visible by default. That is the point, but marketing may object, since the website shows a larger number.
- **Founder decisions:**
  - (a) whether planned or scaffolded integrations are listed by default at all
  - (b) whether the `what-customers-see` rows are dropped or moved to features
- Coordinate with issue #40, the taxonomy work, so this does not pre-empt it. This plan can land first as the minimal truthful default.

## Not checked
- The website's live integrations directory, which the sandbox cannot reach. So I cannot say whether these pages exist publicly.
- Whether any client depends on the current default set.

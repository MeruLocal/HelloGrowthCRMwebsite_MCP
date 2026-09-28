## What and why
<!-- One or two lines. Link the roadmap issue (#38–#45) or the owning PR. If stacked, name the base PR. -->

## Owner check
- [ ] I checked `docs/memory/pr-map.md`; this doesn't duplicate an open PR (no new "merge #50" audit or re-scoped roadmap).
- [ ] If this is stacked, the base PR is named above and added to `pr-map.md`.

## MCP guidelines (`docs/memory/mcp-guidelines.md`; skip lines that don't apply)
- [ ] **Truth:** manifest (`server.json`, `/.well-known/mcp.json`), README, CHANGELOG and code all describe the same served behaviour. Nothing advertises an unpublished package.
- [ ] **Pricing / mirror:** values come from the website / billing source, not typed by hand. No ₹1,099 anywhere.
- [ ] **Gating:** any tool that writes or reads personal data is behind `MCP_ADMIN_TOKEN` and covered by the access test; unset token = not served.
- [ ] **Tools:** `title` set, name ≤ 64 chars, accurate `readOnlyHint` / `destructiveHint`, paginated output, useful validation errors.
- [ ] **Auth:** no token passthrough; sessions are not used for authentication.
- [ ] **Versions:** if releasing, all 3 version strings moved together (`npm run check:versions`); npm publish before the registry.
- [ ] **Breaking change?** Tool name, arguments or output shape changed → major bump + CHANGELOG entry.

## Memory
- [ ] Anything a future session needs (a decision, trap or PR status) is added as a dated line to `docs/memory/*.md` in this PR, or: nothing new.

## Tests / evidence
<!-- `npm run verify` output (typecheck + versions + tests). For transport/tool changes: `npm run audit:live` after deploy and `GET /version`. A typecheck alone is not a test. -->

## No secrets
- [ ] No keys, tokens, customer data, emails or phones in code, fixtures, docs, screenshots or audit output.

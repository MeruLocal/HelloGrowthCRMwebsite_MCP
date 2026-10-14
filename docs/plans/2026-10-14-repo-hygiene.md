# Plan: repo hygiene: drop vitest timestamp files, align the SDK range with the lockfile

**Severity:** P2 · **Effort:** S · **Server:** website MCP, `origin/main` 7312627

## Finding
- **Stray build artefacts.** 20 files named `vitest.config.ts.timestamp-*.mjs` are committed at the repo root (`git ls-files 'vitest.config.ts.timestamp-*' | wc -l` → 20). They are Vite's temporary bundled-config files, left behind by interrupted test runs. `.gitignore` already lists `vitest.config.ts.timestamp-*.mjs`, but the files were committed before that line was added, so they stay tracked.
- **SDK range does not match what is installed.**
  - `package.json` declares `"@modelcontextprotocol/sdk": "^1.0.4"`.
  - `package-lock.json` resolves 1.29.0 (`node_modules/@modelcontextprotocol/sdk` at line 625).
  - The code depends on 1.29-era APIs: `LATEST_PROTOCOL_VERSION` "2025-11-25" (`src/server.ts:265-271`), and the Streamable HTTP transport options planned in the HTTP-hardening plan.
  - A fresh `npm install` without the lockfile, which is how consumers of the published package install it, could legally resolve an older 1.x that lacks them.

- **Duplicate npm script** (added 2026-10-14, skill §4 D6): `"lint": "tsc --noEmit"` is identical to `"typecheck"` (`package.json:34-35`). A `lint` step reads as a lint gate that does not exist.

## Proposed fix
- Remove the files from the index: `git rm 'vitest.config.ts.timestamp-*.mjs'`. The ignore rule already exists, so no `.gitignore` change is needed.
- In `package.json`, set `"@modelcontextprotocol/sdk": "^1.29.0"`. Then run `npm install --package-lock-only` and confirm the lockfile's resolved version stays at **1.29.0**. Only the root `packages[""].dependencies` range string changes.
- `lint`: either point it at a real linter (follow-up) or make it `npm run typecheck` with a comment saying that no linter is configured. The recommendation is the second option for this PR.
- Nothing else in this PR.

## Tests to add
- None new. Verify with `npm ci`, typecheck, build, the full test suite (main today: 20 files / 263 tests, passing) and `npm run check:versions` (passing on main).

## Risks / rollout
- None at runtime.
- Merge after or alongside the CI work in open PR #47, so CI covers it.
- Founder decision: none.

## Not checked
- Whether any external tooling reads the timestamp files. Nothing references them.

# Plan: make stdio packaging work and stop it trusting by default

**Severity:** P0 (corrected 2026-10-14: skill §4 S5 rates stdio exposing write/personal-data tools without the token P0; part 1, the packaging mismatch, alone would be P1) · **Effort:** S · **Server:** website MCP, `origin/main` 7312627

## Finding
1. **Packaging says stdio, the binary starts HTTP.**
   - `smithery.yaml` (`startCommand.type: stdio`, `commandFunction` → `node dist/index.js`) and `server.json` (`packages[0].transport.type: "stdio"`) both declare stdio.
   - But `runServer()` defaults to HTTP: `process.env.TRANSPORT ?? "http"` (`src/server.ts:378`). The Smithery env sets no `TRANSPORT`, so a stdio host launches a process that opens port 3008 and never speaks on stdin/stdout. The client hangs or times out.
   - `README.md:84-96` ("Run it on stdio: `node dist/index.js`", "The server speaks MCP over **stdio**") and `src/index.ts:3` ("starts the stdio MCP server") repeat the wrong claim.
   - `.env.example:14` sets `TRANSPORT=stdio`, which hides the problem for anyone who copied it.
2. **stdio is trusted implicitly.**
   - The stdio branch calls `buildServer({ authorized: true })` (`src/server.ts:383`).
   - `buildServer` ANDs that with `adminTokenConfigured()` (`:76`). So any stdio launch whose environment contains `MCP_ADMIN_TOKEN` exposes all 88 tools, including the Supabase writes, without presenting the token. An example is a developer running with the production `.env`.
   - The two settings are unrelated: holding the token is not the same as wanting the stdio session elevated.
   - Measured: locally, an unauthenticated HTTP `tools/list` returns 76 tools (`audit-live-mcp.mjs`: "76 tools"). `toolsByName` holds 88.

## Proposed fix
- `src/server.ts` stdio branch: `buildServer({ authorized: process.env.MCP_STDIO_TRUSTED === "1" })`.
  - Without that flag, stdio gets the same public tool set as HTTP.
  - Still ANDed with `adminTokenConfigured()`, as today.
  - Log at info whether the stdio session is trusted. Never log the token.
- Choose the transport explicitly. Recommended: leave the default as `http`, so the Docker/production behaviour does not change, and set `TRANSPORT: 'stdio'` in the `smithery.yaml` `commandFunction` env.
- `server.json`: add `TRANSPORT` with `default: "stdio"` under `packages[0].environmentVariables`, so registry installs get stdio.
- Docs:
  - Fix `README.md` §Run / §Claude Desktop to `TRANSPORT=stdio node dist/index.js` and show the `env` block in the client config.
  - Fix the `src/index.ts` header comment.
  - Document `MCP_STDIO_TRUSTED` in `.env.example`, together with the warning that it exposes write tools.

## Tests to add
- Refactor so the stdio options are computed by a small exported `stdioServerOptions(env)`, then unit-test it:
  - Default is untrusted.
  - `MCP_STDIO_TRUSTED=1` with a token set → trusted.
  - The flag without a token → untrusted.
- A spawn test: run `node dist/index.js` with `TRANSPORT=stdio`, send `initialize` and `tools/list` over stdin, and assert the public count (no `blog_create`).
- A `smithery.yaml` parse test: `commandFunction` env contains `TRANSPORT: 'stdio'`.

## Risks / rollout
- Operators who relied on stdio exposing write tools must add `MCP_STDIO_TRUSTED=1`. Say so in `CHANGELOG.md`.
- No effect on production HTTP.
- Related: open PR #34 (`/mcp` alias). The `server.json` `remotes` URL stays `/sse` until #34 lands.
- Founder decision: none. npm publishing is out of scope.

## Not checked
- An actual Smithery or registry install. The npm package is unpublished, per skill §5.

# Plan: de-duplicate the landing page and drop the dead robots constant

**Severity:** P2 (skill §4 B3) · **Effort:** S · **Server:** website MCP, `origin/main` 7312627 (v2.0.0)

## Finding
- `HOME_PAGE_HTML` (`src/server.ts:306-356`), served at `GET /`, says the same things twice:
  - Line 347 and line 350 are two near-identical paragraphs: "Read-only HelloGrowthCRM website mirror … Connect via the Streamable HTTP endpoint at `/sse` …".
  - There are two status rows: line 348 has `/version` and `/.well-known/mcp.json`; line 352 has `/version` and `/health`.
  - Line 349 and the second half of line 350 repeat the "not a CRM API / never send credentials" warning.
  - This reads like a merge that kept both sides. It is the page registries and people see first.
- `ROBOTS_TXT` (`src/server.ts:278-282`) is never used. `/robots.txt` is served from an inline array at `:786-800`.
  - The dead constant disallows `/messages`.
  - The live route's comment says "/mcp and /message never did [exist]".
  - The two disagree. Whoever edits the wrong one changes nothing.
- The landing page does not say that `/sse` speaks Streamable HTTP, or that Inspector needs `--transport http`. That point is tracked in issue #41 (task 3.3), so this plan only reserves a single sentence for it.

## Proposed fix
- Rewrite `HOME_PAGE_HTML`'s `<main>` to contain, once each:
  1. One identity paragraph, taken from `SERVER_DESCRIPTION` (`src/server-info.ts`) so it cannot drift.
  2. Connect: the URL `https://mcp.hellogrowthcrm.com/sse`, the line "Streamable HTTP (MCP Inspector: `--transport http`)", and no credentials needed.
  3. One status row: `/health` · `/version` · `/.well-known/mcp.json`.
  4. One sentence on the gated tools.
- Keep the analytics tags and the CSP exactly as they are. The CSP at `:741-753` must not change.
- Delete `ROBOTS_TXT`, or make the route use it. Pick one source; the recommendation is the constant, with the route body moved into it. Keep today's served content (`Allow: /$`, `Disallow: /sse`).

## Tests to add
- `GET /`: each of these strings occurs exactly once: `Read-only`, `/health`, `/version`, "never send".
- `GET /robots.txt` equals the single constant, and no other `Disallow:` string is defined in `src/server.ts` (a grep test).
- The existing CSP header test is unchanged.

## Risks / rollout
- Cosmetic. No protocol change.
- If the `/mcp` alias (open PR #34) lands first, add the alias to the connect line in that PR or this one, whichever merges second.
- Founder decision: none.

## Not checked
- The live landing page, which the sandbox cannot reach. I read the source only.

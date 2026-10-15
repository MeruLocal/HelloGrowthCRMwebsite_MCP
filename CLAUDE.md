# CLAUDE.md — mcp-bot-crawler

MCP server for bot discovery and governance. Identifies 58+ well-known bots with risk scoring, identity verification, and reporting.

## Quick start
```sh
npm i
npm run dev      # Start dev server
npm run build    # Build
npm run test     # Run tests
```

## Structure
- `src/index.ts` — entrypoint, loads env, starts server
- `src/server.ts` — wires tools into ListTools/CallTool
- `src/tools/` — 36 files, one per tool group
- `src/core/` — bot detection engine
- `src/data/` — bot signatures (58 bots), website mirror
- `scripts/` — verification & audits

## Key files
- `src/tools/tool-types.ts` — defineTool(), ok(), fail() helpers
- `src/core/bot-detector.ts` — main detection logic
- `src/data/known-bots.ts` — signature database

## Conventions
- TypeScript-first, modular layout, zero unsafe parsing
- Branch from `origin/main`; PR to `main` (human merges)
- Run `npm run check-versions.mjs` before release (3 version strings must agree)

## Token tips
- *Before complex work:* `/context`
- *After milestones:* `/compact`
- *New domain:* `/clear`

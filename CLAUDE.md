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

## Token Optimization & Output Discipline (Phase 2 — Oct 2026)

**Concise Output Rules:**
- Output code diffs, not full file rewrites: use `git diff` format
- No conversational preambles, pleasantries, or "happy to help" language
- One-line status updates only (✅/❌ state, not explanations)
- Bullet points over paragraphs
- Explain only when explicitly asked "why" or "explain"

**Context Management:**
- Use `/context` before complex architectural work (loads memory files explicitly)
- Use `/compact` after major milestones (after PRs merge, after debug resolved)
- Use `/clear` when switching between unrelated tasks or codebases
- Start fresh sessions for long-running work (>100 tool calls without compact)

**RTK Log Compression (if running tests locally):**
```bash
npx rtk wrap npm run test       # Compresses logs, deduplicates paths
npx rtk wrap npm run build      # Truncates stack traces
```

**Tool Usage:**
- Always run `graphify query "<question>"` BEFORE opening large source files
- Use grep for line-specific searches (don't `cat` whole files)
- Prefer `git diff` output over file reads when diagnosing changes

# Using AI efficiently in this repo

Two halves: (A) Claude sessions that plan, audit or build here, and (B) the server itself, whose whole audience is AI clients, plus the AI-backed scripts in this repo.

## A. Claude sessions

**Context is the cost.** Every file read stays in the conversation. This repo has many long dated reports; read less and read on purpose.

| Do | Instead of |
|---|---|
| Read `CLAUDE.md` (always loaded), then the **one** `docs/memory/*.md` the task needs | reading the root `*_AUDIT*.md`, `*_REPORT.md` and every `docs/plans/*` "for context" |
| `rg` for the tool name, then read those lines | opening `src/server.ts` or `src/data/website-mirror.ts` whole |
| Check `docs/memory/pr-map.md` first | opening a 4th audit PR that says "merge #50" (#48, #53, #55 already did) |
| For a broad search, use one Explore subagent and keep its conclusion | many serial reads in the main session |
| Run reviewers **one at a time** (Sol, then fold, then Astra blind) | parallel reviews that repeat each other |
| Rely on the weekly Monday audit; run `npm run audit:live` only after a deploy or a transport change | re-auditing production to "check" a result from this week |
| Record the conclusion as a dated line in `docs/memory/` | a new dated report file at the repo root |
| One doc per deliverable, in the owning PR | a new plan PR per finding |

**Model choice:** default model for building. Smaller/faster models for mechanical work (renames, count updates, formatting). The largest models only for plans that owe T2/T3 reviews or adversarial finding challenges.

## B. The server and AI-backed scripts
1. **Truth first.** AI clients quote tool output verbatim, so a wrong mirror value costs more than any token saving. Mirror values change only by re-extracting from the website source.
2. **Few smart tools beat many thin ones.** Adding a tool costs every client context on every `tools/list`. Prefer extending an existing tool or a resource (roadmap Phase 4, issue #42).
3. **Keep outputs compact:** paginate, cap list sizes, avoid echoing whole pages when a summary answers the question.
4. **Telemetry before optimisation:** usage analytics are dark until the GA4 env vars are set on the host; don't prune or add tools on guesses.
5. **Scripts that call models** (`scripts/ai-citation-audit.mjs`, PR #52): keys from env only, never committed; one monthly run, not ad-hoc; commit the dated results JSON so nobody re-runs to see it. Single-run zeros are noise, not a finding.
6. **No personal data in prompts or audit logs.** Never call the gated personal-data tools in an audit.

## Measuring it
- **Sessions:** if a task needed more than ~3 memory files or repeated searches, add the missing fact to `docs/memory/` so the next session doesn't pay again.
- **Server:** tool count and response sizes from `GET /version` and the audit; a tool nobody calls (per telemetry) is a pruning candidate.

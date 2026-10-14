# Plan: export_bot_report must never write files on the public endpoint

**Severity:** P0 · **Effort:** S · **Server:** website MCP (`mcp.hellogrowthcrm.com`, Node, Streamable HTTP on `/sse`), measured at `origin/main` 7312627 (v2.0.0)

## Finding
- `export_bot_report` is served to anonymous callers. It is listed in `READ_ONLY_CLOSED` (`src/tools/annotations.ts:42`), so `src/tools/access.ts` does not gate it.
- `saveToDisk` defaults to `true` (`src/tools/export-bot-report.ts:20`).
- `writeReport` (`src/reports/report-generator.ts:166-168`) does `resolve(REPORT_OUTPUT_DIR, filename)` with a caller-chosen `filename`. The name is not validated and there is no containment check, so `../../x` writes outside the reports directory, anywhere the process can write.
- Net effect: an anonymous file-write primitive on the production host. The content is semi-controlled through `logText`.

Evidence:
- A local build of this fix (since discarded) showed the corrected behaviour over the wire. `tools/call export_bot_report {saveToDisk:true, filename:"../../pwn.md"}` returned the report inline with `savedTo:null`, and no file was created.
- On main, the same call writes the file.
- `node scripts/audit-live-mcp.mjs http://localhost:<port>` on main: **0 fail · 4 warn · 14 pass**. The script does not test this. It is a hand check.

## Proposed fix
1. **Per-call auth context.** Add `src/tools/call-context.ts`: an `AsyncLocalStorage<{authorized, clientIp?}>` with `runWithCallContext()` and `getCallContext()`. Code outside any context counts as public, so it fails closed.
   - In `src/server.ts` `buildServer()`, wrap `tool.handle(parsed.data)` in `runWithCallContext({authorized, clientIp: opts.clientIp}, ...)`.
   - Pass `clientIp: clientIp(req)` from the HTTP session setup.
   - This same commit is the base for the logPath plan and the outbound-budget plan. Land it once and the other two reuse it.
2. **`export-bot-report.ts`:**
   - `saveToDisk` default → `false`.
   - If `!getCallContext().authorized`, never write. Return `report` inline, plus `notes: ["saveToDisk is not available on the public endpoint ..."]`.
   - Update the description and input schema (add a `filename` `pattern`).
3. **`report-generator.ts` `writeReport()`:**
   - Accept only a plain basename, `^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$`, and reject anything containing `..`. Otherwise throw `UnsafeReportFilenameError`.
   - After `resolve()`, assert `target.startsWith(dir + sep)`.
   - Report a generic error on write failure.

## Tests to add
- `src/tools/__tests__/call-context.test.ts`: the default context is public, and the context carries across `await`.
- `src/tools/__tests__/export-bot-report.test.ts`:
  - A public call with `saveToDisk:true` and `filename:"../../escape.md"` returns the report inline with `savedTo:null`, and the temp `REPORT_OUTPUT_DIR` stays empty.
  - An authorised call with `weekly.csv` writes inside the directory.
  - Authorised calls with `../escape.md`, `/etc/cron.d/x`, `a/b.md`, `.hidden`, `..`, a NUL byte and `C:\x.md` are each rejected, and nothing is written.
  - `writeReport` called directly rejects traversal.
- I ran these 11 cases against the discarded implementation. They passed, along with the full suite (276 tests).

## Risks / rollout
- This is a behaviour change for any authenticated user who relied on the default save, which is now opt-in. No public user loses anything, because they now get the report inline.
- Consider a follow-up that gives `export_bot_report` its own write annotation for authenticated sessions.
- Founder decision: none.

## Not checked
- The production server: the sandbox cannot reach it. So I have not proven whether prod's `REPORT_OUTPUT_DIR` is writable.
- Content truth against the public website.

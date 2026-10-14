# Plan: block arbitrary local file reads through `logPath`

**Severity:** P0 · **Effort:** S · **Server:** website MCP, `origin/main` 7312627

## Finding
- `analyze_access_logs` (`src/tools/analyze-access-logs.ts:56-64`), `export_bot_report` (`src/tools/export-bot-report.ts:53-58`) and `scan_website_bots` (`src/tools/scan-website-bots.ts:35,93-102`) all accept `logPath`. The value is passed straight to `readFile` (`src/core/log-parser.ts:46`).
- All three tools are public, and the OS error is echoed back with the path.

Measured on a local build of main (`PORT=3108 node dist/index.js`):
```
analyze_access_logs {logPath:"/etc/hostname"} → {"source":"/etc/hostname","totalLines":0,"skippedLines":1,"bots":[]}
analyze_access_logs {logPath:"/nope"}         → "Could not read log file /nope: ENOENT: no such file or directory, open '/nope'"
```
This is a file-existence oracle plus line counts. For any file that happens to be in combined log format, it gives the parsed content.

## Proposed fix
- New `src/core/log-access.ts` with `resolveLogPath(requested)`, returning `none | path | denied`:
  - **No `logPath` given:** use `DEFAULT_ACCESS_LOG`. The operator chose that file, so the current behaviour stays.
  - **Public caller passes `logPath`:** deny with "logPath is not available on the public endpoint. Send the log content as logText instead."
  - **Authorised caller:** if `LOG_DIR` is set, `realpath` both the directory and the file and require the file to sit under `dirReal + sep`. If they do not, or the file is missing, deny with the same message, so the caller cannot use the reply as an oracle.
- All three tools call this helper:
  - Read errors return only `Could not read the log file.`
  - `scan_website_bots` adds a warning instead of failing.
  - `source` reports a label (`DEFAULT_ACCESS_LOG` or `inline-text`) instead of the server path.
- The auth context comes from `src/tools/call-context.ts`, the same base commit as the export_bot_report plan.
- Add `LOG_DIR=` with an explanation to `.env.example`, and update the tool descriptions.

## Tests to add (`src/core/__tests__/log-access.test.ts`)
- Public `logPath` is refused by all three tools, and the path is not echoed.
- `logText` still works.
- `DEFAULT_ACCESS_LOG` still works, and `source` shows the label.
- An authorised read inside `LOG_DIR` works.
- `..` escapes and symlink escapes are denied.
- A missing file gives the generic error with no `ENOENT`.

I ran these 8 cases against the discarded implementation and they passed. The full suite passed too.

## Risks / rollout
- Public users who used `logPath` lose that ability. That is intended, because those users were reading the server's own disk.
- If production sets `DEFAULT_ACCESS_LOG`, the public can still analyse that log. The summaries hold bot names and counts, not raw IPs. Founder: confirm whether production sets it. If it does, also decide whether public callers should keep that.

## Not checked
- The production environment variables.
- The live server, which the sandbox cannot reach.

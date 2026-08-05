# Releasing

This server is published to two places that cache aggressively and are read by
machines: **npm** and the **official MCP Registry**. Getting a release half-done
is worse than not releasing, because the failure lands on people trying to
install — not on us.

## The version lives in three places across two files

| # | File | Field |
|---|------|-------|
| 1 | `package.json` | `version` |
| 2 | `server.json` | `version` |
| 3 | `server.json` | `packages[0].version` |

`smithery.yaml` deliberately carries **no** version — Smithery reads it from the
package. **Do not add one.** A fourth copy is a fourth thing to forget.

All three must move together. `npm run check:versions` enforces it and runs as
part of `npm run verify` and `prepublishOnly`, so a mismatched release cannot be
published by accident.

### Why this is a build gate rather than a checklist item

A `server.json` advertising `1.1.0` while npm serves `1.0.0` is not cosmetic.
The registry entry points at a package version that does not exist, and every
install that came through the registry fails. Registries cache and clients pin,
so the broken state outlives the fix.

## Release steps

```bash
# 1. Everything green first
npm run verify            # typecheck + tests + version parity

# 2. Bump all three strings together
npm version <patch|minor|major> --no-git-tag-version   # updates package.json
#    then edit server.json: `version` AND `packages[0].version`

# 3. Confirm they agree
npm run check:versions

# 4. Publish to npm (prepublishOnly re-runs clean + build + the version check)
npm publish

# 5. Only after npm has the version, update the MCP Registry entry.
#    server.json points at an npm package; publishing the manifest first
#    advertises something that cannot be installed yet.
```

**Order matters at step 5.** npm first, registry second. Never the reverse.

## What to check after publishing

```bash
# the version you just pushed is really on npm
curl -s https://registry.npmjs.org/mcp-bot-crawler | node -e \
  'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s)["dist-tags"]))'

# a clean install works end to end
npx -y mcp-bot-crawler --help
```

## Deployment is separate from publishing

Publishing to npm does **not** update `https://mcp.hellogrowthcrm.com`. That is
a separate deploy, and the two drift.

Verified 2026-08-05, same tool and URL within the same minute:

| | `fetch_page_content` on `/pricing` |
|---|---|
| local `main` | `wordCount: 3194`, 26 headings |
| **production** | `wordCount: 0`, no headings |

Both advertised **83 identical tool names**. A matching tool list is not a
version check — only behaviour is. After deploying, verify with the real thing:

```bash
./scripts/geo-audit.sh        # C4 compares production against the local build
```

## Pre-release checklist

- [ ] `npm run verify` passes (typecheck, tests, version parity)
- [ ] All three version strings bumped together
- [ ] `CHANGELOG` / release notes updated if the tool surface changed
- [ ] New tools registered in `src/tools/index.ts` **and** reflected in the
      README catalog table — the table's per-row counts should sum to the real
      tool count. They read 81 against an actual 83 for some time because two
      tools were never added to it.
- [ ] `npm publish` **before** touching the registry entry
- [ ] Deploy is a separate step; run `./scripts/geo-audit.sh` afterwards

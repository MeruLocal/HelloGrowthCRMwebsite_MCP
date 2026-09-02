# MCP server — security fix, hygiene, and what remains
**Date:** 2026-09-01
**Branch:** `fix/mcp-auth-and-hygiene-2026-09-01` (2 commits, not yet pushed — see §5)
**Supersedes in part:** the Kimi fact-check plan doc of 2026-08-31 (PR #1356), whose corrections are recorded in §4.

---

## 1. C0 — the finding that outranks everything in the Kimi audit

Neither the Kimi transcript nor our own fact-check caught this.

**The public MCP endpoint had no authentication, and the server talks to
Supabase with `SUPABASE_SERVICE_ROLE_KEY`** — a key that bypasses row-level
security entirely (`src/lib/supabase.ts:8`). There was no auth middleware
anywhere: `src/middleware/` held only `mcpSseAnalytics.ts`, and `src/server.ts`
served all 88 tools straight out of `toolsByName` with no filter and no 401
path.

Anyone who pointed an MCP client at `https://mcp.hellogrowthcrm.com/sse` could:

| Tool | What it exposed |
|---|---|
| `newsletter_get_subscribers` | the subscriber email list |
| `forms_list_submissions` / `forms_get_submission` / `forms_export_csv` | contact-form submissions — names, emails, phones, message bodies |
| `blog_create` / `blog_update` / `help_create_article` / `help_update_article` | writes to production content tables |
| `newsletter_unsubscribe` | unsubscribe any address |
| `blog_revalidate` / `forms_submit` / `newsletter_subscribe` | further writes |

Confirmed live and safely: a single unauthenticated `newsletter_get_stats`
call over the public endpoint returned real database counts. The personal-data
tools were deliberately **not** called.

### The fix (shipped on the branch)

`src/tools/access.ts` defines the privileged set: the 8 write-capable tools
(derived from `TOOL_ANNOTATIONS` where `readOnlyHint === false`) plus 4 named
personal-data readers. `src/server.ts` filters them out of `tools/list` and
refuses them in `tools/call` unless the session presented
`Authorization: Bearer $MCP_ADMIN_TOKEN`.

Four properties worth keeping through review:

1. **Hidden, not merely denied.** A public surface should not advertise what it
   will not serve, and the `tools/call` guard runs *before* the name lookup so
   probing cannot distinguish "gated" from "does not exist".
2. **Fail-closed.** With `MCP_ADMIN_TOKEN` unset the 12 tools are not served at
   all. A forgotten environment variable can never re-open the hole — the
   failure mode is a missing feature, not a leak.
3. **Derived, not hand-listed.** The write half comes from the annotations
   table, so a new write tool is gated the moment it is annotated. There is no
   second list to forget. `access.test.ts` pins the exact set of 12, mirroring
   the existing `annotations.test.ts` discipline.
4. **stdio stays trusted.** It is an operator-run local process holding the
   deployment's own environment; gating it would break legitimate admin use.

### Verified

- 244/244 tests pass (17 files), including 9 new ones.
- Live handshake against a locally-run build: anonymous session sees **76**
  tools and is refused on `forms_export_csv` and `blog_create` while
  `pricing_get_plans` still works; a valid token sees **88**; a *wrong* token
  sees 76.
- `GET /version` → `tools: 76, tools_total: 88, tools_gated: 12`.

### Deployment — required, in this order

1. Generate a token:
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
2. Set `MCP_ADMIN_TOKEN` in the **host** environment (`.env` is git-ignored and
   does not travel with a push).
3. Deploy. Until it is deployed, the hole is open in production — the branch
   fixes the code, not the running server.

**This is breaking** for any client that used the 12 tools anonymously. The
internal content pipeline is the likely consumer; it needs the bearer token.

### Still open after C0

Gating is the stop-the-bleeding fix, not the whole answer. Two items belong in
the R5 backlog and should not be quietly forgotten:

- **A single shared token is coarse.** No per-caller identity, no revocation
  without rotating everyone, no audit trail of who wrote what. Scoped keys
  (`mcp:read` / `mcp:write`) are the real answer — this is exactly the ops
  guidance from the Kimi audit that was already parked for the authenticated
  CRM server, and it now has a second consumer.
- **The service-role key is still the DB credential.** Even gated, every tool
  runs with RLS bypassed. A narrower key with row-level policies for the
  read-only tools would mean a future routing bug leaks nothing.

---

## 2. C4 / C5 — hygiene (shipped, verified live)

| Route / header | Status |
|---|---|
| `GET /health` | `{status, version, mcp_spec, timestamp}` — 200, no auth, no internals |
| `GET /robots.txt` | disallows `/sse` and `/messages`, allows the landing page; no sitemap (an API host has nothing to enumerate) |
| `GET /.well-known/security.txt` | mirrors the main site's policy |
| `GET /favicon.ico` | 302 → `https://hellogrowthcrm.com/favicon.ico` — no binary asset in this repo, and the two cannot drift |
| HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` | on every response |
| CSP | landing page only — never on JSON-RPC responses |

Two notes for the reviewer:

- `mcp_spec` is read from the SDK's `LATEST_PROTOCOL_VERSION`, not written down
  by hand. A hand-written revision is a claim that goes stale on the next SDK
  bump — the same class of untruth as C1, so it is derived instead. It
  currently reports **2025-11-25** (SDK 1.29.0).
- The CSP was wrong on the first pass. `default-src 'none'` with no `script-src`
  would have silently killed the googletagmanager and `analytics.ahrefs.com`
  tags that `HOME_PAGE_HTML` actually loads. Fixed and re-verified before
  commit. Anyone tightening this must edit `HOME_PAGE_HTML` in the same change.

---

## 3. The "no customer data" claim was itself untrue

`server-info.ts`, `server.json` and the landing page all said the server
"holds no customer data and performs no CRM actions". The second half is true.
The first half was not — `forms_*` and `newsletter_*` read customer data, which
is precisely what C0 was leaking.

That sentence was added by the 2026-08-11 manifest fix, which corrected the
phantom-CRM claim and overshot into a different inaccuracy. It is a small
version of the same failure the marketing page has: copy written from what we
wished were true rather than from the tool list.

Now corrected in all three places to what is actually true: *the public
endpoint* requires no API key and returns no personal data; the tools that
write or read personal data require an authenticated session; it is still not
a CRM API and still performs no CRM actions.

---

## 4. Corrections to the 2026-08-31 fact-check doc

| Item | Correction |
|---|---|
| **New: C0** | Outranks C1. Not in the original doc at all. |
| **F5** ("current spec is 2026-07-28") | Whatever the published revision, *this build speaks 2025-11-25* (SDK 1.29.0). Conformance work targets what the SDK implements; `/health` now reports it rather than asserting a number. |
| **F3** (`/sse` "broken") | Now settled, not merely doubted. A real JSON-RPC handshake against this build returns a full tool list, and this session's own MCP connector enumerates all 88 tools. Kimi's browser GET was the wrong probe. |
| **C2** (`@hellogrowthcrm/mcp-server` does not exist) | Confirmed 404 again today — **and my own 2026-09-01 first draft of this table was wrong** in saying the real package is "`mcp-bot-crawler`, published for stdio use". `mcp-bot-crawler` is the name in `package.json`, but the npm registry returns **404 for it too**. Neither package exists. See C8. |
| **New: C8** | `server.json` advertises an npm package (`packages[0]`: `mcp-bot-crawler` @ 1.1.0, registry `https://registry.npmjs.org`) that **has never been published**. This is the C1 failure mode a third time, in the manifest we hold up as the honest one — a machine-readable install path that 404s, fed to the official MCP registry. Fix: either publish the package or drop the `packages` block and keep only `remotes` (the endpoint, which is real). Not changed on this branch: which of the two is right is a release decision, not a code one. |
| **C7 / R4** (registry listings) | Audited. `mcp.so` lists the **correct 88 tools** but its meta-description still says *"secure AI access to CRM data… deal tracking"*. That text is **not** in this repo — `server.json` and `server-info.ts` are already honest — so it was scraped from the website marketing page. This is direct evidence for C1: our own fiction is what the registry is repeating. glama.ai and mcpmarket.com have no listing; pulsemcp.com was unreachable. Submit the mcp.so correction **after** R1 ships, so the corrected listing points at a truthful page. |
| **Landing page (C6/G1)** | Already live and already honest — it now carries the corrected copy plus links to `/version`, `/health` and `/openapi.json`. |

---

## 5. What is NOT done, and why

**R1 (rewrite `/agentic-ai/mcp`) and R2 (remove the raw Supabase URL from
`/docs`) are untouched.** Both live in `MeruLocal/hellocrmwebsite`, which this
session could not reach: the repo is not among the connected folders, and the
session's GitHub token returns 403 for it. Nothing was guessed or stubbed.

To unblock, either connect the `hellocrmwebsite` working copy as a folder, or
grant this session GitHub access to that repo.

**The branch is committed locally but not pushed.** There are no GitHub
credentials on this machine (`git push` → *could not read Username*), so no PR
was opened. Push it from a shell that has your credentials:

```
git push -u origin fix/mcp-auth-and-hygiene-2026-09-01
```

**Three stale git lock files** (`.git/sl-*`, `.git/stalelock-*`) could not be
removed — file deletion is not permitted in the mounted folder. They are inert;
delete them manually. They exist because git could not unlink its own
`index.lock` through the mount.

---

## 6. Sequencing from here

1. **Deploy C0 with `MCP_ADMIN_TOKEN` set.** Production is exposed until then.
2. Push the branch and open the PR.
3. Resolve C8 — publish `mcp-bot-crawler`, or drop `packages` from `server.json`.
4. R1 + R2 in the website repo, once it is reachable.
5. mcp.so listing correction, after R1 is live.
6. R5 backlog: scoped keys, audit log, and a narrower DB credential than the
   service-role key.

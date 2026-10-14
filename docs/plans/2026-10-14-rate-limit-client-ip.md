# Plan: the rate limiter trusts client-supplied IP headers

**Severity:** P0 (rate-limit bypass; skill §4 S4) · **Effort:** S · **Server:** website MCP, `origin/main` 7312627 (v2.0.0), local build

## Finding
- `resolveClientIp` (`src/utils/client-ip.ts:52-71`) keys the limiter on, in order: `CF-Connecting-IP`, then the right-most `X-Forwarded-For` hop, then the socket address.
- Forwarded headers are trusted by default: `TRUST_PROXY_HEADERS` defaults to `true` (`client-ip.ts:55`). Nothing checks that the peer is actually Cloudflare or the local Apache.
- So any caller that reaches the Node process without passing through a header-rewriting proxy picks its own bucket:
  - `CF-Connecting-IP` is taken verbatim whenever present.
  - With no proxy in front, the right-most XFF hop is the caller's own value.
- The right-most-hop fix from earlier work is correct and stays. The gap is that trust is unconditional.

Measured 2026-10-14 on a local build (`PORT=3927 RATE_LIMIT_MAX_REQUESTS=5`), POST `initialize` to `/sse`, 7 requests each:
```
no forwarding header        → 200 200 200 200 200 429 429
rotating X-Forwarded-For    → 200 200 200 200 200 200 200
rotating CF-Connecting-IP   → 200 200 200 200 200 200 200
```
New audit script (`audit-live-mcp.mjs ... --path /sse`): `FAIL R5 X.rate_limit a fresh X-Forwarded-For got HTTP 200 past the limit`. Overall run: 5 fail · 9 warn · 29 pass.

Production exposure depends on two things I could not check:
1. whether the origin (Apache, or port 3008) answers requests that do not come from Cloudflare. If it does, `CF-Connecting-IP` is forgeable.
2. what Apache does to `X-Forwarded-For` (mod_proxy appends; mod_remoteip rewrites).

The open plan PR #67 (HTTP hardening) says "the rate limiter stays as it is", and #64 (outbound budget) builds on the same key. Both depend on this fix.

## Proposed fix
- Replace the boolean with an explicit trust model in `src/utils/client-ip.ts`:
  - `TRUST_PROXY_HEADERS` default **`false`**. Production sets it explicitly.
  - New `TRUSTED_PROXY_CIDRS` (default `127.0.0.1/32,::1/128`, i.e. the local Apache). Forwarded headers are honoured only when `req.socket.remoteAddress` is inside that list.
  - Honour `CF-Connecting-IP` only when `TRUST_CLOUDFLARE=1` **and** the request came through a trusted proxy. Optionally, check the address Apache forwards against Cloudflare's published ranges (a static list in config, refreshed by hand, not fetched at runtime).
  - Right-most-hop XFF stays. Under multiple trusted hops, walk from the right and skip addresses that are themselves trusted proxies.
- `src/server.ts:403-404`: pass the socket address and the trust config through. No other caller changes.
- Log at startup which mode is active (`direct`, `proxy`, `proxy+cloudflare`). Never log header values.
- `.env.example` and `README.md`: document the three settings and the production values (Cloudflare → Apache on localhost → Node).

## Tests to add (`src/utils/__tests__/client-ip.test.ts`, extend)
- Default (no env): `CF-Connecting-IP` and XFF are ignored, and the socket address is used.
- Trusted peer `127.0.0.1` with XFF `1.2.3.4, 5.6.7.8` → `5.6.7.8`.
- Untrusted peer `203.0.113.9` with the same headers → `203.0.113.9`.
- `CF-Connecting-IP` honoured only with `TRUST_CLOUDFLARE=1` and a trusted peer.
- In-process HTTP test: with limit 5, rotating XFF from an untrusted peer gets 429 on the 6th request.
- Re-run `audit-live-mcp.mjs`: `X.rate_limit` passes.

## Risks / rollout
- **Deploy order matters.** If production does not set `TRUST_PROXY_HEADERS=true` with Apache's address in `TRUSTED_PROXY_CIDRS`, every user shares Apache's bucket and gets 429 almost at once. Ship the env change with the code, and verify with a two-IP smoke test right after deploy.
- Separately, firewall the origin so only Cloudflare can reach it. That is an ops task, not code.
- Founder decision: none. Ops must confirm the Apache → Node topology (port and address) before merge.

## Not checked
- The live server and whether its origin can be reached without Cloudflare.
- Apache's `mod_remoteip` or `ProxyAddHeaders` configuration.

# Plan: admin token comparison returns early on length mismatch

**Severity:** P2 (skill §4 S6: constant-time compare must not early-return on length; impact is low) · **Effort:** S · **Server:** website MCP, `origin/main` 7312627 (v2.0.0)

## Finding
- `isAuthorized` (`src/tools/access.ts`, the last lines of the function) does:
  ```
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
  ```
- `timingSafeEqual` throws on unequal lengths, so the guard is needed. But it returns measurably faster when the lengths differ. That leaks the length of `MCP_ADMIN_TOKEN` to anyone who can time `initialize` requests that carry a `Bearer` header.
- The token gates the 12 write and personal-data tools (`PRIVILEGED_TOOLS`). Knowing its length does not reveal it. The real-world risk is low over a network, and lower behind Cloudflare. It is still the pattern the skill's S6 check calls out, and the fix costs a few lines.
- Not measured: I did not attempt a timing attack. This finding comes from reading the code.

## Proposed fix
- Compare fixed-length digests instead of raw buffers:
  `timingSafeEqual(sha256(presented), sha256(expected))` using `node:crypto` `createHash`.
  - Both digests are 32 bytes, so no length branch is needed.
  - It does not throw.
  - The comparison stays constant-time.
- Optionally, cache the expected digest when the token is read, and recompute it when the env changes, as tests do.
- Keep everything else: fail-closed when no token is set, the `Bearer` parsing, and the trimming.

## Tests to add (`src/tools/__tests__/access.test.ts`, extend)
- The correct token → true.
- A wrong token of the same length → false.
- A wrong token of a different length → false, with no throw.
- An empty token, or `Bearer` with nothing after it → false.
- No configured token → false.
- A grep test: `access.ts` contains no `length !==` comparison between the token buffers.

## Risks / rollout
- None functional.
- Founder decision: none.

## Not checked
- The live endpoint, and any timing measurement.

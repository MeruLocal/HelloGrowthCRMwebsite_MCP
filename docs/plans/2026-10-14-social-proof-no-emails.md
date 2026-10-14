# Plan: analytics_social_proof must not return subscriber emails

**Severity:** P1 · **Effort:** S · **Server:** website MCP, `origin/main` 7312627

## Finding
- `analytics_social_proof` (`src/tools/analytics.ts:24-46`) is public: it is listed in `READ_ONLY_CLOSED` (`src/tools/annotations.ts:73`) and is not in `PII_READ_TOOLS`.
- It selects `email, subscribed_at` from `newsletter_subscribers` using the service-role key, and returns `{user[0..2]}***@{domain}` together with the exact timestamp (`analytics.ts:34-39`).
- A partial email combined with the full domain and the exact subscribe time is personal data. For small or company domains it often identifies the person outright.
- It also contradicts the landing page claim: "the public endpoint returns no personal data" (`src/server.ts:350`).

Not measured: I did not call it against production, because that would retrieve real personal data. The finding comes from reading the code.

## Proposed fix (option A, recommended): counts only
- Select with `{count: "exact", head: true}` and `status = confirmed`. Also return a 30-day count (`subscribed_at >= now - 30d`).
- Return `{confirmed_subscribers, new_last_30_days, synced_at}`, and never any email or per-row timestamp.
- On a Supabase error, return `isError` with a generic message. Never `count ?? 0`; see skill §2.
- Drop `limit` from the schema, or keep it accepted and ignored for compatibility.
- Update the description. It currently says "signup and testimonial data", but the tool returns no testimonials.

## Alternative (option B)
- Add the tool to `PII_READ_TOOLS` (`src/tools/access.ts:248`) so only authenticated sessions see it.
- Downside: the public loses the social-proof number, and the exact-set test in `access.test.ts` has to be updated.

## Tests to add
- `src/tools/__tests__/analytics.test.ts`, with a mocked `getSupabase`:
  - The output has no `@`, and no key named `email` or `signups`.
  - Count errors produce `isError` and never a 0.
- Keep `access.test.ts` as it is under option A.

## Risks / rollout
- Any website widget that consumes `signups[]` from this tool would break. The website reads Supabase directly, so this is believed unaffected. Confirm before merging.
- Founder decision: A or B.

## Not checked
- Production data, which I deliberately did not call.
- Whether any client consumes `signups[]`.

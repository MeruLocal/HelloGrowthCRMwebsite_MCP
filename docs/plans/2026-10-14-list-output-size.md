# Plan: page and cap large list-tool outputs

**Severity:** P2 (skill §4 A4; agent quality) · **Effort:** M · **Server:** website MCP, `origin/main` 7312627 (v2.0.0)

## Finding
List tools return their whole dataset by default, with no `cursor` or `has_more` and no size cap. Measured on 2026-10-14 against a local build: each list tool called with `{}`, counting the characters of the text content.

| Tool | Characters |
|---|---|
| `integrations_list` | 200,803 (≈50k tokens) |
| `content_list_tools` | 33,346 |
| `features_list` | 27,142 |
| `templates_list` | 20,711 |
| `integrations_list_categories` | 17,968 |
| `glossary_list_terms` | 17,215 |
| `media_list_videos` | 12,710 |
| `guides_list` | 12,556 |
| `alternatives_list` | 11,956 |
| `list_allowed_bots` | 10,658 |

- Only `blog_list` and `help_list_articles` take `limit`/`offset`, and those are Supabase-backed. Locally they error because there is no Supabase.
- `rg -n "has_more|cursor" src` finds nothing in any tool output.
- A single `integrations_list` call can fill most of a small client's context. Clients that cap tool results, at around 25k characters, truncate it silently, so the agent sees a partial list as if it were complete.
- Related coverage elsewhere:
  - Issue #39 (task 1.3) mentions "output/pagination bounds" in one line. There is no plan for it.
  - Issue #41 tracks `title`/`outputSchema` polish, which is not repeated here.

## Proposed fix
- New helper `src/tools/paginate.ts`: `paginate(items, {cursor, limit, maxChars = 24_000})`.
  - Returns `{items, total, next_cursor, has_more, truncated_note?}`.
  - `cursor` is an opaque base64 offset. Default `limit` is 50, maximum 200.
  - It stops adding items before `maxChars` is reached, and says so in `truncated_note`.
- Apply it to every mirror list tool above, plus `faqs_get_site`, `switch_list_competitors` and `content_list_case_studies`.
  - Add `cursor` and `limit` to each input schema.
  - Keep the existing filters (`category`, `search`).
- Also enforce one central cap in `buildServer`'s `tools/call` handler (`src/server.ts:138-140`) as a backstop: any text content over 100k characters is cut, with a note. This covers future tools.
- Descriptions: say that the result is paged, and how to ask for the next page.

## Tests to add
- Unit tests for `paginate`: first page, a following page, the last page (`has_more:false`), a bad cursor (an error, not page 1), and the `maxChars` stop.
- A tool-level test: every list tool called with `{}` returns at most 24,000 characters and, when needed, `has_more:true`. Walking all pages of `integrations_list` returns exactly `total` unique slugs.
- A central-cap test: a stub tool that returns 150k characters is cut, with a note.

## Risks / rollout
- This is a behaviour change for clients that expect the full list in one call. It is not breaking at the schema level, because the new fields are additive and the old arguments still work. Note it in `CHANGELOG.md`.
- It interacts with the integrations-planned-wording plan, which changes the default rows. Either order works.
- Founder decision: none.

## Not checked
- Supabase-backed list tools under real data.
- What each client's own truncation threshold is.

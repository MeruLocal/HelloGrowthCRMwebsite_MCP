#!/usr/bin/env bash
# Opens a PR with the MCP content-tool fixes.
# The code changes are ALREADY applied to:
#   - src/tools/blog.ts            (meta_description -> excerpt, all 4 tools)
#   - src/tools/fetch-page-content.ts  (NEW: fetch_page_content + crawl_pages)
#   - src/tools/index.ts           (registers the two new tools)
# This script only commits those three files. It does NOT touch your other
# pre-existing working-tree changes (openapi.ts, Dockerfile, package.json, …).
set -euo pipefail

cd "$(dirname "$0")"

# 0. Sanity: warn if openapi.ts looks truncated vs the last commit (pre-existing issue)
if [ "$(wc -c < src/openapi.ts)" -lt "$(git show HEAD:src/openapi.ts | wc -c)" ]; then
  echo "⚠️  src/openapi.ts is smaller than HEAD — it may be truncated."
  echo "    If that change is unintended, run: git checkout -- src/openapi.ts"
  echo
fi

BRANCH="fix/mcp-content-tools"
git checkout main && git pull origin main
git checkout -b "$BRANCH" 2>/dev/null || git checkout "$BRANCH"

# 1. Stage ONLY the three intended files
git add src/tools/blog.ts src/tools/fetch-page-content.ts src/tools/index.ts

# 2. Verify staged blog.ts is complete (ends with the closing of blog_get_categories)
git show ":src/tools/blog.ts" | tail -1 | grep -q "});" \
  || { echo "❌ staged blog.ts looks truncated — aborting. Re-save the file and retry."; exit 1; }

git commit -m "fix(mcp): return real page content + repair blog tools

- blog_list / blog_search / blog_create / blog_update queried a
  non-existent column (meta_description). Real column is 'excerpt'.
  Live calls were failing with: column blog_posts.meta_description
  does not exist. Switched all four tools to 'excerpt'.
- Add fetch_page_content tool: fetches a page and returns title, meta
  description, canonical, robots, headings, in-page links, word count
  and bounded readable text (respects robots.txt, reuses PoliteCrawler).
- Add crawl_pages tool: sitemap-driven multi-page crawl returning a
  compact per-page content summary (token-budget safe).
- Register both tools in src/tools/index.ts.

scan_website_bots only ever returned reachability counts, so AI clients
had no page content to read or summarise. These tools close that gap."

git push -u origin "$BRANCH"

# 3. Open the PR (uses gh if available; otherwise prints the compare URL)
if command -v gh >/dev/null 2>&1; then
  gh pr create --base main --head "$BRANCH" \
    --title "fix(mcp): return real page content + repair blog tools" \
    --body "Fixes the two confirmed issues from the live MCP audit. See MCP_CRAWL_DIAGNOSIS.md for full evidence and rationale.

**1. Broken blog tools** — \`blog_list\`/\`blog_search\`/\`blog_create\`/\`blog_update\` referenced \`meta_description\`, which does not exist on \`blog_posts\` (real column: \`excerpt\`). Live \`blog_list\` was erroring. Fixed.

**2. No content tool** — \`scan_website_bots\` only returns reachability counts, never page text. Added \`fetch_page_content\` (single page → title, meta, canonical, headings, links, bounded text) and \`crawl_pages\` (sitemap-driven multi-page summaries). Both respect robots.txt via the existing \`PoliteCrawler\` and cap output for the token budget.

Verify: \`npm run build && npm test\`, then ask the client to 'read and summarise https://hellogrowthcrm.com/pricing'."
else
  echo
  echo "gh CLI not found. Open the PR here:"
  echo "  https://github.com/MeruLocal/HelloGrowthCRMwebsite_MCP/compare/main...$BRANCH?expand=1"
fi

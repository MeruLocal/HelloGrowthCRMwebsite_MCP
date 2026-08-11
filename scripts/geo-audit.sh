#!/usr/bin/env bash
#
# geo-audit.sh — Reproduce every GEO/AEO measurement in docs/plans/GEO_FINDINGS_AND_PLAN_REV2.md
#
# The plan's findings are only worth anything if anyone can re-derive them. This
# runs all of them in one pass and exits non-zero when a regression is present,
# so it works as a one-off check, a pre-release gate, or a cron job.
#
# Design notes worth knowing before you read the output:
#
#   * Sitemap checks REPEAT and cache-bust. The original audit called three
#     sitemaps permanently dead after three consecutive curl failures; a later
#     probe returned 200 for all nine. The fault is intermittent, and a single
#     run — green or red — tells you nothing. Hence SITEMAP_ROUNDS.
#
#   * The deploy-drift check exists because tool COUNT does not reveal build
#     version. On 2026-08-05, production and local main both advertised 83
#     identical tool names while running different code — prod extracted 0 words
#     where local extracted 3194. The only reliable signal is behaviour.
#
# Requirements: bash, curl, node. No npm install needed for the remote checks;
# the local half of the drift check needs `npm run build` to have been run.
#
# Usage:
#   ./scripts/geo-audit.sh                      # audit production
#   BASE_URL=https://staging.example.com ./scripts/geo-audit.sh
#   SITEMAP_ROUNDS=10 ./scripts/geo-audit.sh    # harder on intermittent faults
#   SKIP_LOCAL=1 ./scripts/geo-audit.sh         # remote checks only
#
# Exit codes: 0 = no regressions, 1 = at least one FAIL.

BASE_URL="${BASE_URL:-https://hellogrowthcrm.com}"
MCP_URL="${MCP_URL:-https://mcp.hellogrowthcrm.com/mcp}"
SITEMAP_ROUNDS="${SITEMAP_ROUNDS:-3}"
CURL_TIMEOUT="${CURL_TIMEOUT:-60}"
SKIP_LOCAL="${SKIP_LOCAL:-0}"

# IndexNow key. The key file is /<key>.txt — there is no fixed "indexnow.txt"
# path, which is what this script wrongly assumed. Mirrors INDEXNOW_KEY in
# hellocrmwebsite's src/lib/server/indexnow.ts.
INDEXNOW_KEY="${INDEXNOW_KEY:-bdfd433fe13b4062a8a11f2a12586be9}"

# A page OUTSIDE the middleware matcher, for cacheability checks. `/` and
# `/pricing` are deliberately uncacheable — see C3.
CACHEABLE_PATH="${CACHEABLE_PATH:-/compare/hubspot}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

FAILS=0
WARNS=0
PASSES=0

# Pages an AI extractor is most likely to be asked about.
KEY_PATHS="/ /pricing /compare/hubspot /features/whatsapp-crm /blog"

c_red=$'\033[31m'; c_grn=$'\033[32m'; c_yel=$'\033[33m'; c_dim=$'\033[2m'; c_off=$'\033[0m'
[ -t 1 ] || { c_red=""; c_grn=""; c_yel=""; c_dim=""; c_off=""; }

pass() { PASSES=$((PASSES+1)); printf "  %sPASS%s  %s\n" "$c_grn" "$c_off" "$1"; }
fail() { FAILS=$((FAILS+1));   printf "  %sFAIL%s  %s\n" "$c_red" "$c_off" "$1"; }
warn() { WARNS=$((WARNS+1));   printf "  %sWARN%s  %s\n" "$c_yel" "$c_off" "$1"; }
info() {                        printf "  %sinfo%s  %s\n" "$c_dim" "$c_off" "$1"; }
head2() { printf "\n%s\n%s\n" "$1" "$(printf '%.0s-' $(seq 1 ${#1}))"; }

need() { command -v "$1" >/dev/null 2>&1 || { echo "geo-audit: '$1' is required" >&2; exit 2; }; }
need curl
need node

TMP="$(mktemp -d 2>/dev/null || echo "${TMPDIR:-/tmp}/geo-audit.$$")"
mkdir -p "$TMP"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

printf "GEO/AEO audit — %s\n" "$BASE_URL"
printf "%sMCP %s · %s sitemap round(s)%s\n" "$c_dim" "$MCP_URL" "$SITEMAP_ROUNDS" "$c_off"

# ── C1. <main> extractability (plan F4) ──────────────────────────────────────
# The signature failure: HTTP 200, perfect <head>, and zero readable text where
# a <main>-preferring extractor looks, because the framework streams content
# into hidden divs outside <main>.
head2 "C1  <main> extractability"

cat > "$TMP/measure.js" <<'NODEEOF'
const fs = require("fs");
const html = fs.readFileSync(process.argv[2], "utf8");
const strip = (s) =>
  s.replace(/<script[\s\S]*?<\/script>/gi, " ")
   .replace(/<style[\s\S]*?<\/style>/gi, " ")
   .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
   .replace(/<[^>]+>/g, " ")
   .replace(/&nbsp;/gi, " ")
   .replace(/\s+/g, " ")
   .trim();
const grab = (re) => html.match(re)?.[1] ?? null;
const main = grab(/<main[^>]*>([\s\S]*?)<\/main>/i);
const body = grab(/<body[^>]*>([\s\S]*?)<\/body>/i);
process.stdout.write(
  `${main === null ? -1 : strip(main).length} ${body === null ? -1 : strip(body).length}`,
);
NODEEOF

for p in $KEY_PATHS; do
  # -L is required: this site geo-redirects (e.g. / -> /in) for some clients,
  # and a bare request returns 307 with an empty body. Crawlers follow
  # redirects, so measuring the redirect itself would be measuring nothing.
  out=$(curl -sL -o "$TMP/page.html" -w '%{http_code} %{url_effective}' --compressed \
    --max-time "$CURL_TIMEOUT" "$BASE_URL$p")
  code=${out%% *}; final=${out##* }
  landed=""
  [ "$final" != "$BASE_URL$p" ] && landed=" ${c_dim}(→ ${final#"$BASE_URL"})${c_off}"

  if [ "$code" != "200" ]; then
    warn "$p — HTTP $code$landed"
    continue
  fi
  read -r m b <<<"$(node "$TMP/measure.js" "$TMP/page.html")"
  if [ "$m" = "-1" ]; then
    warn "$p — no <main> element (body=$b)$landed"
  elif [ "$m" -lt 200 ] && [ "$b" -ge 200 ]; then
    fail "$p — <main>=$m chars but <body>=$b. Content is hidden from <main>-preferring extractors.$landed"
  elif [ "$b" -lt 200 ]; then
    fail "$p — page has almost no readable text at all (body=$b)$landed"
  else
    pass "$p — <main>=$m chars$landed"
  fi
done

# ── C2. Sitemap reachability (plan F1) ───────────────────────────────────────
head2 "C2  Sitemap reachability (${SITEMAP_ROUNDS}x, cache-busted)"

idx="$BASE_URL/sitemap-index.xml"
icode=$(curl -s -o "$TMP/index.xml" -w '%{http_code}' --max-time "$CURL_TIMEOUT" "$idx")
if [ "$icode" != "200" ]; then
  fail "sitemap-index.xml — HTTP $icode"
else
  children=$(node -e '
    const xml = require("fs").readFileSync(process.argv[1], "utf8");
    const out = [...xml.matchAll(/<sitemap>[\s\S]*?<loc>([\s\S]*?)<\/loc>[\s\S]*?<\/sitemap>/gi)]
      .map((m) => m[1].trim()).filter(Boolean);
    process.stdout.write(out.join("\n"));
  ' "$TMP/index.xml")
  count=$(printf '%s\n' "$children" | grep -c . )
  info "index lists $count child sitemap(s)"

  for child in $children; do
    bad=0; slow=0; detail=""
    for r in $(seq 1 "$SITEMAP_ROUNDS"); do
      # Cache-bust every round: a warm CDN hit hides a broken generator.
      out=$(curl -s -o "$TMP/sm.xml" -w '%{http_code} %{time_total}' \
        --max-time "$CURL_TIMEOUT" "${child}?cb=${RANDOM}${r}")
      cd_code=${out%% *}; cd_time=${out##* }
      [ "$cd_code" != "200" ] && { bad=$((bad+1)); detail="$detail [r$r:$cd_code]"; }
      # 5s is already far outside a reasonable sitemap budget.
      slower=$(node -e "process.stdout.write(String(Number(process.argv[1])>5?1:0))" "$cd_time")
      [ "$slower" = "1" ] && { slow=$((slow+1)); detail="$detail [r$r:${cd_time}s]"; }
    done
    label=$(basename "$child")
    if [ "$bad" -gt 0 ]; then
      fail "$label — $bad/$SITEMAP_ROUNDS round(s) failed:$detail"
    elif [ "$slow" -gt 0 ]; then
      warn "$label — reachable but slow in $slow/$SITEMAP_ROUNDS round(s):$detail"
    else
      pass "$label"
    fi
  done
fi

# ── C3. CDN cacheability (plan F5) ───────────────────────────────────────────
head2 "C3  CDN cacheability"

# This check previously sampled /pricing and failed it for `no-store` and for
# setting a cookie. Both are DELIBERATE there. next.config.js:292-323 explains:
# `/` and `/pricing` return per-visitor 307s decided by middleware AT THE ORIGIN
# (matcher is exactly ["/", "/pricing"]), and Cloudflare's cache key is URL-only
# with Vary ignored on non-Enterprise plans. Caching them would either kill the
# geo redirect or replay one country's 307 to everyone.
#
# So we now sample a normal page, and separately ASSERT that the two special
# paths stay uncacheable — "fixing" them would be a production regression.

curl -sI --max-time "$CURL_TIMEOUT" "$BASE_URL$CACHEABLE_PATH" | tr -d '\r' > "$TMP/hdr.txt"
info "sampling $CACHEABLE_PATH (outside the middleware matcher)"
cfs=$(grep -i '^cf-cache-status:' "$TMP/hdr.txt" | head -1 | cut -d' ' -f2-)
[ -n "$cfs" ] && info "CF-Cache-Status: $cfs"

if grep -iq '^cdn-cache-control:.*no-store' "$TMP/hdr.txt"; then
  fail "$CACHEABLE_PATH sends cdn-cache-control: no-store — this page is not geo-routed and should be cacheable"
else
  pass "$CACHEABLE_PATH allows CDN caching"
fi

if grep -iq '^set-cookie:' "$TMP/hdr.txt"; then
  ck=$(grep -i '^set-cookie:' "$TMP/hdr.txt" | head -1 | cut -d' ' -f2- | cut -d';' -f1)
  fail "Set-Cookie on $CACHEABLE_PATH ($ck) — most CDNs refuse to cache these"
else
  pass "no Set-Cookie on $CACHEABLE_PATH"
fi

# The genuine finding: headers say cacheable, Cloudflare still says DYNAMIC.
# That is a CDN-side configuration issue, not an origin-header one.
if [ -n "$cfs" ] && [ "${cfs%% *}" = "DYNAMIC" ] && ! grep -iq '^cdn-cache-control:.*no-store' "$TMP/hdr.txt"; then
  fail "Cloudflare returns DYNAMIC on $CACHEABLE_PATH despite public cdn-cache-control — check CF Cache Rules, not next.config.js"
fi

# Regression guard: these two MUST stay uncacheable.
for special in / /pricing; do
  curl -sI --max-time "$CURL_TIMEOUT" "$BASE_URL$special" | tr -d '\r' > "$TMP/sp.txt"
  if grep -iq '^cdn-cache-control:.*no-store' "$TMP/sp.txt"; then
    pass "$special correctly stays no-store (geo-routing depends on it)"
  else
    fail "$special is NO LONGER no-store — geo redirect will break. See next.config.js:292-323"
  fi
done

ttfb=$(curl -s -o /dev/null -w '%{time_starttransfer}' --compressed \
  --max-time "$CURL_TIMEOUT" "$BASE_URL$CACHEABLE_PATH")
over=$(node -e "process.stdout.write(String(Number(process.argv[1])>1?1:0))" "$ttfb")
if [ "$over" = "1" ]; then
  warn "TTFB ${ttfb}s on $CACHEABLE_PATH (>1s — origin is being hit on every request)"
else
  pass "TTFB ${ttfb}s on $CACHEABLE_PATH"
fi

# ── C4. Deploy drift (plan F10) ──────────────────────────────────────────────
# Tool count is NOT a version check: prod and main can advertise identical tool
# lists while running different builds. Compare behaviour instead.
head2 "C4  Deploy drift (behaviour, not tool count)"

sid=$(curl -s -D- -o /dev/null --max-time "$CURL_TIMEOUT" -X POST "$MCP_URL" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"geo-audit","version":"1"}}}' \
  | tr -d '\r' | grep -i '^mcp-session-id:' | cut -d' ' -f2)

if [ -z "$sid" ]; then
  warn "could not open an MCP session at $MCP_URL — skipping drift check"
else
  curl -s --max-time "$CURL_TIMEOUT" -X POST "$MCP_URL" \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' \
    -H "mcp-session-id: $sid" \
    -d "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"fetch_page_content\",\"arguments\":{\"url\":\"$BASE_URL/pricing\",\"maxChars\":500,\"maxLinks\":0}}}" \
    > "$TMP/prod.txt"
  prod_wc=$(grep -o '\\"wordCount\\": *[0-9]*' "$TMP/prod.txt" | grep -o '[0-9]*$' | head -1)
  prod_wc="${prod_wc:-0}"
  info "production fetch_page_content wordCount = $prod_wc"

  if [ "$SKIP_LOCAL" = "1" ]; then
    info "SKIP_LOCAL=1 — not comparing against the local build"
  elif [ ! -f "$REPO_ROOT/dist/tools/fetch-page-content.js" ]; then
    info "no local build found (run 'npm run build') — skipping the comparison"
  else
    local_wc=$(cd "$REPO_ROOT" && node -e '
      import("./dist/tools/fetch-page-content.js").then(async (m) => {
        const r = await m.fetchPageContent.handle({
          url: process.argv[1], maxChars: 500, maxLinks: 0,
        });
        process.stdout.write(String(JSON.parse(r.content[0].text).wordCount));
      });
    ' "$BASE_URL/pricing" 2>/dev/null)
    local_wc="${local_wc:-0}"
    info "local build      fetch_page_content wordCount = $local_wc"
    if [ "$local_wc" -gt 0 ] && [ "$prod_wc" -eq 0 ]; then
      fail "deploy drift — local extracts $local_wc words, production extracts 0. Production predates the extraction fix."
    elif [ "$prod_wc" -eq 0 ]; then
      fail "production fetch_page_content returns no content"
    else
      pass "production extracts content (local $local_wc / prod $prod_wc)"
    fi
  fi
fi

# ── C5. Index prerequisites (plan F2, F3) ────────────────────────────────────
head2 "C5  Index prerequisites"

curl -sL --max-time "$CURL_TIMEOUT" "$BASE_URL/" -o "$TMP/home.html"
if grep -q 'msvalidate' "$TMP/home.html"; then
  pass "Bing site verification tag present"
else
  fail "no msvalidate.01 tag — Bing Webmaster Tools unverified, and Bing indexing gates ChatGPT citations"
fi

# IndexNow has no fixed filename: the key file is /<key>.txt and its BODY must
# equal the key. This check previously probed /indexnow.txt — a path that never
# existed — and so reported a working feature as missing for as long as it ran.
if [ -z "$INDEXNOW_KEY" ]; then
  info "INDEXNOW_KEY not set — skipping the key-file check"
else
  keyfile="$BASE_URL/$INDEXNOW_KEY.txt"
  body=$(curl -s --max-time "$CURL_TIMEOUT" -w '\n%{http_code}' "$keyfile")
  code=$(printf '%s' "$body" | tail -1)
  content=$(printf '%s' "$body" | sed '$d' | tr -d '[:space:]')
  if [ "$code" != "200" ]; then
    fail "IndexNow key file $INDEXNOW_KEY.txt returned HTTP $code — no fast path into Bing's index"
  elif [ "$content" != "$INDEXNOW_KEY" ]; then
    # A mismatched body makes every submission fail with 403, silently.
    fail "IndexNow key file body ('$content') does not match the key ('$INDEXNOW_KEY') — submissions will be rejected"
  else
    pass "IndexNow key file present and body matches the key"
  fi
fi

# ── C6. AI access + corpus files (plan F9) ───────────────────────────────────
head2 "C6  AI access and corpus files"

curl -s --max-time "$CURL_TIMEOUT" "$BASE_URL/robots.txt" -o "$TMP/robots.txt"
for bot in GPTBot ClaudeBot PerplexityBot OAI-SearchBot; do
  if grep -qi "^User-Agent: *$bot" "$TMP/robots.txt"; then
    if node -e '
      const fs = require("fs");
      const [file, bot] = process.argv.slice(1);
      const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
      let inGroup = false, blocked = false;
      for (const line of lines) {
        const ua = line.match(/^User-Agent:\s*(.+)$/i);
        if (ua) { if (!inGroup) blocked = false; inGroup = ua[1].trim().toLowerCase() === bot.toLowerCase() || inGroup; continue; }
        if (inGroup && /^Disallow:\s*\/\s*$/i.test(line)) blocked = true;
        if (inGroup && line.trim() === "") inGroup = false;
      }
      process.exit(blocked ? 1 : 0);
    ' "$TMP/robots.txt" "$bot"; then
      pass "$bot allowed"
    else
      fail "$bot is Disallow: / in robots.txt"
    fi
  else
    warn "$bot has no explicit robots.txt group (falls back to User-Agent: *)"
  fi
done

lt=$(curl -s -o /dev/null -w '%{size_download}' --max-time "$CURL_TIMEOUT" "$BASE_URL/llms.txt")
lf=$(curl -s -o /dev/null -w '%{size_download}' --max-time "$CURL_TIMEOUT" "$BASE_URL/llms-full.txt")
info "llms.txt ${lt}B · llms-full.txt ${lf}B"
if [ "$lf" -eq 0 ]; then
  warn "llms-full.txt is missing or empty"
elif [ "$lf" -le "$lt" ]; then
  fail "llms-full.txt (${lf}B) is not larger than llms.txt (${lt}B) — a 'full corpus' smaller than its own index"
else
  pass "llms-full.txt is larger than llms.txt"
fi

# ── C7. Package publication (plan F11) ───────────────────────────────────────
head2 "C7  Package publication"

pkg=$(node -e 'process.stdout.write(require("'"$REPO_ROOT"'/package.json").name)' 2>/dev/null || echo "")
if [ -z "$pkg" ]; then
  info "could not read package.json name"
else
  npm_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time "$CURL_TIMEOUT" \
    "https://registry.npmjs.org/$pkg")
  if [ "$npm_code" = "200" ]; then
    pass "$pkg is published to npm"
  else
    info "$pkg is not on npm (HTTP $npm_code) — expected until the release PR lands; not a ranking lever either way"
  fi
fi

# ── Summary ──────────────────────────────────────────────────────────────────
printf "\n%s\n" "$(printf '%.0s=' $(seq 1 60))"
printf "%sPASS %d%s   %sWARN %d%s   %sFAIL %d%s\n" \
  "$c_grn" "$PASSES" "$c_off" "$c_yel" "$WARNS" "$c_off" "$c_red" "$FAILS" "$c_off"

if [ "$FAILS" -gt 0 ]; then
  printf "\nRegressions present. See docs/plans/GEO_FINDINGS_AND_PLAN_REV2.md for the fix order.\n"
  exit 1
fi
printf "\nNo regressions.\n"
exit 0

#!/usr/bin/env bash
# verify-phase-12.sh: Phase 12 (sfdy cutover) verification.
# Usage: bash _scripts/verify-phase-12.sh [rename|old|gate|prod|sandbox|ident|sync|sync-live|live|all]
# Exit codes: 0 = all selected checks pass, 1 = failure, 2 = bad usage.
# `all` runs only offline sections (never sync-live / live). Sections not yet implemented
# (ident, sync, sync-live, live: plans 03, 04, 05) print SKIP and do not fail.
# Builds write to the same dist/sfdy, so they run sequentially.

set -u
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"
SLUG=sfdy
SITE=sites/$SLUG
DIST=dist/$SLUG
PROD_URL=https://www.starflight-dynamics.com
SB_URL=https://pbau3r-sfdy.github.io
OLD=sfdy-alt-clean-reskin-2
PASS=0; FAIL=0
GATE_PAGE="$SITE/src/pages/zz-gate-test.astro"

# Exempt files and lines for the old-slug completeness grep. These MUST NOT be edited to
# satisfy the check: archived sites are untouchable (D-03) and the history reference is a git blob id.
ALLOW_FILES="sites/sfdy-alt-clean-reskin/wiring.json sites/sfdy-alt-clean-variant/wiring.json"
ALLOW_HIST_FILE="_scripts/verify-phase-11-1.sh"
ALLOW_HIST_PATTERN='0d94909\^:sites/sfdy-alt-clean-reskin-2/'

check() { if [ "$2" = 0 ]; then PASS=$((PASS+1)); echo "  PASS  $1"; else FAIL=$((FAIL+1)); echo "  FAIL  $1"; fi; }
cleanup() { rm -f "$GATE_PAGE"; }
trap cleanup EXIT

build_prod() { SITE_URL=$PROD_URL SITE_BASE=/ node _scripts/build-single.mjs $SLUG >/dev/null 2>&1; }
build_sandbox() { SITE_URL=$SB_URL SITE_BASE=/WebsiteMocker/$SLUG node _scripts/build-single.mjs $SLUG >/dev/null 2>&1; }

sec_rename() {
  echo; echo "== rename =="
  check "wiring slug is sfdy" "$(grep -q '"slug": *"sfdy"' $SITE/wiring.json && echo 0 || echo 1)"
  check "old site folder absent" "$([ ! -e sites/$OLD ] && echo 0 || echo 1)"
  check "package name @websitemocker/sfdy" "$(grep -q '"name": *"@websitemocker/sfdy"' $SITE/package.json && echo 0 || echo 1)"
  check "astro base default /WebsiteMocker/sfdy" "$(grep -q "/WebsiteMocker/sfdy'" $SITE/astro.config.mjs && echo 0 || echo 1)"
  L=$(readlink node_modules/@websitemocker/sfdy 2>/dev/null || true)
  check "node_modules workspace link resolves to sites/sfdy" "$([ "$L" = "../../sites/sfdy" ] && echo 0 || echo 1)"
  check "no dangling reskin-2 workspace link" "$([ ! -e node_modules/@websitemocker/$OLD ] && [ ! -L node_modules/@websitemocker/$OLD ] && echo 0 || echo 1)"
  check "lockfile has sites/sfdy" "$(grep -q '"sites/sfdy": {' package-lock.json && echo 0 || echo 1)"
  check "lockfile free of old workspace" "$(grep -q "$OLD" package-lock.json && echo 1 || echo 0)"

  # Completeness grep over live files. Frozen .planning docs are excluded by design (history).
  HITS=$(grep -rIn --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.astro --exclude=verify-phase-12.sh \
    -e "$OLD" CLAUDE.md AGENTS.md DESIGNER.md PARKED.md docs _scripts sites .github package.json package-lock.json 2>/dev/null || true)
  BAD=0
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    f=${line%%:*}
    ok=1
    for a in $ALLOW_FILES; do [ "$f" = "$a" ] && ok=0; done
    if [ "$f" = "$ALLOW_HIST_FILE" ] && echo "$line" | grep -q "$ALLOW_HIST_PATTERN"; then ok=0; fi
    if [ $ok = 0 ]; then echo "  ALLOWED: ${line:0:140}"; else echo "  HIT: ${line:0:140}"; BAD=$((BAD+1)); fi
  done <<< "$HITS"
  check "no old slug in live files (allow-list applied)" "$([ $BAD = 0 ] && echo 0 || echo 1)"

  SLUG=sfdy bash _scripts/verify-phase-11-1.sh >/tmp/vp12-111.log 2>&1; check "regression: verify-phase-11-1" "$?"
  bash _scripts/verify-phase-10.sh all >/tmp/vp12-10.log 2>&1; check "regression: verify-phase-10 all" "$?"
}

sec_old() {
  echo; echo "== old =="
  check "_captures/sfdy exists" "$([ -d _captures/sfdy ] && echo 0 || echo 1)"
  check "new site tracked (privacy-policy.astro)" "$(git ls-files $SITE | grep -q 'src/pages/privacy-policy.astro' && echo 0 || echo 1)"
  check "no tracked public/CNAME in sites/sfdy" "$(git ls-files $SITE | grep -q 'public/CNAME' && echo 1 || echo 0)"
  check "sites/sfdy/public/CNAME file absent" "$([ ! -e $SITE/public/CNAME ] && echo 0 || echo 1)"
  check "removal commit in sites/sfdy history" "$(git log --diff-filter=D --format=%s -- $SITE | grep -q 'chore: remove archived sites/sfdy' && echo 0 || echo 1)"
}

sec_gate() {
  echo; echo "== gate =="
  cat > "$GATE_PAGE" <<'EOF'
---
import Tbd from '../components/Tbd.astro';
---
<html><body><p><Tbd id="no-such-id">gate-test-text</Tbd></p></body></html>
EOF
  build_prod; B=$?
  check "production build succeeds with unknown Tbd id" "$([ -f $DIST/index.html ] && echo 0 || echo 1)"
  P=$DIST/zz-gate-test/index.html
  check "gate page renders the slot text" "$(grep -q 'gate-test-text' $P 2>/dev/null && echo 0 || echo 1)"
  check "no class=\"tbd\" in gate page" "$(grep -q 'class="tbd' $P 2>/dev/null && echo 1 || echo 0)"
  rm -f "$GATE_PAGE"
  check "gate page removed from source" "$([ ! -e $GATE_PAGE ] && echo 0 || echo 1)"
}

sec_prod() {
  echo; echo "== prod =="
  build_prod
  check "production build output exists" "$([ -f $DIST/index.html ] && echo 0 || echo 1)"
  check "no open-points route" "$([ ! -e $DIST/open-points ] && echo 0 || echo 1)"
  check "no internal strings in dist" "$(grep -rIliE 'open-points|internal review|tbd-pill|data-points=|class="tbd|noindex' $DIST | grep -q . && echo 1 || echo 0)"
  check "no robots meta in index.html" "$(grep -q 'name="robots"' $DIST/index.html && echo 1 || echo 0)"
  check ".nojekyll present" "$([ -f $DIST/.nojekyll ] && echo 0 || echo 1)"
  check "no CNAME (workflow writes it)" "$([ ! -e $DIST/CNAME ] && echo 0 || echo 1)"
  check "no robots.txt (workflow writes it)" "$([ ! -e $DIST/robots.txt ] && echo 0 || echo 1)"
  check "no /WebsiteMocker string in dist" "$(grep -rIl '/WebsiteMocker' $DIST | grep -q . && echo 1 || echo 0)"
  check "/jobs says Coming soon" "$(grep -qi 'Coming soon' $DIST/jobs/index.html && echo 0 || echo 1)"
  SID=$(grep -o '"scriptId": *"[^"]*"' $SITE/wiring.json | head -1 | sed 's/.*: *"\(.*\)"/\1/')
  check "production Plausible script id in index.html" "$([ -n "$SID" ] && grep -q "$SID" $DIST/index.html && echo 0 || echo 1)"
  mkdir -p _staging/phase12 && rm -rf _staging/phase12/prod-dist && cp -R $DIST _staging/phase12/prod-dist
}

sec_sandbox() {
  echo; echo "== sandbox =="
  build_sandbox
  check "sandbox build has /open-points" "$([ -f $DIST/open-points/index.html ] && echo 0 || echo 1)"
  check "sandbox build keeps noindex" "$(grep -q noindex $DIST/index.html && echo 0 || echo 1)"
  check "sandbox build keeps tbd-pill" "$(grep -q tbd-pill $DIST/index.html && echo 0 || echo 1)"
}

sec_ident() {
  echo; echo "== ident =="
  W=$SITE/wiring.json
  check "prod_repo is pbau3r-sfdy/starflight-dynamics" "$([ "$(jq -r .prod_repo $W)" = "pbau3r-sfdy/starflight-dynamics" ] && echo 0 || echo 1)"
  check "domain is www.starflight-dynamics.com" "$([ "$(jq -r .domain $W)" = "www.starflight-dynamics.com" ] && echo 0 || echo 1)"
  check "stage >= 5" "$([ "$(jq -r .stage $W)" -ge 5 ] && echo 0 || echo 1)"
  check "name is Starflight Dynamics" "$([ "$(jq -r .name $W)" = "Starflight Dynamics" ] && echo 0 || echo 1)"
  check "sandboxUsesProdId absent" "$([ "$(jq -r '.analytics.sandboxUsesProdId // "absent"' $W)" = "absent" ] && echo 0 || echo 1)"
  check "sfdy is the only owner of the prod repo" "$([ "$(grep -l '"prod_repo": "pbau3r-sfdy/starflight-dynamics"' sites/*/wiring.json)" = "$W" ] && echo 0 || echo 1)"
  check "sfdy is the only owner of the domain" "$([ "$(grep -l '"domain": "www.starflight-dynamics.com"' sites/*/wiring.json)" = "$W" ] && echo 0 || echo 1)"
  check "sfdy-alt-clean has no prod_repo/domain" "$(jq -e '(.prod_repo // .domain) == null and .archived == true' sites/sfdy-alt-clean/wiring.json >/dev/null && echo 0 || echo 1)"
  check "no hand-set last_deploy while stage < 6" "$(jq -e 'if .stage < 6 then (.last_deploy == null) else true end' $W >/dev/null && echo 0 || echo 1)"
  node _scripts/check-analytics-gate.mjs $SLUG --live >/dev/null 2>&1; check "check-analytics-gate sfdy --live" "$?"
  node _scripts/validate-brand.mjs >/dev/null 2>&1; check "validate-brand" "$?"
}

sec_sync() {
  echo; echo "== sync =="
  S=_scripts/sync-content.sh
  FX=_staging/phase12/sync-fixture
  rm -rf "$FX"; mkdir -p "$FX/wm/sites/sfdy/src/content/news" "$FX/wm/sites/sfdy/src/content/blog" "$FX/prod/content/news" "$FX/prod/content/blog" "$FX/prod/content/jobs"
  echo a > "$FX/prod/content/news/a.md"; echo b > "$FX/prod/content/blog/b.md"; echo j > "$FX/prod/content/jobs/j.md"
  echo x > "$FX/prod/content/news/.gitkeep"; echo y > "$FX/prod/content/news/n.txt"
  echo s > "$FX/outside.md"; ln -s ../../../outside.md "$FX/prod/content/news/link.md"
  echo keep > "$FX/wm/sites/sfdy/src/content/news/existing.md"
  [ -f $S ]; check "sync-content.sh exists" "$?"
  OUT=$(bash $S sfdy "$FX/prod" "$FX/wm" 2>&1); check "sync run exits 0" "$?"
  D=$FX/wm/sites/sfdy/src/content
  check "news/a.md copied" "$([ -f $D/news/a.md ] && echo 0 || echo 1)"
  check "blog/b.md copied" "$([ -f $D/blog/b.md ] && echo 0 || echo 1)"
  check "jobs/j.md skipped (no collection)" "$([ ! -e $D/jobs/j.md ] && echo 0 || echo 1)"
  check "skip log line printed" "$(echo "$OUT" | grep -qF 'skipped (no jobs collection in sfdy): jobs/j.md' && echo 0 || echo 1)"
  check ".gitkeep, .txt and symlink ignored" "$([ ! -e $D/news/.gitkeep ] && [ ! -e $D/news/n.txt ] && [ ! -e $D/news/link.md ] && echo 0 || echo 1)"
  check "additive: existing file kept" "$([ -f $D/news/existing.md ] && echo 0 || echo 1)"
  mkdir -p $D/jobs; bash $S sfdy "$FX/prod" "$FX/wm" >/dev/null 2>&1
  check "jobs copied once collection dir exists" "$([ -f $D/jobs/j.md ] && echo 0 || echo 1)"
  bash $S 'Bad/Slug' "$FX/prod" "$FX/wm" >/dev/null 2>&1; check "bad slug rejected" "$([ $? != 0 ] && echo 0 || echo 1)"
  bash $S '../x' "$FX/prod" "$FX/wm" >/dev/null 2>&1; check "traversal slug rejected" "$([ $? != 0 ] && echo 0 || echo 1)"
  check "workflow calls sync-content.sh" "$(grep -q sync-content.sh .github/workflows/content-sync.yml && echo 0 || echo 1)"
  check "content-ci template keeps {{SLUG}}" "$(grep -q '{{SLUG}}' _templates/.github/workflows/content-ci.yml && echo 0 || echo 1)"
  check "init-prod-repo.mjs has no hard-coded sfdy-alt-clean" "$(grep -q 'sfdy-alt-clean' _scripts/init-prod-repo.mjs && echo 1 || echo 0)"
}

sec_sync_live() {
  echo; echo "== sync-live =="
  Y=$(gh api repos/pbau3r-sfdy/starflight-dynamics/contents/.github/workflows/content-ci.yml --jq .content 2>/dev/null | base64 -d 2>/dev/null)
  check "live content-ci.yml dispatches slug sfdy" "$(echo "$Y" | grep -q '"slug": "sfdy"' && echo 0 || echo 1)"
  check "live content-ci.yml free of sfdy-alt-clean" "$(echo "$Y" | grep -q 'sfdy-alt-clean' && echo 1 || echo 0)"
  check "content-ci template keeps {{SLUG}}" "$(grep -q '{{SLUG}}' _templates/.github/workflows/content-ci.yml && echo 0 || echo 1)"
  check "no sync test file in sites/sfdy content" "$(git ls-files $SITE/src/content | grep -q zz-sync-test && echo 1 || echo 0)"
  P=$(gh api repos/pbau3r-sfdy/starflight-dynamics/contents/content/news/zz-sync-test.md 2>&1 || true)
  check "no sync test file in prod repo" "$(echo "$P" | grep -q 'Not Found' && echo 0 || echo 1)"
}

sec_live() {
  echo; echo "== live =="
  REPO_P=repos/pbau3r-sfdy/starflight-dynamics
  code() { curl -s -o /dev/null -w '%{http_code}' "$1"; }
  for pg in "" about capabilities contact privacy-policy imprint jobs news press; do
    pu="$PROD_URL/$pg"; [ -n "$pg" ] && pu="$pu/"
    check "GET /$pg is 200" "$([ "$(code "$pu")" = 200 ] && echo 0 || echo 1)"
  done
  N=$(curl -s "$PROD_URL/nonexistent-xyz"); check "nonexistent path is 404" "$([ "$(code "$PROD_URL/nonexistent-xyz")" = 404 ] && echo 0 || echo 1)"
  check "404 page has the 404 event" "$(echo "$N" | grep -q "plausible('404'\|plausible(\"404\"" && echo 0 || echo 1)"
  R=$(curl -s "$PROD_URL/robots.txt")
  check "robots.txt has Allow: /" "$(echo "$R" | grep -q 'Allow: /' && echo 0 || echo 1)"
  check "robots.txt has no Disallow: /" "$(echo "$R" | grep -qE 'Disallow: /[[:space:]]*$' && echo 1 || echo 0)"
  # CDN (max-age=600) may serve a stale page: retry the home page checks.
  H=""; OKH=1
  for i in 1 2 3 4 5 6; do
    H=$(curl -s -H 'Cache-Control: no-cache' "$PROD_URL/?v=$RANDOM")
    if echo "$H" | grep -q 'plausible.io/js/pa-' && ! echo "$H" | grep -qiE 'noindex|open-points|internal review'; then OKH=0; break; fi
    sleep 15
  done
  check "home: no noindex/open-points/internal review, has production Plausible script" "$OKH"
  CSS=$(echo "$H" | grep -o '/_astro/[^"'"'"' )]*\.css' | head -1)
  check "_astro css returns 200" "$([ -n "$CSS" ] && [ "$(code "$PROD_URL$CSS")" = 200 ] && echo 0 || echo 1)"
  check "http redirects to https" "$(curl -sI http://www.starflight-dynamics.com/ | grep -i '^location:' | grep -qi 'https://' && echo 0 || echo 1)"
  A=$(curl -sI -o /dev/null -w '%{http_code} %{redirect_url}' https://starflight-dynamics.com/ 2>/dev/null)
  echo "  INFO  apex redirect (A4): $A"
  PG=$(gh api $REPO_P/pages 2>/dev/null)
  check "pages cname www.starflight-dynamics.com" "$([ "$(echo "$PG" | jq -r .cname)" = www.starflight-dynamics.com ] && echo 0 || echo 1)"
  check "pages https_enforced" "$([ "$(echo "$PG" | jq -r .https_enforced)" = true ] && echo 0 || echo 1)"
  T=$(gh api "$REPO_P/git/trees/gh-pages" --jq '.tree[].path' 2>/dev/null)
  check "gh-pages tree has CNAME" "$(echo "$T" | grep -qx CNAME && echo 0 || echo 1)"
  check "gh-pages tree has .nojekyll" "$(echo "$T" | grep -qx .nojekyll && echo 0 || echo 1)"
  check "gh-pages tree has no open-points" "$(echo "$T" | grep -q open-points && echo 1 || echo 0)"
  BB=${BACKUP_BRANCH:-$(cat .planning/phases/12-sfdy-cutover/.backup-branch 2>/dev/null)}
  BS=$(gh api "$REPO_P/branches/$BB" --jq .commit.sha 2>/dev/null)
  check "backup branch sha equals BACKUP_SHA" "$([ -n "${BACKUP_SHA:-}" ] && [ -n "$BS" ] && [ "$BS" = "$BACKUP_SHA" ] && echo 0 || echo 1)"
  W=$SITE/wiring.json
  LD=$(jq -r .last_deploy $W)
  check "wiring stage is 6" "$([ "$(jq -r .stage $W)" = 6 ] && echo 0 || echo 1)"
  OKD=1
  for d in "$(date -u +%Y-%m-%d)" "$(date +%Y-%m-%d)" "$(date -u -v-1d +%Y-%m-%d 2>/dev/null || date -u -d yesterday +%Y-%m-%d)"; do [ "$LD" = "$d" ] && OKD=0; done
  check "wiring last_deploy is today or one day earlier" "$OKD"
}

skip() { echo; echo "== $1 =="; echo "  SKIP (not implemented yet)"; }

case "${1:-all}" in
  rename) sec_rename ;;
  old) sec_old ;;
  gate) sec_gate ;;
  prod) sec_prod ;;
  sandbox) sec_sandbox ;;
  ident) sec_ident ;;
  sync) sec_sync ;;
  sync-live) sec_sync_live ;;
  live) sec_live ;;
  all) sec_rename; sec_old; sec_gate; sec_prod; sec_sandbox; sec_ident; sec_sync ;;
  *) echo "usage: $0 [rename|old|gate|prod|sandbox|ident|sync|sync-live|live|all]" >&2; exit 2 ;;
esac

echo; echo "Result: $PASS passed, $FAIL failed"
[ $FAIL = 0 ]

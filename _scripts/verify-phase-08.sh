#!/usr/bin/env bash
# verify-phase-08.sh — Structural verification for Phase 8: Cleanup & Verification
# Usage: bash _scripts/verify-phase-08.sh [hsk01|hsk02|hsk03|dexp|all]
# Exit codes: 0 = all selected checks pass, 1 = one or more failures, 2 = invalid argument

set -euo pipefail
PASS=0
FAIL=0

check() {
  local label="$1"
  local result="$2"
  if [ "$result" = "0" ]; then
    echo "  PASS  $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $label"
    FAIL=$((FAIL + 1))
  fi
}

# count_in FILE PATTERN — number of non-comment lines matching PATTERN (always exits 0)
# Uses -- to prevent patterns starting with - from being parsed as flags (ugrep/BSD grep)
count_in() {
  local file="$1" pattern="$2" n
  n=$(grep -v -- '^\s*#' "$file" 2>/dev/null | grep -F -- "$pattern" 2>/dev/null | wc -l) || n=0
  echo "${n//[[:space:]]/}"
}

# count_re FILE PATTERN — like count_in but treats PATTERN as an extended regex
count_re() {
  local file="$1" pattern="$2" n
  n=$(grep -v -- '^\s*#' "$file" 2>/dev/null | grep -E -- "$pattern" 2>/dev/null | wc -l) || n=0
  echo "${n//[[:space:]]/}"
}

SECTION="${1:-all}"

want() {
  [ "$SECTION" = "all" ] || [ "$SECTION" = "$1" ]
}

case "$SECTION" in
  hsk01|hsk02|hsk03|dexp|all) ;;
  *) echo "Usage: bash _scripts/verify-phase-08.sh [hsk01|hsk02|hsk03|dexp|all]" >&2; exit 2 ;;
esac

echo "Phase 8: Cleanup & Verification — Structural Verification"
echo "=========================================================="

if want "hsk01"; then
  echo ""
  echo "── HSK-01: crestworks routes, content, and shared tokens ──"

  layout="sites/crestworks/src/layouts/Layout.astro"
  for token in "--accent:" "--border-subtle:" "--gutter:" "--text-muted:" "--font-display:"; do
    count=$(count_in "$layout" "$token")
    [ "$count" -ge 1 ] && R=0 || R=1
    check "crestworks Layout: $token present" "$R"
  done

  for collection in jobs announcements blog; do
    for page in "index.astro" "[slug].astro"; do
      file="sites/crestworks/src/pages/$collection/$page"
      test -f "$file" && R=0 || R=1
      check "$file exists" "$R"

      count=$(count_in "$file" "import Nav from '../../components/Nav.astro'")
      [ "$count" -ge 1 ] && R=0 || R=1
      check "$file: Nav import present" "$R"

      count=$(count_in "$file" "import Footer from '../../components/Footer.astro'")
      [ "$count" -ge 1 ] && R=0 || R=1
      check "$file: Footer import present" "$R"
    done
  done

  count=$(count_in sites/crestworks/src/pages/jobs/index.astro "open !== false")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "crestworks jobs: open-only filter present" "$R"

  count=$(count_in sites/crestworks/src/pages/blog/index.astro "repeat(auto-fill, minmax(280px, 1fr))")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "crestworks blog: responsive card grid present" "$R"

  for spec in \
    "jobs:_core/src/components/JobCard.astro" \
    "announcements:_core/src/components/AnnouncementCard.astro" \
    "blog:_core/src/components/BlogCard.astro"; do
    collection="${spec%%:*}"
    component="${spec#*:}"
    count=$(count_in "sites/crestworks/src/pages/$collection/index.astro" "$component")
    [ "$count" -ge 1 ] && R=0 || R=1
    check "crestworks $collection: shared card import present" "$R"
  done

  for collection in jobs announcements blog; do
    count=0
    count=$(find "sites/crestworks/src/content/$collection" -maxdepth 1 -type f -name '*.md' 2>/dev/null | wc -l | tr -d ' ') || count=0
    [ "$count" -eq 1 ] && R=0 || R=1
    check "crestworks $collection: exactly one Markdown stub" "$R"
  done

  for route in /jobs /announcements /blog; do
    count=$(count_in sites/crestworks/src/components/Nav.astro "$route")
    [ "$count" -eq 0 ] && R=0 || R=1
    check "crestworks Nav: $route absent (D-06)" "$R"
  done
fi

if want "hsk02"; then
  echo ""
  echo "── HSK-02: accent token propagation ──"

  count=$(count_in _core/src/pages/index.astro "#384AD3")
  [ "$count" -eq 0 ] && R=0 || R=1
  check "_core newsletter: hardcoded #384AD3 absent" "$R"

  count=$(count_in _core/src/pages/index.astro "background: var(--accent); color: #fff;")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "_core newsletter: accent token present" "$R"

  # sites/sfdy/ is archived: true in wiring.json, excluded from CI builds, and deliberately skipped.
  for site in sfdy-alt-clean mogwai-systems parrot-capital crestworks; do
    count=0
    count=$(grep -RF --include='*.astro' --include='*.css' -l -- '#384AD3' "sites/$site/src" 2>/dev/null | wc -l | tr -d ' ') || count=0
    [ "$count" -eq 0 ] && R=0 || R=1
    check "$site: hardcoded #384AD3 absent from active source" "$R"
  done
fi

if want "hsk03"; then
  echo ""
  echo "── HSK-03: scaffold env-var config ──"

  config="_core/astro.config.mjs"
  for pattern in "process.env.SITE_URL" "process.env.SITE_BASE" "{{SITE_SLUG}}"; do
    count=$(count_in "$config" "$pattern")
    [ "$count" -ge 1 ] && R=0 || R=1
    check "_core config: $pattern present" "$R"
  done

  count=$(count_re "$config" 'site:\s*SITE_URL')
  [ "$count" -ge 1 ] && R=0 || R=1
  check "_core config: SITE_URL wired into defineConfig" "$R"

  count=$(count_re "$config" 'base:\s*SITE_BASE')
  [ "$count" -ge 1 ] && R=0 || R=1
  check "_core config: SITE_BASE wired into defineConfig" "$R"

  count=$(count_re "$config" "site:\s*'https://")
  [ "$count" -eq 0 ] && R=0 || R=1
  check "_core config: no hardcoded site literal in defineConfig" "$R"
fi

if want "dexp"; then
  echo ""
  echo "── DEXP-04/05/06: verification records ──"

  verification=".planning/phases/02-content-system/02-VERIFICATION.md"
  count=$(count_in "$verification" "status: verified")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "Phase 2 verification: status verified" "$R"

  count=$(count_in "$verification" "human_needed")
  [ "$count" -eq 0 ] && R=0 || R=1
  check "Phase 2 verification: human_needed absent" "$R"

  for spec in \
    ".planning/phases/04-collaboration-infrastructure/04-VALIDATION.md:Phase 4" \
    ".planning/phases/05-design-artifact-ingestion/05-VALIDATION.md:Phase 5"; do
    file="${spec%%:*}"
    label="${spec#*:}"
    test -f "$file" && R=0 || R=1
    check "$label validation record exists" "$R"
    count=$(count_in "$file" "nyquist_compliant: true")
    [ "$count" -ge 1 ] && R=0 || R=1
    check "$label validation: Nyquist compliant" "$R"
  done

  test -f _scripts/verify-phase-05.sh && R=0 || R=1
  check "Phase 5 verification harness exists" "$R"
  test -x _scripts/verify-phase-05.sh && R=0 || R=1
  check "Phase 5 verification harness is executable" "$R"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "════════════════════════════════════════════════════════════════"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1

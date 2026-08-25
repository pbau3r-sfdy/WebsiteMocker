#!/usr/bin/env bash
# verify-phase-05.sh — Structural verification for Phase 5: Design Artifact Ingestion
# Consolidated from PLAN verify blocks (05-01-PLAN.md through 05-03-PLAN.md)
# Usage: bash _scripts/verify-phase-05.sh [01|02|03|all]
# Exit code: 0 = all (selected) pass, 1 = one or more failures

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

# count_re_js FILE PATTERN — strips JS // comments, extended regex match
count_re_js() {
  local file="$1" pattern="$2" n
  n=$(grep -v -- '^\s*//' "$file" 2>/dev/null | grep -E -- "$pattern" 2>/dev/null | wc -l) || n=0
  echo "${n//[[:space:]]/}"
}

SECTION="${1:-all}"
case "$SECTION" in
  01|02|03|all) ;;
  *) echo "Usage: bash _scripts/verify-phase-05.sh [01|02|03|all]" >&2; exit 1 ;;
esac

want() {
  [ "$SECTION" = "all" ] || [ "$SECTION" = "$1" ]
}

SCRIPT="_scripts/ingest-artifact.mjs"
SKILL=".claude/skills/wm-ingest.md"

# Trap-based cleanup: track mktemp files and remove on exit regardless of how the script ends
_TMPFILES=()
mktemp_tracked() { local f; f=$(mktemp); _TMPFILES+=("$f"); echo "$f"; }
trap 'rm -f "${_TMPFILES[@]+"${_TMPFILES[@]}"}" 2>/dev/null || true' EXIT

echo "Phase 5: Design Artifact Ingestion — Structural Verification"
echo "============================================================"

if want "01"; then
  echo ""
  echo "── Plan 01: Script scaffold and full-site write mode ──"

  test -f "$SCRIPT" && R=0 || R=1
  check "ingest-artifact.mjs exists" "$R"

  node --check "$SCRIPT" >/dev/null 2>&1 && R=0 || R=1
  check "ingest-artifact.mjs passes node --check" "$R"

  for helper in extractSections extractStyleCSS extractScopedCSS extractGoogleFontsLinks extractImages decodeBase64 rewriteLocalPaths convertLinkedStylesheets toAstroComponent writeSectionMode toPascalCase walkTree; do
    count=$(count_re_js "$SCRIPT" "function ${helper}\\(")
    [ "$count" -ge 1 ] && R=0 || R=1
    check "ingest-artifact.mjs defines ${helper}()" "$R"
  done

  count=$(count_in "$SCRIPT" "--mode docs|full|section")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "usage advertises --mode docs|full|section" "$R"
fi

if want "02"; then
  echo ""
  echo "── Plan 02/03: Mode routing and safety guarantees ──"

  for key in sections artifactVars existingVars collisions googleFontsLinks images base64Images; do
    count=$(count_re_js "$SCRIPT" "${key}[[:space:]]*[:,]")
    [ "$count" -ge 1 ] && R=0 || R=1
    check "--analyze JSON includes ${key}" "$R"
  done

  count=$(count_in "$SCRIPT" "if (modeArg === 'section')")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "section-mode routing guard present" "$R"

  section_body=$(mktemp_tracked)
  sed -n '/^function writeSectionMode/,/^}/p' "$SCRIPT" > "$section_body"
  count=$(count_re "$section_body" "['\"]pages['\"]")
  [ "$count" -eq 0 ] && R=0 || R=1
  check "writeSectionMode body contains no pages path" "$R"

  # The third pattern matches the literal string used in ingest-artifact.mjs's ok() call
  # (line ~815: ok('astro.config.mjs: injected SITE_URL/SITE_BASE env var pattern')).
  # It is intentional — the check verifies that success message is present in the script.
  for pattern in SITE_URL SITE_BASE "injected SITE_URL/SITE_BASE env var pattern"; do
    count=$(count_in "$SCRIPT" "$pattern")
    [ "$count" -ge 1 ] && R=0 || R=1
    check "INGEST-02 config guard contains ${pattern}" "$R"
  done

  count=$(count_in "$SCRIPT" '(_match, path) => `url(\`\${b}')
  [ "$count" -ge 1 ] && R=0 || R=1
  check "CSS url() paths use BASE_URL template rewriting" "$R"

  for helper in rewriteLocalPaths extractScopedCSS; do
    count=$(count_re_js "$SCRIPT" "${helper}\\(")
    [ "$count" -ge 2 ] && R=0 || R=1
    check "write flow references ${helper}()" "$R"
  done

  count=$(count_in "$SCRIPT" 'Nav/Footer overwrite protection')
  [ "$count" -ge 1 ] && R=0 || R=1
  check "Nav/Footer overwrite protection present" "$R"

  count=$(count_in "$SCRIPT" "if (modeArg !== 'full' && modeArg !== 'section' && modeArg !== 'docs')")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "unknown-mode guard present" "$R"

  analyze_output=$(mktemp_tracked)
  if node "$SCRIPT" sfdy-alt-clean --analyze > "$analyze_output" 2>/dev/null &&
    node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); process.exit(j.sections.length > 0 && j.collisions.length > 0 ? 0 : 1)" "$analyze_output"; then R=0; else R=1; fi
  check "--analyze emits valid JSON with sections and collisions" "$R"

  dry_output=$(mktemp_tracked)
  node "$SCRIPT" sfdy-alt-clean --mode section --section hero --dry-run > "$dry_output" 2>&1 && R=0 || R=1
  check "section dry-run exits 0" "$R"
  count=$(count_in "$dry_output" "would write Hero.astro")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "section dry-run reports would write Hero.astro" "$R"
  test ! -f sites/sfdy-alt-clean/src/components/Hero.astro && R=0 || R=1
  check "section dry-run leaves Hero.astro absent" "$R"
fi

if want "03"; then
  echo ""
  echo "── Plan 02: Operator skill surface ──"

  test -f "$SKILL" && R=0 || R=1
  check "wm-ingest.md exists" "$R"

  grep -Fq -- "## Steps" "$SKILL" && R=0 || R=1
  check "wm-ingest.md contains Steps heading" "$R"

  count=$(awk '/^###[[:space:]]+[1-9][0-9]*\./ { n++ } END { print n+0 }' "$SKILL")
  [ "$count" -ge 7 ] && R=0 || R=1
  check "wm-ingest.md contains at least 7 numbered steps" "$R"

  count=$(count_in "$SKILL" "Do NOT proceed to Step 5 until the operator explicitly types")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "wm-ingest.md contains mandatory collision gate" "$R"

  count=$(count_in "$SKILL" "_scripts/ingest-artifact.mjs")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "wm-ingest.md references ingest-artifact.mjs" "$R"
fi

echo ""
echo "+--------------------------------------+"
echo "| Results: $PASS passed, $FAIL failed"
echo "+--------------------------------------+"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1

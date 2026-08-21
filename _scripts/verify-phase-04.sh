#!/usr/bin/env bash
# verify-phase-04.sh — Structural verification for Phase 4: Collaboration Infrastructure
# Consolidated from PLAN verify blocks (04-01-PLAN.md through 04-04-PLAN.md)
# Usage: bash _scripts/verify-phase-04.sh [01|02|03|04|all]
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

# Optional first positional argument selects which plan section to run.
# Accepted values: 01, 02, 03, 04, all (default).
SECTION="${1:-all}"

want() {
  [ "$SECTION" = "all" ] || [ "$SECTION" = "$1" ]
}

echo "Phase 4: Collaboration Infrastructure — Structural Verification"
echo "================================================================"

# ── Section 01: Sync receiver (COLLAB-04, COLLAB-05) ────────────────────────

if want "01"; then
  echo ""
  echo "── Plan 01: Sync receiver (COLLAB-04, COLLAB-05) ──"

  # File existence
  test -f .github/workflows/content-sync.yml && R=0 || R=1
  check "content-sync.yml exists" "$R"

  # Trigger
  count=$(count_in .github/workflows/content-sync.yml "repository_dispatch:")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "content-sync.yml: repository_dispatch: trigger present" "$R"

  count=$(count_re .github/workflows/content-sync.yml "types:.*content-updated")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "content-sync.yml: types: [content-updated] present" "$R"

  # Slug resolution step
  count=$(count_in .github/workflows/content-sync.yml "id: slug-step")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "content-sync.yml: id: slug-step step present" "$R"

  count=$(count_in .github/workflows/content-sync.yml "DISPATCH_SLUG")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "content-sync.yml: DISPATCH_SLUG env var present" "$R"

  # Injection guard: client_payload.slug must NOT appear outside DISPATCH_SLUG: or group: lines
  injection_unsafe=0
  injection_unsafe=$(grep -v '^\s*#' .github/workflows/content-sync.yml 2>/dev/null | \
    grep 'client_payload\.slug' 2>/dev/null | \
    grep -v 'DISPATCH_SLUG:\|group:' 2>/dev/null | wc -l | tr -d ' ') || injection_unsafe=0
  [ "$injection_unsafe" -eq 0 ] && R=0 || R=1
  check "content-sync.yml: client_payload.slug not interpolated in run: bodies (T-04-01)" "$R"

  # Security controls — regex literal (strip backslash escaping in grep match)
  count=0
  count=$(grep -v '^\s*#' .github/workflows/content-sync.yml 2>/dev/null | grep -F '^[a-z0-9-]+$' 2>/dev/null | wc -l | tr -d ' ') || count=0
  [ "$count" -ge 1 ] && R=0 || R=1
  check "content-sync.yml: slug regex guard ^[a-z0-9-]+$ present (T-04-01)" "$R"

  count=$(count_in .github/workflows/content-sync.yml "git clone --depth 1 --branch main")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "content-sync.yml: git clone --depth 1 --branch main present" "$R"

  count=$(count_in .github/workflows/content-sync.yml "-type f")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "content-sync.yml: find -type f present (T-04-02: excludes symlinks)" "$R"

  count=0
  count=$(grep -v '^\s*#' .github/workflows/content-sync.yml 2>/dev/null | grep -F "*.md" 2>/dev/null | wc -l | tr -d ' ') || count=0
  [ "$count" -ge 1 ] && R=0 || R=1
  check "content-sync.yml: find -name '*.md' present (T-04-02: Markdown-only)" "$R"

  # Must NOT contain cp -rT
  count=$(count_in .github/workflows/content-sync.yml "cp -rT")
  [ "$count" -eq 0 ] && R=0 || R=1
  check "content-sync.yml: cp -rT absent (would bypass security controls)" "$R"

  # Decision guards (D-A3, D-A6): sync workflow must never build or publish
  count=$(count_in .github/workflows/content-sync.yml "build-single")
  [ "$count" -eq 0 ] && R=0 || R=1
  check "content-sync.yml: build-single absent (D-A3: no build in sync)" "$R"

  count=$(count_in .github/workflows/content-sync.yml "JamesIves")
  [ "$count" -eq 0 ] && R=0 || R=1
  check "content-sync.yml: JamesIves absent (D-A3: no deploy in sync)" "$R"

  count=0
  count=$(grep -v '^\s*#' .github/workflows/content-sync.yml 2>/dev/null | grep -i 'CNAME' 2>/dev/null | wc -l | tr -d ' ') || count=0
  [ "$count" -eq 0 ] && R=0 || R=1
  check "content-sync.yml: CNAME absent (D-A3: no deploy artifact in sync)" "$R"

  count=$(count_in .github/workflows/content-sync.yml "robots.txt")
  [ "$count" -eq 0 ] && R=0 || R=1
  check "content-sync.yml: robots.txt absent (D-A3: no deploy artifact in sync)" "$R"

  # Decision guard (D-A6): publish.yml must NOT have been modified to include dispatch
  count=$(count_in .github/workflows/publish.yml "repository_dispatch")
  [ "$count" -eq 0 ] && R=0 || R=1
  check "publish.yml: repository_dispatch absent — publish.yml unchanged (D-A6)" "$R"

  count=$(count_in .github/workflows/publish.yml "client_payload")
  [ "$count" -eq 0 ] && R=0 || R=1
  check "publish.yml: client_payload absent — publish.yml unchanged (D-A6)" "$R"

  # publish.yml still has its original triggers
  count=$(count_in .github/workflows/publish.yml "workflow_dispatch")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "publish.yml: workflow_dispatch still present" "$R"

  count=$(count_re .github/workflows/publish.yml "inputs\.slug|inputs:")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "publish.yml: inputs.slug still present" "$R"

fi  # end want 01

# ── Section 02: Contributor template bundle (COLLAB-01, COLLAB-02, COLLAB-03, COLLAB-05) ──

if want "02"; then
  echo ""
  echo "── Plan 02: Contributor template bundle (COLLAB-01, COLLAB-02, COLLAB-03, COLLAB-05) ──"

  # CONTRIBUTING.md template
  test -f _templates/CONTRIBUTING.md && R=0 || R=1
  check "_templates/CONTRIBUTING.md exists" "$R"

  count=$(count_in _templates/CONTRIBUTING.md "{{SITE_NAME}}")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "_templates/CONTRIBUTING.md: {{SITE_NAME}} placeholder present" "$R"

  count=$(count_in _templates/CONTRIBUTING.md "{{PROD_REPO}}")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "_templates/CONTRIBUTING.md: {{PROD_REPO}} placeholder present" "$R"

  count=$(count_in _templates/CONTRIBUTING.md "content/")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "_templates/CONTRIBUTING.md: content/ directory reference present" "$R"

  # Decision guard (D-A7): must set expectation that content is reviewed before going live
  count=$(count_in _templates/CONTRIBUTING.md "reviewed")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "_templates/CONTRIBUTING.md: 'reviewed' language present (D-A7)" "$R"

  count=$(count_in _templates/CONTRIBUTING.md "rebuilds automatically")
  [ "$count" -eq 0 ] && R=0 || R=1
  check "_templates/CONTRIBUTING.md: 'rebuilds automatically' absent (D-A7)" "$R"

  count=$(count_in _templates/CONTRIBUTING.md "goes live automatically")
  [ "$count" -eq 0 ] && R=0 || R=1
  check "_templates/CONTRIBUTING.md: 'goes live automatically' absent (D-A7)" "$R"

  # Issue templates
  test -f _templates/.github/ISSUE_TEMPLATE/content-request.yml && R=0 || R=1
  check "_templates/.github/ISSUE_TEMPLATE/content-request.yml exists" "$R"

  test -f _templates/.github/ISSUE_TEMPLATE/design-change.yml && R=0 || R=1
  check "_templates/.github/ISSUE_TEMPLATE/design-change.yml exists" "$R"

  test -f _templates/.github/ISSUE_TEMPLATE/bug-report.yml && R=0 || R=1
  check "_templates/.github/ISSUE_TEMPLATE/bug-report.yml exists" "$R"

  test -f _templates/.github/ISSUE_TEMPLATE/config.yml && R=0 || R=1
  check "_templates/.github/ISSUE_TEMPLATE/config.yml exists" "$R"

  # Labels present in issue templates, absent from config.yml
  count=$(count_in _templates/.github/ISSUE_TEMPLATE/content-request.yml "labels:")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "_templates: content-request.yml has labels: line" "$R"

  count=$(count_in _templates/.github/ISSUE_TEMPLATE/design-change.yml "labels:")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "_templates: design-change.yml has labels: line" "$R"

  count=$(count_in _templates/.github/ISSUE_TEMPLATE/bug-report.yml "labels:")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "_templates: bug-report.yml has labels: line" "$R"

  count=$(count_in _templates/.github/ISSUE_TEMPLATE/config.yml "labels:")
  [ "$count" -eq 0 ] && R=0 || R=1
  check "_templates: config.yml has no labels: line" "$R"

  count=$(count_in _templates/.github/ISSUE_TEMPLATE/config.yml "blank_issues_enabled: false")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "_templates: config.yml has blank_issues_enabled: false" "$R"

  # content-ci.yml workflow template
  test -f _templates/.github/workflows/content-ci.yml && R=0 || R=1
  check "_templates/.github/workflows/content-ci.yml exists" "$R"

  count=$(count_in _templates/.github/workflows/content-ci.yml "peter-evans/repository-dispatch@")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "content-ci.yml: peter-evans/repository-dispatch@ action present" "$R"

  count=$(count_in _templates/.github/workflows/content-ci.yml "content-updated")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "content-ci.yml: content-updated event type present" "$R"

  count=$(count_in _templates/.github/workflows/content-ci.yml "WM_DISPATCH_PAT")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "content-ci.yml: WM_DISPATCH_PAT secret reference present" "$R"

  count=0
  count=$(grep -v '^\s*#' _templates/.github/workflows/content-ci.yml 2>/dev/null | grep -F 'content/**/*.md' 2>/dev/null | wc -l | tr -d ' ') || count=0
  [ "$count" -ge 1 ] && R=0 || R=1
  check "content-ci.yml: content/**/*.md path filter present" "$R"

  count=$(count_in _templates/.github/workflows/content-ci.yml "cancel-in-progress: true")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "content-ci.yml: cancel-in-progress: true present" "$R"

  count=$(count_in _templates/.github/workflows/content-ci.yml "WM_PUBLISH_PAT")
  [ "$count" -eq 0 ] && R=0 || R=1
  check "content-ci.yml: WM_PUBLISH_PAT absent (wrong secret — should be WM_DISPATCH_PAT)" "$R"

fi  # end want 02

# ── Section 03: Installer script (COLLAB-04, COLLAB-03) ─────────────────────

if want "03"; then
  echo ""
  echo "── Plan 03: Installer script (COLLAB-04, COLLAB-03) ──"

  test -f _scripts/init-prod-repo.mjs && R=0 || R=1
  check "_scripts/init-prod-repo.mjs exists" "$R"

  node --check _scripts/init-prod-repo.mjs > /dev/null 2>&1 && R=0 || R=1
  check "_scripts/init-prod-repo.mjs: node --check passes (syntax valid)" "$R"

  # Required content (strip JS // comments)
  count=$(count_re_js _scripts/init-prod-repo.mjs '\-\-confirm')
  [ "$count" -ge 1 ] && R=0 || R=1
  check "_scripts/init-prod-repo.mjs: --confirm flag present" "$R"

  count=$(count_re_js _scripts/init-prod-repo.mjs 'gh label create')
  [ "$count" -ge 1 ] && R=0 || R=1
  check "_scripts/init-prod-repo.mjs: gh label create present" "$R"

  count=$(count_re_js _scripts/init-prod-repo.mjs '\-\-default-branch main')
  [ "$count" -ge 1 ] && R=0 || R=1
  check "_scripts/init-prod-repo.mjs: --default-branch main present" "$R"

  count=$(count_re_js _scripts/init-prod-repo.mjs 'git checkout --orphan')
  [ "$count" -ge 1 ] && R=0 || R=1
  check "_scripts/init-prod-repo.mjs: git checkout --orphan present" "$R"

  count=$(count_re_js _scripts/init-prod-repo.mjs 'WM_DISPATCH_PAT')
  [ "$count" -ge 1 ] && R=0 || R=1
  check "_scripts/init-prod-repo.mjs: WM_DISPATCH_PAT reference present" "$R"

  # Dry-run behaviour: no --confirm → exits 0 and output mentions DRY
  node _scripts/init-prod-repo.mjs mogwai-systems > /dev/null 2>&1 && R=0 || R=1
  check "_scripts/init-prod-repo.mjs mogwai-systems: exits 0 in dry-run" "$R"

  DRY_OUT=$(node _scripts/init-prod-repo.mjs mogwai-systems 2>&1 || true)
  echo "$DRY_OUT" | grep -qi 'dry' && R=0 || R=1
  check "_scripts/init-prod-repo.mjs mogwai-systems: output mentions DRY (dry-run mode)" "$R"

  # No slug → exits non-zero
  node _scripts/init-prod-repo.mjs > /dev/null 2>&1 && R=1 || R=0
  check "_scripts/init-prod-repo.mjs: no slug → exits non-zero" "$R"

  # parrot-capital output does not contain 'undefined'
  PC_OUT=$(node _scripts/init-prod-repo.mjs parrot-capital 2>&1 || true)
  echo "$PC_OUT" | grep -q 'undefined' && R=1 || R=0
  check "_scripts/init-prod-repo.mjs parrot-capital: output does not contain 'undefined'" "$R"

fi  # end want 03

# ── Section 04: Operator interface and docs (COLLAB-01, COLLAB-05) ──────────

if want "04"; then
  echo ""
  echo "── Plan 04: Operator interface and docs (COLLAB-01, COLLAB-05) ──"

  test -f .claude/skills/wm-init-collab.md && R=0 || R=1
  check ".claude/skills/wm-init-collab.md exists" "$R"

  count=$(count_in .claude/skills/wm-init-collab.md "WM_DISPATCH_PAT")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "wm-init-collab.md: WM_DISPATCH_PAT reference present" "$R"

  count=$(count_in .claude/skills/wm-init-collab.md "init-prod-repo.mjs")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "wm-init-collab.md: init-prod-repo.mjs reference present" "$R"

  count=$(count_in .claude/skills/wm-init-collab.md "gh secret set")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "wm-init-collab.md: gh secret set step present" "$R"

  count=$(count_in .claude/skills/wm-publish.md "content-sync")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "wm-publish.md: content-sync reference present" "$R"

  count=$(count_in CLAUDE.md "init-prod-repo.mjs")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "CLAUDE.md: init-prod-repo.mjs reference present" "$R"

  count=$(count_in CLAUDE.md "wm-init-collab")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "CLAUDE.md: wm-init-collab reference present" "$R"

  count=$(count_in AGENTS.md "WM_DISPATCH_PAT")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "AGENTS.md: WM_DISPATCH_PAT reference present" "$R"

  count=$(count_in AGENTS.md "content-sync.yml")
  [ "$count" -ge 1 ] && R=0 || R=1
  check "AGENTS.md: content-sync.yml reference present" "$R"

fi  # end want 04

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "════════════════════════════════════════════════════════════════"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1

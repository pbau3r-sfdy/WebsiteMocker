#!/usr/bin/env bash
# verify-phase-01.sh — Structural verification for Phase 1: Production Deploy Pipeline
# Consolidated from PLAN verify blocks (01-01-PLAN.md, 01-02-PLAN.md)
# Usage: bash _scripts/verify-phase-01.sh
# Exit code: 0 = all pass, 1 = one or more failures

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

echo "Phase 1: Production Deploy Pipeline — Structural Verification"
echo "=============================================================="

echo ""
echo "── build-single.mjs (DEPLOY-02, DEPLOY-06) ──"

OUT=$(node _scripts/build-single.mjs 2>&1 || true); echo "$OUT" | grep -q "Usage:" && R=0 || R=1
check "no-arg: prints usage message and exits non-zero" "$R"
OUT=$(node _scripts/build-single.mjs no-such-site-xyz 2>&1 || true); echo "$OUT" | grep -q "not found in sites" && R=0 || R=1
check "unknown-slug: prints 'not found in sites/' and exits non-zero" "$R"
! node _scripts/build-single.mjs no-such-site-xyz > /dev/null 2>&1 && R=0 || R=1
check "unknown-slug: exits with non-zero exit code" "$R"

echo ""
echo "── publish.yml (DEPLOY-02 through DEPLOY-08) ──"

grep -q "workflow_dispatch" .github/workflows/publish.yml && R=0 || R=1
check "workflow_dispatch trigger present" "$R"
grep -q 'group: publish-\${{' .github/workflows/publish.yml && R=0 || R=1
check "concurrency group per-slug present" "$R"
grep -q "cancel-in-progress: false" .github/workflows/publish.yml && R=0 || R=1
check "cancel-in-progress: false (no dropped deploys)" "$R"
grep -q "WM_PUBLISH_PAT" .github/workflows/publish.yml && R=0 || R=1
check "WM_PUBLISH_PAT used (not GITHUB_TOKEN)" "$R"
! grep -q 'secrets\.GITHUB_TOKEN\|token:.*GITHUB_TOKEN' .github/workflows/publish.yml && R=0 || R=1
check "GITHUB_TOKEN not used as deploy token" "$R"
grep -q 'JamesIves/github-pages-deploy-action' .github/workflows/publish.yml && R=0 || R=1
check "JamesIves deploy action present (DEPLOY-08)" "$R"
# Validate step appears before Build step (DEPLOY-02: validate before build)
VALIDATE_LINE=$(grep -n "Read and validate wiring.json" .github/workflows/publish.yml | head -1 | cut -d: -f1)
BUILD_LINE=$(grep -n "Build site" .github/workflows/publish.yml | head -1 | cut -d: -f1)
[ -n "$VALIDATE_LINE" ] && [ -n "$BUILD_LINE" ] && [ "$VALIDATE_LINE" -lt "$BUILD_LINE" ] && R=0 || R=1
check "validate-wiring step (line $VALIDATE_LINE) before build step (line $BUILD_LINE) (DEPLOY-02)" "$R"
grep -q 'stage < 5' .github/workflows/publish.yml && R=0 || R=1
check "stage<5 guard exits before build (DEPLOY-02)" "$R"
grep -q '!w\.domain\|domain missing' .github/workflows/publish.yml && R=0 || R=1
check "missing-domain guard present (DEPLOY-02)" "$R"
grep -q '!w\.prod_repo\|prod_repo missing' .github/workflows/publish.yml && R=0 || R=1
check "missing-prod_repo guard present (DEPLOY-02)" "$R"
grep -q 'CNAME' .github/workflows/publish.yml && R=0 || R=1
check "CNAME injection step present (DEPLOY-03)" "$R"
grep -q 'robots.txt' .github/workflows/publish.yml && R=0 || R=1
check "robots.txt swap step present (DEPLOY-04)" "$R"
grep -q 'Allow: /' .github/workflows/publish.yml && R=0 || R=1
check "robots.txt swapped to Allow (DEPLOY-04)" "$R"
grep -q 'stage.*= 6\|\.stage = 6' .github/workflows/publish.yml && R=0 || R=1
check "wiring.json stage 6 commit-back present (DEPLOY-05)" "$R"
grep -q 'SITE_URL' .github/workflows/publish.yml && R=0 || R=1
check "SITE_URL production env var set (DEPLOY-01)" "$R"
grep -q 'SITE_BASE' .github/workflows/publish.yml && R=0 || R=1
check "SITE_BASE production env var set (DEPLOY-01)" "$R"

echo ""
echo "── wm-publish.md skill (DEPLOY-01, DEPLOY-07) ──"

test -f .claude/skills/wm-publish.md && R=0 || R=1
check "wm-publish.md exists" "$R"
grep -q 'wm-preflight' .claude/skills/wm-publish.md && R=0 || R=1
check "preflight integration present (Step 2)" "$R"
grep -q 'gh workflow run publish.yml' .claude/skills/wm-publish.md && R=0 || R=1
check "gh workflow run trigger present (Step 3, DEPLOY-01)" "$R"
grep -q 'gh run watch.*--exit-status\|--exit-status' .claude/skills/wm-publish.md && R=0 || R=1
check "gh run watch --exit-status present (Step 4)" "$R"
grep -q 'log-failed' .claude/skills/wm-publish.md && R=0 || R=1
check "gh run view --log-failed failure path present (Step 6)" "$R"
grep -q '185\.199\.108\.153' .claude/skills/wm-publish.md && R=0 || R=1
check "GitHub Pages A record 185.199.108.153 in DNS guide (DEPLOY-07)" "$R"
grep -q '185\.199\.109\.153' .claude/skills/wm-publish.md && R=0 || R=1
check "GitHub Pages A record 185.199.109.153 in DNS guide" "$R"
grep -q '185\.199\.110\.153' .claude/skills/wm-publish.md && R=0 || R=1
check "GitHub Pages A record 185.199.110.153 in DNS guide" "$R"
grep -q '185\.199\.111\.153' .claude/skills/wm-publish.md && R=0 || R=1
check "GitHub Pages A record 185.199.111.153 in DNS guide" "$R"
grep -q 'pbau3r-sfdy\.github\.io' .claude/skills/wm-publish.md && R=0 || R=1
check "CNAME target pbau3r-sfdy.github.io in DNS guide (DEPLOY-07)" "$R"
grep -q 'letsencrypt' .claude/skills/wm-publish.md && R=0 || R=1
check "letsencrypt CAA note present (DEPLOY-07)" "$R"
grep -q 'SSL\|HTTPS.*redirect\|certificate' .claude/skills/wm-publish.md && R=0 || R=1
check "SSL provisioning wait warning present (DEPLOY-07)" "$R"

echo ""
echo "── placeholder cleanup ──"

! grep -rn '\[websites-org\]' CLAUDE.md AGENTS.md 2>/dev/null && R=0 || R=1
check "[websites-org] placeholder removed from CLAUDE.md and AGENTS.md" "$R"

echo ""
echo "══════════════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "══════════════════════════════════════════════════"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1

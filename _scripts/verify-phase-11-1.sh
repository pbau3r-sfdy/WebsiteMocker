#!/usr/bin/env bash
# Phase 11.1 verification: sfdy-alt-clean-reskin-2 retool (RETL-01..05).
# Builds the site with the production base, then asserts on source and built HTML.
# Usage: bash _scripts/verify-phase-11-1.sh
set -u
ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"
SITE=sites/sfdy-alt-clean-reskin-2
DIST=dist/sfdy-alt-clean-reskin-2
PASS=0; FAIL=0
check() { if [ "$2" = 0 ]; then PASS=$((PASS+1)); echo "  PASS  $1"; else FAIL=$((FAIL+1)); echo "  FAIL  $1"; fi; }
inhtml() { grep -qiE -- "$2" "$DIST/$1" && echo 0 || echo 1; }
nohtml() { grep -qiE -- "$2" "$DIST/$1" && echo 1 || echo 0; }

echo "Phase 11.1: reskin-2 retool — Verification"
echo "=========================================================="
SITE_BASE=/ node _scripts/build-single.mjs sfdy-alt-clean-reskin-2 >/dev/null 2>&1
check "site builds" "$([ -f "$DIST/index.html" ] && echo 0 || echo 1)"

echo; echo "── RETL-01: no 'Power Projection Systems' ──"
SRC_HIT=$(grep -rIlzE -i 'power[[:space:]-]+projection[[:space:]]+systems' "$SITE/src" "$SITE/wiring.json" 2>/dev/null | wc -l | tr -d ' ')
check "no 'power projection systems' in src or wiring.json" "$([ "$SRC_HIT" = 0 ] && echo 0 || echo 1)"
DIST_HIT=$(grep -rIlzE -i 'power[[:space:]-]+projection[[:space:]]+systems' "$DIST" 2>/dev/null | wc -l | tr -d ' ')
check "no 'power projection systems' in built HTML" "$([ "$DIST_HIT" = 0 ] && echo 0 || echo 1)"

echo; echo "── RETL-02: hero sentence ──"
check "hero sentence with accent span" "$(inhtml index.html 'We enable European <span[^>]*class="green"[^>]*>in-space power projection</span>\.')"

echo; echo "── RETL-03: socials and imprint unchanged ──"
for h in 'linkedin.com/company/starflight-dynamics' 'x.com/sfdy_space' 'instagram.com/starflight_dynamics' 'facebook.com/profile.php'; do
  check "footer links $h" "$(inhtml index.html "href=\"https://[a-z.]*$h")"
done
git diff --quiet 0d94909^ HEAD -- "$SITE/src/pages/imprint.astro" && R=0 || R=1
check "imprint.astro unchanged since the retool began" "$R"

echo; echo "── RETL-04: job postings removed ──"
check "no jobs content directory" "$([ ! -d "$SITE/src/content/jobs" ] && echo 0 || echo 1)"
check "no JobRow component" "$([ ! -f "$SITE/src/components/JobRow.astro" ] && echo 0 || echo 1)"
check "no jobs collection in content.config.ts" "$(grep -q "jobs" "$SITE/src/content.config.ts" && echo 1 || echo 0)"
check "no jobs detail page source" "$([ ! -f "$SITE/src/pages/jobs/[slug].astro" ] && echo 0 || echo 1)"
JOBS_HTML=$(find "$DIST/jobs" -name '*.html' 2>/dev/null | wc -l | tr -d ' ')
check "built /jobs has only the coming-soon index" "$([ "$JOBS_HTML" = 1 ] && echo 0 || echo 1)"
check "/jobs says Coming soon" "$(inhtml jobs/index.html 'Coming soon')"
check "no salary or posting markup in /jobs" "$(nohtml jobs/index.html 'salary|apply now')"

echo; echo "── RETL-05: privacy policy Web analytics section ──"
check "Web analytics section" "$(inhtml privacy-policy/index.html 'Web analytics')"
check "names Plausible" "$(inhtml privacy-policy/index.html 'Plausible Analytics')"
check "legal basis Art. 6 (1)(f) GDPR" "$(inhtml privacy-policy/index.html 'Art\. 6 \(1\)\(f\) GDPR')"
check "right to object (Art. 21)" "$(inhtml privacy-policy/index.html 'Art\. 21 GDPR')"
check "version line dated 14 October 2026" "$(inhtml privacy-policy/index.html 'Version: 14 October 2026')"

echo; echo "=========================================================="
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" = 0 ]

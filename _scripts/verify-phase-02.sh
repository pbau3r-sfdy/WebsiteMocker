#!/usr/bin/env bash
# verify-phase-02.sh — Structural verification for Phase 2: Content System
# Consolidated from PLAN verify blocks (02-01-PLAN.md through 02-09-PLAN.md)
# Usage: bash _scripts/verify-phase-02.sh
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

echo "Phase 2: Content System — Structural Verification"
echo "=================================================="

echo ""
echo "── Plan 01: Schema library + UI primitives (CONTENT-02, CONTENT-03) ──"

test -f _core/src/content.config.ts && R=0 || R=1
check "_core/src/content.config.ts exists" "$R"
count=$(grep -c "coerce.date" _core/src/content.config.ts 2>/dev/null || echo 0)
[ "$count" -ge 4 ] && R=0 || R=1
check "z.coerce.date() used in all schemas (≥4 occurrences)" "$R"
grep -q "export const newsSchema" _core/src/content.config.ts && R=0 || R=1
check "newsSchema exported" "$R"
grep -q "export const jobsSchema" _core/src/content.config.ts && R=0 || R=1
check "jobsSchema exported" "$R"
grep -q "export const announcementsSchema" _core/src/content.config.ts && R=0 || R=1
check "announcementsSchema exported" "$R"
grep -q "export const blogSchema" _core/src/content.config.ts && R=0 || R=1
check "blogSchema exported" "$R"
test ! -f _core/src/content/config.ts && R=0 || R=1
check "Astro 4 legacy _core/src/content/config.ts deleted" "$R"
test -f _core/src/components/TagPill.astro && R=0 || R=1
check "TagPill.astro exists" "$R"
grep -q "var(--border-subtle)" _core/src/components/TagPill.astro && R=0 || R=1
check "TagPill uses --border-subtle token" "$R"
grep -q "var(--accent)" _core/src/components/TagPill.astro && R=0 || R=1
check "TagPill uses --accent token" "$R"
test -f _core/src/components/TypeBadge.astro && R=0 || R=1
check "TypeBadge.astro exists" "$R"
grep -q "var(--border-strong)" _core/src/components/TypeBadge.astro && R=0 || R=1
check "TypeBadge uses --border-strong token" "$R"
grep -q "full-time\|part-time\|contract" _core/src/components/TypeBadge.astro && R=0 || R=1
check "TypeBadge has job type label mapping" "$R"

echo ""
echo "── Plan 02: _core news + jobs pages (CONTENT-05, CONTENT-06) ──"

grep -q "render(post)" "_core/src/pages/news/[slug].astro" && R=0 || R=1
check "_core news [slug]: uses render(post) — Astro 5 API" "$R"
grep -q "post\.id" "_core/src/pages/news/[slug].astro" && R=0 || R=1
check "_core news [slug]: uses post.id (not post.slug)" "$R"
grep -q "^\s*id:" _core/src/components/NewsCard.astro && R=0 || R=1
check "NewsCard: id prop (not slug)" "$R"
grep -q "<time" _core/src/pages/news/index.astro && R=0 || R=1
check "_core news index: uses <time> element" "$R"
test -f _core/src/components/JobCard.astro && R=0 || R=1
check "JobCard.astro exists" "$R"
test -f _core/src/pages/jobs/index.astro && R=0 || R=1
check "_core jobs/index.astro exists" "$R"
test -f "_core/src/pages/jobs/[slug].astro" && R=0 || R=1
check "_core jobs/[slug].astro exists" "$R"
grep -q "open !== false" _core/src/pages/jobs/index.astro && R=0 || R=1
check "_core jobs index: open-only filter applied" "$R"
grep -q "TypeBadge" _core/src/components/JobCard.astro && R=0 || R=1
check "JobCard: TypeBadge component imported" "$R"

echo ""
echo "── Plan 03: _core announcements + blog (CONTENT-07, CONTENT-08) ──"

test -f _core/src/components/AnnouncementCard.astro && R=0 || R=1
check "AnnouncementCard.astro exists" "$R"
test -f _core/src/pages/announcements/index.astro && R=0 || R=1
check "_core announcements/index.astro exists" "$R"
test -f "_core/src/pages/announcements/[slug].astro" && R=0 || R=1
check "_core announcements/[slug].astro exists" "$R"
grep -q "gap: 12px" _core/src/components/AnnouncementCard.astro && R=0 || R=1
check "AnnouncementCard: 12px gap" "$R"
grep -q "TagPill" _core/src/components/AnnouncementCard.astro && R=0 || R=1
check "AnnouncementCard: TagPill imported" "$R"
test -f _core/src/components/BlogCard.astro && R=0 || R=1
check "BlogCard.astro exists" "$R"
test -f _core/src/pages/blog/index.astro && R=0 || R=1
check "_core blog/index.astro exists" "$R"
test -f "_core/src/pages/blog/[slug].astro" && R=0 || R=1
check "_core blog/[slug].astro exists" "$R"
grep -q "auto-fill" _core/src/pages/blog/index.astro && R=0 || R=1
check "_core blog index: auto-fill grid layout" "$R"
grep -q "translateY" _core/src/components/BlogCard.astro && R=0 || R=1
check "BlogCard: translateY hover effect" "$R"
grep -q "BASE_URL" _core/src/components/AnnouncementCard.astro && R=0 || R=1
check "AnnouncementCard: BASE_URL used in href (CR-01 fix)" "$R"
grep -q "BASE_URL" _core/src/components/BlogCard.astro && R=0 || R=1
check "BlogCard: BASE_URL used in href + img src (CR-01/CR-02 fix)" "$R"
grep -q "BASE_URL" _core/src/components/JobCard.astro && R=0 || R=1
check "JobCard: BASE_URL used in href (CR-01 fix)" "$R"

echo ""
echo "── Plan 04: sfdy-alt-clean Astro 5 migration (CONTENT-01, CONTENT-05) ──"

grep -q "from '../../_core/src/content.config.ts'" sites/sfdy-alt-clean/src/content.config.ts && R=0 || R=1
check "sfdy-alt-clean: imports schemas from _core" "$R"
count=$(grep -c "loader: glob" sites/sfdy-alt-clean/src/content.config.ts 2>/dev/null || echo 0)
[ "$count" -eq 4 ] && R=0 || R=1
check "sfdy-alt-clean: exactly 4 glob() loaders" "$R"
test ! -f sites/sfdy-alt-clean/src/content/config.ts && R=0 || R=1
check "sfdy-alt-clean: legacy content/config.ts deleted" "$R"
! grep -rq "post\.slug\|post\.render\(\)" sites/sfdy-alt-clean/src/pages/news/ sites/sfdy-alt-clean/src/components/ 2>/dev/null && R=0 || R=1
check "sfdy-alt-clean: no Astro 4 API (post.slug/post.render) remaining" "$R"
test -f sites/sfdy-alt-clean/src/content/jobs/.gitkeep && R=0 || R=1
check "sfdy-alt-clean: content/jobs/.gitkeep present" "$R"

echo ""
echo "── Plan 05: mogwai-systems + parrot-capital scaffold (CONTENT-04) ──"

grep -q "from '../../_core/src/content.config.ts'" sites/mogwai-systems/src/content.config.ts && R=0 || R=1
check "mogwai-systems: imports schemas from _core" "$R"
count=$(grep -c "loader: glob" sites/mogwai-systems/src/content.config.ts 2>/dev/null || echo 0)
[ "$count" -eq 4 ] && R=0 || R=1
check "mogwai-systems: exactly 4 glob() loaders" "$R"
for dir in news jobs announcements blog; do
  test -f "sites/mogwai-systems/src/content/$dir/.gitkeep" && R=0 || R=1
  check "mogwai-systems: content/$dir/.gitkeep present" "$R"
done
grep -q "from '../../_core/src/content.config.ts'" sites/parrot-capital/src/content.config.ts && R=0 || R=1
check "parrot-capital: imports schemas from _core" "$R"
count=$(grep -c "loader: glob" sites/parrot-capital/src/content.config.ts 2>/dev/null || echo 0)
[ "$count" -eq 4 ] && R=0 || R=1
check "parrot-capital: exactly 4 glob() loaders" "$R"
test -f sites/parrot-capital/src/layouts/Layout.astro && R=0 || R=1
check "parrot-capital: Layout.astro exists" "$R"
grep -q "var(--bg-base)" sites/parrot-capital/src/layouts/Layout.astro && R=0 || R=1
check "parrot-capital: Layout uses --bg-base token" "$R"

echo ""
echo "── Plans 06-08: Per-site page routes — 8 pages × 3 sites (CONTENT-01, 05-08) ──"

for site in sfdy-alt-clean mogwai-systems parrot-capital; do
  count=0
  for page in "news/index.astro" "news/[slug].astro" "jobs/index.astro" "jobs/[slug].astro" \
              "announcements/index.astro" "announcements/[slug].astro" "blog/index.astro" "blog/[slug].astro"; do
    test -f "sites/$site/src/pages/$page" && count=$((count+1))
  done
  [ "$count" -eq 8 ] && R=0 || R=1
  check "$site: all 8 collection pages present ($count/8)" "$R"
  grep -q "open !== false" "sites/$site/src/pages/jobs/index.astro" && R=0 || R=1
  check "$site: jobs open-only filter applied" "$R"
done

echo ""
echo "── Plan 09: Content skills (CONTENT-09, CONTENT-10) ──"

for skill in wm-add-news wm-add-job wm-add-announcement wm-add-blog; do
  test -f "_core/.claude/skills/$skill.md" && R=0 || R=1
  check "$skill.md exists" "$R"
  grep -q '"YYYY-MM-DD"' "_core/.claude/skills/$skill.md" && R=0 || R=1
  check "$skill.md: quoted date format enforced" "$R"
  grep -q "git add\|git commit" "_core/.claude/skills/$skill.md" && R=0 || R=1
  check "$skill.md: git commit step present" "$R"
done

echo ""
echo "══════════════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "══════════════════════════════════════════════════"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1

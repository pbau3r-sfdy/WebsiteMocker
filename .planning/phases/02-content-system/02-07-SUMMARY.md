---
phase: 02-content-system
plan: "07"
subsystem: mogwai-systems content pages
tags: [astro, content-layer, mogwai-systems, pages]
dependency_graph:
  requires: [02-05]
  provides: [mogwai-news-pages, mogwai-jobs-pages, mogwai-announcements-pages, mogwai-blog-pages]
  affects: [mogwai-systems build]
tech_stack:
  added: []
  patterns: [Astro Content Layer API, entry.id params, standalone render(), cross-directory _core imports]
key_files:
  created:
    - sites/mogwai-systems/src/pages/news/index.astro
    - sites/mogwai-systems/src/pages/news/[slug].astro
    - sites/mogwai-systems/src/pages/jobs/index.astro
    - sites/mogwai-systems/src/pages/jobs/[slug].astro
    - sites/mogwai-systems/src/pages/announcements/index.astro
    - sites/mogwai-systems/src/pages/announcements/[slug].astro
    - sites/mogwai-systems/src/pages/blog/index.astro
    - sites/mogwai-systems/src/pages/blog/[slug].astro
  modified: []
decisions:
  - "02-07: _core component import path confirmed at 5 levels up (../../../../../_core/) matching Plan 06 correction — plan spec showed 4 levels but STATE.md deviation note takes precedence"
  - "02-07: CSS var fallbacks added (var(--border-subtle, var(--border)), var(--gutter, clamp(...))) so pages degrade gracefully until mogwai Layout adopts UI-SPEC token set in Phase 3"
metrics:
  duration: "~5 minutes"
  completed: "2026-08-20"
  tasks_completed: 2
  files_created: 8
---

# Phase 2 Plan 07: mogwai-systems Content Page Templates Summary

8 content page templates (news, jobs, announcements, blog — list + detail each) for mogwai-systems using Astro 5 Content Layer API with no Nav component.

## What Was Built

All 8 page files in `sites/mogwai-systems/src/pages/`:

| Page | Type | Notes |
|------|------|-------|
| news/index.astro | List | Row layout, sorted by date desc, lead image support, empty state |
| news/[slug].astro | Detail | Content render, back link, lead image, article max-width 760px |
| jobs/index.astro | List | Filters `open !== false`, JobCard from _core, empty state |
| jobs/[slug].astro | Detail | TypeBadge, location, department, Content render |
| announcements/index.astro | List | AnnouncementCard from _core, empty state |
| announcements/[slug].astro | Detail | TagPill, summary with accent left border |
| blog/index.astro | List | CSS grid (auto-fill minmax 280px 1fr), BlogCard from _core |
| blog/[slug].astro | Detail | Byline, TagPill, lead image, Content render |

## Verification

- `npm run build` in `sites/mogwai-systems` exits 0
- All 11 pages rendered (including 3 pre-existing legal pages + 8 new collection pages)
- No Nav imports in any mogwai page template (mogwai has no Nav component)
- blog/index.astro uses `repeat(auto-fill, minmax(280px, 1fr))` grid — not row layout
- entry.id used for all params (Astro 5 Content Layer API)
- standalone `render()` imported from `astro:content`

## Deviations from Plan

### Auto-applied Knowledge

**1. [Plan 06 Correction Applied] _core import path uses 5 levels, not 4**
- **Found during:** Task 1 setup
- **Issue:** Plan 02-07 interfaces section documented `../../../../_core/` (4 levels) but STATE.md from Plan 06 explicitly noted the correction to `../../../../../_core/` (5 levels) for pages in sites/<site>/src/pages/<collection>/
- **Fix:** Used 5-level path `../../../../../_core/src/components/` matching sfdy-alt-clean reference and STATE.md correction
- **Files modified:** All 4 files importing _core components

**2. [Rule 2 - Missing] CSS var fallbacks added for token mismatch**
- **Found during:** Task 1/2 — mogwai Layout uses different token names than UI-SPEC (--border vs --border-subtle, no --gutter)
- **Fix:** Added CSS fallback chains: `var(--border-subtle, var(--border))` and `var(--gutter, clamp(1.5rem, 6vw, 5rem))` so pages render correctly before Phase 3 token alignment
- **Files modified:** All 8 page files

## Known Stubs

None. Pages render empty states when collections have no content (by design — content dirs contain only .gitkeep files at this stage).

## Threat Flags

None. No new network endpoints, auth paths, or file access patterns introduced.

## Self-Check: PASSED

All 8 files exist. Both commits verified in git log.
- Task 1: 28122f5 — feat(02-07): mogwai news + jobs list and detail pages
- Task 2: ea137f9 — feat(02-07): mogwai announcements + blog list and detail pages
- Build: `npm run build` in sites/mogwai-systems exits 0, 11 pages built

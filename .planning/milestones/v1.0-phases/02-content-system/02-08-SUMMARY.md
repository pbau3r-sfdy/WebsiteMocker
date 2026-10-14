---
phase: 02-content-system
plan: 08
subsystem: parrot-capital content pages
tags: [astro, content-layer, parrot-capital, page-templates]
dependency_graph:
  requires: [02-05]
  provides: [parrot-capital-content-routes]
  affects: [sites/parrot-capital]
tech_stack:
  added: []
  patterns:
    - Astro 5 Content Layer API (getCollection, render, entry.id)
    - _core component imports at ../../../../../_core/ (5 levels up)
    - No Nav/Footer — Layout.astro slot-only wrapper
key_files:
  created:
    - sites/parrot-capital/src/pages/news/index.astro
    - sites/parrot-capital/src/pages/news/[slug].astro
    - sites/parrot-capital/src/pages/jobs/index.astro
    - sites/parrot-capital/src/pages/jobs/[slug].astro
    - sites/parrot-capital/src/pages/announcements/index.astro
    - sites/parrot-capital/src/pages/announcements/[slug].astro
    - sites/parrot-capital/src/pages/blog/index.astro
    - sites/parrot-capital/src/pages/blog/[slug].astro
  modified: []
decisions:
  - "02-08: _core import path confirmed at 5 levels up (../../../../../_core/) — same correction as Plan 06/07; plan spec showed 4 levels"
  - "02-08: CSS hover on news rows uses rgba(142,21,32,.04) (parrot accent tint) instead of sfdy rgba(255,255,255,.04) — brand-appropriate for light background"
  - "02-08: Empty-collection warnings during build are expected with .gitkeep-only content dirs; build exits 0"
metrics:
  duration: ~5 minutes
  completed: 2026-08-20
  tasks_completed: 2
  files_created: 8
---

# Phase 2 Plan 08: parrot-capital Content Page Templates Summary

All 8 content page templates created for parrot-capital. Site builds successfully with all 4 collection routes (news, jobs, announcements, blog) in both list and detail form.

## What Was Built

8 Astro page templates for parrot-capital's content system — news (list + detail), jobs (list + detail), announcements (list + detail), blog (list + detail). All pages use Astro 5 Content Layer API with `entry.id` params and standalone `render()`. No Nav or Footer components (parrot-capital has neither — Layout.astro is a slot-only wrapper).

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | parrot news + jobs pages | 5e8601d | news/index.astro, news/[slug].astro, jobs/index.astro, jobs/[slug].astro |
| 2 | parrot announcements + blog pages + build verify | 67b7bfa | announcements/index.astro, announcements/[slug].astro, blog/index.astro, blog/[slug].astro |

## Key Decisions

1. **_core import path depth**: 5 levels up (`../../../../../_core/src/components/`) — same correction as Plans 06 and 07. The plan interface spec showed 4 levels (`../../../../`), but pages are in `pages/<collection>/` subdirectory adding one extra level.

2. **Brand hover color**: news row hover uses `rgba(142, 21, 32, .04)` (parrot crimson tint) instead of sfdy's `rgba(255,255,255,.04)` — appropriate for parrot's light `#FCF4ED` background.

3. **Empty-collection warnings**: Build warnings "collection does not exist or is empty" are expected — content dirs contain only `.gitkeep` files. Build exits 0 with 7 pages built.

## Deviations from Plan

### Auto-applied corrections

**1. [Rule 2 - Correctness] _core import path depth set to 5 levels**
- **Found during:** Task 1 implementation
- **Issue:** Plan spec showed `../../../../_core/` (4 levels) but STATE.md decision 02-06 corrected this to 5 levels for the same directory depth
- **Fix:** Used `../../../../../_core/src/components/` throughout all 8 files
- **Files modified:** All 8 new page files

## Known Stubs

None — all pages render real content from Astro content collections. Empty states are proper empty-state UI, not data stubs.

## Threat Flags

None — no new network endpoints or auth paths introduced. All pages are static output only.

## Self-Check: PASSED

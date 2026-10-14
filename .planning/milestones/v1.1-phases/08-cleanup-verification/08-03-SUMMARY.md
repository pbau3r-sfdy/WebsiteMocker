---
phase: 08-cleanup-verification
plan: 03
subsystem: ui
tags: [astro, content-collections, crestworks, verification]

requires:
  - phase: 08-cleanup-verification
    provides: Crestworks jobs and announcements routes from plan 08-02
provides:
  - Crestworks blog list and detail routes
  - Non-empty Crestworks blog stub content
  - Green HSK-01, HSK-02, and HSK-03 verification gates
affects: [08-06, crestworks, HSK-01]

tech-stack:
  added: []
  patterns: [Crestworks Layout/Nav/Footer chrome around shared blog components]

key-files:
  created:
    - sites/crestworks/src/pages/blog/index.astro
    - sites/crestworks/src/pages/blog/[slug].astro
    - sites/crestworks/src/content/blog/2026-08-25-first-post.md
  modified: []

key-decisions:
  - "Kept the Crestworks Nav unchanged per D-06."
  - "No verify-phase-08.sh assertion fixes were needed."

requirements-completed: [HSK-01]
completed: 2026-08-25
---

# Phase 8 Plan 03: Crestworks Blog and HSK-01 Verification Summary

Crestworks now has all four collection routes, including a non-empty blog list and detail page, and the targeted build and housekeeping gates pass.

## What Was Built

- Added the Crestworks blog list route with the shared `BlogCard`, newest-first collection sorting, and the required auto-fill grid.
- Added the blog detail route with static paths, optional author and image rendering, tag pills, and the `← All posts` link.
- Added the schema-valid `Notes from Crestworks` stub without an image field.

## Route Inventory: `dist/crestworks/`

- Jobs: `jobs/index.html`, `jobs/2026-08-25-open-position/index.html`
- Announcements: `announcements/index.html`, `announcements/2026-08-25-welcome/index.html`
- Blog: `blog/index.html`, `blog/2026-08-25-first-post/index.html`
- News: `news/index.html` (the collection is currently empty, so no detail route was emitted)

## Verification Results

- `cd sites/crestworks && npx astro build`: passed; 11 pages emitted.
- `node _scripts/build-all.js crestworks`: passed; dashboard and Crestworks output copied to root `dist/`.
- `verify-phase-08.sh hsk01`: **34 passed, 0 failed**.
- `verify-phase-08.sh hsk02`: **6 passed, 0 failed**.
- `verify-phase-08.sh hsk03`: **6 passed, 0 failed**.
- Assertion fixes in `_scripts/verify-phase-08.sh`: **none needed**.

## Untouched Confirmations

- `git diff --stat -- sites/crestworks/src/components/Nav.astro` produced no output; no `/jobs`, `/announcements`, or `/blog` links were added.
- `git diff --stat -- sites/sfdy-alt-clean sites/mogwai-systems sites/parrot-capital` produced no output.
- The pre-existing untracked `08-PATTERNS.md` was not modified or included in any commit.

## Task Commits

1. Task 1 — `fb2fd48` (`feat(08-03): add crestworks blog routes and stub post`)
2. Task 2 — `cb6a306` (`feat(08-03): run build gate and verify hsk01 green`)

## Self-Check: PASSED

- All three requested blog files exist and are committed.
- All four Crestworks collection indexes exist in root `dist/crestworks/`.
- HSK-01/02/03 all exit successfully.
- Crestworks Nav and the three other active sites remain untouched.

---
*Phase: 08-cleanup-verification*
*Completed: 2026-08-25*

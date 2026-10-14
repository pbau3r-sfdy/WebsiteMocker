---
phase: 08-cleanup-verification
plan: 02
subsystem: ui
tags: [astro, content-collections, crestworks, static-routes]

requires:
  - phase: 08-cleanup-verification
    provides: Crestworks shared-token bridge from plan 08-01
provides:
  - Crestworks jobs list and detail routes
  - Crestworks announcements list and detail routes
  - Non-empty jobs and announcements stub content
affects: [08-03, crestworks, HSK-01]

tech-stack:
  added: []
  patterns: [Crestworks Layout/Nav/Footer chrome around shared content cards]

key-files:
  created:
    - sites/crestworks/src/pages/jobs/index.astro
    - sites/crestworks/src/pages/jobs/[slug].astro
    - sites/crestworks/src/pages/announcements/index.astro
    - sites/crestworks/src/pages/announcements/[slug].astro
    - sites/crestworks/src/content/jobs/2026-08-25-open-position.md
    - sites/crestworks/src/content/announcements/2026-08-25-welcome.md
  modified: []

key-decisions:
  - "Kept the Crestworks Nav byte-identical; new collection routes remain URL-addressable only per D-06."

patterns-established:
  - "Crestworks content routes wrap shared _core cards with the site's Layout, Nav, and Footer chrome."

requirements-completed: [HSK-01]

duration: 4 min
completed: 2026-08-25
---

# Phase 8 Plan 02: Crestworks Jobs and Announcements Routes Summary

**Crestworks now builds non-empty jobs and announcements list/detail routes using shared cards, collection-backed static paths, and existing site chrome.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-08-25T07:38:00Z
- **Completed:** 2026-08-25T07:41:43Z
- **Tasks:** 2
- **Files modified:** 6 implementation files

## What Was Built

- Added four route files: jobs list/detail and announcements list/detail.
- Added a schema-valid open job stub for `Software Engineer`.
- Added a schema-valid company announcement stub.
- Jobs filter entries with `open !== false`; announcements remain unfiltered; both lists sort newest-first with non-shadowing callback names.
- All routes use Crestworks `Layout`, `Nav`, and `Footer` chrome and shared `_core` card/badge components.

## Build Verification Results

- `cd sites/crestworks && npx astro build`: passed with 9 pages emitted.
- Confirmed `dist/jobs/index.html`.
- Confirmed `dist/jobs/2026-08-25-open-position/index.html`.
- Confirmed `dist/announcements/index.html`.
- Confirmed `dist/announcements/2026-08-25-welcome/index.html`.
- Confirmed both list pages contain their stub entry and BASE_URL-prefixed detail link.
- Confirmed all four route files contain no literal hex colours.

## Nav Untouched Confirmation

`sites/crestworks/src/components/Nav.astro` remained byte-identical with SHA-1 `2b832123f7f9e3ed379a745e0b45d4e64b1d19de`. No jobs or announcements links were added, preserving D-06.

## Task Commits

1. **Task 1: crestworks jobs routes and stub job** — `63e798c`
2. **Task 2: crestworks announcements routes and stub announcement** — `975233e`

## Decisions Made

None - followed the plan as specified.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

The first plan-level verification shell used zsh's reserved `path` variable as a loop variable, which temporarily hid commands from that shell process. The verification was immediately rerun with `file_path`; all checks passed. No implementation changes were required.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 08-03 can add the Crestworks blog routes and run the complete HSK-01 build gate. No blockers remain from this plan.

## Self-Check: PASSED

- All six required implementation files exist.
- Both task commits exist with the requested messages.
- All task acceptance criteria and plan-level success criteria passed.
- Nav remained byte-identical.

---
*Phase: 08-cleanup-verification*
*Completed: 2026-08-25*

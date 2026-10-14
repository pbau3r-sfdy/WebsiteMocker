---
phase: 09-claude-design-connectivity
plan: 07
subsystem: verification
tags: [harness, verification, fixtures]
requires: [09-02, 09-03, 09-04, 09-05]
provides:
  - _scripts/verify-phase-09.sh (fixture-only Phase 9 harness, 9 sections)
key-files:
  created:
    - _scripts/verify-phase-09.sh
requirements-completed: [DSYNC-13]
completed: 2026-10-14
---

# Phase 9 Plan 07: Fixture harness Summary

`bash _scripts/verify-phase-09.sh [block|stage|zip|lock|marker|sanitise|tokens|guard|render|all]` runs every case in a `mktemp -d` root with `WM_ROOT=$T`, copied from `_scripts/fixtures/design/`. Exit 0 on pass, 1 on any failure, 2 on an invalid section.

## Result

`all`: 94 passed, 0 failed (block 15, stage 11, zip 8, marker 9, lock 6, sanitise 14, tokens 12, guard 16, render 3). Invalid argument exits 2. `git status --porcelain sites/` is identical before and after a full run. No DesignSync call, no network, no real slug referenced.

## Commits
- Single commit `test(09-07): fixture-based verify-phase-09 harness` (both tasks were one file, built and verified together).

## Deviations from Plan

**1. Fixture adjustments.** `slides/deck.html` is outside the default globs and never in the lock, so the delete case in the lock section removes `components/core/Button.jsx`. The 261119-byte size case uses a space-filled CSS file. The listing-size check is kept because the stager still supports `listing.json` sizes (SD-01 relay check).

**2. Block fixtures are wrapped** as `{"design": {...}}`; the block check unwraps before calling `validateDesignBlock`.

**3. Render section** ran (Playwright not needed; `ssr` path, `fallback: false`), so no SKIP.

No Astro change, no npm install.

## Known Stubs
None.

## Self-Check: PASSED

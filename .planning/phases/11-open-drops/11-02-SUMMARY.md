---
phase: 11-open-drops
plan: 02
subsystem: drops-build
tags: [drops, astro-integration, gating, harness]
requires: ["11-01"]
provides:
  - "_scripts/drops.mjs: Astro integration (gate, injectRoute /d/[id], build-done PDF emission)"
  - "_core/src/drops/[id].astro and _core/src/layouts/DropLayout.astro (standalone neutral layout)"
  - "dropsSchema in _core/src/content.config.ts; sfdy adoption with wiring drops.enabled"
  - "sync-content.sh deny for 'drops'; _drops/ gitignored"
  - "verify-phase-11.sh build and sandbox sections"
affects: [11-03, 11-04, 11-05, 11-06]
tech-stack:
  added: []
  patterns: ["integration injects route only when resolveDrops says enabled and not gated", "Vite define __DROPS_CONFIG__ carries accent to the route"]
key-files:
  created:
    - _scripts/drops.mjs
    - _core/src/drops/[id].astro
    - _core/src/layouts/DropLayout.astro
    - _scripts/verify-phase-11.d/30-build.sh
    - _scripts/verify-phase-11.d/40-sandbox.sh
  modified:
    - _core/src/content.config.ts
    - _core/astro.config.mjs
    - sites/sfdy/astro.config.mjs
    - sites/sfdy/src/content.config.ts
    - sites/sfdy/wiring.json
    - _scripts/sync-content.sh
    - .gitignore
key-decisions:
  - "Integration logs counts only, never ids; dev preview note logged since the spike verdict is 'works'"
  - "Harness passes DROPS_DIR as an absolute path (the build runs from a different cwd)"
requirements-completed: [DROP-01, DROP-03, DROP-04, DROP-05, DROP-09]
duration: 25min
completed: 2026-10-14
---

# Phase 11 Plan 02: Drops build wiring Summary

Active drops render at `/d/<id>/` in production-like builds only, with a standalone noindex layout, stripped PDF emission at build end, sandbox gating via DROPS_PREVIEW, and a sync-content deny.

## Tasks

| Task | Commit | Result |
|---|---|---|
| 1. Integration, route, layout, schema | 5e2495c | node check and grep checks pass |
| 2. sfdy adoption, sync deny, gitignore | 6c30c2d | wiring, config, deny verified |
| 3. build and sandbox harness | 55f0234 | build: all pass; sandbox: 10 pass |

## Verification

- `verify-phase-11.sh lib` (68), `pdf` (37), `build`, `sandbox` (10): all FAIL=0.
- `verify-phase-10.sh all`: 121 passed; `verify-phase-12.sh all`: 58 passed.
- deploy.yml untouched; no `src/content/drops` anywhere.

## Deviations from Plan

**1. [Rule 3 - Blocking] Harness DROPS_DIR must be absolute.** First build run found no drops because the build runs with a different cwd; harness now passes `$PWD/...`.
**2. [Rule 1 - Bug] Harness self-match.** The source-level `src/content/drops` scan matched the harness's own literals; those were split by runtime concatenation.
**3. Phase 10 harness needs `dist/sfdy`.** The 11 build sections remove `dist/sfdy`; phase 10 `all` failed one check (404.html) until `build-all.js sfdy` was re-run. Run that first if running phase 10 right after phase 11 sections.

## Notes

- sfdy is stage 6 and live: once this lands on origin, publish.yml (plan 11-05) will check out the private drops repo, so no publish may run between the push and the operator gates of 11-06. Nothing pushed here.

## Known Stubs

None.

## Self-Check: PASSED

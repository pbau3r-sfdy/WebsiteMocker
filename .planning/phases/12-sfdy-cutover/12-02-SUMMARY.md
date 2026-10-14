---
phase: 12-sfdy-cutover
plan: 02
subsystem: production-gating
tags: [astro, gating, noindex, nojekyll, harness]
requires: [12-01]
provides:
  - "Production build (base /) ships no open-points route, pill, tbd markers or noindex; sandbox build keeps them"
  - "_scripts/verify-phase-12.sh (rename, old, gate, prod, sandbox, all; ident/sync/sync-live/live stubbed)"
key-files:
  created:
    - _scripts/internal-pages.mjs
    - sites/sfdy/src/data/internal.ts
    - sites/sfdy/public/.nojekyll
    - _scripts/verify-phase-12.sh
  modified:
    - sites/sfdy/src/internal/open-points.astro (moved from src/pages)
    - sites/sfdy/astro.config.mjs
    - sites/sfdy/src/layouts/Layout.astro
    - sites/sfdy/src/components/Footer.astro
    - sites/sfdy/src/components/Tbd.astro
requirements-completed: [CUT-02]
duration: 20min
completed: 2026-10-14
---

# Phase 12 Plan 02: Production gating Summary

One flag, `SHOW_INTERNAL = isSandbox(import.meta.env.BASE_URL)`, gates all internal-review machinery; production dist is clean and `.nojekyll` ships in every build. Nothing pushed.

## Commits
- 41b494e: open-points route registered only in sandbox builds (injectRoute)
- b659c29: Layout (noindex meta, pill, pill script, tbd CSS), Footer link, Tbd gated; `.nojekyll`
- 7f20678: verify-phase-12.sh harness

## injectRoute spike result
injectRoute worked, no fallback needed. Sandbox build emits `dist/sfdy/open-points/index.html`; production build does not; `astro dev` serves `/WebsiteMocker/sfdy/open-points` with 200. Page moved to `src/internal/open-points.astro` (relative imports unchanged, same depth).

## Implementation notes
- Layout: tbd CSS and the open-points script moved into JS strings (`tbdCSS`, `openPointsJS`) injected via `set:html` only when SHOW_INTERNAL; parallax script stays unconditional. Open-points script emitted as `is:inline` with TS annotations removed.
- Tbd renders only `<slot />` in production and never calls `pointById` there, so unknown ids cannot throw.

## Verification
`verify-phase-12.sh all`: 33/33 (rename incl. allow-list ALLOWED lines, old, gate, prod, sandbox); verify-phase-10 all 121/121; verify-phase-11-1 21/21 (via harness). Production dist has no open-points/internal review/tbd-pill/class="tbd/noindex, no robots meta, `.nojekyll` present, no `/WebsiteMocker`, `/jobs` Coming soon, prod Plausible id present. Sandbox keeps open-points, noindex, pill. Temp `zz-gate-test.astro` removed by trap.

## Deviations from Plan
None of substance. The `git mv` was staged before the commit so the `git add` of the old path was dropped. The harness copies the production dist to `_staging/phase12/prod-dist` (gitignored).

## Known Stubs
`ident`, `sync`, `sync-live`, `live` harness sections print SKIP by design (plans 03-05).

## Self-Check: PASSED
Commits 41b494e, b659c29, 7f20678 exist; harness file present; gate page absent.

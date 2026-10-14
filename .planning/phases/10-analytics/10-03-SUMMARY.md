---
phase: 10-analytics
plan: 03
subsystem: analytics
tags: [plausible, stats-api, dashboard, gitignore]
requires: []
provides:
  - fetch-analytics-data.mjs (Stats API v2 aggregates fetcher, off by default)
  - AnalyticsTile.astro (local-only approximate tile)
affects: [dashboard]
tech-stack:
  added: []
  patterns: [env-only secret, CI-suppressed local tile]
key-files:
  created: [_scripts/fetch-analytics-data.mjs, src/components/AnalyticsTile.astro]
  modified: [.gitignore, src/pages/index.astro]
key-decisions:
  - "Tile placed as a sibling after the card-foot conditional, not inside it, because card-foot only renders when perf data or a next step exists"
requirements-completed: [ANLY-07]
duration: 10min
completed: 2026-10-14
---

# Phase 10 Plan 03: Stats API aggregates and local tile Summary

Dormant ANLY-07 path: a gitignored aggregates-only Plausible Stats API v2 fetcher plus a dashboard tile that renders only locally, labelled approximate and dated.

## Commits
- 8ec6a83: .gitignore rule + `_scripts/fetch-analytics-data.mjs`
- 1ba545d: `src/components/AnalyticsTile.astro`

## Verification
- `git check-ignore` succeeds for `_data/*/analytics.json`; fetcher exits 0 with skip messages without statsApi sites or without key; no file written.
- Dashboard build with fixture: tile present locally (`approx. · 30 days · as of 2026-10-14`), absent with `CI=1`. Fixture removed, never tracked.

## Left unstaged (mixed with operator WIP)
`src/pages/index.astro` was edited in the working tree only. Inserted lines:
1. After `import Console from '../layouts/Console.astro';`: `import AnalyticsTile from '../components/AnalyticsTile.astro';`
2. After the `)}` closing the `(pm || next)` card-foot conditional, before `</article>`: `          <AnalyticsTile slug={site._slug} />`

## Activation
Business plan, set `analytics.statsApi: true` in the site's wiring.json, then `PLAUSIBLE_API_KEY=… node _scripts/fetch-analytics-data.mjs <slug>` and a local `npm run build:dashboard`.

## Deviations from Plan
**[Rule 1 - Bug] Tile insertion point.** Plan said directly after the perf block (inside card-foot); a site with no perf data has no card-foot, so the tile never rendered. Moved it just after the card-foot conditional (same card). Verified.

Acceptance note: `grep -c "console.*API_KEY"` prints 1 because the skip message names the variable `PLAUSIBLE_API_KEY not set`; the key value is never logged.

## Self-Check: PASSED

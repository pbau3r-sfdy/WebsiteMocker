---
phase: 11-open-drops
plan: 03
subsystem: analytics
tags: [plausible, transformRequest, drops, privacy]
requires: [11-02]
provides:
  - drop-aware whitelist in the shared transformRequest (cfg.drops, cfg.dropProps)
  - Drop Download click hook in DropLayout
  - track harness section
affects: [11-05, 11-06]
tech-stack:
  added: []
  patterns: [whitelist-on-drop-path, cfg flag gated on wiring so other sites stay byte-identical]
key-files:
  created:
    - _scripts/fixtures/analytics/wiring/drops-on.json
    - _scripts/fixtures/analytics/wiring/drops-props-on.json
    - _scripts/verify-phase-11.d/50-track.sh
  modified:
    - _scripts/lib/plausible-snippet.mjs
    - _scripts/fixtures/analytics/payloads.mjs
    - _scripts/fixtures/analytics/eval-snippet.mjs
    - _core/src/layouts/DropLayout.astro
    - _core/src/drops/[id].astro
    - docs/analytics.md
key-decisions:
  - "Drop pages keep only pageview, 404 and Drop Download; every other event returns null (D-07)"
  - "Label grouping exists only behind analytics.props === true; off for sfdy"
requirements-completed: [DROP-06, DROP-09]
duration: 20min
completed: 2026-10-14
---

# Phase 11 Plan 03: Drop tracking Summary

Drop views report as the masked pageview /d/_ID_/ and downloads as a plain "Drop Download" goal; the shared transform whitelists events on drop pages so File Download and outbound events (which would leak file names and destinations) are dropped, and the id appears in no payload.

## Tasks

1. Transform rule, cfg.drops/dropProps in buildSnippet, 25 drop vectors, eval-snippet optional props/referrer args, two wiring fixtures (84e8a34)
2. DropLayout delegated click hook, label only with props true (passed through [id].astro from the existing `__DROPS_CONFIG__.props`), docs/analytics.md contract row, goal checklist, Drop pages paragraph with the 404 subtraction note (73127f4)
3. 50-track.sh section: vectors, emitted-snippet runs with a random id, non-drop control, byte-identical snippet check, production build checks (0929884)

## Deviations from Plan

- eval-snippet runs in the track section use site https://www.example.com, because the prod-script fixture domain is example.com and ANLY-03 requires the site hostname to match; the plan named the starflight host.
- The fixture label is `fixture-active` (no FIXTURE-LABEL marker exists in gen.mjs), so the label-absence check greps that text and the `data-drop-label=` attribute.
- The byte-identity check asserts on the quoted `"dropProps"` key, since the factory source itself mentions `cfg.dropProps`.

## Verification

verify-phase-11.sh all: PASS=336 FAIL=0 (the ci section is still a SKIP, belongs to a later plan); verify-phase-10.sh all 147/0; verify-phase-09.sh all 94/0; verify-phase-12.sh all 58/0 (dist/sfdy rebuilt first).

## Known Stubs

None.

## Self-Check: PASSED

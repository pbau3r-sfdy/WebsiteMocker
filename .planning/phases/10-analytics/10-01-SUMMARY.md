---
phase: 10-analytics
plan: 01
subsystem: analytics
tags: [plausible, astro-integration, privacy]
requires: []
provides:
  - "_scripts/lib/env.mjs: isSandbox, SANDBOX_DOMAIN, SANDBOX_BASE_PREFIX"
  - "_scripts/lib/plausible-snippet.mjs: resolveIdentity, buildSnippet, TRANSFORM_FACTORY_SRC, PROPS_FACTORY_SRC, SANDBOX_OPT_IN_WARNING"
affects: [10-03, 10-04, 10-05, 11-drops]
tech-stack:
  added: []
  patterns: ["pure lib + thin Astro integration wrapper", "build-failing identity assertion"]
key-files:
  created:
    - _scripts/lib/env.mjs
    - _scripts/lib/plausible-snippet.mjs
  modified:
    - _scripts/plausible.mjs
key-decisions:
  - "Sandbox build of a scriptId site emits nothing unless sandboxScriptId or sandboxUsesProdId (D-02)"
  - "Legacy (no scriptId) sites keep the old sandbox behaviour, reporting to SANDBOX_DOMAIN"
  - "Legacy formSubmissions warning only when explicitly true (default-true would warn on every legacy build)"
requirements-completed: [ANLY-01, ANLY-02, ANLY-03, ANLY-04, ANLY-05]
duration: 10min
completed: 2026-10-14
---

# Phase 10 Plan 01: Plausible engine rebuild Summary

pa- per-site Plausible snippet with event flags, a build-failing identity assertion (ANLY-03), a shared sanitising transformRequest, and a single `isSandbox` helper, with `plausible.mjs` reduced to a thin wrapper.

## Tasks
1. Libraries (env.mjs, plausible-snippet.mjs) and 2. integration rewire: committed together as one commit, as the plan specifies (one commit for the three files).
   - Commit: see `git log` entry "feat(10-01): pa- per-site Plausible snippet, isSandbox helper, ANLY-03 identity assertion, sanitising transform"

## Verification
- Library assertion script printed `lib OK`; hook smoke test printed `hook OK`.
- `build-single.mjs parrot-capital` exits 0; dist HTML contains no `plausible`.
- No site wiring.json edited.

## Operator flags
1. The D-02 opt-in key is `analytics.sandboxUsesProdId`. Warning text on every such build: "ANALYTICS DEBUG OPT-IN: this SANDBOX build reports into the PRODUCTION Plausible site (analytics.sandboxUsesProdId=true). Filter by page path /WebsiteMocker in Plausible. Remove sandboxUsesProdId before the Phase 12 cutover."
2. Legacy sites without scriptId keep the old sandbox behaviour (shared SANDBOX_DOMAIN); only scriptId sites get the stricter D-02 default (ANLY-02 vs D-02 resolution).

## Deviations from Plan
- Minor [Rule 1]: legacy `formSubmissions` warning fires only when explicitly `true`, since the flag defaults to true.
- Task 1 and Task 2 share one commit (plan's commit step covers all three files).

## Known Stubs
None.

## Self-Check: PASSED

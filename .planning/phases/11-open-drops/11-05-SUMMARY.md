---
phase: 11-open-drops
plan: 05
subsystem: drops-ci
tags: [drops, github-actions, ci, token-health, harness]
requires: ["11-02", "11-04"]
provides:
  - "publish.yml: guarded private drops checkout, qpdf, drop check with --emit-masks, redacted build"
  - ".github/workflows/drops-health.yml: nightly token and expiry watch"
  - "_scripts/check-drops-token.mjs with pure evaluate()"
  - "verify-phase-11.sh ci section and opt-in live section"
affects: [11-06]
tech-stack:
  added: []
  patterns: ["drops path only in publish.yml and drops-health.yml; deploy.yml has none", "build output piped through a 32-hex sed filter with pipefail"]
key-files:
  created:
    - .github/workflows/drops-health.yml
    - _scripts/check-drops-token.mjs
    - _scripts/verify-phase-11.d/60-ci.sh
    - _scripts/verify-phase-11.d/80-live.sh
  modified:
    - .github/workflows/publish.yml
    - _scripts/drop.mjs
key-decisions:
  - "No write-scope probe; the token check prints that write scope is not verifiable (Q3)"
  - "qpdf installed whenever drops are enabled (Q4)"
requirements-completed: [DROP-04, DROP-05, DROP-07, DROP-08, DROP-09]
duration: 25min
completed: 2026-10-14
---

# Phase 11 Plan 05: CI hardening and token watch Summary

publish.yml fetches the private drops repo only for drops-enabled sites and keeps ids out of the public logs; a nightly workflow watches token expiry, repo access, drops repo privacy and expired-but-live drops.

## Tasks

| Task | Commit | Result |
|---|---|---|
| 1. publish.yml drops path | 3d92407 | guarded checkout/qpdf/check, redacted build; deploy.yml unchanged |
| 2. drops-health.yml and token check | 18f1295 | evaluate() vectors pass; exits 2 without GH_TOKEN |
| 3. ci and live harness sections | 9150b4f | `ci` 59 pass; live is `bash -n` clean, not in `all` |

## Verification

- verify-phase-11 all: 395 pass, 0 fail. After `node _scripts/build-all.js sfdy`: phase 10 all 147 pass, phase 9 all 94 pass, phase 12 all 58 pass.
- Redaction filter taken from publish.yml leaves zero 32-hex matches in a real fixture build log (raw log had 2).
- Nothing pushed; no network or remote state used.

## Deviations from Plan

**1. [Rule 3 - Blocking] local-only markers in drop.mjs** — the ci log-hygiene check requires a `// local-only` marker on the local URL print (line 197, as the plan expected) and also on the non-CI branch of the `list` output that prints a label (line 222). Comment-only edits in `_scripts/drop.mjs`, committed with Task 1 and Task 3. The `::add-mask::` line is allow-listed by pattern since it must carry the full id for GitHub to mask it.

**2. [Rule 1 - Bug] clean strict-check fixture** — the good fixture's raw PDF fails check's stripped-PDF verification, so the "clean live list exits 0" assertion uses a PDF-less fixture generated first (`ci/clean`).

## Known Stubs

None.

## Self-Check: PASSED

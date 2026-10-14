---
phase: 11-open-drops
plan: 04
subsystem: drops-operator
tags: [drops, cli, skills, docs, harness]
requires: ["11-01"]
provides:
  - "_scripts/drop.mjs: new, list, withdraw, expire, check (dry-run default, --confirm, --ci, --emit-masks, --live, --strict)"
  - ".claude/skills/wm-drop.md and drops sections in wm-preflight, wm-publish, wm-deploy"
  - "docs/drops.md with confidentiality limits, token section, rollback"
  - "verify-phase-11.sh cli and docs sections"
affects: [11-05, 11-06]
tech-stack:
  added: []
  patterns: ["CLI routes every id through shortId (4 chars in CI, 8 locally)", "live listing overridable via DROPS_LIVE_STATUS / DROPS_LIVE_LIST_FILE for offline tests"]
key-files:
  created:
    - _scripts/drop.mjs
    - _scripts/verify-phase-11.d/20-cli.sh
    - _scripts/verify-phase-11.d/70-docs.sh
    - .claude/skills/wm-drop.md
    - docs/drops.md
  modified:
    - .claude/skills/wm-preflight.md
    - .claude/skills/wm-publish.md
    - .claude/skills/wm-deploy.md
    - CLAUDE.md
    - AGENTS.md
    - .planning/phases/12-sfdy-cutover/12-05-SUMMARY.md
key-decisions:
  - "check also verifies stripped PDFs with verifyPdf, so a tampered attachment fails preflight"
  - "withdraw/expire accept prefixes of 8 to 32 hex chars; ambiguous or unknown prefixes exit 1"
  - "new is refused under GITHUB_ACTIONS"
requirements-completed: [DROP-02, DROP-07, DROP-08, DROP-10]
duration: 30min
completed: 2026-10-14
---

# Phase 11 Plan 04: Operator CLI, skills and docs Summary

The `drop.mjs` CLI gives the operator the full drop lifecycle with dry-run-by-default destructive commands and CI-safe output, backed by the `/wm-drop` skill, preflight/publish/deploy updates and `docs/drops.md`.

## Tasks

| Task | Commit | Result |
|---|---|---|
| 1. CLI and cli harness | 13cb8eb | `verify-phase-11.sh cli`: 99 pass |
| 2. Skills and project notes | bdee171 | grep verification passes |
| 3. docs/drops.md and docs harness | 4c8f3e4 | `verify-phase-11.sh docs`: 38 pass |

## Verification

- `verify-phase-11.sh` lib 68, pdf 37, cli 99, build 40, sandbox 10, docs 38: all FAIL=0.
- After `node _scripts/build-all.js sfdy`: `verify-phase-10.sh all` 121 passed, `verify-phase-12.sh all` 58 passed.
- Everything tested against local fixtures; no network, no remote state, nothing pushed.

## Deviations from Plan

None in scope. AGENTS.md has no skills table, so the `/wm-drop` mention and Open Drops notes were added under its Critical Technical Notes plus a layout line.

## Known Stubs

None. `docs/drops.md` holds the intentional placeholder line `Token expiry date: not yet recorded (operator fills at gate G2)`, resolved at the operator gate in 11-06.

## Self-Check: PASSED

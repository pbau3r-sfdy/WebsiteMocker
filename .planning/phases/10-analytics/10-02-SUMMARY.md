---
phase: 10-analytics
plan: 02
subsystem: analytics
tags: [plausible, privacy-gate, docs]
requires: []
provides:
  - "_scripts/check-analytics-gate.mjs (ANLY-06 privacy gate, WM_ROOT aware)"
  - "docs/analytics.md (event contract, schema, goals checklist)"
affects: [10-04, 10-05, 12-cutover]
key-files:
  created:
    - _scripts/check-analytics-gate.mjs
    - docs/analytics.md
  modified:
    - .github/workflows/publish.yml
    - .claude/skills/wm-preflight.md
    - .claude/skills/wm-publish.md
    - .claude/skills/wm-wire.md
    - .planning/REQUIREMENTS.md
    - CLAUDE.md
key-decisions:
  - "Gate exits 0 for sandbox-only sites (stage < 5, no domain, no --live) so the D-02 debug session is not blocked"
  - "D-04: no consent banner built; recorded as open item for legal reviewer"
requirements-completed: [ANLY-06, ANLY-04]
completed: 2026-10-14
---

# Phase 10 Plan 02: Privacy gate and analytics docs Summary

Privacy gate script (exit 0/1/2) wired into publish.yml, /wm-preflight and /wm-publish, plus `docs/analytics.md` with the event contract, goals checklist and D-02/D-04 notes, and an extended /wm-wire analytics step.

## Commits
- 2c8ba01 feat: gate script, publish.yml, preflight, publish skill
- 666ac04 docs: analytics.md, wm-wire, REQUIREMENTS note
- 1a8168c docs: hash-based routing wording fix (verify string)

## Verification
Fixture matrix passed: fail (exit 1), pass (exit 0), unknown slug (exit 2), parrot-capital not applicable (exit 0); step order in publish.yml confirmed; doc string checks pass.

## Deviations from Plan
Minor: a third commit was needed to make the docs contain the literal string "hash-based".

## Left unstaged (mixed with operator WIP)
- CLAUDE.md: Analytics section edited in the working tree (scriptId, sandbox default, sandboxUsesProdId removal at Phase 12, gate, docs pointer); not staged because it carries uncommitted operator edits.

## Known Stubs
None.

## Self-Check: PASSED

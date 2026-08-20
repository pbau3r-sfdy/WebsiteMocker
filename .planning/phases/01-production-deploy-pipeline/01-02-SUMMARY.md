---
phase: 01-production-deploy-pipeline
plan: "02"
subsystem: deploy-pipeline
tags: [operator-skill, publish, dns-guide, github-actions, preflight]
dependency_graph:
  requires:
    - 01-01 (_scripts/build-single.mjs, .github/workflows/publish.yml)
  provides:
    - .claude/skills/wm-publish.md operator-facing production publish skill
  affects:
    - operator workflow (entry point for all production deploys)
tech_stack:
  added: []
  patterns:
    - validate-before-trigger gate (wiring.json + preflight before gh workflow run)
    - gh CLI workflow dispatch + run watch polling pattern
    - inline DNS handoff guide (printed to terminal, no separate file)
key_files:
  created:
    - .claude/skills/wm-publish.md
  modified: []
decisions:
  - "wm-publish.md invokes /wm-preflight before triggering publish.yml — two-layer validation (local + preflight) before any build"
  - "gh run watch --exit-status used for live streaming and non-zero exit on workflow failure"
  - "DNS guide is inline terminal output (no separate file) per D-10 decision"
  - "Failure path surfaces gh run view --log-failed so operator can inspect without navigating GitHub UI"
metrics:
  duration: "pending checkpoint"
  completed: "2026-08-20"
  tasks_completed: 1
  tasks_total: 2
  files_created: 1
  files_modified: 0
---

# Phase 1 Plan 02: Operator Publish Skill Summary

**One-liner:** Operator-facing `/wm-publish` skill with two-layer validation (wiring.json + preflight), `gh workflow run` trigger, `gh run watch` streaming, and inline Squarespace DNS handoff guide.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create .claude/skills/wm-publish.md | 5264b0f | .claude/skills/wm-publish.md |

## Pending

| Task | Name | Status |
|------|------|--------|
| 2 | E2E Verification — Full Deploy Pipeline | Awaiting human checkpoint approval |

## What Was Built

### .claude/skills/wm-publish.md

Complete 6-step operator skill that wraps the production deploy pipeline:

1. **Step 1 — Pre-flight validation**: Reads `sites/<slug>/wiring.json`, confirms `stage >= 5`, `domain`, and `prod_repo` are all set. Stops with a clear error message if any are missing.

2. **Step 2 — Run preflight checklist**: Invokes `/wm-preflight <slug>` and presents full output. Blocks on any FAIL item — does not proceed to workflow trigger.

3. **Step 3 — Trigger publish workflow**: `gh workflow run publish.yml --field slug=<slug>`. Surfaces exact error and stops on gh CLI failure.

4. **Step 4 — Wait for completion**: Sleeps 3 seconds, retrieves run ID, streams via `gh run watch "$RUN_ID" --exit-status`.

5. **Step 5 — On success**: Prints publish confirmation + inline Squarespace DNS Handoff Guide containing:
   - CNAME record pointing to `pbau3r-sfdy.github.io`
   - 4 apex A records (185.199.108-111.153)
   - CAA record check note (letsencrypt.org)
   - SSL provisioning wait warning (do not enable HTTPS redirect until cert is ready)
   - Default Squarespace record deletion warning

6. **Step 6 — On failure**: Prints `gh run view "$RUN_ID" --log-failed` — operator can inspect without navigating GitHub UI.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

No new security surface beyond the plan's threat model (T-02-01 through T-02-SC):
- Slug passed to gh CLI is validated by publish.yml before any file path use
- WM_PUBLISH_PAT is masked by GitHub in all log output
- publish.yml has 30-minute timeout preventing indefinite blocking

## Self-Check: PASSED

- `.claude/skills/wm-publish.md` exists: FOUND
- `gh workflow run publish.yml` present (count: 1): CONFIRMED
- `gh run watch` present (count: 4): CONFIRMED
- All 4 apex A records (185.199.108-111.153): CONFIRMED
- `pbau3r-sfdy.github.io` CNAME target: CONFIRMED
- `letsencrypt` CAA note: CONFIRMED
- SSL provisioning warning: CONFIRMED
- Default record deletion warning: CONFIRMED
- `/wm-preflight` invocation: CONFIRMED
- `stage >= 5` validation: CONFIRMED
- `gh run view --log-failed` failure path: CONFIRMED
- Commit 5264b0f exists: VERIFIED

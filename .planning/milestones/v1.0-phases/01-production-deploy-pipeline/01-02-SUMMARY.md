---
phase: 01-production-deploy-pipeline
plan: "02"
subsystem: deploy-pipeline
tags: [github-actions, operator-skill, dns, squarespace, gh-pages, workflow]

# Dependency graph
requires:
  - phase: 01-01
    provides: publish.yml workflow (workflow_dispatch, validate-before-build gate, gh-pages push, wiring.json commit-back)
provides:
  - .claude/skills/wm-publish.md operator skill with preflight integration and inline DNS guide
  - End-to-end verified production deploy pipeline (E2E test with real parrot-capital deploy to pbau3r-sfdy/parrot-capital)
affects:
  - Phase 2 operators — /wm-publish is the canonical deploy entry point; all future phases assume it exists and is working

# Tech tracking
tech-stack:
  added:
    - wm-publish.md Claude skill (6-step flow: validate → preflight → workflow trigger → watch → DNS guide / failure path)
  patterns:
    - fail-fast operator skill pattern (wiring.json validation before gh CLI invocation)
    - inline DNS handoff guide embedded in skill output (no separate doc to maintain)
    - gh run watch --exit-status for workflow completion polling in operator skills

key-files:
  created:
    - .claude/skills/wm-publish.md
  modified:
    - .github/workflows/publish.yml (4 bug fixes during E2E verification)
    - package-lock.json (workspace sync)
    - sites/parrot-capital/wiring.json (stage 6 marked live, last_deploy committed back)

key-decisions:
  - "wm-publish validates wiring.json inline (not via a separate script) — keeps the skill self-contained and auditable"
  - "DNS guide is inlined in Step 5 output (not a separate file) — operator sees it immediately after success, reducing context-switch to docs"
  - "gh run watch --exit-status used (not polling) — exits with workflow's exit code so skill can branch on success vs failure cleanly"
  - "JamesIves action requires repository-name: (not repository:) — confirmed during E2E verification and fixed in publish.yml"
  - "git remote set-url origin required before commit-back push — JamesIves action overwrites origin to the prod repo during gh-pages push"

patterns-established:
  - "Operator skill pattern: read wiring.json → run preflight → trigger gh workflow → watch → branch on exit code"
  - "publish.yml fix pattern: validate BEFORE build (step 4 before step 5) ensures bad slugs/configs never consume build minutes"

requirements-completed: [DEPLOY-01, DEPLOY-07]

# Metrics
duration: 10min
completed: 2026-08-20
---

# Phase 1 Plan 02: Operator Skill + E2E Verification Summary

**wm-publish operator skill with 6-step flow (validate → preflight → gh workflow → watch → inline Squarespace DNS guide), plus 4 publish.yml bug fixes discovered during live E2E parrot-capital deploy that confirmed full pipeline end-to-end.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-08-20
- **Completed:** 2026-08-20
- **Tasks:** 2 (Task 1: skill creation; Task 2: E2E human verification — approved)
- **Files modified:** 4 (wm-publish.md created; publish.yml, package-lock.json, parrot-capital/wiring.json fixed/updated)

## Accomplishments

- `.claude/skills/wm-publish.md` created with complete 6-step flow: wiring.json validation, /wm-preflight invocation, gh workflow run publish.yml trigger, gh run watch --exit-status, inline Squarespace DNS handoff guide, and gh run view --log-failed failure path
- DNS guide contains all 4 GitHub Pages apex A records (185.199.108.153–111.153), CNAME target (pbau3r-sfdy.github.io), CAA check, SSL provisioning wait warning, and default-record-deletion warning for Squarespace users
- 4 publish.yml bugs found and fixed during E2E verification before the workflow could succeed on a live site
- Full E2E verified: parrot-capital deploy ran all 9 workflow steps green, pushed gh-pages to pbau3r-sfdy/parrot-capital, and committed wiring.json last_deploy="2026-08-20" back to main
- Validation-failure path verified: orbint (stage 2) triggered workflow that exited at "Read and validate wiring.json" with "Error: stage 2 < 5 — site not production-ready" before reaching the build step

## Task Commits

Each task was committed atomically:

1. **Task 1: Create .claude/skills/wm-publish.md** - `5264b0f` (feat)
2. **Task 2: E2E Verification (human-approved)** — bugs found during verification were committed as fixes:
   - `b8349e4` fix(01-01): wrap robots.txt printf in block scalar to fix YAML colon parse error
   - `53a0bc0` fix: sync package-lock.json — add missing @websitemocker/crestworks workspace entry
   - `d6fe7f0` fix(01-01): fix JamesIves repository-name param + explicit git push origin main
   - `6a3d1bf` fix(01-01): reset origin remote before commit-back — JamesIves overwrites it to prod repo
   - `04bd80b` chore(parrot-capital): mark stage 6, live

## Files Created/Modified

- `.claude/skills/wm-publish.md` — Operator skill with 6 steps, preflight integration, inline Squarespace DNS guide
- `.github/workflows/publish.yml` — 4 bug fixes applied during E2E (see Deviations)
- `package-lock.json` — workspace sync for @websitemocker/crestworks
- `sites/parrot-capital/wiring.json` — stage 6, last_deploy 2026-08-20 (committed back by workflow)

## Decisions Made

- wm-publish validates wiring.json inline (not via a separate script) — keeps the skill self-contained and auditable without requiring a helper binary
- DNS guide is inlined in Step 5 output rather than a separate doc — operator sees it immediately after a successful deploy
- `gh run watch --exit-status` used instead of polling loops — exits with the workflow's exit code so the skill can branch cleanly on success vs failure
- `repository-name:` is the correct JamesIves v4.8.0 parameter (not `repository:`) — confirmed during E2E
- `git remote set-url origin` required before the commit-back git push because JamesIves overwrites the `origin` remote to the prod repo during the gh-pages push step

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] YAML colon parse error in publish.yml robots.txt printf step**
- **Found during:** Task 2 (E2E verification run against parrot-capital)
- **Issue:** The `printf 'User-agent: *\nAllow: /\n'` command in the workflow YAML step body contained a bare colon after `User-agent`, causing a YAML parse error that prevented the workflow from loading
- **Fix:** Wrapped the shell run block in a YAML block scalar (`run: |`) so the colon is not interpreted as YAML key syntax
- **Files modified:** .github/workflows/publish.yml
- **Committed in:** b8349e4

**2. [Rule 1 - Bug] package-lock.json out of sync**
- **Found during:** Task 2 (npm ci step in workflow runner)
- **Issue:** @websitemocker/crestworks workspace entry missing from package-lock.json, causing `npm ci` to fail in the Actions runner
- **Fix:** Ran `npm install` locally to regenerate package-lock.json with the correct workspace entries
- **Files modified:** package-lock.json
- **Committed in:** 53a0bc0

**3. [Rule 1 - Bug] JamesIves action used wrong parameter name**
- **Found during:** Task 2 (step 8 of workflow — Push to production gh-pages)
- **Issue:** `repository:` is not a valid input for JamesIves/github-pages-deploy-action@v4.8.0; the correct parameter is `repository-name:`
- **Fix:** Renamed the parameter in publish.yml and also added `--` to the explicit `git push origin main` to separate refs from flags
- **Files modified:** .github/workflows/publish.yml
- **Committed in:** d6fe7f0

**4. [Rule 1 - Bug] Commit-back git push failed — origin remote overwritten by JamesIves**
- **Found during:** Task 2 (step 9 — Update wiring.json stage 6)
- **Issue:** JamesIves/github-pages-deploy-action overwrites the `origin` remote to point at the prod repo during its push. When step 9 then ran `git push origin main`, it pushed to the prod repo instead of WebsiteMocker main, causing the wiring.json commit-back to fail
- **Fix:** Added `git remote set-url origin https://x-access-token:${WM_PUBLISH_PAT}@github.com/${{ github.repository }}.git` before the commit-back push to restore origin to the correct repo
- **Files modified:** .github/workflows/publish.yml
- **Committed in:** 6a3d1bf

---

**Total deviations:** 4 auto-fixed (all Rule 1 — bugs)
**Impact on plan:** All 4 fixes were necessary for the publish pipeline to function end-to-end. No scope creep — every fix was in publish.yml (already part of Plan 01 scope) triggered by direct E2E testing.

## Issues Encountered

The E2E verification served as the real integration test for publish.yml. The 4 bugs above were only discoverable by running a live deploy — static analysis of the YAML would not have caught all of them (especially the JamesIves origin-overwrite behavior). The verification checkpoint design (requiring a live E2E run) was correct.

## Known Stubs

None — wm-publish.md contains no hardcoded empty values, placeholder text, or unconnected data flows.

## Threat Flags

No new security surface beyond the plan's threat model was introduced.

All T-02-01 through T-02-SC threat dispositions remain valid after the bug fixes:
- Slug validation (`^[a-z0-9-]+$`) still fires before any file path use
- WM_PUBLISH_PAT is still only referenced via `${{ secrets.WM_PUBLISH_PAT }}` — never echoed
- concurrency group still prevents parallel deploys for the same slug
- gh run watch timeout-minutes: 30 still applies

## Next Phase Readiness

Phase 1 is complete. All DEPLOY requirements (DEPLOY-01 through DEPLOY-08) are implemented and E2E verified:
- `/wm-publish <slug>` is the working, documented single-command deploy entry point
- Validation-failure exit confirmed (stage < 5 exits at wiring check, before build)
- Full success path confirmed (parrot-capital deployed to pbau3r-sfdy/parrot-capital, wiring.json stage 6, last_deploy committed back)

Phase 2 (Content System) can begin. No blockers from Phase 1 remain.

Persistent runtime prerequisite (not a code blocker): `WM_PUBLISH_PAT` (Classic PAT, `repo` scope) must be stored as a repo-level Actions secret before publish.yml can succeed in a fresh repo. Already confirmed present for parrot-capital E2E run.

## Self-Check: PASSED

- `.claude/skills/wm-publish.md` exists: FOUND
- Commit 5264b0f exists: VERIFIED
- Commits b8349e4, 53a0bc0, d6fe7f0, 6a3d1bf exist: VERIFIED
- No `[websites-org]` in CLAUDE.md or AGENTS.md: CONFIRMED (verified during Plan 01)
- E2E human verification: APPROVED

---
*Phase: 01-production-deploy-pipeline*
*Completed: 2026-08-20*

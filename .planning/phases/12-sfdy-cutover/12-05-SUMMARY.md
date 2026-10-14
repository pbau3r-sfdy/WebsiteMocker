---
phase: 12-sfdy-cutover
plan: 05
subsystem: infra
tags: [publish, gh-pages, go-live, rollback]
requires:
  - phase: 12-04
    provides: cutover-ready origin main, prod repo dispatch slug sfdy
provides:
  - sfdy live on www.starflight-dynamics.com (stage 6, last_deploy 2026-10-14)
  - gh-pages backup branch and rollback recipe
  - live harness section
key-files:
  modified: [_scripts/verify-phase-12.sh, CLAUDE.md]
requirements-completed: [CUT-06, CUT-04]
completed: 2026-10-14
---

# Phase 12 Plan 05: Gate C, publish and go-live Summary

sfdy is published to www.starflight-dynamics.com via publish.yml, with a backup of the previous gh-pages kept; the opt-in `live` harness section passes 24/24.

## Backup (D-10)
- Branch: `gh-pages-old-2026-08` in pbau3r-sfdy/starflight-dynamics
- SHA: `3a2f4c1b2507bb31add0df6034fa7a42180ebc09` (equals the previous live gh-pages tip)
- Branch name recorded in `.planning/phases/12-sfdy-cutover/.backup-branch` (untracked).

## Publish
- Operator approved Q1 (publish) and Q2 (push bookkeeping commits to origin main).
- publish.yml run `38593538908`: success, including the analytics privacy gate.
- The workflow pushed `194a878 chore(sfdy): mark stage 6, live` (stage 6, last_deploy written by the workflow, not by hand).

## Rollback recipe
```bash
SHA=3a2f4c1b2507bb31add0df6034fa7a42180ebc09
gh api -X PATCH repos/pbau3r-sfdy/starflight-dynamics/git/refs/heads/gh-pages -f sha="$SHA" -F force=true
```
Pages rebuilds in about a minute. Then also revert the bookkeeping: set `stage` back to 5 and remove `last_deploy` in `sites/sfdy/wiring.json` (explicit-path commit, push only with the operator's approval), and revert the CLAUDE.md live marker (ownership row and layout comment). The backup branch is not a Pages source and does not affect the live site.

## Live checks (BACKUP_SHA=... bash _scripts/verify-phase-12.sh live: 24 passed, 0 failed)
- 9 pages return 200 (subpages need the trailing slash; without it GitHub Pages answers 301), /nonexistent-xyz returns 404 with the plausible('404' event.
- robots.txt Allow: /, no Disallow: /; no noindex, open-points or internal review on the home page.
- Production Plausible script present on the home page. It is injected from inline JS (string `https://plausible.io/js/pa-h84OFEpVhPIHGnzKLeThr.js`), so the harness greps for `plausible.io/js/pa-` anywhere. The CDN (Fastly, max-age=600) served a stale page briefly, so the harness retries up to 6 times with 15 s pauses.
- `_astro` CSS returns 200; http redirects to https; apex starflight-dynamics.com 301s to www (informational, A4).
- Pages cname www.starflight-dynamics.com, https_enforced true; gh-pages tree has CNAME and .nojekyll, no open-points.
- Backup sha equals the recorded sha; wiring stage 6, last_deploy within range.
- `verify-phase-12.sh all`: 58 passed, 0 failed (live is not part of `all`).

## Deviations from Plan
- The CLAUDE.md edit was made directly (no patch recipe) since the operator's rows are already committed.
- Harness subpage URLs use a trailing slash (fix found while running the live section, Rule 1).

## Deferred
- Plausible hostname allowlist remains deferred (consider after cutover).
- Open from 12-04: WM_PUBLISH_PAT rejected at content-sync Checkout; end-to-end contributor sync not proven. Publish itself worked.
- Task 3 (operator confirms the Plausible pageview from the real domain) is done by the orchestrator via Chrome and will be appended here.

## Self-Check: PASSED

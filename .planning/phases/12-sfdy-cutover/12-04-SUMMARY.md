---
phase: 12-sfdy-cutover
plan: 04
subsystem: infra
tags: [github-actions, content-sync, gates, repository_dispatch]
requires:
  - phase: 12-03
    provides: production identity, sync-content.sh jobs guard
provides:
  - origin/main carries the cutover-ready tree (Gate A)
  - prod repo content-ci.yml dispatches slug sfdy (Gate B, partial)
  - sync-live harness section
affects: [12-05]
key-files:
  modified: [_scripts/verify-phase-12.sh]
requirements-completed: []
completed: 2026-10-14
---

# Phase 12 Plan 04: Operator gates A and B Summary

Origin main pushed and deployed (Gate A); prod repo dispatch slug fixed to `sfdy`; the live sync test dispatched correctly but content-sync.yml failed at Checkout, so the end-to-end sync is NOT proven (open blocker, WM_PUBLISH_PAT).

## Accomplishments
- Task 1: clean-worktree `npm ci` + `build-all.js` passed (done by orchestrator).
- Task 2 / Gate A: operator approved, `origin/main` pushed to f35b6f0, Deploy workflow succeeded, `https://pbau3r-sfdy.github.io/WebsiteMocker/sfdy/` returns 200. The GitHub Pages build got stuck and needed a manual rebuild trigger.
- Task 3 / Gate B (all five approved items):
  - (a) `content-ci.yml` in pbau3r-sfdy/starflight-dynamics changed `"sfdy-alt-clean"` -> `"sfdy"` via API (commit b9c0c39). Re-read confirms `"slug": "sfdy"` and no `sfdy-alt-clean`.
  - (b) `content/news/zz-sync-test.md` (frontmatter title/date/summary per newsSchema) pushed to prod main (commit 239d008). Content CI run 38590259055: success, it dispatched with slug sfdy.
  - (c) Test file deleted from prod main via API (commit 7652359); verified 404.
  - (d) No local revert commit was needed or made: the sync never committed the test file to origin main, so nothing existed to revert. Nothing pushed for (d).
  - (e) `test(12): add sync-live check (D-08)` pushed (283be3b).

## Blocker: content-sync failed at Checkout
Run 38590276658 (content-sync.yml): Resolve slug success, Checkout failure ("could not read Username for https://github.com"), remaining steps skipped. Cause: secret `WM_PUBLISH_PAT` (set 2026-08-24, listed in WebsiteMocker secrets) is rejected, almost certainly expired or revoked (earlier syncs on 2026-08-25 succeeded). Fixing needs rotating that secret, an external write that was not approved. The deletion of the test file in the prod repo also triggers content-ci and will start one more sync run that fails the same way (no content change either way).
Needed from the operator: issue a new fine-grained PAT (contents:write on pbau3r-sfdy/WebsiteMocker), set it as `WM_PUBLISH_PAT`, then re-run the live test (or accept and rely on `workflow_dispatch`). Note that `/wm-publish` also uses the publish PAT path, so check it before plan 05.

## Verification
- `bash _scripts/verify-phase-12.sh sync-live`: 5 passed, 0 failed (slug sfdy live, no old slug, template keeps {{SLUG}}, no test file in sites/sfdy content, no test file in prod repo).
- Test file absent on both sides: prod repo (404), origin main / sites/sfdy/src/content/news (only the six real posts).
- Only approved pushes done. This SUMMARY/STATE/ROADMAP commit is local and not pushed.

## Deviations from Plan
- Step 4/5 of Task 3 (sync commit on origin main, local git rm) not executable because of the PAT failure; see Blocker.
- sync-live section additionally asserts absence of the test file on both sides.

## Self-Check: PASSED (harness section, commits b9c0c39/7652359 on prod, 283be3b on origin)

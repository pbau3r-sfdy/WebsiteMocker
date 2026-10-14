---
phase: 12-sfdy-cutover
verified: 2026-10-14T18:00:00Z
status: passed
score: 8/8 requirements verified (2 closed by operator decision)
overrides_applied: 0
gaps: []
---

# Phase 12: SFDY Cutover Verification Report

**Phase Goal:** Operator can publish the reskin-2 baseline (now `sfdy`) as the live www.starflight-dynamics.com without breaking contributor content sync, leaking internal pages, or losing the old build's maintainability.
**Status:** passed
**Re-verification:** No

## Evidence run in this verification

- `bash _scripts/verify-phase-12.sh all`: 58 passed, 0 failed.
- `BACKUP_SHA=3a2f4c1b... bash _scripts/verify-phase-12.sh live`: 24 passed, 0 failed (pages 200, 404 page, robots.txt, CNAME, https enforced, backup SHA match, stage 6).
- curl against the live site: HTTP/2 200, robots.txt is `Allow: /`, zero hits for open-points / internal review on the home page.
- gh read-only: prod `content-ci.yml` dispatches `{"slug": "sfdy"}`; branches `main`, `gh-pages`, `gh-pages-old-2026-08`; content-sync runs: latest (2026-10-14 15:53Z) success, two earlier same-day failures (PAT).
- Repo state: `sites/sfdy` exists, `sites/sfdy-alt-clean-reskin-2` gone; no `JobRow`; content collections are announcements/blog/news only; `sites/sfdy/wiring.json` has stage 6, `last_deploy` 2026-10-14, prod_repo, domain, no `sandboxUsesProdId`; CLAUDE.md ownership row updated.

## Requirements coverage

| Req | Status | Evidence |
|---|---|---|
| CUT-01 | SATISFIED | No JobRow, no jobs content collection; `/jobs` is the allowed "Coming soon" page (amended CUT-01); harness `/jobs says Coming soon` passes |
| CUT-02 | SATISFIED | Gated by `SHOW_INTERNAL`; prod build checks pass in harness; live home has no open-points/internal review; gh-pages tree has no open-points |
| CUT-03 | SATISFIED (operator decision) | `12-LEGAL-CHECKLIST.md` handed over, operator accepted 2026-10-14; Plausible privacy gate passes (`check-analytics-gate sfdy --live`). Legal approval itself is an inventory, not a lawyer sign-off |
| CUT-04 | SATISFIED | ident section 11/11; single owner of repo and domain; stage 6; preflight 19 PASS, 1 WARN (empty hashtags, non-blocking) per checklist |
| CUT-05 | SATISFIED (operator decision) | Dispatch slug fixed to `sfdy` in prod repo (verified live); `sync-content.sh` jobs guard 14/14 fixture-tested; jobs folder stays in prod repo (D-07). Real file copy never observed end to end in this phase; a later sync run succeeded (15:53Z) after PAT rotation, but copy output was not inspected |
| CUT-06 | SATISFIED | Live 24/24, CNAME/robots verified, backup branch matches recorded SHA, wiring stage 6 + last_deploy, CLAUDE.md updated |
| CUT-07 | SATISFIED (operator decision) | Seed done as new website UI kit (32 new files under `ui_kits/sfdy-website/`) rather than tokens/logos, because existing design system tokens were richer. Deviates from D-12 path list; operator approved path list and finalize_plan. No deletes, no `uploads/`. Not re-verified here (Claude Design state not in scope of read-only checks) |
| DSYNC-11 | SATISFIED (operator decision) | Closed by the same live run; the seed mechanism ran live and was non-destructive |

Orphaned requirements: none.

## Anti-patterns

None blocking. Untracked `.planning/phases/12-sfdy-cutover/.backup-branch` is intentional (holds rollback branch name).

## Notes / residual risks (non-blocking)

1. CUT-05 file copy end to end and CUT-07 Claude Design content rely on operator acceptance and summary claims, not independent verification.
2. Plausible hostname allowlist remains deferred (D-11 "consider").
3. Privacy checklist open items for the operator: unrendered socials in wiring.json, Art. 26 reference for joint controller, Mailchimp double opt-in, stale DRAFT source comment.
4. Frozen planning docs of phases 9, 10, 11.1 keep the old slug (intended).

## Gaps Summary

None. Phase goal achieved in code and live state.

---

_Verified: 2026-10-14_
_Verifier: Claude (gsd-verifier)_

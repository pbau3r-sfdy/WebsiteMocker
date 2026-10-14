---
phase: 12-sfdy-cutover
plan: 01
subsystem: sfdy-baseline
tags: [rename, cutover, lockfile, harness]
requires: []
provides:
  - "sites/sfdy is the renamed reskin-2 baseline (slug sfdy, @websitemocker/sfdy, base /WebsiteMocker/sfdy)"
affects: [12-02, 12-03]
key-files:
  modified:
    - sites/sfdy/ (renamed from sites/sfdy-alt-clean-reskin-2)
    - package-lock.json
    - _scripts/verify-phase-10.sh
    - _scripts/verify-phase-11-1.sh
    - _scripts/validate-brand.mjs
    - CLAUDE.md
    - docs/analytics.md
requirements-completed: [CUT-01, CUT-04]
duration: 20min
completed: 2026-10-14
---

# Phase 12 Plan 01: Slug rename to sfdy Summary

Archived `sites/sfdy` removed, `sfdy-alt-clean-reskin-2` renamed to `sfdy`, living references, harnesses and lockfile moved to the new slug. Nothing pushed.

## Commits
- aac55bd: remove archived sites/sfdy (`git rm -r` + `rm -rf`, no delete-site --confirm; `_captures/sfdy` present)
- d7cd3c9: rename sfdy-alt-clean-reskin-2 to sfdy (rename-site.mjs; wiring slug, sandbox_url, astro base updated)
- 9f0e3fa: living references updated (package name, README, DESIGN.md, design.lock.json, keywords.json, validate-brand ACTIVE_SITES, docs/analytics.md, DESIGNER.md, PARKED.md, CLAUDE.md, workflow example slugs, sfdy-alt-clean archive_reason)
- 29fbbf7: harnesses (SLUG-parameterised verify-phase-11-1; verify-phase-10 404 dist check now FAILs if missing) and lockfile

## Verification
- build-all.js sfdy: OK. verify-phase-11-1: 21/21. verify-phase-10 all: 121/121 (404.html check executed, not skipped). verify-phase-09 all: 94/94.
- npm ci --dry-run exit 0 in a clean detached worktree (removed afterwards). node_modules/@websitemocker/sfdy symlinks to sites/sfdy; no reskin-2 link.

## Deviations from Plan
1. **Lockfile recipe simplified.** The plan assumed an uncommitted operator variant hunk in package-lock.json. In reality sfdy-alt-clean-variant was already committed (918eee6) and the working lockfile was unmodified, so the variant entries legitimately remain in the committed lockfile (4 hits, expected). The clean-worktree lock (10 deleted lines, the reskin-2 entries) was copied in and committed normally; no update-index trick needed.
2. **CLAUDE.md** had no uncommitted operator hunks (all committed at 0599849), so it was edited and committed directly. AGENTS.md needed no change (no reskin-2 mentions). CLAUDE.md dev port corrected 4409 to 4413 (matches package.json). The ownership row now reads `sfdy` with prod repo and domain placeholders for plan 03.
3. `sites/sfdy/keywords.json` meta_description rewritten to "Space systems for Europe's defence. Munich and Vilnius." (from HOME_DESCRIPTION).

## Allowed exceptions (old slug still present)
- `sites/sfdy-alt-clean-reskin/wiring.json` and `sites/sfdy-alt-clean-variant/wiring.json` archive_reason (D-03, untouched).
- `_scripts/verify-phase-11-1.sh`: imprint blob compare `0d94909^:sites/sfdy-alt-clean-reskin-2/...` (history reference). Plan 03 may need to re-baseline this assertion if the imprint changes (CUT-03).
- Frozen `.planning` docs of phases 9, 10, 11.1 keep the old name.
- `_scripts/verify-phase-08.sh` line 123 comment mentions the removed archived sites/sfdy (comment only).

## Notes for later plans
- A5: `sites/sfdy/public/images/sfdy-alt-clean-reskin-2/` left in place; `grep reskin-2 sites/sfdy/src` returns nothing.
- `_staging/design/sfdy-alt-clean-reskin-2` moved to `_staging/design/sfdy` (gitignored).
- `_scripts/import-site.mjs` default donor `sfdy` now points at the new baseline.
- Stale text left for plan 03: docs/analytics.md and CLAUDE.md Analytics line say "Remove sandboxUsesProdId at the Phase 12 cutover"; docs/analytics.md line 5 says reskin-2 (now sfdy) is the only configured site.
- CLAUDE.md still lists `sfdy-alt-clean` with the production repo/domain until plan 03; the operator's reskin ownership row for `sfdy-alt-clean-reskin` unchanged.

## Self-Check: PASSED
Commits aac55bd, d7cd3c9, 9f0e3fa, 29fbbf7 exist; `_captures/sfdy` and `sites/sfdy/wiring.json` present; `sites/sfdy-alt-clean-reskin-2` absent.

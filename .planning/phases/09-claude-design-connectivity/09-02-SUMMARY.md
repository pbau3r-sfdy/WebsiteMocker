---
phase: 09-claude-design-connectivity
plan: 02
subsystem: tooling
tags: [design-sync, lock, staging, validation]
requires: [09-01]
provides:
  - _scripts/lib/design-block.mjs (validateDesignBlock, readDesignBlock, DEFAULT_GLOBS, isUploadsPath)
  - _scripts/lib/design-lock.mjs (hash-only design.lock.json helpers)
  - _scripts/design-connect.mjs, design-stage.mjs, design-marker.mjs CLIs
  - _scripts/lib/design-marker.mjs (SD-11 markers)
  - fixtures under _scripts/fixtures/design/stage and marker
affects: [09-03, 09-04, 09-05, 09-06, 09-07, 09-08, 09-09]
key-files:
  created:
    - _scripts/lib/design-block.mjs
    - _scripts/lib/design-lock.mjs
    - _scripts/lib/design-marker.mjs
    - _scripts/design-connect.mjs
    - _scripts/design-stage.mjs
    - _scripts/design-marker.mjs
    - _scripts/fixtures/design/
requirements-completed: [DSYNC-02, DSYNC-04, DSYNC-05]
duration: 2 sessions
completed: 2026-10-14
---

# Phase 9 Plan 02: Design block, stager and markers Summary

Exit-code-enforced Node layer for the `design` wiring block, a hash-only `design.lock.json` with idempotent diffing, a staging verifier (uploads, size, symlink, zip-slip, syntax, relay checks), and public-safe `DESIGN.md`/`DESIGNER.md` markers.

## Commits
- 680b512 Task 1: design block validator and design-connect CLI
- d7d7015 Task 2: lock library and design-stage verifier
- aa40ee2 Task 3: markers

## Verification
Fixture runs against a temp `WM_ROOT`: idempotent re-pull (`added 0, changed 0, removed 0`, lock byte-identical), `--dry-run` writes nothing, and each of uploads file, 261120-byte file, bad CSS/JSX, truncated HTML, symlink, listing mismatch, zip-slip zip, symlink zip and oversize-entry zip exits 1 with the lock unchanged. A 261119-byte file passes the size rule. Inbox zip selection, `--from`, and empty-inbox failure verified. Marker output has no UUID or local path, is byte-identical on rerun, and `--remove` deletes DESIGN.md and drops the slug from DESIGNER.md. `git ls-files _staging` is empty.

## Deviations from Plan

**1. [SD-02 over plan] Binaries skipped, not hashed.** Plan step 6 said binaries are hashed with `binary: true`; the confirmed SD-02 says skip with a "skipped, binary" report line. Followed SD-02: binaries are reported and not in the lock.

**2. [Rule 1 - Bug] css-tree accepts an unclosed block silently.** `bad.css` passed `onParseError`. Added a brace/parenthesis/comment balance check so truncated CSS exits 1.

**3. [Rule 3] Fixture zips built by hand.** adm-zip `addFile` normalises `../escape.txt` and drops symlink attributes, so `zipslip.zip` and `symlink.zip` were written with a small raw zip writer (not committed). The stager checks both `entryName` and `rawEntryName`.

**4. Task 1 committed a stub `design-marker.mjs`** so design-connect's import resolved; replaced in Task 3.

**5. Already-staged files accepted for local sources.** With no `--from` and an empty inbox, the stager uses files already in `_staging/design/<slug>/files/` if present (needed by the plan's verify command); with nothing staged it fails with the drop-zip message.

## Known Stubs
None.

## Threat Flags
None beyond the plan's threat model.

## Self-Check: PASSED

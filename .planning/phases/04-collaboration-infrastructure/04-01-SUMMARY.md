---
phase: 04-collaboration-infrastructure
plan: "01"
subsystem: github-workflows
tags: [content-sync, security, workflows, verification]
depends_on: []
provides:
  - content-sync.yml receiver for repository_dispatch content-updated events
  - verify-phase-04.sh section-filtered harness for all four phase-04 plans
affects:
  - .github/workflows/ (new file, publish.yml untouched)
  - _scripts/ (new file)
tech_stack:
  added: []
  patterns:
    - env-var slug indirection (T-04-01 mitigation for shell injection)
    - find -type f -name '*.md' additive copy loop (T-04-02 mitigation)
    - ugrep-compatible grep -- separator in bash verification scripts
key_files:
  created:
    - _scripts/verify-phase-04.sh
    - .github/workflows/content-sync.yml
  modified: []
decisions:
  - D-A3 honoured: content-sync.yml contains zero build, deploy, CNAME, or robots.txt logic
  - D-A6 honoured: publish.yml is byte-identical to its Phase 1 state
  - client_payload.slug indirected through DISPATCH_SLUG env var — never interpolated in run: body
  - Additive-only sync: deletions in production repo not propagated (D-A4)
  - No stage gate in sync workflow — stage gate stays in publish.yml where it belongs
metrics:
  duration: ~12 minutes
  completed: "2026-08-21"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 4 Plan 01: Sync Receiver and Verification Harness Summary

**One-liner:** `repository_dispatch` receiver that syncs contributor Markdown into WebsiteMocker via env-var slug indirection and `find -type f -name '*.md'` copy loop, paired with a 62-check section-filtered phase harness.

## What Was Built

### Task 1 — `_scripts/verify-phase-04.sh`

Section-filtered bash verification harness for all four Phase 4 plans. Structure mirrors `verify-phase-02.sh` exactly (shebang, `set -euo pipefail`, `check()` helper). Adds a `SECTION` variable and `want()` helper so individual plans can be gated (`bash verify-phase-04.sh 01`).

62 `check()` assertions across four sections:
- **Section 01** (19 checks): content-sync.yml structure, injection safety, security controls, D-A3/D-A6 decision guards
- **Section 02** (23 checks): `_templates/` contributor bundle — CONTRIBUTING.md, issue templates, content-ci.yml
- **Section 03** (11 checks): `_scripts/init-prod-repo.mjs` syntax and dry-run behaviour
- **Section 04** (9 checks): wm-init-collab skill, wm-publish.md, CLAUDE.md, AGENTS.md

At plan 01 completion: section 01 passes 19/19, sections 02/03/04 correctly fail (their artifacts created by later plans).

### Task 2 — `.github/workflows/content-sync.yml`

Standalone receiver workflow. Does not modify `publish.yml`. Key design decisions reflected in implementation:

| Decision | Implementation |
|----------|---------------|
| D-A3: no auto-publish | Zero references to build-single, JamesIves, CNAME, robots.txt |
| D-A6: publish.yml unchanged | Separate workflow file; publish.yml not touched |
| D-A4: additive-only sync | `find -type f -name '*.md'` copy loop; no `rm`, no `rsync --delete` |
| T-04-01: injection prevention | `DISPATCH_SLUG` env var; `client_payload.slug` only in `concurrency.group` and env assignment |
| T-04-02: symlink exclusion | `find -type f` rejects symlinks; `-name '*.md'` rejects workflow/script files |
| T-04-04: race prevention | `cancel-in-progress: false` serialises per-slug dispatches |
| T-04-05: PAT scope | Production repo cloned via plain HTTPS (no credential); PAT used only for WebsiteMocker checkout and push |

Workflow steps in order: Resolve slug → Checkout → Read wiring.json → Sync content → Commit to main → Report.

Step summary (GITHUB_STEP_SUMMARY) explicitly states the live site is unchanged and operator must run `/wm-publish <slug>` — satisfying the D-A3 review handoff requirement.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed grep pattern handling for ugrep compat in verify-phase-04.sh**
- **Found during:** Task 2 verification (section 01 showed `-type f` check failing)
- **Issue:** macOS system `grep` is aliased to `ugrep` which treats patterns starting with `-` as option flags. `grep -F "-type f"` was interpreted as `grep -F -type f` where `-type` was parsed as flags, consuming `f` as a value and leaving no pattern.
- **Fix:** Added `--` end-of-options separator to all `grep -F` and `grep -E` calls in the helper functions (`count_in`, `count_re`, `count_re_js`), and changed from `grep -c` (exits 1 on 0 matches, breaking `set -e` pipelines) to `wc -l` with `|| n=0` fallback pattern.
- **Files modified:** `_scripts/verify-phase-04.sh`
- **Commit:** ed9e609 (bundled with Task 2)

## Known Stubs

None — this plan creates infrastructure only (workflow and verification script), no UI or data-rendering components.

## Threat Flags

No new security surface beyond what is documented in the plan's `<threat_model>`. All six STRIDE entries have `mitigate` disposition and are addressed:
- T-04-01: env-var indirection implemented and verified by harness injection guard
- T-04-02: `find -type f -name '*.md'` implemented and verified
- T-04-04: `cancel-in-progress: false` per-slug concurrency implemented
- T-04-05: plain HTTPS clone URL (no PAT in clone URL)
- T-04-06: zero build/deploy assertions in harness (19 checks including 4 D-A3 guards)

## Self-Check: PASSED

- FOUND: `_scripts/verify-phase-04.sh` ✓
- FOUND: `.github/workflows/content-sync.yml` ✓
- FOUND: commit `b25d20a` (verification harness) ✓
- FOUND: commit `ed9e609` (content-sync.yml + harness fix) ✓

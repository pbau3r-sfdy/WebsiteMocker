---
phase: 04-collaboration-infrastructure
plan: "03"
subsystem: installer-script
tags: [init-prod-repo, gh-cli, idempotent, dry-run, contributor-bootstrap]
depends_on: ["04-01", "04-02"]
provides:
  - "_scripts/init-prod-repo.mjs — one-command installer: orphan main, template render, labels, default branch, WM_DISPATCH_PAT check"
affects:
  - _scripts/ (new file)
tech_stack:
  added: []
  patterns:
    - dry-run-by-default with --confirm gate (archive-site.mjs / delete-site.mjs analog)
    - capture() helper for read-only gh API probes (always executes, returns null on throw)
    - renderTemplates() recursive readdirSync walk (no glob dependency — T-04-SC)
    - Title-Case slug fallback when wiring.json lacks a 'name' field
    - orphan-branch strategy for main that must never share history with gh-pages
    - created/unchanged/updated tally for idempotency reporting (D-B2)
key_files:
  created:
    - _scripts/init-prod-repo.mjs
  modified: []
decisions:
  - "D-B2 idempotency: probe gh api before orphan creation, --force on gh label create, unchanged tally on second run"
  - "D-B3 boundary: script reports WM_DISPATCH_PAT presence only — never prompts for or creates the token"
  - "D-A3 honoured: no publish path exists in this script; secret check only reports, never triggers publish"
  - "Title-Case fallback required: parrot-capital has no 'name' in wiring.json; naive read would produce 'undefined' in every contributor-facing file"
  - "Labels created in Step 1 (before templates written in Step 3) because GitHub silently drops labels referenced by issue templates that do not yet exist"
  - "--default-branch main set in Step 5 (after git push origin main in Step 4) because GitHub requires the branch to exist before it can be set as default"
  - "Placeholder assertion checks {{[A-Z_]+}} not bare {{ to avoid false positives from GitHub Actions ${{ ... }} expression syntax in content-ci.yml"
  - "Clone URL is plain https://github.com/OWNER/REPO.git with no embedded token — auth via gh credential helper (T-04-15)"
metrics:
  duration: ~25 minutes
  completed: "2026-08-21"
  tasks_completed: 2
  files_created: 1
  files_modified: 0
---

# Phase 4 Plan 03: Production Repo Installer Summary

**One-liner:** `_scripts/init-prod-repo.mjs` — dry-run-by-default installer that bootstraps a production repo with an orphan main branch, rendered `_templates/` bundle, three auto-labels, and main as default branch, in one command with idempotent re-run behaviour.

## What Was Built

### Tasks 1 + 2 — `_scripts/init-prod-repo.mjs` (388 lines)

The script was designed and implemented as a complete unit. Task 1 covers the skeleton, preflight, substitution, rendering, and dry-run output. Task 2 appends the execution path. Both tasks operate on the same file and were committed together.

#### Script structure

| Section | Lines | What it does |
|---|---|---|
| Shebang + JSDoc header | 1–22 | Script identity, usage, six-step bullet list |
| Imports | 24–29 | fs, path, url, child_process, os — no new npm packages |
| ROOT resolution | 31 | `join(fileURLToPath(import.meta.url), '..', '..')` — import-site.mjs pattern |
| CLI parsing | 34–40 | `[slug, ...rest]`, `CONFIRM = rest.includes('--confirm')` |
| Helpers | 42–68 | `log/info/ok/warn/fail/dry`, `run()` (dry-print or execSync), `capture()` (always runs) |
| 8 preflight checks | 70–104 | gh on PATH, gh auth, wiring.json exists/parses, prod_repo set, domain set, prod_repo regex, slug regex, _templates/ exists |
| Substitution map | 106–120 | SITE_NAME with Title-Case fallback, SLUG, PROD_REPO, DOMAIN |
| renderTemplates() | 122–149 | Recursive readdirSync walk, token replace, `{{[A-Z_]+}}` assertion |
| Stage-6 gate | 151–158 | Drops content-ci.yml for sites at stage < 6 |
| Labels constant | 160–164 | Three label definitions with name, hex colour, description |
| Dry-run plan output | 166–241 | Header (DRY RUN), resolved values, numbered six-step list, hint block, process.exit(0) |
| Execution path | 243–386 | Step 1–6 with try/finally cleanup |

#### Six execution steps (--confirm path)

| Step | What | Idempotency |
|---|---|---|
| 1 — Labels | `gh label create --force` × 3 | `--force` updates existing; probes first to report ok vs warn |
| 2 — main branch | Probe `gh api repos/.../branches/main`; orphan if absent, depth-1 clone if present | Two-path probe prevents double-orphan |
| 3 — Template files | `writeFileSync` for each `{relPath, content}` + four `content/*/.gitkeep` | Overwrites deterministically rendered content |
| 4 — Commit + push | `git add -A`, commit, `git push origin main`; tolerates no-op commit | catch block increments `unchanged` on no changes |
| 5 — Default branch | `gh repo edit --default-branch main` | Runs after push (branch must exist); GitHub is idempotent on already-default branch |
| 6 — Secret check | `gh secret list --repo`; reports presence; warns + points at wm-init-collab if absent (stage 6 only) | Read-only; never fails the run |

#### Security mitigations (from threat model)

| Threat | Mitigation in implementation |
|---|---|
| T-04-13: shell injection via slug/prod_repo | `^[a-z0-9-]+$` and `^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$` guards in preflight (fail before any execSync) |
| T-04-14: gh-pages destruction | Script only ever creates/pushes `main`; `git rm -rf .` runs in orphan worktree in tmp dir; `grep -v push.*gh-pages` returns 0 |
| T-04-15: credential in clone URL | Plain `https://github.com/OWNER/REPO.git`; no token in URL; auth via `gh` credential helper |
| T-04-16: unsubstituted placeholder to public repo | `{{[A-Z_]+}}` assertion in renderTemplates() fails the run naming the offending file |
| T-04-18: content-ci.yml on non-live site | `wiring.stage >= 6` gate drops the file from the render list for stage < 6 sites |
| T-04-30: re-run destroys live repo | Branch probe + --force labels + deterministic writes → idempotent; second run reports `unchanged` |
| T-04-SC: no new npm packages | `readdirSync` recursive walk replaces any glob dependency |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] GitHub Actions `${{ }}` expressions triggered unsubstituted placeholder assertion**
- **Found during:** Task 1 verification — `node _scripts/init-prod-repo.mjs mogwai-systems` exited 1 with `Unsubstituted placeholder in .github/workflows/content-ci.yml: {{ github.ref }}`
- **Issue:** The plan specified asserting `no rendered content still contains the substring {{`. The `content-ci.yml` template contains valid GitHub Actions expressions like `${{ github.ref }}` and `${{ secrets.WM_DISPATCH_PAT }}` which contain `{{` but are not project tokens.
- **Fix:** Changed the assertion regex from `/\{\{[^}]+\}\}/` (matches any `{{...}}`) to `/\{\{[A-Z_]+\}\}/` (matches our uppercase-only token format only). GitHub Actions expressions use lowercase letters, dots, and are preceded by `$`, so they don't match the new pattern.
- **Files modified:** `_scripts/init-prod-repo.mjs`
- **Commit:** 765795b (same commit — fixed during Task 1 implementation)

## Known Stubs

None — this plan creates a script that operates on production repos. No UI or data-rendering components.

## Threat Flags

No new security surface beyond the plan's `<threat_model>`. All seven STRIDE entries have `mitigate` disposition and are addressed (see table above).

## Self-Check: PASSED

- FOUND: `_scripts/init-prod-repo.mjs` (388 lines) ✓
- FOUND: commit `765795b` ✓
- `node --check _scripts/init-prod-repo.mjs` exits 0 ✓
- `bash _scripts/verify-phase-04.sh 03`: 11/11 PASS ✓
- `parrot-capital` renders as `Parrot Capital`, no `undefined` ✓
- `gh label create` (line 254) before `writeFileSync` issue templates (line 300) ✓
- `git push origin main` (line 340) before `--default-branch main` (line 348) ✓
- `grep -c 'WM_PUBLISH_PAT'` returns 0 ✓
- `grep -v push.*gh-pages` returns 0 ✓
- Working tree clean after all four dry-run invocations ✓

---
phase: 05-design-artifact-ingestion
plan: "02"
subsystem: scripts,skills
tags: [ingest, section-mode, operator-skill, astro-components, collision-gate]
dependency_graph:
  requires: [ingest-artifact-script]
  provides: [section-mode, wm-ingest-skill]
  affects: [sites/<slug>/src/components/, .claude/skills/]
tech_stack:
  added: []
  patterns:
    - Section mode: single-section extract to src/components/ only, never src/pages/
    - Operator skill: 7-step guided flow with mandatory collision confirmation gate
    - writeSectionMode helper: re-parses HAST tree to locate specific section node
    - process.exit(0) early return after section mode prevents full-site loop
key_files:
  created:
    - .claude/skills/wm-ingest.md
  modified:
    - _scripts/ingest-artifact.mjs
decisions:
  - "Section mode uses process.exit(0) after writeSectionMode() to prevent full-site loop from running"
  - "writeSectionMode re-parses artifact HTML from disk (as per plan spec) rather than receiving pre-parsed HAST"
  - "Section matching falls back through: id match → class[0] match → tag match when no id/class"
  - "Skill uses node _scripts/build-all.js <slug> in Step 7 (matches existing script convention)"
metrics:
  duration: "~25 minutes"
  completed: "2026-08-21"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 1
requirements_closed: [INGEST-03]
---

# Phase 05 Plan 02: Section Mode + wm-ingest Skill Summary

**One-liner:** Section mode added to ingest-artifact.mjs (single named section → new component, no page modification) and wm-ingest.md operator skill created with 7-step guided flow including mandatory collision gate.

## What Was Built

### 1. Section mode in `_scripts/ingest-artifact.mjs`

Three additions to the script:
- **Validation guard** (after MODE GUARD): `--mode section` without `--section <name>` exits 1 with a clear error
- **`writeSectionMode()`** helper function (80+ lines): finds section by id/class/name, re-parses HAST tree, extracts scoped CSS, handles base64 images, rewrites local paths, writes one `.astro` component to `src/components/`, prints manual import instruction. Never writes to `src/pages/`.
- **Routing block**: `if (modeArg === 'section')` — calls `writeSectionMode()` and `process.exit(0)` before the full-site loop, ensuring clean separation

### 2. `.claude/skills/wm-ingest.md`

7-step operator skill following exact `wm-instantiate.md` format:
1. Collect inputs (slug, artifact, mode)
2. Stage artifact to `_captures/<slug>/raw/artifact.html`
3. Analyze with `node _scripts/ingest-artifact.mjs <slug> --analyze`
4. Confirm CSS collision report (mandatory gate — `y` required even at 0 conflicts)
5. Run ingest (`--mode full` or `--mode section --section <name>`)
6. Surface brand candidates (informational only — NOT written to wiring.json)
7. Verify with `node _scripts/build-all.js <slug>`, report results

## Task Outcomes

| Task | Status | Commit |
|------|--------|--------|
| Task 1: Section mode in ingest-artifact.mjs | DONE | a7dce56 |
| Task 2: Operator skill wm-ingest.md | DONE | 07bd69e |

## Acceptance Criteria Verification

| Criterion | Result |
|-----------|--------|
| `--mode section` without `--section` exits 1 | PASS |
| `--mode section --section hero --dry-run` exits 0 with '[dry] would write Hero.astro' | PASS |
| 'No existing pages were modified.' in dry-run output | PASS |
| After real write: `Hero.astro` exists in `src/components/` | PASS |
| `git diff --name-only sites/sfdy-alt-clean/src/pages/` returns empty | PASS |
| stdout includes manual import instruction with 'import Hero from' | PASS |
| `node --check _scripts/ingest-artifact.mjs` exits 0 | PASS |
| `.claude/skills/wm-ingest.md` exists | PASS |
| First line is `# /wm-ingest` | PASS |
| `grep -c '### [0-9]\.' wm-ingest.md` returns 7 | PASS |
| File contains `node _scripts/ingest-artifact.mjs` at least twice (3 times) | PASS |
| File contains 'Collision scan complete' | PASS |
| File contains '(y/N)' in Step 4 | PASS |
| File contains 'informational only' in Step 6 | PASS |
| `## Notes` section exists with ≥6 bullet points (12 found) | PASS |
| No 'auto-populate', 'auto-write', 'auto-add', 'is:global' | PASS |

## Deviations from Plan

None - plan executed exactly as written. All spec items implemented as specified including the HAST re-parse in `writeSectionMode`, the exact collision gate wording, and the wm-instantiate.md format for the skill.

## Known Stubs

None.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced.

Threat mitigations implemented:
- **T-05-05 (Tampering — section mode writes to pages/):** `writeSectionMode` has zero `writeFileSync` calls targeting `src/pages/`. The section routing block calls `process.exit(0)` before the full-site loop (which writes `index.astro`). Verified via `git diff --name-only sites/sfdy-alt-clean/src/pages/` returning empty after section mode run.
- **T-05-06 (Elevation — skill bypasses collision gate):** Step 4 of `wm-ingest.md` is an explicit blocking step requiring `y` before Step 5. Documented as mandatory even with 0 collisions.

## Self-Check: PASSED

Files created/modified:
- `/tmp/claude-worktrees/agent-a902b04f7d62d18de/_scripts/ingest-artifact.mjs` — FOUND (modified)
- `/tmp/claude-worktrees/agent-a902b04f7d62d18de/.claude/skills/wm-ingest.md` — FOUND (created)

Commits:
- a7dce56 (Task 1: section mode) — FOUND
- 07bd69e (Task 2: wm-ingest skill) — FOUND

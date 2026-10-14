---
plan: 06-03
phase: 06-doc-pipeline
status: complete
completed: 2026-08-24
subsystem: skills
tags: [wm-gen-docs, doc-pipeline, operator-ux, confirm-gate, gh-api]
dependency_graph:
  requires: [06-02]
  provides: [DOCS-03]
  affects: [.claude/skills/wm-gen-docs.md]
tech_stack:
  added: []
  patterns: [7-step skill, D-07 mandatory confirm gate, dry-run before commit, wm-ingest structure]
key_files:
  created: [.claude/skills/wm-gen-docs.md]
  modified: []
decisions:
  - "Mirrored wm-ingest.md structure exactly: header → one-paragraph summary → --- → ## Steps → 7 numbered steps → ## Notes"
  - "Confirm gate (Step 5) uses exact D-06 summary box format from RESEARCH.md Pattern 7"
  - "Step 4 runs script with --dry-run to produce summary before Step 5 gate fires"
  - "Step 6 re-runs script with --commit after operator types y — zero code duplication"
  - "Notes section covers all six operator constraints from threat model and context decisions"
metrics:
  duration_minutes: 4
  tasks_completed: 1
  files_modified: 1
---

# Phase 6 Plan 03: wm-gen-docs Skill Summary

## One-liner

`/wm-gen-docs` operator skill wrapping 7-step doc pipeline: validate → stage → dry-run → D-07 mandatory confirm gate → `--commit` → report URL.

## What Was Built

Created `.claude/skills/wm-gen-docs.md` — the DOCS-03 delivery. The skill guides the operator from artifact staging through brand token review to a committed HTML file in the target production repo's `docs/` folder, without requiring any Astro build.

### Skill Structure

| Step | Name | Key action |
|------|------|------------|
| 1 | Collect inputs | slug, artifact, --name, --format md, --target-repo |
| 2 | Validate wiring.json | slug exists, prod_repo set, brand.doc_tokens populated |
| 3 | Stage the artifact | write pasted HTML to `_captures/<slug>/raw/artifact.html` or confirm .zip path |
| 4 | Dry-run preview | `ingest-artifact.mjs <slug> --mode docs ... --dry-run` |
| 5 | Confirm gate (D-06/D-07) | exact summary box format; mandatory y/N; cannot be bypassed |
| 6 | Generate and commit | `ingest-artifact.mjs <slug> --mode docs ... --commit` |
| 7 | Report done | committed URL(s), token injection count |

### Acceptance Criteria Verified

| Check | Result |
|-------|--------|
| `grep -c 'Proceed with commit'` | 1 ✓ |
| `grep -c '\-\-commit'` | 3 ✓ (≥2) |
| `grep -c 'brand.doc_tokens'` | 4 ✓ (≥2) |
| `grep -c '\-\-dry-run'` | 1 ✓ |
| `grep -c '\-\-target-repo'` | 5 ✓ (≥2) |
| `grep -c '### [0-9]'` | 7 ✓ (exactly 7) |
| `grep -c '## Notes'` | 1 ✓ |
| `grep -c 'cannot be bypassed'` | 1 ✓ |

## Commits

| Task | Hash | Description |
|------|------|-------------|
| Task 1 | 3964968 | feat(06-03): create wm-gen-docs skill — 7-step doc pipeline UX with D-07 confirm gate |

## Deviations from Plan

None — plan executed exactly as written. All seven steps implemented with prose and bash blocks matching `wm-ingest.md` conventions.

## Known Stubs

None. The skill is a complete operator guide. No data sources are wired — this is by design (the skill is a prompt, not executable code).

## Threat Flags

None. The skill's text explicitly enforces T-06-05 (confirm gate bypass prevention) and T-06-06 (--target-repo org restriction). No new network endpoints or file access patterns introduced.

## Self-Check: PASSED

- `.claude/skills/wm-gen-docs.md` exists: FOUND
- Commit 3964968 exists: confirmed (`git log --oneline` verified)
- All 8 acceptance criteria: PASS (see table above)
- File structure matches wm-ingest.md: # header → summary → --- → ## Steps → 7 numbered steps → ## Notes ✓

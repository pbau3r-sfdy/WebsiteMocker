---
phase: 07-archive-module
plan: 02
subsystem: skills
tags: [wayback, archive, skill, guided-wrapper, capture]
dependency_graph:
  requires: [_scripts/archive-browse.mjs]
  provides: [.claude/skills/wm-archive-browse.md]
  affects: []
tech_stack:
  added: []
  patterns: [skill-guided-wrapper, confirm-gate, shell-out-display-confirm-exec]
key_files:
  created:
    - .claude/skills/wm-archive-browse.md
  modified: []
decisions:
  - "Confirm gate in Step 4 uses exact analog language: Do NOT proceed until operator explicitly types y (mirrors wm-gen-docs.md)"
  - "Step 6 (Done) matches wm-gen-docs.md Step 7 completion pattern — one sentence with re-run instruction"
  - "if_ URL shown in a plain fenced code block (no language tag) for easy click-through"
metrics:
  duration: 5m
  completed: 2026-08-25
  tasks_completed: 1
  files_created: 1
  files_modified: 0
---

# Phase 07 Plan 02: wm-archive-browse skill — Interactive archive inspection wrapper

One-liner: Six-step Claude skill that wraps archive-browse.mjs with a guided timeline → inspect → confirm → optional capture flow and a mandatory explicit-y gate before running --capture.

## What Was Built

`.claude/skills/wm-archive-browse.md` — 71-line Markdown skill file that:

1. Prompts the operator for a slug or bare domain (Step 1)
2. Shells out to `node _scripts/archive-browse.mjs <slug>` and presents the year-grouped CDX timeline verbatim (Step 2)
3. Asks the operator for a 14-digit timestamp to inspect, or Enter to exit (Step 3)
4. Prints the `if_` toolbar-stripped URL in a plain code block, instructs browser inspection, then asks "Capture this snapshot? (y/n)" — gate blocks until operator explicitly types `y` (Step 4)
5. Runs `node _scripts/archive-browse.mjs <slug> --capture <timestamp>` and reports the `_captures/<slug>-<timestamp>/` output path (Step 5)
6. Reports "Timeline browsing complete" (Step 6)
7. Notes section covers `--limit`, `wiring.json` domain dependency, bare domain mode, namespaced output, and internet requirement

Structural pattern matches `wm-gen-docs.md` and `wm-ingest.md` exactly: `# /wm-skill-name` → description paragraph → `---` → `## Steps` → numbered steps → `---` → `## Notes`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create .claude/skills/wm-archive-browse.md (ARCH-05) | e113833 | .claude/skills/wm-archive-browse.md (created) |

## Verification Results

All plan verification checks passed:

| Check | Expected | Result |
|-------|----------|--------|
| `grep -c "^# /wm-archive-browse"` | 1 | 1 |
| `grep -c "^## Steps"` | 1 | 1 |
| `grep -c "^### [0-9]\."` | 6 | 6 |
| `grep -c "Do NOT proceed"` | ≥1 | 1 |
| `grep -c "explicitly types"` | ≥1 | 1 |
| `grep -c "archive-browse.mjs"` | ≥2 | 2 |
| `grep -c "if_"` | ≥1 | 2 |
| `grep -c "^## Notes"` | 1 | 1 |
| `grep -c "Prerequisites\|## Usage"` | 0 | 0 |

## Security Notes (Threat Model)

- **T-07-05 mitigated by design:** Skill instructs Claude to pass slug and timestamp args unmodified to the script; script-level validation (slug `/^[a-z0-9-]+$/`, timestamp `/^\d{14}$/`) provides the actual guard (implemented in 07-01).
- **T-07-06 mitigated:** Step 4 includes mandatory "Do NOT proceed until the operator explicitly types `y`" language with a note that the gate cannot be bypassed.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — the skill is complete and self-contained. All six steps are fully specified.

## Threat Flags

None — the skill is a Markdown file with no new network endpoints, auth paths, or file access patterns.

## Self-Check: PASSED

- [x] `.claude/skills/wm-archive-browse.md` exists: FOUND
- [x] Commit e113833 exists: FOUND
- [x] First line is exactly `# /wm-archive-browse`: CONFIRMED
- [x] Six numbered steps: CONFIRMED (grep count = 6)
- [x] Step 4 confirm gate language present: CONFIRMED
- [x] Step 2 bash code block with `node _scripts/archive-browse.mjs <slug>`: CONFIRMED
- [x] Step 5 bash code block with `node _scripts/archive-browse.mjs <slug> --capture <timestamp>`: CONFIRMED
- [x] `if_` URL format present: CONFIRMED
- [x] `## Notes` section present: CONFIRMED
- [x] No `## Prerequisites` or `## Usage` sections: CONFIRMED
- [x] No reference to `wm-gen-docs.md` or `wm-ingest.md` by name in skill body: CONFIRMED

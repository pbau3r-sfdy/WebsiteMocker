---
phase: 03-brand-consistency
plan: "01"
subsystem: brand-schema
tags: [brand, wiring-json, schema, configuration]
dependency_graph:
  requires: []
  provides: [brand-block-schema, wiring-json-brand-stub]
  affects: [wm-wire, wm-add-news, wm-add-announcement, wm-add-blog, wm-add-job]
tech_stack:
  added: []
  patterns: [json-config, markdown-schema-doc]
key_files:
  created:
    - _core/brand-schema.md
  modified:
    - sites/sfdy-alt-clean/wiring.json
    - sites/mogwai-systems/wiring.json
    - sites/parrot-capital/wiring.json
    - sites/crestworks/wiring.json
decisions:
  - "Brand block inserted after 'legal' key (or before 'notes' when no legal key exists) — preserves logical config grouping"
  - "All stubs use empty arrays and empty string — inert by design, no behaviour change"
  - "_core/brand-schema.md as canonical discoverable reference — primary audience is Claude.ai for operator-assisted brand block generation"
metrics:
  duration: "10 minutes"
  completed: "2026-08-20"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 4
---

# Phase 3 Plan 01: Brand Stub Schema Summary

**One-liner:** Empty brand stub block (hashtags/vocabulary/avoid/voice) added to all four active wiring.json files, with discoverable field-reference schema at `_core/brand-schema.md`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Insert brand stub into all four active wiring.json files | 8151779 | sites/sfdy-alt-clean/wiring.json, sites/mogwai-systems/wiring.json, sites/parrot-capital/wiring.json, sites/crestworks/wiring.json |
| 2 | Create _core/brand-schema.md — discoverable schema reference | f101a76 | _core/brand-schema.md |

## Decisions Made

1. **Insertion placement per plan spec** — sfdy-alt-clean: after legal, before capture; mogwai-systems: after capture (no legal key), before notes; parrot-capital and crestworks: after legal, before robots.
2. **Stubs are intentionally inert** — empty arrays and empty string voice field produce no behaviour change in existing content skills. Plan 03-03 adds brand-awareness logic.
3. **Schema file audience is Claude.ai** — `_core/brand-schema.md` is structured so an operator can paste it into Claude.ai and Claude.ai can generate a valid, populated brand block without additional instruction.

## Verification Results

All four wiring.json files parse as valid JSON. Brand block validation (node JSON.parse + field type checks) passed for all four sites. `_core/brand-schema.md` contains all required sections: field reference table, minimal stub, populated example, and notes on optional enrichment semantics.

## Deviations from Plan

None — plan executed exactly as written. Insertion points matched per-file rules specified in the plan.

## Known Stubs

The brand blocks inserted are intentionally empty stubs (four fields, all blank/empty). This is the stated goal of Plan 01 — stubs are the artifact, not a gap. Plans 03-02 and 03-03 add the wm-wire tooling and content-skill integration that will populate these stubs with real brand data.

## Self-Check: PASSED

- sites/sfdy-alt-clean/wiring.json: FOUND
- sites/mogwai-systems/wiring.json: FOUND
- sites/parrot-capital/wiring.json: FOUND
- sites/crestworks/wiring.json: FOUND
- _core/brand-schema.md: FOUND
- Commit 8151779: FOUND
- Commit f101a76: FOUND

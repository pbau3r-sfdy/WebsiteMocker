---
phase: 09-claude-design-connectivity
plan: 05
subsystem: design-sync
tags: [design-sync, ingest, divergence-guard]
requires: [09-02, 09-03, 09-04]
provides:
  - "ingest-artifact.mjs: --input, --accept, WM_ROOT, hash-at-ingest guard (exit 3)"
  - "design-ingest.mjs: sanitise -> render -> section ingest orchestrator"
affects: [09-06]
tech-stack:
  added: []
  patterns: ["hash-at-ingest divergence guard via design.lock.json", "css-tree scoped CSS extraction keeping @media"]
key-files:
  created:
    - _scripts/design-ingest.mjs
    - _scripts/fixtures/design/ingest/page.html
    - _scripts/fixtures/design/ingest/site/
    - _scripts/fixtures/design/ingest/project/
  modified:
    - _scripts/ingest-artifact.mjs
key-decisions:
  - "SD-08: <Name>.incoming.astro lives next to the component in src/components/"
  - "SD-07: sections found to depth 4 inside wrappers; css-tree extractor keeps @media/@supports"
  - "SD-06: JSX rendering enabled; Card.jsx ran via the ssr path"
metrics:
  tasks: 2
  completed: 2026-10-14
---

# Phase 9 Plan 05: Ingest Guard and Orchestrator Summary

Section ingest now reads staged input and refuses to overwrite hand-edited or untracked components; `design-ingest.mjs` feeds it only sanitised copies.

## Tasks

| Task | Name | Commit |
|------|------|--------|
| 1 | --input, --accept, hash-at-ingest guard | e52aacb |
| 2 | design-ingest.mjs orchestrator | 98dc7cf |

## Details

- Guard (D-05, D-06): `checkComponent` runs before every section write. `edited` or `untracked` without the name in `--accept` skips the write, writes `<Name>.incoming.astro` with a line-diff summary in frontmatter comments, warns by name, and the run exits 3. `--accept Name` overwrites, records the hash in `design.lock.json`, and removes a stale incoming file. Dry-run prints `[dry] would skip Hero (edited by hand)`.
- Without `--input` the artifact path is the old `_captures/<slug>/raw/artifact.html`. `WM_ROOT` overrides the repo root.
- SD-07: new `findSectionNodes` (depth 4 below body, wrappers such as `div`/`x-dc`); `extractScopedCSS` rewritten on css-tree, `@media` blocks keep only matching rules.
- Orchestrator: validates design block, renders JSX (Card.jsx via `ssr`), wraps in a `<section class="kebab-name">`, sanitises everything, writes `sanitise-report.json`, lists sections via `--analyze`, fails on component-name collisions before writing, then calls section ingest per section. Exit 1 on failure, 3 on skipped hand-edited components. Never writes `src/pages/`.
- verify-phase-05.sh: 41 passed before, 41 passed after. No Astro change, no npm install (css-tree was already present and used by design-sanitise).
- Verified on fixtures: first run exit 0, edited Hero run exit 3 with other components ingested, no `<script`/`onclick` in components, empty staging exits 1 with `nothing staged`.

## Deviations from Plan

None - plan executed as written. The `--analyze` output was already JSON, so no `--json` flag was needed.

## Known Stubs

None.

## Self-Check: PASSED

Commits e52aacb and 98dc7cf and the created files verified present.

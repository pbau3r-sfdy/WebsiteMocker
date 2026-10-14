---
phase: 02-content-system
plan: "05"
subsystem: content
tags: [content-layer, astro5, scaffold, mogwai-systems, parrot-capital]
dependency_graph:
  requires: [02-01]
  provides: [content-dirs-mogwai, content-dirs-parrot, parrot-layout]
  affects: [02-07, 02-08]
tech_stack:
  added: []
  patterns: [astro5-content-layer, glob-loader, per-site-content-config, css-token-stubs]
key_files:
  created:
    - sites/mogwai-systems/src/content.config.ts
    - sites/mogwai-systems/src/content/news/.gitkeep
    - sites/mogwai-systems/src/content/jobs/.gitkeep
    - sites/mogwai-systems/src/content/announcements/.gitkeep
    - sites/mogwai-systems/src/content/blog/.gitkeep
    - sites/parrot-capital/src/layouts/Layout.astro
    - sites/parrot-capital/src/content.config.ts
    - sites/parrot-capital/src/content/news/.gitkeep
    - sites/parrot-capital/src/content/jobs/.gitkeep
    - sites/parrot-capital/src/content/announcements/.gitkeep
    - sites/parrot-capital/src/content/blog/.gitkeep
  modified: []
decisions:
  - "02-05: parrot-capital Layout.astro maps old index.astro vars (--bg, --crimson, --gold, --text, --muted) to full UI-SPEC token set (--bg-base, --accent, --text-primary, etc.) for content page compatibility"
  - "02-05: .gitkeep files ensure glob() loaders find valid base directories even when no content has been published yet"
metrics:
  duration: ~4 minutes
  completed: 2026-08-20
  tasks_completed: 2
  files_created: 11
  files_modified: 0
---

# Phase 2 Plan 05: mogwai-systems + parrot-capital Content System Scaffold Summary

**One-liner:** Astro 5 Content Layer registration (4 glob() loaders each) + parrot-capital Layout.astro with full UI-SPEC token set for both holding-page sites.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Scaffold mogwai-systems content.config.ts + content directories | e453ff2 | content.config.ts + 4 .gitkeep files |
| 2 | Scaffold parrot-capital Layout.astro + content.config.ts + content directories | 8a1992d | Layout.astro + content.config.ts + 4 .gitkeep files |

## What Was Built

**mogwai-systems** received its Astro 5 content system: `src/content.config.ts` registers four collections (news, jobs, announcements, blog) using glob() loaders pointed at `./src/content/<collection>`, importing all Zod schemas from `_core/src/content.config.ts`. Four content directories were created with `.gitkeep` files so glob() finds valid base paths.

**parrot-capital** received the same content system plus a new `src/layouts/Layout.astro`. The layout provides a minimal HTML shell with the full UI-SPEC CSS custom property token set, using parrot-capital brand values extracted from the existing `index.astro` (--bg-base: #FCF4ED, --accent: #8E1520, --text-primary: #1E0810, etc.). Content pages in Plans 07/08 can now import Layout.astro.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — no UI stubs exist. Layout.astro tokens use real brand values from the existing index.astro palette.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes. All files are build-time scaffold only.

## Self-Check: PASSED

- sites/mogwai-systems/src/content.config.ts — exists, 4 glob() loaders, imports from _core
- sites/parrot-capital/src/content.config.ts — exists, 4 glob() loaders, imports from _core
- All 8 .gitkeep files — present
- sites/parrot-capital/src/layouts/Layout.astro — exists, contains `<slot />` and `var(--bg-base)`
- Commits e453ff2, 8a1992d — verified in git log

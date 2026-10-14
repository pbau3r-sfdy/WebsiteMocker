---
phase: 02-content-system
plan: "04"
subsystem: content-migration
tags: [astro5, content-layer, sfdy-alt-clean, migration]
dependency_graph:
  requires: [02-02, 02-03]
  provides: [sfdy-alt-clean-astro5-content]
  affects: [sites/sfdy-alt-clean]
tech_stack:
  added: []
  patterns: [astro5-content-layer-api, glob-loader, per-site-content-config]
key_files:
  created:
    - sites/sfdy-alt-clean/src/content.config.ts
    - sites/sfdy-alt-clean/src/content/jobs/.gitkeep
    - sites/sfdy-alt-clean/src/content/announcements/.gitkeep
    - sites/sfdy-alt-clean/src/content/blog/.gitkeep
  modified:
    - sites/sfdy-alt-clean/src/pages/news/index.astro
    - sites/sfdy-alt-clean/src/pages/news/[slug].astro
    - sites/sfdy-alt-clean/src/components/NewsCard.astro
    - sites/sfdy-alt-clean/src/pages/index.astro
  deleted:
    - sites/sfdy-alt-clean/src/content/config.ts
decisions:
  - "02-04: entry.id for files named YYYY-MM-DD-slug.md equals YYYY-MM-DD-slug — identical to former post.slug, preserving all 6 live news URLs"
  - "02-04: .gitkeep files created for jobs/announcements/blog dirs in same commit as content.config.ts to prevent glob() throw on missing base directory"
  - "02-04: homepage index.astro slug prop updated to id alongside NewsCard interface change — required for TypeScript type safety"
metrics:
  duration: "~5 minutes"
  completed: "2026-08-20T22:20:53Z"
  tasks_completed: 2
  files_created: 5
  files_modified: 4
  files_deleted: 1
---

# Phase 2 Plan 04: sfdy-alt-clean Astro 5 Content Layer Migration Summary

**One-liner:** Migrated sfdy-alt-clean from Astro 4 content API to Astro 5 Content Layer API with glob() loaders importing Zod schemas from _core, preserving all 6 live news article URLs.

## What Was Built

- `sites/sfdy-alt-clean/src/content.config.ts` — Astro 5 per-site content registration with glob() loaders for news, jobs, announcements, blog; imports schemas from `_core/src/content.config.ts`
- Deleted `sites/sfdy-alt-clean/src/content/config.ts` (Astro 4 legacy `type: 'content'` + `defineCollection` pattern)
- Created `.gitkeep` files for jobs, announcements, blog content directories (prevents glob() throw on missing base dir)
- `news/index.astro` — `post.slug` → `post.id`; date `<span>` → `<time datetime="YYYY-MM-DD">`
- `news/[slug].astro` — added standalone `render` import; `post.slug` → `post.id`; `post.render()` → `render(post)`; date `<span>` → `<time datetime>`
- `NewsCard.astro` — `slug: string` prop → `id: string`; href uses `id`
- `index.astro` (homepage) — `slug={post.slug}` → `id={post.id}` to match updated NewsCard interface

## Task Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 — content.config.ts + delete legacy | 755052b | feat(02-04): create sfdy-alt-clean Astro 5 content.config.ts + delete legacy Astro 4 config |
| 2 — news pages + NewsCard migration | a1d27e8 | feat(02-04): migrate sfdy-alt-clean news pages to Astro 5 + update NewsCard |

## Verification Results

- `grep -r "post\.slug\|post\.render\|entry\.slug\|entry\.render" sites/sfdy-alt-clean/src/pages/news/ sites/sfdy-alt-clean/src/components/NewsCard.astro` → empty (PASS)
- `grep -c "loader: glob" sites/sfdy-alt-clean/src/content.config.ts` → 4 (PASS)
- `test ! -f sites/sfdy-alt-clean/src/content/config.ts` → exits 0 (PASS)
- `cd sites/sfdy-alt-clean && npm run build` → exits 0, 6 news articles at original paths (PASS)

## Build Output — News URL Verification

All 6 existing news articles generated at their original paths (entry.id = former entry.slug):
- `/news/2025-07-23-pre-seed-round/`
- `/news/2025-07-29-baainbw-contract/`
- `/news/2025-09-29-startup-lithuania/`
- `/news/2025-11-04-reagan-milestone/`
- `/news/2025-12-01-tough-tech-report/`
- `/news/2026-06-18-jonas-radtke-vp-operations/`

## Deviations from Plan

**1. [Rule 2 - Missing critical update] Homepage index.astro slug prop updated to id**
- **Found during:** Task 2 — reading index.astro to check for slug references
- **Issue:** index.astro passes `slug={post.slug}` to NewsCard; NewsCard interface changed from `slug` to `id`; would cause TypeScript type error and broken news card links
- **Fix:** Changed `slug={post.slug}` to `id={post.id}` in the NewsCard invocation on the homepage
- **Files modified:** `sites/sfdy-alt-clean/src/pages/index.astro`
- **Commit:** a1d27e8 (included in Task 2 commit)

## Known Stubs

None — all 6 news articles are real content, no placeholders.

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes at trust boundaries introduced. Content migration only.

## Self-Check: PASSED

- [x] `sites/sfdy-alt-clean/src/content.config.ts` exists
- [x] `sites/sfdy-alt-clean/src/content/config.ts` deleted
- [x] `sites/sfdy-alt-clean/src/content/jobs/.gitkeep` exists
- [x] `sites/sfdy-alt-clean/src/content/announcements/.gitkeep` exists
- [x] `sites/sfdy-alt-clean/src/content/blog/.gitkeep` exists
- [x] Commit 755052b exists
- [x] Commit a1d27e8 exists
- [x] Build exits 0 with 6 news articles

---
phase: 02-content-system
plan: "06"
subsystem: sfdy-alt-clean content pages
tags: [astro5, content-pages, jobs, announcements, blog, sfdy-alt-clean]
completed: 2026-08-20T22:31:30Z
duration: "~4 min"

dependency_graph:
  requires: [02-04]
  provides: [sfdy-jobs-pages, sfdy-announcements-pages, sfdy-blog-pages]
  affects: [sfdy-alt-clean build]

tech_stack:
  added: []
  patterns:
    - "Cross-repo _core component imports via relative path (../../../../../_core/src/components/)"
    - "BASE_URL pattern: const b = import.meta.env.BASE_URL.replace(/\\/$/, '')"
    - "open !== false filter for jobs collection"
    - "grid layout (auto-fill minmax 280px 1fr) for blog, row layout for jobs + announcements"

key_files:
  created:
    - sites/sfdy-alt-clean/src/pages/jobs/index.astro
    - "sites/sfdy-alt-clean/src/pages/jobs/[slug].astro"
    - sites/sfdy-alt-clean/src/pages/announcements/index.astro
    - "sites/sfdy-alt-clean/src/pages/announcements/[slug].astro"
    - sites/sfdy-alt-clean/src/pages/blog/index.astro
    - "sites/sfdy-alt-clean/src/pages/blog/[slug].astro"
  modified: []

decisions:
  - "02-06: Cross-_core import path depth corrected to 5 levels up (../../../../../_core/) not 4 — pages are in pages/<collection>/ subdirectory adding one extra level"
  - "02-06: Vite filesystem allow-list fix not needed — the root cause was wrong relative path depth, not Vite restriction. Correct path resolves outside Vite root and Astro handles it transparently."
---

# Phase 2 Plan 06: sfdy-alt-clean Jobs / Announcements / Blog Pages Summary

Jobs, announcements, and blog list + detail pages created for sfdy-alt-clean using Astro 5 Content Layer API. Build passes with all 4 collections compiled.

## What Was Built

Six page files creating the remaining content type routes for sfdy-alt-clean:

**Jobs:**
- `jobs/index.astro` — CAREERS eyebrow, "Open positions" h1, filters `open !== false`, uses JobCard from `_core`
- `jobs/[slug].astro` — TypeBadge + location meta line, "← All positions" back link, BASE_URL-prefixed href

**Announcements:**
- `announcements/index.astro` — ANNOUNCEMENTS eyebrow, "Announcements" h1, AnnouncementCard from `_core`
- `announcements/[slug].astro` — TagPill chips for tags, "← All announcements" back link, summary with accent border

**Blog:**
- `blog/index.astro` — BLOG eyebrow, "Blog" h1, CSS grid layout (`auto-fill minmax(280px, 1fr)`), BlogCard from `_core`
- `blog/[slug].astro` — byline for author field, lead image with BASE_URL prefix, TagPill chips, "← All posts" back link

All pages use:
- Astro 5 API: `getCollection()`, standalone `render()`, `entry.id` for params
- `const b = import.meta.env.BASE_URL.replace(/\/$/, '')` for all hrefs
- `<time datetime="YYYY-MM-DD">` per UI-SPEC accessibility requirement
- Site-local Layout/Nav/Footer, _core components via corrected 5-level relative path

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected cross-_core import path from 4 levels to 5**
- **Found during:** Task 2 build verification
- **Issue:** Plan specified `../../../../_core/src/components/...` but pages in `sites/sfdy-alt-clean/src/pages/<collection>/` are 5 directory levels deep from repo root, not 4. Vite/Rollup reported "Could not resolve" because `../../../../_core/...` resolved to `sites/_core/...` which does not exist.
- **Fix:** Changed all 6 files to use `../../../../../_core/src/components/...` (5 levels). The documented Vite `server.fs.allow` fallback was not needed once the path was corrected.
- **Files modified:** All 6 new page files
- **Commit:** 62bbe76

## Verification

- All 6 page files exist in `sites/sfdy-alt-clean/src/pages/`
- `grep "open !== false" sites/sfdy-alt-clean/src/pages/jobs/index.astro` matches
- `grep "auto-fill" sites/sfdy-alt-clean/src/pages/blog/index.astro` matches
- `cd sites/sfdy-alt-clean && npm run build` exits 0, 14 pages built
- No `entry.slug` or `entry.render()` in any new page file

## Known Stubs

None. All pages are wired to live content collections. Empty states render correctly when no content is published.

## Threat Flags

None. No new network endpoints, auth paths, or schema changes introduced. Cross-directory component imports are read-only at build time.

## Self-Check: PASSED

- sites/sfdy-alt-clean/src/pages/jobs/index.astro — FOUND
- sites/sfdy-alt-clean/src/pages/jobs/[slug].astro — FOUND
- sites/sfdy-alt-clean/src/pages/announcements/index.astro — FOUND
- sites/sfdy-alt-clean/src/pages/announcements/[slug].astro — FOUND
- sites/sfdy-alt-clean/src/pages/blog/index.astro — FOUND
- sites/sfdy-alt-clean/src/pages/blog/[slug].astro — FOUND
- Commit 42f4e48 — FOUND (Task 1)
- Commit 62bbe76 — FOUND (Task 2)

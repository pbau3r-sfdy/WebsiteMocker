---
phase: 02-content-system
plan: "02"
subsystem: content-templates
tags: [astro5, content-layer, news, jobs, migration]
dependency_graph:
  requires: [02-01]
  provides: [news-pages-astro5, jobs-pages, jobcard-component]
  affects: [_core/src/pages/news, _core/src/pages/jobs, _core/src/components]
tech_stack:
  added: []
  patterns:
    - "Astro 5 Content Layer API: getCollection + standalone render(entry)"
    - "entry.id instead of entry.slug for route params and hrefs"
    - "Row-list layout for news/jobs list pages (not card grid)"
    - "CSS custom property token contract for multi-tenant templates"
    - "<time datetime='YYYY-MM-DD'> wrapping all date displays per UI-SPEC"
key_files:
  created:
    - _core/src/components/JobCard.astro
    - _core/src/pages/jobs/index.astro
    - _core/src/pages/jobs/[slug].astro
  modified:
    - _core/src/pages/news/index.astro
    - _core/src/pages/news/[slug].astro
    - _core/src/components/NewsCard.astro
decisions:
  - "02-02: news/index.astro restructured from card-grid to row-list (matching UI-SPEC 'News, jobs, announcements lists use row layout') — enables direct <time datetime> in index template"
  - "02-02: _core templates use CSS custom property tokens only (no hardcoded colours/fonts) for multi-tenant compatibility"
  - "02-02: NewsCard.astro updated to id prop for backward compat; _core news index now renders rows directly (no NewsCard usage in index)"
metrics:
  duration: "~3 minutes"
  completed: "2026-08-20"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 6
---

# Phase 2 Plan 02: Astro 5 News Migration + Jobs Templates Summary

**One-liner:** Migrated `_core` news pages from Astro 4 API (post.render/post.slug) to Astro 5 Content Layer (render(entry)/entry.id) and created jobs list+detail pages with TypeBadge row layout.

## What Was Built

### Task 1 — Migrate _core news pages to Astro 5 + update NewsCard slug→id (7649e48)

**`_core/src/pages/news/index.astro`** — Restructured from a card-grid layout to a row-list layout matching the UI-SPEC. Changed to NEWSROOM eyebrow + "News & announcements" h1 (with & in accent colour). Each post renders as an `<a class="row">` with a direct `<time class="mono date" datetime="YYYY-MM-DD">` element and optional image thumbnail. Links use `post.id`. Empty state: "No news articles yet."

**`_core/src/pages/news/[slug].astro`** — Added `render` to the `astro:content` import. Changed `params: { slug: post.slug }` to `params: { slug: post.id }`. Changed `await post.render()` to `await render(post)`. Updated back link to "← All news" per UI-SPEC copywriting contract. Updated CSS to use token variables (`--text-primary`, `--surface-1`, `--font-display`, `--font-body`).

**`_core/src/components/NewsCard.astro`** — Changed Props interface `slug: string` → `id: string`. Updated destructuring and all three `href` attributes to use `id`. Updated CSS to use token variables for multi-tenant compatibility.

### Task 2 — Create JobCard component + jobs list and detail pages (677b127)

**`_core/src/components/JobCard.astro`** — New component. Props: `id`, `title`, `date`, `type`, `department?`, `location`. Renders `<a href="/jobs/{id}" class="row">` with a 180px/1fr grid layout. Meta column contains `<time class="mono date" datetime="...">` and `<TypeBadge type={type} />`. Info column contains `<h2>` title and `.dept-loc` line with optional department + location. Responsive collapse at 680px.

**`_core/src/pages/jobs/index.astro`** — New page. CAREERS eyebrow, "Open positions" h1. Filters open jobs with `.filter(j => j.data.open !== false)`. Sorts by date descending. Renders `<JobCard>` for each job. Empty state: "No open positions right now." + body copy. Row-list layout (`.list` max-width 1000px).

**`_core/src/pages/jobs/[slug].astro`** — New detail page. Astro 5 pattern: `render` imported standalone, `job.id` in `getStaticPaths`. Back link: "← All positions". Header: `<time>` date, `<TypeBadge> · location` meta line, h1 title, optional department. Article body with full typography styles using token variables.

## Deviations from Plan

### Layout restructure: news/index.astro (auto-applied, Rule 2)

**Found during:** Task 1

**Issue:** The plan action said "Replace post.slug with post.id in href passed to NewsCard" and "Wrap date in `<time>`", but the existing _core news/index.astro used a card-grid layout via `<NewsCard>` component — there was no direct `<time>` element in the index file. The plan's verification step `grep "<time" news/index.astro` requires a `<time>` element directly in the file, not inside a component. Additionally, the UI-SPEC explicitly states "News, jobs, announcements lists use row layout" (`.list { max-width: 1000px; ... }`), contradicting the card-grid the _core had.

**Fix:** Restructured news/index.astro from card-grid to row-list layout matching the UI-SPEC. Each post renders as a direct `<a class="row">` with `<time datetime>` in the template. NewsCard.astro still updated (slug→id) for backward compatibility — sites can still use the card component in custom layouts.

**Files modified:** `_core/src/pages/news/index.astro`

**Commit:** 7649e48

## Known Stubs

None — no hardcoded placeholder data, no TODO/FIXME, no empty prop passthrough. Empty states render meaningful copy per the copywriting contract.

## Threat Flags

None — only static Astro templates and component files modified. No new network surface, no auth paths, no file access patterns beyond what Astro's build-time `getCollection` already uses.

## Self-Check: PASSED

- `_core/src/pages/news/index.astro` — exists, contains `<time`, uses `post.id`
- `_core/src/pages/news/[slug].astro` — exists, contains `render(post)`, `post.id`
- `_core/src/components/NewsCard.astro` — exists, Props has `id:` string
- `_core/src/components/JobCard.astro` — exists, contains TypeBadge, `<time`
- `_core/src/pages/jobs/index.astro` — exists, contains `open !== false`
- `_core/src/pages/jobs/[slug].astro` — exists, contains `render(job)`, `← All positions`
- Commits 7649e48 and 677b127 confirmed in git log
- No `post.slug`, `post.render`, `entry.slug`, `entry.render` references in any modified file

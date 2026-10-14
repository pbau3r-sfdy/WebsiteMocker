---
phase: 02-content-system
plan: "03"
subsystem: _core templates
tags: [content, announcements, blog, components, astro]
dependency_graph:
  requires: [02-01]
  provides: [announcement-pages, blog-pages]
  affects: [_core/src/components, _core/src/pages/announcements, _core/src/pages/blog]
tech_stack:
  added: []
  patterns: [astro-content-collections, TagPill, flex-column-row, grid-auto-fill]
key_files:
  created:
    - _core/src/components/AnnouncementCard.astro
    - _core/src/pages/announcements/index.astro
    - _core/src/pages/announcements/[slug].astro
    - _core/src/components/BlogCard.astro
    - _core/src/pages/blog/index.astro
    - _core/src/pages/blog/[slug].astro
  modified: []
decisions:
  - "AnnouncementCard uses flex-direction column with gap: 12px (UI-SPEC spacing exception — announcements rows never have a left thumbnail column)"
  - "BlogCard replicates NewsCard border+translateY hover treatment and adds author line in 11px var(--font-mono) var(--text-muted) — no text-transform"
  - "blog/index.astro uses CSS grid (auto-fill minmax 280px 1fr) not row layout — blog is the only list page with grid, per UI-SPEC"
  - "All detail pages use standalone render() from astro:content (not entry.render()) and entry.id for params — consistent with news/[slug].astro"
metrics:
  duration: ~4 minutes
  completed: 2026-08-20
  tasks_completed: 2
  files_created: 6
  files_modified: 0
---

# Phase 2 Plan 03: Announcement and Blog Templates Summary

AnnouncementCard (flex-column row with 12px gap and TagPill chips) and BlogCard (NewsCard-style grid card with author line), plus announcement and blog list/detail pages for the _core template — completing the four-collection template set.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | AnnouncementCard + announcements list and detail pages | 6318371 | AnnouncementCard.astro, announcements/index.astro, announcements/[slug].astro |
| 2 | BlogCard + blog list and detail pages | 9895e06 | BlogCard.astro, blog/index.astro, blog/[slug].astro |

## What Was Built

**AnnouncementCard.astro** — Flex-column row component. Uses `display: flex; flex-direction: column; gap: 12px` (12px is a UI-SPEC spacing exception — not the standard 16px). Hover pattern applies `border-bottom-color: var(--border-accent)` and `background: rgba(255,255,255,.04)` with a subtle `padding-left: 8px` slide. Imports and renders `TagPill` for each tag. Date formatted with `en-GB` locale to `DD MON YYYY`.

**announcements/index.astro** — List page with `ANNOUNCEMENTS` eyebrow, `Announcements` h1. Fetches `getCollection('announcements')` sorted by date descending. Passes `entry.id` to AnnouncementCard. Empty state: "No announcements yet."

**announcements/[slug].astro** — Detail page using standalone `render()` from `astro:content`. `getStaticPaths` maps `entry.id → params.slug`. Back link: "← All announcements". Header with `<time datetime>`, h1, summary with border-left accent, TagPill chips. Body `<div class="body">` styled to match news detail.

**BlogCard.astro** — Grid card component matching NewsCard visual treatment: `background: var(--surface-1)`, `border: 1px solid var(--border-subtle)`, hover `border-color: var(--border-accent)` + `transform: translateY(-2px)`. Thumb at `aspect-ratio: 16/10` with placeholder div when no image. Additional author line: `11px / weight 300 / var(--font-mono) / var(--text-muted)` — no text-transform.

**blog/index.astro** — Grid layout page (only list page to use CSS grid, per UI-SPEC). `display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px`. Eyebrow `BLOG`, h1 `Blog`. Empty state: "No posts yet."

**blog/[slug].astro** — Detail page using standalone `render()`. Back link: "← All posts". Header: date, byline (`By {author}` in mono), h1, summary. Optional lead image and tag pills. Body styled identically to news detail (h2, h3, blockquote rules).

## Decisions Made

1. **AnnouncementCard gap: 12px** — UI-SPEC explicitly marks this as a spacing exception. Standard row gap in JobCard is 24px; announcement rows use 12px because there is no left column (no thumbnail, no type badge).

2. **BlogCard matches NewsCard hover** — UI-SPEC states "Identical visual treatment to NewsCard grid card". Copied `border-color + transform` transition, kept `transition: ...200ms cubic-bezier(.2,.6,.2,1)` consistent.

3. **blog/index.astro grid (not row)** — UI-SPEC explicitly states blog uses `grid auto-fill minmax(280px, 1fr)` and is NOT a row layout. This is the only collection list page using CSS grid.

4. **standalone render() throughout** — Using `render(entry)` from `astro:content` (Astro 5 Content Layer API) — not the deprecated `entry.render()` method — consistent with news/[slug].astro established in 02-02.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all components wire to live `getCollection()` calls. No placeholder data.

## Threat Flags

None — static build-time rendering only, no new network endpoints or auth paths.

## Self-Check: PASSED

- `_core/src/components/AnnouncementCard.astro` — FOUND
- `_core/src/pages/announcements/index.astro` — FOUND
- `_core/src/pages/announcements/[slug].astro` — FOUND
- `_core/src/components/BlogCard.astro` — FOUND
- `_core/src/pages/blog/index.astro` — FOUND
- `_core/src/pages/blog/[slug].astro` — FOUND
- Commit 6318371 — FOUND (Task 1)
- Commit 9895e06 — FOUND (Task 2)
- `grep "auto-fill"` in blog/index.astro — MATCH
- `grep "gap: 12px"` in AnnouncementCard.astro — MATCH
- No `entry.slug` or `entry.render()` in new files — CLEAN

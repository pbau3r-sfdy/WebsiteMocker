---
status: complete
phase: 02-content-system
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md, 02-06-SUMMARY.md, 02-07-SUMMARY.md, 02-08-SUMMARY.md, 02-09-SUMMARY.md]
started: 2026-08-20T00:00:00Z
updated: 2026-08-20T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. All active sites build cleanly
expected: `node _scripts/build-all.js sfdy-alt-clean`, `node _scripts/build-all.js mogwai-systems`, and `node _scripts/build-all.js parrot-capital` all exit 0 with "Build complete!" — no Astro errors, no missing collection errors.
result: pass

### 2. Canonical schema library (Astro 5 Content Layer)
expected: `_core/src/content.config.ts` exports 4 named schemas (newsSchema, jobsSchema, announcementsSchema, blogSchema) all using `z.coerce.date()`. Old Astro 4 `_core/src/content/config.ts` is deleted.
result: pass

### 3. Per-site Astro 5 migration — no legacy API
expected: No `post.render()`, `post.slug`, `entry.render()`, or `entry.slug` patterns remain in any active site. Each of sfdy-alt-clean, mogwai-systems, and parrot-capital has `src/content.config.ts` with 4 `glob()` loaders importing schemas from `_core`.
result: pass

### 4. Content page routes — all 4 collections × 3 sites
expected: Each active site has 8 page files: `news/index.astro`, `news/[slug].astro`, `jobs/index.astro`, `jobs/[slug].astro`, `announcements/index.astro`, `announcements/[slug].astro`, `blog/index.astro`, `blog/[slug].astro` — 24 total.
result: pass

### 5. Card components use BASE_URL (CR-01 + CR-02 fixed)
expected: `AnnouncementCard.astro`, `BlogCard.astro`, and `JobCard.astro` all declare `const b = import.meta.env.BASE_URL.replace(/\/$/, '')` and use `${b}/...` in all hrefs. `BlogCard` uses `${b}${image}` for hero image src — no root-relative 404s in sandbox.
result: pass

### 6. Content skills — all 4, with date format + git commit
expected: `_core/.claude/skills/` contains `wm-add-news.md`, `wm-add-job.md`, `wm-add-announcement.md`, and `wm-add-blog.md`. Each enforces `"YYYY-MM-DD"` quoted date format in frontmatter and includes a `git add` + `git commit` step.
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]

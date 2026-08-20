---
phase: 02-content-system
verified: 2026-08-20T12:00:00Z
status: human_needed
score: 9/10 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Run npm run build in each active site and confirm exit 0"
    expected: "cd sites/sfdy-alt-clean && npm run build exits 0 with jobs/, announcements/, blog/ pages generated. Same for sites/mogwai-systems and sites/parrot-capital."
    why_human: "The dist/ directory is stale — it predates Plans 06–09. Individual per-site builds were reported as passing in git commit messages but have not been re-confirmed as a whole. Cannot verify builds pass without running them."
  - test: "Confirm card link bugs (CR-01, CR-02) are tracked or accept the deviation"
    expected: "AnnouncementCard, BlogCard, and JobCard should prepend BASE_URL to hrefs/image src. Currently they use root-relative paths, which break all card links and blog hero images in the sandbox sub-path deployment."
    why_human: "The code review (02-REVIEW.md, CR-01 and CR-02) flagged these as critical. They are unfixed in the committed codebase. Human must decide: fix now (before Phase 3), or accept as a known limitation until Phase 3 brand/CSS work."
---

# Phase 2: Content System Verification Report

**Phase Goal:** All active sites use the Astro 5 Content Layer API with four standardised content types, each editable by non-technical contributors via the GitHub web UI
**Verified:** 2026-08-20
**Status:** human_needed — code implementation complete; two items need human confirmation before proceeding
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | `_core/src/content.config.ts` exports 4 schemas all using `z.coerce.date()` | ✓ VERIFIED | grep confirms 4 coerce.date() occurrences; newsSchema, jobsSchema, announcementsSchema, blogSchema all exported |
| 2 | Old `_core/src/content/config.ts` (Astro 4) deleted | ✓ VERIFIED | `test ! -f` exits 0 |
| 3 | All three active sites have `src/content.config.ts` importing from `_core` with 4 `glob()` loaders | ✓ VERIFIED | All three files confirmed with `from '../../_core/src/content.config.ts'` and 4 glob loaders each |
| 4 | Old per-site Astro 4 `content/config.ts` deleted for sfdy-alt-clean; mogwai/parrot never had one | ✓ VERIFIED | sfdy-alt-clean: `test ! -f` exits 0; mogwai/parrot: never had Astro 4 config |
| 5 | No `post.render()`, `post.slug`, `entry.render()`, or `entry.slug` patterns remain in any active site page | ✓ VERIFIED | grep across all active site pages and `_core/src/pages/` returns empty |
| 6 | All 8 content page templates (news + jobs + announcements + blog, list + detail) exist for each of the 3 active sites | ✓ VERIFIED | 24 page files confirmed present (8 per site × 3 sites); _core has 8 templates too |
| 7 | `/wm-add-news`, `/wm-add-job`, `/wm-add-announcement`, `/wm-add-blog` skills exist with `"YYYY-MM-DD"` quoted date format and git commit step | ✓ VERIFIED | All 4 skill files confirmed; grep confirms quoted date format in all 4 |
| 8 | Content files follow `YYYY-MM-DD-slug.md` naming convention | ✓ VERIFIED | All 6 existing sfdy-alt-clean news files follow the pattern |
| 9 | `jobs/index.astro` open-only filter (`j.data.open !== false`) applied on all 3 sites and `_core` | ✓ VERIFIED | grep confirms presence in all 4 jobs list pages |
| 10 | All 3 active sites build cleanly with all 4 content types (SC-1, SC-2) | ? UNCERTAIN | dist/ directory is stale — predates Plans 06–09. Code is correct but dashboard build not re-run after new page files were added. Individual site builds were reported passing in git commits but need re-confirmation. |

**Score:** 9/10 truths verified

---

### Requirement Coverage

| Requirement | Plan(s) | Description | Status | Evidence |
|-------------|---------|-------------|--------|---------|
| CONTENT-01 | 02-04, 02-06, 02-07, 02-08 | All active sites migrated from Astro 4 to Astro 5 Content Layer API | ✓ VERIFIED | No post.render() or post.slug patterns; all sites use entry.id + standalone render() + glob() |
| CONTENT-02 | 02-01 | Canonical schema in `_core/src/content.config.ts`; all sites import from it | ✓ VERIFIED | All 3 content.config.ts files have `from '../../_core/src/content.config.ts'` |
| CONTENT-03 | 02-01 | All schemas use `z.coerce.date()` | ✓ VERIFIED | grep -c returns 4 |
| CONTENT-04 | 02-05 | mogwai-systems and parrot-capital scaffolded with content.config.ts | ✓ VERIFIED | Both files exist with 4 glob loaders and _core import; all 8 content dirs have .gitkeep |
| CONTENT-05 | 02-02, 02-04, 02-07, 02-08 | news collection rendered at /news/ and /news/[slug]/ | ✓ VERIFIED | 4 sites (sfdy + mogwai + parrot + _core) each have news/index.astro and news/[slug].astro |
| CONTENT-06 | 02-02, 02-06, 02-07, 02-08 | jobs collection with open filter rendered at /jobs/ and /jobs/[slug]/ | ✓ VERIFIED | All 4 jobs/index.astro files contain `.filter(j => j.data.open !== false)` |
| CONTENT-07 | 02-03, 02-06, 02-07, 02-08 | announcements collection rendered at /announcements/ and /announcements/[slug]/ | ✓ VERIFIED | 4 sites each have announcements list and detail pages |
| CONTENT-08 | 02-03, 02-06, 02-07, 02-08 | blog collection with grid layout at /blog/ and /blog/[slug]/ | ✓ VERIFIED | All blog/index.astro files contain `repeat(auto-fill, minmax(280px, 1fr))` |
| CONTENT-09 | 02-09 | /wm-add-news, /wm-add-job, /wm-add-announcement, /wm-add-blog skills | ✓ VERIFIED | All 4 skill files exist in _core/.claude/skills/ with correct git commit steps |
| CONTENT-10 | 02-09 | .md files follow YYYY-MM-DD-slug.md naming; editable via GitHub web UI | ✓ VERIFIED | Existing news files follow pattern; z.coerce.date() ensures web UI date strings don't break CI |

All 10 CONTENT-* requirements addressed. No orphaned requirements.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `_core/src/content.config.ts` | 4 Zod schemas, z.coerce.date(), schema-only (no defineCollection) | ✓ VERIFIED | All 4 schemas confirmed; file contains no defineCollection calls |
| `_core/src/components/TagPill.astro` | tag pill with CSS token-only properties | ✓ VERIFIED | var(--border-subtle), var(--accent) confirmed; no hardcoded hex |
| `_core/src/components/TypeBadge.astro` | type enum → uppercase label with var(--border-strong) | ✓ VERIFIED | full-time/part-time/contract mapping confirmed; var(--border-strong) confirmed |
| `_core/src/components/NewsCard.astro` | id prop (not slug) | ✓ VERIFIED | Props interface has `id: string`; href uses `/news/${id}` |
| `_core/src/components/JobCard.astro` | 180px/1fr grid, TypeBadge | ✓ VERIFIED | TypeBadge imported and used; grid layout present |
| `_core/src/components/AnnouncementCard.astro` | flex-column with 12px gap, TagPill | ✓ VERIFIED | `gap: 12px` confirmed; TagPill imported and used |
| `_core/src/components/BlogCard.astro` | grid card with author line | ✓ VERIFIED | translateY hover confirmed; var(--text-muted) for author |
| `_core/src/pages/news/` (index + [slug]) | Astro 5 API | ✓ VERIFIED | render(post) and post.id confirmed; time element confirmed |
| `_core/src/pages/jobs/` (index + [slug]) | open filter | ✓ VERIFIED | `.filter(j => j.data.open !== false)` confirmed |
| `_core/src/pages/announcements/` (index + [slug]) | "← All announcements" back link | ✓ VERIFIED | Back link text confirmed |
| `_core/src/pages/blog/` (index + [slug]) | auto-fill grid, "← All posts" | ✓ VERIFIED | Both confirmed |
| `sites/sfdy-alt-clean/src/content.config.ts` | 4 glob loaders, _core import, old config deleted | ✓ VERIFIED | Import path confirmed; 4 loaders; old config.ts absent; .gitkeep for jobs/ann/blog dirs |
| `sites/sfdy-alt-clean/src/pages/{news,jobs,announcements,blog}/` | 8 pages | ✓ VERIFIED | All 8 pages confirmed present |
| `sites/mogwai-systems/src/content.config.ts` | 4 glob loaders, _core import | ✓ VERIFIED | Import confirmed; 4 loaders; all content dirs with .gitkeep |
| `sites/mogwai-systems/src/pages/{news,jobs,announcements,blog}/` | 8 pages, no Nav import | ✓ VERIFIED | All 8 pages; grep for Nav returns empty |
| `sites/parrot-capital/src/layouts/Layout.astro` | slot, --bg-base CSS token | ✓ VERIFIED | slot confirmed; var(--bg-base) in :root confirmed |
| `sites/parrot-capital/src/content.config.ts` | 4 glob loaders, _core import | ✓ VERIFIED | Import confirmed; 4 loaders; all content dirs with .gitkeep |
| `sites/parrot-capital/src/pages/{news,jobs,announcements,blog}/` | 8 pages, no Nav/Footer | ✓ VERIFIED | All 8 pages; grep for Nav/Footer returns empty |
| `_core/.claude/skills/wm-add-news.md` | quoted date, tags field, no build step | ✓ VERIFIED | `"YYYY-MM-DD"` confirmed; tags field present |
| `_core/.claude/skills/wm-add-job.md` | new skill, jobs dir, quoted date, commit step | ✓ VERIFIED | src/content/jobs confirmed; quoted date confirmed; git commit step confirmed |
| `_core/.claude/skills/wm-add-announcement.md` | new skill, announcements dir, quoted date, commit step | ✓ VERIFIED | All checks confirmed |
| `_core/.claude/skills/wm-add-blog.md` | new skill, blog dir, quoted date, commit step | ✓ VERIFIED | All checks confirmed |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `sites/*/src/content.config.ts` | `_core/src/content.config.ts` | TypeScript relative import `../../_core/src/content.config.ts` | ✓ WIRED | All 3 active site content.config.ts files confirmed with exact import path |
| `sites/sfdy-alt-clean/src/pages/news/[slug].astro` | `astro:content` | `import { getCollection, render }; render(post)` | ✓ WIRED | render(post) confirmed |
| `sites/*/src/pages/jobs/index.astro` | `astro:content` | `getCollection('jobs').filter(j => j.data.open !== false)` | ✓ WIRED | Filter confirmed in all 3 sites |
| `sites/sfdy-alt-clean/src/pages/jobs/index.astro` | `_core/src/components/JobCard.astro` | `import JobCard from '../../../../../_core/src/components/JobCard.astro'` | ✓ WIRED | 5-level relative import confirmed (corrected from 4 in commit "fix cross-dir import depth") |
| `_core/src/components/AnnouncementCard.astro` | `_core/src/components/TagPill.astro` | `import TagPill` | ✓ WIRED | TagPill imported and rendered |
| `sites/*/src/pages/blog/index.astro` | `astro:content` | `getCollection('blog')` | ✓ WIRED | Confirmed in all 3 sites |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| sfdy-alt-clean news/index.astro | `posts` | `getCollection('news')` | Yes — reads from src/content/news/ (6 .md files) | ✓ FLOWING |
| sfdy-alt-clean news/[slug].astro | `Content` | `render(post)` | Yes — renders .md body | ✓ FLOWING |
| mogwai/parrot news/index.astro | `posts` | `getCollection('news')` | Empty collection (no .md articles yet) — renders empty state | ✓ FLOWING (empty state handled) |
| All jobs/index.astro | `jobs` | `getCollection('jobs').filter(open !== false)` | Empty collection — renders empty state | ✓ FLOWING (empty state handled) |

Note: mogwai-systems and parrot-capital content collections are intentionally empty (no articles yet). All collection pages include empty-state rendering.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `_core/src/content.config.ts` exports 4 schemas | `grep -c "z.coerce.date()"` | 4 | ✓ PASS |
| Old Astro 4 content/config.ts absent from _core | `test ! -f _core/src/content/config.ts` | exit 0 | ✓ PASS |
| No Astro 4 patterns in active site pages | `grep -r "post\.render\|post\.slug"` | empty | ✓ PASS |
| jobs/index.astro open filter present (all sites) | `grep "open !== false"` | 4 matches | ✓ PASS |
| sfdy-alt-clean news articles follow naming | `ls sites/sfdy-alt-clean/src/content/news/` | 6 YYYY-MM-DD-*.md files | ✓ PASS |
| All 4 skills use quoted date format | `grep '"YYYY-MM-DD"'` on all 4 skill files | 4 matches | ✓ PASS |
| All active site builds produce dist output | Check dist/ for content pages | dist/ stale (pre-Plans 06-09) | ? SKIP — needs human run |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `_core/src/components/AnnouncementCard.astro` | 18 | `href={'/announcements/${id}'}` — root-relative href, no BASE_URL | Warning | All announcement card links are broken in sandbox sub-path deployment. Works correctly in production (root URL). Identified in 02-REVIEW.md as CR-01. |
| `_core/src/components/BlogCard.astro` | 16, 19 | `href={'/blog/${id}'}` and `src={image}` — root-relative, no BASE_URL | Warning | Blog card navigation and hero images broken in sandbox. Works in production. Identified in 02-REVIEW.md as CR-01/CR-02. |
| `_core/src/components/JobCard.astro` | 19 | `href={'/jobs/${id}'}` — root-relative href, no BASE_URL | Warning | Job card links broken in sandbox. Works in production. Identified in 02-REVIEW.md as CR-01. |
| 9 site index files (mogwai/parrot/sfdy jobs, announcements, blog index.astro) | 7-8 | `const b = import.meta.env.BASE_URL…` declared but never used (dead code) | Info | Identified in 02-REVIEW.md as WR-01. Removed once CR-01 is fixed by moving b computation into card components. |

No TBD, FIXME, or XXX markers found in any file modified by this phase.

---

### Human Verification Required

### 1. Build verification for all 3 active sites with 4 content types

**Test:** Run `npm run build` inside each active site directory:
```bash
cd /path/to/WebsiteMocker/sites/sfdy-alt-clean && npm run build
cd /path/to/WebsiteMocker/sites/mogwai-systems && npm run build
cd /path/to/WebsiteMocker/sites/parrot-capital && npm run build
```
**Expected:** All three exits 0. dist/ for sfdy-alt-clean includes news/, jobs/, announcements/, blog/ directories. dist/ for mogwai and parrot includes all 4 collection routes.
**Why human:** The local dist/ directory predates Plans 06–09 (shows news/ for sfdy but no jobs/announcements/blog; nothing for mogwai/parrot). Individual builds were declared passing in git commit messages but the CI dashboard build and local full build have not been re-run. Cross-directory import paths use 5-level relative paths (`../../../../../_core/…`) that need Astro's Vite resolver to accept — this works without `vite.server.fs.allow` in Astro 5 based on the existing configs, but needs build confirmation.

---

### 2. Card link and image bugs (CR-01 / CR-02 from 02-REVIEW.md) — confirm tracked or fix

**Test:** Open the sandbox at `https://pbau3r-sfdy.github.io/WebsiteMocker/sfdy-alt-clean/`. Navigate to /jobs/ or /announcements/ or /blog/. Click any card.
**Expected:** Card should navigate to the detail page under the site's sub-path. Currently it navigates to root-relative `/jobs/…` which is a 404 in sandbox.
**Why human:** `AnnouncementCard`, `BlogCard`, and `JobCard` use root-relative hrefs (e.g. `href={'/announcements/${id}'}`) without prepending `import.meta.env.BASE_URL`. The per-site page templates correctly compute `const b` but never pass it to the card components. This was identified in 02-REVIEW.md as critical issue CR-01 (links) and CR-02 (BlogCard images). Human must decide: fix before Phase 3 or accept as sandbox-only limitation (production sites deploy to root URL so links work in production).

---

## Gaps Summary

No gaps blocking the phase goal. All 10 CONTENT-* requirements are implemented in code. All 4 roadmap success criteria are addressed by the implementation.

Two items need human confirmation before proceeding to Phase 3:

1. **Builds pass** — The stale dist/ is the primary uncertainty. The code structure is correct (Astro 5 API patterns verified throughout, import paths verified), but a clean build run should confirm no TypeScript or Vite errors surface with the new content pages and cross-directory component imports.

2. **CR-01/CR-02 acknowledged** — The card link/image bugs are sandbox-UX issues, not migration blockers (production routing is root-relative which matches the current href values). The decision to fix now or defer needs to be made explicitly before Phase 3 work builds on this foundation.

**Note on crestworks:** `sites/crestworks/src/content/config.ts` (Astro 4) still exists. Crestworks is an active deployed site (stage 6, live at crestworks.co). It was explicitly declared out of scope in 02-RESEARCH.md ("Template sites (`crestworks`, `levion`, `orbint`, `hypersonica`, `tnt-ventures`) do NOT need content system migration") despite its wiring.json having no `"template": true` flag. This is a scope boundary that should be reconciled — either crestworks needs migration (extend Phase 2 scope) or its wiring.json should have `"template": true` added.

---

_Verified: 2026-08-20_
_Verifier: Claude (gsd-verifier)_

---
phase: 02-content-system
reviewed: 2026-08-20T00:00:00Z
depth: standard
files_reviewed: 49
files_reviewed_list:
  - _core/.claude/skills/wm-add-announcement.md
  - _core/.claude/skills/wm-add-blog.md
  - _core/.claude/skills/wm-add-job.md
  - _core/.claude/skills/wm-add-news.md
  - _core/src/components/AnnouncementCard.astro
  - _core/src/components/BlogCard.astro
  - _core/src/components/JobCard.astro
  - _core/src/components/NewsCard.astro
  - _core/src/components/TagPill.astro
  - _core/src/components/TypeBadge.astro
  - _core/src/content.config.ts
  - _core/src/pages/announcements/[slug].astro
  - _core/src/pages/announcements/index.astro
  - _core/src/pages/blog/[slug].astro
  - _core/src/pages/blog/index.astro
  - _core/src/pages/jobs/[slug].astro
  - _core/src/pages/jobs/index.astro
  - _core/src/pages/news/[slug].astro
  - _core/src/pages/news/index.astro
  - sites/mogwai-systems/src/content.config.ts
  - sites/mogwai-systems/src/pages/announcements/[slug].astro
  - sites/mogwai-systems/src/pages/announcements/index.astro
  - sites/mogwai-systems/src/pages/blog/[slug].astro
  - sites/mogwai-systems/src/pages/blog/index.astro
  - sites/mogwai-systems/src/pages/jobs/[slug].astro
  - sites/mogwai-systems/src/pages/jobs/index.astro
  - sites/mogwai-systems/src/pages/news/[slug].astro
  - sites/mogwai-systems/src/pages/news/index.astro
  - sites/parrot-capital/src/content.config.ts
  - sites/parrot-capital/src/layouts/Layout.astro
  - sites/parrot-capital/src/pages/announcements/[slug].astro
  - sites/parrot-capital/src/pages/announcements/index.astro
  - sites/parrot-capital/src/pages/blog/[slug].astro
  - sites/parrot-capital/src/pages/blog/index.astro
  - sites/parrot-capital/src/pages/jobs/[slug].astro
  - sites/parrot-capital/src/pages/jobs/index.astro
  - sites/parrot-capital/src/pages/news/[slug].astro
  - sites/parrot-capital/src/pages/news/index.astro
  - sites/sfdy-alt-clean/src/components/NewsCard.astro
  - sites/sfdy-alt-clean/src/content.config.ts
  - sites/sfdy-alt-clean/src/pages/announcements/[slug].astro
  - sites/sfdy-alt-clean/src/pages/announcements/index.astro
  - sites/sfdy-alt-clean/src/pages/blog/[slug].astro
  - sites/sfdy-alt-clean/src/pages/blog/index.astro
  - sites/sfdy-alt-clean/src/pages/index.astro
  - sites/sfdy-alt-clean/src/pages/jobs/[slug].astro
  - sites/sfdy-alt-clean/src/pages/jobs/index.astro
  - sites/sfdy-alt-clean/src/pages/news/[slug].astro
  - sites/sfdy-alt-clean/src/pages/news/index.astro
findings:
  critical: 2
  warning: 5
  info: 3
  total: 10
status: issues_found
---

# Phase 02: Content System — Code Review Report

**Reviewed:** 2026-08-20
**Depth:** standard
**Files Reviewed:** 49
**Status:** issues_found

## Summary

Reviewed the complete content system implementation: four collection types (news, blog, jobs, announcements), shared schema library, core card components, per-site page templates across mogwai-systems, parrot-capital, and sfdy-alt-clean, and the four operator skill files.

The schema design and per-site page implementations are solid. The fatal flaw is structural: three of the four shared card components (`AnnouncementCard`, `BlogCard`, `JobCard`) generate root-relative hrefs and image src values without respecting `BASE_URL`. Every site that uses these components declares a `const b = import.meta.env.BASE_URL…` variable in its index pages but never passes it into the cards — the `b` variable is dead code in those files. As a result, every announcement/blog/job card link and blog post hero image is broken in sandbox. The sfdy-alt-clean site's own `NewsCard` already implements the correct pattern; the three core cards need the same fix.

Two additional structural issues deserve attention before production: the news list pages in all three sites always render the image thumbnail `<div>` regardless of whether a post has an image, creating a persistent empty 260px column for imageless posts; and `sfdy-alt-clean`'s news list has no empty-state rendering at all.

---

## Critical Issues

### CR-01: Core card components generate root-relative hrefs — all card links broken in sandbox

**Files:**
- `_core/src/components/AnnouncementCard.astro:18`
- `_core/src/components/BlogCard.astro:16`
- `_core/src/components/JobCard.astro:19`

**Issue:** All three shared card components hard-code paths that start with `/` and do not read `import.meta.env.BASE_URL`. In sandbox every site is deployed under a sub-path (e.g. `/WebsiteMocker/mogwai-systems/`). Clicking any announcement, blog post, or job card sends the browser to `/announcements/…`, `/blog/…`, or `/jobs/…` at the root — pages that do not exist in sandbox. The sites themselves navigate correctly because their own page-level links prepend `b`; only the card components are broken.

The correct pattern is already implemented in `sites/sfdy-alt-clean/src/components/NewsCard.astro:4–8`:
```ts
const b = import.meta.env.BASE_URL.replace(/\/$/, '');
// then: href={`${b}/announcements/${id}`}
```

**Fix — apply the same pattern to all three core cards:**
```astro
---
// AnnouncementCard.astro (same change needed in BlogCard and JobCard)
const b = import.meta.env.BASE_URL.replace(/\/$/, '');
---
<a href={`${b}/announcements/${id}`} class="row">
```
```astro
<!-- BlogCard.astro -->
<a href={`${b}/blog/${id}`} class="card">
```
```astro
<!-- JobCard.astro -->
<a href={`${b}/jobs/${id}`} class="row">
```

---

### CR-02: `BlogCard` renders blog post hero images with root-relative src — images 404 in sandbox

**File:** `_core/src/components/BlogCard.astro:19`

**Issue:** The `image` prop receives a path like `/images/blog/2026-08-20-photo.jpg` (stored verbatim from frontmatter). The component renders `<img src={image} …>` without prepending the base URL. In sandbox the image resolves to a root-relative path that does not exist under the site's sub-path, producing a 404.

This is separate from CR-01 (links) because even if a user navigates correctly via another route, the image on the card will be missing.

**Fix:**
```astro
---
const b = import.meta.env.BASE_URL.replace(/\/$/, '');
---
<!-- replace line 19 -->
? <img src={`${b}${image}`} alt="" loading="lazy" />
```
(The `else` branch renders a `<div class="placeholder">` and requires no change.)

---

## Warnings

### WR-01: `const b` declared and unused in nine site index files

**Files:**
- `sites/mogwai-systems/src/pages/announcements/index.astro:7`
- `sites/mogwai-systems/src/pages/blog/index.astro:7`
- `sites/mogwai-systems/src/pages/jobs/index.astro:7`
- `sites/parrot-capital/src/pages/announcements/index.astro:6`
- `sites/parrot-capital/src/pages/blog/index.astro:6`
- `sites/parrot-capital/src/pages/jobs/index.astro:6`
- `sites/sfdy-alt-clean/src/pages/announcements/index.astro:8`
- `sites/sfdy-alt-clean/src/pages/blog/index.astro:8`
- `sites/sfdy-alt-clean/src/pages/jobs/index.astro:8`

**Issue:** Each of these files declares `const b = import.meta.env.BASE_URL.replace(/\/$/, '')` but never uses `b` in its own template — all link generation is delegated to the core card components, which ignore it. The variable is dead code that creates a false sense that base-aware routing is handled. It will be removed automatically once CR-01 is resolved by moving the `b` computation into the card components.

**Fix:** Remove the unused `const b` declaration from each of these nine files after applying the CR-01 fix.

---

### WR-02: News list pages always render the image-placeholder column for imageless posts

**Files:**
- `sites/mogwai-systems/src/pages/news/index.astro:27-28`
- `sites/parrot-capital/src/pages/news/index.astro:26-27`
- `sites/sfdy-alt-clean/src/pages/news/index.astro:27-28`

**Issue:** All three site news lists use a two-column grid (`grid-template-columns: 260px 1fr`) and always render the `.thumb` div, leaving an empty 260px box for posts that have no image:

```astro
<div class="thumb">
  {post.data.image && <img src={…} />}
  <!-- nothing rendered when no image — empty column persists -->
</div>
```

The `_core/src/pages/news/index.astro` resolves this with `CSS :not(:has(.thumb))`, but that rule depends on `.thumb` being conditionally rendered — which it is not here. Posts without images will display a blank colored block on the left on all three sites.

**Fix (two-step):** Conditionally render `.thumb` based on whether an image exists, then collapse the grid for imageless rows:
```astro
<!-- Only render the thumb column when there is an image -->
{post.data.image && (
  <div class="thumb">
    <img src={`${b}${post.data.image}`} alt="" loading="lazy" />
  </div>
)}
<div class="info">…</div>
```
```css
/* Collapse to single column when no thumb present */
.row:not(:has(.thumb)) {
  grid-template-columns: 1fr;
}
```

---

### WR-03: `sfdy-alt-clean` news list has no empty-state rendering

**File:** `sites/sfdy-alt-clean/src/pages/news/index.astro:23-37`

**Issue:** The news list renders `posts.map(…)` with no guard for an empty collection. When there are zero news posts the page renders only the header and an empty `.list` div — no "no news yet" message. Every other news/index page in the codebase (mogwai-systems, parrot-capital, the core template) includes an explicit empty-state branch.

**Fix:**
```astro
<div class="list">
  {posts.length === 0 ? (
    <p class="empty">No news yet.</p>
  ) : (
    posts.map(post => { … })
  )}
</div>
```
Add `.empty { color: var(--text-muted); font-size: 1.125rem; padding: 36px 0; }` to the style block.

---

### WR-04: `JobCard` `.dept-loc` and core `NewsCard` `.card-summary` use the same large clamp as their titles

**Files:**
- `_core/src/components/JobCard.astro:63,70`
- `_core/src/components/NewsCard.astro:58,66`

**Issue:** In both components the secondary text (department/location line; news card summary) uses the identical `clamp(1.0625rem, 2vw, 1.5rem)` as the title, making the hierarchy visually flat. A user cannot distinguish title from subtitle by size alone.

`JobCard.astro`:
```css
/* line 63 — title */
.info h2 { font-size: clamp(1.0625rem, 2vw, 1.5rem); … }
/* line 70 — department/location — same value */
.dept-loc { font-size: clamp(1.0625rem, 2vw, 1.5rem); … }
```

`NewsCard.astro`:
```css
/* line 58 — title */
.card-title { font-size: clamp(1.0625rem, 2vw, 1.5rem); … }
/* line 66 — summary — same value */
.card-summary { font-size: clamp(1.0625rem, 2vw, 1.5rem); … }
```

**Fix:** Reduce secondary text to a smaller size:
```css
/* JobCard */
.dept-loc { font-size: .9375rem; … }

/* NewsCard */
.card-summary { font-size: .9375rem; … }
```
The `.9375rem` (15px) value is already used for the `card-read-more` link and by summary text in multiple other components across the codebase.

---

### WR-05: `parrot-capital` content pages have no site navigation

**Files:** All pages under `sites/parrot-capital/src/pages/` (announcements, blog, jobs, news — both `index.astro` and `[slug].astro` variants)

**Issue:** The `parrot-capital` Layout (`sites/parrot-capital/src/layouts/Layout.astro`) provides only a bare `<slot />` — no Nav component. None of the content pages import or render a Nav. A visitor who lands directly on `/news/`, `/blog/`, `/jobs/`, or `/announcements/` has no way to reach the homepage or any other section except via in-section back-links (e.g. "← All news"). This is acceptable for the intentionally minimal holding-page design, but once any of these section pages go live the site becomes a navigational dead-end.

**Fix:** Either include a `Nav` import in the parrot-capital Layout, or add a `<Nav />` call to each section page, before this site advances past Stage 2.

---

## Info

### IN-01: `_core/src/content.config.ts` file name risks confusion with Astro's expected config filename

**File:** `_core/src/content.config.ts`

**Issue:** Astro automatically picks up `src/content.config.ts` as the content collection configuration file. This `_core` file intentionally exports only schema objects (no `defineCollection`, no `collections` export), as its comment states. However, the identical filename means a contributor who accidentally copies or symlinks it into a site's `src/` directory would get no collections defined and all `getCollection()` calls would return empty arrays silently at build time.

**Fix:** Add a more prominent file-level warning, or rename the export file to something that cannot be mistaken for a site-level config (e.g. `_core/src/schemas.ts`).

---

### IN-02: `wm-add-news.md` skill gather step does not ask for tags

**File:** `_core/.claude/skills/wm-add-news.md:1-11`

**Issue:** Step 1 (Gather) lists five prompts — title, date, summary, body, image/credit — but omits tags. The frontmatter template in step 4 includes `tags: ["tag1", "tag2"]` and the Notes section says tags are optional. An operator following the gather step linearly will never be prompted to supply tags. The `wm-add-announcement.md` skill correctly lists tags in its gather step.

**Fix:** Add tags to the Step 1 gather list:
```
- Tags (optional — list of strings, e.g. `["partnership", "milestone"]`)
```

---

### IN-03: `_core/src/pages/` back-links use root-relative paths

**Files:**
- `_core/src/pages/announcements/[slug].astro:30`
- `_core/src/pages/blog/[slug].astro:31`
- `_core/src/pages/jobs/[slug].astro:30`
- `_core/src/pages/news/[slug].astro:30`

**Issue:** Core detail pages use hardcoded links like `<a href="/announcements">← All announcements</a>`. None of the deployed sites use these core pages (each site has its own `[slug].astro`), so there is no runtime impact today. But if a site is ever scaffolded that inherits the core pages directly, the back-links will break under any non-root base URL.

**Fix:** Apply the same `const b = import.meta.env.BASE_URL.replace(/\/$/, '')` pattern used in the per-site pages to these core templates as well.

---

_Reviewed: 2026-08-20_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

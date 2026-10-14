---
phase: 08-cleanup-verification
status: fixed
fixed_at: 2026-08-25
reviewed_at: 2026-08-25
depth: standard
files_reviewed: 11
files_reviewed_list:
  - _core/astro.config.mjs
  - _core/src/pages/index.astro
  - _scripts/verify-phase-05.sh
  - _scripts/verify-phase-08.sh
  - sites/crestworks/src/layouts/Layout.astro
  - sites/crestworks/src/pages/announcements/[slug].astro
  - sites/crestworks/src/pages/announcements/index.astro
  - sites/crestworks/src/pages/blog/[slug].astro
  - sites/crestworks/src/pages/blog/index.astro
  - sites/crestworks/src/pages/jobs/[slug].astro
  - sites/crestworks/src/pages/jobs/index.astro
findings:
  critical: 0
  warning: 5
  info: 3
  total: 8
---

# Phase 8: Code Review Report

**Reviewed:** 2026-08-25
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

`_core/astro.config.mjs` and `Layout.astro` are clean. The six crestworks route files
have two recurring rendering bugs (falsy-zero tags, image path assumption) plus one
`getStaticPaths` consistency gap. The `_core/src/pages/index.astro` template carries
hardcoded hex colors in the newsletter block (HSK-02 cleared `#384AD3` but left four
others) and two root-relative links that break under any BASE_URL subpath. The shell
scripts are structurally sound; three minor quality observations noted.

## Warnings

### WR-01: Root-relative links in `_core` template ignore BASE_URL

**File:** `_core/src/pages/index.astro:18-19`
**Issue:** `href="/#contact"` and `href="/news"` are hard-coded root-relative. No `b`
variable is defined in this template's frontmatter. When the template is served (or
previewed in sandbox) at a subpath such as `/WebsiteMocker/sfdy-alt-clean/`, both links
navigate the user to the domain root instead of the correct in-site anchor/page.
**Fix:** Add the base-URL strip to the frontmatter and use it in the links:
```astro
---
const b = import.meta.env.BASE_URL.replace(/\/$/, '');
---
<a href={`${b}/#contact`} class="btn-primary">{{CTA_PRIMARY}}</a>
<a href={`${b}/news`} class="btn-ghost">Latest News</a>
```

---

### WR-02: Hardcoded hex colors in newsletter section bypass theming tokens

**File:** `_core/src/pages/index.astro:142-154`
**Issue:** The `.newsletter-section` style block uses four literal hex values —
`#ffffff`, `#0a0a0a`, `#555`, `#ccc` — instead of CSS custom properties. HSK-02
removed `#384AD3` but left these in place. Any site that instantiates from `_core`
will get a newsletter section whose background and text colours are immune to palette
overrides. Line 109 also has `color: #000` on `.btn-primary`.
**Fix:** Replace with token references:
```css
.newsletter-section { background: var(--surface-1); color: var(--text-primary); }
.newsletter-section p { color: var(--text-muted); }
.newsletter-form input { border: 1px solid var(--border-subtle); }
```
And on `.btn-primary`: `color: var(--on-accent, #000)`.

---

### WR-03: `tags?.length &&` renders literal "0" when tags is an empty array

**File:** `sites/crestworks/src/pages/announcements/[slug].astro:35`
**File:** `sites/crestworks/src/pages/blog/[slug].astro:38`
**Issue:** In Astro JSX, `{0}` renders the text character `"0"`. When an entry has
`tags: []` (empty array), `entry.data.tags?.length` evaluates to `0`, which is
falsy in the `&&` short-circuit but Astro still emits the numeric `0` into the DOM.
The result is a stray "0" visible on the page before the tags container.
**Fix:** Use a boolean coercion:
```astro
{(entry.data.tags?.length ?? 0) > 0 && (
  <div class="tags">…</div>
)}
```
Or compare explicitly: `{entry.data.tags && entry.data.tags.length > 0 && ...}`.

---

### WR-04: `blog/[slug].astro` image URL missing separator if path lacks leading slash

**File:** `sites/crestworks/src/pages/blog/[slug].astro:45`
**Issue:** `src={`${b}${entry.data.image}`}` concatenates base URL (trailing slash
stripped) directly onto the `image` field value. The `blogSchema` defines `image` as
`z.string().optional()` with no format enforcement. If a content author writes
`image: photos/hero.jpg` (no leading `/`), the resulting URL becomes
`/WebsiteMocker/crestworksphotos/hero.jpg` — a malformed path.
**Fix:** Either enforce leading slash in the schema, or normalise at render time:
```astro
<img src={`${b}/${entry.data.image.replace(/^\//, '')}`} alt="" />
```
Or add to schema: `image: z.string().regex(/^\//).optional()`.

---

### WR-05: `jobs/[slug].astro` generates detail pages for closed roles

**File:** `sites/crestworks/src/pages/jobs/[slug].astro:8-13`
**Issue:** `getStaticPaths` calls `getCollection('jobs')` without filtering on
`open !== false`. The index page (`jobs/index.astro:10`) filters closed roles out of
the listing, but their detail pages are still built and reachable by direct URL. A
visitor who bookmarked a role URL sees a full job description after the role is closed,
with no indication it is no longer accepting applications.
**Fix:** Either (a) also filter in `getStaticPaths` (simplest, removes pages entirely),
or (b) render a "This role is no longer open" banner when `entry.data.open === false`.
Option (b) is safer for SEO and bookmarked URLs:
```astro
export async function getStaticPaths() {
  const entries = await getCollection('jobs');
  // option a: only build open roles
  return entries.filter(e => e.data.open !== false).map(entry => ({ … }));
}
```

---

## Info

### IN-01: Suspicious third element in SITE_URL/SITE_BASE for-loop

**File:** `_scripts/verify-phase-05.sh:103`
**Issue:** The for-loop iterates over `SITE_URL SITE_BASE "injected SITE_URL/SITE_BASE env var pattern"`. The third element looks like a human-readable label that was accidentally left in as a search pattern. If `ingest-artifact.mjs` does not contain the literal string `injected SITE_URL/SITE_BASE env var pattern`, this check always FAILs silently (it increments FAIL). If it does contain it as a comment, the test passes on a comment match.
**Fix:** Either remove the third element or replace it with the actual code pattern being asserted (e.g., the comment text in `ingest-artifact.mjs`).

---

### IN-02: `verify-phase-08.sh` exits with code 2 for invalid arguments — undocumented

**File:** `_scripts/verify-phase-08.sh:45`
**Issue:** The file header says "Exit code: 0 = all selected checks pass, 1 = one or more failures", but invalid-argument handling uses `exit 2`. Any caller checking `[ $? -eq 1 ]` to detect failure would miss the bad-arg case.
**Fix:** Either update the header comment to document exit 2 for usage errors, or change to `exit 1` for consistency with verify-phase-05.sh.

---

### IN-03: `mktemp` files in verify-phase-05.sh not protected by `trap`

**File:** `_scripts/verify-phase-05.sh:96,127,133`
**Issue:** Three temp files are created via `mktemp` and cleaned up inline with `rm -f`. With `set -e` active, an unexpected error between creation and removal leaves the files behind. No `trap` cleans up on exit.
**Fix:** Register a cleanup trap immediately after the first `mktemp`:
```bash
_TMPFILES=()
mktemp_tracked() { local f; f=$(mktemp); _TMPFILES+=("$f"); echo "$f"; }
trap 'rm -f "${_TMPFILES[@]}"' EXIT
section_body=$(mktemp_tracked)
```

---

_Reviewed: 2026-08-25_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

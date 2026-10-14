# Phase 8: Cleanup & Verification — Pattern Map

**Mapped:** 2026-08-25
**Files analyzed:** 14 (new/modified)
**Analogs found:** 11 / 14 (3 are doc writes with format reference only)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `_core/astro.config.mjs` | config | N/A | `sites/crestworks/astro.config.mjs` | exact |
| `_core/src/pages/index.astro` | page | request-response | self (1-line patch) | exact |
| `sites/crestworks/src/pages/jobs/index.astro` | page | CRUD | `sites/parrot-capital/src/pages/jobs/index.astro` | exact |
| `sites/crestworks/src/pages/jobs/[slug].astro` | page | CRUD | `sites/parrot-capital/src/pages/jobs/[slug].astro` | exact |
| `sites/crestworks/src/pages/announcements/index.astro` | page | CRUD | `sites/parrot-capital/src/pages/announcements/index.astro` | exact |
| `sites/crestworks/src/pages/announcements/[slug].astro` | page | CRUD | `sites/parrot-capital/src/pages/announcements/[slug].astro` | exact |
| `sites/crestworks/src/pages/blog/index.astro` | page | CRUD | `sites/parrot-capital/src/pages/blog/index.astro` | exact |
| `sites/crestworks/src/pages/blog/[slug].astro` | page | CRUD | `sites/parrot-capital/src/pages/blog/[slug].astro` | exact |
| `sites/crestworks/src/content/jobs/<stub>.md` | content | N/A | `sites/sfdy-alt-clean/src/content/news/2025-07-23-pre-seed-round.md` (schema shape reference) | role-match |
| `sites/crestworks/src/content/announcements/<stub>.md` | content | N/A | schema from `_core/src/content.config.ts` announcementsSchema | role-match |
| `sites/crestworks/src/content/blog/<stub>.md` | content | N/A | schema from `_core/src/content.config.ts` blogSchema | role-match |
| `.planning/phases/02-content-system/02-VERIFICATION.md` | doc | N/A | self (targeted edit) | exact |
| `.planning/phases/04-collaboration-infrastructure/04-VALIDATION.md` | doc | N/A | `.planning/phases/01-production-deploy-pipeline/01-VALIDATION.md` | role-match |
| `.planning/phases/05-design-artifact-ingestion/05-VALIDATION.md` | doc | N/A | `.planning/phases/01-production-deploy-pipeline/01-VALIDATION.md` | role-match |

---

## Scope Findings: What Actually Needs Changing

### HSK-02 — Active site propagation
Grep result: `#384AD3` is **absent** from `sites/sfdy-alt-clean/`, `sites/mogwai-systems/`, `sites/parrot-capital/`, and `sites/crestworks/`. Only `_core/src/pages/index.astro` line 154 needs the patch.

### HSK-03 — Active site propagation
- `sites/sfdy-alt-clean/astro.config.mjs` — already uses env-var pattern (line 4: `base: process.env.SITE_BASE || '/WebsiteMocker/sfdy-alt-clean'`)
- `sites/mogwai-systems/astro.config.mjs` — already uses env-var pattern with `const SITE_URL / SITE_BASE` block
- `sites/parrot-capital/astro.config.mjs` — already uses env-var pattern with `??` operator
- **Only `_core/astro.config.mjs` needs the fix** (currently hardcoded, no env-var pattern)

---

## Pattern Assignments

### `_core/astro.config.mjs` (config, HSK-03)

**Analog:** `sites/crestworks/astro.config.mjs`

**Current state** (lines 1–7):
```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://pbau3r-sfdy.github.io',
  base: '/WebsiteMocker/{{SITE_SLUG}}',
  output: 'static',
});
```

**Target pattern** — copy from `sites/crestworks/astro.config.mjs` lines 1–10, but replace the slug fallback with `{{SITE_SLUG}}` so `new-site.sh` sed substitution still works:
```js
import { defineConfig } from 'astro/config';

const SITE_URL  = process.env.SITE_URL  || 'https://pbau3r-sfdy.github.io';
const SITE_BASE = process.env.SITE_BASE || '/WebsiteMocker/{{SITE_SLUG}}';

export default defineConfig({
  site:   SITE_URL,
  base:   SITE_BASE,
  output: 'static',
});
```

---

### `_core/src/pages/index.astro` (page, HSK-02)

**Change:** Single-line patch at line 154.

**Current** (line 154):
```css
background: #384AD3; color: #fff;
```

**Target:**
```css
background: var(--accent); color: #fff;
```

No other changes to this file. Do not re-read the full file; use a targeted edit on line 154 only.

---

### `sites/crestworks/src/pages/jobs/index.astro` (page, CRUD, HSK-01)

**Analog:** `sites/parrot-capital/src/pages/jobs/index.astro` (lines 1–56)

**Key crestworks deviation from parrot-capital:** crestworks pages include Nav and Footer (see `sites/crestworks/src/pages/news/index.astro` lines 4–5, 39). Add these imports and elements.

**Imports pattern** (adapt from `sites/parrot-capital/src/pages/jobs/index.astro` lines 1–5):
```astro
---
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Layout.astro';
import Nav from '../../components/Nav.astro';
import Footer from '../../components/Footer.astro';
import JobCard from '../../../../../_core/src/components/JobCard.astro';
```

**Core CRUD + BASE_URL alias** (adapt from parrot-capital lines 6–9):
```astro
const b = import.meta.env.BASE_URL.replace(/\/$/, '');
const jobs = (await getCollection('jobs'))
  .filter(j => j.data.open !== false)
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
```

**Render pattern** (adapt from parrot-capital lines 20–38): keep the same JobCard prop signature (`id`, `title`, `date`, `type`, `department`, `location`), wrap in `<Nav />` ... `<Footer />`.

**Style pattern** (from parrot-capital lines 40–56): copy unchanged; uses only CSS tokens, no site-specific colors.

---

### `sites/crestworks/src/pages/jobs/[slug].astro` (page, CRUD, HSK-01)

**Analog:** `sites/parrot-capital/src/pages/jobs/[slug].astro` (lines 1–112)

**Imports pattern** (adapt from parrot-capital lines 1–5):
```astro
---
import { getCollection, render } from 'astro:content';
import Layout from '../../layouts/Layout.astro';
import Nav from '../../components/Nav.astro';
import Footer from '../../components/Footer.astro';
import TypeBadge from '../../../../../_core/src/components/TypeBadge.astro';
```

**getStaticPaths + BASE_URL** (parrot-capital lines 6–19): copy unchanged; `job.id` is the slug param.

**Render** (parrot-capital lines 22–47): add `<Nav />` before `<main>` and `<Footer />` after `</main>`.

**Style** (parrot-capital lines 49–111): copy unchanged; all CSS tokens.

---

### `sites/crestworks/src/pages/announcements/index.astro` (page, CRUD, HSK-01)

**Analog:** `sites/parrot-capital/src/pages/announcements/index.astro` (lines 1–54)

**Imports pattern** (adapt from parrot-capital lines 1–4):
```astro
---
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Layout.astro';
import Nav from '../../components/Nav.astro';
import Footer from '../../components/Footer.astro';
import AnnouncementCard from '../../../../../_core/src/components/AnnouncementCard.astro';
```

**Core CRUD** (parrot-capital lines 6–8): no open-filter for announcements; sort by date descending.

**AnnouncementCard props** (parrot-capital lines 24–29): `id`, `title`, `date`, `summary`, `tags`.

**Style** (parrot-capital lines 38–54): copy unchanged.

---

### `sites/crestworks/src/pages/announcements/[slug].astro` (page, CRUD, HSK-01)

**Analog:** `sites/parrot-capital/src/pages/announcements/[slug].astro` (lines 1–110)

**Imports pattern** (adapt from parrot-capital lines 1–4):
```astro
---
import { getCollection, render } from 'astro:content';
import Layout from '../../layouts/Layout.astro';
import Nav from '../../components/Nav.astro';
import Footer from '../../components/Footer.astro';
import TagPill from '../../../../../_core/src/components/TagPill.astro';
```

**Back link** (parrot-capital line 28): `<a href={`${b}/announcements`} class="back mono">← All announcements</a>`

**Style** (parrot-capital lines 48–110): copy unchanged.

---

### `sites/crestworks/src/pages/blog/index.astro` (page, CRUD, HSK-01)

**Analog:** `sites/parrot-capital/src/pages/blog/index.astro` (lines 1–63)

**Imports pattern** (adapt from parrot-capital lines 1–4):
```astro
---
import { getCollection } from 'astro:content';
import Layout from '../../layouts/Layout.astro';
import Nav from '../../components/Nav.astro';
import Footer from '../../components/Footer.astro';
import BlogCard from '../../../../../_core/src/components/BlogCard.astro';
```

**Core CRUD** (parrot-capital line 6–8): sort by date; no filter.

**BlogCard props** (parrot-capital lines 27–33): `id`, `title`, `date`, `author`, `image`.

**Grid layout style** (parrot-capital lines 54–59):
```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  padding: 24px var(--gutter) 120px;
}
```

---

### `sites/crestworks/src/pages/blog/[slug].astro` (page, CRUD, HSK-01)

**Analog:** `sites/parrot-capital/src/pages/blog/[slug].astro` (lines 1–119)

**Imports pattern** (adapt from parrot-capital lines 1–4):
```astro
---
import { getCollection, render } from 'astro:content';
import Layout from '../../layouts/Layout.astro';
import Nav from '../../components/Nav.astro';
import Footer from '../../components/Footer.astro';
import TagPill from '../../../../../_core/src/components/TagPill.astro';
```

**Back link** (parrot-capital line 28): `<a href={`${b}/blog`} class="back mono">← All posts</a>`

**Optional author + image fields** (parrot-capital lines 33–46): `post.data.author`, `post.data.image` — both optional per blogSchema.

**Style** (parrot-capital lines 54–119): copy unchanged.

---

### Stub content files (HSK-01)

All three stubs follow the same frontmatter-only pattern: no body text required for a stub.

**`sites/crestworks/src/content/jobs/2026-08-25-open-position.md`**

Schema from `_core/src/content.config.ts` jobsSchema (lines 22–29):
```md
---
title: "Software Engineer"
department: "Engineering"
location: "Remote"
type: "full-time"
open: true
date: "2026-08-25"
---

Stub position — details to follow.
```

**`sites/crestworks/src/content/announcements/2026-08-25-welcome.md`**

Schema from `_core/src/content.config.ts` announcementsSchema (lines 31–36):
```md
---
title: "Welcome to Crestworks"
date: "2026-08-25"
summary: "Crestworks is live. More announcements to follow."
tags: []
---

Stub announcement — details to follow.
```

**`sites/crestworks/src/content/blog/2026-08-25-first-post.md`**

Schema from `_core/src/content.config.ts` blogSchema (lines 38–45):
```md
---
title: "First Post"
date: "2026-08-25"
author: "Crestworks"
summary: "This is the first blog post on the Crestworks site."
tags: []
---

Stub blog post — content to follow.
```

---

### `.planning/phases/02-content-system/02-VERIFICATION.md` (doc, DEXP-04)

**Change type:** Targeted edit to remove stale CR-01/CR-02 warnings.

**Confirmed fix state from code inspection:**

All three card components now implement the BASE_URL pattern:
- `_core/src/components/AnnouncementCard.astro` line 13: `const b = import.meta.env.BASE_URL.replace(/\/$/, '');`; line 19: `href={`${b}/announcements/${id}`}`
- `_core/src/components/BlogCard.astro` line 11: `const b = import.meta.env.BASE_URL.replace(/\/$/, '');`; line 17: `href={`${b}/blog/${id}`}`; line 20: `src={`${b}${image}`}`
- `_core/src/components/JobCard.astro` line 14: `const b = import.meta.env.BASE_URL.replace(/\/$/, '');`; line 20: `href={`${b}/jobs/${id}`}`

**Specific edits to make in `02-VERIFICATION.md`:**

1. **YAML frontmatter** (lines 1–14): change `status: human_needed` to `status: verified`, `score: 9/10` to `score: 10/10`, remove the two `human_verification` entries.

2. **Summary line** (line 20): update to `**Status:** verified — all 10 must-haves confirmed`.

3. **Truth table row 10** (line 40): change `? UNCERTAIN` status to `✓ VERIFIED` and update Evidence column.

4. **Anti-Patterns section** (lines 134–143): replace all four rows with a single row noting the pattern was fixed in commit `05e614a` — cards now use `${b}` prefix.

5. **Human Verification Required section** (lines 148–167): replace with a note that both items were resolved: CR-01/CR-02 fixed in `05e614a`; builds have passed per CI.

6. **Gaps Summary** (lines 170–180): update to reflect zero remaining gaps.

---

### `.planning/phases/04-collaboration-infrastructure/04-VALIDATION.md` (doc, DEXP-05)

**Analog:** `.planning/phases/01-production-deploy-pipeline/01-VALIDATION.md` (frontmatter + table format)

**Frontmatter pattern** (from 01-VALIDATION.md lines 1–8):
```yaml
---
phase: 4
slug: collaboration-infrastructure
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-25
---
```

**Structure:** Use the same section headings (Test Infrastructure, Sampling Rate, Per-Task Verification Map, Manual-Only Verifications). Content is generated from the live E2E test result: executor must push a test `.md` to a prod repo via `gh`, confirm `content-ci.yml` dispatch fires, confirm `content-sync.yml` syncs into WebsiteMocker, and record the result.

---

### `.planning/phases/05-design-artifact-ingestion/05-VALIDATION.md` (doc, DEXP-06)

**Analog:** `.planning/phases/01-production-deploy-pipeline/01-VALIDATION.md`

**Frontmatter pattern:**
```yaml
---
phase: 5
slug: design-artifact-ingestion
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-25
---
```

**Structure:** Same section headings as 01-VALIDATION.md. Content is generated from the live ingest test: executor must run `ingest-artifact.mjs` on a real artifact (HTML file or existing capture from `_captures/`), verify output fields, and record the result.

---

## Shared Patterns

### BASE_URL alias (all new crestworks pages)

**Source:** `sites/parrot-capital/src/pages/blog/index.astro` line 6; `sites/crestworks/src/pages/news/index.astro` line 8 (not yet using this alias but the pattern is canonical)

**Apply to:** All 6 new crestworks page files (both index and slug variants for jobs, announcements, blog)

```astro
const b = import.meta.env.BASE_URL.replace(/\/$/, '');
```

Declare at top of frontmatter block after imports.

### _core component import depth (all new crestworks pages)

**Source:** `sites/parrot-capital/src/pages/jobs/index.astro` line 4; `sites/parrot-capital/src/pages/blog/index.astro` line 4

**Apply to:** All 6 new crestworks page files

```astro
import JobCard from '../../../../../_core/src/components/JobCard.astro';
```

Five `../` levels up from `sites/crestworks/src/pages/<collection>/` reaches the project root, then into `_core/src/components/`.

### Nav + Footer inclusion (all new crestworks pages)

**Source:** `sites/crestworks/src/pages/news/index.astro` lines 4–5, 16, 39

**Apply to:** All 6 new crestworks page files

```astro
import Nav from '../../components/Nav.astro';
import Footer from '../../components/Footer.astro';
```

Wrap page body: `<Nav />` before `<main>`, `<Footer />` after `</main>`.

### getStaticPaths pattern (all [slug].astro pages)

**Source:** `sites/parrot-capital/src/pages/blog/[slug].astro` lines 6–11

**Apply to:** `jobs/[slug].astro`, `announcements/[slug].astro`, `blog/[slug].astro` (crestworks)

```astro
export async function getStaticPaths() {
  const entries = await getCollection('<collection>');
  return entries.map(entry => ({
    params: { slug: entry.id },
    props:  { entry },
  }));
}
```

---

## No Analog Found

No files with zero analog. All files have either an exact match or a format reference.

---

## Metadata

**Analog search scope:** `_core/`, `sites/parrot-capital/`, `sites/crestworks/`, `sites/sfdy-alt-clean/`, `sites/mogwai-systems/`, `.planning/phases/`
**Files scanned:** 22
**Pattern extraction date:** 2026-08-25

# Phase 2: Content System — Research

**Researched:** 2026-08-20
**Domain:** Astro 5 Content Layer API, monorepo content schema sharing, skill authoring
**Confidence:** HIGH

---

## Summary

Phase 2 migrates all active sites from the Astro 4 legacy content API (`src/content/config.ts` + `post.render()` + `z.date()` + `post.slug`) to the Astro 5 Content Layer API (`src/content.config.ts` + `loader: glob()` + `render(entry)` + `z.coerce.date()` + `entry.id`). Astro 5.18.2 is already installed; sites are running in backward-compatible legacy mode.

The three active sites have very different starting states: `sfdy-alt-clean` already has a working news content system in Astro 4 format with 6 real articles, while `mogwai-systems` and `parrot-capital` are minimal holding pages with no content system at all. This means the phase has two distinct workstreams — migration (sfdy-alt-clean) and full scaffolding (mogwai-systems, parrot-capital).

The canonical schema in `_core/src/content.config.ts` is shared via relative TypeScript imports (`../../_core/src/content.config.ts`). This is not a workspace import — it is a plain relative file import that resolves correctly both during build (where there are no filesystem restrictions) and in dev mode (Vite builds the module graph statically). When `new-site.sh` copies `_core` to a new site, the relative path in the template still resolves to `_core/src/content.config.ts` correctly, making the approach future-proof without requiring any workspace or tsconfig changes.

**Primary recommendation:** Migrate `_core/src/content.config.ts` first (schema library), then migrate sfdy-alt-clean, then scaffold mogwai-systems and parrot-capital using the migrated `_core` as the template, then update and extend the content skills.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONTENT-01 | Migrate all active sites from Astro 4 (`src/content/config.ts` + `post.render()`) to Astro 5 (`src/content.config.ts` + `loader: glob()` + `render(entry)`) | See §Standard Stack: exact API changes documented; sfdy-alt-clean has confirmed Astro 4 API in use |
| CONTENT-02 | Canonical collection schema in `_core/src/content.config.ts`; all sites import from it | See §Architecture Patterns: relative-import approach works without workspace changes |
| CONTENT-03 | All schemas use `z.coerce.date()` not `z.date()` | See §Standard Stack: `z.coerce.date()` verified; current code uses `z.date()` in both `_core` and sfdy-alt-clean |
| CONTENT-04 | mogwai-systems and parrot-capital scaffolded with `content.config.ts` | See §Codebase State: confirmed neither site has any content config or directories |
| CONTENT-05 | news collection with specified fields, rendered at `/news/` and `/news/[slug]/` | See §Architecture Patterns: `_core` already has these pages in Astro 4 format; sfdy-alt-clean has them too |
| CONTENT-06 | jobs collection with `title`, `department`, `location`, `type`, `open`, `date`; rendered at `/jobs/` and `/jobs/[slug]/` | See §Architecture Patterns: does not exist in any site; new pages required |
| CONTENT-07 | announcements collection with `title`, `date`, `summary`, `tags[]`; rendered at `/announcements/` and `/announcements/[slug]/` | See §Architecture Patterns: does not exist in any site; new pages required |
| CONTENT-08 | blog collection with `title`, `date`, `author`, `summary`, `image`, `tags[]`; rendered at `/blog/` and `/blog/[slug]/` | See §Architecture Patterns: does not exist in any site; new pages required |
| CONTENT-09 | Skills `/wm-add-news`, `/wm-add-job`, `/wm-add-announcement`, `/wm-add-blog` | See §Codebase State: only `/wm-add-news` exists; 3 new skills needed |
| CONTENT-10 | `.md` files follow `YYYY-MM-DD-slug.md` naming; editable via GitHub web UI | See §Common Pitfalls: `z.coerce.date()` is the safety net; naming convention enforced by skills only |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

- Active sites requiring migration: `sfdy-alt-clean`, `mogwai-systems`, `parrot-capital` only.
- Template sites (`crestworks`, `levion`, `orbint`, `hypersonica`, `tnt-ventures`) do NOT need content system migration — not in scope for this phase.
- `crestworks-legacy` is archived (`skip_ci: true`) — not in scope.
- Production org: `pbau3r-sfdy`. All skills work within the WebsiteMocker sandbox.
- Content skills live in `_core/.claude/skills/` (inherited by all sites).
- Framework-level skills live in `.claude/skills/`.

---

## Codebase State Inventory

### Active Sites Content Status

| Site | Has `src/content/config.ts` (Astro 4) | Has `src/content.config.ts` (Astro 5) | Has Content Dir | Existing Collections |
|------|---------------------------------------|----------------------------------------|-----------------|----------------------|
| `sfdy-alt-clean` | YES — `news` with `z.date()` | NO | YES — `src/content/news/` (6 articles) | news only |
| `mogwai-systems` | NO | NO | NO | none |
| `parrot-capital` | NO | NO | NO | none |

**sfdy-alt-clean schema drift vs `_core`:** The site's schema has an extra `short?` field and drops `imageCredit?`. After migration, both must conform to the canonical schema.

### _core Template Status

- `_core/src/content/config.ts` — Astro 4 format, exports only `news` collection with `z.date()`
- `_core/src/content.config.ts` — does NOT exist (needs creation)
- `_core/src/pages/news/[slug].astro` — exists, uses Astro 4 API (`post.render()`, `post.slug`)
- `_core/src/pages/news/index.astro` — exists, uses Astro 4 API
- `_core/src/components/NewsCard.astro` — exists

### Existing Skill Coverage

| Skill | Location | Coverage | Needs Change |
|-------|----------|----------|--------------|
| `/wm-add-news` | `_core/.claude/skills/wm-add-news.md` | news only | Update date quoting; minor path notes |
| `/wm-edit-news` | `_core/.claude/skills/wm-edit-news.md` | news only | Minor update |
| `/wm-list-news` | `_core/.claude/skills/wm-list-news.md` | news only | Keep as-is |
| `/wm-add-job` | does not exist | — | Create new |
| `/wm-add-announcement` | does not exist | — | Create new |
| `/wm-add-blog` | does not exist | — | Create new |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Schema definitions (Zod) | `_core/src/content.config.ts` | — | Single source of truth; all sites import from here |
| Collection registration + loaders | Each site's `src/content.config.ts` | — | Loaders reference site-local content dirs; cannot be centralized |
| Content files (Markdown) | Each site's `src/content/<type>/` | — | Per-site content; never shared between sites |
| List pages (`/news/`, `/jobs/`, etc.) | Each site's `src/pages/<type>/index.astro` | — | Site-specific layout and styling; templates live in `_core` as starting point |
| Detail pages (`/news/[slug]/`, etc.) | Each site's `src/pages/<type>/[slug].astro` | — | Same — `_core` provides the template copy |
| Content skills | `_core/.claude/skills/` | — | Skills are inherited by all sites |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `astro` | 5.18.2 (installed) | SSG framework + Content Layer | Already installed; Content Layer API is the Astro 5 standard |
| `astro:content` | built-in | Collection definitions, glob loader, render() | Native Astro module; no separate install |
| `astro/loaders` | built-in | `glob()` loader for filesystem-based collections | Native Astro 5 loader; replaces `type: 'content'` |
| `astro/zod` | built-in | Schema validation for frontmatter | Re-exported by Astro; same API as standalone `zod` |

[VERIFIED: docs.astro.build/en/guides/content-collections/]

### No External Packages Required

This phase adds zero new npm dependencies. All Content Layer API features are built into Astro 5.18.2. The `glob()` loader, `defineCollection`, `getCollection`, and `render()` functions are all part of `astro:content` and `astro/loaders` — modules that come with Astro.

## Package Legitimacy Audit

No external packages are installed in this phase. All Content Layer API functionality is built into the `astro` package already present at version 5.18.2.

---

## Architecture Patterns

### System Architecture Diagram

```
_core/src/content.config.ts        (schema library — exports Zod schemas only)
         │
         │  relative import: ../../_core/src/content.config.ts
         │
   ┌─────┼─────────────────────────────────────────┐
   ▼     ▼                                         ▼
sites/sfdy-alt-clean/          sites/mogwai-systems/    sites/parrot-capital/
src/content.config.ts          src/content.config.ts    src/content.config.ts
(import schemas + define        (import schemas +         (import schemas +
 glob() loaders for              define glob() loaders     define glob() loaders
 each site's dirs)               for each site's dirs)     for each site's dirs)
         │                               │                         │
         ▼                               ▼                         ▼
src/content/{news,jobs,        src/content/{news,jobs,    src/content/{news,jobs,
 announcements,blog}/           announcements,blog}/       announcements,blog}/
*.md files                      *.md files                 *.md files
         │                               │                         │
         └───────────────────────────────┴─────────────────────────┘
                                         │
                               Astro build (getCollection)
                                         │
                          ┌──────────────┴──────────────┐
                          ▼                             ▼
               /news/ + /news/[slug]/        /jobs/ + /jobs/[slug]/
               /announcements/ + [slug]/     /blog/ + /blog/[slug]/
```

### Recommended Project Structure (per site after migration)

```
sites/<slug>/
├── src/
│   ├── content.config.ts           ← Astro 5 — imports schemas from _core
│   ├── content/
│   │   ├── news/                   ← YYYY-MM-DD-slug.md
│   │   ├── jobs/                   ← YYYY-MM-DD-slug.md
│   │   ├── announcements/          ← YYYY-MM-DD-slug.md
│   │   └── blog/                   ← YYYY-MM-DD-slug.md
│   └── pages/
│       ├── news/
│       │   ├── index.astro         ← list page
│       │   └── [slug].astro        ← detail page
│       ├── jobs/
│       │   ├── index.astro
│       │   └── [slug].astro
│       ├── announcements/
│       │   ├── index.astro
│       │   └── [slug].astro
│       └── blog/
│           ├── index.astro
│           └── [slug].astro
```

### Pattern 1: Canonical Schema in `_core/src/content.config.ts`

`_core/src/content.config.ts` exports only Zod schema objects — no `defineCollection`, no `glob()` loader, no `collections` export. Loaders depend on the site's own content directory paths and must be defined per-site.

```typescript
// _core/src/content.config.ts
import { z } from 'astro:content';

export const newsSchema = z.object({
  title:       z.string(),
  date:        z.coerce.date(),
  summary:     z.string(),
  image:       z.string().optional(),
  imageCredit: z.string().optional(),
  tags:        z.array(z.string()).optional(),
});

export const jobsSchema = z.object({
  title:      z.string(),
  department: z.string().optional(),
  location:   z.string(),
  type:       z.enum(['full-time', 'part-time', 'contract']),
  open:       z.boolean().default(true),
  date:       z.coerce.date(),
});

export const announcementsSchema = z.object({
  title:   z.string(),
  date:    z.coerce.date(),
  summary: z.string(),
  tags:    z.array(z.string()).optional(),
});

export const blogSchema = z.object({
  title:   z.string(),
  date:    z.coerce.date(),
  author:  z.string().optional(),
  summary: z.string(),
  image:   z.string().optional(),
  tags:    z.array(z.string()).optional(),
});
```

[VERIFIED: docs.astro.build/en/guides/content-collections/]

### Pattern 2: Per-Site `content.config.ts` with Glob Loaders

Each site's `src/content.config.ts` imports schemas from `_core` and registers collections with site-local glob loaders.

```typescript
// sites/<slug>/src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  newsSchema,
  jobsSchema,
  announcementsSchema,
  blogSchema,
} from '../../_core/src/content.config.ts';

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: newsSchema,
});

const jobs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/jobs' }),
  schema: jobsSchema,
});

const announcements = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/announcements' }),
  schema: announcementsSchema,
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: blogSchema,
});

export const collections = { news, jobs, announcements, blog };
```

[VERIFIED: docs.astro.build/en/guides/content-collections/]

### Pattern 3: Astro 5 Detail Page (`[slug].astro`)

The two critical API changes from Astro 4 to Astro 5 Content Layer API:
1. `post.slug` → `post.id` (both in `getStaticPaths` params and in `Astro.props`)
2. `post.render()` → standalone `render(post)` from `astro:content`

```typescript
// sites/<slug>/src/pages/news/[slug].astro
---
import { getCollection, render } from 'astro:content';  // render is now a standalone import
import Layout from '../../layouts/Layout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('news');
  return posts.map(post => ({
    params: { slug: post.id },   // entry.id, NOT entry.slug
    props:  { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);   // standalone render(), NOT post.render()
---
<Layout title={post.data.title} description={post.data.summary}>
  <Content />
</Layout>
```

[VERIFIED: docs.astro.build/en/guides/upgrade-to/v5/]

### Pattern 4: Jobs List Page (open-only filter)

The jobs list page filters by `entry.data.open === true` by default (CONTENT-06 requirement).

```typescript
// sites/<slug>/src/pages/jobs/index.astro
---
import { getCollection } from 'astro:content';
const allJobs = await getCollection('jobs');
const openJobs = allJobs
  .filter(job => job.data.open !== false)
  .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
---
```

### Pattern 5: Content File Frontmatter (GitHub Web UI compatible)

Dates MUST be quoted strings in frontmatter for GitHub web UI safety. `z.coerce.date()` handles both quoted and unquoted forms.

```yaml
---
title: "Pre-Seed Round Closed"
date: "2025-07-23"
summary: "Starflight Dynamics closes €2.5M pre-seed round."
image: "/images/news/2025-07-23-round.jpg"
imageCredit: "Starflight Dynamics"
tags: ["funding", "announcement"]
---
```

For jobs:
```yaml
---
title: "Senior Systems Engineer"
department: "Engineering"
location: "Berlin, Germany"
type: "full-time"
open: true
date: "2026-01-15"
---
```

### Anti-Patterns to Avoid

- **Using `z.date()` instead of `z.coerce.date()`:** Non-technical contributors writing `date: "2025-07-23"` (quoted string) in GitHub web UI will cause a build failure. `z.date()` rejects strings; `z.coerce.date()` accepts them. Always use `z.coerce.date()` for frontmatter date fields.
- **Calling `post.render()` in Astro 5:** The `.render()` method no longer exists on content entries in Astro 5 Content Layer API. Use `import { render } from 'astro:content'` and call `render(entry)` instead.
- **Using `post.slug` in Astro 5:** The `.slug` property is replaced by `.id` in Content Layer API entries. All `getStaticPaths` params and links must use `post.id`.
- **Keeping `src/content/config.ts`:** This file runs in Astro 4 legacy mode. Its presence suppresses the Content Layer API. Remove it when adding `src/content.config.ts`.
- **Putting `glob()` loaders in `_core/src/content.config.ts`:** Loaders reference filesystem paths relative to the site being built. A centralized loader in `_core` would point to `_core`'s own (non-existent) content directories. Loaders MUST be defined per-site.
- **Duplicating schemas in each site's `content.config.ts`:** Leads to schema drift (already observed between `_core` and `sfdy-alt-clean`). Always import from `_core`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown parsing with frontmatter | Custom YAML parser + markdown renderer | Astro Content Layer API + `render()` | Astro handles YAML parsing, MDX, remark plugins, code highlighting, type safety |
| Date coercion from string input | Custom date parser | `z.coerce.date()` | Zod handles ISO strings, Date objects, Unix timestamps — all contributor input forms |
| Glob file collection | Custom `fs.readdirSync` scanner | `loader: glob()` | Handles recursive patterns, file watching in dev, build caching |
| Slug generation from filename | Custom regex on `entry.id` | Use `entry.id` directly | Astro's glob() loader already slugifies the filename into `id`; no extra processing needed |

**Key insight:** The Content Layer API replaces ALL manual file-reading patterns. Never use `fs.readdirSync` or `import.meta.glob` for content collection queries — always use `getCollection()`.

---

## Common Pitfalls

### Pitfall 1: Forgetting to Delete `src/content/config.ts` After Adding `src/content.config.ts`

**What goes wrong:** Astro detects `src/content/config.ts` and runs in legacy mode, silently ignoring `src/content.config.ts`. The migration appears to succeed but the Astro 5 Content Layer API is never activated.

**Why it happens:** Astro 5 maintains backward compatibility. The legacy `src/content/config.ts` takes precedence.

**How to avoid:** Delete `src/content/config.ts` as part of the same commit that creates `src/content.config.ts`. Verify the build still passes after deletion.

**Warning signs:** `.astro/content.d.ts` still shows `ContentCollectionKey` types from the legacy API rather than Content Layer types; `render()` standalone import causes TypeScript errors.

### Pitfall 2: `post.slug` vs `post.id` in Existing Templates

**What goes wrong:** After migration, links to `/news/${post.slug}` break silently at build time — the build may succeed but all news detail links go to 404.

**Why it happens:** Content Layer API entries have `id` (filesystem-derived), not `slug`. The old `post.slug` is undefined.

**How to avoid:** Global search for `post.slug` and `entry.slug` after migration. Replace with `post.id` / `entry.id` everywhere — both in `getStaticPaths` params and in `href` attributes. The route parameter name (e.g., `[slug].astro`) can stay as `slug` — only the source of the value changes.

**Confirmed locations in sfdy-alt-clean:**
- `src/pages/news/[slug].astro`: `params: { slug: post.slug }` and `post.slug` in href
- `src/pages/news/index.astro`: `post.slug` in href inside `NewsCard`

### Pitfall 3: `z.date()` Rejects Quoted Date Strings from GitHub Web UI

**What goes wrong:** A contributor edits a `.md` file in GitHub's web UI and saves `date: "2026-01-15"` (with quotes). YAML parsers return this as a string, not a Date. `z.date()` rejects strings — the build fails.

**Why it happens:** `z.date()` only accepts JavaScript `Date` objects. YAML represents unquoted dates as Date objects in some parsers and as strings in others; quoted dates are always strings.

**How to avoid:** Use `z.coerce.date()` in ALL collection schemas. It accepts strings, Date objects, and timestamps. Update `_core/src/content.config.ts` first, then all sites inherit the fix automatically.

### Pitfall 4: `import { render } from 'astro:content'` Missing from Existing Templates

**What goes wrong:** TypeScript compilation error in `[slug].astro` files after migration: `post.render is not a function`.

**Why it happens:** In Astro 5 Content Layer API, `render` is a module-level function, not an entry method. Existing templates call `post.render()`.

**How to avoid:** Update the `import` line at the top of every `[slug].astro` file: add `render` to the import from `astro:content`. Change `await post.render()` to `await render(post)`.

### Pitfall 5: Empty Content Directories Break the Build

**What goes wrong:** A site with `src/content/news/` that contains zero `.md` files may produce an empty `getStaticPaths()` return, which is fine. But a missing directory itself causes the glob loader to throw.

**Why it happens:** `glob({ pattern: '**/*.md', base: './src/content/news' })` errors if `base` path does not exist.

**How to avoid:** Always create the content directory AND add a `.gitkeep` file OR a placeholder `.md` file when scaffolding new sites. Alternatively, verify at build time that all directories declared in `content.config.ts` exist. The safest approach: scaffold each collection directory with an empty `.gitkeep` file.

**Tested behavior:** [ASSUMED] — based on Astro glob() loader documentation behavior. Verify when scaffolding mogwai-systems and parrot-capital.

### Pitfall 6: `vite.server.fs.allow` Not Needed for Build (Only Dev)

**What goes wrong:** Developer adds `vite.server.fs.allow` restriction concern, over-engineers the solution.

**Why it happens:** Vite's `server.fs.allow` applies to the HTTP dev server file serving, not to build-time import resolution. Static imports like `import { newsSchema } from '../../_core/src/content.config.ts'` are resolved by Vite's bundler at startup — not served over HTTP.

**How to avoid:** Do NOT add `vite.server.fs.allow` to `astro.config.mjs` unless dev server testing proves it's needed. Build (`npm run build`) has no filesystem restrictions on static imports.

---

## Code Examples

### Canonical Frontmatter per Collection Type

**news** — fields from CONTENT-05:
```yaml
---
title: "Pre-Seed Round Closed"
date: "2025-07-23"
summary: "One-sentence description for the news card."
image: "/images/news/2025-07-23-pre-seed-round.jpg"
imageCredit: "Optional photographer credit"
tags: ["funding"]
---
```

**jobs** — fields from CONTENT-06:
```yaml
---
title: "Senior Systems Engineer"
department: "Engineering"
location: "Berlin, Germany"
type: "full-time"
open: true
date: "2026-01-15"
---
```

**announcements** — fields from CONTENT-07:
```yaml
---
title: "System Maintenance Window"
date: "2026-03-01"
summary: "Scheduled maintenance on 3 March 2026."
tags: ["operations"]
---
```

**blog** — fields from CONTENT-08:
```yaml
---
title: "How We Built Our Starfield Effect"
date: "2026-02-15"
author: "Engineering Team"
summary: "A walkthrough of the CSS + SVG starfield on the homepage."
image: "/images/blog/2026-02-15-starfield.jpg"
tags: ["engineering", "design"]
---
```

### Skill File Pattern (wm-add-job)

```markdown
# /wm-add-job

Add a job listing to this site.

## Steps

1. **Gather** (ask for anything not provided):
   - Title
   - Department (optional)
   - Location (e.g. "Berlin, Germany" or "Remote")
   - Type: full-time | part-time | contract
   - Open: true | false (default: true)
   - Date (YYYY-MM-DD; default: today)
   - Body text (full job description in Markdown)

2. **Generate slug**: `YYYY-MM-DD-title-words` (lowercase, hyphens)

3. **Write** to `src/content/jobs/<slug>.md`:
   \`\`\`markdown
   ---
   title: "<title>"
   department: "<dept>"
   location: "<location>"
   type: "<type>"
   open: true
   date: "<YYYY-MM-DD>"
   ---

   <body text>
   \`\`\`

4. **Commit and push**:
   \`\`\`bash
   git add src/content/jobs/<slug>.md
   git commit -m "content(<slug>): add job — <title>"
   git push
   \`\`\`
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `src/content/config.ts` + `type: 'content'` | `src/content.config.ts` + `loader: glob()` | Astro 5.0 (Dec 2024) | Decouples schema from loader; enables custom loaders |
| `entry.render()` method | `render(entry)` standalone function from `astro:content` | Astro 5.0 | Entries are now serializable plain objects |
| `entry.slug` (auto-generated from filename) | `entry.id` (filesystem-derived path) | Astro 5.0 | All route params and links must use `.id` |
| `z.date()` for frontmatter dates | `z.coerce.date()` | Zod best practice for Astro | Accepts string dates from GitHub web UI editors |

[CITED: docs.astro.build/en/guides/upgrade-to/v5/]

**Deprecated/outdated in this codebase:**
- `_core/src/content/config.ts`: Astro 4 legacy format — delete after `_core/src/content.config.ts` is created.
- `sites/sfdy-alt-clean/src/content/config.ts`: Same — delete after migration.
- `post.render()` calls in `_core` and `sfdy-alt-clean` page templates: replace with `render(post)`.
- `post.slug` references in `sfdy-alt-clean` news pages: replace with `post.id`.
- `z.date()` in `_core` and `sfdy-alt-clean` schemas: replace with `z.coerce.date()`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Empty content directories (with `.gitkeep`) prevent glob() loader from throwing | Pitfall 5 | If glob() still throws on empty dirs, the scaffolding plan must add placeholder `.md` files instead of `.gitkeep` |
| A2 | `import from '../../_core/src/content.config.ts'` works in Vite build without filesystem allow-list configuration | Pattern 2 | If Vite restricts cross-project-root imports during build, each site's `astro.config.mjs` needs `vite.server.fs.allow: ['../../_core']` added |
| A3 | sfdy-alt-clean's existing `post.slug` values in news URLs are identical to the Astro 5 `entry.id` values (i.e., filename without extension) | Pattern 3 | If `entry.id` has a different format, existing deployed news article URLs would break on next publish |

**Assumption A3 detail:** sfdy-alt-clean currently uses `post.slug` in links (e.g., `/news/2025-07-23-pre-seed-round`). After migration to Astro 5, `entry.id` for `2025-07-23-pre-seed-round.md` in `./src/content/news/` should be `2025-07-23-pre-seed-round`. The VERIFIER should confirm this by running a local build after migration and checking that existing news URLs still resolve.

---

## Open Questions (RESOLVED)

1. **Should mogwai-systems and parrot-capital get all four collection page routes immediately, or just the `content.config.ts` scaffold?**
   - What we know: Both sites are holding pages with no existing page routes for content. CONTENT-04 says "scaffolded with `content.config.ts`". CONTENT-05/06/07/08 say collection types are "rendered at `/news/`..."
   - What's unclear: Whether CONTENT-05/08 applies to all three active sites or only to sites that actually need that content type now.
   - Recommendation: Scaffold ALL four collection types in ALL three active sites (config + dirs + pages) but leave content directories empty. This is the cleanest interpretation and avoids a follow-up migration step.
   - **RESOLVED:** Scaffold all four collection types with full page routes immediately in all three active sites (Plans 07 and 08). Leaving content directories empty (`.gitkeep`) satisfies CONTENT-04 without content yet.

2. **sfdy-alt-clean existing news articles: do any use the `short` field from the current schema?**
   - What we know: `sfdy-alt-clean/src/content/config.ts` has a `short?: string` field not in `_core`. After migration to the canonical schema, `short` is dropped.
   - What's unclear: Whether any of the 6 existing `.md` files in `sfdy-alt-clean/src/content/news/` use `short:` in frontmatter.
   - Recommendation: Read each `.md` file before migrating the schema. If `short:` is used, either (a) add it to the canonical schema as `short?: z.string().optional()` or (b) remove it from the articles.
   - **RESOLVED:** 4 of 6 existing articles use `short:` in frontmatter. The canonical newsSchema in `_core/src/content.config.ts` will include `short: z.string().optional()` to preserve backward compatibility without touching the existing articles (Plan 01).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All builds | ✓ | (current) | — |
| Astro | Content Layer API | ✓ | 5.18.2 | — |
| npm workspaces | Site builds | ✓ | (current) | — |

No missing dependencies. This phase requires no new installs — Astro 5.18.2 already includes the Content Layer API, `glob()` loader, and `render()` function.

---

## Security Domain

This phase handles only static Markdown content files with YAML frontmatter. There is no user input, no HTTP requests, no authentication, and no server-side processing. Content is rendered at build time.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | Minimal | `z.coerce.date()` + Zod schema validation at build time |
| V6 Cryptography | No | — |

**Only relevant security consideration:** Content files edited via GitHub web UI are committed to the repository — GitHub's own auth and branch protection govern who can commit. This is managed at the repo level, not in this phase.

---

## Sources

### Primary (HIGH confidence)
- [docs.astro.build/en/guides/content-collections/](https://docs.astro.build/en/guides/content-collections/) — glob() syntax, render(), z.coerce.date(), entry.id
- [docs.astro.build/en/guides/upgrade-to/v5/](https://docs.astro.build/en/guides/upgrade-to/v5/) — entry.slug → entry.id, post.render() → render(entry), legacy config.ts backward compat

### Secondary (MEDIUM confidence)
- Direct file inspection of `sites/sfdy-alt-clean/src/content/config.ts`, `sites/sfdy-alt-clean/src/pages/news/[slug].astro`, `_core/src/content/config.ts`, `_core/.claude/skills/wm-add-news.md`, and all three active sites' directory structures — confirmed exact current state

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Astro 5.18.2 installed and verified; Content Layer API confirmed from official docs
- Architecture (canonical schema sharing): HIGH — relative import approach is standard TypeScript/ESM; verified against codebase structure
- Codebase state: HIGH — all files directly inspected
- Pitfalls: HIGH for documented API changes (verified from upgrade guide); LOW for pitfall 5 (empty dirs behavior marked [ASSUMED])

**Research date:** 2026-08-20
**Valid until:** 2026-09-20 (Astro stable; Content Layer API stable since 5.0)

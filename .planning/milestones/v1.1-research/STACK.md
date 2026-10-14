# Technology Stack Research

**Project:** WebsiteMocker — Deploy Pipeline + Content System Upgrade
**Researched:** 2026-08-20
**Overall confidence:** HIGH (all claims verified against official docs or Context7)

---

## 1. GitHub Actions: publish.yml — push built output to a different org/repo

### Verdict

Use `JamesIves/github-pages-deploy-action@v4.9.0` (same action as sandbox `deploy.yml`), triggered by `workflow_dispatch`, authenticated with a PAT stored as a repository secret. This is the only supported path for cross-repo gh-pages push.

### Why v4.9.0, not v4.8.0

The sandbox `deploy.yml` pins `@v4.8.0`. The latest release is **v4.9.0** (Aug 8, 2026), which fixes deployment branch naming bugs and migrates the runtime to Node 24. Pin `publish.yml` to `v4.9.0`. Do not use floating `@v4` — pin to the exact patch to prevent surprise behaviour.

Source: https://github.com/JamesIves/github-pages-deploy-action/releases

### Why `GITHUB_TOKEN` does not work for cross-repo

`GITHUB_TOKEN` is scoped to the repository the workflow runs in (`pbau3r-sfdy/WebsiteMocker`). Pushing to a different repo (`pbau3r-sfdy/parrot-capital`) requires an explicit credential. Use a **Classic PAT** with `repo` scope, or a Fine-Grained PAT with `Contents: Read and write` targeting each production repo explicitly.

Store the PAT as `WM_PUBLISH_PAT` in WebsiteMocker's repository secrets.

### Required: `persist-credentials: false` on checkout

When a PAT is passed to the deploy action, `actions/checkout` must set `persist-credentials: false`. If omitted, Git's credential helper caches the `GITHUB_TOKEN` and the deploy action's PAT is ignored. This is a documented gotcha in the action README and confirmed in community issues.

Source: https://github.com/JamesIves/github-pages-deploy-action (README, "Cross Repository Deployments")

### Workflow design

`publish.yml` must be `workflow_dispatch` only — never triggered by push to `main` (that would re-deploy all sites on every content commit). Inputs: `slug` (required), `site_url` (required). The `prod_repo` can be read from `sites/<slug>/wiring.json` via a script step and exported as `GITHUB_OUTPUT`, making the workflow data-driven rather than requiring a third manual input.

The `build-all.js` script already accepts a single slug argument. Use it with `SITE_URL` and `SITE_BASE` env vars set from workflow inputs.

The `folder:` input to the deploy action must point at `dist/<slug>` (the subdirectory produced by `build-all.js` for a single-site build), not `dist/`. The deploy action's `target-folder` parameter is not needed here — the root of `dist/<slug>` becomes the root of the `gh-pages` branch in the production repo, which is correct.

### Recommended publish.yml skeleton

```yaml
name: Publish Site to Production

on:
  workflow_dispatch:
    inputs:
      slug:
        description: 'Site slug (e.g. parrot-capital)'
        required: true
        type: string
      site_url:
        description: 'Production origin (e.g. https://parrot-capital.com)'
        required: true
        type: string

concurrency:
  group: publish-${{ inputs.slug }}
  cancel-in-progress: false

jobs:
  publish:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout
        uses: actions/checkout@v7
        with:
          persist-credentials: false   # required when using a PAT in deploy step

      - name: Setup Node 22 (LTS)
        uses: actions/setup-node@v7
        with:
          node-version: '22'
          cache: npm

      - name: Install dependencies
        run: npm ci --no-fund --no-audit

      - name: Read prod_repo from wiring.json
        id: wiring
        run: |
          PROD_REPO=$(node -e "
            const w = JSON.parse(require('fs').readFileSync('sites/${{ inputs.slug }}/wiring.json','utf8'));
            if (!w.prod_repo) { console.error('prod_repo missing in wiring.json'); process.exit(1); }
            if ((w.stage || 0) < 5) { console.error('Stage < 5 — site not prod-ready'); process.exit(1); }
            console.log(w.prod_repo);
          ")
          echo "prod_repo=$PROD_REPO" >> "$GITHUB_OUTPUT"

      - name: Build ${{ inputs.slug }}
        run: node _scripts/build-all.js ${{ inputs.slug }}
        env:
          SITE_URL: ${{ inputs.site_url }}
          SITE_BASE: /

      - name: Deploy to ${{ steps.wiring.outputs.prod_repo }}
        uses: JamesIves/github-pages-deploy-action@v4.9.0
        with:
          token: ${{ secrets.WM_PUBLISH_PAT }}
          repository-name: ${{ steps.wiring.outputs.prod_repo }}
          folder: dist/${{ inputs.slug }}
          branch: gh-pages
          clean: true
          single-commit: true
```

### What NOT to use

- `peaceiris/actions-gh-pages` — works, but the project already uses JamesIves action in sandbox; no reason to introduce a second deploy action.
- `s0/git-publish-subdir-action` — SSH-key-based; more complex to set up and rotate than a PAT. Avoid.
- GitHub's official `actions/deploy-pages` — requires Pages source to be set to "GitHub Actions" (Artifacts mode), not `gh-pages` branch. Incompatible with the existing deployment model.

---

## 2. Astro Content Collections (Astro 5 Content Layer API)

### The existing code uses the legacy v2 API — migration is required

The sites (e.g. `sfdy-alt-clean`) currently use:
- Config at `src/content/config.ts` with `type: 'content'`
- `post.render()` instance method (legacy)

This is the **Astro 4 / legacy API**. Astro 5 (which this project runs on — v5.18.2) introduced the **Content Layer API** as the replacement. The legacy API still works in Astro 5 via a backwards-compatibility shim, but the Astro docs say it is "in maintenance mode, no longer recommended for new development and will eventually be removed."

**Do not continue writing new collections using `type: 'content'` or `type: 'data'`.**

Source: https://docs.astro.build/en/guides/upgrade-to/v5/ (Content Layer API section)
Source: Context7 `/withastro/docs` — legacy.collectionsBackwardsCompat flag docs

### What changes in Astro 5 Content Layer API

| Concern | Legacy (v4 / current) | Content Layer API (v5 / target) |
|---|---|---|
| Config file location | `src/content/config.ts` | `src/content.config.ts` (one level up) |
| Collection declaration | `type: 'content'` or `type: 'data'` | `loader: glob({...})` or `loader: file({...})` |
| Rendering | `const { Content } = await post.render()` | `import { render } from 'astro:content'; const { Content } = await render(post)` |
| Entry ID | path-based slug (e.g. `news/2025-07-23-pre-seed`) | filename without extension (e.g. `2025-07-23-pre-seed`) |
| Zod import | `import { z } from 'astro:content'` | `import { z } from 'astro/zod'` (preferred) |

### Recommended content.config.ts for a site

Place at `sites/<slug>/src/content.config.ts`:

```typescript
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    /** Short headline for grids/cards; falls back to title if omitted. */
    short: z.string().optional(),
    date: z.coerce.date(),       // z.coerce.date() handles string dates from frontmatter
    summary: z.string(),
    image: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

const jobs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/jobs' }),
  schema: z.object({
    title: z.string(),
    department: z.string().optional(),
    location: z.string().optional(),
    type: z.enum(['full-time', 'part-time', 'contract', 'freelance']).optional(),
    date: z.coerce.date(),
    open: z.boolean().default(true),
    summary: z.string(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { news, jobs };
```

Key decisions:
- `z.coerce.date()` not `z.date()` — frontmatter dates are strings; `coerce` handles the conversion without manual transforms.
- `draft` field included from the start — even if unused initially, costs nothing and enables the dev-vs-prod filtering pattern.
- `base` paths are relative to the site root (where `package.json` lives), not relative to `src/`.

### Rendering pattern (new API)

```astro
---
// pages/news/[slug].astro
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('news', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true   // show drafts in dev
  );
  return posts
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
    .map(post => ({ params: { slug: post.id }, props: { post } }));
}

const { post } = Astro.props;
const { Content } = await render(post);  // render() from astro:content, not post.render()
---
<Content />
```

### Backwards-compat flag: use only as a bridge

If you want to migrate `content.config.ts` without immediately updating all page files that call `post.render()`, enable the flag temporarily:

```javascript
// astro.config.mjs
export default defineConfig({
  legacy: {
    collectionsBackwardsCompat: true,
  },
});
```

Remove it once all render call sites are updated. Do not leave it on permanently.

### Content file location convention

Keep content files at `src/content/<type>/<slug>.md` per site — this is already the pattern in `sfdy-alt-clean` and `levion`. The `glob()` loader `base` path `./src/content/news` resolves this correctly. Do not move files; just update the config and render calls.

### For _core/ template

Add `src/content.config.ts` to `_core/` with both `news` and `jobs` collections defined. When a site has no `src/content/jobs/` directory, the `glob()` loader returns zero entries without throwing — safe default. This means every scaffolded site inherits the schema automatically.

Also add empty placeholder directories `_core/src/content/news/.gitkeep` and `_core/src/content/jobs/.gitkeep` so the directories exist after scaffolding.

### What NOT to use

- Markdown integration (`@astrojs/mdx`) is unnecessary for news and jobs — plain `.md` is sufficient. MDX should only be added if a site needs JSX components embedded inside content.
- Headless CMS (Contentful, Sanity, etc.) — out of scope per PROJECT.md and adds server-side dependency.
- `astro:db` — adds an SQL layer; overkill for file-based content.

---

## 3. HTML/CSS Artifact → Astro Component Conversion

### No single tool covers the full use case

The available tooling landscape (as of Aug 2026):

**html2astro** (https://html2astro.mb-js.site/) — web drag-and-drop, converts a ZIP of HTML files to an Astro project. Max 30MB. Good for full-site ingestion of a reference site at Stage 0 (capture → scaffold). Does not handle selective section integration without discarding the rest of the project.

**Manual conversion** — an Astro `.astro` file is a valid superset of HTML. Pasting HTML directly into a `.astro` file works as the first step, then extract `<style>` and `<script>` blocks. This is the established pattern for partial integrations.

**No CLI tool** exists that reliably converts a Claude Design HTML/CSS artifact into a structured set of Astro components matching an existing `_core/`-based layout convention. This is custom tooling territory.

### Recommended approach for /wm-ingest

The `/wm-ingest` skill needs to do this work algorithmically, without relying on an external tool. The approach:

**Full-site mode (INGEST-01 / INGEST-02):** html2astro is useful as a pre-processing step — it produces a valid Astro project from a zipped HTML/CSS artifact. The skill can then normalise the output against `_core/` layout conventions. Steps:
1. Accept HTML/CSS artifact as a file path or paste
2. Identify top-level sections by landmark elements (`<section>`, `<header>`, `<footer>`, `<main>`, `<nav>`) or class-naming conventions
3. Map each section to its `_core/` component equivalent by heuristic (section with background image + large heading → hero component, etc.)
4. Extract CSS custom properties and hardcoded colour/font values → surface as candidates for `brand` block in `wiring.json`
5. Generate one `.astro` file per section component, preserving scoped `<style>` blocks
6. Wire into the existing Layout component

**Page/section mode (INGEST-03):** Do not use html2astro — it always outputs a full project. The skill must parse the HTML fragment directly:
1. Identify which page(s) are affected
2. Insert the new section component in the correct position in the page file
3. Verify routes are not broken (file naming, dynamic paths)

**Design token extraction pattern:** CSS custom properties (`--color-primary`, `--font-heading`) in the artifact's `:root` block are reliable extraction targets. Map them to the `brand` block in `wiring.json`. Hardcoded hex/rgb values without a variable should be flagged for manual review.

### What NOT to use

- Any LLM-based "convert this HTML to React" tool — outputs React JSX, not Astro syntax.
- AI-based design-to-code tools (v0, Locofy, etc.) — produce framework-specific code incompatible with the vanilla CSS + Astro convention.
- html2astro for section-level ingestion — it always produces a full project, destroying the existing site.

---

## 4. GitHub Issue Templates (YAML Format)

### File format and location

Issue forms use `.yml` files (not `.md`) placed in `.github/ISSUE_TEMPLATE/` in the production repo. They require the `name`, `description`, and `body` keys at minimum.

Optional top-level keys: `title` (pre-filled subject), `labels` (array, must already exist on the repo), `assignees`.

Source: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms

### Body input types

| Type | Use |
|---|---|
| `markdown` | Static helper text or instructions (not stored in issue body) |
| `input` | Single-line text field |
| `textarea` | Multi-line text, supports `render` for syntax-highlighted code blocks |
| `dropdown` | Single or multi-select from a list |
| `checkboxes` | Boolean checkboxes, individual items can be required |

### Three templates required per production repo

**1. `.github/ISSUE_TEMPLATE/content-request.yml`** — for new news posts, job listings, and announcements. Collaborators with no git knowledge use this to submit new content. CI/Philipp then creates the `.md` file.

```yaml
name: Content Request
description: Request a new news post, job listing, or announcement
title: "[Content] "
labels: ["content-request"]
body:
  - type: markdown
    attributes:
      value: |
        Use this form to request new content. For news posts, include the full text below.
        For job listings, include the role details. Philipp will publish within 48 hours.
  - type: dropdown
    id: content-type
    attributes:
      label: Content type
      options:
        - News post
        - Job listing
        - Announcement
    validations:
      required: true
  - type: input
    id: title
    attributes:
      label: Title / headline
      placeholder: "e.g. We closed our Series A round"
    validations:
      required: true
  - type: input
    id: publish-date
    attributes:
      label: Publish date (YYYY-MM-DD)
      placeholder: "2026-09-01"
  - type: textarea
    id: content
    attributes:
      label: Content body
      description: Full text of the post. Markdown is supported.
    validations:
      required: true
  - type: textarea
    id: summary
    attributes:
      label: One-sentence summary
      description: Used in link previews and news grid cards (max ~160 chars)
    validations:
      required: true
```

**2. `.github/ISSUE_TEMPLATE/design-change.yml`** — for page edits, new pages, navigation changes, anything that requires a sandbox iteration.

```yaml
name: Design / Page Change
description: Request a change to page content, layout, navigation, or design
title: "[Change] "
labels: ["design-change"]
body:
  - type: markdown
    attributes:
      value: |
        Changes to page structure or design are handled in the WebsiteMocker sandbox
        before being pushed live. Describe what you need below.
  - type: dropdown
    id: change-type
    attributes:
      label: Change type
      options:
        - Edit text on an existing page
        - Add a new page
        - Change navigation
        - Design / layout update
        - Remove content
        - Other
    validations:
      required: true
  - type: input
    id: page
    attributes:
      label: Which page(s)?
      placeholder: "e.g. /about, /services"
    validations:
      required: true
  - type: textarea
    id: description
    attributes:
      label: Describe the change
      description: Be as specific as possible. Screenshots or mockups can be attached below.
    validations:
      required: true
  - type: textarea
    id: reason
    attributes:
      label: Why / business reason
      description: Optional but helpful for prioritisation
  - type: checkboxes
    id: urgency
    attributes:
      label: Urgency
      options:
        - label: This is blocking something (please explain in description)
```

**3. `.github/ISSUE_TEMPLATE/bug-report.yml`** — for broken links, display issues, form failures.

```yaml
name: Bug Report
description: Report a broken link, display issue, or form failure
title: "[Bug] "
labels: ["bug"]
body:
  - type: input
    id: url
    attributes:
      label: URL where the issue occurs
      placeholder: "https://example.com/about"
    validations:
      required: true
  - type: textarea
    id: description
    attributes:
      label: What's wrong?
      description: Describe what you see and what you expected to see.
    validations:
      required: true
  - type: dropdown
    id: device
    attributes:
      label: Device / browser
      options:
        - Desktop — Chrome
        - Desktop — Firefox
        - Desktop — Safari
        - Mobile — iOS Safari
        - Mobile — Android Chrome
        - Other
  - type: textarea
    id: steps
    attributes:
      label: Steps to reproduce (optional)
```

### config.yml — disable blank issues

Add `.github/ISSUE_TEMPLATE/config.yml` to disable the "Open a blank issue" link and optionally add a link back to the WebsiteMocker triage queue:

```yaml
blank_issues_enabled: false
contact_links:
  - name: Direct content submission (markdown)
    url: https://github.com/pbau3r-sfdy/WebsiteMocker
    about: For content additions you can submit yourself via a markdown file PR
```

### What NOT to use

- Old-style `.md` issue templates (with YAML frontmatter + markdown body) — superseded by YAML forms. YAML forms produce structured, queryable data; `.md` templates produce free-text. Use YAML forms exclusively.
- Assigning issues automatically to Philipp via `assignees:` — this creates noise if the org ever has multiple collaborators. Triage manually instead.

---

## Summary: versions and decisions at a glance

| Concern | Decision | Version / Location |
|---|---|---|
| Production deploy action | `JamesIves/github-pages-deploy-action` | `@v4.9.0` |
| Cross-repo auth | Classic PAT, `repo` scope | Secret: `WM_PUBLISH_PAT` |
| publish.yml trigger | `workflow_dispatch` only | inputs: `slug`, `site_url` |
| Stage gate | Read `wiring.json`, exit if stage < 5 | Script step before build |
| Content collections API | Astro 5 Content Layer API | `src/content.config.ts` + `loader: glob()` |
| Legacy API | Migrate away; use `legacy.collectionsBackwardsCompat` as bridge only | Remove flag when done |
| Date coercion | `z.coerce.date()` not `z.date()` | In all collection schemas |
| Render call | `render(entry)` from `astro:content` | Replace all `entry.render()` |
| Draft filtering | `getCollection('news', ({ data }) => !data.draft)` | Prod builds only |
| HTML ingest tooling | No external tool for section-level; html2astro for full-site only | `/wm-ingest` implements algorithmically |
| CSS token extraction | Target `:root` custom properties first | Seed `brand` block in `wiring.json` |
| Issue templates | YAML forms in `.github/ISSUE_TEMPLATE/` | 3 templates + config.yml per prod repo |
| Blank issues | Disabled via `config.yml` | `blank_issues_enabled: false` |

---

## Sources

- Context7 `/withastro/docs` — Astro 5 Content Layer API, `glob()` loader, `render()` function, legacy backwards-compat flag (HIGH confidence)
- https://docs.astro.build/en/guides/upgrade-to/v5/ — Astro 5 migration guide (HIGH confidence)
- https://docs.astro.build/en/guides/content-collections/ — current content collections reference (HIGH confidence)
- https://github.com/JamesIves/github-pages-deploy-action/releases — v4.9.0 latest (HIGH confidence)
- https://github.com/JamesIves/github-pages-deploy-action — cross-repo deployment docs, PAT requirements (HIGH confidence)
- https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms — YAML issue form syntax (HIGH confidence)
- https://html2astro.mb-js.site/ — html2astro tool capabilities and limitations (MEDIUM confidence — tool is maintained but not officially affiliated with Astro project)

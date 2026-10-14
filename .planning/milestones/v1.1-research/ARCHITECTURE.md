# Architecture Patterns — Deploy Pipeline & Content System Upgrade

**Domain:** Brownfield addition to static-site Astro monorepo
**Researched:** 2026-08-20
**Overall confidence:** HIGH (grounded in existing codebase; verified JamesIves cross-repo docs)

---

## Existing Architecture — Anchor Points

Before any new components are added, the constraints that must be preserved:

- Each `sites/<slug>/` is a fully isolated npm workspace. No shared runtime packages between sites.
- `wiring.json` is the single contract between scripts, dashboard, and CI. Any new pipeline step that needs site metadata reads it from there.
- All output is static. No server rendering, no API routes.
- `astro.config.mjs` in every site uses the env-var pattern (`SITE_URL` / `SITE_BASE`) — the production build path is already plumbed in; the only missing piece is the workflow that invokes it.
- `JamesIves/github-pages-deploy-action@v4.8.0` is already in use for sandbox deploys and explicitly supports cross-repo push via `repository-name` + PAT `token` parameter.

---

## 1. Production Deploy Pipeline — publish.yml

### Component Boundaries

The workflow has three logical stages separated into distinct jobs to allow reruns at the failing stage and to make the audit log readable.

```
workflow_dispatch(slug, [dry_run])
        │
        ▼
┌─────────────────────┐
│  JOB: validate      │  — gate check, fast, no checkout needed
│                     │
│  • Read wiring.json │  checkout → jq/node to read stage, domain, prod_repo
│  • Assert stage ≥ 5 │  fail-fast with error message if not ready
│  • Assert prod_repo │  fail if prod_repo field is empty or placeholder
│  • Assert domain    │  fail if domain field is empty
│  • Emit outputs     │  slug, domain, prod_repo → consumed by build job
└────────┬────────────┘
         │ needs: validate
         ▼
┌─────────────────────┐
│  JOB: build         │  — env-isolated build, outputs artifact
│                     │
│  • npm ci           │  full workspace install
│  • Build one site   │  SITE_URL=https://<domain> SITE_BASE=/ npm run build
│                     │  run inside sites/<slug>/ with its own node_modules
│  • Upload artifact  │  actions/upload-artifact → sites/<slug>/dist/
└────────┬────────────┘
         │ needs: build
         ▼
┌─────────────────────┐
│  JOB: push          │  — cross-repo deploy, reads artifact
│                     │
│  • Download artifact│  sites/<slug>/dist/
│  • Push to gh-pages │  JamesIves action, repository-name: <prod_repo>
│  • Push source      │  optional: push Astro source to prod repo main branch
│                     │  (required for COLLAB-04 — see section 4)
│  • Update wiring    │  set last_deploy to ISO timestamp, commit + push
└─────────────────────┘
```

### Parameterization

```yaml
on:
  workflow_dispatch:
    inputs:
      slug:
        description: 'Site slug (e.g. crestworks)'
        required: true
        type: string
      dry_run:
        description: 'Build only, do not push to production'
        required: false
        type: boolean
        default: false
```

The slug is the only required input. Everything else (`domain`, `prod_repo`, `SITE_URL`) is derived from `wiring.json` at runtime so `publish.yml` itself never hardcodes any site-specific values.

### Cross-Repo Push — Token Pattern

Cross-repo push via JamesIves requires a PAT with `contents: write` on the target org. Store as repo secret `PROD_DEPLOY_TOKEN`. In the push job:

```yaml
- name: Push built output to production repo
  uses: JamesIves/github-pages-deploy-action@v4.8.0
  with:
    token: ${{ secrets.PROD_DEPLOY_TOKEN }}
    repository-name: ${{ needs.validate.outputs.prod_repo }}
    folder: sites/${{ inputs.slug }}/dist
    branch: gh-pages
    clean: true
    single-commit: true
```

When `repository-name` is set, `persist-credentials: false` must be set on the checkout step or the action's internal git config will conflict with the default token.

### Data Flow Through publish.yml

```
wiring.json
  ├── stage         → validate job: gate check
  ├── domain        → validate job: emit SITE_URL output
  ├── prod_repo     → validate + push job: JamesIves repository-name
  └── (written)     ← push job writes last_deploy after successful push

sites/<slug>/astro.config.mjs
  reads: SITE_URL env var → site config
  reads: SITE_BASE env var (set to /) → base path

sites/<slug>/dist/    → upload-artifact → download-artifact → JamesIves folder
```

### Build Order Implications

Do NOT use `_scripts/build-all.js` in publish.yml. That script builds all non-skipped sites and the dashboard. In publish.yml only one site is built. Run `npm run build` directly inside `sites/<slug>/` with the correct env vars, or add a `build-single.js` script that wraps this cleanly.

---

## 2. Design Artifact Ingestion — /wm-ingest

### Where the Artifact Lands

Artifact staging follows the existing capture library convention:

```
_captures/<slug>/
├── raw/
│   ├── index.html        ← full HTML artifact from Claude Design
│   └── styles.css        ← extracted or inline styles (if separate)
├── capture.json          ← design tokens extracted during ingest
└── assets/               ← any images/logos embedded in the artifact
```

This is consistent with how `/wm-capture` stores design DNA. The `_captures/` directory is git-committed (it is the design reference). The raw artifact is the source of truth for the ingest.

### Component Extraction — Integration Point with _core/

The ingest reads from `_captures/<slug>/raw/` and writes into `sites/<slug>/src/`. The `_core/` layout is the outer shell that must be preserved; the ingested components fill the interior sections.

```
_captures/<slug>/raw/index.html
        │
        │  /wm-ingest: parse sections
        ▼
sites/<slug>/src/
├── components/
│   ├── Nav.astro          ← PRESERVED from _core/ (ingest does NOT replace Nav)
│   ├── Footer.astro       ← PRESERVED from _core/ (ingest does NOT replace Footer)
│   ├── Hero.astro         ← GENERATED by ingest (new component)
│   ├── Features.astro     ← GENERATED by ingest (new component)
│   └── [SectionN].astro   ← GENERATED per identified section
├── layouts/
│   └── Layout.astro       ← MODIFIED: CSS custom properties updated from artifact
└── pages/
    └── index.astro        ← MODIFIED: imports and composes ingested components
```

**Rule:** Nav and Footer are `_core/` conventions and must not be replaced by ingest. Ingest only fills the section components that go between them. This preserves routing, the BASE_URL pattern, and brand metadata (which live in Nav/Footer).

### CSS Token Extraction

CSS custom properties from the artifact map directly to the `:root {}` block in `Layout.astro`. The ingest extracts:

```css
/* Artifact → src/layouts/Layout.astro :root block */
--color-accent      (primary brand color)
--color-bg          (page background)
--color-text        (body text)
--font-heading      (heading font stack)
--font-body         (body font stack)
```

Font files go to `public/fonts/` (matching existing convention). Font face declarations go into `Layout.astro` as embedded `<style>`.

### Full-Site vs Page/Section Mode

**Full-site ingest** (`/wm-ingest <slug> --mode full`):
- Source: new site scaffolded from `_core/` (stage 1)
- Replaces all section components in `sites/<slug>/src/components/`
- Overwrites `Layout.astro` CSS tokens
- Rebuilds `pages/index.astro` to compose the ingested sections
- Does NOT touch Nav, Footer, imprint, privacy, news pages

**Page/section ingest** (`/wm-ingest <slug> --mode section --page <name>`):
- Source: existing site (stage ≥ 1)
- Adds one new component file to `src/components/`
- Either creates a new `src/pages/<name>.astro` or appends a section import to an existing page
- Runs build verification after insertion to confirm no routing breaks
- Reports what was changed and how to undo it (git diff)

### Capture.json Output

After ingest, a `capture.json` is written (or updated) in `_captures/<slug>/` with the extracted tokens. This makes the ingested design remixable by `/wm-instantiate` later.

---

## 3. Astro Content Collections

### Location: Per-Site, Not Shared

Content collections live inside each site workspace:

```
sites/<slug>/src/content/
├── config.ts       ← Zod schema for all collections in this site
├── news/
│   └── YYYY-MM-DD-slug.md
└── jobs/           ← new collection (CONTENT-02)
    └── YYYY-MM-DD-slug.md
```

**Why not shared:** Astro content collections are scoped to the Astro project's `src/content/` directory. Because each `sites/<slug>/` is an independent Astro workspace with its own `astro.config.mjs`, there is no mechanism to share a single content directory across workspaces. Each site defines its own schema in its own `config.ts`. This is the correct pattern — it also means sites can evolve their schemas independently.

**`_core/` already provides the stub:** `_core/src/content/config.ts` defines the `news` collection schema. New sites scaffolded via `new-site.sh` already get this file. Adding `jobs/` to `_core/config.ts` ensures all new sites get it automatically.

### Adding jobs/ Collection — What Changes

1. `_core/src/content/config.ts` — add `jobs` collection with Zod schema
2. `_core/src/pages/jobs/index.astro` — listing page (same pattern as `news/index.astro`)
3. `_core/src/pages/jobs/[slug].astro` — detail page
4. `_core/src/components/JobCard.astro` — card component (mirrors NewsCard pattern)
5. For existing sites (sfdy-alt-clean, etc.) — apply changes manually since `_core/` is scaffold-time-only

### Schema Pattern (jobs)

```typescript
const jobs = defineCollection({
  type: 'content',
  schema: z.object({
    title:     z.string(),
    date:      z.date(),
    location:  z.string(),
    type:      z.enum(['full-time', 'part-time', 'contract', 'internship']),
    summary:   z.string(),
    open:      z.boolean().default(true),
  }),
});
export const collections = { news, jobs };
```

The `open` field enables hiding closed roles without deleting the file (set to `false`, filter in the listing page with `posts.filter(p => p.data.open)`).

### Rendering Pattern

Content collection queries happen in `.astro` page components at build time — no runtime fetching. The pattern is already established by `sites/sfdy-alt-clean/src/pages/news/` pages. The `getCollection('news')` call and `[slug].astro` dynamic route generation are the canonical patterns to replicate for `jobs/`.

---

## 4. Multi-Repo Collaboration — Production Repo Structure

### The Core Problem

Current production repos hold **built output only** on the `gh-pages` branch. There is no source branch. GitHub web UI editing requires a file to exist in a branch that is editable via the web UI — you cannot meaningfully edit a built HTML file or a `_astro/` chunk. For COLLAB-04 to work, markdown source files must exist in the production repo on a branch with a CI workflow that rebuilds when they change.

### Recommended Model: Two-Branch Production Repo

```
<prod-org>/<slug>/
├── main branch
│   └── content/
│       ├── news/
│       │   └── YYYY-MM-DD-slug.md    ← GitHub web UI editable
│       └── jobs/
│           └── YYYY-MM-DD-slug.md    ← GitHub web UI editable
│   .github/workflows/
│       └── content-ci.yml            ← watches content/ changes → triggers rebuild
└── gh-pages branch
    └── [built output]                ← served by GitHub Pages / custom domain
```

The production repo `main` branch holds only content files and a CI workflow. It does NOT hold the full Astro source — that stays in WebsiteMocker. The CI workflow in the production repo dispatches a `workflow_dispatch` event back to WebsiteMocker's `publish.yml` when content files change.

**Revised Data Flow (COLLAB-04):**

```
Collaborator edits news/YYYY-MM-DD-post.md in prod repo web UI
        │
        │  push to prod repo main
        ▼
content-ci.yml in prod repo fires
        │
        │  gh workflow run [WebsiteMocker repo]/publish.yml \
        │    --field slug=<slug>
        ▼
WebsiteMocker publish.yml builds site + copies content files
        │
        │  pushes built output to prod repo gh-pages
        ▼
GitHub Pages serves updated site at custom domain
```

**Alternative (simpler but less clean):** The production repo `main` branch holds a copy of `src/content/` and its own `package.json` + `astro.config.mjs` + built-in Astro source. The production repo rebuilds itself on push. This avoids the cross-workflow dispatch but duplicates the Astro source. Source drift is the long-term risk.

**Recommendation:** Use the dispatch model (Option A above) for production-bound sites with active collaborators. The content-only approach avoids source duplication and keeps WebsiteMocker as the single source of truth for site logic. The cross-workflow dispatch is a small complexity cost for a large benefit in coherence.

### content-ci.yml — Minimal Workflow for Production Repos

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'content/**/*.md'

jobs:
  trigger-rebuild:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger WebsiteMocker publish
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.WM_DISPATCH_TOKEN }}
          script: |
            await github.rest.actions.createWorkflowDispatch({
              owner: 'pbau3r-sfdy',
              repo: 'WebsiteMocker',
              workflow_id: 'publish.yml',
              ref: 'main',
              inputs: { slug: '<SITE_SLUG>' }
            })
```

`WM_DISPATCH_TOKEN` is a PAT with `actions: write` on the WebsiteMocker repo. The `slug` input is hardcoded per production repo (each production repo only ever represents one site).

### What publish.yml Must Push to Production Repo main

When `publish.yml` completes a successful build, it syncs the content directory from the sandbox to the production repo `main` branch. This is the source of truth reconciliation step:

```
WebsiteMocker: sites/<slug>/src/content/ → prod repo main: content/
```

This ensures the production repo always reflects the canonical state from WebsiteMocker. If a collaborator adds a post via the web UI, the post file already exists in the production repo. WebsiteMocker's next publish syncs it back (the file is already there, git sees no change). If content was added via WebsiteMocker (via `/wm-add-news`), the sync pushes it to the production repo so collaborators can see it.

### CONTRIBUTING.md and Issue Templates

Production repos ship with:

- `CONTRIBUTING.md` at repo root: defines two contribution paths
  - Path A: direct-push `.md` files to `content/news/` or `content/jobs/` on `main` — for content additions, no approval needed
  - Path B: GitHub Issue for everything else (page edits, new pages, design changes, bugs)
- `.github/ISSUE_TEMPLATE/`:
  - `content-request.yml` — for requesting content changes
  - `design-change.yml` — for page/design/layout requests
  - `bug-report.yml` — for reporting visual or functional issues

These templates are generated at publish time by `/wm-publish` — they are not stored in WebsiteMocker's `_core/` because they reference the specific site name and slug.

---

## Component Boundary Summary

| Component | Lives In | Communicates With | Direction |
|-----------|----------|-------------------|-----------|
| publish.yml | WebsiteMocker `.github/workflows/` | wiring.json (reads), prod repo gh-pages (writes), prod repo main content/ (writes) | push-based |
| content-ci.yml | Production repo `.github/workflows/` | WebsiteMocker publish.yml (dispatches) | event-based |
| /wm-ingest skill | `.claude/skills/wm-ingest.md` | `_captures/<slug>/raw/`, `sites/<slug>/src/` | file write |
| Artifact staging | `_captures/<slug>/raw/` | Ingest skill (reads), capture.json (writes) | file system |
| Content collections | `sites/<slug>/src/content/` | Astro build (reads at build time), `/wm-add-*` skills (writes) | file system |
| CONTRIBUTING.md templates | Generated into prod repo | `/wm-publish` skill (writes once) | one-time write |

---

## Build Order Implications

1. **publish.yml must not invoke build-all.js** — single-site build only. Either `cd sites/<slug> && npm run build` with env vars, or a new `_scripts/build-single.mjs <slug>` wrapper. The wrapper approach is cleaner because it can handle the env var injection and wiring.json reads in one place, making it testable locally.

2. **Content sync must happen after successful build, before wiring.json update** — if the push to gh-pages fails, wiring.json must not be updated with a new `last_deploy`. The three-job structure (validate → build → push) ensures wiring.json is only written in the push job, which only runs after build succeeds.

3. **Ingest does not trigger a deploy** — it only produces local file changes. The developer runs `/wm-deploy` (sandbox) or `/wm-publish` (production) after reviewing the ingest output. Ingest → review → deploy is the correct sequence.

4. **Content collection additions are picked up automatically** — adding a `.md` file to `sites/<slug>/src/content/news/` requires no config change. The dynamic `[slug].astro` route generates a page for every file in the collection. The only time config needs changing is when a new collection type is added (which requires updating `config.ts` and adding new page files).

---

## Anti-Patterns to Avoid in New Components

### publish.yml hardcoding site values
Hardcoding `domain`, `prod_repo`, or `SITE_URL` in the workflow defeats the parameterization. All site-specific values must be read from `wiring.json` at runtime using a `jq` or `node -e` step immediately after checkout.

### Ingest replacing Nav.astro or Footer.astro
Nav and Footer contain the BASE_URL pattern, routing links, and brand metadata. An ingest that overwrites these components will break the sandbox base path and potentially the news routing. Ingest must identify and skip these structural components.

### Shared content directory across sites
Any attempt to put a shared `_content/` at the monorepo root and symlink or reference it from multiple sites will break because Astro resolves content collections relative to each project's `src/content/`. Each site must own its content directory.

### Production repo as full Astro fork
Maintaining a full copy of the Astro source in each production repo creates a three-way sync problem: `_core/` changes, WebsiteMocker site changes, and production repo source changes can all diverge. The content-only model in the production repo's `main` branch avoids this.

---

## Confidence Assessment

| Area | Confidence | Source |
|------|------------|--------|
| publish.yml cross-repo push via JamesIves | HIGH | Official JamesIves docs, confirmed `repository-name` + `token` params |
| Three-job workflow structure | HIGH | Derived from existing deploy.yml pattern + standard CI design |
| Ingest artifact staging in _captures/ | HIGH | Consistent with existing capture library pattern in codebase |
| Content collections per-site location | HIGH | Confirmed in _core/src/content/config.ts, sfdy-alt-clean live data |
| Multi-repo dispatch model (content-ci.yml) | MEDIUM | GitHub Actions workflow dispatch API is stable; pattern is sound but untested in this codebase |
| jobs/ schema design | MEDIUM | Derived from existing news schema; no prior art in this codebase |
| CONTRIBUTING.md template content | LOW | Content is best-practice recommendation; exact wording needs user input |

---

*Research: 2026-08-20 — brownfield architecture analysis for WebsiteMocker upgrade milestone*

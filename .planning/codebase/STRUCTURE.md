# Codebase Structure

**Analysis Date:** 2026-08-20

## Directory Layout

```
WebsiteMocker/                          # Monorepo root — dashboard Astro app
├── src/
│   └── pages/
│       └── index.astro                 # Dashboard — the only root-level page
├── public/
│   ├── robots.txt                      # Disallow: / (sandbox is never indexed)
│   └── .nojekyll                       # Prevents GitHub Pages from stripping _astro/
├── sites/                              # npm workspaces — one directory per site
│   ├── <slug>/                         # One workspace per site (see Site Layout below)
│   ├── sfdy/                           # Starflight Dynamics (archived, skip_ci)
│   ├── sfdy-alt-clean/                 # SFDY alt design
│   ├── mogwai-systems/                 # MOGWAI Systems (stage 6, live)
│   ├── parrot-capital/                 # Parrot Capital (stage 6, live)
│   ├── crestworks/                     # Crestworks (stage 6, live)
│   ├── crestworks-legacy/              # Archived predecessor to crestworks
│   ├── levion/                         # Levion Materials (stage 2, template)
│   ├── hypersonica/                    # Hypersonica (template)
│   ├── tnt-ventures/                   # TNT Ventures (template, stage 1)
│   └── orbint/                         # Orbint (template)
├── _core/                              # Scaffold template — copied by new-site.sh
│   ├── src/
│   │   ├── components/                 # Nav.astro, Footer.astro, NewsCard.astro
│   │   ├── layouts/                    # Layout.astro (shell with CSS tokens)
│   │   ├── pages/                      # index.astro, imprint.astro, privacy.astro, news/
│   │   └── content/
│   │       └── news/                   # Stub for content collection
│   ├── public/
│   │   └── fonts/                      # Font stubs
│   └── .claude/skills/                 # Content-level skills (wm-add-news, etc.)
├── _captures/                          # Design DNA library
│   ├── <name>/
│   │   ├── capture.json                # Extracted design tokens
│   │   ├── screenshots/                # Playwright screenshots
│   │   └── assets/                     # Brand assets (logos, fonts, images)
├── _data/                              # Persisted performance metrics
│   └── <slug>/
│       └── perf.json                   # Lighthouse score history
├── _scripts/                           # Monorepo tooling
│   ├── build-all.js                    # Main build orchestrator
│   ├── new-site.sh                     # Scaffold new site from _core/
│   ├── archive-site.mjs                # Set archived:true + skip_ci in wiring.json
│   ├── delete-site.mjs                 # Remove site directory + wiring.json
│   ├── rename-site.mjs                 # Rename slug across all files
│   ├── apply-triage.mjs                # Apply browser-triage actions (archive/delete)
│   ├── fetch-perf-data.mjs             # Fetch Lighthouse scores → _data/
│   ├── capture-site.mjs                # Playwright capture of live URL → _captures/
│   ├── import-site.mjs                 # Import existing site into monorepo
│   └── whois-check.sh                  # Domain WHOIS lookup helper
├── .claude/skills/                     # Framework-level Claude skills
│   ├── wm-new-site.md
│   ├── wm-capture.md
│   ├── wm-instantiate.md
│   ├── wm-list-sites.md
│   ├── wm-deploy.md
│   ├── wm-preflight.md
│   └── wm-wire.md
├── .github/workflows/
│   ├── deploy.yml                      # Sandbox CI: build + deploy to gh-pages
│   └── publish.yml                     # Production publish (manual, per site) [TODO]
├── .planning/
│   └── codebase/                       # GSD codebase map documents
├── astro.config.mjs                    # Root Astro config (dashboard only)
├── package.json                        # Root package — workspaces: ["sites/*"]
├── package-lock.json
├── tsconfig.json
├── CLAUDE.md                           # Primary project instructions for Claude
└── dist/                               # Build output (gitignored)
    ├── index.html                      # Dashboard HTML
    ├── _astro/                         # Bundled CSS/JS
    └── <slug>/                         # Built output per site
```

## Site Layout (per `sites/<slug>/`)

```
sites/<slug>/
├── src/
│   ├── pages/
│   │   ├── index.astro                 # Homepage
│   │   ├── imprint.astro               # German Impressum (§5 TMG)
│   │   ├── privacy.astro               # Privacy policy (GDPR)
│   │   └── news/
│   │       ├── index.astro             # News listing page
│   │       └── [slug].astro            # Dynamic post page
│   ├── layouts/
│   │   └── Layout.astro                # HTML shell, CSS custom properties, fonts
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── Footer.astro
│   │   └── NewsCard.astro
│   └── content/
│       ├── config.ts                   # Zod schema for news collection
│       └── news/
│           └── YYYY-MM-DD-slug.md      # News posts
├── public/
│   ├── fonts/                          # Self-hosted web fonts (.woff2)
│   └── images/                         # Static images
│       ├── news/                       # Article hero images
│       └── partners/                   # Partner/client logos
├── wiring.json                         # Site metadata and lifecycle state ← critical
├── astro.config.mjs                    # Astro config with env-var base path
├── package.json                        # Site-level dependencies + dev server port
├── tsconfig.json
└── .claude/skills/                     # Site-scoped skills (in sites with .claude/)
```

## Directory Purposes

**`src/pages/` (root):**
- Purpose: Dashboard only — a single `index.astro` file
- Contains: The WebsiteMocker management UI
- Key files: `src/pages/index.astro`

**`sites/`:**
- Purpose: One independent Astro workspace per site
- Contains: Full Astro project structure per site with its own `package.json` and `node_modules/`
- Key files: `sites/<slug>/wiring.json` (lifecycle state), `sites/<slug>/astro.config.mjs` (base path config)

**`_core/`:**
- Purpose: Template base for new sites — NOT a runtime shared library
- Contains: `{{PLACEHOLDER}}` token files that `new-site.sh` substitutes
- Key files: `_core/src/layouts/Layout.astro`, `_core/src/pages/index.astro`, `_core/.claude/skills/`

**`_captures/`:**
- Purpose: Design DNA extracted from live websites, used as remix references
- Contains: `capture.json` (design tokens), screenshots, logos, fonts
- Key files: `_captures/<name>/capture.json`

**`_data/`:**
- Purpose: Persisted Lighthouse performance history for live sites
- Contains: `perf.json` per site with score history array
- Key files: `_data/<slug>/perf.json`

**`_scripts/`:**
- Purpose: Monorepo lifecycle management and build tooling
- Contains: Node.js ES module scripts and bash scripts
- Key files: `_scripts/build-all.js`, `_scripts/new-site.sh`

**`.claude/skills/`:**
- Purpose: Framework-level Claude skill definitions (invoked via `/wm-*` commands)
- Contains: Markdown skill files describing each workflow
- Key files: Each `wm-*.md` defines a complete workflow for a lifecycle operation

**`_core/.claude/skills/`:**
- Purpose: Content-level skills inherited by all sites
- Contains: `wm-add-news.md`, `wm-edit-news.md`, `wm-list-news.md`, `wm-update-hero.md`, etc.

**`public/` (root):**
- Purpose: Root-level static files served by the dashboard
- Contains: `robots.txt` (Disallow: / for sandbox), `.nojekyll`

**`.github/workflows/`:**
- Purpose: CI/CD automation
- Contains: `deploy.yml` (sandbox auto-deploy on push to main)

## Key File Locations

**Entry Points:**
- `src/pages/index.astro`: Dashboard application entry point
- `sites/<slug>/src/pages/index.astro`: Individual site homepage
- `_scripts/build-all.js`: Build orchestrator entry point
- `.github/workflows/deploy.yml`: CI pipeline entry point

**Configuration:**
- `astro.config.mjs` (root): Dashboard Astro config (`base: '/WebsiteMocker'`)
- `sites/<slug>/astro.config.mjs`: Per-site Astro config with env-var base path
- `package.json` (root): Workspace definition (`"workspaces": ["sites/*"]`)
- `sites/<slug>/package.json`: Site-level scripts (dev port, build)

**Core Logic:**
- `sites/<slug>/wiring.json`: Site lifecycle state (stage, domain, services, CI flags)
- `sites/<slug>/src/content/config.ts`: News collection Zod schema
- `sites/<slug>/src/layouts/Layout.astro`: HTML shell and design tokens
- `_core/src/pages/index.astro`: Canonical homepage template with `{{PLACEHOLDER}}` tokens
- `_scripts/build-all.js`: Site enumeration, skip logic, build sequencing

**Performance Data:**
- `_data/<slug>/perf.json`: Lighthouse history read by dashboard at build time

## Naming Conventions

**Files:**
- Astro components: `PascalCase.astro` (e.g., `Nav.astro`, `NewsCard.astro`, `Layout.astro`)
- Astro pages: `kebab-case.astro` (e.g., `privacy-policy.astro`, `imprint.astro`)
- Dynamic pages: `[slug].astro` (Astro file-based routing)
- Scripts: `kebab-case.mjs` or `kebab-case.js` (e.g., `build-all.js`, `archive-site.mjs`)
- Content posts: `YYYY-MM-DD-slug.md` (date-prefixed for chronological sorting)
- Config files: `astro.config.mjs`, `wiring.json`, `keywords.json`

**Directories:**
- Sites: `kebab-case` matching the site's slug (e.g., `parrot-capital`, `mogwai-systems`)
- Captures: `kebab-case` matching the capture name (e.g., `crestworks-rework`)
- Underscore prefix for monorepo infrastructure dirs: `_core/`, `_scripts/`, `_captures/`, `_data/`

**Site slugs:**
- Used as: directory name, `wiring.json` `slug` field, Astro base path segment, GitHub repo name
- Pattern: `kebab-case`, all lowercase, no spaces

## Where to Add New Code

**New Site:**
- Run scaffold: `bash _scripts/new-site.sh <slug> "<Name>" "<accent>" "<email>"`
- Primary code: `sites/<slug>/src/`
- Metadata: `sites/<slug>/wiring.json`
- Tests/preview: `cd sites/<slug> && npm run dev`

**New Page in Existing Site:**
- Implementation: `sites/<slug>/src/pages/<page-name>.astro`
- Follow existing pages for layout import and BASE_URL usage pattern

**New Component:**
- Shared across site: `sites/<slug>/src/components/PascalCase.astro`
- Update `_core/src/components/` if the component should be in the scaffold template for future sites

**New News Post:**
- Content: `sites/<slug>/src/content/news/YYYY-MM-DD-slug.md`
- Images: `sites/<slug>/public/images/news/<image>.jpg`
- Use `/wm-add-news` skill or follow frontmatter schema from `sites/<slug>/src/content/config.ts`

**New Script:**
- Location: `_scripts/<verb>-<noun>.mjs`
- Pattern: ES module with `#!/usr/bin/env node`, read wiring.json via `readFileSync`, use `process.exit(1)` for errors

**New Capture:**
- Location: `_captures/<name>/`
- Use `_scripts/capture-site.mjs` or `/wm-capture` skill

**Performance Data:**
- Location: `_data/<slug>/perf.json`
- Updated by: `npm run perf` → `_scripts/fetch-perf-data.mjs`

**New Claude Skill:**
- Framework-level (monorepo operations): `.claude/skills/wm-<name>.md`
- Content-level (per-site content management): `_core/.claude/skills/wm-<name>.md`

## Special Directories

**`dist/`:**
- Purpose: Combined build output (dashboard + all sites)
- Generated: Yes — by `_scripts/build-all.js`
- Committed: No (gitignored); pushed to gh-pages branch by CI

**`sites/*/dist/`:**
- Purpose: Per-site build output, then copied to root `dist/<slug>/`
- Generated: Yes
- Committed: No (gitignored)

**`sites/*/node_modules/`:**
- Purpose: Site-level dependencies (Astro installs per workspace)
- Generated: Yes — by `npm install` at repo root
- Committed: No

**`_captures/`:**
- Purpose: Design DNA reference — checked into git as source assets
- Generated: Partially — via `capture-site.mjs` then committed
- Committed: Yes

**`_data/`:**
- Purpose: Performance metric history
- Generated: Via `npm run perf`
- Committed: Yes (historical record)

**`.astro/`:**
- Purpose: Astro internal type generation cache
- Generated: Yes
- Committed: No

---

*Structure analysis: 2026-08-20*

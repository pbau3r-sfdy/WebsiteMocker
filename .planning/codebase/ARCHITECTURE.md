<!-- refreshed: 2026-08-20 -->
# Architecture

**Analysis Date:** 2026-08-20

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────┐
│                  Dashboard (root Astro app)                           │
│              `src/pages/index.astro`                                  │
│  Reads sites/*/wiring.json at build time → renders site-card grid    │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ reads
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Site Workspaces                                    │
├───────────────┬───────────────┬───────────────┬──────────────────────┤
│  sites/sfdy/  │sites/crestworks│sites/parrot-  │  sites/<other>/      │
│  (archived)   │ (stage 6,live) │capital/ (live) │ (templates/WIP)     │
└───────┬───────┴───────┬────── ┴───────┬───────┴──────────────────────┘
        │               │               │  each is an independent
        │               │               │  npm workspace / Astro app
        ▼               ▼               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  _core/ (scaffold template)                           │
│  Provides base structure; copied via `_scripts/new-site.sh`          │
│  Contains {{PLACEHOLDER}} tokens replaced at scaffold time            │
└──────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│              Build Orchestration: `_scripts/build-all.js`            │
│  1. Builds dashboard → dist/                                          │
│  2. Iterates sites/*, respects skip_ci flag in wiring.json           │
│  3. Builds each site → sites/<slug>/dist/ → copies to dist/<slug>/   │
└──────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│  dist/  →  gh-pages branch  →  GitHub Pages (sandbox preview)        │
│  sites/<slug>/dist/ → prod repo gh-pages → custom domain (live)      │
└──────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Dashboard | Aggregates all site metadata, renders management UI | `src/pages/index.astro` |
| Site workspace | Independent Astro app per site | `sites/<slug>/` |
| Core template | Canonical scaffold base with placeholder tokens | `_core/` |
| Build orchestrator | Builds dashboard + all sites, copies outputs | `_scripts/build-all.js` |
| wiring.json | Per-site metadata store: stage, domain, services, CI flags | `sites/<slug>/wiring.json` |
| Content collections | Astro content collections for news posts with Zod schema | `sites/<slug>/src/content/` |
| Capture library | Design DNA reference: screenshots + assets | `_captures/<name>/` |
| Perf data store | Historical Lighthouse scores per site | `_data/<slug>/perf.json` |
| CI/CD workflow | Automated build + deploy to gh-pages on every push | `.github/workflows/deploy.yml` |

## Pattern Overview

**Overall:** Multi-workspace static site monorepo with a shared orchestration layer

**Key Characteristics:**
- Each site in `sites/` is a fully independent Astro workspace with its own `package.json`, `astro.config.mjs`, `node_modules`, and `dist/`
- The dashboard (`src/pages/index.astro`) is a separate root-level Astro app that reads site metadata from `wiring.json` files at build time — no runtime API calls
- All output is static (`output: 'static'`); no server-side rendering
- `_core/` serves as a living scaffold template; it is copied and token-substituted to create new sites — it is NOT a shared runtime package
- `wiring.json` is the single source of truth for each site's lifecycle state, integration status, and CI behaviour

## Layers

**Dashboard Layer:**
- Purpose: Visual management UI showing all sites, stages, perf scores, and triage actions
- Location: `src/pages/index.astro`
- Contains: Single large Astro component with embedded JS for client-side triage (archive/restore/delete via localStorage)
- Depends on: `sites/*/wiring.json` (read at build time), `_data/*/perf.json` (read at build time)
- Used by: Engineers managing the sandbox

**Site Layer:**
- Purpose: The actual branded website for each client/project
- Location: `sites/<slug>/src/`
- Contains: Astro pages, layouts, components, content collections (news), and public assets
- Depends on: `_core/` structure at scaffold time; `wiring.json` metadata; self-hosted fonts in `public/fonts/`
- Used by: The build orchestrator; developers iterating on brand/content

**Template/Scaffold Layer:**
- Purpose: Canonical base structure that all new sites derive from
- Location: `_core/`
- Contains: `src/components/` (Nav, Footer, NewsCard), `src/layouts/Layout.astro`, `src/pages/` with `{{PLACEHOLDER}}` tokens, content collection stubs
- Used by: `_scripts/new-site.sh` — copied to `sites/<slug>/` and substituted

**Build/Script Layer:**
- Purpose: Monorepo orchestration, lifecycle management, and automation
- Location: `_scripts/`
- Contains: `build-all.js`, `new-site.sh`, `archive-site.mjs`, `delete-site.mjs`, `rename-site.mjs`, `fetch-perf-data.mjs`, `capture-site.mjs`, `import-site.mjs`, `apply-triage.mjs`
- Depends on: Node.js fs, child_process; reads `wiring.json` to make skip decisions

**Capture Layer:**
- Purpose: Design DNA reference library from real or target websites
- Location: `_captures/<name>/`
- Contains: `capture.json` (design tokens), screenshots, brand assets, fonts, logos
- Used by: `/wm-instantiate` skill to derive new sites; design reference only

**Data Layer:**
- Purpose: Persisted performance metrics for live sites
- Location: `_data/<slug>/perf.json`
- Contains: `{ history: [{ date, mobile: { performance, accessibility, seo, best_practices, lcp, cls, fcp } }] }`
- Used by: Dashboard (read at build time), `fetch-perf-data.mjs` (writes)

## Data Flow

### Dashboard Build Path

1. `npm run build` → `node _scripts/build-all.js` (`_scripts/build-all.js:69`)
2. Build orchestrator runs `astro build` at repo root → builds dashboard
3. `src/pages/index.astro` reads `sites/*/wiring.json` via Node `fs.readFileSync` at build time
4. Also reads `_data/*/perf.json` for each site's Lighthouse history
5. Renders static HTML card grid with all site metadata baked in
6. Output lands in `dist/` (root-level)

### Site Build Path

1. Build orchestrator iterates `sites/` directories (`_scripts/build-all.js:73-97`)
2. Checks `wiring.json` for `skip_ci: true` — skips archived/WIP sites
3. Runs `npm run build` inside each site directory with its own `node_modules/.bin` on PATH
4. Copies `sites/<slug>/dist/` → `dist/<slug>/`

### New Site Scaffold Path

1. `bash _scripts/new-site.sh <slug> "<Name>" "<#accent>" "<email>"` (`_scripts/new-site.sh`)
2. Copies `_core/` → `sites/<slug>/`
3. Substitutes all `{{PLACEHOLDER}}` tokens in `.astro`, `.json`, `.mjs`, `.ts`, `.md` files
4. Creates initial `wiring.json` with `stage: 1`
5. Developer runs `npm install` to pick up new workspace

### Production Deploy Path

1. Build site with production env vars: `SITE_URL=https://domain.com SITE_BASE=/`
2. `wiring.json` updated: `stage: 6`, `domain`, `prod_repo`, `last_deploy`
3. Built output pushed to `<prod-org>/<slug>` gh-pages branch → custom domain

### CI Deploy Path (Sandbox)

1. Push to `main` → `.github/workflows/deploy.yml` triggers
2. `npm ci` installs all workspace dependencies
3. `node _scripts/build-all.js` builds dashboard + all non-skipped sites
4. `JamesIves/github-pages-deploy-action` pushes `dist/` to `gh-pages` branch
5. GitHub Pages serves `https://pbau3r-sfdy.github.io/WebsiteMocker/`

**State Management:**
- All state is file-based: `wiring.json` (per-site metadata), `_data/*/perf.json` (perf history)
- Dashboard triage state (archive/restore/delete) is stored in browser `localStorage` until committed with `node _scripts/apply-triage.mjs`
- No runtime database or server state

## Key Abstractions

**wiring.json:**
- Purpose: Single metadata file governing a site's lifecycle stage, service integrations, CI behaviour, and production coordinates
- Examples: `sites/crestworks/wiring.json`, `sites/parrot-capital/wiring.json`
- Pattern: Plain JSON; read by dashboard at build time and by `_scripts/*.mjs` for lifecycle operations. Key flags: `stage` (0–6), `archived`, `skip_ci`, `template`, `domain`, `prod_repo`

**Astro Content Collections:**
- Purpose: Type-safe Markdown-based CMS for news posts
- Examples: `sites/sfdy/src/content/news/`, `sites/sfdy/src/content/config.ts`
- Pattern: Each post is `src/content/news/YYYY-MM-DD-slug.md`. Schema enforced via Zod in `config.ts`. Queried with `getCollection('news')` in page components.

**`_core/` Template:**
- Purpose: Canonical scaffold that defines the default site structure
- Examples: `_core/src/components/Nav.astro`, `_core/src/pages/index.astro`, `_core/src/layouts/Layout.astro`
- Pattern: Uses `{{PLACEHOLDER}}` token syntax throughout. `new-site.sh` performs `sed` substitution to produce a real site.

**BASE_URL Pattern:**
- Purpose: All internal links and asset references must use `import.meta.env.BASE_URL` to work correctly under sandbox (`/WebsiteMocker/<slug>`) and production (`/`) base paths
- Examples: `const b = import.meta.env.BASE_URL.replace(/\/$/, '')` used throughout site pages
- Pattern: `href={`${b}/news/${post.slug}`}` — trailing slash stripped to avoid double-slash

## Entry Points

**Dashboard:**
- Location: `src/pages/index.astro`
- Triggers: `npm run build` or `npm run dev` at repo root
- Responsibilities: Reads wiring.json + perf data, renders management UI

**Site Dev Server:**
- Location: `sites/<slug>/src/pages/index.astro`
- Triggers: `cd sites/<slug> && npm run dev`
- Responsibilities: Serves the individual site for local iteration

**Build Orchestrator:**
- Location: `_scripts/build-all.js`
- Triggers: `npm run build` at repo root, or CI
- Responsibilities: Sequences dashboard + site builds, copies outputs to root `dist/`

**CI Pipeline:**
- Location: `.github/workflows/deploy.yml`
- Triggers: Push to `main`, or `workflow_dispatch`
- Responsibilities: Install → build all → deploy dist/ to gh-pages branch

## Architectural Constraints

- **Static only:** All sites use `output: 'static'`. No server rendering, no API routes in site workspaces.
- **Workspace isolation:** Each `sites/<slug>/` has its own `node_modules/` and build config. There are no shared runtime packages between sites.
- **Base path sensitivity:** Every internal link and asset reference must use `import.meta.env.BASE_URL`. Hardcoded `/` paths break sandbox builds.
- **wiring.json as contract:** The dashboard and build scripts rely on specific fields in `wiring.json`. Adding or renaming fields requires updating the dashboard renderer in `src/pages/index.astro`.
- **skip_ci is additive:** Once `skip_ci: true` is set in `wiring.json`, the site is excluded from all builds. Restoring requires removing the flag and recommitting.
- **Production env vars:** Production builds require `SITE_URL` and `SITE_BASE` env vars. Sites scaffolded from `_core/` use the env-var pattern (`process.env.SITE_URL || '...'`) in `astro.config.mjs`. Some older sites (e.g. `sites/sfdy/astro.config.mjs`) have the sandbox base path hardcoded and would need manual config changes for production.

## Anti-Patterns

### Hardcoded base path in astro.config.mjs

**What happens:** `base: '/WebsiteMocker/sfdy'` is hardcoded instead of reading from `SITE_BASE` env var
**Why it's wrong:** Production deploy requires `base: '/'` (or a custom path). Hardcoded value forces a manual file edit before every production build.
**Do this instead:** Use the env-var pattern from `sites/crestworks/astro.config.mjs`:
```js
const SITE_BASE = process.env.SITE_BASE || '/WebsiteMocker/<slug>';
export default defineConfig({ base: SITE_BASE });
```

### Modifying _core/ without propagating to existing sites

**What happens:** `_core/` template is updated but the change is not applied to existing sites
**Why it's wrong:** `_core/` is only used at scaffold time — it is not a shared library. Existing sites diverge silently.
**Do this instead:** Apply changes to `_core/` AND to each relevant `sites/<slug>/` manually. Document divergences in the site's `CLAUDE.md`.

### Placing content in `src/` instead of `public/` for static assets

**What happens:** Images or fonts placed in `src/` instead of `public/`
**Why it's wrong:** Astro processes `src/` assets through the build pipeline with content hashing; `public/` files are served as-is with stable paths. News images referenced by path in Markdown frontmatter must be in `public/`.
**Do this instead:** Put images referenced from Markdown frontmatter or hardcoded `<img src>` in `public/images/`. Only put images that go through Astro's `<Image>` component in `src/`.

## Error Handling

**Strategy:** Fail-fast in scripts with explicit error messages; build continues past individual site failures

**Patterns:**
- `_scripts/build-all.js` catches per-site build errors, logs them, and continues — all failures reported in summary at end; exits with code 1 if any site failed
- Scripts use `process.exit(1)` with descriptive messages for missing arguments or files
- Astro content collection schema (Zod) throws at build time for malformed frontmatter — this is intentional as a type-check gate

## Cross-Cutting Concerns

**Logging:** `console.log` with `▶`, `✓`, `✖` prefix convention in `_scripts/*.js`; `header()` function in `build-all.js` for section separators
**Validation:** Zod schemas in `src/content/config.ts` per site; `astro build` serves as the type-check step for content
**Authentication:** Not applicable — all output is static HTML; no auth layer in sandbox or production

---

*Architecture analysis: 2026-08-20*

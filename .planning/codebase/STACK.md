# Technology Stack

**Analysis Date:** 2026-08-20

## Languages

**Primary:**
- JavaScript (ES Modules) — all scripts, Astro component logic, build tooling
- TypeScript 5.9.3 — type-checking via `astro/tsconfigs/strict`; `.astro` files compiled by Astro pipeline
- HTML/CSS — Astro component templates; all sites use plain vanilla CSS (no CSS framework)

**Secondary:**
- Bash — scaffolding script `_scripts/new-site.sh`

## Runtime

**Environment:**
- Node.js ≥20 (enforced in `package.json` `engines` field); CI pins Node 22 LTS

**Package Manager:**
- npm (workspace-aware)
- Lockfile: `package-lock.json` present (lockfileVersion 3)

## Frameworks

**Core:**
- Astro 5.18.2 — static site generator for dashboard (`src/`) and all sites under `sites/*/`
  - Output mode: `static` everywhere
  - Each site is an independent Astro workspace

**Build/Dev:**
- `_scripts/build-all.js` — root-level orchestrator; runs `astro build` per site and copies output into combined `dist/`
- `astro dev` — per-site dev server; each site has a dedicated port declared in its `package.json`
  - Dashboard: port 4321 (root)
  - Sites: individual ports (e.g. sfdy-alt-clean=4410, parrot-capital=4379, crestworks=4370)

**Testing:**
- No test framework detected

## Key Dependencies

**Critical:**
- `astro` `^5.0.0` (resolved 5.18.2) — declared in root `package.json` and in every `sites/*/package.json`; resolved once via npm workspaces
- `sharp` 0.34.5 — Astro image optimisation (native addon; allow-listed in `package.json` `allowScripts`)
- `esbuild` 0.27.7 / 0.25.12 — Astro bundler dependency (allow-listed in `package.json` `allowScripts`)
- `fsevents` 2.3.3 — macOS file-watch support (allow-listed in `package.json` `allowScripts`)

**Infrastructure:**
- `playwright` ^1.62.1 (resolved 1.62.1) — devDependency on root; used by `_scripts/capture-site.mjs` to screenshot and extract design DNA from live URLs; launches Chromium

## Configuration

**TypeScript:**
- Root `tsconfig.json`: extends `astro/tsconfigs/strict`, `baseUrl: "."`, empty `paths` — `tsconfig.json`
- `_core/tsconfig.json`: extends `astro/tsconfigs/strict` (no overrides) — `_core/tsconfig.json`

**Build:**
- Root Astro config: `site: https://pbau3r-sfdy.github.io`, `base: /WebsiteMocker`, `output: static` — `astro.config.mjs`
- Core template config: `base: /WebsiteMocker/{{SITE_SLUG}}` (placeholder replaced during scaffolding) — `_core/astro.config.mjs`
- Per-site production pattern: reads `SITE_URL` and `SITE_BASE` env vars at build time; falls back to sandbox values
  - Example: `sites/sfdy-alt-clean/astro.config.mjs`, `sites/parrot-capital/astro.config.mjs`

**Environment:**
- No `.env` file in repo (sandbox has no secrets at build time)
- Runtime env vars consumed by build scripts:
  - `SITE_URL` — production base URL for per-site builds
  - `SITE_BASE` — base path for per-site builds (e.g. `/` for production, `/WebsiteMocker/<slug>` for sandbox)
  - `SKIP_SITES` — comma-separated list of slugs to skip in `build-all.js`
  - `PSI_API_KEY` — optional Google PageSpeed API key for `_scripts/fetch-perf-data.mjs`

## Platform Requirements

**Development:**
- Node.js ≥20
- npm (workspace mode)
- Playwright Chromium browsers (`npx playwright install chromium`) for `capture-site.mjs`

**Production:**
- GitHub Pages (static file hosting) on `gh-pages` branch
- CI: GitHub Actions (`ubuntu-latest`, Node 22)
- `.nojekyll` in `public/` required to prevent GitHub Pages from stripping `_astro/` directories

---

*Stack analysis: 2026-08-20*

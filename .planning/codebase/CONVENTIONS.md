# Coding Conventions

**Analysis Date:** 2026-08-20

## Naming Patterns

**Files:**
- Astro components: PascalCase — `Nav.astro`, `Footer.astro`, `NewsCard.astro`, `Layout.astro`
- Astro pages: kebab-case — `privacy-policy.astro`, `terms-conditions.astro`, `index.astro`
- Node scripts: kebab-case with `.mjs` — `archive-site.mjs`, `fetch-perf-data.mjs`, `rename-site.mjs`
- Legacy CJS build script: kebab-case with `.js` — `build-all.js`
- Content posts: `YYYY-MM-DD-slug.md` — `2026-05-01-post-title.md`
- Data files: flat JSON — `wiring.json`, `keywords.json`

**Functions:**
- camelCase throughout — `loadPerf`, `scoreColor`, `cwvColor`, `trendLabel`, `archiveSite`, `resolveUrl`, `fetchPSI`
- Utility helpers grouped under `// ── Helpers ──` section comment

**Variables:**
- camelCase — `activeSites`, `templateSites`, `wiringPath`, `sandboxUrl`
- All-caps for localStorage key constants — `ARCHIVED_KEY`, `ORIGINS_KEY`, `DELETED_KEY`
- All-caps for API/URL string constants — `PSI_BASE`, `SANDBOX_BASE`, `CATEGORIES`
- Config object arrays in ALL_CAPS — `STAGES`

**Types (TypeScript/Astro):**
- Inline `interface Props` declaration at top of Astro frontmatter — no separate type files
- Zod schemas in `src/content/config.ts` using `z.object({ ... })`

**CSS Classes:**
- kebab-case — `.site-card`, `.card-main`, `.stage-badge`, `.section-toggle`
- BEM-lite: block prefix with modifier — `.btn`, `.btn.primary`, `.btn.live`
- Semantic modifiers — `.open`, `.ok`, `.template-chip`

**CSS Custom Properties:**
- kebab-case on `:root` — `--bg`, `--surface`, `--border`, `--text-muted`, `--accent`, `--radius`
- Site-specific tokens may use brand prefix — `--sfdy-blue`, `--sfdy-cyan`, `--sfdy-green` (in `sites/sfdy-alt-clean/src/layouts/Layout.astro`)

## Code Style

**Formatting:**
- No formatter enforced (no `.prettierrc`, `biome.json`, `.editorconfig` found)
- 2-space indentation in JSON files (`wiring.json`, `package.json`)
- Consistent 2-space indentation in Astro components and `.mjs` scripts
- JSON files end with a trailing newline

**Linting:**
- No ESLint or Biome config found
- TypeScript strict mode via `tsconfig.json` → `extends: "astro/tsconfigs/strict"`
- `astro build` acts as the type-check step — it validates content collection frontmatter against Zod schemas

**TypeScript:**
- All `.mjs` scripts use vanilla JS (no TypeScript types) — Node.js runtime only
- TypeScript used only in Astro frontmatter and `src/content/config.ts`
- Strict mode enforced for Astro files

## Import Organization

**Order in Astro frontmatter:**
1. `astro:content` imports — `getCollection`, `defineCollection`, `z`
2. Local layout imports — `../../layouts/Layout.astro`
3. Local component imports — `../../components/Nav.astro`
4. No path aliases configured (empty `paths: {}` in `tsconfig.json`)

**Order in Node scripts (`.mjs`):**
1. Node built-ins — `child_process`, `fs`, `path`, `url`
2. Constants and configuration
3. Argument parsing (`process.argv.slice(2)`)

## Base URL Pattern

**Critical pattern — use everywhere for asset paths:**
```js
const b = import.meta.env.BASE_URL.replace(/\/$/, '');
```
This single-line alias is declared at the top of every component's frontmatter (or inline in `<script>`-free components). All `href`, `src`, and asset URL references then use template literals: `` `${b}/images/logo.png` ``.

This pattern handles both sandbox (`/WebsiteMocker/sfdy`) and production (`/`) base paths.

## Script Headers

All utility scripts in `_scripts/` begin with a JSDoc-style block comment documenting:
- What the script does
- Usage examples with `node _scripts/<name>.mjs ...`
- What files it reads/writes

```js
#!/usr/bin/env node
/**
 * script-name.mjs — short description
 *
 * Usage:
 *   node _scripts/script-name.mjs <arg>
 *
 * What it does:
 *   • ...
 */
```

## Section Dividers

Section divider comments use em dash box style consistently:
```js
// ── Section Name ─────────────────────────────────────────────────
```

Used in long scripts (`build-all.js`, `fetch-perf-data.mjs`) and in the dashboard `index.astro` frontmatter to separate logical blocks.

## Error Handling

**Patterns:**
- `try { JSON.parse(...) } catch { return {}; }` — silent fallback for missing/malformed JSON
- `existsSync(path)` guard before all file reads — no throwing on missing files
- `process.exit(1)` with `console.error(...)` message for hard CLI failures
- Dashboard JS: try/catch around card distribution with `console.error` fallback to main-list
- Astro build: `astro build` serves as schema validation — fails fast on frontmatter errors

**No custom error classes** — plain `Error` or `process.exit(1)` patterns only.

## Logging

**Framework:** `console.log` / `console.error` (no logging library)

**Patterns in Node scripts:**
- `console.log('\n✓  ...')` — success messages with checkmark prefix
- `console.error('\n✖  ...')` — error messages with X prefix
- `console.log('\n▶ cmd [dir]')` — command execution announcement (in `build-all.js`)
- Section headers printed with `─`.repeat(50) horizontal rules

**In dashboard JS (browser):**
- `console.warn('[WM] ...')` — namespaced warnings for storage failures
- `console.error('[WM] ...')` — namespaced errors for distribution failures

## Astro Component Design

**Frontmatter structure:**
```astro
---
interface Props {
  title?: string;
  description?: string;
}
const { title = 'Default', description = 'Default.' } = Astro.props;
const b = import.meta.env.BASE_URL.replace(/\/$/, '');
// data fetching / logic here
---
```

**Template structure:**
- Minimal, semantic HTML
- Inline conditional rendering using ternary `{condition ? <A /> : <B />}` or `{condition && <A />}`
- CSS in scoped `<style>` block at bottom of each component
- Global CSS only in `Layout.astro` via `<style is:global>`
- No CSS preprocessors (plain CSS only)

**Style design system:**
- All sites define CSS custom properties on `:root` in `Layout.astro`
- Dark theme by default with optional light theme via `@media (prefers-color-scheme: light)` and `[data-theme]` attribute
- Common tokens: `--bg`, `--surface`, `--border`, `--text`, `--muted`, `--accent`, `--radius`

## Module Design

**Exports:**
- `_scripts/*.mjs` — no exports; all scripts are executable entry points
- `src/content/config.ts` — named export `collections`
- Astro components — default export implicitly via `.astro` file

**Barrel Files:** Not used — direct import paths only

**ES modules exclusively:** All code uses `import`/`export` — no CommonJS `require()`

## wiring.json Conventions

Every site must have `sites/<slug>/wiring.json`. Required fields:
- `stage` (integer 0–6)
- `name` or `site` (display name)
- `domain` (null until stage 5)
- `newsletter`, `forms`, `socials`, `legal` (service connection objects)
- `skip_ci: true` for archived/WIP sites — build script reads this to skip CI builds
- `archived: true` + `archived_at` for retired sites

Template sites include `"template": true`. Active production sites include `prod_repo` and `last_deploy`.

---

*Convention analysis: 2026-08-20*

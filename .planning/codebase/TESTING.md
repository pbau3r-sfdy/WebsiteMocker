# Testing Patterns

**Analysis Date:** 2026-08-20

## Test Framework

**Runner:** None — no test framework installed or configured

**Assertion Library:** None

**Test Config:** No `jest.config.*`, `vitest.config.*`, or equivalent found

**Run Commands:**
```bash
# No test command exists. The closest equivalents:
astro build          # type-checks Astro frontmatter + content collection schemas
npm run build        # full monorepo build — fails on any Astro compile error
```

## Test File Organization

**No test files exist in this codebase.** A search across all source directories found zero `*.test.*` or `*.spec.*` files.

**Testing strategy is build-time only:** `astro build` catches:
- TypeScript type errors in Astro frontmatter
- Zod schema violations in content collection frontmatter (`src/content/config.ts`)
- Invalid imports and missing assets that would 404

## Playwright — Capture Tool, Not Test Runner

Playwright (`^1.62.1`) is listed as a `devDependency` in the root `package.json`. It is **not used for testing**. It is used exclusively by `_scripts/capture-site.mjs` to screenshot live URLs and extract design DNA for the `_captures/` library.

There are no Playwright test files, no `playwright.config.*`, and no `playwright test` script.

## CI Validation

**`.github/workflows/deploy.yml`** runs on every push to `main` and performs:
1. `npm ci` — install dependencies exactly from lockfile
2. `node _scripts/build-all.js` — builds dashboard + all non-skipped sites via `astro build`
3. Deploy to `gh-pages` branch

There is no dedicated test step in CI. A failing `astro build` for any site fails the entire deploy workflow.

## Content Schema Validation

The only runtime schema validation in the project is for Astro content collections.

**Schema file:** `sites/<slug>/src/content/config.ts`

```typescript
import { defineCollection, z } from 'astro:content';

const news = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    summary: z.string(),
    image: z.string().optional(),
  }),
});

export const collections = { news };
```

**What is validated at build time:**
- All news posts in `src/content/news/YYYY-MM-DD-slug.md` must have `title`, `date`, and `summary`
- `image` is optional
- `date` must parse as a valid JavaScript `Date` (YAML date format)

**To verify schema:** `cd sites/<slug> && npm run build`

## Manual Verification Workflow

The project uses a manual pre-deploy checklist defined in `.claude/skills/wm-preflight.md` rather than automated tests. The `/wm-preflight` skill covers:
- Build passes without errors
- No `placeholder` strings in form actions
- `wiring.json` stage and fields are accurate
- Legal pages (Impressum, Privacy) are complete
- `robots.txt` set correctly for production

## Performance Tracking

`_scripts/fetch-perf-data.mjs` calls the Google PageSpeed Insights API and stores results in `_data/<slug>/perf.json`. This is not automated testing but provides ongoing perf monitoring visible on the dashboard.

```bash
npm run perf                        # fetch PSI scores for all sites
node _scripts/fetch-perf-data.mjs <slug>  # fetch for one site
```

Data format per site in `_data/<slug>/perf.json`:
```json
{
  "history": [
    {
      "date": "YYYY-MM-DD",
      "mobile": { "performance": 95, "accessibility": 100, "seo": 92, "best_practices": 96, "lcp": "1.2s", "lcp_status": "good", "cls": "0.01", "cls_status": "good", "fcp": "0.9s" }
    }
  ]
}
```

History is capped at 90 entries. Dashboard displays latest scores and trend arrow (↑/↓/→).

## Test Coverage Gaps

**All application logic is untested:**

- `_scripts/build-all.js` — skip logic, site enumeration, dist copy behavior
- `_scripts/archive-site.mjs` — wiring.json mutation, restore flag handling
- `_scripts/delete-site.mjs` — dry-run vs confirm path, multi-directory deletion
- `_scripts/rename-site.mjs` — slug replacement across files
- `_scripts/fetch-perf-data.mjs` — URL resolution logic, history capping
- `_scripts/apply-triage.mjs` — batch archive/delete operations
- Dashboard `src/pages/index.astro` — card distribution JS, localStorage fallback, triage state management
- Content collection schema enforcement — only tested implicitly by `astro build`

**Highest risk untested areas:**
- The `resolveUrl()` function in `fetch-perf-data.mjs` determines which URL is benchmarked — logic errors here silently test the wrong URL
- The `shouldSkip()` function in `build-all.js` — incorrect skip logic could prevent live sites from building in CI
- Dashboard triage localStorage state — complex multi-key state with sessionStorage fallback, no unit coverage

## Recommended Testing Setup (if introduced)

Given the project is a Node.js + Astro monorepo with no framework yet, Vitest would be the lowest-friction addition:

```bash
npm install -D vitest
```

```js
// vitest.config.js (root)
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'node', include: ['_scripts/**/*.test.mjs'] }
});
```

Priority test targets: `resolveUrl()` in `fetch-perf-data.mjs`, `shouldSkip()` in `build-all.js`, and the wiring.json mutation logic in `archive-site.mjs`.

---

*Testing analysis: 2026-08-20*

---
plan: 05-03
phase: 05-design-artifact-ingestion
status: complete
completed: 2026-08-21
commit: c8d2112
---

# Summary: 05-03 Gap Closure — Font Injection, Config Injection, CSS url() Rewriting

## What Was Built

Three targeted fixes to `_scripts/ingest-artifact.mjs` closing all three verification gaps that blocked Phase 5 sign-off.

### Gap 1 — Google Fonts injection into Layout.astro

**Before:** Fonts were logged to stdout as manual operator instructions ("add them manually to Layout.astro").

**After:** `extractGoogleFontsLinks()` results are injected as `<link rel="stylesheet">` tags before `</head>` in `sites/<slug>/src/layouts/Layout.astro` via `writeFileSync`. Idempotent — skips if `fonts.googleapis.com` already present. Falls back to `warn()` + log if Layout.astro is missing or has no `</head>`.

### Gap 2 — astro.config.mjs env-var injection

**Before:** If `SITE_URL`/`SITE_BASE` were absent, only a `warn()` was emitted — file was never modified.

**After:** When the pattern is absent, `defineConfig({` is replaced with `defineConfig({\n  // injected by /wm-ingest ...\n  site: process.env.SITE_URL,\n  base: process.env.SITE_BASE || '/',` via string replace + `writeFileSync`. Falls back to `warn()` if `defineConfig({` not found. DRY_RUN guarded.

### Gap 3 — CSS url() local-path rewriting

**Before:** `extractScopedCSS` returned rules with raw `url('/path')` references that broke under Astro's base URL routing.

**After:** A `.replace()` pass rewrites `url('/...')`, `url('/...')`, and `url(/...)` to `url(\`${b}/...\`)` template literals. Skips `http://`, `https://`, and `data:` URIs. `toAstroComponent`'s `hasLocalAssets` guard extended to also check `scopedCSS.includes('${b}')` so `const b = import.meta.env.BASE_URL.replace(/\/$/, '');` is injected into component frontmatter when CSS references `b`.

## Key Files

- `_scripts/ingest-artifact.mjs` — all three changes applied (lines 280-286, 356, 465-479, 616-645)

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `node --check _scripts/ingest-artifact.mjs` | ✅ PASS |
| `writeFileSync.*Layout\.astro` present | ✅ line 636 |
| `writeFileSync.*config` present | ✅ line 474 |
| "add them manually" removed | ✅ count=0 |
| warn-only SITE_URL path removed | ✅ count=0 |
| url() rewrite regex | ✅ lines 282-286 |
| `scopedCSS.includes` in hasLocalAssets | ✅ line 356 |
| DRY_RUN guards maintained | ✅ count=15 |
| `injected.*Google Fonts` ok() | ✅ line 637 |
| `injected.*SITE_URL` ok() | ✅ line 475 |

## Deviations

None. All changes are surgical as specified. No other logic touched.

## Requirements Closed

- **INGEST-02** — astro.config.mjs env-var pattern injected when absent
- **INGEST-05** — Google Fonts CDN links injected into Layout.astro automatically
- Gap 3 (CSS url() rewriting) — extractScopedCSS + toAstroComponent const-b guard

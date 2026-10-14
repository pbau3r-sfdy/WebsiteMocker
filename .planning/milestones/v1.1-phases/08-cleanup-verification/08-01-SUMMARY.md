# Plan 08-01 Summary

## What was built

- Added an executable Phase 8 structural verification harness with selectable `hsk01`, `hsk02`, `hsk03`, `dexp`, and `all` sections.
- Updated the `_core` Astro scaffold config to use `SITE_URL` and `SITE_BASE` environment variables while preserving the literal `{{SITE_SLUG}}` substitution contract.
- Replaced the `_core` newsletter button's hardcoded blue with `var(--accent)`.
- Added 17 shared-token aliases to Crestworks without changing its canonical `--cw-*` palette.

## HSK-02 propagation finding

Only `_core/src/pages/index.astro` needed patching. The active sites `sfdy-alt-clean`, `mogwai-systems`, `parrot-capital`, and `crestworks` contained no `#384AD3` hits. Remaining hits under `sites/sfdy/` belong to an `archived: true` site that is excluded from CI builds, so they were deliberately skipped.

## Crestworks token bridge rationale

The aliases map shared `_core` component token names onto Crestworks' existing `--cw-*` palette. This also resolves the previously undefined `--font-head` and `--text-muted` variables already referenced by the Crestworks news route.

## Key files

- Created `_scripts/verify-phase-08.sh`
- Modified `_core/astro.config.mjs`
- Modified `_core/src/pages/index.astro`
- Modified `sites/crestworks/src/layouts/Layout.astro`

## Self-check results

- `bash -n _scripts/verify-phase-08.sh`: passed
- Harness executable check: passed
- `hsk01` and `dexp` sections: ran to completion and printed results; expected failures remain for later Phase 8 plans
- `bash _scripts/verify-phase-08.sh hsk02`: 6 passed, 0 failed
- `bash _scripts/verify-phase-08.sh hsk03`: 6 passed, 0 failed
- `node --check _core/astro.config.mjs`: passed
- Active-site `#384AD3` propagation grep: clean
- `cd sites/crestworks && npx astro build`: passed; `dist/news/index.html` generated
- Crestworks palette/token and markup preservation checks: passed

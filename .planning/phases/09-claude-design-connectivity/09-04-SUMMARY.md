---
phase: 09-claude-design-connectivity
plan: 04
subsystem: design-sync
tags: [design-sync, jsx, render, esbuild, playwright, react]
requires: [09-01]
provides:
  - "renderComponent(entryPath, { stagingRoot, outDir, method, fallback }) -> { html, method }"
  - "scanImports(source, opts) -> { ok, imports, refused }"
affects: [09-05]
tech-stack:
  added: [react@19.3.0, react-dom@19.3.0 (devDependencies; scheduler 0.28.0 transitive)]
  patterns: ["esbuild bundle + node --permission child", "Playwright chrome fallback with non-file requests aborted"]
key-files:
  created:
    - _scripts/lib/design-render.mjs
    - _scripts/design-render-worker.mjs
    - _scripts/fixtures/design/render/Card.jsx
    - _scripts/fixtures/design/render/Evil.jsx
    - _scripts/fixtures/design/render/Empty.jsx
    - _scripts/fixtures/design/render/Browserish.jsx
  modified: [package.json, package-lock.json]
key-decisions:
  - "SSR path per SD-06: react-dom/server.browser bundled in (avoids node builtins), rendered in a child with read access to the bundle dir only"
  - "Default method 'ssr' with automatic Playwright fallback on SSR failure; fallback:false disables it"
metrics:
  tasks: 2
  completed: 2026-10-14
---

# Phase 9 Plan 04: JSX Render Summary

Local JSX to static HTML rendering: esbuild bundles the component with React, `renderToStaticMarkup` runs in a `node --permission` child, and components that need a DOM fall back to headless Chrome through Playwright.

## Tasks

| Task | Name | Commit |
|------|------|--------|
| 1 | Operator-verified install of react and react-dom | 4d23c48 |
| 2 | Isolated render library, worker, fixtures | 3ffb8e2 |

## Details

- Task 1: the operator approved ("approved, install and commit"). Ran `npm install -D react@^19 react-dom@^19`. `npm ls astro` reports 5.18.2 everywhere (no Astro change). package.json gains only react and react-dom (^19.3.0). The lock gained react, react-dom and their transitive dependency scheduler.
- Lock commit excluded the pre-existing 10 lines that register the untracked `sites/sfdy-alt-clean-variant` workspace (2 of 5 hunks dropped; `git show :package-lock.json | grep -c sfdy-alt-clean-variant` was 0). Those hunks remain uncommitted in the working tree.
- `scanImports` allows `react`, `react/jsx-runtime`, `react-dom`, `react-dom/server` and relative paths inside the staging root. It refuses anything else (including `node:*`) and the identifiers `require(`, `process.`, `child_process`, `eval(`, `new Function`, `import(`, `fetch(`, `XMLHttpRequest`, `WebSocket`. `renderComponent` also scans every relative file the entry reaches, before any code runs.
- Verified: Card renders via `ssr`; Evil refused (nothing written to /tmp); Empty throws `empty render`; Browserish fails under SSR and renders through Playwright (`method: 'playwright'`); with `fallback: false` it throws a clear SSR error naming the component.

## Deviations from Plan

**1. [Rule 1 - Bug] Worker hung until timeout.** react-dom's scheduler keeps a MessageChannel open after output. Fix: the worker exits explicitly after stdout flush. File: `_scripts/design-render-worker.mjs`.

**2. [Rule 1 - Bug] Permission model denied reads for a symlinked tmp dir (macOS /var -> /private/var).** Fix: `outDir` is passed through `realpathSync` before `--allow-fs-read`.

**3. [Rule 3 - Blocking] `react-dom/server` Node entry needs node builtins that the permission/ESM bundle cannot require.** Fix: the wrapper imports `react-dom/server.browser`.

**Residual risk:** per spike L3 the permission model blocks network, fs write and child processes without `--allow-net` etc., and `scanImports` additionally refuses network identifiers. Playwright fallback runs with non-file requests aborted, but the Chrome page itself is not otherwise sandboxed beyond Chrome's own process sandbox.

## Known Stubs

None.

## Self-Check: PASSED

Files and commits 4d23c48 and 3ffb8e2 verified present.

# Phase 9 Spike Report (DSYNC-01)

Run: 2026-10-14. Node v26.11.1, esbuild 0.27.7, Playwright with installed Google Chrome. `_staging/` is gitignored; probe scripts live in `_staging/spike/` and are not committed.

## Local Probes

### L1 esbuild JSX syntax check
Command: `transform(src, { loader: 'jsx' })` on a valid and an invalid `.jsx` (`_staging/spike/l1.mjs`).
Result: valid input transforms (111 bytes out). Invalid input throws `Error` with `errors[0].text = 'Unexpected end of file before a closing "div" tag'`, `location.line = 2`. A syntax failure is therefore detectable deterministically and has a usable line number.

### L2 esbuild SSR bundle without React installed
Command: `build({ bundle: true, format: 'esm', platform: 'node', jsx: 'automatic' })` on the valid jsx.
Result: fails only with `Could not resolve "react/jsx-runtime"`. The remaining path needs only `react` and `react-dom` (not installed; no install performed, `node_modules/react` absent).

### L3 Node permission sandbox
Command: `node --permission --allow-fs-read=<_staging/spike> -e <script>` on Node v26.11.1.
Result: fs write BLOCKED (`ERR_ACCESS_DENIED`), child_process BLOCKED, worker threads BLOCKED, network (`fetch`) BLOCKED (`ERR_ACCESS_DENIED`). No write file was created. `node --help` lists `--allow-net`, `--allow-child-process`, `--allow-fs-read/write`, so network is denied by default under `--permission` and must be opted into explicitly.

### L4 Playwright via installed Chrome
Command: `chromium.launch({ channel: 'chrome', headless: true })`, load a `file://` page whose inline script injects `<div id=r>`, with `page.route('**/*', ...)` aborting non-file requests.
Result: `waitForSelector('#r')` succeeds, `page.content()` contains the rendered div, and the one non-file request the page attempted was aborted (count 1). Chrome fallback works without bundled browsers.

### L5 Unimported `.incoming.astro`
Command: wrote `sites/levion/src/components/SpikeProbe.incoming.astro` with deliberately invalid Astro syntax, then built.
Result: `node _scripts/build-all.js levion` skips levion (template, `skip_ci`), so it proved nothing; the direct `cd sites/levion && npx astro build` passed (`9 page(s) built`, exit 0) with the invalid file present. An unimported `.incoming.astro` in `src/components/` does not break the build. Probe file deleted; `git status --short sites/levion` is empty.

### L6 Section extraction on a nested template
Command: reproduced `extractSections` (direct `body` children only) on `_staging/spike/nested.html` (`<body><div id="root"><section>..</section><footer>..</footer></div></body>` plus one `@media` rule).
Result: direct body children sections found: 0; one wrapper deep: 2; `@media` rules in source: 1. `extractScopedCSS` (`_scripts/ingest-artifact.mjs` lines 598-627) splits on `}` and only warns on `@media`; responsive rules are not extracted.

## Report Skeleton

Task 2 fills: `## DesignSync`, `## Published Artifact Link`, `## Local Export and Paste`, `## JSX Render`, `## Section Merge Semantics`, `## Token Names Observed`, `## Scope Decisions`.

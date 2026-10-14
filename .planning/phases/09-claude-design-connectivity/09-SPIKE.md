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

## DesignSync

Probed 2026-10-14 from a Claude Code session with the model-side `DesignSync` tool (not available to Node, Codex or CI).

- **Projects.** `list_projects` returns `projectId`, `name`, `ownerDisplayName`, `isOwned`, `updatedAt` for three design-system projects (Levion Materials, Starflight Dynamics, Crestworks). No revision, version or hash field. `get_project` adds `type` (`PROJECT_TYPE_DESIGN_SYSTEM`) and `canEdit`; still no revision.
- **Listing.** `list_files` returns a flat array of paths only: directories appear as bare entries, files as full paths. No size, hash, mtime or revision per file. Sizes are therefore unknowable before a fetch.
- **Uploads.** The uploads folder holds 81 entries in the SFDY project and 123 in Crestworks (hand-counted from the listing, approximate). None were fetched and none are named here (D-02).
- **Cap behaviour.** `get_file` returns `{content, contentType, isBase64, truncated}`. The `truncated` flag exists. No file at or near 256 KiB exists in the D-01 globs, so truncate-versus-error was NOT triggered. The largest file fetched was Crestworks `_ds_bundle.js` (a generated bundle outside the D-01 globs), 91,416 bytes as a JSON-wrapped result. Because no size is exposed up front, the stager must fail on `truncated: true` and on staged size at or above 261,120 bytes (262144 - 1024).
- **Large results.** Results above roughly 50 KB were spilled by the harness to a file on disk (the 91 KB bundle). A file on disk is a byte-exact source that does not pass through the model. Small and medium results arrive only in the model context.
- **Relay fidelity.** Two `get_file` calls of the same small CSS file returned identical text. The bytes still reach disk only because the model re-types them with the Write tool. During this spike the model abridged a 12 KB HTML template into a skeleton instead of copying it verbatim (the staged `ui_kits/website/index.html` in `_staging/spike/ds/sfdy/` is such a skeleton and is not byte-exact). Model relay is therefore a real corruption risk for anything beyond tiny files, and the listing offers no reference hash to detect it.
- **Binaries.** A PNG logo comes back as base64 text (`isBase64: true`, roughly 16 KB of text for a 1 KB-class logo). Relaying that through the model is impractical and unverifiable. SVG logos are plain text and relay fine.
- **Custom skill use.** The tools are model tools, so a `/wm-*` skill can instruct the model to call them. No restriction was observed. Every permission-gated step (the first call may prompt for design scopes) happens in the session.
- **Write surface (read-only inspection).** `create_project(name)`, `finalize_plan(projectId, writes[], deletes[], localDir)` returning `planId`, `write_files(projectId, planId, files[{path, localPath | data, encoding, mimeType}])` (max 256 files per call), `delete_files`, `register_assets`. `write_files` with `localPath` reads from disk and uploads without the contents entering the model context, so binaries and large files can be uploaded byte-exact. No project was created and nothing was written.
- **D-01 glob fit.** SFDY has `tokens/*.css`, `components/**` (jsx, d.ts, prompt.md), `ui_kits/website/index.html` and `README.md`, `assets/logos/` (plural, PNG only), `assets/emblems|imagery|partners|news`. It has NO `templates/website/` (its templates are document templates: letter, proposal, deck) and NO `assets/logo/`. Crestworks has `templates/website/Website.dc.html`, `ui_kits/website/*.jsx`, `assets/logo/*.svg`, `assets/brand/*.png`. The D-01 glob `assets/logo/**` misses SFDY's `assets/logos/`. SFDY's template links `../../styles.css` (root file) for token variables, which no D-01 glob selects.

## Published Artifact Link

A real shared Claude Design link supplied by the operator (`https://claude.ai/design/p/<id>?file=...&via=share`) was fetched two ways on 2026-10-14:

- `curl -sSL` returned HTTP 403, `text/html`, 5,756 bytes: a Cloudflare "Just a moment..." challenge page (`<title>Just a moment...`), not the design.
- `WebFetch` returned HTTP 403 Forbidden.

Third probe, 2026-10-14: the same link opened through cmux-cua in the operator's own logged-in Google Chrome. The project page loaded (title "TELEX one-pager designs", design file "TELEX One-Pager EU A03", 16 pages) and `page get_text` returned the rendered design text plus the project chat. Source extraction was then tested. `page execute_javascript` runs in the claude.ai tab, but the design itself renders in a cross-origin sandboxed iframe on `<project-id>.claudeusercontent.com` (`sameOrigin: false`), so its DOM cannot be read from the page. Opening the iframe's `/_bootstrap` URL directly shows a stub that only accepts a `postMessage` carrying a token from a claude.ai parent (allowed origins `https://claude.ai` and `https://preview.claude.ai`). Reading the source would mean working around that isolation on purpose, which this spike does not do. Result: visible text only, no HTML/CSS source. The operator also noted that Claude Design is moving to Artifacts in the Claude app (banner: this version stays usable until December 14), so the link format itself is on a deprecation clock.

A server-side or command-line fetch of a shared design link is not viable. A logged-in browser session can read it, but only interactively on the operator's machine. The Artifact tool `read` action only accepts `claude.ai/artifact/...` links, not `claude.ai/design/p/...`, and was not tried. Conclusion: the link route degrades to "operator exports or pastes the HTML locally".

## Local Export and Paste

The operator did not state which export formats Claude Design gives them, so this is not measured. Verified locally: `adm-zip` is installed and already imported by `_scripts/ingest-artifact.mjs`; the stager must reject entries with absolute paths or `..` segments (zip-slip) and any symlinks, and must apply the same D-01 globs and size rules as a DesignSync pull. Single HTML, a directory and pasted HTML need no parser beyond the stager. The `.dc.html` design-canvas format (see Section Merge Semantics) is a real export shape: a `<x-dc>` wrapper that needs its sibling `support.js` and `ds-base.js`.

## JSX Render

- L1: esbuild `transform` with `loader: 'jsx'` is a reliable, line-numbered syntax gate (invalid input throws).
- L2: an SSR bundle with `jsx: 'automatic'` fails only on the missing `react/jsx-runtime`, so the render path needs only `react` and `react-dom` (not installed; an install requires the plan's human-verify checkpoint).
- L3: `node --permission --allow-fs-read=<dir>` blocks fs write, child process, worker threads and network on Node 26.11.1; network needs an explicit `--allow-net`. This is a workable sandbox for rendering untrusted JSX.
- L4: Playwright with `channel: 'chrome'` renders a `file://` page and `page.route` aborts non-file requests. Works without bundled browsers.
- Component shape (read, never executed): SFDY `components/core/Button.jsx` and `Beam.jsx` do `import React from "react"`, export named function components, use `React.useState` (Button), style via inline objects referencing CSS variables (`var(--sfdy-green)` etc.), and touch no `window` or `document`. Both have sibling `.d.ts` and `.prompt.md` files. Server-side rendering with default state is therefore feasible; the CSS variables must come from the staged `tokens/*.css` and `styles.css`.

## Section Merge Semantics

- `writeSectionMode` (`_scripts/ingest-artifact.mjs`, lines 706-791) writes `src/components/<Name>.astro` with no existence or hash check. A re-ingest silently overwrites a hand-edited component. Only full mode guards Nav/Footer, against `_core` rather than the last ingest. The overwrite guard (D-05/D-06) is new code.
- L5: an unimported, syntactically invalid `.incoming.astro` in `sites/levion/src/components/` does not break `astro build` (9 pages built, exit 0). `node _scripts/build-all.js levion` skips levion (template), so only the direct `astro build` proves this. `.incoming.astro` can live in `src/components/`.
- Extraction on real templates:
  - SFDY `ui_kits/website/index.html` (structure reproduced; the staged copy is an abridged skeleton): the direct-body-children rule finds 6 sections (nav, hero, news, partners, band, footer) and drops 2 `@media` blocks.
  - Crestworks `templates/website/Website.dc.html` (read, not staged): sections sit under `<x-dc><div>`, two wrappers deep, so the current rule finds 0. A reproduction of that shape finds 0 with the direct rule and 0 with a one-wrapper-deep rule; a rule must search to depth 3 or more. Its styles are inline `style=""` attributes, so scoped-CSS extraction gets nothing and 0 `@media` rules exist.
  - A synthetic nested template (L6) confirmed one wrapper deep yields 2 sections where the direct rule yields 0.

## Token Names Observed

Custom property NAMES only, from staged-then-read token files.

- SFDY `tokens/colors.css`: `--sfdy-blue --sfdy-cyan --sfdy-green --sfdy-magenta --sfdy-black --sfdy-white`; `--ink-950 --ink-900 --ink-850 --ink-800 --ink-700 --ink-600 --ink-500 --ink-400 --ink-300 --ink-200 --ink-100 --ink-050`; `--white-90 --white-70 --white-56 --white-40 --white-24 --white-14 --white-08 --white-04`; `--green-glow --green-line --cyan-glow --blue-glow --magenta-glow`; semantic: `--bg-base --bg-raised --surface-1 --surface-2 --surface-3 --text-primary --text-secondary --text-muted --text-inverse --border-subtle --border-strong --border-accent --accent --accent-contrast --accent-soft --info --link --attention --success --beam --beam-diagonal`.
- SFDY `tokens/typography.css`: `--font-display --font-body --font-mono`; `--fw-ultralight --fw-light --fw-regular --fw-medium --fw-bold --fw-black`; `--text-2xs --text-xs --text-sm --text-base --text-md --text-lg --text-xl --text-2xl --text-3xl --text-4xl --text-5xl --text-6xl`; `--lh-tight --lh-snug --lh-heading --lh-body --lh-relaxed`; `--ls-eyebrow --ls-caps --ls-wide --ls-normal --ls-tight`.
- SFDY `tokens/spacing.css`: `--space-0 --space-1 --space-2 --space-3 --space-4 --space-5 --space-6 --space-8 --space-10 --space-12 --space-16 --space-20 --space-24 --space-32`; `--slide-w --slide-h --slide-pad --content-max --gutter --measure --nav-h --beam-strength`.
- Crestworks `tokens/colors.css`: `--cw-black --cw-white --cw-yellow --cw-magenta --cw-orange`; `--cw-grey-900 --cw-grey-800 --cw-grey-700 --cw-grey-600 --cw-grey-500 --cw-grey-400 --cw-grey-300 --cw-grey-200 --cw-grey-100 --cw-grey-050`; `--cw-yellow-wash --cw-magenta-wash --cw-orange-wash`; semantic: `--text-heading --text-body --text-muted --text-meta --text-inverse --text-accent --text-link --text-link-hover --surface-page --surface-card --surface-sunken --surface-panel --surface-inverse --border-hairline --border-subtle --border-panel --accent-primary --accent-secondary --accent-tertiary --focus-ring`.
- Not read: SFDY `base.css`, `effects.css`, `fonts.css`; Crestworks `base`, `borders`, `elevation`, `fonts`, `motion`, `spacing`, `typography`.
- Observation: the two systems share some names with different meaning (`--text-muted`, `--border-subtle`, `--text-inverse`). The token map must be per-source, never name-collision based.

## Scope Decisions

| ID | Decision | Recommendation | Evidence | Status |
|----|----------|----------------|----------|--------|
| SD-01 | Stager integrity rule | Fail on `truncated: true`; fail when staged size >= 261,120 bytes (262144-1024); record LF-normalised sha256 per file; the skill fetches each file twice and the stager compares the two relays, failing on any mismatch. Listing size is not exposed, so it cannot be compared. | `truncated` flag exists; listing has paths only; model abridged a 12 KB template during the spike; no reference hash exists. | proposed |
| SD-02 | Binary handling | Skip binaries with a "skipped, binary" report line and manual asset placement. Text SVG is staged as text. | PNG returns as base64 text (about 16 KB for a small logo); relay is unverifiable. | proposed |
| SD-03 | Revision source for the lock | `revision: null`; record `pulledAt`, per-file sha256 and the project's `updatedAt` from `list_projects`. | No revision, version or per-file hash in `list_projects`, `get_project` or `list_files`. | proposed |
| SD-04 | Artifact-link route | No scripted fetch. Link route dropped: the logged-in Chrome route yields visible text only (design source sits in a cross-origin sandboxed iframe with token-gated bootstrap). The operator exports the design from Claude Design (HTML or PDF export from the project UI) and the skill ingests the local export. | `curl` and `WebFetch` got HTTP 403 (Cloudflare challenge); the same link loaded in the operator's logged-in Chrome via cmux-cua (visible text read; source extraction blocked by the sandboxed iframe); Claude Design is moving to Artifacts. | proposed |
| SD-05 | Local export formats | Support zip (zip-slip and symlink checks), single HTML, directory and paste-to-file, all through the same stager rules. | `adm-zip` installed; formats not stated by the operator, so unmeasured. | proposed |
| SD-06 | JSX render path | esbuild bundle, then `react-dom/server` in a `node --permission` child with no net and no fs write; Playwright `channel: 'chrome'` as fallback for components that need a DOM. `react` and `react-dom` must be installed as devDependencies behind the human-verify checkpoint. | L1 to L4; SFDY components use only `react`, `useState` and inline CSS-variable styles. | proposed |
| SD-07 | Section extraction change | Yes: search sections to depth 4 inside wrapper elements (covers `<x-dc><div>`). Yes: replace the split-on-`}` scoped-CSS extractor with a css-tree one that keeps `@media`. | L6; Crestworks `.dc.html` yields 0 sections with the current rule; SFDY template drops 2 `@media` blocks. | proposed |
| SD-08 | Location of `<Name>.incoming.astro` | `src/components/` next to the component. | L5: an invalid unimported `.incoming.astro` did not break `astro build`. | proposed |
| SD-09 | DSYNC-11 seeding | Keep as plan 09-09. | `finalize_plan` then `write_files` with `localPath` uploads from disk byte-exact and handles binaries; no project was created in the spike. | proposed |
| SD-10 | DSYNC-12 second path | Source: a local HTML export of the operator's TELEX one-pager design (the shared link itself is blocked). Target: a new throwaway sandbox slug `design-pilot`, created from `_core`, never published and not a live site. | SD-04 evidence; levion is a template and skip_ci. | proposed |

Additional finding for the plans: the D-01 globs miss SFDY's `assets/logos/` and root `styles.css`; add `assets/logos/**` and `styles.css` to the default scope in the stager and design block validator.

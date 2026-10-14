---
phase: 05-design-artifact-ingestion
plan: "01"
subsystem: scripts
tags: [ingest, html-parse, astro-components, css-collision, asset-handling]
dependency_graph:
  requires: []
  provides: [ingest-artifact-script]
  affects: [sites/<slug>/src/components/, sites/<slug>/src/pages/index.astro, sites/<slug>/public/images/]
tech_stack:
  added: []
  patterns:
    - hast-util-from-html for HTML → HAST tree (transitive dep, no new install)
    - toHtml for HAST node → HTML string serialization
    - CSS custom property extraction via matchAll regex
    - CSS collision detection via Map intersection (same name, different value)
    - BASE_URL template literal pattern ({b}/ prefix) for all local asset paths
    - Nav/Footer overwrite protection against customized components
    - Astro scoped <style> blocks per component (no is:global)
key_files:
  created:
    - _scripts/ingest-artifact.mjs
    - _captures/sfdy-alt-clean/raw/artifact.html (test artifact)
  modified: []
decisions:
  - "Parse HTML with fromHtml() (full-document mode, not fragment) — navigate html→body→sections"
  - "Overwrite protection applies in real write mode only; dry-run always shows would-write for all components"
  - "Base64 image replacement done inline (full src= attribute replacement) rather than two-step URI + closing-quote approach"
  - "extractScopedCSS uses simple split-on-} approach as plan specifies (MVP; nested @media is an accepted limitation)"
  - "publicFontsDir stub created but no font files copied — Google Fonts CDN links surfaced as operator log output"
metrics:
  duration: "~45 minutes"
  completed: "2026-08-21"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
requirements_closed: [INGEST-01, INGEST-02, INGEST-04, INGEST-05, INGEST-06, INGEST-07]
---

# Phase 05 Plan 01: ingest-artifact.mjs — Script Scaffold + Full-Site Write Mode Summary

**One-liner:** Node.js HTML artifact parser that extracts Claude Design sections into scoped Astro components with BASE_URL routing, CSS collision detection, base64 image decoding, and brand token reporting.

## What Was Built

`_scripts/ingest-artifact.mjs` — a standalone Node.js ES module script (282+278 lines) that provides two modes:

1. **`--analyze` mode:** Parses `_captures/<slug>/raw/artifact.html`, returns JSON with sections manifest, CSS variable collision report, Google Fonts links, and image inventory. Zero writes. Used by `/wm-ingest` skill to present pre-flight report to operator before any changes.

2. **`--mode full` mode:** Full-site ingest that writes one scoped `.astro` component per `<section>/<nav>/<footer>/<header>/<main>` found in the artifact body, writes a wired `index.astro`, decodes base64 images, rewrites local paths to `{b}/` template literal syntax, and runs a build verification.

## Task Outcomes

| Task | Status | Commit |
|------|--------|--------|
| Task 1: Script scaffold + --analyze mode | DONE | 909eb7c |
| Task 2: Full-site write mode + asset handling | DONE | 71dab1e |

## Acceptance Criteria Verification

| Criterion | Result |
|-----------|--------|
| `node --check _scripts/ingest-artifact.mjs` exits 0 | PASS |
| No-args run exits 1 with usage containing '--analyze' | PASS |
| `--analyze` exits 0 with parseable JSON | PASS |
| JSON has all 7 keys (sections, artifactVars, existingVars, collisions, googleFontsLinks, images, base64Images) | PASS |
| sections entries have name, tag, id, classes fields | PASS |
| collisions non-empty when vars conflict | PASS (--accent conflicts in sfdy-alt-clean) |
| `--mode full --dry-run` shows [dry] would write for Nav, Hero, Footer, index.astro | PASS |
| Hero.astro written after real ingest | PASS |
| `grep 'src="/'` in Hero.astro returns empty | PASS |
| `grep -r ':root'` in components returns empty | PASS |
| `grep -r 'data:image'` in components returns empty | PASS |
| astro.config.mjs check logs SITE_URL/SITE_BASE confirmation | PASS |
| Google Fonts CDN links surfaced as operator instructions | PASS |
| Brand candidates block logged | PASS |
| `node _scripts/build-all.js sfdy-alt-clean` exits 0 after ingest | PASS |
| sfdy-alt-clean restored via git checkout after test | PASS |

## Deviations from Plan

### Auto-fixed Implementation Approaches

**1. [Rule 2 - Missing critical functionality] Base64 replacement uses full-attribute regex**
- **Found during:** Task 2 implementation
- **Issue:** Plan described a two-step approach (replace URI only, then close template literal with `"→\`}`). This approach is ambiguous and error-prone when multiple attributes exist on the same element.
- **Fix:** Used `src="(data:image\/[^"]*)"` regex to capture the full attribute, replacing the entire `src="data:..."` with `src={\`\${b}/images/${slug}/${filename}\`}` in one step. Functionally identical output.
- **Files modified:** `_scripts/ingest-artifact.mjs`
- **Commit:** 71dab1e

**2. [Rule 3 - Blocking issue] Log helpers defined before arg parsing**
- **Found during:** Task 1 implementation
- **Issue:** Plan specifies CLI FLAGS before LOG HELPERS in the code structure, but `fail()` is called during slug validation (part of CLI FLAGS). Calling undefined function would throw ReferenceError.
- **Fix:** Defined `log/ok/warn/fail` constants before arg parsing; defined `dry` (which depends on `DRY_RUN`) after `DRY_RUN` is parsed. Order: log helpers → flag()/option() helpers → DRY_RUN/flags → dry → validation. All helper copies still match import-site.mjs pattern.
- **Files modified:** `_scripts/ingest-artifact.mjs`
- **Commit:** 909eb7c

**3. [Rule 1 - Bug] Plan acceptance criteria for existingVars is inaccurate for sfdy-alt-clean**
- **Found during:** Task 1 verification
- **Issue:** Acceptance criteria says "existingVars object contains at least --bg and --accent". sfdy-alt-clean Layout.astro uses `--bg-base` (not `--bg`) and `--accent: var(--sfdy-green)`. The `--bg` artifact var has no collision because it's not in existingVars.
- **Fix:** No code change needed — the critical check (non-empty collisions array) is met via `--accent` conflict. Documented as plan inaccuracy. The collision detection logic is correct.
- **Commit:** n/a (no code change)

**4. [Rule 2 - Missing critical functionality] node_modules symlink for worktree testing**
- **Found during:** Task 1 verification
- **Issue:** The worktree at `/tmp/claude-worktrees/agent-a4854817b302efeb0/` lacks `node_modules/`. `hast-util-from-html` and `hast-util-to-html` are installed only in the main repo's `node_modules/`. Script files in the worktree directory cannot resolve these packages.
- **Fix:** Created a symlink `node_modules → /Users/pbau3r/DevWorks/Websites/WebsiteMocker/node_modules` in the worktree. This is not committed (node_modules is gitignored) and does not affect the production use of the script (which runs from the main repo where packages are installed).
- **Commit:** n/a (symlink is gitignored)

## Known Stubs

None. The script is fully implemented. The following items are intentional MVP scope boundaries:

- **publicFontsDir** created as stub directory (`sites/<slug>/public/fonts/`): reserved for future local font file support. Claude Design artifacts use Google Fonts CDN which cannot be self-hosted without downloading. CDN links are surfaced as operator instructions instead.
- **CSS url() rewriting** not implemented: Claude Design artifacts use CDN fonts and external image URLs in CSS (not local file paths). Out of scope per INGEST-05 boundary documented in must_haves.
- **@media nested CSS rules**: `extractScopedCSS` uses simple split-on-`}` approach; nested `@media { .section { } }` blocks are partially handled (inner rules extracted but outer `@media` wrapper lost). MVP accepted limitation.

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes introduced. The script reads local files and writes to `sites/<slug>/src/` and `public/`. Threat mitigations per T-05-01 and T-05-04:

- T-05-01 (slug injection): Slug validated against `/^[a-z0-9-]+$/` before any `join()`. MITIGATED.
- T-05-04 (path traversal via artifact): Artifact path always constructed as `join(ROOT,'_captures',slug,'raw','artifact.html')` — user input never used as path component. MITIGATED.

## Self-Check: PASSED

Files created:
- `/tmp/claude-worktrees/agent-a4854817b302efeb0/_scripts/ingest-artifact.mjs` — FOUND
- `/tmp/claude-worktrees/agent-a4854817b302efeb0/_captures/sfdy-alt-clean/raw/artifact.html` — FOUND

Commits:
- 909eb7c (Task 1: analyze mode + scaffold) — FOUND
- 71dab1e (Task 2: full-site write mode) — FOUND

# Phase 9: Claude Design Connectivity - Research

**Researched:** 2026-10-14
**Domain:** Node tooling + model-side DesignSync orchestration for pulling Claude Design sources into Astro sites
**Confidence:** MEDIUM (codebase facts HIGH; DesignSync/artifact behaviour is unprobed by design, that is the spike's job)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Default pull scope for a design-system project is the website-relevant set: `tokens/**`, `templates/website/**`, `ui_kits/website/**`, `components/**`, `assets/logo/**`, `assets/brand/**`. Slides, decks, proposals, guidelines and fonts are skipped by default. A site may widen or narrow this through the globs in its `design` block.
- **D-02:** `uploads/**` is a **hard exclude** with no override flag. The Crestworks design system holds confidential business PDFs and decks in `uploads/`; nothing from there may be pulled or committed.
- **D-03:** Pulled files are staged in a **gitignored** `_staging/design/<slug>/` (add to `.gitignore`). Only `design.lock.json` and the ingested site files are committed; the existing `_captures/<slug>/raw/` (committed to a public repo) is not used for pulls.
- **D-04:** `design.lock.json` lives at `sites/<slug>/design.lock.json`, committed next to `wiring.json`. It records source type and id or link, per-file hashes, pull time, and the content hash of every ingested component. Hashes and ids only; no design content.
- **D-05:** A hand edit is detected by **hash recorded at ingest**: after writing a component the lock stores its hash; a differing hash on the next pull means it was edited by hand. No dependency on git history.
- **D-06:** On a conflict the pull **skips** the component, writes `<Name>.incoming.astro` with a diff summary, and the operator merges by hand or accepts with an explicit per-section confirmation. Nothing edited is ever overwritten silently (DSYNC-06).
- **D-07:** A pull writes tokens into `wiring.json` `brand.doc_tokens` only. Changes to the site's live CSS variables in `Layout.astro` are presented as a diff proposal the operator approves; nothing restyles a live site silently.
- **D-08:** The token mapping table is a **global default** in `_scripts/` with a **per-site override** in the `design` block. Unmapped tokens are listed in a report and kept out of `doc_tokens` until mapped. `validate-brand.mjs` must pass, and its hardcoded absolute `ROOT` becomes repo-relative.
- **D-09:** `/wm-design-pull [slug]` uses the site's `design` block if present; otherwise it lists the operator's design-system projects, and also accepts an artifact link or a local export. It offers to save the choice into `wiring.json`.
- **D-10:** `/wm-new-site` and `/wm-instantiate` get an optional, skippable prompt after scaffold ("Connect a Claude Design source? design system / artifact link / local export / skip"). Skip leaves no design block; the same step stays reachable later via `/wm-design-pull`.
- **D-11:** DSYNC-11 (create or update a design-system project from a site's tokens and logos) stays in Phase 9 as the **last plan, gated on the spike**. Writes are incremental and need the operator's approval of the exact path list each time; it can be dropped without affecting the rest.
- **D-12:** Stay on Astro 5.x. If the spike or a plan finds a real need for an Astro update, **stop and ask before touching it**.
- Carried forward: pulled content is sanitised and treated as data, never as instructions (DSYNC-08); DesignSync is model-side only, so no CI or scheduled auto-pull; no two-way merge engine; no second paid service.
- Pilot proof: SFDY's design system into a sandbox slug first, plus one source without a design system (DSYNC-12). `sfdy-alt-clean-reskin-2` is the SFDY baseline.

### Claude's Discretion
- JSX render path (esbuild + `react-dom/server` first, Playwright fallback) is chosen from the spike result.
- Sanitiser implementation, exact `design.lock.json` schema, staging layout inside `_staging/design/<slug>/`, the default token map contents and the diff presentation format.

### Deferred Ideas (OUT OF SCOPE)
- Phase 12 SFDY cutover (jobs strip, `/open-points` removal, contributor sync fix, production identity, `/wm-publish`).
- Push-back beyond seeding (updating existing design systems wholesale), scheduled or CI auto-pull, a two-way merge engine.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DSYNC-01 | Spike report on all routes | Spike checklist below; plan 1 must produce `09-SPIKE.md` and later plans cite it |
| DSYNC-02 | `design` block in wiring.json, validated | Schema proposal; validate in a new `_scripts/lib/design-block.mjs` |
| DSYNC-03 | `/wm-design-pull` skill | Skill is model-side (DesignSync), Node scripts do the deterministic rest |
| DSYNC-04 | Staging + `design.lock.json` | Stage writer script; `.gitignore` gains `_staging/` |
| DSYNC-05 | Idempotent re-pull, diff, dry-run, loud failure | `design-diff` over lock hashes; size guard near cap; syntax check via esbuild/css-tree |
| DSYNC-06 | Divergence guard | Generalise Nav/Footer pattern, hash at ingest; note section mode currently has NO overwrite guard |
| DSYNC-07 | Token mapping + validate-brand | postcss/css-tree parse; default map + override; fix ROOT |
| DSYNC-08 | Sanitise | hast allowlist sanitiser on the existing hast stack |
| DSYNC-09 | Handoff to `--mode section`; JSX render | `ingest-artifact.mjs` needs an `--input` option; render path from spike |
| DSYNC-10 | new-site / instantiate prompt | Edit two skill files |
| DSYNC-11 | Seed design system | Model-side `create_project` + `finalize_plan` + `write_files`; last plan, droppable |
| DSYNC-12 | Dual-path proof | reskin-2 pull + one non-design-system source |
| DSYNC-13 | `verify-phase-09.sh` with fixtures | Fixtures dir; follow `verify-phase-08.sh` style |
</phase_requirements>

## Summary

The phase splits cleanly into a model-side layer and a deterministic Node layer. DesignSync (`list_projects`, `list_files`, `get_file` capped at 256 KiB, `finalize_plan` then `write_files`) is only callable by the model in a Claude session, so the skill must have the model fetch files and write them to `_staging/design/<slug>/` verbatim. Everything after that (hashing, size and syntax checks, diff, sanitising, token mapping, ingest, lock update) must be plain Node scripts under `_scripts/`, so the model never "helpfully" edits content and the verify harness can run on fixtures with no DesignSync. The biggest unknown is whether `get_file` returns an error or silently truncates at the cap, and whether the model relaying content is byte-exact. The spike must measure this (a known >256 KiB file, a file at about 255 KiB, a binary, a hash round trip) before the stager design is fixed. I could not probe DesignSync in this research session (no such tool available to me), so all DesignSync behaviour beyond CONTEXT.md is `[ASSUMED]`.

Existing code is a good base but has gaps the plan must close. `ingest-artifact.mjs` reads only `_captures/<slug>/raw/artifact.html` (hard-coded; conflicts with D-03) so it needs an `--input <path>` option. `writeSectionMode` writes `src/components/<Name>.astro` with no existence or hash check (verified by reading the code); only full mode protects `Nav`/`Footer`, and that check compares against the `_core` template. Section mode only extracts top-level `section|nav|footer|header|main` elements of a single HTML document and its scoped CSS extractor is split-on-`}` and warns that `@media` is not handled; both limit what a design-system `templates/website/*.html` can yield. `hast-util-from-html`/`hast-util-to-html`, `rehype*`, `parse5`, `postcss`, `css-tree`, `acorn` and `esbuild` 0.27.7 are already in `node_modules` `[VERIFIED: node_modules listing]`; `react`/`react-dom` are not. `validate-brand.mjs` passes today (111/0) but with an absolute `ROOT` `[VERIFIED: ran it]`.

**Primary recommendation:** Plan 1 is the spike and writes `09-SPIKE.md`. Plans 2-N build deterministic Node libs (`_scripts/lib/design-*.mjs`) with fixture tests first, then the skill, then the pilots, with DSYNC-11 last. Use the hast stack already present for sanitising (hand-written allowlist walker or `hast-util-sanitize`), css-tree/postcss for tokens, esbuild (already installed) for JSX syntax check and render; install `react`/`react-dom` only if the spike shows the esbuild SSR path works.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| List projects / fetch files from Claude Design | Model session (DesignSync tool) | — | Not callable from Node or CI (CONTEXT probe) |
| Write fetched bytes to staging | Model session (file write) | Node verifies | Model must write verbatim; Node recomputes hashes and sizes after |
| Hash, size cap, syntax check, diff, lock | Node scripts (`_scripts/`) | — | Deterministic, fixture-testable |
| Sanitise | Node scripts | — | Must run before ingest; never model-judged |
| Token mapping | Node scripts | `wiring.json` | Global map + per-site override |
| JSX render to static HTML | Node (esbuild + react-dom/server) | Playwright (`channel: 'chrome'`) | Choice fixed by spike |
| Section ingest | `ingest-artifact.mjs` | — | Existing tool, extended with `--input` and guard |
| Operator confirmation per section | Skill (model asks operator) | Script flag `--accept <Name>` | Script refuses without explicit flag |
| Seeding design system (DSYNC-11) | Model session (DesignSync write) | Node prepares path list | Operator approves exact list |
| Build/publish | Existing build-all / wm-publish | — | Unchanged |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node built-ins (`node:crypto`, `fs`, `path`) | Node 26.11.1 present | sha256 hashing, file IO | No dependency `[VERIFIED: node --version]` |
| `hast-util-from-html` / `hast-util-to-html` | already installed | Parse and serialise HTML for sanitise and sections | Already used by ingest `[VERIFIED: ingest imports]` |
| `esbuild` | 0.27.7 installed (latest 0.28.2) | JSX syntax check and bundle for SSR | Transitive via Astro, already present `[VERIFIED: node_modules/esbuild/package.json; npm view]` |
| `css-tree` / `postcss` | already installed | Parse `tokens/*.css` and validate CSS syntax | Present in node_modules `[VERIFIED: listing]` |
| Playwright | ^1.62.1 devDep | Fallback render for UMD/Babel-standalone pages | Chrome works via `channel: 'chrome'`; bundled browsers not installed (`~/.cache/ms-playwright` empty) `[VERIFIED: ls]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react`, `react-dom` | 19.3.0 (published 2026-10-13) | `renderToStaticMarkup` for JSX components | Only if the spike confirms the esbuild SSR path; add as root devDependencies `[VERIFIED: npm view]` |
| `hast-util-sanitize` | 5.0.2 (syntax-tree org) | Allowlist sanitiser for hast | Optional; a small hand-written allowlist walker over hast is equally acceptable and avoids a dependency |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| esbuild+SSR | Playwright-only | Use Playwright if components touch `window`/`document` or use UMD/Babel-standalone globals |
| hast-util-sanitize | Own walker | Own walker gives exact control for `<script>`, `on*`, `javascript:`, host allowlist and a removal report; recommended since a report is required |
| Check design system version of React | — | Some exports assume UMD React 18; check in spike |

**Installation (only if spike approves SSR path):**
```bash
npm install -D react@^19 react-dom@^19
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| react | npm | >10 yrs | very high | github.com/facebook/react | not run | Approved by reputation; [ASSUMED] until checked |
| react-dom | npm | >10 yrs | very high | github.com/facebook/react | not run | Same |
| hast-util-sanitize | npm | years | high | github.com/syntax-tree/hast-util-sanitize | not run | Optional, [ASSUMED] |

slopcheck 0.6.1 is installed but its CLI only supports `install` (which would install packages) and `scan`; `--json` is unsupported, so no check was run. `npm view` confirmed existence and versions only, which per protocol does not confer VERIFIED status. **Planner:** add a `checkpoint:human-verify` before `npm install -D react react-dom` (and `hast-util-sanitize` if chosen). Packages removed: none. Packages flagged SUS: none known.

## Architecture Patterns

### System Architecture Diagram

```
Operator ──> /wm-design-pull [slug]  (skill, model session)
                 │
                 ├─ site has design block? ── yes ─> read source from wiring.json
                 └─ no ─> pick: list design-system projects | artifact link | local export
                 │
   ┌─────────────┼───────────────────────────────┐
   v             v                               v
DesignSync     published artifact link        local export (zip/html/dir)
(model tool:   (fetch; spike decides how)      (Node reads directly)
 list_files,
 get_file ≤256KiB)
   │ model writes bytes verbatim                 │
   └──────────────┬──────────────────────────────┘
                  v
     _staging/design/<slug>/   (gitignored; uploads/** never written)
                  │
   Node: design-stage-check ──> size guard (>= cap-1KiB fail), binary skip report,
                  │             syntax check (css-tree / esbuild / parse5)  ── fail loudly
                  v
   Node: design-diff vs design.lock.json ──> added / changed / removed  (--dry-run stops here)
                  v
   Node: sanitise (hast allowlist) ──> removal report
                  v
   Node: tokens ──> map (global + site override) ──> brand.doc_tokens + unmapped report
                  │                                   └─ Layout.astro CSS var diff PROPOSAL only
                  v
   JSX? ──> render (esbuild+react-dom/server | Playwright) ──> static HTML
                  v
   ingest-artifact.mjs --mode section --input <staged html>
        divergence guard: current hash != lock hash ──> skip, write <Name>.incoming.astro + diff summary
                  │                                      └─ accepted only with explicit per-section flag
                  v
   sites/<slug>/src/components/*.astro  + design.lock.json updated (component hashes)
                  v
   npm run build / build-all.js <slug>
```

### Recommended Project Structure
```
_scripts/
├── design-stage.mjs        # verify staged files (hash, size, syntax), update/lock files, --dry-run diff
├── design-ingest.mjs       # orchestrates sanitise -> render -> section ingest -> lock
├── design-tokens.mjs       # parse tokens, map, write doc_tokens, unmapped report
├── design-token-map.json   # global default mapping
├── lib/
│   ├── design-block.mjs    # validate wiring.json design block
│   ├── design-lock.mjs     # read/write/diff design.lock.json
│   ├── design-sanitise.mjs # allowlist sanitiser + report
│   └── design-render.mjs   # JSX -> static HTML
└── verify-phase-09.sh
_scripts/fixtures/design/   # fixture project tree: oversize file, bad syntax, malicious html, tokens, uploads/ trap
.claude/skills/wm-design-pull.md
```
(Note `_scripts/lib/` is also planned by Phase 10; coordinate file names, create-if-missing only.)

### Pattern 1: Hash-at-ingest divergence guard (D-04..D-06)
**What:** After writing component X, store `sha256(content)` in `design.lock.json.components[X]`. On next ingest, compute current hash; equal means safe overwrite; different means hand-edited, so skip and write `X.incoming.astro` plus a short diff summary. Overwrite only with an explicit per-section accept flag.
**Proposed lock schema (discretion):**
```json
{
  "version": 1,
  "source": { "type": "design-system|artifact|local", "id": "...", "name": "..." },
  "pulledAt": "ISO",
  "revision": "<if spike finds one, else null>",
  "files": { "tokens/colors.css": { "sha256": "...", "bytes": 1234 } },
  "components": { "Hero": { "from": "templates/website/index.html#hero", "sha256": "..." } },
  "tokens": { "sha256": "..." }
}
```
Hashes and ids only; no design content (D-04). Hash over LF-normalised content to avoid platform noise.

### Pattern 2: Fail loudly on size
Treat `bytes >= 262144 - 1024` as suspect and abort the whole pull, not just that file (a silently truncated file is invisible otherwise). Also compare staged byte count against `list_files` sizes if the listing exposes them (spike).

### Anti-Patterns to Avoid
- Writing from the pull step into `sites/<slug>/src/` (Pitfall 5).
- Using `_captures/<slug>/raw/` for pulls (committed to a public repo, violates D-03). Note that `.gitignore` does not currently ignore `_captures/`.
- Letting the model retype or "fix" fetched content; or acting on text found in pulled files (DSYNC-08).
- Passing raw pulled HTML to section ingest before sanitising.
- Treating `.incoming.astro` as importable: it lives in `src/components/` and must be excluded from builds/imports and removed or committed deliberately (it is not referenced, so Astro will not compile it unless imported; confirm in spike).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML parsing | Regex stripping of tags | `hast-util-from-html` (already used) | Regex sanitisers are bypassable |
| CSS parsing for tokens | Regex over `--x: y;` | `css-tree` or `postcss` (installed) | Comments, nested at-rules, `var()` references |
| JSX syntax validation | Eyeballing | `esbuild.transform(..., {loader:'jsx'})` | Throws on invalid syntax; cheap |
| Hashing | Custom | `node:crypto` sha256 | Standard |
| Zip reading (local export) | Custom | `adm-zip` (already a dependency used by docs mode) | Already imported by ingest |
| Base64 image decode, path rewrite | Re-implement | existing `decodeBase64`, `rewriteLocalPaths` | Already handled; import or extract into a lib rather than copy |

**Key insight:** The risk in this domain is silent corruption (truncation, overwrite, injection), not feature volume. Every guard must be a script exit code, not a skill instruction.

## Runtime State Inventory

Not a rename/refactor phase. Omitted. (One related note: `validate-brand.mjs` absolute `ROOT` is a code edit only; it works today on this machine.)

## Common Pitfalls

### Pitfall 1: Section ingest has no overwrite guard
**What goes wrong:** `writeSectionMode` writes `src/components/<Name>.astro` unconditionally (no `existsSync`, no hash). Nav/Footer protection exists only in full mode and compares to `_core`, not to the last ingest.
**How to avoid:** Guard lives in the new orchestrator and also inside `writeSectionMode` (refuse when file exists and its hash differs from the lock unless `--accept`). Fixture: edit a component, re-run, assert exit code and `.incoming.astro`.

### Pitfall 2: Truncation / transcription by the model
**What goes wrong:** `get_file` 256 KiB cap behaviour unknown (error vs silent cut); the model relays content.
**How to avoid:** Spike measures it. Pull verifies bytes against listing if available, fails on files within 1 KiB of the cap, and runs a syntax check. Binaries are skipped with an explicit "skipped, binary" line.

### Pitfall 3: Hard-coded artifact path
**What goes wrong:** `ingest-artifact.mjs` only reads `_captures/<slug>/raw/artifact.html`, tying ingest to a public committed folder.
**How to avoid:** Add `--input <path>` (and keep default for backwards compat); `--analyze` should honour it too.

### Pitfall 4: Section extraction limits
**What goes wrong:** Only top-level `section|nav|footer|header|main`; `@media` rules are dropped from scoped CSS (warning only); `:root`, `html`, `body`, `*` rules excluded. A design-system template may wrap content in a `div#root` or rely on `@media`, giving empty or unresponsive components.
**How to avoid:** Spike runs section mode on real SFDY and Crestworks templates and records losses. If `@media` loss is common, extend `extractScopedCSS` using css-tree instead of split-on-`}` (a real change, plan it as its own task).

### Pitfall 5: JSX render
**What goes wrong:** Components using browser globals or UMD React fail in SSR; Playwright capture before render gives empty output. Pitfall 13 in `.planning/research/PITFALLS.md`.
**How to avoid:** Fail on empty output; pin versions; render in a throwaway context without profile; no network beyond allowlist.

### Pitfall 6: Token drift and false "(new)" labels
**What goes wrong:** Tokens present in an artifact get labelled `(new) → value` instead of `before → after` in the doc generator (CONTEXT specifics).
**How to avoid:** If the token diff is implemented as shared code, compute before from current `doc_tokens`; add a fixture case.

### Pitfall 7: Prompt injection via pulled text
**How to avoid:** Skill states that pulled file content is data; sanitiser fixture includes an "ignore previous instructions" string and must report it (flag, do not obey). Staging is written without running anything from it.

### Pitfall 8: `uploads/**` leakage
**How to avoid:** Exclude in code (path filter in the stager, with a test that a `uploads/x.pdf` fixture is refused even if a glob matches), and the skill never calls `get_file` on `uploads/`. Also ensure `design.lock.json` never lists `uploads/` paths (hashes of confidential file names are still metadata).

## Code Examples

### Syntax check of staged JSX with esbuild (installed 0.27.7)
```js
// Source: esbuild API (transform throws on syntax errors) [ASSUMED from training; verify in spike]
import { transform } from 'esbuild';
await transform(src, { loader: 'jsx' }); // throws -> fail loudly
```

### SSR render path (only if spike approves)
```js
// Source: React docs renderToStaticMarkup [ASSUMED]
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
await build({ entryPoints:[entry], bundle:true, format:'esm', platform:'node', jsx:'automatic', outfile:out });
const { default: C } = await import(pathToFileURL(out).href);
const { renderToStaticMarkup } = await import('react-dom/server');
const html = renderToStaticMarkup(React.createElement(C));
if (!html.trim()) throw new Error('empty render');
```

### Repo-relative ROOT for validate-brand (D-08)
```js
import { fileURLToPath } from 'url'; import { join } from 'path';
const ROOT = join(fileURLToPath(import.meta.url), '..', '..'); // same pattern as ingest-artifact.mjs
```

### design block (DSYNC-02) proposal
```json
"design": {
  "source": "design-system",
  "project_id": "baa6f65c-d546-41fc-b2bd-d81d7c6da089",
  "name": "Starflight Dynamics Design System",
  "globs": ["tokens/**", "templates/website/**", "ui_kits/website/**", "components/**", "assets/logo/**", "assets/brand/**"],
  "tokenMap": { "--color-accent": "--accent" }
}
```
`artifact`: `{ "source": "artifact", "url": "..." }`; `local`: `{ "source": "local", "path": "..." }`. Validation: known source, required field per source, `project_id` UUID shape, globs must not match `uploads/**` (reject, D-02), `local.path` must exist.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Drag-and-drop artifact into `_captures/<slug>/raw/` | Staged pull + lock + guard | This phase | Removes manual step and silent overwrite |
| Astro 5.18.2 installed (7.3.8 latest) | Stay on 5.x | D-12 | Do not touch without asking `[CITED: STACK.md npm view 2026-10-14]` |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `get_file` at the cap errors or truncates (unknown which); model relay may not be byte-exact | Summary, Pitfalls | Whole stager design changes; spike must resolve |
| A2 | `list_files` may not expose sizes, hashes or revision | Lock schema | Integrity check falls back to syntax check + 1 KiB cap rule |
| A3 | A published-artifact link may not be fetchable server-side (auth, JS-rendered) | Architecture | Artifact route may degrade to "paste/export" only |
| A4 | esbuild transform/SSR snippets work as written with 0.27.7 and React 19 | Code Examples | Minor; verify in spike |
| A5 | Binaries unsupported via `get_file` | Pitfalls | Logos (`assets/logo/**`, likely SVG/PNG) may not be pullable; asset step may need manual placement; DSYNC-11 logo seeding may be descoped |
| A6 | `.incoming.astro` files in `src/components/` are not compiled unless imported | Anti-patterns | Build could fail if Astro picks them up; check in a fixture build |
| A7 | react, react-dom, hast-util-sanitize are legitimate (slopcheck not run) | Package audit | Low; human-verify checkpoint |
| A8 | DesignSync `create_project`/`write_files` semantics for DSYNC-11 (incremental, project type) | DSYNC-11 | Plan 9-last may be descoped |

## Open Questions

1. **Does `get_file` truncate or error at 256 KiB, and is relay byte-exact?**
   - Unclear until probed. Recommendation: spike with a large file plus sha256 round trip (model writes file, Node hashes, compare with a hash computed from a second `get_file` of the same file, or against a known fixture the operator provides).
2. **Does the SFDY design system contain website templates/UI kit with `index.html`, or only JSX components?** Determines whether JSX render is needed for the pilot. Recommendation: `list_files` on `baa6f65c-...` in the spike and record the tree.
3. **What does a published artifact link return to a non-browser fetch?** Recommendation: spike with WebFetch/curl on a real link; if gated, route is "local export or paste".
4. **Is there any revision identifier on projects/files?** Needed for stale-pull detection (Pitfall 14). Fall back to pull time + per-file hashes.
5. **Which sandbox slug has an artifact-only source for DSYNC-12's second path?** Operator decision; propose a new throwaway sandbox slug or `levion` (template) to avoid touching a live site.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | all scripts | yes | 26.11.1 | — |
| esbuild | JSX check/render | yes (transitive) | 0.27.7 | add explicit devDep |
| react / react-dom | SSR render | no | — | Playwright render, or install (human-verify) |
| Playwright bundled Chromium | render fallback | no (cache empty) | — | `channel: 'chrome'`; Google Chrome app present `[VERIFIED: ls /Applications]` |
| DesignSync tool | pull, DSYNC-11 | model-side only | — | Local export / artifact routes; fixtures for tests |
| slopcheck | package audit | yes, 0.6.1, no JSON mode | — | manual verify |

**Missing with no fallback:** none. DesignSync is unavailable to scripts by design; the verify harness uses fixtures.

## Validation Architecture

Skipped: `workflow.nyquist_validation` is `false` in `.planning/config.json`. DSYNC-13 still requires `_scripts/verify-phase-09.sh` (fixture-based, follow `verify-phase-08.sh` style); its minimum cases are: oversize file fails, invalid-syntax file fails, `uploads/` refused, re-pull idempotent (no changes reported), changed/added/removed reported, `--dry-run` writes nothing, hand-edited component skipped with `.incoming.astro`, malicious fixture neutralised and reported (script, `on*`, `javascript:`, unknown host, injection string), token mapping with unmapped report, `validate-brand.mjs` passes, design block validation rejects bad blocks. Quick command: `bash _scripts/verify-phase-09.sh`.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Allowlist sanitiser on hast; schema validation of `design` block; path normalisation to block traversal (`..`, absolute paths, symlinks) when staging and reading local zips |
| V6 Cryptography | minor | `node:crypto` sha256 only |
| V12 Files/Resources | yes | Size cap, `uploads/**` hard exclude, zip-slip protection for local export (check `adm-zip` entry paths) |
| V14 Config | yes | `_staging/` gitignored; lock holds no content |
| V2/V3/V4 | no | No auth surface added |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stored XSS / third-party script in pulled HTML | Tampering | Strip `<script>`, `on*`, `javascript:`, `<iframe>`, form actions to unknown hosts; host allowlist (font CDNs); removal report |
| Prompt injection in pulled text | Elevation | Data-only rule in skill; deterministic scripts downstream; flag instruction-like strings in report |
| Confidential file leakage (`uploads/`) | Information disclosure | Code-level exclude, tested; staging gitignored |
| Path traversal / zip-slip in file names | Tampering | Resolve and confirm path stays inside staging root |
| Silent overwrite of hand edits | Tampering | Hash guard, `.incoming.astro` |
| Secrets echoed | Info disclosure | Never print vault/token values (existing rule) |

## Sources

### Primary (HIGH confidence)
- Codebase read this session: `_scripts/ingest-artifact.mjs`, `_scripts/validate-brand.mjs`, `.planning/research/PITFALLS.md`, `.planning/research/STACK.md` (references), `package.json`, `node_modules` listings, `sites/sfdy-alt-clean-reskin-2/wiring.json`, `.gitignore`
- `npm view` (2026-10-14): react 19.3.0, react-dom 19.3.0, hast-util-sanitize 5.0.2, esbuild 0.28.2

### Secondary (MEDIUM)
- `.planning/phases/09-claude-design-connectivity/09-CONTEXT.md` probe results for DesignSync (not re-probed)

### Tertiary (LOW)
- Training knowledge for esbuild/React SSR snippets (A4); no Context7 lookups were done

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM-HIGH, local state verified; render path pending spike
- Architecture: MEDIUM, driven by locked decisions; DesignSync behaviours unverified
- Pitfalls: MEDIUM, codebase-derived ones HIGH (section mode lacks guard, hard-coded artifact path)

**Research date:** 2026-10-14
**Valid until:** 2026-11-14 (or earlier once the spike report exists, which supersedes the DesignSync assumptions)

## Project Constraints (from CLAUDE.md)

- Skill-first: each capability gets a `/wm-*` skill at `.claude/skills/` (framework level, not copied per site); scripts are helpers.
- Per-site config in `wiring.json`; keep it accurate; sites with no `design` block have no connection.
- Sandbox repo is public: commit only finished site files, leave unrelated work uncommitted (the working tree currently has much unrelated uncommitted work, so stage paths explicitly, never `git add -A`).
- Template sites do not advance past Stage 2; archived/template/docs-only sites excluded from perf tracking; never pick a live site for pilot experiments.
- Never copy or print vault values (`github::token_sfdy`).
- Astro stays on 5.x (D-12); no second paid service.
- Memory note: execute phases run in Codex, which reads `AGENTS.md`, not `CLAUDE.md`; plans should state constraints inline in task text.

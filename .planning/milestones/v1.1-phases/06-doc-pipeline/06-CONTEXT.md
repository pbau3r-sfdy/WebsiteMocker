# Phase 6: Doc Pipeline — Context

**Gathered:** 2026-08-24
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers a standalone HTML document generation pipeline that does NOT require an Astro build. It has three parts:

1. **Script extension** — `ingest-artifact.mjs --mode docs` handles bare HTML files and `.zip` exports; it injects brand tokens from `wiring.json`, produces a single self-contained HTML file, and optionally exports a GFM Markdown version (`--format md`).
2. **Direct publish** — a `gh api` PUT commits the generated file to `docs/<name>.html` in the target production repo (no PR, no CI trigger).
3. **Operator skill** — `/wm-gen-docs <slug>` wraps the full flow: artifact staging → brand injection → confirm summary → `gh api` commit.

**What this phase does NOT do:** Astro site builds, Wayback/archive work (Phase 7), crestworks content or token fixes (Phase 8).

</domain>

<decisions>
## Implementation Decisions

### Brand Token Injection

- **D-01:** Brand token injection uses a new `brand.doc_tokens` field in `wiring.json` — a flat object mapping CSS custom property names to override values (e.g. `{ "--accent": "#00FB92", "--bg": "#0d0d0d" }`). The script reads this map and overwrites matching vars in the artifact's `:root {}` block before serialising.
- **D-02:** If `brand.doc_tokens` is absent or empty in `wiring.json`, the script warns the operator and prints the site's existing `Layout.astro :root` vars as suggestions. It does NOT fall back to `accent`-only injection silently — the operator must add the field first.
- **D-03:** The operator re-wires all four active sites (sfdy-alt-clean, mogwai-systems, parrot-capital, crestworks) by adding `brand.doc_tokens` to each `wiring.json`. This is a pre-use operator task, not automated by the script. Values are copied from each site's `Layout.astro :root {}`.

### Zip Entry Detection

- **D-04:** When a `.zip` is found in `_captures/<slug>/raw/`, the script unpacks it to a temp directory and selects the entry HTML as follows:
  - If exactly one `.html` file exists anywhere in the unpacked zip → use it automatically.
  - If multiple `.html` files exist → print a numbered list and pause for the operator to pick one by number before proceeding.
  - If no `.html` file is found → fail with a clear error.
- **D-05:** The unpacked zip contents are written to `_captures/<slug>/raw/extracted/` (not the zip root) to avoid collisions with manually placed `artifact.html`.

### Skill UX — Confirm Before Push

- **D-06:** `/wm-gen-docs` pauses before the `gh api` commit and shows a confirm summary. The operator must type `y` to proceed. The summary includes all four items:
  - Brand tokens injected: before → after values (one line per var)
  - Output file size: `docs/<name>.html: <N> KB`
  - Target repo + path: `pbau3r-sfdy/<repo> → docs/<name>.html`
  - GFM export size (only shown when `--format md` is passed): `docs/<name>.md: <N> KB`
- **D-07:** This confirm step is MANDATORY — it cannot be bypassed in the skill. (A `--force` flag for scripting/CI is Claude's discretion.)

### Doc Naming — One per Repo or Named Docs

- **D-08:** Default invocation (no `--name`) writes to `docs/index.html` — the canonical single doc per repo. Each run overwrites the previous.
- **D-09:** `--name <slug>` writes to `docs/<slug>.html` alongside `docs/index.html`. This allows multiple distinct documents per repo (e.g. a repo could have `docs/index.html` and `docs/api-guide.html`).
- **D-10:** The `--name` value must match `^[a-z0-9-]+$` (validated before any file write). The GFM export (`--format md`) writes `docs/<name>.md` using the same name.

### Claude's Discretion

- Whether `--force` flag is added to skip the confirm step (useful for scripting). Recommended: yes, but not in the skill — only in the underlying script.
- Exact temp directory cleanup strategy after zip extraction (recommend: clean up `extracted/` after successful processing, leave on failure for debugging).
- Whether `ingest-artifact.mjs --mode docs` and the existing `--mode full` / `--mode section` share HTML parsing helpers (they should — `extractStyleCSS`, `extractCSSVars` are already reusable).
- Whether the GFM conversion uses a library (e.g. `turndown`) or a simple strip-tags approach. Recommend: `turndown` via npm (already a Node ESM environment), but Claude decides.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing script to extend

- `_scripts/ingest-artifact.mjs` — 682-line script with `--mode full` and `--mode section`. The `--mode docs` flag is added here. Key helpers to reuse: `extractCSSVars()`, `extractStyleCSS()`, `extractGoogleFontsLinks()`, `readJSON()`. **Read fully before planning the docs mode extension.**

### Skill to create (reference existing skills for conventions)

- `.claude/skills/wm-ingest.md` — Closest existing skill. `/wm-gen-docs` follows the same validate → stage → analyze → confirm → commit pattern. **Read before writing the new skill.**
- `.claude/skills/wm-publish.md` — Reference for `gh api` call pattern, PAT usage, and wiring.json validation steps.

### Data model and brand tokens

- `sites/sfdy-alt-clean/wiring.json` — Reference wiring.json. `brand.doc_tokens` is a new field to be added to the `brand` block. Other active sites follow the same shape.
- `.planning/REQUIREMENTS.md` — DOCS-01 through DOCS-06 requirements. **All six must be satisfied.**
- `.planning/PROJECT.md` — Key decisions table and constraints (GitHub Pages only, skills-first, no auto-publish).

### CI/CD and gh CLI patterns

- `.github/workflows/publish.yml` — Reference for `gh api` usage, WM_PUBLISH_PAT secret, and cross-repo push patterns. The `gh api` PUT call in this phase follows the same auth approach.
- `.github/workflows/deploy.yml` — Reference for pinned action versions.

### Project conventions

- `CLAUDE.md` — Site ownership table (`prod_repo` per slug), skill quick-reference, production deployment model.
- `_scripts/build-all.js` — Reference for script conventions (`run()`, `readJSON()`, `fail()` patterns) used in all `_scripts/*.mjs` files.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `extractCSSVars(cssText)` in `ingest-artifact.mjs:99` — Returns a `Map<string, string>` of `--name → value` from a CSS string. Use this to parse the artifact `:root {}` block and apply `doc_tokens` overrides.
- `extractStyleCSS(htmlString)` in `ingest-artifact.mjs:148` — Concatenates all `<style>` text content. Use this to extract the `:root {}` block for token injection.
- `readJSON(p)` in `ingest-artifact.mjs:93` — Silent fallback for missing/malformed JSON. Use to read `wiring.json`.
- `flag(name)` / `option(name)` helpers in `ingest-artifact.mjs` — CLI arg parsing pattern. Reuse for `--mode docs`, `--name`, `--format`, `--target-repo` flags.

### Established Patterns

- **Script header convention** — every `_scripts/*.mjs` begins with a JSDoc block: what the script does, usage examples, what it reads/writes. `ingest-artifact.mjs` header is the model.
- **`existsSync` guard before all file reads** — no throwing on missing files.
- **`process.exit(1)` with `console.error(...)` for hard CLI failures** — e.g. `fail()` helper pattern.
- **Section divider comments** — `// ── Section Name ──────────────────` style used throughout.
- **`wiring.json` as source of truth** — all scripts read it via `readJSON(join(ROOT, 'sites', slug, 'wiring.json'))`. The new `brand.doc_tokens` field follows the same access pattern.

### Integration Points

- `ingest-artifact.mjs` CLI arg parsing at top of file — `--mode docs` is added alongside existing `--mode full` and `--mode section` handling.
- `wiring.json` `brand` block — `doc_tokens` is a new optional nested object under the existing `brand` field.
- `gh api` PUT endpoint: `repos/{owner}/{repo}/contents/docs/{name}.html` — same pattern used in `publish.yml` for the `gh-pages` push.

### Known Pitfalls to Avoid

- The existing `ingest-artifact.mjs` fails hard if `sites/<slug>/` does not exist. The `--mode docs` path should be consistent: validate slug → find wiring.json → check `brand.doc_tokens` before touching any file.
- `gh api` requires the file to be base64-encoded in the request body. For updates (file already exists), the `sha` of the existing file must be fetched first via `gh api GET` before the `PUT`.
- `ingest-artifact.mjs` already handles both bare HTML and zip in DOCS-01 — the `--mode docs` implementation should integrate zip detection at the same level as the current mode dispatch, not as a separate script.

</code_context>

<specifics>
## Specific Ideas

- The `/wm-gen-docs` confirm summary format should match `/wm-ingest`'s collision report style — operator already knows the UX, consistent experience.
- The `brand.doc_tokens` warning (when field is absent) should print the site's existing `Layout.astro :root` vars as a copy-paste suggestion, so the operator knows exactly what to add.
- Multiple docs per repo (using `--name`) is the primary motivation for `--target-repo` on non-WebsiteMocker repos like Raise Engine and Inbox Curer.

</specifics>

<deferred>
## Deferred Ideas

- Re-wiring session for all four active sites (adding `brand.doc_tokens` to wiring.json) — operator task after Phase 6 ships; not WebsiteMocker implementation work.
- `--force` flag to skip the confirm step in the skill — Claude's discretion whether to add it to the underlying script for CI use.
- Full Internet Archive search beyond CDX by domain — Phase 7 scope (ARCH-01).
- GFM export to GitHub Wiki targets (separate from `docs/` folder) — out of scope for Phase 6; DOCS-06 targets the same `docs/` folder as the HTML.

</deferred>

---

*Phase: 06-doc-pipeline*
*Context gathered: 2026-08-24 via discuss-phase conversation*

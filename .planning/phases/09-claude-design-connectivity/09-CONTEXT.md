# Phase 9: Claude Design Connectivity - Context

**Gathered:** 2026-10-14
**Status:** Ready for planning

<domain>
## Phase Boundary

An operator can feed any site (existing, new or revamp) from a Claude Design design-system project, a published-artifact link or a local export, ad hoc and without drag-and-drop, and without silently overwriting hand-edited sections. The connection is optional per site (a `design` block in `wiring.json`; no block, no connection). The first plan is a gating spike (DSYNC-01) that fixes the scope of DSYNC-03..12.

Requirements: DSYNC-01..13 (see `.planning/REQUIREMENTS.md`). Not in this phase: analytics (Phase 10), drops (Phase 11), the SFDY cutover (new Phase 12, see Deferred).

</domain>

<decisions>
## Implementation Decisions

### What gets pulled
- **D-01:** Default pull scope for a design-system project is the website-relevant set: `tokens/**`, `templates/website/**`, `ui_kits/website/**`, `components/**`, `assets/logo/**`, `assets/brand/**`. Slides, decks, proposals, guidelines and fonts are skipped by default. A site may widen or narrow this through the globs in its `design` block.
- **D-02:** `uploads/**` is a **hard exclude** with no override flag. The Crestworks design system holds confidential business PDFs and decks in `uploads/`; nothing from there may be pulled or committed.
- **D-03:** Pulled files are staged in a **gitignored** `_staging/design/<slug>/` (add to `.gitignore`). Only `design.lock.json` and the ingested site files are committed; the existing `_captures/<slug>/raw/` (committed to a public repo) is not used for pulls.

### Lock file and protecting hand edits
- **D-04:** `design.lock.json` lives at `sites/<slug>/design.lock.json`, committed next to `wiring.json`. It records source type and id or link, per-file hashes, pull time, and the content hash of every ingested component. Hashes and ids only; no design content.
- **D-05:** A hand edit is detected by **hash recorded at ingest**: after writing a component the lock stores its hash; a differing hash on the next pull means it was edited by hand. No dependency on git history.
- **D-06:** On a conflict the pull **skips** the component, writes `<Name>.incoming.astro` with a diff summary, and the operator merges by hand or accepts with an explicit per-section confirmation. Nothing edited is ever overwritten silently (DSYNC-06).

### Tokens
- **D-07:** A pull writes tokens into `wiring.json` `brand.doc_tokens` only. Changes to the site's live CSS variables in `Layout.astro` are presented as a diff proposal the operator approves; nothing restyles a live site silently.
- **D-08:** The token mapping table is a **global default** in `_scripts/` with a **per-site override** in the `design` block. Unmapped tokens are listed in a report and kept out of `doc_tokens` until mapped. `validate-brand.mjs` must pass, and its hardcoded absolute `ROOT` becomes repo-relative.

### Ad hoc use and new sites
- **D-09:** `/wm-design-pull [slug]` uses the site's `design` block if present; otherwise it lists the operator's design-system projects, and also accepts an artifact link or a local export. It offers to save the choice into `wiring.json`.
- **D-10:** `/wm-new-site` and `/wm-instantiate` get an optional, skippable prompt after scaffold ("Connect a Claude Design source? design system / artifact link / local export / skip"). Skip leaves no design block; the same step stays reachable later via `/wm-design-pull`.

### Seeding and Astro
- **D-11:** DSYNC-11 (create or update a design-system project from a site's tokens and logos) stays in Phase 9 as the **last plan, gated on the spike**. Writes are incremental and need the operator's approval of the exact path list each time; it can be dropped without affecting the rest.
- **D-12:** Stay on Astro 5.x. If the spike or a plan finds a real need for an Astro update, **stop and ask before touching it**.

### Carried forward (already decided, not re-asked)
- Pulled content is sanitised and treated as data, never as instructions (DSYNC-08); DesignSync is model-side only, so there is no CI or scheduled auto-pull; no two-way merge engine; no second paid service (REQUIREMENTS.md, Out of Scope).
- Pilot proof: SFDY's design system into a sandbox slug first, plus one source without a design system (DSYNC-12). `sfdy-alt-clean-reskin-2` is the SFDY baseline; the old SFDY slugs are archived.

### Claude's Discretion
- JSX render path (esbuild + `react-dom/server` first, Playwright fallback) is chosen from the spike result.
- Sanitiser implementation, exact `design.lock.json` schema, staging layout inside `_staging/design/<slug>/`, the default token map contents and the diff presentation format.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and decisions
- `.planning/ROADMAP.md` (Phase 9 section) — goal and five success criteria
- `.planning/REQUIREMENTS.md` — DSYNC-01..13, Out of Scope table, Notes
- `.planning/PROJECT.md` — milestone goal and constraints (no second paid service, GitHub Pages only)

### Research
- `.planning/research/SUMMARY.md` — open decisions and Phase 9 research flags
- `.planning/research/STACK.md` — esbuild/react-dom render path, Playwright (`channel: 'chrome'`), Astro 5.x pin
- `.planning/research/ARCHITECTURE.md` — code placement (`_scripts/`), staging via DesignSync then deterministic Node, `validate-brand.mjs` hardcoded ROOT
- `.planning/research/PITFALLS.md` — Phase 9 pitfalls (overwriting hand edits, truncation near the cap, untrusted pulled content, token drift, stale pulls)
- `.planning/research/FEATURES.md` — table stakes vs differentiators for design sync

### Existing code to extend
- `_scripts/ingest-artifact.mjs` — `--mode section` (`extractSections`, `writeSectionMode`; never writes `src/pages/`; Nav/Footer overwrite protection pattern), `rewriteLocalPaths`, base64 image decode, `--mode docs` token injection
- `_scripts/validate-brand.mjs` — brand/doc_tokens validation; fix absolute `ROOT`
- `.claude/skills/wm-ingest.md` — current ingest flow (stage artifact, analyze, collision report, ingest)
- `.claude/skills/wm-gen-docs.md` — consumer of `brand.doc_tokens`
- `.claude/skills/wm-new-site.md`, `.claude/skills/wm-instantiate.md` — skills that get the optional design step
- `CLAUDE.md` — site categories, wiring.json conventions, skills table

### External access (probe results, 2026-10-14)
- `DesignSync` model tool: `list_projects`, `list_files`, `get_file` (256 KiB cap), `finalize_plan` then `write_files`; design-system projects only; not callable from Node or CI. Writable projects found: Crestworks Design System (`bd45a807-750e-4a15-b58c-106b0194bed7`), Starflight Dynamics Design System (`baa6f65c-d546-41fc-b2bd-d81d7c6da089`), Levion Materials Design System (`3d6c0eba-12f2-485c-ba39-eefe14d67ef1`).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ingest-artifact.mjs` section mode: component extraction, scoped CSS, local path rewriting, base64 image decoding into `public/images/<slug>/`.
- Nav/Footer overwrite protection in section mode: the pattern to generalise into the divergence guard.
- `brand.doc_tokens` in `wiring.json` and the doc-token injection in `--mode docs`.
- Playwright is a devDependency; Chrome works via `channel: 'chrome'`, but the bundled browsers are not installed on this machine.

### Established Patterns
- Skill-first: every capability gets a `/wm-*` skill; scripts are orchestration helpers.
- Per-site config lives in `wiring.json`; integrations read it (see `_scripts/plausible.mjs`).
- Harnesses are `_scripts/verify-phase-NN.sh`; Phase 9 adds a fixture-based one that never calls DesignSync.
- `_core` is a copy template; the new skills and scripts live at framework level, not copied per site.

### Integration Points
- `wiring.json` gets an optional `design` block (`source`, `project_id` or link or path, `globs`, token-map override).
- `.gitignore` gains `_staging/`.
- `/wm-new-site` and `/wm-instantiate` gain the optional connection step.
- `_scripts/validate-brand.mjs` is extended for the token mapping.

</code_context>

<specifics>
## Specific Ideas

- Crestworks design-system layout (from the probe): `tokens/*.css`, `components/{brand,core,forms,navigation}/*.jsx` with `.prompt.md` and `.d.ts`, `templates/{website,deck,proposal}/`, `ui_kits/{website,documents}/` (including `index.html`), `slides/`, `guidelines/`, `assets/`, `uploads/` (confidential, excluded).
- The earlier Phase 6 observation: the doc generator labels tokens already present in an artifact as `(new) → value` instead of `before → after`; worth fixing if the token diff code is shared.

</specifics>

<deferred>
## Deferred Ideas

- **Phase 12: SFDY cutover** (to be added to the roadmap): strip jobs from `sfdy-alt-clean-reskin-2`, remove the internal `/open-points` page, fix the contributor sync (the production repo's `content-ci.yml` dispatches slug `sfdy-alt-clean`; its `content/jobs/` folder becomes unused), give `reskin-2` the production `prod_repo`/`domain`, then `/wm-publish`. Cutover does not wait on analytics.
- Push-back beyond seeding (updating existing design systems wholesale), scheduled or CI auto-pull, a two-way merge engine: out of scope for this milestone.

</deferred>

---

*Phase: 9-Claude Design Connectivity*
*Context gathered: 2026-10-14*

---
phase: 09-claude-design-connectivity
verified: 2026-10-14T13:00:00Z
status: human_needed
score: 5/5 roadmap criteria verified (criteria 2 and 5 with wording deviations accepted via SD-04); 12/13 DSYNC requirements satisfied, DSYNC-11 built with live run deferred
overrides_applied: 0
gaps: []
human_verification:
  - test: "Run /wm-design-seed once against a real design-system project (new project, operator-approved path list, create_project / finalize_plan / write_files, then list_files comparison)"
    expected: "Project is created or updated incrementally with only the approved paths; list_files matches the bundle"
    why_human: "Live DesignSync call with operator approval; deliberately deferred by the operator in plan 09-09 Task 3. No DesignSync write was made."
  - test: "Run /wm-design-pull interactively on a site with and without a design block"
    expected: "Project listing and pick, offer to remember choice, inbox-zip prompt when no design system"
    why_human: "Interactive skill flow (model-driven DesignSync relay) cannot be exercised by scripts; scripts underneath are fixture-tested."
---

# Phase 9: Claude Design Connectivity Verification Report

**Phase Goal:** Operator can feed any site (existing, new or revamp) from a Claude Design design system, a published-artifact link or a local export, without drag-and-drop and without silently overwriting hand-edited sections.
**Status:** human_needed (no blocking gaps)
**Re-verification:** No, initial verification

## Roadmap vs confirmed-decision differences

- **SD-04 drops the published-artifact link route.** A shared link returns HTTP 403 to curl/WebFetch and the logged-in browser route yields visible text only (sandboxed iframe). The goal text and criteria 2 and 5 mention "artifact link"; the operator-confirmed decision (2026-10-14, SD-01..SD-11) replaces it with local export (zip in `_staging/design/inbox/`, HTML/PDF export). Criterion 5 explicitly allows "artifact link or local export", so it is satisfied by the local export. Criterion 2 and DSYNC-02/03 still list `artifact` as a source; the validator accepts it but there is no scripted fetch. Judged an accepted, evidence-backed narrowing, not a gap. Recommendation: reword ROADMAP goal/SC2 and DSYNC-02/03 to "local export".
- SD-11 (DESIGN.md / DESIGNER.md markers) adds scope beyond the roadmap; verified present.

## Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Spike report documents every route; later plans follow it | VERIFIED | `09-SPIKE.md` has DesignSync, Published Artifact Link, Local Export, JSX Render, Section Merge sections; SD-01..SD-11 confirmed; later work follows them (SD-05 inbox, SD-06 esbuild + react-dom/server in `node --permission` child, SD-07 css-tree extraction, SD-11 markers) |
| 2 | `/wm-design-pull [slug]` with design block or interactive pick; no block = no connection | VERIFIED (artifact-link wording per SD-04) | `.claude/skills/wm-design-pull.md` exists; `design-connect.mjs sfdy-alt-clean-reskin-2 --check` prints "design block OK (design-system)"; harness covers block validation; interactive flow routed to human item 2 |
| 3 | Staging in gitignored folder, `design.lock.json`, re-pull diff with dry-run, loud failure on oversized/invalid | VERIFIED | `git check-ignore _staging` matches; `git ls-files _staging` empty; both lock files committed with per-file sha256/bytes; harness 94/94 includes staging, diff, dry-run, size-cap and syntax failure sections |
| 4 | Ingest refuses to overwrite hand-edited sections without per-section confirm; sanitised; tokens into `brand.doc_tokens` with unmapped report; validate-brand passes | VERIFIED | Harness: hand-edited Hero exits 3 and stays byte-identical, `.incoming.astro` written, `--accept Hero` required, untracked pre-existing component exits 3; components free of `<script`/`onclick`; unmapped names absent from doc_tokens, report JSON; `validate-brand.mjs` 114 passed, 0 failed, no hardcoded home path |
| 5 | Both paths proven on real sites; both build; verify-phase-09.sh passes on fixtures | VERIFIED | design-system lock in `sites/sfdy-alt-clean-reskin-2/design.lock.json` (project "Starflight Dynamics Design System", 10 files); local-export lock in `sites/design-pilot/design.lock.json` (TELEX zip, `source.type: local`); both `build-all.js` runs complete; `verify-phase-09.sh all` 94 passed, 0 failed |

**Score:** 5/5

## Commands run

| Command | Result |
|---------|--------|
| `bash _scripts/verify-phase-09.sh all` | 94 passed, 0 failed, exit 0 |
| `node _scripts/design-connect.mjs sfdy-alt-clean-reskin-2 --check` | design block OK (design-system), exit 0 |
| `node _scripts/build-all.js sfdy-alt-clean-reskin-2` | Build complete |
| `node _scripts/build-all.js design-pilot` | Build complete |
| `node _scripts/validate-brand.mjs` | 114 passed, 0 failed |
| `bash _scripts/verify-phase-05.sh` | 41 passed, 0 failed (no regression) |
| `git ls-files _staging` | empty |
| grep `uploads/` in all `design.lock.json` | no matches |
| UUID grep in `DESIGN.md` (2 sites) and root `DESIGNER.md` | 0 matches each |

Note: the project id UUID appears in `wiring.json` and the lock (machine-readable, by SD-11 design), not in the public-safe markers.

## Requirements Coverage

| Req | Status | Evidence |
|-----|--------|----------|
| DSYNC-01 | SATISFIED (bookkeeping) | Spike report complete and operator-confirmed. REQUIREMENTS.md still shows the checkbox unticked and traceability "Pending"; should be set to Complete |
| DSYNC-02 | SATISFIED | `design-connect.mjs --check`; design block in wiring.json |
| DSYNC-03 | SATISFIED (see SD-04) | Skill exists; interactive part is human item |
| DSYNC-04 | SATISFIED | gitignored `_staging`, committed locks |
| DSYNC-05 | SATISFIED | Harness fixtures |
| DSYNC-06 | SATISFIED | Divergence guard fixtures (exit 3, `--accept`) |
| DSYNC-07 | SATISFIED | Token mapping, validate-brand repo-relative |
| DSYNC-08 | SATISFIED | Sanitiser output checked |
| DSYNC-09 | SATISFIED | Ingest sections plus JSX render (Card.jsx renders, Evil.jsx refused, Empty.jsx throws) |
| DSYNC-10 | SATISFIED | `/wm-new-site` and `/wm-instantiate` step per 09-06 (not re-read in depth) |
| DSYNC-11 | BUILT, LIVE RUN DEFERRED | `_scripts/design-seed.mjs` and `.claude/skills/wm-design-seed.md` exist, fixture-tested; no DesignSync write performed (operator decision, 09-09 Task 3). Not a failure; reported as human item 1 |
| DSYNC-12 | SATISFIED | Both pilots, both build |
| DSYNC-13 | SATISFIED | Harness 94/94 |

No orphaned requirements.

## Pilot deviations considered

- Pilot 1 used narrow globs (10 files vs about 60): acceptable for capability proof; records that Beam.jsx/Button.jsx have named exports only so the renderer (default exports) did not render them. Known limitation, not a blocker.
- Pilot commits are local, not pushed to the public sandbox, by operator decision (design import is a capability test). Build proof stands without deploy; no deploy-run evidence exists.
- Pilot 2 used a real TELEX zip export; it exposed and fixed two real defects (oversized binaries failing whole zip, duplicate section names). Only page 1 ingested, deliberately, to keep contact details out of the public repo. Broken images remain until placed manually.
- Hand-made Nav/Footer preserved byte-identical by the guard in pilot 1; proposed `--accept` of Layout `--accent` change declined.

## Anti-Patterns

Not exhaustively scanned for TODO/FIXME across all Phase 9 files beyond the harness; no stubs surfaced in any run. Warning only: REQUIREMENTS.md DSYNC-01 and ROADMAP phase status/checkbox for 09-09 and phase line remain unticked (orchestrator-owned bookkeeping).

## Gaps Summary

No blocking gaps. Phase goal is achieved in the codebase for the design-system and local-export routes. The published-artifact link route is intentionally absent (SD-04). Remaining items are human-only: the deferred live DSYNC-11 seeding run and an interactive pass of `/wm-design-pull`.

---

_Verified: 2026-10-14T13:00:00Z_
_Verifier: Claude (gsd-verifier)_

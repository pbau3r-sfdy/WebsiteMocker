---
phase: 11-open-drops
plan: 01
subsystem: drops-foundation
tags: [drops, qpdf, harness, gating]
requires: []
provides:
  - "_scripts/lib/drops-core.mjs: id, frontmatter, status, horizon, secret scan, tombstones, listing"
  - "_scripts/lib/drops-collection.mjs: resolveDrops (single gating function), dropsLoader"
  - "_scripts/lib/pdf-strip.mjs: requireQpdf, stripPdf, verifyPdf"
  - "_scripts/verify-phase-11.sh dispatcher and lib/pdf sections, fixture generators"
  - "11-SPIKE.md Q6 verdict"
affects: [11-02, 11-03, 11-04, 11-05, 11-06]
tech-stack:
  added: []
  patterns: ["section files in verify-phase-11.d/ sourced by a dispatcher", "runtime-relative fixtures under gitignored _staging/"]
key-files:
  created:
    - _scripts/lib/drops-core.mjs
    - _scripts/lib/drops-collection.mjs
    - _scripts/lib/pdf-strip.mjs
    - _scripts/fixtures/drops/gen.mjs
    - _scripts/fixtures/drops/make-pdf.mjs
    - _scripts/verify-phase-11.sh
    - _scripts/verify-phase-11.d/10-lib.sh
    - _scripts/verify-phase-11.d/15-pdf.sh
    - .planning/phases/11-open-drops/11-SPIKE.md
key-decisions:
  - "DEV_PREVIEW: works (astro 5.18.2); the loader has no file watcher so the dev server must be restarted after adding a drop"
  - "Gating (preview, CI, sandbox, DROPS_REQUIRE) lives only in resolveDrops; DROPS_DIR has no implicit default"
  - "Invalid drops throw in production builds, are skipped in sandbox preview"
  - "Corrupt withdrawn.json throws (fail closed)"
  - "qpdf 12.4.2 locally; minimum enforced major is 11"
requirements-completed: [DROP-01, DROP-05, DROP-09]
duration: 35min
completed: 2026-10-14
---

# Phase 11 Plan 01: Drops foundation Summary

Pure drops libraries (ids, frontmatter, expiry horizon, tombstones, single gating function), a qpdf strip-and-verify wrapper with generated fixtures, and the `verify-phase-11.sh` harness; the Q6 spike says `DROPS_PREVIEW=1` works under `astro dev`.

## Tasks

| Task | Commit | Result |
|---|---|---|
| 1. drops-core, drops-collection, gen.mjs, dispatcher, lib section | 006e7dd | `verify-phase-11.sh lib`: 68 checks pass |
| 2. pdf-strip, make-pdf, pdf section | b1f68ae | `verify-phase-11.sh pdf`: 38 checks pass |
| 3. Q6 spike | 95bf8ab | `DEV_PREVIEW: works` |

## Verification

- `bash _scripts/verify-phase-11.sh lib` and `pdf` exit 0. Missing sections print SKIP.
- PDF strip: rebuild with `qpdf --empty --pages`, full JSON round-trip scrub of /PieceInfo /Metadata /Info /AF /EmbeddedFiles, verify over raw bytes, qdf-decoded view and JSON view. Negative control (unstripped fixture fails), encrypted rejection, missing-qpdf message and old-version (stub 10.6.3) rejection all pass.
- qpdf version used: 12.4.2. Astro 5.18.2.

## Deviations from Plan

None in scope. Notes:
- make-pdf passes `--compress-streams=n` so fixture markers stay greppable (otherwise qpdf compresses them).
- Stripped output has compressed content streams, so the visible-text check goes through `qpdf --qdf` rather than raw grep.
- A harness `rm -rf` was rewritten with `${FX:?}` guards after a safety check.

## Known Stubs

None.

## Next

Plans 11-02 and later read `DEV_PREVIEW: works` from 11-SPIKE.md. The dispatcher exports `gen_fx`, `fx_id`, `build_prod_fx`, `build_sandbox_fx` (lock plus per-section `$FX/<section>/dist`) for their section files.

## Self-Check: PASSED

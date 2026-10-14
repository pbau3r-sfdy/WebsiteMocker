---
phase: 09-claude-design-connectivity
plan: 08
subsystem: tooling
tags: [pilot, design-sync, sfdy]
requires: [09-06, 09-07]
provides:
  - Proof that a design system and a local zip export both ingest end to end
affects: [09-09]
key-files:
  created:
    - sites/sfdy-alt-clean-reskin-2/design.lock.json
    - sites/sfdy-alt-clean-reskin-2/DESIGN.md
    - sites/design-pilot/
    - DESIGNER.md
  modified:
    - sites/sfdy-alt-clean-reskin-2/wiring.json
requirements-completed: [DSYNC-12]
completed: 2026-10-14
---

# Phase 9 Plan 08: Pilots Summary

Both connection paths were proven on real content and both sites build. The design import is a capability test, not site content, so nothing was pushed.

## Pilot 1: design system into sfdy-alt-clean-reskin-2 (c2137ef)
- `design` block saved with a narrow scope: `tokens/**`, `styles.css`, `ui_kits/website/index.html`, `components/core/Beam.jsx`, `components/core/Button.jsx` (the full D-01 scope would be ~60 files and double the model-relay effort).
- 10 files pulled via DesignSync, each relayed twice; `files/` and `files2/` matched byte for byte; no `uploads/` file fetched; `design.lock.json` written.
- 5 new `brand.doc_tokens` mapped, 9 unchanged, 24 unmapped reported. Layout.astro untouched; the proposed `--accent` literal-hex change was declined by the operator's silence on apply and judged a regression.
- Ingest wrote Hero, News, Partners, Band. Nav and Footer were skipped by the guard (no lock entry) so the hand-made versions stayed byte-identical; the untracked `.incoming.astro` files were discarded.
- Beam.jsx and Button.jsx have named exports only, so the JSX render step did not pick them up (renderer takes default exports); noted for the skill.

## Pilot 2: TELEX one-pager export into design-pilot (da3ada6)
- New throwaway slug `design-pilot` (no prod_repo or domain, stage 1, never published).
- Operator supplied three exports: an assets-only zip, a 2.1 MB bundled standalone HTML (cannot be ingested: over the cap, scripts bundled, contained personal contact details), and finally a source zip with six unbundled `.dc.html` pages. The third ingested.
- Real-export defects found and fixed (5ab32c5): oversized binaries failed the whole zip instead of being skipped; six pages with identical section names collided. Added `--page` and in-page duplicate-name handling to design-ingest.
- Only page 1 of the EU one-pager ingested (duplicate `page` sections: later pages skipped with a warning), so no contact details reached the public repo. Images pointing at skipped PNGs stay broken until placed by hand.

## Deviations
- Task 3 push and deploy check skipped on operator instruction: the imported design is not for the website. Commits are local only.
- Narrower globs than D-01 default for pilot 1; recorded above.

## Verification
- `verify-phase-09.sh all`: 94 passed, 0 failed. Both sites build.

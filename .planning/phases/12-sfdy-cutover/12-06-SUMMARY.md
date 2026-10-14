---
phase: 12-sfdy-cutover
plan: 06
subsystem: design-seed
tags: [claude-design, seed, cutover]
requirements-completed: [CUT-07, DSYNC-11]
completed: 2026-10-14
---

# Plan 12-06: Design seed

Operator decision (2026-10-14), after the dry run: the existing design-system project already holds the brand tokens, logos and fonts, and its `tokens/colors.css` is richer than the live site's (the seed would have replaced about 80 lines with 15). So no original asset was touched. Instead the live website was added as a website UI kit.

- Written (approved twice: path list, then `finalize_plan`; plan `plan_baa6f65c…b9ba62`): 32 new files under `ui_kits/sfdy-website/`: seven pages (home, about, capabilities, contact, jobs "Coming soon", privacy, imprint) from the production build, the site's CSS, fonts and images, and a README. Relative links, links to pages outside the snapshot point at the live site, no `/open-points`.
- Comparison: `list_files` before and after: exactly those 32 paths added; `tokens/`, `assets/` (logos, fonts), `ui_kits/website/` and `uploads/` unchanged; nothing deleted.
- Reversible: a second approved `finalize_plan` with deletes for exactly those paths removes it.
- `design-seed.mjs` dry run (tokens/colors.css update, assets/logo/logo.png create) was NOT written.
- The bundle builder is `_staging/design-seed/build-website-kit.mjs` (gitignored).

Frozen-docs note: phases 9, 10 and 11.1 planning docs keep the old name `sfdy-alt-clean-reskin-2`.

## Still open (not closed here)
- CUT-03: the legal checklist (12-LEGAL-CHECKLIST.md) is handed over; operator or lawyer sign-off pending.
- CUT-05: the contributor dispatch reaches `content-sync`; a live file copy into `sites/sfdy/src/content/` was only fixture-tested.

## Self-Check: PASSED

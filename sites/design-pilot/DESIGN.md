# Design target: design-pilot

Role: sandbox, not live

Design source: local export (no design system)

Stack rules:
- Astro 5.x (do not upgrade).
- Components go to `sites/design-pilot/src/components/` as `.astro`, never `src/pages/`.
- Tokens land in `wiring.json` `brand.doc_tokens`; `Layout.astro` is changed only through an operator-approved proposal.

Hand-edited sections (do not overwrite):
- AnnouncementCard
- BlogCard
- Footer
- JobCard
- Nav
- NewsCard
- TagPill
- TypeBadge

Delivery: export a zip from Claude Design and drop it into `_staging/design/inbox/` in this repo (gitignored), then run `/wm-design-pull design-pilot`.

Source of truth: the design block in sites/design-pilot/wiring.json.

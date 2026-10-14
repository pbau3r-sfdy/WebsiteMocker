# Design target: sfdy

Role: sandbox, not live

Design source: Starflight Dynamics Design System

Stack rules:
- Astro 5.x (do not upgrade).
- Components go to `sites/sfdy/src/components/` as `.astro`, never `src/pages/`.
- Tokens land in `wiring.json` `brand.doc_tokens`; `Layout.astro` is changed only through an operator-approved proposal.

Hand-edited sections (do not overwrite):
- Beam
- Footer
- JobRow
- Nav
- NewsCard
- Newsletter
- PageHero
- Share
- Tbd

Delivery: export a zip from Claude Design and drop it into `_staging/design/inbox/` in this repo (gitignored), then run `/wm-design-pull sfdy`.

Source of truth: the design block in sites/sfdy/wiring.json.

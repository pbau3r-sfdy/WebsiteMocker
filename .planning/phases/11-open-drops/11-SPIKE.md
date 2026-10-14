# Phase 11 Spike: DROPS_PREVIEW=1 under astro dev (Q6)

DEV_PREVIEW: works

- Astro version: 5.18.2
- Date: 2026-10-14

## What was tested

Throwaway Astro project under the gitignored `_staging/phase11/spike/` (deleted afterwards), base `/WebsiteMocker/spike`,
`wiring.json` with `drops.enabled: true`, a `drops` collection using `dropsLoader()` from `_scripts/lib/drops-collection.mjs`,
and an inline integration that gates through `resolveDrops` and calls `injectRoute({ pattern: '/d/[id]' })` with an
entrypoint outside the project root (mirrors research Pattern 2). Fixtures came from `gen.mjs good`.

Command: `DROPS_PREVIEW=1 DROPS_DIR=<fixture dir> npx astro dev --root _staging/phase11/spike --port 4411`.

| Request | Result |
|---|---|
| active drop (prefix b4e7) `/WebsiteMocker/spike/d/<id>/` | 200, body marker rendered |
| expired drop (prefix 2d1c) | 404 |
| fabricated id | 404 |

The loader only returns active and soon drops, so the expired id never reaches `getStaticPaths`.

## Caveat observed

The loader does not register a file watcher, so a drop folder added while the dev server runs is not picked up
(404 until the dev server is restarted). This is acceptable: drops are created by the CLI and previewed after a restart.

## Consequence for later plans (11-02, 11-04)

Docs say: `DROPS_PREVIEW=1 DROPS_DIR=<dir> astro dev` and `DROPS_PREVIEW=1 DROPS_DIR=<dir> astro build` both preview
locally; restart the dev server after adding or withdrawing a drop. No requirement change.

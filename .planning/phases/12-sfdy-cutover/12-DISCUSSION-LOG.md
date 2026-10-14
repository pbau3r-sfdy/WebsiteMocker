# Phase 12: SFDY Cutover - Discussion Log

> Audit trail only. Not consumed by downstream agents.

**Date:** 2026-10-14
**Phase:** 12-sfdy-cutover
**Areas discussed:** Site identity and old site; Internal pages in production; Contributor sync and jobs content; Go-live and rollback

## Site identity and old site
- Options: keep slug and point at prod / rename to a clean slug / swap names.
- Operator: retire the old slug (archive), rename everything, the one site is the new baseline, pushed under www.starflight-dynamics.com; kept as production because it is also needed for testing secret drops and improvements.
- New slug options: sfdy / starflight-dynamics / sfdy-baseline. Chosen: **sfdy** (note: `sites/sfdy` exists as an archived site).
- Old site: keep archived, drop prod_repo (chosen) / delete / leave.

## Internal pages in production
- Chosen: gate on production build (open-points page, footer link, Tbd markers) with a build check. Not chosen: delete outright; publish block on open items.
- Legal pages: Claude prepares a checklist for operator/lawyer review (chosen); not treated as approved, not a hard gate.

## Contributor sync and jobs content
- `content/jobs/`: keep and use for the real postings (chosen).
- Dispatch slug: update to the new slug and verify with a live test push (chosen).

## Go-live and rollback
- Timing: as soon as all checks pass (chosen).
- Rollback: backup gh-pages to a branch first, verify live afterwards (chosen).
- Design seed target: update the existing Starflight Dynamics Design System (chosen).

## Deferred
- Real job postings; Open Drops; Plausible hostname allowlist; other reskin variants cleanup.

## Also raised in the thread (before this discussion)
- Operator decision 2026-10-14: no cookie banner (Plausible sets no cookies); recorded in ROADMAP and REQUIREMENTS.

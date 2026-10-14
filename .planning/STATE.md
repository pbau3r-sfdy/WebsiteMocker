---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Claude Design Sync, Analytics, Open Drops
status: Awaiting next milestone
stopped_at: Milestone v1.2 closed
last_updated: "2026-10-14T21:38:48.863Z"
last_activity: 2026-10-14 — Milestone v1.2 completed and archived
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 28
  completed_plans: 28
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-14)

**Core value:** A new branded website — from captured reference or Claude Design artifact to live GitHub Pages URL — should require zero manual stitching
**Current focus:** Phase 11 — open-drops

## Current Position

Phase: Milestone v1.2 complete
Plan: —
Status: Awaiting next milestone
Last activity: 2026-10-14 — Milestone v1.2 completed and archived

## Performance Metrics

- 08-02: 4 min, 2 tasks, 6 implementation files
- 08-05: 3 tasks, 41-check Phase 5 harness + live section ingest validation
- 08-VERIFICATION: 5/5 success criteria, 54/54 harness checks, exit 0

## Accumulated Context

### Decisions

Carried from v1.0:

- build-single.mjs delegates to build-all.js via execSync subprocess (not module import) for correct stdio inheritance
- publish.yml checkout uses WM_PUBLISH_PAT so commit-back git push succeeds (GITHUB_TOKEN cannot push to WebsiteMocker main from within the workflow)
- wm-publish validates wiring.json inline (not via a separate script) — keeps the skill self-contained and auditable
- JamesIves action requires repository-name: (not repository:) — confirmed during E2E verification and fixed in publish.yml
- git remote set-url origin required before commit-back push — JamesIves overwrites origin to the prod repo during gh-pages push
- 02-01: Schema library pattern — _core/src/content.config.ts exports Zod objects only; each site wires defineCollection/glob itself
- 02-01: z.coerce.date() on all date fields — accepts ISO strings from GitHub web UI without breaking CI
- INGEST-05 scope: CDN fonts → Layout.astro inject (not local copy)
- 11.1-02: Careers email kept inline in contact.astro; About CTA keeps one solid Contact button; CUT-01 satisfied by RETL-04
- No auto-publish on content push (D-A6) — operator review before live; content sync ≠ deploy
- [Phase 11]: 11-01: DEV_PREVIEW works under astro dev; loader has no watcher, restart after adding a drop

### Pending Todos

- WM_PUBLISH_PAT (Classic PAT, `repo` scope) must be created and stored as an Actions secret before publish.yml can execute successfully in GitHub Actions

### Blockers/Concerns

- sfdy-alt-clean has uncommitted work in progress; commit or park it before Phases 10 and 11 touch its config and content schema
- Phase 9 DSYNC-11 (seeding) is gated on the DSYNC-01 spike and may be split off
- Plausible Business plan needed for Stats API tile and custom properties (operator decision after trial)

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |
| Phase 09 P03 | 1 session | 2 tasks | 9 files |
| Phase 09 P05 | 20min | 2 tasks | 5 files |
| Phase 11 P01 | 35min | 3 tasks | 9 files |
| Phase 11 P04 | 30min | 3 tasks | 11 files |
| Phase 11 P05 | 25min | 3 tasks | 6 files |

## Session Continuity

Last session: 2026-10-14T19:16:28.443Z
Stopped at: Completed 11-05-PLAN.md
Resume file: None

## Operator Next Steps

- Start the next milestone with /gsd-new-milestone

### Roadmap Evolution

- Phase 12 added: SFDY Cutover (publish sfdy-alt-clean-reskin-2 as the live site) — 2026-10-14
- Phase 11.1 inserted after Phase 11: Retool reskin-2 before Phase 12 cutover (review feedback: drop Systems from In-Space Power Projection, remove X/Instagram/Facebook footer links, consent banner and privacy notice when analytics is on, hero sentence, further designs) (URGENT)

## Deferred Items

Items acknowledged and deferred at milestone close on 2026-10-14:

| Category | Item | Status |
|----------|------|--------|
| verification | Phase 09 (09-VERIFICATION.md): hands-on run of the interactive /wm-design-pull flow; the live seed item was closed by Phase 12 plan 06 | human_needed |
| verification | Phase 11.1 (11.1-VERIFICATION.md): operator decisions made (Applications section and Careers mailbox kept; legal checklist accepted); a lawyer's review of the Plausible privacy wording was not done | human_needed |

---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Claude Design Sync, Analytics, Open Drops
status: executing
stopped_at: Phase 9 context gathered
last_updated: "2026-10-14T11:07:08.616Z"
last_activity: 2026-10-14
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 9
  completed_plans: 3
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-14)

**Core value:** A new branded website — from captured reference or Claude Design artifact to live GitHub Pages URL — should require zero manual stitching
**Current focus:** Phase 09 — claude-design-connectivity

## Current Position

Phase: 09 (claude-design-connectivity) — EXECUTING
Plan: 3 of 9
Status: Ready to execute
Last activity: 2026-10-14

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
- No auto-publish on content push (D-A6) — operator review before live; content sync ≠ deploy

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

## Session Continuity

Last session: 2026-10-14T11:07:04.745Z
Stopped at: Phase 9 context gathered
Resume file: None

## Operator Next Steps

- Run /gsd-plan-phase 9 (spike first) and/or /gsd-plan-phase 10; they are independent and may run in parallel

### Roadmap Evolution

- Phase 12 added: SFDY Cutover (publish sfdy-alt-clean-reskin-2 as the live site) — 2026-10-14
- Phase 11.1 inserted after Phase 11: Retool reskin-2 before Phase 12 cutover (review feedback: drop Systems from In-Space Power Projection, remove X/Instagram/Facebook footer links, consent banner and privacy notice when analytics is on, hero sentence, further designs) (URGENT)

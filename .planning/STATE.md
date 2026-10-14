---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Claude Design Sync, Analytics, Open Drops
status: ready_to_plan
stopped_at: Phase 11.1 complete (2/2) — ready to discuss Phase 12
last_updated: 2026-10-14T13:33:31.652Z
last_activity: 2026-10-14
progress:
  total_phases: 6
  completed_phases: 2
  total_plans: 16
  completed_plans: 15
  percent: 33
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-14)

**Core value:** A new branded website — from captured reference or Claude Design artifact to live GitHub Pages URL — should require zero manual stitching
**Current focus:** Phase 12 — sfdy cutover

## Current Position

Phase: 12
Plan: Not started
Status: Ready to plan
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
- 11.1-02: Careers email kept inline in contact.astro; About CTA keeps one solid Contact button; CUT-01 satisfied by RETL-04
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
| Phase 09 P05 | 20min | 2 tasks | 5 files |

## Session Continuity

Last session: 2026-10-14T13:05:27.171Z
Stopped at: Completed 11.1-01-PLAN.md
Resume file: None

## Operator Next Steps

- Run /gsd-plan-phase 9 (spike first) and/or /gsd-plan-phase 10; they are independent and may run in parallel

### Roadmap Evolution

- Phase 12 added: SFDY Cutover (publish sfdy-alt-clean-reskin-2 as the live site) — 2026-10-14
- Phase 11.1 inserted after Phase 11: Retool reskin-2 before Phase 12 cutover (review feedback: drop Systems from In-Space Power Projection, remove X/Instagram/Facebook footer links, consent banner and privacy notice when analytics is on, hero sentence, further designs) (URGENT)

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-20)

**Core value:** A new branded website — from captured reference or Claude Design artifact to live GitHub Pages URL — should require zero manual stitching
**Current focus:** Phase 2 — Content System (next)

## Current Position

Phase: 2 of 5 (Content System)
Plan: 2 of 9 in current phase — COMPLETE
Status: Phase 2 executing — 9 plans across 5 waves
Last activity: 2026-08-20 — 02-02 complete (_core news migration + jobs pages)

Progress: [████░░░░░░] 26%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: ~6 minutes
- Total execution time: ~0.2 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 1 | 2/2 | ~12 min | ~6 min |
| Phase 2 | 2/9 | ~9 min | ~4.5 min |

**Recent Trend:**
- Last 5 plans: 01-01 (2 min), 01-02 (~10 min inc. E2E verification), 02-01 (~6 min), 02-02 (~3 min)
- Trend: accelerating

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- 01-01: build-single.mjs delegates to build-all.js via execSync subprocess (not module import) for correct stdio inheritance
- 01-01: publish.yml checkout uses WM_PUBLISH_PAT so commit-back git push succeeds (GITHUB_TOKEN cannot push to WebsiteMocker main from within the workflow)
- 01-01: robots.txt swap uses printf not sed — writes complete content rather than substitution that could break on formatting variations
- 01-02: wm-publish validates wiring.json inline (not via a separate script) — keeps the skill self-contained and auditable
- 01-02: DNS guide is inlined in Step 5 output — operator sees it immediately after success, no separate doc to maintain
- 01-02: JamesIves action requires repository-name: (not repository:) — confirmed during E2E verification and fixed in publish.yml
- 01-02: git remote set-url origin required before commit-back push — JamesIves overwrites origin to the prod repo during gh-pages push
- Roadmap: Phase 4 (COLLAB) cross-workflow dispatch is untested in this codebase — plan a PAT scope verification spike before implementing `content-ci.yml`
- 02-01: Schema library pattern — _core/src/content.config.ts exports Zod objects only; each site wires defineCollection/glob itself
- 02-01: newsSchema includes short? field for sfdy-alt-clean homepage compatibility (post.data.short ?? post.data.title)
- 02-01: z.coerce.date() on all date fields — accepts ISO strings from GitHub web UI without breaking CI
- 02-02: news/index.astro restructured from card-grid to row-list (UI-SPEC mandates row layout for news/jobs/announcements) — enables <time datetime> directly in template
- 02-02: NewsCard.astro updated to id prop (backward compat); _core news index no longer uses NewsCard (uses inline rows instead)

### Pending Todos

- WM_PUBLISH_PAT (Classic PAT, `repo` scope) must be created and stored as an Actions secret before publish.yml can execute successfully in GitHub Actions

### Blockers/Concerns

- WM_PUBLISH_PAT secret must exist in the WebsiteMocker repo (or org level) before the publish workflow can authenticate cross-repo pushes — this is a runtime prerequisite, not a code blocker

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-08-20
Stopped at: Phase 2 Plan 2 complete — _core news migration + jobs pages committed. Next: 02-03-PLAN.md
Resume file: None — 02-02 complete. Next: .planning/phases/02-content-system/02-03-PLAN.md

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: complete
last_updated: "2026-08-21T08:00:00.000Z"
last_activity: 2026-08-21 -- Phase 5 complete — ingest-artifact.mjs + wm-ingest skill delivered
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 21
  completed_plans: 21
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-20)

**Core value:** A new branded website — from captured reference or Claude Design artifact to live GitHub Pages URL — should require zero manual stitching
**Current focus:** Milestone v1.0 complete — all 5 phases delivered

## Current Position

Phase: 5 of 5 (Design Artifact Ingestion) — COMPLETE
Plan: 2 of 2 — complete
Status: All 5 phases complete — milestone v1.0 done
Last activity: 2026-08-21 -- Phase 5 planned (2 plans, 2 waves)

Progress: [████████░░] 80%

## Performance Metrics

**Velocity:**

- Total plans completed: 3
- Average duration: ~5 minutes
- Total execution time: ~0.25 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 1 | 2/2 | ~12 min | ~6 min |
| Phase 2 | 9/9 | ~40 min | ~4.5 min |

**Recent Trend:**

- Last 5 plans: 02-05 (~4 min), 02-06 (~4 min), 02-07 (~5 min), 02-08 (~5 min), 02-09 (~4 min)
- Trend: stable ~4-5 min/plan

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
- 02-03: AnnouncementCard uses gap: 12px (UI-SPEC spacing exception — no left thumbnail column in announcement rows)
- 02-03: BlogCard matches NewsCard grid card hover (border-color + translateY); author line in 11px var(--font-mono) var(--text-muted) — no text-transform
- 02-03: blog/index.astro is the only list page using CSS grid (auto-fill minmax 280px 1fr) — all other list pages use row layout per UI-SPEC
- 02-04: entry.id for files named YYYY-MM-DD-slug.md equals YYYY-MM-DD-slug — identical to former post.slug, preserving all 6 live news URLs
- 02-04: .gitkeep files created for jobs/announcements/blog dirs in same commit as content.config.ts to prevent glob() throw on missing base directory
- 02-04: homepage index.astro slug prop updated to id alongside NewsCard interface change — required for TypeScript type safety
- 02-05: parrot-capital Layout.astro maps old index.astro vars (--bg, --crimson, --gold, --text, --muted) to full UI-SPEC token set (--bg-base, --accent, --text-primary, etc.) for content page compatibility
- 02-05: .gitkeep files ensure glob() loaders find valid base directories even when no content has been published yet
- 02-06: Cross-_core import path depth corrected to 5 levels up (../../../../../_core/) not 4 — pages are in pages/<collection>/ subdirectory adding one extra level vs plan spec
- 02-06: Vite server.fs.allow not needed — root cause was wrong relative path depth, not Vite restriction; correct path resolves transparently in Astro build
- 02-07: _core component import path confirmed at 5 levels up (../../../../../_core/) matching Plan 06 correction — plan spec showed 4 levels but STATE.md correction takes precedence
- 02-07: CSS var fallbacks added (var(--border-subtle, var(--border)), var(--gutter, clamp(...))) so mogwai pages degrade gracefully until Phase 3 token alignment
- 02-08: _core import path confirmed at 5 levels up (../../../../../_core/) for parrot-capital — same correction as Plans 06/07; plan spec showed 4 levels
- 02-08: CSS hover on parrot news rows uses rgba(142,21,32,.04) (crimson tint) vs sfdy rgba(255,255,255,.04) — appropriate for light bg-base background
- 02-09: All content skills use quoted date format ("YYYY-MM-DD") for GitHub web UI compatibility — unquoted also passes z.coerce.date() but breaks manual edits via web UI
- 02-09: npm run build step removed from wm-add-news — skills that run full site build are slow; build runs automatically on next deploy
- 02-09: wm-add-news tags field added to frontmatter template to match newsSchema (tags: z.array(z.string()).optional())

### Pending Todos

- WM_PUBLISH_PAT (Classic PAT, `repo` scope) must be created and stored as an Actions secret before publish.yml can execute successfully in GitHub Actions

### Blockers/Concerns

- WM_PUBLISH_PAT secret must exist in the WebsiteMocker repo (or org level) before the publish workflow can authenticate cross-repo pushes — this is a runtime prerequisite, not a code blocker

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-08-21T01:46:23.870Z
Stopped at: context exhaustion at 75% (2026-08-21)
Resume file: None

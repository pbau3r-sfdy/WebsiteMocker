---
phase: 02-content-system
plan: "09"
subsystem: content-skills
tags: [skills, content, news, jobs, announcements, blog]
dependency_graph:
  requires: [02-06, 02-07, 02-08]
  provides: [wm-add-news-updated, wm-add-job, wm-add-announcement, wm-add-blog]
  affects: [all-sites-content-workflow]
tech_stack:
  added: []
  patterns: [operator-skill-prompts, quoted-date-frontmatter, conventional-commit-messages]
key_files:
  modified:
    - _core/.claude/skills/wm-add-news.md
  created:
    - _core/.claude/skills/wm-add-job.md
    - _core/.claude/skills/wm-add-announcement.md
    - _core/.claude/skills/wm-add-blog.md
decisions:
  - "02-09: All content skills use quoted date format (\"YYYY-MM-DD\") for GitHub web UI compatibility — unquoted also passes z.coerce.date() but breaks manual edits via web UI"
  - "02-09: npm run build step removed from wm-add-news — skills that run full site build are slow; build runs automatically on next deploy"
  - "02-09: wm-add-news tags field added to frontmatter template to match newsSchema (tags: z.array(z.string()).optional())"
metrics:
  duration: "~4 minutes"
  completed: "2026-08-20"
  tasks_completed: 2
  files_changed: 4
---

# Phase 2 Plan 9: Content Skills (wm-add-news update + 3 new skills) Summary

**One-liner:** Four content skills enforcing quoted-date frontmatter and conventional commit messages for news, jobs, announcements, and blog collections.

## What Was Built

Updated the existing `/wm-add-news` skill and created three new content skills (`/wm-add-job`, `/wm-add-announcement`, `/wm-add-blog`). All four skills are operator-facing markdown prompt files in `_core/.claude/skills/` inherited by all sites.

Each skill follows the same pattern:
1. Gather required fields from the operator
2. Generate a `YYYY-MM-DD-slug` filename
3. Write a `.md` file to the correct `src/content/<type>/` directory with properly quoted date strings
4. Commit with `content(<site-slug>): add <type> — <title>`
5. Report the file path and remind about next deploy

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update wm-add-news + create wm-add-job | 73e5c5a | `_core/.claude/skills/wm-add-news.md`, `_core/.claude/skills/wm-add-job.md` |
| 2 | Create wm-add-announcement + wm-add-blog | ceb8b52 | `_core/.claude/skills/wm-add-announcement.md`, `_core/.claude/skills/wm-add-blog.md` |

## Verification

All success criteria met:

```
grep '"YYYY-MM-DD"' _core/.claude/skills/wm-add-news.md _core/.claude/skills/wm-add-job.md _core/.claude/skills/wm-add-announcement.md _core/.claude/skills/wm-add-blog.md
```

Returns 8 matches (2 per file — one in frontmatter template, one in Notes). All 4 skill files contain a `git commit` step.

## Deviations from Plan

**1. [Rule 1 - Bug] Step numbering corrected in wm-add-news.md**
- **Found during:** Task 1
- **Issue:** After removing the `npm run build` step (Step 5), the remaining steps were numbered 5, 7, 8 (skipping 6). The old Step 6 "Draft social post" became Step 5 but the commit and report steps retained their old numbers.
- **Fix:** Renumbered steps to 5 (social draft), 6 (commit), 7 (report) — correct sequential order.
- **Files modified:** `_core/.claude/skills/wm-add-news.md`
- **Commit:** 73e5c5a

## Known Stubs

None — skill files are prompt documents, not components with data sources.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes. Skill files are markdown documents read by Claude; content commits go through git and are reviewed before push.

## Self-Check: PASSED

- `_core/.claude/skills/wm-add-news.md` — exists, updated
- `_core/.claude/skills/wm-add-job.md` — exists, created
- `_core/.claude/skills/wm-add-announcement.md` — exists, created
- `_core/.claude/skills/wm-add-blog.md` — exists, created
- Commits 73e5c5a and ceb8b52 — present in git log

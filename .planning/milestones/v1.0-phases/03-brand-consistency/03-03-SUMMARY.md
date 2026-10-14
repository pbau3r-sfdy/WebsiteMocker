---
phase: 03-brand-consistency
plan: "03"
subsystem: content-skills
tags: [brand, content-skills, wm-add-news, wm-add-announcement, wm-add-blog, wm-add-job, BRAND-03]
dependency_graph:
  requires: [03-01]
  provides: [brand-aware-content-skills]
  affects: [_core/.claude/skills/wm-add-news.md, _core/.claude/skills/wm-add-announcement.md, _core/.claude/skills/wm-add-blog.md, _core/.claude/skills/wm-add-job.md]
tech_stack:
  added: []
  patterns: [brand-signal-check, bi-directional-hashtag-enrichment, avoid-scan-non-blocking, vocabulary-nudge, silent-pass-through]
key_files:
  modified:
    - _core/.claude/skills/wm-add-news.md
    - _core/.claude/skills/wm-add-announcement.md
    - _core/.claude/skills/wm-add-blog.md
    - _core/.claude/skills/wm-add-job.md
decisions:
  - "Silent pass-through: brand block absent or all arrays empty -> zero output, zero prompts"
  - "Bi-directional enrichment is opt-in with explicit default N per new hashtag"
  - "Avoid scan is non-blocking: operator confirms or overrides any match via y/N"
  - "Vocabulary nudge is informational only: Suggestion: prefix, operator always wins"
  - "Voice field explicitly excluded from all content skills in Phase 3"
  - "Hashtag source priority: brand.hashtags first, keywords.json as fallback, never combined"
  - "wm-add-job: narrower treatment (avoid + vocabulary only); brand.hashtags not consulted; wiring.json never written"
  - "wm-add-news/announcement/blog: wiring.json included in commit only when brand.hashtags was updated"
metrics:
  duration: "~10 minutes"
  completed: "2026-08-20"
  tasks_completed: 3
  files_modified: 4
---

# Phase 3 Plan 03: Content Skill Brand Enforcement Summary

Brand-aware content writing added to all four `_core/.claude/skills/wm-add-*.md` skills via a new "Brand signal check" step inserted between the write-markdown step and the commit step in each skill.

## What Was Built

### Task 1: wm-add-news.md — Full brand treatment with social post priority rule
**Commit:** 268db4e

Step 5 (new) — Brand signal check inserted between Step 4 (Write Markdown) and the former Step 5 (social post):
- Silent pass-through when `brand` key absent or all arrays empty — zero output
- Sub-step A: hashtag suggestions from `brand.hashtags` + bi-directional enrichment (opt-in, default N per new tag)
- Sub-step B: avoid scan with `⚠` warning per match, non-blocking `y/N` confirm
- Sub-step C: vocabulary nudge with "Suggestion:" prefix, informational only
- Voice field explicitly excluded in Phase 3

Step 6 (updated social post) now carries an explicit hashtag source priority rule: `brand.hashtags` first, `keywords.json hashtags.<platform>` as fallback only — never combined.

Step 7 (commit) conditionally includes `sites/<site-slug>/wiring.json` when `brand.hashtags` was updated during Step 5.

Step numbering: brand check=5, social post=6, commit=7, report=8.

### Task 2: wm-add-announcement.md + wm-add-blog.md — Full brand treatment
**Commit:** b7f60e4

Both files receive the identical brand signal check logic as wm-add-news:

**wm-add-announcement.md:** brand check inserted as Step 4 (between write-markdown Step 3 and commit). Commit becomes Step 5, report becomes Step 6. Commit conditionally includes `wiring.json`.

**wm-add-blog.md:** brand check inserted as Step 5 (between write-markdown Step 4 and commit). Commit becomes Step 6, report becomes Step 7. Commit conditionally includes `wiring.json`.

Both: silent pass-through, full four sub-step treatment (hashtag suggestions + bi-directional enrichment + avoid scan + vocabulary nudge), voice excluded.

### Task 3: wm-add-job.md — Narrower brand treatment
**Commit:** 49eedec

Job listings have no `tags[]` frontmatter field, so hashtag enrichment is explicitly excluded.

Brand check inserted as Step 4 (between write-markdown Step 3 and commit). Commit becomes Step 5, report becomes Step 6.

Two sub-steps only:
- Sub-step A: avoid scan (non-blocking, same `⚠` pattern)
- Sub-step B: vocabulary nudge (same "Suggestion:" pattern)

Explicit statement in the skill: `brand.hashtags` is not consulted; no offer to add to brand hashtag kit. `wiring.json` is never modified by this skill (no enrichment path). Commit step unchanged — no conditional wiring.json include.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all four skills are fully wired to the brand signal check logic. The check conditionally reads live `wiring.json` data at runtime. No hardcoded values, no placeholder content.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| T-03-03-01 mitigated | wm-add-news.md, wm-add-announcement.md, wm-add-blog.md | Bi-directional enrichment write path to wiring.json is gated by explicit per-hashtag `y/N` confirmation, default N — no auto-add path exists |

No new threat surface introduced beyond what was in the plan's threat model. All three STRIDE threats from the plan's threat register are addressed:
- T-03-03-01 (Tampering via bi-directional enrichment): mitigated by opt-in default-N confirmation
- T-03-03-02 (DoS via avoid scan blocking): accepted — scan is explicitly non-blocking
- T-03-03-03 (Tampering via body scan): accepted — scan is read-only; brand.avoid is developer-controlled

## Self-Check: PASSED

Files verified:
- `_core/.claude/skills/wm-add-news.md` — "Brand signal check" count: 1 ✓
- `_core/.claude/skills/wm-add-announcement.md` — "Brand signal check" count: 1 ✓
- `_core/.claude/skills/wm-add-blog.md` — "Brand signal check" count: 1 ✓
- `_core/.claude/skills/wm-add-job.md` — "Brand signal check" count: 1 ✓

Commits verified:
- 268db4e — feat(wm-add-news): add brand signal check step (BRAND-03) ✓
- b7f60e4 — feat(content-skills): add brand signal check to announcement + blog (BRAND-03) ✓
- 49eedec — feat(wm-add-job): add narrower brand signal check — avoid + vocabulary only (BRAND-03) ✓

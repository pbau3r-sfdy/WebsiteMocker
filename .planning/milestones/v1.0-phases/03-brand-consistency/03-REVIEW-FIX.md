---
phase: 03-brand-consistency
fixed_at: 2026-08-20T00:00:00Z
review_path: .planning/phases/03-brand-consistency/03-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 3: Code Review Fix Report

**Fixed at:** 2026-08-20
**Source review:** `.planning/phases/03-brand-consistency/03-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (Warning-level only; 4 Info findings excluded per critical_warning scope)
- Fixed: 5
- Skipped: 0

## Fixed Issues

### WR-01: "Not needed" brand state not recognised by content-skill skip guards

**Files modified:** `.claude/skills/wm-wire.md`
**Commit:** a9a5313
**Applied fix:** Changed the "Not needed" path from writing `{ "status": "skipped" }` to writing the full-schema stub `{ "hashtags": [], "vocabulary": [], "avoid": [], "voice": "", "status": "skipped" }`. Updated the instruction text and the Notes section accordingly. Content skills' existing skip guards (all-empty arrays check) now fire correctly for this state.

---

### WR-02: Re-entry into wm-wire for a "Not needed" site triggers wrong branch

**Files modified:** `.claude/skills/wm-wire.md`
**Commit:** 0330f5d
**Applied fix:** Added an explicit "Before choosing a path" guard block inside the "Configure now" section. If `brand.status` equals `"skipped"`, Claude halts before entering first-run or subsequent-run and asks the operator whether they want to reconfigure. This prevents the inappropriate "has anything changed?" prompt for sites where brand was marked not needed.

---

### WR-03: Contradictory stage-advancement language between Step 4 and Notes

**Files modified:** `.claude/skills/wm-wire.md`
**Commit:** 3df7f30
**Applied fix:** Updated the Notes section "Skip for later" line from the neutral "not counted against stage advancement" phrasing to positive-clearance language that matches Step 4: "brand block does not block stage advancement; the site can advance with brand block absent or empty. Unlike other services, skipping brand block is not penalised." Both statements in the file now convey the same unambiguous rule.

---

### WR-04: In-memory hashtag staging creates silent loss risk on session interruption

**Files modified:** `_core/.claude/skills/wm-add-news.md`, `_core/.claude/skills/wm-add-announcement.md`, `_core/.claude/skills/wm-add-blog.md`
**Commit:** 7c3fbff
**Applied fix:** In Sub-step A of the Brand signal check in each content skill, added instruction to immediately write confirmed hashtag additions to `wiring.json` on disk rather than deferring to the commit step. Also added a pre-commit guard in the commit step of each file: before running git add, re-read `wiring.json brand.hashtags` and re-apply confirmed additions if a session interruption discarded them.

---

### WR-05: wm-wire asserts `wiring.json name` is "always present" — false for parrot-capital

**Files modified:** `.claude/skills/wm-wire.md`
**Commit:** ffbb942
**Applied fix:** Replaced "always present" assertion with an explicit fallback instruction: read both `name` and `domain`; use `name` if present, fall back to the site slug (directory name) if `name` is absent. `domain` is noted as the voice-inference fallback when no other signals are available.

---

_Fixed: 2026-08-20_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_

---
phase: 03-brand-consistency
reviewed: 2026-08-20T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - .claude/skills/wm-wire.md
  - _core/.claude/skills/wm-add-news.md
  - _core/.claude/skills/wm-add-announcement.md
  - _core/.claude/skills/wm-add-blog.md
  - _core/.claude/skills/wm-add-job.md
  - _core/brand-schema.md
  - sites/sfdy-alt-clean/wiring.json
  - sites/mogwai-systems/wiring.json
  - sites/parrot-capital/wiring.json
  - sites/crestworks/wiring.json
findings:
  critical: 0
  warning: 5
  info: 4
  total: 9
status: issues_found
---

# Phase 3: Brand Consistency — Code Review Report

**Reviewed:** 2026-08-20
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Reviewed five skill files (wm-wire.md, four content skills), one schema reference, and four wiring.json stubs added as part of Phase 3. All JSON files are syntactically valid. No critical bugs — no data loss on the happy path, no broken JSON writes in the most common flows.

Five warnings surface — two are logic gaps in the "Not needed" brand state that will produce incorrect behavior whenever that path is taken; one is a false assertion ("always present") in wm-wire that breaks for parrot-capital; one is a silent-loss risk when a session is interrupted between brand check and commit; one is a contradictory stage-advancement statement between two sections of the same file. Four info items cover path ambiguity, unspecified error handling, and inconsistent wiring.json key naming.

---

## Warnings

### WR-01: "Not needed" brand state not recognised by content-skill skip guards

**File:** `.claude/skills/wm-wire.md:77`

**Issue:** When an operator selects "Not needed," wm-wire writes `"brand": { "status": "skipped" }`. This non-schema structure is not handled by the outer skip condition in all four content skills. Each content skill says:

> "skip entirely if no `brand` key … OR if `brand.hashtags`, `brand.vocabulary`, and `brand.avoid` are all empty arrays"

With `{ "status": "skipped" }`, the `brand` key **is** present, and the three array fields are **absent** (not the same as empty arrays). The outer skip clause does not fire. Claude enters the brand check block, potentially outputs text about checking brand signals, then discovers all three sub-step guards also don't fire. This violates the invariant "output nothing, do not mention the brand block" for this state. The operator who said "Not needed" will see unexpected brand-check commentary in subsequent content additions.

**Fix:** Add `{ "status": "skipped" }` as an explicit recognised state in the skip condition of each content skill:

```markdown
- If the `brand` key is absent, or `brand.status` equals `"skipped"`, or if
  `brand.hashtags`, `brand.vocabulary`, and `brand.avoid` are all empty arrays
  (or absent), continue silently — output nothing, do not mention the brand block.
```

Alternatively, change the "Not needed" write in wm-wire.md to use the empty-stub form instead of a `status`-only object — this keeps the schema consistent and the skip conditions unchanged:

```json
"brand": { "hashtags": [], "vocabulary": [], "avoid": [], "voice": "", "status": "skipped" }
```

---

### WR-02: Re-entry into wm-wire for a "Not needed" site triggers wrong branch

**File:** `.claude/skills/wm-wire.md:70-77`

**Issue:** The subsequent-run path (line 70) fires when "brand block exists AND at least one field is non-empty." With `{ "status": "skipped" }`, the `status` key is non-empty, so the subsequent-run path fires. Claude then reads `last_deploy` and either skips the prompt (if deploy was today) or asks "Has anything in your brand voice or hashtags changed since you last ran /wm-wire?" — an inappropriate prompt for a site where the operator explicitly said brand is not needed.

**Fix:** Add an explicit early-exit for the `status: "skipped"` state before the first-run / subsequent-run branch:

```markdown
**Subsequent-run handling for "Not needed" sites:**
- If `brand.status` equals `"skipped"`, report "Brand block is marked as not needed for this site."
  Offer to re-open configuration if the operator has changed their mind. Do not ask about changes.
```

---

### WR-03: Contradictory stage-advancement language between Step 4 and Notes

**File:** `.claude/skills/wm-wire.md:80` vs `91`

**Issue:** Two statements in the same file describe "Skip for later" differently:

- Step 4 (line 80): *"'Skip for later' and 'Not needed' both count as done."*
- Notes (line 91): *"'Skip for later' leaves the field null — not counted against stage advancement."*

"Counts as done" is a positive assertion (stage gate is cleared). "Not counted against" is a neutral bypass (gate does not block, but no positive credit). These are different semantics. For every other service in wm-wire, "Skip for later" explicitly does NOT enable stage advancement — brand block is the sole exception. A future Claude reading both statements may apply the wrong rule, either blocking stage advancement for brand-skipped sites or incorrectly advancing stages for other services.

**Fix:** Align both statements to use the same phrasing. Recommend keeping the Step 4 language (positive clearance) and updating the Notes section:

```markdown
- "Skip for later" — brand block does not block stage advancement;
  the site can reach stage 3 with brand block absent or empty.
  (Note: unlike other services, "skip for later" on brand still permits stage advancement.)
- "Not needed" sets `status: "skipped"` — same stage advancement treatment as "skip for later".
```

---

### WR-04: In-memory hashtag staging creates silent loss risk on session interruption

**File:** `_core/.claude/skills/wm-add-news.md:46`
Also: `_core/.claude/skills/wm-add-announcement.md:40`, `_core/.claude/skills/wm-add-blog.md:50`

**Issue:** Sub-step A instructs Claude to "stage those updates to `brand.hashtags` in memory; they will be written to `wiring.json` in the commit step." If the conversation session ends or is reset between the brand check step and the commit step, the operator's confirmed hashtag additions are silently discarded. The content file (news/announcement/blog) is committed correctly, but `wiring.json` is never updated. The operator confirmed an action ("yes, add this to my brand kit") that was never persisted — and receives no error or warning.

This is a structural limitation of in-session state, but the instructions provide no recovery path. An operator who runs several sessions of `/wm-add-news` and approves hashtag additions each time may never realise their brand kit is not growing.

**Fix:** Add a recovery instruction to the commit step:

```markdown
7. **Commit and push**:
   - Before running git add, re-read the current `wiring.json` brand.hashtags to confirm the
     in-session staged additions are still pending. If the session was interrupted and
     wiring.json does not reflect confirmed additions, re-apply them before committing.
```

Alternatively, add a note in Step 5 Sub-step A:

```markdown
   - After operator confirms any additions, immediately write the updated brand.hashtags to
     `wiring.json` on disk (do not wait for the commit step) to avoid silent loss on interruption.
```

---

### WR-05: wm-wire asserts `wiring.json name` is "always present" — false for parrot-capital

**File:** `.claude/skills/wm-wire.md:47`

**Issue:** The first-run path lists signal sources and labels `wiring.json name` as "always present." `sites/parrot-capital/wiring.json` has no `name` field. If `/wm-wire` is run with "Configure now" for parrot-capital, Claude will find `name` missing and either error, silently substitute an empty string, or use the domain name — the instruction does not specify fallback behavior. The "always present" assertion makes this ambiguous rather than explicitly handled.

**File evidence:** `sites/parrot-capital/wiring.json` — has `"site": "parrot-capital"` but no `"name"` key.

**Fix:** Remove the "always present" assertion and add a fallback instruction:

```markdown
1. `wiring.json` `name` and `domain` — read both; use `name` if present, fall back to
   the site slug (directory name) if `name` is absent.
```

---

## Info

### IN-01: `src/content/**/*.md` scan path is not scoped to the site directory

**File:** `.claude/skills/wm-wire.md:50`

**Issue:** The first-run path step 4 says "scan `src/content/**/*.md`" without specifying that this path is relative to the site root (e.g., `sites/sfdy-alt-clean/src/content/**/*.md`). All other path references in the skill are site-relative. A Claude reading from the repo root could scan `_core/src/content/` instead, producing incorrect signals.

**Fix:** Make the root explicit: "`sites/<slug>/src/content/**/*.md`"

---

### IN-02: JSON validation step does not specify handling for syntactically invalid paste

**File:** `.claude/skills/wm-wire.md:67`

**Issue:** The validation gate checks schema structure (four keys, correct types) but does not instruct Claude what to do if the operator pastes syntactically invalid JSON (trailing comma, unquoted key, bare text). Claude will likely handle this gracefully, but the behavior is undefined in the instructions.

**Fix:** Add one sentence: "If the paste cannot be parsed as JSON at all, report the parse error, show the problematic text, and wait for a corrected paste."

---

### IN-03: parrot-capital/wiring.json uses `"site"` key instead of `"slug"`

**File:** `sites/parrot-capital/wiring.json:2`

**Issue:** All other wiring.json files use `"slug"` as the site identifier key. parrot-capital uses `"site"`. The dashboard handles this via a `_slug` synthetic field (directory name) and the display-name fallback chain `name || site || _slug`, so dashboard rendering is unaffected. However, `_scripts/rename-site.mjs` uses `w.slug === oldSlug` and would silently fail to update the identifier for parrot-capital on a rename.

**Fix:** Add `"slug": "parrot-capital"` or rename the existing `"site"` key to `"slug"`. Also add a `"name"` field (see WR-05).

---

### IN-04: crestworks/wiring.json uses `"site"` key instead of `"slug"`

**File:** `sites/crestworks/wiring.json:2`

**Issue:** Same key-naming inconsistency as parrot-capital. crestworks has a `name` field so WR-05 does not apply, but the `slug` vs `site` inconsistency means `rename-site.mjs` would not update crestworks correctly.

**Fix:** Rename `"site"` to `"slug"`.

---

_Reviewed: 2026-08-20_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

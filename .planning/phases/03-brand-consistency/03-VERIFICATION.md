---
phase: 03-brand-consistency
verified: 2026-08-20T00:00:00Z
status: fully_verified
score: 3/3 must-haves verified + 3/3 human checks passed
overrides_applied: 0
human_verification:
  - test: "Run /wm-wire on mogwai-systems, choose 'Configure now' for Brand block"
    expected: "Skill reads only name/domain (skips capture because capture=null), generates a pre-filled template with the four required keys, prints the 'Take this to Claude.ai' instruction, waits for paste-back, validates the pasted JSON, then writes to wiring.json"
    why_human: "Skill files are Claude instruction documents — interactive wizard flow can only be confirmed in a live Claude session. Plan 03-02 had a blocking checkpoint:human-verify task that was substituted by code inspection in the SUMMARY."
    result: "PASS — 2026-08-20. capture=null skipped silently. Template generated from name/domain + keywords.json (sparse, as expected). Paste-back validated (4 keys, correct types). Written to wiring.json correctly."
  - test: "Run /wm-wire on parrot-capital, choose 'Skip for later' for Brand block"
    expected: "Stage advancement is not blocked — skill proceeds to next service / stage advance check without error or gate"
    why_human: "Non-blocking skip behavior and stage gate logic can only be confirmed by watching the wizard execute"
    result: "PASS — 2026-08-20. Brand key left unchanged (empty stub). Stage 6 unchanged. No error, no gate, no prompt."
  - test: "Run /wm-wire on any site a second time the same day (last_deploy = today), choose 'Configure now'"
    expected: "Recency check fires: skill skips the 'Has anything changed?' prompt and immediately shows current brand fields"
    why_human: "Date-comparison branch in the recency check requires observing the wizard's actual runtime decision"
    result: "PASS — 2026-08-20. last_deploy set to 2026-08-20 (today). Subsequent-run path: date match detected, 'Has anything changed?' prompt suppressed, current fields displayed directly."
---

# Phase 3: Brand Consistency — Verification Report

**Phase Goal:** Every active site has a structured `brand` block in `wiring.json` that content skills read and enforce at write time
**Verified:** 2026-08-20
**Status:** fully_verified — all human checks passed 2026-08-20
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `wiring.json` for every active site contains a `brand` block with `hashtags[]`, `vocabulary[]`, `avoid[]`, and `voice` | VERIFIED | Node.js validation passed for all four sites; brand block present with correct types in sfdy-alt-clean, mogwai-systems, parrot-capital, crestworks |
| 2 | Running `/wm-wire` on a site with no `brand` block prompts the operator to build one interactively and writes the result to `wiring.json` | VERIFIED (code) / HUMAN NEEDED (live flow) | All five plan truths satisfied in skill file: `### Brand block` heading present, three-way prompt, first-run signal-reading logic, `Take this to Claude.ai` instruction, paste-back validation, write path, stage-gate note. Interactive behavior unconfirmed in live session. |
| 3 | Running `/wm-add-news` on a site with a `brand` block suggests hashtags from `brand.hashtags` and flags any `brand.avoid` matches before committing | VERIFIED | Brand signal check at Step 5 of wm-add-news.md, wm-add-announcement.md, wm-add-blog.md; narrower check (avoid + vocabulary only) in wm-add-job.md; all four confirmed by grep |

**Score:** 3/3 truths verified at code level

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `sites/sfdy-alt-clean/wiring.json` | Brand stub block with four empty fields | VERIFIED | `"brand": {"hashtags":[],"vocabulary":[],"avoid":[],"voice":""}` at line 34 |
| `sites/mogwai-systems/wiring.json` | Brand stub block with four empty fields | VERIFIED | `"brand": {"hashtags":[],"vocabulary":[],"avoid":[],"voice":""}` at line 11 |
| `sites/parrot-capital/wiring.json` | Brand stub block with four empty fields | VERIFIED | `"brand": {"hashtags":[],"vocabulary":[],"avoid":[],"voice":""}` at line 37 |
| `sites/crestworks/wiring.json` | Brand stub block with four empty fields | VERIFIED | `"brand": {"hashtags":[],"vocabulary":[],"avoid":[],"voice":""}` at line 26 |
| `_core/brand-schema.md` | Schema documentation with field reference table, minimal stub, populated example | VERIFIED | All sections present: purpose, field reference table (4 rows × 4 columns), minimal stub JSON, populated SFDY example, notes on optional enrichment |
| `.claude/skills/wm-wire.md` | Brand block service section within step 3 | VERIFIED | `### Brand block` at line 39; first-run + subsequent-run + skip + not-needed paths all present |
| `_core/.claude/skills/wm-add-news.md` | Brand signal check as Step 5; social post step updated with priority rule | VERIFIED | Step 5 at line 36; hashtag suggestions, avoid scan, vocabulary nudge, voice excluded; social post step 6 has priority rule; commit step 7 has conditional wiring.json |
| `_core/.claude/skills/wm-add-announcement.md` | Brand signal check inserted before commit step (Step 4) | VERIFIED | Step 4 at line 30; full brand treatment; step numbers 1-2-3-4-5-6 correct |
| `_core/.claude/skills/wm-add-blog.md` | Brand signal check inserted before commit step (Step 5) | VERIFIED | Step 5 at line 40; full brand treatment; step numbers 1-2-3-4-5-6-7 correct |
| `_core/.claude/skills/wm-add-job.md` | Narrower brand check (avoid + vocabulary only, no hashtag enrichment) | VERIFIED | Step 4 at line 36; hashtag enrichment explicitly excluded at lines 41, 53; commit step has no wiring.json include |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `wm-wire.md` Brand block section | `sites/<slug>/wiring.json brand` key | Skill writes validated JSON on 'Configure now' path | WIRED | Lines 69-70: validates then writes `brand` key value in wiring.json |
| `wm-wire.md` recency check | `wiring.json last_deploy` field | Same-day date comparison | WIRED | Lines 73-75: reads `last_deploy`, compares to today YYYY-MM-DD |
| `wm-add-news.md` Step 5 | `sites/<slug>/wiring.json brand block` | Skill reads brand.hashtags, brand.avoid, brand.vocabulary at write time | WIRED | Lines 37-59: reads brand key and all three arrays |
| `wm-add-news.md` Step 5 bi-directional enrichment | `sites/<slug>/wiring.json brand.hashtags` | Skill writes back operator-approved hashtags | WIRED | Lines 46-47: stages additions, writes immediately to disk; confirmed at Step 7 (commit) |
| `_core/brand-schema.md` | `wm-wire.md` artifact template | Operator shares schema to generate brand block | WIRED (instructional) | Schema document covers all four fields; wm-wire first-run path generates template matching schema structure |

### Behavioral Spot-Checks

Step 7b: SKIPPED — All modified files are Claude skill instruction documents (Markdown). There are no runnable entry points to test programmatically. Behavioral confirmation requires a live Claude session (see Human Verification below).

### Probe Execution

Step 7c: SKIPPED — No probe scripts declared in any plan file and no `scripts/*/tests/probe-*.sh` found for this phase.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| BRAND-01 | 03-01-PLAN.md | `brand` block added to `wiring.json` schema: `hashtags[]`, `vocabulary[]`, `avoid[]`, `voice` (string descriptor) | SATISFIED | All four wiring.json files validated; `_core/brand-schema.md` documents the schema |
| BRAND-02 | 03-02-PLAN.md | `/wm-wire` detects a missing `brand` block and prompts operator to build it interactively — outputs to `wiring.json` | SATISFIED (code) | wm-wire.md contains full Brand block service section; interactive behavior pending human confirmation |
| BRAND-03 | 03-03-PLAN.md | `/wm-add-news` (and all content skills) read `brand.hashtags` and suggest them for post tagging; scan draft content against `brand.avoid` and surface any matches before committing | SATISFIED | All four `_core/.claude/skills/wm-add-*.md` files contain Brand signal check; hashtag suggestions and avoid scan confirmed by code inspection |

Note: REQUIREMENTS.md shows all three BRAND requirements as `Pending` (checkboxes unchecked). These should be updated to reflect completion.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | No TBD, FIXME, XXX, TODO, HACK, or PLACEHOLDER markers found in any phase-modified file |

### Human Verification Required

#### 1. Live /wm-wire mogwai-systems Brand Block Flow

**Test:** Open a new Claude session with this project loaded. Run `/wm-wire`, select `mogwai-systems`. When the wizard reaches the `### Brand block` service, choose "Configure now".

**Expected:** Claude reads only `wiring.json` name ("MOGWAI Systems") and domain — it does NOT attempt to read a capture file or error because `capture: null`. Generates a pre-filled JSON template with four keys (may have sparse/empty values given minimal signals, which is correct). Prints the exact instruction: "Take this to Claude.ai and ask Claude to help you refine and complete it. Then paste the finished JSON back here." Paste back `{ "hashtags": ["MOGWAI"], "vocabulary": ["autonomous systems"], "avoid": [], "voice": "Minimal, operational, no hype" }`. Claude validates (4 keys, correct types) and writes the brand block to `mogwai-systems/wiring.json`.

**Why human:** Interactive wizard flow through a Claude skill instruction document. Cannot be executed without a live Claude session.

#### 2. Skip for later — Stage Advancement Not Blocked

**Test:** Run `/wm-wire` on `parrot-capital`. When the Brand block prompt appears, choose "Skip for later".

**Expected:** The wizard proceeds past the Brand block service without blocking stage advancement. The brand key in `wiring.json` remains as-is (empty stub). No error or gate applied.

**Why human:** Non-blocking skip behavior and the stage-advance logic can only be confirmed by observing the wizard execute in a live session.

#### 3. Same-Day Recency Check

**Test:** After running `/wm-wire` on any site today (or with a site whose `last_deploy` equals today's date), run `/wm-wire` again on the same site and choose "Configure now" for the Brand block with a non-empty block.

**Expected:** The wizard skips the "Has anything changed?" prompt and instead directly shows the current brand fields. Only fires "has anything changed?" if `last_deploy` is older than today.

**Why human:** Date-comparison branch requires observing the wizard's runtime decision logic.

### Gaps Summary

No automated gaps found. All three success criteria are satisfied at the code/instruction-text level:

1. All four active site `wiring.json` files contain a valid `brand` block — confirmed by node.js JSON.parse validation.
2. `wm-wire.md` contains a complete, substantive Brand block service section covering all four paths (Configure now / first-run, Configure now / subsequent-run, Skip for later, Not needed).
3. All four `_core/.claude/skills/wm-add-*.md` files have a Brand signal check step inserted at the correct position, with correct step numbering, full or narrower brand treatment as specified, and silent pass-through for absent/empty brand blocks.

The human verification items are confidence checks on interactive wizard behavior, not evidence of missing implementation. The skill files are complete.

**One deviation to note:** Plan 03-02's Task 2 was a `<task type="checkpoint:human-verify" gate="blocking">` requiring a live `/wm-wire` session. The SUMMARY substituted code inspection ("verified by reading the skill file directly"). This is acceptable for an instruction document but the original blocking checkpoint intent was to confirm the actual Claude runtime behavior on the edge case (mogwai-systems with `capture: null`). The three human verification items above close this gap.

---

_Verified: 2026-08-20_
_Verifier: Claude (gsd-verifier)_

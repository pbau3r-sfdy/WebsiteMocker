---
status: complete
phase: 03-brand-consistency
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md]
started: 2026-08-20T00:00:00Z
updated: 2026-08-20T00:01:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Brand stubs installed in all active sites
expected: Open any of the four active wiring.json files (sfdy-alt-clean, mogwai-systems, parrot-capital, crestworks). Each should have a "brand" key with four fields: hashtags [], vocabulary [], avoid [], voice "". All files parse as valid JSON.
result: pass

### 2. Brand schema reference file exists
expected: _core/brand-schema.md exists and is readable. It contains a field reference table (hashtags, vocabulary, avoid, voice), a minimal stub, a populated example, and notes on optional enrichment semantics.
result: pass

### 3. wm-wire offers brand block section
expected: Running /wm-wire on any active site reaches a "Brand block" step as the fifth service section. It presents three choices: "Configure now", "Skip for later", or "Mark as not needed". Choosing "Skip for later" exits without error and does not block stage advancement.
result: pass

### 4. wm-wire first-run template generation
expected: Choosing "Configure now" on a site with empty brand stubs generates a pre-filled JSON template with all four brand keys (hashtags, vocabulary, avoid, voice), plus a printed instruction to take the template to Claude.ai for refinement before pasting back.
result: pass

### 5. Content skills are silent when brand block is empty
expected: Running /wm-add-news (or any content skill) on a site where all brand arrays are empty — no brand-related prompts, warnings, or suggestions appear. The skill runs exactly as it did before Phase 3 with zero brand output.
result: pass

### 6. wm-add-news proposes hashtags from brand kit
expected: On a site with populated brand.hashtags, after /wm-add-news writes the markdown, the skill displays hashtag suggestions drawn from brand.hashtags. If you want to add a hashtag not in the kit, the skill asks "Add to brand hashtag kit? [y/N]" with default N (does not auto-add).
result: pass

### 7. Avoid scan warns but does not block posting
expected: If post content includes a word from brand.avoid, the skill shows a ⚠ warning and asks y/N to proceed. Answering N (or any response that rejects) still allows the post to be saved — the content is not rejected outright. The scan is advisory, not a hard gate.
result: pass

### 8. wm-add-job uses narrower brand treatment
expected: Running /wm-add-job on a site with populated brand data shows avoid scan and vocabulary nudge only — no hashtag suggestions, no prompt to add to the brand hashtag kit, and wiring.json is not modified by the job skill regardless of responses.
result: pass

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]

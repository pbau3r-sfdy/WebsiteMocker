---
status: complete
phase: 01-production-deploy-pipeline
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md]
started: 2026-08-20T00:00:00Z
updated: 2026-08-20T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Build Script — Usage Error
expected: Run `node _scripts/build-single.mjs` with no arguments → prints "Usage: node _scripts/build-single.mjs <slug>" and exits with a non-zero exit code.
result: pass

### 2. Build Script — Unknown Slug
expected: Run `node _scripts/build-single.mjs bad-slug` → prints an error like "site \"bad-slug\" not found in sites/" and exits non-zero. Does NOT attempt a build.
result: pass

### 3. Publish Workflow Structure
expected: Open `.github/workflows/publish.yml`. It has a `workflow_dispatch` trigger with a required `slug` input, a concurrency group `publish-${{ inputs.slug }}` with `cancel-in-progress: false`, and the wiring.json validation step appears BEFORE the "Build site" step.
result: pass

### 4. Validate-Before-Build Gate
expected: Dispatch the publish workflow for `orbint` (stage 2) — the run should fail at "Read and validate wiring.json" with "stage 2 < 5 — site not production-ready", and the build step never runs.
result: pass

### 5. wm-publish Skill
expected: `.claude/skills/wm-publish.md` shows a 6-step flow: (1) validate wiring.json, (2) run /wm-preflight, (3) trigger gh workflow, (4) watch with `gh run watch --exit-status`, (5) inline Squarespace DNS guide on success (with the 4 GitHub Pages A records), (6) `gh run view --log-failed` failure path.
result: pass

### 6. Parrot Capital Stage 6
expected: `sites/parrot-capital/wiring.json` shows `"stage": 6`, `"last_deploy": "2026-08-20"`, `"prod_repo": "pbau3r-sfdy/parrot-capital"`, and domain set.
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]

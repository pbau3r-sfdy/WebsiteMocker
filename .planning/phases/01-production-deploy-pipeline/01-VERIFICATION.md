---
phase: 01-production-deploy-pipeline
verified: 2026-08-20T12:00:00Z
status: passed
score: 18/18 must-haves verified
overrides_applied: 0
re_verification: false
---

# Phase 1: Production Deploy Pipeline — Verification Report

**Phase Goal:** A site operator can push any stage-5 site to its production GitHub Pages URL with a single command, so the entire build, patch, and deploy sequence runs automatically without manual steps.
**Verified:** 2026-08-20
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `node _scripts/build-single.mjs` (no args) exits non-zero and prints usage | VERIFIED | Live: exit 1, stderr "Usage: node _scripts/build-single.mjs <slug>" |
| 2 | `node _scripts/build-single.mjs nonexistent-slug` exits non-zero, prints "not found in sites/" | VERIFIED | Live: exit 1, stderr 'Error: site "nonexistent-slug-abc123" not found in sites/' |
| 3 | `build-single.mjs <valid-slug>` delegates to build-all.js | VERIFIED | spawnSync(['node', 'build-all.js', slug]) at line 45 with stdio: inherit |
| 4 | `publish.yml` validate-wiring step exits non-zero when stage < 5 | VERIFIED | Line 57: `if (w.stage < 5) { ... process.exit(1); }` before Build site step |
| 5 | `publish.yml` validate-wiring exits non-zero when domain absent | VERIFIED | Line 58: `if (!w.domain) { ... process.exit(1); }` |
| 6 | `publish.yml` validate-wiring exits non-zero when prod_repo absent | VERIFIED | Line 59: `if (!w.prod_repo) { ... process.exit(1); }` |
| 7 | `publish.yml` Inject CNAME step writes domain to dist/<slug>/CNAME | VERIFIED | Line 80: `echo "$DOMAIN" > "dist/$SLUG/CNAME"` |
| 8 | `publish.yml` Swap robots.txt writes Allow to dist/<slug>/robots.txt | VERIFIED | Line 87: `printf 'User-agent: *\nAllow: /\n' > "dist/$SLUG/robots.txt"` |
| 9 | `publish.yml` Update wiring.json sets stage 6 + last_deploy YYYY-MM-DD + commits to main | VERIFIED | Lines 109-110, 118: `w.stage = 6; w.last_deploy = new Date().toISOString().slice(0,10);` + `git push origin main` |
| 10 | `publish.yml` uses WM_PUBLISH_PAT for checkout + JamesIves deploy; GITHUB_TOKEN not used functionally | VERIFIED | GITHUB_TOKEN only in comments; WM_PUBLISH_PAT at lines 28, 94, 115 |
| 11 | CLAUDE.md contains no [websites-org] | VERIFIED | grep returned no matches |
| 12 | AGENTS.md contains no [websites-org] | VERIFIED | grep returned no matches |
| 13 | `/wm-publish <slug>` reads wiring.json, checks stage/domain/prod_repo, runs /wm-preflight, blocks on FAIL | VERIFIED | Steps 1 and 2 of wm-publish.md with explicit error messages and stop conditions |
| 14 | `/wm-publish <slug>` triggers `gh workflow run publish.yml --field slug=<slug>` | VERIFIED | Step 3 of wm-publish.md, exact command present |
| 15 | `/wm-publish <slug>` waits with `gh run watch --exit-status` | VERIFIED | Step 4: `gh run watch "$RUN_ID" --exit-status` |
| 16 | After success, prints DNS guide with CNAME + 4 A records + CAA + SSL wait + deletion warning | VERIFIED | Step 5 contains all 5 elements; 185.199.108.153–111.153, pbau3r-sfdy.github.io, letsencrypt CAA note, SSL wait, Squarespace deletion warning |
| 17 | On publish.yml failure, /wm-publish surfaces failure details for log inspection | VERIFIED | Step 6: `gh run view "$RUN_ID" --log-failed` |
| 18 | E2E: live deploy produces site with CNAME + robots.txt Allow + wiring.json stage 6 | VERIFIED | parrot-capital/wiring.json: stage 6, last_deploy 2026-08-20, domain parrot-capital.com, prod_repo pbau3r-sfdy/parrot-capital; human-approved checkpoint in Plan 02 Task 2 |

**Score:** 18/18 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `_scripts/build-single.mjs` | Single-site production build wrapper | VERIFIED | ESM, spawnSync delegation, slug validation, exit-on-error |
| `.github/workflows/publish.yml` | Production deploy GitHub Actions workflow | VERIFIED | 9 steps, workflow_dispatch, WM_PUBLISH_PAT, validate-before-build, CNAME, robots.txt, JamesIves@v4.9.0, commit-back |
| `.claude/skills/wm-publish.md` | Operator-facing publish skill | VERIFIED | 6 steps, preflight integration, gh workflow run trigger, gh run watch, inline DNS guide |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `publish.yml` validate-wiring step | `sites/<slug>/wiring.json` | `node -e` inline script + `process.env.SLUG` | WIRED | Slug regex gate before file path construction |
| `publish.yml` JamesIves step | production repo gh-pages branch | `token: secrets.WM_PUBLISH_PAT`, `repository-name: steps.wiring.outputs.prod_repo` | WIRED | `repository-name:` (correct v4.8+ param, fixed in d6fe7f0) |
| `publish.yml` commit-back step | `sites/<slug>/wiring.json` in main | `git remote set-url origin` + git push origin main | WIRED | Origin reset before push (JamesIves overwrite fix in 6a3d1bf) |
| `wm-publish.md` Step 3 | `.github/workflows/publish.yml` | `gh workflow run publish.yml --field slug=<slug>` | WIRED | Exact command confirmed in file |
| `wm-publish.md` Step 4 | workflow run result | `gh run watch "$RUN_ID" --exit-status` | WIRED | Exit code surfaces to skill branch logic |

### Requirements Coverage

| Requirement | Plan | Description | Status | Evidence |
|-------------|------|-------------|--------|---------|
| DEPLOY-01 | 02 | `/wm-publish <slug>` build + push with SITE_URL/SITE_BASE | SATISFIED | wm-publish.md Step 3 triggers workflow; Step 5 in publish.yml sets SITE_URL/SITE_BASE env |
| DEPLOY-02 | 01 | validate stage≥5, domain, prod_repo before build | SATISFIED | publish.yml lines 57-59, before Build site step at line 70 |
| DEPLOY-03 | 01 | CNAME written before push | SATISFIED | publish.yml line 80 |
| DEPLOY-04 | 01 | robots.txt Allow before push | SATISFIED | publish.yml line 87 |
| DEPLOY-05 | 01 | wiring.json stage 6 + last_deploy after success | SATISFIED | publish.yml lines 109-110, 118 |
| DEPLOY-06 | 01 | Only targeted site built via build-single.mjs | SATISFIED | publish.yml Build site step calls `node _scripts/build-single.mjs "$SLUG"` |
| DEPLOY-07 | 02 | Squarespace DNS handoff guide | SATISFIED | wm-publish.md Step 5 with all 5 DNS guide sections |
| DEPLOY-08 | 01 | Classic PAT (WM_PUBLISH_PAT), not GITHUB_TOKEN | SATISFIED | WM_PUBLISH_PAT at lines 28, 94, 115; GITHUB_TOKEN in comments only |

**Note:** REQUIREMENTS.md checkboxes for DEPLOY-01 and DEPLOY-07 remain `[ ]` (stale — not updated after implementation). The traceability table also shows both as "Pending". The code satisfies both requirements fully. The documentation gap does not affect phase goal achievement but should be corrected.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `_scripts/build-single.mjs` | 15 | Uses `spawnSync` not `execSync` as specified in plan | Info | Functionally equivalent; spawnSync with array args is actually safer (avoids shell injection). Not a stub or placeholder. |
| `.github/workflows/publish.yml` | 92 | Uses `JamesIves@v4.9.0` not `@v4.8.0` as spec'd | Info | Upgraded during code-review commit e2db13e. Minor version bump. Not a regression. |

No TBD, FIXME, XXX, or placeholder patterns found in any phase-modified file.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| build-single.mjs no-arg exits 1 + usage | `node _scripts/build-single.mjs` | exit 1, "Usage: node _scripts/build-single.mjs <slug>" | PASS |
| build-single.mjs unknown slug exits 1 + error | `node _scripts/build-single.mjs nonexistent-slug-abc123` | exit 1, 'Error: site "nonexistent-slug-abc123" not found in sites/' | PASS |
| publish.yml workflow_dispatch trigger present | `grep -c workflow_dispatch publish.yml` | 1 | PASS |
| WM_PUBLISH_PAT used (not GITHUB_TOKEN) | `grep -c WM_PUBLISH_PAT publish.yml` | 4 | PASS |
| stage < 5 validation before build | line positions confirmed | validate-wiring at line 43, Build site at line 70 | PASS |
| [websites-org] placeholder removed | `grep -rn '\[websites-org\]' CLAUDE.md AGENTS.md` | no output | PASS |

### Human Verification Required

None — E2E human verification was completed during plan execution (Plan 02, Task 2). Evidence: parrot-capital/wiring.json shows stage 6 and last_deploy 2026-08-20, confirming the full pipeline ran end-to-end. Human checkpoint approved.

### Gaps Summary

No gaps. All 18 must-have truths are verified by direct codebase evidence and live behavioral checks.

**One documentation drift item to fix (non-blocking):** REQUIREMENTS.md checkboxes for DEPLOY-01 (`[ ]`) and DEPLOY-07 (`[ ]`) were not updated to `[x]` after implementation. The traceability table also still shows "Pending" for both. These should be updated to reflect actual state.

---

_Verified: 2026-08-20_
_Verifier: Claude (gsd-verifier)_

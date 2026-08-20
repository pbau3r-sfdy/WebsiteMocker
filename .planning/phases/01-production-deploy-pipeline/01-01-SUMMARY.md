---
phase: 01-production-deploy-pipeline
plan: "01"
subsystem: deploy-pipeline
tags: [github-actions, build-scripts, production-deploy, esm, workflow]
dependency_graph:
  requires: []
  provides:
    - _scripts/build-single.mjs single-site production build wrapper
    - .github/workflows/publish.yml production deploy workflow (workflow_dispatch)
  affects:
    - CLAUDE.md documentation accuracy (pbau3r-sfdy org resolved)
    - AGENTS.md Phase 1 blocker list and TODO markers
tech_stack:
  added:
    - publish.yml GitHub Actions workflow (workflow_dispatch, JamesIves/github-pages-deploy-action@v4.8.0)
    - build-single.mjs ESM Node script (child_process execSync delegation pattern)
  patterns:
    - validate-before-build gate (wiring.json read + stage/domain/prod_repo checks before build step)
    - PAT-authenticated cross-repo gh-pages push
    - wiring.json commit-back after successful deploy
    - slug regex validation (^[a-z0-9-]+$) before file path construction
key_files:
  created:
    - _scripts/build-single.mjs
    - .github/workflows/publish.yml
  modified:
    - CLAUDE.md
    - AGENTS.md
decisions:
  - "build-single.mjs delegates to build-all.js via execSync subprocess (not module import) so stdio inheritance works correctly"
  - "publish.yml checkout uses WM_PUBLISH_PAT (not GITHUB_TOKEN) so commit-back git push succeeds"
  - "robots.txt swap uses printf (not sed) — writes complete desired content rather than string substitution that could break on formatting variations"
  - "GITHUB_TOKEN appears in publish.yml comments only (explaining why it is NOT used) — no functional reference"
metrics:
  duration: "2 minutes"
  completed: "2026-08-20"
  tasks_completed: 3
  tasks_total: 3
  files_created: 2
  files_modified: 2
---

# Phase 1 Plan 01: Build Pipeline + Publish Workflow Summary

**One-liner:** Production deploy workflow (publish.yml) + single-site build wrapper (build-single.mjs) with validate-before-build gate, CNAME injection, robots.txt swap, PAT-authenticated cross-repo gh-pages push, and wiring.json commit-back.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create _scripts/build-single.mjs | f2286de | _scripts/build-single.mjs |
| 2 | Create .github/workflows/publish.yml | 54132e4 | .github/workflows/publish.yml |
| 3 | Replace [websites-org] placeholder, update AGENTS.md | f39e13e | CLAUDE.md, AGENTS.md |

## What Was Built

### _scripts/build-single.mjs

ESM Node script that wraps `build-all.js` for single-site production builds. Key behaviors:
- Exits 1 with "Usage:" message when no slug argument provided
- Exits 1 with "not found in sites/" message for unknown slugs
- Delegates to `build-all.js` via `execSync` subprocess (stdio: inherit) so SITE_URL/SITE_BASE env vars pass through
- Root resolved via `fileURLToPath(import.meta.url)` — not CWD-dependent

### .github/workflows/publish.yml

9-step GitHub Actions workflow triggered by `workflow_dispatch` with a required `slug` input:

1. **Checkout** — uses `WM_PUBLISH_PAT` (enables commit-back push in step 9)
2. **Setup Node 22** — pinned major, npm cache
3. **Install dependencies** — `npm ci --no-fund --no-audit`
4. **Read and validate wiring.json** — slug regex gate + stage≥5 + domain + prod_repo checks; outputs domain and prod_repo as step outputs; exits non-zero on any failure BEFORE build
5. **Build site** — `node _scripts/build-single.mjs <slug>` with `SITE_URL` and `SITE_BASE` production env vars
6. **Inject CNAME** — writes domain value to `dist/<slug>/CNAME` for custom domain persistence
7. **Swap robots.txt** — `printf 'User-agent: *\nAllow: /\n'` overwrites sandbox Disallow
8. **Push to production gh-pages** — `JamesIves/github-pages-deploy-action@v4.8.0` with `WM_PUBLISH_PAT` and `repository: prod_repo`
9. **Update wiring.json stage 6** — sets `stage: 6`, `last_deploy: YYYY-MM-DD`, commits back to main

Concurrency group `publish-${{ inputs.slug }}` prevents parallel deploys for the same site.

### CLAUDE.md + AGENTS.md

- All `[websites-org]` placeholder occurrences replaced with `pbau3r-sfdy` (3 in CLAUDE.md, 1 in AGENTS.md)
- AGENTS.md Phase 1 blocker list removed (blockers resolved by this plan)
- AGENTS.md repository layout TODO markers removed from build-single.mjs and publish.yml lines
- AGENTS.md Commands section updated with `node _scripts/build-single.mjs <slug>`

## Verification Evidence

```
node _scripts/build-single.mjs          → exit 1, "Usage: node _scripts/build-single.mjs <slug>"
node _scripts/build-single.mjs bad-slug → exit 1, "Error: site \"bad-slug\" not found in sites/"
grep -c workflow_dispatch publish.yml   → 1
grep -c WM_PUBLISH_PAT publish.yml      → 3
stage < 5 at line 53, Build site at line 63 (validate before build ✓)
grep -rn '\[websites-org\]' CLAUDE.md AGENTS.md → no output (PASS)
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — no hardcoded empty values or placeholder text in the created/modified files.

## Threat Flags

All T-01-01 through T-01-SC mitigations from the plan's threat model were implemented:

| Threat | Mitigation Implemented |
|--------|----------------------|
| T-01-01 Tampering via slug | slug validated against `^[a-z0-9-]+$` in step 4 before any file path construction |
| T-01-03 Secret disclosure | WM_PUBLISH_PAT only referenced via `${{ secrets.WM_PUBLISH_PAT }}` — never echoed or interpolated |
| T-01-05 Concurrent deploys | `concurrency: group: publish-${{ inputs.slug }}` with `cancel-in-progress: false` |

No new security surface beyond the plan's threat model was introduced.

## Self-Check: PASSED

- `_scripts/build-single.mjs` exists and exits correctly: FOUND
- `.github/workflows/publish.yml` exists with all required elements: FOUND
- `CLAUDE.md` contains no `[websites-org]`: CONFIRMED
- `AGENTS.md` contains no `[websites-org]`: CONFIRMED
- Commits f2286de, 54132e4, f39e13e exist: VERIFIED

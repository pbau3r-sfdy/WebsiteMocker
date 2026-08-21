---
phase: 1
slug: production-deploy-pipeline
status: verified
threats_open: 0
asvs_level: 1
created: 2026-08-20
---

# Phase 1 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Operator CLI → GitHub API | `/wm-publish` passes slug to `gh workflow run` — operator-controlled string enters GitHub API | Site slug (non-sensitive) |
| GitHub Actions Runner → WebsiteMocker repo | Reads source, wiring.json; commits wiring.json stage 6 back to main via PAT | wiring.json (configuration) |
| GitHub Actions Runner → Production repo | Pushes built static output to external repo's gh-pages branch via WM_PUBLISH_PAT | Built HTML/CSS/JS output |
| gh CLI → GitHub Actions | `workflow_dispatch` event with slug field triggers publish.yml in the runner | Site slug (non-sensitive) |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-01-01 | Tampering | `inputs.slug` used in file paths (publish.yml step 4) | mitigate | Slug validated against `^[a-z0-9-]+$` before any file path construction (publish.yml line 49) | closed |
| T-01-02 | Elevation of Privilege | WM_PUBLISH_PAT has `repo` scope on checkout + commit-back | accept | Required for cross-repo push and commit-back; Classic PAT minimum viable scope; access restricted to org members who can trigger workflow_dispatch | closed |
| T-01-03 | Information Disclosure | WM_PUBLISH_PAT value in workflow env | mitigate | Referenced only via `${{ secrets.WM_PUBLISH_PAT }}` — never echoed, logged, or interpolated into shell strings; GitHub masks registered secrets in logs | closed |
| T-01-04 | Tampering | Workflow commits back to main branch (wiring.json) | accept | Only updates `stage` and `last_deploy` fields; cannot overwrite arbitrary content; required behavior per D-08 | closed |
| T-01-05 | Denial of Service | Concurrent deploys for same slug could conflict | mitigate | `concurrency: group: publish-${{ inputs.slug }}` with `cancel-in-progress: false` prevents parallel runs for the same site | closed |
| T-01-SC | Tampering | `npm ci` installs packages from lockfile in GitHub Actions runner | mitigate | `npm ci` uses package-lock.json exactly (no resolution drift); lockfile sync verified and fixed during E2E (commit 53a0bc0) | closed |
| T-02-01 | Tampering | Slug passed from `/wm-publish` skill to `gh workflow run` | accept | Slug validated downstream by publish.yml step 4 (`^[a-z0-9-]+$`) before any file path use; gh CLI handles shell escaping | closed |
| T-02-02 | Information Disclosure | `gh run watch` streams full workflow log to terminal | accept | No secrets are logged; WM_PUBLISH_PAT is masked by GitHub in all log output | closed |
| T-02-03 | Denial of Service | `gh run watch` blocks indefinitely if workflow hangs | accept | publish.yml has `timeout-minutes: 30`; workflow runner terminates automatically | closed |
| T-02-SC | Tampering | Package installs in Plan 02 scope | accept | No package installs in Plan 02 scope — only skill file creation | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-01-02 | WM_PUBLISH_PAT `repo` scope is the minimum required for cross-repo gh-pages push and commit-back; no narrower scope exists for this use case | Phase 1 plan | 2026-08-20 |
| AR-02 | T-01-04 | Commit-back to main is required pipeline behavior (DEPLOY-05/D-08); field scope limited to `stage` and `last_deploy` | Phase 1 plan | 2026-08-20 |
| AR-03 | T-02-01 | Downstream validation in publish.yml (slug regex) is the authoritative gate; gh CLI invocation from the skill is non-interactive and operator-controlled | Phase 1 plan | 2026-08-20 |
| AR-04 | T-02-02 | GitHub's secret masking covers WM_PUBLISH_PAT in all log output; no additional masking needed | Phase 1 plan | 2026-08-20 |
| AR-05 | T-02-03 | 30-minute timeout in publish.yml is an appropriate ceiling for a static site build+deploy | Phase 1 plan | 2026-08-20 |
| AR-06 | T-02-SC | No package installs in Plan 02; risk surface is absent | Phase 1 plan | 2026-08-20 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-20 | 10 | 10 | 0 | gsd-secure-phase (orchestrator) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-20

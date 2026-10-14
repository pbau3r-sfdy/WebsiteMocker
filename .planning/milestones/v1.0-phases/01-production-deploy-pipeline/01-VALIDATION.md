---
phase: 1
slug: production-deploy-pipeline
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for Phase 1: Production Deploy Pipeline.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell (bash) — no JS/Python test framework; deliverables are a Node CLI script, a GitHub Actions YAML, and a Claude skill file |
| **Config file** | none — standalone script |
| **Quick run command** | `bash _scripts/verify-phase-01.sh` |
| **Full suite command** | `bash _scripts/verify-phase-01.sh` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bash _scripts/verify-phase-01.sh`
- **After every plan wave:** Run `bash _scripts/verify-phase-01.sh`
- **Before `/gsd:verify-work`:** Full suite must be green (exit 0)
- **Max feedback latency:** ~3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-T1 | 01 | 1 | DEPLOY-02, DEPLOY-06 | T-01-01 | slug regex gate before file path construction | shell | `bash _scripts/verify-phase-01.sh` | ✅ | ✅ green |
| 01-01-T2 | 01 | 1 | DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05, DEPLOY-06, DEPLOY-08 | T-01-01, T-01-03, T-01-05, T-01-SC | validate-before-build; PAT only; concurrency guard; lockfile | shell | `bash _scripts/verify-phase-01.sh` | ✅ | ✅ green |
| 01-01-T3 | 01 | 1 | — | — | placeholder removed; no org leak | shell | `bash _scripts/verify-phase-01.sh` | ✅ | ✅ green |
| 01-02-T1 | 02 | 2 | DEPLOY-01, DEPLOY-07 | T-02-01 | skill validates slug before gh invocation; DNS guide present | shell | `bash _scripts/verify-phase-01.sh` | ✅ | ✅ green |
| 01-02-T2 | 02 | 2 | DEPLOY-01, DEPLOY-05 | T-01-02, T-01-04 | live deploy produced correct output; wiring commit-back succeeded | manual | E2E human checkpoint (Plan 02 Task 2) | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all automated phase requirements.

`_scripts/verify-phase-01.sh` was created as part of this Nyquist audit. It consolidates all verify blocks from PLAN files into a single runnable artifact (32 checks, ~3 seconds).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| E2E live deploy produces working site (CNAME + robots.txt Allow + wiring stage 6) | DEPLOY-01, DEPLOY-05 | Requires a live GitHub Actions run against a real production repo and GitHub Pages provisioning | Run `/wm-publish <slug>` for any stage-5 site; confirm gh-pages branch updated, CNAME file present, robots.txt shows Allow, wiring.json shows stage 6 and last_deploy = today. Evidence: parrot-capital human-approved E2E (Plan 02 Task 2, 2026-08-20). |
| wiring.json commit-back actually lands in main branch | DEPLOY-05 | Requires live GitHub Actions write-back to remote | After `/wm-publish`, confirm `git log` on main shows the `chore(<slug>): mark stage 6, live` commit from the Actions bot. Evidence: parrot-capital `04bd80b` commit present. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or manual-only documentation
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0: `_scripts/verify-phase-01.sh` created with 32 checks — all green
- [x] No watch-mode flags
- [x] Feedback latency < 5s (`bash _scripts/verify-phase-01.sh` ≈ 3s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-20

---

## Validation Audit 2026-08-20

| Metric | Count |
|--------|-------|
| Gaps found | 8 (all requirements: PARTIAL — commands existed in PLAN files but no runnable artifact) |
| Resolved | 8 (consolidated into `_scripts/verify-phase-01.sh`, 32 checks, all green) |
| Escalated to manual-only | 1 (E2E live deploy + commit-back, already human-verified) |

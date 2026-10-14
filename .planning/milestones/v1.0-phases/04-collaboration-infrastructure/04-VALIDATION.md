---
phase: 4
slug: collaboration-infrastructure
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-25
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for Phase 4: Collaboration Infrastructure.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell (bash) structural checks plus GitHub CLI (`gh`) live workflow/API verification |
| **Config file** | none — standalone script and live GitHub Actions evidence |
| **Quick run command** | `bash _scripts/verify-phase-04.sh` |
| **Full suite command** | `bash _scripts/verify-phase-04.sh` |
| **Measured runtime** | 1.87 seconds real (0.40s user, 0.28s sys) |

---

## Sampling Rate

- **After every task commit:** Run `bash _scripts/verify-phase-04.sh`
- **After every plan wave:** Run `bash _scripts/verify-phase-04.sh`
- **Before `/gsd:verify-work`:** Full suite must be green (exit 0)
- **Max measured feedback latency:** 1.87 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command / Evidence | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|------------------------------|-------------|--------|
| 04-01-T1 | 01 | 1 | COLLAB-04, COLLAB-05 | T-04-01, T-04-02, T-04-06 | Harness encodes slug, Markdown-only, and no-publish guards | shell | `bash _scripts/verify-phase-04.sh` | ✅ | ✅ green |
| 04-01-T2 | 01 | 1 | COLLAB-04, COLLAB-05 | T-04-01–T-04-06 | Dispatch receiver validates slug, copies only regular Markdown, never builds or deploys | shell + live | harness; sync runs `32824173999`, `32824259466` | ✅ | ✅ green |
| 04-02-T1 | 02 | 2 | COLLAB-01, COLLAB-05 | T-04-29 | Contributor copy promises review-before-live | shell | `bash _scripts/verify-phase-04.sh` | ✅ | ✅ green |
| 04-02-T2 | 02 | 2 | COLLAB-02, COLLAB-03 | T-04-10, T-04-11 | Structured labelled forms; blank issues disabled | shell | `bash _scripts/verify-phase-04.sh` | ✅ | ✅ green |
| 04-02-T3 | 02 | 2 | COLLAB-05 | T-04-07–T-04-09, T-04-12 | Content-only push dispatches with the separated credential | shell + live | harness; Content CI runs `32824163458`, `32824250273` | ✅ | ✅ green |
| 04-03-T1 | 03 | 3 | COLLAB-01–COLLAB-04 | T-04-13, T-04-16, T-04-18 | Installer validates inputs and renders templates safely | shell | `bash _scripts/verify-phase-04.sh` | ✅ | ✅ green |
| 04-03-T2 | 03 | 3 | COLLAB-01–COLLAB-04 | T-04-14, T-04-15, T-04-30 | Installer preserves gh-pages, orders labels first, and is idempotent | shell | `bash _scripts/verify-phase-04.sh` | ✅ | ✅ green |
| 04-04-T1 | 04 | 4 | COLLAB-01, COLLAB-05 | T-04-19–T-04-21 | Operator skill documents narrow PAT scope and safe secret handling | shell | `bash _scripts/verify-phase-04.sh` | ✅ | ✅ green |
| 04-04-T2 | 04 | 4 | COLLAB-01, COLLAB-05 | T-04-22, T-04-31 | Durable docs preserve sync-not-publish constraints | shell | `bash _scripts/verify-phase-04.sh` | ✅ | ✅ green |
| 04-05-T1 | 05 | 5 | COLLAB-01–COLLAB-05 | T-04-23, T-04-24 | Dispatch credential is operational without exposing the publish credential | live | Content CI runs `32824163458`, `32824250273` succeeded | ✅ | ✅ green |
| 04-05-T2 | 05 | 5 | COLLAB-01–COLLAB-05 | T-04-25, T-04-30 | Contributor repo setup remains operational | prior live + shell | Phase 4 summary evidence; current full harness | ✅ | ✅ green |
| 04-05-T3 | 05 | 5 | COLLAB-05 | T-04-26–T-04-28, T-04-32, T-04-33 | Real push syncs for review, does not publish, and deletion is additive-only | live | runs `32824163458` → `32824173999`; deletion runs `32824250273` → `32824259466` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

The phase-wide infrastructure pre-existed this validation audit. `_scripts/verify-phase-04.sh` is executable, supports section filters `01`, `02`, `03`, `04`, and `all`, and currently contains **62 checks**. The measured full run completed with **62 passed, 0 failed** in 1.87 seconds. `wave_0_complete: true` records that this runnable infrastructure was already in place before the DEXP-05 live-fire audit.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Evidence / Result |
|----------|-------------|------------|-------------------|
| Live contributor round trip without publish | COLLAB-05 | Requires real cross-repository GitHub Actions and live-site observation | Production commit `1a522b4e3319be9234d926099f199337a5a345d0`; Content CI `32824163458` success; Sync Content `32824173999` success; synced `sites/mogwai-systems/src/content/news/2026-08-25-e2e-sync-test.md`; remote commit message `chore(mogwai-systems): sync content from production repo`; marker counts: `/news/` = 0 (HTTP 404), `/` = 0 (HTTP 200); no publish run. |
| Additive-only deletion policy | COLLAB-05 | Requires deleting real contributor content and observing a second dispatch | Production deletion `a32b71e363171dfc1cddcfa58bdf2588dd7b173e`; Content CI `32824250273` success; Sync Content `32824259466` success with `No content changes`; immediately afterward WebsiteMocker returned 200 with marker while production returned 404. |
| GitHub web UI contributor experience | COLLAB-01, COLLAB-02, COLLAB-03 | Visual form presentation and prose quality require browser judgment | The DEXP-05 test used the GitHub Contents API, exercising the identical `main` push, `content/**/*.md` filter, Content CI, repository dispatch, and content-sync code path. Existing Phase 4 verification records the web-UI-specific presentation checks. |

---

## Validation Sign-Off

- [x] Every Phase 4 task has automated coverage, live evidence, or an explicit manual-only record
- [x] Sampling continuity: no 3 consecutive tasks without automated verification
- [x] Wave 0: `_scripts/verify-phase-04.sh` pre-existed and is green (62/62)
- [x] Live push-to-sync contributor round trip completed successfully
- [x] Live deletion proved the D-A4 additive-only policy
- [x] D-A6 proved: no publish workflow ran and both live marker counts were 0
- [x] Both repositories restored to their pre-test file inventories
- [x] No watch-mode flags
- [x] Feedback latency < 5s (measured 1.87s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** verified 2026-08-25

---

## Validation Audit 2026-08-25

| Metric | Count |
|--------|-------|
| Previously uncertain observable truths | 1 (live contributor push → cross-repo sync without publish) |
| Resolved | 1 (two successful live round trips plus cleanup) |
| Automated harness checks | 62 passed, 0 failed |
| Live workflow runs | 4 passed, 0 failed |
| Live-site marker detections | 0 across 2 URLs |
| Additive-only assertions | 1 proven (WebsiteMocker 200 vs production 404) |
| Escalated to manual-only | 1 presentation-only check (GitHub web UI contributor experience) |

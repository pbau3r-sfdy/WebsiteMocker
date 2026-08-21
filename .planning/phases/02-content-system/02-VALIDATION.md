---
phase: 2
slug: content-system
status: verified
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-20
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for Phase 2: Content System.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell (bash) — deliverables are TypeScript/Astro source files and markdown skill files; no runtime test framework added this phase |
| **Config file** | none — standalone script |
| **Quick run command** | `bash _scripts/verify-phase-02.sh` |
| **Full suite command** | `bash _scripts/verify-phase-02.sh` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bash _scripts/verify-phase-02.sh`
- **After every plan wave:** Run `bash _scripts/verify-phase-02.sh`
- **Before `/gsd:verify-work`:** Full suite must be green (exit 0)
- **Max feedback latency:** ~2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-T1 | 01 | 1 | CONTENT-02, CONTENT-03 | T-02-01 | Schema-only, no defineCollection/runtime | shell | `bash _scripts/verify-phase-02.sh` | ✅ | ✅ green |
| 02-01-T2 | 01 | 1 | CONTENT-02 | T-02-01 | Token-only CSS, no hardcoded hex | shell | `bash _scripts/verify-phase-02.sh` | ✅ | ✅ green |
| 02-02-T1 | 02 | 1 | CONTENT-05 | T-02-02 | Astro 5 API (render/id), no legacy patterns | shell | `bash _scripts/verify-phase-02.sh` | ✅ | ✅ green |
| 02-02-T2 | 02 | 1 | CONTENT-06 | T-02-02 | Open filter, TypeBadge | shell | `bash _scripts/verify-phase-02.sh` | ✅ | ✅ green |
| 02-03-T1 | 03 | 1 | CONTENT-07 | T-02-03 | AnnouncementCard gap, TagPill | shell | `bash _scripts/verify-phase-02.sh` | ✅ | ✅ green |
| 02-03-T2 | 03 | 1 | CONTENT-08 | T-02-03 | Blog auto-fill grid, translateY | shell | `bash _scripts/verify-phase-02.sh` | ✅ | ✅ green |
| 02-04-T1 | 04 | 2 | CONTENT-01, CONTENT-05 | T-02-04-A, T-02-04-B | No Astro 4 API; legacy config deleted | shell | `bash _scripts/verify-phase-02.sh` | ✅ | ✅ green |
| 02-04-T2 | 04 | 2 | CONTENT-01 | T-02-04-A | Build passes, 6 URLs preserved | manual | `node _scripts/build-all.js sfdy-alt-clean` | ✅ | ✅ green |
| 02-05-T1 | 05 | 2 | CONTENT-04 | T-02-05 | 4 glob() loaders, .gitkeep dirs | shell | `bash _scripts/verify-phase-02.sh` | ✅ | ✅ green |
| 02-05-T2 | 05 | 2 | CONTENT-04 | T-02-05 | parrot-capital Layout token-only CSS | shell | `bash _scripts/verify-phase-02.sh` | ✅ | ✅ green |
| 02-06-T1 | 06 | 2 | CONTENT-01, CONTENT-06 | T-02-06 | sfdy jobs/announcements pages, open filter | shell | `bash _scripts/verify-phase-02.sh` | ✅ | ✅ green |
| 02-06-T2 | 06 | 2 | CONTENT-01, CONTENT-08 | T-02-06 | sfdy blog pages, auto-fill grid | shell | `bash _scripts/verify-phase-02.sh` | ✅ | ✅ green |
| 02-07-T1 | 07 | 2 | CONTENT-01, CONTENT-05–08 | T-02-07 | mogwai 8 pages, no Nav imports | shell | `bash _scripts/verify-phase-02.sh` | ✅ | ✅ green |
| 02-08-T1 | 08 | 2 | CONTENT-01, CONTENT-05–08 | T-02-08 | parrot 8 pages, no Nav/Footer | shell | `bash _scripts/verify-phase-02.sh` | ✅ | ✅ green |
| 02-09-T1 | 09 | 3 | CONTENT-09, CONTENT-10 | T-02-09 | 4 skills with quoted date + git commit | shell | `bash _scripts/verify-phase-02.sh` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all automated phase requirements.

`_scripts/verify-phase-02.sh` was created as part of this Nyquist audit. It consolidates all verify blocks from 9 PLAN files into a single runnable artifact (68 checks, ~2 seconds).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All 3 active sites build cleanly with 4 content types | CONTENT-01 | Requires Astro build to run (30-60s per site) | `node _scripts/build-all.js sfdy-alt-clean && node _scripts/build-all.js mogwai-systems && node _scripts/build-all.js parrot-capital` — all must exit 0. Verified during UAT (2026-08-20). |
| sfdy-alt-clean 6 news article URLs preserved after migration | CONTENT-01 | Requires checking generated dist/ routes | Build sfdy-alt-clean; confirm 6 `/news/YYYY-MM-DD-slug/` routes in dist/. SUMMARY evidence: entry.id == former post.slug for all 6 articles. |
| Content files editable via GitHub web UI | CONTENT-10 | Requires testing the GitHub web editor | Edit a `.md` content file via GitHub web UI; confirm CI doesn't reject the date string format (z.coerce.date() handles it). |

---

## Validation Sign-Off

- [x] All tasks have automated verify or manual-only documentation
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0: `_scripts/verify-phase-02.sh` created with 68 checks — all green
- [x] No watch-mode flags
- [x] Feedback latency < 5s (~2s)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-20

---

## Validation Audit 2026-08-20

| Metric | Count |
|--------|-------|
| Gaps found | 10 (all CONTENT-* requirements: PARTIAL — commands in PLAN files, no runnable artifact) |
| Resolved | 10 (consolidated into `_scripts/verify-phase-02.sh`, 68 checks, all green) |
| Escalated to manual-only | 3 (full builds, URL preservation check, GitHub web UI edit) |

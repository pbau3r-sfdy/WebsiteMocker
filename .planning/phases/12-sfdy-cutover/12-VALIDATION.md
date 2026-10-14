---
phase: 12
slug: sfdy-cutover
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-14
---

# Phase 12 — Validation Strategy

> Derived from 12-RESEARCH.md "Validation Architecture". Becomes compliant after execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Bash harness `_scripts/verify-phase-12.sh` (PASS/FAIL counters, same style as `verify-phase-10.sh`, `verify-phase-11-1.sh`) |
| **Config file** | none; fixtures under `_staging/phase12/` (gitignored) |
| **Quick run command** | `bash _scripts/verify-phase-12.sh rename` (or the section the task touches) |
| **Full suite command** | `bash _scripts/verify-phase-12.sh all && bash _scripts/verify-phase-11-1.sh && bash _scripts/verify-phase-10.sh all && bash _scripts/verify-phase-09.sh all` |
| **Opt-in (network)** | `sync-live`, `live` (not part of `all`) |
| **Estimated runtime** | ~30 s per section, builds ~1 min each |

---

## Sampling Rate

- **After every task commit:** the harness section the task touches
- **After every plan wave:** `bash _scripts/verify-phase-12.sh all` plus the 11.1 and 10 harnesses (regression)
- **Phase gate:** full suite green before Gate A (push); `sync-live` after Gate B; `live` after Gate C
- **Max feedback latency:** ~60 s (two builds)

---

## Per-Requirement Verification Map

| Requirement | Plan | Secure behavior | Test type | Automated command | Status |
|-------------|------|-----------------|-----------|-------------------|--------|
| CUT-01 jobs gone (Coming-soon allowed) | 12-01 | RETL-04 state survives the rename | harness regression | `SLUG=sfdy bash _scripts/verify-phase-11-1.sh` | ⬜ pending |
| CUT-02 no internal pages/text in prod | 12-02 | no open-points, tbd-pill, internal review, noindex in prod dist; sandbox keeps them | build + grep | `verify-phase-12.sh prod`, `sandbox`, `gate` | ⬜ pending |
| CUT-03 legal reviewed | 12-03 | analytics gate passes; checklist handed over (not a gate) | gate + doc | `node _scripts/check-analytics-gate.mjs sfdy --live`; `12-LEGAL-CHECKLIST.md` | ⬜ pending (sign-off manual) |
| CUT-04 production identity, preflight | 12-03, 12-05 | prod_repo, domain, stage >= 5, sandboxUsesProdId absent, single owner | jq | `verify-phase-12.sh ident` | ⬜ pending |
| CUT-05 contributor content reaches site, jobs handled | 12-03, 12-04 | slug regex, jobs guard, live slug sfdy | fixture + live | `verify-phase-12.sh sync`, `sync-live` | ⬜ pending |
| CUT-06 publish and live verification | 12-05 | backup sha, CNAME, robots Allow, .nojekyll, css 200, stage 6 | live | `BACKUP_SHA=<sha> verify-phase-12.sh live` | ⬜ pending |
| CUT-07 / DSYNC-11 design seed | 12-06 | only tokens/colors.css and assets/logo/*, no deletes, no uploads/ | dry run + manual | `design-seed.mjs sfdy ... --dry-run`; plan.json grep | ⬜ pending (write manual) |
| D-01/D-02 rename, old site removal | 12-01, 12-02 | `_captures/sfdy` kept, no nested folder, lockfile CI-valid | harness | `verify-phase-12.sh rename`, `old` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ partial*

---

## Wave 0 Requirements

- [ ] `_scripts/verify-phase-12.sh` (created in 12-02; sections added in 12-03, 12-04, 12-05)
- [ ] `_scripts/internal-pages.mjs` and `src/data/internal.ts` (spike confirming injectRoute)
- [ ] `_scripts/sync-content.sh` (testable sync loop)
- [ ] `verify-phase-10.sh` and `verify-phase-11-1.sh` parameterised for `sfdy`
- [ ] `sites/sfdy/public/.nojekyll`
- [ ] Clean-worktree `npm ci --dry-run` recipe (12-01)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Push to origin main (Gate A) | CUT-05 | external, shared remote | Operator reviews `git log origin/main..HEAD`, approves, deploy run green |
| Prod repo slug patch and test push (Gate B) | CUT-05 | external write | Operator approves each write/push; sync commit appears; test file reverted both sides |
| Backup and publish (Gate C) | CUT-06 | force-overwrites live site | Operator go; `gh-pages-old-2026-08` sha recorded; rollback recipe in SUMMARY |
| Plausible pageview from live domain | CUT-06 | no stats API on plan | Browse the live site, check Plausible realtime |
| Legal sign-off | CUT-03 | operator or lawyer | Fill the "Operator/lawyer OK" column in `12-LEGAL-CHECKLIST.md` |
| Design seed write (Gate D) | CUT-07 | needs DesignSync and two approvals | Approve path list, then `finalize_plan`; compare `list_files` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] `nyquist_compliant: true` set in frontmatter after execution

**Approval:** pending

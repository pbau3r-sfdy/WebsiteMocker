---
phase: 11
slug: open-drops
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-14
---

# Phase 11 — Validation Strategy

> Derived from 11-RESEARCH.md "Validation Architecture". Becomes compliant after execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Bash harness `_scripts/verify-phase-11.sh` (PASS/FAIL counters, same style as `verify-phase-10.sh`, `verify-phase-12.sh`); sections live in `_scripts/verify-phase-11.d/NN-name.sh` so same-wave plans never edit one file |
| **Config file** | none; fixtures generated at run time into `_staging/phase11/` (gitignored) with relative dates |
| **Quick run command** | `bash _scripts/verify-phase-11.sh lib && bash _scripts/verify-phase-11.sh pdf` (target < 30 s) |
| **Full suite command** | `bash _scripts/verify-phase-11.sh all && bash _scripts/verify-phase-10.sh all && bash _scripts/verify-phase-12.sh all` |
| **Opt-in (network)** | `live` (ids from env `ACTIVE_ID`, `WITHDRAWN_ID`, `EXPIRED_ID`; never part of `all`) |
| **Estimated runtime** | ~30 s per non-build section, builds ~1 min each |

---

## Sampling Rate

- **After every task commit:** the harness section the task touches (`lib`, `pdf`, `cli`, `build`, `sandbox`, `track`, `ci`, `docs`)
- **After every plan wave:** `bash _scripts/verify-phase-11.sh all` plus the Phase 10 and Phase 12 harnesses (regression)
- **Phase gate:** all offline sections green before gate G3 (push); `live` after the G5 republish
- **Max feedback latency:** ~60 s (two builds)

---

## Per-Requirement Verification Map

| Requirement | Plan | Secure behavior | Test type | Automated command | Status |
|-------------|------|-----------------|-----------|-------------------|--------|
| DROP-01 collection: 32-hex id, mandatory expires, horizon | 11-01, 11-02 | id format, date-only/offset/horizon rejected, folder match, label never contains id | unit | `verify-phase-11.sh lib` | ⬜ pending |
| DROP-02 CLI new/list/withdraw/expire (+ check) | 11-04 | dry run by default, tombstones id-only, qpdf missing aborts before writing, CI output counts only | integration | `verify-phase-11.sh cli` | ⬜ pending |
| DROP-03 route + DropLayout, sfdy adopts | 11-02 | neutral title, no OG/nav/footer/links, standalone layout | build + grep | `verify-phase-11.sh build` | ⬜ pending |
| DROP-04 filtering, meta, exclusions, sandbox gate | 11-02, 11-05 | expired/withdrawn absent, id in no other dist file, no sitemap/RSS/robots entry, no `src/content/drops`, sandbox has no `/d/` without flag, `deploy.yml` free of drops/PAT | build + static | `verify-phase-11.sh build`, `sandbox`, `ci` | ⬜ pending |
| DROP-05 PDF strip, fail without tool | 11-01, 11-02, 11-05 | deny-list absent, `qpdf --check` clean, negative control, encrypted rejected, DROP-05 message, CI installs qpdf | unit + build | `verify-phase-11.sh pdf`, `build`, `ci` | ⬜ pending |
| DROP-06 tracking without id | 11-03 | whitelist on drop pages, `Drop Download` no props, id absent from every payload type and from inline snippet, label only behind `analytics.props` | vectors + eval | `verify-phase-11.sh track`, `verify-phase-10.sh all` | ⬜ pending |
| DROP-07 preflight/publish warnings | 11-04, 11-05 | expired/soon/expiry-less/secret-looking warnings, list of drops to publish, CI check step | unit + doc grep | `verify-phase-11.sh cli`, `docs`, `ci` | ⬜ pending |
| DROP-08 withdrawal, unlisting-only wording, 404 after publish | 11-04, 11-05, 11-06 | source removal + tombstone, docs wording, health job warns on withdrawn/expired-but-live, live 404 | cli + docs + live | `verify-phase-11.sh cli`, `docs`, `live` | ⬜ pending |
| DROP-09 harness static + live, prints what it cannot verify | 11-01..11-06 | dispatcher prints cannot-verify list after `all`/`live` | harness | `verify-phase-11.sh all`, `live` | ⬜ pending |
| DROP-10 /wm-drop skill + confidentiality text | 11-04 | confidential-but-not-secret, not export-controlled/classified | doc grep | `verify-phase-11.sh docs` | ⬜ pending |
| D-06 token health | 11-05, 11-06 | expiry < 14 days fails, drops repo private, no token printed, no `continue-on-error` | vectors + static + first run | `verify-phase-11.sh ci`; manual `gh workflow run drops-health.yml` (G6) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ partial*

---

## Wave 0 Requirements

- [ ] `_scripts/verify-phase-11.sh` dispatcher and `_scripts/verify-phase-11.d/` section files (created across plans 11-01..11-05)
- [ ] `_scripts/fixtures/drops/gen.mjs` and `make-pdf.mjs` (runtime dates, generated PDF with metadata markers)
- [ ] `_scripts/fixtures/analytics/wiring/drops-on.json`, `drops-props-on.json` and new vectors in `payloads.mjs`
- [ ] `.gitignore`: `_drops/`
- [ ] Q6 spike result `11-SPIKE.md` (DEV_PREVIEW verdict)
- [ ] No framework install needed (qpdf present locally via brew; installed by apt in CI)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Create private repo `pbau3r-sfdy/drops` (G1) | DROP-01, D-01 | external write | Operator types approval; `gh repo view` shows private with a commit |
| Extend `WM_PUBLISH_PAT` to the drops repo, record expiry date (G2) | D-02, D-06 | token settings are operator-only, Claude never sees the value | Operator edits token access, reports the expiry date; recorded in `docs/drops.md` |
| Push to origin main (G3) | DROP-04 | shared remote | Operator reviews `git log origin/main..HEAD`, approves; deploy run green; sandbox `/d/` returns 404 |
| Create Plausible goal `Drop Download` (G4) | DROP-06 | Plausible UI, no API write | Operator creates the exact, case-sensitive custom-event goal |
| Test drop publish, withdraw, republish, 404 proof (G5) | DROP-08, DROP-09 | publishes to the live production gh-pages tree | Operator approves each push/publish; `ACTIVE_ID` 200 then `WITHDRAWN_ID` 404 via `verify-phase-11.sh live` |
| First manual `drops-health.yml` run (G6) | D-06 | needs the workflow on origin and the extended token | `gh workflow run drops-health.yml`; both jobs green; log has no 32-hex string |
| Plausible event arrival | DROP-06 | no Stats API on the current plan | Click the attachment on the live test drop; see `Drop Download` in realtime; id absent from the Pages report |
| Response headers, search/archive copies, token write scope | DROP-09 | not observable from static checks | Listed under "What this harness cannot verify" |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] `nyquist_compliant: true` set in frontmatter after execution

**Approval:** pending

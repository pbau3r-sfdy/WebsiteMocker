---
phase: 10
slug: analytics
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-10-14
---

# Phase 10 — Validation Strategy

> Reconstructed from plans, summaries, the fixture harness and the live UAT.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Bash fixture harness driving Node scripts (`verify-phase-10.sh`, same style as `verify-phase-09.sh`) |
| **Config file** | none; fixtures in `_scripts/fixtures/analytics/` (`wiring/`, `gate/`, `payloads.mjs`, `drive-plausible.mjs`, `eval-snippet.mjs`) |
| **Quick run command** | `bash _scripts/verify-phase-10.sh snippet` (or one of env, assert, sanitise, gate, fetch, notfound) |
| **Full suite command** | `bash _scripts/verify-phase-10.sh all` |
| **Estimated runtime** | ~4 seconds |

---

## Sampling Rate

- **After every task commit:** the section for the touched library
- **After every plan wave:** `bash _scripts/verify-phase-10.sh all` and `bash _scripts/verify-phase-09.sh all` (regression)
- **Before `/gsd:verify-work`:** full suite green (120 passed, 0 failed on 2026-10-14)
- **Max feedback latency:** ~5 seconds

---

## Per-Requirement Verification Map

| Requirement | Plan | Secure behavior | Test type | Automated command | Status |
|-------------|------|-----------------|-----------|-------------------|--------|
| ANLY-01 shared sandbox test | 10-01 | one `isSandbox` used by the integration | fixture | `verify-phase-10.sh env` | ✅ green |
| ANLY-02 pa- per-site snippet / legacy fallback | 10-01 | correct script per site; unconfigured sites emit nothing | fixture | `verify-phase-10.sh snippet` | ✅ green |
| ANLY-03 identity assertion | 10-01 | build fails on domain/ID mismatch; production emit needs matching `site` (WR-05) | fixture | `verify-phase-10.sh assert` | ✅ green |
| ANLY-04 event contract | 10-01, 10-02, 10-05 | outbound/download/form flags; 404 sends only the first path segment | fixture + live | `verify-phase-10.sh snippet`, `notfound` | ✅ green (404, flags); live names: UAT |
| ANLY-05 sanitising transform | 10-01 | strips query/hash, masks UUIDs, `@` segments, long tokens; `exclude` honours base | fixture | `verify-phase-10.sh sanitise` | ✅ green |
| ANLY-06 privacy gate | 10-02 | live site without Plausible privacy section is refused; comments do not satisfy it | fixture | `verify-phase-10.sh gate` | ✅ green |
| ANLY-07 Stats API aggregates (off by default) | 10-03 | key only to plausible.io or `PLAUSIBLE_HOST`; no redirects; aggregates only | fixture (host allowlist) | `verify-phase-10.sh fetch` | ⚠️ partial: tile output manual |
| ANLY-08 harness | 10-04 | fixture-only, 5 sections + fetch + notfound | self | `verify-phase-10.sh all` | ✅ green |
| ANLY-09 on for reskin-2 only, events seen | 10-05 | only reskin-2 configured; events in Plausible | live | UAT (`10-UAT.md`), `check-analytics-gate.mjs sfdy-alt-clean-reskin-2 --live` | ✅ green (manual live) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ partial*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Events arrive in Plausible with the built-in names | ANLY-04, ANLY-09 | needs the live third-party service | Open the reskin-2 sandbox, click a footer social link, open `/404.html`, submit the contact form; check goals in Plausible (done 2026-10-14, 10-UAT.md) |
| `?token` / `#secret` stripped from the reported URL in Plausible | ANLY-05 | browser tooling blocks query strings; fixtures cover the transform | Open the sandbox with `?token=abc#secret` and inspect the `u` field of the `api/event` request |
| Dashboard tile hidden by default; shown with fetched aggregates | ANLY-07 | tile render depends on local `_data/` and Business-plan key | Build the dashboard locally with and without `_data/<slug>/analytics.json` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-14

## Validation Audit 2026-10-14

| Metric | Count |
|--------|-------|
| Gaps found | 3 (ANLY-07 tile output, live event names, URL stripping in live data) |
| Resolved | 0 (no automated test is practical; moved to Manual-Only) |
| Escalated | 3 |

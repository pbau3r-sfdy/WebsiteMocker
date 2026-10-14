---
phase: 3
slug: brand-consistency
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-20
audited: 2026-08-20
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for Phase 3: Brand Consistency.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (skills/config phase — Markdown + JSON only) |
| **Config file** | none |
| **Quick run command** | `node _scripts/validate-brand.mjs` |
| **Full suite command** | `node _scripts/validate-brand.mjs` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** `node _scripts/validate-brand.mjs`
- **After every plan wave:** `node _scripts/validate-brand.mjs`
- **Before `/gsd:verify-work`:** Full suite must be green (111/111)
- **Max feedback latency:** ~1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | BRAND-01 | T-03-01 | wiring.json brand stub not writable from external input (developer-controlled) | integration | `node _scripts/validate-brand.mjs` | ✅ | ✅ green |
| 03-01-02 | 01 | 1 | BRAND-01 | — | schema reference exposes no PII; brand terminology visible to operators only | integration | `node _scripts/validate-brand.mjs` | ✅ | ✅ green |
| 03-02-01 | 02 | 2 | BRAND-02 | T-03-02-01 | paste-back validation rejects malformed JSON before write (key count + type checks) | integration | `node _scripts/validate-brand.mjs` | ✅ | ✅ green |
| 03-03-01 | 03 | 2 | BRAND-03 | T-03-03-01 | bi-directional enrichment gated by explicit y/N per hashtag (default N) | integration | `node _scripts/validate-brand.mjs` | ✅ | ✅ green |
| 03-03-02 | 03 | 2 | BRAND-03 | T-03-03-02 | avoid scan non-blocking — operator can override; commit never gated | integration | `node _scripts/validate-brand.mjs` | ✅ | ✅ green |
| 03-03-03 | 03 | 2 | BRAND-03 | T-03-03-03 | body scan read-only; brand.avoid from developer-controlled file | integration | `node _scripts/validate-brand.mjs` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*None — all phase 3 deliverables are Markdown skill files and JSON config. `_scripts/validate-brand.mjs` was created during the Nyquist audit (2026-08-20) to provide persistent regression coverage. Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| /wm-wire mogwai-systems first-run (capture: null) | BRAND-02 | Live skill invocation required; no capture file, no keywords.json — sparse template generation | Run `/wm-wire` on mogwai-systems, choose "Configure now", verify template generates with four keys and no error for missing capture/keywords |
| /wm-wire recency check same-day skip | BRAND-02 | Requires `last_deploy` to equal today's date in a live session | Set `last_deploy: <today>` in a test wiring.json, run `/wm-wire`, verify "has anything changed?" is skipped |
| /wm-wire parrot-capital "Skip for later" non-blocking | BRAND-02 | Stage advancement requires full skill invocation across all services | Run `/wm-wire` on parrot-capital, skip brand block, verify stage advances normally |

---

## Validation Audit 2026-08-20

| Metric | Count |
|--------|-------|
| Initial state | State B (no VALIDATION.md; 3 SUMMARY files found) |
| Requirements mapped | 3 (BRAND-01, BRAND-02, BRAND-03) |
| Tasks mapped | 6 |
| Gaps found | 6 (all PARTIAL — live verify passed; no persistent test file) |
| Resolved (automated) | 6 |
| Escalated to manual-only | 3 (live skill invocation scenarios) |
| Test assertions created | 111 |
| Test file | `_scripts/validate-brand.mjs` |
| Test commit | c2ab03f |

---

## Validation Sign-Off

- [x] All tasks have automated verify via `node _scripts/validate-brand.mjs`
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] No wave 0 gaps (test file created during audit)
- [x] No watch-mode flags
- [x] Feedback latency < 2s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-20

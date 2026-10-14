---
phase: 10-analytics
plan: 05
subsystem: analytics
tags: [plausible, wiring, 404, event-contract]
requires: [10-01, 10-02, 10-04]
provides:
  - reskin-2 wired to Plausible (pa-h84OFEpVhPIHGnzKLeThr, starflight-dynamics.com) with sandbox debug opt-in
  - 404.astro firing the 404 event
  - event contract using observed built-in names
affects: [phase-12-cutover]
key-files:
  created: [sites/sfdy-alt-clean-reskin-2/src/pages/404.astro]
  modified: [sites/sfdy-alt-clean-reskin-2/wiring.json, docs/analytics.md, .planning/REQUIREMENTS.md]
decisions:
  - "ADOPT tracker built-in event names (Outbound Link: Click, File Download, Form: Submission, 404); no analytics.eventNames remap; ANLY-04 wording amended"
metrics:
  completed: 2026-10-14
---

# Phase 10 Plan 05: Wire reskin-2 and live Plausible check Summary

reskin-2 is the only configured analytics site; the operator's live sandbox test showed pageviews and all four events in the Plausible dashboard for starflight-dynamics.com.

## Commits
- 2364088: wiring.json analytics block + 404.astro
- docs commit (HEAD at completion of Task 3): observed names recorded in docs/analytics.md, ANLY-04 amended, ANLY-09/ANLY-04 complete in REQUIREMENTS.md

## Live observations (operator, 2026-10-14)
Script `pa-h84OFEpVhPIHGnzKLeThr.js` 200, `api/event` 202. Pageviews for `/`, `/contact/`, `/404.html`. Goals fired once each: `Outbound Link: Click` (footer LinkedIn), `Form: Submission` (contact form, web3forms test message), `404` (404.html), `File Download` (synthetic .pdf link).

## Decision
ADOPT built-in names. No debug fixes were needed.

## Deviations from Plan
- Precondition "src/pages/jobs no longer exists" did not hold literally: `jobs/index.astro` remains as the intended Coming-soon page (Phase 11.1). Proceeded on orchestrator instruction; privacy-policy Web analytics section is committed.
- Task 2 live checks were done via the operator's browser tool, not raw DevTools.

## Open items for the operator
- Remove `sandboxUsesProdId` from reskin-2 wiring at the Phase 12 cutover.
- Confirm the no-banner decision (D-04) with the legal reviewer.
- Business-plan decision for custom props / Stats API tile.
- The candidate goals `Download` and `Form` were never created, so nothing to delete.
- `?token` / `#secret` stripping and raw payload props were verified by the fixture harness only, not live (browser tool blocked query strings).
- Bump the privacy policy version line once the draft is approved.

## Verification
`bash _scripts/verify-phase-10.sh all`: 67 passed, 0 failed. Production build has pa- script, plausible.init, transformRequest, 404 event; gate `--live` exits 0.

## Self-Check: PASSED

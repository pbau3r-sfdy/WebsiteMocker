---
status: complete
phase: 10-analytics
source: [10-01-SUMMARY.md, 10-02-SUMMARY.md, 10-03-SUMMARY.md, 10-04-SUMMARY.md, 10-05-SUMMARY.md]
started: 2026-10-14T14:30:00Z
updated: 2026-10-14T14:30:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Plausible shows events from the reskin-2 sandbox
expected: Plausible dashboard for starflight-dynamics.com lists reskin-2 pageviews and the four goals (404, Outbound Link: Click, Form: Submission, File Download) with conversions.
result: pass
note: checked via Claude in Chrome: reskin-2 pageviews (/, /404.html, /contact/, /imprint/); goals 404, Outbound Link: Click, File Download, Form: Submission each 1/1

### 2. Only reskin-2 reports analytics
expected: Open https://pbau3r-sfdy.github.io/WebsiteMocker/parrot-capital/ with DevTools Network filtered by "plausible". No plausible.io request appears. On reskin-2 a plausible.io/js/pa-... script loads and api/event returns 202.
result: pass
note: curl: parrot-capital has no plausible.io reference; reskin-2 loads pa-h84OFEpVhPIHGnzKLeThr.js; api/event 202 seen in browser

### 3. Privacy gate refuses analytics without the privacy section
expected: In the repo run `node _scripts/check-analytics-gate.mjs sfdy-alt-clean-reskin-2 --live`: exits 0 and says the Web analytics section was found. (Negative case is covered by `bash _scripts/verify-phase-10.sh gate`, 7 PASS.)
result: pass
note: gate exit 0, Web analytics section found

### 4. Full fixture harness is green
expected: `bash _scripts/verify-phase-10.sh all` ends with "Results: 67 passed, 0 failed".
result: pass
note: 67 passed, 0 failed

### 5. Dashboard analytics tile stays hidden by default
expected: Open https://pbau3r-sfdy.github.io/WebsiteMocker/ (dashboard). No analytics tile or numbers appear on any site card (Stats API is off until `analytics.statsApi` is set and a key exists).
result: pass
note: curl of the deployed dashboard: no analytics tile markup

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]

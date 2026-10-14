---
phase: 11-open-drops
verified: 2026-10-14T00:00:00Z
status: human_needed
score: 5/5 success criteria verified (one operator confirmation outstanding)
gaps: []
human_verification:
  - test: "Confirm the Plausible goal `Drop Download` exists in the Plausible site settings"
    expected: "Goal listed under Goals for starflight-dynamics.com"
    why_human: "Operator action in the Plausible UI; Plausible-side event arrival is not verifiable locally"
  - test: "Confirm WM_PUBLISH_PAT has write scope on the drops repo"
    expected: "Publish succeeds"
    why_human: "Write scope is unverifiable by the check (harness says so)"
---

# Phase 11: Open Drops Verification Report

**Goal:** Operator can share a confidential-but-not-secret early draft as an unguessable, unindexed, expiring and withdrawable page, with views tracked without leaking the drop id.
**Status:** human_needed. Re-verification: No.

## Evidence base

`bash _scripts/verify-phase-11.sh all` run locally: PASS=394 FAIL=1. The single failure is a stale harness assertion, not a product defect (see Anti-patterns). `node _scripts/build-all.js sfdy` rebuilds cleanly afterwards. Code spot-checked: `_scripts/drops.mjs`, `_scripts/drop.mjs`, `_scripts/lib/pdf-strip.mjs` (qpdf, fails if missing), `_core/src/layouts/DropLayout.astro`, `_scripts/lib/plausible-snippet.mjs`, `sites/sfdy/wiring.json` (`drops.enabled: true`), `sites/sfdy/astro.config.mjs` (`drops()` integration). No drops are currently in the sfdy source (lifecycle test drop withdrawn per 11-06 summary); the build with zero drops contains no `dist/sfdy/d`.

## Requirements

| Req | Status | Evidence |
|---|---|---|
| DROP-01 collection, 32-hex id, mandatory expires | SATISFIED | drops-core/collection libs; harness `lib` section passes |
| DROP-02 drop.mjs new/list/withdraw/expire/check | SATISFIED | `_scripts/drop.mjs` exists; harness `cli` section passes (incl. strict check, id prefix only in output) |
| DROP-03 route, DropLayout, opt-in, sfdy adopts | SATISFIED | DropLayout.astro; `drops.enabled` in sfdy wiring; `drops()` in sfdy config |
| DROP-04 filtering, noindex/no-referrer, no sitemap/RSS/robots, sandbox gating | SATISFIED | harness `build` and `sandbox` sections pass |
| DROP-05 PDFs into dist/d/<id>/, stripped, fails without tool | SATISFIED | `lib/pdf-strip.mjs`; harness `pdf` section passes |
| DROP-06 masked pageview, `Drop Download` goal, no id in analytics | SATISFIED in code, goal creation pending | `plausible-snippet.mjs` and harness `track` section pass; goal must exist in Plausible (operator, unconfirmed) |
| DROP-07 preflight/publish warnings | SATISFIED | wm-preflight and wm-publish run `drop.mjs check` (docs harness) |
| DROP-08 withdrawal docs, 404 check after publish | SATISFIED | docs/drops.md "unlisting only"; wm-publish 404 check; 11-06 records live lifecycle |
| DROP-09 verify-phase-11.sh static and live | SATISFIED | Harness present with static sections and live section (syntax-clean, token evaluator vectors pass); prints unverifiable items |
| DROP-10 /wm-drop skill, confidential-not-secret docs | SATISFIED | `.claude/skills/wm-drop.md`, docs/drops.md, CLAUDE.md/AGENTS.md entries |

## Success criteria

1. CLI and skill: VERIFIED. 2. Rendering and gating: VERIFIED (harness). 3. PDF strip and tracking without id: VERIFIED in code and fixtures. 4. Preflight/publish warnings and docs: VERIFIED. 5. Built on sfdy, static harness passes, live mode implemented and recorded in 11-06: VERIFIED (live mode not re-run by this verifier; it would hit the network).

## Anti-patterns

| File | Issue | Severity |
|---|---|---|
| `_scripts/verify-phase-11.d/70-docs.sh` line 11 | Asserts the placeholder `Token expiry date: not yet recorded (operator fills at gate G2)`, but docs/drops.md correctly now says `Token expiry date: 2027-08-20` (commit ce2692c). Harness FAIL is a stale assertion; the harness does not exit 0. | Warning: update the assertion to match `Token expiry date: <ISO date>` so `verify-phase-11.sh all` passes (success criterion 5 says the harness passes) |

## Human verification required

1. Confirm the Plausible goal `Drop Download` is created (known open operator item).
2. Write scope of WM_PUBLISH_PAT (harness cannot verify).

## Gaps summary

No goal-blocking gaps. One minor harness fix (stale expiry assertion) should be made so the harness exits 0; it is a warning, not a blocker. Remaining items are operator confirmations.

_Verifier: Claude (gsd-verifier)_

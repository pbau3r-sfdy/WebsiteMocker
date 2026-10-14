---
phase: 12-sfdy-cutover
plan: 03
subsystem: production-identity
tags: [wiring, content-sync, legal, preflight, harness]
requires: [12-01, 12-02]
provides:
  - "sites/sfdy carries prod_repo pbau3r-sfdy/starflight-dynamics, domain www.starflight-dynamics.com, stage 5; sole owner"
  - "_scripts/sync-content.sh with jobs/no-collection guard, used by content-sync.yml"
  - "12-LEGAL-CHECKLIST.md (operator/lawyer inventory, not a gate) with preflight result"
  - "verify-phase-12.sh sections ident and sync (all = 58/58)"
key-files:
  created:
    - _scripts/sync-content.sh
    - .planning/phases/12-sfdy-cutover/12-LEGAL-CHECKLIST.md
  modified:
    - sites/sfdy/wiring.json
    - sites/sfdy-alt-clean/wiring.json
    - CLAUDE.md
    - AGENTS.md
    - docs/analytics.md
    - .github/workflows/content-sync.yml
    - _scripts/verify-phase-12.sh
requirements-completed: [CUT-03, CUT-04, CUT-05]
duration: 25min
completed: 2026-10-14
---

# Phase 12 Plan 03: Production identity, sync guard, legal checklist Summary

sfdy is publish-ready as repo state: single owner of the production repo and domain, contributor sync skips directories without a collection (jobs), and the operator has a legal inventory plus preflight table. Nothing pushed.

## Commits
- 7cbf336: production identity, single owner, ownership docs, `ident` section (CUT-04, D-03, D-11)
- 67a42a1: `sync-content.sh`, workflow calls it, `sync` section (CUT-05, D-07)
- dfd82ad: legal checklist and preflight result (CUT-03, D-06)

## What changed
- `sites/sfdy/wiring.json`: name "Starflight Dynamics", domain, prod_repo, stage 5, new notes; `analytics.sandboxUsesProdId` removed. No stage 6 / last_deploy (publish.yml writes them).
- `sites/sfdy-alt-clean/wiring.json`: prod_repo and domain removed; archive_reason and notes rewritten (no reskin-2 slug). Still archived, skip_ci.
- CLAUDE.md ownership table (sfdy row with repo and domain, sfdy-alt-clean archived), layout block, stale sandboxUsesProdId line; AGENTS.md layout block; docs/analytics.md removal paragraph.
- `sync-content.sh <slug> <clone> [wm-root]`: slug regex, regular `.md` only (symlinks excluded), copies only into existing collection dirs, logs `skipped (no jobs collection in sfdy): jobs/j.md`, additive. Workflow keeps slug resolution, wiring check, commit and push unchanged. TDD: sync section written first (7 of 14 checks failed, RED), then the script (14/14).
- Confirmed: `init-prod-repo.mjs` has no hard-coded `sfdy-alt-clean`; `content-ci.yml` template still has `{{SLUG}}`.

## Verification
`verify-phase-12.sh all`: 58 passed, 0 failed (rename, old, gate, prod, sandbox, ident 11, sync 14). `check-analytics-gate.mjs sfdy --live` exit 0, `validate-brand.mjs` exit 0 (inside ident). Single owner: only sites/sfdy/wiring.json matches the prod_repo and the domain.

## Preflight result
20 checks recorded in the legal checklist: 19 PASS, 1 WARN, 0 FAIL.
WARN list: empty hashtag arrays (`keywords.json` twitter/linkedin/instagram and `brand.hashtags`), operator decision, non-blocking.
Notes: preflight names `privacy.astro`, real page is `privacy-policy.astro` (not renamed, live URL).

## Items for the operator (from the checklist notes)
- Privacy "Social media" lists 4 platforms, matching the footer; wiring.json lists 4 more (threads, youtube, tiktok, discord) not rendered. wiring Facebook URL differs from the footer one.
- Joint controller (UAB) is stated without an Art. 26 arrangement reference; Mailchimp double opt-in must be on in the audience; no DPO contact beyond the shared mailbox; source comment at privacy-policy.astro:11 still says DRAFT (comment only, not rendered, left untouched).
- Legal approval is not claimed: the checklist is an inventory.

## Deviations from Plan
1. CLAUDE.md patch recipe (index version, `git apply --cached`) not needed: tree was clean, operator hunks already at 0599849. Edited and committed directly; the two reskin rows were not touched. The stale Analytics line is committed (no UNSTAGED leftover), so no consent question remained.
2. docs/analytics.md and the stale CLAUDE.md line updated as instructed by the caller (plan files list did not include docs/analytics.md).
3. Imprint unchanged, so `verify-phase-11-1.sh` blob assertion not re-baselined.
4. Hashtag WARN covers `keywords.json` and `brand.hashtags`.

## Known Stubs
`sync-live` and `live` harness sections still print SKIP by design (plans 04, 05).

## Self-Check: PASSED
Commits 7cbf336, 67a42a1, dfd82ad exist; `_scripts/sync-content.sh` and `12-LEGAL-CHECKLIST.md` present; harness all green.

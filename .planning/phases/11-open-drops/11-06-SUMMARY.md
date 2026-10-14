---
phase: 11-open-drops
plan: 06
subsystem: drops-rollout
tags: [drops, rollout, operator-gates, live-verification]
requires: ["11-01", "11-02", "11-03", "11-04", "11-05"]
provides:
  - "Private repo pbau3r-sfdy/drops (private, cloned to gitignored _drops/)"
  - "Phase 11 on origin main; first drops-health run green"
  - "Live lifecycle proof: test drop 200, withdrawn then republished 404"
key-decisions:
  - "G2 proven by the nightly token job instead of a manual token edit: WM_PUBLISH_PAT already reads pbau3r-sfdy/drops"
  - "Token expiry 2027-08-20 recorded in docs/drops.md"
requirements-completed: [DROP-02, DROP-03, DROP-04, DROP-05, DROP-06, DROP-08, DROP-09, DROP-10]
completed: 2026-10-14
---

# Plan 11-06: Operator rollout

Gates run in order, each with the operator's typed approval.

| Gate | Result |
|------|--------|
| G1 private repo | created private, default branch main, cloned into `_drops/` (ignored) |
| G2 token access | health run `token` job read the drops repo; expiry 2027-08-20 (309 days left); write scope not verifiable by the check |
| G3 push | origin main 67279d2..23a4657; sandbox deploy success; `/sfdy/` 200, `/sfdy/d/` 404 |
| G6 health run | run 38632959396, both jobs success |
| G4 Plausible goal `Drop Download` | created in Plausible by Claude in Chrome (operator authorised); verified with a second test drop: a real attachment click sent `Drop Download` with `u` masked to `/d/_ID_/`, the goal report shows it, the Pages report shows only `/d/_ID_/`; withdrawn and republished, 404 confirmed after CDN delay (run 38636924114) |
| G5 test drop | published (run 38633324670): live 200, noindex and no-referrer present, PDF without fixture metadata, id absent from sitemap, log without drop ids; withdrawn and republished (run 38633535959): `e23c` answers 404, gh-pages listing no longer contains it, random id 404 |

Live harness: `verify-phase-11.sh live` 6 pass (active) then 5 pass (withdrawn), 0 fail. `verify-phase-11.sh all` 395 pass. `verify-phase-12.sh live` 24 pass (with `BACKUP_SHA` set).
Branch set of pbau3r-sfdy/starflight-dynamics unchanged (gh-pages, gh-pages-old-2026-08, main); backup sha 3a2f4c1b intact.
Only 4-char id prefixes are recorded here.

## Open items
- None for G4. A first 404 check right after the withdrawal publish failed for a short time (CDN cache); it passed on re-run.
- Dev preview caveat (11-SPIKE): `astro dev` needs a restart after adding a drop.
- The private repo keeps `e23c` in git history and a tombstone; the public gh-pages git history may retain the withdrawn copy (unlisting only).

## Rollback
Set `drops.enabled` false in `sites/sfdy/wiring.json` and `/wm-publish sfdy`; `gh workflow disable drops-health.yml`; reduce token access; archive the private repo. Do not create new gh-pages backup branches.

## Self-Check: PASSED

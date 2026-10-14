---
phase: 09-claude-design-connectivity
plan: 03
subsystem: tooling
tags: [design-sync, sanitise, tokens, brand]
requires: [09-01]
provides:
  - _scripts/lib/design-sanitise.mjs (sanitiseHtml, DEFAULT_ALLOW_HOSTS, findInstructionLikeText)
  - _scripts/design-tokens.mjs CLI (brand.doc_tokens, tokens-report.json, layout-tokens.proposal.diff)
  - _scripts/design-token-map.json (global default map, version 1)
  - repo-relative validate-brand.mjs with token-map checks
affects: [09-05, 09-06, 09-07, 09-08]
key-files:
  created:
    - _scripts/lib/design-sanitise.mjs
    - _scripts/design-tokens.mjs
    - _scripts/design-token-map.json
    - _scripts/fixtures/design/sanitise/
    - _scripts/fixtures/design/tokens/
  modified:
    - _scripts/validate-brand.mjs
requirements-completed: [DSYNC-07, DSYNC-08]
duration: 1 session
completed: 2026-10-14
---

# Phase 9 Plan 03: Sanitiser and token mapping Summary

Hand-written hast allowlist sanitiser with a removal report and instruction-text flagging, a css-tree token mapper that writes only `brand.doc_tokens` and proposes (never applies) Layout.astro changes, and a repo-relative `validate-brand.mjs`.

## Commits
- 5bd70f4 Task 1: allowlist sanitiser with removal report
- d28f0c2 Task 2: token mapping CLI, default map, repo-relative validate-brand

## Verification
- Sanitiser: `malicious.html` output has none of the banned strings, all six report kinds present, the injection sentence stays in the text; `clean.html` yields only `external-link-kept` and keeps the Google Fonts link. `hast-util-sanitize` not added.
- Tokens (temp `WM_ROOT`): `--accent` -> `#00FB92`, `--surface-1` = `#000` (var resolved from base `:root`, not the `@media` override), `--gutter` = `4px` via site tokenMap, `--unknown-x` kept out when unmapped. Second run reports all `unchanged`. `--dry-run` leaves wiring.json byte-identical. `bad.css` exits 1. Layout.astro byte-identical and the proposal diff written.
- `validate-brand.mjs`: 114 passed, 0 failed, from repo root and from `/tmp`; no hardcoded `/Users/pbau3r` path left.

## Deviations from Plan

**1. [Rule 2 - Robustness] Balance check for truncated CSS.** css-tree accepts an unclosed block silently (same finding as 09-02), so `design-tokens.mjs` adds a brace/paren balance check; `bad.css` is an unclosed rule.

**2. Global map fallback.** When `WM_ROOT` points at a temp tree without `_scripts/design-token-map.json`, the script falls back to its own copy of the map.

**3. Report shape.** `tokens-report.json` additionally carries an `excluded` list (tokens nulled by tokenMap). `mapped` holds only changed or new entries; equal values go to `unchanged`.

## Known Stubs
None.

## Threat Flags
None beyond the plan's threat model.

## Self-Check: PASSED

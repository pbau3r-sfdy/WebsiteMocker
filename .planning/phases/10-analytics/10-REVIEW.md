---
phase: 10-analytics
depth: standard
files_reviewed: 8
findings:
  critical: 1
  warning: 6
  info: 3
  total: 10
status: fixed
resolved:
  - CR-01
  - WR-01
  - WR-02
  - WR-03
  - WR-04
  - WR-05
  - IN-01
  - IN-02
  - IN-03
not_code:
  - WR-06   # sandboxUsesProdId stays on (documented); remove at the Phase 12 cutover
fixed_at: 2026-10-14
---

# Phase 10 Code Review

Reviewed: `_scripts/lib/env.mjs`, `_scripts/lib/plausible-snippet.mjs`, `_scripts/plausible.mjs`, `_scripts/check-analytics-gate.mjs`, `_scripts/fetch-analytics-data.mjs`, `_scripts/verify-phase-10.sh`, `src/components/AnalyticsTile.astro`, `sites/sfdy-alt-clean-reskin-2/src/pages/404.astro`.
Fixed 2026-10-14 (see 10-REVIEW-FIX commits `fix(10): ...`). WR-06 is intentionally left as documented.

## CR-01 (blocker): `exclude` never matches in sandbox builds
`plausible-snippet.mjs:111-114` (TRANSFORM_FACTORY_SRC) compares the raw `location.pathname` with `indexOf(ex[k])===0`. Sandbox builds are served under `/WebsiteMocker/<slug>/`, so an exclude such as `/preview/` never matches and those events reach production Plausible (live reskin-2 uses `sandboxUsesProdId`). Also no segment boundary (`/preview` swallows `/previews`) and no normalisation (`//preview/`, percent-encoding). Fix: pass `base` into the transform config, strip it, collapse slashes, decode, match on a segment boundary; add a sandbox-base vector to `payloads.mjs`.

## Warnings
- **WR-01** Sanitiser masks only 32-hex and 40+ char `[A-Za-z0-9_]` tokens (`plausible-snippet.mjs:90-91`). Dashed UUIDs, short tokens, base64url with `-`, emails or names in a path are not masked. `404.astro:21` sends `path: location.pathname` as a custom prop, and a 404 page receives arbitrary typed or guessed URLs. Fix: mask dashed UUIDs and any segment with `@`; send a coarse value for the 404 prop (first segment only); add UUID and email sanitise vectors.
- **WR-02** Values interpolated into the inline `<script>` are not escaped for `</script>` (`plausible-snippet.mjs:161,165,173,189`). `exclude`, `eventNames`, `domain` (legacy), `base`, `slug` are unvalidated. Fix: one `js()` helper that escapes `<`, U+2028, U+2029; validate `domain` and type-check `exclude`/`eventNames`.
- **WR-03** Stats API key is sent to any https host from wiring.json (`fetch-analytics-data.mjs:68-74,85-90`). Fix: allowlist `plausible.io` plus an explicit `PLAUSIBLE_HOST` env that must equal `analytics.host`; `redirect: 'error'`; do not print the response body on error; share host validation with the snippet library.
- **WR-04** Privacy gate passes on substrings in comments/frontmatter and fails on legitimate wording (`check-analytics-gate.mjs:52-77`); only top-level privacy pages are discovered. Fix: strip comments and frontmatter, require a "Web analytics" heading, narrow `NO_ANALYTICS`, recurse into subdirectories, add negative fixtures.
- **WR-05** Production classification is fail-open (`env.mjs:17-22`, `plausible-snippet.mjs:57-66`). Anything not under `/WebsiteMocker` is production. Fix: require `config.site` to be set and match the resolved domain for a production emit, else throw ANLY-03.
- **WR-06** `sandboxUsesProdId: true` is live on reskin-2: every visitor of the public sandbox URL is counted against the production Plausible site, including 404 events with raw paths (see WR-01). Documented; remove at the Phase 12 cutover, or use a separate sandbox Plausible site via `sandboxScriptId`.

## Info
- **IN-01** Tautological assertion at `plausible-snippet.mjs:84-86`; remove.
- **IN-02** Weak tests in `verify-phase-10.sh` (line 123 vacuous; `notfound` only greps source). Missing: sandbox-base `exclude`, `</script>` injection, comment-only gate bypass.
- **IN-03** `AnalyticsTile.astro`: `process.env.CI` is truthy for the string "false", `resolve('_data')` depends on cwd. `plausible.mjs:52`: unguarded `JSON.parse` of wiring.json.

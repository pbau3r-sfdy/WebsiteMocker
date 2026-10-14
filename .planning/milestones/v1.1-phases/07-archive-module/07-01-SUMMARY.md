---
phase: 07-archive-module
plan: 01
subsystem: scripts
tags: [wayback, cdx, archive, cli, capture]
dependency_graph:
  requires: []
  provides: [_scripts/archive-browse.mjs]
  affects: [_scripts/capture-site.mjs]
tech_stack:
  added: []
  patterns: [Node-18-fetch, execSync-stdio-inherit, flag-option-cli-helpers]
key_files:
  created:
    - _scripts/archive-browse.mjs
  modified: []
decisions:
  - slug input validated against /^[a-z0-9-]+$/ before any file access (shell injection prevention)
  - --capture timestamp validated against /^\d{14}$/ before CDX fetch (not after)
  - CDX header row skipped via .slice(1) immediately after res.json()
  - Sequential for..of loop in --sweep (no Promise.all) to respect CDX shared resource
  - captureSlug uses dash separator: ${slug}-${CAPTURE}
metrics:
  duration: 6m
  completed: 2026-08-25
  tasks_completed: 2
  files_created: 1
  files_modified: 0
---

# Phase 07 Plan 01: archive-browse.mjs — Wayback CDX snapshot browser

One-liner: Wayback CDX CLI with year-grouped timeline, if_ inspection URLs, sequential --sweep coverage audit, and --capture handoff to capture-site.mjs with dual security validation.

## What Was Built

`_scripts/archive-browse.mjs` — 186-line ES module CLI that:

1. Queries the Wayback CDX API for any slug (resolved via wiring.json) or bare domain
2. Prints a year-grouped timeline where each row contains the 14-char timestamp, YYYY-MM-DD HH:MM date label, and the full `if_` toolbar-stripped inspection URL
3. `--sweep` mode: iterates all active wiring.json domains (skipping archived/template/no-domain sites) sequentially and prints a coverage table (domain, count, oldest, newest)
4. `--capture <timestamp>`: validates the 14-digit format first, then confirms the timestamp exists in the CDX response, then hands off to `capture-site.mjs` via `execSync` with `stdio: 'inherit'`

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Scaffold archive-browse.mjs — core timeline display (ARCH-01, ARCH-02) | d20c203 | _scripts/archive-browse.mjs (created) |
| 2 | Add --sweep and --capture modes (ARCH-03, ARCH-04) | f54b5f9 | _scripts/archive-browse.mjs (extended) |

## Architecture Notes

- ROOT resolved with `join(fileURLToPath(import.meta.url), '..', '..')` — matches ingest-artifact.mjs pattern
- `flag()` / `option()` / `readJSON()` helpers copied verbatim from ingest-artifact.mjs
- `fetch()` used (Node 18+ built-in) with `AbortSignal.timeout(15000)` and one retry after 2s delay
- All section dividers use `// ── Section Name ─────────────────` style (em-dash)
- No new npm packages — uses only Node built-ins

## Security Validations (per threat model T-07-01, T-07-02)

- **T-07-01 mitigated:** `--capture` timestamp validated against `/^\d{14}$/` before any CDX fetch or subprocess invocation — if it fails, `fail()` is called immediately
- **T-07-02 mitigated:** slug input validated against `/^[a-z0-9-]+$/` in `resolveDomain()` before any file access or path construction
- **T-07-03 mitigated:** D-10 check confirms timestamp exists in CDX response before constructing ifUrl or captureSlug

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all four ARCH requirements (ARCH-01 through ARCH-04) are fully implemented.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced beyond what the plan's threat model already covers.

## Self-Check: PASSED

- [x] `_scripts/archive-browse.mjs` exists: FOUND
- [x] Commit d20c203 exists: FOUND
- [x] Commit f54b5f9 exists: FOUND
- [x] `node --check _scripts/archive-browse.mjs`: exits 0
- [x] `node _scripts/archive-browse.mjs 2>&1` exits 1 with usage message
- [x] `node _scripts/archive-browse.mjs --capture notvalid sfdy-alt-clean 2>&1` exits 1 with "14 digits" message (no CDX fetch)
- [x] No `require()` calls (ES module)
- [x] No `Promise.all` in sweep (sequential for..of)
- [x] captureSlug uses `${slug}-${CAPTURE}` (dash separator)

# Phase 7: Archive Module - Context

**Gathered:** 2026-08-24
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers a Wayback Machine archive inspection tool with two surfaces:

1. **Script** — `_scripts/archive-browse.mjs` — a Node.js CLI that queries the Wayback CDX API, displays a snapshot timeline grouped by year/month, supports a `--sweep` mode for multi-domain coverage audits, and hands off selected snapshots to `capture-site.mjs` via `--capture <timestamp>`.
2. **Skill** — `.claude/skills/wm-archive-browse.md` — a guided Claude wrapper that runs the script, shows the timeline, lets the operator pick a timestamp to inspect (by printing the `if_` inspection URL), and optionally triggers `--capture`.

**What this phase does NOT do:** Astro site builds, doc pipeline work (Phase 6), crestworks content fixes or token housekeeping (Phase 8).

</domain>

<decisions>
## Implementation Decisions

### Output Format

- **D-01:** Snapshot timeline uses a grouped list by year/month. Year headers use the format `── 2024 (12 snapshots) ──`, followed by indented rows for each snapshot in that year.
- **D-02:** Default fetch limit is 100 snapshots from the CDX API per domain.
- **D-03:** Each snapshot row shows timestamp + date label only — e.g. `  20240315123045  →  2024-03-15 12:30` — plus the full `if_` inspection URL on the same line so the operator can click it directly from the terminal.
- **D-04:** `--sweep` mode outputs a summary table: one row per active domain with columns `domain | snapshot count | oldest | newest`. Fetched from CDX API per domain in sequence.

### Toolbar-Strip URL Pattern

- **D-05:** Inspection URLs use the `if_` modifier: `https://web.archive.org/web/{timestamp}if_/{domain}`. This removes the Wayback toolbar while keeping the original page layout — correct for design inspection.
- **D-06:** The full `if_` URL is printed in the timeline output on every snapshot row so the operator can click it directly; no separate `--url` flag needed.
- **D-07:** Domain is resolved from the site's `wiring.json` `domain` field for a given slug. If `domain` is null or missing, the script errors with a clear message.

### Capture Handoff

- **D-08:** `--capture <timestamp>` calls `capture-site.mjs` as a direct subprocess via `execSync`/`spawn`. The capture runs inline and the operator sees Playwright progress in the same terminal session.
- **D-09:** Captured design DNA lands in `_captures/<slug>-<timestamp>/` — e.g. `_captures/sfdy-alt-clean-20240315123045/`. Namespaced to prevent collisions with the site's live capture in `_captures/<slug>/`.
- **D-10:** Before constructing the Wayback URL for capture, `archive-browse.mjs` verifies the timestamp exists in the fetched CDX response. If not found, it errors: `Snapshot 20240315 not found for sfdy-alt-clean. Run without --capture to browse available snapshots.`

### Skill Interaction Model

- **D-11:** `/wm-archive-browse [slug]` shells out to `archive-browse.mjs <slug>`, reads and displays the timeline output, then prompts the operator: enter a timestamp to inspect or `--capture <timestamp>` to capture.
- **D-12:** To inspect a snapshot, the skill prints the `if_` URL and instructs the operator to open it in their browser. Claude then asks: "Capture this snapshot? (y/n)".
- **D-13:** If the operator confirms capture, the skill runs `archive-browse.mjs <slug> --capture <timestamp>` (which in turn execs `capture-site.mjs`) and reports where the design DNA was written.

### Claude's Discretion

- Whether `archive-browse.mjs` supports a `--limit N` flag to override the default 100 snapshots per domain.
- Whether `--sweep` fetches domains in parallel or sequentially (sequential is simpler and avoids CDX rate-limit concerns).
- Exact CDX API endpoint and query parameters (recommend `https://web.archive.org/cdx/search/cdx?url={domain}&output=json&limit=100&fl=timestamp,statuscode`).
- Whether the script prints a footer line showing how many snapshots were returned vs. available (e.g. "Showing 100 of 847 snapshots — use --limit to increase").
- Error handling for CDX API timeouts or rate limits (recommend: retry once with 2s delay, then fail with actionable message).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing script to extend / call

- `_scripts/capture-site.mjs` — The Playwright capture script that `archive-browse.mjs` hands off to via `--capture`. **Read before implementing the subprocess exec and slug/URL argument conventions.**
- `_scripts/ingest-artifact.mjs` — Reference for script structure conventions: `readJSON()`, `flag()`, `option()`, `// ── Section ──` dividers, JSDoc header block, `process.exit(1)` error pattern. **Read the header and helper section before writing `archive-browse.mjs`.**

### Skill conventions

- `.claude/skills/wm-ingest.md` — Closest existing skill. `/wm-archive-browse` follows the same shell-out → display → confirm → exec pattern. **Read before writing the new skill.**

### Data model

- `sites/sfdy-alt-clean/wiring.json` — Reference wiring.json showing `domain` field location. `archive-browse.mjs` reads this for domain resolution.
- `.planning/REQUIREMENTS.md` — ARCH-01 through ARCH-05. **All five must be satisfied.**
- `.planning/PROJECT.md` — Core value, active sites, v1.1 goal.

### Project conventions

- `CLAUDE.md` — Site ownership table, skill quick-reference, production deployment model.
- `.planning/codebase/CONVENTIONS.md` — Script naming, header format, logging patterns (`✓` / `✖` prefix), section dividers.
- `.planning/codebase/STRUCTURE.md` — Where new scripts and skills go (`_scripts/`, `.claude/skills/`).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `readJSON(p)` in `ingest-artifact.mjs` — Silent fallback for missing/malformed JSON. Reuse to read `wiring.json` in `archive-browse.mjs`.
- `flag(name)` / `option(name)` helpers in `ingest-artifact.mjs` — CLI arg parsing pattern. Reuse for `--sweep`, `--capture`, `--limit` flags.
- `capture-site.mjs` — Existing Playwright capture script. `archive-browse.mjs` calls it as a subprocess; no code needs to be duplicated.

### Established Patterns

- **Script header** — All `_scripts/*.mjs` begin with a JSDoc block: `#!/usr/bin/env node`, then `/** script-name.mjs — description\n * Usage:\n *   node _scripts/... \n */`
- **Section dividers** — `// ── Section Name ─────────────────────────────` style used in all long scripts.
- **Logging** — `console.log('\n✓  ...')` for success, `console.error('\n✖  ...')` for errors, `process.exit(1)` on hard failures.
- **wiring.json reads** — `existsSync()` guard before every file read, silent fallback on parse errors.

### Integration Points

- `archive-browse.mjs` reads `wiring.json` from `sites/<slug>/wiring.json` to get the `domain` field.
- `--sweep` iterates all site directories in `sites/`, reads each `wiring.json`, filters to active sites (no `archived: true`, no `template: true`, `domain` non-null).
- `--capture` passes the constructed `if_` URL to `capture-site.mjs` as its URL argument; the output slug is `<original-slug>-<timestamp>` (passed via a flag or inferred by capture-site.mjs from the URL).

</code_context>

<specifics>
## Specific Ideas

- The skill should feel like a guided wrapper around the script — operator runs `/wm-archive-browse sfdy-alt-clean`, sees the timeline, picks a timestamp, opens the `if_` URL in their own browser, then optionally triggers capture. No automation of the browser inspection step.
- The `if_` URL format is already decided: `https://web.archive.org/web/{timestamp}if_/{domain}`.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 7-archive-module*
*Context gathered: 2026-08-24*

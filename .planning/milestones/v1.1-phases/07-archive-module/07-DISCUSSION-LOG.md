# Phase 7: Archive Module - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-24
**Phase:** 07-archive-module
**Areas discussed:** Output format, Toolbar-strip URL pattern, Capture handoff, Skill interaction model

---

## Output Format

| Option | Description | Selected |
|--------|-------------|----------|
| Grouped list by year/month | Year headers, month sub-headers, one row per snapshot with timestamp + URL. Readable at a glance. | ✓ |
| Flat table with columns | Tabular output: timestamp \| date \| URL \| status. May wrap in narrow terminals. | |
| Compact — one URL per line | Just toolbar-stripped URLs, one per line. Pipe-friendly. | |

**User's choice:** Grouped list by year/month

---

| Option | Description | Selected |
|--------|-------------|----------|
| 100 snapshots, summary header per year | Fetch up to 100 snapshots. `── 2024 (12 snapshots) ──` header style. | ✓ |
| 50 snapshots, group by month with count | Fetch 50. `2024-03 (4)` header style. | |
| All snapshots (no limit), paginate if > 100 | Fetch everything, show first 100, offer `--all` flag. | |

**User's choice:** 100 snapshots, summary header per year

---

| Option | Description | Selected |
|--------|-------------|----------|
| Timestamp + date label | `20240315123045 → 2024-03-15 12:30`. Clean, enough to identify and pass to --capture. | ✓ |
| Timestamp + date + HTTP status | Adds `[200]` status indicator per row. | |
| Timestamp + full toolbar-stripped URL | Long but immediately pasteable. | |

**User's choice:** Timestamp + date label (plus full if_ URL on same row — decided in URL pattern area)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Summary table — one row per domain | domain \| snapshot count \| oldest \| newest. Quick audit. | ✓ |
| Same grouped timeline per domain | Full timeline repeated per domain. Verbose. | |
| Just the totals — print count only | `sfdy-alt-clean: 47 snapshots (2022-01 to 2026-07)`. Ultra-compact. | |

**User's choice:** Summary table — one row per domain

---

## Toolbar-Strip URL Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| `if_` flag — removes toolbar, keeps original layout | `https://web.archive.org/web/{timestamp}if_/{domain}` | ✓ |
| `id_` flag — raw archived content | Serves raw HTTP response. Some resources may not resolve. | |
| No modifier — standard Wayback URL | Includes Wayback toolbar overlay. Toolbar JS may interfere with design review. | |

**User's choice:** `if_` flag

---

| Option | Description | Selected |
|--------|-------------|----------|
| Show full if_ URL in timeline output | Each row prints the full inspection URL for direct click. | ✓ |
| Show timestamp only, print URL separately with --url | Timeline stays compact; URL printed on demand. | |

**User's choice:** Show full if_ URL in timeline output

---

| Option | Description | Selected |
|--------|-------------|----------|
| Read from wiring.json `domain` field | `archive-browse.mjs sfdy-alt-clean` reads wiring.json for domain. Error if null. | ✓ |
| Accept either slug or bare domain as argument | Falls back to treating argument as domain directly if no slug match. | |

**User's choice:** Read from wiring.json `domain` field

---

## Capture Handoff

| Option | Description | Selected |
|--------|-------------|----------|
| exec capture-site.mjs directly as subprocess | Inline subprocess via execSync/spawn. Operator sees Playwright progress. | ✓ |
| Print the command for operator to run | Outputs the command and exits. Operator runs manually. | |
| Write a shell script and exec it | Extra complexity with no real benefit. | |

**User's choice:** exec capture-site.mjs directly as subprocess

---

| Option | Description | Selected |
|--------|-------------|----------|
| `_captures/<slug>-<timestamp>/` | e.g. `_captures/sfdy-alt-clean-20240315123045/`. Namespaced by site, clearly dated. | ✓ |
| `_captures/<slug>/` — overwrite existing capture | Destroys prior capture data. | |
| `_captures/<domain>-<timestamp>/` | Uses live domain instead of slug. | |

**User's choice:** `_captures/<slug>-<timestamp>/`

---

| Option | Description | Selected |
|--------|-------------|----------|
| Error and exit — timestamp must match a known CDX entry | Verifies timestamp in CDX data before constructing URL. Helpful error if not found. | ✓ |
| Proceed anyway with constructed URL | Constructs URL from timestamp as-is; relies on capture-site.mjs to fail if invalid. | |

**User's choice:** Error and exit — timestamp must match a known CDX entry

---

## Skill Interaction Model

| Option | Description | Selected |
|--------|-------------|----------|
| Shell out to script, display output, then ask what to do | Claude runs archive-browse.mjs, displays timeline, prompts operator for next action. | ✓ |
| Fully guided step-by-step with no direct script invocation | Claude queries CDX API itself, only shells out at capture time. Duplicates CDX logic. | |

**User's choice:** Shell out to script, display output, then ask what to do

---

| Option | Description | Selected |
|--------|-------------|----------|
| Print the if_ URL and tell operator to open in their browser | Claude outputs the URL, asks "Capture this snapshot? (y/n)". | ✓ |
| Claude opens the URL in Chrome via browser automation | Skill uses browser tools to open the URL in Claude's Chrome session. | |

**User's choice:** Print the if_ URL and tell operator to open in their browser

---

| Option | Description | Selected |
|--------|-------------|----------|
| Run `archive-browse.mjs <slug> --capture <timestamp>` | Routes through the script's CDX verification before exec'ing capture-site.mjs. | ✓ |
| Run capture-site.mjs directly with the if_ URL | Bypasses archive-browse.mjs CDX verification step. | |

**User's choice:** Run `archive-browse.mjs <slug> --capture <timestamp>`

---

## Claude's Discretion

- Whether `archive-browse.mjs` supports a `--limit N` flag to override the default 100 snapshots
- Whether `--sweep` fetches domains in parallel or sequentially
- Exact CDX API endpoint and query parameters
- Whether a footer line shows "Showing 100 of N snapshots"
- Error handling for CDX API timeouts or rate limits

## Deferred Ideas

None — discussion stayed within phase scope.

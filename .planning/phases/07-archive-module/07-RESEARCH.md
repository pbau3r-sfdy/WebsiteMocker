# Phase 7: Archive Module — Research

**Researched:** 2026-08-24
**Domain:** Wayback CDX API, Node.js CLI scripting, Claude skill authoring
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Snapshot timeline grouped by year/month. Year headers: `── 2024 (12 snapshots) ──`, indented rows per snapshot.
- **D-02:** Default fetch limit: 100 snapshots from CDX API per domain.
- **D-03:** Each snapshot row: `  20240315123045  →  2024-03-15 12:30` plus the full `if_` URL on the same line.
- **D-04:** `--sweep` summary table: `domain | snapshot count | oldest | newest`, one row per active domain, fetched sequentially.
- **D-05:** Inspection URLs use `if_` modifier: `https://web.archive.org/web/{timestamp}if_/{domain}`.
- **D-06:** Full `if_` URL printed on every snapshot row; no separate `--url` flag.
- **D-07:** Domain resolved from `wiring.json` `domain` field for a given slug. Missing/null domain: error with clear message.
- **D-08:** `--capture <timestamp>` calls `capture-site.mjs` as a subprocess via `execSync`/`spawn` with `stdio: 'inherit'`.
- **D-09:** Captured DNA lands in `_captures/<slug>-<timestamp>/`.
- **D-10:** Before constructing the Wayback URL for capture, verify timestamp exists in the fetched CDX response. Error message if not found.
- **D-11:** `/wm-archive-browse [slug]` shells out to `archive-browse.mjs <slug>`, reads and displays timeline, prompts for timestamp or `--capture <timestamp>`.
- **D-12:** Skill prints the `if_` URL and instructs operator to open in browser, then asks: "Capture this snapshot? (y/n)".
- **D-13:** If confirmed, skill runs `archive-browse.mjs <slug> --capture <timestamp>` and reports where DNA was written.

### Claude's Discretion

- Whether `archive-browse.mjs` supports a `--limit N` flag to override the default 100 snapshots.
- Whether `--sweep` fetches in parallel or sequentially (recommend sequential — avoids CDX rate-limit concerns).
- Exact CDX API endpoint and query parameters (verified below — recommend confirmed endpoint).
- Whether the script prints a footer line showing how many snapshots were returned vs. available.
- Error handling for CDX API timeouts or rate limits (recommend: retry once with 2s delay, then fail with actionable message).

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ARCH-01 | `archive-browse.mjs <slug\|domain>` shows a snapshot timeline grouped by year/month | CDX API `fl=timestamp,statuscode` + JSON array parsing + grouping by `ts.slice(0,6)` |
| ARCH-02 | Each snapshot row includes a clickable, toolbar-stripped Wayback URL | `if_` modifier: `https://web.archive.org/web/{timestamp}if_/{domain}` |
| ARCH-03 | `archive-browse.mjs --sweep` shows archive coverage across all wiring.json domains | Iterate `sites/`, filter active (no archived/template, domain non-null), fetch CDX per domain |
| ARCH-04 | `--capture <timestamp>` hands off to `capture-site.mjs`, writing `_captures/<slug>-<timestamp>/` | `execSync` with `stdio: 'inherit'`; capture-site.mjs accepts `<url> <slug>` positional args |
| ARCH-05 | `/wm-archive-browse [slug\|domain]` interactive skill: browse → inspect → optional capture | Skill pattern from wm-ingest.md / wm-gen-docs.md: shell-out → display → confirm → exec |
</phase_requirements>

---

## Summary

Phase 7 delivers two artifacts: `_scripts/archive-browse.mjs` (a Node.js CLI that queries the Wayback CDX API) and `.claude/skills/wm-archive-browse.md` (a guided Claude wrapper). The phase has no npm dependencies — the Wayback CDX API is a free HTTP endpoint requiring no authentication, and all required Node.js primitives (`fetch` / `https`, `fs`, `child_process`) are built-ins.

The CDX API's JSON response format is an array-of-arrays where the first element is a header row (must be skipped during parsing). This is a reliable gotcha for first-time CDX consumers. The `if_` modifier strips the Wayback toolbar, making the URL suitable for clean design inspection. The `capture-site.mjs` subprocess invocation pattern is already established in `ingest-artifact.mjs` via `execSync({ stdio: 'inherit' })` — the new script reuses the exact same pattern.

The skill follows the shell-out → display → confirm → exec pattern established by `wm-ingest.md` and `wm-gen-docs.md`. No new conventions are introduced.

**Primary recommendation:** Implement `archive-browse.mjs` by extracting the `flag()`, `option()`, and `readJSON()` helpers from `ingest-artifact.mjs` verbatim; use Node's built-in `https` module for CDX fetches (no new packages); use `execSync` with `stdio: 'inherit'` for capture handoff.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| CDX API fetch + snapshot parsing | CLI script (`_scripts/`) | — | Pure Node.js HTTP + data transform; no UI layer needed |
| Domain resolution from slug | CLI script (`_scripts/`) | — | Reads `wiring.json` at runtime; same pattern as other scripts |
| Snapshot timeline display | CLI script stdout | — | Terminal output; operator reads directly |
| `if_` URL generation | CLI script (`_scripts/`) | — | String template applied to fetched timestamps |
| Capture subprocess handoff | CLI script (`_scripts/`) | `capture-site.mjs` | `execSync` delegates; no logic duplication |
| Multi-domain sweep | CLI script (`_scripts/`) | — | Iterates `sites/` dir; sequential CDX fetches |
| Interactive guided flow | Skill (`.claude/skills/`) | CLI script | Skill wraps script output with human confirmation gate |
| Timestamp selection & browser open | Skill (`.claude/skills/`) | — | Operator browser action; Claude prints URL and waits |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `https` (built-in) | Node 18+ | CDX API HTTP fetch | No extra package; already used in `capture-site.mjs` (`https.get`) |
| Node.js `child_process.execSync` (built-in) | Node 18+ | Subprocess handoff to capture-site.mjs | Matches existing pattern in `ingest-artifact.mjs` `run()` helper |
| Node.js `fs` (built-in) | Node 18+ | Read `wiring.json`, enumerate `sites/` | Used in every existing `_scripts/*.mjs` |
| Node.js `path`, `url` (built-in) | Node 18+ | `__dirname` equivalent, path joins | Standard pattern per CONVENTIONS.md |

### No External Packages Required

This phase requires zero npm installs. The CDX API returns plain JSON over HTTPS. All parsing and display is string manipulation on primitive arrays.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `https.get` (callback) | `fetch` (global in Node 18+) | `fetch` is cleaner; `https.get` is what `capture-site.mjs` already uses. Either works — `fetch` is simpler for this use case since we just need the response body |
| `execSync` | `spawnSync` or `spawn` | `execSync` with `stdio: 'inherit'` is the established pattern in this codebase; sufficient for D-08 |

**Recommendation on `fetch` vs `https.get`:** Use `fetch` (Node 18+ global) for CDX requests — it requires no import and simplifies the async/await flow. `capture-site.mjs` uses `https.get` for asset downloads (streaming required there); that's different from a simple JSON fetch.

---

## Package Legitimacy Audit

> No external packages are required for this phase. CDX API access uses Node.js built-ins. The `slopcheck` protocol does not apply.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
Operator CLI invocation
        │
        ▼
archive-browse.mjs
        │
        ├─── (slug mode) ──────────────────────────────────┐
        │    read sites/<slug>/wiring.json                 │
        │    → extract domain field                        │
        │    → error if null                               │
        │                                                  │
        ├─── (domain mode) ────────────────────────────────┤
        │    use domain arg directly                        │
        │                                                  ▼
        │              CDX API Request
        │    https://web.archive.org/cdx/search/cdx
        │    ?url={domain}&output=json&limit=100
        │    &fl=timestamp,statuscode
        │              │
        │              ▼
        │         JSON response (array-of-arrays)
        │         [header_row, ...data_rows]
        │              │
        │         skip header; parse data rows
        │         filter by statuscode (optional)
        │         group by year+month
        │              │
        │              ▼
        │         print timeline to stdout
        │         ── 2024 (12 snapshots) ──
        │           20240315...  →  2024-03-15 12:30  https://web.archive.org/web/...if_/...
        │
        ├─── (--sweep mode) ──────────────────────────────┐
        │    readdir sites/                                │
        │    for each site:                               │
        │      read wiring.json                           │
        │      skip if archived/template/no domain        │
        │      fetch CDX → count, oldest, newest          │
        │    print summary table                          │
        │                                                 ┘
        │
        └─── (--capture <timestamp>) ─────────────────────┐
             validate timestamp in fetched CDX rows        │
             construct if_ URL                             │
             execSync(                                     │
               'node _scripts/capture-site.mjs            │
                <if_url> <slug>-<timestamp>',              │
               { stdio: 'inherit' }                        │
             )                                             │
             → capture-site.mjs runs inline               │
             → writes _captures/<slug>-<timestamp>/        │
                                                           ┘

/wm-archive-browse skill
        │
        ▼
   run archive-browse.mjs <slug>  (read stdout)
        │
        ▼
   display timeline to operator
        │
        ▼
   prompt: "Enter timestamp to inspect"
        │
        ▼
   print if_ URL  →  "Open in browser, then confirm: capture? (y/n)"
        │
        ├── yes ──▶  run archive-browse.mjs <slug> --capture <timestamp>
        │            report: _captures/<slug>-<timestamp>/ written
        │
        └── no  ──▶  done
```

### Recommended Project Structure

```
_scripts/
└── archive-browse.mjs       # new — CDX client + timeline display + capture handoff

.claude/skills/
└── wm-archive-browse.md     # new — guided interactive skill

_captures/
└── <slug>-<timestamp>/      # written by --capture; same layout as _captures/<slug>/
    ├── capture.json
    ├── tokens.json
    ├── CAPTURE.md
    ├── assets/
    └── screenshots/
```

No changes to any existing file are required. This is purely additive.

### Pattern 1: Script Header (Established Convention)

**What:** Every `_scripts/*.mjs` begins with shebang + JSDoc block. [VERIFIED: codebase read of ingest-artifact.mjs, capture-site.mjs]

**When to use:** Always — required for all `_scripts/*.mjs` files per CONVENTIONS.md.

```js
// Source: _scripts/ingest-artifact.mjs (lines 1-11)
#!/usr/bin/env node
/**
 * archive-browse.mjs — Wayback Machine CDX snapshot browser
 *
 * Usage:
 *   node _scripts/archive-browse.mjs <slug>
 *   node _scripts/archive-browse.mjs <slug> --capture <timestamp>
 *   node _scripts/archive-browse.mjs --sweep
 *
 * Output: snapshot timeline printed to stdout; optional capture to _captures/<slug>-<timestamp>/
 */
```

### Pattern 2: CLI Arg Parsing (Established Convention)

**What:** `flag(name)` and `option(name)` helpers extracted from `process.argv`. [VERIFIED: ingest-artifact.mjs lines 66-75]

```js
// Source: _scripts/ingest-artifact.mjs (lines 66-75)
const args = process.argv.slice(2);

function flag(name) {
  const i = args.indexOf(name);
  if (i !== -1) { args.splice(i, 1); return true; }
  return false;
}
function option(name) {
  const i = args.indexOf(name);
  if (i !== -1 && args[i + 1]) { const v = args[i + 1]; args.splice(i, 2); return v; }
  return null;
}

const SWEEP   = flag('--sweep');
const CAPTURE = option('--capture');   // e.g. '20240315123045'
const LIMIT   = option('--limit');     // optional override (Claude's discretion)
const slugArg = args[0];               // positional: slug or domain
```

### Pattern 3: wiring.json Read (Established Convention)

**What:** `existsSync` guard + `readJSON()` silent fallback before every file read. [VERIFIED: ingest-artifact.mjs lines 104-105; wm-gen-docs.md step 2]

```js
// Source: _scripts/ingest-artifact.mjs (line 104-105)
function readJSON(p) {
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; }
}

// Usage in archive-browse.mjs:
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

const wiringPath = join(ROOT, 'sites', slugArg, 'wiring.json');
if (!existsSync(wiringPath)) fail(`sites/${slugArg}/wiring.json not found`);
const wiring = readJSON(wiringPath);
const domain = wiring?.domain;
if (!domain) fail(`domain not set in sites/${slugArg}/wiring.json — update wiring.json first`);
```

### Pattern 4: CDX API Fetch + JSON Parse

**What:** CDX returns array-of-arrays; element[0] is the header row and MUST be skipped. [VERIFIED: GitHub internetarchive/wayback CDX README via WebFetch]

```js
// CDX endpoint (VERIFIED from GitHub internetarchive/wayback CDX README)
const url = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}&output=json&limit=${limit}&fl=timestamp,statuscode`;

// Using Node 18+ global fetch (no import needed)
async function fetchCDX(domain, limit = 100) {
  const url = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}&output=json&limit=${limit}&fl=timestamp,statuscode`;
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  } catch (err) {
    // Retry once after 2s delay (Claude's discretion recommendation)
    await new Promise(r => setTimeout(r, 2000));
    res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  }
  if (!res.ok) fail(`CDX API error ${res.status} for ${domain}`);
  const rows = await res.json();
  // rows[0] is ["timestamp","statuscode"] header — skip it
  return rows.slice(1);  // each element is [timestamp, statuscode]
}
```

### Pattern 5: Timeline Grouping and Display

**What:** Group snapshot rows by year-month and print in the D-01/D-03 format. [ASSUMED — derived from CONTEXT.md decisions D-01 and D-03]

```js
function printTimeline(domain, rows) {
  // Group by year (first 4 chars of timestamp)
  const byYear = {};
  for (const [ts] of rows) {
    const year = ts.slice(0, 4);
    (byYear[year] ??= []).push(ts);
  }
  for (const year of Object.keys(byYear).sort()) {
    const snapshots = byYear[year];
    console.log(`\n── ${year} (${snapshots.length} snapshots) ──`);
    for (const ts of snapshots) {
      const dateLabel = `${ts.slice(0,4)}-${ts.slice(4,6)}-${ts.slice(6,8)} ${ts.slice(8,10)}:${ts.slice(10,12)}`;
      const ifUrl = `https://web.archive.org/web/${ts}if_/${domain}`;
      console.log(`  ${ts}  →  ${dateLabel}  ${ifUrl}`);
    }
  }
}
```

### Pattern 6: Capture Subprocess Handoff

**What:** `execSync` with `stdio: 'inherit'` so Playwright output appears inline. [VERIFIED: ingest-artifact.mjs `run()` helper, lines 96-102]

```js
// Source: _scripts/ingest-artifact.mjs lines 96-102 (run() helper pattern)
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = new URL('..', import.meta.url).pathname;

function captureSnapshot(domain, slug, timestamp) {
  const ifUrl      = `https://web.archive.org/web/${timestamp}if_/${domain}`;
  const captureSlug = `${slug}-${timestamp}`;
  const cmd = `node _scripts/capture-site.mjs "${ifUrl}" "${captureSlug}"`;
  console.log(`\n▶  ${cmd}`);
  execSync(cmd, {
    stdio: 'inherit',
    cwd: ROOT,
    env: { ...process.env },
  });
  console.log(`\n✓  Design DNA written to _captures/${captureSlug}/`);
}
```

**Important:** `capture-site.mjs` positional args are `<url> <slug>`. The output directory is always `_captures/<slug>/`. Passing `<slug>-<timestamp>` as the slug arg satisfies D-09 without any modification to `capture-site.mjs`. [VERIFIED: capture-site.mjs lines 44-55]

### Pattern 7: Skill File Format (Established Convention)

**What:** Skill files in `.claude/skills/` are Markdown with `# /wm-skill-name` heading, numbered `### N. Step name` steps, code blocks for commands, Notes section at the end. [VERIFIED: wm-ingest.md, wm-gen-docs.md — both read in full]

The `/wm-archive-browse` skill follows the shell-out → display → confirm → exec pattern of `wm-gen-docs.md`:
1. Collect inputs (slug)
2. Run `archive-browse.mjs <slug>` — display output
3. Prompt operator for timestamp
4. Print `if_` URL — instruct operator to open in browser
5. Ask: "Capture this snapshot? (y/n)"
6. If yes: run `archive-browse.mjs <slug> --capture <timestamp>` — report output path
7. If no: done

### Pattern 8: Sweep Mode — Active Site Filter

**What:** Filter active sites from `sites/` using `wiring.json` flags. [VERIFIED: CONVENTIONS.md `wiring.json Conventions` section; confirmed by reading sfdy-alt-clean and parrot-capital wiring.json]

```js
function getActiveSites() {
  const sitesDir = join(ROOT, 'sites');
  return readdirSync(sitesDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => {
      const w = readJSON(join(sitesDir, e.name, 'wiring.json'));
      return { slug: e.name, wiring: w };
    })
    .filter(({ wiring: w }) =>
      w &&
      !w.archived &&
      !w.template &&
      w.domain      // null domain → skip
    );
}
```

Active site criteria (all three must be true):
- `wiring.archived` is falsy (no `"archived": true`)
- `wiring.template` is falsy (no `"template": true`)
- `wiring.domain` is non-null and non-empty

### Anti-Patterns to Avoid

- **Parsing the CDX header row as data:** CDX JSON response first element is `["timestamp","statuscode"]` — always call `.slice(1)` before iterating rows. Failure to do so prints "timestamp" as a snapshot. [VERIFIED: CDX README]
- **Passing full `if_` URL domain-only to CDX:** CDX requires just the domain (e.g. `www.starflight-dynamics.com`), not the full URL. Do not pass `https://` prefix.
- **Building capture output path manually:** Do not reconstruct `_captures/<slug>-<timestamp>/` in `archive-browse.mjs` — pass the slug arg to `capture-site.mjs` and let it build the path. This keeps the two scripts loosely coupled.
- **Using CommonJS `require()`:** All `_scripts/*.mjs` are ES modules. Use `import` / `fileURLToPath(import.meta.url)` for `__dirname` equivalent. [VERIFIED: CONVENTIONS.md]
- **`process.argv[1]` for ROOT:** Use `new URL('..', import.meta.url).pathname` or the `path.resolve(__dirname, '..')` pattern from `capture-site.mjs`. [VERIFIED: capture-site.mjs line 41]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP requests to CDX API | Custom TCP socket or third-party HTTP lib | `fetch` (Node 18+ built-in) or `https.get` | Both are available with zero install; CDX needs only one request per domain |
| Timestamp → date formatting | Regex/string math | Direct string slicing: `ts.slice(0,4)`, `ts.slice(4,6)`, etc. | CDX timestamps are always 14-char YYYYMMDDHHmmss — slice is sufficient and zero-dependency |
| Playwright / browser automation | Custom headless logic | `capture-site.mjs` (existing) | Already handles consent dismissal, lazy loading, desktop+mobile screenshots, asset download |
| arg parsing | Commander, yargs, minimist | `flag()`/`option()` helpers (copy from ingest-artifact.mjs) | 10 lines, zero dependencies, already established in this codebase |
| wiring.json schema validation | Zod or ajv | `existsSync` guard + optional chaining | Consistent with every other script in `_scripts/`; no need for schema library at CLI level |

**Key insight:** This phase needs no new packages. The CDX API is free, unauthenticated, and returns plain JSON. Every capability maps to a built-in or an existing script.

---

## Common Pitfalls

### Pitfall 1: CDX JSON Header Row
**What goes wrong:** Iterating `rows` directly without skipping `rows[0]` causes the string `"timestamp"` to appear as a snapshot timestamp.
**Why it happens:** CDX returns an array-of-arrays where the first element is always the field-name header.
**How to avoid:** `const snapshots = rows.slice(1)` immediately after parsing.
**Warning signs:** Timeline shows year `"time"` with a count of 1.

### Pitfall 2: CDX `url=` must not include protocol prefix
**What goes wrong:** Passing `https://www.example.com` to `?url=` may return zero results or unexpected results.
**Why it happens:** CDX expects the bare domain (or SURT-encoded key). The `domain` field in `wiring.json` (e.g., `www.starflight-dynamics.com`) is already in the correct format.
**How to avoid:** Use `wiring.domain` directly; never prepend `https://`.
**Warning signs:** CDX returns an empty array `[[...header]]` for a domain that clearly has captures.

### Pitfall 3: Capture output slug collision with live capture
**What goes wrong:** Accidentally writing to `_captures/<slug>/` (the live capture dir) instead of `_captures/<slug>-<timestamp>/`.
**Why it happens:** Forgetting to append the timestamp suffix when passing the slug arg to `capture-site.mjs`.
**How to avoid:** Always construct `captureSlug = \`${slug}-${timestamp}\`` and pass it as the second positional arg to capture-site.mjs.
**Warning signs:** `_captures/sfdy-alt-clean/` is overwritten with Wayback page content instead of live site content.

### Pitfall 4: Timestamp validation skipped before --capture
**What goes wrong:** Passing a non-existent timestamp constructs a Wayback URL that 404s or redirects, causing `capture-site.mjs` to capture a placeholder page.
**Why it happens:** User typos or stale timestamps from a previous CDX fetch.
**How to avoid:** Validate that the `--capture <timestamp>` value appears in the CDX response before calling `capture-site.mjs`. Per D-10, error message must name both the timestamp and the slug.
**Warning signs:** Capture completes but CAPTURE.md contains "under construction" or "page not found" content.

### Pitfall 5: `execSync` blocks the event loop during long capture
**What goes wrong:** `execSync` in a top-level async context can cause confusing behavior if mixed with `await`.
**Why it happens:** Mixing async CDX fetch + sync `execSync` in the same function.
**How to avoid:** Structure the main function so all `await` calls (CDX fetch) complete before calling `execSync` (capture handoff). Do not interleave.
**Warning signs:** TypeError or "Cannot read property" errors after `execSync` returns.

### Pitfall 6: --sweep makes N concurrent CDX requests
**What goes wrong:** Running CDX requests in parallel (e.g. `Promise.all`) may trigger rate limiting. The CDX API has no documented rate limit but is a public shared resource.
**Why it happens:** Temptation to speed up sweep with `Promise.all`.
**How to avoid:** Sequential `for...of` loop across domains with no added delay. Per CONTEXT.md (Claude's discretion): sequential is correct.
**Warning signs:** Some domains return empty arrays while others succeed during sweep.

---

## CDX API Reference

### Endpoint

```
https://web.archive.org/cdx/search/cdx
  ?url={domain}
  &output=json
  &limit=100
  &fl=timestamp,statuscode
```

[VERIFIED: GitHub internetarchive/wayback CDX README — https://github.com/internetarchive/wayback/blob/master/wayback-cdx-server/README.md]

### Response Structure

```json
[
  ["timestamp", "statuscode"],
  ["20240315123045", "200"],
  ["20231201094512", "200"],
  ...
]
```

- Element `[0]` is the header row — always skip with `.slice(1)`.
- Each data row: `[timestamp_14char, http_status_string]`.
- `limit=N` returns the N oldest captures. `limit=-N` returns the N most recent.
- No authentication required.
- No officially documented rate limit — treat as shared public resource; sequential requests only. [ASSUMED]

### `if_` URL Format (Toolbar-Stripped)

```
https://web.archive.org/web/{timestamp}if_/{domain}
```

The `if_` modifier instructs the Wayback Machine to serve the original page HTML without injecting the Wayback toolbar/nav bar. This preserves the original layout for design inspection. [CITED: CONTEXT.md D-05, confirmed pattern documented in internet archive conventions]

---

## Code Examples

### Full archive-browse.mjs skeleton

```js
#!/usr/bin/env node
/**
 * archive-browse.mjs — Wayback Machine CDX snapshot browser
 *
 * Usage:
 *   node _scripts/archive-browse.mjs <slug|domain>
 *   node _scripts/archive-browse.mjs <slug> --capture <timestamp>
 *   node _scripts/archive-browse.mjs --sweep
 *   node _scripts/archive-browse.mjs <slug> --limit 500
 */

import { execSync }                        from 'child_process';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join }                            from 'path';
import { fileURLToPath }                   from 'url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');

// ── Log helpers ──────────────────────────────────────────────────────────────
const ok   = (...a) => console.log(' ✓', ...a);
const fail = (...a) => { console.error(' ✖', ...a); process.exit(1); };

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(n)   { const i=args.indexOf(n); if(i!==-1){args.splice(i,1);return true;} return false; }
function option(n) { const i=args.indexOf(n); if(i!==-1&&args[i+1]){const v=args[i+1];args.splice(i,2);return v;} return null; }

const SWEEP   = flag('--sweep');
const CAPTURE = option('--capture');
const LIMIT   = parseInt(option('--limit') ?? '100', 10);
const inputArg = args[0];   // slug or bare domain

// ── readJSON ──────────────────────────────────────────────────────────────────
function readJSON(p) {
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; }
}

// ── CDX fetch ─────────────────────────────────────────────────────────────────
async function fetchCDX(domain, limit) {
  const url = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}&output=json&limit=${limit}&fl=timestamp,statuscode`;
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  } catch {
    await new Promise(r => setTimeout(r, 2000));
    res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  }
  if (!res.ok) fail(`CDX API error ${res.status} for ${domain}`);
  const rows = await res.json();
  return rows.slice(1);   // skip header row
}

// ── Domain resolution ─────────────────────────────────────────────────────────
function resolveDomain(input) {
  // If input looks like a bare domain (contains a dot), use directly
  if (input && input.includes('.')) return { domain: input, slug: null };
  // Otherwise treat as slug
  const wiringPath = join(ROOT, 'sites', input, 'wiring.json');
  if (!existsSync(wiringPath)) fail(`sites/${input}/wiring.json not found`);
  const w = readJSON(wiringPath);
  if (!w?.domain) fail(`domain not set in sites/${input}/wiring.json — update wiring.json first`);
  return { domain: w.domain, slug: input };
}

// ── Timeline display ──────────────────────────────────────────────────────────
function printTimeline(domain, rows) {
  const byYear = {};
  for (const [ts] of rows) {
    const year = ts.slice(0, 4);
    (byYear[year] ??= []).push(ts);
  }
  const years = Object.keys(byYear).sort();
  for (const year of years) {
    const snaps = byYear[year];
    console.log(`\n── ${year} (${snaps.length} snapshots) ──`);
    for (const ts of snaps) {
      const label = `${ts.slice(0,4)}-${ts.slice(4,6)}-${ts.slice(6,8)} ${ts.slice(8,10)}:${ts.slice(10,12)}`;
      const ifUrl = `https://web.archive.org/web/${ts}if_/${domain}`;
      console.log(`  ${ts}  →  ${label}  ${ifUrl}`);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (SWEEP) {
    // ... sweep mode: iterate sites/, print summary table
  } else {
    if (!inputArg) fail('Usage: archive-browse.mjs <slug|domain> [--capture <timestamp>] [--limit N]');
    const { domain, slug } = resolveDomain(inputArg);
    const rows = await fetchCDX(domain, LIMIT);
    if (rows.length === 0) fail(`No snapshots found for ${domain}`);

    console.log(`\nArchive: ${domain}  (${rows.length} snapshots shown)`);
    printTimeline(domain, rows);

    if (rows.length === LIMIT) {
      console.log(`\nShowing ${LIMIT} of ≥${LIMIT} snapshots — use --limit N to increase`);
    }

    if (CAPTURE) {
      const found = rows.some(([ts]) => ts === CAPTURE);
      if (!found) fail(`Snapshot ${CAPTURE} not found for ${slug ?? domain}. Run without --capture to browse available snapshots.`);
      const captureSlug = slug ? `${slug}-${CAPTURE}` : `archive-${CAPTURE}`;
      const ifUrl = `https://web.archive.org/web/${CAPTURE}if_/${domain}`;
      const cmd   = `node _scripts/capture-site.mjs "${ifUrl}" "${captureSlug}"`;
      console.log(`\n▶  ${cmd}`);
      execSync(cmd, { stdio: 'inherit', cwd: ROOT });
      ok(`Design DNA written to _captures/${captureSlug}/`);
    }
  }
}

main().catch(e => { console.error(' ✖', e.message); process.exit(1); });
```

### Skill file skeleton (wm-archive-browse.md)

```markdown
# /wm-archive-browse

Browse the Wayback Machine snapshot history for any site in `wiring.json` and optionally
capture a historical snapshot's design DNA. Requires no API keys.

---

## Steps

### 1. Collect inputs
Ask for: **Slug** (must exist in `sites/`) or a bare domain name.

### 2. Run timeline
\`\`\`bash
node _scripts/archive-browse.mjs <slug>
\`\`\`
Read stdout. Present the grouped timeline to the operator.

### 3. Inspect a snapshot
When the operator selects a timestamp:
- Print: `https://web.archive.org/web/<timestamp>if_/<domain>`
- Say: "Open this URL in your browser to inspect the historical design."

### 4. Confirm capture
Ask: "Capture this snapshot? (y/n)"

### 5. If yes — run capture
\`\`\`bash
node _scripts/archive-browse.mjs <slug> --capture <timestamp>
\`\`\`
Report: design DNA written to `_captures/<slug>-<timestamp>/`.

### 6. If no — done
Report: "Timeline browsing complete. Run `/wm-archive-browse` again to inspect another snapshot."

---

## Notes
- ...
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `wayback_machine_downloader` gem (Ruby) | CDX API direct HTTP call | N/A for this project | No Ruby required; CDX is free and unauthenticated |
| Scraping the Wayback search UI | CDX JSON endpoint | CDX available since ~2013 | Machine-readable, paginated, field-selectable |

**Deprecated/outdated:**
- `output=text` format (CDX): Works but space-delimited; `output=json` is the correct choice for programmatic parsing.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | CDX API has no documented rate limit but is a shared public resource — sequential requests are safer than parallel | Common Pitfalls / Pitfall 6 | Parallel requests in --sweep may trigger throttling or IP block; low risk if sequential |
| A2 | `fetch` (Node 18+ global) is available in the project's Node.js runtime | Standard Stack | If Node <18 is used, switch to `https.get` callback pattern (same as capture-site.mjs) |
| A3 | Wayback Wayback `if_` modifier strips the toolbar while preserving original layout for design inspection | Architecture Patterns | If Wayback updates the `if_` behavior, inspection URLs may show toolbar or fail |
| A4 | CDX `url=` parameter accepts bare domain without protocol and returns captures across both HTTP and HTTPS | Code Examples | If CDX requires full URL, fetching `www.example.com` may miss `https://www.example.com` captures |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed. (This table is NOT empty — four assumptions flagged above.)

---

## Open Questions

1. **CDX rate limiting**
   - What we know: No documented rate limit in the CDX README.
   - What's unclear: Whether rapid sequential domain fetches in `--sweep` (e.g. 5 domains in < 2 seconds) triggers throttling.
   - Recommendation: Add a 500ms sleep between sweep domain fetches as a conservative default.

2. **Domain field format variation**
   - What we know: `sfdy-alt-clean` uses `"domain": "www.starflight-dynamics.com"` (www prefix); `parrot-capital` uses `"domain": "parrot-capital.com"` (no www).
   - What's unclear: CDX behavior differences between `www.` and non-`www.` queries — it may not return both.
   - Recommendation: Pass `domain` verbatim from `wiring.json`. Operators can use `--limit` to inspect whether both variants have captures.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js 18+ (for global `fetch`) | CDX HTTP request | Expected ✓ | check: `node --version` | Use `https.get` callback if Node < 18 |
| `capture-site.mjs` | `--capture` flag | ✓ (exists) | — | — |
| Wayback CDX API (internet) | All timeline queries | ✓ (public) | — | Offline: fail with clear message |
| `gh` CLI | Not required by this phase | N/A | N/A | N/A |

**Missing dependencies with no fallback:** None — if internet is unavailable, CDX fetch fails gracefully with the `fail()` helper.

**Missing dependencies with fallback:** `fetch` → `https.get` if Node < 18.

---

## Security Domain

> `security_enforcement` not set to false in config.json — section included.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | CDX API is unauthenticated |
| V3 Session Management | no | CLI tool; no sessions |
| V4 Access Control | no | Local operator CLI only |
| V5 Input Validation | yes | `slug` arg validated against `^[a-z0-9-]+$` pattern (same as ingest-artifact.mjs); timestamp validated against CDX response |
| V6 Cryptography | no | No secrets handled |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Shell injection via slug or timestamp arg | Tampering | Validate slug with regex; quote all interpolated args in `execSync` command string using template literal with quoted segments |
| Zip slip (not applicable — no zip in this phase) | — | N/A |
| CDX response with malformed timestamp (e.g. injection attempt) | Tampering | Validate timestamp against `/^\d{14}$/` before using in URL or filename |

**Key security note:** The `--capture <timestamp>` command interpolates the timestamp into the shell command string passed to `execSync`. Validate that the timestamp matches `^\d{14}$` exactly before using it. A malformed timestamp like `../../etc/passwd` passed naively would be passed to `capture-site.mjs` as its slug arg, creating a bad output path.

---

## Sources

### Primary (HIGH confidence)
- GitHub internetarchive/wayback CDX README (https://github.com/internetarchive/wayback/blob/master/wayback-cdx-server/README.md) — CDX endpoint, JSON format, fl= parameter, limit= parameter, header-row behavior
- `_scripts/ingest-artifact.mjs` (codebase read) — flag/option/readJSON helpers, run() execSync pattern, JSDoc header format, section dividers, logging conventions
- `_scripts/capture-site.mjs` (codebase read) — positional arg signature `<url> <slug>`, output directory `_captures/<slug>/`, https.get pattern
- `.claude/skills/wm-ingest.md` (codebase read) — skill file structure, shell-out → display → confirm → exec pattern
- `.claude/skills/wm-gen-docs.md` (codebase read) — confirm gate pattern, notes section format
- `sites/sfdy-alt-clean/wiring.json` (codebase read) — `domain` field name and format confirmed
- `sites/parrot-capital/wiring.json` (codebase read) — `domain` field confirmed (no-www variant)
- `.planning/codebase/CONVENTIONS.md` (codebase read) — naming, logging, error handling, section dividers
- `.planning/codebase/STRUCTURE.md` (codebase read) — file placement for new scripts and skills

### Secondary (MEDIUM confidence)
- WebSearch: Wayback Machine CDX API parameter overview — confirmed endpoint and parameter names match GitHub README

### Tertiary (LOW confidence)
- A1–A4 in Assumptions Log above

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all built-ins or existing scripts
- CDX API endpoint and response format: HIGH — verified from official GitHub README
- Architecture: HIGH — derived directly from locked decisions + verified code patterns
- `if_` modifier behavior: MEDIUM — documented in CONTEXT.md decisions; not independently verified against current Wayback behavior
- CDX rate limits: LOW — not documented; assumed sequential-is-safe

**Research date:** 2026-08-24
**Valid until:** 2026-09-24 (CDX API is stable; 30-day window appropriate)

---
phase: 07-archive-module
reviewed: 2026-08-25T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - _scripts/archive-browse.mjs
  - .claude/skills/wm-archive-browse.md
findings:
  critical: 2
  warning: 3
  info: 2
  total: 7
status: fixed
---

# Phase 07: Code Review Report

**Reviewed:** 2026-08-25
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Reviewed `_scripts/archive-browse.mjs` (187 lines) and its companion skill doc `.claude/skills/wm-archive-browse.md`. The script is well-structured overall — argument parsing, domain resolution, CDX fetch, retry, and timeline display are reasonably implemented. Two blockers need fixing before this ships: a shell injection via unvalidated bare-domain input in the `execSync` call, and a factual error in the skill doc that tells operators `--capture` is unavailable for bare domains when the script actually supports it. Three additional warnings cover NaN propagation from an unguarded `parseInt`, silent masking of malformed JSON, and unhelpful error messages when the CDX API returns a non-JSON body.

---

## Critical Issues

### CR-01: Shell injection via unvalidated bare-domain input in `execSync`

**File:** `_scripts/archive-browse.mjs:69,179`

**Issue:** When the positional argument contains a `.`, `resolveDomain` returns it as `domain` with no further validation (line 69). That raw string is then embedded inside a double-quoted shell command passed to `execSync` (line 179):

```js
const ifUrl = `https://web.archive.org/web/${CAPTURE}if_/${domain}`;
const cmd   = `node _scripts/capture-site.mjs "${ifUrl}" "${captureSlug}"`;
execSync(cmd, { stdio: 'inherit', cwd: ROOT });
```

`execSync` with a template-string command invokes a shell. A domain containing `"` breaks the quoting boundary; a domain containing `$(…)` or backticks expands inline in bash. For example, a `wiring.json` with `"domain": "$(id).com"` (reachable via `content-sync` or a crafted commit) would execute `id` when `--capture` is run. Even as a local dev tool the pattern is unsafe — if `--sweep` is ever wired into CI the attack surface widens.

**Fix:** Replace the string-interpolated `execSync` call with `execFileSync` and pass arguments as an array, which bypasses the shell entirely:

```js
import { execFileSync } from 'child_process';

// …

execFileSync(
  process.execPath,                           // node binary
  ['_scripts/capture-site.mjs', ifUrl, captureSlug],
  { stdio: 'inherit', cwd: ROOT }
);
```

Also add a basic domain-safety check immediately after `input.includes('.')` passes, before the domain is used anywhere:

```js
if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(input)) {
  fail('Invalid domain — only alphanumeric characters, dots, hyphens allowed');
}
```

---

### CR-02: Skill doc falsely claims `--capture` is unavailable for bare-domain input

**File:** `.claude/skills/wm-archive-browse.md:69`

**Issue:** The Notes section states:

> `--capture` is not available in domain mode (no slug to build the output path)

This is factually wrong. The script at line 177 explicitly handles the no-slug case:

```js
const captureSlug = slug ? `${slug}-${CAPTURE}` : `archive-${CAPTURE}`;
```

When a bare domain is supplied, the output path is `_captures/archive-<TIMESTAMP>/`. The feature works; the doc prohibits it. An operator following the skill doc will believe the operation is unsupported and not attempt it, losing functionality that is already implemented and tested.

**Fix:** Replace the incorrect note with accurate behavior:

```
**bare domain + `--capture`** — supported; the capture slug becomes
`archive-<timestamp>` (e.g. `_captures/archive-20240315123045/`).
To use a more descriptive slug, pass the matching `wiring.json` slug
instead of the bare domain.
```

---

## Warnings

### WR-01: `parseInt` result not validated — NaN silently propagates into CDX URL

**File:** `_scripts/archive-browse.mjs:43`

**Issue:**

```js
const LIMIT = parseInt(option('--limit') ?? '100', 10);
```

If `--limit` is passed with a non-numeric value (e.g. `--limit all`), `parseInt` returns `NaN`. `NaN` propagates unchecked into `fetchCDX(domain, NaN)`, producing the URL `…&limit=NaN`. The CDX API may silently ignore the invalid parameter and return its default result set (often thousands of rows), bypassing the intended cap with no warning to the operator.

**Fix:**

```js
const rawLimit = option('--limit');
const LIMIT    = rawLimit !== null ? parseInt(rawLimit, 10) : 100;
if (isNaN(LIMIT) || LIMIT < 1) {
  fail('--limit must be a positive integer');
}
```

---

### WR-02: Malformed `wiring.json` silently produces a misleading error message

**File:** `_scripts/archive-browse.mjs:48,79-80`

**Issue:** `readJSON` catches all exceptions (including JSON parse errors) and returns `null`:

```js
function readJSON(p) {
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; }
}
```

After `existsSync` confirms the file is present, a malformed JSON file returns `null`, and the downstream check `if (!w?.domain)` fires with the message:

```
domain not set in sites/<slug>/wiring.json — update wiring.json first
```

This tells the operator to update a field that may already be set correctly in a file that simply has a JSON syntax error. The root cause (parse failure) is hidden entirely.

**Fix:** Distinguish file-not-found from parse failure:

```js
function readJSON(p) {
  try {
    return JSON.parse(readFileSync(p, 'utf-8'));
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    fail(`${p}: invalid JSON — ${e.message}`);
  }
}
```

---

### WR-03: CDX response assumed to be parseable JSON — unhelpful error on HTML error pages

**File:** `_scripts/archive-browse.mjs:62-63`

**Issue:**

```js
const rows = await res.json();
return rows.slice(1);
```

`res.ok` is checked on line 61, but only for non-2xx HTTP status codes. If the Wayback Machine returns a `200 OK` with an HTML maintenance or rate-limit page (which has happened during CDX API incidents), `res.json()` throws a `SyntaxError` whose message is `"Unexpected token '<'"`. The operator sees:

```
✖ Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

There is also no guard on `rows` being an array before calling `.slice(1)` — a valid JSON non-array response (e.g. `{"error":"..."}`) would not fail at `res.json()` but would fail silently or produce wrong output at `rows.slice(1)`.

**Fix:**

```js
let rows;
try {
  rows = await res.json();
} catch {
  fail(`CDX API returned non-JSON for ${domain} — the archive may be temporarily unavailable`);
}
if (!Array.isArray(rows)) {
  fail(`CDX API returned unexpected format for ${domain}`);
}
return rows.slice(1);
```

---

## Info

### IN-01: `statuscode` field is fetched from CDX but never used

**File:** `_scripts/archive-browse.mjs:53`

**Issue:** The `fl` parameter requests both `timestamp` and `statuscode`:

```js
const url = `...&fl=timestamp,statuscode`;
```

`statuscode` is fetched and occupies index 1 in every row (`[ts, statuscode]`), but no code in the script reads or displays it. Only `[ts]` (index 0) is ever destructured. This wastes bandwidth (doubles the payload size for large result sets) and sets an expectation for the reader that status codes are used somewhere.

**Fix:** Either drop `statuscode` from the `fl` parameter to reduce payload, or surface it in `printTimeline` and the sweep output so operators can filter for live snapshots (status 200).

---

### IN-02: "≥${LIMIT}" hint can be misleading when CDX returns exactly LIMIT rows without overflow

**File:** `_scripts/archive-browse.mjs:167-169`

**Issue:**

```js
if (rows.length === LIMIT) {
  console.log(`\nShowing ${LIMIT} of ≥${LIMIT} snapshots — use --limit N to increase`);
}
```

The CDX API may return exactly `LIMIT` results as the true total (the domain has exactly 100 snapshots and the limit is 100). The `≥` hint falsely implies there are more unseen results. There is no CDX continuation token or `X-Total-Count` equivalent to confirm overflow.

**Fix:** Soften the wording to avoid the false implication:

```js
if (rows.length === LIMIT) {
  console.log(`\nShowing ${LIMIT} snapshots (limit reached) — use --limit N for more`);
}
```

---

_Reviewed: 2026-08-25_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

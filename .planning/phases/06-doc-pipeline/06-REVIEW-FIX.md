---
phase: 06-doc-pipeline
fixed_at: 2026-08-24T00:00:00Z
review_path: .planning/phases/06-doc-pipeline/06-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Phase 06: Code Review Fix Report

**Fixed at:** 2026-08-24
**Source review:** .planning/phases/06-doc-pipeline/06-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 8 (2 Critical, 6 Warning)
- Fixed: 8
- Skipped: 0

## Fixed Issues

### CR-01: Shell injection via unvalidated `wiring.prod_repo`

**Files modified:** `_scripts/ingest-artifact.mjs`
**Commit:** 5b6d758
**Applied fix:** Added regex validation `^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$` immediately after `rawProdRepo = targetRepoArg || wiring?.prod_repo` is resolved. The `wiring.prod_repo` path was not validated (only `targetRepoArg` was). A malicious `wiring.json` entry could inject shell commands. Now both paths go through the same guard before reaching `ghApiPutFile`.

---

### CR-02: `hast-util-from-html` and `hast-util-to-html` are undeclared dependencies

**Files modified:** `package.json`
**Commit:** 4aa6e70
**Applied fix:** Added explicit `"hast-util-from-html": "^2.0.0"` and `"hast-util-to-html": "^9.0.0"` entries to `dependencies`. Versions pinned based on currently resolved versions in node_modules (2.0.3 and 9.0.5 respectively).

---

### WR-01: Dollar-sign in doc-token values corrupts the CSS regex replacement

**Files modified:** `_scripts/ingest-artifact.mjs`
**Commit:** 3368bad
**Applied fix:** Changed `css.replace(varRe, \`$1${newVal}\`)` to `css.replace(varRe, (_, prefix) => prefix + newVal)`. Using a replacement function prevents `$1`, `$&`, `$'` etc. in `newVal` from being interpreted as replacement backreferences.

---

### WR-02: CSS variable replacement is not scoped to `:root` — overwrites all occurrences

**Files modified:** `_scripts/ingest-artifact.mjs`
**Commit:** 1a05c59
**Applied fix:** Replaced the `existingMatch`/global-replace approach with a `:root`-scoped replacement. Now extracts the `:root {}` block via `/(:root\s*\{)([^}]*)(})/g`, replaces or appends the property inside that block only, and leaves component-level overrides (e.g. `.dark-theme { --accent: #000; }`) untouched. Also preserved the WR-01 fix by using a function replacement in the inner `body.replace()` call.

---

### WR-03: Empty `catch` in SHA fetch silently swallows authentication and network failures

**Files modified:** `_scripts/ingest-artifact.mjs`
**Commit:** 2f957ac
**Applied fix:** Changed bare `catch {}` to `catch (err)` that checks the error message for `404` or `Not Found`. Only 404-equivalent errors are suppressed (file not found — no SHA needed). All other errors (auth failures, network timeouts, rate limits) are rethrown so the operator sees a meaningful error instead of a cryptic 422 on the subsequent PUT.

---

### WR-04: Uncaught crash when `/dev/tty` is unavailable in non-interactive mode

**Files modified:** `_scripts/ingest-artifact.mjs`
**Commit:** 01b2606
**Applied fix:** Wrapped the `execSync('read reply < /dev/tty ...')` call in a try/catch. On failure, calls `fail()` with a clear message instructing the operator to re-run with `--force` to auto-select the first HTML file. Prevents a raw Node.js stack trace in CI or piped environments.

---

### WR-05: `ghApiPutFile` failures surface as raw Node.js stack traces in docs mode

**Files modified:** `_scripts/ingest-artifact.mjs`
**Commit:** ccd3002
**Applied fix:** Wrapped both `ghApiPutFile` calls in `runDocsMode` (HTML and optional GFM) in try/catch blocks. On failure, calls `fail()` with a targeted message showing the file path, repo, and the underlying error message — surfacing the `gh` stderr that tells the operator what actually went wrong.

---

### WR-06: Skill mandates `pbau3r-sfdy` org but script only warns — behaviour diverges from documentation

**Files modified:** `_scripts/ingest-artifact.mjs`
**Commit:** 280be3a
**Applied fix:** Changed `warn(...)` to `fail(...)` for out-of-org `--target-repo` values. Decision: fail is correct per D-05 (commits go to `pbau3r-sfdy/*` only). The skill doc already says "must be in the `pbau3r-sfdy/*` namespace" — the script now enforces this hard.

---

_Fixed: 2026-08-24_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_

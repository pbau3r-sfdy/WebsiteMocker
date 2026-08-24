# Phase 6: Doc Pipeline — Research

**Researched:** 2026-08-24
**Domain:** Node.js script extension, CSS token injection, gh CLI commit, Markdown conversion
**Confidence:** HIGH (codebase is fully readable; external packages verified on registry)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Brand token injection uses `brand.doc_tokens` in `wiring.json` — flat object `{ "--accent": "#00FB92" }`. Script reads this map and overwrites matching vars in artifact `:root {}` before serialising.
- **D-02:** If `brand.doc_tokens` absent/empty, script warns operator and prints site's existing `Layout.astro :root` vars as copy-paste suggestions. Does NOT fall back silently.
- **D-03:** Operator re-wires all four active sites (post-phase operator task, not automated by script).
- **D-04:** Zip entry detection: auto-select if one HTML; numbered list if multiple; fail if none. Unpacked to `_captures/<slug>/raw/extracted/`.
- **D-05:** Zip contents written to `_captures/<slug>/raw/extracted/` (not zip root).
- **D-06:** `/wm-gen-docs` shows confirm summary before `gh api` commit; operator must type `y`. Summary includes: brand tokens before/after, output file size, target repo+path, GFM export size (if `--format md`).
- **D-07:** Confirm step is MANDATORY in the skill — cannot be bypassed via skill. `--force` flag is Claude's discretion for the underlying script only.
- **D-08:** Default invocation writes to `docs/index.html`.
- **D-09:** `--name <slug>` writes to `docs/<slug>.html` alongside `docs/index.html`.
- **D-10:** `--name` value validated against `^[a-z0-9-]+$` before any file write.

### Claude's Discretion

- Whether `--force` flag is added to skip confirm in the script (recommended: yes, script only, never the skill).
- Exact temp directory cleanup after zip extraction (recommended: clean up `extracted/` on success, leave on failure for debugging).
- Whether `--mode docs` and `full`/`section` modes share HTML parsing helpers (they should — `extractStyleCSS`, `extractCSSVars` are already reusable).
- Whether GFM conversion uses a library (e.g. `turndown`) or strip-tags approach (recommended: `turndown`).

### Deferred Ideas (OUT OF SCOPE)

- Re-wiring session for all four active sites (adding `brand.doc_tokens` to wiring.json) — operator task after Phase 6 ships.
- `--force` flag in the skill itself.
- Full Internet Archive search beyond CDX by domain — Phase 7 scope.
- GFM export to GitHub Wiki targets (separate from `docs/` folder).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DOCS-01 | `ingest-artifact.mjs <slug> --mode docs` with bare HTML or `.zip` export; zip auto-extracts entry HTML; no Astro build | `--mode docs` dispatch added at line 241 guard; zip extraction via `adm-zip`; artifact detection logic documented |
| DOCS-02 | Generated HTML auto-inherits brand colours/typography from `wiring.json` with no manual CSS editing | `brand.doc_tokens` field shape documented; HAST-based `:root {}` injection pattern shown |
| DOCS-03 | `/wm-gen-docs <slug>` skill: artifact → brand tokens → committed HTML in `prod_repo docs/` | Skill step-by-step pattern follows `wm-ingest.md` convention; confirm summary format documented |
| DOCS-04 | Commit generated doc to any GitHub repo's `docs/` folder via single `gh api` call; no PR, no CI | `gh api` PUT pattern with SHA fetch documented; `--input -` stdin approach avoids shell escaping |
| DOCS-05 | `--target-repo org/repo` flag overrides site's `prod_repo` | Flag added to script + skill; validation pattern `^[a-z0-9-]+/[a-z0-9-]+$` documented |
| DOCS-06 | GFM Markdown export alongside HTML via `--format md` | `turndown` v7.2.4 pattern documented; output path `docs/<name>.md`; body extraction approach shown |
</phase_requirements>

---

## Summary

Phase 6 extends the existing 682-line `_scripts/ingest-artifact.mjs` with a `--mode docs` path that produces a single self-contained branded HTML file from a Claude Design artifact without any Astro build step. The core mechanics are already present in the script — `extractCSSVars()`, `extractStyleCSS()`, and the HAST tree helpers are all reusable. The new work is: (1) adding a third mode dispatch, (2) zip extraction for `.zip` Claude Design exports, (3) CSS token injection from `wiring.json`'s new `brand.doc_tokens` field, (4) a `gh api` PUT commit step, and (5) the `/wm-gen-docs` skill wrapper.

Two new npm packages are required at the root `package.json` level: `adm-zip` (zip extraction — no Node built-in can handle `.zip` format; `node:zlib` only handles gzip/deflate) and `turndown` (HTML-to-GFM conversion for DOCS-06). Both packages are mature (created 2012 and 2017 respectively), MIT-licensed, have active GitHub repos, and have no postinstall scripts. slopcheck could not be run in this session (install blocked by permission policy), so both are tagged `[ASSUMED]` — the planner must gate their install behind a `checkpoint:human-verify` task.

The `gh api` PUT call pattern is already in use in `publish.yml` (SHA fetch + base64 encode + `--input -` stdin JSON body). The docs commit follows the identical pattern but targets `docs/<name>.html` in the `prod_repo` (or `--target-repo` override). The operator's confirm gate in the skill mirrors the collision confirm in `/wm-ingest` — the same UX the operator already knows.

**Primary recommendation:** Implement `--mode docs` as a new top-level conditional block in `ingest-artifact.mjs` immediately after the mode guard at line 241. Share all existing helpers. Add `adm-zip` and `turndown` to root `package.json`. Create `/wm-gen-docs` skill following the `/wm-ingest` step pattern.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Artifact detection (HTML or zip) | Script (`ingest-artifact.mjs --mode docs`) | — | File I/O; same script handles all artifact prep |
| Zip extraction + entry selection | Script | — | Deterministic logic; interactive prompt embedded in script |
| CSS token injection (`:root {}`) | Script | — | HAST tree manipulation already lives here |
| GFM Markdown export | Script | — | `turndown` invoked inline after HTML generation |
| `wiring.json` brand token read | Script | — | Same `readJSON()` + `extractCSSVars()` pattern used throughout |
| Layout.astro `:root` suggestion (D-02 warning) | Script | — | Reads `sites/<slug>/src/layouts/Layout.astro` inline |
| `gh api` PUT commit | Script (via execSync) | gh CLI | Script assembles body + calls `gh api`; gh handles auth |
| Operator confirm gate + summary display | Skill (`/wm-gen-docs`) | — | UX responsibility belongs in the skill, not the script |
| Artifact staging (paste to file) | Skill | — | Same as `/wm-ingest` Step 2 |
| `--target-repo` validation | Script | — | Validated before any file write, consistent with `--name` validation |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `hast-util-from-html` | already installed | Parse HTML to HAST tree | Already used in `ingest-artifact.mjs`; zero new deps [ASSUMED] |
| `hast-util-to-html` | already installed | Serialize HAST tree back to HTML | Already used in `ingest-artifact.mjs` [ASSUMED] |
| `adm-zip` | `^0.6.0` | Extract `.zip` Claude Design exports | Node built-in `zlib` handles gzip only; `.zip` format requires external lib [ASSUMED] |
| `turndown` | `^7.2.4` | Convert HTML to GFM Markdown (DOCS-06) | Operator-suggested in CONTEXT.md; well-established HTML→Markdown converter [ASSUMED] |
| `gh` CLI | v2.98.0 (confirmed installed) | `gh api` PUT for cross-repo doc commit | Already used in all existing publish workflows [VERIFIED: env check] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:fs` (built-in) | — | File read/write | Already used throughout the script |
| `node:path` | — | Path construction | Already used throughout the script |
| `node:child_process` | — | `execSync` for `gh api` call | Already used for `run()` helper |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `adm-zip` | `jszip` | jszip is Promise-based (async API); adm-zip is sync, matches the existing script's synchronous style |
| `adm-zip` | system `unzip` CLI via execSync | Works on macOS/Linux but fragile on Windows CI; adm-zip is cross-platform |
| `turndown` | strip-tags (hand-rolled) | Strip-tags loses heading structure, links, lists; `turndown` produces proper GFM that renders on GitHub |
| `turndown` | `node-html-markdown` | Less established; turndown has 27 versions since 2017, active maintenance |

**Installation (root `package.json`):**
```bash
npm install adm-zip turndown
```

**Version verification (confirmed against npm registry 2026-08-24):**
```
adm-zip: 0.6.0  (released 2026-07-10, created 2012-02-23, 43 versions, MIT)
turndown: 7.2.4  (released 2026-04-03, created 2017-06-02, 27 versions, MIT)
```

---

## Package Legitimacy Audit

> slopcheck was not available at research time (install blocked by permission policy). All recommended packages are tagged `[ASSUMED]` — the planner must gate each install behind a `checkpoint:human-verify` task.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `adm-zip` | npm | ~14 yrs (2012) | high (43 versions, active) | github.com/cthackers/adm-zip | unavailable | Flagged — planner must add checkpoint |
| `turndown` | npm | ~9 yrs (2017) | high (27 versions, active) | github.com/mixmark-io/turndown | unavailable | Flagged — planner must add checkpoint |

**No postinstall scripts detected** for either package (confirmed via `npm view <pkg> scripts.postinstall`).

**Packages removed due to slopcheck [SLOP] verdict:** none (slopcheck unavailable)
**Packages flagged as suspicious [SUS]:** none detected by manual checks

*slopcheck was unavailable at research time — all packages above are tagged `[ASSUMED]` and the planner must gate each install behind a `checkpoint:human-verify` task.*

---

## Architecture Patterns

### System Architecture Diagram

```
Operator invokes /wm-gen-docs <slug> [--name <n>] [--format md] [--target-repo org/repo]
         │
         ▼
[Skill: wm-gen-docs]
   1. Validate slug exists (sites/<slug>/wiring.json)
   2. Stage artifact (paste HTML → _captures/<slug>/raw/artifact.html)
         │
         ▼
[Script: ingest-artifact.mjs <slug> --mode docs --name <n> --format md --target-repo org/repo]
   │
   ├─── Artifact detection ──────────────────────────────────────────┐
   │    artifact.html exists? → use it                                │
   │    *.zip exists in raw/? → extract to raw/extracted/ via adm-zip │
   │      one HTML? → auto-select                                     │
   │      multiple? → print numbered list, read operator choice       │
   │      zero? → fail with clear error                               │
   │                                                                  │
   ├─── Validate --name (^[a-z0-9-]+$)                               │
   │                                                                  │
   ├─── Read wiring.json → brand.doc_tokens ─────────────────────────┤
   │    absent/empty? → warn + print Layout.astro :root vars          │
   │    → process.exit(1) (operator must add field first)             │
   │                                                                  │
   ├─── Parse HTML (fromHtml) → walk <style> nodes ──────────────────┤
   │    find :root {} block → apply doc_token overrides               │
   │    → record before/after for summary                             │
   │    → toHtml(tree) → output HTML string                           │
   │                                                                  │
   ├─── Write _captures/<slug>/docs/<name>.html                       │
   │                                                                  │
   ├─── (--format md) turndown(body innerHTML) → write docs/<name>.md │
   │                                                                  │
   └─── Print summary JSON to stdout ◄───────────────────────────────┘
         │
         ▼
[Skill: wm-gen-docs — confirm gate]
   Print confirm summary (D-06 format)
   Pause → operator types y
         │
         ▼
[Script or Skill: gh api PUT]
   GET existing SHA (if file exists in target repo)
   base64-encode output HTML
   PUT repos/{owner}/{repo}/contents/docs/{name}.html
         │
         ▼
   (--format md) PUT repos/{owner}/{repo}/contents/docs/{name}.md
         │
         ▼
   Done — print live path
```

### Recommended Project Structure

No new directories required. All output lands in existing locations:

```
_captures/<slug>/
├── raw/
│   ├── artifact.html        ← operator stages artifact here
│   └── extracted/           ← zip unpacked here (cleaned up on success)
└── docs/                    ← NEW: generated output staging area
    ├── index.html           ← default output (--name omitted)
    └── <name>.html          ← named output (--name <n>)
```

The `docs/` staging folder in `_captures/<slug>/` is a local working copy. The committed copy lands in the `prod_repo` at `docs/<name>.html` via `gh api`.

### Pattern 1: Mode Dispatch Extension in ingest-artifact.mjs

**What:** Add `'docs'` to the mode guard at line 241, then add a new top-level block.
**When to use:** All `--mode docs` invocations route here; full/section modes are unaffected.

```javascript
// Source: ingest-artifact.mjs line 241 — extend existing guard
if (modeArg !== 'full' && modeArg !== 'section' && modeArg !== 'docs') {
  fail(USAGE);
}

// ── DOCS MODE ──────────────────────────────────────────────────────
if (modeArg === 'docs') {
  // parse --name, --format, --target-repo, --force from args (already handled by option()/flag())
  runDocsMode(slug, siteDir, options);
  process.exit(0);
}
```

### Pattern 2: CSS Token Injection via HAST

**What:** Walk the HAST tree, find `<style>` text nodes containing `:root`, apply `doc_tokens` overrides, serialize back.
**When to use:** Always in `--mode docs` when `brand.doc_tokens` is non-empty.

```javascript
// Source: adapted from existing extractStyleCSS() + extractCSSVars() helpers
function injectDocTokens(html, docTokens) {
  const tree = fromHtml(html);
  walkTree(tree, node => {
    if (node.type === 'element' && node.tagName === 'style') {
      for (const child of (node.children || [])) {
        if (child.type === 'text' && child.value.includes(':root')) {
          // Apply overrides: replace existing vars or append new ones
          let css = child.value;
          for (const [prop, newVal] of Object.entries(docTokens)) {
            const escapedProp = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const varRe = new RegExp(`(${escapedProp}\\s*:\\s*)[^;\\n]+`, 'g');
            if (varRe.test(css)) {
              css = css.replace(varRe, `$1${newVal}`);
            } else {
              // Append inside :root { ... }
              css = css.replace(/:root\s*\{/, `:root {\n  ${prop}: ${newVal};`);
            }
          }
          child.value = css;
        }
      }
    }
  });
  return toHtml(tree);
}
```

### Pattern 3: gh api PUT via Node execSync with stdin body

**What:** Commit a file to a GitHub repo's `docs/` folder without a PR.
**When to use:** After the operator confirms the summary in the skill.
**Critical:** Must fetch existing SHA before PUT (GitHub API requires it for updates).

```javascript
// Source: adapted from .github/workflows/publish.yml gh api pattern
function ghApiPutFile(repoFullName, repoPath, fileBytes, commitMessage) {
  const [owner, repo] = repoFullName.split('/');
  const apiPath = `repos/${owner}/${repo}/contents/${repoPath}`;

  // 1. Fetch existing SHA (null if new file)
  let sha = null;
  try {
    const result = execSync(`gh api ${apiPath} --jq .sha`, { encoding: 'utf-8' }).trim();
    if (result && result !== 'null') sha = result;
  } catch { /* file does not exist yet — no SHA needed */ }

  // 2. Build JSON body (avoid shell escaping large base64 strings via --input -)
  const body = JSON.stringify({
    message: commitMessage,
    content: fileBytes.toString('base64'),
    ...(sha ? { sha } : {}),
  });

  // 3. PUT via stdin
  execSync(`gh api ${apiPath} --method PUT --input -`, {
    input: body,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
}
```

### Pattern 4: Zip Extraction with adm-zip

**What:** Detect `.zip` file in `_captures/<slug>/raw/`, extract to `raw/extracted/`, find entry HTML.
**When to use:** When no `artifact.html` exists but a `.zip` file is present.

```javascript
// Source: adm-zip API (https://github.com/cthackers/adm-zip#readme)
import AdmZip from 'adm-zip';

function extractZip(zipPath, destDir) {
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(destDir, /* overwrite */ true);
  // Find all .html files recursively
  const htmlFiles = [];
  function findHtml(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) findHtml(join(dir, entry.name));
      else if (entry.name.endsWith('.html')) htmlFiles.push(join(dir, entry.name));
    }
  }
  findHtml(destDir);
  return htmlFiles; // caller decides: auto-select if 1, prompt if >1, fail if 0
}
```

### Pattern 5: GFM Export with turndown (DOCS-06)

**What:** Convert generated HTML document body to GFM Markdown.
**When to use:** When `--format md` flag is passed.

```javascript
// Source: turndown README (https://github.com/mixmark-io/turndown#readme)
import TurndownService from 'turndown';   // CJS default import works in Node ESM

function htmlToGfm(html) {
  const td = new TurndownService({
    headingStyle: 'atx',         // # Heading
    bulletListMarker: '-',       // - item
    codeBlockStyle: 'fenced',    // ```code```
  });
  // Extract body content from full HTML document
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;
  return td.turndown(bodyContent);
}
```

### Pattern 6: brand.doc_tokens Absent Warning (D-02)

**What:** When `brand.doc_tokens` is missing from `wiring.json`, warn the operator and print the site's Layout.astro `:root` vars as a copy-paste suggestion, then exit.

```javascript
// Source: adapted from existing extractCSSVars() helper
function warnMissingDocTokens(slug, siteDir) {
  warn(`brand.doc_tokens not set in sites/${slug}/wiring.json`);
  warn('Add this field before running --mode docs. Suggested values from Layout.astro:');
  const layoutPath = join(siteDir, 'src', 'layouts', 'Layout.astro');
  if (existsSync(layoutPath)) {
    const layoutCSS = extractStyleCSS(readFileSync(layoutPath, 'utf-8'));
    const vars = extractCSSVars(layoutCSS);
    log('\n  "brand": {');
    log('    "doc_tokens": {');
    for (const [name, val] of vars) {
      log(`      "${name}": "${val}",`);
    }
    log('    }');
    log('  }');
  }
  process.exit(1);
}
```

### Pattern 7: wm-gen-docs Confirm Summary (D-06)

**What:** Skill prints confirm summary before `gh api` commit. Format mirrors `/wm-ingest` collision report.

```
── Doc Generation Summary ─────────────────────────────────
  Brand tokens injected (3):
    --accent:       #6366f1  →  #00FB92
    --bg:           #ffffff  →  #0d0d0d
    --font-display: Inter    →  Avenir Next
  Output:           docs/index.html:  48 KB
  Target repo:      pbau3r-sfdy/starflight-dynamics → docs/index.html
────────────────────────────────────────────────────────────

Proceed with commit? (y/N)
```

### Anti-Patterns to Avoid

- **Calling `gh api` with shell-interpolated base64:** Large base64 strings break shell argument limits. Always use `--input -` with stdin JSON body.
- **Skipping SHA fetch before PUT:** GitHub's Contents API returns 422 if you PUT an update without the current file's SHA. Always GET first.
- **Modifying CSS with string replace on the full HTML:** Fragile — matches vars outside `:root`. Use HAST tree walk to target only `<style>` nodes.
- **Extracting zip to the raw/ root:** Causes collisions with manually placed `artifact.html`. Always extract to `raw/extracted/` (D-05).
- **Running `--mode docs` without validating `brand.doc_tokens` first:** Produces unbranded output silently. Always check and fail-fast per D-02.
- **Reusing full/section mode artifact path logic:** `--mode docs` has a different artifact detection flow (HTML or zip). Keep it in its own block.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| `.zip` extraction | Custom binary parser | `adm-zip` | ZIP format has complex local file headers, compression methods, encodings |
| HTML → GFM Markdown | strip-tags + regex | `turndown` | Heading hierarchy, nested lists, inline code, links all require a proper DOM traversal |
| CSS var injection in HTML | Regex on full HTML string | HAST tree walk targeting `<style>` nodes | Regex matches vars outside `:root`, inside comments, or in other selectors |
| GitHub file commits | Custom fetch calls | `gh api` via execSync | Auth, content-type, base64 contract, error handling already handled by the authenticated gh CLI session |

**Key insight:** The existing HAST helpers in `ingest-artifact.mjs` are already a safe foundation. The only gaps are zip extraction and GFM conversion — both solvable in ~20 lines each with the right packages.

---

## Common Pitfalls

### Pitfall 1: gh api PUT on Existing File Without SHA

**What goes wrong:** `422 Unprocessable Entity` — "Invalid request. \"sha\" wasn't supplied.`
**Why it happens:** GitHub Contents API requires the current blob SHA to update an existing file (optimistic concurrency control). New files don't need it.
**How to avoid:** Always `gh api GET` the file path first; use `--jq .sha` to extract SHA; pass it in the PUT body only when non-null. Wrap GET in try/catch — missing file throws, not returns null.
**Warning signs:** 422 error on the PUT; first deploy works, subsequent runs fail.

### Pitfall 2: turndown CJS Import in ESM Module

**What goes wrong:** `Error [ERR_REQUIRE_ESM]` or `turndown is not a constructor`
**Why it happens:** `ingest-artifact.mjs` is an ES module (`.mjs`). `turndown` v7.x is CommonJS.
**How to avoid:** Use `import TurndownService from 'turndown'` — Node v12+ allows importing CJS defaults in ESM. Do NOT use `require('turndown')` (ESM cannot call require). Do NOT use `import { TurndownService } from 'turndown'` (named export does not exist in CJS).
**Warning signs:** Import works but `new TurndownService()` is undefined.

### Pitfall 3: adm-zip CJS Import in ESM Module

**What goes wrong:** Same as Pitfall 2 — `adm-zip` is also CJS.
**How to avoid:** `import AdmZip from 'adm-zip'` — identical pattern to turndown.
**Warning signs:** `new AdmZip(path)` throws `AdmZip is not a constructor`.

### Pitfall 4: CSS Injection Mutating All `:root` Occurrences

**What goes wrong:** The regex `/:root\s*\{/g` replaces vars in inline `<style>` inside `<template>` tags or HTML comments, corrupting the document.
**Why it happens:** Naive string replacement doesn't understand HTML structure.
**How to avoid:** Use `fromHtml` + `walkTree` — only modify text nodes that are direct children of actual `<style>` elements.
**Warning signs:** Output HTML has duplicated or corrupted `:root` blocks.

### Pitfall 5: `--name` Slug Used Directly in Shell Args

**What goes wrong:** If `--name` value contains spaces or special chars and is passed directly to `gh api`, the command breaks.
**Why it happens:** The validation `^[a-z0-9-]+$` prevents this — but only if it runs before the value is used.
**How to avoid:** Validate `--name` immediately after parsing (same location as slug validation at script top). `fail()` before any file operations if it doesn't match.
**Warning signs:** Odd gh api errors when non-alphanumeric names are passed.

### Pitfall 6: Zip with No HTML File

**What goes wrong:** Script silently produces no output or throws an unhandled error.
**Why it happens:** Some Claude Design zip exports may contain only CSS/JS/image files with no entry HTML.
**How to avoid:** After extracting, check `htmlFiles.length === 0` and call `fail()` with a clear message pointing the operator to the zip contents.
**Warning signs:** `extracted/` directory exists but is empty of HTML files.

### Pitfall 7: `brand.doc_tokens` not under `brand` key

**What goes wrong:** Script reads `wiring.json.doc_tokens` instead of `wiring.json.brand.doc_tokens`, finds nothing, warns incorrectly.
**Why it happens:** Inconsistent path used in the read.
**How to avoid:** Access as `wiring?.brand?.doc_tokens` (optional chaining). The existing `brand` block always exists in active site wiring.json files (confirmed: all four active sites have a `brand` key).
**Warning signs:** Warning fires even after operator adds the field correctly.

---

## Code Examples

### Complete Mode Dispatch Integration Point

```javascript
// Source: ingest-artifact.mjs line 241 — current guard
// BEFORE:
if (modeArg !== 'full' && modeArg !== 'section') {
  fail(USAGE);
}

// AFTER (add 'docs' to the allowed modes):
if (modeArg !== 'full' && modeArg !== 'section' && modeArg !== 'docs') {
  fail(USAGE);
}

// After section-mode guard, add docs-mode dispatch:
if (modeArg === 'docs') {
  const nameArg       = option('--name');
  const formatArg     = option('--format');   // 'md' or null
  const targetRepoArg = option('--target-repo');
  const forceFlag     = flag('--force');
  // ... runDocsMode(...)
  process.exit(0);
}
```

### wm-gen-docs Skill Structure (follows wm-ingest.md conventions)

The skill has 7 steps matching the validate → stage → analyze → confirm → run → commit → report pattern:

```
### 1. Validate inputs
  - slug exists in sites/
  - wiring.json readable + prod_repo set (or --target-repo provided)
  - brand.doc_tokens populated (or warn operator to add it)

### 2. Stage the artifact
  - Operator pastes HTML (or provides zip path)
  - Write to _captures/<slug>/raw/artifact.html (or place zip)

### 3. Run dry-run preview
  node _scripts/ingest-artifact.mjs <slug> --mode docs --dry-run

### 4. Show confirm summary (D-06)
  - Print tokens before/after, file sizes, target repo
  - Ask: "Proceed with commit? (y/N)" — MANDATORY, no bypass

### 5. Run docs generation
  node _scripts/ingest-artifact.mjs <slug> --mode docs [--name <n>] [--format md] [--target-repo org/repo]

### 6. Commit (handled by script or skill)
  - Script calls gh api PUT after generation
  - Or skill calls script with --commit flag

### 7. Report done
  - Print: "Committed to github.com/<repo>/blob/main/docs/<name>.html"
```

### New CLI Flags Added to ingest-artifact.mjs

```
--mode docs         Docs mode: self-contained HTML output, no Astro build
--name <slug>       Output filename (^[a-z0-9-]+$); default: index
--format md         Also export GFM Markdown to docs/<name>.md
--target-repo o/r   Override wiring.json prod_repo (must match ^[a-z0-9-]+/[a-z0-9-]+$)
--force             Skip confirm gate (script only; never used in skill)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual CSS editing after artifact export | `brand.doc_tokens` injection in `:root {}` | Phase 6 (new) | Zero manual CSS edits required |
| Ingest → full Astro build required | `--mode docs` produces standalone HTML directly | Phase 6 (new) | No Astro dependency for doc generation |
| Copy-paste artifact → manual GitHub upload | `/wm-gen-docs` → `gh api` PUT in one flow | Phase 6 (new) | One command from artifact to committed file |

**Deprecated/outdated:**
- Nothing deprecated; this is purely additive to `ingest-artifact.mjs`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `import TurndownService from 'turndown'` works in Node ESM (CJS default import) | Code Examples | Script would throw on load; use `createRequire` fallback |
| A2 | `import AdmZip from 'adm-zip'` works in Node ESM | Code Examples | Script would throw on load; use `createRequire` fallback |
| A3 | `adm-zip` v0.6.0 is the correct package for zip extraction | Standard Stack | Package exists but different API than expected |
| A4 | `turndown` v7.2.4 is the correct package for HTML→GFM | Standard Stack | Package exists but API changed |
| A5 | All four active sites already have a `brand` key in their wiring.json | Common Pitfalls | Needs null check at `wiring.brand` level too |

---

## Open Questions (RESOLVED)

1. **Should `--force` be added to the script in this phase, or deferred?** — RESOLVED: Add to script this phase, omit from skill per D-07. Low cost, removes a follow-up.
   - What we know: D-07 says it's Claude's discretion for the script; the skill NEVER bypasses confirm.
   - What's unclear: Whether CI/scripting use cases exist now or only later.
   - Recommendation: Add `--force` to the script in Phase 6 but leave it undocumented in the skill. Low cost, removes a follow-up.

2. **Should the skill call `gh api` directly via Bash, or invoke the script with a `--commit` flag?** — RESOLVED: Script handles `gh api` commit when `--commit` flag is passed; skill runs script with `--dry-run` first, then `--commit` after operator confirms.
   - What we know: The script already calls `run()` via execSync; the skill calls scripts via Bash.
   - What's unclear: Whether to keep all `gh api` logic inside the script (self-contained) or split commit out to the skill.
   - Recommendation: Put `gh api` commit inside the script (called when `--commit` flag is passed). The skill runs the script twice: first `--dry-run` for summary, then with `--commit` after confirmation. This keeps auth/error handling in one place.

3. **Does the `docs/` staging area in `_captures/<slug>/docs/` need to be created by the script or pre-exist?** — RESOLVED: Created inline via `mkdirSync(docsDir, { recursive: true })` in `runDocsMode` step (e).
   - Recommendation: Create with `mkdirSync(docsDir, { recursive: true })` inline — same pattern used for `components/` and `public/images/<slug>/`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `gh` CLI | DOCS-04 `gh api` PUT commit | ✓ | 2.98.0 | — (no fallback; required) |
| `gh` authenticated | DOCS-04 | ✓ | pbau3r-sfdy (keyring) | — |
| Node.js | All script work | ✓ | v26.7.0 | — |
| `adm-zip` npm pkg | DOCS-01 zip extraction | pending install | 0.6.0 available | system `unzip` CLI (macOS only, fragile) |
| `turndown` npm pkg | DOCS-06 GFM export | pending install | 7.2.4 available | strip-tags (loses structure) |
| `hast-util-from-html` | all HTML processing | ✓ (already installed) | — | — |
| `hast-util-to-html` | serialization | ✓ (already installed) | — | — |

**Missing dependencies with no fallback:**
- `adm-zip` — must be installed before implementing DOCS-01 zip path
- `turndown` — must be installed before implementing DOCS-06

**Missing dependencies with fallback:**
- None that would block the primary HTML-only path (DOCS-01 through DOCS-05 work with `artifact.html` without `adm-zip`; DOCS-06 is P3 priority)

---

## Security Domain

> `security_enforcement` is not set to `false` in config.json — section required.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | GitHub auth handled by gh CLI keyring |
| V3 Session Management | no | Stateless script; no sessions |
| V4 Access Control | yes | `--target-repo` must be in `pbau3r-sfdy/*` org — validate before commit |
| V5 Input Validation | yes | `--name ^[a-z0-9-]+$`, `--target-repo ^[a-z0-9-]+/[a-z0-9-]+$`, slug validated at script entry |
| V6 Cryptography | no | No crypto operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| `--target-repo` points to org outside `pbau3r-sfdy` | Tampering | Validate `--target-repo` matches `^pbau3r-sfdy/[a-z0-9-]+$`; fail if not in org (or allow operator to override with explicit confirm) |
| `--name` used in file path without sanitisation | Tampering | `^[a-z0-9-]+$` validation before any file write (D-10) — enforced early |
| Shell injection via base64 in gh api call | Tampering | Use `--input -` stdin JSON body — avoids all shell arg interpolation |
| Zip slip (zip entry with `../` path) | Elevation of Privilege | `adm-zip` normalises paths during extraction; verify `extracted/` path is under `raw/extracted/` |

---

## Sources

### Primary (HIGH confidence)
- `_scripts/ingest-artifact.mjs` (full read, lines 1–682) — existing helpers, patterns, CLI arg parsing
- `.claude/skills/wm-ingest.md` — skill step pattern, confirm gate conventions
- `.claude/skills/wm-publish.md` — `gh api` usage conventions
- `.github/workflows/publish.yml` — `gh api` PUT auth pattern (WM_PUBLISH_PAT), base64 + SHA pattern
- `sites/sfdy-alt-clean/wiring.json` — `brand` block structure; `doc_tokens` is new sub-field under `brand`
- `.planning/phases/06-doc-pipeline/06-CONTEXT.md` — all locked decisions (D-01 through D-10)
- `.planning/REQUIREMENTS.md` — DOCS-01 through DOCS-06

### Secondary (MEDIUM confidence)
- `npm view adm-zip --json` (2026-08-24): v0.6.0, created 2012, MIT, github.com/cthackers/adm-zip
- `npm view turndown --json` (2026-08-24): v7.2.4, created 2017, MIT, github.com/mixmark-io/turndown
- Node.js v26.7.0 built-in zlib: confirmed handles gzip/deflate only, not `.zip` format

### Tertiary (LOW confidence)
- CJS-in-ESM import pattern for `turndown` and `adm-zip`: based on Node.js CJS interop behaviour (Node v12+). Should be verified with a quick import test in the implementation wave.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — packages verified on npm registry; existing packages already present in codebase
- Architecture: HIGH — codebase fully read; patterns directly derived from existing code
- Pitfalls: HIGH — SHA requirement for gh api documented in GitHub REST API docs; CSS injection risks derived from reading existing parser

**Research date:** 2026-08-24
**Valid until:** 2026-09-24 (30 days — stable Node.js scripting domain; gh API is stable)

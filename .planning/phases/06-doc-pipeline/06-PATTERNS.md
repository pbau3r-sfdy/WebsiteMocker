# Phase 6: Doc Pipeline — Pattern Map

**Mapped:** 2026-08-24
**Files analyzed:** 3 new/modified files (plus deferred wiring.json operator task)
**Analogs found:** 3 / 3

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `_scripts/ingest-artifact.mjs` | utility/script | file-I/O + transform + request-response | itself (existing file extended) | exact — same file, new mode block |
| `.claude/skills/wm-gen-docs.md` | skill | request-response (validate → stage → confirm → commit) | `.claude/skills/wm-ingest.md` | exact role + flow match |
| `package.json` (root) | config | N/A | existing `package.json` | role-match |

**Deferred (out of scope for Phase 6 implementation):**
`sites/*/wiring.json` — adding `brand.doc_tokens` is an operator task after Phase 6 ships; not automated.

---

## Pattern Assignments

### `_scripts/ingest-artifact.mjs` — `--mode docs` extension (utility, file-I/O + transform)

**Analog:** `_scripts/ingest-artifact.mjs` (the file being extended; all patterns below are extracted from it)

---

#### Script header convention (lines 1–29)

Every `_scripts/*.mjs` begins with a JSDoc block: what the script does, `Usage:`, `Modes:`, `Artifact location:`, `What it does`. The `--mode docs` extension must add its own entry to the `Modes:` section and a new `What it does (docs mode):` block.

```javascript
#!/usr/bin/env node
/**
 * ingest-artifact.mjs — Parse a Claude Design HTML artifact and extract Astro components.
 *
 * Usage:
 *   node _scripts/ingest-artifact.mjs <slug> [options]
 *
 * Modes:
 *   --analyze              Parse and report only (no file writes). Outputs JSON to stdout.
 *   --mode full            Full-site ingest: extract all sections as Astro components, ...
 *   --mode section         Single section ingest (write component only, do not modify pages).
 *   --mode docs            Docs mode: self-contained branded HTML output, no Astro build.
 *   ...
 */
```

---

#### CLI arg helpers — `flag()`, `option()` (lines 52–74)

All new flags (`--name`, `--format`, `--target-repo`, `--force`) follow this exact pattern. `flag()` removes the flag from `args` and returns boolean; `option()` removes the flag + its value and returns the string.

```javascript
// _scripts/ingest-artifact.mjs lines 52–74
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

const DRY_RUN     = flag('--dry-run');
const analyzeOnly = flag('--analyze');
const modeArg     = option('--mode');
const sectionArg  = option('--section');
const slugArg     = args[0];

const dry = (...a) => DRY_RUN && console.log('  [dry]', ...a);
```

New flags for docs mode are parsed the same way, after existing `flag()`/`option()` calls:
```javascript
// Add in the docs-mode dispatch block (after mode guard):
const nameArg       = option('--name');       // ^[a-z0-9-]+$
const formatArg     = option('--format');     // 'md' or null
const targetRepoArg = option('--target-repo'); // ^[a-z0-9-]+/[a-z0-9-]+$
const forceFlag     = flag('--force');
```

---

#### Slug validation + `existsSync` guard (lines 76–82)

Every mode validates the slug before touching anything. Copy this exact pattern for docs mode.

```javascript
// _scripts/ingest-artifact.mjs lines 76–82
if (!slugArg || !/^[a-z0-9-]+$/.test(slugArg)) {
  fail(USAGE);
}

const slug    = slugArg;
const siteDir = join(ROOT, 'sites', slug);
if (!existsSync(siteDir)) fail(`sites/${slug} not found — run /wm-new-site first`);
```

Apply the same pattern for `--name` and `--target-repo` validation in docs mode:
```javascript
if (nameArg && !/^[a-z0-9-]+$/.test(nameArg)) {
  fail('--name must match ^[a-z0-9-]+$');
}
if (targetRepoArg && !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(targetRepoArg)) {
  fail('--target-repo must match ^[a-z0-9-]+/[a-z0-9-]+$');
}
```

---

#### Log/fail helpers (lines 44–50)

All console output uses these helpers. Never call `console.log` directly in new code — use `log`, `ok`, `warn`, `fail`, `info`, `dry`.

```javascript
// _scripts/ingest-artifact.mjs lines 44–50
const log  = (...a) => console.log(...a);
const info = (...a) => console.log(' ', ...a);
const ok   = (...a) => console.log(' ✓', ...a);
const warn = (...a) => console.log(' ⚠', ...a);
const fail = (...a) => { console.error(' ✖', ...a); process.exit(1); };
// dry() is defined after DRY_RUN is parsed
const dry  = (...a) => DRY_RUN && console.log('  [dry]', ...a);
```

---

#### `readJSON()` and `run()` helpers (lines 85–95)

`readJSON()` is the only safe way to read `wiring.json` — silent fallback on missing/malformed. `run()` respects `DRY_RUN` and uses the repo's local `node_modules/.bin`.

```javascript
// _scripts/ingest-artifact.mjs lines 85–95
function run(cmd, cwd = ROOT) {
  if (DRY_RUN) { dry(`${cmd}  [${cwd.replace(ROOT, '.')}]`); return; }
  execSync(cmd, {
    stdio: 'inherit', cwd,
    env: { ...process.env, PATH: `${join(ROOT, 'node_modules', '.bin')}:${process.env.PATH}` },
  });
}

function readJSON(p) {
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; }
}
```

Read `wiring.json` in docs mode:
```javascript
const wiring    = readJSON(join(ROOT, 'sites', slug, 'wiring.json')) ?? {};
const docTokens = wiring?.brand?.doc_tokens;   // optional chaining — brand key may be absent
```

---

#### `extractCSSVars()` — reusable helper (lines 97–105)

Returns `Map<'--name', 'value'>` from any CSS string. Use to parse both the artifact's `:root {}` block AND `Layout.astro`'s `:root {}` block (for the D-02 suggestion output).

```javascript
// _scripts/ingest-artifact.mjs lines 97–105
function extractCSSVars(cssText) {
  const vars = new Map();
  for (const [, name, value] of cssText.matchAll(/--([a-zA-Z0-9-]+)\s*:\s*([^;}\n]+)/g)) {
    vars.set(`--${name}`, value.trim());
  }
  return vars;
}
```

---

#### `extractStyleCSS()` — reusable helper (lines 147–159)

Concatenates text content of all `<style>` elements in the HAST tree. Use this to extract CSS text from the artifact HTML before applying `doc_tokens` overrides.

```javascript
// _scripts/ingest-artifact.mjs lines 147–159
function extractStyleCSS(htmlString) {
  const tree  = fromHtml(htmlString);
  const parts = [];
  walkTree(tree, node => {
    if (node.type === 'element' && node.tagName === 'style') {
      for (const child of (node.children || [])) {
        if (child.type === 'text') parts.push(child.value);
      }
    }
  });
  return parts.join('\n');
}
```

---

#### `walkTree()` — reusable helper (lines 113–122)

Required for the CSS token injection HAST walk. Already in the file — do not redefine.

```javascript
// _scripts/ingest-artifact.mjs lines 113–122
function walkTree(node, callback) {
  callback(node);
  if (node.children) {
    for (const child of node.children) {
      walkTree(child, callback);
    }
  }
}
```

---

#### Mode guard — exact insertion point (lines 240–243)

This is the line to modify for `--mode docs`. The new guard adds `'docs'` alongside `'full'` and `'section'`.

```javascript
// _scripts/ingest-artifact.mjs lines 240–243 — CURRENT
if (modeArg !== 'full' && modeArg !== 'section') {
  fail(USAGE);
}

// AFTER MODIFICATION — add 'docs':
if (modeArg !== 'full' && modeArg !== 'section' && modeArg !== 'docs') {
  fail(USAGE);
}
```

---

#### Section mode routing — pattern for docs mode dispatch (lines 498–505)

The docs mode dispatch block goes immediately after the mode guard, before the full-site artifact read at line 457. Follow the same `if (modeArg === '...') { ...; process.exit(0); }` pattern.

```javascript
// _scripts/ingest-artifact.mjs lines 498–505 — section mode routing (copy this structure)
if (modeArg === 'section') {
  const sections = extractSections(htmlString);
  writeSectionMode(slug, sectionArg, sections, cssText, siteDir, date);
  process.exit(0);
}
```

Docs mode dispatch goes BEFORE the artifact path read at line 457:
```javascript
// New block — insert before line 457
if (modeArg === 'docs') {
  const nameArg       = option('--name');
  const formatArg     = option('--format');
  const targetRepoArg = option('--target-repo');
  const forceFlag     = flag('--force');
  runDocsMode(slug, siteDir, { nameArg, formatArg, targetRepoArg, forceFlag });
  process.exit(0);
}
```

---

#### `mkdirSync` pattern for output directories (lines 487–496)

New `_captures/<slug>/docs/` directory is created inline — not pre-existing. Copy this pattern.

```javascript
// _scripts/ingest-artifact.mjs lines 487–496
if (!DRY_RUN) {
  mkdirSync(componentsDir,   { recursive: true });
  mkdirSync(publicImagesDir, { recursive: true });
} else {
  dry(`would create dirs: src/components/, public/images/${slug}/`);
}
```

---

#### Done banner pattern (lines 671–682)

Every mode ends with a completion banner and next-steps guide. Docs mode should follow this exact `═` border + next steps format.

```javascript
// _scripts/ingest-artifact.mjs lines 671–682
log(`
${'═'.repeat(52)}
 ✅  sites/${slug} ingest complete.
${'═'.repeat(52)}

Components written to: sites/${slug}/src/components/
Next steps:
  cd sites/${slug} && npm run dev     ← preview locally
  /wm-wire                            ← update brand tokens
  /wm-publish ${slug}                  ← push to production
`);
```

Docs mode done banner should output:
```
══════════════════════════════════════════════════════
 ✅  docs/<name>.html generated for <slug>
══════════════════════════════════════════════════════

Staged at: _captures/<slug>/docs/<name>.html
Committed: github.com/pbau3r-sfdy/<repo>/blob/main/docs/<name>.html
```

---

#### Layout.astro `:root` extraction — D-02 warning pattern (lines 617–649)

The existing code at lines 617–649 already reads `Layout.astro` and calls `extractCSSVars()` to report brand token candidates. Reuse this exact file-path construction for the D-02 "missing doc_tokens" warning that prints Layout.astro vars as copy-paste suggestions.

```javascript
// _scripts/ingest-artifact.mjs lines 617–649 (condensed)
const layoutPath    = join(siteDir, 'src', 'layouts', 'Layout.astro');
const layoutContent = existsSync(layoutPath) ? readFileSync(layoutPath, 'utf-8') : '';
const existingVars  = extractCSSVars(layoutContent);

// For D-02 warning: print these vars as copy-paste suggestion for brand.doc_tokens
for (const [name, val] of existingVars.entries()) {
  log(`  "${name}": "${val}",`);
}
```

---

#### Section divider comment style

All major blocks use this exact format (non-negotiable for consistency):
```javascript
// ── Section Name ──────────────────────────────────────────────────────────────
```

New docs-mode helpers and section blocks must use this style.

---

### `.claude/skills/wm-gen-docs.md` (skill, request-response)

**Analog:** `.claude/skills/wm-ingest.md` (exact role + flow match)

---

#### Skill file header (wm-ingest.md lines 1–7)

Skill files begin with `# /wm-<name>` followed by a one-paragraph summary of what the skill does and any prerequisites.

```markdown
# /wm-ingest

Ingest a Claude Design HTML/CSS artifact into an existing site and produce functioning, routed Astro components without manual file surgery.
The target site must already exist in `sites/<slug>/` — run `/wm-new-site <slug>` first if starting from scratch.

---

## Steps
```

`wm-gen-docs.md` follows the same structure:
```markdown
# /wm-gen-docs

Generate a self-contained branded HTML document from a Claude Design artifact and commit it to the target production repo's `docs/` folder — no Astro build required.
The target site must exist in `sites/<slug>/` with `brand.doc_tokens` populated in `wiring.json`.

---

## Steps
```

---

#### Step structure — numbered, named, with bash blocks (wm-ingest.md lines 9–103)

Every step has: `### N. Step name`, a prose description, and a fenced bash block for commands. Step names are imperative verbs. Bash blocks always show the exact command to run.

```markdown
### 1. Collect inputs

Ask for:
- **Target slug** — must exist in `sites/`; validate with `ls sites/<slug>/wiring.json`
- **Artifact** — operator pastes HTML content directly in the chat, or provides a local file path
- **Mode** — `full` (all sections → full site rebuild) or `section` (one named section → new component only)

### 2. Stage the artifact

Write the pasted HTML (or copy from the provided path) to `_captures/<slug>/raw/artifact.html`. Create `_captures/<slug>/raw/` if it does not exist.

```bash
mkdir -p _captures/<slug>/raw/
# then write the artifact HTML to _captures/<slug>/raw/artifact.html
```
```

---

#### Mandatory confirm gate (wm-ingest.md lines 40–53)

The confirm gate MUST appear as its own step with the exact `(y/N)` format. The block includes: what is shown, the question, and the rule "Do NOT proceed to Step N until the operator explicitly types `y`." This structure is non-negotiable per D-07.

```markdown
### 4. Confirm CSS collision report

Present the full collision report to the operator. Even if there are zero conflicts, always ask:

> "Collision scan complete — N conflicts found. Proceed with ingest? (y/N)"

**If conflicts exist:** list each conflict by name with the existing value vs the artifact value, for example:

```
  --accent: #6366f1  (currently: #00FB92 — CONFLICT, keep existing?)
  --bg:     #ffffff  (currently: #000000 — CONFLICT, keep existing?)
```

Do NOT proceed to Step 5 until the operator explicitly types `y`.
This step is mandatory for every ingest, zero-conflict or not.
```

For `wm-gen-docs.md`, the confirm gate step (Step 4) must mirror this pattern with D-06 summary format:
```markdown
### 4. Show confirm summary and gate

Print the doc generation summary. The operator must type `y` to proceed — this step cannot be skipped in the skill.

```
── Doc Generation Summary ─────────────────────────────────
  Brand tokens injected (N):
    --accent:       <before>  →  <after>
    --bg:           <before>  →  <after>
  Output:           docs/<name>.html:  <N> KB
  Target repo:      pbau3r-sfdy/<repo> → docs/<name>.html
  [GFM export:      docs/<name>.md:  <N> KB]   ← only shown with --format md
────────────────────────────────────────────────────────────

Proceed with commit? (y/N)
```

Do NOT proceed to Step 5 until the operator types `y`. This confirm step is MANDATORY and cannot be bypassed in this skill.
```

---

#### Notes section (wm-ingest.md lines 107–113)

Skills end with a `## Notes` section listing key constraints and gotchas as bullet points. These are constraints that affect how the operator must use the skill.

```markdown
## Notes
- **`_core/` is never touched** — ingest only writes to `sites/<slug>/src/components/` ...
- **Section mode is write-only** — it writes a new component but never modifies existing pages ...
- **Nav.astro and Footer.astro overwrite protection** — ...
- **Google Fonts `<link>` tags are auto-injected** — ...
```

`wm-gen-docs.md` Notes section should cover: brand.doc_tokens must be set before running, docs/ is created on first run, `--force` is only in the script (never the skill), `--target-repo` must be in `pbau3r-sfdy/*`, additive-only (does not delete existing docs/ files).

---

#### gh api pattern from wm-publish.md (lines 14–27)

The `wm-publish` skill triggers `gh workflow run` and streams output with `gh run watch`. For `wm-gen-docs`, the skill invokes the script directly (not a workflow), but the same `gh` CLI invocation pattern applies for auth awareness.

```markdown
3. **Trigger the publish workflow**:
   ```bash
   gh workflow run publish.yml --field slug=<slug>
   ```
   If this command fails (e.g. `gh` not authenticated, workflow not found), surface the exact error and stop.
```

For docs skill, the equivalent is the script invocation:
```bash
node _scripts/ingest-artifact.mjs <slug> --mode docs [--name <n>] [--format md] [--target-repo org/repo] --commit
```

---

### `package.json` (root) — dependency additions (config)

**Analog:** existing `package.json` root (no read needed — additions are additive)

The two new packages follow the same `devDependencies` / `dependencies` pattern already in `package.json`. Both are MIT-licensed, cross-platform, no postinstall scripts (confirmed in RESEARCH.md).

**Packages to add:**
```json
{
  "dependencies": {
    "adm-zip": "^0.6.0",
    "turndown": "^7.2.4"
  }
}
```

**Critical import pattern** (both are CJS packages, imported in ESM `.mjs` file):
```javascript
// Use default import — NOT named import, NOT require()
import AdmZip         from 'adm-zip';
import TurndownService from 'turndown';
```

If the default import pattern causes issues (A1/A2 assumptions in RESEARCH.md), use `createRequire` fallback:
```javascript
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const AdmZip  = require('adm-zip');
const TurndownService = require('turndown');
```

---

## Shared Patterns

### Artifact path construction
**Source:** `_scripts/ingest-artifact.mjs` lines 207–210, 457–459
**Apply to:** All artifact-reading code in `--mode docs`

```javascript
const artifactPath = join(ROOT, '_captures', slug, 'raw', 'artifact.html');
if (!existsSync(artifactPath)) {
  fail(`No artifact found at _captures/${slug}/raw/artifact.html — paste HTML and re-run /wm-ingest`);
}
```

Docs mode equivalent:
```javascript
const rawDir      = join(ROOT, '_captures', slug, 'raw');
const artifactPath = join(rawDir, 'artifact.html');
const extractedDir = join(rawDir, 'extracted');
// If no artifact.html, look for *.zip in rawDir before failing
```

---

### Wiring.json read + brand block access
**Source:** `_scripts/ingest-artifact.mjs` lines 583–584; `sites/sfdy-alt-clean/wiring.json` lines 34–39
**Apply to:** All docs-mode wiring.json access

The `brand` block in `wiring.json` currently looks like:
```json
{
  "brand": {
    "hashtags": [],
    "vocabulary": [],
    "avoid": [],
    "voice": ""
  }
}
```

`brand.doc_tokens` is a new optional sub-field. Always use optional chaining:
```javascript
const wiring    = readJSON(join(ROOT, 'sites', slug, 'wiring.json')) ?? {};
const docTokens = wiring?.brand?.doc_tokens;   // null if absent — triggers D-02 warning
const prodRepo  = targetRepoArg || wiring?.prod_repo;
if (!prodRepo) fail(`prod_repo not set in sites/${slug}/wiring.json — pass --target-repo org/repo`);
```

---

### DRY_RUN guard before all file writes
**Source:** `_scripts/ingest-artifact.mjs` lines 320–325, 438–444, 491–496
**Apply to:** All `writeFileSync` calls in docs mode

```javascript
// Pattern: every write is guarded by DRY_RUN check + dry() log
if (!DRY_RUN) {
  mkdirSync(docsOutputDir, { recursive: true });
  writeFileSync(outputPath, htmlOut, 'utf-8');
  ok(`wrote docs/${name}.html`);
} else {
  dry(`would write _captures/${slug}/docs/${name}.html`);
}
```

---

### `gh api` PUT with SHA fetch
**Source:** `.github/workflows/publish.yml` lines 91–99 (JamesIves action); pattern described in RESEARCH.md Pattern 3
**Apply to:** The `ghApiPutFile()` function in docs mode

The publish workflow uses `JamesIves/github-pages-deploy-action` to push entire dist folders. Docs mode uses a direct `gh api` PUT for a single file. The auth source is the same — `gh` CLI's keyring session (local) or `WM_PUBLISH_PAT` (CI).

Critical sequence (from RESEARCH.md Pattern 3 and CONTEXT.md `## Known Pitfalls`):
1. `gh api GET repos/{owner}/{repo}/contents/docs/{name}.html --jq .sha` — fetch existing SHA (wrap in try/catch; throws if file doesn't exist)
2. Build JSON body with `content` as base64 and `sha` only if non-null
3. `gh api ... --method PUT --input -` — pass body via stdin to avoid shell arg limits

```javascript
// RESEARCH.md Pattern 3 — gh api PUT via execSync + stdin
function ghApiPutFile(repoFullName, repoPath, fileBytes, commitMessage) {
  const [owner, repo] = repoFullName.split('/');
  const apiPath = `repos/${owner}/${repo}/contents/${repoPath}`;

  let sha = null;
  try {
    const result = execSync(`gh api ${apiPath} --jq .sha`, { encoding: 'utf-8' }).trim();
    if (result && result !== 'null') sha = result;
  } catch { /* new file — no SHA needed */ }

  const body = JSON.stringify({
    message: commitMessage,
    content: fileBytes.toString('base64'),
    ...(sha ? { sha } : {}),
  });

  execSync(`gh api ${apiPath} --method PUT --input -`, {
    input: body,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
}
```

---

### `--target-repo` org validation
**Source:** RESEARCH.md Security Domain; CONTEXT.md D-05 pitfall note
**Apply to:** `--target-repo` flag parsing in docs mode

```javascript
// Validate --target-repo is within pbau3r-sfdy org (or allow override with confirm)
if (targetRepoArg && !targetRepoArg.startsWith('pbau3r-sfdy/')) {
  warn(`--target-repo "${targetRepoArg}" is outside the pbau3r-sfdy org — are you sure?`);
  // Either fail() here or allow with operator confirm (Claude's discretion)
}
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `adm-zip` zip extraction logic | utility (new helper function) | file-I/O | No zip extraction exists anywhere in codebase — new capability |
| `turndown` GFM conversion logic | utility (new helper function) | transform | No HTML→Markdown conversion exists anywhere in codebase — new capability |
| `injectDocTokens()` function | utility (new helper function) | transform | CSS token injection is new; `extractCSSVars` + `walkTree` are reusable but injection loop is net-new |

For these three, the planner should use RESEARCH.md Patterns 2, 4, and 5 as the reference implementation.

---

## Metadata

**Analog search scope:** `_scripts/`, `.claude/skills/`, `.github/workflows/`, `sites/sfdy-alt-clean/`
**Files read:** 6 (`ingest-artifact.mjs`, `wm-ingest.md`, `wm-publish.md`, `publish.yml`, `sfdy-alt-clean/wiring.json`, `CONTEXT.md`, `RESEARCH.md`)
**Pattern extraction date:** 2026-08-24

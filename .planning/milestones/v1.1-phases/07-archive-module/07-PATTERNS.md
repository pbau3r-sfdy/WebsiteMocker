# Phase 7: Archive Module - Pattern Map

**Mapped:** 2026-08-24
**Files analyzed:** 2
**Analogs found:** 2 / 2

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `_scripts/archive-browse.mjs` | utility (CLI) | request-response + transform | `_scripts/ingest-artifact.mjs` | exact |
| `.claude/skills/wm-archive-browse.md` | skill (guided wrapper) | request-response | `.claude/skills/wm-gen-docs.md` + `.claude/skills/wm-ingest.md` | exact |

---

## Pattern Assignments

### `_scripts/archive-browse.mjs` (utility CLI, request-response + transform)

**Primary analog:** `_scripts/ingest-artifact.mjs`
**Secondary analog:** `_scripts/capture-site.mjs` (subprocess being called — defines the positional arg interface)

---

#### Imports + ROOT resolution pattern (`ingest-artifact.mjs` lines 40–53)

```js
import { execSync }                          from 'child_process';
import {
  existsSync, readdirSync, readFileSync,
} from 'fs';
import { join }                              from 'path';
import { fileURLToPath }                     from 'url';

// ── Resolve repo root ─────────────────────────────────────────────────────────
const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
```

`capture-site.mjs` uses an equivalent pattern at lines 40–41:
```js
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
```

Use `ingest-artifact.mjs` form (one-liner `join(fileURLToPath(...), '..', '..')`) — it is the more recent pattern.

---

#### Script header (JSDoc block) (`ingest-artifact.mjs` lines 1–38)

```js
#!/usr/bin/env node
/**
 * ingest-artifact.mjs — Parse a Claude Design HTML artifact and extract Astro components.
 *
 * Usage:
 *   node _scripts/ingest-artifact.mjs <slug> [options]
 *
 * Modes:
 *   --analyze              Parse and report only (no file writes). Outputs JSON to stdout.
 *   ...
 */
```

Copy this header structure for `archive-browse.mjs`. Replace description and Usage block. All `_scripts/*.mjs` files require this exact opening.

---

#### Log helpers (`ingest-artifact.mjs` lines 56–60)

```js
const log  = (...a) => console.log(...a);
const info = (...a) => console.log(' ', ...a);
const ok   = (...a) => console.log(' ✓', ...a);
const warn = (...a) => console.log(' ⚠', ...a);
const fail = (...a) => { console.error(' ✖', ...a); process.exit(1); };
```

Copy verbatim. `fail()` must call `process.exit(1)` — not `throw`. `ok` uses ` ✓` prefix (with leading space). `warn` uses ` ⚠`.

---

#### CLI arg parsing — `flag()` + `option()` helpers (`ingest-artifact.mjs` lines 63–82)

```js
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
```

For `archive-browse.mjs`, extract these flags in the same order:

```js
const SWEEP   = flag('--sweep');
const CAPTURE = option('--capture');   // e.g. '20240315123045'
const LIMIT   = parseInt(option('--limit') ?? '100', 10);
const inputArg = args[0];              // slug or bare domain
```

`inputArg` is whatever positional arg remains after all named flags are consumed — same mutation-in-place pattern as `slugArg` above.

---

#### Slug validation pattern (`ingest-artifact.mjs` lines 87–89)

```js
if (!slugArg || !/^[a-z0-9-]+$/.test(slugArg)) {
  fail(USAGE);
}
```

Apply the same regex guard to slug input. Also validate the `--capture <timestamp>` value against `/^\d{14}$/` before interpolating it into any shell command or file path (security note from RESEARCH.md — prevents shell injection via malformed timestamp).

---

#### `execSync` subprocess pattern — the `run()` helper (`ingest-artifact.mjs` lines 96–102)

```js
function run(cmd, cwd = ROOT) {
  if (DRY_RUN) { dry(`${cmd}  [${cwd.replace(ROOT, '.')}]`); return; }
  execSync(cmd, {
    stdio: 'inherit', cwd,
    env: { ...process.env, PATH: `${join(ROOT, 'node_modules', '.bin')}:${process.env.PATH}` },
  });
}
```

The capture handoff in `archive-browse.mjs` is a simpler one-off call (not a reusable helper), but MUST use `stdio: 'inherit'` and `cwd: ROOT`. Minimum form:

```js
execSync(cmd, { stdio: 'inherit', cwd: ROOT });
```

Do NOT use `spawnSync` or `spawn` — `execSync` is the established pattern.

---

#### `readJSON()` helper (`ingest-artifact.mjs` lines 104–106)

```js
function readJSON(p) {
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; }
}
```

Copy verbatim. Returns `null` on any parse or read failure — never throws. All downstream callers use optional chaining (`wiring?.domain`).

---

#### `existsSync` guard before every file read (`ingest-artifact.mjs` lines 93–94, 800)

```js
if (!existsSync(siteDir)) fail(`sites/${slug} not found — run /wm-new-site first`);
// ...
if (!existsSync(artifactPath)) {
  fail(`No artifact found at _captures/${slug}/raw/artifact.html — paste HTML and re-run /wm-ingest`);
}
```

`archive-browse.mjs` must guard `wiring.json` reads with `existsSync` before calling `readJSON`. Error messages must include the file path and an actionable next step.

---

#### Section divider style (`ingest-artifact.mjs` lines 52, 55, 63, 95, 103)

```js
// ── Resolve repo root ─────────────────────────────────────────────────────────
// ── Log helpers ───────────────────────────────────────────────────────────────
// ── CLI args ──────────────────────────────────────────────────────────────────
// ── Utility helpers ───────────────────────────────────────────────────────────
```

Every logical section in the script uses this exact `// ── Section Name ──` divider style (em-dash, space, name, space, trailing dashes to column ~80). Use for: `// ── Resolve repo root`, `// ── Log helpers`, `// ── CLI args`, `// ── readJSON`, `// ── CDX fetch`, `// ── Domain resolution`, `// ── Timeline display`, `// ── Sweep mode`, `// ── Capture handoff`, `// ── Main`.

---

#### Top-level async main + error catch (`capture-site.mjs` line 449; `ingest-artifact.mjs` pattern)

```js
// capture-site.mjs line 449:
main().catch((e) => { console.error(e); process.exit(1); });
```

`archive-browse.mjs` must use an async `main()` function (CDX fetch requires `await`) with the same catch pattern. The RESEARCH.md skeleton uses:

```js
main().catch(e => { console.error(' ✖', e.message); process.exit(1); });
```

Use the `' ✖'` prefix form for consistency with the `fail()` helper.

---

#### `capture-site.mjs` positional arg interface (`capture-site.mjs` lines 44–48)

```js
const [,, SITE_URL, SLUG, pagesArg] = process.argv;

if (!SITE_URL || !SLUG) {
  console.error('Usage: node capture-site.mjs <url> <slug> [/path1,/path2,...]');
  process.exit(1);
}
```

**Critical for `--capture` handoff:** `capture-site.mjs` expects two positional args: `<url>` then `<slug>`. The output directory is `_captures/<slug>/` (line 55: `const OUT_DIR = path.join(ROOT, '_captures', SLUG)`). To satisfy D-09, pass `<slug>-<timestamp>` as the slug arg — this makes `capture-site.mjs` write to `_captures/<slug>-<timestamp>/` without any modification to that script.

Shell command form to use in `archive-browse.mjs`:

```js
const ifUrl       = `https://web.archive.org/web/${CAPTURE}if_/${domain}`;
const captureSlug = `${slug}-${CAPTURE}`;
const cmd         = `node _scripts/capture-site.mjs "${ifUrl}" "${captureSlug}"`;
execSync(cmd, { stdio: 'inherit', cwd: ROOT });
```

---

#### Done banner pattern (`ingest-artifact.mjs` lines 1012–1022; `capture-site.mjs` lines 440–447)

`ingest-artifact.mjs`:
```js
log(`
${'═'.repeat(52)}
 ✅  sites/${slug} ingest complete.
${'═'.repeat(52)}
...
`);
```

`capture-site.mjs`:
```js
console.log('\n─────────────────────────────────────────────────────');
console.log(`✅  Capture complete: _captures/${SLUG}/`);
```

`archive-browse.mjs` does not need a full banner — the timeline output IS the primary output. A simple `ok()` line after a successful capture is sufficient (per RESEARCH.md Pattern 6):

```js
ok(`Design DNA written to _captures/${captureSlug}/`);
```

---

### `.claude/skills/wm-archive-browse.md` (skill, guided wrapper)

**Primary analog:** `.claude/skills/wm-gen-docs.md` (confirm gate pattern)
**Secondary analog:** `.claude/skills/wm-ingest.md` (overall structure, shell-out → display pattern)

---

#### Skill file structure (`wm-ingest.md` lines 1–13; `wm-gen-docs.md` lines 1–8)

`wm-ingest.md` opening:
```markdown
# /wm-ingest

Ingest a Claude Design HTML/CSS artifact into an existing site and produce functioning, routed Astro components without manual file surgery.
The target site must already exist in `sites/<slug>/` — run `/wm-new-site <slug>` first if starting from scratch.

---

## Steps

### 1. Collect inputs
```

`wm-gen-docs.md` opening:
```markdown
# /wm-gen-docs

Generate a self-contained branded HTML document from a Claude Design artifact and commit it to the target production repo's `docs/` folder — no Astro build required. The target site must exist in `sites/<slug>/` with `brand.doc_tokens` populated in `wiring.json`. ...

---

## Steps

### 1. Collect inputs
```

Pattern: `# /wm-skill-name` → one-paragraph description (no heading) → `---` → `## Steps` → `### N. Step name` numbered steps → `---` → `## Notes` bullet list.

---

#### Step numbering and bash code block style (`wm-ingest.md` lines 21–34; `wm-gen-docs.md` lines 46–53)

`wm-ingest.md`:
```markdown
### 3. Analyze

Run the script before any writes to get the full picture:

```bash
node _scripts/ingest-artifact.mjs <slug> --analyze
```

Output is JSON. Read and present to the operator:
```

`wm-gen-docs.md`:
```markdown
### 4. Dry-run preview

Run the script without `--commit` to process the artifact and print the D-06 confirm summary:

```bash
node _scripts/ingest-artifact.mjs <slug> --mode docs [--name <n>] [--format md] [--target-repo org/repo] --dry-run
```

Parse and present the full output to the operator.
```

Pattern: brief instructional sentence → fenced `bash` code block → one or two sentences about what to do with the output. No inline code outside code blocks for commands.

---

#### Mandatory confirm gate (`wm-gen-docs.md` lines 58–76; `wm-ingest.md` lines 42–52)

`wm-gen-docs.md` Step 5:
```markdown
### 5. Confirm summary and gate (D-06 / D-07)

Present the doc generation summary in the following format:

```
── Doc Generation Summary ─────────────────────────────────
  Brand tokens injected (N):
    --accent:       <before>  →  <after>
  Output:           docs/<name>.html:  <N> KB
  Target repo:      <org>/<repo> → docs/<name>.html
────────────────────────────────────────────────────────────

Proceed with commit? (y/N)
```

Do NOT proceed to Step 6 until the operator explicitly types `y`.
This confirm step is MANDATORY — it cannot be bypassed in this skill, even if there are zero token changes.
```

`wm-ingest.md` Step 4:
```markdown
### 4. Confirm CSS collision report

Present the full collision report to the operator. Even if there are zero conflicts, always ask:

> "Collision scan complete — N conflicts found. Proceed with ingest? (y/N)"

Do NOT proceed to Step 5 until the operator explicitly types `y`.
This step is mandatory for every ingest, zero-conflict or not.
```

Pattern for the confirm gate step in `/wm-archive-browse`:
- Show the `if_` URL in a plain code block (operator clicks it)
- Say: "Open this URL in your browser to inspect the historical design."
- Ask: "Capture this snapshot? (y/n)"
- `Do NOT proceed until the operator explicitly types y.`

---

#### Notes section format (`wm-ingest.md` lines 106–113; `wm-gen-docs.md` lines 105–113)

`wm-ingest.md`:
```markdown
## Notes
- **`_core/` is never touched** — ingest only writes to `sites/<slug>/src/components/` ...
- **Section mode is write-only** — it writes a new component but never modifies existing pages; ...
- **Nav.astro and Footer.astro overwrite protection** — if Nav.astro or Footer.astro has already been customised ...
```

`wm-gen-docs.md`:
```markdown
## Notes
- **`brand.doc_tokens` must be set before running** — if absent, the script exits 1 and prints the suggested values ...
- **`docs/` folder is created automatically** — the script creates `_captures/<slug>/docs/` locally ...
- **`--force` is script-only, never used in this skill** — the skill always pauses for the confirm gate ...
```

Pattern: each note starts with `- **\`key concept\`** —` followed by one-sentence explanation. Use inline code for paths and flag names. `## Notes` is the last section, after `---`.

---

#### "If no — done" step pattern (`wm-gen-docs.md` implicit; confirmed by D-13)

Both analog skills end with a completion message after the optional exec step. The cleanest form comes from the arch diagram in RESEARCH.md:

```markdown
### 6. If no — done
Report: "Timeline browsing complete. Run `/wm-archive-browse` again to inspect another snapshot."
```

This matches how `wm-gen-docs.md` Step 7 reports completion — one sentence telling the operator what happened and what to do next.

---

## Shared Patterns

### Error handling — `fail()` + `process.exit(1)`
**Source:** `_scripts/ingest-artifact.mjs` lines 60, 87–89, 93–94
**Apply to:** `_scripts/archive-browse.mjs` — all error paths

```js
const fail = (...a) => { console.error(' ✖', ...a); process.exit(1); };

// Usage pattern:
if (!existsSync(wiringPath)) fail(`sites/${slug}/wiring.json not found`);
if (!domain) fail(`domain not set in sites/${slug}/wiring.json — update wiring.json first`);
if (!found)  fail(`Snapshot ${CAPTURE} not found for ${slug}. Run without --capture to browse available snapshots.`);
```

Never `throw` at the top level — always `fail()`. Error messages must name the affected slug/path and provide a next step.

---

### `existsSync` guard before every `readJSON` call
**Source:** `_scripts/ingest-artifact.mjs` lines 93, 362–365, 798–800
**Apply to:** `_scripts/archive-browse.mjs` — wiring.json reads in both slug mode and sweep mode

```js
const wiringPath = join(ROOT, 'sites', slug, 'wiring.json');
if (!existsSync(wiringPath)) fail(`sites/${slug}/wiring.json not found`);
const wiring = readJSON(wiringPath);
```

In sweep mode, skip (do not fail) sites whose `wiring.json` is missing or unparseable — the `readJSON` null return handles this silently.

---

### Active site filter for sweep mode
**Source:** RESEARCH.md Pattern 8 (derived from `wiring.json` conventions; cross-checked against `wm-list-sites` convention per CLAUDE.md)
**Apply to:** `_scripts/archive-browse.mjs` — `--sweep` mode only

All three conditions must be true to include a site in sweep output:
1. `wiring.archived` is falsy
2. `wiring.template` is falsy
3. `wiring.domain` is non-null and non-empty

---

### Skill confirm gate — mandatory explicit `y`
**Source:** `.claude/skills/wm-gen-docs.md` lines 73–75; `.claude/skills/wm-ingest.md` lines 50–52
**Apply to:** `.claude/skills/wm-archive-browse.md` — Step before running `--capture`

Language must include: "Do NOT proceed until the operator explicitly types `y`."

---

## No Analog Found

All files in this phase have strong analogs. No files require falling back to RESEARCH.md patterns alone.

| File | Note |
|------|------|
| `_scripts/archive-browse.mjs` | CDX API fetch is new, but all surrounding scaffolding copies `ingest-artifact.mjs` exactly. CDX fetch pattern is fully specified in RESEARCH.md Pattern 4. |
| `.claude/skills/wm-archive-browse.md` | Skill structure and confirm gate copied from `wm-gen-docs.md`. The browse → inspect → capture flow is a simplification of ingest's analyze → confirm → exec flow. |

---

## Metadata

**Analog search scope:** `_scripts/`, `.claude/skills/`
**Files read:** `ingest-artifact.mjs` (1,023 lines), `capture-site.mjs` (449 lines), `wm-ingest.md` (113 lines), `wm-gen-docs.md` (113 lines)
**Pattern extraction date:** 2026-08-24

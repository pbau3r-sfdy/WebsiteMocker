---
phase: 05-design-artifact-ingestion
reviewed: 2026-08-21T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - _scripts/ingest-artifact.mjs
  - .claude/skills/wm-ingest.md
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-08-21
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

---

## Summary

Reviewed `_scripts/ingest-artifact.mjs` (the Node.js ingestion script) and `.claude/skills/wm-ingest.md` (the operator-facing skill definition).

The script is well-structured for its scope. CLI parsing is careful, slug is validated against `/^[a-z0-9-]+$/` before use in any path or command (no injection risk), and the analyze/dry-run paths are correctly gated. The Nav/Footer overwrite protection shows thoughtful design.

Two critical defects exist. First, `index.astro` has no overwrite protection despite being the most operator-customized file in a site — full mode silently destroys any work done there. Second, when an artifact contains multiple top-level elements that map to the same PascalCase component name (e.g., two `<section>` nodes with no id/class, or sections whose first CSS class is a utility class like `container`), the loop silently overwrites the component file on each iteration and the generated `index.astro` receives duplicate `import` statements, which is an Astro build error.

The skill file itself is logically sound and correctly describes the script's behavior.

---

## Critical Issues

### CR-01: `index.astro` silently overwritten in full mode — no protection

**File:** `_scripts/ingest-artifact.mjs:574-580`

**Issue:** In full mode, `index.astro` is unconditionally overwritten with `writeFileSync` after every ingest run. There is no check comparing the existing file against the `_core/` template (as is done for `Nav.astro` and `Footer.astro` at lines 542-551). If an operator has customized `index.astro` — adding sections, adjusting layout, modifying frontmatter — a subsequent `--mode full` ingest silently destroys that work. The data loss is irreversible unless the operator has an uncommitted diff or git history.

**Fix:** Apply the same protection used for Nav/Footer. Before overwriting, compare the existing `index.astro` against a reference (or simply check that it exists and differs from an empty/stub state), and skip with a warning if customized:

```js
const indexPath = join(siteDir, 'src', 'pages', 'index.astro');
const coreIndexPath = join(ROOT, '_core', 'src', 'pages', 'index.astro');

if (!DRY_RUN && existsSync(indexPath)) {
  const existingContent = readFileSync(indexPath, 'utf-8');
  const coreContent = existsSync(coreIndexPath) ? readFileSync(coreIndexPath, 'utf-8') : null;
  if (coreContent && existingContent !== coreContent) {
    warn('index.astro has been customized — skipping overwrite. Review artifact sections and merge manually.');
    // still list components, skip the write
  } else {
    writeFileSync(indexPath, indexContent, 'utf-8');
    ok('wrote index.astro');
  }
} else if (!DRY_RUN) {
  writeFileSync(indexPath, indexContent, 'utf-8');
  ok('wrote index.astro');
} else {
  dry('would write index.astro');
}
```

---

### CR-02: Duplicate `componentName` values cause silent component loss and Astro build failure

**File:** `_scripts/ingest-artifact.mjs:506-570`

**Issue:** The loop at lines 506-560 derives `name` from `sectionId || sectionClass || node.tagName` (line 509). When multiple top-level elements share the same resolved name (e.g., two `<section>` elements with no `id` or `class`, both producing `name = 'section'` → `componentName = 'Section'`), two failures occur:

1. Each loop iteration calls `writeFileSync(componentPath, component, 'utf-8')` — the second iteration silently overwrites the file written by the first, discarding the first section entirely.
2. `componentNames.push(componentName)` accumulates duplicates. The generated `index.astro` (lines 567-570) then contains duplicate import statements:
   ```js
   import Section from '../components/Section.astro';
   import Section from '../components/Section.astro';
   ```
   This is a JavaScript duplicate-binding error that crashes the Astro build.

This is also amplified by IN-03 below: a section whose first CSS class is `container`, `wrapper`, or any other utility class generates a non-unique name, and two such sections produce colliding component names.

**Fix:** Deduplicate before writing. Track used names with a counter and suffix collisions:

```js
const usedNames = new Map(); // name → count

// inside the loop, after computing componentName:
const baseName = componentName;
const useCount = usedNames.get(baseName) ?? 0;
usedNames.set(baseName, useCount + 1);
const uniqueComponentName = useCount === 0 ? baseName : `${baseName}${useCount + 1}`;

// use uniqueComponentName for file writes, import block, and componentNames.push()
```

Also add a `warn()` when a collision is detected so the operator knows the artifact has ambiguous section naming:

```js
if (useCount > 0) {
  warn(`Duplicate section name "${baseName}" — writing as ${uniqueComponentName}.astro`);
}
```

---

## Warnings

### WR-01: Dry-run inaccurately simulates Nav/Footer overwrite protection

**File:** `_scripts/ingest-artifact.mjs:542`

**Issue:** The entire overwrite-protection block for `Nav.astro` and `Footer.astro` is gated on `!DRY_RUN`:

```js
if (!DRY_RUN && (componentName === 'Nav' || componentName === 'Footer') && existsSync(componentPath)) {
```

In dry-run mode this block is never evaluated, so the loop always falls through to `dry('would write Nav.astro')` — even when the existing `Nav.astro` has been customized and real mode would skip the write. An operator running `--dry-run` to preview a safe ingest sees "would write Nav.astro" but the actual run would silently skip it. The dry-run simulation is wrong for the most critical overwrite-protection case.

**Fix:** Separate the protection check from the DRY_RUN guard so dry-run can also report the skip:

```js
const isProtected = (componentName === 'Nav' || componentName === 'Footer')
  && existsSync(componentPath);

if (isProtected) {
  const existingContent = readFileSync(componentPath, 'utf-8');
  const coreContent = existsSync(coreTemplatePath) ? readFileSync(coreTemplatePath, 'utf-8') : null;
  if (coreContent && existingContent !== coreContent) {
    warn(`${componentName}.astro has been customized — skipping overwrite.`);
    componentNames.push(componentName);
    continue;
  }
}

if (!DRY_RUN) {
  writeFileSync(componentPath, component, 'utf-8');
  ok(`wrote component: ${componentName}.astro`);
} else {
  dry(`would write ${componentName}.astro`);
}
```

---

### WR-02: Responsive CSS silently dropped — no runtime warning emitted

**File:** `_scripts/ingest-artifact.mjs:263-282`

**Issue:** `extractScopedCSS` uses `cssText.split('}')` to tokenize CSS rules. This approach is documented in a code comment as not handling nested `@media` blocks. In practice, a rule like:

```css
@media (max-width: 768px) {
  .hero { padding: 1rem; }
}
```

splits into a block whose `selector` is `@media (max-width: 768px) {\n  .hero {` — the nested selector is embedded in the selector string. The `selector.includes('.hero')` check never matches `.hero` as a separate class token in that context, so the rule is silently excluded. Every `@media` query for every section component is dropped.

The MVP scope note in the comment is acceptable, but no `warn()` is emitted at runtime. Operators receive components with all responsive behavior stripped and no indication why their mobile layout is broken.

**Fix:** At minimum, emit a warning when dropped `@media` blocks are detected:

```js
// In extractScopedCSS, before the main loop:
if (/@media\s/.test(cssText)) {
  warn('Artifact contains @media blocks — responsive rules are not extracted by this MVP parser. Add them manually to the component <style>.');
}
```

---

### WR-03: `writeJSON` function is dead code

**File:** `_scripts/ingest-artifact.mjs:97-100`

**Issue:** `writeJSON` is defined at lines 97-100 but is never called anywhere in the script. Searching the file for `writeJSON` returns only the definition line.

**Fix:** Remove the function. If it is needed for a planned feature (e.g., writing brand tokens to `wiring.json`), add a TODO comment at the call site and keep the definition — but as written it is unreferenced dead code.

```js
// Remove lines 97-100:
// function writeJSON(p, obj) {
//   if (DRY_RUN) { dry(`write ${p.replace(ROOT, '.')}`); return; }
//   writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
// }
```

---

### WR-04: `publicFontsDir` created unconditionally but never used

**File:** `_scripts/ingest-artifact.mjs:476,481`

**Issue:** `publicFontsDir` is created with `mkdirSync` on every non-dry-run execution, but no code in the script ever writes to it. The comment "stub for future local font support" explains the intent, but the side effect is that every ingest creates a `public/fonts/` directory even for sites that may never use local fonts — cluttering the repository on first commit.

**Fix:** Remove the directory creation until the local fonts feature is implemented, or gate it behind a flag:

```js
// Remove lines 476 and 481:
// const publicFontsDir = join(siteDir, 'public', 'fonts');
// mkdirSync(publicFontsDir, { recursive: true });
```

---

## Info

### IN-01: Step comment numbering gap in `writeSectionMode`

**File:** `_scripts/ingest-artifact.mjs:441`

**Issue:** The step comments in `writeSectionMode` jump from `// 11. Write (or dry-run)` directly to `// 13. Print manual import instruction` — step 12 is absent. This does not affect behavior but makes the code harder to audit.

**Fix:** Renumber to `// 12. Print manual import instruction`.

---

### IN-02: Redundant artifact re-read and re-parse inside `writeSectionMode`

**File:** `_scripts/ingest-artifact.mjs:373-376`

**Issue:** In section mode, `htmlString` is read from the artifact at line 468 and passed through to `extractSections`. Inside `writeSectionMode` (called at line 491), the same file is read from disk again at line 374 and re-parsed with `fromHtml`. This doubles the I/O and parse time for section mode with no functional difference (the file is not modified between the two reads).

**Fix:** Pass `htmlString` and the pre-parsed HAST tree into `writeSectionMode` as parameters to avoid re-reading. At minimum, pass `htmlString`:

```js
function writeSectionMode(slug, sectionName, sections, cssText, siteDir, date, htmlString) {
  // Remove lines 373-374 (re-read from disk)
  const tree = fromHtml(htmlString); // use the already-read string
  ...
}
// Caller:
writeSectionMode(slug, sectionArg, sections, cssText, siteDir, date, htmlString);
```

---

### IN-03: First CSS class used as section name may be a utility class, amplifying CR-02

**File:** `_scripts/ingest-artifact.mjs:139-141`

**Issue:** Section name derivation in `extractSections` (and the inline loop at line 509) uses `className?.[0]` — the first CSS class on the element. In practice, many Claude Design artifacts place layout utility classes first (e.g., `class="container hero-section"`), so `name` becomes `'container'` rather than `'hero-section'`. This produces opaque component names (`Container.astro`) and, when multiple sections share the same first class, directly triggers the CR-02 duplicate collision.

**Fix:** Prefer `id` as the primary identifier, then look for the first class that is not a known utility class (or simply use the last class, which is more often semantic). Alternatively, let the operator override the name via a data attribute:

```js
const UTILITY_CLASSES = new Set(['container', 'wrapper', 'inner', 'content', 'flex', 'grid']);

const name = node.properties?.id
  || node.properties?.className?.find(c => !UTILITY_CLASSES.has(c))
  || node.properties?.className?.[0]
  || node.tagName;
```

---

_Reviewed: 2026-08-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

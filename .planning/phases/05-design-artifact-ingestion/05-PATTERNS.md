# Phase 5: Design Artifact Ingestion — Pattern Map

**Mapped:** 2026-08-21
**Files analyzed:** 5 new/modified files
**Analogs found:** 4 / 5

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `_scripts/ingest-artifact.mjs` | utility/script | file-I/O + transform | `_scripts/import-site.mjs` | exact |
| `.claude/skills/wm-ingest.md` | skill/config | request-response (interactive) | `.claude/skills/wm-instantiate.md` | exact |
| `sites/<slug>/src/components/<Name>.astro` | component | transform | `sites/sfdy-alt-clean/src/components/Nav.astro` | exact |
| `sites/<slug>/src/pages/index.astro` | component/page | render | `sites/sfdy-alt-clean/src/pages/index.astro` | role-match |
| `_captures/<slug>/raw/artifact.html` | config/staging | file-I/O | `_captures/sfdy/` directory convention | partial |

---

## Pattern Assignments

### `_scripts/ingest-artifact.mjs` (utility/script, file-I/O + transform)

**Analog:** `_scripts/import-site.mjs`

**Imports pattern** (lines 31–40):
```js
import { execSync }                          from 'child_process';
import {
  existsSync, mkdirSync, cpSync, copyFileSync,
  readdirSync, readFileSync, writeFileSync,
  rmSync,
} from 'fs';
import { join, basename, dirname }           from 'path';
import { fileURLToPath }                     from 'url';
// Added for ingest (transitive deps, no npm install needed):
import { fromHtml } from 'hast-util-from-html';
import { toHtml }   from 'hast-util-to-html';
```

**ROOT resolution + CLI arg helpers** (lines 43–65):
```js
const ROOT = join(fileURLToPath(import.meta.url), '..', '..');

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

const DRY_RUN  = flag('--dry-run');
const slugArg  = args[0];                  // positional — required
const modeArg  = option('--mode');         // 'full' | 'section'
const analyzeOnly = flag('--analyze');     // output JSON report, no writes
```

**Logging helpers** (lines 73–78):
```js
const log   = (...a) => console.log(...a);
const info  = (...a) => console.log(' ', ...a);
const ok    = (...a) => console.log(' ✓', ...a);
const warn  = (...a) => console.log(' ⚠', ...a);
const fail  = (...a) => { console.error(' ✖', ...a); process.exit(1); };
const dry   = (...a) => DRY_RUN && console.log('  [dry]', ...a);
```

**run() helper — copy exactly** (lines 80–84):
```js
function run(cmd, cwd = ROOT) {
  if (DRY_RUN) { dry(`${cmd}  [${cwd.replace(ROOT, '.')}]`); return; }
  execSync(cmd, { stdio: 'inherit', cwd,
    env: { ...process.env, PATH: `${join(ROOT, 'node_modules', '.bin')}:${process.env.PATH}` } });
}
```

**readJSON / writeJSON helpers — copy exactly** (lines 86–93):
```js
function readJSON(p) {
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; }
}

function writeJSON(p, obj) {
  if (DRY_RUN) { dry(`write ${p.replace(ROOT, '.')}`); return; }
  writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
}
```

**Slug validation — from publish.yml convention:**
```js
if (!slugArg || !/^[a-z0-9-]+$/.test(slugArg)) {
  fail('Usage: node _scripts/ingest-artifact.mjs <slug> [--analyze] [--mode full|section] [--dry-run]');
}
const slug = slugArg;
const siteDir = join(ROOT, 'sites', slug);
if (!existsSync(siteDir)) fail(`sites/${slug} not found — run /wm-new-site first`);
```

**Asset copy loop — adapt from** (lines 285–312):
```js
// Copies an image file from artifact temp dir to public/images/<slug>/, returns new path
function copyAsset(srcPath, slug, destRelName) {
  const destDir = join(ROOT, 'sites', slug, 'public', 'images', slug);
  if (!DRY_RUN) mkdirSync(destDir, { recursive: true });
  const destPath = join(destDir, destRelName);
  if (!DRY_RUN && !existsSync(destPath)) {
    cpSync(srcPath, destPath);
    ok(`asset: ${destRelName}`);
  }
  return `images/${slug}/${destRelName}`;
}
```

**Build verification — copy from** (lines 328–331):
```js
log(`\n── Build verification`);
run(`node _scripts/build-all.js ${slug}`, ROOT);
ok('Build passed');
```

**Done summary — adapt from** (lines 339–351):
```js
log(`
${'═'.repeat(52)}
 ✅  sites/${slug} ingest complete.
${'═'.repeat(52)}

Components written to: sites/${slug}/src/components/
Next steps:
  cd sites/${slug} && npm run dev     ← preview locally
  /wm-wire                            ← update brand tokens
  /wm-publish <slug>                  ← push to production
`);
```

**Core ingest pattern — HTML parse + section extraction** (from RESEARCH.md Code Examples):
```js
// Step: parse artifact HTML
const html = readFileSync(join(ROOT, '_captures', slug, 'raw', 'artifact.html'), 'utf-8');
const tree  = fromHtml(html);
const body  = tree.children.find(n => n.tagName === 'html')
                   ?.children.find(n => n.tagName === 'body');

const sections = body?.children.filter(
  n => n.type === 'element' &&
       ['section', 'nav', 'footer', 'header', 'main'].includes(n.tagName)
) ?? [];

for (const section of sections) {
  const name = section.properties?.id
    || section.properties?.className?.[0]
    || 'Section';
  const sectionHtml = toHtml(section);
  // → write sites/<slug>/src/components/<PascalCase(name)>.astro
}
```

**CSS var extraction + collision detection** (from RESEARCH.md Pattern 3):
```js
function extractCSSVars(cssText) {
  const vars = new Map();
  for (const [, name, value] of cssText.matchAll(/--([a-zA-Z0-9-]+)\s*:\s*([^;}\n]+)/g)) {
    vars.set(`--${name}`, value.trim());
  }
  return vars;
}

const siteVars     = extractCSSVars(readFileSync(join(siteDir, 'src', 'layouts', 'Layout.astro'), 'utf-8'));
const artifactVars = extractCSSVars(artifactCSS);

const collisions = [...artifactVars.entries()]
  .filter(([name, val]) => siteVars.has(name) && siteVars.get(name) !== val)
  .map(([name, val]) => ({ name, existing: siteVars.get(name), artifact: val }));
```

**Astro component writer** (from RESEARCH.md Code Examples):
```js
function toAstroComponent(sectionHtml, scopedCSS, componentName) {
  const hasLocalAssets = sectionHtml.includes('{b}/');
  const frontmatter = hasLocalAssets
    ? `---\n// ${componentName} — extracted from Claude Design artifact\nconst b = import.meta.env.BASE_URL.replace(/\\/$/, '');\n---`
    : `---\n// ${componentName} — extracted from Claude Design artifact\n---`;

  return `${frontmatter}\n\n${sectionHtml}\n\n<style>\n${scopedCSS}\n</style>\n`;
}
```

**BASE_URL path rewriting** (from RESEARCH.md Pattern 4):
```js
// Before writing component HTML, replace hardcoded local asset paths:
// <img src="/images/hero.jpg">  →  <img src={`${b}/images/<slug>/hero.jpg`}>
// <a href="/contact">           →  <a href={`${b}/contact`}>
sectionHtml = sectionHtml
  .replace(/src="\/images\//g,   `src={\`\${b}/images/${slug}/`)
  .replace(/href="\/(?!\/|http)/g, `href={\`\${b}/`);
// Then close the template literal after the path value
```

---

### `.claude/skills/wm-ingest.md` (skill/config, interactive request-response)

**Analog:** `.claude/skills/wm-instantiate.md`

**File structure pattern** — copy this exact format from `wm-instantiate.md`:
```markdown
# /wm-ingest

<one-line description — operator-facing>
<one-sentence of context (when to use, what must exist first)>

---

## Steps

### 1. <Step name>

<Prose instruction>

```bash
<concrete command if applicable>
```

### 2. <Step name>
...

---

## Notes
- Bullet-form rules, gotchas, and cross-references
```

**Step 1 — Collect inputs, from `wm-instantiate.md` Step 1:**
```markdown
### 1. Collect inputs

Ask for:
- **Target slug** — must exist in `sites/`; validate with `ls sites/<slug>/wiring.json`
- **Artifact** — operator pastes HTML or provides a local file path
- **Mode** — `full` (all sections → full site) or `section` (one section → append-only)
```

**Step 2 — Stage the artifact, from `wm-capture.md` staging convention:**
```markdown
### 2. Stage the artifact

Write the pasted HTML to:
```
_captures/<slug>/raw/artifact.html
```

Create `_captures/<slug>/raw/` if it does not exist.
```

**Step 3 — Analyze (before any writes), from `wm-instantiate.md` Step 2:**
```markdown
### 3. Analyze

```bash
node _scripts/ingest-artifact.mjs <slug> --analyze
```

Output is JSON. Read and present:
- Section manifest (names, tags, ids)
- CSS collision report (conflicts between artifact vars and Layout.astro vars)
- Asset inventory (image count, base64 images, Google Fonts links)
```

**Step 4 — Collision confirmation gate, unique to `wm-ingest.md`:**
```markdown
### 4. Confirm CSS collision report

Present the collision report to the operator. Even if there are zero conflicts, ask:
"Collision scan complete — N conflicts found. Proceed with ingest? (y/N)"

**If conflicts exist:** list each conflict by name with existing vs artifact values.
Operator must explicitly type `y` or choose to skip conflicted vars.

Do NOT proceed to Step 5 until the operator confirms.
```

**Step 5 — Execute ingest, from `wm-instantiate.md` Steps 3–6:**
```markdown
### 5. Run ingest

```bash
node _scripts/ingest-artifact.mjs <slug> --mode full
# or for section mode:
node _scripts/ingest-artifact.mjs <slug> --mode section --section <name>
```
```

**Step 6 — Brand candidates, unique to wm-ingest.md:**
```markdown
### 6. Surface brand candidates

Present extracted CSS custom properties as informational candidates.
Do NOT auto-write them to `wiring.json.brand`. Example:

```
Brand token candidates from artifact:
  --bg: #ffffff        (currently: #0d0f1c — CONFLICT, keep existing)
  --accent: #6366f1    (currently: #00FB92 — CONFLICT, keep existing)
  --font-head: 'Inter' (new — add to Layout.astro :root manually?)
```
```

**Step 7 — Build verify + report, from `wm-instantiate.md` Step 8:**
```markdown
### 7. Verify and report

```bash
cd sites/<slug> && npm run build
```

Report: components created, assets copied, collisions resolved/skipped, what to customise next.
```

**Notes section — from `wm-instantiate.md` and `wm-init-collab.md` notes patterns:**
```markdown
## Notes
- **`_core/` is never touched** — ingest only writes to `sites/<slug>/src/components/` and `sites/<slug>/src/pages/`
- **Section mode is write-only** — it writes new components but never modifies existing pages; operator must add the import manually
- **Nav and Footer overwrite protection** — before overwriting, check if they differ from `_core/` template; if customized, ask operator to confirm (default: N)
- **Google Fonts `<link>` tags** — kept in `Layout.astro <head>` as-is; do NOT convert to `<style>` blocks
- **BASE_URL routing** — all local `src="/..."` and `href="/..."` are rewritten to `{`${b}/...`}` during extraction
- **Build must pass** — if build fails after ingest, list the error and suggest manual fixups
```

---

### `sites/<slug>/src/components/<Name>.astro` (component, transform)

**Analog:** `sites/sfdy-alt-clean/src/components/Nav.astro`

**Frontmatter with BASE_URL** (lines 1–3 of Nav.astro):
```astro
---
const b = import.meta.env.BASE_URL.replace(/\/$/, '');
---
```

**Local asset path pattern** (lines 7–9 of Nav.astro):
```astro
<img src={`${b}/images/logo.png`} alt="Starflight Dynamics" />
<a href={`${b}/contact`} class="link">CONTACT</a>
```

**Scoped style block — no is:global** (lines 12–35 of Nav.astro):
```astro
<style>
  .nav {
    position: sticky;
    top: 0;
    /* ... component-local CSS only — no :root, no body, no html rules */
  }
  .link { color: var(--text-secondary); }
  .link:hover { color: var(--accent); }
</style>
```

**Full generated component output shape** (from RESEARCH.md Pattern 1):
```astro
---
// Hero section — extracted from Claude Design artifact 2026-08-21
// Source: _captures/<slug>/raw/artifact.html
const b = import.meta.env.BASE_URL.replace(/\/$/, '');
---

<section class="hero">
  <div class="hero-content">
    <h1>Your Headline</h1>
    <p>Your supporting text here.</p>
    <a href={`${b}/contact`} class="cta">Get in touch</a>
  </div>
  <img src={`${b}/images/<slug>/hero-bg.jpg`} alt="" class="hero-bg" />
</section>

<style>
  /* Scoped: only applies inside this component */
  /* Rules from artifact that contain ".hero" selector */
  .hero { position: relative; min-height: 80vh; display: flex; align-items: center; }
  .hero-content { position: relative; z-index: 1; max-width: 640px; }
  .hero-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .cta { display: inline-block; padding: .75rem 2rem; background: var(--accent); }
</style>
```

**Component WITHOUT local assets** (omit frontmatter `const b` if no local asset paths):
```astro
---
// About section — extracted from Claude Design artifact 2026-08-21
---

<section class="about">
  <div class="about-content">
    <h2>About Us</h2>
    <p>Description text here.</p>
  </div>
</section>

<style>
  .about { padding: 5rem 2rem; background: var(--bg-card); }
</style>
```

---

### `sites/<slug>/src/pages/index.astro` — full-site mode (component/page, render)

**Analog:** `sites/sfdy-alt-clean/src/pages/index.astro`

**Import block pattern** (lines 1–14 of sfdy-alt-clean/index.astro):
```astro
---
import Layout    from '../layouts/Layout.astro';
import Nav       from '../components/Nav.astro';
import Hero      from '../components/Hero.astro';
import About     from '../components/About.astro';
import Services  from '../components/Services.astro';
import Contact   from '../components/Contact.astro';
import Footer    from '../components/Footer.astro';

const b = import.meta.env.BASE_URL.replace(/\/$/, '');
---
```

**Key rule:** All imports use `'../layouts/'` and `'../components/'` (site-local). Do NOT use `_core/` paths for Nav, Layout, or Footer. The site's local Layout.astro (which inherits from `_core/`) is always the import target.

**Layout wrapper + slot pattern** (lines 17–72 of sfdy-alt-clean/index.astro):
```astro
<Layout title="<Site Name>" description="<Site tagline>">
  <Nav />
  <Hero />
  <About />
  <Services />
  <Contact />
  <Footer />
</Layout>
```

**Page-level `<style>` block** — if ingest writes any page-level CSS (rare), it goes after the closing `</Layout>` tag, scoped like components:
```astro
<style>
  /* Only page-layout concerns that don't belong in a specific component */
</style>
```

---

### `_captures/<slug>/raw/artifact.html` (staging file, file-I/O)

**No direct analog** — new convention. Follows the `_captures/<slug>/` directory pattern.

**Directory structure to create:**
```
_captures/<slug>/
└── raw/
    └── artifact.html    ← operator pastes HTML here; script reads from here
```

**Creation logic** (skill's Step 2 writes this; script reads it):
```js
// In skill: Claude writes the pasted HTML to disk
const rawDir = join(ROOT, '_captures', slug, 'raw');
mkdirSync(rawDir, { recursive: true });
writeFileSync(join(rawDir, 'artifact.html'), pastedHtml, 'utf-8');

// In script: reads the staged file
const artifactPath = join(ROOT, '_captures', slug, 'raw', 'artifact.html');
if (!existsSync(artifactPath)) fail(`No artifact found — paste HTML and re-run /wm-ingest`);
const html = readFileSync(artifactPath, 'utf-8');
```

---

## Shared Patterns

### BASE_URL routing (apply to ALL generated components and pages)

**Source:** `sites/sfdy-alt-clean/src/components/Nav.astro` line 2; `sites/sfdy-alt-clean/src/pages/index.astro` line 10

```astro
const b = import.meta.env.BASE_URL.replace(/\/$/, '');
```

- Add this to frontmatter of any component that uses `{b}/images/...` or `{b}/contact` etc.
- Omit it if the component has zero local asset references (keeps files clean).
- ALL `src="/..."` and `href="/..."` from artifact HTML become `src={`${b}/...`}` and `href={`${b}/...`}`.

### CSS design token scope (apply to ALL components)

**Source:** `_core/src/layouts/Layout.astro` lines 37–51

```css
/* In Layout.astro <style is:global> — the ONLY place these tokens are declared */
:root {
  --bg:          {{BG_COLOR}};
  --bg-card:     {{CARD_COLOR}};
  --accent:      {{ACCENT_COLOR}};
  --text:        {{TEXT_COLOR}};
  --font-head:   {{FONT_HEAD}}, system-ui, sans-serif;
}
```

**Rule:** Artifact `:root {}` blocks are NEVER copied into generated components' `<style>` blocks. They are only surfaced as informational candidates (INGEST-07) or merged into `Layout.astro` by the operator. Generated component `<style>` blocks only contain rules that reference `var(--accent)` etc. — they consume tokens, never declare them.

### Script logging convention (apply to `ingest-artifact.mjs`)

**Source:** `_scripts/import-site.mjs` lines 73–78

```js
const log   = (...a) => console.log(...a);
const info  = (...a) => console.log(' ', ...a);
const ok    = (...a) => console.log(' ✓', ...a);
const warn  = (...a) => console.log(' ⚠', ...a);
const fail  = (...a) => { console.error(' ✖', ...a); process.exit(1); };
const dry   = (...a) => DRY_RUN && console.log('  [dry]', ...a);
```

### DRY_RUN guard (apply to all file-write operations in `ingest-artifact.mjs`)

**Source:** `_scripts/import-site.mjs` pattern throughout (e.g. lines 81, 91–93, 170–178)

```js
if (!DRY_RUN) {
  mkdirSync(targetDir, { recursive: true });
  writeFileSync(targetPath, content, 'utf-8');
  ok(`wrote ${targetPath.replace(ROOT, '.')}`);
} else {
  dry(`would write ${targetPath.replace(ROOT, '.')}`);
}
```

### Scoped `<style>` — never `is:global` (apply to ALL generated components)

**Source:** `sites/sfdy-alt-clean/src/components/Nav.astro` lines 12–35; RESEARCH.md Astro scoping section

```astro
<style>
  /* Astro auto-scopes this — no is:global needed */
  /* Do NOT include :root, body, html, or * rules here */
  .component-class { ... }
</style>
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `_captures/<slug>/raw/artifact.html` (staging convention) | config/staging | file-I/O | New `raw/` subdirectory; no existing `raw/` convention in any capture dir |

---

## Metadata

**Analog search scope:** `_scripts/`, `.claude/skills/`, `sites/sfdy-alt-clean/src/`, `_core/src/`
**Files scanned:** 7 (import-site.mjs, wm-instantiate.md, wm-capture.md, wm-init-collab.md, Nav.astro, index.astro, Layout.astro)
**Pattern extraction date:** 2026-08-21

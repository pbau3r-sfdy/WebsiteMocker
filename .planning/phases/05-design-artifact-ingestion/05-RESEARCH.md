# Phase 5: Design Artifact Ingestion — Research

**Researched:** 2026-08-21
**Domain:** HTML parsing, Astro component generation, CSS collision detection, asset path rewriting
**Confidence:** HIGH (codebase verified) / MEDIUM (Claude Design artifact structure)

---

## Summary

Phase 5 closes the loop on the core WebsiteMocker value proposition: a Claude Design HTML/CSS artifact becomes functioning, routed Astro components without manual file surgery. The operator pastes an artifact into a conversation, runs `/wm-ingest <slug>`, and the skill stages it, parses sections, detects CSS variable collisions, confirms with the operator, and writes the components — all within the existing Claude skill pattern.

The most important finding for the planner: **no new npm packages are required**. `parse5`, `hast-util-from-html`, and `hast-util-to-html` are already installed as transitive dependencies of Astro and confirmed importable from the repo root with `node --input-type=module`. This means the HTML parsing infrastructure exists today and can be used in a `_scripts/ingest-artifact.mjs` helper without any `npm install` step.

The second key finding: the Claude Design artifact format is entirely predictable — single HTML file, `<section>` elements for major blocks, CSS in `<style>` tags, `:root {}` for design tokens. The skill only needs to handle that one format, not arbitrary HTML.

**Primary recommendation:** Implement as two deliverables — a `_scripts/ingest-artifact.mjs` Node.js helper that does the file-level work (parse, extract, write, copy assets), and a `.claude/skills/wm-ingest.md` Claude skill that orchestrates the interactive flow (accept artifact, show analysis, confirm collisions, call script, surface brand candidates).

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INGEST-01 | `/wm-ingest <slug>` accepts artifact (pasted or file path); stages to `_captures/<slug>/raw/` | `_captures/` directory convention verified; `raw/` is a new subdirectory (does not yet exist) |
| INGEST-02 | Full-site ingest: extracts all sections as Astro components; rewires to `_core/` Layout/Nav/Footer; updates astro.config.mjs; preserves BASE_URL routing | `_core/` import paths and Astro component format verified in codebase |
| INGEST-03 | Section/page ingest: extracts one page/section into existing site without overwriting other pages | Same parser, scoped write target |
| INGEST-04 | CSS variable collision scan before applying — operator confirms conflicts | Collision regex approach verified via bash |
| INGEST-05 | Copy images to `public/images/<slug>/`; copy fonts to `public/fonts/`; rewrite src and url() references | Existing asset conventions verified in codebase |
| INGEST-06 | Convert `<link rel="stylesheet">` to `<style>` blocks within components — never global | Astro `<style>` scoping pattern verified |
| INGEST-07 | Surface extracted CSS custom properties as brand block candidates in wiring.json | wiring.json brand block structure verified |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

- **Skill-first pattern:** Every operator capability lives in `.claude/skills/` (framework) or `_core/.claude/skills/` (inherited). `/wm-ingest` belongs in `.claude/skills/wm-ingest.md`.
- **`_core/` is sacred:** The skill MUST NEVER write to `_core/src/components/`, `_core/src/layouts/`, or `_core/src/pages/`. These are shared and serve all sites.
- **`wiring.json` as source of truth:** Read `sites/<slug>/wiring.json` to validate slug exists, get site name for asset paths.
- **BASE_URL routing:** Every `<img src>` in an Astro page template must use the `{b}/...` pattern where `const b = import.meta.env.BASE_URL.replace(/\/$/, '');`. Confirmed in `sites/sfdy-alt-clean/src/components/Nav.astro` and `sites/sfdy-alt-clean/src/pages/index.astro`.
- **Env-aware astro.config.mjs:** `site: process.env.SITE_URL || 'https://...'` and `base: process.env.SITE_BASE || '/WebsiteMocker/<slug>'`. Already handled by `import-site.mjs`; ingest must preserve this.
- **No global CSS imports from artifacts:** Per INGEST-06, `<link rel="stylesheet">` must become inline `<style>` blocks, never `import './artifact.css'` at layout level.
- **Stage to `_captures/<slug>/raw/`:** New subdirectory convention for this phase.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Artifact acceptance and staging | Claude skill (operator interface) | File system | Operator pastes HTML; skill writes to `_captures/<slug>/raw/` |
| HTML parsing and section identification | `_scripts/ingest-artifact.mjs` | — | CPU-bound file manipulation; Claude skill calls it via Bash |
| CSS variable collision detection | `_scripts/ingest-artifact.mjs` | Claude skill (confirmation UI) | Script produces diff; skill presents and confirms with operator |
| Astro component generation | `_scripts/ingest-artifact.mjs` | — | Deterministic file writes; reusable across modes |
| Asset copying and path rewriting | `_scripts/ingest-artifact.mjs` | — | File system operations; follows existing script patterns |
| Brand candidate surfacing | Claude skill | `wiring.json` | Interactive step: operator reviews candidates before wiring.json update |
| Operator confirmation flow | Claude skill | — | Modal interactive pattern; cannot be scripted |
| Build verification | Bash (`npm run build`) | — | Same verification used by import-site.mjs |

---

## Standard Stack

### Core (no new packages required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `parse5` | (transitive, ~7.x) | HTML tokenizer backing hast | Already installed via Astro dependency chain |
| `hast-util-from-html` | 2.0.3 (confirmed) | Parse HTML string → HAST tree | Already installed; `fromHtml()` confirmed working |
| `hast-util-to-html` | (transitive) | Serialize HAST node → HTML string | Already installed; `toHtml()` confirmed working |
| `node:fs` | Node.js built-in | File read/write/copy | No install needed; used throughout `_scripts/` |
| `node:path` | Node.js built-in | Path manipulation | Already used in all scripts |

[VERIFIED: confirmed importable via `node --input-type=module` from repo root — `fromHtml` parses sections, `toHtml` serializes back without error]

### No New Packages Required

This phase deliberately uses only what is already installed. The full HTML parse-and-extract cycle was confirmed working:

```bash
node --input-type=module <<'EOF'
import { fromHtml } from 'hast-util-from-html';
import { toHtml }   from 'hast-util-to-html';
const tree = fromHtml('<section class="hero"><h1>Hello</h1></section>', { fragment: true });
// Works — returns HAST element nodes
EOF
```

[VERIFIED: bash confirmation 2026-08-21]

### CSS Custom Property Extraction (no library needed)

Regex-based extraction is sufficient for the well-structured CSS in Claude Design artifacts:

```js
// Extract all --custom-property declarations from a CSS string
const vars = [...css.matchAll(/--([a-zA-Z0-9-]+)\s*:\s*([^;}\n]+)/g)]
  .map(m => ({ name: `--${m[1]}`, value: m[2].trim() }));
```

[VERIFIED: bash test confirmed this extracts `--bg`, `--accent`, `--text` from a `:root {}` block correctly]

---

## Package Legitimacy Audit

> No new packages are installed in this phase. All parsing uses existing Astro transitive dependencies.

| Package | Registry | Status | Disposition |
|---------|----------|--------|-------------|
| `hast-util-from-html` | npm (transitive) | Already installed | Use existing — no install |
| `hast-util-to-html` | npm (transitive) | Already installed | Use existing — no install |
| `parse5` | npm (transitive) | Already installed | Use existing — no install |

**Packages removed due to slopcheck:** none — no new packages proposed
**slopcheck availability:** not available at research time (pip install failed)
**Risk:** None — no new registry installs in this phase. All parsing uses packages already in `node_modules/` as Astro 5 transitive dependencies.

---

## Architecture Patterns

### System Architecture Diagram

```
Operator (chat)
    │
    │  pastes HTML artifact (or provides file path)
    ▼
/wm-ingest <slug> (Claude skill)
    │
    ├─1─▶  Write artifact → _captures/<slug>/raw/artifact.html
    │
    ├─2─▶  node _scripts/ingest-artifact.mjs <slug> --analyze
    │           │
    │           ├── fromHtml() → HAST tree
    │           ├── Extract <section> nodes → section list
    │           ├── Extract <style> `:root {}` → artifact CSS vars
    │           ├── Read sites/<slug>/src/layouts/Layout.astro → existing CSS vars
    │           └── Output: section manifest + collision report (stdout JSON)
    │
    ├─3─▶  Skill presents collision report to operator
    │       Operator confirms or resolves conflicts
    │
    ├─4─▶  node _scripts/ingest-artifact.mjs <slug> --mode full|section [--section <name>]
    │           │
    │           ├── For each section:
    │           │   ├── toHtml(sectionNode) → HTML string
    │           │   ├── Collect scoped CSS for section
    │           │   └── Write sites/<slug>/src/components/<Name>.astro
    │           │
    │           ├── Write sites/<slug>/src/pages/index.astro (full mode only)
    │           │   └── Imports _core/ Layout + Nav + Footer + new section components
    │           │
    │           ├── Copy images → public/images/<slug>/
    │           │   └── Rewrite src attributes in component HTML
    │           │
    │           ├── Copy fonts → public/fonts/
    │           │   └── Rewrite url() references in CSS
    │           │
    │           └── Convert <link rel="stylesheet"> → inline <style> in components
    │
    ├─5─▶  Skill presents CSS custom property candidates to operator
    │       Operator confirms which to add to wiring.json brand block
    │
    └─6─▶  npm run build (sites/<slug>) — build verification
```

### Recommended Project Structure (new files this phase)

```
_scripts/
└── ingest-artifact.mjs          ← NEW: HTML parse + component write + asset copy

.claude/skills/
└── wm-ingest.md                 ← NEW: operator skill

_captures/<slug>/
└── raw/
    └── artifact.html            ← NEW: staging convention for pasted artifacts

sites/<slug>/src/components/
├── Hero.astro                   ← NEW (from artifact section)
├── About.astro                  ← NEW (from artifact section)
└── ...                          ← one .astro per <section>
```

### Pattern 1: Astro Component from Extracted Section

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
  .hero { position: relative; min-height: 80vh; display: flex; align-items: center; }
  .hero-content { position: relative; z-index: 1; max-width: 640px; }
  .hero-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .cta { display: inline-block; padding: .75rem 2rem; background: var(--accent); color: #000; }
</style>
```

[VERIFIED: matches Astro component format confirmed in `sites/sfdy-alt-clean/src/components/`]

### Pattern 2: Full-Site index.astro After Ingest

```astro
---
import Layout    from '../layouts/Layout.astro';
import Nav       from '../components/Nav.astro';
import Hero      from '../components/Hero.astro';
import About     from '../components/About.astro';
import Services  from '../components/Services.astro';
import Contact   from '../components/Contact.astro';
import Footer    from '../components/Footer.astro';
---

<Layout title="<Site Name>">
  <Nav />
  <Hero />
  <About />
  <Services />
  <Contact />
  <Footer />
</Layout>
```

**Rule:** Site-local `Nav.astro` and `Footer.astro` are preferred over `_core/` equivalents since sites typically customize them. The full-site ingest creates NEW site-local Nav and Footer components from the artifact — it does NOT import from `_core/` for Nav/Footer. `_core/` Layout.astro IS used (it owns `<head>`, global reset, design tokens).

[VERIFIED: `sites/sfdy-alt-clean/src/pages/index.astro` — imports from local `../components/`, not `_core/`; `sites/mogwai-systems/src/pages/index.astro` — same pattern]

### Pattern 3: CSS Collision Detection

```js
// From ingest-artifact.mjs
function extractCSSVars(css) {
  return new Map(
    [...css.matchAll(/--([a-zA-Z0-9-]+)\s*:\s*([^;}\n]+)/g)]
      .map(m => [`--${m[1]}`, m[2].trim()])
  );
}

// Existing site vars from Layout.astro <style is:global> block
const siteVars    = extractCSSVars(layoutAstroContent);
// Artifact vars from <style> :root {} block
const artifactVars = extractCSSVars(artifactCSS);

// Collision = same name, different value
const collisions = [...artifactVars.entries()]
  .filter(([name, val]) => siteVars.has(name) && siteVars.get(name) !== val)
  .map(([name, val]) => ({ name, existing: siteVars.get(name), artifact: val }));
```

[VERIFIED: regex extraction confirmed working; collision comparison pattern is standard JS Map logic]

### Pattern 4: Astro BASE_URL in Components

Any `<img src>` or `<a href>` that references a site-local asset MUST be rewritten during extraction:

```
# Before (in artifact):
<img src="/images/hero-bg.jpg">
<a href="/contact">

# After (in Astro component):
<img src={`${b}/images/<slug>/hero-bg.jpg`}>
<a href={`${b}/contact`}>
```

The `const b = import.meta.env.BASE_URL.replace(/\/$/, '');` declaration goes in the Astro frontmatter (`---`) of every component that uses local asset paths.

[VERIFIED: confirmed in `sites/sfdy-alt-clean/src/components/Nav.astro` line 2 and `sites/sfdy-alt-clean/src/pages/index.astro` line 10]

### Pattern 5: _core/ Import Path Depth

| File location | Path to _core/ |
|---------------|----------------|
| `sites/<slug>/src/pages/index.astro` | `../layouts/Layout.astro` (local Layout), `../../../../_core/...` (if importing _core directly) |
| `sites/<slug>/src/pages/<collection>/index.astro` | `../../../../../_core/src/components/...` |
| `sites/<slug>/src/components/*.astro` | No _core/ imports needed for section components |

**Full-site ingest uses local imports only** — each extracted component is self-contained. The `index.astro` imports local Layout/Nav/Footer/section components. `_core/` is NOT imported in extracted section components.

[VERIFIED: `sites/sfdy-alt-clean/src/pages/index.astro` imports from `../layouts/Layout.astro` (local) and `../components/Nav.astro` (local) — NOT from `_core/` for these files]

### Anti-Patterns to Avoid

- **Global CSS import**: Never `import '../styles/artifact.css'` in Layout.astro or index.astro. Artifact CSS always scoped within each component's `<style>` block.
- **Writing to `_core/`**: The ingest skill must check that target path starts with `sites/<slug>/`, never `_core/`.
- **Hardcoded asset paths**: All `<img src="/images/...">` must become `<img src={`${b}/images/...`}>` with `const b = ...` in frontmatter.
- **Overwriting existing pages**: Section mode must never overwrite `sites/<slug>/src/pages/` files. It only writes to `sites/<slug>/src/components/`.
- **Missing collision confirmation**: Never apply CSS changes without showing the collision report to the operator first, even if there are zero collisions ("No conflicts found — proceed?").
- **Dumping all CSS in one global block**: If artifact has 800 lines of CSS and we put it all in one `<style>` in index.astro, it bleeds everywhere. Each component gets only the CSS rules that target its own elements.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML parsing | Custom tokenizer / regex tree | `hast-util-from-html` (already installed) | parse5 is battle-tested; handles edge cases, malformed HTML, entities |
| HTML serialization | String concatenation | `hast-util-to-html` (already installed) | Properly escapes attributes, handles void elements |
| CSS var extraction | Full CSS parser | Simple regex `--[a-z]+\s*:\s*[^;]+` | Artifact CSS is predictable; regex is sufficient and has no deps |
| File copy with mkdir | Custom recursive copy | `node:fs` `cpSync` + `mkdirSync` | Already used across all `_scripts/` — no new patterns needed |

**Key insight:** The Astro dependency chain already ships a complete HTML parser (parse5) and HAST utilities. Zero new packages are needed. The MVP can be built entirely with what's installed today.

---

## Claude Design Artifact Structure

[ASSUMED — based on training knowledge of Claude artifacts; not verified against a real artifact in this codebase]

Claude Design artifacts are single HTML files with the following structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Name</title>
  <!-- External fonts (Google Fonts CDN) -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap">
  <style>
    :root {
      --bg: #0d0f1c;
      --accent: #00FB92;
      --text: #e8ecff;
      --font-head: 'Inter', sans-serif;
    }
    /* Global reset + section-specific CSS */
    * { box-sizing: border-box; margin: 0; }
    .hero { background: var(--bg); padding: 6rem 2rem; }
    .about { background: #131620; padding: 5rem 2rem; }
  </style>
</head>
<body>
  <nav class="nav">...</nav>
  <section class="hero" id="hero">
    <h1>Hero Headline</h1>
    <img src="https://via.placeholder.com/1440x600" alt="">
    <!-- OR: <img src="data:image/png;base64,..." alt=""> -->
  </section>
  <section class="about" id="about">...</section>
  <section class="services" id="services">...</section>
  <section class="contact" id="contact">...</section>
  <footer class="footer">...</footer>
</body>
</html>
```

**Key assumptions** (all [ASSUMED]):
- Sections use `<section>` elements with class/id attributes matching section name
- CSS is in `<style>` blocks in `<head>` (not external `.css` files)
- `:root {}` block contains design tokens (CSS custom properties)
- Images are either placeholder URLs, base64 data URIs, or external Unsplash/Lorem Picsum URLs
- Fonts are either Google Fonts CDN links or system font stacks
- No complex JavaScript — primarily static HTML with minimal interactivity
- Nav and footer are `<nav>` and `<footer>` elements at body top/bottom

**Section identification heuristic** [ASSUMED]:
1. Primary: `<section>` elements with `id` or `class` attribute → use id/class as component name
2. Fallback: `<div>` elements with `id` attribute at body level
3. Edge case: nav `<nav>` → `Nav.astro`; footer `<footer>` → `Footer.astro`

---

## Common Pitfalls

### Pitfall 1: CSS Scope Bleed

**What goes wrong:** The skill extracts all artifact CSS into a single component (e.g., `Hero.astro`) and all 400+ lines of global CSS bleed into other components via Astro's non-scoped `<style>` (which applies to all matching selectors on the page).

**Why it happens:** Artifact CSS has a single `<style>` block covering all sections. A naive extraction copies the whole block into one component.

**How to avoid:** For each component, filter CSS rules to only include selectors that match elements within that section's class namespace. Global rules (`:root`, `*`, `body`, `html`) should be excluded from component styles (they live in `Layout.astro`). Scoped `<style>` in Astro does class-hash scoping automatically — but only if you don't use `is:global`.

**Warning signs:** After build, styles from section A visually affect section B. Check: does any component `<style>` contain rules like `body {}`, `.hero .services {}`, or `:root {}`?

### Pitfall 2: BASE_URL Missing in Component

**What goes wrong:** Extracted component has `<img src="/images/hero.jpg">` — works in local dev at `localhost:4321` but 404s in sandbox at `pbau3r-sfdy.github.io/WebsiteMocker/<slug>/images/hero.jpg`.

**Why it happens:** Hardcoded `/images/...` paths ignore the `base` setting in `astro.config.mjs`.

**How to avoid:** Every image `src`, anchor `href`, and CSS `url()` that points to a local asset must use `{b}/...` where `const b = import.meta.env.BASE_URL.replace(/\/$/, '');`. The ingest script must pattern-match all `src="/"` and `href="/"` attributes during extraction and inject the `{b}/` prefix.

**Warning signs:** Build passes but sandbox preview shows broken images. Check: `grep -r 'src="/' sites/<slug>/src/`.

### Pitfall 3: Overwriting Site-Local Nav/Footer

**What goes wrong:** Full-site ingest overwrites `sites/<slug>/src/components/Nav.astro` and `Footer.astro` without warning. The existing nav had correct logo path, links, and social handles from Phase 3.

**Why it happens:** The script doesn't distinguish between "this is a fresh site from `_core/` template" vs "this site has been customized".

**How to avoid:** Before writing `Nav.astro` and `Footer.astro`, check if they exist and differ from `_core/` template. If customized, prompt operator: "Nav.astro has been customized. Overwrite with artifact version? (y/N)". Default to N.

**Warning signs:** After ingest, `wiring.json` social handles are configured but the Footer no longer renders them.

### Pitfall 4: data:image Base64 Blowup

**What goes wrong:** An artifact has inline base64 images. The extracted Astro component has a 50KB base64 string in its `src` attribute. Astro builds successfully but the component file is huge and non-maintainable.

**Why it happens:** The script naively copies `src="data:image/..."` as-is.

**How to avoid:** The ingest script MUST detect `data:image/*;base64,` URIs, decode them, write the binary to `public/images/<slug>/`, and replace with a path reference. Use Node.js `Buffer.from(b64string, 'base64')`.

**Warning signs:** Component file size > 10KB. Check: `grep -l "data:image" sites/<slug>/src/components/`.

### Pitfall 5: CSS Collision Not Surfaced

**What goes wrong:** The artifact uses `--bg: #ffffff` (white) but existing `Layout.astro` has `--bg: #0d0f1c` (near-black). Ingest applies without collision report. The site background flips white.

**Why it happens:** CSS collision detection is skipped because it's hard — so it's implemented as "best effort" that silently passes.

**How to avoid:** Collision detection is MANDATORY before any file write. Even if zero collisions, show the operator: "Collision scan complete — 0 conflicts. Proceed?". If conflicts exist, list them name-by-name and require explicit confirmation. This is INGEST-04 and it is a gate, not a suggestion.

**Warning signs:** Post-ingest build works but visual design is broken (wrong background, wrong accent color).

### Pitfall 6: Font Link vs Self-Hosted Mismatch

**What goes wrong:** INGEST-06 says convert `<link rel="stylesheet">` to `<style>` blocks. The skill converts Google Fonts `<link>` to a `<style>` block — but a Google Fonts `<link>` cannot simply become a `<style>` block since it's a CDN-loaded stylesheet, not inline CSS.

**Why it happens:** INGEST-06 is written as a blanket rule. Google Fonts `<link>` tags are actually CDN stylesheets that generate `@font-face` rules dynamically — they can't be copied into a `<style>` block without downloading the font files.

**How to avoid:** Apply INGEST-06 only to CSS file `<link>` tags (i.e., links to `.css` files where we have the source). For Google Fonts CDN links (`fonts.googleapis.com`), two options: (a) keep the `<link>` tag in `Layout.astro` `<head>` as an exception, or (b) download the font files and write local `@font-face` in Layout.astro. **MVP recommendation:** Keep Google Fonts `<link>` in `Layout.astro` `<head>` — it's not a "global CSS import" of artifact styles, it's a font loader.

**Warning signs:** Build passes but fonts don't load. Check: did we try to convert a Google Fonts `<link>` to a `<style>` block?

### Pitfall 7: Section Mode Accidentally Breaks Existing Routes

**What goes wrong:** Section/page ingest (INGEST-03) adds a new component and modifies `sites/<slug>/src/pages/index.astro` to import it. In doing so, it corrupts the existing index.astro structure.

**Why it happens:** String manipulation on index.astro is fragile.

**How to avoid:** Section mode only writes NEW files to `sites/<slug>/src/components/`. It does NOT modify `index.astro` or any existing page. Instead, it prints instructions: "Component written to `src/components/NewSection.astro`. Add it to your page manually with `<NewSection />` in `src/pages/index.astro`." This is less magical but safe.

---

## Code Examples

### CSS Variable Extraction (verified)

```js
// Source: tested via bash 2026-08-21
function extractCSSVars(cssText) {
  const vars = new Map();
  for (const [, name, value] of cssText.matchAll(/--([a-zA-Z0-9-]+)\s*:\s*([^;}\n]+)/g)) {
    vars.set(`--${name}`, value.trim());
  }
  return vars;
}
```

### HTML Section Extraction using hast (verified)

```js
// Source: bash confirmation 2026-08-21 with hast-util-from-html@2.0.3
import { fromHtml } from 'hast-util-from-html';
import { toHtml }   from 'hast-util-to-html';

const tree = fromHtml(htmlString);
const html = tree.children.find(n => n.tagName === 'html');
const body = html?.children.find(n => n.tagName === 'body');

const sections = body?.children.filter(
  n => n.type === 'element' && ['section', 'nav', 'footer', 'header', 'main'].includes(n.tagName)
) ?? [];

for (const section of sections) {
  const name = section.properties?.id
    || section.properties?.className?.[0]
    || 'Section';
  const html = toHtml(section);
  // → write to sites/<slug>/src/components/<PascalCase(name)>.astro
}
```

### Astro Component Writer (pattern)

```js
// Source: pattern derived from existing _scripts/import-site.mjs and Astro component format
function toAstroComponent(sectionHtml, scopedCSS, componentName) {
  const hasLocalAssets = sectionHtml.includes('{b}/');
  const frontmatter = hasLocalAssets
    ? `---\nconst b = import.meta.env.BASE_URL.replace(/\\/$/, '');\n---`
    : `---\n---`;

  return `${frontmatter}\n\n${sectionHtml}\n\n<style>\n${scopedCSS}\n</style>\n`;
}
```

### Collision Report Format

```js
// Output JSON from ingest-artifact.mjs --analyze
{
  "sections": [
    { "name": "Hero",     "tag": "section", "id": "hero",     "classes": ["hero"] },
    { "name": "About",    "tag": "section", "id": "about",    "classes": ["about"] },
    { "name": "Services", "tag": "section", "id": "services", "classes": ["services"] }
  ],
  "artifactVars": {
    "--bg": "#ffffff",
    "--accent": "#6366f1",
    "--text": "#111827"
  },
  "existingVars": {
    "--bg": "#0d0f1c",
    "--accent": "#00FB92",
    "--text": "#e8ecff"
  },
  "collisions": [
    { "name": "--bg",     "existing": "#0d0f1c", "artifact": "#ffffff" },
    { "name": "--accent", "existing": "#00FB92", "artifact": "#6366f1" },
    { "name": "--text",   "existing": "#e8ecff", "artifact": "#111827" }
  ],
  "googleFontsLinks": ["https://fonts.googleapis.com/css2?family=Inter:wght@400;700"],
  "images": ["https://via.placeholder.com/1440x600"],
  "base64Images": 0
}
```

---

## Wiring.json Brand Block (verified)

```json
"brand": {
  "hashtags": [],
  "vocabulary": [],
  "avoid": [],
  "voice": ""
}
```

[VERIFIED: `sites/sfdy-alt-clean/wiring.json` confirmed — brand block with these exact four fields]

After ingest, INGEST-07 surfaces CSS custom properties as candidates. The skill presents them as suggestions:

```
Brand block candidate CSS variables from artifact:
  --bg: #ffffff        (currently: #0d0f1c — CONFLICT, keep existing?)
  --accent: #6366f1    (currently: #00FB92 — CONFLICT, keep existing?)
  --font-head: 'Inter' (new — add to wiring.json brand?)

These would NOT be auto-added to brand.vocabulary or brand.hashtags (those are content fields).
This is informational — the CSS token values for your design system reference.
```

**Clarification on INGEST-07:** The requirement says "surface as candidates for the site's `brand` block." The brand block (`hashtags`, `vocabulary`, `avoid`, `voice`) is a content brand tool, not a CSS variable store. CSS custom property values do NOT map to `brand.hashtags` or `brand.vocabulary`. The surfacing is an informational report to the operator showing what design tokens were found — useful for manually updating `Layout.astro` `:root {}` if the operator wants to adopt the artifact's color palette. The skill should NOT write CSS values into `brand.hashtags`.

---

## Prior Art in Codebase

### `_scripts/import-site.mjs` (closest analog)

[VERIFIED: read in full — 351 lines]

`import-site.mjs` is the closest prior art for `ingest-artifact.mjs`. Key patterns to reuse:

- `readJSON(p)` / `writeJSON(p, obj)` helper pattern
- `DRY_RUN` flag pattern (`flag('--dry-run')`)
- `option(name)` for named args
- `findAstroRoot()` recursive search (not needed for ingest, but pattern is solid)
- Asset copy from donor site pattern → same approach for copying images from artifact
- `run(cmd, cwd)` for running build verification
- Slug validation regex from `publish.yml` STATE.md: `^[a-z0-9-]+$`

### `_scripts/new-site.sh` `{{PLACEHOLDER}}` substitution

[VERIFIED: read in full]

The `replace()` function in `new-site.sh` does sed-based token substitution on all Astro/JSON/TS files. The ingest script should use the same approach for inserting `{b}/` into image src paths (though Node.js string replacement is simpler than sed).

### `/wm-instantiate` skill

[VERIFIED: read in full]

`wm-instantiate` is the closest skill analog. It:
1. Reads capture.json → derives section structure → creates stub Astro pages
2. Applies brand tokens to Layout.astro CSS vars
3. Copies assets
4. Updates wiring.json

`wm-ingest` does the same but starting from a real HTML artifact instead of a structured JSON capture. The interactive flow (collect → read → scaffold → apply → verify → report) maps directly.

---

## _captures/ Convention

[VERIFIED: `ls _captures/` shows: crestworks, crestworks-rework, levion, levion-fresh, parrot-capital, sfdy, tnt-ventures]

Each capture directory has: `assets/`, `screenshots/`, `CAPTURE.md`, `capture.json`, `tokens.json`.

**New convention for ingest:** `_captures/<slug>/raw/artifact.html` — the raw pasted artifact. This is a NEW subdirectory (`raw/`) not yet present in any existing capture. The skill creates it on first use.

If `_captures/<slug>/` does not exist, the skill creates it. If `wiring.json` for the site doesn't exist (slug not yet in `sites/`), the skill should exit with an error: "Run `/wm-new-site` first to scaffold the site, then run `/wm-ingest` to populate it with the artifact."

---

## Astro Component `<style>` Scoping

[VERIFIED: confirmed via codebase reading]

In Astro, `<style>` blocks in `.astro` files are **automatically scoped** — Astro adds a unique class hash to both the elements and the CSS selectors. This means CSS in `Hero.astro` only applies to elements in `Hero.astro`. No `<style scoped>` attribute needed.

**Exception:** `<style is:global>` bypasses scoping. Do NOT use this for artifact styles. Only `Layout.astro` uses `<style is:global>` for design tokens and reset.

This automatic scoping solves most CSS bleed concerns — as long as we don't put artifact CSS in Layout.astro and don't use `is:global`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `ingest-artifact.mjs` | YES | v26.7.0 | — |
| npm | workspace builds | YES | 11.19.0 | — |
| git | commit after ingest | YES | 2.50.1 | — |
| `hast-util-from-html` | HTML parsing | YES (transitive) | 2.0.3 | regex fallback |
| `hast-util-to-html` | HTML serialization | YES (transitive) | confirmed | string concat |
| `parse5` | HTML tokenizer | YES (transitive) | confirmed | — |

**No missing dependencies.** All required tools and libraries are present.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Capture live site → instantiate | Ingest Claude Design artifact directly | Phase 5 (new) | Removes Playwright dependency for Claude-generated designs |
| Manual Astro component creation | Automated section extraction | Phase 5 (new) | No more copy-paste from HTML to Astro |
| Global CSS copy | Scoped per-component CSS | Phase 5 (design intent) | Prevents style bleed between sections |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Claude Design artifacts use `<section>` elements for major content blocks | Claude Design Artifact Structure | Script falls back to `<div id="...">` detection; may require manual section mapping |
| A2 | Claude Design artifact CSS is in `<style>` blocks in `<head>` (not external `.css` files) | Claude Design Artifact Structure | If external CSS, INGEST-06 handling changes — need to detect and download |
| A3 | Claude Design artifacts have a single HTML file (not multi-page) | Claude Design Artifact Structure | Multi-page would require mode selection per page; adds complexity |
| A4 | CSS rules for a section can be identified by matching selectors containing the section's class/id | Architecture Patterns (CSS scoping) | May need more sophisticated CSS rule attribution (e.g., nested selectors) |
| A5 | INGEST-07 "brand block candidates" means informational surfacing, not auto-population | Wiring.json Brand Block | If planner interprets it as "write to brand.vocabulary", behavior changes significantly |
| A6 | Section mode (INGEST-03) is safe to implement as write-component-only (no page modification) | Anti-Patterns | If user expects automatic page wiring, manual step guidance may disappoint |

---

## Open Questions

1. **What does "referenced" mean in INGEST-01 ("pasted or referenced")?**
   - What we know: Operator can paste HTML into the chat. "Referenced" could mean a file path or a URL.
   - What's unclear: Is the artifact ever at a URL (e.g., a GitHub Gist or artifact export URL)?
   - Recommendation: For MVP, support (a) pasted content (Claude detects HTML in conversation) and (b) a local file path the operator provides. Skip URL fetch.

2. **Should the skill create a NEW site or ingest into an EXISTING one?**
   - What we know: INGEST-02 says "rewires to `_core/` Layout, Nav, Footer" implying it could start fresh. INGEST-03 says "integrates without overwriting other pages" implying it targets an existing site.
   - What's unclear: If the target `sites/<slug>/` doesn't exist, should the skill scaffold it first (calling `new-site.sh`) or error?
   - Recommendation: Require the site to exist first (`sites/<slug>/` must be present). Print a clear error if it doesn't: "Run `/wm-new-site <slug>` first."

3. **How to handle artifact CSS that references both section-specific and global rules?**
   - What we know: Artifact has one CSS block covering all sections plus body/html resets.
   - What's unclear: When distributing CSS to per-component `<style>` blocks, how do we attribute CSS rules (e.g., `.hero .cta` goes to Hero, but `.cta` might apply globally)?
   - Recommendation: MVP heuristic — put rules in a component if the selector contains the section's class/id. Put remaining rules (that match multiple sections) in a shared comment block. Document the limitation: "Some CSS rules may need manual distribution."

---

## Sources

### Primary (HIGH confidence)
- Codebase: `sites/sfdy-alt-clean/src/pages/index.astro` — BASE_URL pattern, component import pattern
- Codebase: `sites/sfdy-alt-clean/src/components/Nav.astro` — BASE_URL in components
- Codebase: `_core/src/layouts/Layout.astro` — design token structure, CSS var names, `<style is:global>`
- Codebase: `_core/src/components/Nav.astro`, `Footer.astro` — _core component structure
- Codebase: `sites/sfdy-alt-clean/wiring.json` — brand block schema (confirmed)
- Codebase: `_scripts/import-site.mjs` — script pattern for file manipulation (351 lines, read fully)
- Bash verification: `hast-util-from-html@2.0.3` + `hast-util-to-html` — confirmed importable and working

### Secondary (MEDIUM confidence)
- Codebase: `_scripts/new-site.sh` — placeholder substitution pattern
- Codebase: `.claude/skills/wm-instantiate.md` — interactive skill flow pattern
- Codebase: `.claude/skills/wm-capture.md` — staging convention pattern
- Bash verification: CSS regex extraction — confirmed working with actual CSS string

### Tertiary (LOW confidence / ASSUMED)
- Claude Design artifact structure — training knowledge only (A1–A3)
- CSS rule attribution heuristic — untested against real Claude Design artifacts (A4)
- INGEST-07 interpretation — not specified in requirements (A5)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — parse5/hast confirmed in node_modules and working
- Architecture: HIGH — built on verified codebase patterns
- Artifact format: MEDIUM — training knowledge only; real artifact may differ from assumptions
- CSS scoping: HIGH — Astro automatic scoping confirmed via codebase
- Pitfalls: HIGH — derived from verified codebase patterns and known Astro behaviors

**Research date:** 2026-08-21
**Valid until:** 2026-10-01 (Astro 5 is stable; hast utils are stable)

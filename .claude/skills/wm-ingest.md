# /wm-ingest

Ingest a Claude Design HTML/CSS artifact into an existing site and produce functioning, routed Astro components without manual file surgery.
The target site must already exist in `sites/<slug>/` — run `/wm-new-site <slug>` first if starting from scratch.

---

## Steps

### 1. Collect inputs

Ask for:
- **Target slug** — must exist in `sites/`; validate with `ls sites/<slug>/wiring.json`
- **Artifact** — operator pastes HTML content directly in the chat, or provides a local file path
- **Mode** — `full` (all sections → full site rebuild) or `section` (one named section → new component only, existing pages untouched)

### 2. Stage the artifact

Write the pasted HTML (or copy from the provided path) to `_captures/<slug>/raw/artifact.html`. Create `_captures/<slug>/raw/` if it does not exist.

```bash
mkdir -p _captures/<slug>/raw/
# then write the artifact HTML to _captures/<slug>/raw/artifact.html
```

### 3. Analyze

Run the script before any writes to get the full picture:

```bash
node _scripts/ingest-artifact.mjs <slug> --analyze
```

Output is JSON. Read and present to the operator:
- **Section manifest** — names, tags, ids of all top-level sections found in the artifact body
- **CSS collision report** — CSS custom properties in the artifact that conflict with existing `Layout.astro` vars (same name, different value)
- **Asset inventory** — total image count, base64 image count, Google Fonts CDN links found

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

### 5. Run ingest

For **full mode** (all sections → rewrites index.astro):

```bash
node _scripts/ingest-artifact.mjs <slug> --mode full
```

For **section mode** (one named section → new component only):

```bash
node _scripts/ingest-artifact.mjs <slug> --mode section --section <name>
```

Append `--dry-run` to either command to preview what would be written without making any changes.

Section mode writes a single `.astro` component to `sites/<slug>/src/components/` and prints a manual import instruction — existing pages are never modified.

### 6. Surface brand candidates

Present the extracted CSS custom properties from the artifact as an informational report. Format each as:

```
  --var-name: value  (currently: existing-value — CONFLICT, keep existing?)
  --var-name: value  (new — add to Layout.astro :root manually?)
```

These are informational only — they are NOT written to `wiring.json`. To adopt any token values, update `sites/<slug>/src/layouts/Layout.astro` `:root {}` manually.

### 7. Verify and report

```bash
node _scripts/build-all.js <slug>
```

Report:
- Number of components created
- Assets copied (images decoded from base64, local paths rewritten)
- Collisions resolved or skipped
- What to customise next (brand tokens in Layout.astro, hero content, nav links)

**Next: push to production**

```
/wm-publish <slug>
```

Run this when you are ready to go live. The local build confirms the site is valid — `/wm-publish` builds with production env vars and pushes to the production repo.

---

## Notes
- **`_core/` is never touched** — ingest only writes to `sites/<slug>/src/components/` and `sites/<slug>/src/pages/` (full mode only); the shared template is never modified
- **Section mode is write-only** — it writes a new component but never modifies existing pages; the operator must add the import manually per the printed instruction (e.g. `import Hero from '../components/Hero.astro';`)
- **Nav.astro and Footer.astro overwrite protection** — if Nav.astro or Footer.astro has already been customised (differs from `_core/` template), the script skips the overwrite and logs a warning; review the artifact Nav/Footer manually and merge changes as needed
- **Google Fonts `<link>` tags are auto-injected** — the script writes CDN `<link rel="stylesheet">` tags directly into `sites/<slug>/src/layouts/Layout.astro` before `</head>` (idempotent — skips if already present); do NOT convert them to `<style>` blocks or attempt to self-host CDN fonts
- **BASE_URL routing** — all local `src="/..."` and `href="/..."` paths in the artifact are rewritten to `{b}/...` during extraction; both sandbox and production builds resolve correctly without manual path surgery
- **If build fails after ingest**, check: (a) missing import in `index.astro` — section mode requires a manual import, full mode writes all imports automatically; (b) malformed template literal from path rewriting — look for unmatched backticks; (c) unclosed Astro frontmatter `---` block — verify the generated component starts and ends with `---`

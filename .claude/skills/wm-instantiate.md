# /wm-instantiate

Create a new site whose layout is inspired by a capture but with a different brand applied.
Reads `_captures/<slug>/capture.json` as the source of truth — run `/wm-capture` first.

---

## Steps

### 1. Collect inputs

Ask for:
- **Capture slug** — must exist in `_captures/`; this is the layout donor
- **New site slug** — the new project identifier (e.g. `levion`)
- **New site name** — display name (e.g. `Levion Materials`)
- **Brand brief** — accent colour, font preference, tone differences from source

### 2. Read the capture

```bash
cat _captures/<capture-slug>/capture.json
```

From `capture.json` extract:
- `nav` — navigation structure to replicate
- `tokens` — source design tokens (you will override these with new brand)
- `assets.images/videos/fonts` — available assets
- `pages["/"].sections` — section order and types for the homepage
- `pages` keys — which pages exist and their content

Also scan `_captures/<capture-slug>/screenshots/home-desktop.png` visually as layout reference.

### 3. Scaffold

Run `/wm-new-site` with the new slug and name. This creates `sites/<new-slug>/` from `_core/`.

### 4. Apply layout structure

Using `pages["/"].sections` from `capture.json` as the section blueprint:
- Adapt `src/pages/index.astro` to match that section order
- Create stub pages for each route found in `capture.json.pages`
- Replicate the nav structure from `capture.json.nav`

### 5. Apply new brand tokens

In `sites/<new-slug>/src/layouts/Layout.astro`, set CSS custom properties using the new
brand brief — **not** the source tokens. The source accent/font is reference only.

New accent colour must pass WCAG AA contrast (≥4.5:1) against the new background.

### 6. Copy relevant assets

From `_captures/<capture>/assets/` → `sites/<new-slug>/public/images/`:
- Copy hero background images (structural, not brand-specific)
- Skip: logos, brand icons, product images specific to the source company

Placeholder flag: if `capture.json.assets.images` is empty or a section had `hasImage: true`
but no asset was downloaded, add a comment `<!-- TODO: replace with real image -->` in the template.

### 7. Update wiring.json

Set `stage: 1`, `capture: "<capture-slug>"`, note key differences in `notes`.

### 8. Verify and report

```bash
cd sites/<new-slug> && npm run build
```

Report: pages created, tokens applied, assets copied vs. placeholders, what to customise next.

---

## Notes
- **Never** copy the source site's logo, wordmark, or brand-specific product photography
- Structural elements (card grid layout, section order, nav pattern) are fine to reuse
- `capture.json` is the contract — if it's missing, run `/wm-capture` first
- Screenshots in `_captures/<slug>/screenshots/` are the visual reference for layout decisions

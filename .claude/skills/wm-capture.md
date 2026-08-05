# /wm-capture

Fetch a live website, extract its design DNA, download assets, and store everything in `_captures/<slug>/`.

## Steps

1. **Ask for**: source URL and capture slug (e.g. `orbint` for orbint.de)

2. **Analyse the site** using WebFetch on the root URL:
   - Detect framework (meta generator, script hashes, file extensions)
   - Identify page sections (hero, nav, cards, footer, etc.)
   - List all linked CSS files

3. **Fetch CSS** and extract design tokens:
   - Background colours (`--bg`, `--bg-card`, etc.)
   - Text colours
   - Accent / brand colour
   - Border radius
   - Font families
   - Typography scale (if visible)

4. **Download assets** into `_captures/<slug>/assets/`:
   ```bash
   # Logo, hero images, partner logos — identified from HTML
   curl -L <url> -o _captures/<slug>/assets/<filename>
   ```

5. **Write `_captures/<slug>/CAPTURE.md`**:
   ```markdown
   # Capture: <Site Name>
   Source: <URL>
   Date: <today>
   Framework: <detected>

   ## Sections
   - Hero: <description>
   - Nav: <description>
   …

   ## Design Tokens
   ```json
   { …extracted tokens… }
   ```

   ## Assets
   - logo-white.png — top nav logo
   …
   ```

6. **Write `_captures/<slug>/tokens.json`** with clean JSON of all extracted tokens.

7. **Report** a summary: tokens found, assets downloaded, any gaps. Suggest next step: `/wm-instantiate <slug>`.

## Notes
- If the site uses a CDN or bundled CSS (hard to read), try inspecting `<style>` tags in the HTML
- Prefer fetching `/css/main.css`, `/assets/index.css`, or any stylesheet linked in `<head>`
- Assets go in `_captures/<slug>/assets/` NOT in `sites/` — instantiation copies them

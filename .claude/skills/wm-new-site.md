# /wm-new-site

Create a new site in the WebsiteMocker monorepo from the `_core/` template.

## Steps

1. **Gather inputs** (ask only what's missing):
   - `slug` — short lowercase identifier, e.g. `sfdy`, `orbint` (used in URL path and folder name)
   - `name` — display name, e.g. `"Starflight Dynamics"`
   - `accent` — primary brand colour as hex, e.g. `#3dffa0`
   - `email` — contact email address

2. **Run the scaffold script**:
   ```bash
   bash _scripts/new-site.sh "<slug>" "<Site Name>" "<#accent>" "<contact@email.com>"
   ```

3. **Install dependencies** at the repo root (workspaces will pick up the new site):
   ```bash
   npm install
   ```

4. **Verify the build**:
   ```bash
   cd sites/<slug> && npm run build
   ```
   Fix any Astro errors before proceeding.

5. **Update `wiring.json`** — confirm `stage: 1`, fill in any known values.

6. **Commit**:
   ```bash
   cd /path/to/WebsiteMocker
   git add sites/<slug>
   git commit -m "feat: scaffold site <slug>"
   git push
   ```

7. **Report** what was created and what to do next (`/wm-update-hero`, `/wm-init-keywords`, `/wm-wire`).

## Notes
- The new site's sandbox URL will be: `https://pbau3r-sfdy.github.io/WebsiteMocker/<slug>`
- Default tokens are generic dark-blue — update accent and fonts early via `Layout.astro`
- Logo: place in `sites/<slug>/public/images/logo-white.png`

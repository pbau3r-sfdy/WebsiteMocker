# /wm-instantiate

Create a new site whose layout is inspired by a capture but with a different brand applied.

## Steps

1. **Ask for**:
   - Capture slug (must exist in `_captures/`) — the layout donor
   - New site slug — the new project
   - New site name — display name
   - Brand brief — accent colour, font preference, key differences from source

2. **Run `/wm-new-site`** first to scaffold the base.

3. **Apply the capture's layout structure** to the new site:
   - Copy the section order from `_captures/<capture>/CAPTURE.md`
   - Adapt `src/pages/index.astro` to match that section structure
   - Replace source brand tokens with new brand tokens in `Layout.astro`

4. **Copy relevant assets** from `_captures/<capture>/assets/` → `sites/<slug>/public/images/`:
   - Hero background image (if re-using)
   - Partner logos (replace with new ones later)

5. **Update `wiring.json`** — set `stage: 1`, note the capture source in `notes`.

6. **Verify build** passes, commit, push.

7. **Report** differences from the source capture and what to customise next.

## Notes
- Never copy the source site's logo or brand-specific content
- Structural elements (card grid layout, section order, nav pattern) are fine to reuse
- New accent colour must pass WCAG AA contrast against the background

# /wm-update-hero

Update the hero section content on the home page.

## Steps

1. **Read** `src/pages/index.astro` and show current hero values:
   - Eyebrow text
   - Headline
   - Sub-headline
   - Primary CTA label and href
   - Hero background image path

2. **Ask** what to change (can be any subset).

3. **Apply changes** to `src/pages/index.astro`.

4. **Background image**: if a new image is provided, copy it to `public/images/` and update the CSS `background-image` URL.

5. **Mission section**: if provided, also update the mission text in the `#mission` section.

6. **Verify** build passes.

7. **Commit and push**:
   ```bash
   git add src/pages/index.astro public/images/
   git commit -m "content: update hero — <site>"
   git push
   ```

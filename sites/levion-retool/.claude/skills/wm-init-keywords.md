# /wm-init-keywords

Analyse this site's content and propose an initial `keywords.json`.

## Steps

1. **Read all content**:
   - `src/pages/index.astro` — hero, mission, contact text
   - All `src/content/news/*.md` posts
   - `wiring.json` — site name, domain, socials
   - Existing `keywords.json` (if any)

2. **Extract and propose**:
   - `brand.names` — all name variants (full name, acronym, shorthand)
   - `primary` — 3–5 core topic keywords central to the site's mission
   - `secondary` — 5–8 supporting keywords
   - `hashtags.twitter` — 3–5 hashtags, mix of popular and niche
   - `hashtags.linkedin` — 3–5 professional hashtags
   - `hashtags.instagram` — 5–8 hashtags, more casual
   - `seo.meta_description` — ≤160 chars
   - `seo.keywords` — 6–10 SEO terms
   - `people` — names mentioned prominently
   - `partners` — organisations mentioned
   - `locations` — cities/countries
   - `brand.avoid` — terms that conflict with the brand's tone or positioning

3. **Show the proposed `keywords.json`** and ask for approval or edits.

4. **Write** the approved version to `keywords.json`.

5. **Commit**:
   ```bash
   git add keywords.json
   git commit -m "feat: initialise keywords dictionary"
   git push
   ```

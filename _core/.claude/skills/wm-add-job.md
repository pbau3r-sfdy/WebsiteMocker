# /wm-add-job

Add a job listing to this site.

## Steps

1. **Gather** (ask for anything not provided):
   - Title (e.g. "Senior Backend Engineer")
   - Department (optional — e.g. "Engineering", "Product")
   - Location (e.g. "Berlin, Germany" or "Remote")
   - Type: `full-time`, `part-time`, or `contract`
   - Open: `true` or `false` (default: `true`)
   - Date (YYYY-MM-DD; default: today)
   - Body text — full job description in Markdown (responsibilities, requirements, what we offer)

2. **Generate slug** from the date and title:
   `YYYY-MM-DD-short-title-words` (lowercase, hyphens, no special chars, max ~40 chars)

3. **Write the Markdown file** at `src/content/jobs/<slug>.md`:
   ```markdown
   ---
   title: "<title>"
   department: "<department>"
   location: "<location>"
   type: "full-time"
   open: true
   date: "YYYY-MM-DD"
   ---

   <body text>
   ```
   - Omit `department` if not provided
   - `open` is a boolean — no quotes
   - `type` must be exactly one of: `full-time`, `part-time`, `contract`

4. **Brand signal check** (skip entirely if no `brand` key in `sites/<site-slug>/wiring.json`, or all brand arrays are empty):
   - Read `sites/<site-slug>/wiring.json` and check for the `brand` key. Determine the site slug from the context established in step 1 (or ask if ambiguous).
   - If the `brand` key is absent, or if `brand.hashtags`, `brand.vocabulary`, and `brand.avoid` are all empty arrays, continue silently to Step 5 — output nothing, do not mention the brand block.
   - When the brand block is present with at least one non-empty field, run the applicable sub-steps:

   **Note:** This is a narrower check than wm-add-news. Job listings have no `tags[]` frontmatter field, so hashtag enrichment does not apply. Only avoid scan and vocabulary nudge are performed.

   **Sub-step A — Avoid scan** (runs when `brand.avoid` is non-empty):
   - Perform a case-insensitive plain string match of each `brand.avoid` term against the full draft body text.
   - If any term matches, surface a warning for each one: "⚠ Draft contains '[matched term]' which is on your avoid list. Continue anyway? (y/N)" — default N.
   - This is non-blocking: if the operator confirms (y), proceed without removing the term. Never block the commit based on avoid matches.

   **Sub-step B — Vocabulary nudge** (runs when `brand.vocabulary` is non-empty):
   - Review the draft body text for concepts that could be expressed using a `brand.vocabulary` term.
   - If a match opportunity is found, note it as a suggestion: "Suggestion: consider using '[vocabulary term]' here."
   - This is informational only — the operator always wins. Do not loop or repeat suggestions.

   **Hashtag enrichment:** Not applicable to job listings — job listings have no `tags[]` frontmatter field, so `brand.hashtags` is not consulted and no hashtag suggestions are made. Do not offer to add hashtags to the brand kit.

   **Voice field:** Do not read or act on the `voice` field in this step — it is informational only in Phase 3.

5. **Commit and push**:
   ```bash
   git add src/content/jobs/<slug>.md
   git commit -m "content(<site-slug>): add job — <title>"
   git push
   ```

6. **Report**: confirm file path and remind operator that the site rebuilds on next deploy or `/wm-publish` run.

## Notes
- Date MUST be a quoted string: `date: "YYYY-MM-DD"` — both unquoted and quoted dates work at build time, but quoted dates work when contributors edit via GitHub web UI
- `department` is optional — omit the field entirely if not applicable
- Closed jobs (`open: false`) are excluded from the default /jobs list but still build correctly
- All other fields (title, location, type, date) are required

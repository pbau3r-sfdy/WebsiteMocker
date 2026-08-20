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

4. **Commit and push**:
   ```bash
   git add src/content/jobs/<slug>.md
   git commit -m "content(<site-slug>): add job — <title>"
   git push
   ```

5. **Report**: confirm file path and remind operator that the site rebuilds on next deploy or `/wm-publish` run.

## Notes
- Date MUST be a quoted string: `date: "YYYY-MM-DD"` — both unquoted and quoted dates work at build time, but quoted dates work when contributors edit via GitHub web UI
- `department` is optional — omit the field entirely if not applicable
- Closed jobs (`open: false`) are excluded from the default /jobs list but still build correctly
- All other fields (title, location, type, date) are required

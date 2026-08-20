# /wm-add-announcement

Add an announcement to this site.

## Steps

1. **Gather** (ask for anything not provided):
   - Title
   - Date (YYYY-MM-DD; default: today)
   - Summary — one sentence shown on the announcement card
   - Tags (optional — list of strings, e.g. `["partnership", "milestone"]`)
   - Body text — full announcement content in Markdown

2. **Generate slug** from the date and title:
   `YYYY-MM-DD-short-title-words` (lowercase, hyphens, no special chars, max ~40 chars)

3. **Write the Markdown file** at `src/content/announcements/<slug>.md`:
   ```markdown
   ---
   title: "<title>"
   date: "YYYY-MM-DD"
   summary: "<one-sentence summary>"
   tags: ["tag1", "tag2"]
   ---

   <body text>
   ```
   - Omit `tags` if none provided

4. **Commit and push**:
   ```bash
   git add src/content/announcements/<slug>.md
   git commit -m "content(<site-slug>): add announcement — <title>"
   git push
   ```

5. **Report**: confirm file path and remind operator that the site rebuilds on next deploy or `/wm-publish` run.

## Notes
- Date MUST be a quoted string: `date: "YYYY-MM-DD"` — both unquoted and quoted dates work at build time, but quoted dates work when contributors edit via GitHub web UI
- Tags are optional — omit the field entirely if not applicable
- All other fields (title, date, summary) are required
- Never copy-paste content that may be under copyright without the user's confirmation

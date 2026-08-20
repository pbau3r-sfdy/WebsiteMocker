# /wm-add-news

Add a news post to this site.

## Steps

1. **Gather** (ask for anything not provided):
   - Title
   - Date (YYYY-MM-DD; default: today)
   - Summary — one sentence shown on the news card
   - Body text — full article content in Markdown
   - Image path(s) — local file paths the user will provide, or "none"
   - Image credit — optional attribution line

2. **Generate slug** from the date and title:
   `YYYY-MM-DD-short-title-words` (lowercase, hyphens, no special chars, max ~40 chars)

3. **Copy any images** to `public/images/news/`:
   - If the user provides a file path, copy it: `cp <source> public/images/news/<filename>`
   - Rename to something clean: `YYYY-MM-DD-keyword.jpg`

4. **Write the Markdown file** at `src/content/news/<slug>.md`:
   ```markdown
   ---
   title: "<title>"
   date: "YYYY-MM-DD"
   summary: "<one-sentence summary>"
   image: "/images/news/<filename>.jpg"
   imageCredit: "<credit>"
   tags: ["tag1", "tag2"]
   ---

   <body text>
   ```

5. **Draft a social post** using the site's `keywords.json`:
   - Pull primary hashtags for the platform (Twitter: ≤3, LinkedIn: ≤4)
   - Keep it ≤280 chars for Twitter
   - Include the sandbox URL

6. **Commit and push**:
   ```bash
   git add src/content/news/<slug>.md public/images/news/
   git commit -m "content(<slug>): add news — <title>"
   git push
   ```

7. **Report**: file path, social post draft, and note that the site rebuilds on next deploy or `/wm-publish` run.

## Notes
- Date MUST be a quoted string: `date: "YYYY-MM-DD"` — both unquoted and quoted dates work at build time, but quoted dates work when contributors edit via GitHub web UI
- Images are optional — the NewsCard handles missing images gracefully
- Tags are optional — include as a list of strings or omit the field
- Never copy-paste content that may be under copyright without the user's confirmation

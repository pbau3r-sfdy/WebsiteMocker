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
   date: YYYY-MM-DD
   summary: "<one-sentence summary>"
   image: "/images/news/<filename>.jpg"
   imageCredit: "<credit>"
   ---

   <body text>
   ```

5. **Verify** the build passes:
   ```bash
   npm run build
   ```

6. **Draft a social post** using the site's `keywords.json`:
   - Pull primary hashtags for the platform (Twitter: ≤3, LinkedIn: ≤4)
   - Keep it ≤280 chars for Twitter
   - Include the sandbox URL

7. **Commit and push**:
   ```bash
   git add src/content/news/<slug>.md public/images/news/
   git commit -m "content(<slug>): add news — <title>"
   git push
   ```

8. **Report**: live URL after deploy, social post draft.

## Notes
- Date format in frontmatter MUST be `YYYY-MM-DD` (no quotes unless using Zod date)
- Images are optional — the NewsCard handles missing images gracefully
- Never copy-paste content that may be under copyright without the user's confirmation

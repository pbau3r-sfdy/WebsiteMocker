# /wm-add-blog

Add a blog post to this site.

## Steps

1. **Gather** (ask for anything not provided):
   - Title
   - Date (YYYY-MM-DD; default: today)
   - Author (optional — defaults to site name if omitted)
   - Summary — one sentence shown on the blog card
   - Image path (optional — local file the user provides; will be copied to `public/images/blog/`)
   - Tags (optional — list of strings)
   - Body text — full post content in Markdown

2. **Generate slug** from the date and title:
   `YYYY-MM-DD-short-title-words` (lowercase, hyphens, no special chars, max ~40 chars)

3. **Copy any images** to `public/images/blog/`:
   - If the user provides a file path, copy it: `cp <source> public/images/blog/<filename>`
   - Rename to something clean: `YYYY-MM-DD-keyword.jpg`

4. **Write the Markdown file** at `src/content/blog/<slug>.md`:
   ```markdown
   ---
   title: "<title>"
   date: "YYYY-MM-DD"
   author: "<author>"
   summary: "<one-sentence summary>"
   image: "/images/blog/<filename>.jpg"
   tags: ["tag1", "tag2"]
   ---

   <body text>
   ```
   - Omit `author` if not provided
   - Omit `image` if no image
   - Omit `tags` if none provided

5. **Commit and push**:
   ```bash
   git add src/content/blog/<slug>.md public/images/blog/
   git commit -m "content(<site-slug>): add blog post — <title>"
   git push
   ```

6. **Report**: confirm file path and remind operator that the site rebuilds on next deploy or `/wm-publish` run.

## Notes
- Date MUST be a quoted string: `date: "YYYY-MM-DD"` — both unquoted and quoted dates work at build time, but quoted dates work when contributors edit via GitHub web UI
- Images are optional — the BlogCard handles missing images gracefully
- Author and tags are optional — omit fields entirely if not applicable
- Never copy-paste content that may be under copyright without the user's confirmation

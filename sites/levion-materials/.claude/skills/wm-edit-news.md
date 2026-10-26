# /wm-edit-news

Edit an existing news post.

## Steps

1. **List all posts**: read `src/content/news/*.md`, display as numbered list with date and title.

2. **Ask** which post to edit.

3. **Show** current frontmatter and body. Ask what to change.

4. **Apply edits** to the file.

5. **Handle image changes**: if the image field changes, copy the new file to `public/images/news/`.

6. **Verify** build passes.

7. **Commit and push**:
   ```bash
   git add src/content/news/<slug>.md
   git commit -m "content: update news — <title>"
   git push
   ```

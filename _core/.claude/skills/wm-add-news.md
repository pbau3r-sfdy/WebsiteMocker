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

5. **Brand signal check** (skip entirely if no `brand` key in `sites/<site-slug>/wiring.json`, or all brand arrays are empty):
   - Read `sites/<site-slug>/wiring.json` and check for the `brand` key. Determine the site slug from the context established in step 1 (or ask if ambiguous).
   - If the `brand` key is absent, or if `brand.hashtags`, `brand.vocabulary`, and `brand.avoid` are all empty arrays, continue silently to Step 6 — output nothing, do not mention the brand block.
   - When the brand block is present with at least one non-empty field, run the applicable sub-steps:

   **Sub-step A — Hashtag suggestions** (runs when `brand.hashtags` is non-empty):
   - Present: "Your brand kit includes: [list]. Add any of these as tags for this post?"
   - Operator picks applicable tags or proposes different ones.
   - After the operator finalises the tags list, identify any tags that are NOT already in `brand.hashtags`.
   - For each new tag, ask individually: "Add '[tag]' to your brand hashtag kit? (y/N)" — default is N (operator must explicitly type y or yes).
   - If the operator confirms any additions, stage those updates to `brand.hashtags` in memory; they will be written to `wiring.json` in the commit step (Step 7).
   - After all confirmations: immediately write confirmed additions to `wiring.json brand.hashtags` on disk (do not defer to the commit step) — this prevents silent loss if the session is interrupted between the brand check and commit.

   **Sub-step B — Avoid scan** (runs when `brand.avoid` is non-empty):
   - Perform a case-insensitive plain string match of each `brand.avoid` term against the full draft body text.
   - If any term matches, surface a warning for each one: "⚠ Draft contains '[matched term]' which is on your avoid list. Continue anyway? (y/N)" — default N.
   - This is non-blocking: if the operator confirms (y), proceed without removing the term. Never block the commit based on avoid matches.

   **Sub-step C — Vocabulary nudge** (runs when `brand.vocabulary` is non-empty):
   - Review the draft body text for concepts that could be expressed using a `brand.vocabulary` term.
   - If a match opportunity is found, note it as a suggestion: "Suggestion: consider using '[vocabulary term]' here."
   - This is informational only — the operator always wins. Do not loop or repeat suggestions.

   **Voice field:** Do not read or act on the `voice` field in this step — it is informational only in Phase 3.

6. **Draft a social post**:
   - Hashtag source priority:
     1. `wiring.json brand.hashtags` (if non-empty) — use these as the hashtag source for the social draft
     2. `keywords.json hashtags.<platform>` — fallback only when the brand block is absent or `brand.hashtags` is empty
   - Do not combine both sources in a single prompt — pick one source, not both.
   - Pull the applicable hashtags for the platform (Twitter: ≤3, LinkedIn: ≤4)
   - Keep it ≤280 chars for Twitter
   - Include the sandbox URL

7. **Commit and push**:
   ```bash
   # If brand.hashtags was updated during Step 5, include wiring.json:
   git add src/content/news/<slug>.md public/images/news/ sites/<site-slug>/wiring.json
   # If wiring.json was NOT changed, omit it to keep git history clean:
   git add src/content/news/<slug>.md public/images/news/
   git commit -m "content(<slug>): add news — <title>"
   git push
   ```
   Before running git add, re-read `wiring.json brand.hashtags` to confirm confirmed additions are present; if a session interruption discarded them, re-apply from the operator's confirmation before staging.

8. **Report**: file path, social post draft, and note that the site rebuilds on next deploy or `/wm-publish` run.

## Notes
- Date MUST be a quoted string: `date: "YYYY-MM-DD"` — both unquoted and quoted dates work at build time, but quoted dates work when contributors edit via GitHub web UI
- Images are optional — the NewsCard handles missing images gracefully
- Tags are optional — include as a list of strings or omit the field
- Never copy-paste content that may be under copyright without the user's confirmation

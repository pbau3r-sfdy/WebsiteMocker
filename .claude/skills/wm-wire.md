# /wm-wire

Interactive wizard to configure all external service connections for a site.
Walks through each service in sequence and updates `wiring.json` and source files.

## Steps

1. **Identify the site** (ask if ambiguous).

2. **Read current `wiring.json`** to see what's already configured.

3. **Walk through each service** — for each, ask "Configure now, skip for later, or mark as not needed?":

### Newsletter
   - Ask: which service? (Mailchimp / Brevo / Beehiiv / Tally / Other)
   - Ask: endpoint URL or list ID
   - Update the `action` attribute in `src/pages/index.astro` newsletter form
   - Update `wiring.json` newsletter block
   - Test: confirm the form `action` URL is reachable

### Contact form
   - Ask: which service? (Tally / Formspree / Other)
   - Ask: form ID or endpoint
   - Update `src/pages/index.astro` contact form (if present)
   - Update `wiring.json` forms.contact block

### Social handles
   - Ask: Twitter / X handle (e.g. `@sfdy_space`)
   - Ask: LinkedIn company slug
   - Ask: Instagram handle
   - Update `Footer.astro` social links
   - Update `keywords.json` brand.handles
   - Update `wiring.json` socials block

### Domain
   - Ask: production domain (e.g. `starflight-dynamics.com`)
   - Update `wiring.json` domain field (do NOT change `astro.config.mjs` yet — that's for `/wm-deploy-production`)

### Brand block
   Ask: "Configure now, skip for later, or mark as not needed?"

   **Configure now:**
   - Check `wiring.json` for a `brand` key:

     **First-run path** (no `brand` key, or `brand` exists but all four sub-keys are empty arrays / empty string):
     - Read available signals from the following sources — skip any source that is absent without error:
       1. `wiring.json` `name` and `domain` — always present
       2. `_captures/<capture-value>/CAPTURE.md` and/or `capture.json` — only if `wiring.json capture` field is **non-null**; skip entirely without error if `capture` is null (e.g. mogwai-systems)
       3. `sites/<slug>/keywords.json` — if the file exists, read `brand.avoid`, `hashtags.twitter`, `hashtags.linkedin`, `hashtags.instagram`, and `primary`/`secondary` terms; skip without error if the file does not exist
       4. `src/content/**/*.md` — scan existing content files for recurring `tags[]` values as additional hashtag signals
     - Using extracted signals, generate a pre-filled JSON template:
       - `hashtags`: combine capture hashtags and keywords.json hashtag fields, deduplicated, without `#` prefix
       - `vocabulary`: keywords.json `primary`/`secondary` terms and prominent terminology from captured page text
       - `avoid`: keywords.json `brand.avoid` if present, empty array if absent
       - `voice`: one sentence inferred from the site name and captured page tone; empty string if no signals are available
     - Print the template to the operator with this exact instruction line:
       > "Here is your brand kit template for [name] — pre-filled with signals from the codebase. Take this to Claude.ai and ask Claude to help you refine and complete it. Then paste the finished JSON back here."
       ```json
       {
         "hashtags": ["<extracted>"],
         "vocabulary": ["<extracted>"],
         "avoid": ["<extracted-if-any>"],
         "voice": "<brief descriptor>"
       }
       ```
     - Wait for operator to paste the completed JSON back
     - **Validate before writing:** confirm exactly four keys are present (`hashtags`, `vocabulary`, `avoid`, `voice`); `hashtags`, `vocabulary`, and `avoid` must be JSON arrays (even if empty); `voice` must be a string. If any field fails validation, report the exact field name and the expected type, then wait for a corrected paste. Do not write until validation passes.
     - Write the validated object as the value of the `brand` key in `wiring.json` (replacing the empty stub if one exists)

     **Subsequent-run path** (brand block exists AND at least one field is non-empty):
     - Read `wiring.json` `last_deploy` field; compare it to today's date as a YYYY-MM-DD string
     - If `last_deploy` matches today: skip the "has anything changed?" prompt; tell the operator what fields are currently set and proceed directly to any field update they request
     - If `last_deploy` is older than today (or absent): ask "Has anything in your brand voice or hashtags changed since you last ran /wm-wire?"; apply any changes the operator provides and write the updated brand block

   **Skip for later:** leave the `brand` key as-is (empty stub or absent). Does not block stage advancement.

   **Not needed:** write `{ "hashtags": [], "vocabulary": [], "avoid": [], "voice": "", "status": "skipped" }` as the brand block value — the `status` field marks it as intentionally skipped. Content skills will treat all-empty arrays as a silent pass-through. Counts as done for stage advancement.

4. **Advance stage** in `wiring.json` if all services are configured or skipped:
   - All sections done → set `stage: 3`
   - **Brand block does NOT gate stage advancement.** "Skip for later" and "Not needed" both count as done. A site with an empty brand stub also counts — brand block is optional enrichment, never a prerequisite.

5. **Commit** all changes:
   - `git add` all files changed during this run
   - If the brand block was written or updated during this run, include `sites/<slug>/wiring.json` in the `git add` command
   - `git commit -m "feat(<slug>): wire services"`

6. **Report** summary of what was configured and what still needs attention.

## Notes
- "Skip for later" leaves the field null — not counted against stage advancement
- "Not needed" writes the full-schema stub with `status: "skipped"` — counts as done for stage purposes
- Tally forms are embedded as iframes OR via redirect URLs — ask the operator which they prefer
- Brand block is optional enrichment — sites without a brand block (or with all-empty arrays) get no brand-aware behaviour in content skills; /wm-wire is not required before using content skills

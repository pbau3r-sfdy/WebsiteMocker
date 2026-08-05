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

4. **Advance stage** in `wiring.json` if all services are configured or skipped:
   - All three sections done → set `stage: 3`

5. **Commit** all changes with message `feat(<slug>): wire services`.

6. **Report** summary of what was configured and what still needs attention.

## Notes
- "Skip for later" leaves the field null — not counted against stage advancement
- "Not needed" sets `status: "skipped"` — counts as done for stage purposes
- Tally forms are embedded as iframes OR via redirect URLs — ask the operator which they prefer

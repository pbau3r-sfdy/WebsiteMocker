# /wm-reserve-socials

Research and recommend social media handles for this site, then guide registration.

## Steps

1. **Read** `keywords.json` and `wiring.json` for brand names and existing handles.

2. **Generate 4–5 handle candidates**:
   - Derived from the brand name (short, lowercase, no special chars except `_`)
   - Works as a hashtag
   - Consistent across platforms

3. **Check availability** by attempting to fetch:
   - `https://twitter.com/<handle>` — 404 = available, 200 = taken
   - `https://instagram.com/<handle>/` — same
   - `https://linkedin.com/company/<handle>` — same
   
   Report each platform's status for each candidate.

4. **Recommend** the best available handle (available on all 3 platforms preferred).

5. **Provide registration URLs**:
   - Twitter: `https://twitter.com/signup`
   - Instagram: `https://www.instagram.com/accounts/emailsignup/`
   - LinkedIn: `https://www.linkedin.com/company/setup/new/`

6. **Wait for confirmation** — ask the user: "Please register these handles and confirm when done."

7. **Wire** once confirmed:
   - Update `wiring.json` socials block with all handles and `status: "configured"`
   - Update `src/components/Footer.astro` social links
   - Update `keywords.json` brand.handles
   - Commit: `feat: wire social handles`
   - Advance stage to 3 if other wiring is complete.

## Important
- Handle registration requires human verification — this skill researches and guides, it cannot register accounts.
- Aim for the same handle on all platforms for brand consistency.

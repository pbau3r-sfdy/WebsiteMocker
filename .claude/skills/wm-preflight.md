# /wm-preflight

Run a full readiness checklist for a site before deploying or advancing its maturity stage.

## Checklist

For the specified site (`sites/<slug>/`), check each item and report PASS / FAIL / WARN:

### Build
- [ ] `npm run build` completes with no errors
- [ ] No TypeScript errors

### Content
- [ ] No `{{PLACEHOLDER}}` strings remaining in any source file
- [ ] Hero headline, sub, and eyebrow are filled in
- [ ] At least 1 news post exists (for stage ≥ 2)
- [ ] All image references in Markdown point to existing files in `public/images/`

### Wiring (`wiring.json`)
- [ ] `stage` reflects actual progress
- [ ] `domain` set (for stage ≥ 5)
- [ ] Newsletter endpoint is not the Formspree placeholder
- [ ] Contact form ID is set (for stage ≥ 3)
- [ ] Socials configured or explicitly skipped (for stage ≥ 3)

### Legal (for stage ≥ 4)
- [ ] `imprint.astro` contains no `—` placeholder lines
- [ ] `privacy.astro` `last_updated` date is within 12 months
- [ ] `legal.impressum === "complete"` in `wiring.json`
- [ ] `legal.privacy === "complete"` in `wiring.json`

### Keywords
- [ ] `keywords.json` has at least 3 primary keywords
- [ ] Hashtag arrays are non-empty

### Report format
Print each section header, then each item as `✓`, `✗`, or `⚠`. Finish with a summary line and the recommended next action.

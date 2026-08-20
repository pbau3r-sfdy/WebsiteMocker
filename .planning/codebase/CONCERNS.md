# Codebase Concerns

**Analysis Date:** 2026-08-20

---

## Tech Debt

**Missing production publish workflow:**
- Issue: `publish.yml` is explicitly marked `[TODO]` in `CLAUDE.md`. No automated pipeline exists to build and push a site to its production GitHub repo. Every production deploy is a fully manual, undocumented sequence of commands.
- Files: `.github/workflows/` (file absent), `CLAUDE.md:163`
- Impact: Risk of deployment errors, missing env vars, or wrong base path in production builds. No audit trail.
- Fix approach: Create `.github/workflows/publish.yml` with a `workflow_dispatch` trigger accepting a `slug` input, running `SITE_URL=https://<domain> SITE_BASE=/ npm run build -- <slug>`, then pushing `dist/<slug>/` to the `gh-pages` branch of the production repo.

**`[websites-org]` placeholder never resolved in CLAUDE.md:**
- Issue: `CLAUDE.md` still contains the literal text `[websites-org]` as a placeholder for the GitHub organisation, with a note saying "replace with the actual org name once created." All production repos already exist under `pbau3r-sfdy`, so the org is resolved but the docs are not updated.
- Files: `CLAUDE.md:12`, `CLAUDE.md:86`, `CLAUDE.md:91`, `CLAUDE.md:93`
- Impact: New contributors or agent skills reading CLAUDE.md will be confused about where to push.
- Fix approach: Replace every `[websites-org]` with `pbau3r-sfdy` and remove the warning note.

**`wiring.json` uses both `"slug"` and `"site"` as identifier fields:**
- Issue: Older sites use `"site"` as the identifier key; newer sites added a `"slug"` key. Some sites have both, some have only one. The dashboard works around this by using `_slug` (the directory name) as the canonical key, ignoring both fields for routing. Scripts like `rename-site.mjs` update both keys when present.
- Files: `sites/orbint/wiring.json`, `sites/crestworks/wiring.json`, `sites/tnt-ventures/wiring.json`, `sites/parrot-capital/wiring.json`, `sites/mogwai-systems/wiring.json` (use `"site"` only); `sites/sfdy-alt-clean/wiring.json`, `sites/levion/wiring.json` (use `"slug"` only)
- Impact: Any script that reads `wiring.slug` directly (e.g. a future skill) will silently get `undefined` for half the sites.
- Fix approach: Standardise on `"slug"` as the only identifier field, removing `"site"`. Update scripts and skills accordingly.

**Template sites build in every CI run (wasted CI time):**
- Issue: `build-all.js` only skips sites where `skip_ci: true` is set in `wiring.json`. Template sites (`hypersonica`, `orbint`, `tnt-ventures`) have `"template": true` but no `"skip_ci": true`. They build on every push to `main` even though they have no production path and contain placeholder content.
- Files: `sites/hypersonica/wiring.json`, `sites/orbint/wiring.json`, `sites/tnt-ventures/wiring.json`, `_scripts/build-all.js:41-44`
- Impact: Unnecessary CI build time. A broken template site fails the entire CI run.
- Fix approach: Either (a) add `"skip_ci": true` to each template site's `wiring.json`, or (b) modify `build-all.js` to also skip sites where `template === true`.

**`rename-site.mjs` uses CWD-relative root resolution:**
- Issue: `rename-site.mjs` uses `resolve('.')` to determine the repo root. All other scripts use `join(fileURLToPath(import.meta.url), '..', '..')` which is script-relative and CWD-independent.
- Files: `_scripts/rename-site.mjs:14`
- Impact: Running `node _scripts/rename-site.mjs` from any directory other than the repo root will silently target the wrong directory tree, potentially corrupting files.
- Fix approach: Replace `const root = resolve('.')` with `const root = join(fileURLToPath(import.meta.url), '..', '..')` as used in `build-all.js` and `fetch-perf-data.mjs`. Same fix applies to `apply-triage.mjs` (line `const root = resolve('.')`).

**`crestworks/keywords.json` retains stale pre-rename site name:**
- Issue: `crestworks` was renamed from `crestworks-rework`. Its `keywords.json` still has `"site": "crestworks-rework"` and a placeholder meta description.
- Files: `sites/crestworks/keywords.json`
- Impact: Any skill reading `keywords.json.site` for the live crestworks site gets the wrong name. SEO meta description is a placeholder.
- Fix approach: Update `"site"` to `"crestworks"`, update `seo.meta_description` to the real tagline, run `/wm-init-keywords`.

---

## Known Bugs

**`levion/astro.config.mjs` has conflicting `site` and `base` values:**
- Symptoms: `site: 'https://www.levion-materials.com'` (production domain) paired with `base: '/WebsiteMocker/levion'` (sandbox path). Astro uses `site` to generate canonical URLs. This makes every canonical URL point to `https://www.levion-materials.com/WebsiteMocker/levion/...` — a URL that does not exist.
- Files: `sites/levion/astro.config.mjs`
- Trigger: Every sandbox build of levion.
- Workaround: levion is archived (`skip_ci: true`) so it does not build in CI currently. Issue would surface if un-archived.

---

## Security Considerations

**Web3Forms access key hardcoded in source:**
- Risk: `sites/sfdy-alt-clean/src/pages/contact.astro:46` contains `value="9989c0a0-65ba-45e5-aebf-c070acaaf430"` as a hidden form input. This key is committed to the git repository (public repo) and will be visible in the built HTML of every sandbox and production deploy.
- Files: `sites/sfdy-alt-clean/src/pages/contact.astro:46`
- Current mitigation: Web3Forms public access keys are designed to be client-side and per-domain whitelisted, so exposure is by design for this service. However the key is committed to git, meaning it is permanent in git history even if rotated.
- Recommendations: Accept as low-risk given the service model, but document the key in `wiring.json` for traceability. If the key ever needs rotating, remember it exists in git history and must be treated as permanently exposed.

**Mailchimp subscribe URL with account identifiers hardcoded in source:**
- Risk: `sites/sfdy-alt-clean/src/components/Newsletter.astro:5` hardcodes the full Mailchimp subscribe POST URL including `u=fdebab77920a5ad885afd229c` (account hash) and `id=88bca13b57` (audience ID). This is committed to the public git repository.
- Files: `sites/sfdy-alt-clean/src/components/Newsletter.astro:5`
- Current mitigation: Mailchimp embed URLs are public-facing by design; they appear in every rendered page's HTML. Low operational risk.
- Recommendations: Document in `wiring.json.newsletter` (already done with `audience_id` and `server`). No action required for security, but consolidate the URL construction into a single place (e.g. derive from wiring.json values at build time) to avoid drift if the audience changes.

**Placeholder Formspree endpoints rendered in built HTML:**
- Risk: `sites/levion/src/components/Footer.astro:26`, `sites/levion/src/pages/contact.astro:61`, `sites/sfdy/src/pages/index.astro:49`, `sites/sfdy/src/pages/investors.astro:40`, and `sites/orbint/src/pages/index.astro:174` all render `action="https://formspree.io/f/placeholder"` in their form tags. Any visitor who submits these forms sends data to Formspree's generic placeholder endpoint (which likely rejects or discards submissions — but the user receives no error).
- Files: see above
- Current mitigation: `levion` and `sfdy` are archived (`skip_ci: true`) and do not deploy to sandbox. `orbint` is a template that does build and deploy to sandbox.
- Recommendations: Add `skip_ci: true` to `orbint` or replace placeholder IDs with a visible error state in the UI before any form is rendered without a real endpoint.

---

## Performance Bottlenecks

**No scheduled performance data fetch in CI:**
- Problem: `_scripts/fetch-perf-data.mjs` fetches Google PageSpeed Insights scores and writes to `_data/<slug>/perf.json`, which the dashboard reads. There is no scheduled GitHub Actions workflow to run this automatically. Performance history data only updates when someone manually runs `npm run perf`.
- Files: `_scripts/fetch-perf-data.mjs`, `.github/workflows/` (no scheduled workflow)
- Cause: `publish.yml` (which could trigger a perf fetch post-deploy) does not exist.
- Improvement path: Add a `schedule: cron` trigger in a new workflow (e.g. weekly) that runs `PSI_API_KEY=${{ secrets.PSI_API_KEY }} node _scripts/fetch-perf-data.mjs`, commits the updated `_data/` files, and pushes.

---

## Fragile Areas

**`build-all.js` continues on site failure but exits with code 1:**
- Files: `_scripts/build-all.js:135-140`, `_scripts/build-all.js:152-155`
- Why fragile: A single failing site does not abort the build — other sites continue building. However the process ultimately exits with code 1 if any site failed, which fails the CI workflow. This means a broken template or experiment site will block the sandbox deploy for ALL sites including live production-bound ones.
- Safe modification: The current approach is intentional (fail-fast at the workflow level while maximising diagnostic output). To reduce blast radius, give each template site `skip_ci: true`.
- Test coverage: No automated tests for build script logic.

**Dashboard reads `wiring.json` at Astro build time with no validation:**
- Files: `src/pages/index.astro:46-60`
- Why fragile: The dashboard iterates `sites/*/wiring.json` and silently falls back to `{ _slug: name, site: name, stage: 0 }` for any parse error or missing file. A malformed `wiring.json` will not fail the build but will silently render a ghost card with no data.
- Safe modification: Any change to a `wiring.json` should be validated with `JSON.parse` before committing. The dashboard does not surface parse errors to the user.
- Test coverage: None.

**`crestworks` (live, stage 6) contains placeholder content visible to real visitors:**
- Files: `sites/crestworks/src/components/Footer.astro:16`, `sites/crestworks/src/pages/privacy-policy.astro:56`
- Why fragile: The footer tagline "Crestworks Rework — placeholder tagline. Update via /wm-update-hero." renders on the live production site at `crestworks.co`. The privacy policy contains a `<p class="todo">Pending final legal review before go-live.</p>` section — the site is already live.
- Safe modification: Run `/wm-update-hero` to replace the footer tagline, and complete or remove the TODO paragraph in the privacy policy before the next production deploy.
- Test coverage: None.

**`crestworks-legacy/astro.config.mjs` targets the live production domain:**
- Files: `sites/crestworks-legacy/astro.config.mjs`
- Why fragile: `site: 'https://www.crestworks.co'` is the live production domain. This archived site is not env-aware. If someone accidentally runs a production build against `crestworks-legacy` (e.g. runs `node _scripts/build-all.js crestworks-legacy` without `skip_ci` protection), the output will claim to be the live crestworks.co site, potentially overwriting production.
- Safe modification: `crestworks-legacy` has `skip_ci: true`, so it won't build in CI. Do not remove `skip_ci: true`.
- Test coverage: None.

**`mogwai-systems` site has no `.claude/skills/` directory:**
- Files: `sites/mogwai-systems/` (directory only has `astro.config.mjs`, `keywords.json`, `package.json`, `public/`, `src/`, `wiring.json`)
- Why fragile: All other active sites have a `.claude/skills/` directory containing site-specific skill overrides. Without this, skills like `/wm-add-news` or `/wm-update-hero` will fall back to `_core/.claude/skills/` defaults which may not match the mogwai-systems structure.
- Safe modification: Scaffold a `.claude/skills/` directory by copying from another active site like `sites/sfdy-alt-clean/.claude/skills/`.
- Test coverage: None.

---

## Missing Critical Features

**No `publish.yml` workflow for production deploys:**
- Problem: Every production deployment is undocumented and manual. There is no `publish.yml` in `.github/workflows/` despite being listed in `CLAUDE.md` as a planned file.
- Blocks: Reliable, repeatable production deployments for `sfdy-alt-clean`, `mogwai-systems`, `parrot-capital`, and `crestworks`.

**No automated perf history collection:**
- Problem: `_scripts/fetch-perf-data.mjs` exists and works but is never called by any CI schedule. Dashboard perf scores go stale unless manually refreshed.
- Blocks: Meaningful perf trend tracking over time.

---

## Test Coverage Gaps

**No test suite exists:**
- What's not tested: `_scripts/build-all.js`, `_scripts/delete-site.mjs`, `_scripts/rename-site.mjs`, `_scripts/apply-triage.mjs`, `_scripts/fetch-perf-data.mjs`, dashboard `src/pages/index.astro` data parsing logic.
- Files: All files under `_scripts/` and `src/`
- Risk: Script regressions (e.g. a rename that corrupts `wiring.json`, a delete that removes the wrong directory) have no safety net. The only protection is the `--confirm` flag on `delete-site.mjs` and the dry-run default.
- Priority: Medium — scripts are simple and mostly linear, but the destructive operations (`delete-site.mjs`, `apply-triage.mjs --delete`) warrant at least smoke tests.

---

*Concerns audit: 2026-08-20*

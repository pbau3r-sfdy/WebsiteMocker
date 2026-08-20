# External Integrations

**Analysis Date:** 2026-08-20

## APIs & External Services

**Performance Monitoring:**
- Google PageSpeed Insights (PSI) API v5 — measures Lighthouse scores and Core Web Vitals per site
  - SDK/Client: native `fetch` in `_scripts/fetch-perf-data.mjs`
  - Endpoint: `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`
  - Auth: `PSI_API_KEY` env var (optional; unauthenticated calls allowed but rate-limited to ~2 req/s per IP)
  - Data written to: `_data/<slug>/perf.json` (90-entry rolling history)
  - Categories tracked: `performance`, `accessibility`, `seo`, `best-practices`

**Contact Forms:**
- Web3Forms — serverless form submission backend
  - Endpoint: `https://api.web3forms.com/submit`
  - Auth: Access key embedded in hidden form field (`<input type="hidden" name="access_key">`)
  - Used by: `sites/sfdy-alt-clean/src/pages/contact.astro`
- Formspree — serverless form backend
  - Endpoint: `https://formspree.io/f/<id>`
  - Used by: `sites/levion`, `sites/sfdy`, `sites/orbint` (template/legacy sites, with `placeholder` IDs — not production-configured)

**Newsletter:**
- Mailchimp — email list management
  - Integration: embedded signup form `action` URL pointing to Mailchimp's hosted form
  - Audience ID and server region stored in `wiring.json`: `audience_id: "88bca13b57"`, `server: "us17"`
  - Configured for: `sites/sfdy-alt-clean` (`wiring.json` `newsletter.status: "configured"`)

## Data Storage

**Databases:**
- Not applicable — all sites are fully static; no server-side database

**File Storage:**
- Local filesystem only
  - Design DNA captures: `_captures/<slug>/` (screenshots, assets, JSON)
  - Performance history: `_data/<slug>/perf.json`
  - Built output: `dist/` (transient, produced by build; committed to `gh-pages` branch by CI)

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- Not applicable — static sites with no user accounts or server-side auth
- Form auth is key-based (Web3Forms access key embedded at build time)

## Monitoring & Observability

**Error Tracking:**
- None

**Performance:**
- Google PageSpeed Insights — run manually via `npm run perf` or `npm run perf:build`
- Scores displayed on dashboard (`src/pages/index.astro`) by reading `_data/<slug>/perf.json`

**Logs:**
- `console.log` / `console.error` in build scripts; no structured logging

## CI/CD & Deployment

**Hosting:**
- Sandbox: GitHub Pages via `gh-pages` branch on `pbau3r-sfdy/WebsiteMocker`
  - URL: `https://pbau3r-sfdy.github.io/WebsiteMocker/<slug>/`
- Production (per live site): independent GitHub repos in `pbau3r-sfdy` org, each with their own `gh-pages` branch and custom domain
  - `sfdy-alt-clean` → `pbau3r-sfdy/starflight-dynamics` → `starflight-dynamics.com`
  - `mogwai-systems` → `pbau3r-sfdy/mogwai-systems` → `mogwai-systems.com`
  - `parrot-capital` → `pbau3r-sfdy/parrot-capital` → `parrot-capital.com`

**CI Pipeline:**
- GitHub Actions workflow: `.github/workflows/deploy.yml`
  - Trigger: push to `main` branch, or manual `workflow_dispatch`
  - Runner: `ubuntu-latest`, Node 22 LTS
  - Steps: checkout → setup Node 22 → `npm ci` → `node _scripts/build-all.js` → push `dist/` to `gh-pages` branch
  - Deploy action: `JamesIves/github-pages-deploy-action@v4.8.0` (branch-push mode, not workflow artifact mode)
  - Permissions: `contents: write` (to push to `gh-pages`)
  - Concurrency group: `pages` (cancel-in-progress: false — prevents overlapping deploys)
  - Sites with `skip_ci: true` in `wiring.json` are automatically excluded from CI builds

**Production Publish:**
- Manual process: build with `SITE_URL` + `SITE_BASE` env vars, push `dist/<slug>/` to the production repo's `gh-pages` branch
- Skill-defined workflow: `/wm-deploy` (`.claude/skills/wm-deploy.md`)
- No automated `publish.yml` workflow exists yet (documented as TODO in `CLAUDE.md`)

## Environment Configuration

**Required env vars (production site builds):**
- `SITE_URL` — full production origin (e.g. `https://parrot-capital.com`)
- `SITE_BASE` — URL base path (e.g. `/` for production root)

**Optional env vars:**
- `PSI_API_KEY` — Google PageSpeed API key for higher rate limits
- `SKIP_SITES` — comma-separated site slugs to skip during `build-all.js`

**Secrets location:**
- No secrets committed to the repo
- Web3Forms access key embedded in HTML source of `sites/sfdy-alt-clean/src/pages/contact.astro` (public key by design — Web3Forms keys are meant to be public)
- Mailchimp audience ID and server stored in `sites/sfdy-alt-clean/wiring.json` (non-secret configuration)

## Webhooks & Callbacks

**Incoming:**
- None — all sites are static; no server to receive webhooks

**Outgoing:**
- Contact form submissions: POST to `https://api.web3forms.com/submit` (triggered by user browser, not server)
- Newsletter signups: POST to Mailchimp hosted form URL (triggered by user browser)

## DNS & Domain Management

**Custom Domains (live sites):**
- `starflight-dynamics.com` — TLS via Let's Encrypt, managed via GitHub Pages custom domain on `pbau3r-sfdy/starflight-dynamics`
- `mogwai-systems.com` — GitHub Pages custom domain on `pbau3r-sfdy/mogwai-systems`
- `parrot-capital.com` — TLS via Let's Encrypt, HTTPS enforced on `pbau3r-sfdy/parrot-capital`

**Sandbox:**
- `pbau3r-sfdy.github.io/WebsiteMocker` — `robots.txt` set to `Disallow: /` (never indexed)

---

*Integration audit: 2026-08-20*

# Requirements: WebsiteMocker Upgrade Milestone

**Defined:** 2026-08-20
**Core Value:** A new branded website — from captured reference or Claude Design artifact to live GitHub Pages URL — should require zero manual stitching; WebsiteMocker handles ingestion, wiring, brand consistency, and deployment automatically.

## v1 Requirements

### Deploy Pipeline

- [ ] **DEPLOY-01**: Operator can run `/wm-publish <slug>` to build a site with production env vars (`SITE_URL`, `SITE_BASE`) and push built output to the corresponding production repo's `gh-pages` branch
- [x] **DEPLOY-02**: `publish.yml` validates `stage ≥ 5`, `domain`, and `prod_repo` are set in `wiring.json` before building — exits with a clear error if not
- [x] **DEPLOY-03**: `publish.yml` writes `CNAME` file (containing the production domain) into built output before pushing — custom domain does not reset on each deploy
- [x] **DEPLOY-04**: `publish.yml` replaces `robots.txt Disallow: /` with `Allow: /` before pushing — production site is indexable
- [x] **DEPLOY-05**: `publish.yml` updates `wiring.json` (`stage: 6`, `last_deploy`, `prod_repo`) after a successful push
- [x] **DEPLOY-06**: `publish.yml` builds only the targeted site (not all sites) via a new `_scripts/build-single.mjs <slug>` wrapper
- [ ] **DEPLOY-07**: Operator can generate a Squarespace DNS handoff guide for a site — CNAME record, apex A records, CAA check, SSL provisioning wait instructions, default-record-deletion warning
- [x] **DEPLOY-08**: Production deploy is authenticated via a Classic PAT (`WM_PUBLISH_PAT`) stored as an org-level Actions secret — `GITHUB_TOKEN` is not used for cross-repo push

### Content System

- [ ] **CONTENT-01**: All active sites are migrated from the Astro 4 legacy content API (`src/content/config.ts` + `post.render()`) to the Astro 5 Content Layer API (`src/content.config.ts` + `loader: glob()` + `render(entry)`)
- [ ] **CONTENT-02**: A canonical collection schema lives in `_core/src/content.config.ts` — all sites import from it; no schema drift between sites
- [ ] **CONTENT-03**: All collection schemas use `z.coerce.date()` (not `z.date()`) — quoted dates from non-technical contributors do not break CI
- [ ] **CONTENT-04**: Sites missing `src/content/` (`mogwai-systems`, `parrot-capital`) are scaffolded with `content.config.ts` before any content commands are run against them
- [ ] **CONTENT-05**: `news` content type: Astro content collection at `src/content/news/` — frontmatter fields: `title`, `date`, `summary`, `image`, `imageCredit`, `tags[]`; rendered at `/news/` (list) and `/news/[slug]/` (detail)
- [ ] **CONTENT-06**: `jobs` content type: Astro content collection at `src/content/jobs/` — frontmatter fields: `title`, `department`, `location`, `type` (full-time/part-time/contract), `open` (boolean), `date`; rendered at `/jobs/` (list, open-only by default) and `/jobs/[slug]/` (detail)
- [ ] **CONTENT-07**: `announcements` content type: Astro content collection at `src/content/announcements/` — frontmatter fields: `title`, `date`, `summary`, `tags[]`; rendered at `/announcements/` (list) and `/announcements/[slug]/` (detail)
- [ ] **CONTENT-08**: `blog` content type: Astro content collection at `src/content/blog/` — frontmatter fields: `title`, `date`, `author`, `summary`, `image`, `tags[]`; rendered at `/blog/` (list) and `/blog/[slug]/` (detail)
- [ ] **CONTENT-09**: `/wm-add-news`, `/wm-add-job`, `/wm-add-announcement`, `/wm-add-blog` skills: guided entry → write `.md` to content collection → commit → site rebuilds on next deploy
- [ ] **CONTENT-10**: New `.md` content files follow `YYYY-MM-DD-slug.md` naming convention and are editable via GitHub web UI without a local build step

### Brand Consistency

- [ ] **BRAND-01**: `brand` block added to `wiring.json` schema: `hashtags[]`, `vocabulary[]`, `avoid[]`, `voice` (string descriptor)
- [ ] **BRAND-02**: `/wm-wire` detects a missing `brand` block and prompts operator to build it interactively — outputs to `wiring.json`
- [ ] **BRAND-03**: `/wm-add-news` (and all content skills) read `brand.hashtags` and suggest them for post tagging; scan draft content against `brand.avoid` and surface any matches before committing

### Collaboration Infrastructure

- [ ] **COLLAB-01**: Each production repo ships with a `CONTRIBUTING.md` at first publish — defines two-tier model: direct push for `content/**/*.md` files; GitHub Issue for everything else (page edits, design changes, new pages, bugs)
- [ ] **COLLAB-02**: Three YAML Issue templates per production repo: `content-request.yml`, `design-change.yml`, `bug-report.yml` — `config.yml` disables blank issues
- [ ] **COLLAB-03**: GitHub Issues in production repos label design/page change requests automatically — operator triages them back into the WebsiteMocker sandbox pipeline
- [ ] **COLLAB-04**: Production repos use a two-branch model — `main` branch holds `content/**/*.md` files + `content-ci.yml`; `gh-pages` branch holds built output only
- [ ] **COLLAB-05**: `content-ci.yml` in each production repo dispatches WebsiteMocker's `publish.yml` when `content/**/*.md` files change on `main` — contributors push content, site rebuilds automatically

### Design Artifact Ingestion

- [ ] **INGEST-01**: `/wm-ingest <slug>` skill accepts a Claude Design HTML/CSS artifact (pasted or referenced); stages it in `_captures/<slug>/raw/`
- [ ] **INGEST-02**: Full-site ingest mode: extracts all sections from the artifact into Astro components in `sites/<slug>/src/components/`; rewires to `_core/` Layout, Nav, Footer; updates `astro.config.mjs`; preserves `BASE_URL` routing
- [ ] **INGEST-03**: Section/page ingest mode: extracts one page or section from the artifact and integrates it into an existing site without overwriting other pages; verifies routing and component integration
- [ ] **INGEST-04**: Ingest scans for CSS variable name collisions between the artifact and existing site CSS before applying — operator is shown conflicts and confirms before proceeding
- [ ] **INGEST-05**: Ingest copies all artifact images to `public/images/<slug>/` and rewrites `src` attributes to absolute paths; copies fonts to `public/fonts/` and rewrites CSS `url()` references
- [ ] **INGEST-06**: Ingest converts `<link rel="stylesheet">` CSS to `<style>` blocks within Astro components — never imports artifact CSS globally
- [ ] **INGEST-07**: After ingest, extracted CSS custom properties are surfaced as candidates for the site's `brand` block in `wiring.json`

## v2 Requirements

### Social Media Integration

- **SOCIAL-01**: `/wm-reserve-socials` extended — after reserving handles, operator can connect platform accounts to `wiring.json`
- **SOCIAL-02**: Content skills generate optional social media post drafts alongside `.md` files (Twitter/X, LinkedIn, Instagram captions)
- **SOCIAL-03**: `/wm-publish` optionally triggers social post drafts for review before a deploy goes live

### External Content Bindings

- **EXT-01**: `wiring.json` supports external content source bindings (RSS, API endpoints) for content types that pull from external services rather than local `.md` files
- **EXT-02**: Content skills detect external bindings and route accordingly — no `.md` file needed when an external source is configured

### Additional Content Types

- **CONTENT-V2-01**: `events` content type — with date, location, registration link
- **CONTENT-V2-02**: `testimonials` content type — structured quotes with attribution
- **CONTENT-V2-03**: `team` content type — team member profiles with role, bio, image

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend/database CMS | File-based only; no server-side persistence or runtime |
| Squarespace as hosting target | DNS bridge only; GitHub Pages is the sole production host |
| Visual drag-and-drop editor | Skills + code only; no browser UI builder |
| Alternative hosting (Vercel, Netlify, Docker) | GitHub Pages + Squarespace DNS is the only supported target for this milestone |
| Automated Squarespace DNS API changes | Squarespace does not expose a public DNS API; guide generates records to enter manually |
| Real-time collaborative editing | GitHub-based async contribution only |
| Branch protection "require signed commits" on production repos | Permanently incompatible with GitHub web UI editing |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEPLOY-01 | Phase 1 | Pending |
| DEPLOY-02 | Phase 1 | Pending |
| DEPLOY-03 | Phase 1 | Pending |
| DEPLOY-04 | Phase 1 | Pending |
| DEPLOY-05 | Phase 1 | Pending |
| DEPLOY-06 | Phase 1 | Pending |
| DEPLOY-07 | Phase 1 | Pending |
| DEPLOY-08 | Phase 1 | Pending |
| CONTENT-01 | Phase 2 | Pending |
| CONTENT-02 | Phase 2 | Pending |
| CONTENT-03 | Phase 2 | Pending |
| CONTENT-04 | Phase 2 | Pending |
| CONTENT-05 | Phase 2 | Pending |
| CONTENT-06 | Phase 2 | Pending |
| CONTENT-07 | Phase 2 | Pending |
| CONTENT-08 | Phase 2 | Pending |
| CONTENT-09 | Phase 2 | Pending |
| CONTENT-10 | Phase 2 | Pending |
| BRAND-01 | Phase 3 | Pending |
| BRAND-02 | Phase 3 | Pending |
| BRAND-03 | Phase 3 | Pending |
| COLLAB-01 | Phase 4 | Pending |
| COLLAB-02 | Phase 4 | Pending |
| COLLAB-03 | Phase 4 | Pending |
| COLLAB-04 | Phase 4 | Pending |
| COLLAB-05 | Phase 4 | Pending |
| INGEST-01 | Phase 5 | Pending |
| INGEST-02 | Phase 5 | Pending |
| INGEST-03 | Phase 5 | Pending |
| INGEST-04 | Phase 5 | Pending |
| INGEST-05 | Phase 5 | Pending |
| INGEST-06 | Phase 5 | Pending |
| INGEST-07 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 33 total
- Mapped to phases: 33 (Phase 1: 8, Phase 2: 10, Phase 3: 3, Phase 4: 5, Phase 5: 7)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-08-20*
*Last updated: 2026-08-20 after roadmap creation — traceability complete*

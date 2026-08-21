# AGENTS.md — WebsiteMocker

Skill-driven monorepo for creating, iterating, and deploying branded static websites.
GitHub repo: `pbau3r-sfdy/WebsiteMocker`
Dashboard: `https://pbau3r-sfdy.github.io/WebsiteMocker/`

## Project Context

See `.planning/PROJECT.md` for full project context, requirements, and decisions.
See `.planning/STATE.md` for current position, blockers, and session continuity.
See `.planning/ROADMAP.md` for the 5-phase execution plan.

**Core value:** A new branded website — from captured reference or Claude Design artifact to live GitHub Pages URL — should require zero manual stitching.

**Current focus:** Phase 1 — Production Deploy Pipeline

## GSD Workflow

This project uses the GSD (Get Shit Done) planning system. Plans are in `.planning/`.

### Execution rules (YOLO mode — auto-approve)

- Execute tasks from PLAN.md in order unless a blocker prevents it
- Commit atomically after each plan task completes
- If blocked, document in STATE.md and continue with unblocked tasks
- Update `.planning/STATE.md` after each session
- Mark requirements complete in REQUIREMENTS.md as phases finish

### Phase 1 Deliverables

Requirements: DEPLOY-01 through DEPLOY-08

Key work:
- Create `_scripts/build-single.mjs <slug>` (does not exist yet)
- Create `.github/workflows/publish.yml` (3-job: validate → build → push)
  - Job 1: Read `wiring.json`, gate on `stage ≥ 5`, `domain`, `prod_repo`
  - Job 2: `cd sites/<slug>` + `npm run build` with `SITE_URL`/`SITE_BASE` env vars; write `CNAME`; swap `robots.txt`
  - Job 3: `JamesIves/github-pages-deploy-action@v4.9.0` with `persist-credentials: false` + `WM_PUBLISH_PAT`
- Create `/wm-publish` skill wrapping `publish.yml` dispatch
- Create Squarespace DNS guide generator

## Repository Layout

```
WebsiteMocker/
├── _captures/           ← design DNA library
├── _core/               ← base template (all sites inherit)
├── _scripts/
│   ├── build-all.js     ← builds dashboard + all sites (do NOT use in publish.yml)
│   ├── build-single.mjs ← single-site production build (Phase 1)
│   └── init-prod-repo.mjs ← bootstrap a production repo for contributors
├── _templates/          ← production repo bundle (CONTRIBUTING.md, issue templates, content-ci.yml)
├── sites/
│   ├── sfdy-alt-clean/  ← Stage 2, has content collections
│   ├── sfdy/            ← Stage 2, has content collections
│   ├── mogwai-systems/  ← Stage 3, NO content collections yet (scaffold in Phase 2)
│   ├── parrot-capital/  ← Stage 4, NO content collections yet (scaffold in Phase 2)
│   ├── crestworks/      ← Stage 6, live, has content collections
│   └── levion/          ← Template, has content collections
├── .github/workflows/
│   ├── deploy.yml       ← sandbox deploy (every push to main) ✓ working
│   ├── publish.yml      ← production publish (created Phase 1)
│   └── content-sync.yml ← receives contributor content, no build, no publish (Phase 4)
├── src/pages/index.astro   ← dashboard
└── .planning/
    ├── PROJECT.md       ← project context and requirements
    ├── REQUIREMENTS.md  ← 33 v1 requirements
    ├── ROADMAP.md       ← 5-phase roadmap
    ├── STATE.md         ← current position + blockers
    ├── config.json      ← GSD config (yolo, coarse, parallel)
    ├── codebase/        ← codebase analysis (7 documents)
    └── research/        ← domain research (5 documents)
```

## Critical Technical Notes

### publish.yml non-obvious requirements
- **CNAME file**: Must write `echo "$DOMAIN" > dist/<slug>/CNAME` before JamesIves push — otherwise custom domain resets on every deploy
- **robots.txt**: Must overwrite `Disallow: /` with `Allow: /` before push — sandbox disallows indexing
- **PAT**: Use `WM_PUBLISH_PAT` (Classic PAT, `repo` scope) — `GITHUB_TOKEN` cannot push to a different repo
- **persist-credentials: false**: Must be set on `actions/checkout` step or PAT is silently overridden
- **build-single.mjs**: Must build only the target site, not all sites (do NOT use `build-all.js`)

### Collaboration infrastructure (Phase 4)
- **content-sync.yml is separate from publish.yml and must never build or deploy**: a contributor push syncs `.md` files into `sites/<slug>/src/content/` for operator review and stops; the live site is unchanged until the operator manually runs `/wm-publish <slug>`
- **publish.yml must not gain a `repository_dispatch` trigger**: it is invoked manually only; do not add `on: repository_dispatch` to publish.yml (D-A6)
- **`client_payload.slug` is attacker-controllable**: it must be passed through an `env:` var (`DISPATCH_SLUG`) and validated against `^[a-z0-9-]+$` before any shell or path use; never interpolate `github.event.client_payload.slug` directly into a `run:` body (T-04-01)
- **Sync uses `find -type f -name '*.md'`**: this excludes symlinks and non-Markdown files — do not replace with `cp -r` or any pattern that copies `.yml` or binary files into the WebsiteMocker source tree (T-04-02)
- **Sync is additive and never deletes**: a file removed from a production repo is not removed from WebsiteMocker; do not add a delete/prune step to content-sync.yml (D-A4)
- **Credential separation**: `WM_DISPATCH_PAT` (fine-grained, `contents: write` on `pbau3r-sfdy/WebsiteMocker` only) lives in each production repo's Actions secrets; `WM_PUBLISH_PAT` (Classic, `repo` scope) lives only in WebsiteMocker's secrets and must never be stored in a production repo
- **Labels must pre-exist before issue templates**: `init-prod-repo.mjs` creates labels in Step 1 before writing `.github/ISSUE_TEMPLATE/` files in Step 3; if order changes, GitHub silently drops template labels

### Content collections (Phase 2)
- Astro 5.18.2 is installed but legacy v2 API is still in use on all sites
- Migration: `src/content/config.ts` → `src/content.config.ts`; `post.render()` → `render(entry)` from `astro:content`; `z.date()` → `z.coerce.date()`
- Canonical schema will live in `_core/src/content.config.ts`
- `mogwai-systems` and `parrot-capital` have no `src/content/` at all — scaffold before adding any content

### Org name
- The production GitHub org is `pbau3r-sfdy`. Production repos live at `github.com/pbau3r-sfdy/`.

## Commands

```bash
npm run dev             # Dashboard dev server → localhost:4321
npm run build           # Build all sites → dist/
node _scripts/build-all.js <slug>   # Build one site + dashboard
node _scripts/build-single.mjs <slug>   # Production build for one site only
node _scripts/init-prod-repo.mjs <slug> [--confirm]   # Bootstrap production repo for contributors (dry-run by default)
cd sites/<slug> && npm run dev      # Site-specific dev server
```

## Site Maturity Stages

| # | Label | Criteria |
|---|-------|----------|
| 0 | Captured | `_captures/name/` exists |
| 1 | Instantiated | `sites/name/` created, build passes |
| 2 | Content Ready | All sections filled, ≥1 news post, no placeholders |
| 3 | Wired | Forms, newsletter, socials in `wiring.json` |
| 4 | Legal Complete | Impressum and privacy complete |
| 5 | Prod Ready | All checks pass, domain set, astro.config env-aware |
| 6 | Live | Published to production repo, custom domain active |

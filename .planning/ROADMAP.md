# Roadmap: WebsiteMocker — Upgrade Milestone

## Overview

WebsiteMocker already scaffolds and previews branded static sites in a sandbox. This milestone closes the remaining gaps: a one-command production deploy pipeline, a standardised Astro 5 content system editable by non-technical contributors, a brand consistency layer baked into `wiring.json`, a two-tier collaboration model for production repos, and a clean ingest pathway for Claude Design HTML/CSS artifacts. Phases execute in dependency order — the deploy pipeline unblocks everything else.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Production Deploy Pipeline** - One command takes a stage-5 site to a live GitHub Pages URL
- [x] **Phase 2: Content System** - All sites migrate to Astro 5 Content Layer API with four standardised collection types
- [x] **Phase 3: Brand Consistency** - Structured `brand` block in `wiring.json`; content skills enforce it at write time
- [ ] **Phase 4: Collaboration Infrastructure** - Production repos are contributor-ready with two-tier model and automated rebuilds
- [ ] **Phase 5: Design Artifact Ingestion** - Claude Design HTML/CSS artifacts become functioning Astro components without manual stitching

## Phase Details

### Phase 1: Production Deploy Pipeline
**Goal**: Operator can push any stage-5 site to a live production GitHub Pages URL with a single command
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05, DEPLOY-06, DEPLOY-07, DEPLOY-08
**Success Criteria** (what must be TRUE):
  1. Running `/wm-publish <slug>` on a stage-5 site pushes built output to the production repo's `gh-pages` branch and the site is live at the custom domain
  2. The deployed site has a `CNAME` file and `robots.txt Allow: /` — custom domain persists across redeployments and the site is indexable
  3. After a successful push, `wiring.json` is automatically updated to `stage: 6` with `last_deploy` and `prod_repo` fields
  4. Running `/wm-publish` on a site missing `stage ≥ 5`, `domain`, or `prod_repo` exits with a clear error before any build runs
  5. A Squarespace DNS handoff guide can be generated for any site — listing CNAME, apex A records, CAA check, SSL wait, and default-record-deletion warning
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Build pipeline core: build-single.mjs + publish.yml + CLAUDE.md/AGENTS.md doc updates
- [x] 01-02-PLAN.md — Operator skill: wm-publish.md with inline DNS guide + E2E verification checkpoint

### Phase 2: Content System
**Goal**: All active sites use the Astro 5 Content Layer API with four standardised content types, each editable by non-technical contributors via the GitHub web UI
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04, CONTENT-05, CONTENT-06, CONTENT-07, CONTENT-08, CONTENT-09, CONTENT-10
**Success Criteria** (what must be TRUE):
  1. All active sites build cleanly using `src/content.config.ts` with `loader: glob()` — no Astro 4 `src/content/config.ts` or `post.render()` remains in the codebase
  2. `mogwai-systems` and `parrot-capital` each have `content.config.ts` scaffolded and build without errors
  3. Operator can run `/wm-add-news`, `/wm-add-job`, `/wm-add-announcement`, or `/wm-add-blog` and the resulting `.md` file appears in the correct collection directory and is committed in one step
  4. Content files follow `YYYY-MM-DD-slug.md` naming and are editable via the GitHub web UI without requiring a local build step
**Plans**: 9 plans

Plans:
- [x] 02-01-PLAN.md — Schema foundation: _core content.config.ts (4 Zod schemas) + TagPill + TypeBadge
- [x] 02-02-PLAN.md — _core news migration (Astro 5 API) + _core jobs pages
- [x] 02-03-PLAN.md — _core announcements + blog pages (parallel with 02-02)
- [x] 02-04-PLAN.md — sfdy-alt-clean content.config.ts + news migration
- [x] 02-05-PLAN.md — mogwai-systems + parrot-capital content.config + content dirs scaffold
- [x] 02-06-PLAN.md — sfdy-alt-clean jobs + announcements + blog pages
- [x] 02-07-PLAN.md — mogwai-systems all 4 collection page templates
- [x] 02-08-PLAN.md — parrot-capital all 4 collection page templates (parallel with 02-07)
- [x] 02-09-PLAN.md — Content skills: update wm-add-news + create wm-add-job/announcement/blog

### Phase 3: Brand Consistency
**Goal**: Every active site has a structured `brand` block in `wiring.json` that content skills read and enforce at write time
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: BRAND-01, BRAND-02, BRAND-03
**Success Criteria** (what must be TRUE):
  1. `wiring.json` for every active site contains a `brand` block with `hashtags[]`, `vocabulary[]`, `avoid[]`, and `voice`
  2. Running `/wm-wire` on a site with no `brand` block prompts the operator to build one interactively and writes the result to `wiring.json`
  3. Running `/wm-add-news` on a site with a `brand` block suggests hashtags from `brand.hashtags` and flags any `brand.avoid` matches before committing
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — Brand schema stubs in all four active wiring.json files + _core/brand-schema.md (BRAND-01)
- [x] 03-02-PLAN.md — /wm-wire brand block section: first-run artifact workflow + recency-check update path (BRAND-02)
- [x] 03-03-PLAN.md — Content skill brand enforcement: all four wm-add-* skills (BRAND-03)

### Phase 4: Collaboration Infrastructure
**Goal**: Production repos are contributor-ready — team members can push content directly or file structured issues, and the site rebuilds automatically on content pushes without operator intervention
**Mode:** mvp
**Depends on**: Phase 1, Phase 2
**Requirements**: COLLAB-01, COLLAB-02, COLLAB-03, COLLAB-04, COLLAB-05
**Success Criteria** (what must be TRUE):
  1. Each production repo ships with a `CONTRIBUTING.md` that defines the two-tier model: direct push for `content/**/*.md` files; GitHub Issue for everything else
  2. Three YAML issue templates (`content-request.yml`, `design-change.yml`, `bug-report.yml`) are present in each production repo with blank issues disabled
  3. A contributor pushing a new `.md` file to `content/**` on the production repo `main` branch triggers `content-ci.yml`, which dispatches WebsiteMocker's `content-sync.yml` and commits the content into `sites/<slug>/src/content/` automatically — the operator then runs `/wm-publish` to take it live (revised per 04-DISCUSS-CHECKPOINT.json decision D-A6: no auto-publish)
  4. Production repo `main` branch holds `content/**/*.md` files editable via GitHub web UI — no local build step required to publish a content entry
**Plans**: 5 plans

Plans:
- [ ] 04-01-PLAN.md — Sync receiver: .github/workflows/content-sync.yml (repository_dispatch, no build/publish) + the phase verification harness
- [ ] 04-02-PLAN.md — Contributor template bundle: _templates/ CONTRIBUTING.md, three issue forms + config.yml, content-ci.yml
- [ ] 04-03-PLAN.md — Installer: _scripts/init-prod-repo.mjs (idempotent orphan main, template render, labels, default branch, secret check)
- [ ] 04-04-PLAN.md — Operator interface: /wm-init-collab skill with inline WM_DISPATCH_PAT guidance + CLAUDE.md and AGENTS.md collaboration model
- [ ] 04-05-PLAN.md — Live rollout to all four production repos + end-to-end contributor round trip verification (has checkpoints)

### Phase 5: Design Artifact Ingestion
**Goal**: Operator can feed a Claude Design HTML/CSS artifact into any site and get functioning, routed Astro components without manual file surgery
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: INGEST-01, INGEST-02, INGEST-03, INGEST-04, INGEST-05, INGEST-06, INGEST-07
**Success Criteria** (what must be TRUE):
  1. Running `/wm-ingest <slug>` with a pasted artifact stages it and extracts all sections into Astro components in `sites/<slug>/src/components/` — `_core/` Layout, Nav, and Footer are never overwritten
  2. Single-page and full-site ingest modes both produce a build that passes `npm run build` for the target site
  3. CSS variable name collisions between the artifact and the existing site are surfaced and must be confirmed before any changes are applied
  4. All artifact images land in `public/images/<slug>/` and fonts in `public/fonts/` — no broken asset references after ingest; extracted CSS custom properties are surfaced as `brand` block candidates
**Plans**: TBD

Plans:
- (to be planned)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Production Deploy Pipeline | 2/2 | Complete | 2026-08-20 |
| 2. Content System | 9/9 | Complete | 2026-08-20 |
| 3. Brand Consistency | 3/3 | Complete | 2026-08-20 |
| 4. Collaboration Infrastructure | 0/5 | Planned | - |
| 5. Design Artifact Ingestion | 0/TBD | Not started | - |

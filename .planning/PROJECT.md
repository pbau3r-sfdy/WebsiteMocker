# WebsiteMocker — Upgrade Milestone

## What This Is

WebsiteMocker is a skill-driven Astro monorepo that serves as the professional sandbox for creating, iterating, and deploying branded static websites. Designers capture a reference site or produce an HTML/CSS artifact in Claude Design, WebsiteMocker transforms it into a production-ready Astro site, and a one-command deploy pushes to GitHub Pages with Squarespace DNS. For each live site, a content template system (news, jobs, announcements) lets new entries be added by dropping a single markdown file.

## Core Value

A new branded website — from captured reference or Claude Design artifact to live GitHub Pages URL — should require zero manual stitching; WebsiteMocker handles ingestion, wiring, brand consistency, and deployment automatically.

## Requirements

### Validated

<!-- What the codebase already delivers — confirmed working. -->

- ✓ Multi-site Astro monorepo with one npm workspace per site — existing
- ✓ Dashboard at GitHub Pages (`/WebsiteMocker/`) showing all sites with stage + domain — existing
- ✓ `wiring.json` per site — service connections, maturity stage, read by dashboard — existing
- ✓ Sandbox deploy via GitHub Actions (`deploy.yml`) on every push to `main` — existing
- ✓ Maturity stage system 0–6 with criteria per stage — existing
- ✓ Design capture library (`_captures/`) with `capture.json` + screenshots — existing
- ✓ `/wm-new-site` — scaffold a new site from `_core/` — existing
- ✓ `/wm-capture` — fetch a live URL and extract design DNA — existing
- ✓ `/wm-instantiate` — new site from a capture + brand brief — existing
- ✓ `/wm-deploy` — build and push to sandbox GitHub Pages — existing
- ✓ `/wm-add-news`, `/wm-edit-news`, `/wm-list-news` — guided news content management — existing
- ✓ `/wm-update-hero` — change headline, sub, CTA, background — existing
- ✓ `keywords.json` per site — brand vocabulary dictionary — existing
- ✓ `/wm-reserve-socials` — research handles, guide registration, wire — existing

### Active

<!-- New scope for this milestone — hypotheses until shipped. -->

- [ ] **DEPLOY-01**: Production `publish.yml` GitHub Action — build a site with `SITE_URL`+`SITE_BASE` env vars and push `dist/<slug>/` to `[websites-org]/<slug>` gh-pages branch
- [ ] **DEPLOY-02**: `/wm-publish <slug>` skill — one-command trigger for production deploy; validates stage ≥ 5 before running
- [ ] **DEPLOY-03**: Squarespace DNS handoff guide auto-generated per site at deploy time (CNAME + verification records, custom domain activation steps)
- [ ] **INGEST-01**: `/wm-ingest <slug>` skill — accepts an HTML/CSS artifact (full site or single page/section), extracts structure into Astro components, preserves design tokens
- [ ] **INGEST-02**: Full-site ingest mode — maps all sections to `_core/` layout conventions, updates `astro.config.mjs`, wires nav/footer
- [ ] **INGEST-03**: Page/section ingest mode — integrates one new page or section into an existing site without breaking other pages; verifies routing and component integration
- [ ] **BRAND-01**: `brand` block in `wiring.json` — hashtags array, vocabulary list, hyphenation rules; captured organically during creation/wiring phase; enforced by content skills
- [ ] **BRAND-02**: `/wm-wire` detects missing `brand` block and builds it interactively during wiring phase
- [ ] **CONTENT-01**: Content template system — structured `_content/<type>/` directories per site; each entry is one `.md` file with frontmatter; site rebuilds pick up all entries automatically
- [ ] **CONTENT-02**: Supported content types in v1: `news/`, `jobs/` — rendered via Astro content collections
- [ ] **CONTENT-03**: `/wm-add-news` and `/wm-add-job` skills updated to write `.md` files to content collections and commit (one command = one published entry)
- [ ] **COLLAB-01**: Each production repo ships with a `CONTRIBUTING.md` that defines two paths: (a) direct-push for content entries (news, jobs) and (b) GitHub Issue for everything else (page edits, new pages, design changes, bugs)
- [ ] **COLLAB-02**: GitHub Issue templates per production repo — one for content requests, one for design/page change requests, one for bug reports — so collaborators can flag things without git knowledge
- [ ] **COLLAB-03**: Issues in production repos feed a triage queue: flagged items link back to WebsiteMocker where they're handled in the sandbox, then pushed via the normal stage → deploy pipeline
- [ ] **COLLAB-04**: Production repos are structured so GitHub web UI editing works for `.md` content files (no build step required to add a post — CI picks it up on push)

### Out of Scope

- Backend/database CMS — file-based only; no server-side persistence
- Squarespace as the hosting target — DNS bridge only; GitHub Pages stays the host
- Visual drag-and-drop editor — skills + code only; no browser UI builder
- Self-hosted or alternative hosting — GitHub Pages + Squarespace DNS is the only supported production target for this milestone
- Automated Squarespace DNS API changes — we generate the records to enter, not auto-apply them (Squarespace API limitations)
- Real-time collaborative editing — GitHub-based async contribution only; no live co-editing

## Context

**Existing stack:** Astro 4.x + npm workspaces; Node scripts for orchestration; GitHub Actions for CI/CD; no test framework (manual verification only); no linting enforced.

**Production gap:** `publish.yml` is marked `[TODO]` in CLAUDE.md. Sites reach Stage 5 ("Prod Ready") but the final push to production repos in the `[websites-org]` GitHub org is fully manual. This is the highest-priority gap.

**Claude Design integration:** The workflow is: generate Astro template in WebsiteMocker → refine in Claude Design (produces HTML/CSS artifact) → pull artifact back into WebsiteMocker via `/wm-ingest` → wire, verify, deploy. This bidirectional loop needs a clean ingest pathway.

**Brand consistency:** Currently only `keywords.json` exists for brand vocabulary. The new `brand` block in `wiring.json` extends this to hashtags and typographic rules. Skills should read this at content-creation time and surface violations.

**Content templates:** `/wm-add-news` skill exists but writes to ad-hoc file paths. This milestone standardizes on Astro content collections so all content types follow the same pattern: one folder, one file per entry, automatic type-safe rendering.

**Multi-user collaboration model:** Philipp is the sole WebsiteMocker operator; production repos in `[websites-org]` will have additional collaborators with varying GitHub familiarity. The model is two-tier: (a) simple content additions (`.md` files) are direct-push, no approval needed, CI rebuilds the site; (b) design changes, new pages, or anything uncertain are filed as GitHub Issues in the production repo, triaged by Philipp, and resolved back through the WebsiteMocker sandbox before deploying. This keeps the sandbox discipline intact while enabling async team contribution.

## Constraints

- **Tech stack**: Astro — no framework migration; all new components stay in `.astro` or `.mdx`
- **Hosting**: GitHub Pages only — no Docker, no server, no Vercel/Netlify
- **Squarespace**: DNS-level integration only — no Squarespace SDK or API automation for hosting
- **Workflow**: Skills-first — every new capability gets a `/wm-*` skill wrapping it; raw scripting without a skill wrapper is a last resort
- **Org name**: `[websites-org]` placeholder remains until the GitHub org is confirmed; `publish.yml` must be parameterizable

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Astro content collections for all content types | Type-safe, co-located with site, zero dependencies, consistent rendering pattern | — Pending |
| `brand` block lives in `wiring.json` (not a new file) | Dashboard already reads `wiring.json`; one source of truth per site | — Pending |
| Ingest reads HTML/CSS artifact directly (no Figma intermediate) | Claude Design outputs HTML/CSS artifacts; converting to Figma first adds a step | — Pending |
| `publish.yml` targets `[websites-org]` via `gh-pages` branch | Matches existing sandbox model; production repos hold built output only | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-20 after initialization*

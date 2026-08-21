# WebsiteMocker — Project

## What This Is

WebsiteMocker is a skill-driven Astro monorepo that serves as the professional sandbox for creating, iterating, and deploying branded static websites. Designers capture a reference site or produce an HTML/CSS artifact in Claude Design, WebsiteMocker transforms it into a production-ready Astro site, and a one-command deploy pushes to GitHub Pages with Squarespace DNS. For each live site, a content template system (news, jobs, announcements, blog) lets new entries be added by dropping a single markdown file — editable via GitHub web UI by non-technical contributors.

## Core Value

A new branded website — from captured reference or Claude Design artifact to live GitHub Pages URL — should require zero manual stitching; WebsiteMocker handles ingestion, wiring, brand consistency, and deployment automatically.

## Current State

**Version:** v1.0 MVP — shipped 2026-08-21  
**Stack:** Astro 5 (content collections + loader API) + Node.js scripts + GitHub Actions  
**Active sites:** sfdy-alt-clean, mogwai-systems, parrot-capital (stage 2–4); crestworks (stage 6)  
**Production repos:** pbau3r-sfdy/{starflight-dynamics, mogwai-systems, parrot-capital, crestworks}

All v1.0 milestone goals delivered:
- ✅ One-command production deploy (`/wm-publish`) with validation gates
- ✅ Astro 5 Content Layer API across all active sites (4 collection types)
- ✅ `brand` block in wiring.json with content skill enforcement
- ✅ Two-tier contributor model (direct push for .md, GitHub Issues for rest)
- ✅ Claude Design artifact ingestion without manual file surgery

## Requirements

### Validated

*v1.0 (shipped 2026-08-21):*
- ✓ Multi-site Astro monorepo with one npm workspace per site — existing
- ✓ Dashboard at GitHub Pages (`/WebsiteMocker/`) showing all sites with stage + domain — existing
- ✓ `wiring.json` per site — service connections, maturity stage, read by dashboard — existing
- ✓ Sandbox deploy via GitHub Actions (`deploy.yml`) on every push to `main` — existing
- ✓ Maturity stage system 0–6 with criteria per stage — existing
- ✓ Design capture library (`_captures/`) with `capture.json` + screenshots — existing
- ✓ `/wm-new-site`, `/wm-capture`, `/wm-instantiate`, `/wm-deploy` skills — existing
- ✓ `/wm-add-news`, `/wm-edit-news`, `/wm-list-news`, `/wm-update-hero` skills — existing
- ✓ `keywords.json` per site — brand vocabulary dictionary — existing
- ✓ `/wm-reserve-socials` — research handles, guide registration, wire — existing
- ✓ **DEPLOY-01–08** — Production publish.yml + /wm-publish skill + DNS guide — v1.0
- ✓ **CONTENT-01–10** — Astro 5 Content Layer API + 4 collection types + content skills — v1.0
- ✓ **BRAND-01–03** — brand block in wiring.json + /wm-wire + content skill enforcement — v1.0
- ✓ **COLLAB-01–05** — Contributor templates + content-ci.yml + content-sync.yml + /wm-init-collab — v1.0
- ✓ **INGEST-01–07** — /wm-ingest skill + ingest-artifact.mjs (full-site + section mode) — v1.0

### Active

*Candidates for v1.1:*
- [ ] crestworks content type completion — jobs/announcements/blog pages (currently news-only)
- [ ] Phase 4 + 5 Nyquist VALIDATION.md files (`/gsd:validate-phase 4`, `/gsd:validate-phase 5`)
- [ ] 02-VERIFICATION.md update — stale CR-01 entry (code fixed in 05e614a, doc not updated)

### Out of Scope

| Feature | Reason |
|---------|--------|
| Backend/database CMS | File-based only; no server-side persistence or runtime |
| Squarespace as hosting target | DNS bridge only; GitHub Pages is the sole production host |
| Visual drag-and-drop editor | Skills + code only; no browser UI builder |
| Alternative hosting (Vercel, Netlify, Docker) | GitHub Pages + Squarespace DNS only |
| Automated Squarespace DNS API changes | No public API; guide generates records to enter manually |
| Real-time collaborative editing | GitHub-based async contribution only |
| Branch protection "require signed commits" | Permanently incompatible with GitHub web UI editing |
| Local font hosting for Claude Design CDN fonts | CDN-only artifacts; local copy out of scope |
| v2 Social media integration (SOCIAL-01–03) | Future milestone |
| v2 External content bindings (EXT-01–02) | Future milestone |
| v2 Additional content types — events, testimonials, team | Future milestone |

## Context

**Stack:** Astro 5 + npm workspaces + GitHub Actions. Node scripts for orchestration. No test framework — all verification is build-pass + manual. No linting enforced.

**v1.0 delivered (2026-08-21):** 5 phases, 22 plans, 258 commits, 873 files changed, ~47k lines added, 15 days (2026-08-06 → 2026-08-21).

**Known tech debt from v1.0:**
- Card components (AnnouncementCard, BlogCard, JobCard) are correct in code but 02-VERIFICATION.md records them as unfixed (stale; fixed in 05e614a)
- crestworks is classified as Active (stage 6) but only has news/ content routes — resolve in v1.1
- Phases 4 + 5 lack formal Nyquist VALIDATION.md files

**Collaboration model:** Philipp is sole WebsiteMocker operator. Production repos have team contributors who push .md content directly or file GitHub Issues for design changes. Content pushes auto-sync to WebsiteMocker; operator reviews and runs /wm-publish to go live (no auto-publish per D-A6).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Astro content collections for all content types | Type-safe, co-located, zero deps, consistent rendering | ✓ Shipped v1.0 |
| `brand` block lives in `wiring.json` | Dashboard already reads wiring.json; one source of truth | ✓ Shipped v1.0 |
| Ingest reads HTML/CSS artifact directly (no Figma) | Claude Design outputs HTML/CSS; Figma conversion adds a step | ✓ Shipped v1.0 |
| `publish.yml` targets prod repos via `gh-pages` branch | Matches existing sandbox model; production repos hold built output only | ✓ Shipped v1.0 |
| build-single.mjs delegates to build-all.js via execSync | Correct stdio inheritance; no module import complexity | ✓ Good |
| publish.yml uses WM_PUBLISH_PAT (not GITHUB_TOKEN) | GITHUB_TOKEN cannot cross-repo push; Classic PAT required | ✓ Good |
| No auto-publish on content push (D-A6) | Operator review before live; content sync ≠ deploy | ✓ Good |
| INGEST-05 scope: CDN fonts → Layout.astro inject (not local copy) | Claude Design artifacts use CDN fonts; local copy adds complexity with no benefit | ✓ Shipped v1.0 |

## Constraints

- **Tech stack:** Astro — no framework migration; all new components stay in `.astro` or `.mdx`
- **Hosting:** GitHub Pages only — no Docker, no server, no Vercel/Netlify
- **Squarespace:** DNS-level integration only — no Squarespace SDK or API automation
- **Workflow:** Skills-first — every new capability gets a `/wm-*` skill; raw scripting without a skill is last resort
- **Org:** Production repos live at `github.com/pbau3r-sfdy/`

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-21 after v1.0 milestone completion*

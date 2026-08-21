# Milestones

## v1.0 — MVP: WebsiteMocker Upgrade

**Shipped:** 2026-08-21 | **Tag:** v1.0  
**Duration:** 15 days (2026-08-06 → 2026-08-21)  
**Scope:** 5 phases, 22 plans, 33 requirements, 258 commits, 873 files changed, ~47k lines added

**Summary:** Closed the remaining gaps in WebsiteMocker — a one-command production deploy pipeline (`/wm-publish`), an Astro 5 Content Layer API content system with four standardised collection types, a `brand` block in `wiring.json` enforced by content skills, a two-tier contributor model for production repos, and a Claude Design artifact ingestion pathway.

**Archive:** [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) | [v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md)

**Accomplishments:**
- ✅ `/wm-publish <slug>` — single command deploys any stage-5 site to GitHub Pages with CNAME, robots.txt Allow, and wiring.json auto-update
- ✅ Astro 5 Content Layer API across all active sites (sfdy-alt-clean, mogwai-systems, parrot-capital, crestworks) — 4 collection types: news, jobs, announcements, blog
- ✅ `brand` block in wiring.json with interactive `/wm-wire` setup + enforcement in all 4 content skills
- ✅ Contributor model live on all 4 production repos — CONTRIBUTING.md, 3 issue templates, content-ci.yml → content-sync.yml round-trip
- ✅ `ingest-artifact.mjs` — full-site + section mode, Google Fonts auto-injection, astro.config env-var injection, CSS url() rewriting

**Tech debt carried forward:**
- 02-VERIFICATION.md stale (CR-01 fix in 05e614a not reflected in doc)
- Phases 4 + 5 Nyquist VALIDATION.md missing
- crestworks: stage 6 but only news/ routes (needs template flag or content migration)

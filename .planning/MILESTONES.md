# Milestones

## v1.2 Claude Design Sync, Analytics, Open Drops (Shipped: 2026-10-14)

**Phases completed:** 5 phases (9, 10, 11, 11.1, 12), 28 plans | **Tag:** v1.2

**Delivered:** The Starflight Dynamics site went live at www.starflight-dynamics.com with cookie-free analytics, secret "drops", and a connection to Claude Design.

**Key accomplishments:**

- **Claude Design connectivity (Phase 9):** optional `design` block in `wiring.json`, ad hoc `/wm-design-pull` (staged, locked, guarded against overwriting hand edits), and `/wm-design-seed`. The live seed added the website as a UI kit (32 new files) to the existing design system, leaving tokens, logos and fonts untouched.
- **Cookie-free analytics (Phase 10):** Plausible as an Astro integration with an event contract, sanitising request transform, privacy-policy gate and per-site identity assertion. Live goals: Outbound Link: Click, File Download, Form: Submission, 404, Drop Download. Hostname allowlist enabled at close.
- **Open Drops (Phase 11):** unguessable, expiring, withdrawable `/d/<id>/` pages from a private repo, with qpdf-stripped PDFs, noindex and no-referrer, masked analytics, a nightly token and expiry health check, and a live-proven publish, withdraw and 404 cycle.
- **Retool (Phase 11.1) and cutover (Phase 12):** the renamed baseline `sfdy` replaced the old site on www.starflight-dynamics.com with a backup branch, internal pages gated out of production, a fixed contributor sync, and 24 live checks green.
- **Harnesses:** fixture and live verification scripts for phases 9 to 12 (phase 11 alone: 395 checks).

Known deferred items at close: 2 (see STATE.md Deferred Items).

---

## v1.1 — Doc Generation, Archive Ingestion & Documentation Expansion

**Completed:** 2026-08-25 | **Archived:** 2026-10-14 | **Tag:** v1.1
**Scope:** 3 phases (6–8), 11 plans, 17 requirements (DOCS-01–06, ARCH-01–05, DEXP-04–06, HSK-01–03)

**Summary:** Extended WebsiteMocker from a site builder into a design-output pipeline: branded HTML documents from Claude Design artifacts, Wayback Machine history browsing with capture handoff, and closure of the v1.0 tech debt.

**Archive:** [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md) | [v1.1-REQUIREMENTS.md](milestones/v1.1-REQUIREMENTS.md) | [v1.1-phases/](milestones/v1.1-phases/)

**Accomplishments:**

- ✅ `/wm-gen-docs` + `ingest-artifact.mjs --mode docs` — brand-token-injected, self-contained HTML (bare file or Claude Design zip) committed to any `pbau3r-sfdy/*` repo's `docs/` via one `gh api` call; optional GFM export
- ✅ `archive-browse.mjs` + `/wm-archive-browse` — Wayback CDX timeline, toolbar-stripped inspection links, `--sweep` coverage audit, `--capture` handoff to `capture-site.mjs`
- ✅ crestworks now has jobs, announcements and blog routes; `_core` uses `--accent` and the SITE_URL/SITE_BASE pattern
- ✅ Stale `02-VERIFICATION.md` corrected (68-check harness); Nyquist VALIDATION.md for phases 4 and 5; 54/54 harness checks for phase 8

**Human verification (Phase 6) signed off 2026-10-14:** end-to-end `/wm-gen-docs` commit to parrot-capital and visual brand-token render both passed (see `06-VERIFICATION.md`).

**Known observation:** the doc-generation confirm summary shows tokens already present in an artifact's compact single-line `:root` as `(new) → value` rather than `before → after`.

---

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

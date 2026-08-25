# Roadmap: WebsiteMocker

## Active Milestone: v1.1 — Doc Generation, Archive Ingestion & Documentation Expansion

### Phases

- [x] **Phase 6: Doc Pipeline** — Operator can generate and publish branded HTML documents from Claude Design artifacts
- [ ] **Phase 7: Archive Module** — Operator can browse Wayback Machine history for any domain and hand off snapshots to the capture pipeline
- [ ] **Phase 8: Cleanup & Verification** — All v1.0 tech debt is resolved and crestworks operates as a fully-featured active site

### Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 6. Doc Pipeline | 3/3 | Complete | 2026-08-24 |
| 7. Archive Module | 0/? | Not started | - |
| 8. Cleanup & Verification | 0/? | Not started | - |

## Phase Details

### Phase 6: Doc Pipeline
**Goal**: Operator can generate and publish a branded, self-contained HTML document from a Claude Design artifact with a single skill invocation — no Astro build required
**Depends on**: Nothing (Phase 6 is the foundation; `/wm-gen-docs` with `--target-repo` enables doc publishing in other repos)
**Requirements**: DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05, DOCS-06
**Success Criteria** (what must be TRUE):
  1. Operator places a bare HTML file or a Claude Design `.zip` export in `_captures/<slug>/raw/` and runs `ingest-artifact.mjs <slug> --mode docs` — a single self-contained HTML file is produced with no Astro build required
  2. The output HTML reflects the site's brand colours and typography from `wiring.json` without any manual CSS editing
  3. Operator runs `/wm-gen-docs <slug>` and the resulting HTML file appears committed to the site's `prod_repo docs/` folder via a single `gh api` call — no PR, no CI trigger
  4. Operator can direct doc output to any `pbau3r-sfdy/*` repo using `--target-repo org/repo`, overriding the site's `prod_repo`
  5. Operator can export a GFM Markdown version of a generated doc alongside the HTML using `--format md`
**Plans**: 3 plans

Plans:
- [x] 06-01-PLAN.md — Package gate + install (adm-zip, turndown) with npmjs.com verification checkpoint
- [x] 06-02-PLAN.md — ingest-artifact.mjs --mode docs: artifact detection, zip extraction, brand token injection, gh api commit, GFM export
- [x] 06-03-PLAN.md — /wm-gen-docs skill: 7-step guided workflow from artifact staging to committed HTML

### Phase 7: Archive Module
**Goal**: Operator can inspect any domain's Wayback Machine snapshot history and hand off selected snapshots to the capture pipeline
**Depends on**: Nothing (independent of Phase 6)
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05
**Success Criteria** (what must be TRUE):
  1. Operator runs `archive-browse.mjs <slug|domain>` and sees a snapshot timeline grouped by year/month with clickable toolbar-stripped Wayback URLs
  2. Operator runs `archive-browse.mjs --sweep` and sees archive coverage (snapshot count, date range) for all active domains in `wiring.json`
  3. Operator passes `--capture <timestamp>` and design DNA is extracted into `_captures/<slug>-<timestamp>/` via handoff to `capture-site.mjs`
  4. Operator uses `/wm-archive-browse [slug|domain]` for an interactive flow from browse to inspect to optional snapshot capture
**Plans**: 2 plans

Plans:
- [ ] 07-01-PLAN.md — archive-browse.mjs: CDX fetch, year-grouped timeline, --sweep coverage table, --capture handoff
- [ ] 07-02-PLAN.md — /wm-archive-browse skill: guided browse → inspect → optional capture flow

### Phase 8: Cleanup & Verification
**Goal**: All v1.0 tech debt is resolved, crestworks operates as a fully-featured active site, and phases 4–5 have formal verification records
**Depends on**: Nothing (can run in any order relative to Phases 6 and 7)
**Requirements**: DEXP-04, DEXP-05, DEXP-06, HSK-01, HSK-02, HSK-03
**Success Criteria** (what must be TRUE):
  1. crestworks site has functioning jobs, announcements, and blog content routes — consistent with all other active sites
  2. `_core` newsletter button uses `var(--accent)` everywhere with no hardcoded colour values remaining
  3. `_core/astro.config.mjs` uses the SITE_URL/SITE_BASE env-var pattern, matching all active sites
  4. `02-VERIFICATION.md` accurately documents the current codebase state with the stale CR-01 entry corrected
  5. Phase 4 (Collaboration Infrastructure) and Phase 5 (Design Artifact Ingestion) each have a Nyquist VALIDATION.md on disk
**Plans**: 2 plans

Plans:
- [ ] 07-01-PLAN.md — archive-browse.mjs: CDX fetch, year-grouped timeline, --sweep coverage table, --capture handoff
- [ ] 07-02-PLAN.md — /wm-archive-browse skill: guided browse → inspect → optional capture flow

---

## Shipped

<details>
<summary><strong>v1.0 — MVP: WebsiteMocker Upgrade</strong> — shipped 2026-08-21 — 5 phases, 22 plans, 33/33 requirements</summary>

Closed the remaining gaps in WebsiteMocker: a one-command production deploy pipeline, a standardised Astro 5 content system editable by non-technical contributors, a brand consistency layer baked into `wiring.json`, a two-tier collaboration model for production repos, and a clean ingest pathway for Claude Design HTML/CSS artifacts.

- ✅ Phase 1: Production Deploy Pipeline (2 plans)
- ✅ Phase 2: Content System (9 plans)
- ✅ Phase 3: Brand Consistency (3 plans)
- ✅ Phase 4: Collaboration Infrastructure (5 plans)
- ✅ Phase 5: Design Artifact Ingestion (3 plans)

**Full archive:** [.planning/milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

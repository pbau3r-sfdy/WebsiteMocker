# Requirements: v1.1 — Doc Generation, Archive Ingestion & Documentation Expansion

## Doc Pipeline

- [ ] **DOCS-01**: Operator can run `ingest-artifact.mjs <slug> --mode docs` to produce a single self-contained HTML file from a Claude Design artifact — no Astro build step required
- [ ] **DOCS-02**: The generated HTML document automatically inherits the site's brand colours and typography from `wiring.json`, with no manual CSS editing
- [ ] **DOCS-03**: Operator can run `/wm-gen-docs <slug>` to go from pasted artifact to a committed HTML file in the site's `prod_repo docs/` folder in one command
- [ ] **DOCS-04**: Operator can commit a generated doc to any GitHub repo's `docs/` folder via a single `gh api` call — no PR, no CI trigger
- [ ] **DOCS-05**: Operator can target any `pbau3r-sfdy/*` repo for doc publishing with `--target-repo org/repo`, overriding the site's `prod_repo`
- [ ] **DOCS-06**: Operator can export a GFM Markdown version of a generated doc alongside the HTML for GitHub Wiki targets

## Archive Module

- [ ] **ARCH-01**: Operator can run `archive-browse.mjs <slug|domain>` to see a timeline of all Wayback Machine snapshots for a domain, grouped by year/month
- [ ] **ARCH-02**: Each snapshot row includes a clickable, toolbar-stripped Wayback URL the operator can open to inspect the historical design in a browser
- [ ] **ARCH-03**: Operator can run `archive-browse.mjs --sweep` to see archive coverage (snapshot count, date range) across all domains in `wiring.json`
- [ ] **ARCH-04**: Operator can pass `--capture <timestamp>` to hand off a selected snapshot to `capture-site.mjs`, extracting its design DNA into `_captures/<slug>-<timestamp>/`
- [ ] **ARCH-05**: Operator can use `/wm-archive-browse [slug|domain]` for an interactive flow: browse timeline → inspect links → optionally capture a selected snapshot

## Documentation Expansion

- [ ] **DEXP-01**: Operator can generate and publish the WebsiteMocker operator manual as a branded HTML doc using `/wm-gen-docs`
- [ ] **DEXP-02**: Operator can publish a Raise Engine user manual to `pbau3r-sfdy/raise-engine/docs/` using `/wm-gen-docs --target-repo`
- [ ] **DEXP-03**: Operator can publish an Inbox Curer user manual to its GitHub repo using `/wm-gen-docs --target-repo`
- [ ] **DEXP-04**: `02-VERIFICATION.md` accurately reflects the current codebase state (stale CR-01 entry corrected — fix shipped in 05e614a)
- [ ] **DEXP-05**: Phase 4 (Collaboration Infrastructure) has a Nyquist VALIDATION.md documenting what was verified in that phase
- [ ] **DEXP-06**: Phase 5 (Design Artifact Ingestion) has a Nyquist VALIDATION.md documenting what was verified in that phase

## Housekeeping

- [ ] **HSK-01**: crestworks site has functioning jobs, announcements, and blog content routes — consistent with all other active sites
- [ ] **HSK-02**: `_core` newsletter button uses `var(--accent)` everywhere; hardcoded `#384AD3` is removed (GitHub issue #18)
- [ ] **HSK-03**: `_core/astro.config.mjs` adopts the SITE_URL/SITE_BASE env-var pattern, matching every active site (GitHub issue #17)

---

## Future Requirements

*(deferred from v1.1 scope)*

- GFM Markdown export (DOCS-06) — included in v1.1 as P3; may slip to v1.2 if scope is tight
- Vercel DB and Supabase bindings in `/wm-wire` — separate project, not WebsiteMocker
- Additional Wayback capture modes (full-site crawl, multi-page) — post-ARCH-04 extension
- Social media integration (SOCIAL-01–03) — v2 milestone

## Out of Scope

| Feature | Reason |
|---------|--------|
| Automated doc-to-Confluence/Notion export | No production Confluence/Notion in the stack |
| Wayback Machine API write access (submitting pages) | CDX is read-only; submit API is separate and not needed here |
| Full Internet Archive search (not just CDX by domain) | Out of scope — we only need captures for known domains |
| Vercel DB / Supabase wiring | Wrong project — removed from WebsiteMocker backlog |
| Auto-generating docs on every publish | Too noisy; operator-triggered only |

## Traceability

*(filled by roadmapper)*

| REQ-ID | Phase | Notes |
|--------|-------|-------|
| DOCS-01–06 | TBD | |
| ARCH-01–05 | TBD | |
| DEXP-01–06 | TBD | |
| HSK-01–03  | TBD | |

# Requirements: v1.1 — Doc Generation, Archive Ingestion & Documentation Expansion

## Doc Pipeline

- [ ] **DOCS-01**: Operator can run `ingest-artifact.mjs <slug> --mode docs` with either a bare HTML file or a Claude Design `.zip` export in `_captures/<slug>/raw/`; if a zip is supplied the script unpacks it, detects the entry HTML, and proceeds automatically — no Astro build step required
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

## Verification & Records

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
- **DEXP-01** (WebsiteMocker manual), **DEXP-02** (Raise Engine manual), **DEXP-03** (Inbox Curer manual) — these are executed *in those package repos* using `/wm-gen-docs` as a tool; they are not WebsiteMocker implementation work

## Out of Scope

| Feature | Reason |
|---------|--------|
| Automated doc-to-Confluence/Notion export | No production Confluence/Notion in the stack |
| Wayback Machine API write access (submitting pages) | CDX is read-only; submit API is separate and not needed here |
| Full Internet Archive search (not just CDX by domain) | We only need captures for known wiring.json domains |
| Vercel DB / Supabase wiring | Wrong project — removed from WebsiteMocker backlog |
| Auto-generating docs on every publish | Too noisy; operator-triggered only |
| Publishing operator manuals for other packages (DEXP-01–03) | Those are operator tasks done *using* WebsiteMocker, not WebsiteMocker implementation work |

## Traceability

| REQ-ID | Phase | Notes |
|--------|-------|-------|
| DOCS-01 | Phase 6 | --mode docs flag + zip extraction on ingest-artifact.mjs |
| DOCS-02 | Phase 6 | Brand-token injection from wiring.json |
| DOCS-03 | Phase 6 | /wm-gen-docs skill |
| DOCS-04 | Phase 6 | gh api PUT commit step |
| DOCS-05 | Phase 6 | --target-repo flag |
| DOCS-06 | Phase 6 | GFM Markdown export (P3) |
| ARCH-01 | Phase 7 | CDX API client + snapshot timeline |
| ARCH-02 | Phase 7 | Toolbar-stripped Wayback inspection links |
| ARCH-03 | Phase 7 | --sweep mode across all wiring.json domains |
| ARCH-04 | Phase 7 | --capture handoff to capture-site.mjs |
| ARCH-05 | Phase 7 | /wm-archive-browse interactive skill |
| DEXP-01 | out of scope | Operator task in WebsiteMocker repo using /wm-gen-docs |
| DEXP-02 | out of scope | Operator task in Raise Engine repo using /wm-gen-docs |
| DEXP-03 | out of scope | Operator task in Inbox Curer repo using /wm-gen-docs |
| DEXP-04 | Phase 8 | Fix stale 02-VERIFICATION.md |
| DEXP-05 | Phase 8 | Nyquist VALIDATION.md for Phase 4 |
| DEXP-06 | Phase 8 | Nyquist VALIDATION.md for Phase 5 |
| HSK-01 | Phase 8 | crestworks content routes (jobs, announcements, blog) |
| HSK-02 | Phase 8 | _core newsletter button --accent token fix |
| HSK-03 | Phase 8 | _core/astro.config.mjs env-var pattern |

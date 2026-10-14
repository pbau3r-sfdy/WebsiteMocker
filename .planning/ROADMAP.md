# Roadmap: WebsiteMocker

## Milestones

- ✅ **v1.0 MVP** — Phases 1-5 (shipped 2026-08-21)
- ✅ **v1.1 Doc Generation, Archive Ingestion & Documentation Expansion** — Phases 6-8 (completed 2026-08-25, archived 2026-10-14)
- 📋 **v1.2 Claude Design Connectivity, Analytics, Open Drops** — Phases 9-11 (planned)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-5) — SHIPPED 2026-08-21</summary>

- [x] Phase 1: Production Deploy Pipeline (2 plans)
- [x] Phase 2: Content System (9 plans)
- [x] Phase 3: Brand Consistency (3 plans)
- [x] Phase 4: Collaboration Infrastructure (5 plans)
- [x] Phase 5: Design Artifact Ingestion (3 plans)

Full archive: [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) · phase records: [v1.0-phases/](milestones/v1.0-phases/)

</details>

<details>
<summary>✅ v1.1 Doc Generation, Archive Ingestion & Documentation Expansion (Phases 6-8) — COMPLETED 2026-08-25</summary>

- [x] Phase 6: Doc Pipeline (3/3 plans) — completed 2026-08-24; human checks signed off 2026-10-14
- [x] Phase 7: Archive Module (2/2 plans) — completed 2026-08-25
- [x] Phase 8: Cleanup & Verification (6/6 plans) — completed 2026-08-25

Full archive: [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md) · phase records: [v1.1-phases/](milestones/v1.1-phases/)

</details>

### 📋 v1.2 Claude Design Connectivity, Analytics, Open Drops (Planned)

- [x] **Phase 9: Claude Design Connectivity** - Optional, ad hoc pull of design sources (design system, local export zip; artifact-link route dropped per SD-04) into any site, gated by a DesignSync spike. Completed 2026-10-14; DSYNC-11 live seeding run deferred
- [x] **Phase 10: Analytics** - Optional per-site Plausible analytics on one subscription, with an event contract, privacy gating and a sanitised tracking mode; on for `sfdy-alt-clean-reskin-2` only (and www.starflight-dynamics.com after the Phase 12 cutover) (completed 2026-10-14)
- [ ] **Phase 11: Open Drops** - Unguessable, expiring, withdrawable, trackable `/d/<id>/` pages for confidential-not-secret drafts; adopted on `sfdy`
- [ ] **Phase 12: SFDY Cutover** - Publish `sfdy-alt-clean-reskin-2` as the live www.starflight-dynamics.com (strip jobs, remove internal pages, fix contributor sync, publish)

Phases 9 and 10 are independent and may run in parallel. Phase 11 depends on Phase 10. Phase 12 is independent and may run at any point.

## Phase Details

### Phase 9: Claude Design Connectivity

**Goal**: Operator can feed any site (existing, new or revamp) from a Claude Design design system, a published-artifact link or a local export, without drag-and-drop and without silently overwriting hand-edited sections
**Depends on**: Nothing (independent of Phase 10; may run in parallel)
**Requirements**: DSYNC-01, DSYNC-02, DSYNC-03, DSYNC-04, DSYNC-05, DSYNC-06, DSYNC-07, DSYNC-08, DSYNC-09, DSYNC-10, DSYNC-11, DSYNC-12, DSYNC-13
**Sequencing notes**:
  - Update 2026-10-14: the spike (SD-04) dropped the published-artifact link route: shared links return a Cloudflare 403 and the design source sits in a sandboxed iframe. Wherever this phase says "artifact link", read "local export zip dropped into `_staging/design/inbox/`".

  - The first plan is the gating spike (DSYNC-01). Its report fixes the scope of DSYNC-03..12, including the JSX render path and merge semantics.
  - DSYNC-11 (seeding a design-system project from site brand tokens and logos) is gated on the spike and may be split off into its own phase if the spike shows it is too large.

**Success Criteria** (what must be TRUE):

  1. A spike report exists documenting how each route into a site actually behaves (DesignSync limits and truncation, published artifact, export/paste, JSX rendering, section-merge semantics), and later plans follow its findings
  2. Operator can run `/wm-design-pull [slug]` on a site with a `design` block, or pick a design-system project, artifact link or local export interactively for a site without one; a site with no block has no design connection
  3. A pull stages files in a gitignored folder, records `design.lock.json`, and a re-pull reports added/changed/removed files (with dry-run); oversized or syntactically invalid files fail loudly instead of being staged truncated
  4. Ingest refuses to overwrite a hand-edited section without explicit per-section confirmation, pulled content is sanitised, and tokens land in `brand.doc_tokens` with an unmapped-token report while `validate-brand.mjs` passes
  5. Both paths are proven: SFDY's design system pulls into `sfdy-alt-clean-reskin-2`, and one source without a design system (artifact link or local export) ingests; both sites build, and `verify-phase-09.sh` passes using fixtures only

**Plans**: 9 plans
Plans:
**Wave 1**

- [x] 09-01-PLAN.md — Gating spike (DSYNC-01): gitignore `_staging/`, probe DesignSync, artifact link, export, JSX render, section merge; operator-confirmed Scope Decisions SD-01..SD-10 in 09-SPIKE.md

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 09-02-PLAN.md — `design` block validator + design-connect, `design.lock.json` lib, design-stage verifier/diff with dry-run and loud failure, zip inbox import, public-safe DESIGN.md/DESIGNER.md markers (DSYNC-02, 04, 05; SD-05, SD-11)
- [x] 09-03-PLAN.md — Allowlist sanitiser with report; token mapping into `brand.doc_tokens` with unmapped report and Layout proposal; repo-relative validate-brand (DSYNC-07, 08)
- [x] 09-04-PLAN.md — Isolated JSX-to-HTML render via SD-06 path, package checkpoint before react install (DSYNC-09)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 09-05-PLAN.md — `ingest-artifact.mjs` `--input`/`--accept` + hash-at-ingest divergence guard; design-ingest orchestrator (DSYNC-06, 09)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 09-06-PLAN.md — `/wm-design-pull` skill; optional design step in `/wm-new-site` and `/wm-instantiate` (DSYNC-03, 10)
- [x] 09-07-PLAN.md — Fixture-only `verify-phase-09.sh` harness (DSYNC-13)

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 09-08-PLAN.md — Pilots: SFDY design system into reskin-2, TELEX one-pager zip export into new sandbox slug `design-pilot`; both build (DSYNC-12)

**Wave 6** *(blocked on Wave 5 completion)*

- [ ] 09-09-PLAN.md — Seed/update a design-system project from site tokens and logos, operator-approved path lists; droppable per SD-09 (DSYNC-11). Script and skill built; live seeding run deferred by operator 2026-10-14

**UI hint**: yes

### Phase 10: Analytics

**Goal**: Operator can switch on cookie-free Plausible analytics per site on a single subscription, with sandbox traffic isolated from production, privacy obligations enforced, and `sfdy-alt-clean-reskin-2` measured end to end
**Depends on**: Nothing for planning; execution of the reskin-2 wiring follows Phase 11.1 (privacy section, job removal)
**Requirements**: ANLY-01, ANLY-02, ANLY-03, ANLY-04, ANLY-05, ANLY-06, ANLY-07, ANLY-08, ANLY-09
**Note:** When analytics is switched on for reskin-2 / starflight-dynamics.com, add a consent banner and update the Data Protection Notice (reviewer feedback 2026-10-14; CUT-03). Operator decision 2026-10-14 (D-04 confirmed): no banner, because Plausible sets no cookies; the Data Protection Notice has the Web analytics section. The legal reviewer's banner feedback was not separately confirmed.
**Success Criteria** (what must be TRUE):

  1. A site without `analytics.status: configured` emits no analytics script; a configured site emits the per-site script (or legacy fallback) and enabled outbound-link, download and form events, and sandbox and production builds are told apart by one shared `isSandbox` helper
  2. A build fails if the resolved Plausible domain does not match the build kind, so sandbox traffic cannot land in a production site
  3. `Download`, `Outbound Link: Click`, `Form` and `404` events fire per the documented event contract, and the sanitised tracking mode keeps path secrets and URL fragments out of Plausible
  4. `/wm-wire` offers an optional analytics step, and preflight/publish refuse to turn analytics on for a live site whose privacy policy lacks the Plausible section
  5. Analytics is wired on `sfdy-alt-clean-reskin-2` only (shared sandbox site until the cutover, then www.starflight-dynamics.com) and events appear in Plausible; the aggregates-only dashboard tile (Business plan) is local-only and labelled approximate; `verify-phase-10.sh` passes

**Plans**: 5 plans
Plans:
**Wave 1**

- [x] 10-01-PLAN.md — `isSandbox` helper, pa- per-site snippet with event flags and legacy fallback, ANLY-03 identity assertion, sanitising transformRequest (ANLY-01, 02, 03, 04, 05)
- [x] 10-02-PLAN.md — Privacy gate script in publish.yml, /wm-preflight, /wm-publish; /wm-wire analytics step; event contract and goals checklist in docs/analytics.md (ANLY-06, 04)
- [x] 10-03-PLAN.md — Stats API v2 aggregates fetcher, gitignored `_data/*/analytics.json`, local-only approximate dashboard tile, off by default (ANLY-07)

**Wave 2** *(blocked on 10-01, 10-02)*

- [x] 10-04-PLAN.md — `verify-phase-10.sh` fixture harness (ANLY-08)

**Wave 3** *(blocked on 10-04 and on Phase 11.1 having landed)*

- [x] 10-05-PLAN.md — Wire reskin-2 (pa- tag, D-02 sandbox debug opt-in, 404 page), operator live debug checkpoint, event-name decision (ANLY-09, 04)

### Phase 11: Open Drops

**Goal**: Operator can share a confidential-but-not-secret early draft as an unguessable, unindexed, expiring and withdrawable page, with views tracked without leaking the drop id
**Depends on**: Phase 10 (sanitised tracking mode and event contract)
**Requirements**: DROP-01, DROP-02, DROP-03, DROP-04, DROP-05, DROP-06, DROP-07, DROP-08, DROP-09, DROP-10
**Success Criteria** (what must be TRUE):

  1. Operator can create, list (with expiry status), withdraw and sweep drops via `node _scripts/drop.mjs` or the `/wm-drop` skill; each drop gets a 32-hex id, a label, a mandatory `expires` and a Markdown body
  2. On a site with `drops.enabled`, an active drop renders at `/d/<id>/` with neutral title, no Open Graph tags, noindex and no-referrer, and no sitemap, RSS, dashboard, robots or inbound-link exposure; expired and withdrawn drops are not built, and sandbox builds contain no `/d/` unless `DROPS_PREVIEW=1`
  3. PDF attachments are emitted into `dist/d/<id>/` with metadata stripped (the build fails if the stripping tool is missing), and drop views and downloads appear in Plausible without the id in any path or property
  4. `/wm-preflight` and `/wm-publish` warn about expired, soon-expiring and expiry-less drops, secret-looking content, and list drops about to be published; documentation states drops are for confidential-not-secret material and that withdrawal is unlisting only
  5. The feature is built and verified on `sfdy` (the live SFDY baseline); `verify-phase-11.sh` passes in static mode, and live mode confirms 200 for active and 404 for withdrawn/expired drops

**Plans**: 6 plans
Plans:
**Wave 1**

- [x] 11-01-PLAN.md — Pure libs (drops-core, drops-collection gating, qpdf PDF strip), fixtures with relative dates, `verify-phase-11.sh` dispatcher with `lib` and `pdf` sections, Q6 dev-preview spike (DROP-01, 05, 09)

**Wave 2** *(blocked on 11-01)*

- [x] 11-02-PLAN.md — Astro integration `_scripts/drops.mjs`, `_core` route + standalone DropLayout, `sfdy` adoption, sandbox/production gating, sync-content deny, `build` and `sandbox` harness sections (DROP-01, 03, 04, 05, 09)
- [x] 11-04-PLAN.md — `drop.mjs` CLI (new|list|withdraw|expire|check), `/wm-drop` skill, preflight/publish/deploy skill edits, `docs/drops.md`, `cli` and `docs` sections (DROP-02, 07, 08, 09, 10)

**Wave 3** *(blocked on 11-02, 11-04)*

- [x] 11-03-PLAN.md — Plausible drop whitelist in the shared transform, `Drop Download` hook, vectors, analytics docs, `track` section (DROP-06, 09)
- [ ] 11-05-PLAN.md — `publish.yml` private drops checkout + qpdf + redacted build, `drops-health.yml` nightly token/expiry watch, `ci` and opt-in `live` sections (DROP-04, 05, 07, 08, 09)

**Wave 4** *(blocked on 11-03, 11-05; operator gates G1-G6)*

- [ ] 11-06-PLAN.md — Create private repo, extend token, push, Plausible goal, test drop publish then withdraw + republish 404 proof, first health run (DROP-02, 03, 04, 05, 06, 08, 09, 10)

### Phase 11.1: Retool sfdy-alt-clean-reskin-2 before cutover: review feedback and further design changes (INSERTED)

**Goal:** `sfdy-alt-clean-reskin-2` carries the reviewer's wording and footer fixes, the hero closing sentence, and no job postings, ready for the Phase 12 cutover
**Requirements**: RETL-01, RETL-02, RETL-03, RETL-04, RETL-05
**Depends on:** Phase 11 (ordering only; no code dependency)
**Plans:** 2/2 plans complete

Plans:
- [x] 11.1-01-PLAN.md — Positioning check, hero sentence commit, socials kept, draft Plausible privacy section (RETL-01, 02, 03, 05)
- [x] 11.1-02-PLAN.md — Remove job postings via git rm, record CUT-01 overlap and consent-banner note (RETL-04)

### Phase 12: SFDY Cutover

**Goal**: Operator can publish `sfdy-alt-clean-reskin-2` as the live www.starflight-dynamics.com without breaking contributor content sync, leaking internal pages, or losing the old build's maintainability
**Depends on**: Nothing (may run before or after Phases 9-11; does not wait on analytics)
**Requirements**: CUT-01, CUT-02, CUT-03, CUT-04, CUT-05, CUT-06, CUT-07
**Note:** CUT-01 is satisfied by Phase 11.1 (RETL-04); no jobs removal work in this phase.
**Note:** When analytics is switched on for reskin-2 / starflight-dynamics.com, add a consent banner and update the Data Protection Notice (reviewer feedback 2026-10-14; CUT-03). Operator decision 2026-10-14 (D-04 confirmed): no banner, because Plausible sets no cookies; the Data Protection Notice has the Web analytics section. The legal reviewer's banner feedback was not separately confirmed.
**Success Criteria** (what must be TRUE):

  1. `reskin-2` has no jobs pages, jobs content entries, `JobRow` or Nav/Footer jobs links, and builds cleanly; the 31 job files remain recoverable from git history (done in Phase 11.1, RETL-04)
  2. No internal-review page or text (`/open-points`, "internal review only") appears in a production build; impressum and privacy pages are reviewed (including Plausible text if analytics is on)
  3. `reskin-2` carries the production identity in `wiring.json` (`prod_repo`, `domain`, stage 5+) and `/wm-preflight` passes
  4. A contributor push to the production repo's `content/` reaches the new site's content folder (the dispatch slug in the production repo's `content-ci.yml` is corrected or the site is renamed), and the unused `content/jobs/` folder is handled
  5. `/wm-publish` deploys `reskin-2`; the live site, CNAME and `robots.txt` are verified; `CLAUDE.md` ownership table and `wiring.json` (stage 6, `last_deploy`) are updated
  6. Last step, only after every sequence is tested and the site is deployed (CUT-07): the live `/wm-design-seed` run (DSYNC-11) pushes the deployed site's brand tokens and logos into Claude Design, so the live site becomes the design system's reference and replaces the initial website design. Operator approves the exact path list and the `finalize_plan` call; no deletes, no `uploads/`

**Notes from Phase 10**:
  - Remove `analytics.sandboxUsesProdId` from `sites/sfdy-alt-clean-reskin-2/wiring.json` at cutover (D-02 debug opt-in; `/wm-preflight` warns while it is set), rebuild, then consider a Plausible hostname allowlist for starflight-dynamics.com
  - No-consent-banner decision (Phase 10 D-04) confirmed by the operator 2026-10-14 (no cookies set)

**Plans**: 6 plans

Plans:
- [x] 12-01-PLAN.md — Remove archived sites/sfdy, rename reskin-2 to sfdy, fix living references, harnesses and lockfile (CUT-01, CUT-04)
- [x] 12-02-PLAN.md — Gate open-points, pill, Tbd, noindex on production build; .nojekyll; verify-phase-12 harness (CUT-02)
- [x] 12-03-PLAN.md — Production identity, single prod-repo owner, sync jobs guard, legal checklist, preflight (CUT-03, CUT-04, CUT-05)
- [x] 12-04-PLAN.md — Operator gates A and B: push origin, prod repo dispatch slug, live sync test (CUT-05)
- [x] 12-05-PLAN.md — Operator gate C: gh-pages backup, publish, live verification, go-live bookkeeping (CUT-06, CUT-04)
- [ ] 12-06-PLAN.md — Operator gate D: design seed into existing project, close DSYNC-11 and Phase 9 (CUT-07)

## Backlog

### Phase 999.1: Locked Drops (BACKLOG)

**Goal**: Encrypted drops whose key travels only in the URL fragment, with soft expiry (LOCK-01.. to be defined when promoted)
**Depends on**: Phase 11
**Requirements**: Not in the active milestone (LOCK-01.. in REQUIREMENTS.md Future Requirements)
**Notes**: Local CLI encrypts with a random AES-GCM key and only ciphertext is committed; key in the fragment (`/d/#<id>.<key>`); analytics must never record URL fragments (a constraint already honoured in Phase 10)
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-5 | v1.0 | 22/22 | Complete | 2026-08-21 |
| 6. Doc Pipeline | v1.1 | 3/3 | Complete | 2026-08-24 |
| 7. Archive Module | v1.1 | 2/2 | Complete | 2026-08-25 |
| 8. Cleanup & Verification | v1.1 | 6/6 | Complete | 2026-08-25 |
| 9. Claude Design Connectivity | v1.2 | 8/9 | In Progress|  |
| 10. Analytics | v1.2 | 5/5 | Complete   | 2026-10-14 |
| 11. Open Drops | v1.2 | 4/6 | In Progress|  |
| 12. SFDY Cutover | v1.2 | 5/6 | In Progress|  |

# Requirements: v1.2 — Claude Design Connectivity, Analytics, Open Drops

**Settled decisions (2026-10-14):**
- Design connectivity is a framework-wide capability for any site (existing, future, revamp), with or without a Claude Design design system. It is optional per site and used ad hoc.
- Analytics is a framework capability, optional per site, off by default; wired now only for the SFDY baseline `sfdy-alt-clean-reskin-2` (shared sandbox site until the Phase 12 cutover, then www.starflight-dynamics.com).
- Open Drops are a framework capability (`drops.enabled` opt-in per site); adopted now only on the SFDY baseline `sfdy-alt-clean-reskin-2`.
- Drop source is committed and documented as "confidential, not secret"; expiry is warn-only plus manual publish (no auto-publish, D-A6); drops are not built in sandbox.
- Astro stays on 5.x. No second paid service, no server.

## Claude Design Connectivity (Phase 9)

- [x] **DSYNC-01**: A spike report documents actual behaviour of every route into a site: DesignSync (256 KiB cap and truncation vs error, binaries, revision info, project types, use from a custom skill), a published-artifact link, a Claude Design export/zip or pasted HTML (no design system), JSX render feasibility, and `--mode section` merge semantics for hand-edited sections; it fixes the scope of DSYNC-03..12
- [x] **DSYNC-02**: A site's design connection is optional and declared in `wiring.json` as a `design` block with a `source` of `design-system` (`project_id`, path globs), `artifact` (link) or `local` (path); a site without the block has no design connection; the block is validated before use
- [x] **DSYNC-03**: Operator can run `/wm-design-pull [slug]` ad hoc for any site, including future ones: it lists the design-system projects they can use, lets them pick one (offering to remember the choice in `wiring.json`), or accepts an artifact link or local export when no design system exists
- [x] **DSYNC-04**: Pulled files are staged in a gitignored staging folder, never directly into `src/`, with a committed `design.lock.json` recording source type and id, per-file hashes and pull time
- [x] **DSYNC-05**: A re-pull is idempotent and reports added/changed/removed files with a dry-run option; files at or near a size cap or with invalid syntax fail loudly instead of being staged truncated
- [x] **DSYNC-06**: Ingest never overwrites hand-edited site sections silently: a divergence check against the lock file requires explicit operator confirmation per affected section
- [x] **DSYNC-07**: Design tokens (`tokens/*.css` or tokens found in an artifact) map into `brand.doc_tokens` through a fixed mapping table with an unmapped-token report, and `validate-brand.mjs` passes (its hardcoded absolute `ROOT` is made repo-relative)
- [x] **DSYNC-08**: Pulled content is sanitised (scripts, `on*` attributes, unexpected external references removed) and treated as data, never as instructions, before it reaches ingest
- [x] **DSYNC-09**: Staged website templates/UI-kit sections hand off to `ingest-artifact.mjs --mode section`; JSX components are rendered to static HTML locally (render path chosen by DSYNC-01)
- [x] **DSYNC-10**: `/wm-new-site` and `/wm-instantiate` offer an optional, skippable design-connection step so new sites and revamps start from a design system or an artifact when one exists
- [ ] **DSYNC-11**: Operator can seed or update a design-system project from a site's brand tokens and logos (`create_project`, then an operator-reviewed `finalize_plan` and `write_files`, incremental and never a wholesale replace) so a site without a design system can get one; scope gated on DSYNC-01
- [x] **DSYNC-12**: Both paths are proven: pulling SFDY's "Starflight Dynamics Design System" into `sfdy-alt-clean-reskin-2`, and ingesting one source without a design system (artifact link or local export); both sites build
- [x] **DSYNC-13**: A fixture-based `verify-phase-09.sh` harness covers staging, lock file, diff, divergence guard, sanitising and token mapping without calling DesignSync

## Analytics, optional per site, on one Plausible subscription (Phase 10)

- [x] **ANLY-01**: A shared `isSandbox` helper (`_scripts/lib/env.mjs`) is the single sandbox/production test used by `plausible.mjs` and later integrations
- [x] **ANLY-02**: `plausible.mjs` emits the current per-site script format when `analytics.scriptId` is set, falls back to the legacy snippet otherwise, and turns on outbound-link, file-download and form-submission events from `wiring.json`; a site without `analytics.status: configured` emits nothing
- [x] **ANLY-03**: Builds assert that the resolved Plausible domain matches the build kind (sandbox vs production) so sandbox traffic can never land in a production site
- [x] **ANLY-04**: An event contract is documented and implemented: `Download`, `Outbound Link: Click`, `Form`, and `404` (fired from `404.astro` with the path as a prop), with low-cardinality props (`site`, `content_type`) and a goals/props registration checklist
- [x] **ANLY-05**: A sanitised tracking mode keeps path secrets out of Plausible (page URL override or exclusion); hash-based tracking is never used; secrets never appear in path, query or fragment
- [ ] **ANLY-06**: `/wm-wire` has an optional analytics step (scriptId, goals checklist, privacy-policy snippet), and preflight/publish refuse to switch analytics on for a live site whose privacy policy lacks the Plausible section
- [ ] **ANLY-07**: `fetch-analytics-data.mjs` calls Stats API v2 and writes aggregates only (no paths, referrers or drop rows) to a gitignored `_data/<slug>/analytics.json`; the API key lives only in the vault or a CI secret; the dashboard tile is local-only and labelled approximate, as of a date (conditional on the Business plan)
- [ ] **ANLY-08**: A `verify-phase-10.sh` harness covers snippet output for sandbox, production and unconfigured sites, the domain assertion, the 404 event and the sanitised mode
- [ ] **ANLY-09**: Analytics is wired end to end for `sfdy-alt-clean-reskin-2` only (shared sandbox site until the Phase 12 cutover, then www.starflight-dynamics.com) and events appear in Plausible; all other sites stay unconfigured

## Open Drops (Phase 11)

- [ ] **DROP-01**: A `drops` content collection defines each drop: 32-hex id from `crypto.randomBytes(16)`, title, human `label`, mandatory `expires` (ISO with offset, with a maximum horizon), optional PDF attachments, and a Markdown body that is the data
- [ ] **DROP-02**: Operator can run `node _scripts/drop.mjs new|list|withdraw|expire` to create, list (with expiry status), remove and sweep drops
- [ ] **DROP-03**: A shared `/d/<id>/` route and `DropLayout` in `_core` render a drop with a neutral title, no Open Graph tags and no links to other drops or site listings; a site opts in with `drops.enabled` in `wiring.json`; `sfdy-alt-clean-reskin-2` adopts it
- [ ] **DROP-04**: `_scripts/drops.mjs` filters expired and withdrawn drops at build, adds `noindex,nofollow,noarchive` and `no-referrer` meta tags, keeps drops out of sitemap, RSS, dashboard and content-sync, adds no `robots.txt` entry, and builds no drops for sandbox (`/WebsiteMocker` base) unless `DROPS_PREVIEW=1`
- [ ] **DROP-05**: PDF attachments are emitted into `dist/d/<id>/` after filtering (never from `public/`), with metadata stripped; the build fails if the stripping tool is unavailable
- [ ] **DROP-06**: Drop views and attachment downloads are tracked through the Phase 10 sanitised mode and a `Drop Download` event grouped by `label` (when custom properties are available); the id never appears in any analytics path or property
- [ ] **DROP-07**: `/wm-preflight` and `/wm-publish` warn about expired, soon-expiring and expiry-less drops and about secret-looking content, and list the drops about to be published
- [ ] **DROP-08**: Withdrawal removes the drop from source; documentation states that withdrawal is unlisting only (git history, CDN and web archives may retain copies) and the live URL is checked for a 404 after the next publish
- [ ] **DROP-09**: A `verify-phase-11.sh` harness has a static mode (id appears only in its own `dist/d/<id>/`, no sitemap/robots/inbound link, noindex and no-referrer present, expired/withdrawn drops absent, sandbox build has no `/d/`) and a live mode (200 for active, 404 for withdrawn/expired), and prints what it cannot verify (HTTP headers)
- [ ] **DROP-10**: Operator can create and manage drops through a `/wm-drop` skill; its documentation states that drops are for confidential-but-not-secret material and not for export-controlled or classified data

## Retool before cutover (Phase 11.1)

- [ ] **RETL-01**: The positioning phrase reads "In-Space Power Projection" without "Systems" everywhere on `sfdy-alt-clean-reskin-2` (pages, data files, meta descriptions)
- [ ] **RETL-02**: The home hero ends with the sentence "We enable European in-space power projection" with the phrase highlighted in the accent colour, and it builds
- [ ] **RETL-03**: All social links (LinkedIn, X, Instagram, Facebook and the rest) stay in the footer and legal pages (operator reversed the reviewer's suggestion 2026-10-14); nothing changes there
- [ ] **RETL-04**: All job postings are removed (content entries, jobs pages, `JobRow`, Nav/Footer links, collection) with the site building cleanly and the files recoverable from git history; this also satisfies CUT-01
- [ ] **RETL-05**: The privacy policy of `sfdy-alt-clean-reskin-2` has a "Web analytics" section for Plausible (cookie-free, EU-hosted, Art. 6(1)(f) GDPR, right to object) as a draft for operator/legal review; the imprint is unchanged; the tracking tag is not added (Phase 10)
- Noted for Phase 10/12: when analytics is switched on, add a consent banner and update the Data Protection Notice (CUT-03) (superseded for the banner by Phase 10 D-04: no banner, Plausible is cookie-free; confirmation with the legal reviewer is an open item in docs/analytics.md; the Data Protection Notice update stands via RETL-05/CUT-03)

## SFDY Cutover (Phase 12) — draft, to be refined in discuss/plan

- [ ] **CUT-01**: `sfdy-alt-clean-reskin-2` has no jobs pages, jobs content entries, `JobRow` component or jobs links in Nav/Footer, and builds cleanly; the job files stay recoverable from git history
- [ ] **CUT-02**: No internal-review page or text (`/open-points`, "internal review only") ships in a production build of `reskin-2`
- [ ] **CUT-03**: Impressum and privacy pages of `reskin-2` are reviewed for production, including the Plausible section if analytics is on
- [ ] **CUT-04**: `reskin-2` carries the production identity in `wiring.json` (`prod_repo`, `domain`, stage 5 or higher) and `/wm-preflight` passes
- [ ] **CUT-05**: Contributor content pushed to the production repo's `content/` reaches the new site (the dispatch slug in the production repo's `content-ci.yml` is corrected, or the site is renamed), and the unused `content/jobs/` folder is handled
- [ ] **CUT-06**: `/wm-publish` deploys `reskin-2` to www.starflight-dynamics.com; the live site, CNAME and `robots.txt` are verified; the `CLAUDE.md` ownership table and `wiring.json` (stage 6, `last_deploy`) are updated

## Future Requirements (backlog, not in this milestone)

- **LOCK-01..**: Locked Drops (backlog Phase 999.1) — local CLI encrypts with a random AES-GCM key; only ciphertext is committed under a random filename; key in the URL fragment (`/d/#<id>.<key>`) with an optional generated passphrase; expiry bound into key derivation and checked against UTC from the `Date` header; soft expiry only; unlock page; `/wm-drop` extension. Constraint to keep now: analytics must never record URL fragments
- Self-hosted Plausible (runbook only; the existing `host` switch makes cutover a config change) — parked in `PARKED.md`
- Analytics rollout to further sites; drops rollout to further sites
- Per-recipient drop ids and "opened" tracking; scheduled auto-publish for expiry

## Out of Scope

| Feature | Reason |
|---|---|
| Cloudflare Worker / edge enforcement | Second service; user wants lightweight |
| Vault master-secret token scheme | Unneeded without server-side enforcement |
| Scheduled auto-publish for expiry | Conflicts with no-auto-publish (D-A6) and needs a PAT |
| Astro upgrade (5.x → 7.x) | Four live sites would take unrelated risk |
| Scheduled/CI auto-pull from Claude Design | DesignSync is model-side only; violates operator review |
| Two-way merge engine for design pulls | Complexity; divergence guard (DSYNC-06) is sufficient |
| A second analytics service or `@plausible-analytics/tracker` | One subscription only |
| Hash-based (fragment) Plausible tracking | Would leak Phase 12 keys |

## Notes

- **Plausible plan:** official docs state custom properties and the Stats API are Business-plan features (600 requests/hour per key). Plausible's home page lists Starter $9 (1 site), Growth $14 (up to 3 sites), Business $19 (up to 10 sites) for up to 10k monthly pageviews, with a 30-day trial without a card (the pricing page itself returned 404; prices unverified there). Production-only fits Starter; production plus the shared sandbox site needs Growth; Business is needed only for custom properties (drop `label`) and the Stats API tile (ANLY-07, DROP-06 label grouping). Suggested: start the trial and decide when it ends.
- **Operator actions (not code):** create the Plausible account and site, sign the DPA, add the Plausible text to the SFDY privacy policy before switching analytics on.
- **Baseline (2026-10-14):** `sfdy-alt-clean-reskin-2` is the SFDY baseline; `sfdy`, `sfdy-alt-clean`, `sfdy-alt-clean-reskin` and `sfdy-alt-clean-variant` are archived. The live www.starflight-dynamics.com keeps serving its last published build until the Phase 12 cutover.

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| DSYNC-01 | Phase 9 | Complete |
| DSYNC-02 | Phase 9 | Complete |
| DSYNC-03 | Phase 9 | Complete |
| DSYNC-04 | Phase 9 | Complete |
| DSYNC-05 | Phase 9 | Complete |
| DSYNC-06 | Phase 9 | Complete |
| DSYNC-07 | Phase 9 | Complete |
| DSYNC-08 | Phase 9 | Complete |
| DSYNC-09 | Phase 9 | Complete |
| DSYNC-10 | Phase 9 | Complete |
| DSYNC-11 | Phase 9 | Built (script + skill, fixture-tested); live seeding run deferred by operator 2026-10-14 |
| DSYNC-12 | Phase 9 | Complete |
| DSYNC-13 | Phase 9 | Complete |
| ANLY-01 | Phase 10 | Complete |
| ANLY-02 | Phase 10 | Complete |
| ANLY-03 | Phase 10 | Complete |
| ANLY-04 | Phase 10 | Complete |
| ANLY-05 | Phase 10 | Complete |
| ANLY-06 | Phase 10 | Pending |
| ANLY-07 | Phase 10 | Pending |
| ANLY-08 | Phase 10 | Pending |
| ANLY-09 | Phase 10 | Pending |
| DROP-01 | Phase 11 | Pending |
| DROP-02 | Phase 11 | Pending |
| DROP-03 | Phase 11 | Pending |
| DROP-04 | Phase 11 | Pending |
| DROP-05 | Phase 11 | Pending |
| DROP-06 | Phase 11 | Pending |
| DROP-07 | Phase 11 | Pending |
| DROP-08 | Phase 11 | Pending |
| DROP-09 | Phase 11 | Pending |
| DROP-10 | Phase 11 | Pending |
| RETL-01 | Phase 11.1 | Pending |
| RETL-02 | Phase 11.1 | Pending |
| RETL-03 | Phase 11.1 | Pending |
| RETL-04 | Phase 11.1 | Pending |
| RETL-05 | Phase 11.1 | Pending |
| CUT-01 | Phase 12 (satisfied by RETL-04 in Phase 11.1) | Pending |
| CUT-02 | Phase 12 | Pending |
| CUT-03 | Phase 12 | Pending |
| CUT-04 | Phase 12 | Pending |
| CUT-05 | Phase 12 | Pending |
| CUT-06 | Phase 12 | Pending |
| LOCK-01.. | Phase 999.1 (backlog) | Not in milestone |

**Coverage:** 32/32 v1.2 requirements mapped (DSYNC 13, ANLY 9, DROP 10); no orphans, no duplicates

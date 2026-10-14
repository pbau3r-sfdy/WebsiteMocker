# Phase 12: SFDY Cutover - Context

**Gathered:** 2026-10-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Make `sfdy-alt-clean-reskin-2` the live www.starflight-dynamics.com and the single SFDY baseline, under the new slug `sfdy`. The old build (archived `sfdy-alt-clean`, last deployed 2026-08-08) is replaced; the production repo `pbau3r-sfdy/starflight-dynamics` and the domain stay. In scope: rename, internal-page gating, legal checklist, production identity, contributor-sync fix, backup, publish, live verification, and the final design seed (CUT-07). Out of scope: Open Drops (Phase 11), real job postings (content update after launch).

</domain>

<decisions>
## Implementation Decisions

### Site identity and old site
- **D-01:** The baseline is renamed from `sfdy-alt-clean-reskin-2` to **`sfdy`**: folder, build and dist path, sandbox URL (`.../WebsiteMocker/sfdy/`), dashboard entry, `wiring.json` slug, CLAUDE.md ownership table and every doc that names reskin-2. "Retire the old slug (archive), rename everything, it is our new baseline."
- **D-02:** `sites/sfdy` already exists as an archived site (commit 24dbf5a "archive sfdy, levion, crestworks-legacy"). It must be dealt with before the rename (delete it permanently via `_scripts/delete-site.mjs sfdy --confirm`, or move it aside); the plan must make this explicit and check for leftover dist and workflow references. Git history keeps it.
- **D-03:** The old `sfdy-alt-clean` stays archived; its `prod_repo` and `domain` are removed from its wiring.json so the baseline is the single owner of `pbau3r-sfdy/starflight-dynamics`. The other reskin variants (`sfdy-alt-clean-reskin`, `sfdy-alt-clean-variant`) are not touched in this phase.
- **D-04:** The baseline stays a working sandbox site as well as production: it is where secret drops (Phase 11) and further improvements are tested. Production is a publish of this one site, not a fork.

### Internal pages in production
- **D-05:** `/open-points`, the yellow `Tbd` markers and the footer link are **gated on the production build** (`SITE_BASE=/`): page not generated, footer link hidden, Tbd markers render as plain text. The machinery stays for sandbox review. A build check fails if "internal review" text or `/open-points` appears in a production `dist`. No publish block on open items (the list is empty today).
- **D-06:** Legal pages (CUT-03): Claude prepares a **checklist** of every legal-relevant statement (Plausible section, Applications and joint controller, hosting, newsletter, socials, imprint data) for the operator or a lawyer to sign off. Not a blocking gate in the plan. The no-consent-banner decision stands (Phase 10 D-04, operator-confirmed 2026-10-14: no cookies set).

### Contributor sync and jobs content
- **D-07:** The `content/jobs/` folder in the production repo **stays** and is used for the real postings once they exist. The new site has no jobs collection until then; the sync must not fail or copy stale old postings into the site (plan decides how: skip or no-op until the collection returns; the jobs machinery is restorable from commit `7943369^`).
- **D-08:** The dispatch slug in the production repo's `.github/workflows/content-ci.yml` (now `sfdy-alt-clean`) is changed to **`sfdy`** and **verified with a live test push**: a harmless content change reaches `sites/sfdy/src/content/` via `content-sync.yml`; the test file is reverted afterwards. The `_templates` copy (`_templates/.github/workflows/content-ci.yml`) and `init-prod-repo.mjs` are checked for the same slug assumption.

### Go-live and rollback
- **D-09:** Publish **as soon as all checks pass** (preflight, build checks, legal checklist handed over, sync test). Careers stays "Coming soon" (in the coming days); real postings are a normal content update afterwards.
- **D-10:** Before publishing, push the current `gh-pages` of `pbau3r-sfdy/starflight-dynamics` to a backup branch (for example `gh-pages-old-2026-08`). Rollback = restore that branch. After publish verify: CNAME `www.starflight-dynamics.com`, `robots.txt`, HTTPS, key pages (home, about, capabilities, contact, privacy, imprint, `/jobs`), 404 page, and a Plausible pageview from the live domain.
- **D-11:** Phase 10 carry-over: remove `analytics.sandboxUsesProdId` from the baseline's wiring.json at cutover (`/wm-preflight` warns while set), rebuild, then consider a Plausible hostname allowlist for starflight-dynamics.com. `wiring.json` gets `prod_repo`, `domain` and stage 5, then stage 6 and `last_deploy` after publish.
- **D-12:** Design seed (CUT-07) is the very last step, after the live site is verified: **update the existing "Starflight Dynamics Design System"** project (baa6f65c-d546-41fc-b2bd-d81d7c6da089), incrementally, only approved paths (`tokens/colors.css`, `assets/logo/*`), no deletes, no `uploads/`; operator approves the path list and `finalize_plan`. Closes DSYNC-11 and phase 9.

### Claude's Discretion
- Exact build-check implementation for D-05, how the sync treats `content/jobs/` until the collection returns (D-07), checklist format for D-06, backup branch name, order of rename vs production-identity edits.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and roadmap
- `.planning/ROADMAP.md` Phase 12 and Phase 11.1 notes: goal, success criteria, notes from Phase 10
- `.planning/REQUIREMENTS.md` CUT-01..CUT-07, DSYNC-11
- `.planning/phases/10-analytics/10-CONTEXT.md` and `docs/analytics.md`: analytics identity, sandbox debug opt-in, no-banner decision
- `.planning/phases/11.1-retool-sfdy-alt-clean-reskin-2-before-cutover-review-feedbac/11.1-CONTEXT.md`: retool decisions (hero, jobs removal, privacy draft)

### Publish pipeline and collaboration
- `.claude/skills/wm-publish.md`, `.claude/skills/wm-preflight.md`, `.claude/skills/wm-init-collab.md`
- `.github/workflows/publish.yml` (includes the analytics privacy gate), `.github/workflows/content-sync.yml`
- `_templates/.github/workflows/content-ci.yml` and `_templates/CONTRIBUTING.md`; `_scripts/init-prod-repo.mjs`
- `_scripts/archive-site.mjs`, `_scripts/delete-site.mjs`, `_scripts/check-analytics-gate.mjs`
- `CLAUDE.md` sections: Site categories, Site lifecycle, Site ownership, Production deployment model, Contributor collaboration

### Design seed
- `.claude/skills/wm-design-seed.md`, `_scripts/design-seed.mjs`; `.planning/phases/09-claude-design-connectivity/09-09-SUMMARY.md`

### External state (verified 2026-10-14)
- Production repo `pbau3r-sfdy/starflight-dynamics`: branches `main` (`content/{announcements,blog,news,jobs}`, `.github`, `CONTRIBUTING.md`) and `gh-pages`; Pages CNAME `www.starflight-dynamics.com`; DNS CNAME to `pbau3r-sfdy.github.io`; its `content-ci.yml` dispatches slug `sfdy-alt-clean`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `_scripts/archive-site.mjs` / `delete-site.mjs`: handle the old slug and the leftover `sites/sfdy`
- `_scripts/check-analytics-gate.mjs --live` and `verify-phase-10.sh`: already guard publish for analytics
- `_scripts/verify-phase-11-1.sh`: asserts the retool state (hero, jobs removal, privacy) and must be renamed or parameterised with the slug
- `/wm-preflight`, `/wm-publish`, `/wm-init-collab`: the existing publish and collaboration path

### Established Patterns
- Slug appears in: `sites/<slug>/`, `wiring.json`, `astro.config.mjs` base (`/WebsiteMocker/<slug>`), dashboard data, `content-sync.yml` mapping, harness scripts and fixtures, docs and CLAUDE.md tables; production builds use `SITE_URL` and `SITE_BASE=/`
- Internal pages: `src/pages/open-points.astro`, `src/data/open-points.ts`, `src/components/Tbd.astro`, Footer link, `Layout.astro` reference

### Integration Points
- Rename touches the sandbox deploy (`deploy.yml`), dashboard and every harness path referencing `sfdy-alt-clean-reskin-2` (verify-phase-10.sh and fixtures, verify-phase-11-1.sh, UAT and planning docs)
- Publish writes the production repo's `gh-pages`; contributor flow dispatches to WebsiteMocker `content-sync.yml`

</code_context>

<specifics>
## Specific Ideas

- The baseline is "our new baseline": one site that is both production and the testbed for drops and improvements.
- Careers launches in the coming days with the "Coming soon" page live at cutover.
- Operator wants a way back: backup branch before the publish.

</specifics>

<deferred>
## Deferred Ideas

- Real job postings (content update after launch; restore the jobs collection from `7943369^` when they arrive)
- Open Drops (Phase 11), built on the new baseline after the cutover
- Plausible hostname allowlist (considered after cutover)
- Cleaning up the other reskin variants (`sfdy-alt-clean-reskin`, `sfdy-alt-clean-variant`)

</deferred>

---

*Phase: 12-sfdy-cutover*
*Context gathered: 2026-10-14*

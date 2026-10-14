# Phase 8: Cleanup & Verification - Context

**Gathered:** 2026-08-25
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers six bounded cleanup and verification tasks that close out v1.0 tech debt and ensure crestworks is fully operational as an active site:

1. **DEXP-04** — Fix stale `02-VERIFICATION.md`: read the current card component code to confirm the 05e614a fix is in place, then update the verification doc to reflect current state (remove stale CR-01 warning).
2. **DEXP-05** — Full live end-to-end verification of Phase 4 (Collaboration Infrastructure), then write `04-VALIDATION.md`. "Live" means actually pushing a test content file to an active prod repo and verifying `content-sync.yml` triggers and syncs correctly.
3. **DEXP-06** — Full live end-to-end verification of Phase 5 (Design Artifact Ingestion), then write `05-VALIDATION.md`. "Live" means running `ingest-artifact.mjs` on a real artifact and verifying the output.
4. **HSK-01** — crestworks: add jobs/announcements/blog page routes (index.astro + [slug].astro each), plus 1 stub content post per new collection. No nav changes — nav rewire is a future phase.
5. **HSK-02** — Replace hardcoded `#384AD3` with `var(--accent)` in `_core` newsletter button, AND propagate to all active sites (sfdy-alt-clean, mogwai-systems, parrot-capital, crestworks) that still have the hardcoded value.
6. **HSK-03** — Adopt SITE_URL/SITE_BASE env-var pattern in `_core/astro.config.mjs`, AND propagate to all active sites that still use a hardcoded base path (sfdy-alt-clean confirmed; check mogwai-systems and parrot-capital).

**What this phase does NOT do:** New features, content design for crestworks, nav redesign, route/nav work on other active sites (they already have all 4 content routes wired).

</domain>

<decisions>
## Implementation Decisions

### _core Fix Propagation (HSK-02 + HSK-03)

- **D-01:** Both `_core` fixes propagate to **all active sites**. Executor must grep for `#384AD3` across `sites/sfdy-alt-clean/`, `sites/mogwai-systems/`, `sites/parrot-capital/`, `sites/crestworks/` and patch any hits (HSK-02). Similarly, check `astro.config.mjs` in each active site for hardcoded base paths and apply the env-var pattern (HSK-03). `sfdy-alt-clean` is confirmed hardcoded per ARCHITECTURE.md. Mogwai-systems and parrot-capital need checking.
- **D-02:** The env-var pattern to use (from `sites/crestworks/astro.config.mjs` as reference):
  ```js
  const SITE_URL = process.env.SITE_URL || 'https://pbau3r-sfdy.github.io';
  const SITE_BASE = process.env.SITE_BASE || '/WebsiteMocker/<slug>';
  export default defineConfig({ site: SITE_URL, base: SITE_BASE, output: 'static' });
  ```
  In `_core/astro.config.mjs`, the fallback uses `{{SITE_SLUG}}` placeholder so `new-site.sh` still substitutes it correctly.
- **D-03:** Other active sites (sfdy-alt-clean, mogwai-systems, parrot-capital) already have all 4 content route dirs wired and nav links in place. No route or nav work needed for those sites — token fixes only.

### crestworks Content Routes (HSK-01)

- **D-04:** Add 3 route file pairs: `pages/jobs/index.astro` + `pages/jobs/[slug].astro`, `pages/announcements/index.astro` + `pages/announcements/[slug].astro`, `pages/blog/index.astro` + `pages/blog/[slug].astro`. Use parrot-capital's equivalent routes as the pattern reference.
- **D-05:** Add 1 stub content post per new collection so pages render non-empty on first build. Use correct schema fields from `_core/src/content.config.ts` (newsSchema, jobsSchema, announcementsSchema, blogSchema are already imported in `sites/crestworks/src/content.config.ts`).
- **D-06:** Nav unchanged — crestworks is a landing page and a nav redesign hasn't been planned. Routes are reachable by URL; nav wiring is deferred to a future phase.

### Verification Record Approach (DEXP-04, DEXP-05, DEXP-06)

- **D-07:** DEXP-04: verify the card component code first (read `_core/src/components/AnnouncementCard.astro`, `BlogCard.astro`, `JobCard.astro`) to confirm 05e614a fix is present, then update `02-VERIFICATION.md` to correct the stale CR-01 entry.
- **D-08:** DEXP-05 (Phase 4 / Collaboration Infrastructure): full end-to-end live verification — actually push a test `.md` file to an active prod repo using `gh` CLI and verify `content-sync.yml` triggers and syncs into WebsiteMocker. Then write `04-VALIDATION.md` in `.planning/phases/04-collaboration-infrastructure/`.
- **D-09:** DEXP-06 (Phase 5 / Design Artifact Ingestion): full end-to-end live verification — run `ingest-artifact.mjs` on a real artifact (HTML file or zip) and verify the output is correct. Then write `05-VALIDATION.md` in `.planning/phases/05-design-artifact-ingestion/`.

### Claude's Discretion

- Which specific active prod repo to use for the Phase 4 end-to-end test (recommend using a test `.md` that can be safely pushed and cleaned up, against one of: starflight-dynamics, mogwai-systems, or parrot-capital).
- Which artifact to use for the Phase 5 ingest test (recommend a minimal test HTML file or reusing an existing capture in `_captures/`).
- Exact content of stub posts for crestworks new routes (use realistic but clearly dummy data matching the schema).
- Whether to run `npm run build` after all changes to confirm no regressions (recommended: yes).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core template (source of truth for token fixes)
- `_core/astro.config.mjs` — Current hardcoded placeholder config that HSK-03 fixes.
- `_core/src/pages/index.astro` — Contains `#384AD3` that HSK-02 fixes.
- `sites/crestworks/astro.config.mjs` — Reference env-var pattern implementation (SITE_URL/SITE_BASE).

### crestworks routes
- `sites/parrot-capital/src/pages/blog/index.astro` — Reference route for HSK-01 page files.
- `sites/parrot-capital/src/pages/jobs/index.astro` — Reference route.
- `sites/parrot-capital/src/pages/announcements/index.astro` — Reference route.
- `sites/crestworks/src/content.config.ts` — Already defines all 4 schemas (news, jobs, announcements, blog). Read before writing any page routes.
- `_core/src/content.config.ts` — Shared Zod schema definitions. Read to understand schema fields for stub content posts.

### Verification targets
- `.planning/phases/02-content-system/02-VERIFICATION.md` — The stale doc to correct (DEXP-04). Read before editing.
- `.planning/phases/04-collaboration-infrastructure/04-PLAN.md` (and other 04-*.md files) — Must-haves list for DEXP-05 live verification.
- `.planning/phases/05-design-artifact-ingestion/05-PLAN.md` (and other 05-*.md files) — Must-haves list for DEXP-06 live verification.

### Project conventions
- `.planning/REQUIREMENTS.md` — DEXP-04–06, HSK-01–03. All 6 must be satisfied.
- `CLAUDE.md` — Site ownership table, active sites list, production deployment model.
- `.planning/codebase/CONVENTIONS.md` — Script naming, astro component patterns.
- `.planning/codebase/ARCHITECTURE.md` — Anti-pattern section on `_core` propagation rule and base-path env-var pattern.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `sites/parrot-capital/src/pages/blog/index.astro` + `[slug].astro` — Direct copy-adapt template for crestworks new routes.
- `sites/crestworks/src/content.config.ts` — All 4 schemas already wired; no schema changes needed.
- Existing stub posts in `sites/parrot-capital/src/content/` — Reference for stub content format.

### Established Patterns
- **env-var pattern:** `const SITE_BASE = process.env.SITE_BASE || '/WebsiteMocker/<slug>'` — in use in crestworks, must match exactly in `_core` and other active sites.
- **Base URL alias:** `const b = import.meta.env.BASE_URL.replace(/\/$/, '')` — declared at top of every Astro component page; use in new crestworks route files.
- **Card imports:** parrot-capital imports cards from `../../../../../_core/src/components/BlogCard.astro` — deep relative path pattern; crestworks will use same depth.
- **_core as scaffold-only:** Changes to `_core` do NOT auto-propagate. Each active site must be individually patched.

### Integration Points
- New crestworks routes connect to the existing content.config.ts collections (jobs, announcements, blog already defined).
- `_core/astro.config.mjs` is consumed by `_scripts/new-site.sh` via `sed` substitution — the `{{SITE_SLUG}}` token must remain in the fallback value after HSK-03 fix.
- `content-sync.yml` (for DEXP-05 test) is triggered by a workflow dispatch from prod repo `content-ci.yml` — requires `WM_DISPATCH_PAT` secret to be configured.

</code_context>

<specifics>
## Specific Ideas

- The failing card pattern (DEXP-04) was fixed in commit `05e614a` — the executor should `git log --oneline` to confirm, and read the actual card files to verify `BASE_URL` usage is present before updating the verification doc.
- For the Phase 4 end-to-end test (DEXP-05), the exec needs to push a `.md` file to a real prod repo, observe the `content-ci.yml` dispatch, and verify the sync result in WebsiteMocker. Clean up the test file after verification.
- crestworks is branded with `--accent: #ff2f92` (from `wiring.json`) — the newsletter button fix should inherit this correctly via `var(--accent)`.

</specifics>

<deferred>
## Deferred Ideas

- crestworks nav redesign — adding links to jobs/announcements/blog in the site header. No design exists yet; deferred to a future phase.
- sfdy-alt-clean, mogwai-systems, parrot-capital route audit — confirmed already complete (all 4 routes wired). No action needed.

</deferred>

---

*Phase: 8-cleanup-verification*
*Context gathered: 2026-08-25*

# Phase 11: Open Drops - Context

**Gathered:** 2026-10-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Operator can share a confidential-but-not-secret early draft as an unguessable, unindexed, expiring and withdrawable page at `/d/<id>/`, with views and downloads tracked without leaking the drop id. Built and verified on the SFDY baseline, which is now the live site under slug **`sfdy`** (Phase 12). Out of scope: encrypted Locked Drops (backlog 999.1), a Plausible plan upgrade, making the production repo private.

Requirements DROP-01..DROP-10 stay the contract. Where they name `sfdy-alt-clean-reskin-2` read `sfdy`.

</domain>

<decisions>
## Implementation Decisions

### Where drop sources live
- **D-01:** Drop sources (Markdown body, metadata, PDFs) live in a **private GitHub repo `pbau3r-sfdy/drops`**, one folder per site slug (for example `sfdy/<id>/`). They are never committed to WebsiteMocker (public) or to the production repo's `main`. Claude creates the repo only with the operator's explicit approval.
- **D-02:** The publish workflow reads the private repo with the **existing `WM_PUBLISH_PAT`** (operator choice: no new secret). The plan must extend that token's repository access to `pbau3r-sfdy/drops` (operator action, read access) and must document that one token now writes the site and reads confidential drafts. No secret value is ever read or printed by Claude.
- **D-03:** The built drop (`dist/d/<id>/`) is published to the public production repo's `gh-pages` tree. **Accepted and documented**: the URL is unguessable (32-hex) but the folder is visible to anyone browsing the public gh-pages tree; withdrawal is unlisting only (git history, CDN, web archives may retain copies). Docs and `/wm-drop` state this plainly (DROP-08, DROP-10).

### Expiry that takes effect
- **D-04:** Expiry stays enforced at build time (DROP-04). Expired drops are removed by a **manual sweep** (`node _scripts/drop.mjs expire`) plus a `/wm-publish`; a **scheduled check only warns** (notifies, never auto-publishes) when a drop has expired but is still live. `/wm-preflight` and `/wm-publish` warn about expired, soon-expiring and expiry-less drops (DROP-07). Maximum expiry horizon and default are Claude's discretion (suggest a horizon of 90 days; mandatory `expires`).
- **D-05:** After expiry or withdrawal a visitor sees the site's normal 404 page; the live URL is checked for 404 after the next publish (DROP-08, DROP-09 live mode).

### Secret health
- **D-06:** Because `WM_PUBLISH_PAT` now also guards confidential drafts and its lapse already broke the contributor sync once, add a **nightly scheduled token check workflow** that tests the token (including read access to the drops repo), fails loudly so GitHub's failure notification alerts the operator, and writes the token's expiry date into the docs with a renewal checklist. It must not print the token or call the vault.

### Tracking without leaking the id
- **D-07:** Phase 10 runs in sanitised mode with custom properties off (current Plausible plan). Drop views report as a **masked `/d/` pageview** (the id never appears in a path or property) and downloads fire a plain **`Drop Download`** goal without a per-drop label. Per-drop reporting by label (DROP-06's "grouped by label") is **deferred until a Business-plan decision**; the plan must make the label grouping conditional on custom properties being available. Extend the Phase 10 sanitiser vectors with `/d/<32-hex>/` and add a harness check that the id is absent from payloads.

### Creating drops and trying them
- **D-08:** `/wm-drop` (and `node _scripts/drop.mjs new|list|withdraw|expire`) takes title, label, expiry, Markdown and optional PDFs, generates the 32-hex id from `crypto.randomBytes(16)`, writes into the private repo, and strips PDF metadata with a tool that must exist locally and in CI (build fails if missing, DROP-05). The researcher chooses the tool (for example exiftool or qpdf) and checks CI availability.
- **D-09:** Preview with **`DROPS_PREVIEW=1`** on a **local** sandbox build only. The public sandbox deploy (`deploy.yml`) never sets it and never has access to the drops repo, so drops are never published to the public sandbox. A harness check asserts the sandbox build has no `/d/` without the flag (DROP-04, DROP-09).

### Claude's Discretion
- Collection schema details, `DropLayout` markup, id/label field names, expiry horizon number, notification mechanism for the expired-but-live warning, PDF tool choice, how the build fetches the private repo (checkout step with the PAT) and caches it.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and roadmap
- `.planning/ROADMAP.md` Phase 11 and backlog 999.1 (Locked Drops, out of scope)
- `.planning/REQUIREMENTS.md` DROP-01..DROP-10
- `.planning/phases/12-sfdy-cutover/12-CONTEXT.md` (baseline `sfdy` is production and the testbed for drops; slug rename; publish and rollback model)
- `.planning/phases/10-analytics/10-CONTEXT.md`, `docs/analytics.md`, `_scripts/lib/plausible-snippet.mjs` (sanitised mode, event contract, id masking)

### Publish pipeline
- `.github/workflows/publish.yml`, `.github/workflows/deploy.yml`, `.claude/skills/wm-publish.md`, `.claude/skills/wm-preflight.md`
- `_scripts/check-analytics-gate.mjs`, `_scripts/verify-phase-10.sh`, `_scripts/verify-phase-12.sh` (harness style)

### External state (verified 2026-10-14)
- Production repo `pbau3r-sfdy/starflight-dynamics` is public (gh-pages visible to all); WebsiteMocker is public; `WM_PUBLISH_PAT` secret exists in WebsiteMocker (updated 2026-10-14 15:50 UTC); there is no private `pbau3r-sfdy/drops` repo yet.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `sites/sfdy/` (live baseline): content collections in `src/content.config.ts`, layouts, PageHero, noindex gating pattern from Phase 12 (`SHOW_INTERNAL`, `injectRoute` in `_scripts/internal-pages.mjs`)
- `_scripts/lib/env.mjs` `isSandbox`, `_scripts/lib/plausible-snippet.mjs` sanitiser and `exclude`
- `_scripts/sync-content.sh` (content sync guard pattern), harness scripts as templates

### Established Patterns
- Slug-driven site folders; production build uses `SITE_BASE=/`, sandbox base `/WebsiteMocker/<slug>`; harnesses `verify-phase-NN.sh` with static and live modes; explicit-path commits only

### Integration Points
- A new build step must fetch `pbau3r-sfdy/drops` in `publish.yml` only (never `deploy.yml`) using `WM_PUBLISH_PAT`; the `_core` shared route and layout, `wiring.json` `drops.enabled`, sitemap/RSS/dashboard/content-sync exclusion

</code_context>

<specifics>
## Specific Ideas

- Operator wants secrets kept current: no new secret if avoidable, and a token that guards confidential drafts must not lapse silently.
- Drops stay "confidential but not secret": not for export-controlled or classified data.

</specifics>

<deferred>
## Deferred Ideas

- Per-drop analytics label (needs Plausible Business plan)
- Scheduled automatic republish to enforce expiry nightly
- Making the production repo private (removes gh-pages tree exposure)
- Locked Drops (encrypted, key in URL fragment): backlog 999.1

</deferred>

---

*Phase: 11-open-drops*
*Context gathered: 2026-10-14*

# Phase 1: Production Deploy Pipeline - Context

**Gathered:** 2026-08-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Operator can run `/wm-publish <slug>` on any stage-5 site and the built output lands on the production repo's `gh-pages` branch, the live site appears at the custom domain, `wiring.json` is updated to `stage: 6`, and a Squarespace DNS handoff guide is printed to the terminal. Nothing is manual after the operator invokes the skill.

</domain>

<decisions>
## Implementation Decisions

### Publish Invocation Model
- **D-01:** `/wm-publish <slug>` is a Claude skill that validates `wiring.json` and triggers `publish.yml` via `gh workflow run publish.yml --field slug=<slug>`. GitHub Actions owns the build + push; the operator stays in Claude.
- **D-02:** Before triggering, `/wm-publish` runs `/wm-preflight <slug>` and blocks on any FAIL items (stage ≥ 5, domain, prod_repo, legal). Clear errors before the build starts.

### GitHub Org
- **D-03:** The confirmed production GitHub org is `pbau3r-sfdy`. The `[websites-org]` placeholder in CLAUDE.md should be replaced with `pbau3r-sfdy`. No separate org is planned. (Evidence: `sfdy-alt-clean/wiring.json` already uses `"prod_repo": "pbau3r-sfdy/starflight-dynamics"`.)

### publish.yml Workflow
- **D-04:** `publish.yml` is `workflow_dispatch` only for this phase — triggered via `gh workflow run`. No `repository_dispatch` yet; that's added in Phase 4 when `content-ci.yml` needs automated rebuilds.
- **D-05:** Authentication: `WM_PUBLISH_PAT` (Classic PAT, `repo` scope) stored as a repo-level Actions secret on the WebsiteMocker repo (or org-level if available). `GITHUB_TOKEN` is NOT used for cross-repo push.
- **D-06:** robots.txt swap is injected by `publish.yml` **after** build — a sed/echo step overwrites `dist/<slug>/robots.txt` with `Allow: /`. The source `robots.txt` in `public/` stays `Disallow: /` (sandbox-safe).
- **D-07:** `publish.yml` writes a `CNAME` file (containing `wiring.json.domain`) into `dist/<slug>/` before pushing, so the custom domain persists across redeploys.
- **D-08:** After a successful `gh-pages` push, `publish.yml` updates `wiring.json` (`stage: 6`, `last_deploy: YYYY-MM-DD`, `prod_repo`) via a commit back to `main`.

### Build Isolation
- **D-09:** `_scripts/build-single.mjs <slug>` builds only the target site and writes output to `dist/<slug>/` — matching the structure that `build-all.js` already uses. `publish.yml` then pushes `dist/<slug>/` to the production repo.

### DNS Handoff Guide
- **D-10:** The Squarespace DNS handoff guide is auto-generated and printed to the terminal at the end of a successful `/wm-publish` run. Contents: CNAME record (pointing to GitHub Pages), apex A records, CAA check, SSL provisioning wait instructions, default-record-deletion warning. No separate skill needed for Phase 1.

### Claude's Discretion
- Exact YAML structure of `publish.yml` (steps, action versions, error handling) — planner/executor decides.
- Whether `wiring.json` update in Step D-08 is committed by the workflow itself or requires a separate operator commit — executor decides based on PAT scopes available.
- Exact format of the DNS guide output (markdown block vs plain text) — executor decides.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Deploy Infrastructure
- `.github/workflows/deploy.yml` — The working sandbox deploy workflow. `publish.yml` follows the same structure (checkout → setup-node → npm ci → build → push) but targets a production repo via PAT. Use this as the template.
- `_scripts/build-all.js` — Existing multi-site build script. `build-single.mjs` should follow the same site-discovery logic but accept a `<slug>` arg and skip all other sites.

### Existing Skill Patterns
- `.claude/skills/wm-deploy.md` — Sandbox deploy skill. `/wm-publish` follows the same validate → build-trigger → report-URL pattern but for production.
- `.claude/skills/wm-preflight.md` — Preflight checklist skill. `/wm-publish` invokes this first; it defines the FAIL conditions that block the deploy.

### Site Wiring Contract
- `sites/sfdy-alt-clean/wiring.json` — Reference `wiring.json` for a stage-6 site. Fields that `publish.yml` reads: `stage`, `domain`, `prod_repo`, `last_deploy`. Fields that `publish.yml` writes back: `stage: 6`, `last_deploy`.
- `CLAUDE.md` — Site lifecycle documentation. The `[websites-org]` placeholder should be updated to `pbau3r-sfdy` as part of this phase.

### Requirements
- `.planning/REQUIREMENTS.md` §Deploy Pipeline — DEPLOY-01 through DEPLOY-08 are the authoritative requirement list for this phase.
- `.planning/ROADMAP.md` §Phase 1 — Success criteria (5 items) define what "done" looks like.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `JamesIves/github-pages-deploy-action@v4.8.0` (in `deploy.yml`): Already pinned and proven in this repo for gh-pages push. `publish.yml` can use the same action but pointed at the production repo (with `token: ${{ secrets.WM_PUBLISH_PAT }}` and `repository: <prod_repo>`).
- `_scripts/build-all.js`: The site-discovery loop (reads `wiring.json` per site, skips `skip_ci: true` and `archived: true`) should be extracted into a shared utility that `build-single.mjs` also uses.
- `wm-preflight.md`: Already defines all the checks. `/wm-publish` just needs to invoke this skill first.

### Established Patterns
- **Sandbox deploy pattern**: Skill validates → `git push origin main` → GitHub Actions handles build + deploy. `/wm-publish` follows this same inversion (skill validates + triggers, GHA does the work) but uses `workflow_dispatch` instead of a push trigger.
- **wiring.json as source of truth**: All site configuration (stage, domain, prod_repo) lives in `wiring.json`. `publish.yml` reads this file; it should not accept these values as workflow inputs to avoid drift.
- **Pinned action versions**: `deploy.yml` uses pinned major versions (`@v7`, `@v4.8.0`). `publish.yml` should follow the same pinning discipline.

### Integration Points
- `publish.yml` reads `sites/<slug>/wiring.json` to get `domain` and `prod_repo`
- `publish.yml` writes back to `sites/<slug>/wiring.json` after successful deploy (stage, last_deploy)
- `/wm-publish` skill checks `gh run watch` or polls for workflow completion before printing the DNS guide
- CNAME file must land at the root of the pushed gh-pages branch (not inside a subfolder)

</code_context>

<specifics>
## Specific Ideas

- The DNS guide should be printed inline (not a file) so the operator can copy-paste records directly into Squarespace without opening another file.
- `build-single.mjs` should fail fast with a clear error if `<slug>` doesn't match any site in `sites/`.
- `publish.yml` should exit with a non-zero code (not just a warning) if `stage < 5`, `domain` is missing, or `prod_repo` is missing — so `gh workflow run` failures are visible in the terminal.

</specifics>

<deferred>
## Deferred Ideas

- `repository_dispatch` trigger in `publish.yml` — deferred to Phase 4 when `content-ci.yml` needs to trigger automated rebuilds from contributor content pushes.
- Separate `/wm-dns-guide` skill — not needed; DNS guide is inline with `/wm-publish` output.
- Org-level PAT secret — can be set up at org level for cleaner secret management, but not required for Phase 1 correctness. Executor decides based on what's available.

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Production Deploy Pipeline*
*Context gathered: 2026-08-20*

# Phase 12: SFDY Cutover - Research

**Researched:** 2026-10-14
**Domain:** Monorepo slug rename, Astro production-build gating, GitHub Pages publish/rollback, cross-repo contributor sync
**Confidence:** HIGH for repo facts (all read from the working tree and read-only `gh` calls this session); MEDIUM for `injectRoute` behaviour (docs read, not yet spiked); LOW only where tagged `[ASSUMED]`

## Summary

Phase 12 is almost entirely repo hygiene and operator-gated external steps; no new packages are needed. The rename is small in code (a `rename-site.mjs` script already exists and does `git mv` plus `wiring.json` and `astro.config.mjs`), but it misses `package.json` name, the lockfile, READMEs, two verify harnesses, docs and CLAUDE.md/AGENTS.md. The old archived `sites/sfdy` must be removed first, and `node _scripts/delete-site.mjs sfdy` would ALSO delete `_captures/sfdy`, which four other sites reference as their design provenance: do not use `delete-site.mjs --confirm` for it, use `git rm -r` instead and delete the leftover ignored directories by hand so the later `git mv` does not nest the folder.

Three findings are not in CONTEXT.md and will break the launch if missed: (1) `Layout.astro` hard-codes `<meta name="robots" content="noindex, nofollow">` on every page, so the live site would be de-indexed even though `publish.yml` swaps `robots.txt` to Allow; (2) `Layout.astro` always emits the hidden `.tbd-pill` with a `/open-points` link and the pill script, so a production `dist` fails the D-05 check even when `OPEN_POINTS` is empty (the current `dist/index.html`, built with base `/`, already contains `tbd-pill` and `/open-points`); (3) the live gh-pages root contains `.nojekyll` and Pages runs in legacy (Jekyll) mode, while the site's `public/` has no `.nojekyll`; whether `single-commit: true` + `clean: true` preserves it is not documented, and without it Jekyll strips `_astro/`. The contributor-sync fix is a one-line slug change in the prod repo plus a small directory guard in `content-sync.yml`; the prod repo's `content/` contains only `.gitkeep` files, so there is no stale job content to worry about.

**Primary recommendation:** Do it in this order: remove old `sites/sfdy`, rename via `rename-site.mjs` + manual follow-ups, gate internal pages (incl. robots meta) and add `public/.nojekyll`, apply production identity, build-check with a new `verify-phase-12.sh`, then (operator gates) push origin, patch the prod repo slug and test-sync, back up gh-pages, `/wm-publish sfdy`, verify live, finally the design seed.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** The baseline is renamed from `sfdy-alt-clean-reskin-2` to **`sfdy`**: folder, build and dist path, sandbox URL (`.../WebsiteMocker/sfdy/`), dashboard entry, `wiring.json` slug, CLAUDE.md ownership table and every doc that names reskin-2. "Retire the old slug (archive), rename everything, it is our new baseline."
- **D-02:** `sites/sfdy` already exists as an archived site (commit 24dbf5a "archive sfdy, levion, crestworks-legacy"). It must be dealt with before the rename (delete it permanently via `_scripts/delete-site.mjs sfdy --confirm`, or move it aside); the plan must make this explicit and check for leftover dist and workflow references. Git history keeps it.
- **D-03:** The old `sfdy-alt-clean` stays archived; its `prod_repo` and `domain` are removed from its wiring.json so the baseline is the single owner of `pbau3r-sfdy/starflight-dynamics`. The other reskin variants (`sfdy-alt-clean-reskin`, `sfdy-alt-clean-variant`) are not touched in this phase.
- **D-04:** The baseline stays a working sandbox site as well as production: it is where secret drops (Phase 11) and further improvements are tested. Production is a publish of this one site, not a fork.
- **D-05:** `/open-points`, the yellow `Tbd` markers and the footer link are **gated on the production build** (`SITE_BASE=/`): page not generated, footer link hidden, Tbd markers render as plain text. The machinery stays for sandbox review. A build check fails if "internal review" text or `/open-points` appears in a production `dist`. No publish block on open items (the list is empty today).
- **D-06:** Legal pages (CUT-03): Claude prepares a **checklist** of every legal-relevant statement (Plausible section, Applications and joint controller, hosting, newsletter, socials, imprint data) for the operator or a lawyer to sign off. Not a blocking gate in the plan. The no-consent-banner decision stands (Phase 10 D-04, operator-confirmed 2026-10-14: no cookies set).
- **D-07:** The `content/jobs/` folder in the production repo **stays** and is used for the real postings once they exist. The new site has no jobs collection until then; the sync must not fail or copy stale old postings into the site (plan decides how: skip or no-op until the collection returns; the jobs machinery is restorable from commit `7943369^`).
- **D-08:** The dispatch slug in the production repo's `.github/workflows/content-ci.yml` (now `sfdy-alt-clean`) is changed to **`sfdy`** and **verified with a live test push**: a harmless content change reaches `sites/sfdy/src/content/` via `content-sync.yml`; the test file is reverted afterwards. The `_templates` copy (`_templates/.github/workflows/content-ci.yml`) and `init-prod-repo.mjs` are checked for the same slug assumption.
- **D-09:** Publish **as soon as all checks pass** (preflight, build checks, legal checklist handed over, sync test). Careers stays "Coming soon" (in the coming days); real postings are a normal content update afterwards.
- **D-10:** Before publishing, push the current `gh-pages` of `pbau3r-sfdy/starflight-dynamics` to a backup branch (for example `gh-pages-old-2026-08`). Rollback = restore that branch. After publish verify: CNAME `www.starflight-dynamics.com`, `robots.txt`, HTTPS, key pages (home, about, capabilities, contact, privacy, imprint, `/jobs`), 404 page, and a Plausible pageview from the live domain.
- **D-11:** Phase 10 carry-over: remove `analytics.sandboxUsesProdId` from the baseline's wiring.json at cutover (`/wm-preflight` warns while set), rebuild, then consider a Plausible hostname allowlist for starflight-dynamics.com. `wiring.json` gets `prod_repo`, `domain` and stage 5, then stage 6 and `last_deploy` after publish.
- **D-12:** Design seed (CUT-07) is the very last step, after the live site is verified: **update the existing "Starflight Dynamics Design System"** project (baa6f65c-d546-41fc-b2bd-d81d7c6da089), incrementally, only approved paths (`tokens/colors.css`, `assets/logo/*`), no deletes, no `uploads/`; operator approves the path list and `finalize_plan`. Closes DSYNC-11 and phase 9.

### Claude's Discretion
- Exact build-check implementation for D-05, how the sync treats `content/jobs/` until the collection returns (D-07), checklist format for D-06, backup branch name, order of rename vs production-identity edits.

### Deferred Ideas (OUT OF SCOPE)
- Real job postings (content update after launch; restore the jobs collection from `7943369^` when they arrive)
- Open Drops (Phase 11), built on the new baseline after the cutover
- Plausible hostname allowlist (considered after cutover)
- Cleaning up the other reskin variants (`sfdy-alt-clean-reskin`, `sfdy-alt-clean-variant`)

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CUT-01 | No jobs pages/content/JobRow/links (amended: Coming-soon `/jobs` allowed) | Already complete (Phase 11.1); keep `verify-phase-11-1.sh` RETL-04 checks green after rename (path fix, see Pitfall 4) |
| CUT-02 | No internal-review page or text in a production build | Production gating section: `injectRoute` for `/open-points`, `Layout`/`Footer`/`Tbd` env flag, robots meta, build check in `verify-phase-12.sh` |
| CUT-03 | Impressum and privacy reviewed for production | Legal checklist (D-06); analytics gate already passes (`check-analytics-gate.mjs sfdy-alt-clean-reskin-2 --live` exit 0, verified this session) |
| CUT-04 | Production identity in `wiring.json`, preflight passes | wiring.json section; preflight is a skill checklist (no script), so `verify-phase-12.sh` encodes the checkable parts |
| CUT-05 | Contributor content reaches the new site; `content/jobs/` handled | Sync section: one-line slug patch in prod repo, dir guard in `content-sync.yml`, harmless test push design |
| CUT-06 | `/wm-publish` deploys; live/CNAME/robots verified; CLAUDE.md + wiring updated | Publish section: backup branch, `.nojekyll`, live verification list, rollback |
| CUT-07 | Final design seed into existing project | Design seed section |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Slug rename (folder, workspace, config) | Repo / build tooling | CI (deploy.yml, `npm ci`) | Slug lives in folder name, `package.json`, lockfile, astro base, harnesses |
| Internal-page gating | Build time (Astro integration + components) | Post-build check script | Static site: gating must happen at build; check proves it |
| robots meta / robots.txt | Static HTML (Layout) | publish.yml (robots.txt swap) | Both layers must say "index"; only the workflow handles robots.txt |
| Contributor content sync | Prod repo Actions (dispatch) | WebsiteMocker Actions (`content-sync.yml`) | Slug in prod repo selects `sites/<slug>/`; `wiring.prod_repo` selects source |
| Publish / rollback | GitHub Actions (`publish.yml`) | Prod repo `gh-pages` branch | Force-overwrite model; branch backup is the only rollback |
| Live verification | External (curl / browser / Plausible UI) | — | Needs DNS, TLS, live pageview |
| Design seed | Claude Design (DesignSync, model-side) | `_scripts/design-seed.mjs` bundle | External write, operator-gated |

## Standard Stack

No new packages. Everything uses what is installed. [VERIFIED: package.json, npm ls]

| Tool | Version here | Purpose |
|------|--------------|---------|
| Astro | 5.18.2 (`^5.0.0`) | Site build; `injectRoute` integration API |
| Node | v26.11.1 locally (CI pins 22) | Scripts |
| npm | 11.20.0 | Workspace linking, lockfile |
| gh | 2.102.0, logged in as `pbau3r-sfdy` | Read-only inspection now; backup branch, prod repo edit, publish later |
| `_scripts/rename-site.mjs` | existing (commit b307b3c) | `git mv` + wiring slug/sandbox_url + astro base |
| `_scripts/lib/env.mjs` `isSandbox()` | existing | Single production/sandbox test (Phase 10 designed it for reuse) |
| JamesIves/github-pages-deploy-action | 4.9.0 in publish.yml | gh-pages push (`clean`, `single-commit`) |

**Package Legitimacy Audit:** No external packages are installed by this phase. Nothing to audit. slopcheck not run (nothing to check).

## Architecture Patterns

### Cutover flow

```
LOCAL (sandbox work, no remote effect)
  1 git rm -r sites/sfdy (+ rm leftover ignored dirs)      keep _captures/sfdy
  2 node _scripts/rename-site.mjs sfdy-alt-clean-reskin-2 sfdy
  3 manual follow-ups (package.json, README, DESIGN.md, design.lock.json, harnesses, docs, CLAUDE.md, AGENTS.md)
  4 npm install  (workspace symlink + package-lock)
  5 gating: _scripts/internal-pages.mjs + env flag in Layout/Footer/Tbd + public/.nojekyll + robots meta
  6 wiring.json: prod_repo, domain, stage 5, drop sandboxUsesProdId; archive wiring of sfdy-alt-clean: drop prod_repo/domain
  7 SITE_URL=https://www.starflight-dynamics.com SITE_BASE=/ node _scripts/build-single.mjs sfdy ; bash _scripts/verify-phase-12.sh
OPERATOR GATE A: push origin main (20 commits already ahead) -> deploy.yml rebuilds sandbox
OPERATOR GATE B: patch prod repo content-ci.yml slug -> test push content/jobs|news/_sync-test.md
                 -> content-sync.yml commits to origin main -> git pull --rebase -> revert test file both sides
OPERATOR GATE C: backup gh-pages -> gh-pages-old-2026-08 ; /wm-publish sfdy (publish.yml: gate, build, CNAME, robots, deploy, stage 6 commit-back)
                 -> git pull --rebase (workflow pushed to main) -> live verification
OPERATOR GATE D: CUT-07 design seed (two approvals)
```

### Recommended edits for the rename (pattern: script first, then explicit follow-ups)

`rename-site.mjs` refuses if `sites/<new>` exists, does `git mv`, edits wiring `slug`/`sandbox_url`, and replaces `/WebsiteMocker/<old>` in `astro.config.mjs`. It does NOT touch the following (all verified by grep this session), so the plan must:

| File | Change |
|------|--------|
| `sites/sfdy/package.json` | `name` -> `@websitemocker/sfdy`; `dev --port 4413` can stay (old sfdy used 4409; CLAUDE.md line 204 says 4409, make them agree) |
| `package-lock.json` | refresh with `npm install` (workspace entries at lines ~1684-1701, ~5794-5818 name `@websitemocker/sfdy` AND the reskin-2 entry) |
| `sites/sfdy/README.md` (3 hits), `DESIGN.md` (4 hits), `design.lock.json` (4 `_staging/design/sfdy-alt-clean-reskin-2/...` hits) | text replace; also `mv _staging/design/sfdy-alt-clean-reskin-2 _staging/design/sfdy` (gitignored, local) |
| `sites/sfdy/wiring.json` | `name` "Starflight Dynamics (Reskin 2)" -> "Starflight Dynamics"; rewrite `notes` (currently says "Internal review only, no production path"); identity fields below |
| `sites/sfdy/keywords.json` | `"site": "sfdy-alt-clean"` -> `sfdy`; `seo.meta_description` says "under construction" (not used by Layout today, fix anyway) |
| `_scripts/verify-phase-10.sh` | lines 246 and 286 (`404.astro` path, `dist/.../404.html`). Line 286 is guarded by `[ -f ]` and silently becomes SKIP if left stale |
| `_scripts/verify-phase-11-1.sh` | lines 8, 9, 17 (variables) plus the `git diff --quiet 0d94909^ HEAD -- "$SITE/src/pages/imprint.astro"` assertion (see Pitfall 4) |
| `_scripts/validate-brand.mjs:60` | `ACTIVE_SITES` lists `sfdy-alt-clean`; replace with `sfdy` (new baseline has the brand block) |
| `_scripts/import-site.mjs:64` | default donor already `sfdy`; after the rename it points at the new baseline (fine, note it) |
| `docs/analytics.md` lines 5, 38, 40 | replace slug |
| `CLAUDE.md` | ownership table row (line 70 `sfdy-alt-clean` -> archived; line 72 reskin-2 -> `sfdy`, prod repo, domain), repo-layout block (line ~224), `cd sites/sfdy` command; **file already has uncommitted user edits: commit only your hunks** |
| `AGENTS.md` | same ownership/layout updates (execute phases run in Codex and read AGENTS.md; its tree is stale: lists `sfdy-alt-clean` Stage 2 and `sfdy`) |
| `DESIGNER.md` line 8, `PARKED.md` lines 10-11 | replace slug |
| `.planning/ROADMAP.md`, `REQUIREMENTS.md`, `STATE.md` | living docs: update to `sfdy` (or add one "renamed to sfdy" note) |
| `.planning/phases/09-*, 10-*, 11.1-*` | frozen history: leave untouched (see Open Questions Q1). `verify-phase-12.sh` rename-completeness grep must exclude them |
| `.github/workflows/*` | **No slug is hard-coded** (only example strings `sfdy-alt-clean` in input descriptions of publish.yml line 7 and content-sync.yml line 16; update the examples). Verified by grep |
| Dashboard `src/pages/index.astro` | reads `sites/*/wiring.json` and uses the folder name as `_slug`: no edit needed. Perf URL = `https://<domain>` once stage 6 and `domain` set (`fetch-perf-data.mjs resolveUrl`) |

Other slug-related facts: `deploy.yml` builds all non-skipped sites with `build-all.js` and publishes root `dist/` with `clean: true`, so the old `dist/sfdy-alt-clean-reskin-2/` sandbox URL disappears on the first push after the rename (expected; the sandbox URL changes). `skip_ci: true` on archived sites keeps them out of CI (old `sites/sfdy`, `sfdy-alt-clean`, reskin, variant are all skipped). `_data/` does not exist locally, so no perf/analytics history is keyed to either slug.

**`npm install` is required after the rename** [VERIFIED: package-lock.json lists `sites/sfdy-alt-clean-reskin-2` as a workspace and `node_modules/@websitemocker/sfdy-alt-clean-reskin-2 -> ../../sites/sfdy-alt-clean-reskin-2` exists]. CI runs `npm ci`, which errors if the lockfile and workspaces disagree, so the lockfile change must be committed with the rename. Caution: the working-tree `package-lock.json` already has an uncommitted hunk adding `sites/sfdy-alt-clean-variant` (an untracked folder). Commit the lockfile only after verifying `npm ci` in a clean checkout of the exact commit (see Validation, check R6).

### Old `sites/sfdy` removal (D-02)

State [VERIFIED: ls, git ls-files, delete-site dry run]: tracked, archived (`archived: true`, `skip_ci: true`, stage 2, domain `www.starflight-dynamics.com` in its wiring), 100+ tracked files, plus gitignored `node_modules/` (only `.astro`, `.vite`), `dist/`, `.astro/`. No workflow, script (other than `import-site.mjs` default donor) or dashboard code references it by path; `package-lock.json` has its workspace entry; `AGENTS.md`/`CLAUDE.md` tree mention it.

`delete-site.mjs sfdy` dry run prints:
```
→ sites/sfdy
→ _captures/sfdy
```
`_captures/sfdy` is tracked (78 files) and is the `"capture": "sfdy"` provenance of `sfdy-alt-clean`, `-reskin`, `-variant` and reskin-2. **Do not run `--confirm`.** Safe procedure:
```bash
git rm -r -q sites/sfdy            # tracked files
rm -rf sites/sfdy                  # ignored leftovers: node_modules, dist, .astro  (else `git mv` nests the folder)
test ! -e sites/sfdy
git commit -m "chore: remove archived sites/sfdy (history keeps it)" -- sites/sfdy
```
Also consider also removing the stale root symlink by `npm install` afterwards (it re-points `node_modules/@websitemocker/sfdy` at the renamed folder).

### Pattern: production gating of internal pages (D-05)

Current coupling [VERIFIED: read the files]:
- `src/pages/open-points.astro` (generated always; `dist/open-points/index.html` exists in the current build).
- `Layout.astro`: `<meta name="robots" content="noindex, nofollow">` (line 35) on EVERY page; unconditional `<div class="tbd-pill">` with `/open-points` link and the pill script; `.tbd` CSS.
- `Footer.astro`: `OPEN_POINTS.length > 0 && <a href=/open-points>` (empty list today, but gate anyway).
- `Tbd.astro`: wraps in `<mark>/<div class="tbd">`, calls `pointById(id)` which THROWS on unknown ids. Used only by `imprint.astro` for `{tbd}` lines; none present now.
- `PageHero`/`open-points.astro` contain "Internal review" eyebrow and description text.
- `src/data/open-points.ts`: `OPEN_POINTS = []`, `PARKED` has 3 entries (these render only on `/open-points`).

Detection: a production build is `SITE_BASE=/`; `import.meta.env.BASE_URL` is `/` then, and `/WebsiteMocker/sfdy` in sandbox/dev. `_scripts/lib/env.mjs` `isSandbox(base)` is the canonical test (true only for `/WebsiteMocker` or `/WebsiteMocker/...`). [VERIFIED: file read; used by `plausible.mjs`]

Recommended implementation:
1. Add `src/data/internal.ts` exporting `export const SHOW_INTERNAL = isSandbox(import.meta.env.BASE_URL);` importing `../../../../_scripts/lib/env.mjs` (pure Node built-ins, safe in Vite). One flag, one definition.
2. `Layout.astro`: render `<meta name="robots" content="noindex, nofollow">` only if `SHOW_INTERNAL`; render the pill div and the open-points part of the script only if `SHOW_INTERNAL` (keep the parallax block unconditional).
3. `Footer.astro`: `SHOW_INTERNAL && OPEN_POINTS.length > 0 && ...`.
4. `Tbd.astro`: if `!SHOW_INTERNAL` return `<slot />` only (no `pointById` call, no `class="tbd"`).
5. Exclude the page: move `src/pages/open-points.astro` to `src/internal/open-points.astro` (fix its relative imports) and register it from an integration only in sandbox/dev: new `_scripts/internal-pages.mjs`:
```js
// Source: docs.astro.build/en/reference/integrations-reference (injectRoute)
import { fileURLToPath } from 'node:url';
import { isSandbox } from './lib/env.mjs';
export default function internalPages() {
  return { name: 'websitemocker-internal-pages', hooks: {
    'astro:config:setup': ({ config, injectRoute }) => {
      if (!isSandbox(config.base)) return;
      injectRoute({ pattern: '/open-points',
        entrypoint: fileURLToPath(new URL('./src/internal/open-points.astro', config.root)) });
    } } };
}
```
and `integrations: [plausible(), internalPages()]` in `astro.config.mjs`. `injectRoute` is documented for pages outside `src/pages`; [CITED: docs.astro.build/en/reference/integrations-reference/] but the first plan task should spike it (dev server + both builds) because behaviour with a local-file entrypoint and relative imports was not run this session. Fallback if it misbehaves: keep the file in `src/pages` and delete `dist/open-points/` in an `astro:build:done` hook when `!isSandbox(config.base)`; the dist grep check is the backstop either way.

Build check (new, in `verify-phase-12.sh`, section `prod`): build with `SITE_URL=https://www.starflight-dynamics.com SITE_BASE=/ node _scripts/build-single.mjs sfdy`, then on `dist/sfdy`:
```bash
test ! -e dist/sfdy/open-points                                   # page absent
! grep -rIliE 'open-points|internal review|tbd-pill|data-points=|class="tbd|noindex' dist/sfdy   # no leaks (also catches robots meta)
grep -q 'name="robots"' dist/sfdy/index.html && fail             # no robots meta at all in prod
```
and the inverse sandbox build (`SITE_BASE=/WebsiteMocker/sfdy`) must still contain `/open-points/index.html` and `noindex` (machinery kept for D-04). Because both builds write to the same `sites/sfdy/dist` and `dist/sfdy`, run them sequentially and copy out the result you assert on.

### Anti-Patterns to Avoid
- **Hand-editing slugs with `sed -i` across the repo:** leaves frozen planning docs inconsistent and silently changes history artifacts. Use the explicit file list above and a scoped completeness grep.
- **`delete-site.mjs sfdy --confirm`:** removes `_captures/sfdy` (shared provenance).
- **Publishing from local state:** `publish.yml` and `content-sync.yml` run on GitHub `main`. Nothing local counts until pushed.
- **Gating by wiring.json flag instead of base:** D-04 wants the same site as sandbox testbed; the base path is already the existing switch (`isSandbox`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slug rename | custom sed script | `_scripts/rename-site.mjs` (+ explicit follow-ups) | Already does `git mv` and the config edits |
| Prod vs sandbox detection | new env var | `isSandbox()` from `_scripts/lib/env.mjs` | Phase 10 built it for reuse; same rule as Plausible |
| Excluding a page from a build | post-hoc `rm` as primary mechanism | `injectRoute` from an integration | Page is never generated; `rm` is the fallback only |
| Publish | manual `git push` to prod gh-pages | `/wm-publish sfdy` (`publish.yml`) | Runs analytics gate, CNAME, robots, stage-6 commit |
| Prod repo bundle update | hand-editing multiple files | single-line `content-ci.yml` edit now; `init-prod-repo.mjs` dry run later as a consistency diff | Script only installs `content-ci.yml` at stage >= 6 |
| Design seed | custom upload | `_scripts/design-seed.mjs` + `/wm-design-seed` | Already approval-gated, no deletes, no `uploads/` |
| Backup branch | clone/push dance | one `gh api` ref create | Atomic, no checkout |

## Contributor sync (CUT-05, D-07, D-08)

State [VERIFIED: gh api, file reads]:
- Prod repo `main` tree: `.github/ISSUE_TEMPLATE/*` (4), `.github/workflows/content-ci.yml`, `CONTRIBUTING.md`, and `content/{announcements,blog,news,jobs}/.gitkeep` ONLY. There are no stale job postings and no news files. `main` is not protected. Secrets present: `WM_DISPATCH_PAT` (prod repo), `WM_PUBLISH_PAT` (WebsiteMocker).
- `content-ci.yml`: trigger `push` on `main`, `paths: content/**/*.md`; sends `repository_dispatch` `content-updated` with `client-payload: '{"slug": "sfdy-alt-clean"}'`. The `_templates` copy uses `{{SLUG}}` (line 48), rendered by `init-prod-repo.mjs` from the CLI slug argument, so the template and script have NO hard-coded slug; running `init-prod-repo.mjs sfdy` yields `sfdy`. `CONTRIBUTING.md` template still advertises `content/jobs/` (consistent with D-07; leave).
- `content-sync.yml`: resolves slug (regex `^[a-z0-9-]+$`), reads `sites/<slug>/wiring.json` (fails if `prod_repo` missing), clones prod `main`, copies every `*.md` under `content/` to `sites/<slug>/src/content/<relpath>` additive-only, commits and pushes to WebsiteMocker `main` with `WM_PUBLISH_PAT`. Collections present in the new site: `news`, `announcements`, `blog` (each tracked via `.gitkeep`); no `jobs`.
- Consequence: today the sync with slug `sfdy-alt-clean` writes into the ARCHIVED site (it still has `wiring.prod_repo`), and with slug `sfdy` it works only after the renamed site (with `prod_repo`) is on origin `main`.

Plan:
1. **Dispatch slug fix** (operator-gated external write): minimal one-line change via API so nothing else in the prod repo moves:
```bash
gh api repos/pbau3r-sfdy/starflight-dynamics/contents/.github/workflows/content-ci.yml --jq .sha     # file sha
# edit locally in scratchpad: sed 's/"sfdy-alt-clean"/"sfdy"/' ; then
gh api -X PUT repos/pbau3r-sfdy/starflight-dynamics/contents/.github/workflows/content-ci.yml \
  -f message="chore: dispatch slug sfdy-alt-clean -> sfdy" -f content="$(base64 < new.yml)" -f sha=<sha> -f branch=main
```
   The path filter means this commit does not fire the workflow. Afterwards `node _scripts/init-prod-repo.mjs sfdy` (dry run, no `--confirm`) and a diff of rendered vs live `content-ci.yml` proves template/script agree (it skips `content-ci.yml` while wiring stage < 6, so do the diff by hand after stage 6 or render `_templates` manually).
2. **Directory guard for D-07** in `content-sync.yml` "Sync content" step: skip a file when its first path segment is not an existing directory under `sites/$SLUG/src/content/`, and print `skipped (no <collection> collection in <slug>): <relpath>`. Rationale: copying `jobs/*.md` into a site with no jobs collection leaves stray files that Astro 5 may auto-generate a legacy collection for (deprecation warning) [ASSUMED, check during the test]; the guard makes `content/jobs/` a no-op until the collection returns, and restoring the collection (re-adding `src/content/jobs/`) automatically re-enables it. `.gitkeep` files are already excluded by `-name '*.md'`. Needs a harness fixture (see Validation).
3. **Harmless live test (D-08)**: after the dispatch slug fix AND the origin push (the site must exist on origin with `prod_repo`), push `content/news/zz-sync-test.md` to prod `main` (valid frontmatter: `title`, `date`, `summary`; use a clearly synthetic title, e.g. `SYNC TEST - delete`; news is the only collection the guard lets through, and this also proves the guard did not break the normal path). It must never be published: `/wm-publish` is only run after revert. Expected: `content-ci` run (success), WebsiteMocker `content-sync.yml` run (success), commit `chore(sfdy): sync content from production repo` on origin `main` adding `sites/sfdy/src/content/news/zz-sync-test.md`. Then revert both sides: `gh api -X DELETE` the prod file, and locally `git pull --rebase` and `git rm` the synced file (sync is additive-only, deletion is not propagated). Test the guard separately with a `workflow_dispatch` run of `content-sync.yml` after temporarily placing `content/jobs/zz-sync-test.md`, or better in the offline fixture, to keep the number of external pushes to one. Check run results with `gh run list -R pbau3r-sfdy/starflight-dynamics --limit 3` and `gh run list --workflow content-sync.yml --limit 3`.
4. Note: the sync commit lands on origin `main` while local `main` is ahead, so always `git pull --rebase origin main` before the next push.

## Publish pipeline (CUT-06, D-09, D-10, D-11)

Facts [VERIFIED: publish.yml, wm-publish.md, wm-preflight.md, gh api]:
- `/wm-publish <slug>` checks `stage >= 5`, `domain`, `prod_repo` locally, runs `/wm-preflight`, then `gh workflow run publish.yml --field slug=<slug>` and watches it. The workflow runs on GitHub from origin `main` (needs the rename, gating and identity pushed first).
- `publish.yml` steps: `npm ci`, validate wiring (stage >= 5, domain, prod_repo), `check-analytics-gate.mjs <slug> --live`, `build-single.mjs` with `SITE_URL=https://<domain>` and `SITE_BASE=/`, write `dist/<slug>/CNAME` (= domain), overwrite `dist/<slug>/robots.txt` with `Allow: /`, JamesIves deploy to prod `gh-pages` with `clean: true` and `single-commit: true` (history wiped), then sets `stage: 6`, `last_deploy` in wiring, commits and **pushes to WebsiteMocker `main`**. Local main will be behind afterwards: `git pull --rebase`.
- `/wm-preflight` is a skill checklist, not a script. It flags: build errors, placeholders, hero/news present, wiring (`domain` for stage >= 5, newsletter not Formspree placeholder, forms/socials configured), analytics (`plausible()` in `astro.config.mjs`; **WARN if `scriptId` set and `sandboxUsesProdId` true**), legal (`imprint` has no `—` placeholder lines, `privacy.astro` `last_updated`, `legal.*` complete, gate `--live`). Note it names `privacy.astro` and `imprint.astro`; the real file is `privacy-policy.astro` (no `—` placeholder lines found; version line "14 October 2026" present). Keywords: `keywords.json` needs >= 3 primary keywords (has 3) and non-empty hashtag arrays (`keywords.json` hashtags arrays are EMPTY: preflight will report this; treat as WARN, operator decision, not blocking per D-09).
- Gate already green: `node _scripts/check-analytics-gate.mjs sfdy-alt-clean-reskin-2 --live` exits 0 [VERIFIED this session]. Production identity resolves because `analytics.domain` (`starflight-dynamics.com`) equals `site` hostname with `www.` stripped (`siteHostname` and `cleanDomain` both strip `www.`) [VERIFIED: plausible-snippet.mjs]; the existing `dist` already contains the production Plausible snippet.
- Live gh-pages today [VERIFIED]: branch sha `3a2f4c1b2507bb31add0df6034fa7a42180ebc09` ("Update CNAME", 2026-08-10); root contains `.nojekyll`, `CNAME`, `_astro`, `contact`, `favicon.png`, `fonts`, `images`, `imprint`, `index.html`, `news`, `privacy-policy`. **No `robots.txt`** (live `/robots.txt` returns 404). Pages: legacy build from `gh-pages` `/`, cname `www.starflight-dynamics.com`, HTTPS enforced, cert valid to 2027-01-07. Every old URL (`/`, `/contact`, `/imprint`, `/privacy-policy`, `/news`, six `/news/<slug>`) also exists in the new build with identical paths, so there is no URL loss; the new build adds `/about`, `/capabilities`, `/press`, `/jobs`, `/announcements`, `/blog`.
- **Backup (D-10)** before the publish (operator-gated external write, read the sha again first):
```bash
SHA=$(gh api repos/pbau3r-sfdy/starflight-dynamics/branches/gh-pages --jq .commit.sha)
gh api repos/pbau3r-sfdy/starflight-dynamics/git/refs -f ref=refs/heads/gh-pages-old-2026-08 -f sha="$SHA"
gh api repos/pbau3r-sfdy/starflight-dynamics/branches/gh-pages-old-2026-08 --jq .commit.sha   # must equal $SHA
```
   Rollback: `gh api -X PATCH repos/pbau3r-sfdy/starflight-dynamics/git/refs/heads/gh-pages -f sha="$SHA" -F force=true` (Pages rebuilds from the restored commit within about a minute). Because `single-commit` rewrites gh-pages history, the backup branch is the only place the old commit stays reachable. The backup branch is not a Pages source, so it does not affect the site.
- **`.nojekyll` risk**: Pages is in legacy mode (Jekyll). The new site's `public/` contains no `.nojekyll` (the old site also did not, yet gh-pages had one, so it came from the branch itself). JamesIves docs say `CNAME`/`.nojekyll` committed to the deployment branch are not overridden by deploys, but with `single-commit` the effect is not documented here [CITED: github.com/JamesIves/github-pages-deploy-action README]. Cheap guard: add an empty `sites/sfdy/public/.nojekyll` so every build ships it (not gitignored). Verify after publish that `https://www.starflight-dynamics.com/_astro/<file>.css` returns 200 and `.nojekyll` is in the gh-pages tree.
- **robots**: publish writes `robots.txt` Allow; the Layout `noindex` meta must be removed in production (see gating) or search engines will still drop the site.
- **Analytics (D-11)**: remove `analytics.sandboxUsesProdId` from wiring; consequence: sandbox builds of `sfdy` emit no analytics (protective default), so sandbox traffic stops polluting production stats. Plausible hostname allowlist is deferred (consider after cutover).

### Live verification checklist (D-10), all read-only
```bash
D=https://www.starflight-dynamics.com
for p in / /about /capabilities /contact /privacy-policy /imprint /jobs /news /press /nonexistent-xyz; do
  printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' $D$p)" "$p"; done   # 200 x9, 404 for nonexistent
curl -s $D/robots.txt                      # Allow: /  (not Disallow)
curl -s $D/CNAME -o /dev/null -w '%{http_code}\n'   # CNAME is consumed by Pages; assert via API instead:
gh api repos/pbau3r-sfdy/starflight-dynamics/pages --jq '.cname,.https_enforced,.status'
gh api repos/pbau3r-sfdy/starflight-dynamics/git/trees/gh-pages --jq '.tree[].path'   # CNAME, .nojekyll, no open-points
curl -sI http://www.starflight-dynamics.com | head -1   # 301 to https
curl -s $D/ | grep -ciE 'open-points|internal review|noindex'    # 0
curl -s $D/ | grep -o 'plausible.io/js/pa-[A-Za-z0-9]*.js'      # production script id
curl -s $D/404-test | grep -c "plausible('404'"                  # 404 event present
curl -sI https://starflight-dynamics.com | head -3               # apex redirects to www (Pages handles when both domains configured)
```
Plausible pageview from the live domain is manual: open the site in a normal browser, then check the Plausible realtime view for `starflight-dynamics.com` (cannot be automated here; the API key plan is Business-only per Phase 10).

## wiring.json production identity (CUT-04, D-03, D-11)

Target for `sites/sfdy/wiring.json` before publish: `slug: "sfdy"` (rename script), `name: "Starflight Dynamics"`, `domain: "www.starflight-dynamics.com"` (same form the old site used; `publish.yml` writes it verbatim into `CNAME` and builds `SITE_URL=https://<domain>`), `prod_repo: "pbau3r-sfdy/starflight-dynamics"`, `stage: 5`, `sandbox_url` renamed by the script, delete `analytics.sandboxUsesProdId`, rewrite `notes`. After publish the workflow sets `stage: 6` and `last_deploy`. For `sites/sfdy-alt-clean/wiring.json` remove `prod_repo`, `domain`, and the `stage: 6`/`last_deploy` claims (set `stage` to a non-live value or keep stage but dashboard `isLive` requires stage 6 AND domain, so removing `domain` is what matters; D-03 asks for prod_repo + domain removal only). Its `archive_reason` already says the live site keeps serving the last build until reskin-2 is published; update the text after cutover. Dashboard and perf [VERIFIED]: dashboard reads every `sites/*/wiring.json`, section by `template`/`archived` flags, `isLive = stage === 6 && domain`; `fetch-perf-data.mjs` tests `https://<domain>` only when stage >= 6 with domain, else the sandbox URL, and skips archived/template. Because the archived old site keeps `stage: 6` + `domain` today, it is skipped only by the `archived` check, so D-03 removal is belt and braces.

CLAUDE.md ownership table after cutover: `sfdy` | Starflight Dynamics GmbH | `pbau3r-sfdy/starflight-dynamics` | www.starflight-dynamics.com; `sfdy-alt-clean` -> archived (no prod repo); `sfdy-alt-clean-reskin` and `-reskin-2` rows: remove reskin-2 (renamed), keep reskin; also repo-layout block and `cd sites/sfdy && npm run dev` line. The doc lists a `levion` row etc. that are out of scope.

## Design seed (CUT-07, D-12)

[VERIFIED: wm-design-seed.md, design-seed.mjs header, 09-09-SUMMARY.md] `design-seed.mjs` builds `tokens/colors.css` from `brand.doc_tokens` (sorted, header comment) and copies each `--logo` into `assets/logo/<basename>`, marks `create`/`update` from an optional listing, refuses `uploads/` and `..`, writes `_staging/design-seed/<slug>/plan.json` and files; it never talks to DesignSync and never deletes. Skill flow: (2) model calls `list_files` for the existing project and writes `_staging/design-seed/sfdy/listing.json` as `[{ "path": "..." }]`; (3) run
```bash
node _scripts/design-seed.mjs sfdy --existing-listing _staging/design-seed/sfdy/listing.json \
  --logo sites/sfdy/public/images/logo.png \
  --project-id baa6f65c-d546-41fc-b2bd-d81d7c6da089 --name "Starflight Dynamics Design System" --dry-run
```
then without `--dry-run`; (4) show the path list and STOP for the first `approve` (expected: `tokens/colors.css` update, `assets/logo/logo.png` create or update); (6) `finalize_plan` (writes only, empty deletes, `localDir=_staging/design-seed/sfdy/files`) then second `approve`; (7) `write_files` with `localPath`; (8) `list_files` again and compare. Requires the model-side `DesignSync` tool (a Claude Code session); cannot be scripted from a shell. Notes: the project id is already the `design.project_id` in the site's wiring (`design-connect` already saved it), so no `design-connect` re-run is needed; `design.globs` includes `tokens/**` so a later `/wm-design-pull sfdy` will show the seeded `colors.css` as changed (expected). Only the logo at `public/images/logo.png` exists under `public/` (also check `public/images/sfdy-alt-clean-reskin-2/` which is an asset folder named after the old slug; its contents were not inspected and nothing in `src` references the name, per grep). Dry run first is safe (writes only under gitignored `_staging/`). Bundle must be built AFTER the rename and publish so tokens come from the deployed site (the roadmap goal).

## Common Pitfalls

### Pitfall 1: Live site de-indexed by the sandbox robots meta
**What goes wrong:** `Layout.astro` emits `noindex, nofollow` on every page; `publish.yml` only fixes `robots.txt`.
**How to avoid:** gate the meta on `SHOW_INTERNAL`; build check greps production dist for `noindex`.
**Warning signs:** `grep -c noindex dist/sfdy/index.html` != 0.

### Pitfall 2: `git mv` nests the site into the leftover folder
**What goes wrong:** If `sites/sfdy` still exists as an (ignored) directory with `node_modules`/`dist`, `rename-site.mjs` aborts (`already exists`); a manual `git mv` would create `sites/sfdy/sfdy-alt-clean-reskin-2`.
**How to avoid:** `git rm -r` then `rm -rf sites/sfdy`, assert `test ! -e sites/sfdy`.

### Pitfall 3: Frozen history rewritten or completeness grep too broad
**What goes wrong:** Whole-repo grep for the old slug always hits `.planning/phases/09-11.1` and ROADMAP history. **How to avoid:** scope the harness grep to live files (list in the harness) and document the exclusion.

### Pitfall 4: `verify-phase-11-1.sh` fails after rename for a history reason
**What goes wrong:** `git diff --quiet 0d94909^ HEAD -- "$SITE/src/pages/imprint.astro"` uses the NEW path; at `0d94909^` that path does not exist, so the diff is non-empty and RETL-03 fails. Any legal edit to `imprint.astro` (CUT-03) also legitimately breaks it.
**How to avoid:** compare blobs across the rename (`git diff --quiet 0d94909^:sites/sfdy-alt-clean-reskin-2/src/pages/imprint.astro HEAD:sites/sfdy/src/pages/imprint.astro`) or, if the operator changes the imprint, drop/re-baseline that assertion and say so in the plan. Parameterise the other `SITE`/`DIST` strings with `${SLUG:-sfdy}`.

### Pitfall 5: `npm ci` drift in CI after rename
**What goes wrong:** lockfile still names the old workspace; `deploy.yml` and `publish.yml` both `npm ci` and fail, so publish dies before building. Also the uncommitted lock hunk for the untracked `sfdy-alt-clean-variant` workspace may fail `npm ci` in CI.
**How to avoid:** `npm install`, commit lock with the rename, prove with a clean checkout (`git worktree add <scratchpad>/ci HEAD && (cd <scratchpad>/ci && npm ci --dry-run)`), and keep the variant hunk out of the commit unless the variant folder is committed.

### Pitfall 6: Missing `.nojekyll` strips `_astro/`
See Publish section. Verify `_astro` CSS returns 200 after publish.

### Pitfall 7: Local `main` is 20 commits ahead and the worktree has unrelated changes
**What goes wrong:** `git push` ships 20 unpushed commits (some may be sandbox-visible), and `git add -A` would sweep unrelated work (`sites/sfdy-alt-clean` job edits, `src/pages/index.astro`, untracked `src/data`, `src/layouts`, `public/fonts`, `sites/sfdy-alt-clean-variant`). **How to avoid:** commit with explicit pathspecs only (project rule: leave unrelated work uncommitted); show `git log origin/main..HEAD --oneline` to the operator at the push gate; confirm `node _scripts/build-all.js` passes at the pushed commit state (CI builds from a clean checkout where untracked files are absent: dashboard files `src/layouts/Console.astro`, `src/data/docs.json`, `documentation.astro` are UNTRACKED, so verify what the committed dashboard imports, via the clean-checkout build above).

### Pitfall 8: Publish and sync push to origin `main` behind your back
`publish.yml` (stage-6 commit) and `content-sync.yml` both push to origin `main`. Always `git pull --rebase origin main` before the next local push and before writing wiring changes by hand (stage 6 and `last_deploy` come from the workflow; do not set them manually).

### Pitfall 9: Preflight text mentions files that do not exist here
Preflight refers to `privacy.astro`; the site uses `privacy-policy.astro`. The analytics gate finds it by name pattern, so it passes. Do not "fix" it by renaming the page (URL `/privacy-policy` is already live on the old site).

## Code Examples

### Rename completeness check (live files only)
```bash
# Source: derived from this repo's grep results (2026-10-14)
LIVE_FILES="CLAUDE.md AGENTS.md DESIGNER.md PARKED.md docs _scripts sites .github package.json package-lock.json"
! grep -rIn "sfdy-alt-clean-reskin-2" $LIVE_FILES --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.astro
# allowed exceptions: archive_reason text in archived wiring.json files, historical note lines; list them explicitly
```

### Prod-base build and assertions
```bash
SITE_URL=https://www.starflight-dynamics.com SITE_BASE=/ node _scripts/build-single.mjs sfdy >/dev/null
test -f dist/sfdy/index.html && test ! -d dist/sfdy/open-points
! grep -rIliE 'open-points|internal review|tbd-pill|noindex' dist/sfdy
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Old `sfdy-alt-clean` build live (last deploy 2026-08-08, 4 pages + news) | `sfdy` baseline (about, capabilities, press, jobs coming-soon, Plausible, privacy section) | Same URLs plus new pages; no redirects needed |
| Sandbox preview reports into production Plausible (`sandboxUsesProdId`) | Removed at cutover | Sandbox builds emit nothing unless `sandboxScriptId` set |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `injectRoute` with an entrypoint outside `src/pages` and relative imports works as documented in this repo's Astro 5.18.2 build | Production gating | Low: fallback is `astro:build:done` removal; the dist grep check catches either |
| A2 | Astro 5 auto-generates (with a deprecation warning) a legacy collection for stray `src/content/jobs/*.md` when no config entry exists | Contributor sync | Low: the dir guard avoids the situation anyway |
| A3 | `single-commit: true` + `clean: true` may delete an existing `.nojekyll` (docs are silent); the empty `public/.nojekyll` makes this moot | Publish | Medium if skipped: unstyled live site |
| A4 | Apex `starflight-dynamics.com` redirects to `www` (cert lists both domains; redirect not curl-tested) | Live verification | Low |
| A5 | `public/images/sfdy-alt-clean-reskin-2/` folder name is only a folder name (no `src` reference found); contents not inspected | Rename table | Low: leave as is or rename and grep |

## Open Questions

1. **Frozen planning docs and the old slug**
   - Known: ~40 `.planning/phases/{09,10,11.1}` files name `sfdy-alt-clean-reskin-2`.
   - Unclear: D-01 says "every doc that names reskin-2".
   - Recommendation: update living docs only (ROADMAP, REQUIREMENTS, STATE, CLAUDE.md, AGENTS.md, DESIGNER.md, PARKED.md, docs/); leave phase history as point-in-time records; ask the operator to confirm.
2. **Apex vs www and the old `fix: switch custom domain to apex` history message**
   - Known: current CNAME is `www.starflight-dynamics.com`; cert covers both.
   - Recommendation: keep `www` (D-10); verify the apex redirect in the live check only.
3. **Hashtag arrays and `keywords.json` quality for preflight**
   - Known: hashtags are empty, SEO text says "under construction".
   - Recommendation: refresh `seo.meta_description` (cheap), treat hashtags as non-blocking WARN.
4. **Legal checklist depth**: D-06 is a checklist, not a gate. Recommendation: one markdown file `.planning/phases/12-sfdy-cutover/12-LEGAL-CHECKLIST.md` listing each statement with page, file and line and an "operator/lawyer OK" column.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| node | builds, scripts | yes | v26.11.1 (CI uses 22) | — |
| npm | workspace/lock refresh | yes | 11.20.0 | — |
| gh (authenticated as pbau3r-sfdy) | backup branch, prod repo edit, publish, run watch | yes | 2.102.0 | — |
| git | rename, history | yes | — | — |
| curl | live checks | yes | — | — |
| DesignSync tool (model-side) | CUT-07 | session-dependent | — | Seed bundle is built locally; write step needs a Claude Code session |
| Browser for Plausible pageview | D-10 | operator | — | manual |
| Secrets `WM_PUBLISH_PAT` (WebsiteMocker) and `WM_DISPATCH_PAT` (prod repo) | publish, sync | yes (names verified via `gh secret list`) | updated 2026-08-24 / 2026-08-21 | Dispatch PAT is fine-grained with a 1-year max lifetime; both valid until at least 2027-08 [ASSUMED] |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Plain bash harnesses in `_scripts/verify-phase-NN.sh` (PASS/FAIL counters; established pattern: `verify-phase-10.sh`, `verify-phase-11-1.sh`) |
| Config file | none |
| Quick run command | `bash _scripts/verify-phase-12.sh rename` |
| Full suite command | `bash _scripts/verify-phase-12.sh all && bash _scripts/verify-phase-11-1.sh && bash _scripts/verify-phase-10.sh all && bash _scripts/verify-phase-09.sh all` |

`verify-phase-12.sh` proposed sections (usage `[rename|old|gate|prod|sandbox|ident|sync|live|all]`, exit 0/1/2; `live` and `sync-live` are opt-in because they touch the network):

| Req | Behavior | Section | Check |
|-----|----------|---------|-------|
| CUT-02 / D-01 | `sites/sfdy` is the baseline, old slug gone | `rename` | `test -f sites/sfdy/wiring.json`; `jq .slug == "sfdy"`; `test ! -d sites/sfdy-alt-clean-reskin-2`; `package.json` name `@websitemocker/sfdy`; `astro.config.mjs` base default `/WebsiteMocker/sfdy`; `node_modules/@websitemocker/sfdy` symlink resolves to `sites/sfdy`; no dangling reskin-2 symlink; `package-lock.json` has `sites/sfdy` and no `sites/sfdy-alt-clean-reskin-2`; scoped grep (Code Examples) empty |
| D-02 | Old archived sfdy removed cleanly | `old` | `git ls-files sites/sfdy` lists only the new site's files (e.g. `src/pages/open-points` or `src/internal/open-points.astro` present, `public/CNAME` absent); `_captures/sfdy` still present; no `sites/sfdy/.claude/skills` leftovers; `git log -1 --diff-filter=D` shows the removal commit |
| D-03 | Single owner of prod repo | `ident` | `grep -l '"prod_repo": "pbau3r-sfdy/starflight-dynamics"' sites/*/wiring.json` returns exactly `sites/sfdy/wiring.json`; same for `domain` `www.starflight-dynamics.com` |
| CUT-04 / D-11 | Identity | `ident` | `jq` asserts `prod_repo`, `domain`, `stage >= 5`, `analytics.sandboxUsesProdId` absent, `legal.*` complete; `node _scripts/check-analytics-gate.mjs sfdy --live` exit 0; `node _scripts/validate-brand.mjs` passes |
| CUT-02 / D-05 | No internal content in production dist | `prod` | production-base build (Code Examples); asserts: no `open-points` dir/text, no `internal review`, no `tbd-pill`, no `class="tbd`, no `noindex`/robots meta, no `plausible.io` sandbox identity; Careers `/jobs` has `Coming soon`; `CNAME`/`robots.txt` are NOT in dist (written by workflow) but `.nojekyll` IS; `dist/sfdy/index.html` has the production script id and no `/WebsiteMocker` string (`! grep -rIl '/WebsiteMocker' dist/sfdy`) |
| D-04 / D-05 | Sandbox still has the machinery | `sandbox` | sandbox-base build: `dist/sfdy/open-points/index.html` exists, `noindex` present, no analytics emitted (`sandboxUsesProdId` removed) |
| D-05 | Tbd marker degrades | `gate` | fixture-less unit: in a prod build temporarily (scratchpad copy) a `<Tbd id="x">` with an unknown id builds and renders plain text (proves `pointById` is not called) |
| CUT-05 / D-07 | Sync maps slug and guards jobs | `sync` | offline: copy `content-sync.yml`'s sync loop into a testable shell function (or extract `_scripts/sync-content.sh`) and run against a temp `WM_ROOT` with fixture `content/{news,jobs,blog}/*.md` + `.gitkeep`: news and blog files copied, `jobs/*.md` skipped with the log line, `.gitkeep` ignored, non-`.md` ignored, symlink ignored; assert `sites/sfdy` is the destination for slug `sfdy` |
| D-08 | Prod repo workflow slug | `sync-live` (opt-in, read-only) | `gh api repos/pbau3r-sfdy/starflight-dynamics/contents/.github/workflows/content-ci.yml --jq .content | base64 -d | grep -q '"slug": "sfdy"'` and `! grep -q 'sfdy-alt-clean'`; `_templates/.github/workflows/content-ci.yml` still `{{SLUG}}` |
| D-10 | Backup exists and equals the pre-publish sha | `live` | `gh api .../branches/gh-pages-old-2026-08 --jq .commit.sha` equals the sha recorded in the plan's SUMMARY |
| CUT-06 | Live verification | `live` (opt-in) | the curl block in the Publish section as asserts (status codes, `Allow: /`, no `noindex`, no `open-points`, Pages `cname`, `https_enforced`, gh-pages tree has `CNAME` and `.nojekyll`, `_astro` css 200); `wiring.json` after the workflow: `stage == 6`, `last_deploy` is today |
| RETL regression | Retool state survives the rename | `rename` | `SLUG=sfdy bash _scripts/verify-phase-11-1.sh` (after parameterising and fixing the imprint assertion) |
| Phase 9/10 regression | Harnesses intact | `rename` | `bash _scripts/verify-phase-10.sh all` (the `notfound` section must find `sites/sfdy/src/pages/404.astro` and `dist/sfdy/404.html` and must not SKIP) and `bash _scripts/verify-phase-09.sh all` |
| CUT-07 | Seed bundle correct | manual + dry run | `node _scripts/design-seed.mjs sfdy --existing-listing ... --dry-run` lists only `tokens/colors.css` and `assets/logo/*`, no `uploads/`; real write is manual-only (needs DesignSync + two approvals) |

### Sampling Rate
- **Per task commit:** `bash _scripts/verify-phase-12.sh rename` (or the section the task touches; every section must run in under about 30 s except the two builds, about 1 minute each)
- **Per wave merge:** `bash _scripts/verify-phase-12.sh all` (no network) plus `verify-phase-11-1.sh`, `verify-phase-10.sh`
- **Phase gate:** full suite green before the operator push gate; `live` and `sync-live` sections run after publish.

### Wave 0 Gaps
- [ ] `_scripts/verify-phase-12.sh` with the sections above
- [ ] `_scripts/internal-pages.mjs` + `src/data/internal.ts` (gating primitive) and a spike confirming `injectRoute`
- [ ] `_scripts/sync-content.sh` (or a harness that extracts the loop) so the jobs guard is testable without GitHub
- [ ] `_scripts/verify-phase-11-1.sh` and `verify-phase-10.sh` parameterised or updated for `sfdy`
- [ ] `sites/sfdy/public/.nojekyll`
- [ ] Clean-checkout `npm ci --dry-run` recipe in the plan (Pitfall 5)

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (static site) | — |
| V3 Session Management | no | — (no cookies; Plausible is cookie-free) |
| V4 Access Control | yes (repo credentials) | `WM_PUBLISH_PAT` only in WebsiteMocker; `WM_DISPATCH_PAT` fine-grained, one repo; never print or copy values (project rule) |
| V5 Input Validation | yes | slug regex `^[a-z0-9-]+$` already in `build-single.mjs`, publish.yml and content-sync.yml; keep slug passing via env vars, never interpolate `client_payload.slug` into `run:` |
| V6 Cryptography | no | HTTPS enforced by Pages; do not hand-roll |

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Contributor edits `content-ci.yml` to dispatch another slug | Tampering | Dispatch token only has `contents: write` on WebsiteMocker; sync copies `*.md` only, under `sites/<slug>/src/content/`, symlinks excluded; guard additionally restricts to existing collection dirs; operator reviews before publish |
| Test push publishes by accident | Tampering | Sync never builds/publishes; do not run `/wm-publish` until the test file is reverted |
| Internal notes leak (open points, parked ideas, "Bundeswehr" parked item) | Information disclosure | `/open-points` excluded from production; dist grep; `PARKED` data only reachable via that page |
| Stale credentials in prod repo | Spoofing | Do not store the publish PAT in the prod repo (existing rule) |
| Force-overwrite of gh-pages destroys old site | Denial of service | Backup branch before publish |

## Sources

### Primary (HIGH confidence)
- Repo files read this session: `12-CONTEXT.md`, ROADMAP/REQUIREMENTS Phase 12, `CLAUDE.md`, `AGENTS.md`, `.github/workflows/{deploy,publish,content-sync}.yml`, `_scripts/{rename-site,delete-site,build-all,build-single,design-seed,init-prod-repo,check-analytics-gate,plausible,fetch-perf-data,validate-brand,import-site}.*`, `_scripts/lib/{env,plausible-snippet}.mjs`, `_scripts/verify-phase-{10,11-1}.sh`, `_templates/**`, skills `wm-publish`, `wm-preflight`, `wm-init-collab`, `wm-design-seed`, site files under `sites/sfdy-alt-clean-reskin-2/` and `sites/sfdy/`
- Read-only `gh api` on `pbau3r-sfdy/starflight-dynamics`: branches, tree of `main` and `gh-pages`, Pages config, secrets list (names), content-ci.yml, branch protection, recent runs; `curl -I` on the live domain
- docs.astro.build/en/reference/integrations-reference/ (`injectRoute`, `astro:route:setup`, `astro:build:done`)
- github.com/JamesIves/github-pages-deploy-action README (`.nojekyll`, `CNAME`, `clean`, `single-commit`)

### Secondary / Tertiary
- None; Assumptions A1-A5 are untested inferences.

## Metadata

**Confidence breakdown:**
- Rename blast radius and old-site removal: HIGH (grep and `ls` evidence; one open scope question on frozen docs)
- Production gating: MEDIUM-HIGH (all coupling points read; `injectRoute` approach needs a spike, fallback defined)
- Sync and prod repo: HIGH (state read from the live repo; guard design untested)
- Publish/rollback: HIGH for mechanics, MEDIUM for `.nojekyll` behaviour under `single-commit`
- Design seed: HIGH for script, MEDIUM for DesignSync tool availability

**Research date:** 2026-10-14
**Valid until:** 2026-11-13 (repo state moves quickly; recheck gh-pages sha and local ahead count at execution)

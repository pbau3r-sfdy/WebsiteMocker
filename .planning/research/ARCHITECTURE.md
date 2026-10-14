# Architecture Patterns: v1.2 Integration (Design Sync, Analytics, Open Drops)

**Domain:** Static-site monorepo framework (Astro 5, wiring.json-driven)
**Researched:** 2026-10-14
**Basis:** reading the codebase (_scripts/plausible.mjs, publish.yml, deploy.yml, _core/astro.config.mjs, build-single.mjs, fetch-perf-data.mjs, ingest-artifact.mjs, validate-brand.mjs, verify-phase-08.sh). Plausible script-extension names and DesignSync limits come from the milestone brief or training knowledge: MEDIUM/LOW until verified in the phase-level research.

## Existing seams the features plug into

| Seam | Where | How v1.2 uses it |
|---|---|---|
| Astro integration reading `wiring.json` at `astro:config:setup` | `_scripts/plausible.mjs`, loaded from each site's `astro.config.mjs` (`integrations: [plausible()]`) | Extend plausible.mjs (Phase 10). Add `drops.mjs` as a sibling (Phase 11) |
| Sandbox vs production switch | `config.base.startsWith('/WebsiteMocker')` (plausible.mjs); `SITE_URL`/`SITE_BASE` env vars (build-single.mjs, publish.yml) | Drops needs the same switch (sandbox vs prod behaviour) |
| Per-site `wiring.json` as config bus | analytics, brand, stage, prod_repo | Add `design` block (9), extend `analytics` (10), add `drops` block (11) |
| `_data/<slug>/*.json` snapshot files read by the dashboard | `fetch-perf-data.mjs` writes `_data/<slug>/perf.json`; `src/pages/index.astro` `loadPerf()` | Mirror for `analytics.json` (10) |
| Ingest pipeline | `ingest-artifact.mjs <slug> --mode full\|section\|docs` | Design Sync only stages inputs. It does not change the ingest logic |
| Skills + verify scripts | `.claude/skills/wm-*.md`, `_scripts/verify-phase-NN.sh` (the `check()` PASS/FAIL harness) | One new skill per capability, one `verify-phase-NN.sh` per phase |
| Two-site-config duplication | `_core/astro.config.mjs` and each `sites/*/astro.config.mjs` each hardcode `integrations: [plausible()]` | Every new integration must be added to `_core` AND to each active site's config. Sites do not inherit automatically |

## Recommended architecture (new vs modified)

```
                    OPERATOR SESSION (Claude Code, local)
  ┌──────────────────────────────────────────────────────────────┐
  │ /wm-design-pull  (skill = model-only; DesignSync is a model  │
  │   tool, NOT callable from Node/CI)                           │
  │   list_files/get_file -> _captures/<slug>/raw/ (+ manifest)  │
  │        │                                                     │
  │        ▼  Node (deterministic, testable, no model)           │
  │ _scripts/design-render.mjs  (Playwright: JSX -> static HTML) │
  │ _scripts/design-tokens.mjs  (CSS vars -> brand.doc_tokens)   │
  │        │                                                     │
  │        ▼                                                     │
  │ ingest-artifact.mjs <slug> --mode section --section X        │
  └──────────────────────────────────────────────────────────────┘

  sites/<slug>/wiring.json  ── design{project_id,globs}
                            ── analytics{...,events,exclude,props}
                            ── drops{enabled,sandbox}

  BUILD (astro build; same in sandbox deploy.yml and publish.yml)
    plausible()  -> head script variant + event helper (public/ asset or injected)
    drops()      -> filter collection (expiry/withdrawn), noindex, robots, no-referrer
    pages: src/pages/d/[id].astro (from _core)  <- drops collection (glob src/drops/*/drop.md)

  FETCH (local or scheduled, NOT in site build)
    _scripts/fetch-analytics-data.mjs -> _data/<slug>/analytics.json -> src/pages/index.astro tile
```

### New components

| Component | Location | Type |
|---|---|---|
| `/wm-design-pull` skill | `.claude/skills/wm-design-pull.md` (+ `_scripts/wm-design-pull.md` doc copy if that is the existing convention: wm-*.md files already sit in `_scripts/`) | New |
| Staging dir + manifest | `_captures/<slug>/raw/` + `raw/.design-manifest.json` (file path, byte size, sha256, pulled-at) | New |
| `_scripts/design-render.mjs` | Playwright (already a dependency via `capture-site.mjs`) renders JSX/React artifacts to static HTML, then hands over to ingest | New |
| `_scripts/design-tokens.mjs` | Extracts design-system tokens, maps them to `brand.doc_tokens`, emits a diff/report | New |
| `_scripts/fetch-analytics-data.mjs` | Stats API client, modelled on fetch-perf-data.mjs | New |
| `_scripts/drops.mjs` | Astro integration | New |
| `_scripts/drop.mjs` | CLI `new\|list\|withdraw\|expire` | New |
| `_core/src/pages/d/[id].astro`, `_core/src/layouts/DropLayout.astro` | Drop route and minimal unbranded layout | New (in `_core`) |
| `_core/src/content.config.ts` + `dropsSchema` | Schema library export (`id`, `title`, `created`, `expires?`, `withdrawn?`, `attachments[]`, `audience?`) | Modified |
| `/wm-drop` skill | wraps drop.mjs | New |
| `_scripts/verify-phase-09.sh`, `-10.sh`, `-11.sh` | follow the verify-phase-08 pattern | New |

### Modified components

| Component | Change |
|---|---|
| `_scripts/plausible.mjs` | Script variant selection, custom props, exclusions, event helper (Phase 10); drop-aware pageview rewriting (Phase 11 hook) |
| `_scripts/validate-brand.mjs` | Assertions for the `design` block and for the token map. Note: its `ROOT` is hardcoded to `/Users/pbau3r/...`; fix to relative resolution while editing it, otherwise it cannot run in CI |
| `ingest-artifact.mjs` | Little or none. Optionally accept `--from-raw` or a `--source` path pointing at the rendered HTML in `_captures/<slug>/raw/` |
| `.claude/skills/wm-wire.md` | New analytics step: provider, events, privacy-snippet check, `design` block |
| `.claude/skills/wm-preflight.md` | Drop warnings: expiring in <N days, expired-but-still-in-tree, withdrawn-but-still-has-files, drop sources present while the build target is sandbox, a drop attachment too large |
| `src/pages/index.astro` | Analytics tile (reads `_data/<slug>/analytics.json`, same optional-file pattern as perf) |
| `_core/astro.config.mjs` + `sites/*/astro.config.mjs` | Add `drops()` to `integrations` |
| `_core/src/pages/privacy.astro` and per-site privacy pages | Plausible snippet (needed before switching analytics on for a live site, as CLAUDE.md already requires) |
| `CLAUDE.md` | Document the `design`, `analytics` (extended) and `drops` blocks, plus the new skills |
| `.github/workflows/publish.yml` | Minimal: see "CI changes" |
| `.github/workflows/deploy.yml` | Optional scheduled job for stats fetch; see below |

## Where shared code lives

Follow the convention the repo already has.

- `_scripts/` holds Astro integrations and Node CLIs (plausible.mjs precedent). So `drops.mjs`, `drop.mjs`, `design-*.mjs` and `fetch-analytics-data.mjs` all go there. Sites reach them via `../../_scripts/…`.
- `_core/` holds things a site renders: route `d/[id].astro`, `DropLayout.astro`, `dropsSchema`, and the privacy snippet. `new-site.sh` copies `_core`, so new sites get drops for free. **Existing sites will not get it** (`_core` is a copy template, not an inheritance mechanism). Phase 11 therefore needs an explicit "adopt in site X" step (copy the route and layout, add the collection, add the integration). Pilot on one site (crestworks, stage 6) rather than all four.
- Per-site holds: `src/drops/<id>/`, `wiring.json` blocks, and the site's `content.config.ts` collection entry. Do not put drop content in `src/content/`. `content-sync.yml` copies contributor `*.md` into `src/content/`, and confidential drops must stay out of that contributor sync path.
- Analytics helper for event calls: a small `public/`-free inline snippet generated by plausible.mjs (extend the existing queue stub, `window.plausible`), not a per-site component. Pages call `plausible('Event', {props})` as they already can.
- Prefer one shared module for the sandbox/production decision (e.g. `_scripts/lib/env.mjs` exporting `isSandbox(config)` and `SANDBOX_DOMAIN`). plausible.mjs currently inlines it, and drops.mjs would otherwise duplicate it. This is a small refactor to do first in Phase 10.

## Data flow per feature

### 1. Design Sync (Phase 9)
1. The model runs `/wm-design-pull <slug>`. It reads `wiring.design.{project_id,globs}`, calls DesignSync `list_files`, filters by globs, and fetches each file with `get_file`. Files over 256 KiB cannot be fetched, so the manifest records them as `skipped: too-large` and the skill must surface that clearly.
2. The skill writes the files and manifest to `_captures/<slug>/raw/`.
3. Node takes over: `design-render.mjs` renders JSX to static HTML, `design-tokens.mjs` produces the token map, then `ingest-artifact.mjs --mode section` runs.
4. `validate-brand.mjs` checks the mapped tokens against `brand.doc_tokens`.

Rule: **the model-only step is isolated to file staging.** Everything after it is plain Node, so it can be re-run and verified without the model, and the verify script can run against a fixture in `raw/`. Because DesignSync cannot be called from Node or CI, there is no CI step for Phase 9. The verify script covers the Node half only; the pull itself is a manual, human-observed step.

`write_files` via `finalize_plan` (write-back to the design project) is out of the happy path; keep it out of v1.2 scope unless the spike proves it is needed.

Repo hygiene: `_captures/` is committed to a public repo. Design-project files may be confidential, so the skill should warn, and the pilot should confirm that content is acceptable to publish.

### 2. Analytics (Phase 10)
- Build time: plausible.mjs reads `wiring.analytics` and picks the script URL variant, e.g. `script.file-downloads.outbound-links.tagged-events.js`, from the enabled events (MEDIUM: verify current extension names). It adds custom props and exclusions (`data-exclude`). 404 tracking is a custom event fired from `404.astro`. Forms use the tagged-events class convention or a `plausible('Form')` call.
- Reporting: `fetch-analytics-data.mjs` calls the Stats API (`/api/v1/stats/aggregate`, `/breakdown`) with a key. The key is a MarketingBridge vault secret, read locally and never printed. In CI it must be a GitHub secret. Output goes to `_data/<slug>/analytics.json` (capped history, like perf.json). The dashboard tile reads it with an optional-file fallback.
- Caveat: the sandbox dashboard is public (public repo, public Pages). `_data/` aggregates reach it only if committed or generated in CI. Keep to aggregate counts: visitors, pageviews, top-page counts, download counts. Never put per-drop data, referrers or page-level breakdowns for drop paths in `analytics.json`.
- The Stats API key must **never** go into the site build or `wiring.json`.

### 3. Open Drops (Phase 11)
- Authoring: `drop.mjs new` generates a random id (>=128-bit, base32/url-safe), creates `src/drops/<id>/drop.md` and `attachments/`, and writes frontmatter. `list` reads the tree. `withdraw` sets `withdrawn: true` or deletes the tree. `expire` sets or edits `expires`.
- Build: `drops.mjs` runs at `astro:config:setup`, using `command`/`config.base` for the sandbox decision. It filters expired and withdrawn drops. Because collections are evaluated in Astro, the filter lives in `getStaticPaths()` or a loader-level filter. The integration passes the build "now" via a Vite define or an env var, so the route and the integration agree. Expired drops are not rendered, and their attachments are not copied.
- Attachments: copy PDFs to `dist/d/<id>/` from `src/drops/<id>/` during `astro:build:done`, or place them under `public/`. Do not use `public/`, because it ships unfiltered and would leak expired/withdrawn files. Emit them from the integration or via an endpoint route so the expiry filter applies. Cap sizes (GitHub Pages and repo limits).
- noindex: `<meta name="robots" content="noindex,nofollow">` and `<meta name="referrer" content="no-referrer">` in `DropLayout`. GitHub Pages cannot send headers, so meta tags are the only mechanism.
- Sitemap/robots: the codebase has **no sitemap integration today** (grep found none; robots.txt is static `Disallow: /` in sandbox and swapped to `Allow: /` by publish.yml). So "sitemap exclusion" is a guard for any future `@astrojs/sitemap` use. The real work is robots: publish.yml's blanket `Allow: /` swap must be followed by `Disallow: /d/`. Put that step into `drops.mjs` `astro:build:done`, or add a line to the publish.yml "Swap robots.txt" step. Prefer the integration, so robots is written wherever the build runs. Note that robots `Disallow: /d/` itself advertises the path prefix (not the id), which is acceptable.
- Tracking: the drop page loads the Plausible script like any page, but pathname `/d/<id>/` would leak the id into Plausible's page dimension. See the coupling below.

## Sandbox vs production behaviour for drops (decision needed)

The sandbox is a **public repo with public Pages**. This has two consequences:

1. Drop sources (`src/drops/<id>/drop.md`, PDFs) in the WebsiteMocker repo are readable by anyone browsing GitHub, and they sit in git history forever. The random id therefore protects only against crawling and guessing, not against repo browsing. The same applies to the prod repo's `gh-pages` branch, which holds `d/<id>/` as a browsable tree. This is consistent with the stated "confidential-not-secret" constraint, but must be written into the docs and the drop skill, so nobody treats a drop as a secret.
2. Sandbox builds run on every push to main (`deploy.yml`), so a drop would be published to `pbau3r-sfdy.github.io/WebsiteMocker/<slug>/d/<id>/` the moment it is committed, regardless of the production decision. Withdrawing from production but not from the sandbox would leave a live copy.

**Recommendation:**
- Default `drops.sandbox: false`. The `drops()` integration emits no `/d/` pages when `config.base` starts with `/WebsiteMocker` (same test as plausible.mjs). Drops exist only in production builds (SITE_BASE `/`).
- Provide a local preview path: `astro dev` and an explicit `DROPS_PREVIEW=1` build, never deployed. `drop.mjs new` prints the production URL.
- Withdrawal is "remove from tree, commit, run `/wm-publish`". `clean: true` + `single-commit: true` in the publish step means gh-pages is rewritten without the drop; the old gh-pages commit is gone. Source history in WebsiteMocker is not. Document that.
- Expiry is **build-time only**. A static site cannot expire by itself, and an expired drop stays up until the next publish. Options: a scheduled workflow that dispatches publish for sites with drops expiring soon (cost: it needs publish.yml `workflow_dispatch` calls with the PAT), or accept the soft expiry and let `/wm-preflight` and `drop.mjs list` warn. For a "lightweight" constraint, recommend: warn only, plus an optional client-side expiry notice (soft, same as the Phase 12 Locked Drops soft expiry).
- `publish.yml` runs on `workflow_dispatch` only, with no change needed to build drops, since `build-single.mjs` -> `build-all.js` runs the integration. Two small changes are advisable: (a) fail the publish if the drops integration reports expired drops still in the tree (or just warn), and (b) the robots step above. Do not add contributor paths for drops (`content-ci.yml`/`content-sync.yml` must not sync them).

## Cross-feature coupling: Phase 10 -> Phase 11

Phase 11 depends on these Phase 10 deliverables:
1. **Script-variant mechanism** in plausible.mjs, with a manual-pageview option, so the drop layout can send `plausible('pageview', {u: location.origin + '/d/'})` or an equivalent sanitised URL. Otherwise the Plausible page dimension contains `/d/<id>/` and anyone with dashboard or API access sees the ids. This is the "tracked but id not leaked as grouping key" requirement. Check the current Plausible option: manual script variant with the `u` override, versus `data-exclude` + a custom event with a non-identifying prop (e.g. `drop_label`, a human label, never the id). Verify in Phase 10 research.
2. **Download events.** The `file-downloads` extension records the file URL as a prop (`url`), which contains the id. For drop attachments, either suppress the automatic extension on `/d/` pages and fire a custom `Drop Download` event with a label, or disable file-downloads in the drop layout. Phase 10 must define the event naming/props contract (`Download`, `Outbound Link: Click`, `Form`, `404`) so Phase 11 can add `Drop View` and `Drop Download` without redefining it.
3. **Exclusions** (`data-exclude`, operator IP/self-visits) apply identically to drops.
4. Stats API aggregation: `fetch-analytics-data.mjs` must exclude (or truncate to `/d/`) any breakdown row matching `/d/`.

Drops is tracked even though `analytics.status` might be off for a site. Define: drops tracking requires `analytics.status: configured` and shows nothing otherwise. Do not auto-enable it.

## Suggested build order

1. **Phase 9: Design Sync.** It is independent of 10 and 11 (touches ingest, captures, brand). Run the spike first (DesignSync limits, JSX render feasibility), because findings may shrink scope. It can run in parallel with Phase 10 if the operator wants. Pilot: Crestworks.
2. **Phase 10: Analytics.** Start with the small refactor (shared `isSandbox` helper), then plausible.mjs extensions, the `wm-wire` step, privacy snippet, then the Stats API fetch + dashboard tile (the tile is last; it has an external dependency and the lowest coupling).
3. **Phase 11: Open Drops.** Within the phase: schema + route + layout (render a drop locally) -> `drops.mjs` integration (filter, noindex, robots, sandbox gate) -> `drop.mjs` CLI -> Plausible wiring using Phase 10's contract -> preflight warnings -> verify script -> pilot on one site.
4. **Phase 12 (backlog): Locked Drops.** Builds on the drops collection; do not design 11's schema in a way that blocks an `encrypted` mode (keep body rendering in one component and attachments behind one path helper).

Verify script contents (follow the verify-phase pattern, e.g. `check()`; the `count_in` pattern): build the pilot site with SITE_BASE=/ and assert that `dist/d/<id>/index.html` exists and contains noindex and no-referrer; the expired fixture is absent; withdrawn is absent; the robots disallow is present; sandbox build has no `/d/`; no dist file contains the raw id inside a Plausible call or in `analytics.json`.

## Anti-patterns to avoid

| Anti-pattern | Why bad | Instead |
|---|---|---|
| Putting drop attachments in `public/` | Shipped unfiltered; expiry/withdraw leaks | Emit from the integration after filtering |
| Letting the Stats API key reach site builds or `wiring.json` | Public repos, public dist | Key only in the vault/GitHub secret, read by the fetch script only |
| Calling DesignSync from Node or relying on it in CI | Not possible: it is a model tool | Skill stages files, Node does everything after |
| Letting `/d/<id>/` become the Plausible pathname | Ids leak into the analytics dashboard and API | Sanitised pageview URL/label prop |
| Expecting `_core` changes to reach existing sites | `_core` is copied at scaffold time | Explicit adoption step per site; one pilot first |
| Syncing drops through `content-sync.yml` | Public contributor path, no operator review | Operator-only authoring via `drop.mjs` |
| Building drops in the sandbox by default | Public repo + public Pages, auto-deploy on push | `drops.sandbox: false` default |

## Scalability

Not a concern at this scale (4 active sites, a handful of drops). Watch: repo size from PDFs in git history (cap attachment size, prefer small PDFs), the 1 GB GitHub Pages limit, and Stats API rate limits when fetching per-site (sequential, like fetch-perf-data).

## Confidence

| Area | Confidence | Notes |
|---|---|---|
| Existing seams / where code goes | HIGH | Read directly from the repo |
| Sandbox-public implications for drops | HIGH | Follows from deploy.yml, publish.yml and the public repos |
| Plausible script variant names, `u` override, Stats API shapes | MEDIUM/LOW | From training knowledge; verify in Phase 10 research |
| DesignSync tool limits (256 KiB, finalize_plan) | LOW | From the milestone brief only; the Phase 9 spike must confirm |
| Drop attachment emit via integration hooks | MEDIUM | Standard Astro hooks (`astro:build:done`); confirm during implementation |

## Open questions for the roadmap

- Is committing confidential drop sources to the public WebsiteMocker repo acceptable? (Recommended: yes, document it; the alternative is a private source repo, which breaks the "source always lives in WebsiteMocker" rule.)
- Scheduled publish for expiry, or warn-only?
- Which site pilots drops (crestworks is already stage 6 and the Phase 9 pilot, which would conflate the two pilots; consider parrot-capital or mogwai-systems)?
- Should the dashboard analytics tile be committed data (public) or local-only?

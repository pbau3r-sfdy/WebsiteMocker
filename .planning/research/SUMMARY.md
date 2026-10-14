# Project Research Summary

**Project:** WebsiteMocker, milestone v1.2 (Claude Design Sync, Analytics, Open Drops)
**Domain:** Solo-operator, skill-driven static-site framework (Astro 5, GitHub Pages, public repos)
**Researched:** 2026-10-14
**Confidence:** MEDIUM

## Executive Summary

v1.2 adds three capabilities to a working Astro 5 monorepo: a manual design-system pull from Claude Design (Phase 9, Crestworks pilot), richer Plausible analytics on one SaaS subscription (Phase 10), and unlisted "open drops" at `/d/<id>/` (Phase 11). Encrypted Locked Drops are backlog Phase 12. No new service or server is needed. The work uses Node built-ins and Astro 5 integration hooks, mirroring `_scripts/plausible.mjs`, plus Playwright and esbuild (already in the repo) and new `wiring.json` blocks (`design`, extended `analytics`, `drops`). Candidate new dependencies: `react`/`react-dom` (dev only, Phase 9 render path) and `@astrojs/sitemap` (only if a site wants a sitemap; none does today).

Recommended shape:
- **Phase 9:** keep the model-only step (DesignSync) limited to staging files; everything after is deterministic, re-runnable Node.
- **Phase 10 before 11:** drops need Phase 10's event and URL-sanitising contract so the drop id never becomes a Plausible pathname.
- **Drops route:** a separate route outside the content collections that the sitemap, dashboard, RSS and content-sync iterate over.
- **Security model:** drops are unguessable and unlisted, "confidential but not secret". Repos and `gh-pages` are public, Pages cannot set headers, and withdrawal is best-effort.

Key risks are leaks and false confidence: (1) drop Markdown committed to a public repo defeats URL secrecy; (2) build-time expiry on a static host is soft unless something rebuilds; (3) the id can leak via Plausible paths, sitemap, robots.txt or logs; (4) a design pull can overwrite hand edits or ingest truncated or malicious content; (5) the Stats API needs the Business plan and its key must never reach the public dashboard.

## Open Decisions (resolve in requirements)

| # | Decision | Positions in the research | Recommendation (not binding) |
|---|---|---|---|
| a | **Drop source: public repo vs gitignored/private** | ARCHITECTURE: commit `src/drops/<id>/drop.md`, document "confidential, not secret". PITFALLS: keep source out of public repos, or explicitly accept "unlisted, not private". | Gitignored local source if drops may hold anything sensitive; if committed source is accepted, restrict content to what is tolerable in permanent git history. Gitignored source makes CI/cron rebuilds impossible, which couples to (b). |
| b | **Expiry: warn-only + manual publish vs scheduled rebuild** | PITFALLS: cron is an acceptance criterion. ARCHITECTURE: warn-only plus soft client notice (cron conflicts with D-A6). FEATURES: sandbox-only cron as compromise. | Warn-only for v1.2: preflight and `drop.mjs list` warn; `expires` mandatory ISO with offset and max horizon; document "removal = next publish". |
| c | **Plausible plan tier** | STACK, FEATURES, PITFALLS agree custom props and Stats API need **Business** (~$19/mo, 10 sites, 600 req/h); Growth has neither. Pricing from aggregators only. | Confirm on plausible.io first. If Growth: drop custom props and the Stats tile, use a deep/shared link. |
| d | **Drop pilot site** | ARCHITECTURE: not Crestworks (Phase 9 pilot). `_core` is copy-only, so adoption per site is an explicit step. | mogwai-systems is safer; parrot-capital holding page is intentionally minimal. Reconcile the CLAUDE.md inconsistency on crestworks (template vs prod repo). |
| e | **Dashboard analytics tile: public vs local** | Dashboard and `_data/` are public; key only in CI secret or vault. Tile ranked P2. | Local-only tile unless aggregate counts may be public; aggregates only, labelled "as of <date>"; build last in Phase 10. |
| f | **Sandbox default for drops** | ARCHITECTURE and PITFALLS: do not build drops in the sandbox. | `drops.sandbox: false`; no `/d/` pages when `config.base` starts with `/WebsiteMocker`; local preview via `astro dev` or `DROPS_PREVIEW=1`. |

Smaller conflicts to settle:
- **robots.txt:** suggest omitting any `Disallow: /d/` (it advertises the path and stops crawlers seeing noindex); rely on meta noindex plus no inbound links.
- **Id encoding:** 32 hex chars from `crypto.randomBytes(16)` (Astro 5 glob loader lower-cases ids).
- **Drop analytics identity:** the id must never reach Plausible (path, props, download URLs); use a non-secret `label` and a sanitised pageview URL; defer per-recipient ids.
- **`expires`:** mandatory, with a max horizon.
- **Design staging location:** gitignored staging plus a committed lock file (`design.lock.json`).
- **JSX render path:** esbuild + `react-dom/server` first, Playwright fallback; let the Phase 9 spike decide.
- **Plausible script format:** `_scripts/plausible.mjs` uses legacy `script.js` + `data-domain` (still supported). Since Oct 2025 the recommended form is per-site `pa-<scriptId>.js` + `plausible.init({...})` (MEDIUM confidence). Extend to prefer `analytics.scriptId`, fall back to legacy; the shared sandbox site needs its own constant or stays legacy. Use Stats API v2 (`POST /api/v2/query`).
- **Astro stays on 5.x** (latest 7.3.8, installed 5.18.2). `injectRoute` with URL entrypoint and the glob loader are verified on 5.x. `@astrojs/sitemap` 3.7.4 unconfirmed on Astro 5; fall back to `~3.6`.

## Key Findings

### Recommended Stack
- Astro ^5.18 (do not bump); Playwright (existing, `channel: 'chrome'`, local only); esbuild + `react`/`react-dom` 19 (dev only, optional); Node built-ins (`crypto`, `fetch`, WebCrypto), Node-20 compatible; Plausible Cloud Business for custom props and Stats API.
- Not added: `@plausible-analytics/tracker`, a second analytics service, any server/Worker, crypto/id libraries, an Astro upgrade, a reverse-engineered Claude Design client.

### Expected Features
- **Phase 9 must have:** `design` block; pull to staging (never straight into `src/`); hash manifest, idempotent re-pull; diff and dry-run; token map into `brand.doc_tokens`; section-mode ingest; DesignSync spike first.
- **Phase 10 must have:** download, outbound and form events; explicit 404 event; props/goals checklist; privacy-policy snippet with preflight gate; `/wm-wire` step; sandbox/prod domain assertion.
- **Phase 11 must have:** CSPRNG ids; drops route; noindex + no-referrer meta; expires/withdraw; PDFs inside the id folder; preflight and verify (static and live); `/wm-drop` skill.
- **Should have:** drift report, JSX static render (if spike needs it), Stats tile (after tier confirmed), branded drop layout, label-based drop events.
- **Defer:** push-back to Claude Design, per-recipient ids, Locked Drops (Phase 12), self-hosted Plausible, scheduled auto-pull (violates D-A6), two-way merge engine.

### Architecture Approach
Everything plugs into existing seams: Astro integration reading `wiring.json`, the sandbox/prod switch (`config.base`, `SITE_URL`, `SITE_BASE`), `_data/<slug>/*.json` snapshots, `ingest-artifact.mjs`, and the `verify-phase-NN.sh` harness. Shared code in `_scripts/`; rendered pieces in `_core/`. `_core` is a copy template, so existing sites need explicit adoption and each active site's `astro.config.mjs` must add new integrations.

Components: (1) `/wm-design-pull` + `design-render.mjs` + `design-tokens.mjs`; (2) extended `plausible.mjs` + `_scripts/lib/env.mjs` (`isSandbox`); (3) `fetch-analytics-data.mjs` → `_data/<slug>/analytics.json` (aggregates only); (4) `drops.mjs` integration, `drop.mjs` CLI, `d/[id].astro`, `DropLayout.astro` (attachments emitted after filtering, never from `public/`); (5) preflight and verify scripts (static `dist/` scan + live-URL check).

### Critical Pitfalls
1. **Public drop source (P11):** decide location first; never under `content/**/*.md` (content-sync path); state "unlisted, not private".
2. **Expiry/withdraw don't truly remove (P11):** build-time only; cover sandbox and production; verify against live URL; document git history, CDN, Wayback limits.
3. **Id leaks (P10/P11):** keep id out of sitemap, robots, dashboard, logs, commits, Plausible paths; `dist/` lint; never use hash tracking (Phase 12 key lives in the URL fragment).
4. **Design pull hazards (P9):** overwriting hand edits (stage + lock file + three-way compare); truncation near the 256 KiB cap (fail hard); malicious content (strip scripts and `on*` attributes, treat pulled text as data, render in a throwaway context).
5. **Stats key and legal (P10):** key never in client JS, `wiring.json` or `dist/`; privacy-policy mention required before analytics goes live per site (preflight gate); DPA signed; counsel confirms TDDDG wording (not legal advice).

## Implications for Roadmap

### Phase 9: Claude Design Sync (Crestworks pilot)
Independent of 10 and 11; may run parallel with 10. Spike gates scope. Delivers spike report, `design` block, `/wm-design-pull`, gitignored staging + lock file, token mapping and diff, sanitising ingest, `verify-phase-09.sh` (fixture-based). Also fix hardcoded `ROOT` in `validate-brand.mjs`.

### Phase 10: Analytics
Prerequisite for Phase 11. Order: `isSandbox` refactor → `plausible.mjs` (`pa-<scriptId>` + legacy fallback, init flags, props, exclusions, domain build assertion) → 404 event → `/wm-wire` step, privacy snippet and preflight gate, goals checklist → Stats tile last (only if decisions c and e allow). Delivers event contract (`Download`, `Outbound Link: Click`, `Form`, `404`), a no-path tracking mode, `verify-phase-10.sh`.

### Phase 11: Open Drops (pilot on a non-Crestworks site)
Consumes Phase 10. Start with decisions a, b, f. Delivers schema/route/layout, `drops.mjs` + `drop.mjs` + `/wm-drop`, label-based Plausible events, preflight warnings, static and live verify, PDF metadata stripping (fail if toolchain missing), pilot adoption. Keep body rendering in one component and attachments behind one path helper so Phase 12 can add an encrypted mode.

### Phase 12 (backlog): Locked Drops
WebCrypto AES-GCM-256, key in the `#fragment`; safe only if analytics never records fragments.

### Research Flags
- **Phase 9:** DesignSync cap, truncation, binary and revision behaviour; section-merge semantics for edited sections; JSX render feasibility.
- **Phase 10:** current script/init options; `u` override or exclusion for sanitised pageviews; custom-prop limits; plan tier and pricing; Stats API v2 shapes; DPA; legal wording.
- **Phase 11:** source-location decision; GitHub Pages CDN TTL; `qpdf`/`exiftool` availability; withdraw-from-history procedure; `@astrojs/sitemap` on Astro 5 only if wanted.
- Standard patterns (skip research): Phase 11 internals (collection, `getStaticPaths`, `injectRoute`, `astro:build:done`); Phase 12 until promoted.

## Confidence Assessment

| Area | Confidence | Notes |
|---|---|---|
| Stack | MEDIUM-HIGH | npm versions verified live; Astro hooks and Stats API v2 from official docs; pricing from aggregators |
| Features | MEDIUM | Plausible facts HIGH; Design Sync from secondary sources; drop patterns from general practice |
| Architecture | MEDIUM-HIGH | Repo seams read directly; Plausible variant names and DesignSync limits partly superseded by STACK |
| Pitfalls | MEDIUM | Project docs and platform behaviour, no live verification, many `[VERIFY]` tags |

**Overall:** MEDIUM.

### Gaps
- DesignSync limits and revision semantics: Phase 9 spike.
- Plausible plan, price, API/props availability: confirm before Phase 10 requirements are final.
- Plausible `u` override or exclusion for drops: verify in Phase 10, else drops need a no-script mode.
- Legal wording (TDDDG §25, Art. 6(1)(f), DPA): operator and counsel.
- Drop source location: user decision (a) precedes Phase 11 design.
- Crestworks status: reconcile the CLAUDE.md inconsistency.
- Disregard ARCHITECTURE's extension-named Plausible scripts and v1 API paths.

## Sources
- **HIGH:** `npm view` (astro 7.3.8 vs installed 5.18.2, sitemap 3.7.4, playwright 1.64.0, react 19.3.0, esbuild 0.28.2); docs.astro.build integrations reference; plausible.io/docs/stats-api; repo files (PROJECT.md, CLAUDE.md, `plausible.mjs`, `publish.yml`, `deploy.yml`, `ingest-artifact.mjs`).
- **MEDIUM:** Plausible docs on script extensions, script update guide, custom event goals, file downloads; Claude Design handoff articles.
- **LOW (needs validation):** Plausible pricing from aggregators; GDPR/TDDDG claims; DesignSync limits from the milestone brief; GitHub Pages CDN TTL and code-search scope; PDF toolchain details.

*Research completed: 2026-10-14. Ready for roadmap once decisions a, b and c are resolved.*

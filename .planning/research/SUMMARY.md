# Project Research Summary

**Project:** WebsiteMocker — Deploy Pipeline + Content System Upgrade
**Domain:** Skill-driven Astro monorepo → per-site GitHub Pages production pipeline with async team contribution
**Researched:** 2026-08-20
**Confidence:** HIGH

---

## Executive Summary

WebsiteMocker's upgrade milestone spans four capability groups: production deploy (DEPLOY), markdown content management (CONTENT), brand consistency (BRAND), and collaboration infrastructure (COLLAB). All four areas have clear, low-complexity solutions grounded in the existing codebase — no new frameworks, no third-party services, no architectural pivots.

The recommended approach is sequential by dependency. First, build `publish.yml` (the sole gap between "stage 5 ready" and "live"). Second, migrate all sites to the Astro 5 Content Layer API and add the `jobs` collection. Third, wire the `brand` block into `wiring.json` and update skills. Fourth, ship collaboration infrastructure (CONTRIBUTING.md, YAML Issue templates, two-branch production repo model). Design artifact ingestion (`/wm-ingest`) is a fifth, independent stream that does not block any of the above.

---

## Stack

All tooling decisions reinforce the existing codebase. No new frameworks or packages required.

| Tool | Version | Purpose | Why |
|------|---------|---------|-----|
| `JamesIves/github-pages-deploy-action` | v4.9.0 (↑ from v4.8.0) | Cross-repo gh-pages push | Already used for sandbox; v4.9.0 fixes branch-naming bugs, Node 24 |
| Classic PAT (`WM_PUBLISH_PAT`, `repo` scope) | — | Cross-repo auth | `GITHUB_TOKEN` is scoped to current repo only |
| Astro 5 Content Layer API (`loader: glob()`) | Current | Content collections | Replaces deprecated `type: 'content'` API; config moves to `src/content.config.ts` |
| `z.coerce.date()` | — | Frontmatter date handling | Web UI editors write quoted dates; `coerce` handles string→Date conversion |
| YAML issue forms (`.github/ISSUE_TEMPLATE/*.yml`) | — | Structured contribution intake | Supersedes legacy `.md` templates; enforces required fields |
| `workflow_dispatch` | — | Publish trigger | Never push-triggered — avoids redeploying all sites on every content commit |

**NOT to use:**
- `GITHUB_TOKEN` for cross-repo push — silently 403s
- `build-all.js` in `publish.yml` — rebuilds every site; production needs single-site build only
- `type: 'content'` in content collection schema — Astro 4 API, maintenance mode, will be removed
- `z.date()` in schemas — breaks on quoted dates from non-technical contributors
- Legacy markdown issue templates — cannot enforce required fields

---

## Table Stakes Features

**DEPLOY cluster:**
- Cross-repo PAT push with `persist-credentials: false` on checkout
- CNAME file written into build output before push (custom domain requires it)
- `robots.txt` swapped from `Disallow: /` to `Allow: /` at publish time
- Stage gate (≥ 5) from `wiring.json` before build
- `wiring.json` updated to stage 6, `last_deploy`, `prod_repo` after successful push
- Single-site build via `_scripts/build-single.mjs <slug>` (not `build-all.js`)

**CONTENT cluster:**
- Astro 5 Content Layer API migration for all existing sites
- `jobs` collection in `_core/` with `open: boolean` field (hide closed roles without deleting)
- Schema standardization across all sites from `_core/src/content.config.ts` (canonical source)
- `z.coerce.date()` in all schemas before collaboration is opened

**BRAND cluster:**
- `brand` block in `wiring.json`: `hashtags[]`, `vocabulary[]`, `avoid[]`, `voice`
- `/wm-wire` extended to build brand block interactively if absent
- `/wm-add-news` reads `brand.hashtags`, checks `brand.avoid`

**COLLAB cluster:**
- CONTRIBUTING.md per production repo (two-tier model: direct push for `.md`; Issues for everything else)
- Three YAML Issue templates: `content-request.yml`, `design-change.yml`, `bug-report.yml`
- `config.yml` disabling blank issues
- Two-branch production repo model: `gh-pages` (built output) + `main` (content + `content-ci.yml`)
- `content-ci.yml` dispatches to WebsiteMocker `publish.yml` when `content/**/*.md` changes

---

## Architecture

Three-job `publish.yml` (validate → build → push), data-driven from `wiring.json`. No site-specific values hardcoded in the workflow.

```
WebsiteMocker (sandbox)
  └── publish.yml
        ├── Job 1: validate — read wiring.json, gate on stage ≥ 5
        ├── Job 2: build — cd sites/<slug>, npm run build (SITE_URL + SITE_BASE)
        │                  write CNAME to dist/<slug>/
        │                  swap robots.txt
        └── Job 3: push — JamesIves action, repository-name from wiring.json
                          update wiring.json to stage 6

Production repo (pbau3r-sfdy/<slug>)
  ├── main branch
  │     ├── content/news/*.md   ← contributor-editable via GitHub web UI
  │     ├── content/jobs/*.md   ← contributor-editable via GitHub web UI
  │     └── .github/
  │           ├── content-ci.yml   ← watches content/** → dispatches WebsiteMocker publish.yml
  │           └── ISSUE_TEMPLATE/  ← 3 YAML templates + config.yml
  └── gh-pages branch            ← built output only (force-pushed by publish.yml)
```

**Content per site (WebsiteMocker source):**
```
sites/<slug>/
  └── src/
        └── content.config.ts   ← Astro 5 Content Layer API (migrated from src/content/config.ts)
        └── content/
              ├── news/         ← YYYY-MM-DD-slug.md files
              └── jobs/         ← slug.md files with open: boolean
```

**Key constraint:** `/wm-ingest` may write into `sites/<slug>/src/components/` but must never overwrite `Nav.astro` or `Footer.astro` — these carry `BASE_URL` routing and are structural.

---

## Top Pitfalls

| # | Pitfall | Prevention | Phase |
|---|---------|-----------|-------|
| 1 | CNAME file missing from build output → custom domain resets on every push | `echo "$DOMAIN" > dist/<slug>/CNAME` in publish.yml before push step | DEPLOY-01 |
| 2 | `robots.txt` `Disallow: /` deployed to production → site not indexed | Overwrite `robots.txt` with `Allow: /` in publish.yml before push | DEPLOY-01 |
| 3 | `GITHUB_TOKEN` used for cross-repo push → silent 403 | Classic PAT `WM_PUBLISH_PAT` + `persist-credentials: false` on checkout | DEPLOY-01 |
| 4 | `build-all.js` invoked in publish.yml → rebuilds all 7 sites | Create `_scripts/build-single.mjs <slug>` for production builds | DEPLOY-01 |
| 5 | Legacy Astro 4 content API left in place → will break when shim removed | Migrate all `config.ts` → `content.config.ts` with `loader: glob()` in CONTENT phase | CONTENT-01 |
| 6 | Schema drift: `sfdy-alt-clean` missing `imageCredit`, `mogwai-systems`/`parrot-capital` have no `config.ts` | Canonical schema in `_core/`, audit all sites, scaffold missing `config.ts` files | CONTENT-01 |
| 7 | `z.date()` breaks on quoted dates from non-technical web UI editors → CI fails | Change to `z.coerce.date()` across all schemas | CONTENT-01 |
| 8 | Branch protection "require signed commits" or "require PR reviews" → breaks GitHub web UI editing | Never enable on production repos that allow web UI editing | COLLAB-04 |
| 9 | Squarespace default A records left in place → intermittent 404s from parking page | DNS guide must say: delete ALL existing A/AAAA/CNAME records before adding GH Pages records | DEPLOY-03 |
| 10 | CSS variable collisions between ingested artifact and `_core/` | `/wm-ingest` must scan for variable name conflicts before applying | INGEST-01 |

---

## Recommended Phases

| # | Phase | Delivers | Requirement Cluster | Notes |
|---|-------|---------|---------------------|-------|
| 1 | Production Deploy Pipeline | `publish.yml`, `build-single.mjs`, CNAME+robots.txt handling, stage gate, wiring.json updates, Squarespace DNS guide | DEPLOY-01/02/03 | Sole blocker to going live; do first |
| 2 | Content System | Astro 5 Content Layer API migration, `jobs` collection, canonical schema in `_core/`, schema audit across all sites | CONTENT-01/02/03 | Must be stable before CONTRIBUTING.md is written |
| 3 | Brand Consistency | `brand` block in `wiring.json`, `/wm-wire` brand prompt, `/wm-add-news` brand reads | BRAND-01/02 | Independent; can run parallel to Phase 2 but sequenced here for focus |
| 4 | Collaboration Infrastructure | CONTRIBUTING.md, YAML Issue templates, two-branch production repo, `content-ci.yml` dispatch | COLLAB-01/02/03/04 | Requires Phases 1 + 2 to be stable |
| 5 | Design Artifact Ingestion | `/wm-ingest` skill (full-site + section modes), CSS token extraction, Nav/Footer preservation | INGEST-01/02/03 | Fully decoupled; budget for heuristic iteration |

**Research flags for planning:**
- Phase 4: Cross-workflow dispatch untested in this codebase (MEDIUM confidence). Plan a PAT scope verification spike before implementing.
- Phase 5: No external tool covers section-level HTML→Astro conversion. Custom heuristic implementation — budget for experimentation.

---

*Research completed: 2026-08-20 | Ready for roadmap: yes*

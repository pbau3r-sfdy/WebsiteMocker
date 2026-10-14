# CLAUDE.md — WebsiteMocker

Skill-driven monorepo for creating, iterating, and deploying branded static websites.
GitHub repo: `pbau3r-sfdy/WebsiteMocker`
Dashboard: `https://pbau3r-sfdy.github.io/WebsiteMocker/`

## Purpose

**WebsiteMocker is the sandbox.** It is never the live production system.

- Design, iterate, and preview sites here before they go live
- When a site reaches Stage 5, publish it to its own production repo in the `pbau3r-sfdy` GitHub organisation
- Template sites (Orbint, Hypersonica, Levion, etc.) are **design references only** — they have no production destination

## Site categories

Every site declares its role in `wiring.json`. Three categories exist, plus docs-only entries:

| Category | `wiring.json` flag | Dashboard section | Perf tracked |
|---|---|---|---|
| **Active** | *(no flag)* | Main list | ✓ |
| **Template** | `"template": true` | Templates drawer (collapsed) | ✗ |
| **Archived** | `"archived": true` | Archive drawer (collapsed) | ✗ |
| **Docs-only** | `"kind": "docs"` | Not listed as a site (see Documentation page) | ✗ |

- **Active** — real sites with owners, domains, and a production path.
- **Template** — design captures kept as remix references. No production path. Not tracked for performance. Do not advance past Stage 2.
- **Docs-only** — not a website (e.g. `marketing-bridge`, an MCP server). The entry exists only so `/wm-gen-docs` can read `prod_repo` and `brand.doc_tokens`.
- **Archived** — retired experiments. Excluded from CI builds (`skip_ci: true` set automatically). Can be deleted permanently with `node _scripts/delete-site.mjs <slug> --confirm`.

## Site lifecycle — keeping wiring.json accurate

**When a site goes live** (production domain active, GitHub Pages deployed), immediately update `wiring.json`:

```json
{
  "stage": 6,
  "domain": "example.com",
  "prod_repo": "pbau3r-sfdy/example",
  "last_deploy": "YYYY-MM-DD"
}
```

Then commit:
```bash
git add sites/<slug>/wiring.json
git commit -m "chore(<slug>): mark stage 6, live"
git push
```

Stale `wiring.json` = wrong dashboard = wrong perf fetch URL. Update it the moment you deploy.

**Archiving a site** (triage in dashboard, then make permanent):
```bash
node _scripts/archive-site.mjs <slug> "reason"
git add sites/<slug>/wiring.json && git commit -m "chore: archive <slug>"
```

**Deleting a site** (dry-run first, then confirm):
```bash
node _scripts/delete-site.mjs <slug>             # dry-run
node _scripts/delete-site.mjs <slug> --confirm   # actually delete
git add -A && git commit -m "chore: delete <slug>"
```

## Site ownership

| Slug | Owner | Production repo | Domain |
|---|---|---|---|
| `sfdy-alt-clean` | Starflight Dynamics GmbH | `pbau3r-sfdy/starflight-dynamics` | starflight-dynamics.com |
| `sfdy-alt-clean-reskin` | Starflight Dynamics GmbH | — (internal review, sandbox only) | — |
| `sfdy-alt-clean-reskin-2` | Starflight Dynamics GmbH | — (internal review, Increment 2 texts, sandbox only) | — |
| `mogwai-systems` | MOGWAI / Starflight Dynamics GmbH | `pbau3r-sfdy/mogwai-systems` | mogwai-systems.com |
| `parrot-capital` | Parrot Capital UG | `pbau3r-sfdy/parrot-capital` | parrot-capital.com |
| `crestworks` | — | `pbau3r-sfdy/crestworks` | crestworks.co |
| `levion` | — | active template | — |
| `orbint` | — | remix reference | — |
| `hypersonica` | — | remix reference | — |
| `tnt-ventures` | — | remix reference | — |

## Parked for later

`PARKED.md` (repo root) lists ideas to leverage later, across all sites. When the user says to park something, add a row there (date, site, idea, notes); when it is picked up, build it and remove the row. Blocking issues are not parked: they go into the site's open points.

## Analytics (Plausible)

Cookie-free Plausible Analytics is built into the framework as an Astro integration, `_scripts/plausible.mjs`, loaded by `_core` and the active sites (`integrations: [plausible()]`). It is optional and off by default: switch it on for a site only when the operator asks, through `wiring.json`:

```json
"analytics": { "service": "plausible", "status": "configured" }
```

- **scriptId sites** set `"scriptId": "pa-…"` (the per-site tag id); identity mismatches fail the build (`[plausible] ANLY-03:`). **Production builds** (`/wm-publish`, base `/`) report to that script, or to `analytics.domain` / `wiring.domain` without `www.` on legacy sites.
- **Sandbox builds** (base `/WebsiteMocker/<slug>`): scriptId sites emit nothing unless `sandboxScriptId` (separate site) or the loud debug opt-in `sandboxUsesProdId` is set. Legacy sites still report to `pbau3r-sfdy.github.io`; `"sandbox": false` skips the preview. **Remove `sandboxUsesProdId` at the Phase 12 cutover.**
- `"host"` points to a self-hosted instance (default `https://plausible.io`). `astro dev` never loads the script.
- Privacy gate: `node _scripts/check-analytics-gate.mjs <slug> --live` fails when a live site lacks the Plausible "Web analytics" privacy section (runs in `/wm-preflight` and `publish.yml`).
- Event contract, schema and goals checklist: `docs/analytics.md`.
- Before switching it on for a live site, add Plausible to that site's privacy policy (see `/wm-wire`).

## Production deployment model

```
WebsiteMocker (sandbox, pbau3r-sfdy/WebsiteMocker)
    │
    │  develop → preview at pbau3r-sfdy.github.io/WebsiteMocker/<slug>/
    │
    └── /wm-publish <slug>
            builds with SITE_URL + SITE_BASE env vars
            pushes dist/<slug>/ → pbau3r-sfdy/<slug>  gh-pages branch
                                          │
                                          └── GitHub Pages → custom domain ✓

pbau3r-sfdy/<slug>  main branch (contributor surface)
    │
    │  contributor pushes content/**/*.md
    │
    └── content-ci.yml dispatches content-updated to WebsiteMocker
            ↓
        content-sync.yml copies *.md into sites/<slug>/src/content/
        commits to WebsiteMocker main — does NOT build, does NOT publish
            ↓
        operator reviews, then runs /wm-publish <slug> to go live
```

Each production repo in `pbau3r-sfdy` has two branches:
- `main` — contributor surface (`content/**/*.md`, `.github/`, `CONTRIBUTING.md`). Default branch.
- `gh-pages` — built output only. Force-overwritten by every publish. Never hand-edited.

The source always lives in WebsiteMocker.

> The production org is `pbau3r-sfdy`. Production repos live at `github.com/pbau3r-sfdy/`.

## Contributor collaboration (production repos)

Each production-bound site supports a two-tier contribution model once `/wm-init-collab <slug>` has been run:

| Tier | Path |
|---|---|
| Content `.md` files under `content/` | Direct push to `main`; auto-synced to WebsiteMocker for operator review |
| Everything else (design, layout, bug reports) | GitHub Issue using one of the three issue templates |

**Branch model:** `main` = contributor surface and default branch. `gh-pages` = generated output, never hand-edited.

**A contributor push does NOT publish.** It triggers `content-sync.yml`, which syncs the `.md` files into WebsiteMocker for review. Going live requires the operator to run `/wm-publish <slug>`.

**Additive-only policy:** deleting a content file from the production repo does not unpublish it from the live site.

**Setting up a production repo:**

```bash
node _scripts/init-prod-repo.mjs <slug>          # dry run — shows what will happen
node _scripts/init-prod-repo.mjs <slug> --confirm # execute
```

`/wm-init-collab <slug>` is the preferred operator entry point because it also handles the `WM_DISPATCH_PAT` step inline.

## Quick reference — all skills

### Framework (root `.claude/skills/`)
| Skill | What it does |
|---|---|
| `/wm-new-site` | Scaffold a new site from `_core/` |
| `/wm-capture` | Fetch a live URL and extract design DNA |
| `/wm-instantiate` | New site from a capture + brand brief |
| `/wm-list-sites` | Overview of all sites with stage + wiring |
| `/wm-deploy` | Build and push to sandbox GitHub Pages |
| `/wm-preflight` | Full readiness checklist before deploy |
| `/wm-wire` | Interactive wizard for all service connections |
| `/wm-publish` | Build with production env vars and push to the production repo's `gh-pages` branch |
| `/wm-init-collab` | Make a production repo contributor-ready (branch, templates, labels, PAT) |
| `/wm-archive-browse` | Browse Wayback Machine snapshots for a site, inspect with toolbar-stripped URLs, optionally capture |
| `/wm-ingest` | Ingest a Claude Design HTML/CSS artifact into an existing site as routed Astro components |
| `/wm-design-pull` | Pull a Claude Design design system or a local export zip into a site (staged, locked, guarded; writes DESIGN.md) |
| `/wm-design-seed` | Seed or incrementally update a Claude Design design-system project from a site's brand tokens and logos (operator-approved path list) |
| `/wm-gen-docs` | Generate a branded HTML document from a Claude Design artifact and commit it to the production repo's `docs/` folder |

### Content (inherited from `_core/.claude/skills/`)
| Skill | What it does |
|---|---|
| `/wm-add-news` | Add a news post (title → content → images → commit) |
| `/wm-edit-news` | Edit any field of an existing post |
| `/wm-list-news` | List all posts with dates and word counts |
| `/wm-update-hero` | Change headline, sub, CTA, background image |
| `/wm-init-keywords` | Build initial `keywords.json` from content analysis |
| `/wm-reserve-socials` | Research handles + guide registration + wire |

## Maturity stages
| # | Label | Criteria |
|---|---|---|
| 0 | Captured | `_captures/name/` exists |
| 1 | Instantiated | `sites/name/` created, build passes |
| 2 | Content Ready | All sections filled, ≥1 news post, no placeholders |
| 3 | Wired | Forms, newsletter, socials in `wiring.json` |
| 4 | Legal Complete | Impressum and privacy complete |
| 5 | Prod Ready | All checks pass, domain set, astro.config env-aware |
| 6 | Live | Published to production repo, custom domain active |

## Commands
```bash
npm run dev             # Dashboard dev server → localhost:4321
npm run build           # Build all sites → dist/
node _scripts/build-all.js sfdy         # Build one site + dashboard
node _scripts/build-all.js parrot-capital
cd sites/sfdy && npm run dev            # SFDY dev server → localhost:4409
```

## Adding a site
```bash
bash _scripts/new-site.sh <slug> "<Site Name>" "<#accent>" "<email>"
npm install   # picks up new workspace
```

## Repository layout
```
WebsiteMocker/
├── _captures/           ← design DNA library (capture.json + screenshots + assets)
├── _core/               ← base template (all sites inherit)
├── _scripts/
│   ├── build-all.js     ← builds dashboard + all sites
│   ├── capture-site.mjs ← Playwright capture (Wix/SPA-safe)
│   └── init-prod-repo.mjs ← bootstrap a production repo for contributors
├── _templates/          ← production repo bundle (CONTRIBUTING.md, issue templates, content-ci.yml)
├── sites/
│   ├── sfdy/            ← Starflight Dynamics (stage 2, production-bound)
│   ├── parrot-capital/  ← Parrot Capital UG (stage 4, production-bound)
│   ├── orbint/          ← design template only
│   ├── hypersonica/     ← design template only
│   ├── levion/          ← design template only
│   ├── crestworks/      ← design template only
│   └── tnt-ventures/    ← design template only
├── .claude/skills/      ← framework-level skills
├── .github/workflows/
│   ├── deploy.yml       ← sandbox deploy (every push to main)
│   ├── publish.yml      ← production publish (manual, per site)
│   └── content-sync.yml ← receives contributor content (no publish)
├── src/pages/index.astro         ← dashboard: Websites
├── src/pages/documentation.astro ← dashboard: Documentation (manuals in public/docs/, registered in src/data/docs.json)
└── public/
    ├── robots.txt       ← Disallow: / (sandbox — never indexed)
    └── .nojekyll        ← prevents Jekyll from stripping _astro/ dirs
```

## Key files per site
- `wiring.json` — service connections + maturity stage (read by dashboard)
- `keywords.json` — brand keyword dictionary (used by content skills)
- `astro.config.mjs` — sandbox: `base: '/WebsiteMocker/<slug>'`; production build uses `SITE_URL` + `SITE_BASE` env vars

## GitHub
- Sandbox repo: `https://github.com/pbau3r-sfdy/WebsiteMocker`
- Pages source: `gh-pages` branch, root `/`
- Every push to `main` triggers a full sandbox rebuild and deploy
- Check deploy status: `gh run list --limit 5`
- Sandbox work is tracked and pushed: commit the finished site's files only (leave unrelated work uncommitted), push, then confirm the deploy run and the live URL. The repo is public, so sandbox URLs are public too (pages are noindex, no password).

### GitHub credentials
- **Vault (source of truth):** MarketingBridge service-keys vault, `github::token_sfdy` (token) and `github::repo_sfdy`. Never copy or print the value; list with `cr_vault_list_keys`.
- **MarketingBridge `github` module:** reads `GITHUB_TOKEN`, so it stays inactive until the token is registered under that name (`mb_register_integration('github', …)`, done by the operator). Check with `mb_status`.
- **Local git / gh:** logged in as `pbau3r-sfdy` via the macOS keychain (scopes `repo`, `workflow`, `admin:org`). `git push origin main` and `gh` use this login.

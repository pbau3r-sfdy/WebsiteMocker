# CLAUDE.md — WebsiteMocker

Skill-driven monorepo for creating, iterating, and deploying branded static websites.
GitHub repo: `pbau3r-sfdy/WebsiteMocker`
Dashboard: `https://pbau3r-sfdy.github.io/WebsiteMocker/`

## Purpose

**WebsiteMocker is the sandbox.** It is never the live production system.

- Design, iterate, and preview sites here before they go live
- When a site reaches Stage 5, publish it to its own production repo in the `[websites-org]` GitHub organisation
- Template sites (Orbint, Hypersonica, Levion, etc.) are **design references only** — they have no production destination

## Site ownership

| Slug | Owner | Production repo | Domain |
|---|---|---|---|
| `sfdy` | Starflight Dynamics GmbH | `[websites-org]/starflight-dynamics` | starflight-dynamics.com |
| `parrot-capital` | Parrot Capital UG | `[websites-org]/parrot-capital` | parrot-capital.com |
| `orbint` | — | template only | — |
| `hypersonica` | — | template only | — |
| `levion` | — | template only | — |
| `crestworks` | — | template only | — |
| `tnt-ventures` | — | template only | — |

> **Templates** are style experiments and design captures. Do not advance them past Stage 2, do not create production repos for them, and do not treat their content as real.

## Production deployment model

```
WebsiteMocker (sandbox, pbau3r-sfdy/WebsiteMocker)
    │
    │  develop → preview at pbau3r-sfdy.github.io/WebsiteMocker/<slug>/
    │
    └── /wm-publish <slug>
            builds with SITE_URL + SITE_BASE env vars
            pushes dist/<slug>/ → [websites-org]/<slug>  gh-pages branch
                                          │
                                          └── GitHub Pages → custom domain ✓
```

Each production repo in `[websites-org]` contains **built output only** (gh-pages branch). The source always lives here in WebsiteMocker.

> ⚠️ `[websites-org]` placeholder — replace with the actual org name once created on GitHub.

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
│   └── capture-site.mjs ← Playwright capture (Wix/SPA-safe)
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
│   └── publish.yml      ← production publish (manual, per site) [TODO]
├── src/pages/index.astro   ← dashboard
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

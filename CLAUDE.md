# CLAUDE.md — WebsiteMocker

Skill-driven monorepo for creating, iterating, and deploying branded static websites.
GitHub repo: `pbau3r-sfdy/WebsiteMocker`
Dashboard: `https://pbau3r-sfdy.github.io/WebsiteMocker/`

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
| 5 | Prod Ready | All checks pass, domain set |
| 6 | Live | Deployed to custom domain, robots.txt = Allow |

## Commands
```bash
npm run dev             # Dashboard dev server → localhost:4321
npm run build           # Build all sites → dist/
node _scripts/build-all.js sfdy    # Build one site + dashboard
cd sites/sfdy && npm run dev       # SFDY dev server → localhost:4409
cd sites/orbint && npm run dev     # Orbint dev server
```

## Adding a site
```bash
bash _scripts/new-site.sh <slug> "<Site Name>" "<#accent>" "<email>"
npm install   # picks up new workspace
```

## Sites

| Slug | Stage | Domain | Notes |
|---|---|---|---|
| `sfdy` | 2 — Content Ready | starflight-dynamics.com | **Canonical working copy** — see `sites/sfdy/CLAUDE.md` |
| `orbint` | 2 — Content Ready | orbint.de | |

> ⚠️ The standalone `pbau3r-sfdy/sfdy-website` repo is **archived**. All SFDY work lives here in `sites/sfdy/`.

## Repository layout
```
WebsiteMocker/
├── _captures/           ← design DNA library (capture.json + screenshots + assets)
├── _core/               ← base template (all sites inherit)
├── _scripts/
│   ├── build-all.js     ← builds dashboard + all sites
│   └── capture-site.mjs ← Playwright capture (Wix/SPA-safe)
├── sites/
│   ├── sfdy/            ← Starflight Dynamics (stage 2, canonical copy)
│   └── orbint/          ← Orbint (stage 2)
├── .claude/skills/      ← framework-level skills
├── .github/workflows/   ← GitHub Pages deploy
├── src/pages/index.astro   ← dashboard
└── public/robots.txt    ← Disallow: / (sandbox)
```

## Key files per site
- `wiring.json` — service connections + maturity stage (read by dashboard)
- `keywords.json` — brand keyword dictionary (used by content skills)
- `astro.config.mjs` — must have `base: '/WebsiteMocker/<slug>'`

## GitHub
- Repo: `https://github.com/pbau3r-sfdy/WebsiteMocker`
- Pages source: GitHub Actions
- Every push to `main` triggers a full rebuild and deploy
- Check deploy status: `gh run list --limit 5`

# CLAUDE.md — Starflight Dynamics site

This file provides guidance to Claude Code when working on the SFDY site inside the
WebsiteMocker monorepo. **This is the canonical working copy.** The standalone
`pbau3r-sfdy/sfdy-website` repo is archived and should not be used.

---

## Working directory

This site lives at `WebsiteMocker/sites/sfdy/`.
Always open Claude Code from the **WebsiteMocker root** (`~/DevWorks/Websites/WebsiteMocker`)
or this directory. Never use the archived `~/DevWorks/Websites/SFDY` directory.

---

## Commands

```bash
# From WebsiteMocker root:
cd sites/sfdy && npm run dev      # dev server → localhost:4409
cd sites/sfdy && npm run build    # production build → sites/sfdy/dist/
cd sites/sfdy && npm run preview  # preview the built output

# Or from this directory directly:
npm run dev
npm run build
```

`astro build` is the type-check step — it validates content collection frontmatter
against the Zod schema in `src/content/config.ts` and will error on malformed posts.

---

## Architecture

**Base path:** `/WebsiteMocker/sfdy` (set in `astro.config.mjs`). All internal links and
asset paths must use `import.meta.env.BASE_URL` — the shorthand `const b = import.meta.env.BASE_URL.replace(/\/$/, '')` is used throughout.

**Routing** is file-based under `src/pages/`. All pages are static (`output: 'static'`).

**Content collections** power the news section. Schema is in `src/content/config.ts`.
Each post is a Markdown file in `src/content/news/YYYY-MM-DD-slug.md`.

**Layout shell** (`src/layouts/Layout.astro`) loads self-hosted Avenir LT fonts, defines
all CSS custom properties on `:root`, and sets the favicon.

**Components:** `Nav.astro`, `Footer.astro`, `NewsCard.astro`.

---

## Pages

| Route | File | Notes |
|---|---|---|
| `/` | `index.astro` | Hero video, latest news strip, newsletter, partners, earth |
| `/news` | `news/index.astro` | 3-col card grid, newest-first |
| `/news/[slug]` | `news/[slug].astro` | Individual article |
| `/investors` | `investors.astro` | Contact, newsletter, earth section |
| `/careers` | `careers.astro` | Space corridor hero, team, open roles |
| `/imprint` | `imprint.astro` | German Impressum (§ 5 TMG) |
| `/privacy-policy` | `privacy-policy.astro` | GDPR privacy policy |
| `/terms-conditions` | `terms-conditions.astro` | Terms of service |

---

## Design tokens (in `Layout.astro :root`)

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#07080f` | page background |
| `--bg-card` | `#0d0f1c` | card / section background |
| `--bg-nav` | `rgba(7,8,15,0.85)` | frosted-glass nav |
| `--accent` | `#3dffa0` | green CTA / highlights |
| `--accent-dim` | `rgba(61,255,160,0.12)` | hover fills |
| `--border` | `#1a1f35` | subtle borders |
| `--text` | `#e8ecff` | primary text |
| `--text-muted` | `#6b7496` | secondary text |
| `--radius` | `8px` | card border-radius |
| `--font-head` | Avenir LT (self-hosted) | headings + labels |
| `--font-body` | Avenir LT (self-hosted) | body copy |

**Newsletter sections** deliberately break the dark theme: white `#ffffff` background,
black text, blue SIGN UP button `#384AD3`.

**Partner logos** in `public/images/partners/` use `filter: brightness(0) invert(1)` —
they are stored as natural-color PNGs but rendered white on the dark background.

---

## Adding a news post

```markdown
<!-- src/content/news/YYYY-MM-DD-slug.md -->
---
title: "Your Post Title"
date: YYYY-MM-DD
summary: "One sentence shown on the news grid card."
image: "/images/news/your-image.jpg"   # optional
---

Full article content in Markdown here.
```

Place images in `public/images/news/`. Run `npm run build` to catch schema errors.

---

## Assets

| Path | Contents |
|---|---|
| `public/fonts/` | `avenir-lt-light.woff2`, `avenir-lt-heavy.woff2` (self-hosted) |
| `public/images/` | Hero, earth, investors, careers, astronaut SVG, logo |
| `public/images/partners/` | bavAIRia, BDLI, NewSpace logos |
| `public/images/news/` | Article images (one per post) |
| `public/videos/` | `hero-video.mp4` — homepage hero background |

---

## Deployment

Deployed via the WebsiteMocker GitHub Actions workflow (`../../.github/workflows/deploy.yml`).
Every push to `main` triggers a full monorepo build; the SFDY output lands at:
`https://pbau3r-sfdy.github.io/WebsiteMocker/sfdy/`

For production (custom domain `www.starflight-dynamics.com`), a separate deploy workflow
targeting the production domain is needed — not yet created.

---

## Newsletter form

The `action` URL in `index.astro` and `investors.astro` is `https://formspree.io/f/placeholder`.
Replace with a real Formspree endpoint before going live.

---

## Contact addresses

- General: mission-control@starflight-dynamics.com
- Investors: invest.in@starflight-dynamics.com
- Press: press@starflight-dynamics.com

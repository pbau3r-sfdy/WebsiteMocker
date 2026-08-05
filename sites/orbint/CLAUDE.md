# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

# Orbint — Astro Site (PoC)

Proof-of-concept Astro v5 site reproducing the layout of orbint.de, deployed to GitHub Pages.
Demonstrates a content-separated framework: Markdown files drive all news content;
the Astro shell (layout, components, pages) is updated independently.

## Commands

```bash
npm run dev      # local dev server → localhost:4321
npm run build    # production build → dist/  (also type-checks content collections)
npm run preview  # serve the built dist/ output
```

## Architecture

Same pattern as the SFDY site — see that project's CLAUDE.md for full details.

**Content collections** power the news section. Each post is a Markdown file in
`src/content/news/YYYY-MM-DD-slug.md`. The news grid queries all entries and sorts
newest-first; `pages/news/[slug].astro` renders individual articles.

## Adding a news post

Create `src/content/news/YYYY-MM-DD-slug.md`:

```markdown
---
title: "Your Post Title"
date: YYYY-MM-DD
summary: "One-sentence teaser shown on the news grid card."
image: "/images/news/your-image.jpg"   # optional
imageCredit: "Photo credit text"        # optional
---

Full article content in Markdown here.
```

Place images in `public/images/news/`. Run `npm run build` to catch frontmatter errors.

## Design tokens (Layout.astro :root)

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#121110` | page background |
| `--bg-card` | `#1c1a18` | card / nav background |
| `--bg-nav` | `rgba(18,17,16,0.98)` | frosted-glass nav |
| `--accent` | `#f2641c` | orange CTA / highlights |
| `--accent-dark` | `#c94e0e` | hover state |
| `--border` | `#302c28` | subtle borders |
| `--text` | `#e6e4e2` | primary text |
| `--text-muted` | `#9e9690` | secondary text |

## Deployment

GitHub Pages via GitHub Actions. Workflow: `.github/workflows/deploy.yml`.

**One-time setup on GitHub:**
1. Create a new repository (e.g. `orbint-poc`)
2. Push this code (see commands below)
3. In repo **Settings → Pages → Source** → select **"GitHub Actions"**

The workflow triggers on every push to `main` and deploys `dist/` automatically.

**If deploying to `username.github.io/repo-name`** (not a custom domain), add a `base`
to `astro.config.mjs` so asset paths resolve correctly:

```js
export default defineConfig({
  site: 'https://username.github.io',
  base: '/repo-name',
  output: 'static',
});
```

**If using a custom domain**, keep `site` as the domain URL and omit `base`.
Add a `CNAME` file to `public/` containing just the domain, e.g. `poc.orbint.de`.

# levion-clean

Rebuild of `sites/levion` on the **Levion Materials design system** — Avenir Next,
Levion blue `#055F84` / orange `#D96502`, flat cards, 3px top accents, near-square
corners. Template site: design reference only, no production destination.

```bash
cd sites/levion-clean
npm run dev      # → localhost:4360
npm run build
```

## Pages
| Route | File |
| --- | --- |
| `/` | `src/pages/index.astro` |
| `/technology` | `src/pages/technology.astro` |
| `/team` | `src/pages/team.astro` |
| `/news` | `src/pages/news/index.astro` |
| `/news/<slug>` | `src/pages/news/[slug].astro` |
| `/careers` | `src/pages/careers/index.astro` |
| `/careers/crystal-growth-process-engineer` | `src/pages/careers/crystal-growth-process-engineer.astro` |
| `/contact` | `src/pages/contact.astro` |
| `/imprint`, `/privacy` | `src/pages/imprint.astro`, `privacy.astro` |

## Structure
- `src/styles/tokens.css` — the whole design system as custom properties, plus @font-face
  and the page reset. Every component styles against `var(--*)`; no values are hard-coded.
- `src/components/` — Nav, Footer, Button, Card, FeatureCard, SectionHeading, StatFigure,
  Callout, TeamCard, PostCard, PartnerStrip, MilestoneRail. All Astro, scoped `<style>`,
  zero client-side JS.
- `src/lib/nav.ts` — nav items, footer links, partner logos in one place.
- `src/content/news/` — the news collection, schema unchanged from `sites/levion`, so
  `/wm-add-news` and `/wm-edit-news` work here.

## Before this goes anywhere real
- **Fonts.** `public/fonts/` holds nine Avenir Next OTFs. Avenir Next is licensed from
  Linotype — confirm the web licence before deploying, or swap the stack in `tokens.css`.
- **Team.** Two of three cards are `Name to confirm` placeholders.
- **Careers.** The second listing row is a placeholder; the role description is drafted
  from brand material and needs review (years of experience, equity line).
- **Legal.** Imprint registration details and the privacy hosting section are marked
  `.placeholder` and are incomplete.
- **Forms.** Contact and newsletter forms carry `data-netlify` and post nowhere. Wire a
  real endpoint in `wiring.json` and on the two `<form>` tags.
- **Icons.** The five application icons are Lucide, fetched from unpkg at render as CSS
  masks — a substitution, not a Levion decision. Self-host them before going live.

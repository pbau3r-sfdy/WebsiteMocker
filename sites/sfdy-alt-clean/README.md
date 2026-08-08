# sfdy-alt-clean — Starflight Dynamics (alternate, clean)

Under-construction site for www.starflight-dynamics.com, rebuilt on the SFDY brand
design system: black canvas, white Avenir Next capitals, the blue→cyan→green Beam,
green (#00FB92) as the single working accent, IBM Plex Mono for figures and labels.

## One rename on arrival

`src/pages/news/-slug-.astro` must be renamed to `src/pages/news/[slug].astro` — square
brackets do not survive the export. Nothing else changes.

## Drop-in

Copy this folder to `WebsiteMocker/sites/sfdy-alt-clean/`, then from the repo root:

```bash
npm install                 # picks up the new workspace
cd sites/sfdy-alt-clean && npm run dev    # → localhost:4410
```

## What still needs copying from sites/sfdy

This scaffold carries source only. Bring these across as-is:

```
sites/sfdy/public/favicon.png            → public/favicon.png
sites/sfdy/public/fonts/*.woff2          → public/fonts/
sites/sfdy/public/images/logo.png        → public/images/logo.png
sites/sfdy/public/images/partners/*.png  → public/images/partners/
sites/sfdy/public/images/news/*          → public/images/news/
sites/sfdy/src/content/news/*.md         → src/content/news/
```

Two extra assets ship in `public/` here:

- `public/images/hero-earth-night.jpg` — hero backdrop (SFDY design-system imagery).
- `public/images/partners/bdli-trim.png` — the BDLI logo cropped to its artwork, so it
  reads at the same optical size as bavAIRia and NewSpace.

## Content notes

- The news schema gains an optional `short:` field. The home grid uses it; the news index
  and the article page keep the full `title`. Long "COMPANY ANNOUNCEMENT: …" headlines
  should carry a `short`.
- The following posts were pruned from this cut: Peppa Pig CSO, Levion Materials, Creative
  Destruction Lab, Tina Sorgenfrei, Carolina Rocha, year-end 2023, GATE Space, hello-there,
  Matthias Spott. Six posts remain.
- `public/images/news/baainbw.png` in the current repo is actually the Creative Destruction
  Lab graphic. The BAAINBw post should point at `baainbw.jpg`; the frontmatter upstream is
  wrong and should be corrected.

## Before go-live

- Newsletter: replace `u=REPLACE&id=REPLACE` in `src/components/Newsletter.astro` with the
  real Mailchimp audience values.
- Contact form: replace the Formspree placeholder endpoint in `src/pages/contact.astro`.
- Imprint: managing director(s) and VAT ID are marked TO BE SUPPLIED.
- Privacy policy and terms: placeholder pages awaiting final wording.

## Newsletter band variants

`<Newsletter variant="white" />` (current) or `variant="dark"`. The white band is the
deliberate break from the dark theme carried over from the current site; the dark band keeps
the page monotone. Swap the prop in `src/pages/index.astro`.

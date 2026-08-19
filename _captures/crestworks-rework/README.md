# Crestworks landing page — static build

Deployable exactly like the Mogwai Systems site: static files, no build step, no runtime.

## Contents

    index.html                  the landing page (inline CSS, no JS)
    imprint/index.html          imprint / legal notice — TEMPLATE, bracketed items to fill
    privacy-policy/index.html   privacy policy — TEMPLATE, pending legal review
    404.html                    not-found page (GitHub Pages serves this automatically)
    favicon.ico                 16 + 32 px, for legacy browsers
    assets/favicon/             favicon-16/32/180/512 PNG (Bildmarke on white)
    assets/fonts/               Avenir Next UltraLight / Regular / Bold (OTF)
    assets/logo/                horizontal lockup + Bildmarke (SVG)
    assets/brand/               Crestworks Edge strip (torn edge above the footer)
    assets/loops-lines/         Line 17 — magenta (in use) and yellow (alternative)

## Deploy

Copy the contents of this folder to the root of the publishing branch (`gh-pages`),
same as `pbau3r-sfdy/mogwai-systems`. Paths inside `index.html` are relative, so it
also works from a subdirectory or opened straight from disk.

## Notes

- `404.html` uses root-absolute paths on purpose: GitHub Pages serves it for unknown deep
  paths without changing the URL, so relative asset paths would break. It only renders
  correctly when the folder is deployed at the domain root.

- The two legal pages are templates: every `[bracketed]` item (managing director, HRB and VAT
  numbers, hosting provider, retention periods, date) must be filled in and the privacy text
  reviewed by counsel before going live.
- To switch the annotation colour, point the `.claim` image at
  `assets/loops-lines/line-yellow-17-thick-underline.png`. One colour per page — never two.
- Fonts are OTF (~120 KB each). If load weight matters, subset them to WOFF2 as the
  Mogwai site does.

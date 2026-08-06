# /wm-capture

Capture a live website's design DNA, assets, and content using a full Playwright browser.
Works for any site — Wix, React, Vue, plain HTML, everything. Outputs screenshots, all
downloaded assets, design tokens, and structured page content ready for `/wm-instantiate`.

---

## Steps

### 1. Collect inputs

Ask for:
- **Source URL** — the live site to capture (e.g. `https://www.starflight-dynamics.com`)
- **Capture slug** — short identifier used as the output directory (e.g. `sfdy`)
- **Pages to crawl** _(optional)_ — comma-separated paths; defaults to `/, /investors, /careers, /news, /imprint, /privacy-policy`

### 2. Run the capture script

```bash
cd ~/DevWorks/Websites/WebsiteMocker
node _scripts/capture-site.mjs <URL> <slug> [/path1,/path2,...]
```

This launches a real Chromium browser. It:
- Renders every page with full JavaScript execution (handles Wix, React, Vue, etc.)
- Automatically dismisses cookie/GDPR consent overlays
- Scrolls each page to trigger lazy-loaded images and videos
- Downloads all images, videos, and fonts to `_captures/<slug>/assets/`
- Takes full-page screenshots at 1440px (desktop) and 390px (mobile)
- Extracts rendered text content per section
- Samples computed CSS for design tokens
- Writes `_captures/<slug>/capture.json` — machine-readable structured output
- Writes `_captures/<slug>/CAPTURE.md` — human-readable summary
- Writes `_captures/<slug>/tokens.json` — design tokens only

**Expected time:** 1–3 minutes depending on number of pages and site weight.

### 3. Review the output

Read `_captures/<slug>/CAPTURE.md` and report:

1. **Pages captured** — which succeeded, which showed placeholder/error warnings
2. **Assets** — image, video, font counts
3. **Design tokens** — bg colour, accent, fonts, radius
4. **Nav structure** — extracted links
5. **Any gaps** — placeholder pages, missing content, failed pages

If any page shows ⚠️ placeholder: check the corresponding screenshot in
`_captures/<slug>/screenshots/` — this is the visual reference even when text extraction fails.

### 4. Handle "can't access" situations

For **sites you don't own** (remixes, competitor references):
- The script still runs — it captures screenshots and whatever text it can reach
- Assets blocked by auth or paywalls will 404 silently (expected)
- Screenshots + extracted text are always sufficient to reconstruct the layout
- Missing assets get placeholder flags in `capture.json` → `/wm-instantiate` handles them

For **Wix sites under construction** (maintenance page redirect):
- Capture whatever is accessible
- Note the construction pages explicitly in the report
- Manual content can be added later via `/wm-add-news`, `wiring.json` fields, etc.

### 5. Report and suggest next step

Summarise what was captured. Suggest:
`/wm-instantiate <slug> <new-site-slug>` to create a new branded site from this capture.

---

## Important rules

- **Never use WebFetch to capture Wix or JS-rendered sites** — WebFetch cannot execute
  JavaScript and returns empty or broken HTML for dynamic sites. Always use the Playwright script.
- **WebFetch is only acceptable** for plain static HTML sites where `<meta name="generator">`
  or the page source confirms it. Even then, prefer the script.
- **Always run the script first** — don't try to reconstruct a site from guesswork.
  The capture is the source of truth.
- The `capture.json` format is the contract between `/wm-capture` and `/wm-instantiate`.
  Don't modify it manually.

# Stack Research — v1.2 (Claude Design Sync, Analytics, Open Drops)

**Domain:** Additions to an existing Astro 5 static monorepo (GitHub Pages, Node scripts, GitHub Actions)
**Researched:** 2026-10-14
**Confidence:** MEDIUM-HIGH (npm versions verified live; Plausible docs partly fetched, some pages 404/thin; DesignSync facts come from the milestone brief, not re-verified)

## Headline

v1.2 needs almost no new dependencies. Everything is Node built-ins (`node:crypto`, `fetch`, `fs`), Astro 5 APIs already in the repo, and Playwright (already a devDependency). The only candidate additions are `@astrojs/sitemap` (only if a sitemap is wanted) and, for the JSX render step, `react` + `react-dom` as devDependencies.

**Version reality check (verified via `npm view`, 2026-10-14):** `astro` latest is **7.3.8**; the repo has **5.18.2** installed (`^5.0.0`). Do NOT bump Astro in this milestone. Stay on 5.x. Node is 26.11.1 locally, `engines >=20` — keep all new scripts Node-20 compatible (global `fetch`, `crypto.webcrypto`).

## Recommended Stack

### Core (existing, reused — no change)

| Technology | Version | Purpose in v1.2 | Why |
|---|---|---|---|
| Astro | ^5.18 (installed 5.18.2) | Drops pages, integrations | Content Layer `glob` loader + `getStaticPaths` + integration hooks cover all of Phase 11. Astro 7 exists but migration is out of scope. |
| Playwright | ^1.62.1 (latest 1.64.0) | Render JSX design components to static HTML | Already installed; browsers already cached locally (`chromium` 1208–1248). Pull is an operator-local step, never CI, so no browser install in Actions. |
| Node built-ins | Node >=20 | `crypto.randomBytes`, `fetch`, `fs`, `webcrypto` | IDs, Stats API calls, AES-GCM (Phase 12 CLI side) with zero deps. |

### New dependencies (minimal)

| Library | Version | Purpose | When to Use |
|---|---|---|---|
| `react`, `react-dom` | ^19.3.0 (latest 19.3.0) — **devDependencies, root** | `react-dom/server` `renderToStaticMarkup` for Claude Design `.jsx` components | Phase 9, only if the esbuild-SSR path is used (see pattern below). Skip if Playwright renders everything. |
| `esbuild` | already transitive via Astro (0.25/0.27 allowed in `allowScripts`; latest 0.28.2) | Bundle `components/*.jsx` for Node/browser | Phase 9. Prefer using the copy Astro/Vite already installs; add as explicit devDependency `^0.27` only if import resolution is flaky. |
| `@astrojs/sitemap` | **3.7.4** latest (depends on `sitemap ^9`, `zod ^4`); 3.6.x is the zod-3 / Astro-5-era line | Sitemap with `filter` to exclude `/d/` | Phase 11 ONLY if a site wants a sitemap. **No site currently uses it** (grep: none; `npm ls` empty). Astro-5 compatibility of 3.7.4 is not confirmed (its dev dep is astro 7.2.10; peerDependencies empty). Install, run a build, and if it errors pin `@astrojs/sitemap@~3.6`. Check with `npx astro add sitemap`-style install in one site first. |
| `@plausible-analytics/tracker` | 0.4.6 (published 2026-08-10) | npm-module tracker (`init`, `track`) | **Not recommended** here (see Analytics). Listed so it is a conscious "no". |

### Supporting: no library needed

| Need | Use | Notes |
|---|---|---|
| 128-bit drop ID | `crypto.randomBytes(16).toString('hex')` → 32 lowercase hex chars | Hex, not base64url: Astro 5 `glob` loader slugifies entry ids (lower-cases), so mixed-case base64url IDs would be corrupted/collide. Alternatively set a custom `generateId`, but hex is simpler. |
| Stats API calls | global `fetch` | No SDK exists/needed. |
| Phase 12 AES-GCM | Browser `crypto.subtle` (WebCrypto) + Node `globalThis.crypto.subtle` in CLI | Same API both sides, same-origin/HTTPS only (GitHub Pages is HTTPS). Key in URL `#fragment` (never sent to server/Plausible). No library (no crypto-js, no libsodium) — adds supply-chain surface for no benefit. PBKDF2 or random 256-bit key + 12-byte IV per message. |
| Markdown → HTML for drops | Astro's built-in `render(entry)` | Already used for news/jobs. |
| PDF handling | copy bytes | Do not parse/generate PDFs; no pdf-lib/puppeteer-pdf. |

## Astro 5 APIs to use (verified against docs.astro.build integrations reference)

- **Content collection:** `defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/drops' }), schema })` in `src/content.config.ts` (existing Content Layer pattern). Schema fields: `title`, `created`, `expires?`, `withdrawn?`, `attachments?: string[]`. Filter expired/withdrawn in `getStaticPaths` (static site = "expiry" is only evaluated at build; soft expiry needs a scheduled rebuild or a client-side check — flag for Phase 11/12).
- **Route:** `src/pages/d/[id].astro` with `getStaticPaths()` returning `{ params: { id: entry.id }, props: { entry } }`. Do NOT create `src/pages/d/index.astro` (no listing) and make sure `/d/` yields 404.
- **Integration `_scripts/drops.mjs`:** mirror `plausible.mjs` structure (default export returning `{ name, hooks }`).
  - `astro:config:setup({ config, command, injectRoute, logger, updateConfig })` — `injectRoute({ pattern: '/d/[id]', entrypoint: new URL(...) , prerender: true })` (entrypoint as URL supported since 5.0.0) lets the integration own the route so sites need no page file.
  - `astro:build:done({ dir, pages, logger })` — `dir` is a **URL** (use `fileURLToPath(dir)`). Use it to (a) copy attachments into `dist/d/<id>/`, (b) verify every `/d/*/index.html` contains `<meta name="robots" content="noindex…">` and `<meta name="referrer" content="no-referrer">`, (c) assert no `sitemap*.xml`/`robots.txt` contains `/d/` or an ID, (d) fail the build via `throw`. `pages` is `{pathname}[]`. Prefer also shipping a standalone `drop-verify` check run post-build.
  - Optional: `astro:build:generated` for pre-cleanup access (not needed).
- **No-index/no-referrer:** in-page `<meta name="robots" content="noindex, nofollow, noarchive">` and `<meta name="referrer" content="no-referrer">` (GitHub Pages cannot set `X-Robots-Tag` / `Referrer-Policy` headers; meta is the only route). Outbound links `rel="noreferrer noopener"`.
- **Sitemap:** `sitemap({ filter: (page) => !page.includes('/d/') })`. Note: also `customPages` unaffected. Do not add drops to `public/robots.txt` — a `Disallow: /d/<id>/` line publishes the ID. A blanket `Disallow: /d/` is safe (no ID) but only a hint; the meta tag is the real control.
- **Plausible integration (existing):** `injectScript('head-inline', …)` stays; extend, don't replace.

## Phase 9 — Claude Design Sync (stack notes)

- **DesignSync is model-side only** (per brief: list_projects/list_files/get_file ≤256 KiB/finalize_plan/write_files). There is no Node SDK, REST API or CI path to add. The "tool" is therefore a Claude Code skill (`/wm-design-pull`) that calls DesignSync, stages files under a temp dir (e.g. `_captures/<slug>-design/`), then Node scripts take over. Do **not** attempt to reverse-engineer a Claude Design HTTP API or add a scraper/cookie-auth flow (fragile, ToS risk).
- **JSX → static HTML — recommended order:**
  1. **esbuild + `react-dom/server`** (no browser): `esbuild.build({ bundle, format:'esm', platform:'node', jsx:'automatic', loader:{'.jsx':'jsx'} })`, `import()` the bundle, `renderToStaticMarkup`. Fast, deterministic, works headless. Fails if components touch `window`/`document` at import time or rely on Babel-standalone/UMD globals.
  2. **Playwright fallback** (works for UMD/Babel-standalone `index.html` pages and `*.dc.html`): `chromium.launch({ channel: 'chrome' })` locally (confirmed working), else bundled chromium; `page.goto(file://…)`, wait for network idle, `page.content()` / `locator.innerHTML()`. Strip `<script>` tags and React root markers after serialization.
  3. Output feeds the existing `ingest-artifact.mjs --mode section` (hast-util-from-html / to-html already installed) — no new HTML parser.
- **Tokens:** `tokens/*.css` → parse `:root { --x: … }` with a ~30-line regex/`postcss`-free parser into `brand.doc_tokens`. Do not add postcss/css-tree for this.
- **Playwright browsers:** `npx playwright install chromium` only on a fresh machine; keep it out of GitHub Actions (pull is local). Local cache already has chromium builds 1208–1248; a Playwright 1.64 upgrade may want a newer build — pin `^1.62.1` and use `channel: 'chrome'`.

## Phase 10 — Analytics (Plausible)

**Plan requirement (important):** custom properties and the Stats API require Plausible's **Business** plan (≈$19/mo at 10k pageviews, up to 10 sites, 600 API req/h; Growth ≈$14 has neither). Source is third-party pricing aggregators (LOW-MEDIUM; plausible.io/pricing was not fetchable) — confirm on plausible.io before purchase. Site count: 1 sandbox + 4 prod sites = 5, within 10. Custom events/goals work on cheaper plans; props/Stats API do not. "One subscription" = Business.

**Script variants (current as of Oct 2026):**
- Since **Oct 2025** Plausible's recommended snippet is a **per-site script**: `<script async src="https://plausible.io/js/pa-<SCRIPT_ID>.js"></script>` followed by `window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()`. Options go in `plausible.init({...})`: `outboundLinks`, `fileDownloads` (bool or extension list), `formSubmissions`, `hashBasedRouting`, `customProperties` (object or fn), `autoCapturePageviews`, `captureOnLocalhost`, `endpoint` (replaces `data-api`), `transformRequest`. Several of these (outbound links, file downloads, forms) are toggled in site Settings → Tracking without changing the snippet.
- The legacy `https://plausible.io/js/script.js` + `data-domain` (and composed variants like `script.outbound-links.file-downloads.js`) is **still supported** but no longer the recommended path.
- **Recommendation:** extend `_scripts/plausible.mjs` to prefer `analytics.scriptId` (from Plausible Settings → Tracking, per site) and emit the new snippet with `plausible.init({ outboundLinks:true, fileDownloads:true, formSubmissions:true, customProperties:{…} })`; fall back to the current `data-domain` + `script.js` path when `scriptId` is absent (keeps the existing shared sandbox site working without change). Keep the existing queue stub (`window.plausible.q`) — it is the same mechanism as the official snippet. Keep `host` (self-hosted parked) — for self-hosted, the script URL is `<host>/js/pa-<id>.js` too; verify when/if self-hosting.
- Because the script ID cannot be derived from the domain, **the sandbox shared site needs its own scriptId in config** (constant next to `SANDBOX_DOMAIN`) or stays on legacy.
- **Do not use** `@plausible-analytics/tracker` (0.4.6): the site is static HTML and the injected snippet does the same job with no bundling; the npm module also gives up the Settings-side toggles. (Archived `plausible-tracker` is dead — never use.)
- **Events:** file downloads/outbound/forms via init options (automatic). **404:** custom goal `404` — in `404.astro` add `plausible('404',{props:{path:document.location.pathname}})` (queue stub makes ordering safe). I could not fetch the 404 doc page (404'd); the pattern is the long-standing documented one — MEDIUM. **Goals must be created in Plausible with exact names** and **props registered** (Settings → Custom properties) before they show in reports.
- **Stats API: v2** — `POST https://plausible.io/api/v2/query`, `Authorization: Bearer <key>`, JSON body `{ site_id, metrics:["visitors","pageviews"], date_range:"30d", dimensions?, filters?, order_by?, include? }`; custom property dimension `event:props:<name>`; 600 req/h; keys are team-scoped, created by Owner/Admin/Editor/Billing; v1 is legacy. HIGH (official docs, fetched). Use `fetch` only.
- **Key handling:** store in MarketingBridge vault; the static dashboard tile must be produced at build time (`fetch-perf-data.mjs`-style script, e.g. `_scripts/fetch-analytics.mjs`) and the key injected into the Actions build as a GitHub secret (vault is not reachable from CI). Never ship the key to client JS; write only aggregates into a JSON consumed by `src/pages/index.astro`. Dashboard is public — only publish numbers you are happy to publish (or exclude the tile from the sandbox deploy).
- **Privacy snippet:** Plausible Cloud is EU-operated/EU-hosted, cookieless, no personal data stored; generally treated as no-consent-needed under GDPR/TDDDG §25 when nothing is stored on/read from the device. Still: sign Plausible's DPA, add the privacy-policy paragraph (provider, purpose = reach measurement, legal basis Art. 6(1)(f) GDPR, no cookies, no cross-site tracking, data in EU). LOW-MEDIUM — have the GmbH's counsel/DPO confirm wording; do not present as legal advice.

## Phase 11/12 — Open/Locked Drops (stack notes)

- **Repo visibility is the critical issue:** `pbau3r-sfdy/WebsiteMocker` and the production repos' `gh-pages` are **public** (free GitHub Pages). Drop Markdown sitting in `src/content/drops/` committed to a public repo is readable by anyone browsing the repo, defeating "unguessable URL". Either gitignore drop sources and build/publish from local only, or accept "confidential, not secret" explicitly and keep only non-sensitive text. Also the sandbox `deploy.yml` builds on every push — drops would publish to sandbox as well. This is a stack/hosting decision to settle before building the collection.
- No-referrer, noindex via `<meta>` only; Plausible `customProperties` can tag drop pageviews (`{ drop: 'id-prefix' }`), but the full path already contains the ID in Plausible — keep Plausible access restricted; avoid sending the full ID as a prop.
- Withdrawal = remove file + republish; GitHub Pages/CDN caching and Wayback/search caches mean "withdrawn" is best-effort. Overwritten gh-pages force-push removes it from the origin only.
- Locked Drops (Phase 12): WebCrypto AES-GCM-256 in browser, encrypt in the CLI via `node:crypto` webcrypto; ciphertext + IV + salt as base64 inline in the page; key in `#fragment`. A Pages site can't enforce expiry — "soft expiry" = client-side timestamp check + rebuild removal. No libraries.

## Installation

```bash
# Phase 9 (only if esbuild+SSR render path is used)
npm install -D react@^19 react-dom@^19

# Phase 11 (only if a site needs a sitemap; verify Astro 5 compat, else @astrojs/sitemap@~3.6)
npm install @astrojs/sitemap@3.7.4 -w sites/<slug>

# Phase 10, 11, 12: nothing to install
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|---|---|---|
| Plausible Cloud Business | Self-hosted Plausible CE | Parked by decision; also removes the Business-plan requirement for API/props but adds a server. |
| esbuild + react-dom/server first, Playwright fallback | Playwright-only render | If Claude Design components rely on browser globals / Babel-standalone — then Playwright is the primary. |
| Legacy-compatible integration + new `pa-<id>` script | Only the legacy `script.js` | Fine short term; but Oct 2025 guidance moves to per-site scripts. |
| Hex IDs via `crypto.randomBytes` | `nanoid`, `uuid` v4 | UUIDv4 has only 122 random bits and contains fixed chars; nanoid is an extra dep. Hex-16 is exactly 128 bits. |
| In-page meta robots/referrer | `X-Robots-Tag`, `Referrer-Policy` headers | Impossible on GitHub Pages. Needs Cloudflare/Netlify — rejected by constraints. |

## What NOT to Add

| Avoid | Why | Use Instead |
|---|---|---|
| `@plausible-analytics/tracker`, `plausible-tracker` (archived), `next-plausible`, Partytown, GTM | Extra bundling/dependency for a static snippet; archived package unmaintained | Injected official snippet via existing integration |
| Any second analytics/SaaS (GA, Fathom, Umami Cloud, Cloudflare Web Analytics) | Violates "one subscription" | Plausible only |
| A server/Worker/Function for drops or API proxying | No server allowed; rejected in PROJECT.md | Build-time script with secret in CI |
| `crypto-js`, `libsodium`, `tweetnacl`, `nanoid`, `uuid` | WebCrypto/`node:crypto` cover it | Built-ins |
| Puppeteer, jsdom/happy-dom, Babel, webpack/Vite plugins for JSX | Playwright/esbuild already present | Playwright + esbuild |
| Reverse-engineered Claude Design HTTP client / headless login | Brittle, unauthorised access path | DesignSync via the model-side skill only |
| Astro upgrade to 6/7 in this milestone | 7.3.8 is current but unrelated risk to 4 live sites | Stay ^5.18; separate milestone |
| `robots.txt` entries listing drop IDs; drop listing/index pages; RSS/search indexing of drops | Leaks IDs | Meta noindex + exclusion from sitemap/RSS/search index/dashboard |
| Docs/Tailwind/UI frameworks for the drop page | Weight, irrelevant | Plain Astro layout |

## Version Compatibility

| Package | Compatible with | Notes |
|---|---|---|
| astro 5.18.2 | `injectRoute` with URL entrypoint (5.0+), glob loader | Verified in docs |
| @astrojs/sitemap 3.7.4 | astro 5? unverified | Built/tested against astro 7.2.10; fall back to ~3.6 (zod 3 line) |
| playwright 1.62.1→1.64.0 | cached chromium builds up to 1248 | New minor may need `npx playwright install chromium`; `channel:'chrome'` avoids it |
| react 19.3 / react-dom 19.3 | Claude Design JSX | Check which React version the design system assumes (UMD React 18 in some exports) |
| Node >=20 | `fetch`, `crypto.subtle` global | Local Node is 26; do not use Node-22+-only APIs |

## Sources

- npm registry via `npm view` (2026-10-14): astro 7.3.8 / installed 5.18.2, @astrojs/sitemap 3.7.4, playwright 1.64.0, react/react-dom 19.3.0, esbuild 0.28.2, @plausible-analytics/tracker 0.4.6 — HIGH
- https://docs.astro.build/en/reference/integrations-reference/ — build:done signature (`dir` is URL), injectScript stages, injectRoute URL entrypoints — HIGH
- https://plausible.io/docs/stats-api — v2 endpoint, bearer auth, 600 req/h, Business-plan key, `event:props:` — HIGH
- https://plausible.io/docs/script-extensions — init options, defaults, toggles — MEDIUM (summarised by fetch tool)
- https://plausible.io/docs/script-update-guide and search results (Oct 2025 per-site `pa-<id>.js` snippet, legacy `data-domain` still supported) — MEDIUM
- https://plausible.io/docs/custom-event-goals — `plausible(name,{props})`, goals must match exactly — MEDIUM
- Pricing (Business: custom props + Stats API; Growth: neither): aggregator sites (seline.com, comparedge.com, etc.), plausible.io/pricing not fetchable — LOW-MEDIUM
- https://github.com/plausible/plausible-tracker (archived, points to @plausible-analytics/tracker) — HIGH
- Context7 not consulted (WebFetch/npm used instead); 404 snippet and GDPR/TDDDG claims are not verified against official sources — LOW-MEDIUM

---
*Stack research for: WebsiteMocker v1.2*
*Researched: 2026-10-14*

# Phase 11: Open Drops - Research

**Researched:** 2026-10-14
**Domain:** Astro 5 static site, GitHub Actions private-repo fetch, PDF metadata stripping, Plausible sanitised tracking
**Confidence:** MEDIUM-HIGH (code paths, qpdf recipe and injectRoute approach were proven in scratch spikes; PAT permission behaviour and Plausible plan limits are partly ASSUMED)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Drop sources (Markdown body, metadata, PDFs) live in a **private GitHub repo `pbau3r-sfdy/drops`**, one folder per site slug (for example `sfdy/<id>/`). They are never committed to WebsiteMocker (public) or to the production repo's `main`. Claude creates the repo only with the operator's explicit approval.
- **D-02:** The publish workflow reads the private repo with the **existing `WM_PUBLISH_PAT`** (operator choice: no new secret). The plan must extend that token's repository access to `pbau3r-sfdy/drops` (operator action, read access) and must document that one token now writes the site and reads confidential drafts. No secret value is ever read or printed by Claude.
- **D-03:** The built drop (`dist/d/<id>/`) is published to the public production repo's `gh-pages` tree. **Accepted and documented**: the URL is unguessable (32-hex) but the folder is visible to anyone browsing the public gh-pages tree; withdrawal is unlisting only (git history, CDN, web archives may retain copies). Docs and `/wm-drop` state this plainly (DROP-08, DROP-10).
- **D-04:** Expiry stays enforced at build time (DROP-04). Expired drops are removed by a **manual sweep** (`node _scripts/drop.mjs expire`) plus a `/wm-publish`; a **scheduled check only warns** (notifies, never auto-publishes) when a drop has expired but is still live. `/wm-preflight` and `/wm-publish` warn about expired, soon-expiring and expiry-less drops (DROP-07). Maximum expiry horizon and default are Claude's discretion (suggest a horizon of 90 days; mandatory `expires`).
- **D-05:** After expiry or withdrawal a visitor sees the site's normal 404 page; the live URL is checked for 404 after the next publish (DROP-08, DROP-09 live mode).
- **D-06:** Because `WM_PUBLISH_PAT` now also guards confidential drafts and its lapse already broke the contributor sync once, add a **nightly scheduled token check workflow** that tests the token (including read access to the drops repo), fails loudly so GitHub's failure notification alerts the operator, and writes the token's expiry date into the docs with a renewal checklist. It must not print the token or call the vault.
- **D-07:** Phase 10 runs in sanitised mode with custom properties off (current Plausible plan). Drop views report as a **masked `/d/` pageview** (the id never appears in a path or property) and downloads fire a plain **`Drop Download`** goal without a per-drop label. Per-drop reporting by label (DROP-06's "grouped by label") is **deferred until a Business-plan decision**; the plan must make the label grouping conditional on custom properties being available. Extend the Phase 10 sanitiser vectors with `/d/<32-hex>/` and add a harness check that the id is absent from payloads.
- **D-08:** `/wm-drop` (and `node _scripts/drop.mjs new|list|withdraw|expire`) takes title, label, expiry, Markdown and optional PDFs, generates the 32-hex id from `crypto.randomBytes(16)`, writes into the private repo, and strips PDF metadata with a tool that must exist locally and in CI (build fails if missing, DROP-05). The researcher chooses the tool (for example exiftool or qpdf) and checks CI availability.
- **D-09:** Preview with **`DROPS_PREVIEW=1`** on a **local** sandbox build only. The public sandbox deploy (`deploy.yml`) never sets it and never has access to the drops repo, so drops are never published to the public sandbox. A harness check asserts the sandbox build has no `/d/` without the flag (DROP-04, DROP-09).

### Claude's Discretion
Collection schema details, `DropLayout` markup, id/label field names, expiry horizon number, notification mechanism for the expired-but-live warning, PDF tool choice, how the build fetches the private repo (checkout step with the PAT) and caches it.

### Deferred Ideas (OUT OF SCOPE)
- Per-drop analytics label (needs Plausible Business plan)
- Scheduled automatic republish to enforce expiry nightly
- Making the production repo private (removes gh-pages tree exposure)
- Locked Drops (encrypted, key in URL fragment): backlog 999.1
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DROP-01 | `drops` collection: 32-hex id, title, label, mandatory `expires` (ISO + offset, max horizon), PDFs, Markdown body | Section "Collection and source layout": custom loader over `DROPS_DIR/<slug>/<id>/drop.md`, shared pure lib `_scripts/lib/drops-core.mjs` |
| DROP-02 | `drop.mjs new|list|withdraw|expire` | Section "CLI design" (adds read-only `check` for preflight/publish) |
| DROP-03 | Shared `/d/<id>/` route and `DropLayout` in `_core`, opt-in via `wiring.json` `drops.enabled`, `sfdy` adopts | Spike-proven `injectRoute` with out-of-root entrypoint; three-line per-site adoption |
| DROP-04 | `_scripts/drops.mjs` filters, meta tags, exclusions, sandbox gating | Integration design + exclusion matrix |
| DROP-05 | PDFs emitted after filtering, metadata stripped, build fails without tool | qpdf recipe (spike-proven), `astro:build:done` copy |
| DROP-06 | Views/downloads tracked without the id | Sanitiser already masks `/d/<hex>/`; add drop-path whitelist rule and `Drop Download` custom event |
| DROP-07 | Preflight/publish warnings | `drop.mjs check`, skill edits |
| DROP-08 | Withdrawal removes from source, docs, live 404 | CLI + tombstones + `docs/drops.md` + harness live mode |
| DROP-09 | `verify-phase-11.sh` static + live | Section "Validation Architecture" |
| DROP-10 | `/wm-drop` skill + confidentiality wording | New skill `.claude/skills/wm-drop.md` |
</phase_requirements>

## Summary

Phase 11 needs no new npm dependency. Everything is reachable with the existing Astro 5 toolchain, Node built-ins, the `gh` CLI/Actions, and one system tool, **qpdf** (chosen for PDF metadata stripping). The shared pieces live where Phase 10/12 put theirs: Astro integrations in `_scripts/*.mjs` (like `plausible.mjs`, `internal-pages.mjs`), pure logic in `_scripts/lib/` (like `plausible-snippet.mjs`), and the shared route/layout in `_core/src/`. `_core` is a copy-template, not a runtime dependency; sites already import `../../_core/src/content.config.ts` by relative path, so a site "adopts" drops with three edits (integration in `astro.config.mjs`, one collection in `content.config.ts`, `drops.enabled` in `wiring.json`).

A scratch spike (outside the repo, in the scratchpad) confirmed: `injectRoute` with an entrypoint **outside the site root** (`../../core/drop.astro`), a **custom inline content loader** reading `process.env.DROPS_DIR`, and `getStaticPaths` over `getCollection('drops')` builds `/d/<id>/index.html`; with an empty or absent collection Astro only warns ("collection does not exist or is empty") and emits no `/d/`. A second spike showed `qpdf --empty --pages in -- out` drops the Info dict, the catalog XMP `/Metadata`, `/Names/EmbeddedFiles` and outlines, but **leaves page-level `/PieceInfo`**; a `qpdf --json=2` round trip that deletes `/PieceInfo` and `/Metadata` from every object, then `--update-from-json`, removes it. So the recipe is "rebuild with qpdf, scrub residual keys via JSON, then verify with a deny-list and fail the drop if anything survives".

Two findings change the plan relative to the CONTEXT assumptions. (1) The Phase 10 sanitiser **already masks** `/d/<32-hex>/` to `/d/_ID_/` in `u`, referrer and props (vectors exist in `_scripts/fixtures/analytics/payloads.mjs`), and the PROPS factory already maps `/d` to `content_type: drop`; the gap is the **built-in `File Download` event** (name `File Download`, prop `url` with the PDF filename, which can itself be confidential) and **outbound-link events** on drop pages. Fix: a drop-aware whitelist rule inside the shared `transformRequest` plus an explicit `plausible('Drop Download')` call from `DropLayout`. (2) **Actions logs and step summaries of the public WebsiteMocker repo are world-readable**, so no workflow or CLI used in CI may print drop ids, titles or labels (counts and 4-char id prefixes only).

**Primary recommendation:** Build `_scripts/lib/drops-core.mjs` (pure: parse, validate, status, horizon, secret scan, qpdf strip/verify) first and test it with the harness; then the Astro integration (`_scripts/drops.mjs`) + `_core` route/layout; then CLI and skills; then the two CI changes (publish.yml fetch, `drops-health.yml`). Keep `deploy.yml` untouched and assert that it stays free of `drops`/`WM_PUBLISH_PAT`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Drop authoring (id, metadata, strip PDFs) | Operator CLI (local Node) | Private repo (storage) | Secrets-adjacent content must never touch the public repo |
| Drop source storage | Private repo `pbau3r-sfdy/drops` | Local clone (`DROPS_DIR`) | D-01 |
| Filtering (expiry, withdrawn, sandbox gate) | Build (Astro integration + loader) | CLI `check` (advisory) | D-04: enforcement is build time |
| Rendering `/d/<id>/` | Static build (shared `_core` route + `DropLayout`) | Site override via alias | Same pipeline as pages, no runtime server |
| PDF stripping and emission | Build (`astro:build:done`) | CLI `new` (strip at creation) | DROP-05, double safety |
| Indexing/referrer control | Page `<meta>` tags | — | GitHub Pages cannot set headers |
| Delivery | CDN/Static (GitHub Pages gh-pages) | — | D-03 |
| Tracking | Browser (Plausible snippet + `transformRequest`) | Plausible UI (goal) | D-07 |
| Secret and expiry watch | GitHub Actions (cron) | Operator | D-04, D-06 |

## Standard Stack

### Core
| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| Astro (existing) | ^5.0.0 (repo) | injectRoute, content layer loader, `astro:build:done` | Already the stack; spike-verified on this repo's node_modules |
| qpdf | local 12.4.2 (brew); CI apt `qpdf` 11.9.0 on Ubuntu noble | Rebuild PDF without Info/XMP/attachments, JSON scrub, `--check` | Single tool covers strip and verify; exiftool alone leaves recoverable old metadata (incremental update) and needs qpdf anyway |
| Node built-ins (`crypto`, `fs`, `child_process`) | Node 22 (CI), 26 local | `randomBytes(16).toString('hex')`, file ops, `spawnSync` with arg arrays | No dependency, matches `build-single.mjs` style |
| `gh` CLI / curl | preinstalled on ubuntu runners | token check, live listing | Already used by publish/harness |
| `actions/checkout@v7` | already pinned in repo | second-repository checkout | Repo already uses v7 |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `jq` | Harness JSON asserts (already used by verify-phase-12) | Static harness |
| `shasum`/`grep -a` | Marker search in stripped PDFs | Harness |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| qpdf | exiftool (`-all=`) | exiftool is not on the macOS or runner image by default; it edits PDFs incrementally so the old metadata stays in the file unless qpdf then rewrites it, so qpdf is needed regardless. Rejected |
| qpdf | mutool/ghostscript | Not installed locally (`mutool`, `gs` absent), larger install, rewriting fidelity risk. Rejected |
| qpdf | pdf-lib (npm) | New dependency, supply-chain surface for a confidentiality feature. Rejected |

**Installation (no npm packages):**
```bash
# macOS (already present: /opt/homebrew/bin/qpdf 12.4.2)
brew install qpdf
# publish.yml / drops-health.yml, only when drops.enabled
sudo apt-get update -qq && sudo apt-get install -y qpdf
qpdf --version   # drops-core asserts major >= 11 (JSON v2 + --update-from-json)
```

**Version verification:** `qpdf --version` locally 12.4.2 [VERIFIED: local `brew list --versions qpdf`]; noble ships 11.9.0 [CITED: packages.ubuntu.com/noble/qpdf]. The Ubuntu 24.04 runner image README (image 20261004.327.1) has no qpdf/exiftool entry, so an apt step is required [VERIFIED: grep of actions/runner-images Ubuntu2404-Readme.md]. Whether `ubuntu-latest` is still 24.04 at run time is not pinned; apt install works on either.

## Package Legitimacy Audit

No npm/PyPI/crates packages are installed by this phase. qpdf is a distro/Homebrew system package installed through apt/brew, not a registry dependency. slopcheck is not applicable. Packages removed (SLOP): none. Packages flagged (SUS): none. Plan must not add an npm PDF library (see Don't Hand-Roll).

## Architecture Patterns

### System Architecture Diagram

```
 operator (local)                     private repo                        GitHub Actions (public repo WebsiteMocker)
 ┌───────────────┐   new/withdraw   ┌──────────────────────┐  checkout   ┌───────────────────────────────────────────┐
 │ drop.mjs CLI  │ ───────────────▶ │ pbau3r-sfdy/drops    │ ──(PAT)───▶ │ publish.yml  (workflow_dispatch, slug)    │
 │ (qpdf strip)  │  commit+push     │  sfdy/<id>/drop.md   │   _drops/   │  1 read wiring (drops.enabled?)           │
 └──────┬────────┘  (operator gate) │  sfdy/<id>/*.pdf     │             │  2 apt install qpdf                       │
        │ DROPS_DIR=local clone     │  sfdy/withdrawn.json │             │  3 drop.mjs check --ci (invalid => fail)  │
        ▼                           └──────────────────────┘             │  4 build-single (DROPS_DIR=_drops)        │
 ┌─────────────────────────┐                                              │       │                                   │
 │ npm run build           │                                              │       ▼                                   │
 │  sandbox base:          │                                              │  ┌───────────────────────────────┐        │
 │   no DROPS_PREVIEW ──▶ zero drops                                      │  │ Astro build (sites/sfdy)      │        │
 │   DROPS_PREVIEW=1 ──▶ preview (local only; refused if CI=true)         │  │  drops.mjs integration        │        │
 └─────────────────────────┘                                              │  │   config:setup: gate + route  │        │
                                                                          │  │   loader: scan, validate,     │        │
                       deploy.yml (push main) ─ never sets DROPS_*,       │  │     filter expired/withdrawn  │        │
                       never sees the PAT ─ sandbox has zero drops        │  │   /d/[id] -> DropLayout (meta)│        │
                                                                          │  │   build:done: strip+copy PDFs │        │
                                                                          │  └───────────────┬───────────────┘        │
                                                                          │                  ▼ dist/sfdy/d/<id>/      │
                                                                          │  5 CNAME, robots Allow, JamesIves push    │
                                                                          └───────────────────┬───────────────────────┘
                                                                                              ▼
                              visitor ─▶ GitHub Pages (www.starflight-dynamics.com/d/<id>/ ; 404.html otherwise)
                                           │ pageview u=/d/_ID_/ , 'Drop Download' (no props) via transformRequest
                                           ▼ Plausible

 drops-health.yml (cron nightly):  job1 token check (expiry header, drops repo read, prod repo access)
                                   job2 expiry watch: list live d/<id> dirs on prod gh-pages (public API)
                                        vs private repo expiry/tombstones -> red run if expired-but-live
```

### Recommended Project Structure
```
_scripts/
├── drops.mjs                    # Astro integration (DROP-04): gate, injectRoute, alias, PDF emit
├── drop.mjs                     # CLI: new|list|withdraw|expire|check
├── lib/
│   ├── drops-core.mjs           # pure: id, frontmatter parse/validate, status(now), horizon, secret scan, tombstones
│   └── pdf-strip.mjs            # qpdf wrapper: strip(src,dest), verify(file), requireQpdf()
├── fixtures/drops/
│   ├── gen.mjs                  # writes fixture drops dir + fixture PDF with relative dates (no static dates)
│   └── wiring/                  # drops-enabled wiring fixtures for eval-snippet
└── verify-phase-11.sh
_core/src/
├── drops/[id].astro             # shared route entrypoint (injected)
├── layouts/DropLayout.astro     # standalone neutral layout (default)
└── content.config.ts            # + dropsSchema export (schema only, matches file convention)
.github/workflows/drops-health.yml
.claude/skills/wm-drop.md
docs/drops.md
```

### Pattern 1: Per-site adoption (how `_core` and sites inherit)
`_core` is copied by `new-site.sh`; live sites do not import it at runtime except schemas via `../../_core/src/content.config.ts` (see `sites/sfdy/src/content.config.ts`). Shared runtime code therefore lives in `_scripts/` (integrations) and is referenced by relative path, exactly as `plausible()` and `internalPages()` are (`sites/sfdy/astro.config.mjs`). Adoption on `sfdy`:
```js
// sites/sfdy/astro.config.mjs
import drops from '../../_scripts/drops.mjs';
integrations: [plausible(), internalPages(), drops()],
```
```ts
// sites/sfdy/src/content.config.ts  (add)
import { dropsCollection } from '../../_scripts/lib/drops-collection.mjs'; // or inline loader, see below
export const collections = { news, announcements, blog, drops: dropsCollection() };
```
```json
// sites/sfdy/wiring.json
"drops": { "enabled": true }
```
Add `drops()` to the `_core/astro.config.mjs` template too (inert unless `drops.enabled`). Note Astro only reads collections from the site's own `content.config.ts`, so the helper must be imported there.

### Pattern 2: Route and layout from `_core` (spike-verified)
`_scripts/drops.mjs` follows `internal-pages.mjs`:
```js
// Source: spike in scratchpad + _scripts/internal-pages.mjs (existing pattern)
'astro:config:setup': ({ config, injectRoute, updateConfig, logger }) => {
  const w = readWiring(config.root);                 // sites/<slug>/wiring.json
  if (w.drops?.enabled !== true) return;
  const sandbox = isSandbox(config.base);
  const preview = process.env.DROPS_PREVIEW === '1';
  if (preview && !sandbox) throw new Error('[drops] DROPS_PREVIEW is for sandbox builds only');
  if (preview && (process.env.CI || process.env.GITHUB_ACTIONS)) throw new Error('[drops] DROPS_PREVIEW is local-only (never in CI)');
  if (sandbox && !preview) return;                   // D-09: no route, no loader data, no PDFs
  // optional site override of the layout via a Vite alias
  updateConfig({ vite: { resolve: { alias: { '@drop-layout': siteOverrideOrCore } } } });
  injectRoute({ pattern: '/d/[id]', entrypoint: fileURLToPath(new URL('../_core/src/drops/[id].astro', import.meta.url)) });
}
```
`DROP-03` says the layout is neutral, so the default `DropLayout` is **standalone** (does not import the site `Layout.astro`, which carries Nav/Footer/internal pill): own minimal CSS, accent from `wiring.accent`, no `<Nav>`/`<Footer>`, no links except the drop's own attachments. Required head content:
```html
<meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
<meta name="referrer" content="no-referrer">
<title>Shared document</title>   <!-- neutral; real title only in the visible h1 -->
<!-- no og:*, no twitter:*, no canonical, no description, no rel=alternate -->
```
Do not use `<slot name="head">` of the site `Layout.astro` for this: the site layout emits `description`, a brand-titled `<title>` and nav/footer. `injectScript('head-inline')` from `plausible()` still reaches injected routes, which is what tracking needs.

### Pattern 3: Loader filters at the source, route re-checks
The loader (in `content.config.ts`, receives `config` in its context) returns **no entries** for expired/withdrawn drops or in a gated sandbox; entries never reach `getCollection`. The route's `getStaticPaths` calls the same `statusOf(entry, now)` again (defense in depth, DROP-04). Astro persists collection data in `.astro/` / `node_modules/.astro` (both gitignored); mention in docs that drop bodies are cached there locally.

Source layout in the private repo (D-01):
```
sfdy/<32-hex>/drop.md        # frontmatter + Markdown body
sfdy/<32-hex>/<name>.pdf     # optional attachments, already stripped by `new`
sfdy/withdrawn.json          # tombstones [{ "id": "...", "at": "ISO", "reason": "withdrawn|expired" }], ids only
```
Frontmatter (all validated by `drops-core`, the zod export in `_core` only wraps it):
```yaml
id: 0123456789abcdef0123456789abcdef   # must equal the folder name, /^[0-9a-f]{32}$/
title: Programme overview v2
label: Customer X review                # human label, operator-facing, never rendered into analytics
created: 2026-10-14T10:00:00+02:00
expires: 2026-11-13T23:59:59+01:00      # mandatory, ISO 8601 with offset (date-only rejected: timezone ambiguous)
attachments: [overview.pdf]             # optional, filenames only, must exist next to drop.md
```
Expiry semantics (D-04 discretion): `expires` must parse (`z.string().datetime({ offset: true })` or equivalent regex), be after `created`, and be at most **90 days after `now`** at build/CLI time (build FAILS, naming the 4-char id prefix, if exceeded). Default for `new` is 30 days (`--days` max 90). A drop is **expired** when `Date.parse(expires) <= Date.now()` at build time (UTC compare, so offsets are safe). **Soon-expiring** = within 7 days (warn). Missing `expires` = invalid: `check` reports it as FAIL/"expiry-less" and the build fails (DROP-01 mandatory, DROP-07 wants it surfaced before that, hence `check`). Withdrawn = id in `withdrawn.json` or `withdrawn: true` frontmatter (honoured even if the folder survives).

### Pattern 4: PDF emission and stripping
Emit in `astro:build:done({ dir })` (not `public/`): for each active drop attachment, `stripPdf(src, tmp)`, `verifyPdf(tmp)`, copy to `<dir>/d/<id>/<name>.pdf`. Rebuild at build even if `new` already stripped (idempotent; defends against hand-edited source). Tool presence rule (recommended): `requireQpdf()` runs when at least one active drop has a PDF, and `publish.yml` always asserts `qpdf --version` for drops-enabled sites. (Open question Q4: stricter "always when drops.enabled".)

### Anti-Patterns to Avoid
- **Putting drop data in `src/content/drops/` or `public/`:** `sync-content.sh` copies contributor `.md` into any existing `src/content/<collection>` directory, so a `src/content/drops` directory would turn a public contributor push into a publish path, and `public/` bypasses the filter.
- **A `Disallow: /d/` in robots.txt:** advertises the route; DROP-04 forbids any robots entry. Harness asserts both robots files stay untouched.
- **Printing ids/titles/labels in CI:** public repo logs are public. Use counts and `id.slice(0,4)`.
- **Creating a gh-pages backup branch once drops exist:** a backup branch of the public gh-pages keeps withdrawn drops publicly visible (the Phase 12 `gh-pages-old-2026-08` recipe is safe only for pre-drops state).
- **`DROPS_PREVIEW` honoured outside sandbox or in CI:** build must throw.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF metadata removal | Own PDF parser / regex on bytes | qpdf rebuild + `--json=2` scrub + `qpdf --check` | Compressed object streams, incremental updates and XMP hide strings from naive tools |
| Unguessable id | Math.random/uuid v4 string slicing | `crypto.randomBytes(16).toString('hex')` | Locked by D-08; 128 bits |
| Private repo fetch | Own clone script with token in URL | `actions/checkout@v7` with `repository`, `token`, `path`, `persist-credentials: false` | No credential left in `.git/config`, same pin as repo |
| Id masking in analytics | New masking logic | Existing `mask()` in `TRANSFORM_FACTORY_SRC` (32-hex already masked) | Extend only with the drop-path whitelist |
| Date arithmetic for horizon | Manual offset math | `Date.parse` on ISO with offset (UTC epoch compare) | Handles DST offsets |
| Markdown rendering | Custom renderer | Astro `render(entry)` | Already the content pipeline |

**Key insight:** the risky part is not rendering, it is leakage: ids in logs, caches, analytics, sync paths, backup branches. Centralising all rules in one tested pure lib is what keeps the harness meaningful.

## Detailed Findings by Research Question

### 1. Baseline `sites/sfdy` and exclusions
- `src/content.config.ts` defines `news`, `announcements`, `blog` via `glob` loaders, schemas imported from `_core/src/content.config.ts`. A `drops` collection is added next to them with the custom loader (not `glob` on `src/content`).
- `Layout.astro` has `<slot name="head" />` and a `SHOW_INTERNAL`-gated `noindex` (sandbox only), derived from `isSandbox(import.meta.env.BASE_URL)` in `src/data/internal.ts`. Drops do not use this layout. `404.astro` exists and fires `plausible('404', {props:{path:'/'+firstSegment}})`; for a dead drop that yields path prop `/d` and masked `u` (verified by the existing `404 path prop masked` vector).
- Exclusion matrix (all verified by reading the repo):

| Surface | Status today | Needed |
|---------|--------------|--------|
| Sitemap | None: no `@astrojs/sitemap` anywhere in sites/_core/src (grep) | Harness asserts no `sitemap*` file in dist and no integration added |
| RSS | None found | Same assertion |
| Dashboard `src/pages/index.astro` | Reads `sites/*/wiring.json` only, never dist | Do not add drop counts/ids to wiring chips; assert `dist/index.html` has no `/d/` |
| robots.txt | `public/robots.txt` (dashboard, `Disallow: /`); publish.yml overwrites prod copy with `Allow: /`; sfdy has no own robots | Assert unchanged, no `/d/` line |
| content-sync | `sync-content.sh` copies `.md` into existing `src/content/<collection>` dirs only | Never create `src/content/drops`; add explicit deny for collection `drops` in `sync-content.sh` plus harness assertion that `sites/*/src/content/drops` does not exist |
| Nav/Footer/inbound links | Footer `pages` array is static | No change; harness greps all non-drop dist HTML for each drop id |
| Dashboard/CLAUDE.md docs | n/a | Document |

- `wiring.json` design: `"drops": { "enabled": true }` (optional extras `repo` default `pbau3r-sfdy/drops`, `maxDays` 90, `warnDays` 7). Readers: integration, `publish.yml` (new step output `drops_enabled`), preflight, `drops-health.yml` (iterates sites with `drops.enabled` and `stage >= 6`), snippet builder (`cfg.drops`).

### 2. Private repo fetch (D-01/D-02)
`publish.yml` today: one `actions/checkout@v7` with `token: WM_PUBLISH_PAT`, `persist-credentials: false`, no `permissions:` block. Add after the wiring step (which gains an output `drops_enabled`):
```yaml
- name: Checkout private drops
  if: steps.wiring.outputs.drops_enabled == 'true'
  uses: actions/checkout@v7
  with:
    repository: pbau3r-sfdy/drops
    token: ${{ secrets.WM_PUBLISH_PAT }}
    path: _drops
    persist-credentials: false
    fetch-depth: 1
- name: Install qpdf
  if: steps.wiring.outputs.drops_enabled == 'true'
  run: sudo apt-get update -qq && sudo apt-get install -y qpdf && qpdf --version
- name: Drops check (CI)
  if: steps.wiring.outputs.drops_enabled == 'true'
  run: node _scripts/drop.mjs check "$SLUG" --ci
  env: { SLUG: ${{ inputs.slug }}, DROPS_DIR: ${{ github.workspace }}/_drops }
```
and the build step gets `DROPS_DIR: ${{ github.workspace }}/_drops` (always set; unset when disabled is harmless). Notes:
- Path `_drops/` is inside the workspace; add `_drops/` to `.gitignore` (the final commit-back step adds only `sites/<slug>/wiring.json`, so it is safe regardless).
- The repo must have at least one commit (create it with a README); an empty repo makes checkout fail (no ref). A missing `sfdy/` folder inside the clone is legal = zero drops. A missing repo/denied token makes checkout fail loudly = publish fails (desired: a token lapse must not silently publish "zero drops" and unpublish live ones). Safety net: `check --ci` compares the live `gh-pages` `d/` listing (public API) with the source set and prints counts "N live drops will be removed"; operator confirmation in `/wm-publish` handles the interactive path.
- Keep it ONLY in `publish.yml`. Harness asserts `deploy.yml` contains none of `drops`, `DROPS_`, `WM_PUBLISH_PAT` (it currently has none).
- Local builds read a clone via `DROPS_DIR` (default `<repo>/_drops`, gitignored; `/wm-deploy` runs `git add -A`, so the clone MUST stay ignored or outside the repo).
- **Operator action on the token:** the secret was updated 2026-10-14 15:50 UTC [VERIFIED: `gh secret list`]; its type and repository scope are unknown to Claude [ASSUMED fine-grained, contents read/write on WebsiteMocker and the prod repo, per 12-04 summary]. If fine-grained: edit the token in GitHub settings and add repository `pbau3r-sfdy/drops` with **Contents: Read-only** (resource owner cannot be changed; org approval may be required). If classic with `repo` scope: no change, but note it reads every repo. Expiry date shown in settings goes into `docs/drops.md`.
- `gh repo create --private` is available: `gh auth status` shows logged in as `pbau3r-sfdy` with scopes `admin:org, delete_repo, gist, repo, workflow` (token value not read). Creation is an operator-approved step: `gh repo create pbau3r-sfdy/drops --private --add-readme --description "..."`. Do not create it in research.

### 3. PDF metadata stripping (D-08)
Chosen tool: **qpdf**. Local: present (brew 12.4.2); `exiftool`, `mutool`, `gs`, `pdftk` absent [VERIFIED: `which`]. CI: install via apt each run (not preinstalled).
Tested recipe on a hand-built fixture with Info (Author/Creator/Producer/Title/Keywords), XMP `/Metadata`, `/Names/EmbeddedFiles`, `/Outlines` and a page `/PieceInfo` [VERIFIED: scratch spike]:
1. `qpdf --empty --pages in.pdf -- --object-streams=disable --deterministic-id out.pdf` removes Info, catalog XMP, embedded files, outlines; it **keeps** page-level `/PieceInfo` (exactly the kind of Adobe private data that leaks tool names).
2. Scrub pass: `qpdf --json=2 --json-output out.pdf full.json`, delete keys `/PieceInfo`, `/Metadata`, `/Info`, `/AF`, `/EmbeddedFiles` (recursively in every `value` and `stream.dict`), then `qpdf --update-from-json=full2.json out.pdf final.pdf`. Note: `--update-from-json` **replaces whole object values**, so a partial `{"/PieceInfo":null}` update destroys the page dict (observed MediaBox warnings); always round-trip the full JSON.
3. Verify (`verifyPdf`): `qpdf --check` exit 0 (warnings = fail), `grep -a` finds none of `/Info /Metadata /PieceInfo /EmbeddedFiles /AF /JavaScript /JS /OpenAction /Producer /Creator /Author /XMP` and no `<x:xmpmeta`; `--object-streams=disable` keeps dictionaries greppable. Fixture markers (`FIXTURE-AUTHOR`, `-XMP`, `-PIECEINFO`) must be absent.
What is *not* preserved (document for operators): bookmarks/outlines, named destinations, form fields, tagged-PDF structure tree; visible text and embedded images are untouched (images may carry their own EXIF/XMP inside image streams; the scrub removes `/Metadata` on image XObjects too, since it is recursive). Encrypted PDFs are rejected with a clear message.
Failure when the tool is missing: `requireQpdf()` runs `spawnSync('qpdf',['--version'])`; ENOENT or major < 11 throws `[drops] DROP-05: qpdf not found (brew install qpdf / apt install qpdf)`; thrown from the integration => `astro build` fails; `drop.mjs new --pdf` aborts before writing anything.

### 4. Tracking (D-07)
Current sanitiser (`_scripts/lib/plausible-snippet.mjs`, `TRANSFORM_FACTORY_SRC`): `mask()` replaces any path segment matching `^[0-9a-fA-F]{32}$` with `_ID_` in `u` and in every string prop, referrer reduced to origin, query and fragment stripped. Existing vectors: `drop id masked`, `drop id masked before file`, `props object cleaned` (`/d/<hex>/x.pdf?sig=1#y` -> `/d/_ID_/x.pdf`), `404 path prop masked`. So views as `/d/_ID_/` already satisfy "id never in a path". Real gaps:
1. **Built-in `File Download`** sends `props.url` = full file URL; after masking it is `/d/_ID_/<filename>.pdf`, and the filename can be confidential (e.g. `customer-x-offer.pdf`). Plausible docs confirm the "File Download" goal and default file type list incl. pdf; the `url` property name is observed live (docs/analytics.md) not stated in the docs page [CITED: plausible.io/docs/file-downloads-tracking; observed per docs/analytics.md].
2. **Outbound link events** from a drop body leak destination URLs of a confidential draft.
3. **Expired-drop visits** load `404.html` at `/d/<id>/`: pageview `/d/_ID_/` is counted together with real views, plus a `404` event with `path=/d`. Document: subtract `404` goal hits.
Proposed solution (small, testable change to the shared factory; `cfg.drops` set by `buildSnippet` only when `wiring.drops.enabled`, so non-drop sites and existing vectors are unchanged):
- In the transform: compute the normalised page path (base stripped, as `excluded()` already does). If `cfg.drops` and path matches `^/d/[0-9a-f]{32}(/|$)`: allow only `pageview`, `Drop Download` and `404`; return `null` for everything else (`File Download`, `Outbound Link: Click`, `Form: Submission`); for `Drop Download` delete `p.p` (no props at all).
- `DropLayout` fires the goal itself: delegated click handler on `a[data-drop-download]` calling `window.plausible && window.plausible('Drop Download')` (the head-inline stub queues calls, so ordering is safe). Built-in `fileDownloads` can stay `true` for the rest of the site.
- Plausible UI: create custom-event goal `Drop Download` (exact, case-sensitive). Add it to the goals checklist in `docs/analytics.md`, and add `Drop Download` to the event contract table.
- Harness: new vectors in `payloads.mjs` with `cfg` including `drops: true` (raw id in `u`, in props, in referrer path-bearing origin-only), plus an `eval-snippet.mjs` run against a drops-enabled wiring fixture asserting `grep -c "$ID"` of the transformed output is 0 for each event type; and a static check that the id does not occur in the injected inline snippet in `dist` (it is page-independent) while it does occur only in its own `dist/d/<id>/`.
Business-plan conditional: custom properties (`label`, `analytics.props: true`) and the Stats API tile. `Drop Download` as a custom event goal without props is expected to work on the current plan [ASSUMED: Plausible docs page for custom events states no plan restriction for goals, the ROADMAP note names props/Stats API as Business-only]. If/when props are on, the label grouping must be a separate `plausible('Drop Download', {props:{label}})` path gated by `analytics.props === true` and **label must never equal or contain the id**; keep it unimplemented behind a feature flag in this phase and write the requirement note in the plan (DROP-06 label grouping "conditional").

### 5. Expiry sweep, CLI, warnings (D-04/D-05)
CLI design (`_scripts/drop.mjs`, same dry-run-then-`--confirm` style as `delete-site.mjs`):
- `new --site sfdy --title T --label L [--days N|--expires ISO] --body-file md [--pdf a.pdf ...]`: validates horizon, generates id, strips PDFs (temp then verify), writes `drop.md`; never commits or pushes (operator gate: commit/push in `DROPS_DIR` repo). Prints the URL path `/d/<id>/` locally only.
- `list [--site sfdy] [--json]`: id (short by default), label, expiry, status `active|soon|expired|invalid|withdrawn`.
- `withdraw <id|prefix>=8+ [--confirm]`: dry run shows what is removed; `--confirm` deletes `sfdy/<id>/` and appends a tombstone to `withdrawn.json`; prints the next steps (commit+push private repo, `/wm-publish`, 404 check, "unlisting only" notice).
- `expire [--confirm]`: same for every expired drop (reason `expired`).
- `check <slug> [--ci]` (additive, read-only; DROP-02 lists four commands, `check` is needed by preflight/publish): exit 1 on invalid/expiry-less/horizon violation/missing qpdf with PDFs; warnings (exit 0) for expired-in-source, soon-expiring (7 d), secret-looking body (regex set: PEM private key headers, `AKIA[0-9A-Z]{16}`, `ghp_`/`github_pat_`, `xox[abprs]-`, `Bearer ` tokens, `password\s*[:=]`, `api[_-]?key\s*[:=]`); prints list of drops to be published; in `--ci` prints only counts and 4-char prefixes; compares with live gh-pages `d/` listing to print "will go live / will disappear".
Scheduled expired-but-live warning (cron in `drops-health.yml`, job 2): list live drop dirs from the **public** prod repo (`gh api repos/<prod_repo>/contents/d?ref=gh-pages`, 404 = none), check out the drops repo with the PAT, and for each live id: source folder missing or in `withdrawn.json` => "withdrawn but still live"; `expires <= now` => "expired but still live". Any hit fails the job (GitHub failure email = notification; it never publishes). Output: counts and 4-char prefixes only.
Skills: `/wm-preflight` gets a "Drops" section (only if `drops.enabled`): `node _scripts/drop.mjs check <slug>`: FAIL on invalid/expiry-less/horizon/missing qpdf, WARN on expired, soon-expiring, secret-looking, plus the list of drops about to be published, plus "local drops clone has uncommitted or unpushed changes" (CI reads GitHub, not the local clone: `git -C "$DROPS_DIR" status --porcelain` and unpushed commits). `/wm-publish` step 2 surfaces the same list and asks the operator to confirm before `gh workflow run`; after the run, for withdrawn/expired ids it runs the live 404 check with retries (CDN `max-age=600`, as in the Phase 12 live section).

### 6. Nightly token check (D-06)
Do not echo the token: pass as `env`, use `gh api` (reads `GH_TOKEN`) or curl with the header from env, never `set -x`. Checks, each failing the run (no `continue-on-error`):
1. `gh api -i repos/pbau3r-sfdy/drops` with the PAT: HTTP 200 and `private: true` (also guards against someone making it public). Parse the **`github-authentication-token-expiration`** response header (documented by GitHub for PAT use) [CITED: github.blog changelog 2021-07-26 "Expiration options for personal access tokens"]; fail when fewer than 14 days remain, print only the date and days left (not secret). The header is absent for non-expiring tokens: print "no expiry" as a WARN to rotate to an expiring token.
2. Read access: `git ls-remote` against the drops repo (using `GIT_CONFIG` extraheader from env or `gh`) and `gh api repos/<prod_repo>` and `repos/pbau3r-sfdy/WebsiteMocker` both 200.
3. Write capability on the two repos publish writes to: the repo JSON `permissions.push` field is not guaranteed to reflect fine-grained token scope [ASSUMED]; a reliable non-destructive probe is `git push --dry-run` receive-pack discovery [ASSUMED, verify when implementing]. If neither is reliable, the first-run log of check 1 plus the content-sync failure signal remain the guard. Flagged as open question Q3.
Notification: scheduled workflow failure emails go to the user who created the workflow, or who last modified/re-enabled the cron [CITED: docs.github.com notifications-for-workflow-runs]; operator must keep Actions email notifications on. Cron limits: minimum 5-minute interval; runs can be delayed at high load, pick an off-peak minute (for example `23 4 * * *`); **GitHub disables scheduled workflows in public repos after 60 days without repository activity** [CITED: docs.github.com disabling-and-enabling-a-workflow], so the check could silently die in a quiet period; mitigation: document it, the harness `live` section verifies the last run is recent. Must not: print or write the token, call MarketingBridge/vault, create issues/artifacts containing ids, publish, or `continue-on-error`. Docs: `docs/drops.md` gets "Token expiry date: YYYY-MM-DD (operator fills; first run prints it)" plus the renewal checklist (create new fine-grained PAT with contents read/write on WebsiteMocker, starflight-dynamics and read on drops; update secret `WM_PUBLISH_PAT`; run `drops-health` manually; re-run content-sync test).

### 7. Public-sandbox safety (D-09)
Layers: (a) `deploy.yml` has no drops reference and no PAT; (b) integration returns early for any sandbox base without `DROPS_PREVIEW=1`, so even a stray `DROPS_DIR` yields no route/loader data; (c) `DROPS_PREVIEW=1` throws in CI (`CI`/`GITHUB_ACTIONS`) and for non-sandbox bases; (d) local `dist/` is gitignored and `_drops/` is ignored. Remaining local risk: `/wm-deploy` runs `git add -A` and pushes to main, which triggers the CI build (no drops) so a local preview build cannot reach the public sandbox; but add a line to `/wm-deploy`: "unset DROPS_PREVIEW before building". Harness: static grep of `deploy.yml`; sandbox build without flag has no `dist/sfdy/d/`; sandbox build with flag has it (local only, section skipped when `CI` is set); CI-guard check: `CI=true DROPS_PREVIEW=1` build fails.

### 8. Harness `_scripts/verify-phase-11.sh`
Style: bash, `check()` counter, sections, `all` = offline sections only, exit 0/1/2 (verify-phase-10/12). Builds share `dist/sfdy` and run sequentially; fixtures generated at runtime into `_staging/phase11/` (gitignored) by `fixtures/drops/gen.mjs` with **relative dates** (static dates would rot against the 90-day horizon). Sections:
- `lib`: id format (32 hex, two ids differ), frontmatter validation (missing expires, date-only, bad offset, horizon 91 d rejected, id/folder mismatch), status calc (active, soon, expired, withdrawn via folder flag and via tombstone), secret scan hits, short-id helper.
- `pdf`: generate fixture PDF with markers; strip; assert markers/keys absent (deny-list), `qpdf --check` clean, still 1 page; PATH without qpdf => strip fails with the DROP-05 message; encrypted PDF rejected.
- `cli`: `new` into temp DROPS_DIR, `list` shows status, `withdraw` dry run vs `--confirm`, `expire` sweep, `check` exit codes.
- `build`: production-like build (`SITE_URL=https://www.starflight-dynamics.com SITE_BASE=/ DROPS_DIR=fixture`): `dist/sfdy/d/<activeId>/index.html` exists; expired, withdrawn (folder flag + tombstone) and expiry-less absent (expiry-less makes the build fail: assert the failure message); page has `noindex, nofollow, noarchive`, `name="referrer" content="no-referrer"`, no `og:`/`twitter:`/`canonical`/`description`, neutral `<title>`; PDF emitted stripped; id appears in no other file (`grep -rl` over dist, excluding its own dir), none of sitemap/rss files exist, `robots.txt` has no `/d/`, dashboard `dist/index.html` has no `/d/`; no `sites/*/src/content/drops`; `sync-content.sh` run on a fixture with `content/drops/x.md` copies nothing.
- `sandbox`: sandbox base without flag has no `d/`; with `DROPS_PREVIEW=1` has it (skipped under `CI`); `CI=true DROPS_PREVIEW=1` fails; `deploy.yml` free of `drops|DROPS_|WM_PUBLISH_PAT`.
- `track`: new vectors via `payloads.mjs` runner plus `eval-snippet.mjs` with a drops-enabled wiring fixture: raw id never in output for pageview, `Drop Download`, `File Download` (null), outbound (null), `404`; `Drop Download` keeps no props; non-drop pages unchanged; existing verify-phase-10 `all` still green (regression, as phase 12 does).
- `ci`: static YAML greps: publish.yml has the second checkout with `repository: pbau3r-sfdy/drops`, `persist-credentials: false`, `if:` guard, qpdf step; `drops-health.yml` has cron, no `set -x`, no `echo ... PAT`, no `continue-on-error`, no vault references; skills mention drops.
- `docs`: `docs/drops.md` contains the confidential-not-secret / not export-controlled wording, "unlisting only", token expiry heading.
- `live` (opt-in, like phase 12; ids come from env, never committed): `ACTIVE_ID`/`WITHDRAWN_ID`/`EXPIRED_ID` => 200 / 404 / 404 with retry loop for the CDN (6 x 15 s); a random never-existing 32-hex id => 404; gh-pages tree has no `d/<withdrawnId>`; last `drops-health` run succeeded and is < 36 h old.
Printed at the end ("what this cannot verify"): HTTP response headers (GitHub Pages cannot set `X-Robots-Tag`, `Referrer-Policy`, `Cache-Control`, so only meta tags are asserted), search-engine/archive copies, CDN edge propagation timing, Plausible-side event arrival, token scope correctness, that the git history/objects of gh-pages do not retain withdrawn copies.

### 9. Slug note
Update wording `sfdy-alt-clean-reskin-2` -> `sfdy` in REQUIREMENTS.md DROP-03, ROADMAP line 39 (phase list entry), Phase 11 success criterion 5 ("built and verified on `sfdy`"), and the Phase 11.1 "Depends on" mention is historical (leave). DROP-06 should be reworded per D-07: "Drop views report as a masked `/d/` pageview and downloads as a plain `Drop Download` goal; grouping by `label` only when custom properties are enabled". DROP-02 should list the added `check` subcommand. Also fix `_scripts/plausible.mjs` header comment? Not required.

### 10. Ordering, risks, operator gates, rollback
Recommended plan order (waves):
1. **Wave 1 (no external effects):** `drops-core.mjs` + `pdf-strip.mjs` + fixture generator + `verify-phase-11.sh` sections `lib`, `pdf` (TDD, harness first); requirement wording edits.
2. **Wave 2:** `_scripts/drops.mjs` integration, `_core` route/layout/schema, sfdy adoption (`drops.enabled`), sections `build`, `sandbox`; sanitiser change + vectors (`track`); `sync-content.sh` deny, `.gitignore`.
3. **Wave 3:** `drop.mjs` CLI, `/wm-drop` skill, preflight/publish/deploy skill edits, `docs/drops.md` (+ register in `src/data/docs.json` only if shown on the Documentation page, optional), `docs/analytics.md` goal + contract row, CLAUDE.md/AGENTS.md notes.
4. **Wave 4 (CI, still local files):** publish.yml changes, `drops-health.yml`, section `ci`.
5. **Operator gates (stop and ask):** G1 create private repo `pbau3r-sfdy/drops` (`gh repo create --private --add-readme`); G2 extend `WM_PUBLISH_PAT` repository access to drops (read), record expiry date; G3 push the code to origin main (deploy.yml runs; sandbox must show no `/d/`); G4 create the Plausible goal `Drop Download`; G5 first real publish with a test drop (publish.yml run, then `live` section), then withdraw it and republish to prove the 404; G6 enable/trigger `drops-health.yml` once manually.
Risks: PAT scope mistakes (publish fails at checkout: acceptable and loud); token also reads confidential drafts (documented trade-off); public logs (mitigated by count-only output); pushing a drop folder to the public gh-pages tree (accepted D-03); stale CDN copies after withdrawal (10 min `max-age`, plus archives); gh-pages backup branches resurrecting withdrawn drops; Astro `.astro` cache holding bodies locally; schedule auto-disable after 60 days idle; `DROPS_DIR` mismatch between local and CI (preflight warns about unpushed drops-repo changes); the Phase 12 open blocker that the PAT was rejected at content-sync (now refreshed, but the end-to-end contributor sync was never proven; the token check should also cover WebsiteMocker write).
Rollback: set `drops.enabled` false (or remove) and run `/wm-publish sfdy`: the next build contains no `/d/` and `clean: true` deletes the folders from gh-pages; code rollback by reverting the phase commits; disable `drops-health.yml` (`gh workflow disable`); token access reduction in GitHub settings; the private repo can be archived. The Phase 12 gh-pages restore recipe applies but must not be used to restore a branch that contains withdrawn drops.

## Common Pitfalls

### Pitfall 1: Partial `--update-from-json` destroys objects
**What goes wrong:** updating `{"obj:3 0 R":{"value":{"/PieceInfo":null}}}` replaces the whole page dictionary (MediaBox/Resources lost, qpdf repairs with warnings). **How to avoid:** always round-trip the full JSON and delete keys in JS; verify with `qpdf --check` and page count. **Warning sign:** qpdf WARNING lines.

### Pitfall 2: Metadata survives in places the first pass misses
**What goes wrong:** Info/XMP removal is not enough (`/PieceInfo`, image-level `/Metadata`, `/AF`). **How to avoid:** recursive deny-key scrub and grep verification with `--object-streams=disable`. 

### Pitfall 3: Ids in logs
**What goes wrong:** public Actions logs/step summary expose ids and labels. **How to avoid:** counts and 4-char prefixes in `--ci` mode; harness greps the workflow YAMLs and CLI source for forbidden `console.log(id` patterns in ci paths.

### Pitfall 4: Empty or inaccessible drops repo
**What goes wrong:** checkout fails on an empty repo (no commit) or denied token; or succeeds with no `sfdy/` folder and a publish silently removes live drops. **How to avoid:** `--add-readme`, loud failure on access errors, live-vs-source diff in `check` and operator confirmation.

### Pitfall 5: Expired drop pageviews look like real views
`404.html` served at `/d/<id>/` fires a pageview `/d/_ID_/` plus the `404` event. Document and subtract.

### Pitfall 6: Unbounded horizon via manual edit
A hand-edited `expires` years ahead would make the drop live forever. Build fails when `expires - now > 90 d`.

### Pitfall 7: Time zones
Use `Date.parse` on offset ISO strings; reject date-only. Test across a DST offset in `lib`.

### Pitfall 8: Scheduled workflow disabled after 60 idle days
The token check dies silently in a dormant public repo; harness live section checks recency, docs mention manual re-enable.

## Code Examples

### Id and frontmatter validation (pure lib)
```js
// _scripts/lib/drops-core.mjs  (sketch)
import { randomBytes } from 'node:crypto';
export const newId = () => randomBytes(16).toString('hex');
export const ID_RE = /^[0-9a-f]{32}$/;
export const MAX_DAYS = 90, SOON_DAYS = 7;
const OFFSET_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
export function statusOf(fm, now = Date.now()) {
  if (fm.withdrawn === true) return 'withdrawn';
  if (!OFFSET_ISO.test(String(fm.expires ?? ''))) return 'invalid';
  const exp = Date.parse(fm.expires);
  if (Number.isNaN(exp)) return 'invalid';
  if (exp <= now) return 'expired';
  if (exp - now > MAX_DAYS * 864e5) return 'invalid';
  return exp - now <= SOON_DAYS * 864e5 ? 'soon' : 'active';
}
```

### qpdf strip and verify (spike-proven commands)
```js
// _scripts/lib/pdf-strip.mjs (sketch)
import { spawnSync } from 'node:child_process';
const q = (...a) => spawnSync('qpdf', a, { encoding: 'utf8', maxBuffer: 256 << 20 });
export function stripPdf(src, dest, tmpJson) {
  let r = q('--empty', '--pages', src, '--', '--object-streams=disable', '--deterministic-id', dest + '.1');
  if (r.status !== 0) throw new Error('[drops] DROP-05: qpdf could not rebuild the PDF');
  r = q('--json=2', '--json-output', dest + '.1', tmpJson);
  const doc = JSON.parse(readFileSync(tmpJson, 'utf8'));
  const DENY = new Set(['/PieceInfo', '/Metadata', '/Info', '/AF', '/EmbeddedFiles']);
  (function scrub(v) { if (v && typeof v === 'object') { for (const k of Object.keys(v)) { if (DENY.has(k)) delete v[k]; else scrub(v[k]); } } })(doc.qpdf[1]);
  writeFileSync(tmpJson, JSON.stringify(doc));
  r = q('--update-from-json=' + tmpJson, dest + '.1', '--object-streams=disable', dest);
  if (r.status !== 0) throw new Error('[drops] DROP-05: qpdf scrub failed');
}
// verify: qpdf --check must exit 0 without warnings; grep -a deny-list over bytes must find nothing.
```

### Transform rule for drop pages
```js
// inside TRANSFORM_FACTORY_SRC, after the 'excluded' check; cfg.drops comes from wiring.drops.enabled
// var DROP=/^\/d\/[0-9a-f]{32}(\/|$)/i;  var pg=norm(path) with base stripped
// if(cfg.drops&&DROP.test(pg)){
//   if(p.n==='Drop Download'){delete p.p;}
//   else if(p.n!=='pageview'&&p.n!=='404')return null;
// }
```

### DropLayout click hook
```html
<script is:inline>
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[data-drop-download]');
    if (a && window.plausible) window.plausible('Drop Download');
  });
</script>
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Build-time `public/` assets | Post-build emission in `astro:build:done` | Filtering applies to files too |
| Legacy `script.js` with `data-domain` | `pa-` per-site init with `transformRequest` (Phase 10) | Only this form can mask paths |
| Hash-fragment secret URLs | Not used (Locked Drops deferred, 999.1) | n/a |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `WM_PUBLISH_PAT` is a fine-grained PAT; editing repository access in settings is possible without re-issuing | Q2 | Operator may have to issue a new token and update the secret (still no new secret name) |
| A2 | Custom event goals (no props) work on the current Plausible plan/trial | Q4 | `Drop Download` goal unavailable; fall back to counting drop pageviews only |
| A3 | `git push --dry-run` or repo `permissions.push` can probe token write scope | Q6 | Token check cannot detect lost write access; rely on content-sync/publish failures |
| A4 | GitHub code search indexes only default branches, so gh-pages drop folders are not code-searchable | Pitfalls/Risks | Larger exposure than documented in D-03; docs wording should not claim it |
| A5 | `ubuntu-latest` has `sudo apt-get` access and the noble apt mirror serves qpdf 11.x | Q3 | Publish fails at the qpdf step (loud); fallback: pin runner or use a container |
| A6 | Astro `injectRoute` out-of-root entrypoint also works in `astro dev` and with `getStaticPaths` after an empty collection | Pattern 2 | Dev preview of drops fails; spike covered `astro build` only (dev not tested) |
| A7 | Tracker emits `File Download` with `url` prop and `u` = page URL (observed names in docs/analytics.md) | Q4 | Whitelist rule still drops the event whatever it carries |

## Open Questions

1. **Layout override or standalone only?**
   - Known: sfdy brand tokens live in site `Layout.astro` global CSS; standalone `DropLayout` needs its own minimal CSS.
   - Unclear: whether the operator wants drops visually branded like the site.
   - Recommendation: standalone default with brand accent/font from `wiring.json`; support the Vite alias override but ship no override for sfdy in this phase.
2. **Where does the `drops` helper live (`_scripts/lib/drops-collection.mjs` vs inline in each `content.config.ts`)?**
   - Recommendation: shared helper under `_scripts/lib`, imported by the site config; keep `_core/src/content.config.ts` schema-only.
3. **Token write probe (A3).** Decide when implementing `drops-health.yml`; test empirically with a harmless dry run.
4. **Is "build fails if the tool is missing" required when no PDF is present?** Recommendation: only when active drops contain PDFs (plus publish.yml always installs qpdf); needs planner/operator confirmation against DROP-05 wording.
5. **Plausible goal creation and expiry-date recording are operator actions (G4/G2).** Confirm the Business trial (30-day trial from 2026-10-14, memory note) does not alter the "props off" decision.
6. **`astro dev` support for `DROPS_PREVIEW=1`** (A6): verify during the integration task; if it fails, preview is `build` + `astro preview` only.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| qpdf (local) | strip, harness | ✓ | 12.4.2 (brew) | — |
| qpdf (CI runner) | publish, drops-health | ✗ preinstalled | apt noble 11.9.0 | `apt-get install qpdf` step |
| exiftool / mutool / gs / pdftk | — (rejected) | ✗ | — | not needed |
| Node | build, CLI | ✓ | local v26.11.1, CI 22 | — |
| gh CLI | repo creation, harness, token check | ✓ | logged in `pbau3r-sfdy`, scopes admin:org delete_repo gist repo workflow | — |
| python3 | not used by the plan (spike only) | ✓ | — | fixture PDF generated with Node in the plan |
| Private repo `pbau3r-sfdy/drops` | D-01 | ✗ (not created) | — | operator gate G1 |
| `WM_PUBLISH_PAT` access to drops | D-02 | ✗ (unknown) | secret updated 2026-10-14 15:50 UTC | operator gate G2 |

**Missing with no fallback:** private repo and PAT access (operator actions, block live use but not local development: harness uses fixtures).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | bash harness (`_scripts/verify-phase-11.sh`) with Node helpers; same style as verify-phase-10/12; no new test runner |
| Config file | none; `.planning/config.json` has `nyquist_validation: true` |
| Quick run command | `bash _scripts/verify-phase-11.sh lib && bash _scripts/verify-phase-11.sh pdf` (target < 30 s) |
| Full suite command | `bash _scripts/verify-phase-11.sh all` (offline sections) plus regression `bash _scripts/verify-phase-10.sh all` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DROP-01 | id/frontmatter/horizon rules | unit | `bash _scripts/verify-phase-11.sh lib` | ❌ Wave 0 |
| DROP-02 | CLI new/list/withdraw/expire/check | integration | `bash _scripts/verify-phase-11.sh cli` | ❌ Wave 0 |
| DROP-03 | route + layout render, no OG/links | build | `bash _scripts/verify-phase-11.sh build` | ❌ Wave 0 |
| DROP-04 | filtering, meta, exclusions, sandbox gate | build | `... build` and `... sandbox` | ❌ Wave 0 |
| DROP-05 | strip + fail without tool | unit/build | `... pdf` | ❌ Wave 0 |
| DROP-06 | no id in payloads, Drop Download | unit | `... track` (+ `verify-phase-10.sh sanitise`) | ❌ Wave 0 |
| DROP-07 | preflight/publish warnings | unit + doc grep | `... cli`, `... ci` | ❌ Wave 0 |
| DROP-08 | withdraw removes source, docs wording, live 404 | cli + doc grep + live | `... cli`, `... docs`, `... live` | ❌ Wave 0 |
| DROP-09 | harness itself prints "cannot verify" list | manual read | run `all`, inspect tail | ❌ Wave 0 |
| DROP-10 | skill + confidentiality text | doc grep | `... docs` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** the section matching the task (`lib`/`pdf`/`build`/`track`/`ci`).
- **Per wave merge:** `verify-phase-11.sh all` and `verify-phase-10.sh all`; `verify-phase-12.sh all` once the integration lands (production gating must not regress).
- **Phase gate:** all green; `live` run by the operator after G5 with ids passed via env.

### Wave 0 Gaps
- [ ] `_scripts/verify-phase-11.sh` (sections above), `_scripts/fixtures/drops/gen.mjs` (runtime dates + fixture PDF), drops-enabled wiring fixtures for `eval-snippet.mjs`, new vectors in `_scripts/fixtures/analytics/payloads.mjs`.
- [ ] `.gitignore`: add `_drops/`.
- [ ] No framework install needed (qpdf present locally).

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (no user auth; unguessable URL is a capability) | 128-bit `crypto.randomBytes` id |
| V3 Session Management | no | — |
| V4 Access Control | yes (token scope, repo privacy) | PAT scoped to named repos, read-only on drops; nightly check asserts `private: true` |
| V5 Input Validation | yes | strict id/slug regexes, frontmatter validation, filename allow-list (`^[A-Za-z0-9._-]+\.pdf$`), `spawnSync` arg arrays (no shell) |
| V6 Cryptography | yes | `crypto.randomBytes`, never `Math.random` |
| V8 Data Protection | yes | PDF metadata strip, no ids in logs/analytics, referrer suppression |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Id leakage via referrer | Information Disclosure | `<meta name="referrer" content="no-referrer">`, no external links in layout |
| Id leakage via analytics | Information Disclosure | `transformRequest` mask + drop-path whitelist |
| Id/title leakage via CI logs | Information Disclosure | count-only output, no `set -x`, step summary without ids |
| Contributor push becoming a publish path | Tampering/Elevation | no `src/content/drops`, explicit deny in `sync-content.sh` |
| Path traversal / injection in id, slug, filenames | Tampering | regex validation, no shell interpolation, `path.resolve` containment checks |
| PDF metadata/attachment leakage | Information Disclosure | qpdf rebuild + scrub + verification |
| Token over-privilege/lapse | Elevation/DoS | read-only on drops, expiry check 14 days ahead, documented renewal |
| Expiry bypass via manual edit | Tampering | horizon enforced at build |
| Withdrawn content retained (git, CDN, archives) | Information Disclosure | accepted, documented as unlisting only (D-03) |

## Sources

### Primary (HIGH confidence)
- Repo files read: `.github/workflows/{publish,deploy,content-sync}.yml`, `_scripts/{internal-pages,plausible,build-all,build-single,check-analytics-gate,sync-content}`, `_scripts/lib/{env,plausible-snippet}.mjs`, `_scripts/fixtures/analytics/{payloads,eval-snippet}.mjs`, `_scripts/verify-phase-10.sh`/`-12.sh`, `sites/sfdy/{astro.config.mjs,wiring.json,src/content.config.ts,src/layouts/Layout.astro,src/pages/404.astro,src/components/Footer.astro,src/data/internal.ts}`, `_core/src/content.config.ts`, `_core/astro.config.mjs`, `.claude/skills/{wm-publish,wm-preflight,wm-deploy}.md`, `docs/analytics.md`, Phase 12 summaries and context, CONTEXT/REQUIREMENTS/ROADMAP.
- Local spikes in the scratchpad (not in the repo): Astro injectRoute + custom loader build; qpdf strip/scrub/verify on a metadata-laden fixture.
- `gh auth status` (scopes only), `which`/`brew list` availability probes, `gh secret list` (names/dates only).

### Secondary (MEDIUM confidence)
- [Ubuntu noble qpdf package](https://packages.ubuntu.com/noble/qpdf): 11.9.0-1.1build1.
- [actions/runner-images Ubuntu 24.04 README](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md): no qpdf/exiftool listed (grep).
- [GitHub: disabling and enabling a workflow](https://docs.github.com/en/actions/using-workflows/disabling-and-enabling-a-workflow): 60-day schedule auto-disable in public repos.
- [GitHub: notifications for workflow runs](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/notifications-for-workflow-runs): scheduled-run notification recipient.
- [GitHub changelog: PAT expiration options](https://github.blog/changelog/2021-07-26-expiration-options-for-personal-access-tokens/): `GitHub-Authentication-Token-Expiration` header.
- [Plausible file download tracking](https://plausible.io/docs/file-downloads-tracking) and [custom event goals](https://plausible.io/docs/custom-event-goals).
- actions/checkout multi-repository private-repo usage (search results quoting the README).

### Tertiary (LOW confidence)
- PAT permission probing behaviour (A3), plan restrictions for goals (A2).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (no new deps; qpdf recipe tested)
- Architecture: MEDIUM-HIGH (build path spiked; dev-mode untested)
- Pitfalls: MEDIUM-HIGH
- CI/token specifics: MEDIUM (GitHub behaviour partly assumed)

**Research date:** 2026-10-14
**Valid until:** 2026-11-13 (workflow/runner details change; re-check runner image if `ubuntu-latest` moves)

## Project Constraints (from CLAUDE.md)
- WebsiteMocker is the sandbox: never the live production system; sandbox is public (noindex, no password), so confidential material must never be built into sandbox deploys.
- Production publishes go through `/wm-publish` -> `publish.yml` to the production repo's `gh-pages`; `gh-pages` is never hand-edited; contributor pushes never publish.
- Update `wiring.json` accurately; commit explicit paths only (`git add sites/<slug>/wiring.json`), push only when the operator asks; Claude commits only the finished site's files.
- Never copy or print vault values (`github::token_sfdy`); MarketingBridge vault is not to be read; the local `gh` login is the credential for operator-approved pushes.
- Parked ideas go to `PARKED.md`; blocking issues into site open points.
- Skills live in `.claude/skills/`; new skill `/wm-drop` must be added to the CLAUDE.md quick-reference table, as must the `drops` wiring key and the ownership-of-token note.
- Memory notes: execute runs in Codex and uses AGENTS.md (mirror CLAUDE.md edits there); do not expand the Parrot Capital holding page; no salaries in SFDY postings (irrelevant here).

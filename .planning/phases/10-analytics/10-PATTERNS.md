# Phase 10: Analytics - Pattern Map

**Mapped:** 2026-10-14
**Files analyzed:** 14 (5 new lib/script, 1 modified integration, 1 new page, 1 wiring, 4 docs/skills, 1 gitignore/dashboard conditional, fixtures)
**Analogs found:** 11 / 14

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `_scripts/plausible.mjs` (modify) | integration (build hook) | request-response (build-time) | itself (lines 21-61) | exact (extend in place) |
| `_scripts/lib/env.mjs` (new) | utility | transform | `_scripts/lib/design-lock.mjs` (pure lib, no root) | role-match |
| `_scripts/lib/plausible-snippet.mjs` (new) | utility | transform | `_scripts/lib/design-sanitise.mjs` / `design-lock.mjs` | role-match |
| `_scripts/check-analytics-gate.mjs` (new) | CLI script | file-I/O | `_scripts/fetch-perf-data.mjs` (root via `import.meta.url`, exit codes) | role-match |
| `_scripts/fetch-analytics-data.mjs` (new, conditional) | CLI script | request-response, file-I/O | `_scripts/fetch-perf-data.mjs` | exact |
| `_scripts/verify-phase-10.sh` (new) | test harness | batch | `_scripts/verify-phase-09.sh` | exact |
| `_scripts/fixtures/analytics/*` (new) | test fixtures | - | `_scripts/fixtures/design/` | role-match |
| `sites/sfdy-alt-clean-reskin-2/src/pages/404.astro` (new) | page | event-driven (browser) | `sites/sfdy-alt-clean-reskin-2/src/pages/imprint.astro` / `press.astro` (Layout use) | role-match |
| `sites/sfdy-alt-clean-reskin-2/wiring.json` (modify) | config | - | `design-pilot`/`levion`/`parrot-capital` `analytics` blocks | role-match |
| `.claude/skills/wm-wire.md` (lines 35-42) | skill doc | - | itself | exact |
| `.claude/skills/wm-preflight.md` (lines 25, 32), `wm-publish.md` step 2 | skill doc | - | itself | exact |
| `CLAUDE.md` "Analytics (Plausible)" section | doc | - | itself | exact |
| `.gitignore` (`_data/*/analytics.json`) + `src/pages/index.astro` tile (conditional) | config/component | CRUD (read) | `loadPerf` in `src/pages/index.astro` lines 7-18, 76 | exact |
| `.github/workflows/publish.yml` (gate step) | CI config | batch | existing publish.yml env block | role-match (not read in detail) |

## Pattern Assignments

### `_scripts/plausible.mjs` (modify; integration hook)

**Analog:** itself. Keep the single default export, hook name and early-return structure; replace the inline sandbox test and legacy emission with calls into `lib/`.

**Imports + exports to preserve** (lines 21-25). `SANDBOX_DOMAIN` must stay exported (re-export from `lib/env.mjs`):
```js
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export const SANDBOX_DOMAIN = 'pbau3r-sfdy.github.io';
```

**Hook gating pattern** (lines 31-41). Keep dev skip, wiring read from `config.root`, status gate:
```js
'astro:config:setup': ({ config, command, injectScript, logger }) => {
  if (command !== 'build') return;
  const file = join(fileURLToPath(config.root), 'wiring.json');
  if (!existsSync(file)) return;
  const wiring = JSON.parse(readFileSync(file, 'utf8'));
  const a = wiring.analytics ?? {};
  if (a.service !== 'plausible' || a.status !== 'configured') return;
  const sandbox = config.base.startsWith('/WebsiteMocker');   // REPLACE with isSandbox(config.base)
  if (sandbox && a.sandbox === false) return;
```

**Legacy emission to keep as fallback** (lines 43-57; queue stub + JSON.stringify-escaped loader; log line):
```js
const domain = sandbox ? SANDBOX_DOMAIN : (a.domain ?? wiring.domain ?? '').replace(/^www\./, '');
if (!domain) { logger.warn('analytics.service is plausible but no domain is set; skipping'); return; }
const src = `${(a.host ?? 'https://plausible.io').replace(/\/$/, '')}/js/script.js`;
injectScript('head-inline', [
  'window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)};',
  `(function(){var s=document.createElement('script');s.defer=true;s.dataset.domain=${JSON.stringify(domain)};s.src=${JSON.stringify(src)};document.head.appendChild(s)})();`,
].join(''));
logger.info(`Plausible → ${domain}${sandbox ? ' (sandbox)' : ''}`);
```
New behaviour (from RESEARCH Pattern 2): `scriptId` path emits `window.plausible.init=...` stub plus `pa-` loader plus `plausible.init({...,transformRequest})`; mismatches use `throw new Error(...)` (not `logger.warn`); `sandboxUsesProdId` emits `logger.warn` on every build. Interpolate only via `JSON.stringify`; validate `scriptId` with `^pa-[A-Za-z0-9_-]+$`.

---

### `_scripts/lib/env.mjs` and `_scripts/lib/plausible-snippet.mjs` (utility, transform)

**Analog:** `_scripts/lib/design-lock.mjs` (lines 1-30). Pure library, named exports, header doc comment, takes inputs as arguments and never computes a repo root.
```js
/**
 * design-lock.mjs: ... Library: takes `siteDir` as an argument and never computes a root itself.
 */
import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
export function hashContent(bufOrString) { ... }
export function readLock(siteDir) { ... }
```
Apply: `export const isSandbox = (base) => ...` (accept string or config, segment-boundary match), `export const SANDBOX_DOMAIN`, pure `resolveIdentity(wiring, {sandbox})`, `buildSnippet()`, and `SANITISE_SRC` string, so the harness imports them without Astro. Sanitiser sketch is in RESEARCH "Sanitiser (shared source string)".

---

### `_scripts/check-analytics-gate.mjs` (CLI, file-I/O)

**Analog:** `_scripts/fetch-perf-data.mjs`.

**Root + args + exit pattern** (lines 29-39, 105-115):
```js
const root     = join(fileURLToPath(import.meta.url), '..', '..');
const sitesDir = join(root, 'sites');
const only = process.argv[2] || null;
...
if (only && !slugs.length) {
  console.error(`\n✖  Site "${only}" not found in sites/.`);
  process.exit(1);
}
```
Apply: root from `import.meta.url` (never hardcode; honour `WM_ROOT` env like Phase 9 CLIs so the harness can point at a mktemp root), exit 1 on gate failure, glob `src/pages/privacy*.astro`, check `Plausible` + `Web analytics` heading and no "no analytics" statement. Gate only when `stage >= 5` or `domain` set.

---

### `_scripts/fetch-analytics-data.mjs` (conditional, ANLY-07; CLI, request-response + file-I/O)

**Analog:** `_scripts/fetch-perf-data.mjs`.

**Imports and constants** (lines 22-37):
```js
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
const root    = join(fileURLToPath(import.meta.url), '..', '..');
const dataDir = join(root, '_data');
const API_KEY = process.env.PSI_API_KEY || '';      // use PLAUSIBLE_API_KEY
```

**Fetch + error pattern** (lines 55-69):
```js
const res = await fetch(`${PSI_BASE}?${params}`, { signal: AbortSignal.timeout(90_000) });
if (!res.ok) {
  const body = await res.text().catch(() => '');
  throw new Error(`HTTP ${res.status} — ${body.slice(0, 300)}`);
}
return res.json();
```
Adapt to `POST https://plausible.io/api/v2/query` with `Authorization: Bearer`. Missing key: print skip message and `process.exit(0)` (perf script prints an info banner at lines 120-123 instead of failing). Writes `_data/<slug>/analytics.json` (aggregates only, dated `fetched`).

**Dashboard reader to mirror** (`src/pages/index.astro` lines 7-18, wired at line 76):
```js
function loadPerf(slug) {
  const perfPath = join(resolve('_data'), slug, 'perf.json');
  if (!existsSync(perfPath)) return null;
  try { ... } catch { return null; }
}
sites = sites.map(s => ({ ...s, _perf: loadPerf(s._slug) }));
```
Note: `.gitignore` has no `_data` entry (grep returned nothing); verify with `git check-ignore` and add `_data/*/analytics.json` before writing.

---

### `_scripts/verify-phase-10.sh` (test harness, batch)

**Analog:** `_scripts/verify-phase-09.sh`. Copy the header, `check/skip/want`, `mkroot`, `run`, `rcis`, `has` helpers verbatim (lines 1-62), changing section names and fixture dir.

**Harness skeleton** (lines 10-62):
```bash
set -euo pipefail
PASS=0; FAIL=0
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FX="$REPO/_scripts/fixtures/analytics"
TMPS=()
cleanup() { for d in "${TMPS[@]:-}"; do [ -n "$d" ] && rm -rf "$d"; done; return 0; }
trap cleanup EXIT
check() { local label="$1" result="$2"; if [ "$result" = "0" ]; then echo "  PASS  $label"; PASS=$((PASS + 1)); else echo "  FAIL  $label"; FAIL=$((FAIL + 1)); fi; }
skip() { echo "  SKIP  $1"; }
SECTION="${1:-all}"
want() { [ "$SECTION" = "all" ] || [ "$SECTION" = "$1" ]; }
mkroot() { T=$(mktemp -d); T=$(cd "$T" && pwd -P); TMPS+=("$T"); mkdir -p "$T/sites"; }
run() { if OUT=$("$@" 2>&1); then RC=0; else RC=$?; fi; }
rcis() { [ "$RC" = "$1" ] && echo 0 || echo 1; }
has() { printf '%s' "$OUT" | grep -qF -- "$1" && echo 0 || echo 1; }
```
Exit codes: 0 pass, 1 failures, 2 invalid argument (usage `case` at lines 36-39). Harness drives the integration by importing `plausible()` in a small `node -e`/driver file and calling `hooks['astro:config:setup']` with stub `{config:{root,base}, command:'build', injectScript, logger}` per fixture wiring. Cover every row of the RESEARCH resolution matrix.

---

### `sites/sfdy-alt-clean-reskin-2/src/pages/404.astro` (page, event-driven)

**Analog:** Layout from `sites/sfdy-alt-clean-reskin-2/src/layouts/Layout.astro` (props at lines 1-6 are only `title` and `description`; there is NO `noindex` prop, but line 33 already emits `<meta name="robots" content="noindex, nofollow" />` for every page, so do not pass `noindex`). Copy the import style from a sibling page (e.g. `imprint.astro`, read it for the exact Layout import and wrapper markup before writing).
```astro
---
import Layout from '../layouts/Layout.astro';
---
<Layout title="Page not found" description="Page not found">
  <h1>Page not found</h1>
</Layout>
<script is:inline>
  window.plausible && plausible('404', { props: { path: location.pathname } });
</script>
```
No `404.astro` exists in any site, so there is no in-repo analog for the page itself.

---

### `sites/sfdy-alt-clean-reskin-2/wiring.json` (config)

Currently has NO `analytics` key (keys: slug, name, accent, contact, stage, sandbox_url, newsletter, forms, socials, legal, brand...). Add the block from RESEARCH Pattern 2 as a sibling to `legal`. Existing sibling status style: `"status": "configured"`. Only this site (D-05); config already lists `integrations: [plausible()]` (`astro.config.mjs`, base `process.env.SITE_BASE || '/WebsiteMocker/sfdy-alt-clean-reskin-2'`), so no config change.

---

### Skill docs

- `.claude/skills/wm-wire.md` lines 35-42 ("### Analytics (Plausible)" bullet list: ask configure/skip/not needed; astro.config must list `plausible()`; optional keys `domain`, `sandbox:false`, `host`; privacy policy section; check `dist/index.html` for `dataset.domain`). Extend bullets with `scriptId`, `sandboxUsesProdId`, `events`, `sanitise`, `props`; change the last bullet to check for `plausible.init` / `pa-` in `dist/index.html`.
- `.claude/skills/wm-preflight.md` line 25 (analytics optional, `astro.config.mjs` lists `plausible()`) and line 32 (privacy names Plausible, no "no analytics" statement): turn line 32 into a FAIL item calling `node _scripts/check-analytics-gate.mjs <slug>`.
- `.claude/skills/wm-publish.md` step 2: add the same gate call.

## Shared Patterns

### Repo-root resolution
**Source:** `_scripts/fetch-perf-data.mjs` line 30 (`join(fileURLToPath(import.meta.url), '..', '..')`). Apply to `check-analytics-gate.mjs`, `fetch-analytics-data.mjs`. Libraries in `_scripts/lib/` take paths as arguments (`design-lock.mjs` convention).

### Safe interpolation into injected inline JS
**Source:** `_scripts/plausible.mjs` line 55 (`JSON.stringify(domain)`, `JSON.stringify(src)`). Apply to every value from wiring.json in the generated snippet.

### Queue stub
**Source:** `_scripts/plausible.mjs` line 54. Keep verbatim; add the `plausible.init` stub for the `pa-` path.

### Logging
**Source:** `_scripts/plausible.mjs` lines 47, 57: `logger.warn(...)` for skips and `logger.info(...)` for emission. Loud D-02 opt-in uses `logger.warn` every build; mismatches `throw new Error` (ANLY-03).

### CLI output and exit style
**Source:** `_scripts/fetch-perf-data.mjs` lines 105-123: `console.error('\n✖  ...')` plus `process.exit(1)` for hard errors; informational banner for optional missing config.

### Git hygiene (D-07)
Stage explicit paths only; do not touch reskin-2 `privacy-policy.astro` / `index.astro` (Phase 11.1 owns them); CLAUDE.md and several files are already modified in the working tree.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `404.astro` (any site) | page | event-driven | No 404 page exists in any site; use RESEARCH snippet |
| Browser sanitiser (`SANITISE_SRC`) | utility | transform | Nothing similar; use RESEARCH sketch (note `_scripts/lib/design-sanitise.mjs` exists but is for design content, not URLs; not read) |
| `check-analytics-gate.mjs` privacy check | CLI | file-I/O | No existing content-gate script besides `validate-brand.mjs` (not read); structure from fetch-perf-data |
| `publish.yml` gate step | CI | batch | Not read; planner should read `.github/workflows/publish.yml` before editing |

## Metadata

**Analog search scope:** `_scripts/`, `_scripts/lib/`, `_scripts/fixtures/`, `.claude/skills/`, `sites/sfdy-alt-clean-reskin-2/`, `src/pages/index.astro`
**Files read:** `_scripts/plausible.mjs`, `fetch-perf-data.mjs` (1-140), `verify-phase-09.sh` (1-70), `lib/design-lock.mjs` (1-30), reskin-2 `Layout.astro`, `astro.config.mjs`, `wiring.json`, `wm-wire.md` (28-48), grep of preflight/publish skills
**Pattern extraction date:** 2026-10-14

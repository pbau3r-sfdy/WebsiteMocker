# Analytics (Plausible)

## Overview

Cookie-free Plausible Analytics is provided by the Astro integration `_scripts/plausible.mjs`. It is off by default and switched on per site in `wiring.json`. Currently only `sfdy` is configured (D-05). The script id is public (D-01); no secrets belong in this document.

## wiring.json analytics keys

| Key | Type | Default | Meaning |
|---|---|---|---|
| `service` | string | none | `"plausible"` |
| `status` | string | none | `"configured"` switches analytics on |
| `scriptId` | string | none | Per-site tag id, `pa-...` |
| `domain` | string | `wiring.domain` without `www.` | Production Plausible site name |
| `host` | string | `https://plausible.io` | Self-hosted instance URL |
| `sandbox` | boolean | true | `false` skips tracking sandbox previews |
| `sandboxScriptId` | string | none | Separate Plausible script id for sandbox builds |
| `sandboxUsesProdId` | boolean | false | Debug opt-in: sandbox builds report to the production site (D-02) |
| `events.outboundLinks` | boolean | true | Outbound link tracking |
| `events.fileDownloads` | boolean | true | File download tracking |
| `events.formSubmissions` | boolean | true | Form submission tracking |
| `sanitise` | boolean | true with `scriptId` | Sanitised mode (see below) |
| `exclude` | string[] | none | Path prefixes whose events are dropped |
| `eventNames` | object | none | Map tracker event name to contract name |
| `props` | boolean | false | Send custom props `site` and `content_type` (Business plan only) |
| `statsApi` | object | none | Business plan only; used by `_scripts/fetch-analytics-data.mjs` (plan 10-03) |

ANLY-03 identity violations fail the build with `[plausible] ANLY-03:`.

## Build kinds

- **Production** (base `/`): reports to `scriptId`, or to `analytics.domain` (default `wiring.domain` without `www.`). The Astro `site` (SITE_URL) must be set and its hostname (without `www.`) must equal that domain, otherwise the build fails with ANLY-03.
- **Sandbox** (base `/WebsiteMocker/<slug>`): sites with a `scriptId` emit nothing unless `sandboxScriptId` or `sandboxUsesProdId` is set. Legacy sites without `scriptId` keep reporting to `pbau3r-sfdy.github.io` (documented exception).
- `astro dev` and localhost never report.

## Debug opt-in (D-02)

`analytics.sandboxUsesProdId: true` makes a sandbox build report into the production Plausible site (starflight-dynamics.com). Every such build prints a warning. Sandbox pageviews appear with paths `/WebsiteMocker/sfdy/...`; filter them with Page contains `/WebsiteMocker`.

Removal: done at the Phase 12 cutover (`analytics.sandboxUsesProdId` deleted from sites/sfdy/wiring.json). The Plausible hostname allowlist (Settings, Shields, Hostnames) is enabled for starflight-dynamics.com with `www.starflight-dynamics.com` and `starflight-dynamics.com` (2026-10-14), so the sandbox and any other host can no longer report into the production site. A site that gets a new domain or a separate sandbox Plausible site must add its hostname there.

## Event contract (ANLY-04)

| Event | Source | Props | Notes |
|---|---|---|---|
| `pageview` | automatic | none | Sanitised URL |
| `Outbound Link: Click` | init `outboundLinks` | `url` | Sanitised |
| `File Download` | init `fileDownloads` | `url` | Tracker built-in name, observed live and adopted (10-05) |
| `Form: Submission` | init `formSubmissions` | none | Tracker built-in name, observed live and adopted (10-05). web3forms posts cross-origin, so this event is best effort |
| `404` | manual call in the site's `404.astro`: `plausible('404', { props: { path: '/' + firstSegment } })` | `path` | Coarse: only the first path segment after the base (max 40 chars), never the full URL, then sanitised by `transformRequest` |
| `Drop Download` | `DropLayout` click hook on `a[data-drop-download]`: `plausible('Drop Download')` | none while `analytics.props` is false; `label` only when custom properties are on | Plain goal on drop pages; the built-in `File Download` for the same click is dropped by the transform, so a download counts once |

Custom props `site` and `content_type` (values: home, news, blog, announcements, press, drop, page) are sent only when `analytics.props` is true (Business plan, D-03). Otherwise no custom props are sent.

Observed tracker names (2026-10-14, live sandbox debug session): outbound = `Outbound Link: Click`, download = `File Download`, form = `Form: Submission`, 404 = `404`. Decision: ADOPT. ANLY-04 names amended by operator decision on 2026-10-14; no `analytics.eventNames` remap is configured. The `?token`/`#secret` stripping is verified by the fixture harness only, not live.

## Sanitised mode (ANLY-05)

Fragments are always stripped. With `sanitise` (default), query strings are dropped, path segments that look like identifiers become `_ID_` (32-hex, dashed UUIDs, 40+ character tokens, 24+ character mixed-case tokens containing a digit, and any segment containing `@`, also when percent-encoded), and props and referrer are scrubbed. `analytics.exclude` (array of paths starting with `/`) drops matching events: the site base (e.g. `/WebsiteMocker/<slug>`) is stripped, slashes and dot segments are collapsed, the path is percent-decoded and compared case-insensitively on a segment boundary (`/preview/` matches `/preview` and `/preview/x`, not `/previews`). Hash-based routing (hash-based URLs) is never used.

## Drop pages

Open Drops (`/d/<id>/`) are tracked through the same sanitised mode. A drop view is the masked pageview `/d/_ID_/`, so all drops aggregate into one path and the id never reaches Plausible. On a drop page the transform keeps only `pageview`, `Drop Download` and `404`; `File Download`, `Outbound Link: Click`, `Form: Submission` and any other event are dropped, because they would leak confidential file names and destinations. Expired or withdrawn ids load the 404 page and therefore count as a `/d/_ID_/` pageview PLUS a `404` event, so subtract `404` goal hits when reading drop views. Per-drop reporting by label is deferred until a Business-plan decision (custom properties are Business-plan only); the label path activates only when `analytics.props` is true, and with props false no label is rendered into the page or sent.

## Goals and props checklist (Plausible UI)

1. Confirm the site starflight-dynamics.com exists in Plausible (registered without `www.`).
2. After the first deployed pageview, confirm the dashboard detects the script.
3. Create custom-event goals with exact, case-sensitive names: `Outbound Link: Click`, `File Download`, `Form: Submission`, `404` (observed names, adopted), and for sites with Open Drops `Drop Download` (custom event, exact name; plan 11-06 gate G4). Reminder: delete any unused candidate goals (`Download`, `Form`) if they were created. Goals are not backfilled.
4. Business plan only: register custom props `site` and `content_type` and set `analytics.props` to true.
5. Sign the Plausible DPA.
6. Confirm the privacy policy has the "Web analytics" section (gate: `node _scripts/check-analytics-gate.mjs <slug> --live`).

## Open items

- **D-04 consent banner:** no banner is built because Plausible sets no cookies. The legal reviewer (Jonas Radtke) expects a banner; the operator must confirm the no-banner decision with him before go-live.
- **Business plan:** decision on props and the Stats API tile is "in due course".
- **Sandbox Plausible site:** a separate sandbox Plausible site is deferred.

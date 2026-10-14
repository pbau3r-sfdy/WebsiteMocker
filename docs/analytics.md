# Analytics (Plausible)

## Overview

Cookie-free Plausible Analytics is provided by the Astro integration `_scripts/plausible.mjs`. It is off by default and switched on per site in `wiring.json`. Currently only `sfdy-alt-clean-reskin-2` is configured (D-05). The script id is public (D-01); no secrets belong in this document.

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

- **Production** (base `/`): reports to `scriptId`, or to `analytics.domain` (default `wiring.domain` without `www.`).
- **Sandbox** (base `/WebsiteMocker/<slug>`): sites with a `scriptId` emit nothing unless `sandboxScriptId` or `sandboxUsesProdId` is set. Legacy sites without `scriptId` keep reporting to `pbau3r-sfdy.github.io` (documented exception).
- `astro dev` and localhost never report.

## Debug opt-in (D-02)

`analytics.sandboxUsesProdId: true` makes a sandbox build report into the production Plausible site (starflight-dynamics.com). Every such build prints a warning. Sandbox pageviews appear with paths `/WebsiteMocker/sfdy-alt-clean-reskin-2/...`; filter them with Page contains `/WebsiteMocker`.

Removal: At the Phase 12 cutover, delete analytics.sandboxUsesProdId from sites/sfdy-alt-clean-reskin-2/wiring.json, rebuild, and only then consider enabling a Plausible hostname allowlist (Shields) for starflight-dynamics.com.

## Event contract (ANLY-04)

| Event | Source | Props | Notes |
|---|---|---|---|
| `pageview` | automatic | none | Sanitised URL |
| `Outbound Link: Click` | init `outboundLinks` | `url` | Sanitised |
| `Download` | init `fileDownloads` | `url` | The tracker's built-in name is believed to be `File Download`; it is mapped to `Download` via `analytics.eventNames`, or the contract adopts the observed name (decided in plan 10-05 after network observation) |
| `Form` | init `formSubmissions` | none | Built-in name believed to be `Form: Submission`; same caveat. web3forms posts cross-origin, so this event is best effort |
| `404` | manual call in the site's `404.astro`: `plausible('404', { props: { path: location.pathname } })` | `path` | Path sanitised by `transformRequest` |

Custom props `site` and `content_type` (values: home, news, blog, announcements, press, drop, page) are sent only when `analytics.props` is true (Business plan, D-03). Otherwise no custom props are sent.

Observed tracker names: pending (10-05 debug session).

## Sanitised mode (ANLY-05)

Fragments are always stripped. With `sanitise` (default), query strings are dropped, 32-hex and 40+ character token segments become `_ID_`, and props and referrer are scrubbed. `analytics.exclude` drops matching events. Hash-based routing (hash-based URLs) is never used.

## Goals and props checklist (Plausible UI)

1. Confirm the site starflight-dynamics.com exists in Plausible (registered without `www.`).
2. After the first deployed pageview, confirm the dashboard detects the script.
3. Create custom-event goals with exact, case-sensitive names: `Download`, `Outbound Link: Click`, `Form`, `404` (or the observed names if the contract adopts them). Goals are not backfilled.
4. Business plan only: register custom props `site` and `content_type` and set `analytics.props` to true.
5. Sign the Plausible DPA.
6. Confirm the privacy policy has the "Web analytics" section (gate: `node _scripts/check-analytics-gate.mjs <slug> --live`).

## Open items

- **D-04 consent banner:** no banner is built because Plausible sets no cookies. The legal reviewer (Jonas Radtke) expects a banner; the operator must confirm the no-banner decision with him before go-live.
- **Business plan:** decision on props and the Stats API tile is "in due course".
- **Sandbox Plausible site:** a separate sandbox Plausible site is deferred.

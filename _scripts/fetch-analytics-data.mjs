#!/usr/bin/env node
/**
 * fetch-analytics-data.mjs — Plausible Stats API v2 aggregates (ANLY-07)
 *
 * Off by default (D-03): the Stats API needs the Plausible Business plan.
 * Runs only for sites whose wiring.json has
 *   "analytics": { "service": "plausible", "status": "configured", "statsApi": true }
 *
 * Writes AGGREGATES ONLY (visitors, pageviews, visits, bounce_rate,
 * visit_duration over 30 days) to _data/<slug>/analytics.json. No paths,
 * referrers, sources or other dimensions are requested.
 *
 * _data/*\/analytics.json is gitignored (see .gitignore); it must stay local.
 *
 * API key: PLAUSIBLE_API_KEY from the environment only (MarketingBridge vault
 * or a CI secret). Never commit it, write it to wiring.json or put it under
 * public/. The key is never printed. It is only sent to plausible.io, or to a
 * self-hosted analytics.host that is also set in PLAUSIBLE_HOST; redirects are refused.
 *
 * Usage:
 *   PLAUSIBLE_API_KEY=... node _scripts/fetch-analytics-data.mjs [slug]
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { hostOrigin } from './lib/plausible-snippet.mjs';

const root     = process.env.WM_ROOT || join(fileURLToPath(import.meta.url), '..', '..');
const sitesDir = join(root, 'sites');
const dataDir  = join(root, '_data');
const only     = process.argv[2] || null;

const METRICS = ['visitors', 'pageviews', 'visits', 'bounce_rate', 'visit_duration'];

const slugs = existsSync(sitesDir)
  ? readdirSync(sitesDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
  : [];

if (only) {
  if (!/^[a-z0-9-]+$/.test(only) || !slugs.includes(only)) {
    console.error(`\n✖  Site "${only}" not found in sites/.`);
    process.exit(1);
  }
}

function readWiring(slug) {
  try { return JSON.parse(readFileSync(join(sitesDir, slug, 'wiring.json'), 'utf8')); }
  catch { return null; }
}

const targets = (only ? [only] : slugs)
  .map(slug => ({ slug, wiring: readWiring(slug) }))
  .filter(({ wiring }) => {
    const a = wiring?.analytics;
    return a?.service === 'plausible' && a?.status === 'configured' && a?.statsApi === true;
  });

if (targets.length === 0) {
  console.log('Analytics tile: no site has analytics.statsApi=true (Business plan only, D-03); nothing fetched.');
  process.exit(0);
}

const KEY = process.env.PLAUSIBLE_API_KEY || '';
if (!KEY) {
  console.log('Analytics tile: PLAUSIBLE_API_KEY not set; skipped.');
  process.exit(0);
}

// The API key is sent to this host, so it is never taken from wiring.json alone: only
// plausible.io, or a self-hosted origin that is ALSO named in the PLAUSIBLE_HOST
// environment variable (WR-03).
const DEFAULT_HOST = 'https://plausible.io';
function resolveHost(a) {
  if (!a.host) return DEFAULT_HOST;
  const origin = hostOrigin(a.host);
  if (origin === DEFAULT_HOST) return origin;
  const allowed = process.env.PLAUSIBLE_HOST ? hostOrigin(process.env.PLAUSIBLE_HOST) : '';
  if (allowed !== origin) {
    throw new Error('analytics.host is not plausible.io and does not equal PLAUSIBLE_HOST; refusing to send the API key');
  }
  return origin;
}

let failed = false;

for (const { slug, wiring } of targets) {
  try {
    const a = wiring.analytics;
    const siteId = String(a.domain ?? wiring.domain ?? '').replace(/^www\./, '');
    if (!siteId) { console.log(`–  ${slug}: no domain, skipped.`); continue; }
    const host = resolveHost(a);

    const res = await fetch(`${host}/api/v2/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ site_id: siteId, metrics: METRICS, date_range: '30d' }),
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      // Status only: the response body is never printed.
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json();
    const m = json?.results?.[0]?.metrics;
    if (!Array.isArray(m)) throw new Error('unexpected response shape');

    const totals = {};
    METRICS.forEach((name, i) => { totals[name] = m[i] ?? null; });

    const out = {
      site_id: siteId,
      range: '30d',
      fetched: new Date().toISOString().slice(0, 10),
      approximate: true,
      totals,
    };
    mkdirSync(join(dataDir, slug), { recursive: true });
    writeFileSync(join(dataDir, slug, 'analytics.json'), JSON.stringify(out, null, 2) + '\n');
    console.log(`✔  ${slug}: ${totals.visitors} visitors, ${totals.pageviews} pageviews (30d)`);
  } catch (err) {
    failed = true;
    console.error(`✖  ${slug}: ${err.message}`);
  }
}

process.exit(failed ? 1 : 0);

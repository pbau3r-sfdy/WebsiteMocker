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
 * public/. The key is never printed.
 *
 * Usage:
 *   PLAUSIBLE_API_KEY=... node _scripts/fetch-analytics-data.mjs [slug]
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

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

function resolveHost(a) {
  if (!a.host) return 'https://plausible.io';
  let u;
  try { u = new URL(a.host); } catch { throw new Error('analytics.host is not a valid URL'); }
  if (u.protocol !== 'https:') throw new Error('analytics.host must be an https origin');
  return u.origin;
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
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} — ${text.slice(0, 300)}`);
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

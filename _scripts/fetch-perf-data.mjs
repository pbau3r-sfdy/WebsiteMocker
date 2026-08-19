#!/usr/bin/env node
/**
 * fetch-perf-data.mjs — fetch Google PageSpeed Insights for every site
 *
 * Writes _data/<slug>/perf.json, appending a dated snapshot each run.
 * History is capped at 90 entries (~3 months of daily runs).
 *
 * Usage:
 *   node _scripts/fetch-perf-data.mjs              # all sites
 *   node _scripts/fetch-perf-data.mjs <slug>       # one site
 *   PSI_API_KEY=xxx node _scripts/fetch-perf-data.mjs
 *
 * URL resolution order per site:
 *   1. wiring.json "psi_url"         – explicit override
 *   2. https://<domain>              – if stage 6 + domain set
 *   3. Sandbox GitHub Pages URL      – always available after any deploy
 *
 * Set PSI_API_KEY (free, Google Cloud Console) for higher rate limits.
 * Without a key the API still works but is throttled (~2 req/s per IP).
 */

import {
  readFileSync, writeFileSync, mkdirSync,
  existsSync, readdirSync,
} from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

// ── Paths ─────────────────────────────────────────────────────────────────────
const root     = join(fileURLToPath(import.meta.url), '..', '..');
const sitesDir = join(root, 'sites');
const dataDir  = join(root, '_data');

const PSI_BASE     = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const SANDBOX_BASE = 'https://pbau3r-sfdy.github.io/WebsiteMocker';
const API_KEY      = process.env.PSI_API_KEY || '';
const CATEGORIES   = ['performance', 'accessibility', 'seo', 'best-practices'];

const only = process.argv[2] || null;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve the URL to test for a given site. */
function resolveUrl(slug, wiring) {
  if (wiring.psi_url)                         return wiring.psi_url;
  if ((wiring.stage ?? 0) >= 6 && wiring.domain) return `https://${wiring.domain}`;
  return `${SANDBOX_BASE}/${slug}/`;
}

/** Call the PSI API for one URL + strategy. */
async function fetchPSI(url, strategy) {
  const params = new URLSearchParams({ url, strategy });
  CATEGORIES.forEach(c => params.append('category', c));
  if (API_KEY) params.set('key', API_KEY);

  const res = await fetch(`${PSI_BASE}?${params}`, {
    signal: AbortSignal.timeout(90_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} — ${body.slice(0, 300)}`);
  }
  return res.json();
}

/** Extract the numbers we care about from a PSI response. */
function extractScores(data) {
  const cats   = data.lighthouseResult?.categories ?? {};
  const audits = data.lighthouseResult?.audits      ?? {};

  const cat = (key) => Math.round((cats[key]?.score ?? 0) * 100);
  const av  = (key) => audits[key]?.displayValue ?? null;
  const an  = (key) => audits[key]?.numericValue  ?? null;

  return {
    performance:    cat('performance'),
    accessibility:  cat('accessibility'),
    seo:            cat('seo'),
    best_practices: cat('best-practices'),
    // Core Web Vitals (display strings + raw ms/unitless for thresholds)
    lcp:     av('largest-contentful-paint'),
    lcp_ms:  an('largest-contentful-paint'),
    cls:     av('cumulative-layout-shift'),
    cls_raw: an('cumulative-layout-shift'),
    fcp:     av('first-contentful-paint'),
    tbt:     av('total-blocking-time'),
  };
}

/** Classify a Core Web Vital as 'good' | 'needs-improvement' | 'poor'. */
function cwvStatus(key, raw) {
  if (raw === null) return null;
  if (key === 'lcp_ms') {
    return raw < 2500 ? 'good' : raw < 4000 ? 'needs-improvement' : 'poor';
  }
  if (key === 'cls_raw') {
    return raw < 0.1 ? 'good' : raw < 0.25 ? 'needs-improvement' : 'poor';
  }
  return null;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Main ──────────────────────────────────────────────────────────────────────

const allSlugs = existsSync(sitesDir)
  ? readdirSync(sitesDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
  : [];

const slugs = only
  ? allSlugs.filter(s => s === only)
  : allSlugs;

if (only && !slugs.length) {
  console.error(`\n✖  Site "${only}" not found in sites/.`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);

console.log(`\n${'─'.repeat(56)}`);
console.log(` PageSpeed Insights fetch — ${today}`);
console.log('─'.repeat(56));
if (!API_KEY) {
  console.log(' ℹ  PSI_API_KEY not set — unauthenticated (rate-limited).');
  console.log('    Get a free key: console.cloud.google.com → PageSpeed Insights API');
}
console.log('');

let ok = 0, skipped = 0, failed = 0;

for (const slug of slugs) {
  const wiringPath = join(sitesDir, slug, 'wiring.json');
  if (!existsSync(wiringPath)) { skipped++; continue; }

  let wiring;
  try   { wiring = JSON.parse(readFileSync(wiringPath, 'utf-8')); }
  catch { console.error(` ✖  ${slug}: bad wiring.json`); skipped++; continue; }

  const url = resolveUrl(slug, wiring);
  console.log(` ⟳  ${slug.padEnd(22)} ${url}`);

  try {
    // Mobile is most important (Google uses mobile-first indexing)
    const mobileRaw  = await fetchPSI(url, 'mobile');
    await sleep(600);
    const desktopRaw = await fetchPSI(url, 'desktop');

    const mobile  = extractScores(mobileRaw);
    const desktop = extractScores(desktopRaw);

    // Enrich with CWV status labels
    mobile.lcp_status  = cwvStatus('lcp_ms',  mobile.lcp_ms);
    mobile.cls_status  = cwvStatus('cls_raw', mobile.cls_raw);
    desktop.lcp_status = cwvStatus('lcp_ms',  desktop.lcp_ms);
    desktop.cls_status = cwvStatus('cls_raw', desktop.cls_raw);

    const entry = {
      date:       today,
      fetched_at: new Date().toISOString(),
      url,
      mobile,
      desktop,
    };

    // Load or init history file
    const slugDataDir = join(dataDir, slug);
    const perfPath    = join(slugDataDir, 'perf.json');
    let record = { slug, history: [] };
    if (existsSync(perfPath)) {
      try { record = JSON.parse(readFileSync(perfPath, 'utf-8')); } catch {}
    }

    // Upsert today's entry (re-run on same day replaces)
    const todayIdx = record.history.findIndex(h => h.date === today);
    if (todayIdx >= 0) record.history[todayIdx] = entry;
    else               record.history.push(entry);

    // Keep last 90 snapshots
    if (record.history.length > 90) record.history = record.history.slice(-90);

    mkdirSync(slugDataDir, { recursive: true });
    writeFileSync(perfPath, JSON.stringify(record, null, 2));

    const m = mobile;
    console.log(
      `     P${String(m.performance).padStart(3)}  ` +
      `A${String(m.accessibility).padStart(3)}  ` +
      `S${String(m.seo).padStart(3)}  ` +
      `B${String(m.best_practices).padStart(3)}  ` +
      `LCP ${m.lcp ?? '—'}  CLS ${m.cls ?? '—'}`
    );
    ok++;

  } catch (err) {
    console.error(`     ✖  ${err.message.slice(0, 120)}`);
    failed++;
  }

  // Polite pause between sites to avoid hammering the API
  if (slugs.indexOf(slug) < slugs.length - 1) await sleep(1500);
}

console.log(`\n${'─'.repeat(56)}`);
console.log(` ✓ ${ok} fetched  ⊘ ${skipped} skipped  ✖ ${failed} failed`);
console.log('─'.repeat(56));
if (failed > 0) process.exit(1);

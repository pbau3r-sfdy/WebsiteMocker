#!/usr/bin/env node
/**
 * archive-browse.mjs — Wayback Machine CDX snapshot browser
 *
 * Usage:
 *   node _scripts/archive-browse.mjs <slug|domain>
 *   node _scripts/archive-browse.mjs <slug> --capture <timestamp>
 *   node _scripts/archive-browse.mjs --sweep
 *   node _scripts/archive-browse.mjs <slug> --limit N
 */

import { execFileSync }                          from 'child_process';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join }                                  from 'path';
import { fileURLToPath }                         from 'url';

// ── Resolve repo root ──────────────────────────────────────────────────────────
const ROOT = join(fileURLToPath(import.meta.url), '..', '..');

// ── Log helpers ────────────────────────────────────────────────────────────────
const log  = (...a) => console.log(...a);
const info = (...a) => console.log(' ', ...a);
const ok   = (...a) => console.log(' ✓', ...a);
const warn = (...a) => console.log(' ⚠', ...a);
const fail = (...a) => { console.error(' ✖', ...a); process.exit(1); };

// ── CLI args ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

function flag(name) {
  const i = args.indexOf(name);
  if (i !== -1) { args.splice(i, 1); return true; }
  return false;
}
function option(name) {
  const i = args.indexOf(name);
  if (i !== -1 && args[i + 1]) { const v = args[i + 1]; args.splice(i, 2); return v; }
  return null;
}

const SWEEP   = flag('--sweep');
const CAPTURE = option('--capture');
const rawLimit = option('--limit');
const LIMIT    = rawLimit !== null ? parseInt(rawLimit, 10) : 100;
if (isNaN(LIMIT) || LIMIT < 1) {
  fail('--limit must be a positive integer');
}
const inputArg = args[0];

// ── readJSON ───────────────────────────────────────────────────────────────────
function readJSON(p) {
  try {
    return JSON.parse(readFileSync(p, 'utf-8'));
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    fail(`${p}: invalid JSON — ${e.message}`);
  }
}

// ── CDX fetch ──────────────────────────────────────────────────────────────────
async function fetchCDX(domain, limit) {
  const url = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}&output=json&limit=${limit}&fl=timestamp,statuscode`;
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  } catch {
    await new Promise(r => setTimeout(r, 2000));
    res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  }
  if (!res.ok) fail(`CDX API error ${res.status} for ${domain}`);
  const rows = await res.json();
  return rows.slice(1); // skip header row ["timestamp","statuscode"]
}

// ── Domain resolution ──────────────────────────────────────────────────────────
function resolveDomain(input) {
  // If input looks like a bare domain (contains a dot), validate and use directly
  if (input && input.includes('.')) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(input)) {
      fail('Invalid domain — only alphanumeric characters, dots, hyphens allowed');
    }
    return { domain: input, slug: null };
  }
  // Otherwise treat as slug — validate first to prevent shell injection
  if (!/^[a-z0-9-]+$/.test(input)) {
    fail('Usage: archive-browse.mjs <slug|domain> [--capture <timestamp>] [--limit N] [--sweep]');
  }
  const wiringPath = join(ROOT, 'sites', input, 'wiring.json');
  if (!existsSync(wiringPath)) {
    fail(`sites/${input}/wiring.json not found — check the slug or run /wm-new-site`);
  }
  const w = readJSON(wiringPath);
  if (!w?.domain) {
    fail(`domain not set in sites/${input}/wiring.json — update wiring.json first`);
  }
  return { domain: w.domain, slug: input };
}

// ── Timeline display ───────────────────────────────────────────────────────────
function printTimeline(domain, rows) {
  const byYear = {};
  for (const [ts] of rows) {
    const year = ts.slice(0, 4);
    (byYear[year] ??= []).push(ts);
  }
  for (const year of Object.keys(byYear).sort()) {
    const snaps = byYear[year];
    console.log(`\n── ${year} (${snaps.length} snapshots) ──`);
    for (const ts of snaps) {
      const dateLabel = `${ts.slice(0,4)}-${ts.slice(4,6)}-${ts.slice(6,8)} ${ts.slice(8,10)}:${ts.slice(10,12)}`;
      const ifUrl = `https://web.archive.org/web/${ts}if_/${domain}`;
      console.log(`  ${ts}  →  ${dateLabel}  ${ifUrl}`);
    }
  }
}

// ── Sweep mode ─────────────────────────────────────────────────────────────────
function getActiveSites() {
  const sitesDir = join(ROOT, 'sites');
  return readdirSync(sitesDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => {
      const w = readJSON(join(sitesDir, e.name, 'wiring.json'));
      return { slug: e.name, wiring: w };
    })
    .filter(({ wiring: w }) => w && !w.archived && !w.template && w.domain);
}

// ── Capture handoff ────────────────────────────────────────────────────────────
// Implemented inline in main() --capture branch below

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  // (1) --sweep mode: multi-domain coverage audit
  if (SWEEP) {
    const sites = getActiveSites();
    if (sites.length === 0) fail('No active domains found in sites/ — check wiring.json');

    console.log('\nWayback Archive Coverage');
    console.log('─'.repeat(70));

    for (const site of sites) {
      const domain = site.wiring.domain;
      const rows = await fetchCDX(domain, LIMIT);
      if (rows.length === 0) {
        console.log(`  ${domain.padEnd(40)}       0 snapshots   —`);
      } else {
        const count   = rows.length;
        const oldest  = rows[0][0];
        const newest  = rows[rows.length - 1][0];
        const fmtDate = ts =>
          `${ts.slice(0,4)}-${ts.slice(4,6)}-${ts.slice(6,8)} ${ts.slice(8,10)}:${ts.slice(10,12)}`;
        console.log(
          `  ${domain.padEnd(40)}  ${count.toString().padStart(5)} snapshots   ${fmtDate(oldest)} → ${fmtDate(newest)}`
        );
      }
    }
    return;
  }

  // (2) --capture early validation: reject invalid timestamp BEFORE any CDX fetch
  if (CAPTURE && !/^\d{14}$/.test(CAPTURE)) {
    fail('--capture value must be exactly 14 digits (YYYYMMDDHHmmss)');
  }

  if (!inputArg) {
    fail('Usage: archive-browse.mjs <slug|domain> [--capture <timestamp>] [--limit N]\n       archive-browse.mjs --sweep');
  }

  // (3) Resolve domain from slug or bare domain
  const { domain, slug } = resolveDomain(inputArg);

  // (4) Fetch CDX rows
  const rows = await fetchCDX(domain, LIMIT);
  if (rows.length === 0) fail(`No snapshots found for ${domain}`);

  // (5) Print timeline
  console.log(`\nArchive: ${domain}  (${rows.length} snapshots shown)`);
  printTimeline(domain, rows);

  if (rows.length === LIMIT) {
    console.log(`\nShowing ${LIMIT} of ≥${LIMIT} snapshots — use --limit N to increase`);
  }

  // (6) --capture: validate against CDX rows and hand off to capture-site.mjs
  if (CAPTURE) {
    const found = rows.some(([ts]) => ts === CAPTURE);
    if (!found) {
      fail(`Snapshot ${CAPTURE} not found for ${slug ?? domain}. Run without --capture to browse available snapshots.`);
    }
    const captureSlug = slug ? `${slug}-${CAPTURE}` : `archive-${CAPTURE}`;
    const ifUrl       = `https://web.archive.org/web/${CAPTURE}if_/${domain}`;
    console.log(`\n▶  node _scripts/capture-site.mjs "${ifUrl}" "${captureSlug}"`);
    execFileSync(
      process.execPath,
      ['_scripts/capture-site.mjs', ifUrl, captureSlug],
      { stdio: 'inherit', cwd: ROOT }
    );
    ok(`Design DNA written to _captures/${captureSlug}/`);
  }
}

main().catch(e => { console.error(' ✖', e.message); process.exit(1); });

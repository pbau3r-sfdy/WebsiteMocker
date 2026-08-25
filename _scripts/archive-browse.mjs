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

import { execSync }                              from 'child_process';
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
const LIMIT   = parseInt(option('--limit') ?? '100', 10);
const inputArg = args[0];

// ── readJSON ───────────────────────────────────────────────────────────────────
function readJSON(p) {
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; }
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
  // If input looks like a bare domain (contains a dot), use directly
  if (input && input.includes('.')) return { domain: input, slug: null };
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
  /* Task 2 */
}

// ── Capture handoff ────────────────────────────────────────────────────────────
// Implemented in Task 2 — --capture branch in main()

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  if (SWEEP) {
    /* Task 2 */
    return;
  }

  if (!inputArg) {
    fail('Usage: archive-browse.mjs <slug|domain> [--capture <timestamp>] [--limit N]\n       archive-browse.mjs --sweep');
  }

  const { domain, slug } = resolveDomain(inputArg);
  const rows = await fetchCDX(domain, LIMIT);
  if (rows.length === 0) fail(`No snapshots found for ${domain}`);

  console.log(`\nArchive: ${domain}  (${rows.length} snapshots shown)`);
  printTimeline(domain, rows);

  if (rows.length === LIMIT) {
    console.log(`\nShowing ${LIMIT} of ≥${LIMIT} snapshots — use --limit N to increase`);
  }

  if (CAPTURE) {
    /* Task 2 */
  }
}

main().catch(e => { console.error(' ✖', e.message); process.exit(1); });

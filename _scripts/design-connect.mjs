#!/usr/bin/env node
/**
 * design-connect.mjs: validate, write or remove a site's `design` block in
 * wiring.json (DSYNC-02).
 *
 * Usage:
 *   node _scripts/design-connect.mjs <slug> --check
 *   node _scripts/design-connect.mjs <slug> --source design-system --project-id <uuid> [--name "<n>"] [--globs a,b,c] [--dry-run]
 *   node _scripts/design-connect.mjs <slug> --source artifact --url <https-url> [--dry-run]
 *   node _scripts/design-connect.mjs <slug> --source local --path <p> [--dry-run]
 *   node _scripts/design-connect.mjs <slug> --remove
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { validateDesignBlock, DEFAULT_GLOBS } from './lib/design-block.mjs';
import { writeMarkers } from './lib/design-marker.mjs';

const ROOT = process.env.WM_ROOT ? resolve(process.env.WM_ROOT) : join(fileURLToPath(import.meta.url), '..', '..');

const log  = (...a) => console.log(...a);
const ok   = (...a) => console.log(' ✓', ...a);
const fail = (...a) => { console.error(' ✖', ...a); process.exit(1); };

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

const DRY_RUN = flag('--dry-run');
const CHECK   = flag('--check');
const REMOVE  = flag('--remove');
const source  = option('--source');
const projectId = option('--project-id');
const nameOpt = option('--name');
const globsOpt = option('--globs');
const urlOpt  = option('--url');
const pathOpt = option('--path');
const slug    = args[0];

const USAGE = 'Usage: node _scripts/design-connect.mjs <slug> (--check | --remove | --source design-system --project-id <uuid> [--name <n>] [--globs a,b] | --source artifact --url <https-url> | --source local --path <p>) [--dry-run]';

if (!slug || !/^[a-z0-9-]+$/.test(slug)) fail(USAGE);
const wiringPath = join(ROOT, 'sites', slug, 'wiring.json');
if (!existsSync(wiringPath)) fail(`sites/${slug}/wiring.json not found`);
const wiring = JSON.parse(readFileSync(wiringPath, 'utf8'));

function save() { writeFileSync(wiringPath, JSON.stringify(wiring, null, 2) + '\n'); }
function markers() {
  const paths = writeMarkers(ROOT, slug, { dryRun: false });
  for (const p of paths) log('  marker:', p);
}

if (CHECK) {
  if (wiring.design === undefined) { log('no design connection'); process.exit(0); }
  const { ok: valid, errors } = validateDesignBlock(wiring.design, { root: ROOT });
  if (!valid) { for (const e of errors) console.error(' ✖', e); process.exit(1); }
  ok(`design block OK (${wiring.design.source})`);
  process.exit(0);
}

if (REMOVE) {
  if (wiring.design === undefined) { log('no design connection'); process.exit(0); }
  if (DRY_RUN) { log('  [dry] would remove design block'); process.exit(0); }
  delete wiring.design;
  save();
  ok('design block removed');
  markers();
  process.exit(0);
}

if (!source) fail(USAGE);
const block = { source };
if (source === 'design-system') {
  if (projectId) block.project_id = projectId;
  if (nameOpt) block.name = nameOpt;
  if (globsOpt) {
    const g = globsOpt.split(',').map((s) => s.trim()).filter(Boolean);
    if (JSON.stringify(g) !== JSON.stringify(DEFAULT_GLOBS)) block.globs = g;
  }
} else if (source === 'artifact') {
  if (urlOpt) block.url = urlOpt;
} else if (source === 'local') {
  if (pathOpt) block.path = pathOpt;
}

const { ok: valid, errors } = validateDesignBlock(block, { root: ROOT });
if (!valid) { for (const e of errors) console.error(' ✖', e); process.exit(1); }
if (DRY_RUN) { log('  [dry] design block:', JSON.stringify(block, null, 2)); process.exit(0); }
wiring.design = block;
save();
ok(`design block written (${source})`);
markers();

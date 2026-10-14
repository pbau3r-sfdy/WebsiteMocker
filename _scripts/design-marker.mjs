#!/usr/bin/env node
/**
 * design-marker.mjs: regenerate sites/<slug>/DESIGN.md and root DESIGNER.md (SD-11).
 * Usage: node _scripts/design-marker.mjs <slug> [--dry-run]
 *        node _scripts/design-marker.mjs --all [--dry-run]
 */
import { readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { writeMarkers } from './lib/design-marker.mjs';

const ROOT = process.env.WM_ROOT ? resolve(process.env.WM_ROOT) : join(fileURLToPath(import.meta.url), '..', '..');
const fail = (...a) => { console.error(' ✖', ...a); process.exit(1); };

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); if (i !== -1) { args.splice(i, 1); return true; } return false; };
const DRY_RUN = flag('--dry-run');
const ALL = flag('--all');
const USAGE = 'Usage: node _scripts/design-marker.mjs (<slug> | --all) [--dry-run]';

let slugs;
if (ALL) {
  const d = join(ROOT, 'sites');
  slugs = existsSync(d) ? readdirSync(d).filter((s) => existsSync(join(d, s, 'wiring.json'))).sort() : [];
} else {
  const slug = args[0];
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) fail(USAGE);
  if (!existsSync(join(ROOT, 'sites', slug))) fail(`sites/${slug} not found`);
  slugs = [slug];
}
const seen = new Set();
for (const s of slugs) {
  for (const p of writeMarkers(ROOT, s, { dryRun: DRY_RUN })) {
    if (p === 'DESIGNER.md' && seen.has(p)) continue;
    seen.add(p);
    console.log(DRY_RUN ? '  [dry]' : '  wrote', p);
  }
}

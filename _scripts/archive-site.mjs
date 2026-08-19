#!/usr/bin/env node
/**
 * archive-site.mjs — permanently archive a site in its wiring.json
 *
 * Usage:
 *   node _scripts/archive-site.mjs <slug>
 *   node _scripts/archive-site.mjs <slug> "reason text"
 *
 * What it does:
 *   • Sets archived: true, archived_at: <today>, archive_reason: <reason>
 *   • Sets skip_ci: true so the site is excluded from builds
 *   • Writes wiring.json in place (commit + push separately)
 *
 * To undo:
 *   node _scripts/archive-site.mjs <slug> --restore
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const [slug, ...rest] = process.argv.slice(2);

if (!slug) {
  console.error('\nUsage: node _scripts/archive-site.mjs <slug> ["reason"]\n');
  process.exit(1);
}

const restore = rest[0] === '--restore';
const reason  = restore ? null : rest.join(' ') || null;

const wiringPath = join(resolve('sites'), slug, 'wiring.json');

if (!existsSync(wiringPath)) {
  console.error(`\n✖  No wiring.json found for "${slug}"\n`);
  process.exit(1);
}

let wiring;
try {
  wiring = JSON.parse(readFileSync(wiringPath, 'utf-8'));
} catch (e) {
  console.error(`\n✖  Could not parse wiring.json for "${slug}": ${e.message}\n`);
  process.exit(1);
}

if (restore) {
  delete wiring.archived;
  delete wiring.archived_at;
  delete wiring.archive_reason;
  // Leave skip_ci as-is — user can remove it manually if needed
  writeFileSync(wiringPath, JSON.stringify(wiring, null, 2) + '\n');
  console.log(`\n✓  ${slug} — archive flag removed from wiring.json`);
  console.log('   skip_ci was left unchanged — remove it manually if you want CI builds.\n');
} else {
  wiring.archived      = true;
  wiring.archived_at   = new Date().toISOString().slice(0, 10);
  if (reason) wiring.archive_reason = reason;
  wiring.skip_ci       = true;

  writeFileSync(wiringPath, JSON.stringify(wiring, null, 2) + '\n');
  console.log(`\n✓  ${slug} archived`);
  console.log(`   archived_at:    ${wiring.archived_at}`);
  if (reason) console.log(`   archive_reason: ${reason}`);
  console.log('\n   Commit and push to make permanent:\n');
  console.log(`   git add sites/${slug}/wiring.json`);
  console.log(`   git commit -m "chore: archive ${slug}"\n`);
}

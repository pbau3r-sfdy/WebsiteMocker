#!/usr/bin/env node
/**
 * delete-site.mjs — permanently delete a site from the repository
 *
 * Usage:
 *   node _scripts/delete-site.mjs <slug>
 *   node _scripts/delete-site.mjs <slug> --confirm
 *
 * What it removes:
 *   • sites/<slug>/          — all source files
 *   • _data/<slug>/          — performance history
 *   • _captures/<slug>/      — design capture (if present)
 *
 * Without --confirm the script prints a dry-run and exits.
 * Pass --confirm to actually delete.
 */

import { rmSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const [slug, flag] = process.argv.slice(2);
const confirmed = flag === '--confirm';

if (!slug) {
  console.error('\nUsage: node _scripts/delete-site.mjs <slug> [--confirm]\n');
  process.exit(1);
}

const root = resolve('.');
const targets = [
  join(root, 'sites',     slug),
  join(root, '_data',     slug),
  join(root, '_captures', slug),
].filter(existsSync);

if (targets.length === 0) {
  console.error(`\n✖  Nothing found for "${slug}" — check the slug.\n`);
  process.exit(1);
}

console.log(`\n${confirmed ? '⚠️  DELETING' : '  DRY RUN —'} "${slug}"\n`);
targets.forEach(p => console.log(`  ${confirmed ? '✗' : '→'} ${p.replace(root + '/', '')}`));

if (!confirmed) {
  console.log('\n  Run with --confirm to actually delete:\n');
  console.log(`  node _scripts/delete-site.mjs ${slug} --confirm\n`);
  process.exit(0);
}

targets.forEach(p => {
  rmSync(p, { recursive: true, force: true });
  console.log(`  ✓ removed ${p.replace(root + '/', '')}`);
});

console.log(`\n✓  ${slug} deleted.`);
console.log('  Commit and push:\n');
console.log(`  git add -A && git commit -m "chore: delete ${slug}"\n`);

#!/usr/bin/env node
/**
 * apply-triage.mjs — apply dashboard triage decisions to source files
 *
 * Generated automatically by the dashboard "Apply changes" button.
 *
 * Usage:
 *   node _scripts/apply-triage.mjs --archive <slug> ["reason"] --delete <slug> ...
 *
 * After running, commit with:
 *   git add -A && git commit -m "chore: apply dashboard triage"
 */

import { readFileSync, writeFileSync, existsSync, rmSync } from 'fs';
import { join, resolve } from 'path';

const root = resolve('.');
const args = process.argv.slice(2);

if (!args.length) {
  console.error(
    '\nUsage: node _scripts/apply-triage.mjs --archive <slug> [reason] --delete <slug>\n' +
    '\nOr just use the dashboard "Apply changes" button — it generates the command.\n'
  );
  process.exit(1);
}

// ── Parse args ────────────────────────────────────────────────────────────────
const toArchive = [];   // [{ slug, reason }]
const toDelete  = [];   // [slug]

let i = 0;
while (i < args.length) {
  const flag = args[i];
  if (flag === '--archive') {
    const slug   = args[++i] ?? '';
    const reason = (args[i + 1] && !args[i + 1].startsWith('--'))
      ? args[++i]
      : 'archived via dashboard triage';
    toArchive.push({ slug: slug.trim(), reason });
  } else if (flag === '--delete') {
    const slug = args[++i] ?? '';
    toDelete.push(slug.trim());
  } else {
    console.warn(`  ⚠  Unrecognised flag: ${flag}`);
  }
  i++;
}

const today = new Date().toISOString().slice(0, 10);
let changed = false;

console.log(`\n${'─'.repeat(56)}`);
console.log(` Dashboard triage — ${today}`);
console.log('─'.repeat(56));

// ── Archive ───────────────────────────────────────────────────────────────────
for (const { slug, reason } of toArchive) {
  const wiringPath = join(root, 'sites', slug, 'wiring.json');

  if (!existsSync(wiringPath)) {
    console.error(`  ✖  ${slug}: sites/${slug}/wiring.json not found`);
    continue;
  }

  let w;
  try   { w = JSON.parse(readFileSync(wiringPath, 'utf-8')); }
  catch { console.error(`  ✖  ${slug}: bad wiring.json`); continue; }

  if (w.archived) {
    console.log(`  ⊘  ${slug}: already archived — skipped`);
    continue;
  }

  w.archived       = true;
  w.archived_at    = today;
  w.archive_reason = reason || 'archived via dashboard triage';
  w.skip_ci        = true;

  writeFileSync(wiringPath, JSON.stringify(w, null, 2) + '\n');
  console.log(`  ✓  archived   ${slug}`);
  if (reason) console.log(`           reason: ${reason}`);
  changed = true;
}

// ── Delete ────────────────────────────────────────────────────────────────────
for (const slug of toDelete) {
  const targets = [
    join(root, 'sites',     slug),
    join(root, '_data',     slug),
    join(root, '_captures', slug),
  ].filter(existsSync);

  if (!targets.length) {
    console.log(`  ⊘  ${slug}: nothing found — maybe already deleted?`);
    continue;
  }

  targets.forEach(p => {
    rmSync(p, { recursive: true, force: true });
    console.log(`  ✓  deleted   ${p.replace(root + '/', '')}`);
  });
  changed = true;
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(56)}`);
if (!changed) {
  console.log(' No changes made.\n');
  process.exit(0);
}

console.log(' Done. Commit with:\n');
console.log('   git add -A && git commit -m "chore: apply dashboard triage"');
console.log('   git push\n');
console.log(' Then rebuild the sandbox:\n');
console.log('   npm run build\n');

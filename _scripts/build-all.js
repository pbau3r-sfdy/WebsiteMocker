#!/usr/bin/env node
/**
 * build-all.js — builds the dashboard + every site in sites/
 * Outputs combined dist/ at the repo root.
 *
 * Usage:
 *   node _scripts/build-all.js            # build everything
 *   node _scripts/build-all.js <slug>     # build only <slug> + dashboard
 *
 * Skip behaviour (evaluated in order, OR-combined):
 *   • sites/<slug>/wiring.json  "skip_ci": true   — always skipped in this script
 *   • SKIP_SITES=a,b,c env var                     — runtime override (e.g. CI flag)
 */

import { execSync }                from 'child_process';
import { readdirSync, existsSync,
         mkdirSync, cpSync,
         readFileSync }            from 'fs';
import { join }                    from 'path';
import { fileURLToPath }           from 'url';

// ── Paths (always relative to this script, not CWD) ─────────────
const root     = join(fileURLToPath(import.meta.url), '..', '..');
const sitesDir = join(root, 'sites');
const distDir  = join(root, 'dist');

const only    = process.argv[2] || null;
const skipEnv = new Set(
  (process.env.SKIP_SITES || '').split(',').map(s => s.trim()).filter(Boolean)
);

// ── Helpers ──────────────────────────────────────────────────────
function readWiring(siteDir) {
  try {
    return JSON.parse(readFileSync(join(siteDir, 'wiring.json'), 'utf-8'));
  } catch {
    return {};
  }
}

function shouldSkip(name, siteDir) {
  if (skipEnv.has(name)) return `SKIP_SITES env var`;
  const w = readWiring(siteDir);
  if (w.skip_ci === true) return `skip_ci: true in wiring.json`;
  return null;
}

const env = {
  ...process.env,
  PATH: `${join(root, 'node_modules', '.bin')}:${process.env.PATH}`,
};

function run(cmd, cwd, extraEnv = {}) {
  console.log(`\n▶ ${cmd}  [${cwd.replace(root, '.')}]`);
  execSync(cmd, {
    stdio: 'inherit',
    cwd,
    env: { ...env, ...extraEnv },
  });
}

function header(msg) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(` ${msg}`);
  console.log('─'.repeat(50));
}

// ── 1. Dashboard ─────────────────────────────────────────────────
header('Building dashboard…');
run('npm run build:dashboard', root);

// ── 2. Enumerate sites ───────────────────────────────────────────
const allSites = existsSync(sitesDir)
  ? readdirSync(sitesDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
  : [];

// Apply single-site filter first
const targeted = only ? allSites.filter(n => n === only) : allSites;

if (only && targeted.length === 0) {
  console.error(`\n✖ Error: site "${only}" not found in sites/. Aborting.`);
  process.exit(1);
}

// Partition into build / skip
const toSkip  = [];
const toBuild = [];
for (const name of targeted) {
  const reason = shouldSkip(name, join(sitesDir, name));
  if (reason) {
    toSkip.push({ name, reason });
  } else {
    toBuild.push(name);
  }
}

if (toSkip.length) {
  console.log('\nSkipping:');
  toSkip.forEach(({ name, reason }) => console.log(`  ⊘ ${name}  (${reason})`));
}

// ── 3. Build sites ───────────────────────────────────────────────
const failed  = [];
const succeeded = [];

for (const site of toBuild) {
  const siteDir  = join(sitesDir, site);
  const siteDist = join(siteDir, 'dist');
  const outDir   = join(distDir, 'WebsiteMocker', site);

  header(`Building site: ${site}`);

  try {
    const siteBin = join(siteDir, 'node_modules', '.bin');
    const siteEnv = {
      PATH: `${siteBin}:${join(root, 'node_modules', '.bin')}:${process.env.PATH}`,
    };
    run('npm run build', siteDir, siteEnv);

    // Guard: verify dist exists before copying
    if (!existsSync(siteDist)) {
      throw new Error(
        `Build reported success but dist/ was not created at ${siteDist}. ` +
        `Check for an outDir override in ${site}/astro.config.mjs.`
      );
    }

    mkdirSync(outDir, { recursive: true });
    cpSync(siteDist, outDir, { recursive: true });
    console.log(`✓ Copied ${site}/dist → dist/WebsiteMocker/${site}/`);
    succeeded.push(site);

  } catch (err) {
    console.error(`\n✖ FAILED: ${site}`);
    console.error(err.message || err);
    failed.push(site);
    // Continue building remaining sites — don't abort the whole run
  }
}

// ── 4. Summary ───────────────────────────────────────────────────
console.log(`\n${'═'.repeat(50)}`);
console.log(' Build summary');
console.log('═'.repeat(50));
console.log(`  Dashboard : dist/WebsiteMocker/`);
succeeded.forEach(s  => console.log(`  ✓ ${s.padEnd(18)} dist/WebsiteMocker/${s}/`));
toSkip.forEach(({ name }) => console.log(`  ⊘ ${name.padEnd(18)} skipped`));
failed.forEach(s    => console.log(`  ✖ ${s.padEnd(18)} FAILED`));

if (failed.length > 0) {
  console.error(`\n✖ ${failed.length} site(s) failed: ${failed.join(', ')}`);
  process.exit(1);
}

console.log('\n✅ Build complete.');

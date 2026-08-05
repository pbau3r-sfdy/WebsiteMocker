#!/usr/bin/env node
/**
 * build-all.js — builds the dashboard + every site in sites/
 * Outputs combined dist/ at the repo root.
 *
 * Usage: node _scripts/build-all.js [site-name]
 *   (no args = build everything; one arg = build only that site + dashboard)
 */

import { execSync }  from 'child_process';
import { readdirSync, existsSync, mkdirSync, cpSync } from 'fs';
import { join, resolve } from 'path';

const root     = resolve('.');
const sitesDir = join(root, 'sites');
const distDir  = join(root, 'dist');
const only     = process.argv[2] || null; // optional: build one site

// Add node_modules/.bin to PATH so `astro` resolves even when called directly
const env = {
  ...process.env,
  PATH: `${join(root, 'node_modules', '.bin')}:${process.env.PATH}`,
};

function run(cmd, cwd, extraEnv = {}) {
  console.log(`\n▶ ${cmd}  [${cwd}]`);
  execSync(cmd, {
    stdio: 'inherit',
    cwd,
    env: { ...env, ...extraEnv },
  });
}

// ── 1. Dashboard ──────────────────────────────────────────────
console.log('\n═══════════════════════════════════');
console.log(' Building dashboard…');
console.log('═══════════════════════════════════');
// Use npm run script so npm adds node_modules/.bin to PATH automatically
run('npm run build:dashboard', root);

// ── 2. Sites ──────────────────────────────────────────────────
const sites = existsSync(sitesDir)
  ? readdirSync(sitesDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .filter(name => !only || name === only)
  : [];

for (const site of sites) {
  const siteDir  = join(sitesDir, site);
  const siteDist = join(siteDir,  'dist');
  const outDir   = join(distDir,  site);

  console.log(`\n═══════════════════════════════════`);
  console.log(` Building site: ${site}…`);
  console.log('═══════════════════════════════════');

  // In workspace setup, node_modules are hoisted to root.
  // Pass root bin path so astro resolves correctly in site builds.
  const siteBin = join(siteDir, 'node_modules', '.bin');
  const siteEnv = {
    PATH: `${siteBin}:${join(root, 'node_modules', '.bin')}:${process.env.PATH}`,
  };
  run('npm run build', siteDir, siteEnv);

  // Copy site dist → root dist/site-name/
  mkdirSync(outDir, { recursive: true });
  cpSync(siteDist, outDir, { recursive: true });
  console.log(`✓ Copied ${site} dist → dist/${site}/`);
}

console.log('\n✅ Build complete.');
console.log(`   Dashboard : dist/`);
sites.forEach(s => console.log(`   ${s.padEnd(12)}: dist/${s}/`));

#!/usr/bin/env node
/**
 * import-site.mjs — import an Astro site from a .zip or a directory into WebsiteMocker.
 *
 * Usage:
 *   node _scripts/import-site.mjs <zip-or-dir> [options]
 *
 * Options:
 *   --slug <slug>       Override the slug (default: inferred from wiring.json or folder name)
 *   --donor <slug>      Site in sites/ to copy missing shared assets from (default: sfdy)
 *   --no-assets         Skip copying shared assets from the donor site
 *   --no-install        Skip `npm install` after import
 *   --no-build          Skip test build after import
 *   --dry-run           Show what would happen without making any changes
 *
 * What it does:
 *   1. Extracts the zip (or uses the directory as-is)
 *   2. Locates the Astro root (directory containing astro.config.mjs)
 *   3. Determines the slug from wiring.json, package.json, or the folder name
 *   4. Copies the site into sites/<slug>/
 *   5. Applies WebsiteMocker conventions:
 *        - astro.config.mjs env-var pattern (SITE_URL / SITE_BASE)
 *        - package.json name → @websitemocker/<slug>
 *        - Renames -slug-.astro → [slug].astro
 *        - Creates src/content/news/ if absent
 *   6. Copies missing shared assets from the donor site:
 *        fonts/, images/logo.png, images/partners/, favicon.png
 *   7. Runs npm install + test build
 */

import { execSync }                          from 'child_process';
import {
  existsSync, mkdirSync, cpSync, copyFileSync,
  readdirSync, readFileSync, writeFileSync,
  rmSync, renameSync,
} from 'fs';
import { join, basename, extname, dirname }  from 'path';
import { fileURLToPath }                     from 'url';
import { createWriteStream }                 from 'fs';
import { tmpdir }                            from 'os';

// ── Resolve repo root ────────────────────────────────────────────────────────
const ROOT = join(fileURLToPath(import.meta.url), '..', '..');

// ── CLI args ─────────────────────────────────────────────────────────────────
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

const DRY_RUN    = flag('--dry-run');
const NO_ASSETS  = flag('--no-assets');
const NO_INSTALL = flag('--no-install');
const NO_BUILD   = flag('--no-build');
const slugArg    = option('--slug');
const donor      = option('--donor') ?? 'sfdy';
const source     = args[0];

if (!source) {
  console.error('Usage: node _scripts/import-site.mjs <zip-or-dir> [--slug <slug>] [--donor <slug>] [--no-assets] [--no-install] [--no-build] [--dry-run]');
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const log   = (...a) => console.log(...a);
const info  = (...a) => console.log(' ', ...a);
const ok    = (...a) => console.log(' ✓', ...a);
const warn  = (...a) => console.log(' ⚠', ...a);
const fail  = (...a) => { console.error(' ✖', ...a); process.exit(1); };
const dry   = (...a) => DRY_RUN && console.log('  [dry]', ...a);

function run(cmd, cwd = ROOT) {
  if (DRY_RUN) { dry(`${cmd}  [${cwd.replace(ROOT, '.')}]`); return; }
  execSync(cmd, { stdio: 'inherit', cwd,
    env: { ...process.env, PATH: `${join(ROOT, 'node_modules', '.bin')}:${process.env.PATH}` } });
}

function readJSON(p) {
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; }
}

function writeJSON(p, obj) {
  if (DRY_RUN) { dry(`write ${p.replace(ROOT, '.')}`); return; }
  writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
}

// ── Step 1: Extract / locate source ─────────────────────────────────────────
log('\n── Step 1: Locating source');

let workDir; // the extracted or given directory
let tmpExtract = null;

if (!existsSync(source)) fail(`Source not found: ${source}`);

const isZip = extname(source).toLowerCase() === '.zip';

if (isZip) {
  tmpExtract = join(tmpdir(), `wm-import-${Date.now()}`);
  info(`Extracting ${basename(source)} → ${tmpExtract}`);
  if (!DRY_RUN) {
    mkdirSync(tmpExtract, { recursive: true });
    execSync(`unzip -q "${source}" -d "${tmpExtract}"`, { stdio: 'inherit' });
  }
  workDir = tmpExtract;
} else {
  workDir = source;
  info(`Using directory: ${workDir}`);
}

// ── Step 2: Find Astro root inside the extracted tree ───────────────────────
log('\n── Step 2: Finding Astro root (astro.config.mjs)');

function findAstroRoot(dir, depth = 0) {
  if (depth > 5) return null;
  if (existsSync(join(dir, 'astro.config.mjs'))) return dir;
  const entries = existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory())
    : [];
  for (const e of entries) {
    const found = findAstroRoot(join(dir, e.name), depth + 1);
    if (found) return found;
  }
  return null;
}

const astroRoot = DRY_RUN ? workDir : findAstroRoot(workDir);
if (!astroRoot && !DRY_RUN) fail('Could not find astro.config.mjs in the source. Is this an Astro site?');
ok(`Astro root: ${(astroRoot || workDir).replace(ROOT, '.')}`);

// ── Step 3: Determine slug ───────────────────────────────────────────────────
log('\n── Step 3: Determining slug');

let slug = slugArg;

if (!slug && !DRY_RUN) {
  // 1. wiring.json slug field
  const wiring = readJSON(join(astroRoot, 'wiring.json'));
  if (wiring?.slug) slug = wiring.slug;

  // 2. package.json name → strip @websitemocker/ prefix
  if (!slug) {
    const pkg = readJSON(join(astroRoot, 'package.json'));
    if (pkg?.name) slug = pkg.name.replace(/^@websitemocker\//, '');
  }

  // 3. Fall back to the Astro root folder name
  if (!slug) slug = basename(astroRoot);
}

if (!slug) fail('Could not determine slug. Pass --slug <slug>.');
ok(`Slug: ${slug}`);

// ── Step 4: Check destination ────────────────────────────────────────────────
log('\n── Step 4: Checking destination');

const dest = join(ROOT, 'sites', slug);
if (existsSync(dest)) fail(`sites/${slug} already exists. Choose a different slug with --slug, or remove the existing directory first.`);
info(`Will create: sites/${slug}/`);

// ── Step 5: Copy into sites/ ─────────────────────────────────────────────────
log('\n── Step 5: Copying site');
if (!DRY_RUN) {
  mkdirSync(dest, { recursive: true });
  cpSync(astroRoot, dest, { recursive: true });
  // Remove any leftover dist/ or node_modules/ from the source
  for (const dir of ['dist', 'node_modules', '.astro']) {
    const p = join(dest, dir);
    if (existsSync(p)) rmSync(p, { recursive: true, force: true });
  }
}
ok(`Copied → sites/${slug}/`);

// ── Step 6: Apply WebsiteMocker conventions ──────────────────────────────────
log('\n── Step 6: Applying WebsiteMocker conventions');

// 6a. astro.config.mjs — ensure env-var pattern
const configPath = join(dest, 'astro.config.mjs');
if (!DRY_RUN && existsSync(configPath)) {
  let cfg = readFileSync(configPath, 'utf-8');
  const hasEnvSite = cfg.includes('SITE_URL');
  const hasEnvBase = cfg.includes('SITE_BASE');
  if (!hasEnvSite || !hasEnvBase) {
    // Replace bare site/base with env-aware version
    cfg = cfg
      .replace(/site:\s*['"][^'"]+['"]/g,
        `site: process.env.SITE_URL || 'https://www.starflight-dynamics.com'`)
      .replace(/base:\s*['"][^'"]+['"]/g,
        `base: process.env.SITE_BASE || '/WebsiteMocker/${slug}'`);
    // If no base at all, inject before output:
    if (!cfg.includes('base:')) {
      cfg = cfg.replace(
        /defineConfig\(\s*\{/,
        `defineConfig({\n  site: process.env.SITE_URL || 'https://example.com',\n  base: process.env.SITE_BASE || '/WebsiteMocker/${slug}',`
      );
    }
    writeFileSync(configPath, cfg, 'utf-8');
    ok('astro.config.mjs patched to env-var pattern');
  } else {
    ok('astro.config.mjs already env-aware');
  }
} else {
  dry('patch astro.config.mjs');
}

// 6b. package.json — name
const pkgPath = join(dest, 'package.json');
if (!DRY_RUN && existsSync(pkgPath)) {
  const pkg = readJSON(pkgPath);
  if (pkg) {
    const expected = `@websitemocker/${slug}`;
    if (pkg.name !== expected) {
      pkg.name = expected;
      writeJSON(pkgPath, pkg);
      ok(`package.json name → ${expected}`);
    } else {
      ok('package.json name already correct');
    }
  }
} else {
  dry('patch package.json name');
}

// 6c. Rename -slug-.astro files → [slug].astro throughout pages/
function renameDynamicRoutes(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      renameDynamicRoutes(full);
    } else if (entry.isFile() && entry.name.match(/^-[^-]+-\.astro$/)) {
      // e.g. -slug-.astro → [slug].astro
      const paramName = entry.name.slice(1, -6); // strip leading - and trailing .astro, then trailing -
      const clean = paramName.replace(/-$/, '');
      const renamed = `[${clean}].astro`;
      if (!DRY_RUN) renameSync(full, join(dir, renamed));
      ok(`Renamed ${entry.name} → ${renamed}`);
    }
  }
}
const pagesDir = join(dest, 'src', 'pages');
if (!DRY_RUN) renameDynamicRoutes(pagesDir); else dry('rename -slug-.astro files');

// 6d. Create src/content/news/ if missing (prevents empty-collection crash)
const newsDir = join(dest, 'src', 'content', 'news');
if (!DRY_RUN && !existsSync(newsDir)) {
  mkdirSync(newsDir, { recursive: true });
  ok('Created src/content/news/ (empty — add posts with /wm-add-news)');
} else if (DRY_RUN) {
  dry('ensure src/content/news/ exists');
} else {
  ok('src/content/news/ already present');
}

// 6e. Ensure wiring.json has required fields
const wiringPath = join(dest, 'wiring.json');
if (!DRY_RUN) {
  const w = readJSON(wiringPath) ?? {};
  let changed = false;
  if (!w.slug)  { w.slug  = slug;  changed = true; }
  if (!w.stage) { w.stage = 1;     changed = true; } // Instantiated
  if (changed) { writeJSON(wiringPath, w); ok('wiring.json: set missing slug/stage'); }
  else { ok('wiring.json looks complete'); }
} else {
  dry('patch wiring.json');
}

// ── Step 7: Copy missing shared assets from donor ────────────────────────────
if (NO_ASSETS) {
  info('Skipping shared assets (--no-assets)');
} else {
  log(`\n── Step 7: Shared assets from sites/${donor}/`);

  const donorDir = join(ROOT, 'sites', donor);
  if (!existsSync(donorDir)) {
    warn(`Donor site "${donor}" not found — skipping asset copy. Pass --donor <slug> to specify another.`);
  } else {
    const assetsToCopy = [
      // [donor source, dest relative to site public/, description]
      ['public/favicon.png',            'public/favicon.png',            'favicon'],
      ['public/images/logo.png',        'public/images/logo.png',        'logo'],
      ['public/fonts',                  'public/fonts',                  'fonts/'],
      ['public/images/partners',        'public/images/partners',        'images/partners/'],
    ];

    for (const [donorRel, destRel, label] of assetsToCopy) {
      const donorPath = join(donorDir, donorRel);
      const destPath  = join(dest, destRel);
      if (!existsSync(donorPath)) {
        info(`  ${label}: not found in donor, skipping`);
        continue;
      }
      if (existsSync(destPath)) {
        info(`  ${label}: already present, skipping`);
        continue;
      }
      if (!DRY_RUN) {
        mkdirSync(dirname(destPath), { recursive: true });
        cpSync(donorPath, destPath, { recursive: true });
        ok(`${label} copied from sites/${donor}/`);
      } else {
        dry(`copy ${label} from sites/${donor}/`);
      }
    }
  }
}

// ── Step 8: npm install ──────────────────────────────────────────────────────
if (NO_INSTALL) {
  info('\nSkipping npm install (--no-install)');
} else {
  log('\n── Step 8: npm install');
  run('npm install', ROOT);
  ok('Dependencies installed');
}

// ── Step 9: Test build ───────────────────────────────────────────────────────
if (NO_BUILD) {
  info('\nSkipping test build (--no-build)');
} else {
  log(`\n── Step 9: Test build`);
  run(`node _scripts/build-all.js ${slug}`, ROOT);
  ok('Build passed');
}

// ── Cleanup temp extract dir ─────────────────────────────────────────────────
if (tmpExtract && existsSync(tmpExtract) && !DRY_RUN) {
  rmSync(tmpExtract, { recursive: true, force: true });
}

// ── Done ─────────────────────────────────────────────────────────────────────
log(`
${'═'.repeat(52)}
 ✅  sites/${slug} imported successfully.
${'═'.repeat(52)}

Next steps:
  cd sites/${slug} && npm run dev     ← preview locally
  /wm-add-news                        ← add news posts
  /wm-update-hero                     ← fill hero content
  /wm-wire                            ← connect forms / newsletter / socials
  /wm-deploy                          ← push to sandbox GitHub Pages
`);

#!/usr/bin/env node
/**
 * design-seed.mjs (DSYNC-11): build a seed bundle and the exact path list
 * for seeding / incrementally updating a Claude Design design-system project
 * from a site's brand.doc_tokens and logos.
 *
 * USAGE
 *   node _scripts/design-seed.mjs <slug> [--existing-listing <listing.json>]
 *        [--logo <repo-relative path under sites/<slug>/public/> ...]
 *        [--project-id <uuid>] [--name <project name>] [--dry-run]
 *
 * Output: _staging/design-seed/<slug>/files/** and plan.json
 *   { project: { id|null, name }, paths: [{ path, bytes, sha256, action }] }
 *
 * This script never talks to DesignSync and never deletes project paths.
 * Writes happen model-side only after the operator approves the exact list.
 * WM_ROOT overrides the repo root (fixtures).
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync } from 'fs';
import { join, resolve, relative, basename, isAbsolute } from 'path';
import { fileURLToPath } from 'url';
import { isUploadsPath } from './lib/design-block.mjs';
import { hashContent } from './lib/design-lock.mjs';

const ROOT = process.env.WM_ROOT ? resolve(process.env.WM_ROOT) : join(fileURLToPath(import.meta.url), '..', '..');

function fail(msg) { console.error(`design-seed: ${msg}`); process.exit(1); }

const argv = process.argv.slice(2);
const slug = argv[0] && !argv[0].startsWith('--') ? argv[0] : null;
if (!slug) fail('usage: design-seed.mjs <slug> [--existing-listing f] [--logo p ...] [--project-id id] [--name n] [--dry-run]');
const opts = { logos: [], dry: false, listing: null, projectId: null, name: null };
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--dry-run') opts.dry = true;
  else if (a === '--existing-listing') opts.listing = argv[++i];
  else if (a === '--logo') opts.logos.push(argv[++i]);
  else if (a === '--project-id') opts.projectId = argv[++i];
  else if (a === '--name') opts.name = argv[++i];
  else fail(`unknown argument ${a}`);
}
if (!/^[a-z0-9][a-z0-9-]*$/i.test(slug)) fail('invalid slug');

const siteDir = join(ROOT, 'sites', slug);
const wiringPath = join(siteDir, 'wiring.json');
if (!existsSync(wiringPath)) fail(`sites/${slug}/wiring.json not found`);
const wiring = JSON.parse(readFileSync(wiringPath, 'utf8'));
const tokens = wiring?.brand?.doc_tokens;
if (!tokens || typeof tokens !== 'object' || !Object.keys(tokens).length) fail('no brand.doc_tokens to seed');

const date = new Date().toISOString().slice(0, 10);
const css = `/* Seeded from WebsiteMocker site ${slug} on ${date}. */\n:root {\n`
  + Object.keys(tokens).sort().map((k) => `  ${k}: ${tokens[k]};`).join('\n') + '\n}\n';

const seed = new Map(); // project path -> Buffer
seed.set('tokens/colors.css', Buffer.from(css, 'utf8'));

const publicDir = join(siteDir, 'public');
function inside(dir, p) {
  const rel = relative(dir, p);
  return rel && !rel.startsWith('..') && !isAbsolute(rel);
}
for (const l of opts.logos) {
  const abs = resolve(ROOT, l);
  if (!inside(publicDir, abs)) fail(`logo must be inside sites/${slug}/public/: ${l}`);
  if (!existsSync(abs) || !statSync(abs).isFile()) fail(`logo not found: ${l}`);
  seed.set(`assets/logo/${basename(abs)}`, readFileSync(abs));
}
if (!opts.logos.length && existsSync(publicDir)) {
  const found = [];
  (function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/logo/i.test(e.name)) found.push(relative(ROOT, p));
    }
  })(publicDir);
  if (found.length) {
    console.log('Logo candidates (not copied; pass with --logo):');
    for (const f of found) console.log(`  ${f}`);
  }
}

let existing = new Set();
if (opts.listing) {
  const lp = resolve(opts.listing);
  if (!existsSync(lp)) fail(`listing not found: ${opts.listing}`);
  const arr = JSON.parse(readFileSync(lp, 'utf8'));
  if (!Array.isArray(arr)) fail('listing must be a JSON array of { path }');
  existing = new Set(arr.map((x) => (typeof x === 'string' ? x : x?.path)).filter(Boolean));
}

const paths = [];
for (const [p, buf] of [...seed.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  if (isUploadsPath(p) || p.split(/[\\/]/).includes('..')) fail(`refusing seed path ${p}`);
  paths.push({ path: p, bytes: buf.length, sha256: hashContent(buf), action: existing.has(p) ? 'update' : 'create' });
}

const plan = { project: { id: opts.projectId, name: opts.name ?? wiring.name ?? slug }, paths };

console.log(`Seed path list for ${slug} (project: ${plan.project.id ?? 'NEW'} "${plan.project.name}")`);
for (const p of paths) console.log(`  ${p.action.padEnd(6)} ${p.path}  ${p.bytes} bytes  sha256:${p.sha256.slice(0, 12)}`);
if (opts.dry) { console.log('(dry run, nothing written)'); process.exit(0); }

const outDir = join(ROOT, '_staging', 'design-seed', slug);
rmSync(outDir, { recursive: true, force: true }); // staging cleanup only
for (const [p, buf] of seed) {
  const dest = join(outDir, 'files', p);
  mkdirSync(join(dest, '..'), { recursive: true });
  writeFileSync(dest, buf);
}
writeFileSync(join(outDir, 'plan.json'), JSON.stringify(plan, null, 2) + '\n');
console.log(`Wrote _staging/design-seed/${slug}/plan.json`);

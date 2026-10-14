#!/usr/bin/env node
/**
 * design-ingest.mjs: staged design content -> sanitise -> render (JSX) -> section ingest (DSYNC-09).
 *
 * Usage: node _scripts/design-ingest.mjs <slug> [--sections a,b] [--accept A,B] [--dry-run]
 *
 * Reads  _staging/design/<slug>/files/        (written by the pull step)
 * Writes _staging/design/<slug>/rendered/     (JSX rendered to HTML)
 *        _staging/design/<slug>/sanitised/    (what ingest reads; DSYNC-08)
 *        _staging/design/<slug>/sanitise-report.json
 * Then calls ingest-artifact.mjs --mode section per section. The divergence guard
 * (hash vs design.lock.json, D-05/D-06) lives in ingest-artifact.mjs; exit code 3
 * from it means "skipped, hand-edited". Never writes src/pages/.
 *
 * Exit: 0 ok, 1 failure, 3 some components skipped because they were edited by hand.
 */
import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'fs';
import { dirname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import { readDesignBlock } from './lib/design-block.mjs';
import { sanitiseHtml } from './lib/design-sanitise.mjs';
import { renderComponent } from './lib/design-render.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.WM_ROOT ? resolve(process.env.WM_ROOT) : join(HERE, '..');
const INGEST = join(HERE, 'ingest-artifact.mjs');

const USAGE = 'Usage: node _scripts/design-ingest.mjs <slug> [--sections a,b] [--accept A,B] [--dry-run]';
const die = (m) => { console.error(' x ' + m); process.exit(1); };

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); if (i === -1) return false; args.splice(i, 1); return true; };
const option = (n) => { const i = args.indexOf(n); if (i === -1 || !args[i + 1]) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const DRY = flag('--dry-run');
const sectionsArg = option('--sections');
const acceptArg = option('--accept');
const slug = args[0];
if (!slug || !/^[a-z0-9-]+$/.test(slug)) die(USAGE);

const list = (s) => (s ?? '').split(',').map((x) => x.trim()).filter(Boolean);
const wanted = list(sectionsArg);
const pascal = (s) => s.split(/[-_\s]+/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[_\s]+/g, '-').toLowerCase();

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile()) out.push(p);
  }
  return out.sort();
}

const siteDir = join(ROOT, 'sites', slug);
if (!existsSync(siteDir)) die(`sites/${slug} not found`);
const stage = join(ROOT, '_staging', 'design', slug);
const files = join(stage, 'files');
if (!existsSync(files) || !statSync(files).isDirectory() || walk(files).length === 0) {
  die('nothing staged; run the pull first');
}

const { block, errors } = readDesignBlock(ROOT, slug);
if (errors.length) die(`invalid design block: ${errors.join('; ')}`);
const allowHosts = block?.allowHosts ?? [];

// 3. Candidates
const all = walk(files).map((p) => ({ abs: p, rel: relative(files, p).split('\\').join('/') }));
const designSystem = block?.source === 'design-system';
const htmlCands = all.filter((f) => f.rel.endsWith('.html') &&
  (!designSystem || /^(templates|ui_kits)\/website\//.test(f.rel)));
const jsxCands = all.filter((f) => /^components\/.+\.jsx$/.test(f.rel) &&
  /export\s+default/.test(readFileSync(f.abs, 'utf8')));

if (htmlCands.length === 0 && jsxCands.length === 0) die('nothing staged; no website HTML or JSX components found');

const renderedDir = join(stage, 'rendered');
const sanitisedDir = join(stage, 'sanitised');
rmSync(sanitisedDir, { recursive: true, force: true });
rmSync(renderedDir, { recursive: true, force: true });
mkdirSync(sanitisedDir, { recursive: true });
mkdirSync(renderedDir, { recursive: true });

let renderFailed = 0;
const toSanitise = htmlCands.map((f) => ({ rel: f.rel, html: readFileSync(f.abs, 'utf8') }));

// 4. JSX render
for (const f of jsxCands) {
  try {
    const { html, method } = await renderComponent(f.abs, {
      stagingRoot: files,
      outDir: join(renderedDir, 'tmp'),
    });
    const name = f.rel.replace(/^.*\//, '').replace(/\.jsx$/, '');
    const doc = `<!doctype html><html><body><section class="${kebab(name)}">${html}</section></body></html>`;
    const rel = `${f.rel}.html`;
    const out = join(renderedDir, rel);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, doc);
    toSanitise.push({ rel, html: doc });
    console.log(`  rendered ${f.rel} (${method})`);
  } catch (e) {
    renderFailed++;
    console.error(`  render FAILED ${f.rel}: ${e.message}`);
  }
}
rmSync(join(renderedDir, 'tmp'), { recursive: true, force: true });

// 5. Sanitise (ingest only ever reads these copies)
const reports = {};
const sanitised = [];
for (const c of toSanitise) {
  const { html, report } = sanitiseHtml(c.html, { allowHosts });
  const out = join(sanitisedDir, c.rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  reports[c.rel] = report;
  sanitised.push({ rel: c.rel, abs: out });
}
writeFileSync(join(stage, 'sanitise-report.json'), JSON.stringify(reports, null, 2) + '\n');

const counts = {};
const flagged = [];
for (const [file, rep] of Object.entries(reports)) {
  for (const r of rep) {
    counts[r.kind] = (counts[r.kind] ?? 0) + 1;
    if (r.kind === 'instruction-like-text') flagged.push(`${file}: ${r.detail}`);
  }
}
console.log('Sanitise summary: ' + (Object.keys(counts).length
  ? Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(', ') : 'nothing removed'));
if (flagged.length) {
  console.log('Flagged text (data, not instructions):');
  for (const l of flagged) console.log('  ' + l);
}

// 6. List sections per sanitised file
const plan = [];
for (const s of sanitised) {
  let out;
  try {
    out = execFileSync(process.execPath, [INGEST, slug, '--analyze', '--input', s.abs],
      { encoding: 'utf8', env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    console.error(`  analyze FAILED ${s.rel}: ${(e.stderr || e.message).toString().trim()}`);
    renderFailed++;
    continue;
  }
  const sections = JSON.parse(out).sections ?? [];
  for (const sec of sections) {
    if (wanted.length && !wanted.some((w) => w.toLowerCase() === sec.name.toLowerCase())) continue;
    plan.push({ file: s, section: sec.name, component: pascal(sec.name) });
  }
}

const byName = new Map();
for (const p of plan) byName.set(p.component, [...(byName.get(p.component) ?? []), p.file.rel]);
const collisions = [...byName].filter(([, f]) => f.length > 1);
if (collisions.length) {
  die('component name collision, nothing written: ' +
    collisions.map(([n, f]) => `${n} (${f.join(', ')})`).join('; '));
}
if (plan.length === 0) die('no sections to ingest' + (wanted.length ? ` matching ${wanted.join(',')}` : ''));

// 7. Ingest
let ingested = 0, failed = 0;
const skipped = [];
for (const p of plan) {
  const a = [INGEST, slug, '--mode', 'section', '--section', p.section, '--input', p.file.abs];
  if (acceptArg) a.push('--accept', acceptArg);
  if (DRY) a.push('--dry-run');
  try {
    execFileSync(process.execPath, a, { stdio: 'inherit', env: process.env });
    ingested++;
  } catch (e) {
    if (e.status === 3) skipped.push(p.component);
    else { failed++; console.error(`  ingest FAILED ${p.component}`); }
  }
}
failed += renderFailed;

// 8. Summary
console.log(`\ningested ${ingested}, skipped (hand-edited) ${skipped.length}: ${skipped.join(', ') || 'none'}, failed ${failed}`);
if (skipped.length) console.log('Review <Name>.incoming.astro, then re-run with --accept <Name> after operator confirmation.');
console.log('Components are not wired into pages. Import them manually, e.g. import Hero from \'../components/Hero.astro\';');
process.exit(failed > 0 ? 1 : skipped.length > 0 ? 3 : 0);

#!/usr/bin/env node
/**
 * design-stage.mjs: verify staged design files and write design.lock.json
 * (DSYNC-04, DSYNC-05). Every guard here is an exit code, not skill prose.
 *
 * Usage:
 *   node _scripts/design-stage.mjs <slug> [--dry-run]
 *     [--source-type design-system|artifact|local --source-id <id|url|path> --source-name <n>]
 *     [--from <file.zip|dir|file.html>] [--revision <r>]
 *
 * Staging layout (gitignored): _staging/design/<slug>/files/<source-relative path>
 *   optional files2/ (second relay copy, must match files/), listing.json
 *   [{ "path", "size" }], and _staging/design/inbox/ for operator export zips.
 *
 * Local/artifact sources import from --from, else the newest zip in the inbox.
 * Those imports write only into staging, so they also run under --dry-run.
 * If neither is available but files/ is already populated, those files are used.
 */
import {
  existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync,
  lstatSync, statSync, copyFileSync,
} from 'fs';
import { join, resolve, relative, dirname, isAbsolute, matchesGlob, sep, extname } from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import { parse as cssParse } from 'css-tree';
import { transform } from 'esbuild';
import { fromHtml } from 'hast-util-from-html';
import { readDesignBlock, isUploadsPath, DEFAULT_GLOBS } from './lib/design-block.mjs';
import { hashContent, readLock, writeLock, emptyLock, diffFiles } from './lib/design-lock.mjs';

const ROOT = process.env.WM_ROOT ? resolve(process.env.WM_ROOT) : join(fileURLToPath(import.meta.url), '..', '..');

const log  = (...a) => console.log(...a);
const info = (...a) => console.log(' ', ...a);
const ok   = (...a) => console.log(' ✓', ...a);
const warn = (...a) => console.log(' ⚠', ...a);
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

const DRY_RUN    = flag('--dry-run');
const srcType    = option('--source-type');
const srcId      = option('--source-id');
const srcName    = option('--source-name');
const fromArg    = option('--from');
const revisionArg = option('--revision');
const slug       = args[0];

const dry = (...a) => DRY_RUN && console.log('  [dry]', ...a);

const USAGE = 'Usage: node _scripts/design-stage.mjs <slug> [--dry-run] [--source-type design-system|artifact|local --source-id <id> --source-name <n>] [--from <file.zip|dir|file.html>] [--revision <r>]  (imports from --from or the inbox write only to staging, so they also run under --dry-run)';

// SD-01: Claude Design truncates at 256 KiB; abort at 262144 - 1024.
const SIZE_LIMIT = 262144 - 1024; // 261120

if (!slug || !/^[a-z0-9-]+$/.test(slug)) fail(USAGE);
const siteDir = join(ROOT, 'sites', slug);
if (!existsSync(siteDir)) fail(`sites/${slug} not found`);

// ── 1. Source ─────────────────────────────────────────────────────────────────
const { block, errors: blockErrors } = readDesignBlock(ROOT, slug);
if (blockErrors.length) { for (const e of blockErrors) console.error(' ✖', e); process.exit(1); }

let source;
if (block) {
  source = {
    type: block.source,
    id: block.project_id ?? block.url ?? block.path ?? null,
    name: block.name ?? null,
  };
} else if (srcType) {
  if (!['design-system', 'artifact', 'local'].includes(srcType)) fail(`unknown --source-type ${srcType}`);
  source = { type: srcType, id: srcId ?? null, name: srcName ?? null };
} else {
  fail('no design block and no --source-type: run _scripts/design-connect.mjs or pass --source-type/--source-id');
}

const stageRoot = join(ROOT, '_staging', 'design', slug);
const filesDir  = join(stageRoot, 'files');
const files2Dir = join(stageRoot, 'files2');
const inboxDir  = join(ROOT, '_staging', 'design', 'inbox');

// ── 2. Local import (SD-05) ───────────────────────────────────────────────────
function checkZip(zipPath) {
  let zip;
  try { zip = new AdmZip(zipPath); } catch (e) { fail(`cannot read zip ${zipPath}: ${e.message}`); }
  const entries = zip.getEntries();
  for (const e of entries) {
    const names = new Set([e.entryName, e.rawEntryName.toString('utf8')]);
    for (const name of names) {
      const norm = name.replace(/\\/g, '/');
      if (norm.startsWith('/') || /^[A-Za-z]:/.test(norm)) fail(`zip entry has absolute name: ${name}`);
      if (norm.split('/').includes('..')) fail(`zip entry escapes target (zip-slip): ${name}`);
      const target = resolve(filesDir, norm);
      if (target !== filesDir && !target.startsWith(filesDir + sep)) fail(`zip entry resolves outside staging: ${name}`);
    }
    if (((e.header.attr >>> 16) & 0o170000) === 0o120000) fail(`zip entry is a symlink: ${e.entryName}`);
    if (!e.isDirectory && e.header.size >= SIZE_LIMIT) {
      fail(`zip entry too large (${e.header.size} >= ${SIZE_LIMIT}): ${e.entryName}`);
    }
  }
  return zip;
}

function copyDirChecked(src, dest) {
  for (const name of readdirSync(src)) {
    const s = join(src, name);
    const st = lstatSync(s);
    if (st.isSymbolicLink()) fail(`symlink in export directory: ${s}`);
    if (st.isDirectory()) { mkdirSync(join(dest, name), { recursive: true }); copyDirChecked(s, join(dest, name)); }
    else if (st.isFile()) { mkdirSync(dest, { recursive: true }); copyFileSync(s, join(dest, name)); }
  }
}

function hasStagedFiles() {
  return existsSync(filesDir) && readdirSync(filesDir).length > 0;
}

if (source.type === 'local' || source.type === 'artifact') {
  let input = fromArg ? resolve(fromArg) : null;
  if (!input) {
    const zips = existsSync(inboxDir)
      ? readdirSync(inboxDir).filter((n) => n.toLowerCase().endsWith('.zip'))
          .map((n) => ({ n, m: statSync(join(inboxDir, n)).mtimeMs }))
          .sort((a, b) => b.m - a.m || a.n.localeCompare(b.n))
      : [];
    if (zips.length) {
      input = join(inboxDir, zips[0].n);
      info(`using inbox zip: ${zips[0].n}`);
    } else if (!hasStagedFiles()) {
      fail('drop the export zip into _staging/design/inbox/ or pass --from');
    } else {
      info('using already staged files');
    }
  }
  if (input) {
    if (!existsSync(input)) fail(`--from not found: ${input}`);
    const st = lstatSync(input);
    if (st.isSymbolicLink()) fail(`--from is a symlink: ${input}`);
    if (st.isDirectory()) {
      rmSync(filesDir, { recursive: true, force: true });
      mkdirSync(filesDir, { recursive: true });
      copyDirChecked(input, filesDir);
    } else if (input.toLowerCase().endsWith('.zip')) {
      const zip = checkZip(input); // every entry checked before anything is extracted
      rmSync(filesDir, { recursive: true, force: true });
      mkdirSync(filesDir, { recursive: true });
      zip.extractAllTo(filesDir, true);
    } else if (/\.html?$/i.test(input)) {
      rmSync(filesDir, { recursive: true, force: true });
      mkdirSync(filesDir, { recursive: true });
      copyFileSync(input, join(filesDir, 'index.html'));
    } else {
      fail(`--from must be a .zip, .html file or directory: ${input}`);
    }
  }
}

if (!hasStagedFiles()) fail(`nothing staged in ${relative(ROOT, filesDir)}`);

// ── 3. Walk staged files ──────────────────────────────────────────────────────
function walk(dir, base, out) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const rel = relative(base, abs).split(sep).join('/');
    const st = lstatSync(abs);
    if (st.isSymbolicLink()) fail(`symlink in staging: ${rel}`);
    if (isUploadsPath(rel)) fail('refused: uploads/ is never pulled (D-02)');
    if (st.isDirectory()) walk(abs, base, out);
    else if (st.isFile()) out.push(rel);
  }
  return out;
}
const staged = walk(filesDir, filesDir, []).sort();

// SD-01: second relay copy must match the first.
if (existsSync(files2Dir)) {
  const staged2 = walk(files2Dir, files2Dir, []).sort();
  if (JSON.stringify(staged) !== JSON.stringify(staged2)) {
    fail('relay mismatch: files/ and files2/ list different paths (SD-01)');
  }
  for (const rel of staged) {
    if (hashContent(readFileSync(join(filesDir, rel))) !== hashContent(readFileSync(join(files2Dir, rel)))) {
      fail(`relay mismatch: ${rel} differs between the two relay copies (SD-01)`);
    }
  }
}

// ── 4. Glob filter ────────────────────────────────────────────────────────────
let globs = null;
if (source.type === 'design-system') globs = block?.globs ?? DEFAULT_GLOBS;
else if (block?.globs) globs = block.globs;

const kept = [];
for (const rel of staged) {
  if (globs && !globs.some((g) => matchesGlob(rel, g))) { info(`ignored (outside globs): ${rel}`); continue; }
  kept.push(rel);
}

// ── 5. Size rule ──────────────────────────────────────────────────────────────
let listing = [];
const listingPath = join(stageRoot, 'listing.json');
if (existsSync(listingPath)) {
  try { listing = JSON.parse(readFileSync(listingPath, 'utf8')); } catch (e) { fail(`listing.json unreadable: ${e.message}`); }
}
const listed = new Map(listing.filter((l) => l && typeof l.path === 'string').map((l) => [l.path, l.size]));
const buffers = new Map();
for (const rel of kept) {
  const buf = readFileSync(join(filesDir, rel));
  buffers.set(rel, buf);
  if (buf.length >= SIZE_LIMIT) fail(`${rel} is ${buf.length} bytes, at or above ${SIZE_LIMIT}: likely truncated at the 256 KiB cap`);
  const ls = listed.get(rel);
  if (typeof ls === 'number' && ls !== buf.length) fail(`${rel}: listing says ${ls} bytes, staged ${buf.length}`);
}

// ── 6. Syntax checks (async, before any write) ────────────────────────────────
const isBinary = (buf) => buf.subarray(0, 8000).includes(0);
const nextFiles = {};
for (const rel of kept) {
  const buf = buffers.get(rel);
  if (isBinary(buf)) { info(`skipped, binary: ${rel} (place manually, SD-02)`); continue; }
  const src = buf.toString('utf8');
  const ext = extname(rel).toLowerCase();
  if (ext === '.css') {
    let bad = null;
    cssParse(src, { onParseError: (e) => { bad ??= e.message; } });
    // css-tree recovers silently from EOF inside a block: check balance ourselves.
    const bare = src.replace(/\/\*[\s\S]*?(\*\/|$)/g, '').replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, '""');
    const open = (bare.match(/\{/g) ?? []).length, close = (bare.match(/\}/g) ?? []).length;
    const po = (bare.match(/\(/g) ?? []).length, pc = (bare.match(/\)/g) ?? []).length;
    if (!bad && (open !== close || po !== pc || /\/\*(?![\s\S]*\*\/)/.test(src))) bad = 'unbalanced braces, parentheses or unterminated comment (truncated?)';
    if (bad) fail(`invalid CSS in ${rel}: ${bad}`);
  } else if (['.jsx', '.tsx', '.js', '.mjs'].includes(ext)) {
    const loader = ext === '.tsx' ? 'tsx' : ext === '.mjs' ? 'js' : 'jsx';
    try { await transform(src, { loader }); } catch (e) { fail(`invalid ${ext.slice(1).toUpperCase()} in ${rel}: ${String(e.message).split('\n')[0]}`); }
  } else if (ext === '.html' || ext === '.htm') {
    let bad = null;
    fromHtml(src, { onerror: (m) => { if (/^eof-/.test(m.reason ?? '') || /^eof-/.test(m.ruleId ?? '')) bad ??= m.reason; } });
    if (bad) fail(`truncated HTML in ${rel}: ${bad}`);
  }
  nextFiles[rel] = { sha256: hashContent(buf), bytes: buf.length };
}

// ── 7. Diff ───────────────────────────────────────────────────────────────────
const prevLock = readLock(siteDir);
const diff = diffFiles(prevLock?.files ?? {}, nextFiles);
log(`added ${diff.added.length}, changed ${diff.changed.length}, removed ${diff.removed.length}, unchanged ${diff.unchanged.length}`);
for (const p of diff.added) log(`  + ${p}`);
for (const p of diff.changed) log(`  ~ ${p}`);
for (const p of diff.removed) log(`  - ${p}`);

// ── 8. Write ──────────────────────────────────────────────────────────────────
if (DRY_RUN) { dry('design.lock.json not written'); process.exit(0); }

const lock = prevLock ?? emptyLock(source);
const changedSomething = !prevLock || diff.added.length || diff.changed.length || diff.removed.length;
lock.source = source;
lock.files = nextFiles;
lock.revision = revisionArg ?? lock.revision ?? null;
if (changedSomething) lock.pulledAt = new Date().toISOString();
writeLock(siteDir, lock);
ok(`design.lock.json written (${Object.keys(nextFiles).length} files)`);

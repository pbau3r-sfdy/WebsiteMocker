#!/usr/bin/env node
/**
 * design-tokens.mjs - map design tokens into wiring.json brand.doc_tokens (DSYNC-07).
 *
 * Usage: node _scripts/design-tokens.mjs <slug> [--input <file.css|file.html|dir>] [--dry-run]
 *
 * - Default input: _staging/design/<slug>/files/tokens/ (all .css, sorted).
 * - Writes ONLY brand.doc_tokens in sites/<slug>/wiring.json (D-07).
 * - Writes _staging/design/<slug>/tokens-report.json and, when Layout.astro :root values
 *   differ for mapped keys, layout-tokens.proposal.diff. Layout.astro is never edited.
 * - Effective map = global _scripts/design-token-map.json merged with wiring.design.tokenMap
 *   (site wins; null excludes a token).
 *
 * Environment:
 *   WM_ROOT        repo root override (default: repo root of this script)
 *   WM_TOKEN_MAP   path to a token map JSON that replaces the default global map (tests)
 *
 * Exit 0 with unmapped tokens present; exit 1 on CSS parse error, missing input or invalid tokenMap.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'fs';
import { resolve, join, extname } from 'path';
import { fileURLToPath } from 'url';
import * as csstree from 'css-tree';
import { fromHtml } from 'hast-util-from-html';

const ROOT = process.env.WM_ROOT
  ? resolve(process.env.WM_ROOT)
  : join(fileURLToPath(import.meta.url), '..', '..');

const NAME_RE = /^--[a-z0-9-]+$/;
const MAX_DEPTH = 10;

function die(msg) {
  console.error(`design-tokens: ${msg}`);
  process.exit(1);
}

// ---- args ----
const argv = process.argv.slice(2);
let slug = null;
let inputArg = null;
let dryRun = false;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--input') inputArg = argv[++i];
  else if (argv[i] === '--dry-run') dryRun = true;
  else if (!slug && !argv[i].startsWith('--')) slug = argv[i];
  else die(`unknown argument ${argv[i]}`);
}
if (!slug) die('usage: design-tokens.mjs <slug> [--input <file|dir>] [--dry-run]');

// ---- maps ----
function validateMapShape(map, label) {
  if (!map || typeof map !== 'object' || Array.isArray(map)) die(`${label} must be an object`);
  for (const [k, v] of Object.entries(map)) {
    if (!NAME_RE.test(k)) die(`${label}: invalid token name "${k}"`);
    if (v !== null && (typeof v !== 'string' || !NAME_RE.test(v))) {
      die(`${label}: invalid target for "${k}" (expected "--name" or null)`);
    }
  }
}

const mapPath = process.env.WM_TOKEN_MAP
  ? resolve(process.env.WM_TOKEN_MAP)
  : join(ROOT, '_scripts', 'design-token-map.json');
// Fall back to the script's own map when WM_ROOT points at a temp tree without one.
const effectiveMapPath = existsSync(mapPath)
  ? mapPath
  : join(fileURLToPath(import.meta.url), '..', 'design-token-map.json');
let globalMap;
try {
  globalMap = JSON.parse(readFileSync(effectiveMapPath, 'utf8')).map;
} catch (e) {
  die(`cannot read token map ${effectiveMapPath}: ${e.message}`);
}
validateMapShape(globalMap, 'global token map');

const wiringPath = join(ROOT, 'sites', slug, 'wiring.json');
if (!existsSync(wiringPath)) die(`missing ${wiringPath}`);
const wiringRaw = readFileSync(wiringPath, 'utf8');
let wiring;
try {
  wiring = JSON.parse(wiringRaw);
} catch (e) {
  die(`wiring.json is not valid JSON: ${e.message}`);
}
const siteMap = wiring.design?.tokenMap ?? {};
validateMapShape(siteMap, 'design.tokenMap');
const effectiveMap = { ...globalMap, ...siteMap };

// ---- input ----
const stageDir = join(ROOT, '_staging', 'design', slug);
const inputPath = inputArg ? resolve(inputArg) : join(stageDir, 'files', 'tokens');
if (!existsSync(inputPath)) die(`input not found: ${inputPath}`);

function htmlStyleText(html) {
  const out = [];
  const visit = (n) => {
    if (n.type === 'element' && n.tagName === 'style') {
      out.push((n.children || []).map((c) => c.value || '').join(''));
    }
    for (const c of n.children || []) visit(c);
  };
  visit(fromHtml(html));
  return out.join('\n');
}

function readCssFile(file) {
  const text = readFileSync(file, 'utf8');
  return extname(file).toLowerCase() === '.html' || extname(file).toLowerCase() === '.htm'
    ? htmlStyleText(text)
    : text;
}

const cssSources = [];
if (statSync(inputPath).isDirectory()) {
  const files = readdirSync(inputPath).filter((f) => f.toLowerCase().endsWith('.css')).sort();
  if (files.length === 0) die(`no .css files in ${inputPath}`);
  for (const f of files) cssSources.push({ file: f, css: readCssFile(join(inputPath, f)) });
} else {
  cssSources.push({ file: inputPath, css: readCssFile(inputPath) });
}

// ---- css-tree parsing ----
function balanced(css) {
  const s = css.replace(/\/\*[\s\S]*?(\*\/|$)/g, '').replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '');
  let brace = 0;
  let paren = 0;
  for (const ch of s) {
    if (ch === '{') brace++;
    else if (ch === '}') brace--;
    else if (ch === '(') paren++;
    else if (ch === ')') paren--;
    if (brace < 0 || paren < 0) return false;
  }
  return brace === 0 && paren === 0;
}

function parseCss(css, label) {
  const errors = [];
  const ast = csstree.parse(css, {
    parseCustomProperty: true,
    onParseError: (e) => errors.push(e.message),
  });
  if (errors.length) die(`CSS parse error in ${label}: ${errors[0]}`);
  if (!balanced(css)) die(`CSS parse error in ${label}: unbalanced braces or parentheses`);
  return ast;
}

const ROOT_SELECTORS = new Set([':root', 'html']);

/** Custom properties declared on :root/html outside any at-rule. Returns Map(name -> value AST). */
function collectBaseVars(ast) {
  const vars = new Map();
  csstree.walk(ast, {
    visit: 'Rule',
    enter(node) {
      if (this.atrule) return;
      const sel = csstree.generate(node.prelude).split(',').map((s) => s.trim());
      if (!sel.every((s) => ROOT_SELECTORS.has(s))) return;
      node.block.children.forEach((d) => {
        if (d.type === 'Declaration' && d.property.startsWith('--')) vars.set(d.property, d.value);
      });
    },
  });
  return vars;
}

const tokens = new Map(); // name -> value AST (later wins)
for (const { file, css } of cssSources) {
  const ast = parseCss(css, file);
  for (const [k, v] of collectBaseVars(ast)) tokens.set(k, v);
}

/** Resolve var() references. Returns string or null when unresolvable. */
function resolveValue(valueNode, depth = 0) {
  if (depth > MAX_DEPTH) return null;
  const clone = csstree.clone(valueNode);
  let failed = false;
  csstree.walk(clone, {
    visit: 'Function',
    enter(node, item, list) {
      if (node.name.toLowerCase() !== 'var' || !list) return;
      const kids = node.children.toArray();
      const ref = kids[0] && kids[0].type === 'Identifier' ? kids[0].name : null;
      let text = null;
      if (ref && tokens.has(ref)) text = resolveValue(tokens.get(ref), depth + 1);
      if (text === null) {
        const comma = kids.findIndex((k) => k.type === 'Operator' && k.value === ',');
        if (comma >= 0) {
          text = kids.slice(comma + 1).map((k) => csstree.generate(k)).join('').trim();
        }
      }
      if (text === null) {
        failed = true;
        return;
      }
      list.replace(item, list.createItem({ type: 'Raw', value: text }));
    },
  });
  if (failed) return null;
  return csstree.generate(clone).trim();
}

// ---- mapping ----
const docTokens = wiring.brand?.doc_tokens ?? {};
const report = { mapped: [], unchanged: [], unmapped: [], unresolved: [], excluded: [] };
const nextTokens = { ...docTokens };

for (const [name, valueNode] of tokens) {
  const value = resolveValue(valueNode);
  if (!(name in effectiveMap)) {
    if (value === null) report.unresolved.push({ name, reason: 'unresolvable var()' });
    else report.unmapped.push({ name, value });
    continue;
  }
  const to = effectiveMap[name];
  if (to === null) {
    report.excluded.push(name);
    continue;
  }
  if (value === null) {
    report.unresolved.push({ name, reason: 'unresolvable var()' });
    continue;
  }
  const before = Object.prototype.hasOwnProperty.call(docTokens, to) ? docTokens[to] : null;
  if (before === value) {
    report.unchanged.push({ from: name, to, value });
    continue;
  }
  report.mapped.push({ from: name, to, before, after: value });
  nextTokens[to] = value;
}

console.log(`Token mapping for ${slug}${dryRun ? ' (dry run)' : ''}`);
for (const m of report.mapped) {
  console.log(`  ${m.to}: ${m.before === null ? '(new)' : m.before} -> ${m.after}   (from ${m.from})`);
}
for (const u of report.unchanged) console.log(`  ${u.to}: unchanged`);
if (report.excluded.length) console.log(`  Excluded by tokenMap: ${report.excluded.join(', ')}`);
if (report.unresolved.length) {
  console.log('Unresolved tokens (not written):');
  for (const u of report.unresolved) console.log(`  ${u.name}: ${u.reason}`);
}
if (report.unmapped.length) {
  console.log('Unmapped tokens (not written, add to tokenMap or design-token-map.json):');
  for (const u of report.unmapped) console.log(`  ${u.name}: ${u.value}`);
}

// ---- Layout proposal (never writes Layout.astro) ----
function layoutRootVars(astro) {
  const vars = new Map();
  const re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = re.exec(astro))) {
    let ast;
    try {
      ast = csstree.parse(m[1], { parseCustomProperty: true });
    } catch {
      continue;
    }
    for (const [k, v] of collectBaseVars(ast)) vars.set(k, csstree.generate(v).trim());
  }
  return vars;
}

const norm = (s) => String(s).replace(/\s+/g, ' ').trim().toLowerCase();
const layoutPath = join(ROOT, 'sites', slug, 'src', 'layouts', 'Layout.astro');
let proposalPath = null;
let proposalText = null;
if (existsSync(layoutPath) && report.mapped.length + report.unchanged.length > 0) {
  const live = layoutRootVars(readFileSync(layoutPath, 'utf8'));
  const lines = [];
  for (const m of [...report.mapped, ...report.unchanged.map((u) => ({ to: u.to, after: u.value }))]) {
    if (live.has(m.to) && norm(live.get(m.to)) !== norm(m.after)) {
      lines.push(`-  ${m.to}: ${live.get(m.to)};`, `+  ${m.to}: ${m.after};`);
    }
  }
  if (lines.length) {
    proposalText = ['--- Layout.astro (current)', '+++ Layout.astro (proposed)', '@@ :root @@', ...lines, ''].join('\n');
    proposalPath = join(stageDir, 'layout-tokens.proposal.diff');
  }
}

if (!dryRun) {
  if (report.mapped.length) {
    wiring.brand = wiring.brand ?? {};
    wiring.brand.doc_tokens = nextTokens;
    writeFileSync(wiringPath, JSON.stringify(wiring, null, 2) + (wiringRaw.endsWith('\n') ? '\n' : ''));
  }
  mkdirSync(stageDir, { recursive: true });
  writeFileSync(join(stageDir, 'tokens-report.json'), JSON.stringify(report, null, 2) + '\n');
  if (proposalPath) writeFileSync(proposalPath, proposalText);
}

if (proposalPath) {
  console.log(`Layout.astro :root differs for mapped tokens. Proposal: ${proposalPath}`);
  console.log('Review it and apply by hand if wanted; Layout.astro is never edited by this script (D-07).');
}

#!/usr/bin/env node
/**
 * ingest-artifact.mjs — Parse a Claude Design HTML artifact and extract Astro components.
 *
 * Usage:
 *   node _scripts/ingest-artifact.mjs <slug> [options]
 *
 * Modes:
 *   --analyze              Parse and report only (no file writes). Outputs JSON to stdout.
 *   --mode full            Full-site ingest: extract all sections as Astro components,
 *                          write index.astro, copy assets.
 *   --mode section         Single section ingest (write component only, do not modify pages).
 *   --section <name>       Section name to extract (required with --mode section).
 *   --dry-run              Show what would happen without making any changes.
 *
 * Artifact location:
 *   _captures/<slug>/raw/artifact.html  — paste HTML here before running
 *
 * What it does (full mode):
 *   1. Checks astro.config.mjs for SITE_URL/SITE_BASE env var pattern (INGEST-02)
 *   2. Parses artifact HTML using hast-util-from-html
 *   3. Extracts each <section>/<nav>/<footer>/<header>/<main> as scoped .astro component
 *   4. Decodes base64 images to public/images/<slug>/
 *   5. Rewrites local src="/" and href="/" paths to {b}/ template literal pattern
 *   6. Writes sites/<slug>/src/pages/index.astro (full mode only)
 *   7. Surfaces Google Fonts CDN links as operator instructions
 *   8. Reports brand token candidates from artifact CSS (INGEST-07)
 *   9. Runs build verification
 */

import { execSync }                          from 'child_process';
import {
  existsSync, mkdirSync, cpSync, copyFileSync,
  readdirSync, readFileSync, writeFileSync,
} from 'fs';
import { join, basename, dirname }           from 'path';
import { fileURLToPath }                     from 'url';
import { fromHtml } from 'hast-util-from-html';
import { toHtml }   from 'hast-util-to-html';

// ── Resolve repo root ─────────────────────────────────────────────────────────
const ROOT = join(fileURLToPath(import.meta.url), '..', '..');

// ── Log helpers (defined early so they are available during validation) ────────
const log  = (...a) => console.log(...a);
const info = (...a) => console.log(' ', ...a);
const ok   = (...a) => console.log(' ✓', ...a);
const warn = (...a) => console.log(' ⚠', ...a);
const fail = (...a) => { console.error(' ✖', ...a); process.exit(1); };
// dry() is defined after DRY_RUN is parsed below

// ── CLI args ──────────────────────────────────────────────────────────────────
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

const DRY_RUN     = flag('--dry-run');
const analyzeOnly = flag('--analyze');
const modeArg     = option('--mode');
const sectionArg  = option('--section');
const slugArg     = args[0];

const dry = (...a) => DRY_RUN && console.log('  [dry]', ...a);

const USAGE = 'Usage: node _scripts/ingest-artifact.mjs <slug> [--analyze] [--mode full|section] [--section <name>] [--dry-run]';

if (!slugArg || !/^[a-z0-9-]+$/.test(slugArg)) {
  fail(USAGE);
}

const slug    = slugArg;
const siteDir = join(ROOT, 'sites', slug);
if (!existsSync(siteDir)) fail(`sites/${slug} not found — run /wm-new-site first`);

// ── Utility helpers ───────────────────────────────────────────────────────────
function run(cmd, cwd = ROOT) {
  if (DRY_RUN) { dry(`${cmd}  [${cwd.replace(ROOT, '.')}]`); return; }
  execSync(cmd, {
    stdio: 'inherit', cwd,
    env: { ...process.env, PATH: `${join(ROOT, 'node_modules', '.bin')}:${process.env.PATH}` },
  });
}

function readJSON(p) {
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; }
}

function writeJSON(p, obj) {
  if (DRY_RUN) { dry(`write ${p.replace(ROOT, '.')}`); return; }
  writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
}

// ── HELPER: extractCSSVars ────────────────────────────────────────────────────
// Returns a Map of '--name' → 'value' from a CSS string.
function extractCSSVars(cssText) {
  const vars = new Map();
  for (const [, name, value] of cssText.matchAll(/--([a-zA-Z0-9-]+)\s*:\s*([^;}\n]+)/g)) {
    vars.set(`--${name}`, value.trim());
  }
  return vars;
}

// ── HELPER: toPascalCase ──────────────────────────────────────────────────────
// Converts 'hero-content', 'hero', 'nav', 'footer' → 'HeroContent', 'Hero', 'Nav', 'Footer'.
function toPascalCase(str) {
  return str.split(/[-_\s]+/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
}

// ── HELPER: walkTree ──────────────────────────────────────────────────────────
// Recursively visits every node in a HAST tree, calling callback on each.
function walkTree(node, callback) {
  callback(node);
  if (node.children) {
    for (const child of node.children) {
      walkTree(child, callback);
    }
  }
}

// ── HELPER: extractSections ───────────────────────────────────────────────────
// Returns array of { name, tag, id, classes } for top-level body section elements.
function extractSections(htmlString) {
  const tree     = fromHtml(htmlString);
  const htmlNode = tree.children.find(n => n.tagName === 'html');
  const bodyNode = htmlNode?.children.find(n => n.tagName === 'body');
  const nodes    = bodyNode?.children.filter(
    n => n.type === 'element' && ['section', 'nav', 'footer', 'header', 'main'].includes(n.tagName)
  ) ?? [];
  return nodes.map(node => {
    const name = node.properties?.id
      || node.properties?.className?.[0]
      || node.tagName;
    return {
      name,
      tag:     node.tagName,
      id:      node.properties?.id   || null,
      classes: node.properties?.className || [],
    };
  });
}

// ── HELPER: extractStyleCSS ───────────────────────────────────────────────────
// Concatenates the text content of all <style> elements anywhere in the HTML tree.
function extractStyleCSS(htmlString) {
  const tree  = fromHtml(htmlString);
  const parts = [];
  walkTree(tree, node => {
    if (node.type === 'element' && node.tagName === 'style') {
      for (const child of (node.children || [])) {
        if (child.type === 'text') parts.push(child.value);
      }
    }
  });
  return parts.join('\n');
}

// ── HELPER: extractGoogleFontsLinks ──────────────────────────────────────────
// Returns an array of Google Fonts CDN href strings from <link rel="stylesheet"> tags.
function extractGoogleFontsLinks(htmlString) {
  const tree  = fromHtml(htmlString);
  const links = [];
  walkTree(tree, node => {
    if (
      node.type === 'element' &&
      node.tagName === 'link' &&
      Array.isArray(node.properties?.rel) &&
      node.properties.rel.includes('stylesheet') &&
      typeof node.properties?.href === 'string' &&
      node.properties.href.includes('fonts.googleapis.com')
    ) {
      links.push(node.properties.href);
    }
  });
  return links;
}

// ── HELPER: extractImages ─────────────────────────────────────────────────────
// Returns { images: string[], base64Images: number } from all <img> src attributes.
function extractImages(htmlString) {
  const tree     = fromHtml(htmlString);
  const images   = [];
  let base64Images = 0;
  walkTree(tree, node => {
    if (node.type === 'element' && node.tagName === 'img') {
      const src = node.properties?.src;
      if (typeof src === 'string') {
        if (src.startsWith('data:image')) {
          base64Images++;
        } else {
          images.push(src);
        }
      }
    }
  });
  return { images, base64Images };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYZE FLOW — exits 0 with JSON report; no file writes
// ═══════════════════════════════════════════════════════════════════════════════

if (analyzeOnly) {
  const artifactPath = join(ROOT, '_captures', slug, 'raw', 'artifact.html');
  if (!existsSync(artifactPath)) {
    fail(`No artifact found at _captures/${slug}/raw/artifact.html — paste HTML and re-run /wm-ingest`);
  }

  const htmlString  = readFileSync(artifactPath, 'utf-8');
  const sections    = extractSections(htmlString);
  const artifactCSS = extractStyleCSS(htmlString);
  const artifactVars = extractCSSVars(artifactCSS);

  const layoutPath    = join(siteDir, 'src', 'layouts', 'Layout.astro');
  const layoutContent = existsSync(layoutPath) ? readFileSync(layoutPath, 'utf-8') : '';
  const existingVars  = extractCSSVars(layoutContent);

  const collisions = [...artifactVars.entries()]
    .filter(([name, val]) => existingVars.has(name) && existingVars.get(name) !== val)
    .map(([name, val]) => ({ name, existing: existingVars.get(name), artifact: val }));

  const googleFontsLinks = extractGoogleFontsLinks(htmlString);
  const { images, base64Images } = extractImages(htmlString);

  process.stdout.write(JSON.stringify({
    sections,
    artifactVars:  Object.fromEntries(artifactVars),
    existingVars:  Object.fromEntries(existingVars),
    collisions,
    googleFontsLinks,
    images,
    base64Images,
  }, null, 2) + '\n');
  process.exit(0);
}

// ── MODE GUARD ────────────────────────────────────────────────────────────────
if (modeArg !== 'full' && modeArg !== 'section') {
  fail(USAGE);
}

// TODO: full-site write mode (Task 2)
process.exit(0);
